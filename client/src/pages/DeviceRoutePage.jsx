// client/src/pages/DeviceRoutePage.jsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Circle, Tooltip } from 'react-leaflet';
import apiClient from '../lib/apiClient';
import { useTheme } from '../app/ThemeContext';
import MapSizeFix from '../components/map/MapSizeFix';

/* ─── SVG Icons ─── */
const IconFlagStart = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const IconFlagEnd = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    <circle cx="4" cy="22" r="2" fill="currentColor" stroke="none" />
  </svg>
);

const IconMapPin = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconClock = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconDistance = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
  </svg>
);

const IconArrowLeft = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconRoute = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><line x1="12" y1="19" x2="20" y2="5" />
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
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Timeline Stop Card ─── */
function StopCard({ stop, index, total, prevStop, tokens, isDark }) {
  const isStart = index === 0;
  const isEnd = index === total - 1;
  const isMiddle = !isStart && !isEnd;

  const distFromPrev = prevStop
    ? haversineDistance([prevStop.latitude, prevStop.longitude], [stop.latitude, stop.longitude])
    : 0;

  let iconColor = tokens['--accent-primary'];
  let bgColor = tokens['--accent-primary'] + '15';
  let label = 'Stop';
  let Icon = IconMapPin;

  if (isStart) {
    iconColor = tokens['--accent-primary'];
    bgColor = tokens['--accent-primary'] + '18';
    label = 'Start';
    Icon = IconFlagStart;
  } else if (isEnd) {
    iconColor = tokens['--accent-eta'];
    bgColor = tokens['--accent-eta'] + '18';
    label = 'Destination';
    Icon = IconFlagEnd;
  }

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Timeline connector line */}
      {!isEnd && (
        <div
          className="absolute left-[15px] top-8 w-0.5 h-full"
          style={{ backgroundColor: tokens['--border'] }}
        />
      )}

      {/* Timeline dot */}
      <div
        className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center z-10"
        style={{ backgroundColor: bgColor, color: iconColor, border: `2px solid ${tokens['--bg-surface']}` }}
      >
        <Icon size={isStart || isEnd ? 16 : 14} />
      </div>

      {/* Card */}
      <div
        className="rounded-xl p-4 space-y-2"
        style={{
          backgroundColor: tokens['--bg-surface'],
          border: `1px solid ${tokens['--border']}`,
          boxShadow: cardShadow,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: bgColor,
                color: iconColor,
              }}
            >
              {label}
            </span>
            <span className="text-[10px] font-medium" style={{ color: tokens['--text-muted'] }}>
              #{index + 1}
            </span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tokens['--text-muted'] }}>
            {stop.type || 'custom'}
          </span>
        </div>

        <h3 className="text-sm font-bold" style={{ color: tokens['--text-primary'] }}>
          {stop.name}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: tokens['--text-secondary'] }}>
          <span className="flex items-center gap-1">
            <IconMapPin size={12} style={{ color: tokens['--text-muted'] }} />
            {stop.latitude?.toFixed(5)}, {stop.longitude?.toFixed(5)}
          </span>
          {distFromPrev > 0 && (
            <span className="flex items-center gap-1">
              <IconDistance size={12} style={{ color: tokens['--text-muted'] }} />
              {distFromPrev.toFixed(2)} km from previous
            </span>
          )}
          <span className="flex items-center gap-1">
            <IconClock size={12} style={{ color: tokens['--text-muted'] }} />
            Radius: {stop.radiusMeters || 150}m
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DeviceRoutePage() {
  const { id } = useParams();
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;
  const isDark = theme === 'dark';

  const [device, setDevice] = useState(null);
  const [stops, setStops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      apiClient.get(`/devices/${id}`),
      apiClient.get(`/devices/${id}/stops`), // or /geofences?deviceId=${id}
    ])
      .then(([deviceRes, stopsRes]) => {
        setDevice(deviceRes.data.device);
        // Sort by order/sequence if available, otherwise by createdAt
        const sorted = (stopsRes.data.stops || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setStops(sorted);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const routePath = useMemo(() => stops.map((s) => [s.latitude, s.longitude]), [stops]);

  const tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

  const mapCenter = stops.length > 0
    ? [stops[0].latitude, stops[0].longitude]
    : [25.4615, 68.7169];

  return (
    <div
      className="flex-1 w-full p-4 sm:p-6 lg:p-8"
      style={{ ...tokens, backgroundColor: 'var(--bg-page)' }}
    >
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to={`/devices/${id}`}
                className="flex items-center gap-1 text-xs font-semibold transition hover:opacity-80"
                style={{ color: 'var(--accent-primary)' }}
              >
                <IconArrowLeft size={12} />
                Back to Device
              </Link>
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Route Overview
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              {device?.name || 'Device'} — {stops.length} {stops.length === 1 ? 'stop' : 'stops'} on route
            </p>
          </div>

          <div
            className="flex items-center gap-3 rounded-xl px-4 py-2.5"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <IconRoute size={16} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Total Distance
              </p>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {stops.length > 1
                  ? routePath.slice(1).reduce((sum, curr, i) => sum + haversineDistance(routePath[i], curr), 0).toFixed(2)
                  : '0.00'} km
              </p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
          {/* Timeline */}
          <div
            className="rounded-2xl p-5 sm:p-6"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-primary)' + '18', color: 'var(--accent-primary)' }}
              >
                <IconRoute size={16} />
              </div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Route Timeline
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--border)' }} />
                ))}
              </div>
            ) : stops.length === 0 ? (
              <div className="text-center py-10">
                <IconMapPin size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  No stops configured
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Add stops to build a route for this device.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {stops.map((stop, i) => (
                  <StopCard
                    key={stop._id}
                    stop={stop}
                    index={i}
                    total={stops.length}
                    prevStop={i > 0 ? stops[i - 1] : null}
                    tokens={tokens}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          <div
            className="relative rounded-2xl overflow-hidden map-wrapper"
            style={{ height: '520px', border: '1px solid var(--border)', boxShadow: cardShadow, backgroundColor: 'var(--bg-page)' }}
          >
            {isLoading ? (
              <div className="w-full h-full animate-pulse" style={{ backgroundColor: 'var(--border)' }} />
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
              >
                <TileLayer url={tileUrl} />

                {/* Route polyline */}
                {routePath.length > 1 && (
                  <Polyline
                    positions={routePath}
                    pathOptions={{
                      color: tokens['--accent-primary'],
                      weight: 4,
                      opacity: 0.8,
                      dashArray: '8, 6',
                    }}
                  />
                )}

                {/* Stop circles */}
                {stops.map((stop, i) => {
                  const isStart = i === 0;
                  const isEnd = i === stops.length - 1;
                  const color = isStart || isEnd ? tokens['--accent-primary'] : tokens['--accent-eta'];
                  return (
                    <Circle
                      key={stop._id}
                      center={[stop.latitude, stop.longitude]}
                      radius={stop.radiusMeters || 150}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.12,
                        weight: 2,
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -10]} className="!bg-transparent !border-0 !shadow-none">
                        <span className="text-xs font-semibold" style={{ color: tokens['--text-primary'] }}>
                          {isStart ? '▶ ' : isEnd ? '■ ' : '● '}{stop.name}
                        </span>
                      </Tooltip>
                    </Circle>
                  );
                })}

                <MapSizeFix />
              </MapContainer>
            )}

            {/* Map overlay badge */}
            {!isLoading && stops.length > 0 && (
              <div
                className="absolute bottom-3 left-3 z-[500] text-[11px] font-semibold px-3.5 py-1.5 rounded-full backdrop-blur-md border"
                style={{
                  backgroundColor: isDark ? 'rgba(24,34,32,0.85)' : 'rgba(255,255,255,0.9)',
                  color: isDark ? '#F1EEE4' : '#173B32',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  boxShadow: cardShadow,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <IconRoute size={12} />
                  {stops.length} stops · {routePath.length > 1 ? routePath.slice(1).reduce((sum, curr, i) => sum + haversineDistance(routePath[i], curr), 0).toFixed(2) : '0.00'} km
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}