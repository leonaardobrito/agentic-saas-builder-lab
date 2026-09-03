# ADR-0001 — Initial Stack

**Status:** ACCEPTED
**Date:** 2026-09-02
**Author:** StyleFlow Team

---

## Context

The new StyleFlow SaaS venture needs a modern, maintainable, and scalable technology foundation. The legacy prototype used React/Vite/Express and provider-specific AI integration (Gemini). We need a stack that supports:

- Fast development and iteration.
- Strong tenant isolation (multi-tenancy).
- Production-ready testing (unit, integration, E2E).
- Accessibility and performance.
- Easy deployment and operations.
- Provider-neutral AI integration (future).
- Agent-friendly development environment (Cline, agy, etc.).

---

## Decision

We will use the following stack:

| Layer | Technology | Version / Spec |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) + React | 16.x / 19.x |
| **Language** | TypeScript | Strict Mode (`strict: true`) |
| **Styling** | Tailwind CSS + shadcn/ui | v4.x / latest |
| **Validation** | Zod | v4.x |
| **Database / Backend** | PostgreSQL (via Supabase) | 15+ |
| **Authentication** | Supabase Auth (via `@supabase/ssr`) | — |
| **Storage** | Supabase Storage | — |
| **Unit / Integration Tests** | Vitest + React Testing Library | — |
| **E2E Tests** | Playwright | — |
| **Deployment** | Vercel | — |
| **CI/CD** | GitHub Actions + Vercel | — |
| **AI Gateway** | Provider-agnostic (OpenAI, Anthropic, Google) | — |
| **Agent Orchestration** | Cline (VS Code) / agy (optional) | — |
| **MCP Servers** | Supabase MCP, GitHub MCP, Vercel MCP (for agent use) | — |

### Architectural Style

- **Modular monolith** — one codebase, one deploy, but with clear domain boundaries (Vertical Slices).
- **Feature-based architecture** — business capabilities are self-contained (`features/`).
- **Multi-tenancy by design** — `tenant_id` in every operational table; RLS and composite FKs for isolation.
- **Provider-neutral adapters** — external services (WhatsApp, AI, payments) are integrated via adapters.

### Tooling

- **VS Code** with Cline extension for AI-assisted development.
- **Supabase CLI** for local database management and migrations.
- **agy (Antigravity CLI)** as an optional delegated coding/research agent.
- **MCP Servers** for controlled agent access (read-only by default, production writes require human approval).

---

## Consequences

### Positive

1. **Fast development:** Next.js Server Actions and Supabase simplify the backend.
2. **Strong isolation:** RLS and composite FKs guarantee tenant data separation.
3. **Replaceable AI:** The AI gateway allows swapping models without rewriting business logic.
4. **Observability:** Vercel provides built-in logging and performance monitoring.
5. **Scalability:** The modular monolith can evolve into microservices when needed.
6. **Agent-friendly:** The stack supports Cline, agy, and MCPs for AI-assisted development.

### Negative (Trade-offs)

1. **Vendor lock-in (partial):** Next.js + Vercel + Supabase creates some lock-in, but all are open standards (React, PostgreSQL).
2. **Serverless limitations:** Long-running background jobs may require additional services (e.g., queues).
3. **Learning curve:** The stack is modern and requires familiarity with Next.js, Supabase, and serverless patterns.

### Risks

- **API rate limits:** Supabase free tier limits API calls; we must monitor usage.
- **Migration safety:** Database changes must be versioned and tested.
- **Agent autonomy:** MCP access must be carefully controlled to avoid production accidents.

---

## Alternatives Rejected

| Alternative | Why Rejected |
| :--- | :--- |
| **Microservices-first** | Adds unnecessary complexity; premature distribution. |
| **Generic ERP architecture** | We are building a vertical SaaS, not a generic ERP. |
| **Hard coupling to one AI provider** | Prevents switching providers; creates vendor lock-in. |
| **Application-only tenant isolation** | RLS provides stronger defense-in-depth. |
| **Express backend + React SPA** | More operational overhead; less integration with serverless. |
| **Jest (for tests)** | Vitest is faster and more modern for Vite/Next.js. |

---

## Supersedes

- Legacy React + Vite + Express architecture.
- Provider-specific AI integration (Gemini only).
- Legacy environment variable names.
- Legacy project scripts.

---

## Additional Notes

- The stack is designed to be **evolvable**. Evidence from production (performance, scaling, team size) may trigger future ADRs to adjust the stack.
- **Cline + 99router** in VS Code is a development workflow enhancement, not a stack dependency.
- **MCP servers** (Supabase, GitHub, Vercel) are privileged tools; they must be used with least privilege and require human approval for production writes.

---

## References

- `architecture.md` — Detailed architecture description.
- `multi-tenancy.md` — Tenant isolation strategy.
- `local-development.md` — Setup instructions.
- `testing-strategy.md` — Testing pyramid and tools.
- `AGENTS.md` — Agent contract and rules.

---

*End of ADR-0001-stack.md*