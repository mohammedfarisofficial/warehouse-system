// src/middleware/error-handler.ts
// Global Express error handler. Catches AppError subclasses and unhandled
// errors, returning a consistent JSON shape. Internal details are hidden
// in production.

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors/app-error.js';
import { createLogger } from '../core/logger.js';
import { config } from '../config/index.js';

const logger = createLogger('error-handler');

/**
 * Global error handling middleware — must be registered last (after all routes).
 * Express recognizes this as an error handler because it has 4 parameters.
 */
export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    // Operational errors — expected business failures.
    logger.warn(
      { code: err.code, message: err.message, requestId: req.requestId },
      'Operational error',
    );

    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Unexpected / programming errors.
  logger.error(
    { err, requestId: req.requestId },
    'Unhandled error',
  );

  res.status(500).json({
    error: 'INTERNAL',
    message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
}
