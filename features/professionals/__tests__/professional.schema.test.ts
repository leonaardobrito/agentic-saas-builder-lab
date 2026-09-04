/**
 * Professional feature — Schema unit tests.
 *
 * Pure Zod validation tests (no Supabase / mocks required).
 * These verify all input-validation business rules at the schema level.
 */
import { describe, it, expect } from 'vitest';
import {
  createProfessionalSchema,
  updateProfessionalSchema,
} from '../domain/professional';

describe('Professional Schemas', () => {
  describe('createProfessionalSchema', () => {
    it('should accept valid input', () => {
      const input = { name: 'João Silva' };
      const result = createProfessionalSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('João Silva');
        // `active` defaults to true when omitted
        expect(result.data.active).toBe(true);
      }
    });

    it('should accept input with a linked user_id', () => {
      const input = {
        name: 'Maria Santos',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        active: false,
      };
      const result = createProfessionalSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

        it('should reject when name is missing', () => {
      const result = createProfessionalSchema.safeParse({});

      expect(result.success).toBe(false);
      // When a required field is entirely absent, Zod reports a type error.
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should reject when name is less than 2 characters', () => {
      const result = createProfessionalSchema.safeParse({ name: 'A' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mínimo 2');
      }
    });

    it('should reject when name exceeds 100 characters', () => {
      const result = createProfessionalSchema.safeParse({
        name: 'A'.repeat(101),
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid user_id format', () => {
      const result = createProfessionalSchema.safeParse({
        name: 'João',
        userId: 'not-a-uuid',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('inválido');
      }
    });

    it('should accept null user_id', () => {
      const result = createProfessionalSchema.safeParse({
        name: 'João',
        userId: null,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('updateProfessionalSchema', () => {
    it('should accept valid id with partial fields', () => {
      const result = updateProfessionalSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Nome Atualizado',
        active: false,
      });

      expect(result.success).toBe(true);
    });

    it('should accept only an id (minimal update)', () => {
      const result = updateProfessionalSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.success).toBe(true);
    });

    it('should reject missing id', () => {
      const result = updateProfessionalSchema.safeParse({ name: 'Teste' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject empty string id', () => {
      const result = updateProfessionalSchema.safeParse({ id: '' });

      expect(result.success).toBe(false);
    });

    it('should reject invalid id format', () => {
      const result = updateProfessionalSchema.safeParse({
        id: 'invalid-id',
      });

      expect(result.success).toBe(false);
    });

    it('should reject name that is too short', () => {
      const result = updateProfessionalSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'A',
      });

      expect(result.success).toBe(false);
    });
  });
});
