import { Request, Response, NextFunction } from 'express';
import { orsService } from '../services/ors.service';

export const getCleanRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start, end } = req.body;
    if (!start || !end) {
      return res.status(400).json({ status: 'error', message: 'Missing start or end coordinates' });
    }
    const data = await orsService.getDirections([start, end]);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};
