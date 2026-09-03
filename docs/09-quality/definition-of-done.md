# Definition of Done — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salons & Aesthetic Centers
**Authority:** Canonical completion criteria for all work items

---

## 0. How Agents Must Use This Document

This document defines the **mandatory completion criteria** that every feature, bug fix, refactoring, or infrastructure change must satisfy before it is considered "done."

It is the final gate before merging any code.

### Authority Rules

- `definition-of-done.md` defines **what "done" means**.
- `tdd.md` defines **the development workflow**.
- `testing-strategy.md` defines **what and how to test**.
- `business-rules.md` defines **behavioral invariants**.
- `security-baseline.md` defines **security requirements**.
- `domain-model.md` and `architecture.md` define **structural correctness**.

### Before marking a task as complete

The agent MUST verify **every applicable item** in the checklist below. No item may be skipped unless explicitly waived and documented in the task/pull request description.

---

## 1. Core Principles

1.  **Correctness over speed:** A working, correct feature is more important than a fast, buggy one.
2.  **Tested behavior:** Every new behavior must be verified by automated tests.
3.  **Security is non-negotiable:** No feature that weakens tenant isolation or exposes sensitive data is allowed.
4.  **Observability:** The system must provide signals to understand its internal state.
5.  **Documentation is part of engineering:** Code is not self-documenting; clarity matters.
6.  **Reviewable changes:** Changes must be small, focused, and easy for a human/agent to review.
7.  **Agent honesty:** Never claim a check passed unless it was actually executed and verified.

---

## 2. Definition of Done Checklist

### 2.1. Specification & Scope

- [ ] **Requirement is clear:** The task maps to an approved specification (`specs/`) or product decision.
- [ ] **Scope is respected:** The change does **not** silently expand scope (e.g., refactoring unrelated code, adding new features not in the spec).
- [ ] **Non-goals are documented:** If the scope deliberately excludes something, it is noted in the PR description.
- [ ] **Domain model updated:** If a new entity or relationship was introduced, `domain-model.md` is updated accordingly.
- [ ] **Business rules updated:** If a new invariant or rule was introduced, `business-rules.md` is updated with the new BR-* rule.

---

### 2.2. Code Quality & Architecture

- [ ] **Vertical slice structure:** The feature is placed in the correct `features/[domain]/` directory with proper layers (`domain/`, `application/`, `infrastructure/`, `presentation/`).
- [ ] **TypeScript strict mode:** Code compiles with `strict: true`. No `any` types (unless explicitly justified and documented).
- [ ] **Validation:** All external inputs (API payloads, webhooks, form data) are validated with Zod at the boundary.
- [ ] **Business logic location:** Business rules are **not** in UI components or infrastructure adapters. They are in the `domain/` or `application/` layers.
- [ ] **No hidden side effects:** Side effects (database writes, external API calls) are explicit and located in `infrastructure/` or triggered by use cases.
- [ ] **Idempotency considered:** If the operation can be retried (webhooks, payments, outbox), idempotency is implemented.
- [ ] **Database migrations versioned:** Any schema change has a corresponding migration file (`supabase/migrations/`).
- [ ] **Tenant isolation:** New entities include `tenant_id`. Composite foreign keys are used for cross-entity references.
- [ ] **Dependencies justified:** No new dependencies added without justification (license, size, maintenance, necessity).

---

### 2.3. Security & Privacy

- [ ] **Authentication verified:** Protected endpoints use `supabase.auth.getUser()` (never `getSession()` on the server).
- [ ] **Authorization enforced:** RBAC policies are applied. Object-level authorization is implemented (not just `tenant_id` filtering).
- [ ] **RLS policies created/updated:** RLS policies for all affected tables are defined and tested.
- [ ] **No secrets exposed:** No API keys, tokens, passwords, or personal data are hardcoded or committed.
- [ ] **Sensitive data minimized:** Logs, error messages, and ActivityFeed payloads do not contain unnecessary personal/sensitive data (e.g., anamnesis, CPF).
- [ ] **Cross-tenant references prevented:** Composite FKs ensure records cannot reference other tenants.
- [ ] **Security review completed:** For high-risk features (financial, auth, multi-tenant), a security review checklist is filled out.

---

### 2.4. Testing

- [ ] **Unit tests written:** All new domain/application logic is covered by unit tests (Vitest).
- [ ] **Integration tests written:** All new repository/RLS/transaction logic is covered by integration tests (Vitest + Supabase local).
- [ ] **E2E tests written (if critical flow):** Critical user journeys are covered by Playwright tests.
- [ ] **Concurrency tests written (if applicable):** For scheduling, stock updates, or financial operations, tests verify database-level constraints prevent race conditions.
- [ ] **Tenant isolation tests written:** Tests prove Tenant A cannot access Tenant B's data (RLS verification).
- [ ] **Accessibility tests written (if UI changed):** Automated accessibility scans (axe-core) pass or issues are documented.
- [ ] **All tests pass locally:** `npm run test:ci` (unit + integration) and `npm run test:e2e` (if applicable) pass.
- [ ] **Test coverage not regressed:** Coverage is maintained or improved (if enforced).

---

### 2.5. Documentation

