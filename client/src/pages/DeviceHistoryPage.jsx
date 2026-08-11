// client/src/pages/DeviceHistoryPage.jsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import apiClient from '../lib/apiClient';
import { SkeletonCard, Skeleton } from '../components/ui/Skeleton';
import { useRoutePlayback } from '../features/history/hooks/useRoutePlayback';
import PlaybackControls from '../features/history/components/PlaybackControls';

function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DeviceHistoryPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [pings, setPings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const playback = useRoutePlayback(pings);

  useEffect(() => {
    apiClient.get('/history/devices').then(({ data }) => {
      setDevices(data.devices);
      if (data.devices.length > 0) setSelectedDevice(data.devices[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedDevice) return;
    setIsLoading(true);
    apiClient
      .get(`/history/${selectedDevice}`)
      .then(({ data }) => setPings(data.pings))
      .finally(() => setIsLoading(false));
  }, [selectedDevice]);

  const path = pings.map((p) => [p.latitude, p.longitude]);

  let totalDistanceKm = 0;
  for (let i = 1; i < path.length; i++) {
    totalDistanceKm += haversineDistance(path[i - 1], path[i]);
  }

  const durationMinutes =
    pings.length > 1
      ? Math.round(
          (new Date(pings[pings.length - 1].createdAt) - new Date(pings[0].createdAt)) / 60000
        )
      : 0;

  const playbackPosition = playback.currentPing
    ? [playback.currentPing.latitude, playback.currentPing.longitude]
    : null;

  return (
    <div className="h-screen flex flex-col p-4 gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
        <h1 className="text-2xl font-semibold">Device History</h1>
        <label htmlFor="device-select" className="sr-only">
          Select device
        </label>
        <select
          id="device-select"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        >
          {devices.length === 0 && <option value="">No devices yet</option>}
          {devices.map((d) => (
            <option key={d._id} value={d._id}>
              Device {d._id.slice(0, 6)} — last seen{' '}
              {new Date(d.lastSeen).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="glass rounded-2xl shadow-soft p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Points recorded</p>
              <p className="text-xl font-semibold">{pings.length}</p>
            </div>
            <div className="glass rounded-2xl shadow-soft p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Distance travelled</p>
              <p className="text-xl font-semibold">{totalDistanceKm.toFixed(2)} km</p>
            </div>
            <div className="glass rounded-2xl shadow-soft p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
              <p className="text-xl font-semibold">{durationMinutes} min</p>
            </div>
          </>
        )}
      </div>

      <div className="px-2">
        {!isLoading && <PlaybackControls playback={playback} totalPoints={pings.length} />}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4 px-2 pb-2">
        <div className="md:col-span-2 rounded-2xl overflow-hidden shadow-soft">
          {isLoading ? (
            <Skeleton className="w-full h-full rounded-none" />
          ) : path.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No location history for this device yet.
            </div>
          ) : (
            <MapContainer center={path[path.length - 1]} zoom={15} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Polyline positions={path} pathOptions={{ color: '#2563EB', weight: 4 }} />

              {/* Playback marker follows the scrubber/play position */}
              {playbackPosition && (
                <Marker position={playbackPosition}>
                  <Popup>
                    {new Date(playback.currentPing.createdAt).toLocaleTimeString()}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          )}
        </div>

        <div className="glass rounded-2xl shadow-soft overflow-y-auto p-3">
          <h2 className="text-sm font-semibold mb-2 px-1">Timeline</h2>
          <ul className="space-y-1">
            {pings
              .slice()
              .reverse()
              .map((p) => (
                <li
                  key={p._id}
                  className="text-xs px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="font-medium">
                    {new Date(p.createdAt).toLocaleTimeString()}
                  </span>{' '}
                  — {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}