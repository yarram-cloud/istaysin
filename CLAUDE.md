# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**iStays** is a multi-tenant hotel/lodge/resort SaaS platform built exclusively for the Indian hospitality market. It is a Turbo monorepo with three workspaces: `apps/web` (Next.js 14 frontend), `packages/api` (Express backend), and `packages/shared` (shared types/validators/utils).

## Commands

### Development
```bash
npm run dev          # Start all services via Turbo (frontend + backend)
npm run clean        # Bust stale Turbo caches if builds behave unexpectedly
```

> **Turbo notes:** `build` output is cached (incremental builds are safe). `dev` is `persistent: true` so Turbo never marks it complete. `lint` depends on `^build` — dependencies must be built before linting runs.

### Frontend (`apps/web`, port 3100)
```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run lint         # ESLint
```

### Backend (`packages/api`, port 4100)
```bash
npm run dev          # tsx watch mode
npm run build        # TSC compile + Prisma generate
npm run test         # Jest unit tests
```

### Database (`packages/api`)
```bash
npm run db:migrate   # Create migration via `migrate dev` (use this — never `db push` on production)
npm run db:push      # Push schema changes (dev only)
npm run db:studio    # Prisma Studio at localhost:5555
npm run db:seed      # Run seed.ts
```

### E2E Tests (`apps/e2e`)
```bash
npm run test         # All Playwright tests
npm run test:ui      # Interactive UI mode
npm run test:debug   # Debug mode
npx playwright test tests/01-auth-flows.spec.ts  # Run a single test file
```

> **Worker constraint:** `playwright.config.ts` sets `workers: 1`. Tests share a single test database — parallel workers cause DB contention and flaky failures. Do not increase this.

## Architecture

### Monorepo Layout
- `apps/web/` — Next.js 14 App Router, next-intl for 9+ Indian languages, Tailwind + Radix UI, Framer Motion, Socket.IO client, Razorpay, Cloudinary
- `apps/e2e/` — Playwright suite; `global-setup.ts` seeds test DB with tenant fixtures; Page Object Models in `pom/`
- `packages/api/src/` — Express + Socket.IO; entry point is `index.ts`; feature code lives in `modules/<domain>/router.ts`; cross-cutting services in `services/`. Modules: `auth`, `tenants`, `rooms`, `bookings`, `guests`, `check-in-out`, `billing`, `payments`, `housekeeping`, `night-audit`, `dashboard`, `pos`, `loyalty`, `pricing`, `coupons`, `channels`, `shifts`, `compliance`, `analytics`, `reviews`, `groups`, `guest-portal`, `notifications`, `platform`, `public`, `users`
- `packages/shared/src/` — Single source of truth for all Zod validators (50+) and TypeScript types/enums/interfaces. Both frontend and backend import from here — never redeclare locally. Key exports: `ApiResponse<T>`, `PaginatedResponse<T>`, role/status enums, IST date utilities (`utils/date-utils.ts`), translation keys

### Multi-Tenancy
Every DB query on tenant data **must** include a `tenant_id` filter — treat any missing filter as a critical security bug. The backend uses PostgreSQL Row-Level Security (RLS) combined with a `tenant-resolver.ts` middleware that extracts `tenant_id` from the JWT. The `GlobalUser → TenantMembership → Tenant` hierarchy handles cross-tenant access.

### API Response Envelope
All endpoints return `ApiResponse<T>`:
```ts
{ success: boolean; data?: T; error?: string; message?: string }
```
List endpoints return `PaginatedResponse<T>` — never unbounded result sets.

### Frontend Middleware & Tenant Resolution
`apps/web/middleware.ts` resolves tenants from three sources in order: **subdomain** → **custom domain** (API lookup with 5-minute in-memory cache) → **path-based slug**. It also rewrites `/{locale}/{slug}/*` internally so Next.js sees clean paths, detects locale from cookies or URL, and enforces auth guards on `/dashboard` and `/admin` routes. The Next.js config rewrites `/api/v1/*` to the backend at port 4100.

### Socket.IO Tenant Scoping
The API authenticates Socket.IO connections via JWT in the handshake `auth.token`. After connecting, clients must emit `join-property` with `tenantId` to subscribe to a tenant-scoped room. All real-time broadcasts are room-scoped — events never cross tenant boundaries.

## Critical Engineering Rules

These come from `INSTRUCTIONS.md` and must be followed on every task:

**TypeScript:** Treat `any` as radioactive. Use Prisma's generated types; never duplicate them manually. All user-facing text goes through the translation dictionary — never hardcode English strings in components.

**Currency & Dates:** All monetary values → `₹` with `.toLocaleString('en-IN')` (Indian lakh/crore grouping). All timestamps → IST (`Asia/Kolkata`) via `toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })`; never hardcode UTC offsets.

**Database migrations:** Always use `migrate dev` → commit `migration.sql` → `migrate deploy`. Never run `db push` against production (`PROD_DATABASE_URL`).

**E2E tests:** Ban `page.waitForTimeout()` — use element-state awaiting only. Every new feature or bug fix needs Playwright coverage. Run affected tests before declaring work complete.

**No debug leftovers:** Remove all `console.log` statements before completing any task.

**RBAC:** Every backend route must enforce roles via the `authorize()` middleware and respect subscription tier limits.

**UI/UX:** Use skeleton loaders (not spinners). Minimum 44×44px touch targets. Tables must degrade to stacked cards on mobile. Use Framer Motion for micro-interactions (it's already a dependency).

**GST compliance:** Billing/invoicing modules must include CGST/SGST/IGST breakdowns with HSN/SAC codes.

## Pre-Delivery Checklist

Before declaring any feature/fix complete, verify:

1. `tenant_id` filter on every query touching tenant data
2. No `any` types; shared types from `packages/shared` used
3. No hardcoded English strings — all text uses translation keys
4. Currency uses `₹` with `.toLocaleString('en-IN')`
5. Responsive at 375px and 768px breakpoints
6. Touch targets ≥ 44×44px, no hover-only critical actions
7. No `console.log` debug statements
8. No `page.waitForTimeout()` in Playwright tests
9. Schema changes use `migrate dev`, not `db push`
10. List endpoints return `PaginatedResponse<T>`
11. RBAC enforced via `authorize()` middleware
12. Dates use IST via `toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })`
13. Playwright E2E coverage added/updated

Provide a Delivery Summary with confidence rating: 🟢 HIGH (8–10) / 🟡 MEDIUM (5–7) / 🔴 LOW (1–4).

## Services & Ports

| Service | Port |
|---|---|
| Frontend | 3100 |
| API | 4100 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Prisma Studio | 5555 |

Health check: `GET http://localhost:4100/api/v1/health`

## Workspace Scope

This session is exclusively for the `istays` monorepo. If a prompt or error log clearly belongs to a different project (e.g., `hospital` app, `Yotto` app), stop and alert the user — do not write cross-project code.
