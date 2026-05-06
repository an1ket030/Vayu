import { Router } from 'express';
import { login, getProfile } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);

export default router;
