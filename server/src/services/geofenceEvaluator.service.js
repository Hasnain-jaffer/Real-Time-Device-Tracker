// server/src/services/geofenceEvaluator.service.js
import Geofence from '../models/geofence.model.js';
import Notification from '../models/notification.model.js';
import Device from '../models/device.model.js';

const EXIT_BUFFER_MULTIPLIER = 1.3; // must move 30% past the radius to count as "exited"

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function evaluateGeofences({ deviceId, ownerId, deviceName, latitude, longitude, io }) {
  if (!deviceId) return;

  try {
    const geofences = await Geofence.find({ ownerId, isActive: true });
    if (geofences.length === 0) return;

    const device = await Device.findById(deviceId).select('insideGeofenceIds');
    if (!device) return;

    const previouslyInside = new Set(device.insideGeofenceIds.map((id) => id.toString()));
    const currentlyInside = new Set();

    for (const fence of geofences) {
      if (fence.deviceIds.length > 0 && !fence.deviceIds.some((id) => id.toString() === deviceId)) {
        continue;
      }

      const distance = haversineMeters(latitude, longitude, fence.latitude, fence.longitude);
      const wasInside = previouslyInside.has(fence._id.toString());

      // Hysteresis: use the tighter radius to enter, the wider radius to stay/exit.
      // This stops rapid flip-flopping when a device sits near the boundary.
      const isInside = wasInside
        ? distance <= fence.radiusMeters * EXIT_BUFFER_MULTIPLIER
        : distance <= fence.radiusMeters;

      if (isInside) currentlyInside.add(fence._id.toString());
    }

    const entered = [...currentlyInside].filter((id) => !previouslyInside.has(id));
    const exited = [...previouslyInside].filter((id) => !currentlyInside.has(id));

    if (entered.length === 0 && exited.length === 0) return;

    await Device.updateOne({ _id: deviceId }, { insideGeofenceIds: [...currentlyInside] });

    for (const fenceId of entered) {
      const fence = geofences.find((f) => f._id.toString() === fenceId);
      if (!fence) continue;
      const notif = await Notification.create({
        userId: ownerId,
        type: 'geofence-enter',
        title: `${deviceName} arrived at ${fence.name}`,
        message: `${deviceName} entered the ${fence.name} zone.`,
      });
      pushToUser(io, ownerId, notif);
    }

    for (const fenceId of exited) {
      const fence = geofences.find((f) => f._id.toString() === fenceId);
      if (!fence) continue;
      const notif = await Notification.create({
        userId: ownerId,
        type: 'geofence-exit',
        title: `${deviceName} left ${fence.name}`,
        message: `${deviceName} exited the ${fence.name} zone.`,
      });
      pushToUser(io, ownerId, notif);
    }
  } catch (err) {
    console.error('[geofenceEvaluator] Failed to evaluate geofences:', err.message);
  }
}

function pushToUser(io, ownerId, notification) {
  if (!io) return;
  io.to(`user:${ownerId.toString()}`).emit('notification', notification);
}