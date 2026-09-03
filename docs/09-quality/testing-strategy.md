# Testing Strategy — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salons & Aesthetic Centers
**Authority:** Canonical testing strategy and quality gates

---

## 0. How Agents Must Use This Document

This document defines the **testing pyramid, tools, and mandatory test types** for every feature implemented in StyleFlow.

It is a source of truth for quality assurance.

### Authority Rules

- `testing-strategy.md` defines **what to test and at which level**.
- `tdd.md` defines **the development workflow (RED → GREEN → REFACTOR)**.
- `definition-of-done.md` defines **completion criteria including testing**.
- `domain-model.md` defines **the entities and relationships to test**.
- `business-rules.md` defines **the behavioral invariants to validate (BR-*)**.
- `multi-tenancy.md` defines **isolation tests required**.
- `security-baseline.md` defines **security test requirements**.

### Before implementing a feature

The agent MUST:

1. Identify the affected bounded context and entities.
2. Identify which business rules (BR-*) are impacted.
3. Identify concurrency risks (e.g., appointment overlaps, stock updates).
4. Identify tenant isolation requirements.
5. Write **failing tests first** (RED), then implement (GREEN), then refactor (REFACTOR).
6. Ensure tests are deterministic, isolated, and use synthetic data.
7. Never use production data in tests.
8. Verify that all tests pass before marking a feature as complete.

---

## 1. Testing Philosophy

StyleFlow follows **Test-Driven Development (TDD)** as the default development method.

**Core Belief:**

> A feature is not complete until it has automated tests that prove it works correctly, securely, and in isolation.

**TDD Cycle (per `tdd.md`):**

```text
🔴 RED → Write a failing test (specify behavior).
🟢 GREEN → Write the minimum code to make the test pass.
🔵 REFACTOR → Improve the code without changing behavior (all tests stay green).
```

---

## 2. Test Pyramid

StyleFlow uses the **classic test pyramid**:

```text
        /\
       / E2E \          ← Critical user journeys (few, slow)
      /--------\
     / Integr. \        ← Database, RLS, repository, external adapters (medium)
    /----------\
   /  Unitária  \      ← Domain entities, business rules, pure functions (many, fast)
  /--------------\
```

| Test Level       | Quantity | Speed   | Scope                                                                 |
| ---------------- | -------- | ------- | --------------------------------------------------------------------- |
| **Unit Tests**   | Many     | Fast    | Domain entities, value objects, business rules (pure logic).          |
| **Integration**  | Medium   | Medium  | Repositories (Supabase), RLS, transactions, external adapters (mocks).|
| **E2E Tests**    | Few      | Slow    | Critical user workflows (full stack: UI → DB → external APIs mocked). |

**Guiding Principle:** Prefer the **smallest appropriate test level**. Do not turn a unit test into an E2E test.

---

## 3. Tools

| Test Level       | Tool                         | Execution Command             |
| ---------------- | ---------------------------- | ----------------------------- |
| **Unit Tests**   | Vitest (or Jest)             | `npm run test:unit`           |
| **Integration**  | Vitest + Supabase (local)    | `npm run test:integration`    |
| **E2E Tests**    | Playwright                   | `npm run test:e2e`            |
| **Coverage**     | Vitest / Istanbul            | `npm run test:coverage`       |
| **Accessibility**| Playwright + axe-core        | `npm run test:a11y`           |

**Configuration Requirements:**

- **Vitest:** Use `vitest.config.mjs` with `environment: 'node'` for all tests. Override per-file with a `@vitest-environment jsdom` doc comment only when React component tests that require DOM are introduced. The `jsdom` environment was removed from the global config because it caused `webidl.util.markAsUncloneable is not a function` on Node.js 24 (GitHub Actions).
- **Supabase Local:** Use `supabase start` to spin up a local PostgreSQL instance for integration tests. Migrations must be idempotent.
- **Playwright:** Configure `playwright.config.ts` to run against the Vercel Preview URL or local dev server.

---

## 4. What to Test at Each Level

### 4.1. Unit Tests (Vitest)

**Focus:** Pure logic, no external dependencies.

**What to test:**

