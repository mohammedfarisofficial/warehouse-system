import type { Request, Response, NextFunction } from 'express';
import { getTransactions, getPositionAt } from './transaction.service.js';

export function handleGetTransactions(req: Request, res: Response, next: NextFunction): void {
  try {
    const location = req.query.location as string | undefined;
    const cursor = req.query.cursor as string | undefined;
    const itemCode = req.params.itemCode as string;
    res.json(getTransactions(itemCode, { location, cursor }));
  } catch (err) {
    next(err);
  }
}

export function handleGetPositionAt(req: Request, res: Response, next: NextFunction): void {
  try {
    const location = req.query.location as string | undefined;
    const ts = req.query.ts as string | undefined;
    const itemCode = req.params.itemCode as string;

    if (!location || !ts) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'location and ts query params required',
      });
      return;
    }

    const position = getPositionAt(itemCode, location, Number(ts));
    if (!position) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No transaction entries at or before that time',
      });
      return;
    }

    res.json(position);
  } catch (err) {
    next(err);
  }
}
