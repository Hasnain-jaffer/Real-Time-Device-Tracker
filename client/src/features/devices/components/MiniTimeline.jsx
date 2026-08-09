// client/src/features/devices/components/MiniTimeline.jsx
export default function MiniTimeline({ pings }) {
  if (pings.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">No recent activity for this device.</p>
    );
  }

  return (
    <div className="space-y-3">
      {pings
        .slice()
        .reverse()
        .slice(0, 10)
        .map((ping, i) => (
          <div key={ping._id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`} />
              {i < 9 && <span className="w-px flex-1 bg-gray-200 dark:bg-gray-800 mt-1" />}
            </div>
            <div className="pb-3">
              <p className="text-xs font-medium">{new Date(ping.createdAt).toLocaleTimeString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {ping.latitude.toFixed(5)}, {ping.longitude.toFixed(5)}
              </p>
            </div>
          </div>
        ))}
    </div>
  );
}