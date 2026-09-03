# Security Baseline — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salons & Aesthetic Centers
**Authority:** Mandatory security policies and controls

---

## 0. How Agents Must Use This Document

This document defines the **minimum security controls, policies, and practices** that must be applied to every component of the StyleFlow platform.

It is a source of truth for security requirements.

### Authority Rules

- `security-baseline.md` defines **what security controls are mandatory**.
- `multi-tenancy.md` defines **tenant isolation requirements**.
- `business-rules.md` defines **security-related business rules (BR-SEC-*)**.
- `architecture.md` defines **how security layers are implemented**.
- `domain-model.md` defines **sensitive entities (Anamnesis, FinancialEvent)**.
- `testing-strategy.md` defines **security testing requirements**.
- `definition-of-done.md` includes **security checks in the DoD**.
- ADRs define **architectural security decisions**.

### Before implementing a feature

The agent MUST:

1. Identify if the feature handles sensitive data (personal, financial, anamnesis).
2. Identify if the feature introduces new authentication or authorization logic.
3. Verify that RLS policies are created/updated for any new tenant-owned table.
4. Verify that input validation (Zod) is applied at all external boundaries.
5. Verify that secrets are **never** hardcoded, committed, or exposed in logs.
6. Verify that audit logging is applied for security-sensitive actions.
7. Add tests that prove security controls work (RLS isolation, authorization checks).

---

## 1. Authentication

### 1.1. Identity Provider

StyleFlow uses **Supabase Auth** as the primary authentication provider.

- **Free Tier:** 50,000 Monthly Active Users (MAU) are included at no cost.
- **Supported Methods:** Email/Password, Social Login (Google, Facebook, etc.), Magic Links (email).
- **Session Management:** HTTP‑only cookies managed by `@supabase/ssr`. Sessions are JWT‑based and expire after a configurable period (default: 7 days of inactivity).

### 1.2. Server‑Side Session Validation

**Critical Rule (BR-SEC-001):**

> Server Components, Server Actions, and Route Handlers **must** use `await supabase.auth.getUser()` to validate the session. `getSession()` is **not** sufficient for server‑side authorization because it does not verify the token with the Supabase Auth server.

**Example (Correct):**

```typescript
const supabase = createServerClient(/* ... */);
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Unauthorized');
```

**Example (Incorrect):**

```typescript
// ❌ Do not use getSession() on the server.
const { data: { session } } = await supabase.auth.getSession();
if (!session) throw new Error('Unauthorized');
```

### 1.3. Tenant Context

The authenticated user may belong to multiple tenants. The `tenant_id` must be obtained from the **membership** record, never from the client payload.

**Rule (BR-TEN-002):** Before any tenant‑scoped operation, verify that the user has an **active membership** (`is_active = true`) in the target tenant.

---

## 2. Authorization

### 2.1. Role‑Based Access Control (RBAC)

StyleFlow uses a **RBAC model** with the following initial roles:

| Role | Capabilities (MVP) |
| :--- | :--- |
| **owner** | Full access to all features; can manage members, billing, and settings. |
| **admin** | Full access except billing and tenant settings (e.g., can manage users, appointments, inventory). |
| **manager** | Can manage appointments, customers, services, inventory, and view financial reports (but not modify financial settings). |
| **receptionist** | Can create/view appointments, manage customers, and send messages (basic operations). |
| **professional** | Can view their own appointments, mark them as completed, and view customer notes (but not modify financial or inventory settings). |
| **financial** | Can view and manage financial records, expenses, commissions (read/write). |

**Rule (BR-TEN-003):** Every protected operation must check the user's role/capability **in addition to** tenant membership.

### 2.2. Row Level Security (RLS)

**RLS is mandatory** on all tenant‑owned tables. Policies must be:

1. **Action‑specific:** `SELECT`, `INSERT`, `UPDATE`, `DELETE` must have separate policies.
2. **Role‑aware:** Policies must check the member's role, not just `is_tenant_member()`.
3. **Restrictive by default:** Use `USING (false)` as the default policy.

**Example (Appointments SELECT):**

```sql
CREATE POLICY appointments_select_policy
ON public.appointments
FOR SELECT
USING (
  tenant_id = public.get_tenant_id_from_context()
  AND (
    EXISTS ( /* owner, admin, manager, receptionist */ )
    OR
    ( /* professional sees only their own appointments */ )
  )
);
```

**Rule (BR-TEN-003):** RLS must prevent cross‑tenant access even if application code contains a bug.

