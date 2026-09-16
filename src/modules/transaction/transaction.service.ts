import * as transactionRepo from './transaction.repository.js';
import type { TransactionRow, PositionAtResult } from '../../core/types/transaction.types.js';
import type { PaginatedResult } from '../../core/types/common.types.js';
import type { EventType } from '../../core/types/transaction.types.js';

export function getTransactions(
  itemCode: string,
  options: { location?: string; cursor?: string } = {},
): PaginatedResult<TransactionRow> {
  const { rows, hasMore } = transactionRepo.findTransactionEntries(itemCode, options);

  return {
    items: rows,
    nextCursor: hasMore ? rows[rows.length - 1].seq : null,
  };
}

export function getPositionAt(
  itemCode: string,
  location: string,
  ts: number,
): PositionAtResult | null {
  const row = transactionRepo.findPositionAt(itemCode, location, ts);

  if (!row) return null;

  return {
    item_code: itemCode,
    location,
    as_of: ts,
    on_hand: row.on_hand,
    reserved: row.reserved,
    available: row.on_hand - row.reserved,
    last_event_type: row.event_type as EventType,
    last_event_ts: row.ts,
  };
}
