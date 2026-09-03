# Architecture — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salons & Aesthetic Centers
**Authority:** Canonical architecture blueprint

---

## 0. How Agents Must Use This Document

This document defines the **architectural structure, component boundaries, data flow, and deployment strategy** of the StyleFlow platform.

It is a source of truth for implementation.

### Authority Rules

- `architecture.md` defines **how the system is structured and how components communicate**.
- `domain-model.md` defines **what exists and how it relates**.
- `business-rules.md` defines **behavioral rules and invariants**.
- `multi-tenancy.md` defines **tenant isolation strategy**.
- `security-baseline.md` defines **security requirements**.
- `testing-strategy.md` defines **quality gates**.
- ADRs define **architectural decisions**.

### Before implementing a feature

The agent MUST:

1. Identify which bounded context the feature belongs to.
2. Identify which layers (Presentation, Application, Domain, Infrastructure) are affected.
3. Verify that the feature respects the architectural boundaries.
4. Ensure that no infrastructure concerns leak into the domain layer.
5. Ensure that the feature follows the Vertical Slices structure.
6. Identify if the feature requires new adapters (e.g., external API, MCP).

---

## 1. Architectural Style

StyleFlow is built as a **Modular Monolith**.

### Why Modular Monolith?

- **Simplicity:** One codebase, one deploy, one runtime.
- **Clean Boundaries:** Modules are decoupled by domain context, but can still communicate via well-defined interfaces (use cases, events).
- **Evolutionary:** When evidence proves a module needs independent scaling or ownership, it can be extracted into a separate service without a full rewrite.
- **Cost Efficiency:** Low operational overhead in the MVP phase.

### What It Is NOT

- **Not** a distributed microservices architecture (avoided until proven necessary).
- **Not** a single "big ball of mud" — modules enforce strict boundaries via `domain`/`application`/`infrastructure` layers.

---

## 2. Technology Stack

| Layer                  | Technology                                                                      | Version / Spec          |
| ---------------------- | ------------------------------------------------------------------------------- | ----------------------- |
| **Frontend Framework** | Next.js (App Router) + React                                                   | 16.x / 19.x             |
| **Language**           | TypeScript                                                                      | Strict Mode (`strict: true`) |
| **Styling**            | Tailwind CSS                                                                    | v4.x                    |
| **UI Components**      | shadcn/ui                                                                       | Latest                  |
| **Validation**         | Zod                                                                             | v4.x                    |
| **Backend / API**      | Next.js Server Actions + Route Handlers                                        | —                       |
| **Database**           | PostgreSQL                                                                      | 15+ (via Supabase)      |
| **Auth / Storage**     | Supabase Auth + Storage                                                         | —                       |
| **ORM / Client**       | `@supabase/supabase-js` + `@supabase/ssr`                                      | Latest                  |
| **Unit / Integration** | Vitest (or Jest) + React Testing Library                                       | —                       |
| **E2E Tests**          | Playwright                                                                      | —                       |
| **Deployment**         | Vercel                                                                          | —                       |
| **Observability**      | Vercel Analytics + Sentry (future)                                             | —                       |
| **AI Gateway**         | Provider-agnostic adapter (OpenAI, Anthropic, Google)                          | —                       |

---

## 3. High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                    │
│          Browser (Web) · Mobile (PWA-ready) · API Consumers            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       NEXT.JS APP ROUTER                               │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐│
│  │   UI Layer  │  │  Server Actions │  │   Route Handlers (API)      ││
│  │ (Components)│◄─┤   (Mutations)   │  │   (Webhooks, MCPs, etc.)   ││
│  └─────────────┘  └────────┬────────┘  └─────────────────────────────┘│
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          FEATURE LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Domain    │  │ Application │  │    UI       │  │Infrastructure│  │
│  │  (Entities, │  │   (Use      │  │ (React      │  │ (Repositories,│  │
│  │   Rules)    │◄─┤   Cases)    │──┤  Hooks,     │──┤  Adapters)   │  │
│  └─────────────┘  └─────────────┘  │  Actions)   │  └─────────────┘  │
│                                    └─────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                             ┌──────┴──────┐
                             ▼             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐│
│  │     Supabase    │  │  External APIs  │  │   AI Gateway / MCPs     ││
│  │  ┌─────────────┐│  │  (WhatsApp,     │  │  (Gemini, Claude, GPT) ││
│  │  │ PostgreSQL  ││  │   Payments,     │  └─────────────────────────┘│
│  │  │  + RLS      ││  │   Fiscal)       │                            │
│  │  └─────────────┘│  └─────────────────┘                            │
│  └─────────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Project Structure (Vertical Slices)

