// client/src/features/tracking/utils/geoMath.js

export function haversineMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Simple, honest ETA: distance / current speed.
 * Returns null when speed is too low to produce a meaningful estimate
 * (avoids showing "ETA: 8 hours" just because a bus is stopped at a light).
 */
export function estimateEtaMinutes(distanceMeters, speedKmh) {
  const MIN_MEANINGFUL_SPEED_KMH = 3;
  if (!speedKmh || speedKmh < MIN_MEANINGFUL_SPEED_KMH) return null;

  const speedMetersPerMin = (speedKmh * 1000) / 60;
  const minutes = distanceMeters / speedMetersPerMin;
  return Math.round(minutes);
}

export function formatEta(minutes) {
  if (minutes == null) return 'Calculating…';
  if (minutes < 1) return 'Arriving now';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}