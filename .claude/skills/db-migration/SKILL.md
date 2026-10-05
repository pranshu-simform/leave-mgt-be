---
name: db-migration
description: Change the Prisma schema and create a migration, including hand-written SQL for exclusion constraints, CHECKs, GiST indexes and triggers that Prisma cannot express. Use when asked to add or change a table, column, index or constraint.
---

# Schema change and migration

## Steps

1. Edit `prisma/schema.prisma`. Dates are `@db.Date`, day counts are `Int`, statuses and roles are enums. Name columns with `@map` to snake_case and tables with `@@map`.
2. Create the migration without applying it: `pnpm prisma migrate dev --create-only --name <short_snake_name>`.
3. Open the new `prisma/migrations/<timestamp>_<name>/migration.sql` and **append** hand-written SQL for anything Prisma cannot express (below).
4. Apply it: `pnpm prisma migrate dev`. Then `pnpm prisma:generate`.
5. Prove the constraint holds with `psql` (see below).
6. If you added an index, record the `EXPLAIN (ANALYZE, BUFFERS)` in `docs/query-plans.md`.

## SQL patterns to append

```sql
-- required once
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- one user cannot hold overlapping active requests (also closes the race between concurrent submits)
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_no_overlap
  EXCLUDE USING gist (user_id WITH =, daterange(start_date, end_date, '[]') WITH &&)
  WHERE (status IN ('PENDING', 'APPROVED'));

-- value invariants
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_dates_ck CHECK (start_date <= end_date AND days > 0);
ALTER TABLE leave_balances ADD CONSTRAINT leave_balances_used_ck CHECK (used >= 0 AND used <= allowance);

-- range lookup for overlap and calendar queries
CREATE INDEX leave_requests_active_range_gist ON leave_requests
  USING gist (daterange(start_date, end_date, '[]')) WHERE status IN ('PENDING', 'APPROVED');

-- append-only audit
CREATE FUNCTION forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS
  $$ BEGIN RAISE EXCEPTION 'leave_request_events is append-only'; END $$;
CREATE TRIGGER leave_request_events_append_only
  BEFORE UPDATE OR DELETE ON leave_request_events FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
```

Map violations in `common/errors/errorHandler.ts`: `23P01` → `OVERLAPPING_REQUEST` (409), `23514` → the matching rule code (422).

## Rules

- Never edit a migration that another environment has applied. Add a new one.
- Commit the hand-edited SQL. It is the only record of those constraints.
- A constraint check in `psql` must try to violate it: insert an overlapping request, set `used` above `allowance`, `UPDATE` an event row. Each must fail with the expected SQLSTATE.
- Keep migrations idempotent-safe for a fresh database: `prisma migrate deploy` on an empty Postgres must succeed.
