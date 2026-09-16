import { cleanupItem, insertTestStock, getTestStock } from '../setup.js';
import { placeReservation, confirmTxn } from '../../src/modules/reservation/reservation.service.js';

async function main(): Promise<void> {
  cleanupItem('WID-IDEMP');
  insertTestStock('WID-IDEMP', 'MAIN', 10);

  const first = await placeReservation('WID-IDEMP', 'MAIN', 3, 'idempotency-test-req-1');
  const second = await placeReservation('WID-IDEMP', 'MAIN', 3, 'idempotency-test-req-1');

  if (!('ok' in first) || !('ok' in second)) {
    throw new Error('Expected both calls to succeed');
  }

  if (first.id !== second.id) {
    throw new Error('Expected retried request to return the same reservation id');
  }
  if (!second.replay) {
    throw new Error('Expected second call to be flagged as a replay');
  }

  const stockAfterPlace = getTestStock('WID-IDEMP', 'MAIN');
  if (stockAfterPlace.reserved !== 3) {
    throw new Error(`Expected reserved=3 (not double-reserved), got ${stockAfterPlace.reserved}`);
  }

  const confirmOnce = confirmTxn(first.id);
  const confirmTwice = confirmTxn(first.id);

  if (!('ok' in confirmOnce) || confirmOnce.state !== 'CONFIRMED') {
    throw new Error('Expected first confirm to succeed');
  }
  if (!('ok' in confirmTwice) || !confirmTwice.replay) {
    throw new Error(
      'Expected second confirm of an already-confirmed reservation to be an idempotent no-op success',
    );
  }

  console.log('PASS: duplicate requestId and duplicate confirm are both idempotent (R4)');
}

main().catch((e: Error) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
