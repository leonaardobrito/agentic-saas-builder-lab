/**
 * Customer feature — Presentation layer (Server Actions).
 *
 * Security: authentication → tenant context (session-derived) → RBAC →
 * Zod validation → use case delegation.
 */
'use server';

import { createServerClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/lib/types/action.types';
import { z } from 'zod';
import {
  requireTenantContext,
  hasRole,
  MANAGEMENT_ROLES,
  DELETE_ROLES,
} from '@/lib/auth/context';
import type { Customer } from '../domain/customer';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '../domain/customer';
import { SupabaseCustomerRepository } from '../infrastructure/supabase-customer-repository';
import {
  createCustomer as createCustomerUseCase,
  listCustomers as listCustomersUseCase,
  updateCustomer as updateCustomerUseCase,
  deleteCustomer as deleteCustomerUseCase,
  searchCustomers as searchCustomersUseCase,
} from '../application/ports';

export type { Customer };

/** Lists all customers for the current tenant. Any member may view. */
export async function listCustomersAction(): Promise<
  ActionResponse<Customer[]>
> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    const repository = new SupabaseCustomerRepository(supabase);
    const data = await listCustomersUseCase(repository, ctx.tenantId);

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleCustomerError(error) };
  }
}

/** Creates a new customer. Any authenticated member may create. */
export async function createCustomerAction(
  input: unknown
): Promise<ActionResponse<Customer>> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    const validated = createCustomerSchema.parse(input);
    const repository = new SupabaseCustomerRepository(supabase);
    const data = await createCustomerUseCase(
      repository,
      validated,
      ctx.tenantId
    );

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleCustomerError(error) };
  }
}

/** Updates a customer. Requires a management role. */
export async function updateCustomerAction(
  input: unknown
): Promise<ActionResponse<Customer>> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    if (!hasRole(ctx.role, MANAGEMENT_ROLES)) {
      return {
        success: false,
        error: 'Você não tem permissão para editar clientes.',
      };
    }

    const validated = updateCustomerSchema.parse(input);
    const repository = new SupabaseCustomerRepository(supabase);
    const data = await updateCustomerUseCase(repository, validated, ctx.tenantId);

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleCustomerError(error) };
  }
}

/** Soft-deletes a customer. Requires an archive-level role. */
export async function deleteCustomerAction(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    if (!hasRole(ctx.role, DELETE_ROLES)) {
      return {
        success: false,
        error: 'Você não tem permissão para remover clientes.',
      };
    }

    const repository = new SupabaseCustomerRepository(supabase);
    await deleteCustomerUseCase(repository, id, ctx.tenantId);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleCustomerError(error) };
  }
}

/** Searches customers by name, CPF, or email. */
export async function searchCustomersAction(
  term: string
): Promise<ActionResponse<Customer[]>> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    const repository = new SupabaseCustomerRepository(supabase);
    const data = await searchCustomersUseCase(repository, term, ctx.tenantId);

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleCustomerError(error) };
  }
}

// --- Internal helpers ------------------------------------------------------

function handleCustomerError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? 'Dados inválidos.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
