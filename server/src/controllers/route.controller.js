// server/src/controllers/route.controller.js
import Route from '../models/route.model.js';
import Geofence from '../models/geofence.model.js';
import Device from '../models/device.model.js';

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function listRoutes(req, res, next) {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.json({ routes });
  } catch (err) {
    next(err);
  }
}

export async function createRoute(req, res, next) {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Route name is required' });
    const route = await Route.create({ ownerId: req.user.id, name, color });
    res.status(201).json({ route });
  } catch (err) {
    next(err);
  }
}

export async function updateRoute(req, res, next) {
  try {
    const update = {};
    ['name', 'color', 'isActive'].forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });
    const route = await Route.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json({ route });
  } catch (err) {
    next(err);
  }
}

export async function deleteRoute(req, res, next) {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    await Geofence.deleteMany({ routeId: req.params.id });
    await Device.updateMany({ routeId: req.params.id }, { routeId: null });
    res.json({ message: 'Route and its stops deleted' });
  } catch (err) {
    next(err);
  }
}

// Full route detail: ordered stops with distance-from-previous, plus every
// bus currently assigned to it -- this is the one payload the merged
// Route + Stops page needs.
export async function getRouteDetail(req, res, next) {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });

    const stops = await Geofence.find({ routeId: route._id, isActive: true }).sort({ order: 1 });
    const buses = await Device.find({ routeId: route._id });

    let cumulativeMeters = 0;
    const enrichedStops = stops.map((stop, i) => {
      let distanceFromPrevMeters = 0;
      if (i > 0) {
        distanceFromPrevMeters = haversineMeters(
          stops[i - 1].latitude, stops[i - 1].longitude, stop.latitude, stop.longitude
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

    res.json({
      route,
      stops: enrichedStops,
      totalDistanceMeters: Math.round(cumulativeMeters),
      buses,
    });
  } catch (err) {
    next(err);
  }
}

export async function assignBusToRoute(req, res, next) {
  try {
    const { routeId } = req.body; // null to unassign
    const device = await Device.findByIdAndUpdate(req.params.deviceId, { routeId: routeId || null }, { new: true });
    if (!device) return res.status(404).json({ message: 'Bus not found' });
    res.json({ device });
  } catch (err) {
    next(err);
  }
}

export async function listRouteBuses(req, res, next) {
  try {
    const buses = await Device.find({ routeId: req.params.id });
    res.json({ buses });
  } catch (err) {
    next(err);
  }
}