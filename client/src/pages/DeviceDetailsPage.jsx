// client/src/pages/DeviceDetailsPage.jsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDeviceDetails } from '../features/devices/hooks/useDeviceDetails';
import { useDeviceSchedule } from '../features/devices/hooks/useDeviceSchedule';
import MiniTimeline from '../features/devices/components/MiniTimeline';
import ScheduleTable from '../features/devices/components/ScheduleTable';
import DeviceHealthPanel from '../features/devices/components/DeviceHealthPanel';
import { useTheme } from '../app/ThemeContext';

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
        <div className="h-40 rounded-[14px] animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
        <div className="h-40 rounded-[14px] animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-[calc(100vh-64px)] p-4 sm:p-8">
        <p style={{ color: 'var(--accent-critical)' }}>{error || 'Device not found.'}</p>
        <Link to="/devices" style={{ color: 'var(--accent-primary)' }} className="text-sm hover:underline">
          Back to Device Center
        </Link>
      </div>
    );
  }

  const lastPing = recentPings[recentPings.length - 1];
  const isOnline = device.status === 'online';
  const deviceNotifications = notifications.filter((n) => n.message?.includes(device.name));

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <button
          onClick={() => navigate('/devices')}
          className="text-sm flex items-center gap-1"
          style={{ color: 'var(--accent-primary)' }}
        >
          ← Back to Device Center
        </button>

        {/* Header card */}
        <div className="rounded-[14px] p-5 sm:p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  backgroundColor: isOnline ? 'var(--accent-primary)33' : 'var(--bg-page)',
                  color: isOnline ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}
              >
                🚌
              </span>
              <div>
                <h1 className="text-[17px] font-semibold" style={{ color: 'var(--text-primary)' }}>{device.name}</h1>
                {device.identifier && (
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{device.identifier}</p>
                )}
              </div>
            </div>
            <span
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap"
              style={
                isOnline
                  ? { backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)' }
                  : { backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isOnline ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>Tracking</p>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {device.trackingEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <p className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>Last active</p>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>Current location</p>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {lastPing ? `${lastPing.latitude.toFixed(4)}, ${lastPing.longitude.toFixed(4)}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>Registered</p>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {new Date(device.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <Link
              to="/tracking"
              className="rounded-xl px-4 py-2 text-xs font-medium text-white"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              View on live map
            </Link>
            <Link
              to="/history"
              className="rounded-xl px-4 py-2 text-xs font-medium"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              Full history
            </Link>
            <Link
              to={`/devices/${device._id}/stops`}
              className="rounded-xl px-4 py-2 text-xs font-medium"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              View stops
            </Link>
            <Link
              to="/devices"
              className="rounded-xl px-4 py-2 text-xs font-medium"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              Manage device
            </Link>
          </div>
        </div>

        {/* Route schedule card */}
        <div className="rounded-[14px] p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Route schedule</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Expected vs actual arrival at each stop today.</p>
          <ScheduleTable stops={scheduleStops} isLoading={scheduleLoading} tokens={tokens} />
        </div>

        {/* Three-column row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DeviceHealthPanel device={device} tokens={tokens} />

          <div className="rounded-[14px] p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
              <span aria-hidden="true">📈</span> Recent activity
            </h2>
            <MiniTimeline pings={recentPings} tokens={tokens} />
          </div>

          <div className="rounded-[14px] p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
              <span aria-hidden="true">🔔</span> Recent notifications
            </h2>
            {deviceNotifications.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                No notifications for this device yet.
              </p>
            ) : (
              <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {deviceNotifications.map((n) => (
                  <li key={n._id} className="text-xs pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    <p style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                    <p style={{ color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleString()}</p>
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