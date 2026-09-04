/**
 * Customer feature — Server Action unit tests (mocked Supabase).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import {
  createCustomerAction,
  listCustomersAction,
  updateCustomerAction,
  deleteCustomerAction,
} from '../presentation/actions';
import type { ActionResponse } from '@/lib/types/action.types';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

/** Helper to safely narrow ActionResponse and access the error field. */
function getError(result: ActionResponse<unknown>): string {
  expect(result.success).toBe(false);
  return (result as { success: false; error: string }).error;
}

type MockResult = { data: unknown; error: unknown | null };

function createMockChain(result: MockResult) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    order: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    like: vi.fn(() => chain),
    or: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

function buildMockSupabase(overrides: {
  user?: { id: string } | null;
  membership?: { tenant_id: string; role: string };
  customersResult?: MockResult;
}) {
  const chain = createMockChain(
    overrides.customersResult ?? { data: null, error: null }
  );

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: overrides.user ? { user: overrides.user } : { user: null },
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'memberships') {
        return createMockChain({
          data: overrides.membership ?? null,
          error: null,
        });
      }
      return chain;
    }),
  } as unknown as SupabaseClient;
}

const TENANT_ID = 'tenant-123e4567-e89b';
const USER_ID = 'user-123e4567-e89b';
const ANY_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('Customer Actions (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCustomersAction', () => {
    it('should return error when unauthenticated', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({ user: null })
      );

      const result = await listCustomersAction();

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você precisa estar autenticado.');
    });

    it('should return list when authenticated', async () => {
      const mockCustomers = [
        {
          id: 'cust-1',
          tenant_id: TENANT_ID,
          full_name: 'Maria Silva',
          email: 'maria@example.com',
          phone: '+5511999999999',
          cpf: '52998224725',
          birth_date: '1990-01-01',
          last_visit_at: null,
          status: 'active',
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
          deleted_at: null,
        },
      ];

      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'receptionist' },
          customersResult: { data: mockCustomers, error: null },
        })
      );

      const result = await listCustomersAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].fullName).toBe('Maria Silva');
        expect(result.data[0].tenantId).toBe(TENANT_ID);
      }
    });
  });

  describe('createCustomerAction', () => {
    it('should return validation error for invalid CPF', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'receptionist' },
        })
      );

      const result = await createCustomerAction({ fullName: 'Teste', cpf: '123' });

      expect(result.success).toBe(false);
      expect(getError(result)).toContain('11 dígitos');
    });

    it('should require authentication', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({ user: null })
      );

      const result = await createCustomerAction({ fullName: 'Novo Cliente', cpf: '52998224725' });

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você precisa estar autenticado.');
    });

    it('should create customer when authenticated (any member)', async () => {
      const created = {
        id: 'cust-new',
        tenant_id: TENANT_ID,
        full_name: 'Novo Cliente',
        email: null,
        phone: null,
        cpf: '52998224725',
        birth_date: null,
        last_visit_at: null,
        status: 'active',
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
        deleted_at: null,
      };

      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'receptionist' },
          customersResult: { data: created, error: null },
        })
      );

            const result = await createCustomerAction({ fullName: 'Novo Cliente', cpf: '52998224725' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('Novo Cliente');
        expect(result.data.tenantId).toBe(TENANT_ID);
      }
    });
  });

  describe('updateCustomerAction', () => {
    it('should return RBAC error for non-management role', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'receptionist' },
        })
      );

      const result = await updateCustomerAction({
        id: ANY_UUID,
        fullName: 'Atualizado',
      });

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você não tem permissão para editar clientes.');
    });

    it('should update customer when user has management role', async () => {
      const updated = {
        id: 'cust-1',
        tenant_id: TENANT_ID,
        full_name: 'Nome Atualizado',
        email: 'novo@email.com',
        phone: '+5511888888888',
        cpf: '52998224725',
        birth_date: '1985-05-15',
        last_visit_at: null,
        status: 'inactive',
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-02T00:00:00Z',
        deleted_at: null,
      };

      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'admin' },
          customersResult: { data: updated, error: null },
        })
      );

      const result = await updateCustomerAction({
        id: ANY_UUID,
        fullName: 'Nome Atualizado',
        email: 'novo@email.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('Nome Atualizado');
        expect(result.data.status).toBe('inactive');
      }
    });
  });

  describe('deleteCustomerAction', () => {
    it('should return RBAC error for manager role (only owner/admin)', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'manager' },
        })
      );

      const result = await deleteCustomerAction(ANY_UUID);

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você não tem permissão para remover clientes.');
    });

    it('should allow delete for admin role', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'admin' },
          customersResult: { data: null, error: null },
        })
      );

      const result = await deleteCustomerAction(ANY_UUID);

      expect(result.success).toBe(true);
    });
  });
});
