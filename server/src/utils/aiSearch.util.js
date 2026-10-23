// server/src/utils/aiSearch.util.js
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
 * Builds the grounding data: one entry per active route with its ordered stop names and bus names.
 * Stops/buses without a route are ignored (they cannot be answers).
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
      stops: routeStops.map((s) => s.name),
      buses: (busesByRoute.get(id) || []).map((b) => ({ _id: b._id, name: b.name, status: b.status })),
    };
  });
}

/** The part of the context that is sent to the model: names only, no colors, bus ids or statuses. */
export function toModelContext(context) {
  return context.map((c) => ({
    routeId: c.routeId,
    name: c.name,
    stops: c.stops,
    buses: c.buses.map((b) => b.name),
  }));
}

/** Parses the model's text as JSON (tolerating code fences) and returns the matchedRouteIds array. */
export function parseModelJson(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('Gemini returned an empty response');
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini returned non-JSON output');
  }
  if (!parsed || !Array.isArray(parsed.matchedRouteIds)) {
    throw new Error('Gemini JSON had no matchedRouteIds array');
  }
  return parsed.matchedRouteIds;
}

/** Keeps only ids that really exist in our data (the anti-hallucination guard), deduplicated, in model order. */
export function pickValidIds(ids, context) {
  const valid = new Set(context.map((c) => c.routeId));
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    if (typeof id !== 'string' || !valid.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_RESULTS) break;
  }
  return out;
}

function tokenize(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

/** Plain text matching used when the AI is off or fails. Returns route ids, best match first. */
export function fallbackMatch(query, context) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scored = context
    .map((c) => {
      const routeName = c.name.toLowerCase();
      const stopNames = c.stops.map((s) => s.toLowerCase());
      const busNames = c.buses.map((b) => b.name.toLowerCase());
      let score = 0;
      for (const t of tokens) {
        if (routeName.includes(t)) score += 3;
        if (stopNames.some((s) => s.includes(t))) score += 2;
        if (busNames.some((b) => b.includes(t))) score += 1;
      }
      return { id: c.routeId, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_RESULTS).map((x) => x.id);
}