| Artifact            | Examples                                                                 |
| ------------------- | ------------------------------------------------------------------------ |
| **Domain Entities** | `Appointment.isOverlapping()`, `Interval.valid()`, `Professional.canBook()` |
| **Value Objects**   | `Email.isValid()`, `Phone.format()`, `Currency.calculate()`              |
| **Domain Rules**    | Commission calculation, stock quantity validation, anamnesis privacy classification |
| **Zod Schemas**     | Valid and invalid inputs for every DTO, Server Action input validation   |
| **Pure Utilities**  | Date formatters, currency formatters, timezone converters                |

**What NOT to test in Unit Tests:**

- Database queries (use Integration tests).
- Component rendering (use RTL / Unit tests with shallow rendering).
- Network requests (mock them).

**Naming Convention:**

```typescript
// ✅ Good: Describes behavior.
describe('CreateAppointment', () => {
  it('should prevent overlapping appointments for the same professional', async () => {
    // ...
  });
});

// ❌ Bad: Vague and not behavior-oriented.
describe('Appointment Test', () => {
  it('should work', () => {});
});
```

---

### 4.2. Integration Tests (Vitest + Supabase Local)

**Focus:** Interaction with the database, RLS, transactions, and external adapters.

**What to test:**

| Artifact                  | Examples                                                                 |
| ------------------------- | ------------------------------------------------------------------------ |
| **Repositories**          | `SupabaseAppointmentRepository.findConflicting()` with real DB queries.  |
| **RLS Policies**          | Ensure Tenant A cannot `SELECT` Tenant B's data (see Section 5.2).      |
| **Database Constraints**  | Check constraint (end > start), unique constraints, GiST exclusion.      |
| **Transactions**          | `Appointment` completion creates `StockMovement` and `FinancialEvent` atomically. |
| **Outbox / Communication**| `OutboxMessage` is saved, status transitions correctly.                  |
| **Server Actions**        | Validate authentication, authorization, and tenant context.              |

**Environment Setup:**

- Use `supabase start` to spin up a local PostgreSQL instance.
- Run migrations before tests (`supabase db reset`).
- Use a dedicated test schema or truncate tables between test runs.
- **Never** use a production or staging Supabase project for integration tests.

**Critical Integration Test Scenarios:**

1.  **Concurrency Test (BR-APT-003):**
    - Spawn two parallel requests to create an appointment for the same tenant/professional/time.
    - One should succeed; the other must fail with the GiST exclusion error.
    - Use `Promise.allSettled` and assert exactly one succeeds.

2.  **RLS Isolation Test (BR-TEN-001):**
    - Insert data for Tenant A and Tenant B.
    - Authenticate as a user from Tenant A.
    - Query `appointments` for Tenant B's ID.
    - RLS must return zero rows (even if the query itself does not have a `WHERE tenant_id` filter).

3.  **Composite FK Test (BR-SEC-001):**
    - Attempt to insert an `appointment` where `(tenant_id, professional_id)` references a professional from a different tenant.
    - Must fail with a foreign key violation.

---

### 4.3. E2E Tests (Playwright)

**Focus:** Critical user journeys that simulate real browser interactions.

**What to test (MVP):**

| Workflow                           | Description                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------- |
| **Onboarding (Signup + Tenant)**   | User signs up, creates a tenant (salon), and logs in.                      |
| **Create Appointment**             | Navigate to agenda, select professional, select service, pick time, save.  |
| **Conflict Prevention UI**         | Try to book a conflicting time; UI shows an error message.                 |
| **Appointment Completion**         | Mark an appointment as completed; verify customer history updates.         |
| **Tenant Isolation**               | Login as User A; try to access a URL for User B's tenant; expect 403/redirect. |
| **WhatsApp Reminder (Mocked)**     | Create appointment; verify that a reminder message is scheduled (Outbox).  |

**Mocking External APIs:**

- Use Playwright's `page.route()` to intercept and mock external calls (WhatsApp, Payments, etc.).
- Do not test third-party APIs in E2E tests; test your adapter's retry logic via integration tests instead.

**Test Data:**

- Use deterministic synthetic data (e.g., Faker.js with a fixed seed).
- Reset the test database entirely between test suites (or use a dedicated test tenant).

---

## 5. Critical Test Scenarios (Mandatory)

