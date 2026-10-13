---
paths:
  - 'prisma/**'
  - 'src/prisma/**'
---

# Prisma and migration rules

- **Add only what the current phase uses.** A migration creates that phase's tables, columns, indexes and constraints; later phases add theirs (table ownership is in `PHASES.md`, Phase 1).
- The schema is a folder (`schema: 'prisma'` in `prisma.config.ts`). `prisma/schema.prisma` holds only `generator` and `datasource`; models live in `prisma/models/<module>.prisma`, one file per backend module, each enum in the file of the model that owns it. A new module adds a new file there. Names must be unique across files, and `migrations/` stays beside `schema.prisma`.
- Dates are `@db.Date` (`DATE`). Whole-day quantities are `Int`. Statuses and roles are enums.
- Create migrations with `prisma migrate dev --create-only`, then hand-append SQL for what Prisma cannot express: `btree_gist`, the exclusion constraint, CHECK constraints, GiST indexes and the append-only trigger. Commit the edited SQL. Never edit a migration that has been applied elsewhere; add a new one.
- Constraints that protect invariants must exist at the DB level: `used BETWEEN 0 AND allowance`, `start_date <= end_date`, `days > 0`, no overlapping active requests per user, no UPDATE or DELETE on `leave_request_events`.
- Add indexes from an `EXPLAIN`, not by guess. Record the plan in `docs/query-plans.md`.
- `prisma/seed.ts` is idempotent (upserts or `ON CONFLICT DO NOTHING`) and grows with each phase. It never truncates.
- `src/generated/prisma/` is generated and gitignored. Do not edit or commit it. Run `pnpm prisma:generate` after schema changes.
- `prisma.config.ts` must tolerate a missing `.env` (Docker passes env vars directly).
- `DATABASE_URL` values with special characters must be URL-encoded (`@` → `%40`).
