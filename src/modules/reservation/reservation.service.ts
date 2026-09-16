import { randomUUID } from 'crypto';
import type BetterSqlite3 from 'better-sqlite3';
import { getDb } from '../../database';
import { runSerialized } from '../../services/key-queue.service.js';
import { writeTransactionEntry } from '../../services/transaction.service.js';
import { EventType } from '../../core/types/transaction.types.js';
import { config } from '../../config/index.js';
import * as reservationRepo from './reservation.repository.js';
import type { StockRow } from '../../core/types/stock.types.js';
import {
  ReservationState,
  type PlaceReservationResult,
  type StateTransitionResult,
} from '../../core/types/reservation.types.js';
import type { ErrorResult } from '../../core/types/common.types.js';

const MAX_RETRIES = 3;

const placeTxn: BetterSqlite3.Transaction<
  (itemCode: string, location: string, qty: number, requestId: string) => PlaceReservationResult | ErrorResult
> = getDb().transaction(
  (
    itemCode: string,
    location: string,
    qty: number,
    requestId: string,
  ): PlaceReservationResult | ErrorResult => {
    const stock = getDb()
      .prepare(`SELECT on_hand, reserved, version FROM stock WHERE item_code = ? AND location = ?`)
      .get(itemCode, location) as StockRow | undefined;

    if (!stock) {
      return { error: 'NOT_FOUND', message: `No stock record for ${itemCode}@${location}` };
    }

    const available = stock.on_hand - stock.reserved;
    if (available < qty) {
      return {
        error: 'INSUFFICIENT_STOCK',
        message: `Only ${available} available for ${itemCode}@${location}`,
      };
    }

    const changes = reservationRepo.reserveStock(qty, itemCode, location, stock.version);
    if (changes === 0) {
      return { error: 'CONFLICT', message: 'Concurrent update detected, retry' };
    }

    const id = randomUUID();
    const now = Date.now();
    const expiresAt = now + config.holdWindowMs;

    reservationRepo.insertReservation(id, requestId, itemCode, location, qty, now, expiresAt);

    const updated = reservationRepo.getStockSnapshot(itemCode, location);

    writeTransactionEntry({
      ts: now,
      eventType: EventType.ReservationPlaced,
      itemCode,
      location,
      qtyDelta: qty,
      reservationId: id,
      reason: 'reservation placed',
      resultingOnHand: updated.on_hand,
      resultingReserved: updated.reserved,
    });

    return { ok: true, id, state: ReservationState.PENDING, expiresAt };
  },
);

export async function placeReservation(
  itemCode: string,
  location: string,
  qty: number,
  requestId: string,
): Promise<PlaceReservationResult | ErrorResult> {
  const existing = reservationRepo.findByRequestId(requestId);
  if (existing) {
    return {
      ok: true,
      id: existing.id,
      state: existing.state,
      expiresAt: existing.expires_at,
      replay: true,
    };
  }

  const key = `${itemCode}:${location}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const outcome = await runSerialized(key, () =>
      placeTxn(itemCode, location, qty, requestId),
    );
    if (!('error' in outcome) || outcome.error !== 'CONFLICT') return outcome;
  }

  return { error: 'CONFLICT', message: 'Too much contention, try again' };
}

const confirmTxn: BetterSqlite3.Transaction<
  (reservationId: string) => StateTransitionResult | ErrorResult
> = getDb().transaction(
  (reservationId: string): StateTransitionResult | ErrorResult => {
    const res = reservationRepo.findById(reservationId);
    if (!res) return { error: 'NOT_FOUND', message: 'No such reservation' };

    if (res.state === 'CONFIRMED') {
      return { ok: true, state: ReservationState.CONFIRMED, replay: true };
    }
    if (res.state !== 'PENDING') {
      return { error: 'INVALID_STATE', message: `Cannot confirm from state ${res.state}` };
    }

    const now = Date.now();
    const changes = reservationRepo.updateState(
      reservationId,
      'PENDING',
      'CONFIRMED',
      'confirmed_at',
      now,
    );

    if (changes === 0) {
      const fresh = reservationRepo.findById(reservationId);
      return {
        error: 'INVALID_STATE',
        message: `Already moved to ${fresh?.state ?? 'unknown'} (likely expired)`,
      };
    }

    reservationRepo.confirmStock(res.qty, res.item_code, res.location);

    const updated = reservationRepo.getStockSnapshot(res.item_code, res.location);

    writeTransactionEntry({
      ts: now,
      eventType: EventType.ReservationConfirmed,
      itemCode: res.item_code,
      location: res.location,
      qtyDelta: -res.qty,
      reservationId,
      reason: 'reservation confirmed',
      resultingOnHand: updated.on_hand,
      resultingReserved: updated.reserved,
    });

    return { ok: true, state: ReservationState.CONFIRMED };
  },
);

const cancelTxn: BetterSqlite3.Transaction<
  (reservationId: string) => StateTransitionResult | ErrorResult
> = getDb().transaction(
  (reservationId: string): StateTransitionResult | ErrorResult => {
    const res = reservationRepo.findById(reservationId);
    if (!res) return { error: 'NOT_FOUND', message: 'No such reservation' };

    if (res.state === 'CANCELLED') {
      return { ok: true, state: ReservationState.CANCELLED, replay: true };
    }
    if (res.state !== 'PENDING') {
      return { error: 'INVALID_STATE', message: `Cannot cancel from state ${res.state}` };
    }

    const now = Date.now();
    const changes = reservationRepo.updateState(
      reservationId,
      'PENDING',
      'CANCELLED',
      'cancelled_at',
      now,
    );

    if (changes === 0) {
      const fresh = reservationRepo.findById(reservationId);
      return {
        error: 'INVALID_STATE',
        message: `Already moved to ${fresh?.state ?? 'unknown'} (likely expired)`,
      };
    }

    reservationRepo.releaseReservedStock(res.qty, res.item_code, res.location);

    const updated = reservationRepo.getStockSnapshot(res.item_code, res.location);

    writeTransactionEntry({
      ts: now,
      eventType: EventType.ReservationCancelled,
      itemCode: res.item_code,
      location: res.location,
      qtyDelta: res.qty,
      reservationId,
      reason: 'reservation cancelled',
      resultingOnHand: updated.on_hand,
      resultingReserved: updated.reserved,
    });

    return { ok: true, state: ReservationState.CANCELLED };
  },
);

export async function confirmReservation(
  reservationId: string,
  itemCode: string,
  location: string,
): Promise<StateTransitionResult | ErrorResult> {
  const key = `${itemCode}:${location}`;
  return runSerialized(key, () => confirmTxn(reservationId));
}

export async function cancelReservation(
  reservationId: string,
  itemCode: string,
  location: string,
): Promise<StateTransitionResult | ErrorResult> {
  const key = `${itemCode}:${location}`;
  return runSerialized(key, () => cancelTxn(reservationId));
}

export { confirmTxn, cancelTxn };
