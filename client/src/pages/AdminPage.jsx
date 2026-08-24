// client/src/pages/AdminPage.jsx
import { useEffect, useState } from 'react';
import * as adminApi from '../features/admin/api/adminApi';
import UserTable from '../features/admin/components/UserTable';
import { useToast } from '../app/ToastContext';
import { useAuth } from '../app/AuthContext';
import { useTheme } from '../app/ThemeContext';

/* ─── SVG Icons ─── */
const IconUsers = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconBus = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
  </svg>
);

const IconSignal = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
  </svg>
);

const IconMapPin = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconSearch = ({ size = 15, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconTrash = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconEmpty = ({ size = 32, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><line x1="8" y1="15" x2="16" y2="15" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

/* ─── Tokens ─── */
const lightTokens = {
  '--bg-page': '#F4EFE6', '--bg-surface': '#FFFFFF', '--border': '#E1D9C8',
  '--text-primary': '#173B32', '--text-secondary': '#5B6B5F', '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61', '--accent-eta': '#D59A3A', '--accent-critical': '#B94A3A',
  '--badge-success-bg': '#EAF3DE', '--badge-success-text': '#3B6D26',
};

const darkTokens = {
  '--bg-page': '#12181A', '--bg-surface': '#182220', '--border': '#263531',
  '--text-primary': '#F1EEE4', '--text-secondary': '#8A9690', '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C', '--accent-eta': '#E3B15E', '--accent-critical': '#C15D4C',
  '--badge-success-bg': 'rgba(94,140,97,0.15)', '--badge-success-text': '#79B37C',
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

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200"
      style={{ backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--border)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const accentHex = tokens['--accent-primary'] || '#5E8C61';
  const etaHex = tokens['--accent-eta'] || '#D59A3A';
  const criticalHex = tokens['--accent-critical'] || '#B94A3A';

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('users');
  const [deviceDeleteConfirmId, setDeviceDeleteConfirmId] = useState(null);

  async function refreshAll() {
    setIsLoading(true);
    try {
      const [overviewData, usersData, devicesData] = await Promise.all([
        adminApi.getOverview(),
        adminApi.listUsers(),
        adminApi.listAllDevices(),
      ]);
      setOverview(overviewData);
      setUsers(usersData);
      setDevices(devicesData);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { refreshAll(); }, []);

  async function handleSearch(value) {
    setSearch(value);
    const results = await adminApi.listUsers(value);
    setUsers(results);
  }

  async function handleSuspend(id) {
    if (id === currentUser?.id) return showToast("You can't suspend your own account", 'error');
    await adminApi.suspendUser(id);
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isSuspended: true } : u)));
    showToast('User suspended', 'success');
  }

  async function handleActivate(id) {
    await adminApi.activateUser(id);
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isSuspended: false } : u)));
    showToast('User activated', 'success');
  }

  async function handleDelete(id) {
    if (id === currentUser?.id) return showToast("You can't delete your own account from here", 'error');
    await adminApi.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u._id !== id));
    showToast('User deleted', 'success');
  }

  async function handleDeleteDevice(id) {
    await adminApi.adminDeleteDevice(id);
    setDevices((prev) => prev.filter((d) => d._id !== id));
    setDeviceDeleteConfirmId(null);
    showToast('Device deleted', 'success');
  }

  async function handleToggleTracking(id, enabled) {
    await adminApi.adminToggleTracking(id, enabled);
    setDevices((prev) => prev.map((d) => (d._id === id ? { ...d, trackingEnabled: enabled } : d)));
  }

  if (isLoading) {
    return (
      <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Admin panel</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            System-wide management, visible only to administrators.
          </p>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard Icon={IconUsers} label="Total users" value={overview.totalUsers} tint={accentHex + '18'} iconColor={accentHex} />
          <StatCard Icon={IconBus} label="Total buses" value={overview.totalDevices} tint={etaHex + '18'} iconColor={etaHex} valueColor="var(--accent-eta)" />
          <StatCard Icon={IconSignal} label="Online now" value={overview.onlineDevices} tint={accentHex + '18'} iconColor={accentHex} valueColor="var(--accent-primary)" />
          <StatCard Icon={IconMapPin} label="Bus stops" value={overview.totalGeofences} tint={criticalHex + '18'} iconColor={criticalHex} valueColor="var(--accent-critical)" />
        </div>

        {/* Tabs */}
        <div className="flex gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
          {['users', 'devices'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pb-2.5 text-sm font-medium capitalize transition-colors"
              style={{
                color: tab === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderBottom: tab === t ? '2px solid var(--accent-primary)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div className="p-5 pb-0">
              <div className="relative max-w-sm">
                <IconSearch
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search users by name or email…"
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-[1.5px] transition-all"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    '--tw-ring-color': 'var(--accent-primary)',
                  }}
                />
              </div>
            </div>
            <div className="px-5 pb-5 pt-4">
              {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: 'var(--bg-page)' }}
                  >
                    <IconEmpty size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No users found</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Try adjusting your search.</p>
                </div>
              ) : (
                <UserTable users={users} onSuspend={handleSuspend} onActivate={handleActivate} onDelete={handleDelete} tokens={tokens} />
              )}
            </div>
          </div>
        )}

        {/* Devices tab */}
        {tab === 'devices' && (
          <div
            className="rounded-2xl overflow-hidden overflow-x-auto"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div className="p-5">
              {devices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: 'var(--bg-page)' }}
                  >
                    <IconBus size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No devices registered</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Devices will appear once users add them.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Device</th>
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Owner</th>
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                      <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tracking</th>
                      <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((d) => (
                      <tr key={d._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: 'var(--accent-primary)' + '18', color: 'var(--accent-primary)' }}
                            >
                              <IconBus size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
                              {d.identifier && (
                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{d.identifier}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {d.ownerId?.email || 'Unknown'}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                            style={
                              d.status === 'online'
                                ? { backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)' }
                                : { backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }
                            }
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: d.status === 'online' ? 'var(--badge-success-text)' : 'var(--text-muted)' }}
                            />
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <Toggle enabled={d.trackingEnabled} onChange={(v) => handleToggleTracking(d._id, v)} />
                        </td>
                        <td className="py-3">
                          {deviceDeleteConfirmId === d._id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium" style={{ color: 'var(--accent-critical)' }}>Delete?</span>
                              <button
                                onClick={() => handleDeleteDevice(d._id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: 'var(--accent-critical)' }}
                              >
                                <IconTrash size={12} />
                                Yes
                              </button>
                              <button
                                onClick={() => setDeviceDeleteConfirmId(null)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-black/[0.03] transition-colors"
                                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeviceDeleteConfirmId(d._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                              style={{ color: 'var(--accent-critical)', border: '1px solid var(--accent-critical)40', backgroundColor: 'var(--accent-critical)' + '10' }}
                            >
                              <IconTrash size={12} />
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}