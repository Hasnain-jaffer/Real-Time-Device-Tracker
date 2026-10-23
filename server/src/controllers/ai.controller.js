// server/src/controllers/ai.controller.js
import Route from '../models/route.model.js';
import Geofence from '../models/geofence.model.js';
import Device from '../models/device.model.js';
import { isGeminiConfigured, matchRoutesToQuery } from '../services/gemini.service.js';
import { getCached, setCached } from '../services/aiCache.service.js';
import {
  MAX_QUERY_LENGTH,
  sanitizeQuery,
  buildContext,
  toModelContext,
  pickValidIds,
  fallbackMatch,
} from '../utils/aiSearch.util.js';

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
      Device.find({ routeId: { $ne: null } }).select('name status routeId'), // deviceKey is select:false in the schema
    ]);

    const context = buildContext(routes, stops, buses);
    if (context.length === 0) {
      return res.json({ matchedRoutes: [], source: 'none' });
    }

    const started = Date.now();
    const cacheKey = `ai-search:${query.toLowerCase()}`;
    let ids = null;
    let source = 'ai';
    let fromCache = false;

    // Only the matched ids are cached, never bus status, so the response is always decorated with fresh data
    const cachedIds = getCached(cacheKey);
    if (cachedIds) {
      ids = pickValidIds(cachedIds, context);
      fromCache = true;
    } else if (isGeminiConfigured()) {
      try {
        const suggested = await matchRoutesToQuery(query, toModelContext(context));
        // Validate against the real data: an id the model made up is dropped here, whatever the prompt said
        ids = pickValidIds(suggested, context);
        setCached(cacheKey, ids);
      } catch (err) {
        console.warn('[ai-search] Gemini failed, using text match:', err.message);
      }
    }

    if (!ids) {
      ids = fallbackMatch(query, context);
      source = 'text';
    }

    const byId = new Map(context.map((c) => [c.routeId, c]));
    const matchedRoutes = ids.map((id) => {
      const c = byId.get(id);
      return { _id: c.routeId, name: c.name, color: c.color, stops: c.stops, buses: c.buses };
    });

    console.log('[ai-search]', JSON.stringify({ q: query, source, fromCache, matched: matchedRoutes.length, ms: Date.now() - started }));
    res.json({ matchedRoutes, source, fromCache });
  } catch (err) {
    next(err);
  }
}