### 2.3. Object‑Level Authorization (IDOR Prevention)

Possessing an object ID (`appointment_id`, `customer_id`, etc.) must **never** grant automatic access.

**Rule (BR-SEC-003):** Before returning or modifying any object, verify:

1. The object belongs to the current tenant.
2. The authenticated user has the necessary role/capability.

**Implementation:**
- Use RLS as the ultimate enforcement.
- In application code, always include `tenant_id` in the `WHERE` clause (defense in depth).

### 2.4. Service Role Credentials

**Rule (BR-SEC-004):** The Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) must **never** be used in normal application logic (Server Actions, UI, or Route Handlers). It may only be used for:

- Database migrations.
- Background jobs that require administrative access (e.g., billing, reporting).
- Operations that have explicit human approval.

**Exception:** Background jobs that are idempotent and auditable may use the service role, but they must still apply manual `tenant_id` filters.

---

## 3. Data Privacy

### 3.1. Sensitive Data Classification

StyleFlow handles three categories of data:

| Category | Examples | Protection |
| :--- | :--- | :--- |
| **Public** | Business name, address, schedule. | No special protection. |
| **Personal** | Customer name, phone, email, birth date. | Access controlled by RBAC; minimized in logs. |
| **Sensitive** | Anamnesis (allergies, health restrictions), CPF, financial records. | **Restricted access**; encryption at rest; never exposed in ActivityFeed; strict RBAC. |

**Rule (BR-CUS-004):** Anamnesis data must have `privacy_level = 'restricted'` and must be accessible only to roles with explicit authorization (`owner`, `admin`, `manager`, and the `professional` directly caring for the customer).

### 3.2. Data Minimization

**Rule:** Collect only the data that is necessary for the specific operation. Do not request personal or sensitive information unless it is directly required (e.g., anamnesis for chemical services only).

### 3.3. Data Retention

**Rule:** Define retention policies for each data category:
- **Personal data:** Retain for the duration of the customer relationship + 5 years (for legal/financial compliance).
- **Sensitive data (anamnesis):** Retain for as long as the customer is active + 1 year after last visit.
- **Financial records:** Retain for 5 years per Brazilian tax law (LGPD allows longer for legal compliance).

**Implementation:** Soft‑delete (`deleted_at`) for most entities, with scheduled jobs to permanently delete data after the retention period expires.

### 3.4. LGPD / GDPR Compliance

StyleFlow must comply with the Brazilian **Lei Geral de Proteção de Dados (LGPD)** and similar privacy laws (GDPR for international expansion).

**Minimum requirements:**
1. **Right to access:** Customers can request a copy of their data.
2. **Right to rectification:** Customers can correct inaccurate data.
3. **Right to deletion:** Customers can request deletion of their data (subject to legal retention requirements).
4. **Data portability:** Customers can export their data in a structured format.
5. **Consent:** For marketing communications, explicit consent is required.
6. **Data breach notification:** Notify customers and the relevant authority within 72 hours of a breach.

**Implementation:** Admin tools and APIs must support these rights.

---

## 4. Database Security

### 4.1. Row Level Security (RLS) – Enforced

**RLS is mandatory** for all tenant‑owned tables, including:
- `appointments`
- `customers`
- `professionals`
- `services`
- `products`
- `stock_movements`
- `financial_events`
- `expenses`
- `commission_rules`
- `outbox_messages`
- `activity_feed` (when implemented)

**Rule (BR-SEC-002):** RLS policies must be granular by action and role. **No policy should use `USING (true)` or `FOR ALL` without explicit role checks.**

### 4.2. Composite Foreign Keys

**Rule (BR-SEC-001):** Foreign keys referencing tenant‑owned entities **must** be composite `(tenant_id, entity_id)` to prevent cross‑tenant references at the database level.

**Example:**

```sql
ALTER TABLE public.appointments
ADD CONSTRAINT fk_appointments_customer
FOREIGN KEY (tenant_id, customer_id)
REFERENCES public.customers(tenant_id, id)
ON DELETE RESTRICT;
```

### 4.3. Database Constraints

Use PostgreSQL constraints to enforce invariants:

| Constraint | Purpose |
| :--- | :--- |
| `NOT NULL` | Prevent missing `tenant_id`. |
| `CHECK` | Validate intervals (`end_at > start_at`). |
| `UNIQUE` | Enforce uniqueness (e.g., `(tenant_id, phone)` for customers). |
| `EXCLUDE` (GiST) | Enforce scheduling conflicts (BR-APT-003). |

