# Backend

Express 5, TypeScript 7 (strict, ESM, `nodenext`), Prisma 7 with `@prisma/adapter-pg`, PostgreSQL, Zod 4, pnpm. Read the root [CLAUDE.md](../CLAUDE.md) invariants first. Structure details are in [docs/BACKEND-STRUCTURE.md](../docs/BACKEND-STRUCTURE.md).

## Docker

`backend/Dockerfile` builds the API for the root `docker-compose.yml` and keeps to one job: `CMD node dist/server.js`. **The container does not migrate or seed; that is done by hand** with `docker compose exec backend ./node_modules/.bin/prisma migrate deploy` and `docker compose exec backend node dist/seed.js` (both idempotent). That is why the runtime image keeps `prisma` (a production dependency) and `dist/seed.js` (a second `tsdown` entry): do not move them back to `devDependencies`. The runtime image has production dependencies only and runs as the non-root `node` user; `prisma generate` needs `DATABASE_URL` set to any value.

## Commands

- `pnpm dev` (tsx watch on `src/server.ts`, loads `.env` if present), `pnpm build` (tsdown, bundles to `dist/server.js`), `pnpm start` (`node dist/server.js`)
- `pnpm typecheck` (`tsc --noEmit`), `pnpm lint` (oxlint), `pnpm format` / `pnpm format:check` (oxfmt)
- `pnpm prisma:generate`, `pnpm prisma:migrate` (`migrate dev`)
- `pnpm prisma:seed` (idempotent upserts; every seeded account shares the dev password in `prisma/seed.ts`), `pnpm prisma:deploy` (`migrate deploy`)

## Structure

Phases 0 to 11 are applied (the backend last changed in Phase 11). `config/`, `common/` (errors, constants, middleware, types, utils, validators), `routes/`, `prisma/client.ts` and the `auth`, `users`, `holidays`, `leave-types`, `balances`, `leave-requests` and `approvals` modules exist. Everything else (the other modules, `jobs/`) is added by the phase that first needs it, with its own tables, error codes and dependencies. See `docs/BACKEND-STRUCTURE.md` for what exists.

```
src/
  app.ts            # builds the app, never listens
  server.ts         # listen + graceful shutdown
  config/           # env.ts (Zod), database.ts, logger.ts
  common/           # constants, errors, middleware, types, utils, validators
  modules/<name>/   # <name>.{controller,service,repository,routes,schema,types}.ts + index.ts
  routes/           # index.ts (/api/health + /api/v1), health.routes.ts, v1/index.ts (module routers, auth first)
  prisma/client.ts  # PrismaClient singleton (withTransaction() arrives with the first repository)
  jobs/             # cleanup.job.ts, year allocation
prisma/             # schema.prisma, migrations/, seed.ts
scripts/            # seed-load.ts (stretch only: 5,000-user query-plan data)
```

Modules: auth, users, leave-types, balances, holidays, leave-requests, approvals, calendar. A team is the users who share a `manager_id`; there is no teams module or table. Use the `add-module` skill to create one.

## API versioning

- Business endpoints are `/api/v1/<resource>`, mounted in `routes/v1/index.ts`. Operational endpoints (`/api/health`, `/api/health/ready`) are unversioned and live in `routes/index.ts`.
- Additive changes (new endpoint, new optional field) stay in `v1`. A breaking change (removed or renamed field, changed meaning) adds `routes/v2/` beside `routes/v1/`, sharing controllers and services where possible.
- An unknown version falls through to the 404 envelope. Never put business routes outside a versioned router.

## Express 5 notes

