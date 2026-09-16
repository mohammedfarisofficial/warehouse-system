import { Router } from 'express';
import {
  handlePlaceReservation,
  handleGetReservation,
  handleConfirmReservation,
  handleCancelReservation,
} from './reservation.controller.js';
import { validate } from '../../middleware/validate.js';
import { placeReservationSchema } from './reservation.validator.js';

const router = Router();

router.post('/', validate(placeReservationSchema), handlePlaceReservation);
router.get('/:id', handleGetReservation);
router.post('/:id/confirm', handleConfirmReservation);
router.post('/:id/cancel', handleCancelReservation);

export default router;
