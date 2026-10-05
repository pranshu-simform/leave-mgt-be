---
name: concurrency-safe-write
description: Write a state change or balance deduction that is correct under concurrent requests, and check it manually with parallel curl. Use for approve, reject, cancel, refund, balance adjust, or any read-modify-write on shared rows.
---

# Concurrency-safe writes

The brief's hardest case: two approvals at the same instant must not both succeed, and the balance must never go negative. See `PHASES.md` A1–A3. There are no automated tests (root `CLAUDE.md`), so the guard in the SQL and the DB constraints are what protect this, and the manual check below is how you confirm it.

## The pattern: guard in the `WHERE`, not in an `if`

Never read a row, check it in JS, then write. Put the condition in the `UPDATE` and look at the row count.

```ts
// 1. state guard + scope + self-approval, in one statement
const rows = await db.$queryRaw<Row[]>`
  UPDATE leave_requests SET status = 'APPROVED', decided_by = ${actorId}, decided_at = now(), version = version + 1
  WHERE id = ${id} AND status = 'PENDING' AND user_id <> ${actorId}
    AND user_id IN (SELECT id FROM users WHERE manager_id = ${actorId})
  RETURNING id, user_id, leave_type_id, days`
if (rows.length === 0) throw await explainNoMatch(db, id, actorId) // 404 vs ALREADY_DECIDED

// 2. balance guard (same transaction)
const bal = await db.$queryRaw<Bal[]>`
  UPDATE leave_balances SET used = used + ${days}
  WHERE user_id = ${userId} AND leave_type_id = ${typeId} AND year = ${year} AND used + ${days} <= allowance
  RETURNING id`
if (bal.length === 0) throw new AppError('INSUFFICIENT_BALANCE', 422, 'Not enough balance') // rolls back step 1
```

Then, in the same transaction, insert the `leave_balance_ledger` row and the `leave_request_events` row.

## Why it holds

- A row `UPDATE` takes a lock. A concurrent `UPDATE` waits, then re-evaluates its `WHERE` against the committed row (READ COMMITTED). The second approver sees `status = 'APPROVED'` and affects 0 rows.
- Lock order is always request row, then balance row, so two transactions cannot deadlock on each other. Wrap in a retry for `40001` and `40P01` anyway.
- The DB `CHECK (used BETWEEN 0 AND allowance)` is the backstop if a bug slips past the `WHERE`.

## Rules

- All balance changes go through `commitApproval()`, `refund()` or `adjust()`, each writing a ledger row. Never `UPDATE leave_balances` anywhere else.
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

## Show the check can fail

1. In a scratch change, replace step 2 with a read-then-write (`SELECT used`, check in JS, then `UPDATE`).
2. Re-run scenarios 1, 2 and 5. Expect `used` above the allowance, or the CHECK firing.
3. Revert the scratch change. Record what you saw in `docs/DECISIONS.md`.

Without this step you cannot tell a passing check from one that never raced.
