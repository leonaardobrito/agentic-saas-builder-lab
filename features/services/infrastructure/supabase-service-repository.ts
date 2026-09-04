/**
 * Service feature — Infrastructure layer.
 *
 * Supabase implementation of the ServiceRepository port.
 * RLS policies enforce tenant isolation at the database level; the explicit
 * `tenant_id` filter in every query is defense-in-depth (BR-SEC-003).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Service,
  CreateServiceInput,
  UpdateServiceInput,
  ServiceRow,
} from '../domain/service';
import { serviceFromDb } from '../domain/service';
import type { ServiceRepository } from '../application/ports';

export class SupabaseServiceRepository implements ServiceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateServiceInput, tenantId: string): Promise<Service> {
    const { data, error } = await this.supabase
      .from('services')
      .insert({
        tenant_id: tenantId,
        name: input.name,
        category: input.category ?? null,
        price: input.price,
        duration_minutes: input.durationMinutes,
        active: input.active ?? true,
      })
      .select()
      .single();

    if (error) throw mapRepositoryError(error);
    return serviceFromDb(data as ServiceRow);
  }

  async findByTenant(tenantId: string): Promise<Service[]> {
    const { data, error } = await this.supabase
      .from('services')
      .select()
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name');

    if (error) throw mapRepositoryError(error);
    return (data as ServiceRow[]).map(serviceFromDb);
  }

  async findById(id: string, tenantId: string): Promise<Service | null> {
    const { data, error } = await this.supabase
      .from('services')
      .select()
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw mapRepositoryError(error);
    return data ? serviceFromDb(data as ServiceRow) : null;
  }

  async update(
    id: string,
    input: UpdateServiceInput,
    tenantId: string
  ): Promise<Service> {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.category !== undefined) updates.category = input.category ?? null;
    if (input.price !== undefined) updates.price = input.price;
    if (input.durationMinutes !== undefined)
      updates.duration_minutes = input.durationMinutes;
    if (input.active !== undefined) updates.active = input.active;

    const { data, error } = await this.supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw mapRepositoryError(error);
    return serviceFromDb(data as ServiceRow);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('services')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw mapRepositoryError(error);
  }
}

function mapRepositoryError(error: { code?: string; message?: string }): Error {
  return new Error(
    error.message || 'Erro ao acessar o banco de dados. Tente novamente.'
  );
}
