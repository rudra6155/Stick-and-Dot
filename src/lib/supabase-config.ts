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

/**
 * Returns the Supabase service-role (secret) key for server-only usage.
 * Uses custom env var name SB_SECRET that the Vercel integration doesn't override.
 * Falls back to standard names, then to publishable key.
 */
export function getSupabaseServiceKey(): string {
  return (
    process.env.SB_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    SUPABASE_PUBLISHABLE_KEY
  );
}
