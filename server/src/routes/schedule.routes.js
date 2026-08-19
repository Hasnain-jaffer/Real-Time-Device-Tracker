// server/src/routes/schedule.routes.js
import express from 'express';
import {
  listScheduleForDevice,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
    getDelayStatus,
} from '../controllers/schedule.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/device/:deviceId', listScheduleForDevice);
router.post('/', authorize('admin'), createScheduleEntry);
router.patch('/:id', authorize('admin'), updateScheduleEntry);
router.delete('/:id', authorize('admin'), deleteScheduleEntry);
router.get('/device/:deviceId/delay', getDelayStatus);

export default router;