# Business Rules — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salons & Aesthetic Centers
**Authority:** Canonical behavioral rules


## 0. How Agents Must Use This Document

This document defines the **behavioral invariants, state transitions, validations and transactional side effects** of the domain.

It is a source of truth for implementation.

### Authority Rules

- `business-rules.md` defines **how the domain behaves**.
- `domain-model.md` defines **what exists and how it relates**.
- `mvp.md` defines **product scope**.
- `architecture.md` defines **technical structure**.
- `security-baseline.md` defines **security requirements**.

### Rule Classification

| Prefix   | Context               |
| -------- | --------------------- |
| `BR-TEN` | Tenancy / Membership  |
| `BR-APT` | Appointment / Scheduling |
| `BR-CUS` | Customer / Anamnesis  |
| `BR-CAT` | Catalog / Service     |
| `BR-INV` | Inventory / Stock     |
| `BR-FIN` | Finance / Commission  |
| `BR-COM` | Communication         |
| `BR-PLT` | Platform / Activity   |
| `BR-SEC` | Security / Cross-tenant |

---

## 1. Tenancy & Membership

### BR-TEN-001 — Tenant isolation (Obrigatório)

Every operational entity must belong to exactly one `tenant_id`.

**Rule:** A record must not be accessible or modifiable without an explicit tenant context.

**Implementation:** Foreign keys must include `tenant_id` in the composite key where possible. RLS must filter by `tenant_id`.

---

### BR-TEN-002 — Membership activation

A user can only perform operations within a tenant if they have an **active membership** (`is_active = true`).

**Rule:** Inactive memberships must not grant access to any tenant data.

---

### BR-TEN-003 — Role-based authorization (RBAC)

Operations must be authorized by the member's role/capability.

**Rule:** A `professional` role must not be able to modify financial settings. An `owner` role must not be required to view their own appointments.

**Implementation:** Application authorization layer must enforce capabilities, not just RLS.

---

### BR-TEN-004 — Soft-delete semantics (Regra de exclusão)

Entities that support soft-delete (`deleted_at`) must:

1. Be excluded from normal queries (unless explicitly requested).
2. Preserve historical relationships (e.g., an appointment linked to a soft-deleted customer must still be accessible).
3. Not be restorable unless a specific human-approved workflow is defined.

**Rule:** Financial events and stock movements are **never** soft-deleted (append-only).

---

## 2. Scheduling (Appointments)

### BR-APT-001 — Interval validity

