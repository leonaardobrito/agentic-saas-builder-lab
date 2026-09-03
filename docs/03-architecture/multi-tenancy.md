# Multi-Tenancy — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salons & Aesthetic Centers
**Authority:** Canonical multi‑tenancy strategy

---

## 0. How Agents Must Use This Document

This document defines the **non‑negotiable multi‑tenancy strategy, isolation layers, database enforcement, and tenant‑context propagation** for the StyleFlow platform.

It is a source of truth for implementation.

### Authority Rules

- `multi-tenancy.md` defines **how tenant isolation is achieved**.
- `domain-model.md` defines **which entities are tenant‑owned**.
- `business-rules.md` defines **behavioral invariants (BR-TEN-*)**.
- `architecture.md` defines **how layers communicate**.
- `security-baseline.md` defines **security requirements**.
- ADRs define **architectural decisions**.

### Before implementing a feature

The agent MUST:

1. Verify that every new entity contains a `tenant_id` column.
2. Verify that composite foreign keys include `tenant_id` for cross‑entity references.
3. Verify that RLS policies are action‑specific and role‑aware.
4. Ensure that `tenant_id` is never accepted from the client payload for authorization decisions.
5. Ensure that background jobs receive `tenant_id` explicitly (never infer from a global variable).
6. Add isolation tests that prove Tenant A cannot access Tenant B’s data.
7. Verify that `ActivityFeed` (future) respects `tenant_id` isolation.

---

## 1. Definition & Goals

### 1.1 What Is a Tenant?

A **Tenant** is an isolated customer organization within the SaaS.

In the first vertical (Beauty), the Tenant represents a **salon, aesthetic center, or beauty business**.

Each Tenant is assigned a unique `tenant_id` (UUID) that is immutable and stable.

### 1.2 Why Multi-Tenancy?

- **Security:** Data from one organization must never leak to another.
- **Compliance:** LGPD/GDPR requires that customer data is segmented and individually manageable.
- **Operational Clarity:** Each business operates independently with its own settings, users, and data.
- **Scalability:** The architecture must support thousands of isolated tenants without performance degradation.

### 1.3 Core Principles

1. **`tenant_id` is mandatory** on every operational entity.
2. **`tenant_id` is never optional** in queries that affect business data.
3. **Defense in depth**: Isolation is enforced at multiple layers (DB, Application, UI).
4. **Least privilege**: A user can only access data belonging to the tenant(s) where they have an active membership.
5. **Trust the database**: RLS and database constraints are the ultimate authority; application logic can never bypass them.

---

## 2. Tenant Identification

### 2.1 Where Does `tenant_id` Come From?

The `tenant_id` is **always derived from the authenticated user's session**.

| Layer | How `tenant_id` is Obtained |
| :--- | :--- |
| **Server Action** | `session.user.tenant_id` (from `supabase.auth.getUser()`). |
| **Server Component** | `session.user.tenant_id` (from `supabase.auth.getUser()`). |
| **Route Handler (API)** | Extracted from the JWT token or session cookie. |
| **Background Job** | Passed explicitly as a parameter when the job is enqueued. |
| **UI Client** | The client has **no** authority over `tenant_id`; it merely displays data filtered by the server. |
| **MCP (Agent)** | Must use the tenant context of the user who authorized the agent session. |

**Regra de Ouro (Critical Rule):** 

> The client must **never** be able to influence or change the `tenant_id` that the server uses for authorization. This is the primary defense against IDOR/BOLA attacks.

### 2.2 Multi‑Tenant Users

A single user can belong to **multiple tenants** (e.g., a manager of a franchise group).

**Implementation:**
- The user's session does **not** contain a single `tenant_id`.
- Instead, the session contains a list of tenants the user has active memberships for.
- The UI presents a tenant selector (dropdown) to the user.
- Once selected, the frontend sends the chosen `tenant_id` as part of the request context (e.g., in a header or hidden field).
- **The server must validate** that the requested `tenant_id` matches an active membership for that user, **before** executing any operation.

---

## 3. Defense‑in‑Depth: Six Layers of Isolation

