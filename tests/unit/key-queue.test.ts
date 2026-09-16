import { runSerialized, getQueueSize } from '../../src/services/key-queue.service.js';

async function main(): Promise<void> {
  const order: number[] = [];

  const task1 = runSerialized('key-a', async () => {
    await delay(50);
    order.push(1);
    return 'first';
  });

  const task2 = runSerialized('key-a', async () => {
    order.push(2);
    return 'second';
  });

  const [result1, result2] = await Promise.all([task1, task2]);

  assert(result1 === 'first', `Expected 'first', got '${result1}'`);
  assert(result2 === 'second', `Expected 'second', got '${result2}'`);
  assert(order[0] === 1 && order[1] === 2, `Expected [1, 2], got [${order}]`);

  const concurrent: number[] = [];

  const taskA = runSerialized('key-x', async () => {
    concurrent.push(1);
    await delay(50);
    concurrent.push(3);
  });

  const taskB = runSerialized('key-y', async () => {
    concurrent.push(2);
    await delay(10);
    concurrent.push(4);
  });

  await Promise.all([taskA, taskB]);

  assert(
    concurrent[0] === 1 && concurrent[1] === 2,
    `Expected concurrent start, got [${concurrent}]`,
  );

  await delay(10);
  assert(getQueueSize() === 0, `Expected queue size 0, got ${getQueueSize()}`);

  console.log('PASS: key-queue serialization, concurrency, and cleanup');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

main().catch((e: Error) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
