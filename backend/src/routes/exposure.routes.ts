import { Router } from 'express';
import { logExposure, getExposureHistory } from '../controllers/exposure.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/log', authMiddleware, logExposure);
router.get('/history', authMiddleware, getExposureHistory);

export default router;
