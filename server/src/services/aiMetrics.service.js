// server/src/services/aiMetrics.service.js
// Every number the delay note may mention is computed here, from our own data. The AI never calculates.
import LocationPing from '../models/locationPing.model.js';
import Device from '../models/device.model.js';
import { computeDelayForDevice } from './delay.service.js';

const TZ = process.env.APP_TIMEZONE || 'Asia/Karachi';
const MAX_GAP_SECONDS = 180; // longer gaps mean the device was offline, not moving

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) * Math.cos((b.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Average speed while actually moving: skips gaps, standing still (<2 km/h) and GPS jumps (>150 km/h).
export function averageMovingSpeedKmh(pings) {
  let distanceKm = 0;
  let movingSeconds = 0;
  for (let i = 1; i < pings.length; i++) {
    const dtSec = (new Date(pings[i].createdAt) - new Date(pings[i - 1].createdAt)) / 1000;
    if (dtSec <= 0 || dtSec > MAX_GAP_SECONDS) continue;
    const seg = haversineKm(pings[i - 1], pings[i]);
    const speed = seg / (dtSec / 3600);
    if (speed < 2 || speed > 150) continue;
    distanceKm += seg;
    movingSeconds += dtSec;
  }
  if (movingSeconds === 0) return null;
  return distanceKm / (movingSeconds / 3600);
}

const round1 = (n) => (n == null ? null : Number(n.toFixed(1)));

export async function computeDelayMetrics(deviceId) {
  const device = await Device.findById(deviceId).select('name');
  if (!device) return null;

  const stops = (await computeDelayForDevice(deviceId)) || [];
  const arrived = stops.filter((s) => s.delayMinutes != null && s.actualArrival);
  if (arrived.length === 0) return null;

  // The most recent stop arrival is the one we explain
  const latest = arrived.slice().sort((a, b) => new Date(b.actualArrival) - new Date(a.actualArrival))[0];

  // "Today" uses the server's local day, the same convention as delay.service.js (the server TZ is set in app.js)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [todayPings, pastPings] = await Promise.all([
    LocationPing.find({ deviceId, createdAt: { $gte: startOfToday } })
      .sort({ createdAt: 1 }).select('latitude longitude createdAt').limit(20000).lean(),
    LocationPing.find({ deviceId, createdAt: { $gte: sevenDaysAgo, $lt: startOfToday } })
      .sort({ createdAt: 1 }).select('latitude longitude createdAt').limit(50000).lean(),
  ]);

  return {
    busName: device.name,
    stopName: latest.stopName,
    scheduledTime: latest.expectedTime,
    arrivedAt: new Date(latest.actualArrival).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ }),
    delayMinutes: latest.delayMinutes,
    todayAvgMovingSpeedKmh: round1(averageMovingSpeedKmh(todayPings)),
    last7DaysAvgMovingSpeedKmh: round1(averageMovingSpeedKmh(pastPings)), // null when there is no history yet
  };
}