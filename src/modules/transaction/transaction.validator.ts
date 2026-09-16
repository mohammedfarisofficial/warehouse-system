import type { ValidationSchema } from '../../middleware/validate.js';

export const positionAtSchema: ValidationSchema = {
  target: 'query',
  rules: [
    { field: 'location', required: true, type: 'string' },
    { field: 'ts', required: true },
  ],
};
