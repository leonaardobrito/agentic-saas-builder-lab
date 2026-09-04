/**
 * Service feature — Schema unit tests.
 */
import { describe, it, expect } from 'vitest';
import {
  createServiceSchema,
  updateServiceSchema,
} from '../domain/service';

describe('Service Schemas', () => {
  describe('createServiceSchema', () => {
    it('should accept valid input', () => {
      const result = createServiceSchema.safeParse({
        name: 'Corte de Cabelo',
        category: 'Cabelo',
        price: 85.5,
        durationMinutes: 45,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Corte de Cabelo');
        expect(result.data.price).toBe(85.5);
        expect(result.data.durationMinutes).toBe(45);
        expect(result.data.active).toBe(true);
      }
    });

    it('should accept string price and duration (form data)', () => {
      const result = createServiceSchema.safeParse({
        name: 'Coloração',
        price: '120',
        durationMinutes: '90',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.price).toBe(120);
        expect(result.data.durationMinutes).toBe(90);
      }
    });

    it('should accept null category', () => {
      const result = createServiceSchema.safeParse({
        name: 'Serviço Sem Categoria',
        category: null,
        price: 50,
        durationMinutes: 30,
      });

      expect(result.success).toBe(true);
    });

    it('should reject when name is too short', () => {
      const result = createServiceSchema.safeParse({
        name: 'A',
        price: 50,
        durationMinutes: 30,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mínimo 2');
      }
    });

    it('should reject negative price', () => {
      const result = createServiceSchema.safeParse({
        name: 'Serviço',
        price: -10,
        durationMinutes: 30,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('negativo');
      }
    });

    it('should reject duration below 15 minutes', () => {
      const result = createServiceSchema.safeParse({
        name: 'Serviço',
        price: 50,
        durationMinutes: 10,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('15 minutos');
      }
    });

    it('should reject duration as non-integer when using number', () => {
      const result = createServiceSchema.safeParse({
        name: 'Serviço',
        price: 50,
        durationMinutes: 30.5,
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const result = createServiceSchema.safeParse({
        price: 50,
        durationMinutes: 30,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('updateServiceSchema', () => {
    it('should accept valid id with partial fields', () => {
      const result = updateServiceSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Nome Atualizado',
        price: '99.99',
      });

      expect(result.success).toBe(true);
    });

    it('should reject missing id', () => {
      const result = updateServiceSchema.safeParse({
        name: 'Teste',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid uuid format', () => {
      const result = updateServiceSchema.safeParse({
        id: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });
});
