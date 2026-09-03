/**
 * Professional feature — Infrastructure layer.
 *
 * Supabase implementation of the ProfessionalRepository port.
 * The Supabase client carries the authenticated user's session, so RLS
 * policies enforce tenant isolation at the database level.
 *
 * All queries explicitly include `tenant_id` as defense-in-depth (BR-SEC-003).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Professional,
  CreateProfessionalInput,
  UpdateProfessionalInput,
  ProfessionalRow,
} from '../domain/professional';
import type { ProfessionalRepository } from '../application/ports';
import { professionalFromDb } from '../domain/professional';

export class SupabaseProfessionalRepository implements ProfessionalRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(
    input: CreateProfessionalInput,
    tenantId: string
  ): Promise<Professional> {
    const { data, error } = await this.supabase
      .from('professionals')
      .insert({
        tenant_id: tenantId,
        name: input.name,
        user_id: input.userId ?? null,
        active: input.active ?? true,
      })
      .select()
      .single();

    if (error) {
      throw mapRepositoryError(error);
    }

    return professionalFromDb(data as ProfessionalRow);
  }

  async findByTenant(tenantId: string): Promise<Professional[]> {
    const { data, error } = await this.supabase
      .from('professionals')
      .select()
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name');

    if (error) {
      throw mapRepositoryError(error);
    }

    return (data as ProfessionalRow[]).map(professionalFromDb);
  }

  async findById(id: string, tenantId: string): Promise<Professional | null> {
    const { data, error } = await this.supabase
      .from('professionals')
      .select()
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw mapRepositoryError(error);
    }

    if (!data) return null;
    return professionalFromDb(data as ProfessionalRow);
  }

  async update(
    id: string,
    input: UpdateProfessionalInput,
    tenantId: string
  ): Promise<Professional> {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.userId !== undefined) updates.user_id = input.userId ?? null;
    if (input.active !== undefined) updates.active = input.active;

    const { data, error } = await this.supabase
      .from('professionals')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      throw mapRepositoryError(error);
    }

    return professionalFromDb(data as ProfessionalRow);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    // Soft-delete: set deleted_at (never hard-delete per data-retention policy).
    const { error } = await this.supabase
      .from('professionals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) {
      throw mapRepositoryError(error);
    }
  }
}

/**
 * Maps Supabase errors to domain-relevant error messages.
 */
function mapRepositoryError(error: {
  code?: string;
  message?: string;
}): Error {
  if (error.code === '23505') {
    // Unique violation — e.g. linking a user_id already used by another professional
    return new Error('Já existe um profissional vinculado a este usuário.');
  }
  return new Error(
    error.message || 'Erro ao acessar o banco de dados. Tente novamente.'
  );
}
