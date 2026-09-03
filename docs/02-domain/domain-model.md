# Domain Model — StyleFlow SaaS

**Status:** APPROVED TARGET  
**Version:** 1.0  
**Updated:** 2026-09-02  
**Scope:** MVP — Beauty / Salons & Aesthetic Centers  
**Authority:** Canonical domain model  

---

## 0. How Agents Must Use This Document

This document defines the **canonical domain vocabulary, boundaries, entities, relationships and domain‑level decisions**.

It is a source of truth for implementation.

### Authority rules

- `domain-model.md` defines **what exists and how it relates**.
- `business-rules.md` defines **behavioral rules and invariants**.
- `mvp.md` defines **product scope**.
- `architecture.md` defines **technical structure**.
- `security-baseline.md` defines **security requirements**.
- ADRs define **architectural decisions**.
- Source code must not silently introduce domain concepts absent from these documents.

### Before implementing a feature

The agent MUST:

1. identify the bounded context;
2. identify affected entities;
3. identify applicable business rules;
4. verify tenant ownership;
5. verify authorization requirements;
6. verify lifecycle/state transitions;
7. identify transactional side effects;
8. add/update tests;
9. update this document only if the domain itself changes.

### Classification

Every important domain decision should have one of these states:

| State          | Meaning                                             |
| -------------- | --------------------------------------------------- |
| `APPROVED`     | Explicitly decided and implementation-authoritative |
| `MVP`          | Approved for the current MVP                        |
| `FUTURE`       | Valid concept, intentionally postponed              |
| `OUT_OF_SCOPE` | Explicitly excluded                                 |
| `UNKNOWN`      | Not decided; agent MUST NOT invent behavior         |

---

# 1. Domain Principles

These principles are mandatory unless superseded by an explicit ADR.

### D-001 — Tenant isolation

Every operational entity belongs to exactly one tenant.

`tenant_id` is a platform‑level concept and must not be treated as an optional convenience filter.

### D-002 — Professional ≠ User

A `Professional` is a domain entity.

A professional MAY have an associated authenticated `User`, but authentication is not required for the professional to exist.

### D-003 — Database‑enforced invariants

Critical transactional invariants must be enforced as close to the data as practical.

Examples:

- tenant consistency;
- unique constraints;
- valid intervals;
- appointment conflict;
- referential integrity;
- financial/stock transactional integrity.

Application validation alone is insufficient for concurrency‑sensitive rules.

### D-004 — Historical truth

Transactional records preserve relevant historical values through snapshots.

Changing the catalog must not rewrite historical appointments.

### D-005 — Financial immutability

Financial events are append‑only.

Corrections create compensating events instead of editing historical financial events.

### D-006 — Inventory auditability

Stock changes are represented by auditable movements.

The current stock balance and its movement history must remain transactionally consistent.

### D-007 — Operational traceability

Relevant operational events may generate `ActivityFeed` records.

`ActivityFeed` is an operational projection/history mechanism and does not replace domain records or audit logs.

### D-008 — External integrations are adapters

WhatsApp, payment providers, fiscal providers and AI providers are external boundaries.

The core domain must not depend on a specific provider.

---

# 2. Bounded Contexts

```text
SAAS CORE
│
├── Tenant
├── Identity
├── Membership
├── RBAC
├── Audit
└── Billing [FUTURE]
        │
        ▼
DOMAIN PLATFORM
│
├── Scheduling
├── Customer
├── Catalog
├── Inventory
├── Finance
├── Communication
└── Platform Operations
        │
        ▼
BEAUTY VERTICAL
│
├── Anamnesis
└── Color Formula
```

## 2.1 SaaS Core

Reusable across future verticals.

### Tenant

Represents a business/customer organization using the SaaS.

Core concepts:

```text
id
name
timezone
currency
status
created_at
updated_at
```

Exact schema is defined separately in the data model.

**State:** `MVP`

### User

Authenticated identity managed by the authentication provider.

A User is not automatically a Professional.

**State:** `MVP`

### Membership

Associates a User with a Tenant.

Conceptually:

```text
User ── Membership ── Tenant
```

Membership contains:

