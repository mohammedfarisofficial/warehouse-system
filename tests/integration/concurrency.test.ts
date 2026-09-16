import { cleanupItem, insertTestStock, getTestStock } from '../setup.js';
import { placeReservation } from '../../src/modules/reservation/reservation.service.js';

async function main(): Promise<void> {
  cleanupItem('WID-100');
  insertTestStock('WID-100', 'MAIN', 5);

  const attempts = Array.from({ length: 50 }, (_, i) =>
    placeReservation('WID-100', 'MAIN', 1, `concurrency-test-req-${i}`),
  );

  const results = await Promise.all(attempts);
  const succeeded = results.filter((r) => 'ok' in r && r.ok).length;
  const rejected = results.filter((r) => 'error' in r && r.error === 'INSUFFICIENT_STOCK').length;
  const other = results.filter((r) => 'error' in r && r.error !== 'INSUFFICIENT_STOCK');

  console.log({ succeeded, rejected, otherErrors: other });

  if (succeeded !== 5) {
    throw new Error(`Expected exactly 5 to succeed, got ${succeeded}`);
  }
  if (other.length > 0) {
    throw new Error(`Expected only INSUFFICIENT_STOCK rejections, got: ${JSON.stringify(other)}`);
  }

  const finalStock = getTestStock('WID-100', 'MAIN');
  if (finalStock.reserved !== 5) {
    throw new Error(`Expected reserved=5, got ${finalStock.reserved}`);
  }

  console.log('PASS: no over-reservation under concurrency (R2)');
}

main().catch((e: Error) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
