// server/src/routes/route.routes.js
import express from 'express';
import {
  listRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteDetail,
  listRouteBuses,
  assignBusToRoute,
} from '../controllers/route.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', listRoutes);
router.get('/:id/buses', listRouteBuses);
router.get('/:id', getRouteDetail);
router.post('/', authorize('admin'), createRoute);
router.patch('/:id', authorize('admin'), updateRoute);
router.delete('/:id', authorize('admin'), deleteRoute);
router.post('/device/:deviceId/assign', authorize('admin'), assignBusToRoute);

export default router;