// client/src/features/search/components/GlobalSearchModal.jsx
import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { useTheme } from '../../../app/ThemeContext';

/* ─── SVG Icons ─── */
const IconSearch = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconBus = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
  </svg>
);

const IconMapPin = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconBell = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconSparkles = ({ size = 28, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const IconEmpty = ({ size = 28, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconChevronRight = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconX = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconCommand = ({ size = 12, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
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
  '--accent-critical': '#B94A3A',
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
  '--accent-critical': '#C15D4C',
};

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const [query, setQuery] = useState('');
  const { results, isSearching } = useGlobalSearch(query);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const allItems = useMemo(() => {
    const items = [];
    if (results.devices.length > 0) {
      items.push({ kind: 'header', label: 'Buses', Icon: IconBus });
      results.devices.forEach((d) => items.push({ kind: 'device', data: d }));
    }
    if (results.geofences.length > 0) {
      items.push({ kind: 'header', label: 'Stops', Icon: IconMapPin });
      results.geofences.forEach((g) => items.push({ kind: 'geofence', data: g }));
    }
    if (results.notifications.length > 0) {
      items.push({ kind: 'header', label: 'Notifications', Icon: IconBell });
      results.notifications.forEach((n) => items.push({ kind: 'notification', data: n }));
    }
    return items;
  }, [results]);

  const selectableItems = useMemo(() => allItems.filter((i) => i.kind !== 'header'), [allItems]);
  const selectableCount = selectableItems.length;

  useEffect(() => { setSelectedIndex(-1); }, [query]);

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  function goToItem(item) {
    if (item.kind === 'device') goTo(`/devices/${item.data._id}`);
    else if (item.kind === 'geofence') goTo('/stops');
    else if (item.kind === 'notification') goTo('/notifications');
  }

  function goTo(path) {
    navigate(path);
    onClose();
  }

  function handleInputKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, selectableCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = selectableItems[selectedIndex];
      if (item) goToItem(item);
    }
  }

  if (!isOpen) return null;

  let selectableIdx = -1;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-start justify-center pt-[15vh] px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.1)',
        }}
      >
        {/* ─── Input ─── */}
        <div className="relative flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <IconSearch size={20} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
          
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search buses, stops, notifications…"
            className="flex-1 bg-transparent py-1 text-lg font-medium focus:outline-none focus:ring-0"
            style={{
              color: 'var(--text-primary)',
              caretColor: 'var(--accent-primary)',
            }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
          />

          {query ? (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-black/5 flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              <IconX size={14} />
            </button>
          ) : (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              <IconCommand size={10} />
              K
            </div>
          )}
        </div>

        {/* ─── Results ─── */}
                {/* ─── Results ─── */}
        <div
          ref={listRef}
          className="max-h-[460px] overflow-y-auto overflow-x-hidden py-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--border) transparent',
          }}
        >
          <style>{`
            .search-scroll::-webkit-scrollbar { width: 6px; }
            .search-scroll::-webkit-scrollbar-track { background: transparent; }
            .search-scroll::-webkit-scrollbar-thumb { background-color: var(--border); border-radius: 20px; }
            .search-scroll::-webkit-scrollbar:horizontal { display: none !important; height: 0 !important; }
          `}</style>
          
          {!query.trim() && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--accent-primary)' + '12', color: 'var(--accent-primary)' }}
              >
                <IconSparkles size={30} />
              </div>
              <p className="text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>
                Start typing to search
              </p>
              <p className="text-[13px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Find buses, stops, and notifications instantly.
              </p>
            </div>
          )}

          {query.trim() && isSearching && (
            <div className="flex flex-col items-center justify-center py-14">
              <div
                className="w-8 h-8 rounded-full border-[2.5px] animate-spin"
                style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
              />
              <p className="text-[13px] font-medium mt-4" style={{ color: 'var(--text-muted)' }}>Searching…</p>
            </div>
          )}

          {query.trim() && !isSearching && allItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }}
              >
                <IconEmpty size={30} />
              </div>
              <p className="text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>No results found</p>
              <p className="text-[13px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                No matches for "<span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{query}</span>".
              </p>
            </div>
          )}

          {allItems.map((item, idx) => {
            if (item.kind === 'header') {
              return (
                <div
                  key={`h-${item.label}-${idx}`}
                  className="flex items-center gap-2.5 px-5 py-2.5 mt-2 first:mt-0"
                >
                  <item.Icon size={13} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                    {item.label}
                  </p>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)', opacity: 0.6 }} />
                </div>
              );
            }

            selectableIdx++;
            const isSelected = selectableIdx === selectedIndex;
            const accentColor = item.kind === 'device'
              ? 'var(--accent-primary)'
              : item.kind === 'geofence'
                ? 'var(--accent-eta)'
                : 'var(--accent-critical)';

            return (
              <button
                key={item.data._id}
                data-index={selectableIdx}
                onMouseEnter={() => setSelectedIndex(selectableIdx)}
                onClick={() => goToItem(item)}
                className="group relative w-full text-left flex items-center gap-3.5 mx-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                style={{
                  backgroundColor: isSelected ? 'var(--bg-page)' : 'transparent',
                  color: 'var(--text-primary)',
                }}
              >
                {isSelected && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                )}

                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    backgroundColor: isSelected ? accentColor + '20' : accentColor + '12',
                    color: accentColor,
                  }}
                >
                  {item.kind === 'device' && <IconBus size={16} />}
                  {item.kind === 'geofence' && <IconMapPin size={16} />}
                  {item.kind === 'notification' && <IconBell size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate">{item.data.name || item.data.title}</p>
                  {item.kind === 'device' && item.data.identifier && (
                    <p className="text-[11px] truncate mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {item.data.identifier}
                    </p>
                  )}
                  {item.kind === 'geofence' && (
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Geofence stop
                    </p>
                  )}
                  {item.kind === 'notification' && (
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {item.data.message || 'Notification'}
                    </p>
                  )}
                </div>

                <IconChevronRight
                  size={14}
                  className="flex-shrink-0 transition-all duration-200"
                  style={{
                    color: 'var(--text-muted)',
                    opacity: isSelected ? 1 : 0,
                    transform: isSelected ? 'translateX(0)' : 'translateX(-4px)',
                  }}
                />
              </button>
            );
          })}
        </div>
        </div>

       
      </div>
  );
}