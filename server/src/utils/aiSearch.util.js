// Pure helpers for the AI search feature (no database, no network) so they are easy to test.
export const MAX_QUERY_LENGTH = 200;
const MAX_RESULTS = 5;

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'am', 'to', 'of', 'in', 'on', 'at', 'for', 'from', 'by', 'and', 'or',
  'which', 'what', 'where', 'when', 'how', 'who', 'does', 'do', 'go', 'goes', 'going', 'get', 'take',
  'bus', 'buses', 'route', 'routes', 'near', 'nearby', 'me', 'my', 'i', 'can', 'you', 'there', 'this', 'that',
  'stop', 'stops', 'want', 'need', 'please', 'tell', 'show', 'find',
]);

/** Returns a cleaned query string, or null if it is missing, too short or too long. */
export function sanitizeQuery(raw) {
  if (typeof raw !== 'string') return null;
  const q = raw.replace(/\s+/g, ' ').trim();
  if (q.length < 2 || q.length > MAX_QUERY_LENGTH) return null;
  return q;
}

/**
 * Grounding data: one entry per active route with its ordered stops and buses.
 * Stops/buses without a route are not route answers, but unassigned buses are
 * returned to the caller separately so they can still be found by name.
 */
export function buildContext(routes, stops, buses) {
  const stopsByRoute = new Map();
  for (const s of stops) {
    if (!s.routeId) continue;
    const key = s.routeId.toString();
    if (!stopsByRoute.has(key)) stopsByRoute.set(key, []);
    stopsByRoute.get(key).push(s);
  }
  const busesByRoute = new Map();
  for (const b of buses) {
    if (!b.routeId) continue;
    const key = b.routeId.toString();
    if (!busesByRoute.has(key)) busesByRoute.set(key, []);
    busesByRoute.get(key).push(b);
  }
  return routes.map((r) => {
    const id = r._id.toString();
    const routeStops = (stopsByRoute.get(id) || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return {
      routeId: id,
      name: r.name,
      color: r.color || null,
      stops: routeStops.map((s) => ({ stopId: s._id.toString(), name: s.name })),
      buses: (busesByRoute.get(id) || []).map((b) => ({ busId: b._id.toString(), name: b.name, status: b.status })),
    };
  });
}

/** What the model is allowed to see: names and ids only, no bus status, no secrets. */
export function toModelContext(context, unassignedBuses = []) {
  return {
    routes: context.map((c) => ({
      routeId: c.routeId,
      name: c.name,
      stops: c.stops.map((s) => ({ stopId: s.stopId, name: s.name })),
      buses: c.buses.map((b) => ({ busId: b.busId, name: b.name })),
    })),
    unassignedBuses: unassignedBuses.map((b) => ({
      busId: b._id.toString(),
      name: b.name,
      identifier: b.identifier,
    })),
  };
}

/** Parses the model's text as JSON (tolerating code fences) into three id arrays. Throws on garbage. */
export function parseModelJson(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Gemini returned an empty response');
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini returned non-JSON output');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Gemini JSON was not an object');
  }
  const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
  return {
    routeIds: arr(parsed.matchedRouteIds),
    stopIds: arr(parsed.matchedStopIds),
    busIds: arr(parsed.matchedBusIds),
  };
}

/** The anti-hallucination guard: keep only ids that really exist, deduplicated, capped. */
export function pickValidIds(ids, context, unassignedBuses = []) {
  const validRoutes = new Set(context.map((c) => c.routeId));
  const validStops = new Set(context.flatMap((c) => c.stops.map((s) => s.stopId)));
  const validBuses = new Set([
    ...context.flatMap((c) => c.buses.map((b) => b.busId)),
    ...unassignedBuses.map((b) => b._id.toString()),
  ]);

  const pick = (list, valid) => {
    const seen = new Set();
    const out = [];
    for (const id of list || []) {
      if (!valid.has(id) || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= MAX_RESULTS) break;
    }
    return out;
  };

  return {
    routeIds: pick(ids?.routeIds, validRoutes),
    stopIds: pick(ids?.stopIds, validStops),
    busIds: pick(ids?.busIds, validBuses),
  };
}

function tokenize(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/** Plain text matching used when the AI is off or fails. Returns ids grouped by kind. */
export function fallbackMatch(query, context, unassignedBuses = []) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return { routeIds: [], stopIds: [], busIds: [] };
  const hits = (text) => tokens.some((t) => (text || '').toLowerCase().includes(t));

  const routeScores = context
    .map((c) => {
      let score = 0;
      for (const t of tokens) {
        if (c.name.toLowerCase().includes(t)) score += 3;
        if (c.stops.some((s) => s.name.toLowerCase().includes(t))) score += 2;
        if (c.buses.some((b) => b.name.toLowerCase().includes(t))) score += 1;
      }
      return { id: c.routeId, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const stopIds = context
    .flatMap((c) => c.stops.filter((s) => hits(s.name)).map((s) => s.stopId))
    .slice(0, MAX_RESULTS);

  const busIds = [
    ...context.flatMap((c) => c.buses.filter((b) => hits(b.name)).map((b) => b.busId)),
    ...unassignedBuses.filter((b) => hits(`${b.name} ${b.identifier || ''}`)).map((b) => b._id.toString()),
  ].slice(0, MAX_RESULTS);

  return {
    routeIds: routeScores.slice(0, MAX_RESULTS).map((x) => x.id),
    stopIds,
    busIds,
  };
}