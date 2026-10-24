# SSOT: Stockpilot

## 1. System Architecture & Tech Stack
- **Framework:** Next.js v16.4 (App Router exclusively)
- **Runtime:** Node.js v24
- **Language:** TypeScript (Strict mode enabled)
- **Styling:** Tailwind CSS + shadcn/ui (Zero custom CSS files)
- **Database:** PostgreSQL via Prisma ORM
- **State & Caching:** React Query (remote server state), Zustand (client view-state only), Redis
- **Auth & Services:** Auth.js (NextAuth), Cloudinary (media), Razorpay (payments)
- **Testing:** Vitest (unit/integration), Playwright (E2E), Postman (API)
- **Orchestration:** Docker (local PostgreSQL, Redis, n8n), Vercel (production target)

## 2. Engineering Guardrails & System Rules
- **Strict Typing:** Zero `any` types. No `@ts-ignore`. Explicit TypeScript types/interfaces required for all entities and functions.
- **Payload Validation:** All incoming payloads to Route Handlers and Server Actions must be validated with a dedicated Zod schema before hitting the database or business logic.
- **State Segregation:** 
  - `React Query`: Exclusively for caching, revalidating, and synchronizing remote server state on the client.
  - `Zustand`: Exclusively for local, transient UI view state (e.g., sidebar collapse, active modal steps, multi-step wizard state). Never mirror server data into Zustand.
- **Database Security:** Zero raw, unparameterized SQL queries. All operations must run through the central Prisma client instance. Ensure the Prisma client is exported as a global singleton to prevent connection pool exhaustion in serverless runtimes.
- **Environment Isolation:** Local development dependencies (PostgreSQL, Redis, n8n) run strictly inside Docker containers. Production relies on managed cloud services.

## 3. Backend Network Boundary (Server Actions vs. Route Handlers)
The agent must never arbitrarily alternate between Server Actions and Route Handlers. Follow this strict routing matrix:
- **Server Actions (`/actions/...`):** Use EXCLUSIVELY for internal client-to-server mutations (Create, Update, Delete) triggered by UI forms or buttons. Never use Server Actions for `GET` data fetching inside React Query. Never expose to external third-party services.
- **Route Handlers (`app/api/.../route.ts`):** Use EXCLUSIVELY for:
  1. External Webhooks: Razorpay, n8n, Cloudinary signatures.
  2. React Query `GET` Endpoints: Client-side read queries requiring pagination, URL params, or polling.

## 4. Redis Responsibility Matrix
The agent must only invoke the Redis client (`lib/redis.ts`) for these specific operations:
1. **Read-Through Cache:** Cache high-read `GET` Route Handler responses (e.g., `cache:products:page:1`). Server Action mutations MUST explicitly invalidate related keys.
2. **Stock Reservation TTL Locks:** Store temporary inventory holds during checkout (e.g., `reserve:item:{id}`) prior to Razorpay confirmation.
3. **Webhook Idempotency:** Store processed webhook event IDs (`idempotency:{eventId}`) to prevent duplicate stock deductions.
4. **Rate Limiting:** Throttle public Route Handlers and Auth endpoints.

## 5. Directory Structure & Pathing Rules
- `/app/`: Exclusively for Next.js routing, layouts, and API Route Handlers.
- `/components/`: All React components, including shadcn/ui.
- `/actions/`: Centralized location for all Next.js Server Actions.
- `/lib/`: Global singletons, infrastructure clients, and utility functions.
- `/zod/`: The single source of truth for all Zod validation schemas.
- **Imports:** Relative imports (`../../`) are explicitly banned. All internal imports MUST use the absolute path alias `@/`.

## 6. Code Anatomy & Error Handling
- **Exports:** `page.tsx` and `layout.tsx` must use default exports. All other files (components, actions, utilities, schemas) MUST use named exports.
- **File Naming:** Routing files are strictly lowercase (`page.tsx`). React Components are PascalCase (`ProductCard.tsx`). Utilities, Actions, and Schemas are camelCase (`stockActions.ts`).
- **Standardized Server Responses:** Every Server Action and API Route must return a predictable object avoiding sensitive data leaks:
  - Success: `{ success: true, data: any }`
  - Error: `{ success: false, error: "Safe user-facing message" }`
## 7. Destructive Operations & Safety Guardrails
The agent is strictly forbidden from executing destructive operations autonomously.

- **Database Records (No Hard Deletes):** Never write Prisma `.delete()` or `.deleteMany()` queries in application code. Implement "soft deletes" exclusively by updating a `deletedAt` timestamp or setting an `isActive: false` flag. 
- **Database Schema & Migrations:** Never execute `prisma db push --force-reset`, `prisma migrate reset`, or any `DROP TABLE` / `DROP DATABASE` commands. If a database reset or destructive migration is required to proceed, the agent must halt, explain why, and instruct the user to run the command manually.
- **File System Deletions:** Never delete files or directories autonomously. Never write Node scripts that use `fs.unlink`, `fs.rmdir`, or execute `rm -rf` via child processes. If a file becomes obsolete during a refactor, list the file path and instruct the user to delete it manually.
- **Git Operations:** Never run `git push --force`, `git reset --hard`, or modify Git history.