// tracker-agent/locationProviders/routeProvider.js
// TESTING TOOL: drives a straight-line path through waypoints (the route's
// stops in order) at a fixed speed, then restarts the trip.
import fs from 'fs';

function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function createRouteProvider({ waypointsFile, speedKmh, intervalMs }) {
  const waypoints = JSON.parse(fs.readFileSync(waypointsFile, 'utf8')); // [[lat, lng], ...]
  const cum = [0];
  for (let i = 1; i < waypoints.length; i++) cum.push(cum[i - 1] + haversineKm(waypoints[i - 1], waypoints[i]));
  const total = cum[cum.length - 1];
  const stepKm = speedKmh * (intervalMs / 3600000);
  let travelled = 0;

  return function getLocation() {
    travelled += stepKm;
    if (travelled > total + 0.3) travelled = 0; // short pause at the end, then a new trip
    const d = Math.min(travelled, total);

    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const segLen = cum[i] - cum[i - 1];
    const f = segLen === 0 ? 0 : (d - cum[i - 1]) / segLen;
    const [lat1, lng1] = waypoints[i - 1];
    const [lat2, lng2] = waypoints[i];

    return {
      latitude: Number((lat1 + (lat2 - lat1) * f).toFixed(6)),
      longitude: Number((lng1 + (lng2 - lng1) * f).toFixed(6)),
    };
  };
}