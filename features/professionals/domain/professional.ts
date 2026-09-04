/**
 * Professional domain model.
 *
 * A Professional is a person who performs one or more services.
 * Per AGENTS.md D-002: A Professional MAY exist without an associated User
 * (no login account required).
 *
 * Table: public.professionals
 */
import { z } from 'zod';

/** Database row shape (snake_case). */
export interface ProfessionalRow {
  id: string;
  tenant_id: string;
  name: string;
  user_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Domain entity (camelCase). */
export interface Professional {
  id: string;
  tenantId: string;
  name: string;
  userId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Maps a database row to the domain entity. */
export function professionalFromDb(row: ProfessionalRow): Professional {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    userId: row.user_id,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

// --- Zod Schemas ---------------------------------------------------------

/** Schema for creating a new professional (tenant_id is injected by the server). */
export const createProfessionalSchema = z.object({
  name: z
    .string()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  userId: z.string().uuid('ID de usuário inválido.').optional().nullable(),
  active: z.boolean().default(true),
});

/** Schema for updating an existing professional. */
export const updateProfessionalSchema = z.object({
  id: z.string().uuid('ID inválido.'),
  name: z
    .string()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.')
    .optional(),
  userId: z
    .string()
    .uuid('ID de usuário inválido.')
    .optional()
    .nullable(),
  active: z.boolean().optional(),
});

export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>;
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;
