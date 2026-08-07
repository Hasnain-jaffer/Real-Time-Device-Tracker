// client/src/features/devices/components/DeviceCard.jsx
import { useState } from 'react';
import { useToast } from '../../../app/ToastContext';

const STATUS_STYLES = {
  online: { dot: 'bg-success', label: 'Online', badge: 'bg-success/10 text-success' },
  offline: { dot: 'bg-gray-400', label: 'Offline', badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
};

export default function DeviceCard({ device, onRename, onDelete, onToggleTracking, onRegenerateKey }) {
  const { showToast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = STATUS_STYLES[device.status] || STATUS_STYLES.offline;

  function handleCopyKey() {
    navigator.clipboard.writeText(device.deviceKey);
    showToast('Device key copied to clipboard', 'success');
  }

  return (
    <div className="glass rounded-2xl shadow-soft p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{device.name}</p>
          {device.identifier && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{device.identifier}</p>
          )}
        </div>
        <span
          className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
          {status.label}
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Last seen: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}
      </p>

      {/* Device key block */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Device Key</p>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
          <code className="flex-1 min-w-0 text-xs font-mono truncate">
            {showKey ? device.deviceKey : '••••••••••••••••••••••••'}
          </code>
          <button
            onClick={() => setShowKey((prev) => !prev)}
            className="flex-shrink-0 text-xs text-primary hover:underline"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={handleCopyKey}
            className="flex-shrink-0 text-xs text-primary hover:underline"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Tracking toggle */}
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none pt-1 border-t border-gray-200 dark:border-gray-800 pt-3">
        <input
          type="checkbox"
          checked={device.trackingEnabled}
          onChange={(e) => onToggleTracking(device._id, e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        Tracking enabled
      </label>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onRename(device)}
          className="flex-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          Rename
        </button>
        <button
          onClick={() => onRegenerateKey(device._id)}
          className="flex-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          New Key
        </button>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 text-xs rounded-lg border border-danger text-danger px-3 py-2 hover:bg-danger/10 transition"
          >
            Delete
          </button>
        ) : (
          <button
            onClick={() => onDelete(device._id)}
            className="flex-1 text-xs rounded-lg bg-danger text-white px-3 py-2 hover:bg-red-600 transition"
          >
            Confirm Delete?
          </button>
        )}
      </div>
    </div>
  );
}