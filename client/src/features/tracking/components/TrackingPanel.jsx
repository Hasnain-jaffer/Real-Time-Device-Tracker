// client/src/features/tracking/components/TrackingPanel.jsx
import { useState } from 'react';

export default function TrackingPanel({ devices, hiddenIds, onToggleVisibility, onSelectDevice, selectedKey }) {
  const [search, setSearch] = useState('');

  const filtered = devices.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.identifier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glass rounded-2xl shadow-soft flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold mb-3">
          Tracked buses <span className="text-gray-400 font-normal">({devices.length})</span>
        </h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search buses…"
          aria-label="Search tracked buses"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {devices.length === 0 ? 'No buses online right now.' : 'No matches.'}
          </p>
        ) : (
          filtered.map((device) => {
            const isHidden = hiddenIds.has(device.key);
            const isSelected = selectedKey === device.key;
            return (
              <div
                key={device.key}
                onClick={() => onSelectDevice(device.key)}
                className={`rounded-xl p-3 cursor-pointer transition ${
                  isSelected
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                      {device.name}
                    </p>
                    {device.identifier && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{device.identifier}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(device.key);
                    }}
                    className="text-xs text-gray-400 hover:text-primary flex-shrink-0"
                    aria-label={isHidden ? 'Show on map' : 'Hide from map'}
                  >
                    {isHidden ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {device.speedKmh != null ? `${device.speedKmh.toFixed(0)} km/h` : '—'} · Updated{' '}
                  {device.updatedAt.toLocaleTimeString()}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}