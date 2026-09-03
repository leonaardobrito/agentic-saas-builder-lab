# Local Development — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salões e Centros Estéticos
**Authority:** Guia para configuração e execução do ambiente de desenvolvimento local

---

## 0. How Agents Must Use This Document

This document provides **step-by-step instructions** for setting up and running the StyleFlow development environment locally.

It is the source of truth for:
- Initial project setup.
- Running the application in development mode.
- Managing database migrations and seeds.
- Running tests and quality checks.
- Configuring agent tooling (agy, MCPs).

### Authority Rules

- `local-development.md` defines **how to set up the development environment**.
- `architecture.md` defines **the technical stack**.
- `schema.md` defines **the database schema**.
- `AGENTS.md` defines **how agents should use the development environment**.
- `package.json` defines **the actual scripts and dependencies**.
- `.env.example` defines **required environment variables**.

### Before asking for help

The agent or developer MUST:
1. Follow the setup steps below.
2. Verify that all prerequisites are installed.
3. Ensure environment variables are correctly configured.
4. Run the validation checks (`npm run typecheck`, `npm run lint`, `npm run test`).
5. Document any deviations or issues encountered.

---

## 1. Prerequisites

### 1.1. Required Software

| Tool | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | 20.x or 22.x LTS | Runtime for Next.js and tooling. |
| **npm** | 10.x or higher | Package manager. |
| **Git** | Latest | Version control. |
| **Supabase CLI** | Latest | Local database management and migrations. |
| **Docker** | Latest (optional) | Required only if using Supabase local with Docker (recommended). |
| **Vercel CLI** | Latest (optional) | For preview deployments and logs inspection. |

### 1.2. Recommended Tools (Optional)

| Tool | Purpose |
| :--- | :--- |
| **VS Code** | IDE with TypeScript, Tailwind, and ESLint extensions. |
| **Postman / Insomnia** | API testing. |
| **TablePlus / DBeaver** | Database GUI. |
| **agy (Antigravity CLI)** | Agent orchestration for coding/research. |
| **MCP Servers** | Supabase MCP, GitHub MCP, Vercel MCP (for agent use). |

### 1.3. Verifying Prerequisites

Run these commands to verify your environment:

```bash
node --version   # Should show v20.x or v22.x
npm --version    # Should show 10.x or higher
git --version    # Should show latest
supabase --version  # Should show latest
docker --version # If using Docker (optional)
```

---

## 2. Cloning and Installing

### 2.1. Clone the Repository

```bash
git clone git@github.com:your-org/agentic-saas-builder-lab.git
cd agentic-saas-builder-lab
```

### 2.2. Install Dependencies

```bash
npm install
```

This will install all dependencies from `package.json`, including:
- Next.js, React, TypeScript
- Supabase client libraries (`@supabase/ssr`, `@supabase/supabase-js`)
- Tailwind CSS, shadcn/ui
- Zod, class-variance-authority, lucide-react
- Vitest, Playwright, ESLint

---

## 3. Environment Configuration

### 3.1. Create `.env.local`

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 3.2. Configure Variables

Edit `.env.local` and fill in the required values:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# For production, use real project credentials.
# For local development, use the Supabase CLI-generated keys.

# Optional: AI Provider (for development)
GEMINI_API_KEY=your-gemini-api-key
# or
OPENAI_API_KEY=your-openai-api-key
```

**Important Notes:**
- **Never commit `.env.local`** to version control.
- For local development, you can use the Supabase CLI's default keys (see Section 4.2).
- For staging/production, use the Supabase dashboard credentials.
- The `NEXT_PUBLIC_*` variables are exposed to the browser. Never put secrets there.

---

## 4. Setting Up Supabase Locally

### 4.1. Initialize Supabase

If you haven't already:

```bash
supabase init
```

This creates a `supabase/` directory with configuration files.

### 4.2. Start Supabase Local

```bash
supabase start
```

This command:
- Pulls the Supabase Docker images.
- Starts PostgreSQL, Auth, Storage, and Realtime services.
- Exposes services on localhost ports (usually 54321 for API, 54322 for DB).
- Outputs the `anon` and `service_role` keys.

**Example Output:**
```
Started supabase local development setup.

API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.3. Apply Migrations

Apply the foundation schema and all subsequent migrations:

```bash
supabase db reset
```

This command:
- Drops and recreates the local database.
- Applies all migration files from `supabase/migrations/` in order.
- Runs any seed scripts (if configured).
- **Warning:** This will delete all local data. Use with caution.

### 4.4. Seed Development Data (Optional)

If you need seed data for testing, create a `supabase/seed.sql` file:

