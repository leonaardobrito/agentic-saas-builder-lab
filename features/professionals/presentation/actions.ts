/**
 * Professional feature — Presentation layer.
 *
 * Server Actions implementing authentication, RBAC, and input validation
 * before delegating to use cases.
 *
 * Security layers (AGENTS.md §3, §5):
 *   1. Authentication — `supabase.auth.getUser()`
 *   2. Authorization — tenant derived from membership lookup
 *   3. RBAC — role check before mutation
 *   4. Input validation — Zod
 * Plus DB-level RLS (defense in depth).
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
import type { Professional } from '../domain/professional';
import {
  createProfessionalSchema,
  updateProfessionalSchema,
} from '../domain/professional';
import { SupabaseProfessionalRepository } from '../infrastructure/supabase-professional-repository';
import {
  listProfessionals as listProfessionalsUseCase,
  createProfessional as createProfessionalUseCase,
  updateProfessional as updateProfessionalUseCase,
  deleteProfessional as deleteProfessionalUseCase,
} from '../application/ports';

/** Data returned by professional server actions. */
export type { Professional };

/**
 * Lists all active professionals for the current tenant.
 * Any authenticated tenant member may list.
 */
export async function listProfessionalsAction(): Promise<
  ActionResponse<Professional[]>
> {
    try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    const repository = new SupabaseProfessionalRepository(supabase);
    const data = await listProfessionalsUseCase(repository, ctx.tenantId);

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return {
      success: false,
      error: handleError(error),
    };
  }
}

/**
 * Creates a new professional within the current tenant.
 * Requires an active membership with a management role.
 */
export async function createProfessionalAction(
  input: unknown
): Promise<ActionResponse<Professional>> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    if (!hasRole(ctx.role, MANAGEMENT_ROLES)) {
      return { success: false, error: 'Você não tem permissão para cadastrar profissionais.' };
    }

    const validated = createProfessionalSchema.parse(input);
    const repository = new SupabaseProfessionalRepository(supabase);
    const data = await createProfessionalUseCase(repository, validated, ctx.tenantId);

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleError(error) };
  }
}

/**
 * Updates an existing professional within the current tenant.
 * Requires a management role.
 */
export async function updateProfessionalAction(
  input: unknown
): Promise<ActionResponse<Professional>> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    if (!hasRole(ctx.role, MANAGEMENT_ROLES)) {
      return { success: false, error: 'Você não tem permissão para editar profissionais.' };
    }

    const validated = updateProfessionalSchema.parse(input);
    const repository = new SupabaseProfessionalRepository(supabase);
    const data = await updateProfessionalUseCase(
      repository,
      validated,
      ctx.tenantId
    );

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleError(error) };
  }
}

/**
 * Soft-deletes a professional (sets `deleted_at`).
 * Requires an archive-level role (owner or admin).
 */
export async function deleteProfessionalAction(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    if (!hasRole(ctx.role, DELETE_ROLES)) {
      return { success: false, error: 'Você não tem permissão para remover profissionais.' };
    }

    const repository = new SupabaseProfessionalRepository(supabase);
    await deleteProfessionalUseCase(repository, id, ctx.tenantId);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleError(error) };
  }
}

// --- Internal helpers ------------------------------------------------------

/** Maps an error object to a user-friendly Portuguese message. */
function handleError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? 'Dados inválidos.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