- `req.query` is read-only and `req.params` is reset per layer, so the `validate` middleware stores parsed input on `req.validated`. Controllers read `req.validated` (cast to the schema's `…Input` type), never `req.query` or `req.body` directly.
- Rejected promises from async handlers reach the error middleware on their own; do not wrap handlers in try/catch just to forward errors.

## Layering rules

- **Controller:** reads validated input, calls one service function, shapes the response. No rules, no Prisma.
- **Service:** business rules and the transaction boundary. Opens `withTransaction(fn)` and passes `tx` down.
- **Repository:** the only place that touches Prisma or raw SQL. Every method takes `db: Db` first (`Db = Prisma.TransactionClient | PrismaClient`), so it works inside and outside a transaction. Raw SQL uses `$queryRaw` with parameters, never string concatenation.
- **Cross-module calls** go through the other module's `index.ts`. Never import another module's internal files.
- A module's `index.ts` exports its router and its public service functions only.

## Errors and validation

- Throw `AppError(code, status, message, details?)` from `common/errors`. Codes come from `errorCodes.ts`. Never return ad-hoc error bodies.
- Response shapes (see `docs/API-RESPONSES.md`): success `{ success: true, message?, data }`, paginated `{ success: true, data: [...], pagination }`, error `{ success: false, error: { code, message, details? } }`. Build bodies only with `ok()`, `paginated()` and `fail()` from `common/utils/response.ts`. Never write `res.json({...})` by hand. Action with nothing to return: `ok(null)`, not 204. The request id is the `X-Request-Id` header, never in the body.
- Statuses: 400 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED` / `TOKEN_EXPIRED`, 403 `FORBIDDEN` / `SELF_APPROVAL_FORBIDDEN`, 404 `NOT_FOUND`, 409 `ALREADY_DECIDED` / `REQUEST_LOCKED` / `OVERLAPPING_REQUEST` / `VERSION_CONFLICT`, 422 `INSUFFICIENT_BALANCE` and rule violations.
- Every route uses `validate({ body, query, params })` with a schema from the module's `*.schema.ts`. Schema names are `<action><Feature>Schema`, types are `<Action><Feature>Input = z.infer<…>`.
- Database constraint errors are mapped to `AppError` in `common/errors/errorHandler.ts`, not in services. Today that is the overlap exclusion constraint (`23P01` → 409 `OVERLAPPING_REQUEST`); Prisma's pg adapter delivers it as `P2039` with the Postgres code under `meta.driverAdapterError.cause`. Add a mapping only when a constraint can be hit by a real request.

## Data rules

- Balance writes follow the `concurrency-safe-write` skill. The guard lives in the SQL `WHERE`, and the DB `CHECK` is the backstop.
- **Tables arrive with their feature.** A phase's migration creates only the tables, columns and constraints that phase uses. Do not add a model early.
- Constraints Prisma cannot express (exclusion, GiST index, triggers, CHECKs) live in hand-edited migration SQL. See the `db-migration` skill.
- Pagination is `?page=1&limit=25` (1-based, default limit 25, max 100). Use `paginationQuerySchema`, `toSkipTake()` and `buildPagination()`; answer with `paginated(items, pagination)`. Order by a stable key (for example `created_at, id`) so pages do not overlap.
- Dates: use `common/utils/dates.ts` (date-fns on a `UTCDate`, strings in and out; an invalid date throws). Do not hand-roll date math. "Today" is the server's UTC date. Raw SQL returns dates with `to_char(…,'YYYY-MM-DD')`. Do not pass Prisma `Date` objects to the API.

## Auth

- `access_token` (15 min HS256 JWT, `jsonwebtoken`) and `refresh_token` (opaque, SHA-256 hashed in the DB, rotated, reuse revokes the family) are httpOnly cookies. A Bearer header is accepted as a fallback for `curl`.
- `authenticate` loads the user per request to honor `is_active` and role changes. It is mounted once in `routes/v1/index.ts`; register new module routers below it.
- Passwords use `bcryptjs`. Never log tokens, hashes or passwords.

## Verification (no automated tests)

- By decision there is no test library, no test files and no `pnpm test`. Do not add them.
- Check changes by running the app and using `curl` and `psql`. The runbook is `PHASES.md` Part H.
- After any change to approval, balance or scope code, re-run Part H section C (parallel `curl` approvals) and section D (cross-team 404s, self-approval 403, no-cookie 401). See the `concurrency-safe-write` skill.
- Every new route: check it returns 401 without a cookie, 404 for another team's manager, and a clean 400 body for bad input.
- The DB constraints (CHECK, exclusion, append-only trigger) are the safety net. Never drop one to make a change pass.

## Naming and style

- Folders kebab-case. Files `<singular>.<layer>.ts`, for example `leave-requests/leave-request.service.ts`.
- Import with the `@/` alias and no extension (`import { env } from '@/config/env'`); same-folder files may use `./Name`. No `any`. No `console.log` (use the pino logger).
- Run `pnpm format` before committing. Hooks run lint-staged.
