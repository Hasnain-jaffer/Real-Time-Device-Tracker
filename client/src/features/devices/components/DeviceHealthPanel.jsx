// client/src/features/devices/components/DeviceHealthPanel.jsx
const HEARTBEAT_WARN_MS = 15000; // matches STALE_MS convention used elsewhere in the app
const HEARTBEAT_CRITICAL_MS = 60000;

function getHeartbeatHealth(lastSeenAt) {
  if (!lastSeenAt) return { label: 'No data', tone: 'neutral' };
  const ms = Date.now() - new Date(lastSeenAt).getTime();
  if (ms < HEARTBEAT_WARN_MS) return { label: 'Healthy', tone: 'success' };
  if (ms < HEARTBEAT_CRITICAL_MS) return { label: 'Delayed', tone: 'warning' };
  return { label: 'Lost', tone: 'danger' };
}

const TONE_STYLES = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
};

function HealthRow({ label, value, tone, hint }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <p className="text-sm">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TONE_STYLES[tone]}`}>
        {value}
      </span>
    </div>
  );
}

export default function DeviceHealthPanel({ device }) {
  const heartbeat = getHeartbeatHealth(device.lastSeenAt);
  const isOnline = device.status === 'online';

  return (
    <div className="glass rounded-2xl shadow-soft p-6">
      <h2 className="text-sm font-semibold mb-1">Device health</h2>
      <p className="text-xs text-gray-400 mb-4">Live diagnostics based on connection data.</p>

      <div>
        <HealthRow
          label="Connection status"
          value={isOnline ? 'Connected' : 'Disconnected'}
          tone={isOnline ? 'success' : 'danger'}
        />
        <HealthRow
          label="Last heartbeat"
          value={heartbeat.label}
          tone={heartbeat.tone}
          hint={
            device.lastSeenAt
              ? `${new Date(device.lastSeenAt).toLocaleTimeString()}`
              : 'This device has never reported a location.'
          }
        />
        <HealthRow
          label="Tracking status"
          value={device.trackingEnabled ? 'Active' : 'Paused'}
          tone={device.trackingEnabled ? 'success' : 'neutral'}
        />
        <HealthRow
          label="Internet status"
          value={isOnline ? 'Reachable' : 'Unreachable'}
          tone={isOnline ? 'success' : 'danger'}
          hint="Inferred from socket connection — this device can only report a heartbeat if it has internet access."
        />
      </div>

      {/* Future-ready placeholders — clearly labeled, no fabricated data */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs font-medium text-gray-400 mb-3">Coming soon</p>
        <div className="grid grid-cols-2 gap-3">
          {['Battery level', 'Signal strength', 'Firmware version', 'Storage'].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-3 py-2.5 text-center"
            >
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Requires hardware</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}