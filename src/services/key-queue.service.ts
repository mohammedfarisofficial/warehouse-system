import { createLogger } from '../core/logger.js';

const logger = createLogger('key-queue');
const queues = new Map<string, Promise<unknown>>();

export function runSerialized<T>(key: string, fn: () => T): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();

  const runNext = (): Promise<T> => Promise.resolve().then(fn);
  const current = previous.then(runNext, runNext);

  queues.set(key, current);

  void current.finally(() => {
    if (queues.get(key) === current) {
      queues.delete(key);
      logger.trace({ key }, 'Queue drained');
    }
  });

  return current;
}

export function getQueueSize(): number {
  return queues.size;
}
