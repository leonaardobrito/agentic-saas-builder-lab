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

/** Database row shape (snake_case). */
export interface CustomerRow {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Domain entity (camelCase). */
export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  birthDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Maps a database row to the domain entity. */
export function customerFromDb(row: CustomerRow): Customer {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    cpf: row.cpf,
    birthDate: row.birth_date,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

/** CPF validation: 11 digits only (strips formatting). */
const cpfRegex = /^\d{11}$/;

/** E.164-ish phone: + followed by digits and optional dashes/spaces/parentheses. */
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

/** Email format check (RFC 5322 simplified). */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Zod Schemas ---------------------------------------------------------

/** Schema for creating a new customer (tenant_id is injected by the server). */
export const createCustomerSchema = z.object({
  name: z
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
    .regex(cpfRegex, 'CPF deve conter 11 dígitos numéricos.')
    .optional()
    .nullable()
    .or(z.literal('')),
  birthDate: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),
  active: z.boolean().default(true),
});

/** Schema for updating an existing customer. */
export const updateCustomerSchema = z.object({
  id: z.string().uuid('ID inválido.'),
  name: z
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
    .regex(cpfRegex, 'CPF deve conter 11 dígitos numéricos.')
    .optional()
    .nullable()
    .or(z.literal('')),
  birthDate: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),
  active: z.boolean().optional(),
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
