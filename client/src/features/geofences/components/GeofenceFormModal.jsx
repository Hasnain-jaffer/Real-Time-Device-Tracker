// client/src/features/geofences/components/GeofenceFormModal.jsx
import { useState, useEffect } from 'react';

const TYPE_OPTIONS = ['stop', 'home', 'office', 'custom'];

export default function GeofenceFormModal({ isOpen, onClose, onSubmit, initialValues, tokens = {} }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('stop');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState(150);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const surface = tokens['--bg-surface'] || '#FFFFFF';
  const page = tokens['--bg-page'] || '#F4EFE6';
  const border = tokens['--border'] || '#E1D9C8';
  const textPrimary = tokens['--text-primary'] || '#173B32';
  const textSecondary = tokens['--text-secondary'] || '#5B6B5F';
  const textMuted = tokens['--text-muted'] || '#9C8F73';
  const accent = tokens['--accent-primary'] || '#5E8C61';
  const critical = tokens['--accent-critical'] || '#B94A3A';

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
      className="fixed inset-0 z-[3000] flex items-center justify-center px-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(23,59,50,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ backgroundColor: surface, border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(23,59,50,0.18)' }}
      >
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: accent + '1A' }}>
              📍
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: textPrimary }}>
                {initialValues ? 'Edit stop' : 'Add bus stop'}
              </h2>
              <p className="text-xs" style={{ color: textMuted }}>
                Get notified when a bus arrives or leaves.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: textSecondary }}>Stop name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Gate Stop"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition"
              style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: textSecondary }}>Type</label>
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition"
                  style={
                    type === option
                      ? { backgroundColor: accent, color: '#fff', border: `1px solid ${accent}` }
                      : { border: `1px solid ${border}`, color: textSecondary }
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: textSecondary }}>Latitude</label>
              <input
                required
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: textSecondary }}>Longitude</label>
              <input
                required
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={useMyLocation}
            className="text-xs hover:underline"
            style={{ color: accent }}
          >
            Use my current location
          </button>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: textSecondary }}>
              Radius: {radiusMeters}m
            </label>
            <input
              type="range"
              min="50"
              max="1000"
              step="10"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(e.target.value)}
              className="w-full"
              style={{ accentColor: accent }}
            />
          </div>

          {error && (
            <p
              className="text-sm rounded-lg px-3 py-2"
              style={{ color: critical, backgroundColor: critical + '0D', border: `1px solid ${critical}33` }}
            >
              {error}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium transition"
              style={{ color: textSecondary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {isSubmitting ? 'Saving…' : initialValues ? 'Save changes' : 'Add stop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}