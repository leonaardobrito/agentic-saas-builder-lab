# Data Schema — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salões e Centros Estéticos
**Authority:** Esquema físico do banco de dados, relacionamentos, índices, constraints e RLS

---

## 0. How Agents Must Use This Document

This document defines the **canonical database schema** for the StyleFlow platform.

It is the source of truth for:
- Understanding table structures, columns, and data types.
- Understanding relationships between entities (foreign keys).
- Understanding indexes and performance optimizations.
- Understanding RLS policies and security enforcement.
- Designing queries and migrations.

### Authority Rules

- `schema.md` defines **the physical database schema**.
- `domain-model.md` defines **the logical domain model** (entities and relationships).
- `business-rules.md` defines **behavioral invariants enforced by constraints**.
- `multi-tenancy.md` defines **tenant isolation requirements**.
- `security-baseline.md` defines **RLS and security policies**.
- `0001_foundation.sql` is the **executable migration** that implements this schema.

### Before writing queries or migrations

The agent MUST:
1. Verify that the table and column exist in this document.
2. Verify that the relationship is correctly defined (foreign keys).
3. Verify that the appropriate indexes are used for performance.
4. Verify that RLS policies are respected (data is tenant-isolated).
5. Update `schema.md` when adding new tables or columns (then create a migration).

---

## 1. Schema Design Principles

1. **Tenant Isolation:** Every operational table contains a `tenant_id` column that references `tenants(id)`. Composite foreign keys are used for cross-entity references to enforce tenant consistency.

2. **Immutable Ledgers:** `financial_events`, `stock_movements`, and `audit_logs` are append-only. Historical records are never updated or deleted. Corrections use compensating entries.

3. **Historical Snapshots:** `appointment_items` and `appointment_consumptions` preserve historical values (price, duration, cost) as snapshots, so catalog changes do not rewrite history.

4. **Database-Enforced Invariants:** Critical rules (appointment conflicts, valid intervals, stock non-negativity) are enforced by PostgreSQL constraints (CHECK, EXCLUDE, FOREIGN KEY).

5. **Soft Delete:** Entities that support soft deletion use a `deleted_at` timestamp. Soft-deleted records are excluded from normal queries (`WHERE deleted_at IS NULL`).

6. **Concurrency Safety:** The GiST exclusion constraint on `appointments` prevents double-booking at the database level, even under concurrent requests.

7. **RLS by Default:** Row Level Security is enabled on all tenant-owned tables. Policies are action-specific (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) and role-aware.

---

## 2. Entity Relationship Diagram (Conceptual)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           SAAS CORE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ tenants                                                                 │
│    │                                                                   │
│    └── memberships ─── users (auth.users)                             │
│    │                                                                   │
│    └── audit_logs                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DOMAIN PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────┤
│ scheduling                                                              │
│    ├── professionals                                                   │
│    ├── services                                                        │
│    └── appointments                                                    │
│           ├── appointment_items                                        │
│           └── appointment_consumptions                                 │
│                                                                        │
│ customer                                                               │
│    ├── customers                                                       │
│    ├── customer_notes                                                  │
│    └── anamnesis                                                       │
│                                                                        │
│ catalog                                                                │
│    └── service_product_defaults                                        │
│                                                                        │
│ inventory                                                              │
│    ├── products                                                        │
│    └── stock_movements                                                 │
│                                                                        │
│ finance                                                                │
│    ├── financial_events                                                │
│    ├── expenses                                                        │
│    └── commission_rules                                                │
│                                                                        │
│ communication                                                          │
│    ├── message_templates                                               │
│    ├── automation_rules                                                │
│    └── outbox_messages                                                 │
│                                                                        │
│ platform_operations                                                     │
│    └── activity_feed (future)                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BEAUTY VERTICAL                                 │
├─────────────────────────────────────────────────────────────────────────┤
│    └── color_formulas                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Table Definitions

### 3.1. SaaS Core Tables

#### `tenants`
Customer organizations (salons) in the multi-tenant SaaS.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique tenant identifier. |
| `name` | `text` | `NOT NULL, CHECK (length(trim(name)) >= 2)` | Business name. |
| `timezone` | `text` | `NOT NULL DEFAULT 'America/Sao_Paulo'` | Business timezone. |
| `currency` | `text` | `NOT NULL DEFAULT 'BRL'` | Primary currency. |
| `status` | `text` | `NOT NULL DEFAULT 'active', CHECK (status IN ('active', 'suspended', 'inactive'))` | Tenant lifecycle status. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |
| `deleted_at` | `timestamptz` | — | Soft-delete timestamp. |

