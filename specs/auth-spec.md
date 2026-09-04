# Authentication Specification — StyleFlow SaaS

**Status:** DRAFT  
**Version:** 1.0  
**Date:** 2026-09-03  
**Scope:** MVP — Beauty / Salons & Aesthetic Centers  
**Author:** StyleFlow Team  
**Related Docs:**  
- `docs/08-security/security-baseline.md`  
- `docs/05-api/api-guidelines.md`  
- `docs/02-domain/domain-model.md` (SaaS Core)  
- `docs/01-product/mvp.md`  
- `AGENTS.md`  

---

## 1. Objective

Implement a secure, multi‑tenant authentication system for StyleFlow that enables:

- User registration (sign‑up) with automatic tenant creation.
- User login and logout.
- Session management via HTTP‑only cookies (`@supabase/ssr`).
- Role‑based access control (RBAC) for tenant scoped operations.
- Middleware to protect dashboard routes.

---

## 2. User Flows

### 2.1. Sign‑Up (Registration)

**Entry point:** `app/(auth)/register/page.tsx`  
**Server Action:** `features/auth/actions/sign-up.action.ts`

**Flow:**

1. User submits: `email`, `password`, `fullName`, `cpf` (optional), `tenantName`.
2. Validate input with Zod.
3. Create user in Supabase Auth (`supabase.auth.signUp`).
4. Create tenant record in `public.tenants` with `name = tenantName`.
5. Create membership record in `public.memberships`:
   - `tenant_id` = new tenant's ID.
   - `user_id` = new user's ID.
   - `role = 'owner'`.
   - `is_active = true`.
6. Return session or redirect to dashboard.

**Validation rules:**

| Field | Rule |
| :--- | :--- |
| `email` | Required, valid email format. |
| `password` | Required, min 6 characters. |
| `fullName` | Required, min 2 characters. |
| `cpf` | Optional, if provided must be 11 digits (validated by Zod). |
| `tenantName` | Required, min 2 characters. |

**Error handling:**

- `email already registered` → `"Este e-mail já está cadastrado."`
- `tenant name already taken` → `"Este nome de salão já está em uso."`
- `database error` → `"Erro ao criar sua conta. Tente novamente."`

---

### 2.2. Sign‑In (Login)

**Entry point:** `app/(auth)/login/page.tsx`  
**Server Action:** `features/auth/actions/sign-in.action.ts`

**Flow:**

1. User submits: `email`, `password`.
2. Validate with Zod.
3. Call `supabase.auth.signInWithPassword`.
4. On success, redirect to `/app/dashboard`.
5. On failure, show user‑friendly error.

**Validation rules:**

| Field | Rule |
| :--- | :--- |
| `email` | Required, valid email. |
| `password` | Required, min 6 characters. |

**Error handling:**

- `Invalid login credentials` → `"E‑mail ou senha incorretos."`
- `Email not confirmed` → `"Confirme seu e‑mail antes de fazer login."`

---

### 2.3. Sign‑Out (Logout)

**Entry point:** Anywhere in dashboard (button)  
**Server Action:** `features/auth/actions/sign-out.action.ts`

**Flow:**

1. Call `supabase.auth.signOut`.
2. Clear session cookies.
3. Redirect to `/login`.

---

## 3. Role‑Based Access Control (RBAC)

### 3.1. Roles

| Role | Capabilities |
| :--- | :--- |
| `owner` | Full access to all features; can manage members, billing, settings. |
| `admin` | Full access except billing and tenant settings. |
| `manager` | Manage appointments, customers, services, inventory; view finance. |
| `receptionist` | Create/view appointments, manage customers, send messages. |
| `professional` | View own appointments, mark completed, view customer notes. |
| `financial` | View and manage financial records, expenses, commissions. |

### 3.2. Enforcement

- **RLS:** Policies check `has_role(tenant_id, role)`.
- **Server Actions:** Check role before executing sensitive operations.
- **UI:** Hide/show elements based on role.

---

## 4. Middleware

**File:** `middleware.ts` (root)

**Rules:**

- Public routes: `/login`, `/register`, `/api/auth/*`.
- Protected routes: all routes under `/app/*` (dashboard).
- **If unauthenticated** → redirect to `/login`.
- **If authenticated** → continue and refresh session cookies.

**Implementation details:**

- Use `@supabase/ssr` with `createServerClient`.
- Use `cookies()` from Next.js to manage session.
- Set `app.current_tenant` via cookie for RLS (optional, can be handled by `get_tenant_id_from_context` function in DB).

---

## 5. Supabase Client Setup

- **Client Component:** `lib/supabase/client.ts` — uses `createBrowserClient`.
- **Server Component / Action:** `lib/supabase/server.ts` — uses `createServerClient` with cookie management.
- **Middleware:** `lib/supabase/middleware.ts` — handles cookie refresh.

---

## 6. Environment Variables

| Variable | Purpose | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `http://localhost:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | For migrations and background jobs (server‑side only) | `eyJhbGci...` |

---

## 7. Testing Requirements

**Unit tests (Vitest):**

- [ ] Validation of Zod schemas (sign‑up, sign‑in).
- [ ] Error handling in use cases.

**Integration tests (Vitest + Supabase local):**

- [ ] Sign‑up creates user, tenant, membership.
- [ ] Sign‑in returns valid session.
- [ ] RLS: user can only access their own tenant.
- [ ] Middleware redirects unauthenticated users.

**E2E tests (Playwright):**

- [ ] Full sign‑up → login → dashboard flow.
- [ ] Attempt to access dashboard without login → redirect to login.

---

## 8. Security Considerations

- **Never accept `tenant_id` from client.** Always derive from session/membership.
- **Use `await supabase.auth.getUser()`** in server actions (not `getSession`).
- **Encrypt cookies** (already done by `@supabase/ssr`).
- **Validate all inputs with Zod.**
- **Sanitize error messages** — never expose internal details.

---

## 9. References

- `docs/08-security/security-baseline.md` — authentication and authorization rules.
- `docs/05-api/api-guidelines.md` — server action patterns.
- `docs/02-domain/domain-model.md` — Tenant, Membership, User entities.
- `docs/03-architecture/multi-tenancy.md` — tenant isolation.

---

## 10. Implementation Checklist

- [ ] `lib/supabase/client.ts`
- [ ] `lib/supabase/server.ts`
- [ ] `lib/supabase/middleware.ts`
- [ ] `middleware.ts`
- [ ] `features/auth/actions/sign-up.action.ts`
- [ ] `features/auth/actions/sign-in.action.ts`
- [ ] `features/auth/actions/sign-out.action.ts`
- [ ] `app/(auth)/register/page.tsx`
- [ ] `app/(auth)/login/page.tsx`
- [ ] `app/(dashboard)/page.tsx` (protected)
- [ ] Zod schemas in `features/auth/schemas/`
- [ ] Unit/integration tests for all actions and middleware.

---

*End of specification.*