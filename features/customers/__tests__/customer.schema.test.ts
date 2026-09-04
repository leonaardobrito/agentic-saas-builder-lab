/**
 * Customer feature — Schema unit tests.
 *
 * Validates CPF (11 digits + modulo 11), phone, email, and business rules.
 */
import { describe, it, expect } from 'vitest';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '../domain/customer';

// Known valid CPFs (pass modulo-11 check digit validation)
const VALID_CPF = '52998224725';

describe('Customer Schemas', () => {
  describe('createCustomerSchema', () => {
    it('should accept valid input with CPF', () => {
      const result = createCustomerSchema.safeParse({
        fullName: 'Maria Silva',
        email: 'maria@example.com',
        phone: '+5511999999999',
        cpf: VALID_CPF,
        birthDate: '1990-01-01',
      });

      expect(result.success).toBe(true);
    });

    it('should accept input with only required fields (fullName + cpf)', () => {
      const result = createCustomerSchema.safeParse({
        fullName: 'João',
        cpf: VALID_CPF,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('active');
        expect(result.data.email).toBeUndefined();
      }
    });

    it('should accept empty string as null for optional fields', () => {
      const result = createCustomerSchema.safeParse({
        fullName: 'Cliente',
        email: '',
        phone: '',
        cpf: VALID_CPF,
      });

      expect(result.success).toBe(true);
    });

    it('should reject when fullName is missing', () => {
      const result = createCustomerSchema.safeParse({
        cpf: VALID_CPF,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should reject when fullName is less than 2 characters', () => {
      const result = createCustomerSchema.safeParse({
        fullName: 'A',
        cpf: VALID_CPF,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mínimo 2');
      }
    });

    it('should reject when cpf is missing', () => {
      const result = createCustomerSchema.safeParse({
        fullName: 'Cliente',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('cpf'))).toBe(true);
      }
    });

    it('should reject CPF with formatting characters', () => {
      const result = createCustomerSchema.safeParse({
        fullName: 'Cliente',
        cpf: '123.456.789-01',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('cpf'))).toBe(true);
      }
    });

    it('should reject CPF with fewer than 11 digits', () => {
      const result = createCustomerSchema.safeParse({
        fullName: 'Cliente',
        cpf: '1234567890',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('cpf'))).toBe(true);
      }
    });

    it('should reject CPF with invalid check digits (modulo 11)', () => {
      const result = createCustomerSchema.safeParse({
        fullName: 'Cliente',
        cpf: '12345678901',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('CPF inválido'))).toBe(true);
      }
    });

    it('should reject all-same-digit CPF', () => {
      const result = createCustomerSchema.safeParse({
        fullName: 'Cliente',
        cpf: '00000000000',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('cpf'))).toBe(true);
      }
    });

    it('should reject invalid email format', () => {
      const result = createCustomerSchema.safeParse({
        fullName: 'Cliente',
        cpf: VALID_CPF,
        email: 'not-an-email',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('E-mail inválido.');
      }
    });

    it('should reject invalid phone format', () => {
      const result = createCustomerSchema.safeParse({
        fullName: 'Cliente',
        cpf: VALID_CPF,
        phone: 'abc-def',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Telefone inválido.');
      }
    });

    it('should accept valid status values', () => {
      for (const status of ['active', 'inactive', 'blocked'] as const) {
        const result = createCustomerSchema.safeParse({
          fullName: 'Cliente',
          cpf: VALID_CPF,
          status,
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe('updateCustomerSchema', () => {
    it('should accept valid id with partial fields', () => {
      const result = updateCustomerSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        fullName: 'Nome Atualizado',
      });

      expect(result.success).toBe(true);
    });

    it('should reject missing id', () => {
      const result = updateCustomerSchema.safeParse({
        fullName: 'Teste',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid uuid', () => {
      const result = updateCustomerSchema.safeParse({
        id: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid CPF update', () => {
      const result = updateCustomerSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        cpf: VALID_CPF,
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid CPF in update', () => {
      const result = updateCustomerSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        cpf: '12345678901',
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid status update', () => {
      const result = updateCustomerSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'blocked',
      });

      expect(result.success).toBe(true);
    });
  });
});
