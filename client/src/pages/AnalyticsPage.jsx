// client/src/pages/AnalyticsPage.jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as analyticsApi from '../features/analytics/api/analyticsApi';
import { useTheme } from '../app/ThemeContext';

const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--bg-surface': '#FFFFFF',
  '--border': '#E1D9C8',
  '--text-primary': '#173B32',
  '--text-secondary': '#5B6B5F',
  '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61',
  '--accent-eta': '#D59A3A',
  '--accent-critical': '#B94A3A',
  '--accent-primary-muted': '#D9E5D2',
  '--badge-success-bg': '#EAF3DE',
  '--badge-success-text': '#3B6D26',
};

const darkTokens = {
  '--bg-page': '#12181A',
  '--bg-surface': '#182220',
  '--border': '#263531',
  '--text-primary': '#F1EEE4',
  '--text-secondary': '#8A9690',
  '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C',
  '--accent-eta': '#E3B15E',
  '--accent-critical': '#C15D4C',
  '--accent-primary-muted': '#2E4A3F',
  '--badge-success-bg': 'rgba(94,140,97,0.15)',
  '--badge-success-text': '#79B37C',
};

function StatCard({ icon, label, value, tint, tokens }) {
  return (
    <div
      className="rounded-[11px] px-4 py-3.5 flex items-center gap-3"
      style={{ backgroundColor: tokens['--bg-surface'], border: `1px solid ${tokens['--border']}` }}
    >
      <span className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: tint }}>
        {icon}
      </span>
      <div>
        <p className="text-[10.5px]" style={{ color: tokens['--text-muted'] }}>{label}</p>
        <p className="text-base font-semibold" style={{ color: tokens['--text-primary'] }}>{value}</p>
      </div>
    </div>
  );
}

