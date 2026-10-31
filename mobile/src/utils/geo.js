// mobile/src/utils/geo.js
export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters) {
  if (meters == null) return '—';
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

// Simple, honest estimate: distance divided by the bus's current speed.
// Returns null when the bus is (almost) stationary so we never show "ETA: 9 hours".
export function estimateEtaMinutes(distanceMeters, speedKmh) {
  if (speedKmh == null || speedKmh < 3) return null;
  return Math.round(distanceMeters / ((speedKmh * 1000) / 60));
}

export function formatEta(minutes) {
  if (minutes == null) return '—';
  if (minutes < 1) return 'Arriving';
  if (minutes < 60) return `~${minutes} min`;
  return `~${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function timeAgo(timestampMs, nowMs = Date.now()) {
  if (!timestampMs) return '—';
  const s = Math.max(0, Math.round((nowMs - timestampMs) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
}