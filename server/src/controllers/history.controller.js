// server/src/controllers/history.controller.js
import LocationPing from '../models/locationPing.model.js';

export async function getDeviceHistory(req, res, next) {
  try {
    const { socketId } = req.params;
    const { from, to, limit = 500 } = req.query;

    const query = { socketId };

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const pings = await LocationPing.find(query)
      .sort({ createdAt: 1 })
      .limit(Math.min(Number(limit) || 500, 2000))
      .lean();

    res.json({ socketId, count: pings.length, pings });
  } catch (err) {
    next(err);
  }
}

export async function listDevices(req, res, next) {
  try {
    // Distinct socketIds seen, with their most recent ping, so the History page
    // can offer a device picker without the user needing to know raw socket IDs.
    const devices = await LocationPing.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$socketId',
          lastSeen: { $first: '$createdAt' },
          lastLat: { $first: '$latitude' },
          lastLng: { $first: '$longitude' },
        },
      },
      { $sort: { lastSeen: -1 } },
      { $limit: 50 },
    ]);

    res.json({ devices });
  } catch (err) {
    next(err);
  }
}
export async function getDeviceHistoryByDeviceId(req, res, next) {
  try {
    const { deviceId } = req.params;
    const { from, to, limit = 500 } = req.query;

    const query = { deviceId };

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const pings = await LocationPing.find(query)
      .sort({ createdAt: 1 })
      .limit(Math.min(Number(limit) || 500, 2000))
      .lean();

    res.json({ deviceId, count: pings.length, pings });
  } catch (err) {
    next(err);
  }
}