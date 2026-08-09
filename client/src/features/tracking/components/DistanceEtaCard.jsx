// client/src/features/tracking/components/DistanceEtaCard.jsx
import { haversineMeters, formatDistance, estimateEtaMinutes, formatEta } from '../utils/geoMath';

export default function DistanceEtaCard({ userPosition, device }) {
  if (!userPosition) {
    return (
      <div className="glass rounded-2xl shadow-soft p-5">
        <p className="text-sm text-gray-400">
          Enable location access to see your distance from this bus.
        </p>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="glass rounded-2xl shadow-soft p-5">
        <p className="text-sm text-gray-400">Select a bus to see distance and ETA.</p>
      </div>
    );
  }

  const distanceMeters = haversineMeters(
    [userPosition.latitude, userPosition.longitude],
    [device.latitude, device.longitude]
  );
  const etaMinutes = estimateEtaMinutes(distanceMeters, device.speedKmh);

  return (
    <div className="glass rounded-2xl shadow-soft p-5">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        {device.name} {device.identifier && `· ${device.identifier}`}
      </p>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <p className="text-xs text-gray-400">Distance</p>
          <p className="text-2xl font-semibold">{formatDistance(distanceMeters)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">ETA</p>
          <p className="text-2xl font-semibold">{formatEta(etaMinutes)}</p>
        </div>
      </div>
      {device.speedKmh != null && (
        <p className="text-xs text-gray-400 mt-3">
          Current speed: {device.speedKmh.toFixed(0)} km/h
        </p>
      )}
      {etaMinutes == null && device.speedKmh != null && (
        <p className="text-xs text-gray-400 mt-1">Bus appears stopped — ETA will update once it starts moving.</p>
      )}
    </div>
  );
}