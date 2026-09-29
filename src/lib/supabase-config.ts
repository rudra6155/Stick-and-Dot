// Centralized Supabase configuration.
// ─────────────────────────────────────────────────────────────
// The Vercel-Supabase integration auto-injects env vars with names like
// NEXT_PUBLIC_SUPABASE_ANON_KEY which can override our manual settings.
// To defeat this, we use a priority chain that checks our CUSTOM env var
// names first, then falls back to hardcoded known-good values.
// ─────────────────────────────────────────────────────────────

// These are safe to commit — publishable keys are designed to be public.
const HARDCODED_URL = 'https://riszdsmtfijmwsylbmcf.supabase.co';
const HARDCODED_PUBLISHABLE_KEY = 'sb_publishable_79YfL9h7Vu_1jItiD7js4A_N95hySYI';

/**
 * Returns the Supabase project URL.
 * Priority: NEXT_PUBLIC_SB_URL (custom) > NEXT_PUBLIC_SUPABASE_URL > hardcoded
 */
export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SB_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    HARDCODED_URL
  );
}

/**
 * Returns the Supabase publishable/anon key for browser-safe usage.
 * Priority: NEXT_PUBLIC_SB_KEY (custom, integration-proof) >
 *           NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY > hardcoded
 *
 * ⚠ We intentionally do NOT fall back to NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   because the Vercel-Supabase integration injects a dead/rotated key
 *   under that name.
 */
export function getSupabasePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SB_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    HARDCODED_PUBLISHABLE_KEY
  );
}

/**
 * Returns the Supabase service-role (secret) key for server-only usage.
 * Falls back to publishable key if the secret is not configured.
 */
export function getSupabaseServiceKey(): string {
  return (
    process.env.SB_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    getSupabasePublishableKey()
  );
}
