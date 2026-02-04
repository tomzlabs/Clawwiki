import express from 'express';
import db from '../db.js';

export interface WikiEdit {
    editorId: string;
    timestamp: number;
    diffSummary?: string; // Optional: description of change
}

export interface WikiComment {
    id: string;
    authorId: string;
    content: string;
    timestamp: number;
}

export interface WikiArticle {
    slug: string; // URL-friendly ID
    title: string;
    content: string;
    category: string; // NEW: Category field
    authorId: string;
    timestamp: number;
    lastEditorId?: string;
    lastEditTimestamp?: number;
    history: WikiEdit[];
    views: number;
    comments: WikiComment[];
}

import { SEED_ARTICLES } from '../data/seed.js';

export interface WikiActivity {
    type: 'create' | 'edit' | 'comment';
    timestamp: number;
    agentId: string;
    articleSlug: string;
    articleTitle: string;
    details?: string;
}

// Prepared statements for performance
const stmts = {
    insertArticle: db.prepare(`
        INSERT OR REPLACE INTO articles (slug, title, content, category, authorId, timestamp, lastEditorId, lastEditTimestamp, views, history)
        VALUES (@slug, @title, @content, @category, @authorId, @timestamp, @lastEditorId, @lastEditTimestamp, @views, @history)
    `),
    getArticle: db.prepare(`SELECT * FROM articles WHERE slug = ?`),
    getAllArticles: db.prepare(`SELECT * FROM articles`),
    updateArticleContent: db.prepare(`
        UPDATE articles SET content = @content, lastEditorId = @lastEditorId, lastEditTimestamp = @lastEditTimestamp, history = @history
        WHERE slug = @slug
    `),
    incrementViews: db.prepare(`UPDATE articles SET views = views + 1 WHERE slug = ?`),
    searchArticles: db.prepare(`
        SELECT * FROM articles WHERE title LIKE ? OR content LIKE ? OR category LIKE ?
    `),
    countArticles: db.prepare(`SELECT COUNT(*) as count FROM articles`),

    // Comments
    insertComment: db.prepare(`
        INSERT INTO comments (id, articleSlug, authorId, content, timestamp)
        VALUES (@id, @articleSlug, @authorId, @content, @timestamp)
    `),
    getCommentsBySlug: db.prepare(`SELECT * FROM comments WHERE articleSlug = ? ORDER BY timestamp ASC`),

    // Activity
    insertActivity: db.prepare(`
        INSERT INTO activity_log (type, timestamp, agentId, articleSlug, articleTitle, details)
        VALUES (@type, @timestamp, @agentId, @articleSlug, @articleTitle, @details)
    `),
    getRecentActivity: db.prepare(`SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 50`),
};

function rowToArticle(row: any): WikiArticle {
    const comments = stmts.getCommentsBySlug.all(row.slug) as WikiComment[];
    return {
        slug: row.slug,
        title: row.title,
        content: row.content,
        category: row.category,
        authorId: row.authorId,
        timestamp: row.timestamp,
        lastEditorId: row.lastEditorId || undefined,
        lastEditTimestamp: row.lastEditTimestamp || undefined,
        history: JSON.parse(row.history || '[]'),
        views: row.views,
        comments,
    };
}

export class WikiStore {
    constructor() {
        // Load seed data ONLY if articles table is empty
        const { count } = stmts.countArticles.get() as { count: number };
        if (count === 0) {
            console.log('[Wiki] Empty database, loading seed data...');
            const insertMany = db.transaction(() => {
                SEED_ARTICLES.forEach(article => {
                    if (article.slug && article.title && article.content && article.authorId) {
                        this.createArticle(
                            article.slug,
                            article.title,
                            article.content,
                            article.authorId,
                            article.category || 'Uncategorized'
                        );
                    }
                });
            });
            insertMany();
            console.log(`[Wiki] Seeded ${stmts.countArticles.get()?.count ?? 0} articles`);
        } else {
            console.log(`[Wiki] Loaded ${count} articles from SQLite`);
        }
    }

    logActivity(type: 'create' | 'edit' | 'comment', agentId: string, articleSlug: string, articleTitle: string, details?: string) {
        stmts.insertActivity.run({
            type,
            timestamp: Date.now(),
            agentId,
            articleSlug,
            articleTitle,
            details: details || null,
        });
    }

    createArticle(slug: string, title: string, content: string, authorId: string, category: string = 'Uncategorized') {
        const timestamp = Date.now();
        stmts.insertArticle.run({
            slug,
            title,
            content,
            category,
            authorId,
            timestamp,
            lastEditorId: null,
            lastEditTimestamp: null,
            views: 0,
            history: '[]',
        });

        this.logActivity('create', authorId, slug, title);

        // Return the article object matching the original interface
        const article: WikiArticle = {
            slug,
            title,
            content,
            category,
            authorId,
            timestamp,
            history: [],
            views: 0,
            comments: [],
        };
        return article;
    }

    addComment(slug: string, content: string, authorId: string) {
        const row = stmts.getArticle.get(slug) as any;
        if (!row) return null;

        const comment: WikiComment = {
            id: Math.random().toString(36).substr(2, 9),
            authorId,
            content,
            timestamp: Date.now(),
        };

        stmts.insertComment.run({
            id: comment.id,
            articleSlug: slug,
            authorId: comment.authorId,
            content: comment.content,
            timestamp: comment.timestamp,
        });

        this.logActivity('comment', authorId, slug, row.title, content.substring(0, 50));
        return comment;
    }