The repository is organized by **business capabilities**, not by technical layers.

```text
styleflow-saas/
├── app/                              # NEXT.JS APP ROUTER (Routing Only)
│   ├── (auth)/                       # Auth routes (login, register)
│   ├── (dashboard)/                  # Protected dashboard routes
│   │   ├── agenda/
│   │   ├── clientes/
│   │   ├── financeiro/
│   │   └── ...
│   └── api/                          # Route Handlers (webhooks, MCPs)
│       ├── whatsapp/
│       └── webhooks/
│
├── features/                         # 🎯 BUSINESS CAPABILITIES (Vertical Slices)
│   ├── auth/                         # Authentication & Session
│   ├── appointments/                 # Scheduling (core)
│   │   ├── domain/                   # Entities, value objects, domain interfaces
│   │   ├── application/              # Use cases (CreateAppointment, CancelAppointment)
│   │   ├── infrastructure/           # Repositories (Supabase), Mappers
│   │   ├── presentation/             # React components, Server Actions, Hooks
│   │   └── __tests__/                # Unit + Integration tests
│   ├── customers/                    # Customer management
│   ├── professionals/                # Professional management
│   ├── services/                     # Catalog services
│   ├── inventory/                    # Products, stock, consumption
│   ├── finance/                      # Financial events, expenses, commissions
│   ├── communication/                # Messaging templates, outbox, automations
│   └── platform/                     # ActivityFeed, AuditLog (Platform Ops)
│
├── shared/                           # REUSABLE CODE (Cross-feature)
│   ├── ui/                           # Design System components (shadcn base)
│   ├── lib/                          # Utilities, Supabase client, AI gateway
│   ├── types/                        # Global types / Zod schemas
│   └── utils/                        # Pure functions (formatters, validators)
│
├── docs/                             # Documentation (product, domain, arch)
├── specs/                            # Active implementation specifications
├── memory/                           # Agent learning records
├── agents/                           # Agent definitions (future)
├── public/                           # Static assets
├── supabase/                         # Supabase migrations, seeds
│   └── migrations/                   # Versioned SQL migrations
├── .env.example                      # Environment variables template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts (or jest.config.js)
└── playwright.config.ts
```

---

## 5. Feature Structure (Vertical Slice Detail)

Each feature follows this internal structure:

```text
features/[feature_name]/
├── domain/
│   ├── entities/                   # Domain entities (e.g., Appointment, Customer)
│   ├── value-objects/              # Value objects (e.g., Interval, Email)
│   ├── repositories/               # Repository interfaces (for DI)
│   └── rules/                      # Domain rules / invariants
│
├── application/
│   ├── use-cases/                  # Use case classes (e.g., CreateAppointment)
│   ├── dtos/                       # Input/Output DTOs (Zod schemas)
│   └── ports/                      # Ports for secondary adapters (e.g., IAppointmentRepository)
│
├── infrastructure/
│   ├── repositories/               # Concrete implementations (Supabase)
│   ├── mappers/                    # DB ↔ Domain entity mapping
│   └── adapters/                   # External service adapters (e.g., WhatsApp)
│
├── presentation/
│   ├── components/                 # React components specific to this feature
│   ├── hooks/                      # React hooks (useAppointments)
│   ├── actions/                    # Server Actions (createAppointmentAction)
│   └── pages/                      # Feature-specific page components (if not in app/)
│
└── __tests__/
    ├── domain/                     # Unit tests for entities/rules
    ├── application/                # Unit tests for use cases
    ├── infrastructure/             # Integration tests for repositories
    └── presentation/               # Component tests (RTL)
```

### Layer Dependencies (Directional)

```text
Presentation (UI/Actions)
        │
        ▼
  Application (Use Cases)
        │
        ▼
    Domain (Entities, Rules)
        ▲
        │
Infrastructure (Repositories, Adapters)
```

**Key Rule:** `Domain` must NOT depend on `Infrastructure` or `Presentation`. `Infrastructure` depends on `Domain`.

---

## 6. Data Flow (Example: Create Appointment)

### Request Flow

1. **UI Component (Presentation)** : User fills form. Calls Server Action (`createAppointmentAction`).
2. **Server Action (Presentation)** :
   - Validates input using Zod schema.
   - Extracts `tenant_id` from session (`await supabase.auth.getUser()`).
   - Instantiates the Use Case (`CreateAppointment`).
3. **Use Case (Application)** :
   - Receives the validated DTO.
   - Calls Repository Interface methods (e.g., `appointmentRepository.findConflicting`).
   - Applies Domain Rules (e.g., `BR-APT-001`, `BR-APT-003`).
   - If valid, calls `appointmentRepository.save`.
