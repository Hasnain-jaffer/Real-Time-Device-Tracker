// server/src/controllers/device.controller.js
import Device from '../models/device.model.js';

export async function listMyDevices(req, res, next) {
  try {
    // Buses are admin-managed but visible to every authenticated user (students
    // need to see all buses/routes to find their own stop) — no longer filtered
    // by ownerId.
    const devices = await Device.find().sort({ createdAt: -1 });
    res.json({ devices });
  } catch (err) {
    next(err);
  }
}

export async function createDevice(req, res, next) {
  try {
    const { name, identifier, type } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Device name is required' });
    }

    const device = await Device.create({
      ownerId: req.user.id,
      name,
      identifier: identifier || '',
      type: type || 'bus',
      deviceKey: Device.generateDeviceKey(),
    });

    res.status(201).json({ device });
  } catch (err) {
    next(err);
  }
}

export async function getDevice(req, res, next) {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ device });
  } catch (err) {
    next(err);
  }
}

export async function updateDevice(req, res, next) {
  try {
    const { name, identifier, trackingEnabled, imei, routeId } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (identifier !== undefined) update.identifier = identifier;
    if (trackingEnabled !== undefined) update.trackingEnabled = trackingEnabled;
    if (imei !== undefined) update.imei = imei;
    if (routeId !== undefined) update.routeId = routeId;

    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      update,
      { new: true }
    );

    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ device });
  } catch (err) {
    next(err);
  }
}

export async function deleteDevice(req, res, next) {
  try {
    const device = await Device.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ message: 'Device deleted' });
  } catch (err) {
    next(err);
  }
}

export async function regenerateDeviceKey(req, res, next) {
  try {
    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      { deviceKey: Device.generateDeviceKey() },
      { new: true }
    );
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ device });
  } catch (err) {
    next(err);
  }
}
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getNearbyDevices(req, res, next) {
  try {
    const { lat, lng, limit = 5 } = req.query;
    if (lat == null || lng == null) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }

    const onlineDevices = await Device.find({ status: 'online', 'lastLocation.latitude': { $ne: null } });

    const withDistance = onlineDevices
      .map((d) => ({
        ...d.toObject(),
        distanceMeters: Math.round(
          haversineMeters(Number(lat), Number(lng), d.lastLocation.latitude, d.lastLocation.longitude)
        ),
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, Number(limit));

    res.json({ devices: withDistance });
  } catch (err) {
    next(err);
  }
}