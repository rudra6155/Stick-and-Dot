// Throws a clear, descriptive error instead of letting a missing env var
// surface as an opaque "Cannot read properties of undefined" TypeError.
export function requireEnv(name: string): string {
  const value = process.env[name];
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
