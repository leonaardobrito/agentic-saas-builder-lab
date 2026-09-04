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
 * Creates a new user via Supabase Auth, then atomically creates the
 * tenant + owner membership via a SECURITY DEFINER RPC function.
 *
 * The RPC function (`create_tenant_with_owner`) runs with elevated privileges
 * to bypass RLS during bootstrap, but validates that the user_id matches the
 * authenticated session (auth.uid()).
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

    // 2. Create Supabase client (uses anon key + session cookies)
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

    // 5. Create tenant + owner membership atomically via RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'create_tenant_with_owner',
      {
        p_tenant_name: validated.tenantName,
        p_user_id: authData.user.id,
      }
    );

    if (rpcError) {
      console.error('SignUpAction RPC error:', rpcError);

      // Specific error for duplicate tenant name
      if (rpcError.message?.includes('Tenant name already exists')) {
        return {
          success: false,
          error: 'Este nome de salão já está em uso.',
        };
      }

      // Any other error: the user was created in Auth but the RPC failed.
      // The RPC does a full rollback (tenant + membership), but the auth user
      // may remain orphaned. This is logged for monitoring and will be handled
      // by a cleanup job (out of scope for this PR).
      console.error(
        'SignUpAction: orphan user may have been created:',
        authData.user.id
      );
      return {
        success: false,
        error: 'Erro ao criar sua conta. Tente novamente.',
      };
    }

    if (!rpcData || rpcData.length === 0) {
      return {
        success: false,
        error: 'Erro ao criar sua conta. Tente novamente.',
      };
    }

    const tenant = rpcData[0];

    // 6. Return success
    return {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
        },
        tenant: {
          id: tenant.tenant_id,
          name: tenant.tenant_name,
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
    console.error('SignUpAction unexpected error:', error);
    return {
      success: false,
      error: 'Erro ao criar sua conta. Tente novamente.',
    };
  }
}
