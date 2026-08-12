// server/src/routes/analytics.routes.js
import express from 'express';
import {
  getOverviewAnalytics,
  getDailyDistanceChart,
  getStopActivity,
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/overview', getOverviewAnalytics);
router.get('/daily-distance', getDailyDistanceChart);
router.get('/stop-activity', getStopActivity);

export default router;