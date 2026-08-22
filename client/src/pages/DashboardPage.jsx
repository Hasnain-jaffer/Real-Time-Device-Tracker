// client/src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../app/AuthContext';
import { useSocket } from '../app/SocketProvider';
import { useTheme } from '../app/ThemeContext';
import apiClient from '../lib/apiClient';

/* ─── Inline SVG Icons (no extra deps) ─── */
const IconBus = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 6v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M16 15a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2" />
    <path d="M4 10h16v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z" />
    <path d="M6 17v3" /><path d="M18 17v3" /><path d="M6 10V6h12v4" />
  </svg>
);

const IconClock = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconShield = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconSearch = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconBell = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconChevronRight = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconMapPin = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconCheckCircle = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconMapEmpty = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

/* ─── Theme tokens ─── */
const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--bg-surface': '#FFFFFF',
  '--bg-sidebar': '#173B32',
  '--border': '#E1D9C8',
  '--text-primary': '#173B32',
  '--text-secondary': '#5B6B5F',
  '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61',
  '--accent-critical': '#B94A3A',
  '--badge-success-bg': '#EAF3DE',
  '--badge-success-text': '#3B6D26',
  '--badge-eta-bg': '#F6E9CE',
  '--badge-eta-text': '#8A6423',
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
  '--accent-critical': '#C15D4C',
  '--badge-success-bg': 'rgba(94,140,97,0.15)',
  '--badge-success-text': '#79B37C',
  '--badge-eta-bg': 'rgba(213,154,58,0.15)',
  '--badge-eta-text': '#E3B15E',
};

