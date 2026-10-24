import mongoose from 'mongoose';
import Route from '../models/route.model.js';
import Geofence from '../models/geofence.model.js';
import Device from '../models/device.model.js';
import { isGeminiConfigured, matchTransitQuery, explainDelay } from '../services/gemini.service.js';
import { computeDelayMetrics } from '../services/aiMetrics.service.js';
import { getCached, setCached } from '../services/aiCache.service.js';
import {
  MAX_QUERY_LENGTH,
  sanitizeQuery,
  buildContext,
  toModelContext,
  pickValidIds,
  fallbackMatch,
} from '../utils/aiSearch.util.js';
import {
  DELAY_NOTE_THRESHOLD_MINUTES,
  MAX_REASONABLE_DELAY_MINUTES,
  buildFallbackNote,
  isGroundedNote,
} from '../utils/delayNote.util.js';

export async function searchRoutes(req, res, next) {
  try {
    const query = sanitizeQuery(req.body?.query);
    if (!query) {
      return res.status(400).json({ message: `Type a question between 2 and ${MAX_QUERY_LENGTH} characters.` });
    }

    // Grounding data comes from our own database, fresh on every request
    const [routes, stops, buses] = await Promise.all([
      Route.find({ isActive: true }).select('_id name color'),
      Geofence.find({ isActive: true, routeId: { $ne: null } }).select('name routeId order'),
      Device.find().select('name identifier status routeId'), // deviceKey is select:false in the schema
    ]);

    const context = buildContext(routes, stops, buses);
    const unassignedBuses = buses.filter((b) => !b.routeId);
    if (context.length === 0 && unassignedBuses.length === 0) {
      return res.json({ routes: [], stops: [], buses: [], source: 'none' });
    }

    const started = Date.now();
    const cacheKey = `ai-search:${query.toLowerCase()}`;
    let ids = null;
    let source = 'ai';
    let fromCache = false;

    // Only ids are cached, never names/status, so the response is always decorated with fresh data
    const cachedIds = getCached(cacheKey);
    if (cachedIds) {
      ids = pickValidIds(cachedIds, context, unassignedBuses);
      fromCache = true;
    } else if (isGeminiConfigured()) {
      try {
        const suggested = await matchTransitQuery(query, toModelContext(context, unassignedBuses));
        // An id the model made up is dropped here, whatever the prompt said
        ids = pickValidIds(suggested, context, unassignedBuses);
        setCached(cacheKey, ids);
      } catch (err) {
        console.warn('[ai-search] Gemini failed, using text match:', err.message);
      }
    }

    if (!ids) {
      ids = fallbackMatch(query, context, unassignedBuses);
      source = 'text';
    }

    // Decorate with fresh data
    const routeById = new Map(context.map((c) => [c.routeId, c]));
    const allStops = context.flatMap((c) => c.stops.map((s) => ({ ...s, routeId: c.routeId, routeName: c.name })));
    const stopById = new Map(allStops.map((s) => [s.stopId, s]));
    const allBuses = [
      ...context.flatMap((c) => c.buses.map((b) => ({ ...b, routeId: c.routeId, routeName: c.name }))),
      ...unassignedBuses.map((b) => ({
        busId: b._id.toString(), name: b.name, identifier: b.identifier, status: b.status, routeId: null, routeName: '',
      })),
    ];
    const busById = new Map(allBuses.map((b) => [b.busId, b]));

    const matchedStops = ids.stopIds.map((id) => stopById.get(id)).filter(Boolean);
    const matchedBuses = ids.busIds.map((id) => busById.get(id)).filter(Boolean);

    // Include the parent route of any matched stop or bus so the student can open it
    const routeIdSet = new Set(ids.routeIds.filter((id) => routeById.has(id)));
    matchedStops.forEach((s) => routeIdSet.add(s.routeId));
    matchedBuses.forEach((b) => b.routeId && routeIdSet.add(b.routeId));

    const response = {
      routes: [...routeIdSet].map((id) => routeById.get(id)).filter(Boolean).map((c) => ({
        _id: c.routeId,
        name: c.name,
        color: c.color,
        stops: c.stops.map((s) => s.name),
        buses: c.buses.map((b) => ({ _id: b.busId, name: b.name, status: b.status })),
      })),
      stops: matchedStops.map((s) => ({ _id: s.stopId, name: s.name, routeId: s.routeId, routeName: s.routeName })),
      buses: matchedBuses.map((b) => ({
        _id: b.busId, name: b.name, identifier: b.identifier, status: b.status, routeId: b.routeId,
      })),
      source,
      fromCache,
    };

    console.log('[ai-search]', JSON.stringify({
      q: query, source, fromCache,
      routes: response.routes.length, stops: response.stops.length, buses: response.buses.length,
      ms: Date.now() - started,
    }));
    res.json(response);
  } catch (err) {
    next(err);
  }
}

const DELAY_NOTE_TTL_MS = 2 * 60 * 1000;

export async function getDelayNote(req, res, next) {
  try {
    const { deviceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(deviceId)) {
      return res.status(400).json({ message: 'Invalid device id' });
    }

    const cacheKey = `ai-delay:${deviceId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    const metrics = await computeDelayMetrics(deviceId);
    const worthExplaining =
      metrics &&
      metrics.delayMinutes >= DELAY_NOTE_THRESHOLD_MINUTES &&
      metrics.delayMinutes <= MAX_REASONABLE_DELAY_MINUTES;

    if (!worthExplaining) {
      const empty = { note: null };
      setCached(cacheKey, empty, DELAY_NOTE_TTL_MS);
      return res.json(empty);
    }

    let note = null;
    let source = 'ai';
    if (isGeminiConfigured()) {
      try {
        const candidate = await explainDelay(metrics);
        // The prompt asks for grounded text; this check enforces it
        if (isGroundedNote(candidate, metrics)) {
          note = candidate.trim();
        } else {
          console.warn('[ai-delay] Gemini note rejected (number, cause or length check), using template');
        }
      } catch (err) {
        console.warn('[ai-delay] Gemini failed, using template:', err.message);
      }
    }
    if (!note) {
      note = buildFallbackNote(metrics);
      source = 'template';
    }

    const response = { note, source, metrics };
    setCached(cacheKey, response, DELAY_NOTE_TTL_MS);
    res.json(response);
  } catch (err) {
    next(err);
  }
}