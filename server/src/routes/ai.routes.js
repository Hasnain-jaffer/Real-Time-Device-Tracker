import express from 'express';
import rateLimit from 'express-rate-limit';
import { searchRoutes, getDelayNote } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// authenticate has already run, so the limits are genuinely per user (falls back to the IP)
const byUser = (req) => req.user?.id || req.ip;

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: byUser,
  message: { message: 'Too many AI search requests, please wait a minute.' },
});

const delayLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: byUser,
  message: { message: 'Too many requests, please wait a minute.' },
});

router.post('/search', searchLimiter, searchRoutes);
router.get('/delay-note/:deviceId', delayLimiter, getDelayNote);

export default router;