Multi‑tenancy is enforced in **six layers**, from the user down to the database.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 1: AUTHENTICATION                             │
│  User must be logged in (Supabase Auth). Identity is verified.        │
│  This layer confirms: "Who is making the request?"                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 2: AUTHORIZATION                              │
│  User must have an active membership in the target tenant.            │
│  This layer confirms: "Is this user allowed to access this tenant?"   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 3: APPLICATION CONTEXT                        │
│  Server Actions/Use Cases receive the `tenant_id` from the session.   │
│  This layer confirms: "What tenant is the operation scoped to?"       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 4: REPOSITORY / DOMAIN                        │
│  All repository queries include `tenant_id` in the WHERE clause.      │
│  This layer confirms: "The data being queried belongs to this tenant."│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 5: DATABASE (RLS & CONSTRAINTS)              │
│  PostgreSQL RLS policies enforce that only rows with the correct      │
│  `tenant_id` are visible. Composite FKs prevent cross-tenant refs.   │
│  This layer is the **ultimate authority** and cannot be bypassed.     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 6: UI (USER EXPERIENCE)                       │
│  The UI displays only data scoped to the selected tenant.             │
│  This is for UX only and is **NOT** a security boundary.              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Database Implementation

### 4.1 Mandatory Column

Every operational table **must** have:

```sql
tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE
```

**Exceptions:**
- `tenants` table itself (it is the source of truth).
- `users` table (managed by Supabase Auth; not tenant-scoped).
- `audit_logs` (may have tenant_id for filtering, but may also contain platform-level logs).

### 4.2 Composite Foreign Keys (Non‑negotiable)

**Rationale:** A simple `FOREIGN KEY (professional_id)` does not prevent an appointment from referencing a professional from a **different** tenant. Composite FKs guarantee tenant consistency at the database level.

**Example (Appointments → Professionals):**

```sql
-- Correct: Composite FK
ALTER TABLE public.appointments
ADD CONSTRAINT fk_appointments_professional
FOREIGN KEY (tenant_id, professional_id)
REFERENCES public.professionals(tenant_id, id)
ON DELETE RESTRICT;

-- Incorrect: Simple FK (ALLOWS CROSS-TENANT REFERENCING)
ALTER TABLE public.appointments
ADD CONSTRAINT fk_appointments_professional
FOREIGN KEY (professional_id)
REFERENCES public.professionals(id)
ON DELETE RESTRICT;
```

**Rule:** Every reference from one tenant-owned table to another must use a composite `(tenant_id, entity_id)` foreign key.

**List of composite FKs required:**
- `appointments` → `customers`: `(tenant_id, customer_id)`
- `appointments` → `professionals`: `(tenant_id, professional_id)`
- `appointment_items` → `appointments`: `(tenant_id, appointment_id)`
- `appointment_consumptions` → `appointments`: `(tenant_id, appointment_id)`
- `appointment_consumptions` → `products`: `(tenant_id, product_id)`
- `stock_movements` → `products`: `(tenant_id, product_id)`
- `financial_events` → `appointments`: `(tenant_id, appointment_id)` (if origin is appointment)
- `outbox_messages` → `tenants`: `(tenant_id)` (simple, but tenant-scoped)

### 4.3 Row Level Security (RLS) Policies

**RLS is mandatory** on all tenant-owned tables.

**Policy Design Principles:**
- **Action‑specific:** Separate policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- **Role‑aware:** Policies must ch# Testing Strategy

## Unit

Pure domain/application rules:
- validation;
- scheduling;
- pricing calculations;
- state transitions;
- inventory rules.

## Integration

Database, RLS, transactions, constraints and provider adapters.

## E2E

Critical user workflows such as:
- authentication;
- creating an appointment;
- preventing conflicting appointments;
- completing an appointment;
- tenant isolation from a user perspective.

## Quality dimensions

Test as applicable:
- accessibility;
- security;
- concurrency;
- performance;
- error states;
- mobile/responsive behavior.

Tests must be deterministic and must not use production data.

- **Least privilege:** If a role should not perform an action, the policy must return `false`.

#### 4.3.1 Helper Function: `get_tenant_id_from_context()`

To simplify RLS, use a session variable set by the middleware:

```sql
CREATE OR REPLACE FUNCTION public.get_tenant_id_from_context()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_tenant', TRUE), ''),
    (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid() AND is_active = TRUE LIMIT 1)
  )::UUID;
$$;
```

#### 4.3.2 Example Policy: Appointments SELECT

