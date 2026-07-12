---
name: TransitOps project overview
description: Architecture and key facts about the TransitOps fleet management platform
---

## Stack
- **Backend**: Node.js + Express + TypeScript, JWT auth (no third-party provider), bcryptjs, jsonwebtoken
- **DB**: PostgreSQL via Drizzle ORM (`lib/db/`). Schema in `lib/db/src/schema/` — tables: roles, users, refreshTokens, vehicles, drivers, trips, maintenanceLogs, fuelLogs, expenses
- **Codegen**: Orval from `lib/api-spec/openapi.yaml` → `lib/api-client-react` (React Query hooks) + `lib/api-zod` (Zod validators)
- **Frontend**: React + Vite, Tailwind, shadcn/ui, wouter routing, dark cockpit theme (black bg, amber primary #f59e0b)

## Key file paths
- API spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/`
- API routes: `artifacts/api-server/src/routes/`
- Auth lib: `artifacts/api-server/src/lib/auth.ts`
- Auth middleware: `artifacts/api-server/src/middlewares/authenticate.ts`
- Seed: `artifacts/api-server/src/seed.ts` (run: `pnpm --filter @workspace/api-server run seed`)
- Frontend pages: `artifacts/transitops/src/pages/`

## RBAC roles
fleet_manager, dispatcher, safety_officer, financial_analyst

## Demo users (password: password123)
- fleet@transitops.io (Fleet Manager)
- dispatch@transitops.io (Dispatcher)
- safety@transitops.io (Safety Officer)
- finance@transitops.io (Financial Analyst)

## Business rules enforced server-side
- Trip dispatch: cargo weight must not exceed vehicle capacity; vehicle must be "available"; driver must be "available" with non-expired license
- Dispatch/complete/cancel all use DB transactions to atomically update vehicle+driver status
- Opening maintenance sets vehicle to "in_shop"; closing maintenance restores to "available"
- Retiring a vehicle fails if it's "on_trip"

## Codegen command
`pnpm --filter @workspace/api-spec run codegen`

## Known: api-client-react index.ts must NOT re-export non-existent functions
The index.ts (`lib/api-client-react/src/index.ts`) must only export from `./generated/api` and `./generated/api.schemas`. Do NOT add `setBaseUrl`/`setAuthTokenGetter` exports — they don't exist in custom-fetch.ts.

**Why:** Design subagent previously added these stale exports causing a Vite module resolution error at runtime.
