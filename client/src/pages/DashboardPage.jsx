// client/src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../app/AuthContext';
import { useSocket } from '../app/SocketProvider';
import { useTheme } from '../app/ThemeContext';
import apiClient from '../lib/apiClient';

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
<div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">      <style>{`
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

      <div className="max-w-5xl mx-auto space-y-5">
        {/* 1. Header row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {onlineCount} bus{onlineCount !== 1 ? 'es' : ''} live · {isConnected ? 'all systems normal' : 'reconnecting…'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-64">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search buses, routes, stops…"
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              {results.length > 0 && (
                <div
                  className="absolute left-0 right-0 mt-2 rounded-xl overflow-hidden z-10 shadow-lg"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  {results.map((d) => (
                    <button
                      key={d._id}
                      onClick={() => { setFocused(d); setQuery(''); }}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between"
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
              className="relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-[10px] font-medium px-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--badge-eta-bg)', color: 'var(--badge-eta-text)' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. Quick status strip */}
        <div
          className="rounded-xl px-5 py-3 flex flex-wrap items-center gap-x-8 gap-y-2"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div>
            <p className="text-[10.5px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>🚌 Active buses</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{devices.length}</p>
          </div>
          <div>
            <p className="text-[10.5px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>⏱️ On-time</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{onlineCount}/{devices.length || 0}</p>
          </div>
          <div>
            <p className="text-[10.5px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>🛡️ Service status</p>
            <p className="text-sm font-semibold" style={{ color: isConnected ? 'var(--accent-primary)' : 'var(--accent-critical)' }}>
              {isConnected ? 'Operational' : 'Degraded'}
            </p>
          </div>
        </div>

        {/* 3. Hero row */}
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.3fr] gap-4">
          {/* Next bus card */}
          <div
            className="rounded-xl p-4 sm:p-[18px] flex flex-col justify-between"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] uppercase font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Your next bus
                </span>
                {focused && (
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: focused.status === 'online' ? 'var(--badge-success-bg)' : 'var(--bg-page)',
                      color: focused.status === 'online' ? 'var(--badge-success-text)' : 'var(--text-muted)',
                    }}
                  >
                    {focused.status === 'online' ? 'Live' : 'Offline'}
                  </span>
                )}
              </div>

              {focused ? (
                <>
                  <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{focused.name}</p>
                  <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {focused.identifier}
                    {focused.lastSeenAt && ` · Updated ${new Date(focused.lastSeenAt).toLocaleTimeString()}`}
                  </p>
                </>
              ) : (
                <div className="text-center py-6">
                  <span style={{ fontSize: '22px' }}>🚌</span>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>No buses registered yet.</p>
                </div>
              )}
            </div>

            {focused && (
              <button
                onClick={() => navigate('/tracking')}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Open live tracking →
              </button>
            )}
          </div>

          {/* Live map */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{ height: '280px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-page)' }}
          >
            {focused?.lastLocation?.latitude ? (
              <>
                <MapContainer
                  center={[focused.lastLocation.latitude, focused.lastLocation.longitude]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                  dragging={false}
                  zoomControl={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                  touchZoom={false}
                  attributionControl={false}
                >
                  <TileLayer url={tileUrl} />
                  <Marker position={[focused.lastLocation.latitude, focused.lastLocation.longitude]} icon={pulsingIcon} />
                </MapContainer>

                <div
                  className="absolute top-2 left-2 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(23,59,50,0.85)', color: '#FFFFFF' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                  {focused.name} live
                </div>

                <div
                  className="absolute bottom-2 left-2 text-[10px] px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(23,59,50,0.85)', color: '#FFFFFF' }}
                >
                  {focused.lastSeenAt ? `Updated ${new Date(focused.lastSeenAt).toLocaleTimeString()}` : 'Waiting for location…'}
                </div>

                <button
                  onClick={() => navigate('/tracking')}
                  className="absolute bottom-2 right-2 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  Open live tracking →
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                <span style={{ fontSize: '24px' }}>🗺️</span>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No live position yet</p>
              </div>
            )}
          </div>
        </div>

        {/* 4. Footer row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Live right now</p>
            {devices.filter((d) => d.status === 'online').length === 0 ? (
              <div className="text-center py-4">
                <span style={{ fontSize: '20px' }}>🚌</span>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>No buses live right now.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.filter((d) => d.status === 'online').slice(0, 4).map((d) => (
                  <div key={d._id} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-primary)' }}>{d.name}</span>
                    <span style={{ color: 'var(--accent-primary)' }}>Live</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Service alerts</p>
            <div className="text-center py-4">
              <span style={{ fontSize: '20px' }}>✅</span>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>No active alerts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}