```sql
-- Receptionist, Manager, Admin, Owner can see all appointments for their tenant.
-- Professional can see only their own appointments.

CREATE POLICY appointments_select_policy
ON public.appointments
FOR SELECT
USING (
  tenant_id = public.get_tenant_id_from_context()
  AND (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.tenant_id = appointments.tenant_id
        AND m.user_id = auth.uid()
        AND m.is_active = TRUE
        AND m.role IN ('owner', 'admin', 'manager', 'receptionist')
    )
    OR
    -- Professionals can see only appointments where they are the professional
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.professionals p ON p.tenant_id = appointments.tenant_id AND p.user_id = auth.uid()
      WHERE m.tenant_id = appointments.tenant_id
        AND m.user_id = auth.uid()
        AND m.is_active = TRUE
        AND m.role = 'professional'
        AND appointments.professional_id = p.id
    )
  )
);
```

#### 4.3.3 Example Policy: Appointments INSERT

```sql
-- Only professionals, manager, admin, owner can create appointments.
-- Receptionist can also create appointments (by default).

CREATE POLICY appointments_insert_policy
ON public.appointments
FOR INSERT
WITH CHECK (
  tenant_id = public.get_tenant_id_from_context()
  AND EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.tenant_id = tenant_id
      AND m.user_id = auth.uid()
      AND m.is_active = TRUE
      AND m.role IN ('owner', 'admin', 'manager', 'receptionist', 'professional')
  )
  AND -- Ensure the professional belongs to the same tenant (prevent cross-tenant professional reference)
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.tenant_id = tenant_id
      AND p.id = professional_id
      AND p.active = TRUE
  )
);
```

### 4.4 Tenant Scoping in Indexes

All indexes should include `tenant_id` as the leading column to optimize tenant-scoped queries.

**Example:**

```sql
CREATE INDEX idx_appointments_tenant_professional_start
ON public.appointments (tenant_id, professional_id, start_at DESC);

CREATE INDEX idx_products_tenant_name
ON public.products (tenant_id, name);
```

---

## 5. Tenant Context Propagation

### 5.1 Middleware (Next.js)

The Next.js middleware must:
1. Extract the user's session from the cookie.
2. Determine the tenant context (if a tenant is selected).
3. Set the `app.current_tenant` PostgreSQL session variable for subsequent RLS policies.

**Implementation (Conceptual):**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  // Allow RLS to access tenant_id by setting a local variable in the Supabase session
  // This is often achieved by calling an RPC or setting a Postgres configuration parameter
  // For simplicity, we can use a supabase client with the tenant_id injected in the context.

  // If a tenant is selected in the session, we store it.
  const tenantId = request.cookies.get('app_selected_tenant')?.value;

  // Continue
  return NextResponse.next();
}
```

### 5.2 Server Actions

**Rule:** Always extract `tenant_id` from the session (or from the validated membership list). **Never** accept `tenant_id` from the client as a parameter for authorization.

```typescript
// ✅ Correct
export async function createAppointmentAction(input: CreateAppointmentInput) {
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  // Ensure the user has a valid membership for the tenant
  const membership = await getMembershipForUser(user.id, input.tenantId);
  if (!membership || !membership.is_active) {
    throw new Error('Unauthorized');
  }

  // Proceed with use case
  const useCase = new CreateAppointment(/* ... */);
  return useCase.execute({ ...input, tenantId: input.tenantId });
}

// ❌ INCORRECT: Accepting tenant_id from client without checking membership
export async function createAppointmentAction(input: { tenantId: string, ... }) {
  // Danger! TenantId from client is not trusted.
}
```

### 5.3 Background Jobs

Background jobs (cron, queues) must receive `tenant_id` explicitly as part of the job payload.

```typescript
// Enqueue job
await queue.enqueue('send_reminders', {
  tenantId: appointment.tenant_id,
  appointmentId: appointment.id,
});

