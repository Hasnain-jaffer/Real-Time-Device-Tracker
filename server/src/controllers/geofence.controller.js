// server/src/controllers/geofence.controller.js
import Geofence from '../models/geofence.model.js';

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getDeviceRoute(req, res, next) {
  try {
    const { deviceId } = req.params;
    const stops = await Geofence.find({ deviceIds: deviceId, isActive: true }).sort({ order: 1 });

    let cumulativeMeters = 0;
    const enriched = stops.map((stop, i) => {
      let distanceFromPrevMeters = 0;
      if (i > 0) {
        distanceFromPrevMeters = haversineMeters(
          stops[i - 1].latitude,
          stops[i - 1].longitude,
          stop.latitude,
          stop.longitude
        );
        cumulativeMeters += distanceFromPrevMeters;
      }
      return {
        ...stop.toObject(),
        distanceFromPrevMeters: Math.round(distanceFromPrevMeters),
        cumulativeMeters: Math.round(cumulativeMeters),
        isStart: i === 0,
        isEnd: i === stops.length - 1,
      };
    });

    res.json({ stops: enriched, totalDistanceMeters: Math.round(cumulativeMeters) });
  } catch (err) {
    next(err);
  }
}

export async function listGeofences(req, res, next) {
  try {
    const { deviceId } = req.query;
    const query = deviceId ? { deviceIds: deviceId } : {};
    // Sort by order (route sequence) when scoped to a device, so the
    // route/timeline view can render stops start-to-end correctly.
    const sortBy = deviceId ? { order: 1 } : { createdAt: -1 };
    const geofences = await Geofence.find(query).sort(sortBy);
    res.json({ geofences });
  } catch (err) {
    next(err);
  }
}

export async function createGeofence(req, res, next) {
  try {
    const { name, type, latitude, longitude, radiusMeters, color, deviceIds } = req.body;
    if (!name || latitude == null || longitude == null) {
      return res.status(400).json({ message: 'Name, latitude, and longitude are required' });
    }
    if (!deviceIds || deviceIds.length === 0) {
      return res.status(400).json({ message: 'A stop must be linked to at least one bus/route' });
    }

    // Auto-increment order within the scope of the first linked device,
    // so newly added stops append to the end of that bus's route.
    const lastStop = await Geofence.findOne({ deviceIds: deviceIds[0] }).sort({ order: -1 });
    const nextOrder = lastStop ? lastStop.order + 1 : 0;

    const geofence = await Geofence.create({
      ownerId: req.user.id,
      name,
      type: type || 'stop',
      latitude,
      longitude,
      radiusMeters: radiusMeters || 100,
      color: color || '#2563EB',
      deviceIds: deviceIds || [],
      order: nextOrder,
    });

    res.status(201).json({ geofence });
  } catch (err) {
    next(err);
  }
}

export async function updateGeofence(req, res, next) {
  try {
    const update = {};
    ['name', 'type', 'latitude', 'longitude', 'radiusMeters', 'color', 'isActive', 'deviceIds', 'order'].forEach((key) => {      
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });
    const geofence = await Geofence.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      update,
      { new: true }
    );

    if (!geofence) return res.status(404).json({ message: 'Geofence not found' });
    res.json({ geofence });
  } catch (err) {
    next(err);
  }
}

export async function deleteGeofence(req, res, next) {
  try {
    const geofence = await Geofence.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!geofence) return res.status(404).json({ message: 'Geofence not found' });
    res.json({ message: 'Geofence deleted' });
  } catch (err) {
    next(err);
  }
}