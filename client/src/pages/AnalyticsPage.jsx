// client/src/pages/AnalyticsPage.jsx
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as analyticsApi from '../features/analytics/api/analyticsApi';
import { useTheme } from '../app/ThemeContext';

/* ─── SVG Icons ─── */
const IconRoute = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><line x1="12" y1="19" x2="20" y2="5" />
  </svg>
);

const IconClock = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconBus = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
  </svg>
);

const IconMapPin = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconDownload = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconTrophy = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const IconActivity = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconEmpty = ({ size = 40, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const IconGauge = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 2v4" /><path d="M12 18a6 6 0 0 0 6-6c0-1-.5-2.5-1.5-3.5" /><path d="M12 18a6 6 0 0 1-6-6c0-1 .5-2.5 1.5-3.5" />
  </svg>
);

/* ─── Tokens ─── */
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

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

/* ─── Reusable Components ─── */
function StatCard({ Icon, label, value, tint, iconColor, valueColor }) {
  return (
    <div
      className="rounded-2xl px-5 py-4 flex items-center gap-3.5"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: tint, color: iconColor || 'var(--accent-primary)' }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-lg font-bold tracking-tight" style={{ color: valueColor || 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{ backgroundColor: 'var(--bg-page)' }}
      >
        <Icon size={24} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      {description && <p className="text-[11px] mt-0.5 max-w-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>}
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

  const accentHex = tokens['--accent-primary'] || '#5E8C61';
  const etaHex = tokens['--accent-eta'] || '#D59A3A';
  const criticalHex = tokens['--accent-critical'] || '#B94A3A';

  const [overview, setOverview] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [stopActivity, setStopActivity] = useState({ stopActivity: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getOverview(),
      analyticsApi.getDailyDistance(7),
      analyticsApi.getStopActivity(),
    ])
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
        <div className="max-w-5xl mx-auto space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
            ))}
          </div>
          <div className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
          <div className="h-48 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
        </div>
      </div>
    );
  }

  const maxDistance = chartData.length > 0 ? Math.max(...chartData.map((d) => d.distanceKm)) : 0;

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              Fleet performance and usage insights
            </p>
          </div>
          <button
            onClick={() => downloadCsv(overview?.perDevice || [], 'fleet-analytics.csv')}
            className="flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.98] flex-shrink-0"
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              boxShadow: cardShadow,
            }}
          >
            <IconDownload size={16} style={{ color: 'var(--accent-primary)' }} />
            Export CSV
          </button>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard Icon={IconRoute} label="Total distance" value={`${overview.totalDistanceKm} km`} tint={accentHex + '18'} iconColor={accentHex} />
          <StatCard Icon={IconClock} label="Tracked time" value={`${Math.round(overview.totalTrackedMinutes / 60)} hrs`} tint={etaHex + '18'} iconColor={etaHex} valueColor="var(--accent-eta)" />
          <StatCard Icon={IconBus} label="Buses" value={overview.deviceCount} tint={accentHex + '18'} iconColor={accentHex} />
          <StatCard Icon={IconMapPin} label="Stop events" value={overview.geofenceEventCount} tint={criticalHex + '18'} iconColor={criticalHex} valueColor="var(--accent-critical)" />
        </div>

        {/* Most active bus */}
        {overview.mostActiveDevice && (
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: etaHex + '18', color: etaHex }}
            >
              <IconTrophy size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Most active bus</p>
              <p className="text-[15px] font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{overview.mostActiveDevice.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {overview.mostActiveDevice.distanceKm} km · avg {overview.mostActiveDevice.avgSpeedKmh} km/h
              </p>
            </div>
            <div
              className="text-[11px] font-bold px-3 py-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)' }}
            >
              Top performer
            </div>
            </div>     
        )}

        {/* Daily distance chart */}
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
        >
          <h2 className="text-[15px] font-bold mb-5" style={{ color: 'var(--text-primary)' }}>Daily distance (last 7 days)</h2>
          {chartData.length === 0 ? (
            <EmptyState
              Icon={IconRoute}
              title="Not enough data yet"
              description="Check back after buses have been tracking for a few days."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    unit=" km"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-page)', opacity: 0.5 }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      boxShadow: cardShadow,
                      padding: '10px 14px',
                    }}
                    itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    labelStyle={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 11 }}
                  />
                  <Bar dataKey="distanceKm" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.distanceKm === maxDistance ? 'var(--accent-primary)' : 'var(--accent-primary-muted)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Stop activity */}
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
        >
          <div className="flex items-start gap-2.5 mb-1">
            <IconActivity size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>Stop activity</h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Arrival/departure frequency per stop. Requires bus stops to be configured.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {stopActivity.stopActivity.length === 0 ? (
              <EmptyState
                Icon={IconMapPin}
                title="No stop activity recorded yet"
                description="Add geofence stops to see arrival and departure events here."
              />
            ) : (
              stopActivity.stopActivity.map((stop) => (
                <div
                  key={stop.name}
                  className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-black/[0.02]"
                  style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: accentHex + '18', color: accentHex }}
                    >
                      <IconMapPin size={14} />
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{stop.name}</span>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)' }}
                  >
                    {stop.eventCount} events
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Per-device breakdown */}
        <div
          className="rounded-2xl p-5 sm:p-6 overflow-x-auto"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
        >
          <h2 className="text-[15px] font-bold mb-5" style={{ color: 'var(--text-primary)' }}>Per-device breakdown</h2>
          {overview.perDevice.length === 0 ? (
            <EmptyState
              Icon={IconBus}
              title="No buses registered yet"
              description="Add a device in Device Center to see analytics here."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Bus</th>
                  <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Distance</th>
                  <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Avg speed</th>
                  <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Max speed</th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {overview.perDevice.map((d) => {
                  const isMostActive = d.name === overview.mostActiveDevice?.name;
                  return (
                    <tr key={d.deviceId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: isMostActive ? etaHex + '18' : 'var(--bg-page)',
                              color: isMostActive ? etaHex : 'var(--text-muted)',
                              border: isMostActive ? `1px solid ${etaHex}30` : '1px solid var(--border)',
                            }}
                          >
                            <IconBus size={14} />
                          </div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontWeight: isMostActive ? 700 : 600 }}>
                            {d.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{d.distanceKm} km</td>
                      <td className="py-3 pr-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{d.avgSpeedKmh} km/h</td>
                      <td className="py-3 pr-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{d.maxSpeedKmh} km/h</td>
                      <td className="py-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{d.pointCount}</td>
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