An appointment interval must satisfy:```md
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

```text
end_at > start_at
```

**Rule:** Invalid intervals must be rejected at both application and database levels (CHECK constraint).

---

### BR-APT-002 — One professional per appointment (MVP)

Current MVP allows only **one** professional per appointment.

**Rule:** `appointments.professional_id` is mandatory and single-valued.

**Scope:** `MVP` (multiple professionals per appointment is `OUT_OF_SCOPE` for MVP).

---

### BR-APT-003 — Conflict prevention (Regra anti-conflito)

Two appointments for the **same tenant** and **same professional** must not have overlapping intervals when both are in active blocking statuses.

**Blocking statuses:** `scheduled`, `confirmed`.

**Non-blocking statuses:** `completed`, `cancelled`, `no_show`.

**Interval semantics:** Half-open `[start_at, end_at)`.

**Example (valid):**

```text
10:00–11:00
11:00–12:00
```

**Example (invalid):**

```text
10:00–11:00
10:30–11:30
```

**Implementation:** Must be enforced by a PostgreSQL **GiST exclusion constraint** at the database level. Application validation is **not** sufficient.

**Scope:** `MVP`

---

### BR-APT-004 — Appointment status flow (Fluxo de status)

Permitted statuses:

```text
scheduled
confirmed
completed
cancelled
no_show
```

**Allowed transitions:**

- `scheduled` → `confirmed`
- `scheduled` → `cancelled`
- `scheduled` → `no_show`
- `confirmed` → `completed`
- `confirmed` → `cancelled`
- `confirmed` → `no_show`

**Rule:** A `completed` appointment must not be moved back to `scheduled`.

**Rule:** A `cancelled` or `no_show` appointment must not block availability.

---

### BR-APT-005 — Completion side effects (Efeitos colaterais do atendimento)

When an appointment transitions to `completed`, the system must atomically perform the following side effects (transactionally):

1. Create `AppointmentConsumption` records for all consumed products.
2. Create `StockMovement` records (type: `consumption`) for each product consumed.
3. Update `products.stock_quantity` (atomic with stock movements).
4. Create `FinancialEvent` (type: `appointment_revenue`) for the appointment value.
5. Calculate and create `FinancialEvent` (type: `commission`) for each applicable professional commission.
6. Update `Customer.last_visit_at` to the current timestamp.
7. Generate an `ActivityFeed` event (future) for operational visibility.

**Rule:** These side effects must be **idempotent**. If an operation fails, the entire transaction must be rolled back.

**Scope:** `MVP`

---

## 3. Customer & Anamnesis

### BR-CUS-001 — Customer uniqueness per tenant

A customer is uniquely identified by their combination of `full_name`, `phone`, or `email` within a tenant.

**Rule:** Duplicate customers must be prevented at the application level. Database unique constraints may be applied to `(tenant_id, phone)` or `(tenant_id, email)` where appropriate.

---

### BR-CUS-002 — Anamnesis privacy classification

Anamnesis data may contain sensitive health/beauty information.

**Rule:** The `privacy_level` field must be set to `restricted` by default for anamnesis data.

**Rule:** Only authorized roles (`owner`, `admin`, `manager`, `professional` with patient relationship) must have access to `restricted` anamnesis.

**Rule:** Anamnesis data must **never** be exposed in `ActivityFeed` payloads (unless explicitly anonymized and approved).

**Scope:** `MVP`

---

## 4. Catalog & Service Product Defaults

### BR-CAT-001 — Service product default vs. actual consumption

`ServiceProductDefault` defines expected consumption.

`AppointmentConsumption` defines actual consumption.

**Rule:** Actual consumption must not be automatically overwritten by expected consumption when an appointment is updated.

**Rule:** Actual consumption may be copied from expected consumption during appointment creation, but must remain a separate snapshot.

**Scope:** `MVP`

---

## 5. Inventory & Stock

### BR-INV-001 — Stock atomicity

Updating `products.stock_quantity` and inserting `StockMovement` must be performed in the **same database transaction**.

**Rule:** A stock movement must never exist without a corresponding change to the stock quantity.

---

### BR-INV-002 — Stock ledger append-only

`StockMovement` is append-only.

**Rule:** Historical stock movements must never be updated or deleted.

**Rule:** Corrections must be performed by inserting a new compensating movement (e.g., `adjustment` with negative quantity).

---

### BR-INV-003 — Insufficient stock prevention

Appointment consumption must not proceed if it would make `products.stock_quantity` negative.

**Rule:** A validation check must be performed before attempting to consume stock.

**Rule:** The database may enforce `stock_quantity >= 0` via CHECK constraint or application-level validation with optimistic locking.

**Scope:** `MVP`

---

## 6. Finance & Commission

### BR-FIN-001 — Financial ledger append-only

`FinancialEvent` is append-only.

**Rule:** Historical financial events must never be updated or deleted.

**Rule:** Corrections must be performed by creating a compensating `FinancialEvent` (e.g., `adjustment` or `refund`).

---

### BR-FIN-002 — Commission calculation

Commission is calculated as a percentage of the **net value** (gross amount minus discounts, minus taxes, minus cancellations).

**Rule:** The `CommissionRule` must define:

- `percentage` (decimal, e.g., 0.10 for 10%)
- `based_on_net_value` (boolean, default true)
- `applies_to` (global, professional, service)

**Rule:** Precedence order: `service` → `professional` → `global`. If no specific rule exists, `global` applies.

**Scope:** `MVP`

---

### BR-FIN-003 — Revenue recognition

Revenue from appointments is recognized when the appointment transitions to `completed`.

**Rule:** `FinancialEvent.type = 'income'` is created at the moment of completion.

**Rule:** No financial event is created for `cancelled` or `no_show` appointments.

**Scope:** `MVP`

---

## 7. Communication & Outbox

### BR-COM-001 — Provider-neutral messaging

Communication templates and outbox messages must not be coupled to a specific channel (e.g., WhatsApp, SMS, email).

**Rule:** The domain entity `OutboxMessage` must not contain channel-specific fields (e.g., `whatsapp_message_id`). Channel-specific metadata belongs to the adapter layer.

**Scope:** `MVP`

---

### BR-COM-002 — Idempotent message dispatch

`OutboxMessage` must support idempotent retries.

**Rule:** Before sending, the system must check `status != 'sent'`.

**Rule:** `retry_count` must be tracked. After a configured max retries, status must transition to `failed`.

**Scope:** `MVP`

---

### BR-COM-003 — Automation trigger rules

`AutomationRule` defines when a message is sent.

**Rule:** Rule evaluation must be idempotent. If an appointment is rescheduled, reminders must be recalculated.

**Rule:** A message must not be sent twice for the same event unless explicitly configured.

**Scope:** `MVP`

---

## 8. Platform Operations (Activity Feed)

### BR-PLT-001 — Feed non-authoritative

`ActivityFeed` is an operational visibility projection.

**Rule:** It must never be used as the authoritative source for domain entities.

**Rule:** It must never be used to drive business logic (e.g., "if ActivityFeed says appointment exists, then..."). Always query the authoritative table (`appointments`, `products`, etc.).

**Rule:** Feed events are generated as side effects, never as primary operations.

**Scope:** `FUTURE` (May be implemented earlier for data collection).

---

### BR-PLT-002 — Feed event generation

Relevant operational events **should** generate an `ActivityFeed` record when the feed module is active.

Examples:

| Domain Event | Category | Event Type |
| ------------ | -------- | ---------- |
| Appointment created | `appointment` | `created` |
| Appointment cancelled | `appointment` | `cancelled` |
| Appointment no-show | `appointment` | `no_show` |
| Stock below minimum | `inventory` | `low_stock` |
| Stock expired | `inventory` | `expired` |
| Invoice due soon | `financial` | `invoice_due_soon` |
| Outbox message failed | `communication` | `message_failed` |
| Customer replied to message | `communication` | `reply_awaiting` |

**Rule:** Feed records must never include sensitive data (e.g., full anamnesis, passwords, payment card details).

---

## 9. Security & Cross-Tenant Invariants

### BR-SEC-001 — Composite foreign keys

Foreign keys referencing tenant-owned entities **should** be composite `(tenant_id, entity_id)` to guarantee tenant consistency at database level.

**Rule:** `appointments` referencing `customers` must use `(tenant_id, customer_id)`.

**Rule:** `appointments` referencing `professionals` must use `(tenant_id, professional_id)`.

---

### BR-SEC-002 — RLS granularity

RLS policies must be **action-specific** (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) and **role-aware**.

**Rule:** No policy should use `USING (true)` or `FOR ALL` without explicit role/capability checks.

**Rule:** A `receptionist` may `SELECT` all appointments but must not `UPDATE` financial status.

---

### BR-SEC-003 — Object-level authorization

Possessing an object's ID must never grant automatic access.

**Rule:** Authorization checks must always verify tenant ownership AND role/capability.

**Example (incorrect):**

```sql
SELECT * FROM appointments WHERE id = :id
```

**Example (correct, with RLS):**

```sql
SELECT * FROM appointments WHERE id = :id AND tenant_id = current_setting('app.current_tenant')::uuid
```

---

### BR-SEC-004 — Least privilege for service credentials

Service role keys (Supabase, database) must never be used as a bypass for RLS in normal application logic.

**Rule:** Service credentials may only be used for migrations, background jobs, and administrative operations that require explicit human approval.

**Rule:** Agents using MCP tools must have read-only access in development/staging and require explicit human approval for production write operations.

---

## 10. Domain Decision Traceability

| Rule ID               | Domain Decision Reference (from `domain-model.md`) |
| --------------------- | -------------------------------------------------- |
| BR-TEN-001 to 004     | Section 13 (Cross-Tenant Invariants)               |
| BR-APT-001 to 005     | Section 3 (Scheduling Context) / Section 12 (Lifecycle) |
| BR-CUS-001 to 002     | Section 4 (Customer Context)                       |
| BR-CAT-001            | Section 5 (Catalog Context)                        |
| BR-INV-001 to 003     | Section 6 (Inventory Context)                      |
| BR-FIN-001 to 003     | Section 7 (Finance Context)                        |
| BR-COM-001 to 003     | Section 8 (Communication Context)                  |
| BR-PLT-001 to 002     | Section 10 (Platform Operations)                   |
| BR-SEC-001 to 004     | Section 13 (Cross-Tenant Invariants)               |

---

## 11. Agent Implementation Checklist

Before implementing behavior that involves business rules, answer:

```text
[ ] Which BR-* rules apply?
[ ] Are there state transitions involved?
[ ] Are there transactional side effects?
[ ] Is the operation idempotent?
[ ] What authorization is required (RBAC)?
[ ] Does the operation cross tenants? (Must NOT)
[ ] Are database invariants enforced (constraints, RLS)?
[ ] Are concurrency risks addressed (lock/constraint)?
[ ] Are historical snapshots required?
[ ] Is the operation auditable?
[ ] Is a feed event required (when active)?
```

---

## 12. Final Contract

The StyleFlow domain behavior must guarantee:

- **Tenant isolation:** No data leaks between tenants.
- **Concurrency safety:** No double-booking, no negative stock.
- **Immutability:** Financial and stock events are append-only.
- **Auditability:** Security-sensitive and financial events are recorded.
- **Operational visibility:** Relevant events appear in the Activity Feed for management.
- **Provider neutrality:** AI, WhatsApp, payment providers are adapters — not core domain dependencies.

Any deviation from these rules must be documented as a **superseding ADR**.