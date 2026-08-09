// server/src/routes/geofence.routes.js
import express from 'express';
import {
  listGeofences,
  createGeofence,
  updateGeofence,
  deleteGeofence,
} from '../controllers/geofence.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', listGeofences);
router.post('/', createGeofence);
router.patch('/:id', updateGeofence);
router.delete('/:id', deleteGeofence);

export default router;