// server/src/services/notify.service.js
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';

// Saves one notification per active user and pushes it live to each user's room.
export async function broadcastNotification(io, { type, title, message, deviceId = null, geofenceId = null }) {
  const users = await User.find({ isSuspended: false }).select('_id');
  if (users.length === 0) return;

  const docs = await Notification.insertMany(
    users.map((u) => ({ userId: u._id, type, title, message, deviceId, geofenceId }))
  );
  docs.forEach((n) => io.to(`user:${n.userId.toString()}`).emit('notification', n));
}