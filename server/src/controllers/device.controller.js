// server/src/controllers/device.controller.js
import Device from '../models/device.model.js';

const IMEI_PATTERN = /^\d{15}$/;

// '' clears the IMEI (null), undefined means "not provided", anything else must be 15 digits
function parseImei(raw) {
  if (raw === undefined) return { value: undefined };
  const cleaned = String(raw ?? '').replace(/\s+/g, '');
  if (cleaned === '') return { value: null };
  if (!/^\d{15}$/.test(cleaned)) return { error: 'IMEI must be exactly 15 digits (printed on the tracker or its box)' };
  return { value: cleaned };
}


export async function listMyDevices(req, res, next) {
  try {
    // Buses are admin-managed but visible to every authenticated user (students
    // need to see all buses/routes to find their own stop). The deviceKey is a
    // credential, so only admins get it.
    const query = Device.find().sort({ createdAt: -1 });
    if (req.user.role === 'admin') query.select('+deviceKey');
    else query.select('-imei -ownerId');
    const devices = await query;
    res.json({ devices });
  } catch (err) {
    next(err);
  }
}

export async function createDevice(req, res, next) {
  try {
    const { name, identifier, type } = req.body;
    if (!name) return res.status(400).json({ message: 'Device name is required' });
    const imei = parseImei(req.body.imei);
    if (imei.error) return res.status(400).json({ message: imei.error });

    const device = await Device.create({
      ownerId: req.user.id,
      name,
      identifier: identifier || '',
      type: type || 'bus',
      deviceKey: Device.generateDeviceKey(),
      ...(imei.value ? { imei: imei.value } : {}),
    });
    res.status(201).json({ device });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'That IMEI is already assigned to another bus' });
    next(err);
  }
}

export async function getDevice(req, res, next) {
  try {
    const query = Device.findById(req.params.id);
    if (req.user.role === 'admin') query.select('+deviceKey');
    else query.select('-imei -ownerId');
    const device = await query;
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ device });
  } catch (err) {
    next(err);
  }
}

export async function updateDevice(req, res, next) {
  try {
    const { name, identifier, trackingEnabled, routeId } = req.body;
    const imei = parseImei(req.body.imei);
    if (imei.error) return res.status(400).json({ message: imei.error });

    const set = {};
    const unset = {};
    if (name !== undefined) set.name = name;
    if (identifier !== undefined) set.identifier = identifier;
    if (trackingEnabled !== undefined) set.trackingEnabled = trackingEnabled;
    if (routeId !== undefined) set.routeId = routeId;
    if (imei.value === null) unset.imei = 1;
    else if (imei.value !== undefined) set.imei = imei.value;

    const ops = {};
    if (Object.keys(set).length) ops.$set = set;
    if (Object.keys(unset).length) ops.$unset = unset;

    // Admin-only route: filter by _id only, and keep returning the key to the admin card
    const device = await Device.findOneAndUpdate({ _id: req.params.id }, ops, { new: true }).select('+deviceKey');
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ device });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'That IMEI is already assigned to another bus' });
    next(err);
  }
}

export async function deleteDevice(req, res, next) {
  try {
    const device = await Device.findOneAndDelete({ _id: req.params.id });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ message: 'Device deleted' });
  } catch (err) {
    next(err);
  }
}

export async function regenerateDeviceKey(req, res, next) {
  try {
    const device = await Device.findOneAndUpdate(
      { _id: req.params.id },
      { deviceKey: Device.generateDeviceKey() },
      { new: true }
    ).select('+deviceKey');
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

    const onlineDevices = await Device.find({ status: 'online', 'lastLocation.latitude': { $ne: null } })
      .select('-imei -ownerId');
      
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
