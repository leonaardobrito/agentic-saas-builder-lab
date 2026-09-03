/**
 * Server-side authentication & tenant-context helpers.
 *
 * CRITICAL (AGENTS.md §3.2.2, §3.2.4):
 *   - The `tenant_id` is ALWAYS derived from the authenticated user's session,
 *     never from client-supplied payload.
 *   - Authorization uses `await supabase.auth.getUser()` (never `getSession()`).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

/** Roles permitted to manage (create/update) catalog & scheduling entities. */
export const MANAGEMENT_ROLES = ['owner', 'admin', 'manager'] as const;

/** Roles permitted to permanently remove entities (hard delete). */
export const DELETE_ROLES = ['owner', 'admin'] as const;

/** Roles permitted to soft-delete (deactivate) entities. */
export const ARCHIVE_ROLES = ['owner', 'admin', 'manager'] as const;

/** Roles that can view tenant-scoped data (RLS already enforces this at DB level). */
export const MEMBER_ROLES = [
  'owner',
  'admin',
  'manager',
  'receptionist',
  'professional',
  'financial',
] as const;

export type TenantRole = (typeof MEMBER_ROLES)[number];

/** Result of resolving the current authenticated tenant context. */
export interface TenantContext {
  userId: string;
  tenantId: string;
  role: string;
}

/**
 * Resolves the tenant context for the authenticated user.
 *
 * The user MUST:
 *   1. Be authenticated (have a valid session).
 *   2. Have at least one active membership.
 *
 * @returns The tenant context, or `null` when the user is unauthenticated
 *          or has no active membership.
 */
export async function getTenantContext(
  supabase: SupabaseClient
): Promise<TenantContext | null> {
  const { data } = await supabase.auth.getUser();

  const user = data?.user;
  if (!user?.id) {
    return null;
  }

  const { data: membership, error } = await supabase
    .from('memberships')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !membership) {
    return null;
  }

  return {
    userId: user.id,
    tenantId: membership.tenant_id as string,
    role: membership.role as string,
  };
}

/**
 * Asserts that the caller is an authenticated tenant member.
 *
 * @throws when the user cannot be resolved to a tenant context.
 */
export async function requireTenantContext(
  supabase: SupabaseClient
): Promise<TenantContext> {
  const ctx = await getTenantContext(supabase);
  if (!ctx) {
    throw new Error('UNAUTHORIZED');
  }
  return ctx;
}

/**
 * Verifies that the user's role is within the allowed set.
 *
 * @returns `true` when authorized, `false` otherwise.
 */
export function hasRole(
  role: string,
  allowedRoles: readonly string[]
): boolean {
  return allowedRoles.includes(role);
}
