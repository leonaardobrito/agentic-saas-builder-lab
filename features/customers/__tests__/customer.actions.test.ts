/**
 * Customer feature — Server Action unit tests (mocked Supabase).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServerClient } from '@/lib/supabase/server';
import {
  createCustomerAction,
  listCustomersAction,
  updateCustomerAction,
  deleteCustomerAction,
} from '../presentation/actions';

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

type MockResult = { data: unknown; error: unknown | null };

function createMockChain(result: MockResult) {
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
  };
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
      expect(result.error).toBe('Você precisa estar autenticado.');
    });

    it('should return list when authenticated', async () => {
      const mockCustomers = [
        {
          id: 'cust-1',
          tenant_id: TENANT_ID,
          name: 'Maria Silva',
          email: 'maria@example.com',
          phone: '+5511999999999',
          cpf: '12345678901',
          birth_date: '1990-01-01',
          active: true,
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
        expect(result.data[0].name).toBe('Maria Silva');
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

      const result = await createCustomerAction({ name: 'Teste', cpf: '123' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('11 dígitos');
    });

    it('should require authentication', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({ user: null })
      );

      const result = await createCustomerAction({ name: 'Novo Cliente' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Você precisa estar autenticado.');
    });

    it('should create customer when authenticated (any member)', async () => {
      const created = {
        id: 'cust-new',
        tenant_id: TENANT_ID,
        name: 'Novo Cliente',
        email: null,
        phone: null,
        cpf: null,
        birth_date: null,
        active: true,
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

            const result = await createCustomerAction({ name: 'Novo Cliente' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Novo Cliente');
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
        name: 'Atualizado',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Você não tem permissão para editar clientes.');
    });

    it('should update customer when user has management role', async () => {
      const updated = {
        id: 'cust-1',
        tenant_id: TENANT_ID,
        name: 'Nome Atualizado',
        email: 'novo@email.com',
        phone: '+5511888888888',
        cpf: '98765432100',
        birth_date: '1985-05-15',
        active: false,
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
        name: 'Nome Atualizado',
        email: 'novo@email.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Nome Atualizado');
        expect(result.data.active).toBe(false);
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
      expect(result.error).toBe('Você não tem permissão para remover clientes.');
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
