import { z } from 'zod';

/**
 * Validation schema for sign-in credentials.
 */
export const signInSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

/**
 * Validation schema for sign-up credentials.
 */
export const signUpSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  fullName: z.string().min(2, 'Nome completo deve ter no mínimo 2 caracteres.'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos.').optional(),
  tenantName: z.string().min(2, 'Nome do salão deve ter no mínimo 2 caracteres.'),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
