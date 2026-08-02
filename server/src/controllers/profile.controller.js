// server/src/controllers/profile.controller.js
import User from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { createNotification } from '../services/notification.service.js';

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select(
      'name email avatarUrl themePreference isVerified createdAt'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, avatarUrl, themePreference } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
    if (themePreference !== undefined) update.themePreference = themePreference;

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
    }).select('name email avatarUrl themePreference isVerified');

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.refreshTokens = []; // force re-login everywhere
    await user.save();

    await createNotification({
      userId: user._id,
      type: 'security-alert',
      title: 'Password changed',
      message: 'Your password was changed successfully. If this wasn\u2019t you, contact support immediately.',
    });

    res.json({ message: 'Password changed successfully. Please log in again.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.clearCookie('refreshToken');
    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
}