# API Guidelines — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salões e Centros Estéticos
**Authority:** Diretrizes para projeto e implementação de APIs

---

## 0. How Agents Must Use This Document

This document defines the **design principles, security requirements, and implementation patterns** for all APIs in the StyleFlow platform.

It is the source of truth for API contracts and behavior.

### Authority Rules

- `api-guidelines.md` defines **how APIs are designed and secured**.
- `security-baseline.md` defines **security controls for APIs**.
- `business-rules.md` defines **behavioral invariants that APIs must enforce**.
- `domain-model.md` defines **entities exposed via APIs**.
- `architecture.md` defines **where APIs live (Server Actions, Route Handlers)**.
- `multi-tenancy.md` defines **tenant isolation requirements**.

### Before implementing an API endpoint or action

The agent MUST:

1. Identify the bounded context and entity involved.
2. Define the input schema (Zod) and output shape.
3. Define authentication, authorization, and tenant context requirements.
4. Define error responses and status codes.
5. Ensure idempotency where applicable.
6. Add tests for validation, authorization, and error handling.

---

## 1. API Types

StyleFlow uses **two primary API patterns**, both built on Next.js:

| Pattern | Purpose | Location |
| :--- | :--- | :--- |
| **Server Actions** | Mutations (create, update, delete) that require tenant context and user session. | `features/[domain]/presentation/actions/*.ts` |
| **Route Handlers** | Webhooks, MCP endpoints, public APIs, or operations that don't fit Server Actions. | `app/api/[route]/route.ts` |

### 1.1. Server Actions (Preferred for Mutations)

Server Actions are the default for any operation that:

- Mutates data (CREATE, UPDATE, DELETE).
- Requires authentication and tenant context.
- Is called directly from a React component (via `useTransition` or `useActionState`).

**Example:**
```typescript
// features/appointments/presentation/actions/create-appointment.action.ts
'use server';

import { z } from 'zod';
import { createAppointment } from '../application/create-appointment';

const inputSchema = z.object({
  professionalId: z.string().uuid(),
  customerId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()),
  startAt: z.string().datetime(),
});

export async function createAppointmentAction(input: unknown) {
  // Validation, auth, tenant context, use case execution...
}
```

### 1.2. Route Handlers (For Webhooks and External APIs)

Use Route Handlers for:

- Webhooks (payment providers, WhatsApp, etc.).
- MCP endpoints for agent access.
- Public endpoints that don't require authentication (rare).
- Operations that need raw request/response control.

**Example:**
```typescript
// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Verify signature, parse payload, handle event...
}
```

---

## 2. Authentication

### 2.1. Server Actions

**Rule:** All Server Actions that access tenant data **must** use `await supabase.auth.getUser()` to verify the user's session.

```typescript
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function myAction(input: unknown) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('UNAUTHENTICATED');
  }

  // Proceed...
}
```

### 2.2. Route Handlers

For Route Handlers, extract the session from the Authorization header or cookies.

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

**Rule:** Webhooks may use a shared secret (API key) instead of user sessions. Validate the signature before processing.

---

## 3. Authorization

### 3.1. Tenant Context

**Rule:** The `tenant_id` must be derived from the user's membership, **never** from the client payload.

```typescript
// ✅ Correct: Fetch tenant from membership
const membership = await getMembership(user.id, input.tenantId);
if (!membership || !membership.is_active) {
  throw new Error('FORBIDDEN');
}

// ❌ Incorrect: Accepting tenant_id from client without verification
const tenantId = input.tenantId; // Danger!
```

### 3.2. RBAC

**Rule:** Check the user's role before executing any operation that requires specific permissions.

```typescript
const hasRole = await hasRole(tenantId, user.id, 'admin');
if (!hasRole) {
  throw new Error('FORBIDDEN');
}
```

**Rule:** For operations that modify data, verify that the user has the appropriate role for that entity (e.g., only `owner` and `admin` can delete appointments).

---

## 4. Input Validation (Zod)

### 4.1. Mandatory Validation

**Rule:** All external input must be validated with Zod at the API boundary.

```typescript
import { z } from 'zod';

const createCustomerSchema = z.object({
  fullName: z.string().min(2),
  cpf: z.string().length(11).regex(/^\d{11}$/),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  birthDate: z.string().date().optional(),
});

export async function createCustomerAction(input: unknown) {
  const validated = createCustomerSchema.parse(input);
  // ...
}
```

### 4.2. Error Handling

**Rule:** Return user-friendly error messages for validation failures.

```typescript
try {
  const validated = schema.parse(input);
  // ...
} catch (error) {
  if (error instanceof z.ZodError) {
    return { success: false, error: error.errors[0].message };
  }
  return { success: false, error: 'An unexpected error occurred.' };
}
```

