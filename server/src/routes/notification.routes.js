// server/src/routes/notification.routes.js
import express from 'express';
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate, requireAuth);

router.get('/', listNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

export default router;