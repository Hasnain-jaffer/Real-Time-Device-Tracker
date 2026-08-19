// server/src/services/geofenceEvaluator.service.js
import Geofence from '../models/geofence.model.js';
import Notification from '../models/notification.model.js';
import Device from '../models/device.model.js';
import User from '../models/user.model.js';
import Schedule from '../models/schedule.model.js';

const EXIT_BUFFER_MULTIPLIER = 1.3;

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const LATE_THRESHOLD_MINUTES = 5; // don't spam alerts for trivial 1-2 minute variance

function todayAt(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

async function maybeFireDelayAlert(io, allUsers, { deviceId, deviceName, geofenceId, fenceName, arrivalTime }) {
  const scheduleEntry = await Schedule.findOne({ deviceId, geofenceId, isActive: true });
  if (!scheduleEntry) return; // no schedule set for this stop -- nothing to compare against

  const expected = todayAt(scheduleEntry.expectedTime);
  const delayMinutes = Math.round((arrivalTime - expected) / 60000);

  if (delayMinutes > LATE_THRESHOLD_MINUTES) {
    await broadcastNotification(io, allUsers, {
      type: 'system-message',
      title: `${deviceName} is running late`,
      message: `${deviceName} arrived at ${fenceName} ${delayMinutes} minutes behind schedule.`,
      deviceId,
      geofenceId,
    });
  }
}

export async function evaluateGeofences({ deviceId, deviceName, latitude, longitude, io }) {
  if (!deviceId) return;

  try {
    // Stops/geofences are shared (admin-managed, visible to all) — no ownerId filter anymore.
    const geofences = await Geofence.find({ isActive: true });
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
      const isInside = wasInside
        ? distance <= fence.radiusMeters * EXIT_BUFFER_MULTIPLIER
        : distance <= fence.radiusMeters;

      if (isInside) currentlyInside.add(fence._id.toString());
    }

    const entered = [...currentlyInside].filter((id) => !previouslyInside.has(id));
    const exited = [...previouslyInside].filter((id) => !currentlyInside.has(id));

    if (entered.length === 0 && exited.length === 0) return;

    await Device.updateOne({ _id: deviceId }, { insideGeofenceIds: [...currentlyInside] });

    // Notify every user — this is a shared bus-tracking app, everyone can be
    // interested in any bus's arrival/departure at a stop.
    const allUsers = await User.find().select('_id');

        for (const fenceId of entered) {
      const fence = geofences.find((f) => f._id.toString() === fenceId);
      if (!fence) continue;

      const arrivalTime = new Date();

      await broadcastNotification(io, allUsers, {
        type: 'geofence-enter',
        title: `${deviceName} arrived at ${fence.name}`,
        message: `${deviceName} entered the ${fence.name} zone.`,
        deviceId,
        geofenceId: fence._id,
      });

      // Fire a separate, distinct delay alert only if meaningfully late --
      // keeps the routine arrival notification clean and adds a second,
      // clearly different alert type for genuine schedule problems.
      await maybeFireDelayAlert(io, allUsers, {
        deviceId,
        deviceName,
        geofenceId: fence._id,
        fenceName: fence.name,
        arrivalTime,
      });
    }
    
    for (const fenceId of exited) {
      const fence = geofences.find((f) => f._id.toString() === fenceId);
      if (!fence) continue;
            await broadcastNotification(io, allUsers, {
        type: 'geofence-exit',
        title: `${deviceName} left ${fence.name}`,
        message: `${deviceName} exited the ${fence.name} zone.`,
        deviceId,
        geofenceId: fence._id,
      });
    }
  } catch (err) {
    console.error('[geofenceEvaluator] Failed to evaluate geofences:', err.message);
  }
}

async function broadcastNotification(io, users, { type, title, message, deviceId, geofenceId }) {
  for (const user of users) {
    const notif = await Notification.create({ userId: user._id, type, title, message, deviceId, geofenceId });
    if (io) io.to(`user:${user._id.toString()}`).emit('notification', notif);
  }
}