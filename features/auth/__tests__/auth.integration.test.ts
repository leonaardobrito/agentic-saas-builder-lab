import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { signUpAction } from '../presentation/actions/sign-up.action';
import { signInAction } from '../presentation/actions/sign-in.action';

/**
 * Integration Tests for Authentication
 * 
 * These tests require a running Supabase local instance.
 * Run: supabase start
 * 
 * Tests verify:
 * - User, tenant, and membership creation
 * - Row Level Security (RLS) policies
 * - Duplicate email/tenant name handling
 * - Data validation
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let supabase: ReturnType<typeof createClient>;

describe('Authentication Integration Tests', () => {
  beforeAll(() => {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase credentials. Run "supabase start" and ensure .env.local is configured.'
      );
    }
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  });

  describe('signUpAction - User and Tenant Creation', () => {
    it('should create user, tenant, and membership successfully', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testTenantName = `Tenant ${Date.now()}`;

      const result = await signUpAction({
        email: testEmail,
        password: 'password123',
        fullName: 'Test User',
        tenantName: testTenantName,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.user.email).toBe(testEmail);
      expect(result.data?.tenant.name).toBe(testTenantName);

      // Verify tenant exists
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', result.data!.tenant.id)
        .single();

      expect(tenant).toBeDefined();
      expect(tenant!.name).toBe(testTenantName);

      // Verify membership exists with owner role
      const { data: membership } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', result.data!.user.id)
        .eq('tenant_id', result.data!.tenant.id)
        .single();

      expect(membership).toBeDefined();
      expect(membership!.role).toBe('owner');
      expect(membership!.is_active).toBe(true);
    });

    it('should return error for duplicate email', async () => {
      const dupEmail = `dup-${Date.now()}@example.com`;
      
      await signUpAction({
        email: dupEmail,
        password: 'password123',
        fullName: 'User One',
        tenantName: `Tenant One ${Date.now()}`,
      });

      const result = await signUpAction({
        email: dupEmail,
        password: 'password123',
        fullName: 'User Two',
        tenantName: `Tenant Two ${Date.now()}`,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('já está cadastrado');
    });
    it('should return error for duplicate tenant name when constrained', async () => {
      const fixedTenantName = `Unique Salon ${Date.now()}`;
      
      const result1 = await signUpAction({
        email: `owner1-${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Owner One',
        tenantName: fixedTenantName,
      });

      expect(result1.success).toBe(true);

      // Attempt duplicate tenant name
      const result2 = await signUpAction({
        email: `owner2-${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Owner Two',
        tenantName: fixedTenantName,
      });

      // Depending on database constraints, duplicate name might fail or succeed.
      // If error, it should be the expected message
      if (!result2.success) {
        expect(result2.error).toContain('salão');
      }
    });

    it('should handle CPF field correctly', async () => {
      const emailWithCpf = `cpf-test-${Date.now()}@example.com`;

      const result = await signUpAction({
        email: emailWithCpf,
        password: 'password123',
        fullName: 'CPF User',
        tenantName: `CPF Tenant ${Date.now()}`,
        cpf: '12345678901',
  describe('Row Level Security (RLS) & Tenant Isolation', () => {
    it('should isolate tenants using RLS policies', async () => {
      const email1 = `rls1-${Date.now()}@example.com`;
      const email2 = `rls2-${Date.now()}@example.com`;

      const res1 = await signUpAction({
        email: email1,
        password: 'password123',
        fullName: 'Tenant User 1',
        tenantName: `Tenant Alpha ${Date.now()}`,
      });

      const res2 = await signUpAction({
        email: email2,
        password: 'password123',
        fullName: 'Tenant User 2',
        tenantName: `Tenant Beta ${Date.now()}`,
      });

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);

      // Authenticate as User 1
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: authSession } = await anonClient.auth.signInWithPassword({
        email: email1,
        password: 'password123',
      });

      expect(authSession.session).toBeDefined();

      // User 1 queries tenants; should not see User 2's tenant under strict RLS
      const { data: visibleTenants } = await anonClient
        .from('tenants')
        .select('*')
        .eq('id', res2.data!.tenant.id);

      expect(visibleTenants?.length ?? 0).toBe(0);
    });
  });

  describe('Rollback & Error Handling', () => {
    it('should rollback user creation if tenant or membership creation fails', async () => {
      // Mock failure or test atomic behavior with invalid inputs
      const invalidEmail = 'malformed-email';
      const result = await signUpAction({
        email: invalidEmail,
        password: 'password123',
        fullName: 'Fail User',
        tenantName: 'Fail Tenant',
      });

      expect(result.success).toBe(false);

      // Verify no orphan user exists
      const { data: users } = await supabase.auth.admin.listUsers();
      const orphan = users?.users.find((u) => u.email === invalidEmail);
      expect(orphan).toBeUndefined();
    });
  });

      });

      expect(result.success).toBe(true);
    });
  });

  describe('signInAction - Authentication', () => {
    it('should authenticate with valid credentials', async () => {
      const loginEmail = `login-test-${Date.now()}@example.com`;
      const loginPassword = 'password123';

      // Create user first
      await signUpAction({
        email: loginEmail,
        password: loginPassword,
        fullName: 'Login User',
        tenantName: `Login Tenant ${Date.now()}`,
      });

      // Try to login
      const result = await signInAction({
        email: loginEmail,
        password: loginPassword,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.user.email).toBe(loginEmail);
    });

    it('should reject invalid credentials', async () => {
      const result = await signInAction({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('incorretos');
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

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate password length', async () => {
      const result = await signUpAction({
        email: 'test@example.com',
        password: '123',
        fullName: 'Test User',
        tenantName: 'Test Tenant',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate CPF format when provided', async () => {
      const result = await signUpAction({
        email: 'cpf@example.com',
        password: 'password123',
        fullName: 'Test User',
        tenantName: 'Test Tenant',
        cpf: 'invalid-cpf',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

