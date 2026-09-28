import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = 'https://riszdsmtfijmwsylbmcf.supabase.co';
  const key = 'sb_publishable_vmS28KOUKoixto_OSU4SVw_IJmiTf4I';
  return createBrowserClient(
    url!,
    key!
  )
}
