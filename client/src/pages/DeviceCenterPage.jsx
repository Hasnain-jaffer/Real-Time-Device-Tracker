// client/src/pages/DeviceCenterPage.jsx
import { useMemo, useState } from 'react';
import { useDevices } from '../features/devices/hooks/useDevices';
import DeviceCard from '../features/devices/components/DeviceCard';
import DeviceFormModal from '../features/devices/components/DeviceFormModal';
import { useToast } from '../app/ToastContext';
import { useAuth } from '../app/AuthContext';
import { useTheme } from '../app/ThemeContext';

/* ─── SVG Icons (now properly forward className + style) ─── */
const IconPlus = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconSearch = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconEmpty = ({ size = 32, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
  </svg>
);

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

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

  const filterOptions = [
    { key: 'all', label: 'All', dot: null },
    { key: 'online', label: 'Online', dot: 'var(--accent-primary)' },
    { key: 'offline', label: 'Offline', dot: 'var(--text-muted)' },
  ];

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Devices</h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              {devices.length} registered · {onlineCount} online right now
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: cardShadow }}
            >
              <IconPlus size={16} />
              Register bus
            </button>
          )}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1" style={{ minWidth: '220px' }}>
            <IconSearch
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or route…"
              aria-label="Search devices"
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                boxShadow: cardShadow,
                '--tw-ring-color': 'var(--accent-primary)',
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setStatusFilter(option.key)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all active:scale-95"
                style={
                  statusFilter === option.key
                    ? {
                        backgroundColor: 'var(--accent-primary)',
                        color: '#fff',
                        boxShadow: cardShadow,
                      }
                    : {
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        boxShadow: cardShadow,
                      }
                }
              >
                {option.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: option.dot }} />}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: 'rgba(185,74,58,0.1)', color: 'var(--accent-critical)', border: '1px solid rgba(185,74,58,0.2)' }}>
            {error}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[140px] rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : filteredDevices.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center flex flex-col items-center"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-page)' }}>
              <IconEmpty size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {devices.length === 0 ? 'No buses registered yet' : 'No devices match your search'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {devices.length === 0 ? 'Get started by registering your first bus' : 'Try adjusting your filters'}
            </p>
            {isAdmin && devices.length === 0 && (
              <button
                onClick={openAddModal}
                className="mt-5 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <IconPlus size={16} />
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