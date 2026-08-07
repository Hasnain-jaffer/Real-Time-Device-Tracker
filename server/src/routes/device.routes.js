// server/src/routes/device.routes.js
import express from 'express';
import {
  listMyDevices,
  createDevice,
  getDevice,
  updateDevice,
  deleteDevice,
  regenerateDeviceKey,
} from '../controllers/device.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', listMyDevices);
router.post('/', createDevice);
router.get('/:id', getDevice);
router.patch('/:id', updateDevice);
router.delete('/:id', deleteDevice);
router.post('/:id/regenerate-key', regenerateDeviceKey);

export default router;