'use server';

import { createServerClient } from '@/lib/supabase/server';
import { signInSchema } from '../../schemas/auth.schemas';
import type { ActionResponse } from '@/lib/types/action.types';
import { z } from 'zod';

/**
 * User data returned on successful sign-in.
 */
export interface SignInData {
  user: {
    id: string;
    email: string;
    email_confirmed_at?: string;
  };
}

/**
 * Sign-in Server Action.
 * 
 * Authenticates a user with email and password.
 * 
 * @param input - User credentials (email, password)
 * @returns ActionResponse with user data or error message
 * 
 * @example
 * const result = await signInAction({ email: 'user@example.com', password: 'password123' });
 * if (result.success) {
 *   console.log('Logged in:', result.data.user.email);
 * }
 */
export async function signInAction(
  input: unknown
): Promise<ActionResponse<SignInData>> {
  try {
    // 1. Input Validation
    const validated = signInSchema.parse(input);

    // 2. Create Supabase client
    const supabase = await createServerClient();

    // 3. Attempt sign-in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    // 4. Handle authentication errors
    if (error) {
      // Map Supabase errors to user-friendly messages
      if (error.message === 'Invalid login credentials') {
        return { success: false, error: 'E-mail ou senha incorretos.' };
      }
      
      if (error.message === 'Email not confirmed') {
        return { success: false, error: 'Confirme seu e-mail antes de fazer login.' };
      }

      // Generic error for unexpected cases
      console.error('SignInAction error:', error);
      return { 
        success: false, 
        error: 'Erro ao fazer login. Tente novamente.' 
      };
    }

    // 5. Validate user data
    if (!data.user) {
      return { 
        success: false, 
        error: 'Erro ao fazer login. Tente novamente.' 
      };
    }

    // 6. Return success with user data
    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email!,
          email_confirmed_at: data.user.email_confirmed_at,
        },
      },
    };
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || 'Erro de validação.',
      };
    }

    // Handle unexpected errors
    console.error('SignInAction unexpected error:', error);
    return {
      success: false,
      error: 'Erro ao fazer login. Tente novamente.',
    };
  }
}
