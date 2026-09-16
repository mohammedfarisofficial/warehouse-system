// src/services/transaction.service.ts
// Single shared helper for writing transaction rows, so every call site
// (reserve, confirm, cancel, sweeper, manual stock adjustment) produces
// rows with the same shape and nobody forgets a column.
//
// IMPORTANT: this must always be called from *inside* the same
// db.transaction(...) as the stock/reservation write it's describing,
// so the transaction entry and the state change it records can never
// land on disk separately.

import { getDb } from '../database';
import type { TransactionWriteParams } from '../core/types/transaction.types.js';

let insertStmt: ReturnType<ReturnType<typeof getDb>['prepare']> | null = null;

function getInsertStmt(): ReturnType<ReturnType<typeof getDb>['prepare']> {
  if (!insertStmt) {
    insertStmt = getDb().prepare(`
      INSERT INTO transactions (
        ts, event_type, item_code, location, qty_delta,
        reservation_id, reason, resulting_on_hand, resulting_reserved
      ) VALUES (@ts, @eventType, @itemCode, @location, @qtyDelta,
        @reservationId, @reason, @resultingOnHand, @resultingReserved)
    `);
  }
  return insertStmt;
}

/**
 * Writes a single transaction entry. Must be called within an active transaction.
 */
export function writeTransactionEntry(params: TransactionWriteParams): void {
  getInsertStmt().run({
    ts: params.ts,
    eventType: params.eventType,
    itemCode: params.itemCode,
    location: params.location,
    qtyDelta: params.qtyDelta ?? null,
    reservationId: params.reservationId ?? null,
    reason: params.reason ?? null,
    resultingOnHand: params.resultingOnHand,
    resultingReserved: params.resultingReserved,
  });
}
