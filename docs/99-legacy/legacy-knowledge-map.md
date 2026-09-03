# Legacy Knowledge Map — StyleFlow

**Status:** ACTIVE REFERENCE
**Version:** 1.0
**Updated:** 2026-09-02
**Source:** Former `CLAUDE.md` (prototype) + Legacy `0001_foundation.sql` + Historical project artifacts
**Authority:** This document is a **bridge between the legacy system and the new architecture**. It is NOT authoritative for current implementation; it exists to preserve valuable knowledge and avoid repeating mistakes.

---

## Purpose

This document captures knowledge extracted from the legacy StyleFlow prototype (2024–2026) and identifies:

1. **What to preserve** — concepts, rules, and patterns that are still valid.
2. **What to revise** — things that need adaptation for the new stack and architecture.
3. **What to supersede** — technologies and approaches that are discarded.
4. **What to keep as UNKNOWN** — rules that were not validated and should not be assumed for the MVP.

**Rule:** Legacy evidence is **discovery material**, not authority. The current authority lives in `AGENTS.md`, `domain-model.md`, `business-rules.md`, and the canonical `docs/` directory.

---

## 1. Preserve (Keep in New Architecture)

These are proven concepts, workflows, and domain entities that remain valid.

### 1.1. Domain Entities

| Legacy Entity | New Entity (if renamed) | Why Preserve |
| :--- | :--- | :--- |
| `appointments` | `appointments` | Core scheduling entity. Proven pattern with multiple services per appointment. |
| `appointment_services` | `appointment_items` | Multi-service appointments are essential for beauty businesses. |
| `clients` | `customers` | CRM is a core need. CPF was required in the legacy version; we keep that. |
| `professionals` | `professionals` | Professionals are domain entities, separate from auth users (legacy had a `user_id`). |
| `services` | `services` | Service catalog with price/duration is fundamental. |
| `products` | `products` | Inventory management with stock quantities and consumption tracking. |
| `stock_movements` | `stock_movements` | Auditable inventory ledger — a proven pattern. |
| `service_product_defaults` | `service_product_defaults` | Expected consumption mapping is useful. |
| `appointment_product_consumptions` | `appointment_consumptions` | Actual consumption tracking is essential for cost visibility. |
| `client_anamneses` | `anamnesis` | Beauty-specific sensitive data; privacy classification needed. |
| `color_formulas` | `color_formulas` | Beauty vertical's color formulas. |
| `financial_movements` | `financial_events` | Append-only financial ledger. |
| `expenses` | `expenses` | Operational expense tracking. |
| `whatsapp_templates` | `message_templates` | Provider-neutral messaging is the right pattern. |
| `whatsapp_automations` | `automation_rules` | Rule-based message triggers. |
| `whatsapp_messages` | `outbox_messages` | Outbox pattern for reliable messaging. |
| `audit_logs` | `audit_logs` | Security-sensitive action auditing. |

### 1.2. Domain Rules (Proven)

| Legacy Rule | New Rule (BR-*) | Why Preserve |
| :--- | :--- | :--- |
| Appointment interval validity (`end > start`) | `BR-APT-001` | Obvious invariant. |
| One appointment can contain multiple services | `BR-APT-002` | Core flexibility for beauty businesses. |
| Service snapshots (name, price, duration) | `BR-APT-003` | Prevents catalog edits from rewriting history. |
| Professional can be linked to a user account (optional) | `BR-TEN-002` | Allows professionals without login. |
| Stock movements append-only | `BR-INV-002` | Ensures auditability. |
| Financial events append-only | `BR-FIN-001` | Ensures auditability. |
| Expected vs. actual consumption separated | `BR-CAT-001` | Prevents over/under-estimation. |
| Tenant isolation via `salon_id` (now `tenant_id`) | `BR-TEN-001` | Fundamental security principle. |
| RLS for tenant isolation | `BR-TEN-001` | Proven defense-in-depth. |
| Composite FKs for cross-tenant consistency | `BR-SEC-001` | Prevents referential integrity issues. |
| Cancelled appointments do not block availability | `BR-APT-003` | Logical rule. |

### 1.3. UI/UX Patterns

| Legacy Pattern | New Pattern | Why Preserve |
| :--- | :--- | :--- |
| Mobile-first design | Mobile-first (design-system.md) | Most salon managers use phones. |
| Bottom navigation on mobile | Bottom nav (design-system.md) | Better reachability on phones. |
| Sidebar navigation on desktop | Sidebar (design-system.md) | Standard dashboard pattern. |
| Bottom sheets for modals on mobile | Bottom sheets (design-system.md) | Better UX on small screens. |
| Rose + slate color palette | Rose + slate (design-system.md) | Proven aesthetic for beauty industry. |
| Compact text (`text-xs` for dense data) | `text-xs` (design-system.md) | Managers need to see lots of data. |

### 1.4. Engineering Practices

| Legacy Practice | New Practice | Why Preserve |
| :--- | :--- | :--- |
| TypeScript strict mode | TypeScript strict | Error prevention. |
| Zod validation at boundaries | Zod (api-guidelines.md) | Input safety. |
| Business logic outside UI components | Domain/application layers (architecture.md) | Testability and maintainability. |
| Feature-based/vertical-slice organization | Feature-based (architecture.md) | Scalability and cohesion. |
| Supabase/PostgreSQL | Supabase/PostgreSQL | Proven stack for multi-tenant SaaS. |
| RLS for tenant isolation | RLS (multi-tenancy.md) | Security best practice. |
| Testing critical business rules | TDD (tdd.md, testing-strategy.md) | Quality assurance. |

---

## 2. Revise (Adapt for New Architecture)

These concepts need modification for the new platform.