```sql
-- supabase/seed.sql
INSERT INTO public.tenants (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Salão Exemplo 1'),
  ('00000000-0000-0000-0000-000000000002', 'Salão Exemplo 2');

-- Add more seed data as needed...
```

Then run:

```bash
supabase db reset
```

**Rule:** Never use real customer data in development seeds. Use synthetic data only.

### 4.5. Verify Supabase is Running

```bash
supabase status
```

This shows the current status and URLs of all services.

### 4.6. Stop Supabase When Done

```bash
supabase stop
```

To remove containers and volumes:

```bash
supabase stop --volumes
```

---

## 5. Running the Application

### 5.1. Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at: [http://localhost:3000](http://localhost:3000)

**What this does:**
- Compiles TypeScript on the fly.
- Watches for file changes and hot-reloads.
- Exposes Server Actions and Route Handlers at `/api/*`.

### 5.2. Building the Application

```bash
npm run build
```

This creates a production-optimized build in the `.next/` directory.

### 5.3. Running the Production Build

```bash
npm start
```

This starts the production server (use for testing the build before deployment).

### 5.4. Previewing with Vercel (Optional)

If you have the Vercel CLI installed:

```bash
vercel dev
```

This runs the application with Vercel's development environment (useful for testing serverless functions and preview deployments).

---

## 6. Running Tests

### 6.1. Unit Tests (Vitest)

```bash
# Run all unit tests once
npm run test:unit

# Or using the generic test script
npm test

# Run in watch mode (for development)
npm run test:watch
```

**What's tested:** Domain entities, business rules, use cases, Zod schemas.

### 6.2. Integration Tests

```bash
# Requires Supabase to be running locally
npm run test:integration
```

**What's tested:** Repositories, RLS policies, database constraints, transactions, outbox pattern.

### 6.3. E2E Tests (Playwright)

```bash
# Run E2E tests (requires dev server to be running)
npm run test:e2e

# Or run with UI mode for debugging
npx playwright test --ui
```

**What's tested:** Critical user journeys (appointment creation, tenant isolation, etc.).

### 6.4. Test Coverage

```bash
npm run test:coverage
```

Generates coverage reports in the `coverage/` directory.

**Target:** 80% coverage for domain/application logic.

### 6.5. Running All Tests (CI Mode)

```bash
npm run test:ci
```

This runs unit + integration tests sequentially and exits with the correct status code (for CI/CD).

---

## 7. Quality Checks

### 7.1. Type Checking

```bash
npm run typecheck
```

This runs TypeScript without emitting files (`tsc --noEmit`) and ensures there are no type errors.

### 7.2. Linting

```bash
npm run lint
```

Runs ESLint on the entire codebase.

### 7.3. Formatting (if configured)

If you have Prettier configured:

```bash
npx prettier --write .
```

### 7.4. Pre-commit Hooks (Optional)

Consider setting up Husky and lint-staged to run these checks automatically before commits:

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{js,json,md}": ["prettier --write"]
  }
}
```

---

## 8. Agent Tooling (agy and MCPs)

### 8.1. Installing `agy` (Optional)

`agy` (Google Antigravity CLI) is an optional agent orchestration tool.

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash
# or
npm install -g @google/antigravity-cli
```

**Verify Installation:**
```bash
agy --version
```

### 8.2. Authenticating `agy`

```bash
agy
```

This opens a browser for OAuth authentication with Google.

### 8.3. Configuring MCPs

MCP (Model Context Protocol) servers give agents controlled access to external systems.

Configure MCPs in the agent client you're using (e.g., Cursor, Claude Desktop, or `agy` directly).

**Recommended MCPs for Development:**

| MCP | Purpose | Access Level |
| :--- | :--- | :--- |
| **Supabase MCP** | Query/update local database, manage migrations. | Read-write (local only). |
| **GitHub MCP** | Create branches, commits, PRs. | Read-write. |
| **Vercel MCP** | Inspect logs, manage deployments. | Read-only (preview). |

**Security Rules:**
- Never expose production credentials to MCPs.
- Prefer read-only access.
- Production writes require explicit human approval.

### 8.4. Using `agy` for Development Tasks

Examples of how `agy` can assist:

```bash
# Research: Analyze existing code
agy "What is the current appointment conflict implementation?"

# Implement a feature: Use TDD
agy "Implement the commission calculation use case following TDD"

# Run tests
agy "Run the appointment conflict integration test and explain the results"

# Generate documentation
agy "Update the domain-model.md with the new CommissionRule entity"
```

---

## 9. Database Management

### 9.1. Creating a New Migration

```bash
supabase migration new <migration-name>
```

Example:
```bash
supabase migration new add_cash_register_table
```

This creates a new file in `supabase/migrations/` with a timestamp prefix.

### 9.2. Writing Migrations

Edit the generated file with your SQL changes:

