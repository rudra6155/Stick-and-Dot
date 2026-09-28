import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorParam = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error')
  
  // if "next" is in param, use it as the redirect URL
  const next = requestUrl.searchParams.get('next') ?? '/portfolio'
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/portfolio'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const origin = requestUrl.origin

  const targetBase = (!isLocalEnv && forwardedHost) ? `https://${forwardedHost}` : origin

  if (errorParam) {
    console.error('[OAuth Callback] Provider returned error:', errorParam)
    return NextResponse.redirect(`${targetBase}/login?error=${encodeURIComponent(errorParam)}`)
  }

  if (code) {
    const redirectUrl = `${targetBase}${safeNext}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      'https://riszdsmtfijmwsylbmcf.supabase.co',
      'sb_publishable_vmS28KOUKoixto_OSU4SVw_IJmiTf4I',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return response
    }

    console.error('[OAuth Callback] exchangeCodeForSession failed:', error.message)
    return NextResponse.redirect(`${targetBase}/login?error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${targetBase}/login?error=Could not authenticate user - missing auth code`)
}