**Indexes:** `idx_tenants_name`, `idx_tenants_status`

**RLS:** Select only for members (`tenants_select_policy`).

---

#### `memberships`
User membership in a tenant with role-based access.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE, PRIMARY KEY (tenant_id, user_id)` | Tenant reference. |
| `user_id` | `uuid` | `REFERENCES auth.users(id) ON DELETE CASCADE` | User reference. |
| `role` | `text` | `NOT NULL, CHECK (role IN ('owner', 'admin', 'manager', 'receptionist', 'professional', 'financial'))` | RBAC role. |
| `is_active` | `boolean` | `NOT NULL DEFAULT true` | Active membership flag. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |

**Indexes:** `idx_memberships_user_id`, `idx_memberships_role`, `idx_memberships_is_active`

**RLS:** Members can view their own; owners/admins can manage (`memberships_select_policy`, `memberships_insert_policy`, `memberships_update_policy`, `memberships_delete_policy`).

---

#### `audit_logs`
Immutable audit trail for security-sensitive actions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique log identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `user_id` | `uuid` | `REFERENCES auth.users(id) ON DELETE SET NULL` | User who performed the action. |
| `action` | `text` | `NOT NULL` | Action name (e.g., 'financial_adjustment', 'member_removed'). |
| `old_payload` | `jsonb` | — | Previous state (JSON). |
| `new_payload` | `jsonb` | — | New state (JSON). |
| `ip_address` | `text` | — | Client IP address (if available). |
| `user_agent` | `text` | — | Client user agent. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Timestamp of action. |

**Indexes:** `idx_audit_logs_tenant_created`, `idx_audit_logs_user`

**RLS:** Only owners/admins can view; inserts allowed for members (`audit_logs_select_policy`, `audit_logs_insert_policy`).

---

### 3.2. Scheduling Tables

#### `professionals`
Service providers (may or may not have a login).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique professional identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `name` | `text` | `NOT NULL, CHECK (length(trim(name)) >= 2)` | Professional's display name. |
| `user_id` | `uuid` | `REFERENCES auth.users(id) ON DELETE SET NULL` | Optional user account (NULL = no login). |
| `active` | `boolean` | `NOT NULL DEFAULT true` | Professional active status. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |
| `deleted_at` | `timestamptz` | — | Soft-delete timestamp. |

**Indexes:** `idx_professionals_tenant_name`, `idx_professionals_user_id`

**RLS:** Standard tenant member policies.

---

#### `services`
Service catalog.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique service identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `name` | `text` | `NOT NULL, CHECK (length(trim(name)) >= 2)` | Service name. |
| `category` | `text` | — | Service category (e.g., 'corte', 'coloração'). |
| `price` | `numeric(12,2)` | `NOT NULL CHECK (price >= 0)` | Default price. |
| `duration_minutes` | `integer` | `NOT NULL CHECK (duration_minutes >= 15)` | Default duration. |
| `active` | `boolean` | `NOT NULL DEFAULT true` | Active status. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |
| `deleted_at` | `timestamptz` | — | Soft-delete timestamp. |

**Indexes:** `idx_services_tenant_name`, `idx_services_active`

**RLS:** Standard tenant member policies.

---

#### `appointments`
Core scheduling entity.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique appointment identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `professional_id` | `uuid` | `FOREIGN KEY (tenant_id, professional_id) REFERENCES professionals(tenant_id, id) ON DELETE RESTRICT` | Professional reference (composite FK). |
| `customer_id` | `uuid` | `FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id) ON DELETE RESTRICT` | Customer reference (composite FK). |
| `start_at` | `timestamptz` | `NOT NULL` | Appointment start time. |
| `end_at` | `timestamptz` | `NOT NULL` | Appointment end time. |
| `status` | `text` | `NOT NULL DEFAULT 'scheduled', CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'))` | Current status. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |
| `deleted_at` | `timestamptz` | — | Soft-delete timestamp. |

**Constraints:**
- `CHECK (end_at > start_at)` — interval validity.
- **GiST Exclusion Constraint:** Prevents overlapping appointments for same tenant and professional (active statuses only). This is the **concurrency safety** mechanism.

**Indexes:** `idx_appointments_tenant_professional_start`, `idx_appointments_tenant_customer_start`, `idx_appointments_tenant_status`, `idx_appointments_tenant_start`

