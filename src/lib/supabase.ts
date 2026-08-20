import { createClient } from '@supabase/supabase-js';

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

export const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
);
