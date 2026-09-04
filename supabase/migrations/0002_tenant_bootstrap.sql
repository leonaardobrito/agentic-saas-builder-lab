-- 0002_tenant_bootstrap.sql
-- Atomic creation of tenant + initial membership (owner)
-- This function runs with elevated privileges (SECURITY DEFINER) to bypass RLS
-- only for this specific, auditable bootstrap operation.

CREATE OR REPLACE FUNCTION public.create_tenant_with_owner(
  p_tenant_name text,
  p_user_id uuid
)
RETURNS TABLE(tenant_id uuid, tenant_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- 1. Security validation: the user_id must match the authenticated session
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'User ID does not match authenticated session';
  END IF;

  -- 2. Business validation: tenant name cannot be empty
  IF trim(p_tenant_name) = '' THEN
    RAISE EXCEPTION 'Tenant name cannot be empty';
  END IF;

  -- 3. Insert tenant
  -- Note: no UNIQUE constraint on tenants.name in the current schema,
  -- so ON CONFLICT cannot be used. Uniqueness is enforced at the
  -- application layer (use-case validation).
  INSERT INTO tenants (name)
  VALUES (p_tenant_name)
  RETURNING id INTO v_tenant_id;

  -- 4. Insert membership with owner role
  INSERT INTO memberships (user_id, tenant_id, role, is_active)
  VALUES (p_user_id, v_tenant_id, 'owner', true);

  -- 5. Return
  RETURN QUERY SELECT v_tenant_id, p_tenant_name;
END;
$$;

-- Revoke execute permission from public and grant only to authenticated users
REVOKE EXECUTE ON FUNCTION public.create_tenant_with_owner FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_tenant_with_owner TO authenticated;

-- Documentation comment
COMMENT ON FUNCTION public.create_tenant_with_owner IS
  'Atomic creation of tenant and initial owner membership.
   Runs with SECURITY DEFINER to bypass RLS during bootstrap, but validates
   that the passed user_id matches the authenticated session.';
