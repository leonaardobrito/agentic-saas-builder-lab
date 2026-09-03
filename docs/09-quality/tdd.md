# TDD — Test-Driven Development

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salões e Centros Estéticos
**Authority:** Processo de desenvolvimento orientado a testes

---

## 0. How Agents Must Use This Document

This document defines the **TDD workflow, rules, and discipline** that every agent must follow when implementing any business behavior.

It is the source of truth for the **development process**.

### Authority Rules

- `tdd.md` defines **the development workflow (RED → GREEN → REFACTOR)**.
- `testing-strategy.md` defines **what to test and at which level**.
- `definition-of-done.md` defines **completion criteria including testing**.
- `business-rules.md` defines **the behavioral invariants to validate (BR-*)**.
- `domain-model.md` defines **entities and relationships to test**.
- `multi-tenancy.md` defines **isolation tests required**.
- `security-baseline.md` defines **security test requirements**.

### Before implementing a feature

The agent MUST:

1. Identify the affected business rules (BR-*).
2. Write a **failing test** that expresses the desired behavior (RED).
3. Implement the **minimum code** to make the test pass (GREEN).
4. **Refactor** the code without changing behavior (REFACTOR).
5. Verify all tests pass before marking the feature as complete.

---

## 1. TDD Philosophy

> **"Write the test first, see it fail, write the minimum code to pass, then improve it."**

TDD is not just about testing—it is about **designing code from the outside-in**. Writing the test first forces you to think about:

1. **What is the expected behavior?** (Requirements)
2. **What is the interface?** (API/Use Case)
3. **What are the edge cases?** (Error handling)

TDD guarantees that every line of code has a reason to exist and is covered by automated verification.

### Why TDD is Mandatory in StyleFlow

- **Correctness:** Prevents regressions and ensures business rules (BR-*) are always enforced.
- **Concurrency safety:** Database constraints (GiST, unique, FK) are tested under realistic conditions.
- **Tenant isolation:** RLS policies are proven by integration tests.
- **Idempotency:** Retry-sensitive operations (Outbox, webhooks) are verified.
- **Refactoring confidence:** Tests act as a safety net for large refactors.

---

## 2. The Cycle: RED → GREEN → REFACTOR

```text
┌─────────────────────────────────────────────────────────────────┐
│                         TDD CYCLE                              │
│                                                                 │
│   🔴 RED                                                       │
│   Write a failing test that describes the desired behavior.    │
│   The test MUST fail for the intended reason.                 │
│                                                                 │
│       ↓                                                         │
│                                                                 │
│   🟢 GREEN                                                     │
│   Write the **minimum** code to make the test pass.            │
│   Do not over-engineer. Do not add features not required.     │
│                                                                 │
│       ↓                                                         │
│                                                                 │
│   🔵 REFACTOR                                                  │
│   Improve the code structure without changing behavior.        │
│   All tests must remain GREEN.                                 │
│                                                                 │
│       ↓                                                         │
│                                                                 │
│   🔄 VERIFY                                                    │
│   Run all relevant tests (unit, integration, E2E).            │
│   Ensure no regression occurred.                               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1. RED — Write a Failing Test

**Goal:** Define the behavior you want to implement.

**Rules:**
- Write the test **before** writing the implementation.
- The test must **fail for the intended reason** (e.g., "method not found", "assertion failed").
- The test should be **small** and focus on **one behavior**.

**Example:**
```typescript
// features/appointments/__tests__/create-appointment.test.ts
import { CreateAppointment } from '../application/create-appointment';
import { InMemoryAppointmentRepository } from './mocks/in-memory-repository';

describe('CreateAppointment (BR-APT-003)', () => {
  it('should throw APPOINTMENT_CONFLICT when same professional is already booked', async () => {
    // Arrange
    const repo = new InMemoryAppointmentRepository();
    repo.addConflict({
      tenantId: 'tenant-1',
      professionalId: 'prof-1',
      startAt: new Date('2026-09-03T10:00:00Z'),
      endAt: new Date('2026-09-03T11:00:00Z'),
    });
    const useCase = new CreateAppointment(repo);

    // Act & Assert
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        professionalId: 'prof-1',
        startAt: new Date('2026-09-03T10:30:00Z'),
        endAt: new Date('2026-09-03T11:30:00Z'),
      })
    ).rejects.toThrow('APPOINTMENT_CONFLICT');
  });
});
```
*Execution: ❌ FAILS (RED) because `CreateAppointment` does not exist yet.*

### 2.2. GREEN — Write the Minimum Code

**Goal:** Make the test pass as quickly as possible.

**Rules:**
- Write the **simplest code** that passes the test.
- Do not optimize. Do not add abstractions.
- Do not worry about code quality yet (that comes in REFACTOR).

**Example (Minimum Implementation):**
```typescript
// features/appointments/application/create-appointment.ts
export class CreateAppointment {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(input: Input): Promise<Appointment> {
    const conflicts = await this.repository.findConflicts(input);
    if (conflicts.length > 0) {
      throw new Error('APPOINTMENT_CONFLICT');
    }
    return this.repository.save(input);
  }
}
```
*Execution: ✅ PASSES (GREEN).*

### 2.3. REFACTOR — Improve the Code

**Goal:** Improve the code structure without changing behavior.

**Rules:**
- Extract methods, rename variables, improve naming.
- Remove duplication, add appropriate abstractions.
- **All tests must remain GREEN** after each change.

**Example (Refactored):**
```typescript
export class CreateAppointment {
  constructor(private readonly repository: IAppointmentRepository) {}

