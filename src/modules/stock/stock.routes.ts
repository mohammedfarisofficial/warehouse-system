import { Router } from 'express';
import { handleAdjustStock, handleGetStock } from './stock.controller.js';
import { validate } from '../../middleware/validate.js';
import { adjustStockSchema } from './stock.validator.js';

const router = Router();

router.post('/', validate(adjustStockSchema), handleAdjustStock);
router.get('/:itemCode', handleGetStock);

export default router;