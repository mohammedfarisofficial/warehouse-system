import path from 'path';

type NodeEnv = 'development' | 'production' | 'test';

export interface Config {
  readonly port: number;
  readonly dbPath: string;
  readonly holdWindowMs: number;
  readonly sweepIntervalMs: number;
  readonly logLevel: string;
  readonly nodeEnv: NodeEnv;
}

function parseNodeEnv(raw: string | undefined): NodeEnv {
  const allowed: NodeEnv[] = ['development', 'production', 'test'];
  const value = (raw ?? 'development') as NodeEnv;
  if (!allowed.includes(value)) {
    throw new Error(`Invalid NODE_ENV "${raw}". Must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

function parseIntOrDefault(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}: "${raw}" — must be a positive integer`);
  }
  return parsed;
}

export const config: Config = Object.freeze({
  port: parseIntOrDefault(process.env.PORT, 3000, 'PORT'),
  dbPath: process.env.DB_PATH || path.join(process.cwd(), 'stock.db'),
  holdWindowMs: parseIntOrDefault(process.env.HOLD_WINDOW_MS, 60_000, 'HOLD_WINDOW_MS'),
  sweepIntervalMs: parseIntOrDefault(process.env.SWEEP_INTERVAL_MS, 1_000, 'SWEEP_INTERVAL_MS'),
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: parseNodeEnv(process.env.NODE_ENV),
});
