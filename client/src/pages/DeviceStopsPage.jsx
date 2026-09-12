// client/src/pages/DeviceStopsPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useTheme } from '../app/ThemeContext';
import GeofenceFormModal from '../features/geofences/components/GeofenceFormModal';

/* ─── SVG Icons ─── */
const IconArrowLeft = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconMapPin = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconPlus = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconEdit = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconRoute = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><line x1="12" y1="19" x2="20" y2="5" />
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
  '--accent-critical': '#B94A3A',
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
};

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function DeviceStopsPage() {
  const { id } = useParams();
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const [device, setDevice] = useState(null);
  const [stops, setStops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      apiClient.get(`/devices/${id}`),
      apiClient.get(`/devices/${id}/stops`),
    ])
      .then(([deviceRes, stopsRes]) => {
        setDevice(deviceRes.data.device);
        const sorted = (stopsRes.data.stops || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setStops(sorted);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleDelete(stopId) {
    if (!window.confirm('Delete this stop?')) return;
    try {
      await apiClient.delete(`/geofences/${stopId}`);
      setStops((prev) => prev.filter((s) => s._id !== stopId));
    } catch (err) {
      alert('Failed to delete stop.');
    }
  }

  async function handleSubmit(data) {
    if (editingStop) {
      const { data: updated } = await apiClient.patch(`/geofences/${editingStop._id}`, data);
      setStops((prev) => prev.map((s) => (s._id === updated.stop._id ? updated.stop : s)));
    } else {
      const { data: created } = await apiClient.post('/geofences', { ...data, deviceId: id });
      setStops((prev) => [...prev, created.stop].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }
  }

  function openAdd() {
    setEditingStop(null);
    setModalOpen(true);
  }

  function openEdit(stop) {
    setEditingStop(stop);
    setModalOpen(true);
  }

  return (
    <div
      className="flex-1 w-full p-4 sm:p-6 lg:p-8"
      style={{ ...tokens, backgroundColor: 'var(--bg-page)' }}
    >
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to={`/devices/${id}`}
                className="flex items-center gap-1 text-xs font-semibold transition hover:opacity-80"
                style={{ color: 'var(--accent-primary)' }}
              >
                <IconArrowLeft size={12} />
                Back to Device
              </Link>
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Manage Stops
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              {device?.name || 'Device'} — {stops.length} {stops.length === 1 ? 'stop' : 'stops'} configured
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/devices/${id}/route`}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                boxShadow: cardShadow,
              }}
            >
              <IconRoute size={14} />
              View Route
            </Link>

            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: cardShadow }}
            >
              <IconPlus size={14} />
              Add Stop
            </button>
          </div>
        </div>

        {/* Stops List */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
        >
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--border)' }} />
              ))}
            </div>
          ) : stops.length === 0 ? (
            <div className="p-10 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}
              >
                <IconMapPin size={24} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                No stops yet
              </p>
              <p className="text-[11px] mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
                Add stops to build the route for this device.
              </p>
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: 'var(--accent-primary)', boxShadow: cardShadow }}
              >
                <IconPlus size={14} />
                Add First Stop
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {stops.map((stop, index) => (
                <div
                  key={stop._id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  {/* Order number */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{
                      backgroundColor: index === 0 || index === stops.length - 1 ? 'var(--accent-primary)' + '18' : 'var(--bg-page)',
                      color: index === 0 || index === stops.length - 1 ? 'var(--accent-primary)' : 'var(--text-muted)',
                      border: `1px solid ${index === 0 || index === stops.length - 1 ? 'var(--accent-primary)' + '30' : 'var(--border)'}`,
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {stop.name}
                      </h3>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: stop.type === 'start' || stop.type === 'home' ? 'var(--accent-primary)' + '15' : 'var(--bg-page)',
                          color: stop.type === 'start' || stop.type === 'home' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        }}
                      >
                        {stop.type || 'stop'}
                      </span>
                      {index === 0 && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-primary)' + '15', color: 'var(--accent-primary)' }}>
                          Start
                        </span>
                      )}
                      {index === stops.length - 1 && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-eta)' + '15', color: 'var(--accent-eta)' }}>
                          End
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5 font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                      {stop.latitude?.toFixed(5)}, {stop.longitude?.toFixed(5)} · Radius: {stop.radiusMeters || 150}m
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(stop)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80"
                      style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--bg-page)' }}
                      title="Edit"
                    >
                      <IconEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(stop._id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80"
                      style={{ color: 'var(--accent-critical)', backgroundColor: 'var(--bg-page)' }}
                      title="Delete"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <GeofenceFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={editingStop}
        tokens={tokens}
      />
    </div>
  );
}