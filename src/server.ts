import app from './app.js';
import { config } from './config/index.js';
import { getDb, closeDb } from './database';
import { createLogger } from './core/logger.js';
import { startSweeper, stopSweeper } from './services/sweeper.service.js';

const logger = createLogger('server');

function bootstrap(): void {
  getDb();
  startSweeper();

  const server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.nodeEnv },
      `stock-reservation-service listening on port ${config.port}`,
    );
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Shutdown signal received — draining connections');

    stopSweeper();

    server.close(() => {
      logger.info('HTTP server closed');
      closeDb();
      logger.info('Shutdown complete');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
