// server/src/controllers/analytics.controller.js
import LocationPing from '../models/locationPing.model.js';
import Device from '../models/device.model.js';
import Notification from '../models/notification.model.js';

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function computeDeviceStats(pings) {
  if (pings.length < 2) {
    return { distanceKm: 0, avgSpeedKmh: 0, maxSpeedKmh: 0, trackedMinutes: 0, pointCount: pings.length };
  }

  let distanceKm = 0;
  let maxSpeedKmh = 0;

  for (let i = 1; i < pings.length; i++) {
    const segmentKm = haversineKm(pings[i - 1], pings[i]);
    distanceKm += segmentKm;

    const dtHours =
      (new Date(pings[i].createdAt) - new Date(pings[i - 1].createdAt)) / (1000 * 60 * 60);
    if (dtHours > 0) {
      const speedKmh = segmentKm / dtHours;
      if (speedKmh < 200) maxSpeedKmh = Math.max(maxSpeedKmh, speedKmh); // ignore GPS-jump outliers
    }
  }

  const trackedMinutes =
    (new Date(pings[pings.length - 1].createdAt) - new Date(pings[0].createdAt)) / 60000;
  const avgSpeedKmh = trackedMinutes > 0 ? distanceKm / (trackedMinutes / 60) : 0;

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    avgSpeedKmh: Number(avgSpeedKmh.toFixed(1)),
    maxSpeedKmh: Number(maxSpeedKmh.toFixed(1)),
    trackedMinutes: Math.round(trackedMinutes),
    pointCount: pings.length,
  };
}

export async function getOverviewAnalytics(req, res, next) {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const devices = await Device.find({ ownerId: req.user.id });
    const deviceIds = devices.map((d) => d._id);

    const pingQuery = { deviceId: { $in: deviceIds } };
    if (from || to) pingQuery.createdAt = dateFilter;

    const allPings = await LocationPing.find(pingQuery).sort({ createdAt: 1 }).lean();

    // Group pings by device
    const pingsByDevice = {};
    for (const ping of allPings) {
      const key = ping.deviceId?.toString();
      if (!key) continue;
      if (!pingsByDevice[key]) pingsByDevice[key] = [];
      pingsByDevice[key].push(ping);
    }

    const perDevice = devices.map((device) => {
      const stats = computeDeviceStats(pingsByDevice[device._id.toString()] || []);
      return { deviceId: device._id, name: device.name, identifier: device.identifier, ...stats };
    });

    const totalDistanceKm = perDevice.reduce((sum, d) => sum + d.distanceKm, 0);
    const totalTrackedMinutes = perDevice.reduce((sum, d) => sum + d.trackedMinutes, 0);
    const mostActiveDevice = perDevice.reduce(
      (top, d) => (d.distanceKm > (top?.distanceKm || 0) ? d : top),
      null
    );

    // Geofence activity in the same window, for "stop visits" insight
    const notifQuery = {
      userId: req.user.id,
      type: { $in: ['geofence-enter', 'geofence-exit'] },
    };
    if (from || to) notifQuery.createdAt = dateFilter;
    const geofenceEvents = await Notification.find(notifQuery).lean();

    res.json({
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      totalTrackedMinutes: Math.round(totalTrackedMinutes),
      mostActiveDevice: mostActiveDevice?.distanceKm > 0 ? mostActiveDevice : null,
      deviceCount: devices.length,
      geofenceEventCount: geofenceEvents.length,
      perDevice,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDailyDistanceChart(req, res, next) {
  try {
    const { days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const devices = await Device.find({ ownerId: req.user.id });
    const deviceIds = devices.map((d) => d._id);

    const pings = await LocationPing.find({
      deviceId: { $in: deviceIds },
      createdAt: { $gte: since },
    })
      .sort({ createdAt: 1 })
      .lean();

    // Group by device, then by calendar day, then sum per-day distance
    const byDeviceByDay = {};
    for (const ping of pings) {
      const deviceKey = ping.deviceId?.toString();
      if (!deviceKey) continue;
      const dayKey = new Date(ping.createdAt).toISOString().slice(0, 10);
      byDeviceByDay[deviceKey] = byDeviceByDay[deviceKey] || {};
      byDeviceByDay[deviceKey][dayKey] = byDeviceByDay[deviceKey][dayKey] || [];
      byDeviceByDay[deviceKey][dayKey].push(ping);
    }

    const dailyTotals = {};
    for (const deviceKey in byDeviceByDay) {
      for (const dayKey in byDeviceByDay[deviceKey]) {
        const dayPings = byDeviceByDay[deviceKey][dayKey];
        let dayDistance = 0;
        for (let i = 1; i < dayPings.length; i++) {
          dayDistance += haversineKm(dayPings[i - 1], dayPings[i]);
        }
        dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + dayDistance;
      }
    }

    const chartData = Object.entries(dailyTotals)
      .map(([date, distanceKm]) => ({ date, distanceKm: Number(distanceKm.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ chartData });
  } catch (err) {
    next(err);
  }
}

export async function getStopActivity(req, res, next) {
  try {
    const notifs = await Notification.find({
      userId: req.user.id,
      type: { $in: ['geofence-enter', 'geofence-exit'] },
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // Extract stop name from title (e.g. "Route 4A - Bus 12 arrived at Main Gate Stop")
    const visitCounts = {};
    for (const n of notifs) {
      const match = n.title.match(/at (.+)$|left (.+)$/) || n.title.match(/left (.+)$/);
      const stopName = n.title.includes('arrived at')
        ? n.title.split('arrived at ')[1]
        : n.title.split('left ')[1];
      if (!stopName) continue;
      visitCounts[stopName] = (visitCounts[stopName] || 0) + 1;
    }

    const stopActivity = Object.entries(visitCounts)
      .map(([name, count]) => ({ name, eventCount: count }))
      .sort((a, b) => b.eventCount - a.eventCount);

    res.json({ stopActivity, recentEvents: notifs.slice(0, 10) });
  } catch (err) {
    next(err);
  }
}