  async execute(input: Input): Promise<Appointment> {
    this.validateInterval(input);
    await this.ensureNoConflict(input);
    return this.save(input);
  }

  private validateInterval(input: Input) {
    if (input.endAt <= input.startAt) {
      throw new InvalidAppointmentIntervalError();
    }
  }

  private async ensureNoConflict(input: Input) {
    const conflicts = await this.repository.findConflicts(input);
    if (conflicts.length > 0) {
      throw new AppointmentConflictError();
    }
  }

  private async save(input: Input) {
    return this.repository.save(input);
  }
}
```
*Execution: ✅ ALL TESTS PASS (GREEN).*

---

## 3. TDD in Practice: Step-by-Step Workflow

When implementing a feature, follow these steps:

| Step | Action | Artifact |
| :--- | :--- | :--- |
| **1** | Read the specification (`specs/`) or product decision. | Understand the behavior. |
| **2** | Identify the bounded context and affected entities. | `domain-model.md` |
| **3** | Identify applicable business rules (BR-*). | `business-rules.md` |
| **4** | Write the **Domain/Unit test** first (RED). | `__tests__/domain/` |
| **5** | Implement the **Domain entity/rule** (GREEN). | `domain/entities/` |
| **6** | Write the **Application/Use Case test** (RED). | `__tests__/application/` |
| **7** | Implement the **Use Case** (GREEN). | `application/use-cases/` |
| **8** | Write the **Integration test** (if database/RLS). | `__tests__/integration/` |
| **9** | Implement the **Repository/Infrastructure** (GREEN). | `infrastructure/repositories/` |
| **10** | Refactor (REFACTOR) and ensure all tests pass. | — |
| **11** | Write the **E2E test** (if critical UI flow). | `e2e/` |
| **12** | Verify all tests pass in CI. | — |

### 3.1. Example TDD Session: Appointment Conflict (BR-APT-003)

**Context:** Implementing the rule that prevents overlapping appointments for the same professional.

1. **RED (Unit Test):**
   - Write a test that creates two conflicting appointments in an in-memory repository.
   - Assert that the second one throws `APPOINTMENT_CONFLICT`.

2. **GREEN (Domain Rule):**
   - Implement the conflict detection logic in the Use Case.
   - Use `findConflicts` on the repository.
   - If conflicts found, throw error.

3. **REFACTOR:**
   - Extract conflict detection to a separate method.
   - Improve error messages and error classes.

4. **RED (Integration Test):**
   - Write an integration test that tries to insert two overlapping appointments into Supabase (local).
   - Use `Promise.allSettled` to simulate concurrency.
   - Assert that exactly one succeeds and the other fails with the GiST exclusion constraint error.

5. **GREEN (Database Constraint):**
   - Ensure the GiST constraint exists in the schema.
   - Verify the constraint is active.

6. **REFACTOR:**
   - Ensure the integration test is idempotent and uses transactions.

7. **VERIFY:**
   - Run `npm run test:ci` (unit + integration) and ensure all pass.

---

## 4. TDD for Different Test Levels

### 4.1. Unit Tests (Vitest)

- **Focus:** Pure logic (domain entities, value objects, calculations).
- **Mocking:** Mock repositories, external services.
- **Examples:**
  - `Appointment.isOverlapping()` → test interval comparisons.
  - `CommissionRule.calculate()` → test commission math.
  - `Zod schemas` → test valid/invalid inputs.

### 4.2. Integration Tests (Vitest + Supabase Local)

- **Focus:** Database interaction, RLS, constraints, transactions.
- **Environment:** `supabase start` with a clean database.
- **Examples:**
  - `AppointmentRepository.findConflicts()` → test real SQL query.
  - **Concurrency test:** `Promise.allSettled` with two conflicting INSERTs → GiST constraint must block one.
  - **RLS isolation:** Tenant A attempts to read Tenant B data → must return 0 rows.
  - **Composite FK:** Attempt to insert appointment with professional from a different tenant → FK violation.

**Example Concurrency Integration Test:**
```typescript
import { createClient } from '@supabase/supabase-js';
import { test, expect } from 'vitest';

