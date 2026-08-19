// client/src/pages/DeviceDetailsPage.jsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDeviceDetails } from '../features/devices/hooks/useDeviceDetails';
import MiniTimeline from '../features/devices/components/MiniTimeline';
import { SkeletonCard } from '../components/ui/Skeleton';
import DeviceHealthPanel from '../features/devices/components/DeviceHealthPanel';
import { useDeviceSchedule } from '../features/devices/hooks/useDeviceSchedule';
import ScheduleTable from '../features/devices/components/ScheduleTable';


export default function DeviceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { device, recentPings, notifications, isLoading, error } = useDeviceDetails(id);
   const { stops: scheduleStops, isLoading: scheduleLoading } = useDeviceSchedule(device?._id);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-danger">{error || 'Device not found.'}</p>
        <Link to="/devices" className="text-primary text-sm hover:underline">
          Back to Device Center
        </Link>
      </div>
    );
  }

 const lastPing = recentPings[recentPings.length - 1];
  const isOnline = device.status === 'online';
  const deviceNotifications = notifications.filter((n) => n.message?.includes(device.name)).slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <button onClick={() => navigate('/devices')} className="text-sm text-primary hover:underline">
        ← Back to Device Center
      </button>

      {/* Header card */}
      <div className="glass rounded-2xl shadow-soft p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{device.name}</h1>
            {device.identifier && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{device.identifier}</p>
            )}
          </div>
          <span
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
              isOnline
                ? 'bg-success/10 text-success'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success' : 'bg-gray-400'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tracking</p>
            <p className="text-sm font-medium">{device.trackingEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last active</p>
            <p className="text-sm font-medium">
              {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleTimeString() : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Current location</p>
            <p className="text-sm font-medium">
              {lastPing ? `${lastPing.latitude.toFixed(4)}, ${lastPing.longitude.toFixed(4)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Registered</p>
            <p className="text-sm font-medium">{new Date(device.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Link
            to="/tracking"
            className="rounded-xl bg-primary text-white px-4 py-2 text-xs font-medium shadow-soft hover:bg-primary-600 transition"
          >
            View on Live Map
          </Link>
          <Link
            to="/history"
            className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Full History
          </Link>
          <Link
            to={`/devices/${device._id}/stops`}
            className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            View Stops
          </Link>
          <Link
            to="/devices"
            className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Manage Device
          </Link>
        </div>
      </div>

            <div className="glass rounded-2xl shadow-soft p-6">
        <h2 className="text-sm font-semibold mb-1">Route schedule</h2>
        <p className="text-xs text-gray-400 mb-4">Expected vs actual arrival at each stop today.</p>
        <ScheduleTable stops={scheduleStops} isLoading={scheduleLoading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Device health */}
        <DeviceHealthPanel device={device} />
        
        {/* Mini timeline */}
        <div className="glass rounded-2xl shadow-soft p-6">
          <h2 className="text-sm font-semibold mb-4">Recent activity</h2>
          <MiniTimeline pings={recentPings} />
        </div>

        {/* Recent notifications */}
        <div className="glass rounded-2xl shadow-soft p-6">
          <h2 className="text-sm font-semibold mb-4">Recent notifications</h2>
          {deviceNotifications.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No notifications for this device yet.</p>
          ) : (
            <ul className="space-y-2">
              {deviceNotifications.map((n) => (
                <li key={n._id} className="text-xs">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}