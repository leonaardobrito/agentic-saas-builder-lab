import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { signInAction } from '../presentation/actions/sign-in.action';
import { signOutAction } from '../presentation/actions/sign-out.action';

/**
 * Unit tests for authentication actions.
 * 
 * These tests verify:
 * - Input validation
 * - Error handling
 * - Response format
 * 
 * Note: These are unit tests that mock Supabase client.
 * For integration tests with real Supabase, see auth.integration.test.ts
 */

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
}));

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

describe('Authentication Actions (Unit Tests)', () => {
  describe('signInAction - Input Validation', () => {
    it('should return validation error for invalid email format', async () => {
      const invalidInput = {
        email: 'not-an-email',
        password: 'password123',
      };

      const result = await signInAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('E-mail inválido');
      }
    });

    it('should return validation error for short password', async () => {
      const invalidInput = {
        email: 'test@example.com',
        password: '123',
      };

      const result = await signInAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('senha deve ter no mínimo 6 caracteres');
      }
    });

    it('should return validation error for missing email', async () => {
      const invalidInput = {
        password: 'password123',
      };

      const result = await signInAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('signInAction - Authentication Logic', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return success for valid credentials', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'user-123',
                email: 'test@example.com',
                email_confirmed_at: '2026-09-01T00:00:00Z',
              },
              session: { access_token: 'token' },
            },
            error: null,
          }),
        },
      };

      vi.mocked(createServerClient).mockResolvedValue(mockSupabase as any);

      const validInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await signInAction(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.email).toBe('test@example.com');
        expect(result.data.user.id).toBe('user-123');
      }
    });

    it('should return error for invalid credentials', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
          }),
        },
      };

      vi.mocked(createServerClient).mockResolvedValue(mockSupabase as any);

      const invalidInput = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      const result = await signInAction(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('E-mail ou senha incorretos.');
      }
    });

    it('should return error for unconfirmed email', async () => {
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Email not confirmed' },
          }),
        },
      };

      vi.mocked(createServerClient).mockResolvedValue(mockSupabase as any);

      const unconfirmedInput = {
        email: 'unconfirmed@example.com',
        password: 'password123',
      };

      const result = await signInAction(unconfirmedInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Confirme seu e-mail antes de fazer login.');
      }
    });
  });

  describe('signOutAction', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call signOut and redirect to login', async () => {
      const mockSupabase = {
        auth: {
          signOut: vi.fn().mockResolvedValue({ error: null }),
        },
      };

      vi.mocked(createServerClient).mockResolvedValue(mockSupabase as any);

      await expect(signOutAction()).rejects.toThrow('NEXT_REDIRECT: /login');
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(redirect).toHaveBeenCalledWith('/login');
    });
  });
});