/* ─── Card shadow helper ─── */
const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function DashboardPage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  useEffect(() => {
    apiClient.get('/devices').then(({ data }) => {
      setDevices(data.devices);
      setFocused(data.devices.find((d) => d.status === 'online') || data.devices[0] || null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    apiClient.get('/notifications').then(({ data }) => setUnreadCount(data.unreadCount)).catch(() => {});
  }, []);

  useEffect(() => {
    function handleReceiveLocation(data) {
      const { deviceId, latitude, longitude } = data;
      if (!deviceId) return;
      setDevices((prev) =>
        prev.map((d) =>
          d._id === deviceId
            ? { ...d, status: 'online', lastLocation: { latitude, longitude }, lastSeenAt: new Date() }
            : d
        )
      );
      setFocused((prev) =>
        prev && prev._id === deviceId
          ? { ...prev, lastLocation: { latitude, longitude }, lastSeenAt: new Date() }
          : prev
      );
    }
    socket.on('receive-location', handleReceiveLocation);
    return () => socket.off('receive-location', handleReceiveLocation);
  }, [socket]);

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const results = query.trim()
    ? devices.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.identifier?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const tileUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const pulsingIcon = L.divIcon({
    className: '',
    html: `<div class="dash-pulse-marker" style="background:${tokens['--accent-primary']}"></div>`,
    iconSize: [18, 18],
  });

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <style>{`
        .dash-pulse-marker {
          width: 18px; height: 18px; border-radius: 50%; position: relative;
        }
        .dash-pulse-marker::after {
          content: ''; position: absolute; inset: -8px; border-radius: 50%;
          background: inherit; animation: dashPulse 1.5s ease-out infinite;
        }
        @keyframes dashPulse {
          0% { transform: scale(0.6); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ═══════════════════════════════════════
            1. HEADER
           ═══════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              {onlineCount} bus{onlineCount !== 1 ? 'es' : ''} live · {isConnected ? 'All systems normal' : 'Reconnecting…'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:w-72">
              <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search buses, routes, stops…"
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  boxShadow: cardShadow,
                  '--tw-ring-color': 'var(--accent-primary)',
                }}
              />
              {results.length > 0 && (
                <div
                  className="absolute left-0 right-0 mt-2 rounded-xl overflow-hidden z-20 shadow-xl"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  {results.map((d) => (
                    <button
                      key={d._id}
                      onClick={() => { setFocused(d); setQuery(''); }}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span>{d.name} {d.identifier && <span style={{ color: 'var(--text-muted)' }}>· {d.identifier}</span>}</span>
                      <span style={{ color: d.status === 'online' ? 'var(--accent-primary)' : 'var(--text-muted)', fontSize: '12px' }}>
                        {d.status === 'online' ? 'Live' : 'Offline'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/notifications')}
              className="relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform active:scale-95"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
              aria-label="Notifications"
            >
              <IconBell size={18} style={{ color: 'var(--text-secondary)' }} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--badge-eta-bg)', color: 'var(--badge-eta-text)' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            2. STATUS STRIP
           ═══════════════════════════════════════ */}
        <div
          className="rounded-2xl px-5 py-4 flex flex-wrap items-center gap-6 sm:gap-10"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(94,140,97,0.10)' }}>
              <IconBus size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Active buses</p>
              <p className="text-[15px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{devices.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(213,154,58,0.10)' }}>
              <IconClock size={18} style={{ color: 'var(--badge-eta-text)' }} />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>On-time</p>
              <p className="text-[15px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{onlineCount}/{devices.length || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: isConnected ? 'rgba(94,140,97,0.10)' : 'rgba(185,74,58,0.10)' }}>
              <IconShield size={18} style={{ color: isConnected ? 'var(--accent-primary)' : 'var(--accent-critical)' }} />
            </div>
            <div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Service status</p>
              <p className="text-[15px] font-bold leading-tight" style={{ color: isConnected ? 'var(--accent-primary)' : 'var(--accent-critical)' }}>
                {isConnected ? 'Operational' : 'Degraded'}
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            3. HERO ROW
           ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.25fr] gap-5">

          {/* ── Next bus card ── */}
          <div
            className="rounded-2xl p-5 sm:p-6 flex flex-col h-full"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Your next bus
              </span>
              {focused && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--badge-success-bg)' }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--badge-success-text)' }} />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: 'var(--badge-success-text)' }} />
                  </span>
                  <span className="text-[11px] font-bold" style={{ color: 'var(--badge-success-text)' }}>Live</span>
                </div>
              )}
            </div>

            {focused ? (
              <>
                <div className="flex-1">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{focused.name}</h3>
                  <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                    {focused.identifier}
                    {focused.lastSeenAt && ` · Updated ${new Date(focused.lastSeenAt).toLocaleTimeString()}`}
                  </p>
                </div>

                <button
                  onClick={() => navigate('/tracking')}
                  className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  Open live tracking
                  <IconChevronRight size={16} />
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--bg-page)' }}>
                  <IconBus size={24} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No buses registered yet</p>
              </div>
            )}
          </div>

         {/* Live map */}
<div
  className="relative rounded-2xl overflow-hidden"
  style={{ height: '300px', border: '1px solid var(--border)', boxShadow: cardShadow }}
>
  {focused?.lastLocation?.latitude ? (
    <>
      <MapContainer
        key={`map-${focused._id}`}  // forces clean remount per device
        center={[focused.lastLocation.latitude, focused.lastLocation.longitude]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          // Leaflet must recalculate after React paint
          requestAnimationFrame(() => map.invalidateSize());
        }}
        dragging={false}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
      >
        <TileLayer url={tileUrl} />
        <Marker
          position={[focused.lastLocation.latitude, focused.lastLocation.longitude]}
          icon={pulsingIcon}
        />
      </MapContainer>

      {/* Overlays */}
      <div className="absolute top-3 left-3 flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#FFFFFF' }}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
        </span>
        {focused.name} live
      </div>

      <div className="absolute bottom-3 left-3 text-[11px] font-medium px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#FFFFFF' }}>
        {focused.lastSeenAt ? `Updated ${new Date(focused.lastSeenAt).toLocaleTimeString()}` : 'Waiting…'}
      </div>

      <button
        onClick={() => navigate('/tracking')}
        className="absolute bottom-3 right-3 text-xs font-bold px-4 py-2 rounded-xl text-white hover:opacity-90 active:scale-95 transition-all"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      >
        Open live tracking
      </button>
    </>
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <IconMapEmpty size={36} style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No live position yet</p>
    </div>
  )}
</div>
        </div>

        {/* ═══════════════════════════════════════
            4. FOOTER ROW
           ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Live right now */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Live right now</p>
            
            {devices.filter((d) => d.status === 'online').length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--bg-page)' }}>
                  <IconBus size={24} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No buses live right now</p>
              </div>
            ) : (
              <div className="space-y-1">
                {devices.filter((d) => d.status === 'online').slice(0, 5).map((d) => (
                  <div key={d._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-black/[0.03] transition-colors cursor-pointer"
                    onClick={() => setFocused(d)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--badge-success-bg)' }}>
                        <IconBus size={14} style={{ color: 'var(--badge-success-text)' }} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                      <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>Live</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service alerts */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Service alerts</p>
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--badge-success-bg)' }}>
                <IconCheckCircle size={24} style={{ color: 'var(--badge-success-text)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No active alerts</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Everything is running smoothly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}