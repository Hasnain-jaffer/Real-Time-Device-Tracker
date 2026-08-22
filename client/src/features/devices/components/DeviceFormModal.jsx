// client/src/features/devices/components/DeviceFormModal.jsx
import { useState, useEffect } from 'react';

/* ─── SVG Icons ─── */
const IconBus = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
  </svg>
);

export default function DeviceFormModal({ isOpen, onClose, onSubmit, initialValues, tokens = {} }) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
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
      setIdentifier(initialValues?.identifier || '');
      setError('');
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit({ name, identifier, type: 'bus' });
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
      aria-labelledby="device-modal-title"
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
              <IconBus size={20} />
            </div>
            <div>
              <h2 id="device-modal-title" className="text-base font-bold" style={{ color: textPrimary }}>
                {initialValues ? 'Rename device' : 'Register new bus'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                {initialValues ? 'Update the details for this device.' : 'Add a bus to start tracking it.'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: textSecondary }} htmlFor="device-name">
              Bus / device name
            </label>
            <input
              id="device-name"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Route 4A - Bus 12"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary, '--tw-ring-color': accent }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: textSecondary }} htmlFor="device-identifier">
              Route / identifier <span style={{ color: textMuted, fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="device-identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="R4A"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary, '--tw-ring-color': accent }}
            />
          </div>

          {error && (
            <p
              className="text-sm rounded-xl px-3 py-2.5"
              style={{ color: critical, backgroundColor: critical + '0D', border: `1px solid ${critical}33` }}
            >
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium transition hover:opacity-80"
              style={{ color: textSecondary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: accent }}
            >
              {isSubmitting ? 'Saving…' : initialValues ? 'Save changes' : 'Register bus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}