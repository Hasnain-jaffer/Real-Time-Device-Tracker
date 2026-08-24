// client/src/pages/DeviceHistoryPage.jsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import apiClient from '../lib/apiClient';
import { useRoutePlayback } from '../features/history/hooks/useRoutePlayback';
import PlaybackControls from '../features/history/components/PlaybackControls';
import { useTheme } from '../app/ThemeContext';
import MapSizeFix from '../components/map/MapSizeFix';

/* ─── SVG Icons ─── */
const IconChevronDown = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconRoute = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><line x1="12" y1="19" x2="20" y2="5" />
  </svg>
);

const IconMapPin = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconClock = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconMapEmpty = ({ size = 40, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const IconTimeline = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
  </svg>
);

const IconDot = ({ size = 8, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

/* ─── Tokens ─── */
const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--bg-surface': '#FFFFFF',
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
  '--border': '#263531',
  '--text-primary': '#F1EEE4',
  '--text-secondary': '#8A9690',
  '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C',
  '--accent-eta': '#E3B15E',
};

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

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
  const isDark = theme === 'dark';

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

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Device history
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
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
              className="appearance-none rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-[1.5px] transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--accent-primary)',
              }}
            >
              {devices.length === 0 && <option value="">No devices yet</option>}
              {devices.map((d) => (
                <option key={d._id} value={d._id}>
                  Device {d._id.slice(0, 6)} — last seen {new Date(d.lastSeen).toLocaleTimeString()}
                </option>
              ))}
            </select>
            <IconChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
        </div>

        {/* Stat strip */}
        <div
          className="rounded-2xl px-6 py-4 flex flex-wrap items-center gap-x-10 gap-y-3"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-primary)' + '18', color: 'var(--accent-primary)' }}
            >
              <IconRoute size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Points recorded</p>
              <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{pings.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-eta)' + '18', color: 'var(--accent-eta)' }}
            >
              <IconMapPin size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Distance travelled</p>
              <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{totalDistanceKm.toFixed(2)} km</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-primary)' + '18', color: 'var(--accent-primary)' }}
            >
              <IconClock size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Duration</p>
              <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{durationMinutes} min</p>
            </div>
          </div>
        </div>

        {/* Playback control bar */}
        {!isLoading && (
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <PlaybackControls playback={playback} totalPoints={pings.length} tokens={tokens} />
          </div>
        )}

        {/* Map + Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-4">
          {/* Map */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ height: '360px', border: '1px solid var(--border)', boxShadow: cardShadow, backgroundColor: 'var(--bg-page)' }}
          >
            {isLoading ? (
              <div className="w-full h-full animate-pulse" style={{ backgroundColor: 'var(--border)' }} />
            ) : path.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <IconMapEmpty size={28} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No location history</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>This device hasn't recorded any points yet.</p>
                </div>
              </div>
            ) : (
              <>
                <MapContainer center={path[path.length - 1]} zoom={15} style={{ width: '100%', height: '100%' }} attributionControl={false}>
                  <TileLayer url={tileUrl} />
                  <Polyline positions={path} pathOptions={{ color: tokens['--accent-primary'], weight: 4 }} />
                  {playbackPosition && (
                    <Marker position={playbackPosition}>
                      <Popup>{new Date(playback.currentPing.createdAt).toLocaleTimeString()}</Popup>
                    </Marker>
                  )}
                  <MapSizeFix />
                </MapContainer>

                {/* Glassmorphism overlay badge */}
                <div
                  className="absolute top-3 left-3 text-[11px] font-semibold px-3.5 py-1.5 rounded-full backdrop-blur-md border"
                  style={{
                    backgroundColor: isDark ? 'rgba(24,34,32,0.75)' : 'rgba(255,255,255,0.85)',
                    color: isDark ? '#F1EEE4' : '#173B32',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <IconMapPin size={12} />
                    Point {playback.currentIndex + 1} of {pings.length}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Timeline */}
          <div
            className="rounded-2xl p-4 overflow-y-auto flex flex-col"
            style={{ height: '360px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <IconTimeline size={14} style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Timeline</p>
            </div>

            {pings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
                <IconClock size={24} style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No points yet.</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {pings.slice().reverse().map((p, i, arr) => {
                  const isActive = playback.currentPing?._id === p._id;
                  return (
                    <div
                      key={p._id}
                      className="flex items-start gap-2.5 px-2 py-2 rounded-xl transition-colors"
                      style={{
                        backgroundColor: isActive ? 'var(--accent-primary)' + '10' : 'transparent',
                        borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div className="mt-1.5 flex-shrink-0">
                        <IconDot
                          size={7}
                          style={{ color: isActive ? 'var(--accent-primary)' : 'var(--border)' }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                        <p className="text-[11px] font-mono mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}