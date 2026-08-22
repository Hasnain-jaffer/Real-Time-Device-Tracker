// client/src/pages/DeviceCenterPage.jsx
import { useMemo, useState } from 'react';
import { useDevices } from '../features/devices/hooks/useDevices';
import DeviceCard from '../features/devices/components/DeviceCard';
import DeviceFormModal from '../features/devices/components/DeviceFormModal';
import { useToast } from '../app/ToastContext';
import { useAuth } from '../app/AuthContext';
import { useTheme } from '../app/ThemeContext';

const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--bg-surface': '#FFFFFF',
  '--border': '#E1D9C8',
  '--text-primary': '#173B32',
  '--text-secondary': '#5B6B5F',
  '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61',
  '--accent-critical': '#B94A3A',
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
  '--accent-critical': '#C15D4C',
  '--badge-success-bg': 'rgba(94,140,97,0.15)',
  '--badge-success-text': '#79B37C',
};

export default function DeviceCenterPage() {
  const { devices, isLoading, error, addDevice, editDevice, removeDevice, regenerateKey } = useDevices();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isAdmin = user?.role === 'admin';
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

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

  const onlineCount = devices.filter((d) => d.status === 'online').length;

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
<div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">      <div className="max-w-4xl mx-auto space-y-4">
        {/* 1. Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-semibold" style={{ color: 'var(--text-primary)' }}>Devices</h1>
            <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {devices.length} registered · {onlineCount} online right now
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <span aria-hidden="true">+</span> Register bus
            </button>
          )}
        </div>

        {/* 2. Search + filter row */}
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or route…"
            aria-label="Search devices"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ minWidth: '200px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <div className="flex flex-wrap gap-2">
            {['all', 'online', 'offline'].map((option) => (
              <button
                key={option}
                onClick={() => setStatusFilter(option)}
                className="px-3 py-2 rounded-xl text-xs font-medium capitalize"
                style={
                  statusFilter === option
                    ? { backgroundColor: 'var(--accent-primary)', color: '#fff' }
                    : { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                }
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm" style={{ color: 'var(--accent-critical)' }}>{error}</p>}

        {/* 3. Device rows */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[110px] rounded-[14px] animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="rounded-[14px] p-10 text-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '28px' }}>🚌</span>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {devices.length === 0 ? 'No buses registered yet.' : 'No devices match your search or filter.'}
            </p>
            {isAdmin && devices.length === 0 && (
              <button
                onClick={openAddModal}
                className="mt-4 rounded-xl px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Register your first bus
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device._id}
                device={device}
                onRename={openRenameModal}
                onDelete={handleDelete}
                onToggleTracking={handleToggleTracking}
                onRegenerateKey={handleRegenerateKey}
                isAdmin={isAdmin}
                tokens={tokens}
              />
            ))}
          </div>
        )}

        {isAdmin && (
            <DeviceFormModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
            initialValues={editingDevice}
            tokens={tokens}
          />
        )}
      </div>
    </div>
  );
}