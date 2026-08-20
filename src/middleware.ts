import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch (error) {
    // If Supabase is unreachable (or env vars are misconfigured), don't take
    // the whole site down with a 500 — fall back to passing the request
    // through unauthenticated. Auth-gated pages will still redirect via
    // their own server-side checks if a session is required.
    console.error('middleware: updateSession failed, passing request through:', error)
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    // Only the routes that updateSession actually gates (see the
    // pathname checks in src/utils/supabase/middleware.ts) — running the
    // Supabase session refresh on every other route (static assets, public
    // marketing pages, API routes, etc.) added unnecessary latency.
    '/explore/:path*',
    '/portfolio/:path*',
  ],
}
