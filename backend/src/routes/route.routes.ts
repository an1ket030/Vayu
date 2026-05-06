import { Router } from 'express';
import { getCleanRoute } from '../controllers/route.controller';

const router = Router();

router.post('/find', getCleanRoute);

export default router;
