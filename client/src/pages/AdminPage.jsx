// client/src/pages/AdminPage.jsx
import { useEffect, useState } from 'react';
import * as adminApi from '../features/admin/api/adminApi';
import UserTable from '../features/admin/components/UserTable';
import { useToast } from '../app/ToastContext';
import { useAuth } from '../app/AuthContext';
import { useTheme } from '../app/ThemeContext';

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

function StatCard({ icon, label, value, tint, valueColor, tokens }) {
  return (
    <div className="rounded-[11px] px-4 py-3.5 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <span
        className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: tint }}
      >
        {icon}
      </span>
      <div>
        <p className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-base font-semibold" style={{ color: valueColor || 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('users');

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
    if (!confirm('Delete this user and all their devices/stops? This cannot be undone.')) return;
    await adminApi.deleteUser(id);
    setUsers((prev) => prev.filter((u) => u._id !== id));
    showToast('User deleted', 'success');
  }

  async function handleDeleteDevice(id) {
    if (!confirm('Delete this device?')) return;
    await adminApi.adminDeleteDevice(id);
    setDevices((prev) => prev.filter((d) => d._id !== id));
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
            <div key={i} className="h-20 rounded-[11px] animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* 2. Header */}
        <div>
          <h1 className="text-[19px] font-semibold" style={{ color: 'var(--text-primary)' }}>Admin panel</h1>
          <p className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
            System-wide management, visible only to administrators.
          </p>
        </div>

        {/* 3. Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Total users" value={overview.totalUsers} tint="var(--accent-primary)33" tokens={tokens} />
          <StatCard icon="🚌" label="Total buses" value={overview.totalDevices} tint="var(--accent-eta)33" tokens={tokens} />
          <StatCard icon="📡" label="Online now" value={overview.onlineDevices} tint="var(--accent-primary)33" valueColor="var(--accent-primary)" tokens={tokens} />
          <StatCard icon="📍" label="Bus stops" value={overview.totalGeofences} tint="var(--accent-critical)33" tokens={tokens} />
        </div>

        {/* 4. Tabs */}
        <div className="flex gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
          {['users', 'devices'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pb-2.5 text-sm capitalize"
              style={{
                color: tab === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: tab === t ? 600 : 400,
                borderBottom: tab === t ? '2px solid var(--accent-primary)' : '2px solid transparent',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 5. Users tab */}
        {tab === 'users' && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="p-5 pb-0">
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="🔍 Search users by name or email…"
                className="w-full max-w-sm rounded-xl px-3.5 py-2 text-sm mb-4 focus:outline-none"
                style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="px-5 pb-5">
              <UserTable users={users} onSuspend={handleSuspend} onActivate={handleActivate} onDelete={handleDelete} tokens={tokens} />
            </div>
          </div>
        )}

        {/* 6. Devices tab */}
        {tab === 'devices' && (
          <div className="rounded-xl overflow-hidden overflow-x-auto p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Name</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Owner</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Tracking</th>
                  <th className="pb-2 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2.5 pr-4" style={{ color: 'var(--text-primary)' }}>{d.name}</td>
                    <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>{d.ownerId?.email || 'Unknown'}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={
                          d.status === 'online'
                            ? { backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)' }
                            : { backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }
                        }
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <input type="checkbox" checked={d.trackingEnabled} onChange={(e) => handleToggleTracking(d._id, e.target.checked)} />
                    </td>
                    <td className="py-2.5">
                      <button onClick={() => handleDeleteDevice(d._id)} className="text-xs font-medium hover:underline" style={{ color: 'var(--accent-critical)' }}>
                        Delete
                      </button>
                    </td>
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