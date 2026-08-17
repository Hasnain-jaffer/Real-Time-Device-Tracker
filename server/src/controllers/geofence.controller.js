// server/src/controllers/geofence.controller.js
import Geofence from '../models/geofence.model.js';

export async function listGeofences(req, res, next) {
  try {
    const { deviceId } = req.query;
    const query = deviceId ? { deviceIds: deviceId } : {};
    const geofences = await Geofence.find(query).sort({ createdAt: -1 });
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

    const geofence = await Geofence.create({
      ownerId: req.user.id,
      name,
      type: type || 'stop',
      latitude,
      longitude,
      radiusMeters: radiusMeters || 100,
      color: color || '#2563EB',
      deviceIds: deviceIds || [],
    });

    res.status(201).json({ geofence });
  } catch (err) {
    next(err);
  }
}

export async function updateGeofence(req, res, next) {
  try {
    const update = {};
    ['name', 'type', 'latitude', 'longitude', 'radiusMeters', 'color', 'isActive', 'deviceIds'].forEach((key) => {
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