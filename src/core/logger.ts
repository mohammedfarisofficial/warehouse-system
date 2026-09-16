import pino from 'pino';
import { config } from '../config/index.js';

const rootLogger = pino({
  level: config.logLevel,
  transport: config.nodeEnv === 'development' ? { target: 'pino/file', options: { destination: 1 } } : undefined,
  formatters: { level(label) { return { level: label } } },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createLogger(module: string): pino.Logger {
  return rootLogger.child({ module });
}

export default rootLogger;