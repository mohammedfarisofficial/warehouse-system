// src/middleware/request-id.ts
// Attaches a unique request ID to every incoming request for traceability.
// If the client sends an `x-request-id` header, it's preserved; otherwise
// a new UUID is generated.

import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request to carry requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
