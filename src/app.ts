import express from 'express';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandlerMiddleware } from './middleware/error-handler.js';
import { requestLoggerMiddleware } from './middleware/request-logger.js';

import stockRoutes from './modules/stock/stock.routes.js';
import reservationRoutes from './modules/reservation/reservation.routes.js';

const app = express();

// Global Middlewares
app.use(express.json());
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

// Routes
app.use('/stock', stockRoutes);
app.use('/reservations', reservationRoutes);

app.get('/health', (_req, res) => { res.json({ ok: true }) });

app.use(errorHandlerMiddleware);

export default app;
