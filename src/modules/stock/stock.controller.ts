import type { Request, Response, NextFunction } from 'express';
import { adjustStock, getStock } from './stock.service.js';

interface AdjustStockBody {
  itemCode: string;
  location: string;
  delta: number;
  reason?: string;
}

const STATUS_MAP: Record<string, number> = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
};

export function handleAdjustStock(req: Request, res: Response, next: NextFunction): void {
  try {
    const { itemCode, location, delta, reason } = req.body as AdjustStockBody;
    const outcome = adjustStock(itemCode, location, delta, reason);

    if ('error' in outcome) {
      const status = STATUS_MAP[outcome.error] ?? 500;
      res.status(status).json(outcome);
      return;
    }

    res.status(201).json(outcome);
  } catch (err) {
    next(err);
  }
}

export function handleGetStock(req: Request, res: Response, next: NextFunction): void {
  try {
    const itemCode = req.params.itemCode as string;
    res.json(getStock(itemCode));
  } catch (err) {
    next(err);
  }
}
