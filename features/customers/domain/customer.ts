/**
 * Customer domain model.
 *
 * A Customer belongs to a single tenant and represents a person who
 * receives services from professionals. CPF is the Brazilian tax ID
 * (11 digits, formatted as XXX.XXX.XXX-YY).
 *
 * Table: public.customers
 */
import { z } from 'zod';
import { isValidCPF } from '@/shared/utils/validations';

/** Customer status — mirrors the CHECK constraint in the database. */
export type CustomerStatus = 'active' | 'inactive' | 'blocked';

/** Database row shape (snake_case) — maps 1:1 to public.customers columns. */
export interface CustomerRow {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string;
  birth_date: string | null;
  last_visit_at: string | null;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Domain entity (camelCase). */
export interface Customer {
  id: string;
  tenantId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  cpf: string;
  birthDate: string | null;
  lastVisitAt: string | null;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Maps a database row to the domain entity. */
export function customerFromDb(row: CustomerRow): Customer {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    cpf: row.cpf,
    birthDate: row.birth_date,
    lastVisitAt: row.last_visit_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

// --- Zod Schemas ---------------------------------------------------------

/** E.164-ish phone: + followed by digits and optional dashes/spaces/parentheses. */
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

/** Schema for creating a new customer (tenant_id is injected by the server). */
export const createCustomerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email: z
    .string()
    .email('E-mail inválido.')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido.')
    .optional()
    .nullable()
    .or(z.literal('')),
  cpf: z
    .string()
    .length(11, 'CPF deve conter 11 dígitos.')
    .regex(/^\d{11}$/, 'CPF deve conter apenas números.')
    .refine((val) => isValidCPF(val), 'CPF inválido.'),
  birthDate: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z.enum(['active', 'inactive', 'blocked']).default('active'),
});

/** Schema for updating an existing customer. */
export const updateCustomerSchema = z.object({
  id: z.string().uuid('ID inválido.'),
  fullName: z
    .string()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.')
    .optional(),
  email: z
    .string()
    .email('E-mail inválido.')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(phoneRegex, 'Telefone inválido.')
    .optional()
    .nullable()
    .or(z.literal('')),
  cpf: z
    .string()
    .length(11, 'CPF deve conter 11 dígitos.')
    .regex(/^\d{11}$/, 'CPF deve conter apenas números.')
    .refine((val) => isValidCPF(val), 'CPF inválido.')
    .optional(),
  birthDate: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z.enum(['active', 'inactive', 'blocked']).optional(),
});

/** Sanitizes optional string fields: empty string → null. */
export const sanitizeCustomer = <T extends Record<string, unknown>>(
  input: T
): T => {
  const out: Record<string, unknown> = { ...input };
  for (const key of ['email', 'phone', 'cpf', 'birthDate']) {
    if (out[key] === '' || out[key] === undefined) {
      out[key] = null;
    }
  }
  return out as T;
};

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
