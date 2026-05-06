import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import { logger } from '../utils/logger';
import axios from 'axios';

const FORECAST_UPDATE_QUEUE = 'forecast-update-queue';

export const forecastUpdateQueue = new Queue(FORECAST_UPDATE_QUEUE, {
  connection: redisConnection,
});

const worker = new Worker(
  FORECAST_UPDATE_QUEUE,
  async (job) => {
    logger.info('Running Forecast Updater job...');
    
    // Trigger ML training or update
    await axios.post('http://ml-service:8000/train');
    
    logger.info('Forecast Updater job completed.');
  },
  { connection: redisConnection }
);

worker.on('failed', (job, err) => {
  logger.error(`Forecast Updater job ${job?.id} failed: ${err.message}`);
});