**Rule:** Never expose raw Zod errors to the client; format them into a consistent structure.

---

## 5. Output Format

### 5.1. Server Actions

Server Actions should return a consistent shape:

```typescript
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**Example:**
```typescript
return { success: true, data: appointment };
// or
return { success: false, error: 'Professional is already booked at that time.' };
```

### 5.2. Route Handlers (REST APIs)

Route Handlers should return standard HTTP status codes and JSON responses.

| Scenario | Status Code | Response Body |
| :--- | :--- | :--- |
| Success | 200 | `{ data: ... }` |
| Created | 201 | `{ data: ... }` |
| Bad Request | 400 | `{ error: "message" }` |
| Unauthenticated | 401 | `{ error: "Unauthorized" }` |
| Forbidden | 403 | `{ error: "Forbidden" }` |
| Not Found | 404 | `{ error: "Not found" }` |
| Conflict | 409 | `{ error: "Conflict" }` |
| Internal Error | 500 | `{ error: "Internal server error" }` |

---

## 6. Pagination, Filtering, and Sorting

### 6.1. Pagination

**Rule:** All list endpoints must support pagination to avoid unbounded queries.

**Input Parameters:**
```typescript
const listSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});
```

**Output Format:**
```typescript
{
  data: T[],
  pagination: {
    total: number,
    limit: number,
    offset: number,
    nextOffset: number | null,
  }
}
```

### 6.2. Filtering and Sorting

**Rule:** Support filtering by common fields (e.g., `status`, `dateRange`, `professionalId`).

**Example:**
```typescript
const filterSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'completed']).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  professionalId: z.string().uuid().optional(),
});
```

**Sorting:** Support `sortBy` and `order` parameters (e.g., `?sortBy=startAt&order=asc`).

---

## 7. Error Handling and Status Codes

### 7.1. Domain Errors

**Rule:** Map domain errors to appropriate HTTP status codes and user-friendly messages.

| Domain Error | Server Action Response | Route Handler Status |
| :--- | :--- | :--- |
| `INVALID_APPOINTMENT_INTERVAL` | `{ success: false, error: "End time must be after start time." }` | 400 |
| `APPOINTMENT_CONFLICT` | `{ success: false, error: "Professional is already booked at that time." }` | 409 |
| `UNAUTHENTICATED` | (throw) | 401 |
| `FORBIDDEN` | (throw) | 403 |
| `NOT_FOUND` | `{ success: false, error: "Resource not found." }` | 404 |
| `INSUFFICIENT_STOCK` | `{ success: false, error: "Insufficient stock for product X." }` | 409 |

### 7.2. Error Logging

**Rule:** Always log the full error (with stack trace) to the server logs, but never expose internal details to the client.

```typescript
try {
  // ...
} catch (error) {
  console.error('Failed to create appointment', { error, input, userId });
  return { success: false, error: 'Unable to create appointment. Please try again.' };
}
```

---

## 8. Idempotency

### 8.1. When to Implement

**Rule:** Idempotency is required for operations that may be retried and could create duplicate business effects:

- Webhooks (payment, WhatsApp, etc.).
- Outbox message processing.
- Payment charges.
- Actions that create records with sensitive financial or scheduling impact.

### 8.2. Implementation

**Strategy:** Use an `idempotency_key` header or a unique request ID.

**Example (Route Handler):**
```typescript
export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get('Idempotency-Key');
  if (!idempotencyKey) {
    return NextResponse.json({ error: 'Idempotency-Key required' }, { status: 400 });
  }

  // Check if the operation has already been processed
  const existing = await findByIdempotencyKey(idempotencyKey);
  if (existing) {
    return NextResponse.json({ data: existing }, { status: 200 });
  }

  // Process the request atomically
  const result = await processRequest(request);

  // Store the result with the idempotency key
  await storeIdempotencyResult(idempotencyKey, result);

  return NextResponse.json({ data: result }, { status: 201 });
}
```

**Rule:** Idempotency keys must be stored with an expiration (e.g., 24 hours) to prevent unbounded growth.

---

## 9. Rate Limiting (Future)

**Rule:** Public endpoints (e.g., public booking page) should implement rate limiting to prevent abuse.

**Implementation (Vercel):** Use Vercel's built-in rate limiting or a service like Upstash.

**MVP:** Rate limiting is not required for authenticated endpoints until usage patterns are established.

---

## 10. Webhook Security

### 10.1. Signature Verification

**Rule:** Webhooks must validate a signature or secret to ensure the request is from the expected provider.

**Example (Generic):**
```typescript
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### 10.2. Idempotency for Webhooks

**Rule:** Webhook handlers must be idempotent (see Section 8). Payment webhooks may be retried; duplicates must not cause double-charging or duplicate records.

---

