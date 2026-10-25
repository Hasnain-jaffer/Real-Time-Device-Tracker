// client/src/features/ai/components/AiSearchResults.jsx
import { Link } from 'react-router-dom';

/* ═══════════ INLINE SVG ICONS ═══════════ */
const IconSparkle = ({ size = 12, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </svg>
);

const IconMapPin = ({ size = 13, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconBus = ({ size = 13, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M6 18v2" />
    <path d="M18 18v2" />
    <path d="M6 10h12" />
  </svg>
);

const IconClose = ({ size = 12, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconArrowRight = ({ size = 12, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

function Group({ title, children }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function AiSearchResults({ results, onClose }) {
  if (!results) return null;
  const { routes = [], stops = [], buses = [], source, error } = results;
  const isEmpty = !routes.length && !stops.length && !buses.length;
  const linkStyle = { color: 'var(--accent-primary)' };
  const mutedStyle = { color: 'var(--text-muted)' };

  return (
    <div className="rounded-xl p-3 mt-2" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] flex items-center gap-1" style={mutedStyle}>
          {error ? (
            'Search unavailable'
          ) : source === 'ai' ? (
            <>
              <IconSparkle size={11} style={{ color: 'var(--accent-primary)' }} />
              AI match
            </>
          ) : (
            'Text match (AI unavailable)'
          )}
        </span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-black/5 transition-colors" style={mutedStyle} aria-label="Close results">
          <IconClose size={12} />
        </button>
      </div>

      {error ? (
        <p className="text-xs" style={{ color: 'var(--accent-critical)' }}>{error}</p>
      ) : isEmpty ? (
        <p className="text-xs" style={mutedStyle}>No matching routes, stops or buses found.</p>
      ) : (
        <>
          {routes.length > 0 && (
            <Group title="Routes">
              {routes.map((r) => (
                <Link key={r._id} to={`/routes/${r._id}`} className="flex items-center gap-1.5 text-sm py-0.5 transition-opacity hover:opacity-70" style={linkStyle}>
                  <IconArrowRight size={11} />
                  {r.name}
                </Link>
              ))}
            </Group>
          )}
          {stops.length > 0 && (
            <Group title="Stops">
              {stops.map((s) => (
                <Link key={s._id} to={`/routes/${s.routeId}`} className="flex items-center gap-1.5 text-sm py-0.5 transition-opacity hover:opacity-70" style={linkStyle}>
                  <IconMapPin size={12} style={{ color: 'var(--accent-primary)' }} />
                  {s.name}
                  <span style={mutedStyle}>· {s.routeName}</span>
                </Link>
              ))}
            </Group>
          )}
          {buses.length > 0 && (
            <Group title="Buses">
              {buses.map((b) => (
                <Link key={b._id} to={`/devices/${b._id}`} className="flex items-center gap-1.5 text-sm py-0.5 transition-opacity hover:opacity-70" style={linkStyle}>
                  <IconBus size={12} style={{ color: 'var(--accent-primary)' }} />
                  {b.name}
                  <span style={mutedStyle}>
                    · {b.status === 'online' ? 'Live' : 'Offline'}
                  </span>
                </Link>
              ))}
            </Group>
          )}
        </>
      )}
    </div>
  );
}