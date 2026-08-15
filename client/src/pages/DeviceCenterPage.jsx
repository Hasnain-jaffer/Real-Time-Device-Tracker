// client/src/pages/DeviceCenterPage.jsx
import { useMemo, useState } from 'react';
import { useDevices } from '../features/devices/hooks/useDevices';
import DeviceCard from '../features/devices/components/DeviceCard';
import DeviceFormModal from '../features/devices/components/DeviceFormModal';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useToast } from '../app/ToastContext';
import { useAuth } from '../app/AuthContext';

export default function DeviceCenterPage() {
  const { devices, isLoading, error, addDevice, editDevice, removeDevice, regenerateKey } = useDevices();
  const { showToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.identifier?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [devices, search, statusFilter]);

  function openAddModal() {
    setEditingDevice(null);
    setModalOpen(true);
  }

  function openRenameModal(device) {
    setEditingDevice(device);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    if (editingDevice) {
      await editDevice(editingDevice._id, { name: payload.name, identifier: payload.identifier });
      showToast('Device updated', 'success');
    } else {
      await addDevice(payload);
      showToast('Device registered', 'success');
    }
  }

  async function handleDelete(id) {
    await removeDevice(id);
    showToast('Device deleted', 'success');
  }

  async function handleToggleTracking(id, enabled) {
    await editDevice(id, { trackingEnabled: enabled });
  }

  async function handleRegenerateKey(id) {
    await regenerateKey(id);
    showToast('Device key regenerated — update your tracker with the new key', 'info');
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Device Center</h1>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-medium shadow-soft hover:bg-primary-600 transition"
          >
            + Register Bus
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or route…"
          aria-label="Search devices"
          className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-2">
          {['all', 'online', 'offline'].map((option) => (
            <button
              key={option}
              onClick={() => setStatusFilter(option)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border capitalize transition ${
                statusFilter === option
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="glass rounded-2xl shadow-soft p-10 text-center text-gray-500 dark:text-gray-400">
          {devices.length === 0
            ? 'No buses registered yet. Click "Register Bus" to add your first one.'
            : 'No devices match your search or filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <DeviceCard
              key={device._id}
              device={device}
              onRename={openRenameModal}
              onDelete={handleDelete}
              onToggleTracking={handleToggleTracking}
              onRegenerateKey={handleRegenerateKey}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {isAdmin && (
      <DeviceFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      )}
    </div>
  );
}