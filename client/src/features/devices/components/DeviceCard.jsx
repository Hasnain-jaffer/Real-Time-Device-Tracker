// client/src/features/devices/components/DeviceCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../app/ToastContext';

/* ─── SVG Icons ─── */
const IconBus = ({ size = 18, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
  </svg>
);

const IconKey = ({ size = 15, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const IconEye = ({ size = 14, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = ({ size = 14, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconCopy = ({ size = 13, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconEdit = ({ size = 13, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconRefresh = ({ size = 13, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    <path d="M23 4v6h-6" />
  </svg>
);

const IconTrash = ({ size = 13, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

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
      className="relative rounded-2xl p-5 overflow-hidden transition-all duration-200 hover:shadow-md"
      style={{
        backgroundColor: surface,
        border: '1px solid var(--border)',
        borderLeftWidth: '3px',
        borderLeftColor: isOnline ? accent : border,
        boxShadow: cardShadow,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: isOnline ? accent + '18' : page, color: isOnline ? accent : textMuted }}
          >
            <IconBus size={20} />
          </div>
          <div className="min-w-0">
            <Link
              to={`/devices/${device._id}`}
              className="text-[15px] font-bold hover:underline truncate block"
              style={{ color: textPrimary }}
            >
              {device.name}
            </Link>
            <p className="text-xs truncate mt-0.5" style={{ color: textMuted }}>
              {device.identifier}
              {device.lastSeenAt ? ` · Last seen ${new Date(device.lastSeenAt).toLocaleString()}` : ' · Never seen'}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
          style={
            isOnline
              ? { backgroundColor: badgeSuccessBg, color: badgeSuccessText }
              : { backgroundColor: page, color: textMuted }
          }
        >
          {isOnline ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: badgeSuccessText }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: badgeSuccessText }} />
              </span>
              Online
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: textMuted }} />
              Offline
            </>
          )}
        </div>
      </div>

      {isAdmin && (
        <>
          <div
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 mb-4 min-w-0"
            style={{ backgroundColor: page, border: `1px solid ${border}` }}
          >
            <IconKey size={15} style={{ color: textMuted }} />
            <code className="flex-1 min-w-0 text-xs font-mono truncate select-all" style={{ color: textSecondary }}>
              {showKey ? device.deviceKey : '•'.repeat(24)}
            </code>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setShowKey((prev) => !prev)}
                aria-label={showKey ? 'Hide device key' : 'Show device key'}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                style={{ color: textMuted }}
              >
                {showKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
              </button>
              <button
                onClick={handleCopyKey}
                aria-label="Copy device key to clipboard"
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-black/5 transition-colors text-[11px] font-semibold"
                style={{ color: accent }}
              >
                <IconCopy size={13} />
                Copy
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Custom Toggle */}
            <button
              onClick={() => onToggleTracking(device._id, !device.trackingEnabled)}
              className="flex items-center gap-3 group"
            >
              <div
                className="relative w-10 h-6 rounded-full flex-shrink-0 transition-colors duration-200"
                style={{ backgroundColor: device.trackingEnabled ? accent : border }}
              >
                <span
                  className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                  style={{ transform: device.trackingEnabled ? 'translateX(16px)' : 'translateX(0)' }}
                />
              </div>
              <span className="text-xs font-medium" style={{ color: textSecondary }}>
                Tracking {device.trackingEnabled ? 'enabled' : 'disabled'}
              </span>
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onRename(device)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
                style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary }}
              >
                <IconEdit size={13} />
                Rename
              </button>
              <button
                onClick={() => onRegenerateKey(device._id)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
                style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary }}
              >
                <IconRefresh size={13} />
                New key
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                  style={{ backgroundColor: critical + '12', border: `1px solid ${critical}40`, color: critical }}
                >
                  <IconTrash size={13} />
                  Delete
                </button>
              ) : (
                <button
                  onClick={() => onDelete(device._id)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
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