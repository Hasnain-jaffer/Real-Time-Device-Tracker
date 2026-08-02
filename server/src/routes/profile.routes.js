// server/src/routes/profile.routes.js
import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getProfile);
router.patch('/', updateProfile);
router.post('/change-password', changePassword);
router.delete('/', deleteAccount);

export default router;