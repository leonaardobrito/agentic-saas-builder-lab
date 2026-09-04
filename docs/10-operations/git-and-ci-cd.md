# Development Workflow & Git Standards — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-03
**Scope:** MVP — Beauty / Salons & Aesthetic Centers
**Authority:** Defines Git branching, commit conventions, CI/CD, and operational practices for agents and humans.

---

## 0. How Agents Must Use This Document

This document defines the **operational standards** for managing the StyleFlow repository, including branching, commits, CI/CD, and environment configuration.

It is a source of truth for all development activities.

### Authority Rules

- `git-and-ci-cd.md` defines **how code flows from development to production**.
- `architecture.md` defines **the technical stack and project structure**.
- `AGENTS.md` defines **agent responsibilities and boundaries**.
- `local-development.md` defines **local setup and tooling**.

### Before creating a branch, committing, or opening a PR

The agent MUST:

1. Follow the branching strategy defined in this document.
2. Use Conventional Commits for all commit messages.
3. Ensure all CI checks pass before marking a PR as ready.
4. Verify that the PR description includes all required sections.

---

## 1. Branching Strategy (GitHub Flow)

StyleFlow uses **Trunk-Based Development** with short-lived feature branches.

### Main Branches

| Branch | Purpose | Rules |
| :--- | :--- | :--- |
| **`main`** | Production-ready code. Always deployable. | No direct commits. Merge only via PR. |
| **`develop`** | *(Optional)* Not used. We merge directly into `main`. | — |

### Supporting Branches

| Branch Type | Naming Convention | Purpose |
| :--- | :--- | :--- |
| **Feature** | `feature/<short-description>` | New functionality (e.g., `feature/auth`, `feature/appointments`). |
| **Fix** | `fix/<short-description>` | Bug fixes (e.g., `fix/double-booking`). |
| **Chore** | `chore/<short-description>` | Maintenance tasks (e.g., `chore/update-dependencies`, `chore/docs`). |
| **Release** | `release/v<major>.<minor>.<patch>` | *(Future)* Cut releases. For MVP, use tags on `main`. |

### Branch Lifecycle

1. **Create** branch from `main`:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/my-feature
   ```
2. **Develop** with regular commits (see commit conventions).
3. **Push** to remote:
   ```bash
   git push -u origin feature/my-feature
   ```
4. **Open a Pull Request** against `main`.
5. **Merge** after CI passes and review is approved.
6. **Delete** the branch after merge.

**Rule:** Branches must be short-lived (< 1 week). If a feature takes longer, merge incrementally using feature flags or smaller PRs.

---

## 2. Commit Conventions (Conventional Commits)

StyleFlow follows **Conventional Commits** (v1.0.0) for consistent history and automated changelog generation.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description | Example |
| :--- | :--- | :--- |
| `feat` | New feature | `feat(auth): implement sign-up with tenant creation` |
| `fix` | Bug fix | `fix(scheduling): prevent double-booking race condition` |
| `docs` | Documentation changes | `docs(api): update appointment conflict spec` |
| `style` | Code style (formatting, semicolons, etc.) | `style: run prettier on all files` |
| `refactor` | Code restructuring without behavior change | `refactor(appointments): extract conflict validation` |
| `perf` | Performance improvement | `perf(db): add index on appointments.tenant_id` |
| `test` | Adding or updating tests | `test(auth): add integration test for sign-up` |
| `chore` | Maintenance (dependencies, configs, etc.) | `chore: update vitest to v4` |
| `ci` | CI/CD changes | `ci: add GitHub Actions workflow` |
| `revert` | Revert a previous commit | `revert: feat(auth) — due to security concern` |

### Subject

- Use imperative present tense: "add" not "added".
- Keep under 50 characters.
- Do not capitalize the first letter.
- Do not end with a period.

### Body (Optional)

- Use to explain **what** and **why** (not how).
- Wrap at 72 characters.

### Footer (Optional)

- Reference issues: `Closes #123` or `Fixes #456`.

### Example

```
feat(auth): implement sign-up with tenant creation

- Add signUpAction Server Action
- Create tenant automatically during onboarding
- Validate CPF and email uniqueness

Closes #12
```

---

## 3. Pull Request Standards

### PR Title

- Must follow Conventional Commit format (same as commit).
- Example: `feat(auth): implement sign-up with tenant creation`

### PR Description Template

All PRs must include the following sections:

```markdown
## What
Brief description of what this PR does.

## Why
Why is this change needed? Link to issue/spec if applicable.

## Changes
- [ ] List of changes (bullet points).

## Testing
- [ ] Unit tests added/updated.
- [ ] Integration tests added/updated.
- [ ] E2E tests added/updated (if UI/UX changed).
- [ ] Manual testing performed.

## Security
- [ ] Authentication & authorization verified.
- [ ] Tenant isolation enforced (RLS, composite FKs).
- [ ] No secrets exposed.
- [ ] Sensitive data minimized in logs.

## Deployment Implications
- [ ] Database migrations included (if any).
- [ ] Environment variables added/updated.
- [ ] Rollback strategy considered.

## Checklist
- [ ] Scope respected (no unrelated changes).
- [ ] Typecheck passes (`npm run typecheck`).
- [ ] Lint passes (`npm run lint`).
- [ ] All tests pass (`npm run test:ci`).
- [ ] Build passes (`npm run build`).
- [ ] Documentation updated.
- [ ] PR is ready for review.
```

