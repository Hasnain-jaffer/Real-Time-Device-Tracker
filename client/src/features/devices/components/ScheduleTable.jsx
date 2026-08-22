// client/src/features/devices/components/ScheduleTable.jsx
function formatDelay(minutes) {
  if (minutes == null) return { label: 'Not yet arrived', tone: 'muted' };
  if (minutes <= 2) return { label: 'On time', tone: 'success' };
  if (minutes <= 10) return { label: `${minutes} min late`, tone: 'warning' };
  return { label: `${minutes} min late`, tone: 'danger' };
}

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function ScheduleTable({ stops, isLoading, tokens = {} }) {
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

  if (isLoading) {
    return <div className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: page }} />;
  }

  if (stops.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: textMuted }}>
        No schedule set up for this bus yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {stops
        .slice()
        .sort((a, b) => a.sequence - b.sequence)
        .map((stop) => {
          const delay = formatDelay(stop.delayMinutes);
          const badgeStyle =
            delay.tone === 'success'
              ? { backgroundColor: badgeSuccessBg, color: badgeSuccessText }
              : delay.tone === 'warning'
                ? { backgroundColor: badgeEtaBg, color: badgeEtaText }
                : delay.tone === 'danger'
                  ? { backgroundColor: critical + '1A', color: critical }
                  : { backgroundColor: page, color: textMuted };

          return (
            <div
              key={stop.stopName + stop.sequence}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-xl transition-all hover:shadow-sm"
              style={{ backgroundColor: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: textPrimary }}>{stop.stopName}</p>
                <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>
                  Scheduled {stop.expectedTime}
                  {stop.actualArrival && ` · Arrived ${new Date(stop.actualArrival).toLocaleTimeString()}`}
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={badgeStyle}>
                {delay.label}
              </span>
            </div>
          );
        })}
    </div>
  );
}