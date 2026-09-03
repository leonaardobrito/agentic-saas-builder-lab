# AGENTS-COMPACT.md — 20 Daily Rules

**Version:** 2.0
**Updated:** 2026-09-02
**Project:** StyleFlow SaaS
**Status:** ACTIVE

---

## Read First

`AGENTS.md` is the complete contract. This summary is a **daily quick reference**. When in doubt, consult the full document.

---

## 1. Authority Hierarchy

1. Human-approved decisions (ADRs, specs, explicit comments)
2. `docs/00-project/*` (vision, problem, ICP, business model)
3. `docs/01-product/*` (product overview, mvp)
4. `specs/*` (active specifications)
5. `docs/02-domain/*` (domain model, business rules)
6. `docs/03-architecture/*` (architecture, multi-tenancy, ADRs)
7. `docs/04-design/*`, `docs/05-api/*`, `docs/06-data/*`
8. `docs/08-security/*`, `docs/09-quality/*`
9. Source code and tests
10. `docs/99-legacy/*` (historical evidence)

**When sources conflict → STOP and report the conflict. Do not silently choose.**

---

## 2. Core Principles

1. **Tenant isolation is mandatory:** Every operational entity belongs to exactly one tenant (`tenant_id`). Never rely on client-provided `tenant_id` for authorization.
2. **Professional ≠ User:** `Professional` is a domain entity that may or may not have a login (`user_id` optional).
3. **Database-enforced invariants:** Critical rules (appointment conflicts, stock non-negativity, financial immutability) must be enforced by PostgreSQL constraints (GiST, CHECK, FK, UNIQUE). Application validation alone is insufficient for concurrency-sensitive rules.
4. **Historical truth:** Service/product snapshots preserve operational history. Catalog changes must not rewrite historical appointments.
5. **Financial & stock immutability:** `FinancialEvent` and `StockMovement` are append-only. Corrections use compensating entries.
6. **External integrations are adapters:** WhatsApp, AI, payments are external boundaries. The core domain must not depend on a specific provider.
7. **AI is an assistant, not a source of authority:** AI must not override tenant isolation, permissions, conflicts, financial invariants, inventory invariants, or security policy.
8. **MCPs are privileged tools:** Least privilege, read-only by default, production writes require human approval.
9. **`agy` is optional and replaceable:** Not a project dependency or source of truth.
10. **Verify honestly:** Never claim tests, builds, migrations, or deployments succeeded unless actually executed and verified.

---

## 3. Architecture Quick Reference

- **Stack:** Next.js (App Router) + TypeScript (strict) + Tailwind + shadcn/ui + Supabase/PostgreSQL + Vitest + Playwright + Vercel.
- **Structure:** Modular monolith with Vertical Slices (`features/[domain]/`).
- **Layers:** `domain/` (entities, rules) ← `application/` (use cases) ← `presentation/` (UI, actions) → `infrastructure/` (repositories, adapters).
- **Rule:** Business logic lives in `domain/` or `application/`, **never** in `presentation/`.
- **Multi-tenancy:** Defense in depth: Auth → RBAC → Tenant context → Repository filters → Database (RLS, composite FKs) → UI (UX only).

---

## 4. TDD Workflow (Mandatory)

```text
🔴 RED → Write a failing test first (specify behavior).
🟢 GREEN → Write the minimum code to pass.
🔵 REFACTOR → Improve code without changing behavior (all tests stay green).
🔄 VERIFY → Run all relevant tests (unit, integration, E2E).
```

- **Every business rule (BR-*) must have at least one automated test.**
- **Concurrency tests** for scheduling, stock, financial events (`Promise.allSettled`).
- **Tenant isolation tests** for RLS (cross-tenant access returns zero rows).
- **Idempotency tests** for outbox, webhooks, payments.

---

## 5. Security Rules

### Authentication
- Use `await supabase.auth.getUser()` on the server (Server Actions, Components, Route Handlers).
- **Never** use `getSession()` on the server for authorization.

### Authorization
- Every protected operation verifies:
  1. Authentication (user exists)
  2. Authorization (user has active membership in the tenant)
  3. Tenant context (`tenant_id` derived from session, never from client)
  4. Input validity (Zod)

### RLS & Database
- RLS is mandatory on all tenant-owned tables.
- Policies must be action-specific (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) and role-aware.
- Composite foreign keys `(tenant_id, entity_id)` must be used for cross-entity references.

### Secrets
- **Never** hardcode, commit, log, or expose secrets (API keys, service role keys, passwords).
- Use `.env.local` for all secrets (excluded from Git).
- Service role keys only for migrations, background jobs, and approved administrative tasks.

