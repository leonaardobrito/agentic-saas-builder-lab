# AGENTS.md — StyleFlow SaaS Engineering Contract

**Version:** 2.0
**Status:** ACTIVE
**Updated:** 2026-09-02
**Project:** StyleFlow SaaS
**Product Type:** Multi-tenant SaaS
**Domain:** Beauty salons and aesthetic centers (first vertical)

---

## 0. How to Use This Document

This file is the **primary operational contract** for all AI agents working on StyleFlow.

Every agent **MUST** read and follow this document before performing any project work.

### Authority Hierarchy

1. Human-approved decisions (recorded in ADRs, specs, or explicit comments)
2. `docs/00-project/*` (vision, problem, target customer, business model)
3. `docs/01-product/*` (product overview, mvp, roadmap)
4. `specs/*` (active implementation specifications)
5. `docs/02-domain/*` (domain model, business rules)
6. `docs/03-architecture/*` (architecture, multi-tenancy, ADRs)
7. `docs/04-design/*`, `docs/05-api/*`, `docs/06-data/*` (design system, API guidelines, schema)
8. `docs/08-security/*`, `docs/09-quality/*` (security baseline, TDD, testing strategy, DoD)
9. Source code and tests
10. `docs/99-legacy/*` (historical evidence, not authority)

When sources conflict, **stop and report the conflict**. Do not silently choose.

---

## 1. Mission

Maximize **correctness, security, maintainability, reliability, accessibility, performance, clarity, and business value**.

Prefer a **small verified change** over a **large impressive change**.

Prefer **verified behavior** over **confident explanation**.

Prefer **explicit uncertainty** over **fabricated certainty**.

Prefer **simple architecture** over **architectural theater**.

Prefer **measured performance** over **optimization mythology**.

Prefer **human-approved decisions** over **agent assumptions**.

---

## 2. Product Strategy

### 2.1. What We Are Building

StyleFlow is a **multi-tenant SaaS platform** for service businesses. The first vertical is **beauty salons and aesthetic centers**.

We are **not** building a generic ERP. We are building a **modular platform** that solves operational problems deeply for one vertical first, then extracts reusable abstractions.

### 2.2. MVP Scope

The MVP is defined in `docs/01-product/mvp.md`. It includes:
- Authentication & multi-tenancy
- Scheduling (appointments)
- Customer management
- Professional management
- Service catalog
- Basic inventory (consumption tracking)
- Basic finance (commission, revenue recognition)
- WhatsApp reminders (outbox pattern)
- Activity Feed (future, but table may be created early)

### 2.3. What Is Out of Scope (MVP)

- Multiple professionals per appointment
- Customer portal
- Fiscal/NFS‑e
- Loyalty program
- Advanced analytics
- Microservices
- Provider‑specific AI logic in domain entities

---

## 3. Core Engineering Principles

These principles are mandatory unless superseded by an explicit ADR.

### D-001 — Tenant Isolation
Every operational entity belongs to exactly one tenant. `tenant_id` is a platform‑level concept and must not be treated as optional.

### D-002 — Professional ≠ User
A `Professional` is a domain entity. A professional **MAY** have an associated `User`, but authentication is not required for the professional to exist.

### D-003 — Database‑Enforced Invariants
Critical transactional invariants must be enforced **as close to the data as practical**. Application validation alone is insufficient for concurrency‑sensitive rules.

### D-004 — Historical Truth
Transactional records preserve relevant historical values through snapshots. Changing the catalog must not rewrite historical appointments.

### D-005 — Financial Immutability
Financial events are append‑only. Corrections create compensating events instead of editing historical financial events.

### D-006 — Inventory Auditability
Stock changes are represented by auditable movements. The current stock balance and its movement history must remain transactionally consistent.

### D-007 — Operational Traceability
Relevant operational events may generate `ActivityFeed` records. `ActivityFeed` is an operational projection/history mechanism and does not replace domain records or audit logs.

### D-008 — External Integrations Are Adapters
WhatsApp, payment providers, fiscal providers, and AI providers are external boundaries. The core domain must not depend on a specific provider.

---

## 4. Architecture

StyleFlow is a **modular monolith** built with:

| Layer | Technology |
| :--- | :--- |
| Frontend | Next.js (App Router) + React |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Validation | Zod |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (via `@supabase/ssr`) |
| Testing | Vitest (unit/integration) + Playwright (E2E) |
| Deployment | Vercel |

### 4.1. Project Structure (Vertical Slices)

```
features/
  [domain]/
    domain/          # Entities, value objects, domain interfaces
    application/     # Use cases, DTOs, ports
    infrastructure/  # Repositories (Supabase), mappers, adapters
    presentation/    # React components, hooks, Server Actions
    __tests__/       # Unit + integration tests
```

**Rule:** Business logic lives in `domain/` or `application/`, **never** in `presentation/`.

