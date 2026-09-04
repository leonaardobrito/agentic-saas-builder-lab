import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for Client Components.
 * This client automatically manages session cookies in the browser.
 * 
 * @returns Supabase browser client
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