**RLS:** Members can select; professionals see only their own; owners/admins/managers/receptionists see all; insert/update requires appropriate role.

---

#### `appointment_items`
Service items within an appointment (historical snapshots).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique item identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `appointment_id` | `uuid` | `FOREIGN KEY (tenant_id, appointment_id) REFERENCES appointments(tenant_id, id) ON DELETE CASCADE` | Appointment reference (composite FK). |
| `service_id` | `uuid` | — | Optional service reference (NULL if service deleted). |
| `name_snapshot` | `text` | `NOT NULL` | Service name at the time of appointment. |
| `price_snapshot` | `numeric(12,2)` | `NOT NULL CHECK (price_snapshot >= 0)` | Service price at the time of appointment. |
| `duration_snapshot` | `integer` | `NOT NULL CHECK (duration_snapshot >= 15)` | Service duration at the time of appointment. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |

**Indexes:** Implicit via FK on `appointment_id`.

**RLS:** Standard tenant member policies.

---

### 3.3. Customer Tables

#### `customers`
Customers receiving services (CPF required).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique customer identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `full_name` | `text` | `NOT NULL, CHECK (length(trim(full_name)) >= 2)` | Full name. |
| `cpf` | `text` | `NOT NULL, CHECK (length(trim(cpf)) = 11)` | CPF (Brazilian ID) — **required**. |
| `phone` | `text` | — | Phone number. |
| `email` | `text` | — | Email address. |
| `birth_date` | `date` | — | Date of birth. |
| `last_visit_at` | `timestamptz` | — | Last appointment timestamp. |
| `status` | `text` | `NOT NULL DEFAULT 'active', CHECK (status IN ('active', 'inactive', 'blocked'))` | Customer status. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |
| `deleted_at` | `timestamptz` | — | Soft-delete timestamp. |

**Constraints:** `UNIQUE (tenant_id, cpf)`

**Indexes:** `idx_customers_tenant_name`, `idx_customers_tenant_phone`, `idx_customers_tenant_cpf`, `idx_customers_last_visit`

**RLS:** Standard tenant member policies.

---

#### `customer_notes`
Operational notes about customers.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique note identifier. |
| `customer_id` | `uuid` | `REFERENCES customers(id) ON DELETE CASCADE` | Customer reference. |
| `note` | `text` | `NOT NULL` | Note content. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `created_by` | `uuid` | `REFERENCES auth.users(id) ON DELETE SET NULL` | User who created the note. |

**Indexes:** Implicit via FK on `customer_id`.

**RLS:** Members with appropriate roles can view/manage.

---

#### `anamnesis`
Beauty-specific sensitive customer data (privacy-classified).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique record identifier. |
| `customer_id` | `uuid` | `REFERENCES customers(id) ON DELETE CASCADE, UNIQUE (customer_id)` | Customer reference. |
| `allergies` | `text` | — | Allergies. |
| `sensitivity` | `text` | — | Skin/hair sensitivity. |
| `hair_type` | `text` | — | Hair type (e.g., 'liso', 'crespo', 'ondulado'). |
| `health_restrictions` | `text` | — | Health restrictions. |
| `privacy_level` | `text` | `NOT NULL DEFAULT 'restricted', CHECK (privacy_level IN ('restricted', 'internal', 'public'))` | Access control level. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |

**RLS:** Restricted access (owner, admin, manager, or the professional caring for the customer).

---

### 3.4. Catalog & Inventory Tables

#### `service_product_defaults`
Expected product consumption per service.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique record identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `service_id` | `uuid` | `REFERENCES services(id) ON DELETE CASCADE` | Service reference. |
| `product_id` | `uuid` | `FOREIGN KEY (tenant_id, product_id) REFERENCES products(tenant_id, id) ON DELETE CASCADE` | Product reference (composite FK). |
| `expected_quantity` | `numeric(12,4)` | `NOT NULL CHECK (expected_quantity > 0)` | Expected quantity. |
| `unit` | `text` | — | Unit of measure. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |

**Indexes:** Implicit via FKs.

**RLS:** Standard tenant member policies.

---

