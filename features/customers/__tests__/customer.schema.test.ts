/**
 * Customer feature — Schema unit tests.
 *
 * Validates CPF (11 digits), phone, email, and business rules.
 */
import { describe, it, expect } from 'vitest';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '../domain/customer';

describe('Customer Schemas', () => {
  describe('createCustomerSchema', () => {
    it('should accept valid input with CPF', () => {
      const result = createCustomerSchema.safeParse({
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '+5511999999999',
        cpf: '12345678901',
        birthDate: '1990-01-01',
      });

      expect(result.success).toBe(true);
    });

    it('should accept input with only required name', () => {
      const result = createCustomerSchema.safeParse({
        name: 'João',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toBe(true);
        expect(result.data.email).toBeUndefined();
      }
    });

    it('should accept empty string as null for optional fields', () => {
      const result = createCustomerSchema.safeParse({
        name: 'Cliente',
        email: '',
        phone: '',
        cpf: '',
      });

      expect(result.success).toBe(true);
    });

    it('should reject when name is missing', () => {
      const result = createCustomerSchema.safeParse({
        cpf: '12345678901',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should reject when name is less than 2 characters', () => {
      const result = createCustomerSchema.safeParse({ name: 'A' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mínimo 2');
      }
    });

    it('should reject CPF with formatting characters', () => {
      const result = createCustomerSchema.safeParse({
        name: 'Cliente',
        cpf: '123.456.789-01',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('11 dígitos');
      }
    });

    it('should reject CPF with fewer than 11 digits', () => {
      const result = createCustomerSchema.safeParse({
        name: 'Cliente',
        cpf: '1234567890',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('11 dígitos');
      }
    });

    it('should reject CPF with letters', () => {
      const result = createCustomerSchema.safeParse({
        name: 'Cliente',
        cpf: '1234567890A',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = createCustomerSchema.safeParse({
        name: 'Cliente',
        email: 'not-an-email',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('E-mail inválido.');
      }
    });

        it('should reject invalid phone format', () => {
      const result = createCustomerSchema.safeParse({
        name: 'Cliente',
        phone: 'abc-def',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Telefone inválido.');
      }
    });
  });

  describe('updateCustomerSchema', () => {
    it('should accept valid id with partial fields', () => {
      const result = updateCustomerSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Nome Atualizado',
      });

      expect(result.success).toBe(true);
    });

    it('should reject missing id', () => {
      const result = updateCustomerSchema.safeParse({
        name: 'Teste',
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
        cpf: '12345678901',
      });

      expect(result.success).toBe(true);
    });
  });
});
