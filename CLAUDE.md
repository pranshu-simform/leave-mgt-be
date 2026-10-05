# Backend

Express 5, TypeScript 7 (strict, ESM, `nodenext`), Prisma 7 with `@prisma/adapter-pg`, PostgreSQL, Zod 4, pnpm. Read the root [CLAUDE.md](../CLAUDE.md) invariants first. Structure details are in [docs/BACKEND-STRUCTURE.md](../docs/BACKEND-STRUCTURE.md).

## Commands

- `pnpm dev` (tsx watch, loads `.env`), `pnpm build` (tsc), `pnpm start`
- `pnpm typecheck`, `pnpm lint` (oxlint), `pnpm format` / `pnpm format:check` (oxfmt)
- `pnpm prisma:generate`, `pnpm prisma:migrate` (`migrate dev`)
- Planned (Phase 0 and 1): `pnpm prisma:seed`, `pnpm prisma:deploy`

## Target structure

```
src/
  app.ts            # builds the app, never listens
  server.ts         # listen + graceful shutdown
  config/           # env.ts (Zod), database.ts, logger.ts
  common/           # constants, errors, middleware, types, utils, validators
  modules/<name>/   # <name>.{controller,service,repository,routes,schema,types}.ts + index.ts
  routes/index.ts   # mounts all module routers under /api; auth middleware first
  prisma/client.ts  # PrismaClient singleton + withTransaction()
  jobs/             # cleanup.job.ts, year allocation
prisma/             # schema.prisma, migrations/, seed.ts
scripts/            # seed-load.ts (stretch only: 5,000-user query-plan data)
```

Modules: auth, users, teams, leave-types, balances, holidays, leave-requests, approvals, calendar. Use the `add-module` skill to create one.

## Layering rules

- **Controller:** reads validated input, calls one service function, shapes the response. No rules, no Prisma.
- **Service:** business rules and the transaction boundary. Opens `withTransaction(fn)` and passes `tx` down.
- **Repository:** the only place that touches Prisma or raw SQL. Every method takes `db: Db` first (`Db = Prisma.TransactionClient | PrismaClient`), so it works inside and outside a transaction. Raw SQL uses `$queryRaw` with parameters, never string concatenation.
- **Cross-module calls** go through the other module's `index.ts`. Never import another module's internal files.
- A module's `index.ts` exports its router and its public service functions only.

## Errors and validation

- Throw `AppError(code, status, message, details?)` from `common/errors`. Codes come from `errorCodes.ts`. Never return ad-hoc error bodies.
- Response shapes: success `{ data, meta? }`, error `{ error: { code, message, issues? } }`.
- Statuses: 400 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED` / `TOKEN_EXPIRED`, 403 `FORBIDDEN` / `SELF_APPROVAL_FORBIDDEN`, 404 `NOT_FOUND`, 409 `ALREADY_DECIDED` / `REQUEST_LOCKED` / `OVERLAPPING_REQUEST` / `VERSION_CONFLICT`, 422 `INSUFFICIENT_BALANCE` and rule violations.
- Every route uses `validate({ body, query, params })` with a schema from the module's `*.schema.ts`. Schema names are `<action><Feature>Schema`, types are `<Action><Feature>Input = z.infer<…>`.
- Postgres `23P01` (exclusion) and `23514` (check) are mapped to `AppError` in `common/errors/errorHandler.ts`, not in services.

## Data rules

- Balance writes follow the `concurrency-safe-write` skill. The guard lives in the SQL `WHERE`, and the DB `CHECK` is the backstop.
- Constraints Prisma cannot express (exclusion, GiST index, triggers, CHECKs) live in hand-edited migration SQL. See the `db-migration` skill.
- Pagination is keyset (`created_at, id` or `start_date, id`). Default limit 25, max 100.
- Dates: use `common/utils/dates.ts`. Raw SQL returns dates with `to_char(…,'YYYY-MM-DD')`. Do not pass Prisma `Date` objects to the API.

## Auth

- `access_token` (15 min JWT, `jose`) and `refresh_token` (opaque, SHA-256 hashed in the DB, rotated, reuse revokes the family) are httpOnly cookies. A Bearer header is accepted as a fallback for `curl`.
- `authenticate` loads the user per request to honor `is_active` and role changes. It is mounted once in `routes/index.ts`.
- Passwords use `bcryptjs`. Never log tokens, hashes or passwords.

## Verification (no automated tests)

- By decision there is no test library, no test files and no `pnpm test`. Do not add them.
- Check changes by running the app and using `curl` and `psql`. The runbook is `PHASES.md` Part H.
- After any change to approval, balance or scope code, re-run Part H section C (parallel `curl` approvals) and section D (cross-team 404s, self-approval 403, no-cookie 401). See the `concurrency-safe-write` skill.
- Every new route: check it returns 401 without a cookie, 404 for another team's manager, and a clean 400 body for bad input.
- The DB constraints (CHECK, exclusion, append-only trigger) are the safety net. Never drop one to make a change pass.

## Naming and style

- Folders kebab-case. Files `<singular>.<layer>.ts`, for example `leave-requests/leave-request.service.ts`.
- ESM imports use the `.js` extension. No `any`. No `console.log` (use the pino logger).
- Run `pnpm format` before committing. Hooks run lint-staged.
