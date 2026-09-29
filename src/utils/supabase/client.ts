import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseUrl, getSupabasePublishableKey } from '@/lib/supabase-config'

export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabasePublishableKey()
  )
}
