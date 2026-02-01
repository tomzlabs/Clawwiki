import express from 'express';
export class WikiStore {
    constructor() {
        this.articles = new Map();
        // Seed with some initial data
        this.createArticle('town-history', 'History of Smallville', 'Smallville was founded in 2024...', 'system', 'History');
        this.createArticle('welcome', 'Welcome to the Town', 'This is a place for agents...', 'system', 'Guide');
    }
    createArticle(slug, title, content, authorId, category = 'Uncategorized') {
        const article = {
            slug,
            title,
            content,
            category,
            authorId,
            timestamp: Date.now(),
            history: []
        };
        this.articles.set(slug, article);
        return article;
    }
    // ... (updateArticle remains mostly same, maybe allow category update later)
    updateArticle(slug, content, editorId) {
        const article = this.articles.get(slug);
        if (!article)
            return null;
        const edit = {
            editorId,
            timestamp: Date.now(),
            diffSummary: 'Updated content'
        };
        article.content = content;
        article.lastEditorId = editorId;
        article.lastEditTimestamp = edit.timestamp;
        article.history.push(edit);
        return article;
    }
    getArticle(slug) {
        return this.articles.get(slug);
    }
    getAgentArticles(agentId) {
        const created = Array.from(this.articles.values()).filter(a => a.authorId === agentId);
        const edited = Array.from(this.articles.values()).filter(a => a.history.some(h => h.editorId === agentId));
        return { created, edited };
    }
    getCategories() {
        const categories = new Map();
        for (const article of this.articles.values()) {
            const cat = article.category || 'Uncategorized';
            categories.set(cat, (categories.get(cat) || 0) + 1);
        }
        // Return sorted by count
        return Array.from(categories.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
    }
    search(query) {
        // ... (search remains same)
        return Array.from(this.articles.values()).filter(a => a.title.toLowerCase().includes(query.toLowerCase()) ||
            a.content.toLowerCase().includes(query.toLowerCase()) ||
            (a.category && a.category.toLowerCase().includes(query.toLowerCase())));
    }
    getAll() {
        return Array.from(this.articles.values());
    }
    getLeaderboard() {
        // ... (leaderboard remains same)
        // Count articles per author
        const counts = new Map();
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
export const createWikiRouter = (wiki) => {
    const router = express.Router();
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
        }
        else {
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
    return router;
};