function downloadCsv(rows, filename) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [stopActivity, setStopActivity] = useState({ stopActivity: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.getOverview(), analyticsApi.getDailyDistance(7), analyticsApi.getStopActivity()])
      .then(([overviewData, chart, stops]) => {
        setOverview(overviewData);
        setChartData(chart);
        setStopActivity(stops);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-[11px] animate-pulse" style={{ backgroundColor: tokens['--bg-surface'] }} />
          ))}
        </div>
      </div>
    );
  }

  const maxDistance = chartData.length > 0 ? Math.max(...chartData.map((d) => d.distanceKm)) : 0;

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* 1. Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-[19px] font-semibold" style={{ color: tokens['--text-primary'] }}>Analytics</h1>
          <button
            onClick={() => downloadCsv(overview?.perDevice || [], 'fleet-analytics.csv')}
            className="flex items-center gap-1.5 self-start rounded-lg px-3.5 py-2 text-sm font-medium"
            style={{ backgroundColor: tokens['--bg-page'], border: `1px solid ${tokens['--border']}`, color: tokens['--text-primary'] }}
          >
            <span aria-hidden="true">⬇️</span> Export CSV
          </button>
        </div>

        {/* 2. Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="🛣️" label="Total distance" value={`${overview.totalDistanceKm} km`} tint={tokens['--accent-primary'] + '33'} tokens={tokens} />
          <StatCard icon="🕒" label="Tracked time" value={`${Math.round(overview.totalTrackedMinutes / 60)} hrs`} tint={tokens['--accent-eta'] + '33'} tokens={tokens} />
          <StatCard icon="🚌" label="Buses" value={overview.deviceCount} tint={tokens['--accent-primary'] + '33'} tokens={tokens} />
          <StatCard icon="📍" label="Stop events" value={overview.geofenceEventCount} tint={tokens['--accent-critical'] + '33'} tokens={tokens} />
        </div>

        {/* 3. Most active bus */}
        {overview.mostActiveDevice && (
          <div className="rounded-xl p-5" style={{ backgroundColor: tokens['--bg-surface'], border: `1px solid ${tokens['--border']}` }}>
            <p className="text-[11px]" style={{ color: tokens['--text-muted'] }}>Most active bus</p>
            <p className="text-[15px] font-semibold" style={{ color: tokens['--text-primary'] }}>{overview.mostActiveDevice.name}</p>
            <p className="text-xs" style={{ color: tokens['--text-secondary'] }}>
              {overview.mostActiveDevice.distanceKm} km · avg {overview.mostActiveDevice.avgSpeedKmh} km/h
            </p>
          </div>
        )}

        {/* 4. Daily distance chart */}
        <div className="rounded-xl p-5" style={{ backgroundColor: tokens['--bg-surface'], border: `1px solid ${tokens['--border']}` }}>
          <h2 className="text-[13px] font-semibold mb-4" style={{ color: tokens['--text-primary'] }}>Daily distance (last 7 days)</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: tokens['--text-muted'] }}>Not enough data yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={tokens['--border']} opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: tokens['--text-muted'] }} axisLine={{ stroke: tokens['--border'] }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: tokens['--text-muted'] }} unit=" km" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tokens['--bg-surface'],
                      border: `1px solid ${tokens['--border']}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: tokens['--text-primary'],
                    }}
                  />
                  <Bar dataKey="distanceKm" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.distanceKm === maxDistance ? tokens['--accent-primary'] : tokens['--accent-primary-muted']}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 5. Stop activity */}
        <div className="rounded-xl p-5" style={{ backgroundColor: tokens['--bg-surface'], border: `1px solid ${tokens['--border']}` }}>
          <h2 className="text-[13px] font-semibold" style={{ color: tokens['--text-primary'] }}>Stop activity</h2>
          <p className="text-[11px] mb-4" style={{ color: tokens['--text-muted'] }}>
            Arrival/departure frequency per stop. Requires bus stops to be configured.
          </p>
          {stopActivity.stopActivity.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: tokens['--text-muted'] }}>No stop activity recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {stopActivity.stopActivity.map((stop) => (
                <li key={stop.name} className="flex items-center justify-between text-sm">
                  <span style={{ color: tokens['--text-primary'] }}>{stop.name}</span>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: tokens['--badge-success-bg'], color: tokens['--badge-success-text'] }}
                  >
                    {stop.eventCount} events
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 6. Per-device breakdown */}
        <div className="rounded-xl p-5 overflow-x-auto" style={{ backgroundColor: tokens['--bg-surface'], border: `1px solid ${tokens['--border']}` }}>
          <h2 className="text-[13px] font-semibold mb-4" style={{ color: tokens['--text-primary'] }}>Per-device breakdown</h2>
          {overview.perDevice.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: tokens['--text-muted'] }}>
              No buses registered yet. Add one in Device Center to see analytics here.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${tokens['--border']}` }}>
                  <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: tokens['--text-muted'] }}>Bus</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: tokens['--text-muted'] }}>Distance</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: tokens['--text-muted'] }}>Avg speed</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: tokens['--text-muted'] }}>Max speed</th>
                  <th className="pb-2 text-left text-xs font-medium" style={{ color: tokens['--text-muted'] }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {overview.perDevice.map((d) => {
                  const isMostActive = d.name === overview.mostActiveDevice?.name;
                  return (
                    <tr key={d.deviceId} style={{ borderBottom: `1px solid ${tokens['--border']}` }}>
                      <td className="py-2.5 pr-4" style={{ color: tokens['--text-primary'], fontWeight: isMostActive ? 600 : 400 }}>
                        {d.name}
                      </td>
                      <td className="py-2.5 pr-4" style={{ color: tokens['--text-secondary'] }}>{d.distanceKm} km</td>
                      <td className="py-2.5 pr-4" style={{ color: tokens['--text-secondary'] }}>{d.avgSpeedKmh} km/h</td>
                      <td className="py-2.5 pr-4" style={{ color: tokens['--text-secondary'] }}>{d.maxSpeedKmh} km/h</td>
                      <td className="py-2.5" style={{ color: tokens['--text-secondary'] }}>{d.pointCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}