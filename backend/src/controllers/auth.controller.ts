import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name } = req.body;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: { email, name },
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ status: 'success', data: { user, token } });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    res.json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};
