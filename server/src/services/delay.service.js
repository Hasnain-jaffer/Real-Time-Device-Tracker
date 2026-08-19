// server/src/services/delay.service.js
import Schedule from '../models/schedule.model.js';
import Notification from '../models/notification.model.js';

function todayAt(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

// Computes delay (in minutes, positive = late, negative = early) for a
// device's most recent stop arrival vs its scheduled time. Returns null
// when there's no schedule entry or no arrival recorded yet today.
export async function computeDelayForDevice(deviceId) {
  const scheduleEntries = await Schedule.find({ deviceId, isActive: true })
    .sort({ sequence: 1 })
    .populate('geofenceId', 'name');

  if (scheduleEntries.length === 0) return null;

  const results = [];

  for (const entry of scheduleEntries) {
    const expected = todayAt(entry.expectedTime);

    // Find today's most recent "arrived" event for this stop
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

        const arrival = await Notification.findOne({
      type: 'geofence-enter',
      deviceId: entry.deviceId,
      geofenceId: entry.geofenceId?._id,
      createdAt: { $gte: startOfDay },
    }).sort({ createdAt: -1 });
    
    results.push({
      stopName: entry.geofenceId?.name || 'Unknown stop',
      sequence: entry.sequence,
      expectedTime: entry.expectedTime,
      actualArrival: arrival ? arrival.createdAt : null,
      delayMinutes: arrival ? Math.round((arrival.createdAt - expected) / 60000) : null,
    });
  }

  return results;
}