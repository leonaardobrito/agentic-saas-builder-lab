/**
 * Professional feature — Server Action unit tests (mocked Supabase).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import {
  createProfessionalAction,
  listProfessionalsAction,
  updateProfessionalAction,
  deleteProfessionalAction,
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
  // The real Supabase builder is thenable — allow `await chain`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

function buildMockSupabase(overrides: {
  user?: { id: string } | null;
  membership?: { tenant_id: string; role: string };
  professionalsResult?: MockResult;
}) {
  const chain = createMockChain(
    overrides.professionalsResult ?? { data: null, error: null }
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

describe('Professional Actions (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listProfessionalsAction', () => {
    it('should return error when unauthenticated', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({ user: null })
      );

      const result = await listProfessionalsAction();

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você precisa estar autenticado.');
    });

    it('should return error when user has no active membership', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: undefined,
        })
      );

      const result = await listProfessionalsAction();

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você precisa estar autenticado.');
    });

    it('should return list when authenticated with active membership', async () => {
      const mockProfessionals = [
        {
          id: 'prof-1',
          tenant_id: TENANT_ID,
          name: 'João',
          user_id: null,
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
          professionalsResult: { data: mockProfessionals, error: null },
        })
      );

      const result = await listProfessionalsAction();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('João');
        expect(result.data[0].tenantId).toBe(TENANT_ID);
      }
        });
  });

  describe('createProfessionalAction', () => {
    it('should return validation error for invalid input', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'admin' },
        })
      );

      const result = await createProfessionalAction({ name: 'A' });

      expect(result.success).toBe(false);
      expect(getError(result)).toContain('mínimo 2');
    });

    it('should return error when unauthenticated', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({ user: null })
      );

      const result = await createProfessionalAction({ name: 'João' });

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você precisa estar autenticado.');
    });

    it('should return RBAC error for non-management role', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'professional' },
        })
      );

      const result = await createProfessionalAction({ name: 'Novo Profissional' });

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você não tem permissão para cadastrar profissionais.');
    });

    it('should create professional when user has management role', async () => {
      const created = {
        id: 'prof-new',
        tenant_id: TENANT_ID,
        name: 'Novo Profissional',
        user_id: null,
        active: true,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
        deleted_at: null,
      };

      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'admin' },
          professionalsResult: { data: created, error: null },
        })
      );

      const result = await createProfessionalAction({ name: 'Novo Profissional' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Novo Profissional');
        expect(result.data.tenantId).toBe(TENANT_ID);
      }
    });
  });

  describe('updateProfessionalAction', () => {
    it('should return RBAC error for non-management role', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'professional' },
        })
      );

      const result = await updateProfessionalAction({
        id: ANY_UUID,
        name: 'Nome Atualizado',
      });

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você não tem permissão para editar profissionais.');
    });

    it('should update professional when user has management role', async () => {
      const updated = {
        id: 'prof-1',
        tenant_id: TENANT_ID,
        name: 'Nome Atualizado',
        user_id: null,
        active: false,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-02T00:00:00Z',
        deleted_at: null,
      };

      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'manager' },
          professionalsResult: { data: updated, error: null },
        })
      );

      const result = await updateProfessionalAction({
        id: ANY_UUID,
        name: 'Nome Atualizado',
        active: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Nome Atualizado');
        expect(result.data.active).toBe(false);
      }
    });
  });

  describe('deleteProfessionalAction', () => {
    it('should return RBAC error for non-management role', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'professional' },
        })
      );

      const result = await deleteProfessionalAction(ANY_UUID);

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você não tem permissão para remover profissionais.');
    });

    it('should deny delete for manager role (only owner/admin)', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'manager' },
        })
      );

      const result = await deleteProfessionalAction(ANY_UUID);

      expect(result.success).toBe(false);
      expect(getError(result)).toBe('Você não tem permissão para remover profissionais.');
    });

    it('should allow delete for admin role', async () => {
      vi.mocked(createServerClient).mockResolvedValue(
        buildMockSupabase({
          user: { id: USER_ID },
          membership: { tenant_id: TENANT_ID, role: 'admin' },
          professionalsResult: { data: null, error: null },
        })
      );

      const result = await deleteProfessionalAction(ANY_UUID);

      expect(result.success).toBe(true);
    });
  });
});
