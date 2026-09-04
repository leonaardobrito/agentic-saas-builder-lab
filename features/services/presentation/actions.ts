/**
 * Service feature — Presentation layer (Server Actions).
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
import type { Service } from '../domain/service';
import { createServiceSchema, updateServiceSchema } from '../domain/service';
import { SupabaseServiceRepository } from '../infrastructure/supabase-service-repository';
import {
  listServices as listServicesUseCase,
  createService as createServiceUseCase,
  updateService as updateServiceUseCase,
  deleteService as deleteServiceUseCase,
} from '../application/ports';

export type { Service };

/** Lists all active services for the current tenant. Any member may view. */
export async function listServicesAction(): Promise<ActionResponse<Service[]>> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    const repository = new SupabaseServiceRepository(supabase);
    const data = await listServicesUseCase(repository, ctx.tenantId);

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleServiceError(error) };
  }
}

/** Creates a new service. Requires a management role. */
export async function createServiceAction(
  input: unknown
): Promise<ActionResponse<Service>> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    if (!hasRole(ctx.role, MANAGEMENT_ROLES)) {
      return {
        success: false,
        error: 'Você não tem permissão para cadastrar serviços.',
      };
    }

    const validated = createServiceSchema.parse(input);
    const repository = new SupabaseServiceRepository(supabase);
    const data = await createServiceUseCase(repository, validated, ctx.tenantId);

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleServiceError(error) };
  }
}

/** Updates an existing service. Requires a management role. */
export async function updateServiceAction(
  input: unknown
): Promise<ActionResponse<Service>> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    if (!hasRole(ctx.role, MANAGEMENT_ROLES)) {
      return {
        success: false,
        error: 'Você não tem permissão para editar serviços.',
      };
    }

    const validated = updateServiceSchema.parse(input);
    const repository = new SupabaseServiceRepository(supabase);
    const data = await updateServiceUseCase(
      repository,
      validated,
      ctx.tenantId
    );

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleServiceError(error) };
  }
}

/** Soft-deletes a service. Requires an archive-level role. */
export async function deleteServiceAction(
  id: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerClient();
    const ctx = await requireTenantContext(supabase);

    if (!hasRole(ctx.role, DELETE_ROLES)) {
      return {
        success: false,
        error: 'Você não tem permissão para remover serviços.',
      };
    }

    const repository = new SupabaseServiceRepository(supabase);
    await deleteServiceUseCase(repository, id, ctx.tenantId);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return { success: false, error: 'Você precisa estar autenticado.' };
    }
    return { success: false, error: handleServiceError(error) };
  }
}

// --- Internal helpers ------------------------------------------------------

function handleServiceError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? 'Dados inválidos.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
