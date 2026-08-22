// client/src/features/devices/components/MiniTimeline.jsx
export default function MiniTimeline({ pings, tokens = {} }) {
  const accent = tokens['--accent-primary'] || '#5E8C61';
  const border = tokens['--border'] || '#E1D9C8';
  const textPrimary = tokens['--text-primary'] || '#173B32';
  const textMuted = tokens['--text-muted'] || '#9C8F73';

  if (pings.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: textMuted }}>
        No recent activity for this device.
      </p>
    );
  }

  const ordered = pings.slice().reverse();

  return (
    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-0">
      {ordered.map((ping, i) => (
        <div key={ping._id} className="flex gap-3.5">
          <div className="flex flex-col items-center flex-shrink-0 pt-1.5">
            <span
              className="w-2 h-2 rounded-full ring-2 ring-offset-1"
              style={{
                backgroundColor: i === 0 ? accent : border,
                ringColor: i === 0 ? accent + '30' : 'transparent',
                ringOffsetColor: tokens['--bg-surface'] || '#FFFFFF',
              }}
            />
            {i < ordered.length - 1 && (
              <span className="w-px flex-1 mt-1.5 min-h-[24px]" style={{ backgroundColor: border }} />
            )}
          </div>
          <div className="pb-4 min-w-0">
            <p className="text-xs font-semibold" style={{ color: textPrimary }}>
              {new Date(ping.createdAt).toLocaleTimeString()}
            </p>
            <p className="text-[11px] mt-0.5 font-mono" style={{ color: textMuted }}>
              {ping.latitude.toFixed(5)}, {ping.longitude.toFixed(5)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}