import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${err.stack}`);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