| Legacy Concept | Revision | Why Change |
| :--- | :--- | :--- |
| `salon_id` as the tenant identifier | `tenant_id` (platform-level) | Multi-tenancy should be platform‑wide, not vertical‑specific. |
| Professional coupled directly to `auth.users` | Professional is a domain entity; `user_id` is optional | Allows professionals without login; better decoupling. |
| Broad RLS policies (`FOR ALL`) | Action-specific, role-aware RLS policies | Prevents unauthorized access; enforces least privilege. |
| Application-only conflict checks | Database-enforced GiST exclusion constraint | Concurrency safety. |
| Current stock + movement history as separate concepts | Atomic update of stock quantity + movement insert | Prevents inconsistencies. |
| Legacy financial structures (two variants) | One authoritative `FinancialEvent` model | Consistency and clarity. |
| WhatsApp-specific messaging domain | Provider-neutral `MessageTemplate`, `OutboxMessage`, `AutomationRule` | Allows switching providers (SMS, email, etc.). |
| Legacy design tokens (hardcoded) | Design system (design-system.md) | Consistency across UI. |
| Fixed 15‑minute slots (legacy claim) | Configurable intervals (MVP: 15‑minute default) | Flexibility for different business needs. |
| Fixed business hours (Tue–Sat, 08:00–18:30) | Configurable business hours (MVP: same as legacy) | Flexibility for different businesses. |
| Cancellation policy (2h before) | To be validated; not enforced in MVP | Needs customer discovery. |
| Commission calculation (unknown formula) | CommissionRule with percentage over net value (MVP) | Simple, configurable, and auditable. |

---

## 3. Supersede (Discarded/Replaced)

These technologies, tools, and approaches are **not carried forward**.

| Legacy Technology | Replacement | Why Superseded |
| :--- | :--- | :--- |
| React + Vite (frontend) | Next.js App Router | Better SSR/SSG, Server Actions, and built-in API routes. |
| Express.js (backend) | Next.js Server Actions + Route Handlers | Simpler serverless deployment; less infrastructure. |
| React Router | Next.js App Router | Built-in routing with RSC support. |
| Gemini as the only AI provider | Provider-neutral AI Gateway (OpenAI, Anthropic, Google) | Avoid vendor lock-in. |
| bcrypt for password hashing | Supabase Auth | Managed authentication; better security. |
| Legacy environment variable names | New `.env` variables (see `.env.example`) | Aligned with new stack. |
| Legacy project scripts (`vite`, `express`) | New scripts (`next dev`, `next build`, `vitest`, `playwright`) | Aligned with new stack. |
| Legacy database schema (with schema drift) | `0001_foundation.sql` (canonical migration) | Single source of truth; no drift. |
| Provider-specific message templates | Provider-neutral templates + adapters | Flexibility and maintainability. |

---

## 4. UNKNOWN / Do Not Assume for MVP

These legacy rules or features were present in the `CLAUDE.md` but are **not automatically part of the new MVP**. They require validation with customers or additional specification.

| Legacy Claim | Why UNKNOWN | Action Required |
| :--- | :--- | :--- |
| Fixed 15‑minute scheduling slots | Legacy claim; not validated with current ICP | Validate with customers before enforcing. |
| Tuesday–Saturday 08:00–18:30 business hours | Legacy configuration; not universal | Make configurable; use as default but allow changes. |
| Two-hour cancellation policy | Not validated; may vary by business | Include in MVP as optional; allow customization. |
| One-rematch/24‑hour rule for customers | Not validated; may vary by business | Include in MVP as optional; allow customization. |
| Commission calculation formula | Legacy formula not found in code | Define MVP rule (percentage over net) and validate. |
| Payment methods and installment rules | Not validated; may vary by business | Implement basic payment methods; validate others. |
| Seven‑day session expiration | Supabase default; may change | Use Supabase default; monitor user feedback. |
| Anamnesis retention/classification rules | Not fully specified | Define MVP minimum fields and privacy levels. |
| Multiple professionals per appointment | Out of MVP scope | Postpone to v1.1+. |
| Fiscal (NFS‑e) integration | Out of MVP scope | Postpone to v2. |
| Loyalty system | Out of MVP scope | Postpone to v1.2. |

---

## 5. Legacy Knowledge Checklist for Agents

When working on a new feature, refer to this checklist to avoid accidental duplication of legacy behavior.

```text
[ ] Does the legacy system have a similar entity/rule?
[ ] Is the legacy entity/rule PRESERVED? If yes, reuse the concept but implement in new architecture.
[ ] Is the legacy entity/rule REVISED? If yes, adapt to new platform (tenant_id, provider‑neutral, etc.).
[ ] Is the legacy entity/rule SUPERSEDED? If yes, do not implement—use the new approach.
[ ] Is the legacy entity/rule UNKNOWN? If yes, do not assume; validate with product decisions.
[ ] Is the legacy entity/rule documented in the new canonical docs? If not, update docs before coding.
```

---

## 6. Traceability

| Concern | Canonical Document |
| :--- | :--- |
| Domain entities | `domain-model.md` |
| Business rules | `business-rules.md` |
| Architecture | `architecture.md` |
| Multi-tenancy | `multi-tenancy.md` |
| Security | `security-baseline.md` |
| Design system | `design-system.md` |
| MVP scope | `mvp.md` |

---

## 7. Final Note

The legacy system was an **essential learning tool**. It proved that the beauty vertical has real operational needs and that a SaaS platform can solve them. But the legacy code, schema, and some rules were **not production‑ready** for a multi‑tenant SaaS.

The new StyleFlow is a **reboot**, not a migration. We preserve the **knowledge** but rebuild the **execution** with discipline, security, and scalability in mind.

---

*End of legacy-knowledge-map.md*