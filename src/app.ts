import express from 'express';
import { config } from './config/index.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandlerMiddleware } from './middleware/error-handler.js';
import { requestLoggerMiddleware } from './middleware/request-logger.js';

const app = express();

app.use(express.json());
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    holdWindowMs: config.holdWindowMs,
    environment: config.nodeEnv,
    uptime: process.uptime(),
  });
});

app.use(errorHandlerMiddleware);

export default app;
