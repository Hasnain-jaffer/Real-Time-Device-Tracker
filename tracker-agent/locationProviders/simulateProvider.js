// tracker-agent/locationProviders/simulateProvider.js
// Generates gently wandering coordinates around a starting point.
// Used for demos/testing when no real GPS hardware is attached.

export function createSimulateProvider({ startLat, startLng, wanderMeters }) {
  let currentLat = startLat;
  let currentLng = startLng;

  return function getLocation() {
    // ~1 meter in degrees latitude is roughly 1 / 111320
    const metersToDegrees = 1 / 111320;
    const maxOffset = wanderMeters * metersToDegrees;

    currentLat += (Math.random() - 0.5) * maxOffset * 0.3;
    currentLng += (Math.random() - 0.5) * maxOffset * 0.3;

    return {
      latitude: Number(currentLat.toFixed(6)),
      longitude: Number(currentLng.toFixed(6)),
    };
  };
}