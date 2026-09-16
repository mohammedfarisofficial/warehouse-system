import { getDb } from '../../src/database';
import { cleanupItem, insertTestStock, getTestStock } from '../setup.js';
import { sweep } from '../../src/services/sweeper.service.js';

async function main(): Promise<void> {
  cleanupItem('WID-EXP');
  insertTestStock('WID-EXP', 'MAIN', 10, 4);

  const db = getDb();
  const past = Date.now() - 5000;
  db.prepare(
    `INSERT INTO reservations (id, request_id, item_code, location, qty, state, created_at, expires_at)
     VALUES ('res-expiry-test', 'expiry-test-req-1', 'WID-EXP', 'MAIN', 4, 'PENDING', ?, ?)`,
  ).run(past - 60000, past);

  const processed = sweep();
  if (processed < 1) {
    throw new Error('Expected sweeper to process at least one expired reservation');
  }

  const row = db.prepare(`SELECT state FROM reservations WHERE id = 'res-expiry-test'`).get() as {
    state: string;
  };
  if (row.state !== 'EXPIRED') {
    throw new Error(`Expected state EXPIRED, got ${row.state}`);
  }

  const stock = getTestStock('WID-EXP', 'MAIN');
  if (stock.reserved !== 0) {
    throw new Error(`Expected reserved to be released back to 0, got ${stock.reserved}`);
  }

  const processedAgain = sweep();
  if (processedAgain !== 0) {
    throw new Error(`Expected second sweep to process 0 rows, got ${processedAgain}`);
  }

  console.log('PASS: expired reservation swept and stock released exactly once (R3, R6)');
}

main().catch((e: Error) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