```sql
-- supabase/migrations/20260902120000_add_cash_register_table.sql
create table public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  initial_amount numeric(12,2) not null default 0,
  final_amount numeric(12,2),
  status text not null default 'open' check (status in ('open', 'closed', 'suspended')),
  created_at timestamptz not null default now()
);

-- Apply RLS policies, indexes, etc.
```

### 9.3. Applying Migrations

```bash
supabase db push
```

Or, to reset the entire database and apply all migrations:

```bash
supabase db reset
```

### 9.4. Inspecting the Database

Open the Supabase Studio (local):

```bash
supabase studio
```

This opens [http://localhost:54323](http://localhost:54323) where you can browse tables, run SQL queries, and manage auth.

---

## 10. Common Workflows

### 10.1. Starting a New Feature (TDD Workflow)

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Run tests to ensure everything is green:**
   ```bash
   npm run test:ci
   ```

3. **Write a failing test (RED):**
   - Add tests to `features/[domain]/__tests__/`.
   - Run `npm run test:watch` to monitor.

4. **Implement the feature (GREEN):**
   - Write the minimum code to pass the test.
   - Repeat for additional tests.

5. **Refactor (REFACTOR):**
   - Improve code structure.
   - Run tests to ensure they stay green.

6. **Run all quality checks:**
   ```bash
   npm run typecheck && npm run lint && npm run test:ci
   ```

7. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: implement appointment conflict prevention"
   git push origin feature/your-feature-name
   ```

### 10.2. Debugging a Server Action

1. Add `console.log()` statements in the action.
2. Run the dev server: `npm run dev`.
3. Trigger the action from the UI.
4. Check the terminal output for logs.

**Alternative:** Use the browser's network tab to inspect the request/response.

### 10.3. Debugging Database Issues

1. Open the Supabase Studio: `supabase studio`.
2. Run queries directly in the SQL editor.
3. Check the local database logs: `supabase logs`.

### 10.4. Resetting to a Clean State

If your local database becomes corrupted or you want to start fresh:

```bash
supabase db reset
```

This drops all data and reapplies all migrations.

---

## 11. Troubleshooting

### 11.1. Port Conflicts

If port 3000 is already in use:

```bash
npm run dev -- -p 3001
```

Supabase services also use ports. If you have conflicts, you can change them in `supabase/config.toml`.

### 11.2. Supabase Not Starting

If `supabase start` fails:
- Ensure Docker is running.
- Check for port conflicts.
- Run `supabase stop` then `supabase start` again.

### 11.3. Migration Errors

If a migration fails:
- Check the migration SQL for syntax errors.
- Run `supabase db reset` to start fresh.
- Use `supabase migration up` to apply migrations one by one.

### 11.4. Test Failures

- Check that Supabase is running (`supabase status`).
- Ensure environment variables are set correctly.
- Run tests with `--verbose` for more details:
  ```bash
  npm run test:unit -- --verbose
  ```

### 11.5. `agy` Issues

- Ensure you are authenticated (`agy` opens the browser).
- Check your internet connection (agy requires network access).
- Verify that the required MCPs are installed and configured.

---

## 12. Checklist for New Developers

Before starting development, verify:

```text
[ ] Node.js (20.x/22.x) installed.
[ ] npm (10.x+) installed.
[ ] Git installed and configured.
[ ] Supabase CLI installed.
[ ] Docker installed and running.
[ ] Repository cloned.
[ ] Dependencies installed (`npm install`).
[ ] `.env.local` created and configured.
[ ] Supabase started (`supabase start`).
[ ] Migrations applied (`supabase db reset`).
[ ] Dev server running (`npm run dev`).
[ ] Typecheck passes (`npm run typecheck`).
[ ] Lint passes (`npm run lint`).
[ ] Tests pass (`npm run test:ci`).
[ ] (Optional) `agy` installed and authenticated.
[ ] (Optional) MCPs configured.
```

---

## 13. Traceability

| Concern                 | Canonical Document                      |
| ----------------------- | --------------------------------------- |
| Stack definition        | `architecture.md` (Section 2)           |
| Environment variables   | `.env.example`                          |
| Database schema         | `0001_foundation.sql` / `schema.md`     |
| Testing                 | `testing-strategy.md`                   |
| TDD workflow            | `tdd.md`                                |
| Agent contract          | `AGENTS.md`                             |
| Multi-tenancy           | `multi-tenancy.md`                      |

---

## 14. Final Notes

- **Never commit `.env.local` or any other secret file.**
- **Never use real customer data in development.**
- **Always run quality checks (`typecheck`, `lint`, `test`) before committing.**
- **Keep Supabase running while developing.**
- **Document any environment-specific issues you encounter.**

---

*End of local-development.md*