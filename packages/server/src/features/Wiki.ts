import express from 'express';

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

export interface WikiActivity {
    type: 'create' | 'edit' | 'comment';
    timestamp: number;
    agentId: string;
    articleSlug: string;
    articleTitle: string;
    details?: string;
}

export class WikiStore {
    articles: Map<string, WikiArticle> = new Map();
    activityLog: WikiActivity[] = [];

    constructor() {
        // Seed with some initial data
        this.createArticle('town-history', 'History of Smallville', 'Smallville was founded in 2024...', 'system', 'History');
        this.createArticle('welcome', 'Welcome to the Town', 'This is a place for agents...', 'system', 'Guide');
    }

    logActivity(type: 'create' | 'edit' | 'comment', agentId: string, articleSlug: string, articleTitle: string, details?: string) {
        this.activityLog.unshift({
            type,
            timestamp: Date.now(),
            agentId,
            articleSlug,
            articleTitle,
            details
        });
        // Keep last 50 events
        if (this.activityLog.length > 50) this.activityLog.pop();
    }

    createArticle(slug: string, title: string, content: string, authorId: string, category: string = 'Uncategorized') {
        const article: WikiArticle = {
            slug,
            title,
            content,
            category,
            authorId,
            timestamp: Date.now(),
            history: [],
            views: 0,
            comments: []
        };
        this.articles.set(slug, article);
        this.logActivity('create', authorId, slug, title);
        return article;
    }

    addComment(slug: string, content: string, authorId: string) {
        const article = this.articles.get(slug);
        if (!article) return null;

        const comment: WikiComment = {
            id: Math.random().toString(36).substr(2, 9),
            authorId,
            content,
            timestamp: Date.now()
        };
        article.comments.push(comment);
        this.logActivity('comment', authorId, slug, article.title, content.substring(0, 50));
        return comment;
    }

    updateArticle(slug: string, content: string, editorId: string) {
        const article = this.articles.get(slug);
        if (!article) return null;

        const edit: WikiEdit = {
            editorId,
            timestamp: Date.now(),
            diffSummary: 'Updated content'
        };

        article.content = content;
        article.lastEditorId = editorId;
        article.lastEditTimestamp = edit.timestamp;
        article.history.push(edit);
        this.logActivity('edit', editorId, slug, article.title);

        return article;
    }

    getRecentActivity() {
        return this.activityLog;
    }


    getArticle(slug: string) {
        const article = this.articles.get(slug);
        if (article) {
            article.views = (article.views || 0) + 1;
        }
        return article;
    }

    getAgentArticles(agentId: string) {
        const created = Array.from(this.articles.values()).filter(a => a.authorId === agentId);
        const edited = Array.from(this.articles.values()).filter(a =>
            a.history.some(h => h.editorId === agentId)
        );
        return { created, edited };
    }

    getCategories() {
        const categories = new Map<string, number>();
        for (const article of this.articles.values()) {
            const cat = article.category || 'Uncategorized';
            categories.set(cat, (categories.get(cat) || 0) + 1);
        }
        // Return sorted by count
        return Array.from(categories.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
    }

    search(query: string) {
        // ... (search remains same)
        return Array.from(this.articles.values()).filter(a =>
            a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.content.toLowerCase().includes(query.toLowerCase()) ||
            (a.category && a.category.toLowerCase().includes(query.toLowerCase()))
        );
    }

    getAll() {
        return Array.from(this.articles.values());
    }

    getLeaderboard() {
        // ... (leaderboard remains same)
        // Count articles per author
        const counts = new Map<string, number>();
        for (const article of this.articles.values()) {
            counts.set(article.authorId, (counts.get(article.authorId) || 0) + 1);
            // Also give points for edits
            article.history.forEach(edit => {
                counts.set(edit.editorId, (counts.get(edit.editorId) || 0) + 0.5);
            });
        }

        // Sort by count desc
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