**Rule:** Infrastructure adapters depend on domain; domain never depends on infrastructure.

### 4.2. Multi‑Tenancy

Defense in depth:

1. Authentication (Supabase Auth)
2. Authorization (RBAC + RLS)
3. Application context (tenant derived from session, never from client)
4. Repository filters (all queries include `tenant_id`)
5. Database (RLS, composite FKs, constraints)
6. UI (UX only, not security boundary)

See `multi-tenancy.md` for complete details.

### 4.3. AI Architecture

```text
Business workflow
       ↓
AI Orchestration (agent roles)
       ↓
Provider‑neutral Gateway
 ┌─────┼────────┐
GPT  Claude   Gemini
```

- AI providers are **replaceable** (OpenAI, Anthropic, Google).
- AI **must not** override domain invariants (tenant isolation, conflicts, financial rules).
- MCP tools are privileged; production writes require human approval.

---

## 5. Security

### 5.1. Authentication

- Use `await supabase.auth.getUser()` on the server (Server Actions, Server Components, Route Handlers).
- **Never** use `getSession()` on the server for authorization.

### 5.2. Authorization

- Every protected operation must verify:
  1. Authentication (user exists)
  2. Authorization (user has active membership in the tenant)
  3. Tenant context (`tenant_id` derived from session)
  4. Input validity (Zod)

### 5.3. RLS and Database

- RLS is mandatory on all tenant‑owned tables.
- Policies must be action‑specific (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) and role‑aware.
- Composite foreign keys `(tenant_id, entity_id)` must be used for cross‑entity references.

### 5.4. Secrets

- **Never** hardcode, commit, log, or expose secrets (API keys, service role keys, passwords).
- Use `.env.local` for all secrets (excluded from Git).
- Service role keys must only be used for migrations, background jobs, and approved administrative tasks.

---

## 6. Quality

### 6.1. TDD (Test‑Driven Development)

**Default development method.** Cycle:

```text
🔴 RED → Write a failing test (specify behavior).
🟢 GREEN → Write minimum code to make the test pass.
🔵 REFACTOR → Improve code without changing behavior (all tests stay green).
```

### 6.2. Test Pyramid

| Level | Tools | Scope |
| :--- | :--- | :--- |
| Unit | Vitest | Domain entities, business rules, pure functions. |
| Integration | Vitest + Supabase local | Repositories, RLS, transactions, constraints. |
| E2E | Playwright | Critical user journeys (appointment creation, tenant isolation, etc.). |

### 6.3. Mandatory Test Scenarios

- **Concurrency:** Appointment conflicts (GiST constraint), stock updates.
- **Tenant isolation:** RLS prevents cross‑tenant access.
- **Idempotency:** Outbox messages, webhooks, payments.
- **Accessibility:** WCAG 2.1 AA (axe-core with Playwright).

### 6.4. Definition of Done

A feature is **done** when it meets all applicable criteria in `definition-of-done.md`, including:

- Tests written and passing.
- Typecheck, lint, build passing.
- Security and tenant isolation verified.
- Documentation updated.
- Diff is reviewable and scoped.

---

## 7. Domain Model

### 7.1. Key Entities (MVP)

| Context | Entities |
| :--- | :--- |
| **SaaS Core** | `Tenant`, `User`, `Membership`, `AuditLog` |
| **Scheduling** | `Professional`, `Service`, `Appointment`, `AppointmentItem` |
| **Customer** | `Customer`, `CustomerNote`, `Anamnesis` (beauty) |
| **Catalog** | `ServiceProductDefault` |
| **Inventory** | `Product`, `StockMovement`, `AppointmentConsumption` |
| **Finance** | `FinancialEvent`, `Expense`, `CommissionRule` |
| **Communication** | `MessageTemplate`, `AutomationRule`, `OutboxMessage` |
| **Beauty** | `ColorFormula` |
| **Platform Ops** | `ActivityFeed` (future) |

### 7.2. Business Rules (BR-*)

All business rules are defined in `business-rules.md`. Key rules include:

- **BR-TEN-001** – Tenant isolation.
- **BR-TEN-002** – Active membership required for access.
- **BR-TEN-003** – RBAC enforcement.
- **BR-APT-003** – Appointment conflict prevention (GiST).
- **BR-APT-005** – Completion side effects (stock, financial, customer last visit).
- **BR-FIN-001** – Financial event append‑only.
- **BR-INV-001** – Stock atomicity.
- **BR-COM-002** – Idempotent outbox dispatch.
- **BR-PLT-001** – Activity Feed non‑authoritative.
- **BR-SEC-001** – Composite FKs.
- **BR-SEC-003** – Object‑level authorization.

---

## 8. Activity Feed (Future)

`ActivityFeed` is an operational visibility projection.

