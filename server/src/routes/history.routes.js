// server/src/routes/history.routes.js
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getDeviceHistory, getDeviceHistoryByDeviceId, listDevices } from '../controllers/history.controller.js';

const router = express.Router();

router.use(authenticate); // history is only visible to logged-in users

router.get('/devices', listDevices);
router.get('/device/:deviceId', getDeviceHistoryByDeviceId);
router.get('/devices', listDevices);
router.get('/:socketId', getDeviceHistory);
router.get('/:socketId', getDeviceHistory);

export default router;