---

## 6. Domain Entities (MVP)

| Context | Entities |
| :--- | :--- |
| **SaaS Core** | `Tenant`, `User`, `Membership`, `AuditLog` |
| **Scheduling** | `Professional`, `Service`, `Appointment`, `AppointmentItem` |
| **Customer** | `Customer`, `CustomerNote`, `Anamnesis` |
| **Catalog** | `ServiceProductDefault` |
| **Inventory** | `Product`, `StockMovement`, `AppointmentConsumption` |
| **Finance** | `FinancialEvent`, `Expense`, `CommissionRule` |
| **Communication** | `MessageTemplate`, `AutomationRule`, `OutboxMessage` |
| **Beauty** | `ColorFormula` |
| **Platform Ops** | `ActivityFeed` (future) |

---

## 7. Key Business Rules (BR-*)

| Rule | Description | Enforcement |
| :--- | :--- | :--- |
| **BR-TEN-001** | Tenant isolation | `tenant_id` in all tables, RLS, composite FKs |
| **BR-TEN-002** | Active membership required | `memberships.is_active = true` |
| **BR-TEN-003** | RBAC enforcement | Role checks in application + RLS |
| **BR-APT-003** | Appointment conflict prevention | GiST exclusion constraint (database) |
| **BR-APT-005** | Completion side effects | Atomic transaction: stock, financial, customer visit |
| **BR-FIN-001** | Financial event append-only | No update/delete on `financial_events` |
| **BR-INV-002** | Stock movement append-only | No update/delete on `stock_movements` |
| **BR-COM-002** | Idempotent outbox dispatch | `retry_count`, `status`, idempotency key |
| **BR-PLT-001** | Activity Feed non-authoritative | Feed is projection, not source of truth |
| **BR-SEC-001** | Composite FKs | `(tenant_id, entity_id)` for all references |
| **BR-SEC-003** | Object-level authorization | Never trust an object ID alone |

---

## 8. Agent Boundaries

### Agents MAY autonomously:
- Inspect files and search documentation.
- Write tests and implement scoped changes.
- Run local tests, static analysis, and lint.
- Create documentation and memory records.
- Inspect preview environments.

### Agents MUST request human approval before:
- Changing product requirements, pricing, or security boundaries.
- Making irreversible production changes (schema migrations, data deletions).
- Changing authentication architecture or tenant isolation logic.
- Introducing major infrastructure changes.
- Merging high-risk changes.
- Deploying to production.

---

## 9. Agent Handoff Format

```text
STATUS: <current state>
COMPLETED: <what was completed>
TESTS: <what was executed and results>
KNOWN ISSUES: <remaining issues>
DECISIONS: <important decisions made>
FILES CHANGED: <list of changed files>
NEXT STEP: <single recommended next action>
```

**Do not dump irrelevant conversation history.** Be concise and actionable.

---

## 10. Never Do These Things

- Invent requirements, business rules, or security policies.
- Fabricate test results or claim a deployment succeeded without verification.
- Hide errors or ignore failing tests.
- Disable security controls or RLS to make tests pass.
- Remove tests to make CI green.
- Expose secrets in logs, prompts, commits, or screenshots.
- Modify production destructively without authorization.
- Introduce microservices prematurely.
- Create unnecessary abstractions (YAGNI).
- Rewrite unrelated code or silently expand scope.
- Bypass tenant isolation for convenience.

---

## 11. Context Loading Order

Before acting, load only relevant context in this order:

1. `AGENTS.md` (this file or the full version)
2. Relevant specification (`specs/`)
3. Relevant product docs (`docs/00-project/`, `docs/01-product/`)
4. Relevant domain rules (`docs/02-domain/`)
5. Relevant architecture (`docs/03-architecture/`)
6. Relevant design/API/data docs (`docs/04-design/`, `docs/05-api/`, `docs/06-data/`)
7. Relevant source code and tests
8. Relevant memory (`memory/`)

Avoid loading the entire repository. Prefer references to canonical files.

---

## 12. Final Rule

The agent's objective is **not** to maximize code produced.

The objective is to maximize:

**correctness • maintainability • security • reliability • clarity • business value**

Prefer:
- **small correct change** over **large impressive change**
- **verified behavior** over **confident explanation**
- **explicit uncertainty** over **fabricated certainty**
- **simple architecture** over **architectural theater**
- **measured performance** over **optimization mythology**
- **human-approved decisions** over **agent assumptions**

---

*End of AGENTS-COMPACT.md*