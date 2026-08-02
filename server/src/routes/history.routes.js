// server/src/routes/history.routes.js
import express from 'express';
import { getDeviceHistory, listDevices } from '../controllers/history.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate); // history is only visible to logged-in users

router.get('/devices', listDevices);
router.get('/:socketId', getDeviceHistory);

export default router;