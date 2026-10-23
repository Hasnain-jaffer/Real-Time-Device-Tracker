// server/src/routes/ai.routes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import { searchRoutes } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// authenticate has already run, so the limit is genuinely per user (falls back to the IP)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { message: 'Too many AI search requests, please wait a minute.' },
});

router.post('/search', aiLimiter, searchRoutes);

export default router;