### 4.4. Audit Logging

**Rule (BR-SEC-003):** The `audit_logs` table must record all security‑sensitive actions, including:

- Member added/removed/role changed.
- Financial adjustments (refunds, corrections).
- Critical data changes (e.g., anamnesis edits, inventory corrections).
- Administrative actions (e.g., impersonation, tenant suspension).

**Implementation:** Use a database trigger or application‑level hook to insert audit records. Logs must include:
- `tenant_id`
- `user_id` (if applicable)
- `action` (e.g., `financial_adjustment`)
- `old_payload` (JSON)
- `new_payload` (JSON)
- `created_at`

---

## 5. API Security

### 5.1. Input Validation

**All external input is untrusted.**

- Use **Zod** to validate:
  - HTTP request bodies (Server Actions, Route Handlers).
  - Query parameters.
  - Form data.
  - Webhook payloads.
  - Environment variables (during startup).

**Rule (BR-API-001):** Reject invalid input before any business logic is executed. Do not rely on frontend validation for security.

### 5.2. Rate Limiting (Future)

**Rule:** API endpoints that are publicly exposed (e.g., webhooks, public booking pages) must implement rate limiting to prevent abuse. Use Vercel's built‑in rate limiting or a dedicated service.

**MVP:** No rate limiting for authenticated endpoints until usage patterns are established.

### 5.3. Webhook Security

- Webhooks must validate the signature of incoming requests using a shared secret.
- Webhooks must be idempotent (BR-API-002).
- Webhook payloads must be validated with Zod.

### 5.4. HTTPS

**All production traffic must use HTTPS.** Vercel provides automatic HTTPS.

---

## 6. MCP (Model Context Protocol) and Agent Security

### 6.1. Least Privilege

**Rule (BR-MCP-001):** Agents using MCP tools must operate with the **least privilege** required for the task.

- **Preferred:** Read‑only access.
- **Development/Staging:** Read/write allowed only in isolated environments.
- **Production:** Read‑only unless explicitly approved for write operations.

### 6.2. No Secrets Exposure

**Rule:** Never expose secrets (API keys, tokens, passwords, production database credentials) to agents. All secrets must be supplied via secure environment variables (`.env.local`).

### 6.3. Human Approval for Consequential Operations

**Rule (BR-MCP-002):** Consequential production actions require explicit human approval:

- Database schema changes.
- Production data deletions or mass updates.
- Modifying security boundaries.
- Changing authentication or tenant isolation logic.

---

## 7. Secrets Management

### 7.1. Environment Variables

All secrets must be stored in environment variables and loaded via `process.env`.

**Never:**
- Hardcode secrets in source code.
- Commit `.env.local` to the repository.
- Log secrets in error messages.
- Include secrets in screenshots or documentation.

### 7.2. Required Environment Variables (MVP)

| Variable | Purpose | Exposed to Client? |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. | Yes (public). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key. | Yes (public). |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key. | **No** (server only). |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | If using Auth.js, used for JWT encryption. | No. |
| `AI_PROVIDER_API_KEY` | Gemini/Claude/OpenAI API key. | No. |

### 7.3. Rotation

**Rule:** Rotate production secrets (service role keys, API keys) regularly (every 90 days recommended).

---

## 8. Logging and Observability

### 8.1. Log Sensitive Data Prohibited

**Rule (BR-LOG-001):** Never log:
- Passwords, authentication tokens, or session IDs.
- Personal data (CPF, birth date, email) unless absolutely necessary and sanitized.
- Financial data (credit card numbers, full account numbers).
- Secrets (API keys, service role keys).

**Allowed Log Fields:**
- `tenant_id`
- `user_id` (when safe and auditable)
- `request_id` (for traceability)
- `operation` (e.g., `create_appointment`)
- `duration`
- `error_category` (e.g., `validation_error`, `database_constraint`)

### 8.2. Error Handling

**Rule:** Do not expose internal details in error responses to the user.
- Return user‑friendly messages (e.g., "Invalid appointment interval").
- Log the full stack trace and internal details to the server/observability tool.
- Use Zod validation errors to map to specific user messages.

**Example:**
```typescript
try {
  // operation
} catch (error) {
  logger.error('Failed to create appointment', { error, tenantId, userId });
  return { success: false, error: 'Unable to create appointment. Please try again.' };
}
```

---

## 9. Security Testing

### 9.1. Mandatory Security Tests

