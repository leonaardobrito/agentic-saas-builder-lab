/**
 * Customer feature — Infrastructure layer.
 *
 * Supabase implementation of the CustomerRepository port.
 * RLS policies enforce tenant isolation at the database level; explicit
 * tenant_id filters in every query provide defense-in-depth (BR-SEC-003).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerRow,
} from '../domain/customer';
import { customerFromDb, sanitizeCustomer } from '../domain/customer';
import type { CustomerRepository } from '../application/ports';

export class SupabaseCustomerRepository implements CustomerRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: CreateCustomerInput, tenantId: string): Promise<Customer> {
    const sanitized = sanitizeCustomer(input as Record<string, unknown>);

    const { data, error } = await this.supabase
      .from('customers')
      .insert({
        tenant_id: tenantId,
        name: sanitized.name,
        email: sanitized.email ?? null,
        phone: sanitized.phone ?? null,
        cpf: sanitized.cpf ?? null,
        birth_date: sanitized.birthDate || null,
        active: sanitized.active ?? true,
      })
      .select()
      .single();

    if (error) throw mapRepositoryError(error);
    return customerFromDb(data as CustomerRow);
  }

  async findByTenant(tenantId: string): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .from('customers')
      .select()
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name');

    if (error) throw mapRepositoryError(error);
    return (data as CustomerRow[]).map(customerFromDb);
  }

  async findById(id: string, tenantId: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select()
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw mapRepositoryError(error);
    return data ? customerFromDb(data as CustomerRow) : null;
  }

  async update(
    id: string,
    input: UpdateCustomerInput,
    tenantId: string
  ): Promise<Customer> {
    const sanitized = sanitizeCustomer(input as Record<string, unknown>);

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (sanitized.name !== undefined) updates.name = sanitized.name;
    if (sanitized.email !== undefined) updates.email = sanitized.email ?? null;
    if (sanitized.phone !== undefined) updates.phone = sanitized.phone ?? null;
    if (sanitized.cpf !== undefined) updates.cpf = sanitized.cpf ?? null;
    if (sanitized.birthDate !== undefined)
      updates.birth_date = sanitized.birthDate || null;
    if (sanitized.active !== undefined) updates.active = sanitized.active;

    const { data, error } = await this.supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw mapRepositoryError(error);
    return customerFromDb(data as CustomerRow);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw mapRepositoryError(error);
  }

  async search(term: string, tenantId: string): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .from('customers')
      .select()
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .or(`name.ilike.%${term}%,cpf.ilike.%${term}%,email.ilike.%${term}%`)
      .order('name');

    if (error) throw mapRepositoryError(error);
    return (data as CustomerRow[]).map(customerFromDb);
  }
}

function mapRepositoryError(error: { code?: string; message?: string }): Error {
  return new Error(
    error.message || 'Erro ao acessar o banco de dados. Tente novamente.'
  );
}