- role;
- status;
- lifecycle;
- authorization context.

**State:** `MVP`

### Role / Permission

Defines what a member can do.

Initial role vocabulary:

```text
owner
admin
manager
receptionist
professional
financial
```

Roles are not themselves authorization logic. Permissions/capabilities define allowed operations.

**State:** `MVP`

### AuditLog

Immutable record of security‑sensitive or administratively important actions.

Examples:

```text
permission_changed
member_added
member_removed
financial_adjustment
critical_data_changed
```

`AuditLog` is different from `ActivityFeed`.

**State:** `MVP`

### Billing / Subscription

SaaS subscription, plan and payment lifecycle.

**State:** `FUTURE`

---

# 3. Scheduling Context

## 3.1 Professional

Person who performs one or more services.

Properties:

```text
id
tenant_id
name
active
user_id [optional]
```

Relationship:

```text
Tenant 1 ─── N Professional
Professional N ─── 0..1 User
```

A Professional MAY exist without a login account.

**State:** `MVP`

---

## 3.2 Service

Commercial service offered by the business.

Core concepts:

```text
id
tenant_id
name
category
price
duration_minutes
active
commission_percentage [if approved]
```

A Service may define expected product consumption.

**State:** `MVP`

---

## 3.3 Appointment

Scheduled operational event.

Core concepts:

```text
id
tenant_id
customer_id
professional_id
start_at
end_at
status
```

Current MVP supports **one Professional per Appointment**.

```text
Tenant
  └── Appointment
        ├── Customer
        ├── Professional
        └── AppointmentItems
```

### Appointment statuses

```text
scheduled
confirmed
completed
cancelled
no_show
```

Only `scheduled` and `confirmed` block professional availability.

**State:** `MVP`

---

## 3.4 AppointmentItem

Service performed/planned inside an appointment.

An Appointment contains one or more AppointmentItems.

```text
Appointment 1 ─── N AppointmentItem
AppointmentItem N ─── 1 Service
```

AppointmentItem preserves historical snapshots:

```text
service_name_snapshot
price_snapshot
duration_snapshot
```

The snapshot is authoritative for the historical appointment record.

**State:** `MVP`

---

## 3.5 Scheduling Invariant

For the same:

```text
tenant_id
professional_id
```

active blocking appointments may not overlap.

Use half‑open intervals:

```text
[start_at, end_at)
```

Therefore:

```text
10:00–11:00
11:00–12:00
```

are valid.

But:

```text
10:00–11:00
10:30–11:30
```

conflict.

The final persistence mechanism must enforce this at database level.

**State:** `MVP`

---

# 4. Customer Context

## 4.1 Customer

Person receiving services.

Core concepts:

```text
id
tenant_id
full_name
phone
email
birth_date
last_visit_at
status
```

A Customer belongs to exactly one Tenant.

**State:** `MVP`

---

## 4.2 CustomerNote

Operational notes associated with a Customer.

Notes must respect tenant authorization and data‑privacy requirements.

**State:** `MVP`

---

## 4.3 Anamnesis

Beauty‑specific customer information.

Potential data includes:

- allergies;
- sensitivity;
- previous chemical procedures;
- hair characteristics;
- restrictions;
- other technical information.

This data may be sensitive.

`privacy_level` is required as part of the domain model.

**State:** `MVP`

Access MUST be more restrictive than ordinary customer data when required by the security classification.

---

## 4.4 Loyalty

Points, rewards and loyalty history.

**State:** `FUTURE`

---

# 5. Catalog Context

## 5.1 ServiceProductDefault

Defines expected product consumption for a Service.

Example:

```text
Service: Hair Coloring
Product: Hair Color X
Expected quantity: 1.0
Unit: tube
```

Relationship:

```text
Service 1 ─── N ServiceProductDefault
Product 1 ─── N ServiceProductDefault
```

Expected consumption is **not** the same thing as actual consumption.

**State:** `MVP`

---

# 6. Inventory Context

## 6.1 Product

Physical item managed by the business.

Core concepts:

```text
id
tenant_id
name
sku
unit
cost_price
sale_price
stock_quantity
min_stock
expiry_date
active
```

