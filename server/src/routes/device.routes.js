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
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Viewing buses is available to every logged-in user
router.get('/', listMyDevices);
router.get('/:id', getDevice);

// Managing buses is admin-only
router.post('/', authorize('admin'), createDevice);
router.patch('/:id', authorize('admin'), updateDevice);
router.delete('/:id', authorize('admin'), deleteDevice);
router.post('/:id/regenerate-key', authorize('admin'), regenerateDeviceKey);

export default router;