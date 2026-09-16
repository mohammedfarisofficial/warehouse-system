import { ErrorCode, HTTP_STATUS_MAP } from './error-codes.js';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(code: ErrorCode, message: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = HTTP_STATUS_MAP[code];
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): { error: string; message: string } {
    return { error: this.code, message: this.message };
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(ErrorCode.NOT_FOUND, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(ErrorCode.BAD_REQUEST, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict detected') {
    super(ErrorCode.CONFLICT, message);
  }
}

export class InsufficientStockError extends AppError {
  constructor(message = 'Insufficient stock') {
    super(ErrorCode.INSUFFICIENT_STOCK, message);
  }
}

export class InvalidStateError extends AppError {
  constructor(message = 'Invalid state transition') {
    super(ErrorCode.INVALID_STATE, message);
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