### 5.1. Concurrency Tests (Appointment Conflicts)

**Why mandatory:** Concurrency bugs (double-booking) cause direct revenue loss and customer dissatisfaction.

**Example (Integration Test):**

```typescript
import { createTestClient, seedTestData } from '@/testing/test-utils';
import { createAppointment } from '@/features/appointments/application/create-appointment';

describe('Appointment Concurrency', () => {
  it('should prevent two conflicting appointments from being created simultaneously (BR-APT-003)', async () => {
    const { tenantId, professionalId } = await seedTestData();

    const appointment1 = {
      tenantId,
      professionalId,
      startAt: new Date('2026-09-03T10:00:00Z'),
      endAt: new Date('2026-09-03T11:00:00Z'),
    };

    const appointment2 = {
      ...appointment1,
      startAt: new Date('2026-09-03T10:30:00Z'),
      endAt: new Date('2026-09-03T11:30:00Z'),
    };

    const results = await Promise.allSettled([
      createAppointment(appointment1),
      createAppointment(appointment2),
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    expect(successCount).toBe(1);

    const failure = results.find(r => r.status === 'rejected');
    expect(failure.reason.message).toContain('APPOINTMENT_CONFLICT');
  });
});
```

---

### 5.2. Tenant Isolation Tests

**Why mandatory:** Security violations are non-negotiable.

**Example (Integration Test using RLS context):**

```typescript
import { createClient } from '@supabase/supabase-js';
import { setupTestUser } from '@/testing/auth-utils';

describe('RLS Tenant Isolation (BR-TEN-001)', () => {
  it('should prevent cross-tenant SELECT', async () => {
    const { supabase } = await setupTestUser('tenant-a');
    const appointmentFromTenantB = await insertAppointmentForTenant('tenant-b');

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentFromTenantB.id);

    expect(data).toHaveLength(0);
    expect(error).toBeNull();
  });

  it('should prevent cross-tenant INSERT', async () => {
    const { supabase, tenantId } = await setupTestUser('tenant-a');
    const professionalFromTenantB = await getProfessional('tenant-b');

    const { error } = await supabase
      .from('appointments')
      .insert({
        tenant_id: tenantId, // But referencing a professional from tenant B
        professional_id: professionalFromTenantB.id,
        // ...
      });

    expect(error).toBeDefined();
    expect(error.code).toBe('23503'); // Foreign key violation
  });
});
```

---

### 5.3. Idempotency Tests (Outbox & Webhooks)

**Why mandatory:** Retries must not duplicate messages or financial events.

**Example (Integration):**

```typescript
it('should not create duplicate OutboxMessages for the same event', async () => {
  const event = createAppointmentEvent();

  await handleAppointmentCreated(event);
  await handleAppointmentCreated(event); // second time

  const messages = await outboxRepository.findPending();
  expect(messages).toHaveLength(1);
});
```

---

### 5.4. ActivityFeed Tests (Future)

When the `ActivityFeed` module is implemented, tests must verify:

- Events are created for the correct `tenant_id`.
- Events are never created for cross-tenant operations.
- Payloads do not contain sensitive data (e.g., anamnesis, passwords).

---

## 6. Test Data & Fixtures

### 6.1. Synthetic Data

- Use **@faker-js/faker** to generate realistic test data.
- Use a **fixed seed** to ensure deterministic test runs.
- Example:

```typescript
import { faker } from '@faker-js/faker';
faker.seed(42); // Always use fixed seed for CI

export const createTestCustomer = (tenantId: string) => ({
  tenant_id: tenantId,
  full_name: faker.person.fullName(),
  phone: faker.phone.number('(##) #####-####'),
  email: faker.internet.email(),
});
```

### 6.2. Test Factories

- Create factory functions for each entity to reduce boilerplate.

```typescript
// testing/factories/appointment.factory.ts
export const appointmentFactory = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: faker.string.uuid(),
  tenantId: 'test-tenant',
  professionalId: 'test-professional',
  customerId: 'test-customer',
  startAt: new Date('2026-09-03T10:00:00Z'),
  endAt: new Date('2026-09-03T11:00:00Z'),
  status: 'scheduled',
  ...overrides,
});
```

### 6.3. Prohibited Data Practices

