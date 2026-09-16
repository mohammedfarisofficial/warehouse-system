# Assumptions & policy decisions

**Confirm-vs-expire race.** If a confirm and the expiry sweep both try to
act on the same reservation at nearly the same moment, *expiry wins* —
whichever transaction's `WHERE state='PENDING'` guard commits first
succeeds; the loser sees `changes === 0` and returns `INVALID_STATE`
rather than double-processing. Expiry wins by construction here (not by
an extra priority rule) because we can't guarantee the stock wasn't
already reallocated once the hold window has technically elapsed.

**Hold window.** Fixed at 60 seconds (`HOLD_WINDOW_MS`), not configurable
per-request in this version.

**Single instance only.** The per-key in-process queue (`keyQueue.js`)
only serializes writes within one Node process. Running two instances
behind a load balancer:
- Reservation correctness still holds — the optimistic-concurrency
  `UPDATE ... WHERE version = ?` check is enforced by SQLite/the DB
  itself, not by the queue.
- The expiry sweeper does **not** coordinate across instances. Running
  two sweepers against the same DB is *safe* (each UPDATE's
  `WHERE state='PENDING'` guard means only one instance's sweep will
  actually apply any given expiry — the other gets `changes === 0` and
  moves on) but wasteful. A production multi-instance deployment should
  either run the sweeper as a single dedicated process, or take a
  Postgres advisory lock / `SELECT ... FOR UPDATE SKIP LOCKED` per tick
  so only one instance's sweep does the work.
- SQLite itself doesn't support multiple app servers on different hosts
  (it's a single file). Swapping to Postgres would require re-pointing
  `db.js`'s connection and rewriting the parameter placeholders, but the
  algorithm (OCC UPDATE, transaction shape, ledger inserts) is unchanged.

**Negative stock adjustments.** `POST /stock` refuses an adjustment that
would drop `on_hand` below the currently `reserved` amount, to avoid
creating a state where held reservations exceed physical stock.

**Ledger is append-only.** No code path updates or deletes ledger rows.
Corrections are modeled as new events (e.g. a manual `StockAdjusted`
entry), never edits to history.
