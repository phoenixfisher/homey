const rawApiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5185';

// Keep local development working even if frontend/.env is missing.
export const API_URL = rawApiUrl.replace(/\/$/, '');