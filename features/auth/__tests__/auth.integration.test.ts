import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { signUpAction } from '../presentation/actions/sign-up.action';
import { signInAction } from '../presentation/actions/sign-in.action';

/**
 * Integration Tests for Authentication
 * These tests require a running Supabase local instance (supabase start).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabase = Boolean(supabaseUrl && supabaseServiceKey);

let supabase: ReturnType<typeof createClient>;

/** Helper: asserts success and returns data (any for test convenience). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertSuccess(result: any): any {
  if (!result.success) {
    throw new Error('Expected success but got error: ' + result.error);
  }
  return result;
}

/** Helper: asserts failure and returns error string. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertFailure(result: any): string {
  if (result.success) {
    throw new Error('Expected failure but got success');
  }
  return result.error;
}

// If Supabase is not available, skip all integration tests.
describe.skipIf(!hasSupabase)('Authentication Integration Tests', () => {
  beforeAll(() => {
    supabase = createClient(supabaseUrl!, supabaseServiceKey!);
  });

  afterAll(() => {
    // Cleanup can be added here if needed
  });

  describe('signUpAction - User and Tenant Creation', () => {
    it('should create user, tenant, and membership successfully', async () => {
      const testEmail = 'test-' + Date.now() + '@example.com';
      const testTenantName = 'Tenant ' + Date.now();

      const result = await signUpAction({
        email: testEmail,
        password: 'password123',
        fullName: 'Test User',
        tenantName: testTenantName,
      });

      const data = assertSuccess(result);
      expect(data.data.user.email).toBe(testEmail);
      expect(data.data.tenant.name).toBe(testTenantName);

      // Verify tenant exists in database
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', data.data.tenant.id)
        .single() as { data: { name: string } | null };
      expect(tenant).toBeDefined();
      expect(tenant!.name).toBe(testTenantName);

      // Verify membership exists with owner role
      const { data: membership } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', data.data.user.id)
        .eq('tenant_id', data.data.tenant.id)
        .single() as { data: { role: string; is_active: boolean } | null };
      expect(membership).toBeDefined();
      expect(membership!.role).toBe('owner');
      expect(membership!.is_active).toBe(true);
    });

    it('should return error for duplicate email', async () => {
      const dupEmail = 'dup-' + Date.now() + '@example.com';
      await signUpAction({
        email: dupEmail,
        password: 'password123',
        fullName: 'User One',
        tenantName: 'Tenant One ' + Date.now(),
      });
      const result = await signUpAction({
        email: dupEmail,
        password: 'password123',
        fullName: 'User Two',
        tenantName: 'Tenant Two ' + Date.now(),
      });
      const errorMsg = assertFailure(result);
      expect(errorMsg).toContain('ja esta cadastrado');
    });

    it('should return error for duplicate tenant name when constrained', async () => {
      const fixedTenantName = 'Unique Salon ' + Date.now();
      const result1 = await signUpAction({
        email: 'owner1-' + Date.now() + '@example.com',
        password: 'password123',
        fullName: 'Owner One',
        tenantName: fixedTenantName,
      });
      assertSuccess(result1);
      const result2 = await signUpAction({
        email: 'owner2-' + Date.now() + '@example.com',
        password: 'password123',
        fullName: 'Owner Two',
        tenantName: fixedTenantName,
      });
      if (!result2.success) {
        expect(result2.error).toContain('salao');
      }
    });

    it('should handle CPF field correctly', async () => {
      const emailWithCpf = 'cpf-test-' + Date.now() + '@example.com';
      const result = await signUpAction({
        email: emailWithCpf,
        password: 'password123',
        fullName: 'CPF User',
        tenantName: 'CPF Tenant ' + Date.now(),
        cpf: '12345678901',
      });
      const data = assertSuccess(result);
      expect(data.data.user.email).toBe(emailWithCpf);
    });

    it('should reject invalid CPF format', async () => {
      const result = await signUpAction({
        email: 'invalid-cpf-' + Date.now() + '@example.com',
        password: 'password123',
        fullName: 'Bad CPF User',
        tenantName: 'Bad CPF Tenant ' + Date.now(),
        cpf: 'invalid-cpf',
      });
      assertFailure(result);
    });
  });
  describe('Row Level Security and Tenant Isolation', () => {
    it('should isolate tenants using RLS policies', async () => {
      const email1 = 'rls1-' + Date.now() + '@example.com';
      const email2 = 'rls2-' + Date.now() + '@example.com';

      await signUpAction({
        email: email1,
        password: 'password123',
        fullName: 'Tenant User 1',
        tenantName: 'Tenant Alpha ' + Date.now(),
      });
      const res2 = await signUpAction({
        email: email2,
        password: 'password123',
        fullName: 'Tenant User 2',
        tenantName: 'Tenant Beta ' + Date.now(),
      });
      const data2 = assertSuccess(res2);

      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: authSession } = await anonClient.auth.signInWithPassword({
        email: email1,
        password: 'password123',
      });
      expect(authSession.session).toBeDefined();

      const { data: visibleTenants } = await anonClient
        .from('tenants')
        .select('*')
        .eq('id', data2.data.tenant.id);
      expect(visibleTenants?.length ?? 0).toBe(0);
    });
  });

  describe('Rollback and Error Handling', () => {
    it('should reject invalid email and not create orphan user', async () => {
      const invalidEmail = 'malformed-email';
      const result = await signUpAction({
        email: invalidEmail,
        password: 'password123',
        fullName: 'Fail User',
        tenantName: 'Fail Tenant',
      });
      assertFailure(result);
      const { data: users } = await supabase.auth.admin.listUsers();
      const orphan = users?.users.find((u) => u.email === invalidEmail);
      expect(orphan).toBeUndefined();
    });
  });

  describe('signInAction - Authentication', () => {
    it('should authenticate with valid credentials', async () => {
      const loginEmail = 'login-test-' + Date.now() + '@example.com';
      const loginPassword = 'password123';
      await signUpAction({
        email: loginEmail,
        password: loginPassword,
        fullName: 'Login User',
        tenantName: 'Login Tenant ' + Date.now(),
      });
      const result = await signInAction({ email: loginEmail, password: loginPassword });
      const data = assertSuccess(result);
      expect(data.data.user.email).toBe(loginEmail);
    });

    it('should reject invalid credentials', async () => {
      const result = await signInAction({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });
      const errorMsg = assertFailure(result);
      expect(errorMsg).toContain('incorretos');
    });
  });

  describe('Data Validation', () => {
    it('should validate email format', async () => {
      const result = await signUpAction({
        email: 'invalid-email',
        password: 'password123',
        fullName: 'Test User',
        tenantName: 'Test Tenant',
      });
      assertFailure(result);
    });

    it('should validate password length', async () => {
      const result = await signUpAction({
        email: 'test@example.com',
        password: '123',
        fullName: 'Test User',
        tenantName: 'Test Tenant',
      });
      assertFailure(result);
    });

    it('should validate CPF format when provided', async () => {
      const result = await signUpAction({
        email: 'cpf@example.com',
        password: 'password123',
        fullName: 'Test User',
        tenantName: 'Test Tenant',
        cpf: 'invalid-cpf',
      });
      assertFailure(result);
    });
  });
});
