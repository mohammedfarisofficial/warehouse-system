import { getDb } from '../../database';
import type BetterSqlite3 from 'better-sqlite3';
import * as stockRepo from './stock.repository.js';
import { EventType } from '../../core/types/transaction.types.js';
import type { ErrorResult } from '../../core/types/common.types.js';
import { writeTransactionEntry } from '../../services/transaction.service.js';
import type { StockView, StockAdjustmentResult } from '../../core/types/stock.types.js';

export const adjustStock: BetterSqlite3.Transaction<
  (itemCode: string, location: string, delta: number, reason?: string) => StockAdjustmentResult | ErrorResult
> = getDb().transaction(
  (
    itemCode: string,
    location: string,
    delta: number,
    reason?: string,
  ): StockAdjustmentResult | ErrorResult => {
    const existing = stockRepo.findByItemAndLocation(itemCode, location);
    const now = Date.now();

    if (!existing) {
      if (delta < 0) {
        return { error: 'BAD_REQUEST', message: 'Cannot create a stock row with a negative initial quantity' };
      }

      stockRepo.insertStock(itemCode, location, delta);

      writeTransactionEntry({
        ts: now,
        eventType: EventType.StockAdjusted,
        itemCode,
        location,
        qtyDelta: delta,
        reason: reason || 'initial stock',
        resultingOnHand: delta,
        resultingReserved: 0,
      });

      return { ok: true, item_code: itemCode, location, on_hand: delta, reserved: 0 };
    }

    const newOnHand = existing.on_hand + delta;
    if (newOnHand < existing.reserved) {
      return {
        error: 'BAD_REQUEST',
        message: `Adjustment would drop on_hand (${newOnHand}) below reserved (${existing.reserved})`,
      };
    }

    stockRepo.updateOnHand(itemCode, location, newOnHand);

    writeTransactionEntry({
      ts: now,
      eventType: EventType.StockAdjusted,
      itemCode,
      location,
      qtyDelta: delta,
      reason: reason || 'manual adjustment',
      resultingOnHand: newOnHand,
      resultingReserved: existing.reserved,
    });

    return {
      ok: true,
      item_code: itemCode,
      location,
      on_hand: newOnHand,
      reserved: existing.reserved,
    };
  },
);

export function getStock(itemCode: string): StockView[] {
  const rows = stockRepo.findAllByItem(itemCode);
  return rows.map((s) => ({ ...s, available: s.on_hand - s.reserved }));
}