// Job handler
async function handleReminderJob(payload: { tenantId: string, appointmentId: string }) {
  const supabase = createServerClient(/* service role for background jobs */);
  // The service role bypasses RLS, so we MUST filter queries manually.
  const appointment = await supabase
    .from('appointments')
    .select('*')
    .eq('id', payload.appointmentId)
    .eq('tenant_id', payload.tenantId)  // Manual filter, because RLS is bypassed
    .single();
}
```

---

## 6. Cross-Tenant Prohibitions

### BR-TEN-004 (from `business-rules.md`)

**The application must never rely solely on:**

```sql
WHERE tenant_id = ?
```

as the only authorization check. Application logic must also verify role/capability.

### Prohibited Practices

| Practice | Why It's Prohibited |
| :--- | :--- |
| Using a service role key to skip RLS in normal application code. | Skips all tenant isolation, creating a massive security hole. |
| Accepting `tenant_id` from the client for authorization checks. | Clients can forge tenant IDs and access data they shouldn't. |
| Querying across tables without `tenant_id` in the `WHERE` clause. | May inadvertently join across tenants. |
| Caching tenant data in global variables. | Could be returned to the wrong user. |

---

## 7. Testing Multi-Tenancy

### 7.1 Unit Tests (Repository Layer)

Test that repositories always apply a `tenant_id` filter.

**Example (Vitest):**

```typescript
it('should only return appointments for the correct tenant', async () => {
  const tenantAId = 'tenant-a';
  const tenantBId = 'tenant-b';

  await insertTestData(tenantAId);
  await insertTestData(tenantBId);

  const repo = new SupabaseAppointmentRepository();
  const resultA = await repo.findAll(tenantAId);
  const resultB = await repo.findAll(tenantBId);

  expect(resultA.every(a => a.tenant_id === tenantAId)).toBe(true);
  expect(resultB.every(a => a.tenant_id === tenantBId)).toBe(true);
});
```

### 7.2 Integration Tests (RLS)

Test that RLS prevents cross‑tenant access even with raw SQL.

**Example (Supabase local):**

```typescript
it('should enforce RLS for cross-tenant SELECT', async () => {
  const userA = await createUser('user-a@example.com');
  const tenantA = await createTenant('Salon A', userA.id);

  const userB = await createUser('user-b@example.com');
  const tenantB = await createTenant('Salon B', userB.id);

  // Insert appointment for Tenant A
  await insertAppointment(tenantA.id, /* ... */);

  // Simulate userB trying to access Tenant A data
  const result = await supabase
    .from('appointments')
    .select('*')
    .eq('tenant_id', tenantA.id)
    .auth(userB.id); // RLS should return empty

  expect(result.data).toHaveLength(0);
});
```

### 7.3 E2E Tests (User Journeys)

Simulate the full user journey:

- Login as User A → Create appointment → Logout.
- Login as User B → Try to view User A's appointment → Should see empty list or receive 403.

---

## 8. Agent Rules for Multi-Tenancy

### Rule 1: Never Bypass RLS

Agents **must not** use the `SUPABASE_SERVICE_ROLE_KEY` to read or mutate data just because it's easier for development.

**Exception:** Background jobs and migrations that explicitly require service role access, but these must be documented in an ADR.

### Rule 2: Always Include `tenant_id` in Queries

Even when using RLS, always include the `tenant_id` in the `WHERE` clause as a best practice.

### Rule 3: Validate Membership Before Any Operation

Before executing a use case, ensure the current user has an active membership in the target tenant.

### Rule 4: Test Tenant Isolation for Every New Entity

For every new table or repository method, write an isolation test (as described above) that proves cross‑tenant data is inaccessible.

### Rule 5: Log Tenant Context in Observability

All logs, errors, and metrics should include `tenant_id` (when available) to allow debugging and tenant‑level analysis.

---

## 9. Performance Considerations

### Indexes

- **Always** create indexes with `tenant_id` as the leading column.
- **Example:** `CREATE INDEX idx_appointments_tenant_start ON appointments (tenant_id, start_at);`

### Partitioning (Future)

For very large tenants (> 1 million rows), consider **PostgreSQL partitioning** by `tenant_id` or `date`. However, this is not needed for the MVP and should be introduced only when measurements prove a performance bottleneck.

### Connection Pooling

- Supabase provides connection pooling. Use the pooled connection (`supabase.co/v1`) for production to avoid connection exhaustion.

---

## 10. Traceability

| Concern                     | Canonical Document                      |
| --------------------------- | --------------------------------------- |
| Tenant entities             | `domain-model.md` (SaaS Core)           |
| Tenant business rules       | `business-rules.md` (BR-TEN-*)          |
| Tenant architecture         | `architecture.md` (Multi-Tenancy Integration) |
| Security (RLS, isolation)   | `security-baseline.md`                  |
| API security (IDOR/BOLA)    | `api-guidelines.md`                     |
| Testing isolation           | `testing-strategy.md` (Integration/E2E) |

---

## 11. Final Multi-Tenancy Contract

StyleFlow's multi‑tenancy guarantees:

1. **Absolute data isolation:** No tenant can access another tenant's data.
2. **Layered security:** RLS is the ultimate fallback; application logic is the first line.
3. **Contextual transparency:** Every operation has a known `tenant_id` context.
4. **Tested isolation:** Every release includes tests verifying cross‑tenant barriers.
5. **No shortcuts:** Privileged credentials are never used to bypass isolation in normal application flow.

Any deviation from this contract requires a documented and approved ADR that explicitly overrides these rules.

---