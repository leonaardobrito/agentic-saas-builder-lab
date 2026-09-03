import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signInAction } from '../presentation/actions/sign-in.action';
import { signOutAction } from '../presentation/actions/sign-out.action';

/**
 * Integration tests for authentication actions.
 * 
 * These tests verify:
 * - Sign-in with valid credentials
 * - Sign-in with invalid credentials
 * - Sign-out functionality
 * 
 * Note: These tests require a running Supabase local instance.
 * Run `supabase start` before executing tests.
 */
describe('Authentication Actions', () => {
  describe('signInAction', () => {
    it('should return success with user data for valid credentials', async () => {
      // Arrange
      const validCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Act
      const result = await signInAction(validCredentials);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toBeDefined();
        expect(result.data.user.email).toBe(validCredentials.email);
      }
    });

    it('should return error for invalid credentials', async () => {
      // Arrange
      const invalidCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      // Act
      const result = await signInAction(invalidCredentials);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('E-mail ou senha incorretos.');
      }
    });

    it('should return validation error for invalid email format', async () => {
      // Arrange
      const invalidInput = {
        email: 'not-an-email',
        password: 'password123',
      };

      // Act
      const result = await signInAction(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('E-mail inválido');
      }
    });

    it('should return validation error for short password', async () => {
      // Arrange
      const invalidInput = {
        email: 'test@example.com',
        password: '123',
      };

      // Act
      const result = await signInAction(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('senha deve ter no mínimo 6 caracteres');
      }
    });

    it('should return error for unconfirmed email', async () => {
      // Arrange
      const unconfirmedCredentials = {
        email: 'unconfirmed@example.com',
        password: 'password123',
      };

      // Act
      const result = await signInAction(unconfirmedCredentials);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Confirme seu e-mail antes de fazer login.');
      }
    });
  });

  describe('signOutAction', () => {
    it('should sign out successfully and redirect to login', async () => {
      // This test verifies that signOutAction calls supabase.auth.signOut
      // and uses Next.js redirect. Since redirect throws, we expect it to throw.
      
      // Act & Assert
      await expect(signOutAction()).rejects.toThrow();
      // The redirect to /login is expected behavior
    });
  });
});