- [ ] **Code comments (why, not what):** Complex or non-obvious logic has comments explaining the "why."
- [ ] **README updated (if structural change):** If the project structure or setup changed, `README.md` is updated.
- [ ] **API documentation updated (if API changed):** New endpoints/actions are documented in the relevant API spec.
- [ ] **ADR created (if architectural decision):** If the change introduces a new architectural pattern or deviates from existing ADRs, a new ADR is created.
- [ ] **Specification closed:** The active specification (`specs/`) is marked as completed or closed.
- [ ] **Memory recorded (if discovery):** If the work uncovered non-obvious learnings, add a `memory/` entry.

---

### 2.6. Observability & Operations

- [ ] **Logging added:** Important operations, errors, and security-sensitive events are logged (with tenant_id and user_id when safe).
- [ ] **Error handling:** All potential failure modes are handled gracefully; user-friendly error messages are returned.
- [ ] **Metrics considered:** If the feature changes business-critical behavior (appointment, payment), relevant metrics are defined and tracked.
- [ ] **Deployment considered:** Change is compatible with the deployment pipeline; no breaking changes without a plan.
- [ ] **Rollback considered:** If the change introduces a migration, a rollback strategy is understood.

---

### 2.7. UI & User Experience

- [ ] **Responsive behavior verified:** Works on mobile (360px+), tablet, and desktop.
- [ ] **Accessibility verified:** Keyboard navigation, focus states, ARIA labels, and contrast are valid.
- [ ] **Empty/loading/error states handled:** All async operations show loading states; error states display user-friendly messages; empty states are informative.
- [ ] **Consistent with design system:** UI components are from shadcn/ui or the shared design system. No arbitrary colors/spacing.
- [ ] **Portuguese‑BR UI text:** All user-facing text is in Brazilian Portuguese (unless explicitly defined otherwise).
- [ ] **Touch targets:** Minimum 44x44px for interactive elements on mobile.

---

### 2.8. Quality Gates (Automated)

- [ ] **TypeScript check:** `npm run typecheck` passes.
- [ ] **Lint:** `npm run lint` passes.
- [ ] **Build:** `npm run build` passes without errors.
- [ ] **Unit + Integration:** `npm run test:ci` passes.
- [ ] **E2E (if applicable):** `npm run test:e2e` passes.
- [ ] **Migration status:** Supabase migrations are up to date and tested.

---

### 2.9. Review & Handoff

- [ ] **PR description is complete:** PR explains what changed, why, affected areas, tests, migrations, security implications, and deployment implications.
- [ ] **Diff is reviewable:** The PR contains **one logical change**. No mixing of features, refactors, and formatting.
- [ ] **Self-review performed:** The author/agent reviewed their own change before requesting review.
- [ ] **Agent handoff prepared:** If handing off to a human or another agent, a handoff note is included with status, completed work, tests, known issues, decisions, and next step.

---

## 3. Exceptions and Waivers

Occasionally, a task may not require all criteria (e.g., a tiny hotfix, a pure documentation change).

**How to handle exceptions:**

1.  Document the justification in the PR description.
2.  Explicitly list which items are skipped and why.
3.  Obtain approval from a human reviewer (owner/lead) for the waiver.

**Examples of valid waivers:**
- "No unit tests required because this is a trivial schema rename."
- "No E2E test because this is a backend-only repository change."

**Invalid waivers:**
- "Skipping security review because I was in a hurry."
- "No tests because it was hard to write."

---

## 4. Agent Checklist (Quick Reference)

```text
[ ] Specification/scope clear?
[ ] Code in correct vertical slice?
[ ] TypeScript strict, no `any`?
[ ] Validation at boundaries (Zod)?
[ ] Business logic out of UI?
[ ] Idempotency considered?
[ ] Tenant isolation (tenant_id, composite FK, RLS)?
[ ] Security reviewed (auth, RBAC, secrets)?
[ ] Unit tests written/passing?
[ ] Integration tests written/passing?
[ ] E2E tests (if applicable) passing?
[ ] Concurrency tests (if applicable) passing?
[ ] Tenant isolation tests passing?
[ ] Accessibility tests (if UI) passing?
[ ] Code comments (why not what)?
[ ] Documentation updated?
[ ] Logging/observability added?
[ ] Error handling complete?
[ ] Responsive/accessible UI?
[ ] Build passing?
[ ] PR description complete and reviewable?
```

---

## 5. Traceability

| Concern                     | Canonical Document                      |
| --------------------------- | --------------------------------------- |
| Product scope               | `mvp.md`                                |
| Domain model                | `domain-model.md`                       |
| Business rules              | `business-rules.md`                     |
| Architecture                | `architecture.md`                       |
| Multi-tenancy               | `multi-tenancy.md`                      |
| Testing                     | `testing-strategy.md`                   |
| TDD workflow                | `tdd.md`                                |
| Security                    | `security-baseline.md`                  |
| API contracts               | `api-guidelines.md`                     |
| UI language                 | `design-system.md`                      |

---

## 6. Final Definition of Done Contract

A feature is **done** only when:

1.  It meets all applicable checklist items above.
2.  All automated tests pass.
3.  It has been reviewed and approved (by a human or an authorized agent).
4.  It has been deployed to a preview/staging environment and verified.
5.  Documentation is updated and consistent.
6.  The team/agent is confident that the feature can be safely deployed to production without causing regressions or security vulnerabilities.

**Remember:** The Definition of Done is not about bureaucracy—it is about **quality, safety, and maintainability.** A feature that passes all tests but fails the checklist is not truly done.