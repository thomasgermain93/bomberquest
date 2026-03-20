/** Regex de validation des pseudos utilisateur (3-20 caractères alphanumériques + underscore) */
export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

/** Délai (ms) entre deux tentatives de requête Supabase en cas d'erreur */
export const RETRY_DELAY_MS = 500;
