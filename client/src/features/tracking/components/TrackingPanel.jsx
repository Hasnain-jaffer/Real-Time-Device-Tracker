// client/src/features/tracking/components/TrackingPanel.jsx
import { useState } from 'react';

/* ─── SVG Icons ─── */
const IconSearch = ({ size = 15, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconEye = ({ size = 15, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = ({ size = 15, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconBus = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
  </svg>
);

const IconSignal = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
  </svg>
);

const IconEmpty = ({ size = 32, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function TrackingPanel({ devices, hiddenIds, onToggleVisibility, onSelectDevice, selectedKey, tokens = {} }) {
  const [search, setSearch] = useState('');

  const surface = tokens['--bg-surface'] || '#FFFFFF';
  const page = tokens['--bg-page'] || '#F4EFE6';
  const border = tokens['--border'] || '#E1D9C8';
  const textPrimary = tokens['--text-primary'] || '#173B32';
  const textSecondary = tokens['--text-secondary'] || '#5B6B5F';
  const textMuted = tokens['--text-muted'] || '#9C8F73';
  const accent = tokens['--accent-primary'] || '#5E8C61';
  const badgeSuccessBg = tokens['--badge-success-bg'] || '#EAF3DE';
  const badgeSuccessText = tokens['--badge-success-text'] || '#3B6D26';

  const filtered = devices.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.identifier || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="rounded-2xl flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}
    >
      {/* Header */}
      <div className="p-4 space-y-3" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold" style={{ color: textPrimary }}>
            Tracked buses
          </h2>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-md"
            style={{ backgroundColor: page, color: textMuted }}
          >
            {devices.length}
          </span>
        </div>

        <div className="relative">
          <IconSearch
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: textMuted }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search buses…"
            aria-label="Search tracked buses"
            className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-[1.5px] transition-all"
            style={{
              backgroundColor: page,
              border: `1px solid ${border}`,
              color: textPrimary,
              '--tw-ring-color': accent,
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: page }}
            >
              <IconEmpty size={24} style={{ color: textMuted }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: textPrimary }}>
              {devices.length === 0 ? 'No buses online' : 'No matches'}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>
              {devices.length === 0 ? 'Waiting for devices to connect…' : 'Try a different search term'}
            </p>
          </div>
        ) : (
          filtered.map((device) => {
            const isHidden = hiddenIds.has(device.key);
            const isSelected = selectedKey === device.key;

            return (
              <div
                key={device.key}
                onClick={() => onSelectDevice(device.key)}
                className="rounded-xl p-3 cursor-pointer transition-all"
                style={{
                  backgroundColor: isSelected ? accent + '12' : 'transparent',
                  border: `1px solid ${isSelected ? accent + '40' : 'transparent'}`,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = page;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: badgeSuccessText }}
                      />
                      <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                        {device.name}
                      </p>
                    </div>
                    {device.identifier && (
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: textMuted }}>
                        {device.identifier}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(device.key);
                    }}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-black/5 flex-shrink-0"
                    style={{ color: isHidden ? textMuted : textSecondary }}
                    aria-label={isHidden ? 'Show on map' : 'Hide from map'}
                  >
                    {isHidden ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1" style={{ color: textMuted }}>
                    <IconSignal size={12} />
                    <span className="text-[11px] font-medium">
                      {device.speedKmh != null ? `${device.speedKmh.toFixed(0)} km/h` : '—'}
                    </span>
                  </div>
                  <span style={{ color: border }}>·</span>
                  <span className="text-[11px]" style={{ color: textMuted }}>
                    {device.updatedAt ? new Date(device.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}