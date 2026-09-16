import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import { createLogger } from '../core/logger.js';
import type { Database as DatabaseType } from 'better-sqlite3';

const logger = createLogger('database');

let db: DatabaseType | null = null;

export function getDb(): DatabaseType {
    if (db) return db;

    db = new Database(config.dbPath);

    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    runMigrations(db);

    logger.info({ dbPath: config.dbPath }, 'Database connection established');
    return db;
}

export function closeDb(): void {
    if (db) {
        db.close();
        db = null;
        logger.info('Database connection closed');
    }
}

function runMigrations(database: DatabaseType): void {
    const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

    if (!fs.existsSync(MIGRATIONS_DIR)) {
        logger.warn('No migrations directory found — skipping');
        return;
    }

    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
        database.exec(sql);
        logger.debug({ migration: file }, 'Migration applied');
    }
}