**State:** `MVP`

---

## 6.2 AppointmentConsumption

Actual product consumption during an appointment.

```text
Appointment ─── N AppointmentConsumption
Product ─────── N AppointmentConsumption
```

Preserve relevant historical values:

```text
quantity
cost_price_snapshot
```

Expected consumption from `ServiceProductDefault` must not overwrite actual consumption.

**State:** `MVP`

---

## 6.3 StockMovement

Auditable inventory ledger.

Possible movement types:

```text
entry
consumption
adjustment
loss
sale
return
```

Exact movement vocabulary must remain aligned with the approved schema.

A StockMovement should reference its operational origin when applicable.

Example:

```text
Appointment
    ↓
AppointmentConsumption
    ↓
StockMovement
```

### Inventory invariant

Updating:

```text
products.stock_quantity
```

and creating:

```text
stock_movements
```

must occur atomically.

Normal historical movements are append‑only.

Corrections use compensating movements.

**State:** `MVP`

---

# 7. Finance Context

## 7.1 FinancialEvent

Authoritative financial ledger event.

Core concepts:

```text
id
tenant_id
amount
date
category
origin_type
origin_id
```

Examples:

```text
appointment_revenue
expense
commission
adjustment
refund
```

FinancialEvent is immutable.

Corrections use compensating events.

**State:** `MVP`

---

## 7.2 Expense

Operational expense.

Core concepts:

```text
id
tenant_id
amount
category
due_date
paid_at
recurrence
status
```

Expense represents the business operation.

FinancialEvent represents the accounting/ledger consequence.

Do not treat the two as interchangeable.

**State:** `MVP`

---

## 7.3 CommissionRule

Defines professional commission behavior.

Current MVP decision:

```text
percentage
based_on_net_value
```

Rules may be configured:

```text
global
professional
service
```

Precedence and conflict resolution must be defined in `business-rules.md`.

**State:** `MVP`

---

# 8. Communication Context

## 8.1 MessageTemplate

Provider‑neutral reusable message template.

Examples:

```text
appointment_confirmation
appointment_reminder
appointment_cancellation
```

Do not encode WhatsApp‑specific assumptions in the core entity.

**State:** `MVP`

---

## 8.2 AutomationRule

Defines when a message/action should be triggered.

Example:

```text
EVENT:
appointment.created

TRIGGER:
24h before appointment

ACTION:
send appointment reminder
```

**State:** `MVP`

---

## 8.3 OutboxMessage

Reliable outbound communication record.

Core concepts:

```text
id
tenant_id
destination
template_id
status
retry_count
error
scheduled_at
sent_at
```

Statuses:

```text
pending
sent
delivered
failed
```

OutboxMessage exists between the domain event and the external provider.

```text
Domain Event
     ↓
OutboxMessage
     ↓
Provider Adapter
     ↓
WhatsApp / other channel
```

The external provider must never become the source of truth for the business event.

**State:** `MVP`

---

# 9. Beauty Vertical

## 9.1 ColorFormula

Technical record of a color procedure.

May contain:

```text
customer_id
appointment_id [optional]
formula
proportions
oxidant
technique
```

The formula belongs to the Beauty vertical and should not leak beauty‑specific assumptions into platform contexts.

**State:** `MVP`

---

# 10. Platform Operations

## 10.1 ActivityFeed

Operational projection for management visibility.

Examples:

```text
appointment.created
appointment.cancelled
appointment.no_show

inventory.low_stock
inventory.expired

financial.invoice_due_soon

communication.message_failed
communication.reply_awaiting
```

Conceptual fields:

```text
id
tenant_id
category
event_type
status
entity_id
payload
created_at
resolved_at
assigned_to
```

Statuses:

```text
new
pending
resolved
awaiting
failed
```

### Important distinction

```text
Domain Entity
     │
     ├── authoritative business state
     │
     └── ActivityFeed
             └── operational visibility
```

ActivityFeed MUST NOT become the authoritative source for appointments, finance, inventory or customers.

**State:** `FUTURE`

The table may be introduced earlier for event collection if explicitly approved.

---

# 11. Relationship Map

