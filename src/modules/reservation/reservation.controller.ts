import type { Request, Response, NextFunction } from 'express';
import {
  placeReservation,
  confirmReservation,
  cancelReservation,
} from './reservation.service.js';
import * as reservationRepo from './reservation.repository.js';

const STATUS_MAP: Record<string, number> = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INSUFFICIENT_STOCK: 409,
  CONFLICT: 409,
  INVALID_STATE: 409,
};

function respondWithOutcome(
  res: Response,
  outcome: Record<string, unknown>,
  okStatus = 200,
): void {
  if ('error' in outcome && typeof outcome.error === 'string') {
    res.status(STATUS_MAP[outcome.error] ?? 500).json(outcome);
    return;
  }
  res.status(okStatus).json(outcome);
}

interface PlaceReservationBody {
  itemCode: string;
  location: string;
  qty: number;
  requestId: string;
}

export async function handlePlaceReservation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { itemCode, location, qty, requestId } = req.body as PlaceReservationBody;
    const outcome = await placeReservation(itemCode, location, qty, requestId);
    respondWithOutcome(res, outcome as unknown as Record<string, unknown>, 201);
  } catch (err) {
    next(err);
  }
}

export function handleGetReservation(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = req.params.id as string;
    const row = reservationRepo.findById(id);
    if (!row) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'No such reservation' });
      return;
    }
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function handleConfirmReservation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const row = reservationRepo.findById(id);
    if (!row) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'No such reservation' });
      return;
    }
    const outcome = await confirmReservation(id, row.item_code, row.location);
    respondWithOutcome(res, outcome as unknown as Record<string, unknown>);
  } catch (err) {
    next(err);
  }
}

export async function handleCancelReservation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const row = reservationRepo.findById(id);
    if (!row) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'No such reservation' });
      return;
    }
    const outcome = await cancelReservation(id, row.item_code, row.location);
    respondWithOutcome(res, outcome as unknown as Record<string, unknown>);
  } catch (err) {
    next(err);
  }
}