test('should prevent double booking with GiST constraint (BR-APT-003)', async () => {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

  const appointment1 = {
    tenant_id: 'test-tenant',
    professional_id: 'test-professional',
    customer_id: 'test-customer',
    start_at: '2026-09-03T10:00:00Z',
    end_at: '2026-09-03T11:00:00Z',
    status: 'scheduled',
  };

  const appointment2 = {
    ...appointment1,
    start_at: '2026-09-03T10:30:00Z',
    end_at: '2026-09-03T11:30:00Z',
  };

  // Try to insert both concurrently
  const results = await Promise.allSettled([
    supabase.from('appointments').insert(appointment1),
    supabase.from('appointments').insert(appointment2),
  ]);

  const successCount = results.filter(r => r.status === 'fulfilled').length;
  expect(successCount).toBe(1);

  const failure = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
  expect(failure.reason.message).toContain('duplicate key value violates unique constraint');
});
```

### 4.3. E2E Tests (Playwright)

- **Focus:** Critical user workflows (full stack).
- **Mocking:** External APIs (WhatsApp, payments) are mocked.
- **Examples:**
  - Create appointment → Complete appointment → Verify stock consumed, financial event created, customer last_visit_at updated.

---

## 5. Refactoring Discipline

### 5.1. When to Refactor

Refactor **only** after the test passes (GREEN) and **only** to improve:

- **Naming:** Variables, methods, classes.
- **Structure:** Extract methods, reduce duplication.
- **Testability:** Improve decoupling.
- **Readability:** Simplify complex logic.

### 5.2. Refactoring Rules

- **Never refactor** while tests are RED (fix the test or implementation first).
- **Run tests after each refactoring step** to ensure behavior is preserved.
- **Keep refactors small** and focused on one improvement at a time.
- **Do not combine refactoring with new features** in the same commit.

### 5.3. Refactoring Checklist

```text
[ ] Tests are GREEN before starting refactor.
[ ] I understand the behavior of the code being refactored.
[ ] I have identified the "smell" I want to fix (duplication, long method, poor naming).
[ ] I make small, incremental changes.
[ ] I run tests after each change.
[ ] I commit after the refactor (separate from feature commit).
```

---

## 6. Common Pitfalls and How to Avoid Them

| Pitfall | Why It's Bad | How to Avoid |
| :--- | :--- | :--- |
| **Writing tests after implementation** | You lose the design benefits; you may miss edge cases. | **Always** write the test first. |
| **Ignoring failing tests** | Hides bugs and allows regressions. | **Never** ignore a failing test. Fix it immediately. |
| **Refactoring while RED** | You don't know if the refactor preserves behavior. | **Only** refactor when tests are GREEN. |
| **Testing implementation details** | Makes tests brittle and hard to refactor. | Test **behavior** (public methods, outputs), not private internals. |
| **Over-mocking** | Tests become tied to implementation; refactors break them. | Use integration tests for infrastructure; unit tests for pure logic. |
| **Skipping integration tests** | Application-layer tests don't catch database/RLS issues. | Always add integration tests for repositories and constraints. |
| **Skipping concurrency tests** | The app may fail under high load. | Always test race conditions with `Promise.allSettled`. |
| **Claiming tests pass without running them** | Bad faith; undermines quality. | **Never** claim a test passes unless you ran it and saw the result. |

---

## 7. Agent Checklist (TDD)

Before submitting any code, verify:

```text
[ ] Did I write the test BEFORE the implementation?
[ ] Did the test fail for the correct reason (RED)?
[ ] Did I write the minimum code to pass (GREEN)?
[ ] Did I refactor the code (REFACTOR) and keep tests GREEN?
[ ] Are unit tests covering pure domain logic (entities, value objects, calculations)?
[ ] Are integration tests covering repositories, RLS, and constraints (GiST, FKs)?
[ ] Are concurrency tests written for scheduling/inventory/outbox?
[ ] Are tenant isolation tests written (RLS cross-tenant)?
[ ] Did I run all relevant tests locally (`npm run test:ci`)?
[ ] Did I verify the tests pass in CI (if available)?
[ ] Is the PR description clear about the tests added and their purpose?
```

---

## 8. Traceability

| Concern                 | Canonical Document                      |
| ----------------------- | --------------------------------------- |
| TDD workflow            | `tdd.md`                                |
| What to test            | `testing-strategy.md`                   |
| Domain to test          | `domain-model.md`                       |
| Business rules to test  | `business-rules.md` (BR-*)              |
| Tenant isolation tests  | `multi-tenancy.md`                      |
| Security testing        | `security-baseline.md`                  |
| Done criteria           | `definition-of-done.md`                 |

---

## 9. Final TDD Contract

StyleFlow's TDD discipline guarantees:

- **Every business rule (BR-*) is validated by at least one test.**
- **Concurrency-sensitive operations** (scheduling, stock, financial) are tested under race conditions.
- **Tenant isolation** is proven by integration tests.
- **Idempotent operations** (Outbox, webhooks) are tested for duplicate behavior.
- **Refactoring is safe** because tests cover critical behavior.

**Failure to follow TDD is a violation of the engineering contract.** Agents must not implement features without following the RED → GREEN → REFACTOR cycle.

---

*End of tdd.md*