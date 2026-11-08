// server/src/routes/profile.routes.js
import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/profile.controller.js';
import { authenticate, requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate, requireAuth);

router.get('/', getProfile);
router.patch('/', updateProfile);
router.post('/change-password', changePassword);
router.delete('/', deleteAccount);

export default router;