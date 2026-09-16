import { getDb } from '../';
import { createLogger } from '../../core/logger.js';

const logger = createLogger('seed');

const ITEMS = ['WID-100', 'WID-200', 'WID-300'];
const LOCATIONS = ['MAIN', 'EAST'];
const TARGET_TRANSACTION_ROWS = 20_000;

function reset(): void {
  const db = getDb();
  db.exec(`DELETE FROM transactions; DELETE FROM reservations; DELETE FROM stock;`);
  logger.info('Database reset');
}

function seedStock(): void {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO stock (item_code, location, on_hand, reserved, version) VALUES (?, ?, ?, 0, 0)`,
  );

  const txn = db.transaction(() => {
    for (const item of ITEMS) {
      for (const loc of LOCATIONS) {
        insert.run(item, loc, 1000);
      }
    }
  });

  txn();
  logger.info({ items: ITEMS.length, locations: LOCATIONS.length }, 'Stock seeded');
}

interface TransactionSeedRow {
  ts: number;
  eventType: string;
  itemCode: string;
  location: string;
  qtyDelta: number;
  reservationId: string;
  reason: string;
  resultingOnHand: number;
  resultingReserved: number;
}

function seedTransactions(): void {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO transactions (ts, event_type, item_code, location, qty_delta, reservation_id, reason, resulting_on_hand, resulting_reserved)
    VALUES (@ts, @eventType, @itemCode, @location, @qtyDelta, @reservationId, @reason, @resultingOnHand, @resultingReserved)
  `);

  const eventTypes = [
    'ReservationPlaced',
    'ReservationConfirmed',
    'ReservationCancelled',
    'ReservationExpired',
  ];
  const startTs = Date.now() - TARGET_TRANSACTION_ROWS * 1000;

  const txn = db.transaction((rows: TransactionSeedRow[]) => {
    for (const row of rows) insert.run(row);
  });

  const batch: TransactionSeedRow[] = [];
  let onHand = 1000;
  let reserved = 0;

  for (let i = 0; i < TARGET_TRANSACTION_ROWS; i++) {
    const item = ITEMS[i % ITEMS.length];
    const location = LOCATIONS[i % LOCATIONS.length];
    const eventType = eventTypes[i % eventTypes.length];
    const qty = 1 + (i % 5);

    if (eventType === 'ReservationPlaced') reserved += qty;
    else reserved = Math.max(0, reserved - qty);

    batch.push({
      ts: startTs + i * 1000,
      eventType,
      itemCode: item,
      location,
      qtyDelta: eventType === 'ReservationPlaced' ? qty : -qty,
      reservationId: `seed-${i}`,
      reason: 'seeded synthetic event',
      resultingOnHand: onHand,
      resultingReserved: reserved,
    });

    if (batch.length === 1000) {
      txn(batch);
      batch.length = 0;
    }
  }
  if (batch.length) txn(batch);

  const count = db.prepare(`SELECT COUNT(*) AS n FROM transactions`).get() as { n: number };
  logger.info({ transactionRows: count.n }, 'Transactions seeded');
}

function main(): void {
  reset();
  seedStock();
  seedTransactions();

  const stockCount = ITEMS.length * LOCATIONS.length;
  const transactionCount = (
    getDb().prepare(`SELECT COUNT(*) AS n FROM transactions`).get() as { n: number }
  ).n;

  logger.info(
    { stockRows: stockCount, transactionRows: transactionCount },
    `Seeded ${stockCount} stock rows and ${transactionCount} transaction rows`,
  );
}

main();
