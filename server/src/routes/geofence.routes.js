// server/src/routes/geofence.routes.js
import express from 'express';
import {
  listGeofences,
  createGeofence,
  updateGeofence,
  deleteGeofence,
} from '../controllers/geofence.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', listGeofences);

router.post('/', authorize('admin'), createGeofence);
router.patch('/:id', authorize('admin'), updateGeofence);
router.delete('/:id', authorize('admin'), deleteGeofence);

export default router;