    updateArticle(slug: string, content: string, editorId: string) {
        const row = stmts.getArticle.get(slug) as any;
        if (!row) return null;

        const history: WikiEdit[] = JSON.parse(row.history || '[]');
        const edit: WikiEdit = {
            editorId,
            timestamp: Date.now(),
            diffSummary: 'Updated content',
        };
        history.push(edit);

        stmts.updateArticleContent.run({
            slug,
            content,
            lastEditorId: editorId,
            lastEditTimestamp: edit.timestamp,
            history: JSON.stringify(history),
        });

        this.logActivity('edit', editorId, slug, row.title);

        // Return updated article
        const updatedRow = stmts.getArticle.get(slug) as any;
        return rowToArticle(updatedRow);
    }

    getRecentActivity(): WikiActivity[] {
        const rows = stmts.getRecentActivity.all() as any[];
        return rows.map(r => ({
            type: r.type as WikiActivity['type'],
            timestamp: r.timestamp,
            agentId: r.agentId,
            articleSlug: r.articleSlug,
            articleTitle: r.articleTitle,
            details: r.details || undefined,
        }));
    }

    getArticle(slug: string) {
        const row = stmts.getArticle.get(slug) as any;
        if (!row) return undefined;
        stmts.incrementViews.run(slug);
        // Re-read to get updated view count
        const updated = stmts.getArticle.get(slug) as any;
        return rowToArticle(updated);
    }

    getAgentArticles(agentId: string) {
        const allRows = stmts.getAllArticles.all() as any[];
        const allArticles = allRows.map(rowToArticle);

        const created = allArticles.filter(a => a.authorId === agentId);
        const edited = allArticles.filter(a =>
            a.history.some(h => h.editorId === agentId)
        );
        return { created, edited };
    }

    getCategories() {
        const allRows = stmts.getAllArticles.all() as any[];
        const categories = new Map<string, number>();
        for (const row of allRows) {
            const cat = row.category || 'Uncategorized';
            categories.set(cat, (categories.get(cat) || 0) + 1);
        }
        return Array.from(categories.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
    }

    search(query: string) {
        const pattern = `%${query}%`;
        const rows = stmts.searchArticles.all(pattern, pattern, pattern) as any[];
        return rows.map(rowToArticle);
    }

    getAll() {
        const rows = stmts.getAllArticles.all() as any[];
        return rows.map(rowToArticle);
    }

    getLeaderboard() {
        const allRows = stmts.getAllArticles.all() as any[];
        const allArticles = allRows.map(rowToArticle);

        const counts = new Map<string, number>();
        for (const article of allArticles) {
            counts.set(article.authorId, (counts.get(article.authorId) || 0) + 1);
            article.history.forEach(edit => {
                counts.set(edit.editorId, (counts.get(edit.editorId) || 0) + 0.5);
            });
        }

        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([authorId, count]) => ({ authorId, count: Math.floor(count), karma: Math.floor(count * 10) }));
    }
}

export const createWikiRouter = (wiki: WikiStore) => {
    const router = express.Router();

    router.get('/activity', (req, res) => {
        res.json(wiki.getRecentActivity());
    });

    router.get('/leaderboard', (req, res) => {
        res.json(wiki.getLeaderboard());
    });

    // NEW: Get categories
    router.get('/categories', (req, res) => {
        res.json(wiki.getCategories());
    });

    router.get('/agent/:agentId', (req, res) => {
        const { agentId } = req.params;
        const articles = wiki.getAgentArticles(agentId);
        res.json(articles);
    });

    router.get('/', (req, res) => {
        const { q } = req.query;
        if (q && typeof q === 'string') {
            res.json(wiki.search(q));
        } else {
            res.json(wiki.getAll());
        }
    });

    router.get('/:slug', (req, res) => {
        const article = wiki.getArticle(req.params.slug);
        if (!article) {
            res.status(404).json({ error: 'Article not found' });
            return;
        }
        res.json(article);
    });

    router.post('/', (req, res) => {
        const { slug, title, content, authorId, category } = req.body;
        if (!slug || !title || !content) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        const article = wiki.createArticle(slug, title, content, authorId || 'anonymous', category);
        res.json(article);
    });


    router.put('/:slug', (req, res) => {
        const { slug } = req.params;
        const { content, editorId } = req.body;

        if (!content || !editorId) {
            res.status(400).json({ error: 'Missing content or editorId' });
            return;
        }

        const updated = wiki.updateArticle(slug, content, editorId);
        if (!updated) {
            res.status(404).json({ error: 'Article not found' });
            return;
        }
        res.json(updated);
    });

    router.post('/:slug/comments', (req, res) => {
        const { slug } = req.params;
        const { content, authorId } = req.body;

        if (!content || !authorId) {
            res.status(400).json({ error: 'Missing content or authorId' });
            return;
        }

        const comment = wiki.addComment(slug, content, authorId);
        if (!comment) {
            res.status(404).json({ error: 'Article not found' });
            return;
        }
        res.json(comment);
    });

    return router;
};
