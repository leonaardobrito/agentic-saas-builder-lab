/**
 * Service domain model.
 *
 * A Service is a catalog item describing a procedure a Professional can
 * perform: its name, category, price, and duration.
 *
 * Table: public.services
 */
import { z } from 'zod';

/** Database row shape (snake_case). */
export interface ServiceRow {
  id: string;
  tenant_id: string;
  name: string;
  category: string | null;
  price: number;
  duration_minutes: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Domain entity (camelCase). */
export interface Service {
  id: string;
  tenantId: string;
  name: string;
  category: string | null;
  price: number;
  durationMinutes: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Maps a database row to the domain entity. */
export function serviceFromDb(row: ServiceRow): Service {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    durationMinutes: Number(row.duration_minutes),
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

// --- Zod Schemas ---------------------------------------------------------

/** Schema for creating a new service (tenant_id is injected by the server). */
export const createServiceSchema = z.object({
  name: z
    .string()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  category: z
    .string()
    .min(2, 'A categoria deve ter no mínimo 2 caracteres.')
    .max(50, 'A categoria deve ter no máximo 50 caracteres.')
    .optional()
    .nullable(),
  price: z.coerce
    .number()
    .min(0, 'O preço não pode ser negativo.'),
  durationMinutes: z.coerce
    .number()
    .int('A duração deve ser um número inteiro.')
    .min(15, 'A duração mínima é de 15 minutos.'),
  active: z.boolean().default(true),
});

/** Schema for updating an existing service. */
export const updateServiceSchema = z.object({
  id: z.string().uuid('ID inválido.'),
  name: z
    .string()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.')
    .optional(),
  category: z
    .string()
    .min(2)
    .max(50)
    .optional()
    .nullable(),
  price: z.coerce
    .number()
    .min(0, 'O preço não pode ser negativo.')
    .optional(),
  durationMinutes: z.coerce
    .number()
    .int('A duração deve ser um número inteiro.')
    .min(15, 'A duração mínima é de 15 minutos.')
    .optional(),
  active: z.boolean().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
