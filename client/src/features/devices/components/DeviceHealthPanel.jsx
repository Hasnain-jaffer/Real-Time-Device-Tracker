// client/src/features/devices/components/DeviceHealthPanel.jsx
const HEARTBEAT_WARN_MS = 15000;
const HEARTBEAT_CRITICAL_MS = 60000;

function getHeartbeatHealth(lastSeenAt) {
  if (!lastSeenAt) return { label: 'No data', tone: 'neutral' };
  const ms = Date.now() - new Date(lastSeenAt).getTime();
  if (ms < HEARTBEAT_WARN_MS) return { label: 'Healthy', tone: 'success' };
  if (ms < HEARTBEAT_CRITICAL_MS) return { label: 'Delayed', tone: 'warning' };
  return { label: 'Lost', tone: 'danger' };
}

export default function DeviceHealthPanel({ device, tokens = {} }) {
  const heartbeat = getHeartbeatHealth(device.lastSeenAt);
  const isOnline = device.status === 'online';

  const surface = tokens['--bg-surface'] || '#FFFFFF';
  const page = tokens['--bg-page'] || '#F4EFE6';
  const border = tokens['--border'] || '#E1D9C8';
  const textPrimary = tokens['--text-primary'] || '#173B32';
  const textMuted = tokens['--text-muted'] || '#9C8F73';
  const badgeSuccessBg = tokens['--badge-success-bg'] || '#EAF3DE';
  const badgeSuccessText = tokens['--badge-success-text'] || '#3B6D26';
  const badgeEtaBg = tokens['--badge-eta-bg'] || '#F6E9CE';
  const badgeEtaText = tokens['--badge-eta-text'] || '#8A6423';
  const critical = tokens['--accent-critical'] || '#B94A3A';

  const toneStyle = (tone) =>
    tone === 'success'
      ? { backgroundColor: badgeSuccessBg, color: badgeSuccessText }
      : tone === 'warning'
        ? { backgroundColor: badgeEtaBg, color: badgeEtaText }
        : tone === 'danger'
          ? { backgroundColor: critical + '1A', color: critical }
          : { backgroundColor: page, color: textMuted };

  function HealthRow({ icon, label, value, tone, hint }) {
    return (
      <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm" style={{ color: textPrimary }}>{label}</p>
            {hint && <p className="text-xs mt-0.5" style={{ color: textMuted }}>{hint}</p>}
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0" style={toneStyle(tone)}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] p-5" style={{ backgroundColor: surface, border: `1px solid ${border}` }}>
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-1" style={{ color: textPrimary }}>
        <span aria-hidden="true">💓</span> Device health
      </h2>
      <p className="text-xs mb-4" style={{ color: textMuted }}>Live diagnostics based on connection data.</p>

      <div>
        <HealthRow icon="📶" label="Connection status" value={isOnline ? 'Connected' : 'Disconnected'} tone={isOnline ? 'success' : 'danger'} />
        <HealthRow
          icon="💗"
          label="Last heartbeat"
          value={heartbeat.label}
          tone={heartbeat.tone}
          hint={device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleTimeString() : 'This device has never reported a location.'}
        />
        <HealthRow icon="🎯" label="Tracking status" value={device.trackingEnabled ? 'Active' : 'Inactive'} tone={device.trackingEnabled ? 'success' : 'neutral'} />
        <HealthRow
          icon="🌐"
          label="Internet status"
          value={isOnline ? 'Reachable' : 'Unreachable'}
          tone={isOnline ? 'success' : 'danger'}
          hint="Inferred from socket connection — this device can only report a heartbeat if it has internet access."
        />
      </div>

      <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${border}` }}>
        <p className="text-xs font-medium mb-3" style={{ color: textMuted }}>Coming soon</p>
        <div className="grid grid-cols-2 gap-3">
          {['Battery level', 'Signal strength', 'Firmware version', 'Storage'].map((label) => (
            <div key={label} className="rounded-xl px-3 py-2.5 text-center" style={{ border: `1px dashed ${border}` }}>
              <p className="text-xs" style={{ color: textMuted }}>{label}</p>
              <p className="text-xs mt-1" style={{ color: textMuted, opacity: 0.6 }}>Requires hardware</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}