'use server';

import { createServerClient } from '@/lib/supabase/server';
import { signUpSchema } from '../../schemas/auth.schemas';
import type { ActionResponse } from '@/lib/types/action.types';
import { z } from 'zod';

/**
 * User data returned on successful sign-up.
 */
export interface SignUpData {
  user: {
    id: string;
    email: string;
  };
  tenant: {
    id: string;
    name: string;
  };
}

/**
 * Sign-up Server Action.
 * 
 * Creates a new user, tenant, and membership (owner role).
 * 
 * @param input - User registration data (email, password, fullName, tenantName, cpf)
 * @returns ActionResponse with user and tenant data or error message
 * 
 * @example
 * const result = await signUpAction({
 *   email: 'user@example.com',
 *   password: 'password123',
 *   fullName: 'Maria Silva',
 *   tenantName: 'Salão da Maria',
 * });
 */
export async function signUpAction(
  input: unknown
): Promise<ActionResponse<SignUpData>> {
  try {
    // 1. Input Validation
    const validated = signUpSchema.parse(input);

    // 2. Create Supabase client
    const supabase = await createServerClient();

    // 3. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          full_name: validated.fullName,
          cpf: validated.cpf,
        },
      },
    });

    // 4. Handle authentication errors
    if (authError) {
      if (authError.message.includes('already registered')) {
        return { success: false, error: 'Este e-mail já está cadastrado.' };
      }

      console.error('SignUpAction auth error:', authError);
      return {
        success: false,
        error: 'Erro ao criar sua conta. Tente novamente.',
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Erro ao criar sua conta. Tente novamente.',
      };
    }

    // 5. Create tenant
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: validated.tenantName,
      })
      .select('id, name')
      .single();

    if (tenantError) {
      console.error('SignUpAction tenant error:', tenantError);
      
      // Clean up: delete the user if tenant creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);

      if (tenantError.code === '23505') { // Unique constraint violation
        return {
          success: false,
          error: 'Este nome de salão já está em uso.',
        };
      }

      return {
        success: false,
        error: 'Erro ao criar sua conta. Tente novamente.',
      };
    }

    // 6. Create membership (owner role)
    const { error: membershipError } = await supabase
      .from('memberships')
      .insert({
        user_id: authData.user.id,
        tenant_id: tenantData.id,
        role: 'owner',
        is_active: true,
      });

    if (membershipError) {
      console.error('SignUpAction membership error:', membershipError);

      // Clean up: delete tenant and user
      await supabase.from('tenants').delete().eq('id', tenantData.id);
      await supabase.auth.admin.deleteUser(authData.user.id);

      return {
        success: false,
        error: 'Erro ao criar sua conta. Tente novamente.',
      };
    }

    // 7. Return success
    return {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
        },
        tenant: {
          id: tenantData.id,
          name: tenantData.name,
        },
      },
    };
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    // Handle unexpected errors
    console.error('SignUpAction unexpected error:', error);
    return {
      success: false,
      error: 'Erro ao criar sua conta. Tente novamente.',
    };
  }
}
