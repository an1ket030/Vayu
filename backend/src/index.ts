import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimit.middleware';

// Routes
import aqiRoutes from './routes/aqi.routes';
import routeRoutes from './routes/route.routes';
import exposureRoutes from './routes/exposure.routes';
import forecastRoutes from './routes/forecast.routes';
import authRoutes from './routes/auth.routes';

// Background jobs — importing these files instantiates the BullMQ Workers
import { aqiPollQueue } from './jobs/aqiPoller.job';
import { forecastUpdateQueue } from './jobs/forecastUpdater.job';

const app = express();
const httpServer = createServer(app);
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4000',
  'https://vayuair.web.app',
  'https://vayuair.firebaseapp.com',
];

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route registration
app.use('/api/aqi', aqiRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/exposure', exposureRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/auth', authRoutes);

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error Handling
app.use(errorHandler);

const PORT = env.PORT;

httpServer.listen(PORT, async () => {
  console.log(`🚀 CleanAir Backend running on port ${PORT} in ${env.NODE_ENV} mode`);

  // Schedule recurring jobs with stable jobIds to prevent duplicates on restart.
  // BullMQ upserts jobs if the same jobId already exists in the queue.
  try {
    await aqiPollQueue.add(
      'poll-aqi',
      {},
      {
        jobId: 'recurring-aqi-poll',
        repeat: { pattern: '*/15 * * * *' },
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 5 },
      }
    );
    console.log('✅ AQI Poller job scheduled (every 15 min)');
  } catch (err) {
    console.warn('⚠️  AQI Poller job scheduling failed (Redis may be unavailable):', err);
  }

  try {
    await forecastUpdateQueue.add(
      'update-forecast',
      {},
      {
        jobId: 'recurring-forecast-update',
        repeat: { pattern: '0 */6 * * *' },
        removeOnComplete: { count: 5 },
        removeOnFail: { count: 3 },
      }
    );
    console.log('✅ Forecast Updater job scheduled (every 6h)');
  } catch (err) {
    console.warn('⚠️  Forecast Updater job scheduling failed (Redis may be unavailable):', err);
  }
});

export { io };
