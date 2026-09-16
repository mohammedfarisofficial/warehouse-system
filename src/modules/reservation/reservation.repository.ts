import { getDb } from '../../database';
import type { ReservationRow } from '../../core/types/reservation.types.js';

export function findById(id: string): ReservationRow | undefined {
  return getDb()
    .prepare(`SELECT * FROM reservations WHERE id = ?`)
    .get(id) as ReservationRow | undefined;
}

export function findByRequestId(requestId: string): ReservationRow | undefined {
  return getDb()
    .prepare(`SELECT * FROM reservations WHERE request_id = ?`)
    .get(requestId) as ReservationRow | undefined;
}

export function insertReservation(
  id: string,
  requestId: string,
  itemCode: string,
  location: string,
  qty: number,
  createdAt: number,
  expiresAt: number,
): void {
  getDb()
    .prepare(
      `INSERT INTO reservations (id, request_id, item_code, location, qty, state, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
    )
    .run(id, requestId, itemCode, location, qty, createdAt, expiresAt);
}

export function updateState(
  id: string,
  fromState: string,
  toState: string,
  timestampField: 'confirmed_at' | 'cancelled_at',
  timestamp: number,
): number {
  const result = getDb()
    .prepare(
      `UPDATE reservations SET state = ?, ${timestampField} = ? WHERE id = ? AND state = ?`,
    )
    .run(toState, timestamp, id, fromState);
  return result.changes;
}

export function reserveStock(
  qty: number,
  itemCode: string,
  location: string,
  version: number,
): number {
  const result = getDb()
    .prepare(
      `UPDATE stock
       SET reserved = reserved + ?, version = version + 1
       WHERE item_code = ? AND location = ?
         AND version = ?
         AND (on_hand - reserved) >= ?`,
    )
    .run(qty, itemCode, location, version, qty);
  return result.changes;
}

export function releaseReservedStock(
  qty: number,
  itemCode: string,
  location: string,
): void {
  getDb()
    .prepare(
      `UPDATE stock SET reserved = reserved - ?, version = version + 1
       WHERE item_code = ? AND location = ?`,
    )
    .run(qty, itemCode, location);
}

export function confirmStock(
  qty: number,
  itemCode: string,
  location: string,
): void {
  getDb()
    .prepare(
      `UPDATE stock SET on_hand = on_hand - ?, reserved = reserved - ?, version = version + 1
       WHERE item_code = ? AND location = ?`,
    )
    .run(qty, qty, itemCode, location);
}

export interface StockSnapshot {
  on_hand: number;
  reserved: number;
}

export function getStockSnapshot(itemCode: string, location: string): StockSnapshot {
  return getDb()
    .prepare(`SELECT on_hand, reserved FROM stock WHERE item_code = ? AND location = ?`)
    .get(itemCode, location) as StockSnapshot;
}
