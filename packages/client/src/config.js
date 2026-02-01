// Auto-detect environment
const isProd = import.meta.env.PROD;
// If you deploy server to Railway/Render, put that URL here.
// For now, we'll assume a placeholder that you can override with env vars.
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || (isProd ? 'https://YOUR_BACKEND_URL.railway.app' : 'http://localhost:3001');
export const API_BASE = `${SERVER_URL}/api/wiki`;
export const AGENTS_API = `${SERVER_URL}/api/agents/recent`;
export const LEADERBOARD_API = `${SERVER_URL}/api/wiki/leaderboard`;
export const CATEGORIES_API = `${SERVER_URL}/api/wiki/categories`;
export const SKILL_URL = `${SERVER_URL}/SKILL.md`;
