import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logExposure = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lon, aqi, category, durationSec } = req.body;
    const userId = req.user?.id;

    const log = await prisma.exposureLog.create({
      data: {
        userId,
        lat,
        lon,
        aqi,
        category,
        durationSec,
        recordedAt: new Date(),
      },
    });

    res.json({ status: 'success', data: log });
  } catch (error) {
    next(error);
  }
};

export const getExposureHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const history = await prisma.exposureLog.findMany({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });

    res.json({ status: 'success', data: history });
  } catch (error) {
    next(error);
  }
};
