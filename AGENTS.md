# SSOT: Stockpilot

## 1. Stack & CLI
- **Stack:** Next.js 16.4 (App Router), Node 24, TS (Strict). Tailwind, shadcn/ui (ZERO custom CSS). PostgreSQL, Prisma, React Query, Zustand, Redis. Auth.js, Cloudinary, Razorpay, n8n. Vercel, Docker, Vitest, Playwright.
- **CLI:** `npm run typecheck`, `npm run lint`, `npx vitest run <file>`, `npx playwright test <file>`, `npx prisma generate`.

## 2. Hard Constraints
- **Types:** ZERO `any`, `unknown` without Zod, or `@ts-ignore`.
- **Validation:** Zod validation REQUIRED for all payloads/env vars before DB logic.
- **State:** React Query = Remote Data. Zustand = Local UI View ONLY.
- **DB:** Prisma singleton (`@/lib/prisma`) ONLY. ZERO raw SQL.

## 3. Network Boundary
- **Server Components:** Read-only Prisma/Redis queries.
- **Actions (`src/actions/`):** UI mutations (Create/Update/Soft-Delete) ONLY. NO `GET`. NO webhooks.
- **Route Handlers (`src/app/api/`):** Webhooks & React Query `GET` ONLY.

## 4. Redis (`src/lib/redis`)
Restricted strictly to:
1. **Cache:** Read-through `GET`. Actions MUST invalidate (`del`).
2. **Locks:** Checkout TTL inventory holds.
3. **Idempotency:** Prevent duplicate Razorpay/n8n webhooks.
4. **Throttle:** Rate limit public/auth routes.

## 5. Pathing (`src/` Mandate)
- `app/`: Next.js routes/api ONLY.
- `components/`: React UI.
- `actions/`: Server Actions.
- `hooks/`: React Query / React hooks.
- `store/`: Zustand.
- `lib/`: Singletons / API clients.
- `zod/`: Zod schemas.
- `types/`: TS Interfaces.
- **Imports:** Absolute `@/` ONLY. ZERO relative (`../`).

## 6. Code Anatomy
- **Exports:** Default for Next.js routes (`page/layout/error/loading`). Named for EVERYTHING else.
- **Naming:** Routes = `lowercase.tsx`. Components = `PascalCase.tsx`. Logic/Hooks/Schemas = `camelCase.ts`.
- **Responses:** Standard contract ONLY. 
  - Success: `{ success: true, data: T }`
  - Error: `{ success: false, error: "safe string" }` (ZERO raw errors/traces).

## 7. ZERO-TRUST Destructive Ops
- **DB Records:** Soft deletes ONLY (`deletedAt` / `isActive: false`). NO `.delete()`.
- **DB Schema:** NO `prisma db push --force-reset` or `migrate reset`.
- **System:** NO `rm -rf`, `fs.unlink`, `git push --force`, or history rewrite.
- **Protocol:** If destruction is mathematically required, HALT and prompt user.