### PR Size

- **Keep PRs small:** Aim for < 300 lines changed (excluding generated code).
- **One logical change per PR:** Do not mix features, refactors, and formatting.

### Review Process

- At least **one human approval** required before merging (or an authorized agent review).
- PR can be merged only after all CI checks pass.

---

## 4. CI/CD Pipeline

### GitHub Actions (CI)

Location: `.github/workflows/ci.yml`

**Trigger:**
- On `pull_request` to `main`.
- On `push` to `main`.

**Checks:**

| Step | Command | Purpose |
| :--- | :--- | :--- |
| Setup Node.js | `actions/setup-node@v4` | Use Node 20. |
| Install dependencies | `npm ci` | Fast, deterministic install. |
| Setup Supabase CLI | `supabase/setup-cli@v1` | For local database. |
| Start Supabase Local | `supabase start` | Spin up PostgreSQL + services. |
| Apply Migrations | `supabase migration up` | Apply schema. |
| Typecheck | `npm run typecheck` | Check TypeScript types. |
| Lint | `npm run lint` | Check code style. |
| Unit + Integration Tests | `npm run test:ci` | Run all tests against local Supabase. |
| Build | `npm run build` | Ensure production build works. |

**Example CI Workflow:**

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase Local
        run: supabase start

      - name: Apply Migrations
        run: supabase migration up

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Run Tests
        run: npm run test:ci
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_LOCAL }}
```

### Vercel (CD)

- **Preview Deployments:** Every PR creates a preview environment.
- **Production Deploy:** Every merge to `main` deploys to production.
- **Environment Variables:** Configured in Vercel dashboard (not in code).

---

## 5. Environment Variables

### Local Development

Create `.env.local` in the project root:

```env
# Supabase Local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Production (Vercel)

Configure in Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Rule:** Never commit `.env.local` or any secrets. `.env.example` is committed as a template.

---

## 6. Git Hooks (Husky + lint-staged)

StyleFlow uses **Husky** and **lint-staged** to enforce code quality before commits.

### Setup

```bash
npm install -D husky lint-staged
npx husky init
```

### Pre-commit Hook

Edit `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

### `lint-staged` Configuration

Add to `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

This runs ESLint and Prettier on staged files before each commit.

---

## 7. Project Structure (Reiterated)

Ensure the repository follows the structure defined in `architecture.md`:

```
agentic-saas-builder-lab/
├── .github/
│   └── workflows/
│       └── ci.yml
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   └── (dashboard)/
│       ├── agenda/
│       ├── clientes/
│       └── ...
├── features/
│   ├── auth/
│   ├── appointments/
│   ├── customers/
│   ├── professionals/
│   ├── services/
│   ├── inventory/
│   ├── finance/
│   ├── communication/
│   └── platform/
├── shared/
│   ├── ui/
│   ├── lib/
│   └── types/
├── supabase/
│   └── migrations/
│       └── 0001_foundations.sql
├── docs/
├── specs/
├── memory/
├── .env.example
├── AGENTS.md
├── AGENTS-COMPACT.md
├── README.md
├── package.json
├── tsconfig.json
├── vitest.config.mjs
├── playwright.config.ts
└── middleware.ts
```

---

## 8. Agent Checklist for Feature Development

Before starting a new feature, the agent must:

```text
[ ] Create a feature branch from main: `feature/<description>`.
[ ] Write a specification (or update existing spec) in `specs/`.
[ ] Write failing tests first (TDD).
[ ] Implement the feature (GREEN).
[ ] Refactor (REFACTOR).
[ ] Ensure all tests pass locally (`npm run test:ci`).
[ ] Ensure typecheck and lint pass (`npm run typecheck && npm run lint`).
[ ] Build the project (`npm run build`).
[ ] Update relevant documentation (if domain/architecture changes).
[ ] Commit with Conventional Commit format.
[ ] Push branch and open PR against `main`.
[ ] Include PR description using the template.
[ ] Ensure CI passes on the PR.
[ ] Request review (human or authorized agent).
[ ] After approval, merge to main.
[ ] Delete the branch after merge.
[ ] Ensure Vercel deploys successfully.
```

---

## 9. Traceability

| Concern | Canonical Document |
| :--- | :--- |
| Agent contract | `AGENTS.md` |
| Local setup | `local-development.md` |
| Architecture | `architecture.md` |
| Multi-tenancy | `multi-tenancy.md` |
| Security | `security-baseline.md` |
| Testing | `testing-strategy.md`, `tdd.md` |

---

## 10. Final Contract

StyleFlow's development workflow guarantees:

- **Trunk-based development** with short-lived branches.
- **Conventional Commits** for clear history.
- **CI/CD** with automated checks (typecheck, lint, tests, build).
- **Vercel previews** for every PR.
- **Security and tenant isolation** verified in every PR.
- **Agents follow the same standards** as humans.

Any deviation requires a documented ADR and human approval.

---

*End of git-and-ci-cd.md*