| Test Type | Purpose | Tool |
| :--- | :--- | :--- |
| **RLS Isolation** | Prove Tenant A cannot access Tenant B's data. | Integration tests (Supabase local). |
| **Authorization (RBAC)** | Verify roles have correct permissions. | Integration tests. |
| **Input Validation** | Verify Zod schemas reject invalid input. | Unit tests. |
| **Concurrency** | Verify database constraints prevent race conditions. | Integration tests. |
| **Accessibility** | Verify WCAG 2.1 AA compliance. | Playwright + axe-core. |

### 9.2. Automated Security Checks

In CI (pull requests), run:
- `npm run typecheck` (prevents type‑based security issues).
- `npm run lint` (catches `any` and potential security anti‑patterns).
- `npm run test:ci` (unit + integration includes RLS tests).
- `npm run test:e2e` (verifies user‑facing security flows, e.g., unauthorized access attempts result in 403).

### 9.3. Manual Security Review

For high‑risk features (financial, authentication, tenant management), a manual security review is required before deployment.

**Review Checklist:**
- [ ] Are all inputs validated with Zod?
- [ ] Are all protected endpoints authenticated?
- [ ] Are all protected endpoints authorized (RBAC)?
- [ ] Does RLS prevent cross‑tenant access?
- [ ] Are composite FKs used for tenant‑owned references?
- [ ] Are secrets stored in environment variables?
- [ ] Are logs free of personal/sensitive data?
- [ ] Is idempotency implemented for retry‑sensitive operations (payments, webhooks)?

---

## 10. Incident Response

### 10.1. Security Incident Handling

| Phase | Action |
| :--- | :--- |
| **1. Detect** | Monitor logs and alerts for suspicious activity (e.g., failed login attempts, unauthorized access attempts). |
| **2. Contain** | Revoke access, isolate the affected tenant, or disable the compromised account. |
| **3. Eradicate** | Investigate the root cause and fix the vulnerability. |
| **4. Recover** | Restore normal operations, verify security controls. |
| **5. Notify** | If personal data is breached, notify affected customers and the relevant authorities (ANPD) within 72 hours (LGPD). |
| **6. Document** | Record the incident in `memory/` and update controls to prevent recurrence. |

### 10.2. Disaster Recovery

- **Database backups:** Supabase performs automated backups. For added safety, schedule periodic exports.
- **Secrets rotation:** In the event of a breach, immediately rotate all secrets (service role key, API keys).

---

## 11. Agent Checklist (Security)

Before completing any feature, verify:

```text
[ ] Authentication verified (supabase.auth.getUser() used on server).
[ ] Authorization verified (RBAC roles checked).
[ ] RLS policies created/updated (action‑specific, role‑aware).
[ ] Composite FKs used for tenant‑owned references.
[ ] Input validation applied (Zod at boundaries).
[ ] Sensitive data not exposed (anamnesis, financial, personal) in logs or ActivityFeed.
[ ] Idempotency implemented for retry‑sensitive operations.
[ ] No secrets hardcoded, committed, or exposed.
[ ] Audit logging added for security‑sensitive actions.
[ ] Security tests written (RLS isolation, RBAC, concurrency).
[ ] Manual security review completed for high‑risk features.
[ ] Incident response plan documented (if applicable).
```

---

## 12. Traceability

| Concern                 | Canonical Document                      |
| ----------------------- | --------------------------------------- |
| Authentication          | `supabase-auth.md` / `multi-tenancy.md` |
| Authorization (RBAC)    | `multi-tenancy.md` (Section 2)          |
| RLS Policies            | `multi-tenancy.md` (Section 4.3)        |
| Composite FKs           | `multi-tenancy.md` (Section 4.2)        |
| Input Validation        | `architecture.md` (Section 5)           |
| Data Privacy (LGPD)     | `domain-model.md` (Anamnesis)           |
| Security Business Rules | `business-rules.md` (BR-SEC-*)          |
| Security Testing        | `testing-strategy.md` (Integration/E2E) |
| Done Criteria           | `definition-of-done.md` (Security items)|

---

## 13. Final Security Contract

StyleFlow's security baseline guarantees:

- **Authentication** is required for every protected operation.
- **Authorization** is enforced via RBAC and RLS.
- **Tenant isolation** is absolute (no cross‑tenant data access).
- **Input validation** is applied at all external boundaries.
- **Sensitive data** is protected and minimized.
- **Auditability** is provided for security‑sensitive actions.
- **Agents** operate with least privilege and human approval for consequential actions.

Any deviation from these controls must be documented as a **superseding ADR** and approved by the project lead.