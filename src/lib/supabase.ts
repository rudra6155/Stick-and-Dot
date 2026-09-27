// Throws a clear, descriptive error instead of letting a missing env var
// surface as an opaque "Cannot read properties of undefined" TypeError.
export function requireEnv(name: string): string {
  let value = process.env[name];
  if (!value && name === 'SUPABASE_SERVICE_ROLE_KEY') {
    value = process.env.SUPABASE_SECRET_KEY;
  }
  if (!value && name === 'NEXT_PUBLIC_SUPABASE_URL') {
    value = process.env.SUPABASE_URL;
  }
  if (!value && (name === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' || name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    value = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Set it in your environment (e.g. .env.local) before starting the app.`
    );
  }
  return value;
}

// ⚠️  DO NOT export a module-level Supabase client here.
//
// A singleton created with `createClient()` from `@supabase/supabase-js`
// uses **in-memory** token storage. On the server (Node.js / Vercel), that
// single instance is shared across every incoming request. If any code path
// calls `.auth.getUser()` or `.auth.getSession()` on it, the returned
// access-token is cached inside the instance — and the *next* request that
// hits the same process sees the *previous* user's session. This is a
// critical session-leak / privacy bug.
//
// Instead:
//   • Client components  → `createBrowserClient` from `@supabase/ssr`
//                           (see `@/utils/supabase/client`)
//   • Server components  → `createServerClient` from `@/utils/supabase/server`
//                           (cookie-aware, per-request)
//   • API routes / crons → a service-role admin client (bypasses RLS,
//                           has no user session at all)
