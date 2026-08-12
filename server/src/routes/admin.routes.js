// server/src/routes/admin.routes.js
import express from 'express';
import {
  getSystemOverview,
  listAllUsers,
  suspendUser,
  activateUser,
  deleteUserAdmin,
  listAllDevices,
  adminDeleteDevice,
  adminToggleTracking,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/overview', getSystemOverview);

router.get('/users', listAllUsers);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/activate', activateUser);
router.delete('/users/:id', deleteUserAdmin);

router.get('/devices', listAllDevices);
router.delete('/devices/:id', adminDeleteDevice);
router.patch('/devices/:id/tracking', adminToggleTracking);

export default router;