## 11. MCP (Model Context Protocol) Endpoints

MCP endpoints are used by agents to inspect or manipulate data.

**Rule:** MCP access must follow the least privilege principle:

- Prefer read-only access.
- Use development/staging by default.
- Production writes require explicit human approval (documented in ADR or PR).

**Security:**
- MCP endpoints must authenticate with a secure token (not exposed in client code).
- Log all MCP operations for audit.

---

## 12. API Versioning

**Rule:** Do not version APIs unnecessarily. Introduce versioning only when a breaking change is required.

**Strategy:** Use URL path versioning (e.g., `/api/v1/appointments`) or accept header versioning.

**MVP:** Versioning is not required until we have external API consumers (future).

---

## 13. Documentation

**Rule:** Every public API endpoint (Route Handler) must be documented with:

- Endpoint URL and method.
- Authentication requirements.
- Input schema (Zod or OpenAPI).
- Output schema.
- Error responses.
- Example requests/responses.

**Implementation:** Use `api-guidelines.md` as the reference, and consider OpenAPI (Swagger) for future automation.

---

## 14. Example: Complete Server Action

Below is a complete example of a Server Action following all guidelines.

```typescript
// features/appointments/presentation/actions/create-appointment.action.ts
'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAppointmentUseCase } from '../application/create-appointment';
import { getMembership } from '@/shared/lib/membership';

const inputSchema = z.object({
  professionalId: z.string().uuid(),
  customerId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()).min(1),
  startAt: z.string().datetime({ offset: true }),
});

export async function createAppointmentAction(input: unknown) {
  try {
    // 1. Authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return { success: false, error: 'Unauthorized.' };
    }

    // 2. Input Validation
    const validated = inputSchema.parse(input);

    // 3. Tenant Context (derive from membership)
    // In MVP, we assume the user belongs to one tenant. If multi-tenant, request tenantId.
    // But never trust tenantId from client. Instead, derive from session membership.
    const memberships = await supabase
      .from('memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!memberships.data) {
      return { success: false, error: 'No active membership.' };
    }
    const tenantId = memberships.data.tenant_id;

    // 4. Authorization (check if user has permission to create appointments)
    const hasRole = await supabase
      .from('memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single();
    if (!hasRole.data || !['owner', 'admin', 'manager', 'receptionist', 'professional'].includes(hasRole.data.role)) {
      return { success: false, error: 'Forbidden.' };
    }

    // 5. Execute Use Case
    const appointment = await createAppointmentUseCase({
      tenantId,
      professionalId: validated.professionalId,
      customerId: validated.customerId,
      serviceIds: validated.serviceIds,
      startAt: new Date(validated.startAt),
    });

    // 6. Return Success
    return { success: true, data: appointment };
  } catch (error) {
    // 7. Error Handling
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('CreateAppointmentAction failed', { error, input });
    return { success: false, error: 'Unable to create appointment. Please try again.' };
  }
}
```

---

## 15. Agent Checklist (API Implementation)

Before finalizing any API endpoint or action, verify:

```text
[ ] Authentication: supabase.auth.getUser() used on server.
[ ] Authorization: RBAC role checked.
[ ] Tenant context: tenant_id derived from session, never from client.
[ ] Input validation: Zod schema applied.
[ ] Output format: consistent ActionResponse<T> or JSON.
[ ] Error handling: user-friendly messages, internal logs.
[ ] Idempotency (if applicable): duplicate protection implemented.
[ ] Pagination (if list): limit/offset supported.
[ ] Webhook security (if webhook): signature verified.
[ ] Documentation updated (api-guidelines.md or spec).
[ ] Tests written (unit/integration for validation, auth, error handling).
```

---

## 16. Traceability

| Concern                 | Canonical Document                      |
| ----------------------- | --------------------------------------- |
| Authentication          | `security-baseline.md`                  |
| Authorization (RBAC)    | `multi-tenancy.md`                      |
| Input validation        | `architecture.md` (Section 5)           |
| Tenant isolation        | `multi-tenancy.md` (Section 4)          |
| Idempotency             | `business-rules.md` (BR-COM-002, BR-API-002) |
| Error handling          | `security-baseline.md` (Section 8)      |
| Testing                 | `testing-strategy.md` (Integration/E2E) |

---

## 17. Final API Contract

StyleFlow APIs must guarantee:

- **Authentication**: Every protected endpoint is authenticated.
- **Authorization**: Every operation is authorized by role and tenant.
- **Validation**: All inputs are validated with Zod.
- **Idempotency**: Retry-sensitive operations are idempotent.
- **Observability**: Errors and important operations are logged.
- **Consistency**: Responses follow a standard format.

Any deviation from these guidelines requires a documented ADR and explicit approval.

---

*End of api-guidelines.md*