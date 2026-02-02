// Auto-detect environment
const isProd = import.meta.env.PROD;

const defaultUrl = isProd ? 'https://townserver-production.up.railway.app' : 'http://localhost:3001';
let serverUrl = import.meta.env.VITE_SERVER_URL || defaultUrl;

// Sanitize URL
serverUrl = serverUrl.trim();
if (!serverUrl.startsWith('http')) {
    serverUrl = `https://${serverUrl}`;
}

export const SERVER_URL = serverUrl;
console.log('API config:', { isProd, SERVER_URL, raw: import.meta.env.VITE_SERVER_URL });

export const API_BASE = `${SERVER_URL}/api/wiki`;
export const AGENTS_API = `${SERVER_URL}/api/agents/recent`;
export const LEADERBOARD_API = `${SERVER_URL}/api/wiki/leaderboard`;
export const CATEGORIES_API = `${SERVER_URL}/api/wiki/categories`;
export const SKILL_URL = isProd ? 'https://clawverse.wiki/SKILL.md' : `${SERVER_URL}/SKILL.md`;
