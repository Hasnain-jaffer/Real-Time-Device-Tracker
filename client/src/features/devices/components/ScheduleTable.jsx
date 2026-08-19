// client/src/features/devices/components/ScheduleTable.jsx
function formatDelay(minutes) {
  if (minutes == null) return { label: 'Not yet arrived', tone: 'muted' };
  if (minutes <= 2) return { label: 'On time', tone: 'success' };
  if (minutes <= 10) return { label: `${minutes} min late`, tone: 'warning' };
  return { label: `${minutes} min late`, tone: 'danger' };
}

export default function ScheduleTable({ stops, isLoading }) {
  if (isLoading) {
    return <div className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  if (stops.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
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
          return (
            <div
              key={stop.stopName + stop.sequence}
              className="flex items-center justify-between px-4 py-3 rounded-xl glass shadow-soft"
            >
              <div>
                <p className="text-sm font-medium">{stop.stopName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Scheduled {stop.expectedTime}
                  {stop.actualArrival && ` · Arrived ${new Date(stop.actualArrival).toLocaleTimeString()}`}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  delay.tone === 'success'
                    ? 'bg-success/10 text-success'
                    : delay.tone === 'warning'
                      ? 'bg-warning/10 text-warning'
                      : delay.tone === 'danger'
                        ? 'bg-danger/10 text-danger'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
              >
                {delay.label}
              </span>
            </div>
          );
        })}
    </div>
  );
}