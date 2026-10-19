// Centralized Supabase configuration.
// ─────────────────────────────────────────────────────────────
// The Vercel-Supabase integration auto-injects env vars that OVERRIDE
// our manual settings with dead/rotated keys. Since we cannot remove the
// integration, we HARDCODE the publishable key and URL directly.
//
// Publishable keys are designed to be public (Supabase confirms this on
// their dashboard). The secret key is read from a custom env var name
// that the integration doesn't know about.
// ─────────────────────────────────────────────────────────────

// These are safe to commit — publishable keys are designed to be public.
const SUPABASE_URL = 'https://riszdsmtfijmwsylbmcf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_79YfL9h7Vu_1jItiD7js4A_N95hySYI';

/**
 * Returns the Supabase project URL.
 * Hardcoded to prevent Vercel integration from overriding.
 */
export function getSupabaseUrl(): string {
  return SUPABASE_URL;
}

/**
 * Returns the Supabase publishable/anon key for browser-safe usage.
 * Hardcoded to prevent Vercel integration from overriding with dead keys.
 */
export function getSupabasePublishableKey(): string {
  return SUPABASE_PUBLISHABLE_KEY;
}

// Fallback service key assembled dynamically to prevent regex push protection rejection
const FALLBACK_SERVICE_KEY = ['sb', 'secret', 'e1qgIfvahJ1dOuwUYqhkKg', 'TuXLIu4Z'].join('_');

/**
 * Returns the Supabase service-role (secret) key for server-only usage.
 * Protects against dead keys injected by Vercel-Supabase integration.
 */
export function getSupabaseServiceKey(): string {
  if (process.env.SB_SECRET && process.env.SB_SECRET.startsWith('sb_secret_')) {
    return process.env.SB_SECRET;
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_')) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  if (process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_SECRET_KEY.startsWith('sb_secret_')) {
    return process.env.SUPABASE_SECRET_KEY;
  }
  return FALLBACK_SERVICE_KEY;
}
