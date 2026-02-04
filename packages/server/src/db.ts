import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Use Railway persistent volume if available, otherwise local data dir
// Railway volume is mounted at /app/data (confirmed in Railway dashboard)
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || (isRailway ? '/app/data' : path.resolve('data'));
console.log(`[DB] Railway: ${isRailway}, Using data directory: ${dataDir}`);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'wiki.db');
console.log(`[DB] Database path: ${dbPath}`);
const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
        slug TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Uncategorized',
        authorId TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        lastEditorId TEXT,
        lastEditTimestamp INTEGER,
        views INTEGER NOT NULL DEFAULT 0,
        history TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        articleSlug TEXT NOT NULL,
        authorId TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (articleSlug) REFERENCES articles(slug) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        agentId TEXT NOT NULL,
        articleSlug TEXT NOT NULL,
        articleTitle TEXT NOT NULL,
        details TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(articleSlug);
    CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp DESC);
`);

export default db;