```text
Tenant
│
├── Membership ─── User
│
├── Professional
│     └── User [optional]
│
├── Customer
│     ├── CustomerNote
│     ├── Anamnesis
│     └── ColorFormula
│
├── Service
│     └── ServiceProductDefault ─── Product
│
├── Appointment
│     ├── Customer
│     ├── Professional
│     ├── AppointmentItem ─── Service
│     ├── AppointmentConsumption ─── Product
│     └── FinancialEvent
│
├── Product
│     └── StockMovement
│
├── Expense
│     └── FinancialEvent
│
├── CommissionRule
│
├── MessageTemplate
│     └── AutomationRule
│
├── OutboxMessage
│
├── ActivityFeed
│
└── AuditLog
```

---

# 12. Lifecycle and Side Effects

## Appointment

```text
SCHEDULED
    │
    ▼
CONFIRMED
    │
    ▼
COMPLETED

SCHEDULED ───► CANCELLED
CONFIRMED ───► CANCELLED

SCHEDULED ───► NO_SHOW
CONFIRMED ───► NO_SHOW
```

### Completion

Completing an appointment MAY trigger a transactional workflow containing:

```text
Appointment → COMPLETED
       │
       ├── AppointmentConsumption
       ├── StockMovement
       ├── FinancialEvent
       ├── Commission calculation
       ├── Customer.last_visit_at
       └── ActivityFeed event
```

These side effects must be idempotent.

The exact transaction boundary is an implementation concern governed by the architecture and data model.

---

# 13. Cross‑Tenant Invariants

These are non‑negotiable.

### TENANT-001

Every tenant‑owned entity has a `tenant_id`.

### TENANT-002

A record may reference only records belonging to the same tenant.

Example:

```text
appointment.tenant_id
==
appointment.customer.tenant_id
==
appointment.professional.tenant_id
```

### TENANT-003

RLS must prevent cross‑tenant access even if application code contains a bug.

### TENANT-004

Application authorization must not rely solely on:

```sql
WHERE tenant_id = ?
```

### TENANT-005

Object‑level authorization is mandatory.

Knowing:

```text
appointment_id
```

must never be sufficient to access the appointment.

### TENANT-006

Privileged service credentials must not be used as a shortcut around tenant authorization.

---

# 14. Domain Decisions

| Decision                               | Status         | Current Rule                                                |
| -------------------------------------- | -------------- | ----------------------------------------------------------- |
| Tenant isolation                       | `APPROVED`     | All operational data is tenant‑scoped                       |
| Professional/User separation           | `APPROVED`     | Professional may exist without User                         |
| Multiple professionals per appointment | `OUT_OF_SCOPE` | One professional per appointment in MVP                     |
| Blocking appointment statuses          | `MVP`          | `scheduled`, `confirmed`                                    |
| Appointment overlap                    | `MVP`          | Forbidden for same tenant/professional                      |
| Interval semantics                     | `MVP`          | `[start_at, end_at)`                                        |
| Service snapshots                      | `APPROVED`     | Name, price and duration preserved                          |
| Inventory consumption                  | `MVP`          | Expected and actual consumption separated                   |
| Stock ledger                           | `MVP`          | Append‑only movements                                       |
| Financial ledger                       | `MVP`          | Append‑only events                                          |
| Commission                             | `MVP`          | Percentage over net value                                   |
| Anamnesis                              | `MVP`          | Restricted/privacy‑classified                               |
| Color formula                          | `MVP`          | Beauty‑specific                                             |
| WhatsApp reminders                     | `MVP`          | Provider‑neutral communication boundary                     |
| AI rescheduling suggestion             | `MVP`          | AI assists; deterministic domain rules remain authoritative |
| ActivityFeed                           | `FUTURE`       | Architecture prepared; operational dashboard later          |
| Loyalty                                | `FUTURE`       | Not MVP                                                     |
| Fiscal/NFS‑e                           | `OUT_OF_SCOPE` | Not MVP                                                     |
| Customer portal                        | `OUT_OF_SCOPE` | Not MVP                                                     |
| SaaS billing                           | `FUTURE`       | Platform capability                                         |
| Batch/lot tracking                     | `OUT_OF_SCOPE` | Not MVP                                                     |

