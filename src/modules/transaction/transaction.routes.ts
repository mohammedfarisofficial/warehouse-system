import { Router } from 'express';
import { handleGetTransactions, handleGetPositionAt } from './transaction.controller.js';

const router = Router();

router.get('/:itemCode', handleGetTransactions);
router.get('/:itemCode/at', handleGetPositionAt);

export default router;