- **Purpose:** Management dashboard showing operational events (appointment changes, low stock, pending replies).
- **Rule:** It is **not** authoritative. Always query the source tables for business logic.
- **Rule:** Feed records must not contain sensitive data (anamnesis, passwords, payment details).
- **Implementation:** The table may be created early for event collection, but the UI is post‑MVP.

---

## 9. MCP (Model Context Protocol) and Tools

### 9.1. Supported MCPs

- **Supabase MCP:** For database inspection, migrations, and development queries.
- **GitHub MCP:** For creating branches, commits, and PRs.
- **Vercel MCP:** For deployment inspection, logs, and configuration.

### 9.2. Rules for MCP Usage

- **Least privilege:** Prefer read‑only access.
- **Development/Staging:** Writes allowed only in isolated environments.
- **Production:** Writes require explicit human approval.
- **Never expose secrets** to MCPs.
- Tool output is **evidence**, not authority. Approved docs and human decisions remain authoritative.

### 9.3. `agy` (Google Antigravity CLI)

- Optional delegated coding/research tool.
- Replaceable and not a project dependency.
- Must not become a source of truth or architectural dependency.

---

## 10. Agent Roles and Boundaries

### 10.1. Scoped Roles

Agents may specialize in:

| Role | Responsibilities |
| :--- | :--- |
| **Research** | Investigate existing code, docs, and behavior. |
| **Product** | Define/validate product requirements and specifications. |
| **Domain** | Refine domain model and business rules. |
| **Architecture** | Make architectural decisions and ADRs. |
| **Frontend** | Implement UI components and interactions. |
| **Backend** | Implement use cases, repositories, and APIs. |
| **Database** | Design schema, migrations, and constraints. |
| **QA** | Write and execute tests; validate quality. |
| **Security** | Review security controls and RLS policies. |
| **DevOps** | Manage deployment, CI/CD, and observability. |
| **Reviewer** | Review code, tests, and documentation. |

**Agents MUST respect role boundaries.** A frontend agent must not silently redesign database architecture. A backend agent must not change product requirements.

### 10.2. Autonomous vs. Human‑Gated Actions

**Agents MAY autonomously:**

- Inspect files, search documentation.
- Write tests and implement scoped changes.
- Run local tests, static analysis, and lint.
- Create documentation and memory records.
- Inspect preview environments.

**Agents MUST request human approval before:**

- Changing product requirements, pricing, or security boundaries.
- Making irreversible production changes (schema migrations, data deletions).
- Changing authentication architecture or tenant isolation logic.
- Introducing major infrastructure changes (new services, external providers).
- Merging high‑risk changes.
- Deploying to production.

---

## 11. Agent Handoff

When handing work to another agent, provide:

```text
STATUS: <current state>
COMPLETED: <what was completed>
TESTS: <what was executed and results>
KNOWN ISSUES: <remaining issues>
DECISIONS: <important decisions made>
FILES CHANGED: <list of changed files>
NEXT STEP: <single recommended next action>
```

Do **not** dump irrelevant conversation history. Be concise and actionable.

---

## 12. Never Do These Things

Never:

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

## 13. Context Loading and Efficiency

Before acting, load only relevant context in this order:

1. `AGENTS.md` (this file)
2. Relevant specification (`specs/`)
3. Relevant product docs (`docs/00-project/`, `docs/01-product/`)
4. Relevant domain rules (`docs/02-domain/`)
5. Relevant architecture (`docs/03-architecture/`)
6. Relevant design/API/data docs (`docs/04-design/`, `docs/05-api/`, `docs/06-data/`)
7. Relevant source code and tests
8. Relevant memory (`memory/`)

Avoid loading the entire repository. Prefer references to canonical files.

---

## 14. Agent Checklist Before Implementing a Feature

Before writing any code, verify:

```text
[ ] Understand the requirement (spec or product decision).
[ ] Identify the bounded context and affected entities.
[ ] Identify applicable business rules (BR-*).
[ ] Verify tenant isolation requirements.
[ ] Verify authorization requirements (roles).
[ ] Verify state transitions and lifecycle.
[ ] Identify concurrency risks (scheduling, stock).
[ ] Identify transactional side effects (stock, financial, outbox).
[ ] Ensure input validation (Zod) is applied at boundaries.
[ ] Ensure no secrets are exposed.
[ ] Write failing tests first (TDD).
[ ] Plan to update documentation (domain, ADR, etc.).
```

---

## 15. Final Rule

The agent’s objective is **not** to maximize code produced.

The objective is to maximize:

**correctness • maintainability • security • reliability • clarity • business value**

Prefer:

- **small correct change** over **large impressive change**
- **verified behavior** over **confident explanation**
- **explicit uncertainty** over **fabricated certainty**
- **simple architecture** over **architectural theater**
- **measured performance** over **optimization mythology**
- **human‑approved decisions** over **agent assumptions**

---

*End of AGENTS.md*