4. **Repository (Infrastructure)** :
   - Uses Supabase client to interact with PostgreSQL.
   - The database enforces the GiST exclusion constraint (concurrency safety).
   - Returns the saved Appointment entity.
5. **Side Effects (Application / Eventual)** :
   - Emits a domain event (e.g., `AppointmentCreated`).
   - An event listener schedules an `OutboxMessage` for the confirmation reminder.
   - Another listener may create an `ActivityFeed` record (if feed module is active).
6. **Response** : Server Action returns `{ success: true, data: appointment }` or `{ success: false, error: string }` to the UI.

### Transaction Boundary

Critical operations (appointment creation, stock movement, financial events) must be atomic.

**Implementation:** Use Supabase's transactional capabilities (`supabase.rpc('my_transaction_function', ...)` or a single RPC call) to ensure that if any part fails, the entire operation rolls back.

**Alternative:** Use a `withTransaction` helper in the repository layer that groups multiple Supabase calls into an ephemeral transaction (if supported by the driver).

---

## 7. Multi-Tenancy Integration

Tenant isolation is enforced at **all layers**:

| Layer               | Mechanism |
| ------------------- | --------- |
| **Database**        | `tenant_id` in every table; composite FKs; RLS policies. |
| **Application**     | Server Actions and Use Cases receive `tenant_id` from the session (never from client payload). |
| **Repository**      | All queries include `tenant_id` filter. |
| **Presentation**    | UI never displays cross-tenant data; session-based tenant context. |

For detailed rules, see `multi-tenancy.md`.

---

## 8. Communication & Messaging Architecture

### Outbox Pattern

StyleFlow uses an **Outbox Pattern** to reliably deliver messages to external providers (WhatsApp, email).

```text
Domain Event (e.g., AppointmentCreated)
         │
         ▼
  [Local Transaction]
         │
    Save Appointment
         │
    Save OutboxMessage (status: pending)
         │
  [Commit Transaction]
         │
         ▼
  Background Worker / Cron
         │
         ▼
   Fetch pending OutboxMessages
         │
         ▼
   Provider Adapter (e.g., WhatsApp)
         │
         ├─ success → status = 'sent'
         ├─ retryable → retry_count++, keep pending
         └─ permanent failure → status = 'failed'
```

### Activity Feed

`ActivityFeed` is an **append-only operational projection**.

- **Consumer:** The **Painel de Comando** dashboard (future).
- **Producer:** Domain event listeners.
- **Rule:** `ActivityFeed` is **not** the source of truth. It is a read-optimized view for management visibility.

---

## 9. AI Architecture

AI capabilities (Gemini, Claude, GPT) are exposed through a **provider-agnostic Gateway**.

### AI Gateway Layer

```text
┌─────────────────────────────────────────────────────────────────┐
│                      AI GATEWAY                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  AI Orchestrator                        │   │
│  │  (Planner, Researcher, Implementer, Reviewer, QA)      │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                 │
│  ┌───────────────┬───────────┼───────────┬───────────────────┐│
│  │               │           │           │                   ││
│  ▼               ▼           ▼           ▼                   ▼│
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ││
│ │  OpenAI    │ │  Anthropic │ │   Google   │ │   Future   │ ││
│ │   (GPT)    │ │  (Claude)  │ │  (Gemini)  │ │  Providers │ ││
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ ││
└─────────────────────────────────────────────────────────────────┘
```

### AI Boundary Rules

1. **Never Couple Domain to AI:** Domain entities must never contain AI-specific fields or logic.
2. **AI is an Assistant:** AI can suggest, analyze, and generate content, but **must not override** domain invariants (e.g., tenant isolation, appointment conflicts, financial rules).
3. **Replaceable:** The AI provider can be swapped via configuration (`AI_PROVIDER: gemini | claude | openai`).
4. **MCPs (Model Context Protocol):** Agents use MCPs (Supabase, GitHub, Vercel) as controlled tools. MCPs are privileged; production writes require human approval.

---

## 10. Security Architecture

### Authentication

- **Provider:** Supabase Auth.
- **Storage:** HTTP-only cookies (`@supabase/ssr`).
- **Session Validation:** `supabase.auth.getUser()` in Server Components and Server Actions. **Never** use `getSession()` on the server.

### Authorization

- **RBAC:** Roles (`owner`, `admin`, `manager`, `receptionist`, `professional`, `financial`) define capabilities.
- **RLS (Row Level Security):** PostgreSQL policies enforce tenant isolation and role-based restrictions.
- **Object-Level Authorization:** Possessing an ID does not grant access; authorization checks are mandatory.

### Data Privacy