| Practice                              | Why Avoid                                  |
| ------------------------------------- | ------------------------------------------ |
| Using production data in tests        | Contains sensitive personal information.   |
| Using real phone numbers/emails       | Risky for privacy and can send real alerts.|
| Hardcoding UUIDs across multiple tests | Tests become dependent on execution order. |
| Relying on global state in tests      | Makes tests flaky and non-deterministic.   |

---

## 7. CI/CD Integration

### 7.1. Pull Request Checks (Mandatory Gates)

Every PR must pass these checks before merging:

```text
1. TypeCheck (`tsc --noEmit`)
2. Lint (`eslint .`)
3. Unit Tests (`vitest run`)
4. Integration Tests (`vitest run --type integration`)
5. Build (`next build`)
6. E2E Tests on Preview (`playwright test`) [if preview env exists]
7. Security Scan (if integrated)
```

### 7.2. CI Pipeline Command

```yaml
# .github/workflows/ci.yml (Conceptual)
name: CI
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run typecheck
      - run: npm run lint
      - run: supabase start  # Start local Supabase for integration tests
      - run: npm run test:ci # Runs unit + integration
      - run: npm run build   # Ensure build works
      - run: npm run test:e2e # Against Vercel Preview (if available)
```

---

## 8. Accessibility Testing

Accessibility is a quality concern, not a post-launch checklist.

**Tools:** `@axe-core/playwright` integrated with E2E tests.

**Example (Playwright):**

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('dashboard page should have no accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

**Minimum Requirements:**
- Semantic HTML (`<button>` instead of `<div onClick>`).
- Visible focus indicators.
- Proper ARIA labels where semantic HTML is not sufficient.
- Color contrast (WCAG 2.1 AA, 4.5:1).
- Keyboard navigation (tab order).

---

## 9. Agent Checklist Before Submitting Code

Before marking a feature as complete, the agent MUST verify:

```text
[ ] Unit tests written for all new domain logic (Vitest).
[ ] Integration tests written for all new repository/RLS logic (Vitest + Supabase).
[ ] E2E tests written for critical user journeys (Playwright).
[ ] Concurrency tests written if appointment/scheduling logic changed.
[ ] Tenant isolation tests written/updated (RLS cross-tenant).
[ ] Accessibility tests written/updated (if UI changed).
[ ] All tests are deterministic and pass locally.
[ ] No test uses production data or real external APIs.
[ ] Typecheck passes.
[ ] Lint passes.
[ ] Build passes.
[ ] Test coverage has not regressed (if coverage is enforced).
[ ] PR description includes test results summary.
```

---

## 10. Test Coverage Targets (Optional)

| Context              | Target Coverage |
| -------------------- | ---------------- |
| **Domain Rules**     | 100% (critical)  |
| **Application Use Cases** | 80%+       |
| **Repositories**     | 80%+ (via integration) |
| **UI Components**    | 70%+ (via RTL)  |
| **Total**            | 80%             |

Coverage is a metric, not a quality gate. A feature with 100% coverage but no assertions is worthless. **Test behavior, not lines of code.**

---

## 11. Traceability

| Concern                     | Canonical Document                      |
| --------------------------- | --------------------------------------- |
| TDD workflow                | `tdd.md`                                |
| Domain to test              | `domain-model.md` (Section 2)           |
| Business rules to validate  | `business-rules.md` (BR-*)              |
| Tenant isolation tests      | `multi-tenancy.md` (Section 7)          |
| Security testing            | `security-baseline.md`                  |
| Done criteria (includes tests) | `definition-of-done.md`              |
| API contract testing        | `api-guidelines.md`                     |

---

## 12. Final Testing Contract

StyleFlow tests guarantee:

- **Behavior correctness:** Every business rule (BR-*) is verified by at least one automated test.
- **Concurrency safety:** Appointment conflicts, stock updates, and financial events are tested under parallel conditions.
- **Tenant isolation:** RLS is proven to prevent cross-tenant access via integration tests.
- **Idempotency:** Retries do not create duplicate business effects (outbox, webhooks).
- **Accessibility:** Critical user journeys are accessible to all users.

Any feature that does not meet these testing requirements is **not complete**. The Definition of Done mandates tests passing before any merge.