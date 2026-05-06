import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Authentication required',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Supabase signs JWTs with the project's JWT secret.
    // Ensure env.JWT_SECRET is set to the Supabase JWT secret.
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string };
    
    req.user = {
      id: decoded.sub, // Supabase stores user ID in 'sub'
      email: decoded.email,
    };

    // Ensure user exists in our local Prisma DB for relations (routes, exposure logs)
    // In a real production app, this is often done via a Supabase webhook on user creation.
    // For this project, upserting here ensures the local DB is always synced.
    await prisma.user.upsert({
      where: { id: decoded.sub },
      update: {},
      create: {
        id: decoded.sub,
        email: decoded.email || 'unknown@example.com',
      },
    });

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Invalid or expired token',
    });
  }
};
