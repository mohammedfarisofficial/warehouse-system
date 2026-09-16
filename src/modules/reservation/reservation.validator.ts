import type { ValidationSchema } from '../../middleware/validate.js';

export const placeReservationSchema: ValidationSchema = {
  target: 'body',
  rules: [
    { field: 'itemCode', required: true, type: 'string' },
    { field: 'location', required: true, type: 'string' },
    {
      field: 'qty',
      required: true,
      type: 'number',
      custom: (v) => (typeof v === 'number' && v > 0 ? null : 'qty must be a positive number'),
    },
    { field: 'requestId', required: true, type: 'string' },
  ],
};
