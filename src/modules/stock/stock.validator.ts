import type { ValidationSchema } from '../../middleware/validate.js';

export const adjustStockSchema: ValidationSchema = {
  target: 'body',
  rules: [
    { field: 'itemCode', required: true, type: 'string' },
    { field: 'location', required: true, type: 'string' },
    { field: 'delta', required: true, type: 'number' },
  ],
};