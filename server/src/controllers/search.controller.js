// server/src/controllers/search.controller.js
import Device from '../models/device.model.js';
import Geofence from '../models/geofence.model.js';
import Notification from '../models/notification.model.js';

export async function globalSearch(req, res, next) {
  try {
    const { q = '' } = req.query;
    if (!q.trim()) {
      return res.json({ devices: [], geofences: [], notifications: [] });
    }

    const regex = new RegExp(q.trim(), 'i');
    const ownerId = req.user.id;

    const [devices, geofences, notifications] = await Promise.all([
      Device.find({
        ownerId,
        $or: [{ name: regex }, { identifier: regex }],
      }).limit(10),

      Geofence.find({
        ownerId,
        name: regex,
      }).limit(10),

      Notification.find({
        userId: ownerId,
        $or: [{ title: regex }, { message: regex }],
      })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({ devices, geofences, notifications });
  } catch (err) {
    next(err);
  }
}