- **Sensitive Data:** Anamnesis, CPF, birth dates are classified.
- **Minimization:** Logs and ActivityFeed must not contain unnecessary personal or sensitive data.
- **LGPD:** Data access must be auditable, and deletion requests must be supported.

See `security-baseline.md` for full details.

---

## 11. Deployment Architecture

### Environments

| Environment | Purpose                        | Vercel Project |
| ----------- | ------------------------------ | -------------- |
| **Local**   | Developer environment.         | N/A            |
| **Preview** | Per-PR / feature branch.       | Preview alias  |
| **Staging** | Pre-production validation.     | Staging alias  |
| **Production** | Live environment for customers. | Production alias |

### Deployment Pipeline

```text
[Developer] → Push to GitHub → GitHub Actions / Vercel CI
         │
         ├── typecheck
         ├── lint
         ├── test:ci (unit + integration)
         ├── build
         ├── test:e2e (on Preview)
         ├── [Human Approval for Production]
         └── Deploy to Vercel
```

### Infrastructure Dependencies

- **Database:** Supabase Project (Production + Staging isolated).
- **Storage:** Supabase Storage for file uploads.
- **External APIs:** WhatsApp, Payment, Fiscal (configured via environment variables).
- **Caching:** Vercel's edge caching (Next.js ISR/SSR). No external cache added until required.

---

## 12. Observability & Monitoring

### Errors

- **Errors:** Sentry (planned) or Vercel Logs.
- **Logs:** Structured logs (JSON). Include `tenant_id`, `user_id` (if safe), `request_id`, `operation`, `duration`.

### Metrics

- **Business Metrics:** MRR, churn, trial-to-paid, appointment volume, average ticket.
- **Technical Metrics:** API latency (p50, p95, p99), error rate, deployment frequency.
- **Database Metrics:** Query performance, lock contention, connection pool usage.

### Incidents

Follow the protocol:

```text
Observe → Reproduce → Measure → Hypothesize → Test → Fix → Verify → Document.
```

---

## 13. Guiding Architectural Principles

1. **Correctness over optimization** — get it right first; measure and optimize later.
2. **Simplicity over abstraction** — start with simple code; add layers only when needed (YAGNI).
3. **Explicitness over magic** — implicit behaviors (e.g., magic decorators, hidden side effects) are avoided.
4. **Small changes over large changes** — incremental, reviewable, reversible changes are preferred.
5. **Security by default** — authentication, authorization, input validation, and RLS are non-negotiable from day one.
6. **Tenant isolation by design** — every layer must assume multi-tenancy is fundamental.
7. **Database as authority** — critical invariants are enforced by PostgreSQL constraints (FK, UNIQUE, CHECK, GiST).
8. **Replaceable AI and providers** — avoid vendor lock-in; use adapters.
9. **Observable systems** — the system must expose signals that allow understanding its internal state.
10. **Documentation as part of engineering** — code and architecture are documented for humans and agents.

---

## 14. Traceability

| Concern             | Canonical Document                      |
| ------------------- | --------------------------------------- |
| Product vision      | `docs/00-project/vision.md`             |
| Customer problem    | `docs/00-project/problem.md`            |
| ICP                 | `docs/00-project/target-customer.md`    |
| Business model      | `docs/00-project/business-model.md`     |
| Product scope       | `docs/01-product/mvp.md`                |
| Domain model        | `docs/02-domain/domain-model.md`        |
| Domain behavior     | `docs/02-domain/business-rules.md`      |
| Architecture        | `docs/03-architecture/architecture.md`  |
| Tenant architecture | `docs/03-architecture/multi-tenancy.md` |
| UI language         | `docs/04-design/design-system.md`       |
| API contracts       | `docs/05-api/api-guidelines.md`         |
| Database schema     | `docs/06-data/schema.md`                |
| Security            | `docs/08-security/security-baseline.md` |
| TDD                 | `docs/09-quality/tdd.md`                |
| Testing             | `docs/09-quality/testing-strategy.md`   |
| Done criteria       | `docs/09-quality/definition-of-done.md` |

---

## 15. Final Architectural Contract

StyleFlow is a **modular monolith** that is:

- **Tenant-isolated:** Data separation is guaranteed at all layers.
- **Concurrency-safe:** Critical invariants (like appointment conflicts) are enforced by the database.
- **Testable:** Vertical slices and clean architecture boundaries enable isolated testing.
- **Observable:** Logs, metrics, and audits provide insight into system behavior.
- **Extensible:** New verticals (Auto, Dental, etc.) can be introduced without rewriting the SaaS Core.
- **AI-ready:** Agents can assist in development and operations, but domain authority remains human-approved.
