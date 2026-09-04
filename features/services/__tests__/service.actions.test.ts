/**
 * Service feature — Server Action unit tests (mocked Supabase).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import {
  createServiceAction,
  listServicesAction,
  updateServiceAction,
  deleteServiceAction,
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
  servicesResult?: MockResult;
}) {
  const chain = createMockChain(
    overrides.servicesResult ?? { data: null, error: null }
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

describe('Service Actions (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listServicesAction', () => {
    it('should return error when unauthenticated', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({ user: null })
      );

      const result = await listServicesAction();

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você precisa estar autenticado.');
    });

    it('should return list when authenticated', async () => {
      const mockServices = [
        {
          id: 'svc-1',
          tenant_id: TENANT_ID,
          name: 'Corte de Cabelo',
          category: 'Cabelo',
          price: 85.5,
          duration_minutes: 45,
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
          servicesResult: { data: mockServices, error: null },
        })
      );

      const result = await listServicesAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].name).toBe('Corte de Cabelo');
        expect(result.data[0].durationMinutes).toBe(45);
      }
    });
  });

  describe('createServiceAction', () => {
        it('should return RBAC error for non-management role', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'professional' },
        })
      );

      const result = await createServiceAction({ name: 'Novo Serviço', price: 50, durationMinutes: 30 });

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você não tem permissão para cadastrar serviços.');
    });

    it('should create service when user has management role', async () => {
      const created = {
        id: 'svc-new',
        tenant_id: TENANT_ID,
        name: 'Nova',
        category: null,
        price: 80,
        duration_minutes: 45,
        active: true,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
        deleted_at: null,
      };

      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'admin' },
          servicesResult: { data: created, error: null },
        })
      );

      const result = await createServiceAction({ name: 'Nova', price: 80, durationMinutes: 45 });

            expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Nova');
        expect(result.data.tenantId).toBe(TENANT_ID);
      }
    });

    it('should return validation error for short name', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'admin' },
        })
      );

      const result = await createServiceAction({ name: 'A', price: 50, durationMinutes: 30 });

      expect(result.success).toBe(false);
      expect(getError(result)).toContain('mínimo 2');
    });
  });

  describe('updateServiceAction', () => {
    it('should return RBAC error for non-management role', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'professional' },
        })
      );

      const result = await updateServiceAction({ id: ANY_UUID, name: 'Atualizado' });

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você não tem permissão para editar serviços.');
    });

    it('should update service when user has management role', async () => {
      const updated = {
        id: 'svc-1',
        tenant_id: TENANT_ID,
        name: 'Nome Atualizado',
        category: 'Cabelo',
        price: 95,
        duration_minutes: 60,
        active: false,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-02T00:00:00Z',
        deleted_at: null,
      };

      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'manager' },
          servicesResult: { data: updated, error: null },
        })
      );

      const result = await updateServiceAction({ id: ANY_UUID, name: 'Nome Atualizado', price: 95, durationMinutes: 60, active: false });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Nome Atualizado');
        expect(result.data.active).toBe(false);
      }
    });
  });

  describe('deleteServiceAction', () => {
    it('should return RBAC error for manager role (only owner/admin)', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'manager' },
        })
      );

      const result = await deleteServiceAction(ANY_UUID);

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você não tem permissão para remover serviços.');
    });

    it('should allow delete for admin role', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'admin' },
          servicesResult: { data: null, error: null },
        })
      );

      const result = await deleteServiceAction(ANY_UUID);

      expect(result.success).toBe(true);
    });
  });
});
