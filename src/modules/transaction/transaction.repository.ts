import { getDb } from '../../database';
import type { TransactionRow } from '../../core/types/transaction.types.js';

const PAGE_SIZE = 100;

interface TransactionQuery {
  location?: string;
  cursor?: string;
}

interface TransactionQueryResult {
  rows: TransactionRow[];
  hasMore: boolean;
}

export function findTransactionEntries(
  itemCode: string,
  query: TransactionQuery,
): TransactionQueryResult {
  const params: (string | number)[] = [itemCode];
  let sql = `SELECT * FROM transactions WHERE item_code = ?`;

  if (query.location) {
    sql += ` AND location = ?`;
    params.push(query.location);
  }
  if (query.cursor) {
    sql += ` AND seq > ?`;
    params.push(Number(query.cursor));
  }

  sql += ` ORDER BY seq ASC LIMIT ?`;
  params.push(PAGE_SIZE + 1);

  const rows = getDb().prepare(sql).all(...params) as TransactionRow[];
  const hasMore = rows.length > PAGE_SIZE;

  return {
    rows: hasMore ? rows.slice(0, PAGE_SIZE) : rows,
    hasMore,
  };
}

interface PositionRow {
  on_hand: number;
  reserved: number;
  ts: number;
  event_type: string;
}

export function findPositionAt(
  itemCode: string,
  location: string,
  ts: number,
): PositionRow | undefined {
  return getDb()
    .prepare(
      `SELECT resulting_on_hand AS on_hand, resulting_reserved AS reserved, ts, event_type
       FROM transactions
       WHERE item_code = ? AND location = ? AND ts <= ?
       ORDER BY seq DESC
       LIMIT 1`,
    )
    .get(itemCode, location, ts) as PositionRow | undefined;
}
