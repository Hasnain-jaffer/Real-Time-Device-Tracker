// client/src/features/devices/components/DeviceFormModal.jsx
import { useState, useEffect } from 'react';

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
      className="fixed inset-0 z-[3000] flex items-center justify-center px-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(23,59,50,0.55)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ backgroundColor: surface, border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(23,59,50,0.18)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: accent + '1A' }}
            >
              🚌
            </div>
            <div>
              <h2 id="device-modal-title" className="text-base font-semibold" style={{ color: textPrimary }}>
                {initialValues ? 'Rename device' : 'Register new bus'}
              </h2>
              <p className="text-xs" style={{ color: textMuted }}>
                {initialValues ? 'Update the details for this device.' : 'Add a bus to start tracking it.'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: textSecondary }} htmlFor="device-name">
              Bus / device name
            </label>
            <input
              id="device-name"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Route 4A - Bus 12"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition"
              style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: textSecondary }} htmlFor="device-identifier">
              Route / identifier <span style={{ color: textMuted, fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="device-identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="R4A"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition"
              style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary }}
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

          {/* Footer */}
          <div className="flex gap-2 justify-end pt-3">
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
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
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