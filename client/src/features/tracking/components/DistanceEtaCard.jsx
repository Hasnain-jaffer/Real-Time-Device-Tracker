// client/src/features/tracking/components/DistanceEtaCard.jsx
import { haversineMeters, formatDistance, estimateEtaMinutes, formatEta } from '../utils/geoMath';

/* ─── SVG Icons ─── */
const IconMapPin = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconNavigation = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const IconClock = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconGauge = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 2v4" /><path d="M12 18a6 6 0 0 0 6-6c0-1-.5-2.5-1.5-3.5" /><path d="M12 18a6 6 0 0 1-6-6c0-1 .5-2.5 1.5-3.5" />
  </svg>
);

const IconLocationOff = ({ size = 40, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /><line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function DistanceEtaCard({ userPosition, device, tokens = {} }) {
  const surface = tokens['--bg-surface'] || '#FFFFFF';
  const page = tokens['--bg-page'] || '#F4EFE6';
  const border = tokens['--border'] || '#E1D9C8';
  const textPrimary = tokens['--text-primary'] || '#173B32';
  const textSecondary = tokens['--text-secondary'] || '#5B6B5F';
  const textMuted = tokens['--text-muted'] || '#9C8F73';
  const accent = tokens['--accent-primary'] || '#5E8C61';
  const accentEta = tokens['--accent-eta'] || '#D59A3A';

  if (!userPosition) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ backgroundColor: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: page }}>
          <IconLocationOff size={20} style={{ color: textMuted }} />
        </div>
        <p className="text-sm font-medium" style={{ color: textSecondary }}>
          Enable location access to see your distance from this bus.
        </p>
      </div>
    );
  }

  if (!device) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ backgroundColor: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: page }}>
          <IconMapPin size={20} style={{ color: textMuted }} />
        </div>
        <p className="text-sm font-medium" style={{ color: textSecondary }}>
          Select a bus to see distance and ETA.
        </p>
      </div>
    );
  }

  const distanceMeters = haversineMeters(
    [userPosition.latitude, userPosition.longitude],
    [device.latitude, device.longitude]
  );
  const etaMinutes = estimateEtaMinutes(distanceMeters, device.speedKmh);

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ backgroundColor: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accent + '18', color: accent }}
        >
          <IconNavigation size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: textPrimary }}>
            {device.name}
          </p>
          {device.identifier && (
            <p className="text-[11px] truncate" style={{ color: textMuted }}>
              {device.identifier}
            </p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-3.5 space-y-1"
          style={{ backgroundColor: page, border: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-1.5">
            <IconMapPin size={13} style={{ color: textMuted }} />
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>Distance</p>
          </div>
          <p className="text-xl font-bold tracking-tight" style={{ color: textPrimary }}>
            {formatDistance(distanceMeters)}
          </p>
        </div>

        <div
          className="rounded-xl p-3.5 space-y-1"
          style={{ backgroundColor: page, border: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-1.5">
            <IconClock size={13} style={{ color: textMuted }} />
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>ETA</p>
          </div>
          <p className="text-xl font-bold tracking-tight" style={{ color: accentEta }}>
            {formatEta(etaMinutes)}
          </p>
        </div>
      </div>

      {/* Footer meta */}
      <div className="space-y-1">
        {device.speedKmh != null && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: textSecondary }}>
            <IconGauge size={13} style={{ color: textMuted }} />
            <span>Current speed: <span className="font-semibold" style={{ color: textPrimary }}>{device.speedKmh.toFixed(0)} km/h</span></span>
          </div>
        )}
        {etaMinutes == null && device.speedKmh != null && (
          <p className="text-[11px] font-medium" style={{ color: textMuted }}>
            Bus appears stopped — ETA will update once it starts moving.
          </p>
        )}
      </div>
    </div>
  );
}