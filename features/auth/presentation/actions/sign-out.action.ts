'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Sign-out Server Action.
 * 
 * Signs out the current user and redirects to the login page.
 * This action clears the session cookies and invalidates the session.
 * 
 * @throws Redirect - Always redirects to /login after signing out
 * 
 * @example
 * // In a form or button handler:
 * <form action={signOutAction}>
 *   <button type="submit">Sign Out</button>
 * </form>
 */
export async function signOutAction(): Promise<never> {
  try {
    // 1. Create Supabase client
    const supabase = await createServerClient();

    // 2. Sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('SignOutAction error:', error);
      // Even if there's an error, redirect to login
      // The user's local session will be cleared
    }
  } catch (error) {
    // Log unexpected errors but still redirect
    console.error('SignOutAction unexpected error:', error);
  }

  // 3. Redirect to login page
  // This clears client-side session and redirects
  redirect('/login');
}
