// client/src/pages/DeviceHistoryPage.jsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import apiClient from '../lib/apiClient';
import { useRoutePlayback } from '../features/history/hooks/useRoutePlayback';
import PlaybackControls from '../features/history/components/PlaybackControls';
import { useTheme } from '../app/ThemeContext';

const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--bg-surface': '#FFFFFF',
  '--bg-sidebar': '#173B32',
  '--border': '#E1D9C8',
  '--text-primary': '#173B32',
  '--text-secondary': '#5B6B5F',
  '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61',
  '--accent-eta': '#D59A3A',
};

const darkTokens = {
  '--bg-page': '#12181A',
  '--bg-surface': '#182220',
  '--bg-sidebar': '#0E1F1B',
  '--border': '#263531',
  '--text-primary': '#F1EEE4',
  '--text-secondary': '#8A9690',
  '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C',
  '--accent-eta': '#E3B15E',
};

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
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

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
      ? Math.round((new Date(pings[pings.length - 1].createdAt) - new Date(pings[0].createdAt)) / 60000)
      : 0;

  const playbackPosition = playback.currentPing
    ? [playback.currentPing.latitude, playback.currentPing.longitude]
    : null;

  const selectedDeviceMeta = devices.find((d) => d._id === selectedDevice);

  const tileUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
<div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-4">
        {/* 1. Header row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Device history
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {selectedDeviceMeta
                ? `Device ${selectedDeviceMeta._id.slice(0, 6)} — last seen ${new Date(selectedDeviceMeta.lastSeen).toLocaleTimeString()}`
                : 'No device selected'}
            </p>
          </div>

          <div className="relative">
            <label htmlFor="device-select" className="sr-only">Select device</label>
            <select
              id="device-select"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="appearance-none rounded-xl pl-4 pr-9 py-2.5 text-sm focus:outline-none"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              {devices.length === 0 && <option value="">No devices yet</option>}
              {devices.map((d) => (
                <option key={d._id} value={d._id}>
                  Device {d._id.slice(0, 6)} — last seen {new Date(d.lastSeen).toLocaleTimeString()}
                </option>
              ))}
            </select>
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              ▾
            </span>
          </div>
        </div>

        {/* 2. Stat strip */}
        <div
          className="rounded-xl px-5 py-3 flex flex-wrap items-center gap-x-8 gap-y-2"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div>
            <p className="text-[10.5px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-primary)' }}>🛣️</span> Points recorded
            </p>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{pings.length}</p>
          </div>
          <div>
            <p className="text-[10.5px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-eta)' }}>📍</span> Distance travelled
            </p>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{totalDistanceKm.toFixed(2)} km</p>
          </div>
          <div>
            <p className="text-[10.5px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-primary)' }}>🕒</span> Duration
            </p>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{durationMinutes} min</p>
          </div>
        </div>

        {/* 3. Playback control bar */}
        {!isLoading && (
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <PlaybackControls playback={playback} totalPoints={pings.length} tokens={tokens} />
          </div>
        )}

        {/* 4. Map + Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-4">
          <div
            className="relative rounded-xl overflow-hidden"
            style={{ height: '320px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-page)' }}
          >
            {isLoading ? (
              <div className="w-full h-full animate-pulse" style={{ backgroundColor: 'var(--border)' }} />
            ) : path.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                <span style={{ fontSize: '22px' }}>🗺️</span>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No location history for this device yet.</p>
              </div>
            ) : (
              <>
                <MapContainer center={path[path.length - 1]} zoom={15} style={{ width: '100%', height: '100%' }}>
                  <TileLayer url={tileUrl} />
                  <Polyline positions={path} pathOptions={{ color: tokens['--accent-primary'], weight: 4 }} />
                  {playbackPosition && (
                    <Marker position={playbackPosition}>
                      <Popup>{new Date(playback.currentPing.createdAt).toLocaleTimeString()}</Popup>
                    </Marker>
                  )}
                </MapContainer>

                <div
                  className="absolute top-2 left-2 px-3 py-1.5 rounded-[9px] text-[11px] font-medium"
                  style={{ backgroundColor: 'rgba(23,59,50,0.88)', color: '#FFFFFF' }}
                >
                  Route playback — Point {playback.currentIndex + 1}
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl p-3 overflow-y-auto" style={{ height: '320px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <p className="text-[12.5px] font-semibold px-1 mb-1" style={{ color: 'var(--text-primary)' }}>Timeline</p>
            {pings.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No points yet.</p>
            ) : (
              <div>
                {pings.slice().reverse().map((p, i, arr) => (
                  <div
                    key={p._id}
                    className="px-1 py-[7px] text-xs"
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', opacity: i < arr.length - 1 ? 1 : 1 }}
                  >
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {new Date(p.createdAt).toLocaleTimeString()}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}> — {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}