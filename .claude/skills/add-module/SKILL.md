---
name: add-module
description: Scaffold a new backend module (one folder per layer: constants, controllers, repositories, routes, schemas, services, types, utils, and an index) under src/modules and register it. Use when asked to add a module, resource, endpoint group or domain area to the backend.
---

# Add a backend module

Name the module in kebab-case plural (`leave-types`) and files in singular, inside a folder per layer (`leave-types/services/leave-type.service.ts`). Constants, types and utils each get their own files (`constants/leave-type.constants.ts`, `types/leave-type.types.ts`, `utils/leave-type.<concern>.ts`); create a folder only when the module has something for it. Read `backend/CLAUDE.md` and `docs/BACKEND-STRUCTURE.md` first.

## Steps

1. **Schema (`schemas/<name>.schema.ts`).** Zod schemas for body, query and params. The inferred input types (`z.infer`) go in `types/<name>.types.ts`.
   ```ts
   export const listLeaveTypesQuerySchema = z.object({
     includeInactive: z.coerce.boolean().default(false),
   })
   export type ListLeaveTypesQuery = z.infer<typeof listLeaveTypesQuerySchema>
   ```
   Date fields use `isoDateSchema` from `common/validators/common.schema.ts`. `paginationQuerySchema` and id schemas live there too.
2. **Types (`types/<name>.types.ts`).** Every interface and type: DTOs, inferred inputs, repository rows and parameter objects. No Prisma model types leak past the service. **Constants (`constants/<name>.constants.ts`)** hold caps (`MAX_*`), role lists, regexes and Prisma include objects; **utils (`utils/<name>.<concern>.ts`)** hold pure helpers (mappers, error factories, query builders).
3. **Repository (`repositories/<name>.repository.ts`).** An object of functions taking `db: Db` first. All Prisma and raw SQL lives here. Scope predicates (`manager_id = :actor`) are in the query.
   ```ts
   export const leaveTypeRepository = {
     list: (db: Db, includeInactive: boolean) =>
       db.leaveType.findMany({
         where: includeInactive ? {} : { isActive: true },
         orderBy: { code: 'asc' },
         take: 100,
       }),
   }
   ```
4. **Service (`services/<name>.service.ts`).** Business rules. Use `withTransaction` for multi-step writes and pass `tx` to repositories. Throw `AppError` with a code from `errorCodes.ts`. If the module writes a balance, stop and read the `concurrency-safe-write` skill.
5. **Controller (`controllers/<name>.controller.ts`).** Read `req.user` and validated input, call one service function, respond with `ok(...)` or `paginated(...)` from `common/utils/response.ts`. No rules and no Prisma here.
6. **Routes (`routes/<name>.routes.ts`).** Build a router. Add `validate({...})` to every route. Add `requireRole(...)` only for coarse role gates. Relational scope stays in the service and repository.
7. **Index (`index.ts`, at the module root).** Export the router and the public service functions only.
8. **Register** the router in `src/routes/v1/index.ts` **after** the auth middleware (business routes are always versioned). Import everything with `@/` and no extension.
9. **Manual check** (no automated tests). With `curl` and a cookie jar: the happy path, each validation failure (400 with `details`), no cookie (401), and for any route touching a request, a cross-team manager (404).
10. **Docs.** Add the module to the tree in `docs/BACKEND-STRUCTURE.md` and the endpoints to the API table in `PHASES.md` Part C.

## Checklist

- [ ] No Prisma import in the controller or service.
- [ ] No top-level constant, `interface`, `type` or pure helper function inside a controller, service, repository, routes or schema file.
- [ ] Every repository method takes `db` first.
- [ ] Every route is validated and reachable only through the authenticated router.
- [ ] The acting user comes from `req.user`.
- [ ] Lists are bounded and paginated (`page`/`limit`), answered with `paginated()`; everything else with `ok()`.
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check` pass.
