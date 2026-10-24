import { useEffect, useState } from 'react';
import { getDelayNote } from '../api/aiApi';

const IconClock = ({ size = 18, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconSparkle = ({ size = 18, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </svg>
);

const IconChevronDown = ({ size = 18, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* The page that renders this card defines these CSS variables via its light/dark token object;
   the fallbacks keep the card readable if a variable is missing. */
const C = {
  surface: 'var(--bg-surface, #FFFFFF)',
  border: 'var(--border, #E1D9C8)',
  text: 'var(--text-primary, #173B32)',
  muted: 'var(--text-muted, #7A7566)',
  eta: 'var(--accent-eta, #D59A3A)',
  badgeBg: 'var(--badge-eta-bg, #F6E9CE)',
  badgeText: 'var(--badge-eta-text, #8A6423)',
};

const REFRESH_MS = 2 * 60 * 1000; // matches the server cache, so a bus that becomes late shows up without a reload

export function DelayNoteView({ data }) {
  const [showData, setShowData] = useState(false);
  if (!data || !data.note) return null;
  const m = data.metrics || {};
  const isAi = data.source === 'ai';

  return (
    <div
      className="rounded-[14px] p-5"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.eta}` }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.text }}>
          <IconClock size={14} style={{ color: C.eta }} />
          Delay summary
        </span>
        <span
          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: C.badgeBg, color: C.badgeText }}
        >
          {isAi && <IconSparkle size={10} />}
          {isAi ? 'AI-written' : 'Auto summary'}
        </span>
      </div>

      <p className="text-sm" style={{ color: C.text }}>{data.note}</p>
      <p className="text-[11px] mt-2" style={{ color: C.muted }}>
        Based only on this system's own tracking data.
      </p>

      <button
        onClick={() => setShowData((prev) => !prev)}
        aria-expanded={showData}
        className="inline-flex items-center gap-1 text-xs mt-2 font-medium"
        style={{ color: C.eta }}
      >
        {showData ? 'Hide data' : 'View data'}
        <IconChevronDown size={12} className={`transition-transform ${showData ? 'rotate-180' : ''}`} />
      </button>

      {showData && (
        <div className="mt-2 text-xs space-y-1" style={{ color: C.muted }}>
          <p>Stop: {m.stopName} · Scheduled: {m.scheduledTime} · Arrived: {m.arrivedAt} · Delay: {m.delayMinutes} min</p>
          <p>Average moving speed today: {m.todayAvgMovingSpeedKmh ?? 'n/a'} km/h</p>
          <p>Average moving speed, previous 7 days: {m.last7DaysAvgMovingSpeedKmh ?? 'no history yet'} km/h</p>
        </div>
      )}
    </div>
  );
}

/** Fetches the note; renders nothing when there is no significant delay. */
export default function DelayNoteCard({ deviceId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!deviceId) return undefined;
    let cancelled = false;

    function load() {
      getDelayNote(deviceId)
        .then((d) => { if (!cancelled) setData(d); })
        .catch(() => { if (!cancelled) setData(null); });
    }

    setData(null);
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [deviceId]);

  return <DelayNoteView data={data} />;
}