# Stock Reservation Service

An HTTP API that allows clients to reserve stock temporarily before confirming a purchase, managing concurrency, timeouts, and idempotency.

## How to run and seed it

**Requirements:**
- Node.js (v18+)

**Setup & Start:**
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build and start the service:
   ```bash
   npm run build
   npm start
   ```
   (Alternatively, use `npm run dev` to run it using `tsx` without building).

**Seeding data:**
To generate the required 20,000+ historical entries:
```bash
npm run seed
```

**Running Tests:**
```bash
npm test
```

## Design Choices
- **Language/Framework:** TypeScript and Express. They provide strong typing and a mature ecosystem for web APIs.
- **Storage:** `better-sqlite3`. It provides synchronous, fast embedded SQL storage. The database tracks both current state (in a `stock` table) and history (in a `transactions` table as an append-only ledger).

## Concurrency & R2 Mechanism
Requirement R2 mandates that stock must never be over-reserved. The implementation solves this using a two-layered approach:
1. **Database-level Optimistic Concurrency Control (OCC):** The `stock` table has a `version` column. When a reservation is placed, it reads the current `on_hand`, `reserved`, and `version`. The update statement `UPDATE stock SET reserved = reserved + ?, version = version + 1 WHERE item_code = ? AND location = ? AND version = ?` enforces that if another request modified the row in the meantime, the `UPDATE` returns 0 changes.
2. **In-memory Serialization:** To prevent immediate failing and give requests a fair chance without hammering the DB blindly, requests for the same `itemCode` and `location` are serialized locally in an in-memory promise queue (`key-queue.service.ts`). If OCC fails, it retries up to 3 times before failing the request.

## Multi-Instance Deployment (R9)
If two copies of this service were run at once behind a load balancer:
- **What breaks:** The in-memory promise queue (`key-queue.service.ts`) would only serialize requests within each individual instance. Two instances could try to process reservations for the exact same item at the same time.
- **Why it's still safe:** The optimistic concurrency control (`WHERE version = ?`) enforced by the SQLite database would catch the conflict. The second instance's update would fail, triggering a retry. Thus, the stock would never be over-reserved.
- **Caveat:** `better-sqlite3` is a single-file database. Running multiple application servers implies sharing the SQLite file over a network filesystem (which is notoriously unreliable for SQLite) or migrating to a dedicated database server like PostgreSQL. If migrated to Postgres, the application logic (the OCC `UPDATE`) remains completely valid and correct for a multi-node deployment.
- **Sweeper:** Both instances might run the expiry sweeper concurrently. This is safe (the database `UPDATE ... WHERE state = 'PENDING'` ensures only one succeeds), but redundant.

## What was left out
- **Advanced Pagination:** The history endpoint uses simple `limit`/`offset` pagination rather than keyset pagination. This is fine for a test assignment but might get slow for millions of rows.
- **Docker:** A `Dockerfile` was omitted since the constraints asked for something that runs on a clean machine with simple instructions.