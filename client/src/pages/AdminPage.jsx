// client/src/pages/AdminPage.jsx
import { useEffect, useState } from 'react';
import * as adminApi from '../features/admin/api/adminApi';
import UserTable from '../features/admin/components/UserTable';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useToast } from '../app/ToastContext';
import { useAuth } from '../app/AuthContext';

function StatCard({ label, value }) {
  return (
    <div className="glass rounded-2xl shadow-soft p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
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

  useEffect(() => {
    refreshAll();
  }, []);

  async function handleSearch(value) {
    setSearch(value);
    const results = await adminApi.listUsers(value);
    setUsers(results);
  }

  async function handleSuspend(id) {
    if (id === currentUser?.id) {
      showToast("You can't suspend your own account", 'error');
      return;
    }
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
    if (id === currentUser?.id) {
      showToast("You can't delete your own account from here", 'error');
      return;
    }
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
      <div className="max-w-6xl mx-auto p-6 space-y-4">
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
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          System-wide management — visible only to administrators.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total users" value={overview.totalUsers} />
        <StatCard label="Total buses" value={overview.totalDevices} />
        <StatCard label="Online now" value={overview.onlineDevices} />
        <StatCard label="Bus stops" value={overview.totalGeofences} />
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {['users', 'devices'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="glass rounded-2xl shadow-soft p-5">
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users by name or email…"
            className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 px-3.5 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <UserTable
            users={users}
            onSuspend={handleSuspend}
            onActivate={handleActivate}
            onDelete={handleDelete}
          />
        </div>
      )}

      {tab === 'devices' && (
        <div className="glass rounded-2xl shadow-soft p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Owner</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Tracking</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d._id} className="border-b border-gray-100 dark:border-gray-900 last:border-0">
                  <td className="py-2.5 pr-4">{d.name}</td>
                  <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                    {d.ownerId?.email || 'Unknown'}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        d.status === 'online' ? 'bg-success/10 text-success' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <input
                      type="checkbox"
                      checked={d.trackingEnabled}
                      onChange={(e) => handleToggleTracking(d._id, e.target.checked)}
                    />
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => handleDeleteDevice(d._id)}
                      className="text-xs text-danger hover:underline"
                    >
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
  );
}