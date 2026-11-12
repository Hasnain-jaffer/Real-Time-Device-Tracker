// server/src/controllers/search.controller.js
import Device from '../models/device.model.js';
import Geofence from '../models/geofence.model.js';
import Notification from '../models/notification.model.js';

// Escape characters that mean something in a regular expression, so searching
// for "(" or "[" cannot crash the query.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function globalSearch(req, res, next) {
  try {
    const q = String(req.query.q || '').trim().slice(0, 60);
    if (!q) {
      return res.json({ devices: [], geofences: [], notifications: [] });
    }

    const regex = new RegExp(escapeRegex(q), 'i');
    const isGuest = req.user.id === 'guest';

    const [devices, geofences, notifications] = await Promise.all([
      // Buses and stops are shared by everyone, so no owner filter
      Device.find({ $or: [{ name: regex }, { identifier: regex }] })
        .select('name identifier status routeId')
        .limit(10),

      Geofence.find({ name: regex }).select('name routeId').limit(10),

      // Notifications are personal: guests have none
      isGuest
        ? []
        : Notification.find({ userId: req.user.id, $or: [{ title: regex }, { message: regex }] })
            .sort({ createdAt: -1 })
            .limit(10),
    ]);

    res.json({ devices, geofences, notifications });
  } catch (err) {
    next(err);
  }
}