// client/src/pages/LiveTrackingPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTrackedDevices } from '../features/tracking/hooks/useTrackedDevices';
import { useTheme } from '../app/ThemeContext';
import { useSocket } from '../app/SocketProvider';
import { useUserLocation } from '../features/tracking/hooks/useUserLocation';
import MapSizeFix from '../components/map/MapSizeFix';
import TrackingPanel from '../features/tracking/components/TrackingPanel';
import DistanceEtaCard from '../features/tracking/components/DistanceEtaCard';

/* ─── SVG Icons ─── */
const IconSearch = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconMapEmpty = ({ size = 32, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const IconMapPin = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconCrosshair = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" />
  </svg>
);

const IconHistory = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const IconBus = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
  </svg>
);

const IconNavigation = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const IconSignal = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
  </svg>
);

const IconStops = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
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
  '--badge-success-bg': '#EAF3DE',
  '--badge-success-text': '#3B6D26',
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
  '--badge-success-bg': 'rgba(94,140,97,0.15)',
  '--badge-success-text': '#79B37C',
};

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

/* ─── Bus Icon (Leaflet) ─── */
function getBusIcon(color = '#5E8C61') {
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
      </svg>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function RecenterControl({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [position, map]);

  return null;
}

export default function LiveTrackingPage() {
  const { trackedDevices } = useTrackedDevices();
  const { theme } = useTheme();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { position: userPosition } = useUserLocation();

  const [selectedKey, setSelectedKey] = useState(null);
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [query, setQuery] = useState('');

  const tokens = theme === 'dark' ? darkTokens : lightTokens;
  const isDark = theme === 'dark';

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  useEffect(() => {
    let watchId;
    if (navigator.geolocation && socket) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          socket.emit('send-location', { latitude, longitude });
        },
        (error) => console.error('[geolocation]', error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [socket]);

  const selected =
    trackedDevices.find((d) => d.key === selectedKey) ||
    trackedDevices.find((d) => d.isRegistered) ||
    trackedDevices[0] ||
    null;

  const handleToggleVisibility = useCallback((key) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const mapCenter = selected
    ? [selected.latitude, selected.longitude]
    : [25.4610, 68.7183];

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full h-full flex flex-col lg:flex-row overflow-hidden">
      
      {/* Sidebar */}
      <div
        className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--bg-page)', borderRight: `1px solid var(--border)` }}
      >
        {/* Sidebar header */}
        <div className="p-4 sm:p-5 space-y-1" style={{ borderBottom: '1px solid var(--border)' }}>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Live Tracking
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {trackedDevices.length} bus{trackedDevices.length !== 1 ? 'es' : ''} online
          </p>
        </div>

        {/* Panel */}
        <div className="flex-1 overflow-hidden p-3">
          <TrackingPanel
            devices={trackedDevices}
            hiddenIds={hiddenIds}
            onToggleVisibility={handleToggleVisibility}
            onSelectDevice={setSelectedKey}
            selectedKey={selectedKey}
            tokens={tokens}
          />
        </div>

        {/* Distance / ETA */}
        {userPosition && (
          <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
            <DistanceEtaCard
              userPosition={userPosition}
              device={selected}
              tokens={tokens}
            />
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative min-h-[400px] lg:min-h-0">
        {trackedDevices.length === 0 ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6"
            style={{ backgroundColor: 'var(--bg-page)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <IconMapEmpty size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                No buses online
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Waiting for devices to start broadcasting…
              </p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={14}
            className="absolute inset-0 z-0"
            attributionControl={false}
          >
            <TileLayer url={tileUrl} />
            {trackedDevices.map((device) => {
              if (hiddenIds.has(device.key)) return null;
              return (
                <Marker
                  key={device.key}
                  position={[device.latitude, device.longitude]}
                  icon={getBusIcon(isDark ? '#79B37C' : '#5E8C61')}
                />
              );
            })}
            <RecenterControl position={selected ? [selected.latitude, selected.longitude] : null} />
            <MapSizeFix />
          </MapContainer>
        )}

        {/* Map overlays */}
        {trackedDevices.length > 0 && selected && (
          <>
            {/* Top-right: Selected bus info */}
            <div
              className="absolute top-4 right-4 z-[400] rounded-xl px-4 py-3 min-w-[200px] max-w-[260px]"
              style={{
                backgroundColor: isDark ? 'rgba(24,34,32,0.85)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--accent-primary)' + '20', color: 'var(--accent-primary)' }}
                >
                  <IconBus size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: isDark ? '#F1EEE4' : '#173B32' }}>
                    {selected.name}
                  </p>
                  {selected.identifier && (
                    <p className="text-[11px] truncate" style={{ color: isDark ? '#6E7C73' : '#9C8F73' }}>
                      {selected.identifier}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? '#8A9690' : '#5B6B5F' }}>
                  <IconSignal size={12} style={{ color: isDark ? '#6E7C73' : '#9C8F73' }} />
                  <span>{selected.speedKmh != null ? `${selected.speedKmh.toFixed(0)} km/h` : 'Speed unavailable'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? '#8A9690' : '#5B6B5F' }}>
                  <IconCrosshair size={12} style={{ color: isDark ? '#6E7C73' : '#9C8F73' }} />
                  <span className="font-mono text-[11px]">
                    {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom-left: Action chips */}
            <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2">
              <button
                onClick={() => selected?._id && navigate(`/devices/${selected._id}/history`)}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: isDark ? 'rgba(24,34,32,0.85)' : 'rgba(255,255,255,0.9)',
                  color: isDark ? '#F1EEE4' : '#173B32',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                }}
              >
                <IconHistory size={13} />
                History
              </button>
              <button
                onClick={() => selected?._id && navigate(`/devices/${selected._id}/stops`)}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition hover:opacity-90 active:scale-95"
                style={{
                  backgroundColor: isDark ? 'rgba(24,34,32,0.85)' : 'rgba(255,255,255,0.9)',
                  color: isDark ? '#F1EEE4' : '#173B32',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                }}
              >
                <IconStops size={13} />
                Stops
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}