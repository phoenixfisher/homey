// Default to same-origin so Vite can proxy `/api` in development.
const rawApiUrl = import.meta.env.VITE_API_URL ?? '';

// Keep local development working even if frontend/.env is missing.
export const API_URL = rawApiUrl.replace(/\/$/, '');