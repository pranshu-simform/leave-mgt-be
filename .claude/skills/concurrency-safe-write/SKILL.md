---
name: concurrency-safe-write
description: Write a state change or balance deduction that is correct under concurrent requests, and check it manually with parallel curl. Use for approve, reject, cancel, refund, balance adjust, or any read-modify-write on shared rows.
---

# Concurrency-safe writes

The brief's hardest case: two approvals at the same instant must not both succeed, and the balance must never go negative. See `PHASES.md` A1–A3. There are no automated tests (root `CLAUDE.md`), so the guard in the SQL and the DB constraints are what protect this, and the manual check below is how you confirm it.

## The pattern: guard in the `WHERE`, not in an `if`

Never read a row, check it in JS, then write. Put the condition in the `UPDATE` and look at the row count. The real code is `leave-requests/commit-approval.ts` and the guarded statements in `leave-request.repository.ts` and `balance.repository.ts`.

```ts
// 1. state guard + scope + self-approval, in one statement (leave-request.repository.ts)
const result = await db.leaveRequest.updateMany({
  where: { id, status: 'PENDING', user: approverScope(actor) }, // scope: managerId = actor (HR: anyone), never the actor
  data: {
    status: 'APPROVED',
    decidedBy: actor.id,
    decidedAt: new Date(),
    version: { increment: 1 },
  },
})
if (result.count !== 1) await explainDecisionMiss(db, id, actor) // 403 own request, 404 out of scope, 409 ALREADY_DECIDED

// 2. balance guard, same transaction (balances/repositories/balance.repository.ts, called through deductBalance)
const rows = await db.$queryRaw<{ id: string }[]>`
  UPDATE leave_balances SET used = used + ${days}::int
  WHERE user_id = ${userId}::uuid AND leave_type_id = ${typeId}::uuid AND year = ${year}::int
    AND used + ${days}::int <= allowance
  RETURNING id`
if (rows.length === 0) throw new AppError('INSUFFICIENT_BALANCE', 422, '…') // rolls back step 1
```

Then, in the same transaction, `deductBalance` writes the `leave_balance_ledger` row and `commitApproval` writes the `leave_request_events` row.

## Why it holds

- A row `UPDATE` takes a lock. A concurrent `UPDATE` waits, then re-evaluates its `WHERE` against the committed row (READ COMMITTED). The second approver sees `status = 'APPROVED'` and affects 0 rows.
- The status guard and the balance guard do different jobs. The status guard stops one request being decided twice; the balance guard stops different requests overspending the same balance. `docs/DECISIONS.md` shows that removing only the balance guard still passes the double-click test and fails the others.
- Lock order is always request row, then balance row, so two transactions cannot deadlock on each other. That is why there is no `40001`/`40P01` retry wrapper; add one only if a manual run ever shows such an error.
- The DB `CHECK (used BETWEEN 0 AND allowance)` is a backstop for a bug that overshoots. It cannot catch a silent lost update, so also compare `used` with the ledger (below).

## Rules

- All balance changes go through `deductBalance()` (called by `commitApproval()`), `refundBalance()` and, later, `adjust()`, each writing a ledger row. Never `UPDATE leave_balances` anywhere else.
- Use the stored `days` snapshot on the request for deduction and refund. Never recompute from holidays.
- Do not use `SELECT … FOR UPDATE` followed by JS checks as a substitute. If you need a lock, take it in a consistent order and still guard in the `WHERE`.

## Manual check (parallel `curl` against the running server)

Start the database and the API first (see the root README). Then set up a cookie jar for the approver and the required header, and log in as the employee's manager (seeded accounts are in the README):

```bash
J=$(mktemp)
curl -s -c $J -H 'Content-Type: application/json' \
  -d '{"email":"<manager email>","password":"<dev password>"}' localhost:4000/api/v1/auth/login
```

Run each scenario several times, because a race does not show on every attempt. After each one, check the balance, ledger and events with `psql`:

```sql
SELECT used, allowance FROM leave_balances WHERE user_id = '<employee>';
SELECT reason, delta FROM leave_balance_ledger WHERE request_id = '<request>';
SELECT action, actor_id, created_at FROM leave_request_events WHERE request_id = '<request>' ORDER BY created_at;
```

For the isolation checks (another team's manager gets 404, self-approval gets 403, no cookie gets 401), see `PHASES.md` Part H, section D.

1. **Double-click.** One pending 5-day request `R`. Fire 10 approvals at once:
   ```bash
   seq 10 | xargs -P10 -I{} curl -s -o /dev/null -w '%{http_code}\n' -b $J \
     -X POST localhost:4000/api/v1/leave-requests/$R/approve | sort | uniq -c
   ```
   Expect one `200` and nine `409`. In `psql`: `used` is 5 (not 50), one ledger `DEDUCT` row, one `APPROVED` event.
2. **Overcommit.** Allowance 10, two pending 6-day requests `R1` and `R2`. Approve both with two `curl … &` calls and `wait`. Expect one `200` and one `422 INSUFFICIENT_BALANCE`; `used` is 6 and the loser stays `PENDING`.
3. **Two approvers.** Manager and HR approve the same request at once (two cookie jars). One `200`, one `409`.
4. **Approve vs cancel.** Fire both on one pending request. The final `used` is 0 (cancelled) or `days` (approved) and matches the status.
5. **Stress.** 50 pending one-day requests, allowance 10, approve all with `xargs -P20`. Exactly 10 succeed and `used = 10`.
6. **Auto-approve boundary.** 15 parallel submits of a leave type with `requires_approval = false` against an allowance of 10. Exactly 10 are created `APPROVED` (201), five get `422`, and the failed submits leave no row.

## Show the check can fail

1. In a scratch change, replace step 2 with a read-then-write (`SELECT used`, check in JS, then `UPDATE`).
2. Re-run scenarios 1, 2 and 5. Expect `used` above the allowance, or the CHECK firing.
3. Revert the scratch change. Record what you saw in `docs/DECISIONS.md`.

Without this step you cannot tell a passing check from one that never raced.

After every scenario, also check that the ledger agrees with the balance: for each balance, `used` must equal `-sum(delta)` over the `DEDUCT` and `REFUND` rows, and `0 <= used <= allowance`.

```sql
SELECT count(*) FILTER (WHERE b.used <> -coalesce(l.s, 0)) AS mismatches
FROM leave_balances b
LEFT JOIN (SELECT balance_id, sum(delta) FILTER (WHERE reason IN ('DEDUCT','REFUND')) s
           FROM leave_balance_ledger GROUP BY balance_id) l ON l.balance_id = b.id;
```

Tests that create requests must run against a scratch database (create it, run `prisma migrate deploy` and the seed with `DATABASE_URL` pointing at it, drop it afterwards): events and ledger rows are append-only, so the dev database cannot be cleaned.
