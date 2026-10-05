---
name: add-module
description: Scaffold a new backend module (controller, service, repository, routes, schema, types, index) under src/modules and register it. Use when asked to add a module, resource, endpoint group or domain area to the backend.
---

# Add a backend module

Name the module in kebab-case plural (`leave-types`) and files in singular (`leave-type.*.ts`). Read `backend/CLAUDE.md` and `docs/BACKEND-STRUCTURE.md` first.

## Steps

1. **Schema (`<name>.schema.ts`).** Zod schemas for body, query and params, plus inferred input types.
   ```ts
   export const listLeaveTypesQuerySchema = z.object({
     includeInactive: z.coerce.boolean().default(false),
   })
   export type ListLeaveTypesQuery = z.infer<typeof listLeaveTypesQuerySchema>
   ```
   Date fields use `isoDateSchema` from `common/validators/common.schema.ts`. `paginationQuerySchema` and id schemas live there too.
2. **Types (`<name>.types.ts`).** DTOs and domain types. No Prisma model types leak past the service.
3. **Repository (`<name>.repository.ts`).** An object of functions taking `db: Db` first. All Prisma and raw SQL lives here. Scope predicates (`manager_id = :actor`) are in the query.
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
4. **Service (`<name>.service.ts`).** Business rules. Use `withTransaction` for multi-step writes and pass `tx` to repositories. Throw `AppError` with a code from `errorCodes.ts`. If the module writes a balance, stop and read the `concurrency-safe-write` skill.
5. **Controller (`<name>.controller.ts`).** Read `req.user` and validated input, call one service function, respond with `ok(...)` or `paginated(...)` from `common/utils/response.ts`. No rules and no Prisma here.
6. **Routes (`<name>.routes.ts`).** Build a router. Add `validate({...})` to every route. Add `requireRole(...)` only for coarse role gates. Relational scope stays in the service and repository.
7. **Index (`index.ts`).** Export the router and the public service functions only.
8. **Register** the router in `src/routes/v1/index.ts` **after** the auth middleware (business routes are always versioned). Import everything with `@/` and no extension.
9. **Manual check** (no automated tests). With `curl` and a cookie jar: the happy path, each validation failure (400 with `details`), no cookie (401), and for any route touching a request, a cross-team manager (404).
10. **Docs.** Add the module to the tree in `docs/BACKEND-STRUCTURE.md` and the endpoints to the API table in `PHASES.md` Part C.

## Checklist

- [ ] No Prisma import in the controller or service.
- [ ] Every repository method takes `db` first.
- [ ] Every route is validated and reachable only through the authenticated router.
- [ ] The acting user comes from `req.user`.
- [ ] Lists are bounded and paginated (`page`/`limit`), answered with `paginated()`; everything else with `ok()`.
- [ ] `pnpm typecheck && pnpm lint && pnpm format:check` pass.