#### `products`
Inventory items with stock tracking.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique product identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `name` | `text` | `NOT NULL, CHECK (length(trim(name)) >= 2)` | Product name. |
| `sku` | `text` | — | Stock Keeping Unit. |
| `unit` | `text` | — | Unit of measure (e.g., 'un', 'kg', 'ml'). |
| `cost_price` | `numeric(12,2)` | `NOT NULL CHECK (cost_price >= 0)` | Cost price. |
| `sale_price` | `numeric(12,2)` | `CHECK (sale_price >= 0)` | Sale price. |
| `stock_quantity` | `numeric(12,4)` | `NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0)` | Current stock quantity. |
| `min_stock` | `numeric(12,4)` | `NOT NULL DEFAULT 0 CHECK (min_stock >= 0)` | Minimum stock alert level. |
| `expiry_date` | `date` | — | Expiry date (optional). |
| `active` | `boolean` | `NOT NULL DEFAULT true` | Active status. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |
| `deleted_at` | `timestamptz` | — | Soft-delete timestamp. |

**Indexes:** `idx_products_tenant_name`, `idx_products_tenant_stock`

**RLS:** Standard tenant member policies.

---

#### `stock_movements`
Auditable stock ledger (append-only).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique movement identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `product_id` | `uuid` | `REFERENCES products(id) ON DELETE RESTRICT` | Product reference. |
| `quantity` | `numeric(12,4)` | `NOT NULL` | Quantity changed (positive or negative). |
| `movement_type` | `text` | `NOT NULL, CHECK (movement_type IN ('entry', 'consumption', 'adjustment', 'loss', 'sale', 'return'))` | Type of movement. |
| `origin_type` | `text` | — | Origin type (e.g., 'appointment', 'purchase'). |
| `origin_id` | `uuid` | — | Origin record ID. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `created_by` | `uuid` | `REFERENCES auth.users(id) ON DELETE SET NULL` | User who performed the movement. |

**Indexes:** `idx_stock_movements_product`, `idx_stock_movements_origin`

**RLS:** Standard tenant member policies (insert only; no updates/deletes allowed).

---

#### `appointment_consumptions`
Actual product consumption per appointment (snapshot).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique consumption identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `appointment_id` | `uuid` | `FOREIGN KEY (tenant_id, appointment_id) REFERENCES appointments(tenant_id, id) ON DELETE CASCADE` | Appointment reference (composite FK). |
| `product_id` | `uuid` | `REFERENCES products(id) ON DELETE RESTRICT` | Product reference. |
| `quantity` | `numeric(12,4)` | `NOT NULL CHECK (quantity > 0)` | Quantity consumed. |
| `cost_price_snapshot` | `numeric(12,2)` | `NOT NULL CHECK (cost_price_snapshot >= 0)` | Cost price at the time of consumption. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |

**Indexes:** Implicit via FKs.

**RLS:** Standard tenant member policies.

---

### 3.5. Finance Tables

#### `financial_events`
Authoritative financial ledger (append-only).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique event identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `amount` | `numeric(12,2)` | `NOT NULL` | Amount (positive for income, negative for expense). |
| `date` | `date` | `NOT NULL` | Event date. |
| `category` | `text` | `NOT NULL` | Category (e.g., 'appointment_revenue', 'commission', 'expense'). |
| `origin_type` | `text` | `NOT NULL, CHECK (origin_type IN ('appointment', 'expense', 'commission', 'adjustment', 'refund'))` | Type of origin. |
| `origin_id` | `uuid` | — | Origin record ID. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |

**Indexes:** `idx_financial_events_tenant_date`, `idx_financial_events_tenant_origin`

**RLS:** Standard tenant member policies (select and insert only; no updates/deletes).

---

#### `expenses`
Operational expenses with payment tracking.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique expense identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `amount` | `numeric(12,2)` | `NOT NULL CHECK (amount > 0)` | Expense amount. |
| `category` | `text` | `NOT NULL` | Expense category (e.g., 'rent', 'utilities', 'supplies'). |
| `due_date` | `date` | `NOT NULL` | Due date. |
| `paid_at` | `timestamptz` | — | When paid (NULL if pending). |
| `recurrence` | `text` | `CHECK (recurrence IN ('none', 'monthly', 'yearly'))` | Recurrence pattern. |
| `status` | `text` | `NOT NULL DEFAULT 'pending', CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled'))` | Payment status. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |

**Indexes:** `idx_expenses_tenant_due_date`, `idx_expenses_tenant_status`

**RLS:** Standard tenant member policies.

---

