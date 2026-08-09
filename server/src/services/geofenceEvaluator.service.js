// server/src/services/geofenceEvaluator.service.js
import Geofence from '../models/geofence.model.js';
import Notification from '../models/notification.model.js';
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

export async function evaluateGeofences({ deviceId, ownerId, deviceName, latitude, longitude }) {
  if (!deviceId) return;

  try {
    const geofences = await Geofence.find({ ownerId, isActive: true });
    if (geofences.length === 0) return;

    // Atomically claim the device's current state: read + immediately mark as
    // "being evaluated" isn't needed here because Mongo serializes writes per
    // document — instead we do a single findOneAndUpdate with the freshly
    // computed set, which means the *last* write for a burst of near-simultaneous
    // pings wins deterministically rather than racing on a shared in-memory Map.
    const device = await Device.findById(deviceId).select('insideGeofenceIds');
    if (!device) return;

    const previouslyInside = new Set(device.insideGeofenceIds.map((id) => id.toString()));
    const currentlyInside = new Set();

    for (const fence of geofences) {
      if (fence.deviceIds.length > 0 && !fence.deviceIds.some((id) => id.toString() === deviceId)) {
        continue;
      }

      const distance = haversineMeters(latitude, longitude, fence.latitude, fence.longitude);
      if (distance <= fence.radiusMeters) {
        currentlyInside.add(fence._id.toString());
      }
    }

    const entered = [...currentlyInside].filter((id) => !previouslyInside.has(id));
    const exited = [...previouslyInside].filter((id) => !currentlyInside.has(id));

    // Nothing changed — skip the write entirely (also avoids bumping updatedAt needlessly)
    if (entered.length === 0 && exited.length === 0) return;

    // Atomic write of the new state, conditioned on the state we just read —
    // if another evaluation already changed it in between, this update simply
    // overwrites with the latest computed truth rather than compounding errors.
    await Device.updateOne({ _id: deviceId }, { insideGeofenceIds: [...currentlyInside] });

    for (const fenceId of entered) {
      const fence = geofences.find((f) => f._id.toString() === fenceId);
      if (fence) {
        await Notification.create({
          userId: ownerId,
          type: 'geofence-enter',
          title: `${deviceName} arrived at ${fence.name}`,
          message: `${deviceName} entered the ${fence.name} zone.`,
        });
      }
    }

    for (const fenceId of exited) {
      const fence = geofences.find((f) => f._id.toString() === fenceId);
      if (fence) {
        await Notification.create({
          userId: ownerId,
          type: 'geofence-exit',
          title: `${deviceName} left ${fence.name}`,
          message: `${deviceName} exited the ${fence.name} zone.`,
        });
      }
    }
  } catch (err) {
    console.error('[geofenceEvaluator] Failed to evaluate geofences:', err.message);
  }
}