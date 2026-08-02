// server/src/services/notification.service.js
import Notification from '../models/notification.model.js';

export async function createNotification({ userId, type, title, message }) {
  try {
    return await Notification.create({ userId, type, title, message });
  } catch (err) {
    console.error('[notification.service] Failed to create notification:', err.message);
    return null;
  }
}