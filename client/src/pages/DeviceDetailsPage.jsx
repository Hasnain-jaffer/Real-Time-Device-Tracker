// client/src/pages/DeviceDetailsPage.jsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDeviceDetails } from '../features/devices/hooks/useDeviceDetails';
import { useDeviceSchedule } from '../features/devices/hooks/useDeviceSchedule';
import MiniTimeline from '../features/devices/components/MiniTimeline';
import ScheduleTable from '../features/devices/components/ScheduleTable';
import DeviceHealthPanel from '../features/devices/components/DeviceHealthPanel';
import { useTheme } from '../app/ThemeContext';

/* ─── SVG Icons ─── */
const IconBus = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
  </svg>
);

const IconArrowLeft = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconActivity = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconBell = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

const lightTokens = {
  '--bg-page': '#F4EFE6', '--bg-surface': '#FFFFFF', '--border': '#E1D9C8',
  '--text-primary': '#173B32', '--text-secondary': '#5B6B5F', '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61', '--accent-eta': '#D59A3A', '--accent-critical': '#B94A3A',
  '--badge-success-bg': '#EAF3DE', '--badge-success-text': '#3B6D26',
  '--badge-eta-bg': '#F6E9CE', '--badge-eta-text': '#8A6423',
};

const darkTokens = {
  '--bg-page': '#12181A', '--bg-surface': '#182220', '--border': '#263531',
  '--text-primary': '#F1EEE4', '--text-secondary': '#8A9690', '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C', '--accent-eta': '#E3B15E', '--accent-critical': '#C15D4C',
  '--badge-success-bg': 'rgba(94,140,97,0.15)', '--badge-success-text': '#79B37C',
  '--badge-eta-bg': 'rgba(213,154,58,0.15)', '--badge-eta-text': '#E3B15E',
};

export default function DeviceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const { device, recentPings, notifications, isLoading, error } = useDeviceDetails(id);
  const { stops: scheduleStops, isLoading: scheduleLoading } = useDeviceSchedule(device?._id);

  if (isLoading) {
    return (
      <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-40 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
          <div className="h-40 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-8">
        <p className="font-medium" style={{ color: 'var(--accent-critical)' }}>{error || 'Device not found.'}</p>
        <Link to="/devices" style={{ color: 'var(--accent-primary)' }} className="text-sm hover:underline mt-2 inline-flex items-center gap-1">
          <IconArrowLeft size={14} /> Back to Device Center
        </Link>
      </div>
    );
  }

  const lastPing = recentPings[recentPings.length - 1];
  const isOnline = device.status === 'online';
  const deviceNotifications = notifications.filter((n) => n.message?.includes(device.name));

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-5">

        <button
          onClick={() => navigate('/devices')}
          className="text-sm flex items-center gap-1.5 font-medium hover:opacity-80 transition-opacity"
          style={{ color: 'var(--accent-primary)' }}
        >
          <IconArrowLeft size={14} /> Back to Device Center
        </button>

        {/* Header card */}
        <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: isOnline ? 'rgba(94,140,97,0.12)' : 'var(--bg-page)',
                  color: isOnline ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}
              >
                <IconBus size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{device.name}</h1>
                {device.identifier && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{device.identifier}</p>
                )}
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
              style={
                isOnline
                  ? { backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)' }
                  : { backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }
              }
            >
              {isOnline ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--badge-success-text)' }} />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: 'var(--badge-success-text)' }} />
                  </span>
                  Online
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
                  Offline
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tracking</p>
              <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {device.trackingEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Last active</p>
              <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Current location</p>
              <p className="text-sm font-bold mt-1 font-mono" style={{ color: 'var(--text-primary)' }}>
                {lastPing ? `${lastPing.latitude.toFixed(4)}, ${lastPing.longitude.toFixed(4)}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Registered</p>
              <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                {new Date(device.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            <Link
              to="/tracking"
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              View on live map
            </Link>
            <Link
              to="/history"
              className="rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-black/[0.03] transition-colors"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              Full history
            </Link>
            <Link
              to={`/devices/${device._id}/stops`}
              className="rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-black/[0.03] transition-colors"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              View stops
            </Link>
            <Link
              to="/devices"
              className="rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-black/[0.03] transition-colors"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              Manage device
            </Link>
          </div>
        </div>

        {/* Route schedule */}
        <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Route schedule</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Expected vs actual arrival at each stop today.</p>
          <ScheduleTable stops={scheduleStops} isLoading={scheduleLoading} tokens={tokens} />
        </div>

        {/* Three-column row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <DeviceHealthPanel device={device} tokens={tokens} />

          <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}>
            <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-4" style={{ color: 'var(--text-muted)' }}>
              <IconActivity size={15} /> Recent activity
            </h2>
            <MiniTimeline pings={recentPings} tokens={tokens} />
          </div>

          <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}>
            <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-4" style={{ color: 'var(--text-muted)' }}>
              <IconBell size={15} /> Recent notifications
            </h2>
            {deviceNotifications.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                No notifications for this device yet.
              </p>
            ) : (
              <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {deviceNotifications.map((n) => (
                  <li key={n._id} className="pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}