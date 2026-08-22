// client/src/features/devices/components/DeviceCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../app/ToastContext';

export default function DeviceCard({ device, onRename, onDelete, onToggleTracking, onRegenerateKey, isAdmin = true, tokens = {} }) {
  const { showToast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOnline = device.status === 'online';

  const accent = tokens['--accent-primary'] || '#5E8C61';
  const critical = tokens['--accent-critical'] || '#B94A3A';
  const surface = tokens['--bg-surface'] || '#FFFFFF';
  const page = tokens['--bg-page'] || '#F4EFE6';
  const border = tokens['--border'] || '#E1D9C8';
  const textPrimary = tokens['--text-primary'] || '#173B32';
  const textSecondary = tokens['--text-secondary'] || '#5B6B5F';
  const textMuted = tokens['--text-muted'] || '#9C8F73';
  const badgeSuccessBg = tokens['--badge-success-bg'] || '#EAF3DE';
  const badgeSuccessText = tokens['--badge-success-text'] || '#3B6D26';

  function handleCopyKey() {
    navigator.clipboard.writeText(device.deviceKey);
    showToast('Device key copied to clipboard', 'success');
  }

  return (
    <div
      className="relative rounded-[14px] p-4 sm:p-[18px] overflow-hidden"
      style={{ backgroundColor: surface, border: `1px solid ${isOnline ? accent + '55' : border}` }}
    >
      {isOnline && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: accent }} aria-hidden="true" />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: isOnline ? accent + '22' : page, color: isOnline ? accent : textMuted }}
          >
            🚌
          </span>
          <div className="min-w-0">
            <Link
              to={`/devices/${device._id}`}
              className="text-[14.5px] font-semibold hover:underline truncate block"
              style={{ color: textPrimary }}
            >
              {device.name}
            </Link>
            <p className="text-[11.5px] truncate" style={{ color: textMuted }}>
              {device.identifier}
              {device.lastSeenAt ? ` · Last seen ${new Date(device.lastSeenAt).toLocaleString()}` : ' · Never seen'}
            </p>
          </div>
        </div>

        <span
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
          style={
            isOnline
              ? { backgroundColor: badgeSuccessBg, color: badgeSuccessText }
              : { backgroundColor: page, color: textMuted }
          }
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isOnline ? accent : textMuted }} />
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {isAdmin && (
        <>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3 min-w-0"
            style={{ backgroundColor: page, border: `1px solid ${border}` }}
          >
            <span className="flex-shrink-0" aria-hidden="true">🔑</span>
            <code className="flex-1 min-w-0 text-xs font-mono truncate" style={{ color: textSecondary }}>
              {showKey ? device.deviceKey : '••••••••••••••••••••••••'}
            </code>
            <button
              onClick={() => setShowKey((prev) => !prev)}
              aria-label={showKey ? 'Hide device key' : 'Show device key'}
              className="flex-shrink-0 text-xs font-medium"
              style={{ color: accent }}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={handleCopyKey}
              aria-label="Copy device key to clipboard"
              className="flex-shrink-0 text-xs font-medium"
              style={{ color: accent }}
            >
              Copy
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none flex-shrink-0" style={{ color: textSecondary }}>
              <input
                type="checkbox"
                checked={device.trackingEnabled}
                onChange={(e) => onToggleTracking(device._id, e.target.checked)}
              />
              Tracking enabled
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onRename(device)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary }}
              >
                Rename
              </button>
              <button
                onClick={() => onRegenerateKey(device._id)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary }}
              >
                New key
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: critical + '15', border: `1px solid ${critical}55`, color: critical }}
                >
                  Delete
                </button>
              ) : (
                <button
                  onClick={() => onDelete(device._id)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                  style={{ backgroundColor: critical }}
                >
                  Confirm delete?
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}