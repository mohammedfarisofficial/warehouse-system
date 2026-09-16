import { getDb } from '../database';
import { config } from '../config/index.js';
import { createLogger } from '../core/logger.js';
import { writeTransactionEntry } from './transaction.service';
import { EventType } from '../core/types/transaction.types.js';

const logger = createLogger('sweeper');

let intervalHandle: ReturnType<typeof setInterval> | null = null;

interface ExpiredReservation {
  id: string;
  item_code: string;
  location: string;
  qty: number;
}

interface StockSnapshot {
  on_hand: number;
  reserved: number;
}
export function sweep(): number {
  const db = getDb();

  const sweepTxn = db.transaction(() => {
    const now = Date.now();

    const expired = db
      .prepare(
        `SELECT id, item_code, location, qty
         FROM reservations
         WHERE state = 'PENDING' AND expires_at <= ?`,
      )
      .all(now) as ExpiredReservation[];

    let processed = 0;

    for (const r of expired) {
      const result = db
        .prepare(`UPDATE reservations SET state = 'EXPIRED' WHERE id = ? AND state = 'PENDING'`)
        .run(r.id);

      if (result.changes === 0) continue;

      db.prepare(
        `UPDATE stock SET reserved = reserved - ?, version = version + 1
         WHERE item_code = ? AND location = ?`,
      ).run(r.qty, r.item_code, r.location);

      const updated = db
        .prepare(`SELECT on_hand, reserved FROM stock WHERE item_code = ? AND location = ?`)
        .get(r.item_code, r.location) as StockSnapshot;

      writeTransactionEntry({
        ts: now,
        eventType: EventType.ReservationExpired,
        itemCode: r.item_code,
        location: r.location,
        qtyDelta: -r.qty,
        reservationId: r.id,
        reason: 'hold window elapsed',
        resultingOnHand: updated.on_hand,
        resultingReserved: updated.reserved,
      });

      processed++;
    }

    return processed;
  });

  const count = sweepTxn();

  if (count > 0) {
    logger.info({ expired: count }, 'Sweep completed');
  }

  return count;
}

export function startSweeper(): void {
  logger.info(
    { intervalMs: config.sweepIntervalMs },
    'Starting expiry sweeper',
  );
  sweep();
  intervalHandle = setInterval(sweep, config.sweepIntervalMs);
}

export function stopSweeper(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info('Sweeper stopped');
  }
}