#### `commission_rules`
Commission configuration per professional/service.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique rule identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `professional_id` | `uuid` | `REFERENCES professionals(id) ON DELETE CASCADE` | Professional reference (NULL for global rule). |
| `service_id` | `uuid` | `REFERENCES services(id) ON DELETE CASCADE` | Service reference (NULL for professional/global rule). |
| `percentage` | `numeric(5,2)` | `NOT NULL CHECK (percentage >= 0 AND percentage <= 100)` | Commission percentage. |
| `based_on_net_value` | `boolean` | `NOT NULL DEFAULT true` | If true, calculated after discounts. |
| `applies_to` | `text` | `NOT NULL DEFAULT 'global', CHECK (applies_to IN ('global', 'professional', 'service'))` | Scope of the rule. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |

**Indexes:** `idx_commission_rules_tenant_professional`, `idx_commission_rules_tenant_service`

**RLS:** Standard tenant member policies (financial roles can manage).

---

### 3.6. Communication Tables

#### `message_templates`
Provider-neutral message templates.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique template identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `name` | `text` | `NOT NULL, CHECK (length(trim(name)) >= 2)` | Template name. |
| `body` | `text` | `NOT NULL` | Template body (can contain variables). |
| `variables` | `jsonb` | — | Variable definitions. |
| `active` | `boolean` | `NOT NULL DEFAULT true` | Active status. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |

**Indexes:** `idx_message_templates_tenant_name`, `idx_message_templates_active`

**RLS:** Standard tenant member policies.

---

#### `automation_rules`
Rules triggering message sends based on events.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique rule identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `event_type` | `text` | `NOT NULL` | Domain event (e.g., 'appointment.created'). |
| `template_id` | `uuid` | `REFERENCES message_templates(id) ON DELETE CASCADE` | Template to send. |
| `delay_minutes` | `integer` | `NOT NULL DEFAULT 0` | Delay before sending. |
| `active` | `boolean` | `NOT NULL DEFAULT true` | Active status. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |

**Indexes:** `idx_automation_rules_event_type`, `idx_automation_rules_active`

**RLS:** Standard tenant member policies.

---

#### `outbox_messages`
Reliable outbound communication (outbox pattern).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique message identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `destination` | `text` | `NOT NULL` | Destination address (phone, email). |
| `template_id` | `uuid` | `REFERENCES message_templates(id) ON DELETE CASCADE` | Template used. |
| `status` | `text` | `NOT NULL DEFAULT 'pending', CHECK (status IN ('pending', 'sent', 'delivered', 'failed'))` | Current status. |
| `retry_count` | `integer` | `NOT NULL DEFAULT 0` | Number of retries attempted. |
| `error` | `text` | — | Error message (if failed). |
| `scheduled_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Scheduled send time. |
| `sent_at` | `timestamptz` | — | Actual send time. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |

**Indexes:** `idx_outbox_messages_status_scheduled`

**RLS:** Standard tenant member policies.

---

### 3.7. Beauty Vertical Tables

#### `color_formulas`
Beauty-specific color formula records.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique formula identifier. |
| `customer_id` | `uuid` | `REFERENCES customers(id) ON DELETE CASCADE` | Customer reference. |
| `appointment_id` | `uuid` | `REFERENCES appointments(id) ON DELETE SET NULL` | Appointment reference (optional). |
| `formula` | `text` | — | Formula description. |
| `proportions` | `jsonb` | — | Proportions of each product. |
| `oxidant` | `text` | — | Oxidant used. |
| `technique` | `text` | — | Application technique. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Last update timestamp. |

**Indexes:** `idx_color_formulas_customer`

**RLS:** Standard tenant member policies (restricted access via customer tenant).

---

### 3.8. Platform Operations Tables (Future)

#### `activity_feed`
Operational visibility projection (append-only).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique feed identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `category` | `text` | `NOT NULL, CHECK (category IN ('appointment', 'cash', 'inventory', 'communication'))` | Event category. |
| `event_type` | `text` | `NOT NULL` | Event type (e.g., 'created', 'cancelled', 'low_stock'). |
| `status` | `text` | `NOT NULL, CHECK (status IN ('new', 'pending', 'resolved', 'awaiting', 'failed'))` | Current status. |
| `entity_id` | `uuid` | `NOT NULL` | ID of the source entity. |
| `payload` | `jsonb` | `NOT NULL` | Contextual data (sanitized, no sensitive info). |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Creation timestamp. |
| `resolved_at` | `timestamptz` | — | When the event was resolved. |
| `assigned_to` | `uuid` | `REFERENCES auth.users(id) ON DELETE SET NULL` | User assigned to the event. |

**Indexes:** `idx_activity_feed_tenant_category_status`, `idx_activity_feed_tenant_created`

**RLS:** Read-only for members; insert only via triggers/application.

---

## 4. Future Tables

The following tables are defined in the domain model but **not yet implemented** in the MVP schema. They will be added via migrations.

#### `cash_registers` (Future)
Cash register session management.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique register identifier. |
| `tenant_id` | `uuid` | `REFERENCES tenants(id) ON DELETE CASCADE` | Tenant reference. |
| `opened_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Opening time. |
| `closed_at` | `timestamptz` | — | Closing time. |
| `initial_amount` | `numeric(12,2)` | `NOT NULL DEFAULT 0` | Initial cash amount. |
| `final_amount` | `numeric(12,2)` | — | Final cash amount. |
| `status` | `text` | `NOT NULL DEFAULT 'open', CHECK (status IN ('open', 'closed', 'suspended'))` | Register status. |

