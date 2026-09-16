// src/middleware/validate.ts
// Generic validation middleware factory. Each module defines its own
// validation schema; this middleware applies it and returns a 400 error
// with a descriptive message on failure.

import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../core/errors/app-error.js';

type ValidationTarget = 'body' | 'query' | 'params';

interface FieldRule {
  /** The field name on the request object. */
  field: string;
  /** The expected type (typeof check). */
  type?: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Custom validator. Return an error message string on failure, or null on success. */
  custom?: (value: unknown) => string | null;
}

export interface ValidationSchema {
  target: ValidationTarget;
  rules: FieldRule[];
}

/**
 * Returns Express middleware that validates the request against the given schema.
 * Throws a `ValidationError` (caught by the global error handler) on failure.
 */
export function validate(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const source = req[schema.target] as Record<string, unknown>;
    const errors: string[] = [];

    for (const rule of schema.rules) {
      const value = source?.[rule.field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rule.type && typeof value !== rule.type) {
          errors.push(`${rule.field} must be of type ${rule.type}`);
        }

        if (rule.custom) {
          const customError = rule.custom(value);
          if (customError) {
            errors.push(customError);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }

    next();
  };
}
