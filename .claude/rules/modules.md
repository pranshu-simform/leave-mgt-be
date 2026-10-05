---
paths:
  - 'src/modules/**'
  - 'src/routes/**'
  - 'src/common/**'
---

# Module rules

- Layers: controller → service → repository. Controllers never import Prisma. Services never write SQL. Repositories never decide business rules.
- Repository methods take `db: Db` as the first argument. Never import the global `prisma` inside a repository.
- Transactions are opened in services with `withTransaction`. Do not open a transaction in a controller or repository.
- Raw SQL uses `$queryRaw` with tagged-template parameters. Never concatenate user input into SQL.
- Every route has `validate({ body, query, params })` from the module's `*.schema.ts`. The acting user is `req.user`, never a body field.
- Scope checks belong in the query (`WHERE user.manager_id = :actor`), not in an `if` after loading. Out-of-scope reads return 404.
- No leave-type-specific branches. If a rule differs by type, it must be a `leave_types` column read by `evaluateLeaveRules`.
- Cross-module imports go through the other module's `index.ts`.
- New routers are registered in `src/routes/index.ts` **after** the auth middleware. Do not mount anything before it.
- Throw `AppError` with a code from `errorCodes.ts`. Do not send error responses by hand.
- Lists are bounded and keyset-paginated. Never `findMany()` without a `where` and a `take`.
