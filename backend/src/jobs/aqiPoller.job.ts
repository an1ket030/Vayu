import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import { waqiService } from '../services/waqi.service';
import { websocketService } from '../services/websocket.service';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const AQI_POLL_QUEUE = 'aqi-poll-queue';

export const aqiPollQueue = new Queue(AQI_POLL_QUEUE, {
  connection: redisConnection,
});

const worker = new Worker(
  AQI_POLL_QUEUE,
  async (job) => {
    logger.info('Running AQI Poller job...');
    
    // Delhi NCR bounds
    const data = await waqiService.getMapBounds(28.40, 76.84, 28.88, 77.35);
    
    let saved = 0;
    for (const station of data) {
      const aqiValue = parseInt(station.aqi);
      // Skip stations with no valid reading (WAQI returns "-" for offline sensors)
      if (isNaN(aqiValue) || aqiValue < 0) continue;

      await prisma.aQIReading.create({
        data: {
          stationId: station.uid.toString(),
          stationName: station.station.name,
          lat: station.lat,
          lon: station.lon,
          aqi: aqiValue,
          recordedAt: new Date(station.station.time),
        },
      });
      saved++;
    }

    // Only broadcast stations with valid AQI data
    const validStations = data.filter((s: any) => !isNaN(parseInt(s.aqi)) && parseInt(s.aqi) >= 0);
    websocketService.broadcastAQIUpdate(validStations);
    logger.info(`AQI Poller job completed. Saved ${saved}/${data.length} stations.`);
  },
  { connection: redisConnection }
);

worker.on('failed', (job, err) => {
  logger.error(`AQI Poller job ${job?.id} failed: ${err.message}`);
});
