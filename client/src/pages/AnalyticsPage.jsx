// client/src/pages/AnalyticsPage.jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as analyticsApi from '../features/analytics/api/analyticsApi.js';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';

function StatCard({ label, value, sub }) {
  return (
    <div className="glass rounded-2xl shadow-soft p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <button
          onClick={() => downloadCsv(overview?.perDevice || [], 'fleet-analytics.csv')}
          className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition self-start"
        >
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total distance" value={`${overview.totalDistanceKm} km`} />
        <StatCard label="Tracked time" value={`${Math.round(overview.totalTrackedMinutes / 60)} hrs`} />
        <StatCard label="Buses" value={overview.deviceCount} />
        <StatCard label="Stop events" value={overview.geofenceEventCount} />
      </div>

      {overview.mostActiveDevice && (
        <div className="glass rounded-2xl shadow-soft p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400">Most active bus</p>
          <p className="text-lg font-semibold">{overview.mostActiveDevice.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {overview.mostActiveDevice.distanceKm} km · avg {overview.mostActiveDevice.avgSpeedKmh} km/h
          </p>
        </div>
      )}

      <div className="glass rounded-2xl shadow-soft p-5">
        <h2 className="text-sm font-semibold mb-4">Daily distance (last 7 days)</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Not enough data yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit=" km" />
                <Tooltip />
                <Bar dataKey="distanceKm" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl shadow-soft p-5">
        <h2 className="text-sm font-semibold mb-1">Stop activity</h2>
        <p className="text-xs text-gray-400 mb-4">
          Arrival/departure frequency per stop. Requires bus stops to be configured.
        </p>
        {stopActivity.stopActivity.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No stop activity recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {stopActivity.stopActivity.map((stop) => (
              <li key={stop.name} className="flex items-center justify-between text-sm">
                <span>{stop.name}</span>
                <span className="text-gray-500 dark:text-gray-400">{stop.eventCount} events</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass rounded-2xl shadow-soft p-5">
        <h2 className="text-sm font-semibold mb-4">Per-device breakdown</h2>
        {overview.perDevice.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No buses registered yet. Add one in Device Center to see analytics here.
          </p>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="pb-2 pr-4">Bus</th>
                <th className="pb-2 pr-4">Distance</th>
                <th className="pb-2 pr-4">Avg speed</th>
                <th className="pb-2 pr-4">Max speed</th>
                <th className="pb-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {overview.perDevice.map((d) => (
                <tr key={d.deviceId} className="border-b border-gray-100 dark:border-gray-900 last:border-0">
                  <td className="py-2 pr-4">{d.name}</td>
                  <td className="py-2 pr-4">{d.distanceKm} km</td>
                  <td className="py-2 pr-4">{d.avgSpeedKmh} km/h</td>
                  <td className="py-2 pr-4">{d.maxSpeedKmh} km/h</td>
                  <td className="py-2">{d.pointCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}