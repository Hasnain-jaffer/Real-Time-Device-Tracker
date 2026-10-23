// client/src/features/ai/components/AskBar.jsx
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../app/ThemeContext';
import { searchRoutesAI } from '../api/aiApi';

/* ═══════════════════════════════════════════
   INLINE SVG ICONS — no extra deps
   ═══════════════════════════════════════════ */
const IconSparkle = ({ size = 18, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </svg>
);

const IconSearch = ({ size = 18, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconClose = ({ size = 18, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconSpinner = ({ size = 18, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IconBus = ({ size = 18, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
  </svg>
);

const IconArrowRight = ({ size = 18, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconAlert = ({ size = 18, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ═══════════════════════════════════════════
   DESIGN TOKENS (Forest & Sand)
   ═══════════════════════════════════════════ */
const lightTokens = {
  '--ask-surface': '#FFFFFF',
  '--ask-border': '#E1D9C8',
  '--ask-text': '#173B32',
  '--ask-muted': '#6B7A72',
  '--ask-accent': '#5E8C61',
  '--ask-accent-soft': '#E8F0E6',
  '--ask-amber-bg': '#F6E9CE',
  '--ask-amber-text': '#8A6423',
  '--ask-critical': '#B94A3A',
};

const darkTokens = {
  '--ask-surface': '#182220',
  '--ask-border': 'rgba(255,255,255,0.08)',
  '--ask-text': '#F1EEE4',
  '--ask-muted': '#8A9690',
  '--ask-accent': '#79B37C',
  '--ask-accent-soft': 'rgba(121,179,124,0.15)',
  '--ask-amber-bg': 'rgba(213,154,58,0.15)',
  '--ask-amber-text': '#E3B15E',
  '--ask-critical': '#E07A6A',
};

const MAX_LENGTH = 200;

function errorMessageFor(err) {
  const status = err?.response?.status;
  if (status === 429) return 'Too many questions. Please wait a minute and try again.';
  if (status === 400) return err.response?.data?.message || 'Please type a shorter question.';
  return 'Could not search right now. Please try again.';
}

/* ═══════════════════════════════════════════
   RESULTS LIST (exported so it can be reused / tested)
   ═══════════════════════════════════════════ */
export function AskResults({ result }) {
  const routes = result?.matchedRoutes || [];
  const isText = result?.source === 'text';

  return (
    <div className="mt-3 rounded-2xl border p-3" style={{ backgroundColor: 'var(--ask-surface)', borderColor: 'var(--ask-border)' }} aria-live="polite">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ask-muted)' }}>
          {routes.length === 1 ? '1 matching route' : `${routes.length} matching routes`}
        </span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none"
          style={isText
            ? { backgroundColor: 'var(--ask-amber-bg)', color: 'var(--ask-amber-text)' }
            : { backgroundColor: 'var(--ask-accent-soft)', color: 'var(--ask-accent)' }}
        >
          {isText ? 'Text match' : 'AI match'}
        </span>
      </div>

      {isText && (
        <p className="text-[11px] mb-2" style={{ color: 'var(--ask-muted)' }}>
          The AI assistant is unavailable, so these are plain text matches.
        </p>
      )}

      {routes.length === 0 ? (
        <p className="text-[13px] py-1" style={{ color: 'var(--ask-muted)' }}>
          No matching routes. Try a stop name, a route name or a bus name.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {routes.map((route) => (
            <li key={route._id}>
              <Link
                to={`/routes/${route._id}`}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-black/[0.03]"
                style={{ color: 'var(--ask-text)' }}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: route.color || 'var(--ask-accent)' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate">{route.name}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--ask-muted)' }}>
                    {route.stops.length === 0 ? 'No stops yet' : `${route.stops.length} stops: ${route.stops.slice(0, 3).join(', ')}${route.stops.length > 3 ? '...' : ''}`}
                  </p>
                  {route.buses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {route.buses.map((bus) => (
                        <span
                          key={bus._id}
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--ask-accent-soft)', color: 'var(--ask-text)' }}
                        >
                          <IconBus size={11} />
                          {bus.name}
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: bus.status === 'online' ? 'var(--ask-accent)' : 'var(--ask-muted)' }}
                            aria-label={bus.status === 'online' ? 'online' : 'offline'}
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <IconArrowRight size={16} className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ASK BAR
   ═══════════════════════════════════════════ */
export default function AskBar() {
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const requestId = useRef(0); // ignores a slow response that arrives after a newer question

  async function handleAsk() {
    const trimmed = query.trim();
    if (trimmed.length < 2 || status === 'loading') return;

    const myRequest = ++requestId.current;
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await searchRoutesAI(trimmed);
      if (myRequest !== requestId.current) return;
      setResult(data);
      setStatus('done');
    } catch (err) {
      if (myRequest !== requestId.current) return;
      setErrorMsg(errorMessageFor(err));
      setStatus('error');
    }
  }

  function handleClear() {
    requestId.current++;
    setQuery('');
    setResult(null);
    setErrorMsg('');
    setStatus('idle');
  }

  const isLoading = status === 'loading';

  return (
    <div style={tokens}>
      <div
        className="flex items-center gap-2 rounded-2xl border pl-3 pr-1.5 py-1.5"
        style={{ backgroundColor: 'var(--ask-surface)', borderColor: 'var(--ask-border)' }}
      >
        <IconSparkle size={18} className="flex-shrink-0" style={{ color: 'var(--ask-accent)' }} />
        <input
          type="text"
          value={query}
          maxLength={MAX_LENGTH}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(); }}
          placeholder="Ask: which bus goes to the library?"
          aria-label="Ask which bus or route to take"
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px] py-2"
          style={{ color: 'var(--ask-text)' }}
        />
        {query && !isLoading && (
          <button onClick={handleClear} aria-label="Clear" className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" style={{ color: 'var(--ask-muted)' }}>
            <IconClose size={16} />
          </button>
        )}
        <button
          onClick={handleAsk}
          disabled={isLoading || query.trim().length < 2}
          aria-label="Search"
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-xl transition-opacity disabled:opacity-50"
          style={{ backgroundColor: 'var(--ask-accent)', color: '#FFFFFF' }}
        >
          {isLoading ? <IconSpinner size={14} className="animate-spin" /> : <IconSearch size={14} />}
          Ask
        </button>
      </div>

      {status === 'error' && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border px-3 py-2.5" style={{ backgroundColor: 'var(--ask-surface)', borderColor: 'var(--ask-border)' }} role="alert">
          <IconAlert size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--ask-critical)' }} />
          <p className="text-[12px]" style={{ color: 'var(--ask-text)' }}>{errorMsg}</p>
        </div>
      )}

      {status === 'done' && result && <AskResults result={result} />}
    </div>
  );
}