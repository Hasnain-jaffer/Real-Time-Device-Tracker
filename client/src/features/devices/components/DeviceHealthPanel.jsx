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

/* ─── SVG Icons ─── */
const IconSignal = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
  </svg>
);

const IconHeart = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconTarget = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

const IconGlobe = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

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

  function HealthRow({ Icon, label, value, tone, hint }) {
    return (
      <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex-shrink-0" style={{ color: textMuted }}>
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: textPrimary }}>{label}</p>
            {hint && <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>{hint}</p>}
          </div>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ml-3" style={toneStyle(tone)}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
      <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-1" style={{ color: textMuted }}>
        <IconHeart size={15} /> Device health
      </h2>
      <p className="text-xs mb-4" style={{ color: textMuted }}>Live diagnostics based on connection data.</p>

      <div>
        <HealthRow
          Icon={IconSignal}
          label="Connection status"
          value={isOnline ? 'Connected' : 'Disconnected'}
          tone={isOnline ? 'success' : 'danger'}
        />
        <HealthRow
          Icon={IconHeart}
          label="Last heartbeat"
          value={heartbeat.label}
          tone={heartbeat.tone}
          hint={device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleTimeString() : 'This device has never reported a location.'}
        />
        <HealthRow
          Icon={IconTarget}
          label="Tracking status"
          value={device.trackingEnabled ? 'Active' : 'Inactive'}
          tone={device.trackingEnabled ? 'success' : 'neutral'}
        /> 
        <HealthRow
          Icon={IconGlobe}
          label="Internet status"
          value={isOnline ? 'Reachable' : 'Unreachable'}
          tone={isOnline ? 'success' : 'danger'}
          hint="Inferred from socket connection — this device can only report a heartbeat if it has internet access."
        />
      </div>

      <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${border}` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: textMuted }}>Coming soon</p>
        <div className="grid grid-cols-2 gap-3">
          {['Battery level', 'Signal strength', 'Firmware version', 'Storage'].map((label) => (
            <div key={label} className="rounded-xl px-3 py-3 text-center" style={{ border: `1px dashed ${border}` }}>
              <p className="text-[11px] font-medium" style={{ color: textMuted }}>{label}</p>
              <p className="text-[10px] mt-1" style={{ color: textMuted, opacity: 0.6 }}>Requires hardware</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}