---

# 15. Explicit Non‑Goals

Agents MUST NOT introduce these without an approved product/domain decision:

- multiple professionals per appointment;
- generic ERP abstractions;
- microservices;
- fiscal/NFS‑e domain;
- customer portal;
- loyalty system;
- inventory batch tracking;
- provider‑specific messaging entities;
- provider‑specific AI logic inside domain entities.

---

# 16. Domain vs. Infrastructure

The following concepts belong outside the core domain:

```text
Supabase client
Next.js
React
PostgreSQL driver
MCP
agy
OpenAI
Claude
Gemini
WhatsApp provider
Vercel
```

The domain should instead know:

```text
Customer
Appointment
Professional
Service
Product
FinancialEvent
StockMovement
Message
Automation
```

External technologies implement adapters around these concepts.

---

# 17. AI Domain Boundary

AI is an assisting capability, not a source of business authority.

Example:

```text
Customer asks to reschedule
          ↓
AI suggests possible times
          ↓
Scheduling domain validates availability
          ↓
Application executes approved operation
```

AI MUST NOT independently override:

- tenant isolation;
- permissions;
- appointment conflicts;
- financial invariants;
- inventory invariants;
- security policy.

The model provider is replaceable:

```text
AI Gateway
├── OpenAI adapter
├── Anthropic adapter
├── Google adapter
└── Future providers
```

---

# 18. Domain Change Protocol

When a feature requires a new domain concept:

```text
1. Identify gap
       ↓
2. Define concept
       ↓
3. Define bounded context
       ↓
4. Define relationships
       ↓
5. Define invariants
       ↓
6. Define lifecycle
       ↓
7. Update business-rules.md
       ↓
8. Update schema/spec
       ↓
9. Add tests
       ↓
10. Implement
```

Agents MUST NOT introduce a new entity merely because it makes implementation convenient.

First establish that the concept represents a real business/domain need.

---

# 19. Traceability

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
| Database            | `docs/06-data/schema.md`                |
| Security            | `docs/08-security/security-baseline.md` |
| TDD                 | `docs/09-quality/tdd.md`                |
| Testing             | `docs/09-quality/testing-strategy.md`   |
| Done criteria       | `docs/09-quality/definition-of-done.md` |

---

# 20. Agent Checklist

Before implementing domain behavior, answer:

```text
[ ] Which bounded context?
[ ] Which entity/entities?
[ ] Is each entity tenant-owned?
[ ] Which relationships are involved?
[ ] Which business rules apply?
[ ] Which state transitions are allowed?
[ ] Which invariants must the database enforce?
[ ] Are there concurrency risks?
[ ] Are historical snapshots required?
[ ] Are there transactional side effects?
[ ] Is the operation idempotent?
[ ] What authorization is required?
[ ] Is personal/sensitive data involved?
[ ] What tests prove the behavior?
[ ] Does the change alter the domain model?
```

If any critical answer is `UNKNOWN`, the agent MUST NOT invent the answer.

Record the uncertainty and request/produce a decision before implementation.

---

# 21. Final Domain Contract

The StyleFlow domain is built around this operational chain:

```text
CUSTOMER
   │
   ▼
APPOINTMENT
   │
   ├── PROFESSIONAL
   ├── APPOINTMENT ITEMS
   │       └── SERVICES
   │              └── EXPECTED CONSUMPTION
   │
   └── ACTUAL CONSUMPTION
              │
              ▼
          INVENTORY
              │
              ▼
        STOCK MOVEMENT

APPOINTMENT
     │
     ▼
FINANCIAL EVENT
     │
     ▼
FINANCIAL VISIBILITY

APPOINTMENT
     │
     ▼
COMMUNICATION
     │
     ▼
OUTBOX
     │
     ▼
EXTERNAL PROVIDER

ALL OPERATIONS
     │
     ├── AUDIT
     └── ACTIVITY FEED
```

The domain must remain:

**tenant‑isolated, historically accurate, concurrency‑safe, auditable, provider‑neutral and extensible without becoming a premature generic ERP.**