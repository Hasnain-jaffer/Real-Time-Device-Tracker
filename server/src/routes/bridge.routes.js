// server/src/routes/bridge.routes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import { bridgeAuth } from '../middleware/bridgeAuth.middleware.js';
import { getDeviceByImei } from '../controllers/bridge.controller.js';

const router = express.Router();

const bridgeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: 'Too many requests, please try again later.' },
});

router.use(bridgeLimiter, bridgeAuth);
router.get('/devices/by-imei/:imei', getDeviceByImei);

export default router;