// client/src/features/devices/components/DeviceFormModal.jsx
import { useState, useEffect } from 'react';

export default function DeviceFormModal({ isOpen, onClose, onSubmit, initialValues }) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-glass border border-gray-200/50 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
              🚌
            </div>
            <div>
              <h2 id="device-modal-title" className="text-base font-semibold">
                {initialValues ? 'Rename device' : 'Register new bus'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {initialValues ? 'Update the details for this device.' : 'Add a bus to start tracking it.'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor="device-name">
              Bus / device name
            </label>
            <input
              id="device-name"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Route 4A - Bus 12"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor="device-identifier">
              Route / identifier <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="device-identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="R4A"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex gap-2 justify-end pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-medium shadow-soft hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving…' : initialValues ? 'Save changes' : 'Register bus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}