// client/src/features/geofences/components/GeofenceFormModal.jsx
import { useState, useEffect } from 'react';
import { useTheme } from '../../../app/ThemeContext';

const TYPE_OPTIONS = ['stop', 'home', 'office', 'custom'];

/* ─── SVG Icons ─── */
const IconMapPin = ({ size = 20, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconLocate = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconPlus = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconCheck = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ─── Tokens ─── */
const lightTokens = {
  '--bg-surface': '#FFFFFF',
  '--bg-page': '#F4EFE6',
  '--border': '#E1D9C8',
  '--text-primary': '#173B32',
  '--text-secondary': '#5B6B5F',
  '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61',
  '--accent-critical': '#B94A3A',
};

const darkTokens = {
  '--bg-surface': '#182220',
  '--bg-page': '#12181A',
  '--border': '#263531',
  '--text-primary': '#F1EEE4',
  '--text-secondary': '#8A9690',
  '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C',
  '--accent-critical': '#C15D4C',
};

export default function GeofenceFormModal({ isOpen, onClose, onSubmit, initialValues, tokens: propTokens = {} }) {
  const { theme } = useTheme();
  const themeTokens = theme === 'dark' ? darkTokens : lightTokens;
  const tokens = { ...themeTokens, ...propTokens };

  const [name, setName] = useState('');
  const [type, setType] = useState('stop');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState(150);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const surface = tokens['--bg-surface'];
  const page = tokens['--bg-page'];
  const border = tokens['--border'];
  const textPrimary = tokens['--text-primary'];
  const textSecondary = tokens['--text-secondary'];
  const textMuted = tokens['--text-muted'];
  const accent = tokens['--accent-primary'];
  const critical = tokens['--accent-critical'];

  useEffect(() => {
    if (isOpen) {
      setName(initialValues?.name || '');
      setType(initialValues?.type || 'stop');
      setLatitude(initialValues?.latitude ?? '');
      setLongitude(initialValues?.longitude ?? '');
      setRadiusMeters(initialValues?.radiusMeters ?? 150);
      setError('');
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  function useMyLocation() {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(pos.coords.latitude.toFixed(6));
      setLongitude(pos.coords.longitude.toFixed(6));
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit({
        name,
        type,
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ backgroundColor: surface, border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: accent + '18', color: accent }}
            >
              <IconMapPin size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: textPrimary }}>
                {initialValues ? 'Edit stop' : 'Add bus stop'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                Get notified when a bus arrives or leaves.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Stop name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: textSecondary }}>
              Stop name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Gate Stop"
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-[1.5px] transition-all"
              style={{
                backgroundColor: page,
                border: `1px solid ${border}`,
                color: textPrimary,
                '--tw-ring-color': accent,
              }}
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: textSecondary }}>
              Type
            </label>
            <div className="flex p-1 rounded-xl w-fit" style={{ backgroundColor: page, border: `1px solid ${border}` }}>
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                  style={{
                    backgroundColor: type === option ? surface : 'transparent',
                    color: type === option ? textPrimary : textMuted,
                    boxShadow: type === option ? '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)' : 'none',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: textSecondary }}>
                Latitude
              </label>
              <input
                required
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-[1.5px] transition-all"
                style={{
                  backgroundColor: page,
                  border: `1px solid ${border}`,
                  color: textPrimary,
                  '--tw-ring-color': accent,
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: textSecondary }}>
                Longitude
              </label>
              <input
                required
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-[1.5px] transition-all"
                style={{
                  backgroundColor: page,
                  border: `1px solid ${border}`,
                  color: textPrimary,
                  '--tw-ring-color': accent,
                }}
              />
            </div>
          </div>

          {/* Use my location */}
          <button
            type="button"
            onClick={useMyLocation}
            className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
            style={{ color: accent }}
          >
            <IconLocate size={14} />
            Use my current location
          </button>

          {/* Radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: textSecondary }}>
                Radius
              </label>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: page, color: textPrimary }}>
                {radiusMeters}m
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="10"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(e.target.value)}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${accent} 0%, ${accent} ${((radiusMeters - 50) / 950) * 100}%, ${border} ${((radiusMeters - 50) / 950) * 100}%, ${border} 100%)`,
                accentColor: accent,
              }}
            />
            <div className="flex justify-between text-[10px]" style={{ color: textMuted }}>
              <span>50m</span>
              <span>1000m</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-xs font-medium"
              style={{ color: critical, backgroundColor: critical + '0D', border: `1px solid ${critical}33` }}
            >
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium transition hover:opacity-80"
              style={{ color: textSecondary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: accent }}
            >
              {isSubmitting ? (
                'Saving…'
              ) : initialValues ? (
                <>
                  <IconCheck size={14} />
                  Save changes
                </>
              ) : (
                <>
                  <IconPlus size={14} />
                  Add stop
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}