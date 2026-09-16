// src/middleware/request-logger.ts
// Logs every HTTP request with method, URL, status code, and response
// time in milliseconds.

import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '../core/logger.js';

const logger = createLogger('http');

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        requestId: req.requestId,
      },
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
    );
  });

  next();
}
