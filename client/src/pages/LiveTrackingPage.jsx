// client/src/pages/LiveTrackingPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTrackedDevices } from '../features/tracking/hooks/useTrackedDevices';
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
  '--accent-eta': '#E3B15E',
  '--badge-eta-bg': 'rgba(213,154,58,0.15)',
  '--badge-eta-text': '#E3B15E',
};

function RecenterControl({ position, requestId }) {
  const map = useMap();
  function recenter() {
    if (position) map.setView(position, map.getZoom());
  }
  RecenterControl.recenter = recenter;
  return null;
}

export default function LiveTrackingPage() {
  const { trackedDevices } = useTrackedDevices();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState(null);
  const [query, setQuery] = useState('');

  const tokens = theme === 'dark' ? darkTokens : lightTokens;
  const tileUrl =
    theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const selected =
    trackedDevices.find((d) => d.key === selectedKey) ||
    trackedDevices.find((d) => d.isRegistered) ||
    trackedDevices[0] ||
    null;

  const filteredList = query.trim()
    ? trackedDevices.filter(
        (d) => d.name.toLowerCase().includes(query.toLowerCase()) || d.identifier?.toLowerCase().includes(query.toLowerCase())
      )
    : trackedDevices;

  const pulsingIcon = L.divIcon({
    className: '',
    html: `<div class="lt-pulse-marker" style="background:${tokens['--accent-primary']}"></div>`,
    iconSize: [18, 18],
  });

  const position = selected ? [selected.latitude, selected.longitude] : null;

  return (
<div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">        <style>{`
        .lt-pulse-marker { width: 18px; height: 18px; border-radius: 50%; position: relative; }
        .lt-pulse-marker::after {
          content: ''; position: absolute; inset: -8px; border-radius: 50%;
          background: inherit; opacity: 0.2; animation: ltPulse 1.5s ease-out infinite;
        }
        @keyframes ltPulse { 0% { transform: scale(0.6); opacity: 0.4; } 100% { transform: scale(2.5); opacity: 0; } }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-4">
        {/* 1. Header row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Live tracking
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {selected ? `${selected.name}${selected.identifier ? ` · ${selected.identifier}` : ''} — currently selected` : 'No bus selected'}
            </p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bus or route"
            className="w-full lg:w-64 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* 2. Map hero */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{ height: '380px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-page)' }}
        >
          {position ? (
            <>
              <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <TileLayer url={tileUrl} />
                <Marker position={position} icon={pulsingIcon} />
                <RecenterControl position={position} />
              </MapContainer>

              <div
                className="absolute top-2 left-2 px-3 py-2 rounded-[9px] text-xs"
                style={{ backgroundColor: 'rgba(23,59,50,0.88)', color: '#FFFFFF' }}
              >
                <p className="font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                  {selected.name}
                </p>
                <p className="opacity-80 mt-0.5">
                  {selected.speedKmh != null ? `${selected.speedKmh.toFixed(0)} km/h` : '— km/h'} · ETA —
                </p>
              </div>

              <div
                className="absolute bottom-2 left-2 px-3 py-1.5 rounded-[9px] text-[10px]"
                style={{ backgroundColor: 'rgba(23,59,50,0.88)', color: '#FFFFFF' }}
              >
                Updated {selected.updatedAt ? new Date(selected.updatedAt).toLocaleTimeString() : '—'}
              </div>

              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  onClick={() => RecenterControl.recenter?.()}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  Recenter
                </button>
                <button
                  onClick={() => navigate('/history')}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  View history
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1">
              <span style={{ fontSize: '24px' }}>🗺️</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No live position yet</p>
            </div>
          )}
        </div>

        {/* 3. Two-column row */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
          {/* All buses */}
          <div className="rounded-xl p-2" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium px-3 py-2" style={{ color: 'var(--text-muted)' }}>All buses</p>
            <div className="space-y-1">
              {filteredList.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No buses found.</p>
              ) : (
                filteredList.map((d) => {
                  const isSelected = selected?.key === d.key;
                  const isOnline = !!d.isRegistered || d.speedKmh != null || true; // presence in trackedDevices implies currently reporting
                  return (
                    <button
                      key={d.key}
                      onClick={() => setSelectedKey(d.key)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors duration-150"
                      style={{
                        backgroundColor: isSelected ? 'rgba(94,140,97,0.12)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      }}
                    >
                      <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                        {d.name} {d.identifier && <span style={{ color: 'var(--text-muted)' }}>· {d.identifier}</span>}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {d.speedKmh != null ? `${d.speedKmh.toFixed(0)} km/h` : 'Live'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected bus details */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Selected bus details</p>
            {selected ? (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>On time</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Speed</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {selected.speedKmh != null ? `${selected.speedKmh.toFixed(0)} km/h` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Next stop</span>
                  <span style={{ color: 'var(--text-primary)' }}>—</span>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a bus to see details.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}