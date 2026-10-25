// server/src/services/eta.service.js
import Geofence from '../models/geofence.model.js';
import Device from '../models/device.model.js';
import StopArrival from '../models/stopArrival.model.js';
import LocationPing from '../models/locationPing.model.js';
import { haversineKm, averageMovingSpeedKmh } from './aiMetrics.service.js';

const LOOKBACK_DAYS = 30;
const MIN_SAMPLES = Number(process.env.ETA_MIN_SAMPLES) || 2;
const MAX_SEGMENT_MIN = 180; // ignore gaps that are clearly not one trip leg

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Median minutes between consecutive stops, learned from past trips.
// (Includes the dwell time at the earlier stop, since it is arrival-to-arrival.)
async function segmentMedians(routeId, stopIndex) {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000);
  const arrivals = await StopArrival.find({ routeId, arrivedAt: { $gte: since } })
    .sort({ deviceId: 1, arrivedAt: 1 })
    .lean();

  const samples = {};
  for (let i = 1; i < arrivals.length; i++) {
    const a = arrivals[i - 1];
    const b = arrivals[i];
    if (a.deviceId.toString() !== b.deviceId.toString()) continue;
    const ia = stopIndex.get(a.geofenceId.toString());
    const ib = stopIndex.get(b.geofenceId.toString());
    if (ia === undefined || ib !== ia + 1) continue;
    const minutes = (b.arrivedAt - a.arrivedAt) / 60000;
    if (minutes <= 0 || minutes > MAX_SEGMENT_MIN) continue;
    (samples[ia] ||= []).push(minutes);
  }

  const medians = {};
  for (const [k, list] of Object.entries(samples)) {
    if (list.length >= MIN_SAMPLES) medians[k] = median(list);
  }
  return medians;
}

async function recentSpeedKmh(deviceId) {
  const pings = await LocationPing.find({
    deviceId,
    createdAt: { $gte: new Date(Date.now() - 30 * 60000) },
  })
    .sort({ createdAt: 1 })
    .select('latitude longitude createdAt')
    .lean();
  return averageMovingSpeedKmh(pings);
}

async function estimateForBus(device, stops, medians, stopIndex) {
  const now = Date.now();
  const base = { deviceId: device._id.toString(), name: device.name, lastStop: null, etas: [] };

  const last = await StopArrival.findOne({
    deviceId: device._id,
    routeId: device.routeId,
    arrivedAt: { $gte: new Date(now - 3 * 3600000) },
  })
    .sort({ arrivedAt: -1 })
    .lean();
  if (!last) return base; // position along the route unknown until it reaches a stop

  const lastIdx = stopIndex.get(last.geofenceId.toString());
  if (lastIdx === undefined) return base;
  base.lastStop = { name: stops[lastIdx].name, at: last.arrivedAt };

  let t = new Date(last.arrivedAt).getTime();
  let allHistorical = true;
  let speedKmh = null;
  let speedLoaded = false;

  for (let k = lastIdx; k < stops.length - 1; k++) {
    let durMs;
    if (medians[k] != null) {
      durMs = medians[k] * 60000;
    } else {
      if (!speedLoaded) {
        speedKmh = await recentSpeedKmh(device._id);
        speedLoaded = true;
      }
      if (!speedKmh) break; // no history and no usable speed: say nothing rather than guess
      allHistorical = false;
      durMs = (haversineKm(stops[k], stops[k + 1]) / speedKmh) * 3600000;
    }

    t += durMs;
    if (k === lastIdx && t < now) t = now + 60000; // running behind its usual pace

    base.etas.push({
      stopId: stops[k + 1]._id.toString(),
      stopName: stops[k + 1].name,
      etaAt: new Date(t),
      minutes: Math.max(0, Math.round((t - now) / 60000)),
      method: allHistorical ? 'historical' : 'estimate',
    });
  }
  return base;
}

export async function computeRouteEta(routeId) {
  const stops = await Geofence.find({ routeId, isActive: true }).sort({ order: 1 });
  const buses = await Device.find({ routeId, status: 'online' });
  if (stops.length < 2 || buses.length === 0) return { buses: [] };

  const stopIndex = new Map(stops.map((s, i) => [s._id.toString(), i]));
  const medians = await segmentMedians(routeId, stopIndex);
  const results = await Promise.all(buses.map((b) => estimateForBus(b, stops, medians, stopIndex)));

  return { buses: results, segmentsLearned: Object.keys(medians).length, segmentsTotal: stops.length - 1 };
}