**Status:** FUTURE (planned for v1.1)

---

## 5. Indexes Summary

| Table | Index | Purpose |
| :--- | :--- | :--- |
| `tenants` | `idx_tenants_name`, `idx_tenants_status` | Fast lookup by name and status. |
| `memberships` | `idx_memberships_user_id`, `idx_memberships_role`, `idx_memberships_is_active` | Fast auth and role queries. |
| `professionals` | `idx_professionals_tenant_name`, `idx_professionals_user_id` | Search professionals by tenant and name. |
| `services` | `idx_services_tenant_name`, `idx_services_active` | Search services by tenant and active status. |
| `customers` | `idx_customers_tenant_name`, `idx_customers_tenant_phone`, `idx_customers_tenant_cpf`, `idx_customers_last_visit` | Search customers by tenant, name, phone, CPF, and last visit. |
| `appointments` | `idx_appointments_tenant_professional_start`, `idx_appointments_tenant_customer_start`, `idx_appointments_tenant_status`, `idx_appointments_tenant_start` | Critical for scheduling queries and conflict detection. |
| `products` | `idx_products_tenant_name`, `idx_products_tenant_stock` | Search products and monitor low stock. |
| `stock_movements` | `idx_stock_movements_product`, `idx_stock_movements_origin` | Audit and reconciliation. |
| `financial_events` | `idx_financial_events_tenant_date`, `idx_financial_events_tenant_origin` | Financial reports. |
| `outbox_messages` | `idx_outbox_messages_status_scheduled` | Message processing worker. |
| `activity_feed` | `idx_activity_feed_tenant_category_status`, `idx_activity_feed_tenant_created` | Dashboard queries. |
| `audit_logs` | `idx_audit_logs_tenant_created`, `idx_audit_logs_user` | Audit trail queries. |

---

## 6. RLS Policies Summary

All tenant-owned tables have RLS enabled. Policies follow the pattern:

- **SELECT:** Members can view data within their tenant.
- **INSERT:** Members with appropriate roles can insert.
- **UPDATE:** Members with appropriate roles can update (append-only tables restrict updates).
- **DELETE:** Only owners and admins can delete (or soft-delete).

Special policies:
- **Anamnesis:** Restricted to owner, admin, manager, and the specific professional caring for the customer.
- **Appointments:** Professionals see only their own appointments.
- **Financial Events & Stock Movements:** Append-only; no updates or deletes allowed.
- **Activity Feed:** Read-only; inserts are handled via triggers/application.

See `0001_foundation.sql` for the complete policy definitions.

---

## 7. Traceability

| Concern                 | Canonical Document                      |
| ----------------------- | --------------------------------------- |
| Domain model            | `domain-model.md`                       |
| Business rules          | `business-rules.md`                     |
| Multi-tenancy           | `multi-tenancy.md`                      |
| Security                | `security-baseline.md`                  |
| Migrations              | `0001_foundation.sql`                   |

---

## 8. Final Schema Contract

The StyleFlow database schema guarantees:

- **Tenant isolation:** All data is scoped to `tenant_id`.
- **Concurrency safety:** Appointment conflicts are prevented at the database level.
- **Auditability:** Financial and stock events are append-only.
- **Historical accuracy:** Service/product snapshots preserve operational history.
- **Data integrity:** Constraints (FK, CHECK, UNIQUE, EXCLUDE) enforce invariants.

Any change to the schema must be documented here first, then implemented via a migration (`supabase/migrations/`), and tested thoroughly.

---

*End of schema.md*