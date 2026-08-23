// client/src/pages/DeviceStopsPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import apiClient from '../lib/apiClient';
import { useGeofences } from '../features/geofences/hooks/useGeofences';
import GeofenceLayer from '../features/geofences/components/GeofenceLayer';
import GeofenceFormModal from '../features/geofences/components/GeofenceFormModal';
import MapSizeFix from '../components/map/MapSizeFix';
import { useToast } from '../app/ToastContext';
import { useAuth } from '../app/AuthContext';
import { useTheme } from '../app/ThemeContext';

/* ─── SVG Icons ─── */
const IconArrowLeft = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconPlus = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconMapPin = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
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

const IconEmpty = ({ size = 40, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
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

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

/* ─── Custom Toggle ─── */
function Toggle({ enabled, onChange, label }) {
  return (
    <button
      onClick={onChange}
      className="flex items-center gap-2.5 group"
    >
      <div
        className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200"
        style={{ backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--border)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: enabled ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </div>
      <span className="text-xs font-semibold" style={{ color: enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {label}
      </span>
    </button>
  );
}

export default function DeviceStopsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isAdmin = user?.role === 'admin';
  const { showToast } = useToast();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const [device, setDevice] = useState(null);
  const { geofences, isLoading, addGeofence, editGeofence, removeGeofence } = useGeofences(id);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    apiClient.get(`/devices/${id}`).then(({ data }) => setDevice(data.device));
  }, [id]);

  async function handleSubmit(payload) {
    if (editing) {
      await editGeofence(editing._id, payload);
      showToast('Stop updated', 'success');
    } else {
      await addGeofence(payload);
      showToast('Stop added', 'success');
    }
  }

  async function handleDelete(fenceId) {
    await removeGeofence(fenceId);
    showToast('Stop deleted', 'success');
    setDeleteConfirmId(null);
  }

  async function handleToggleActive(fence) {
    await editGeofence(fence._id, { isActive: !fence.isActive });
  }

  const mapCenter = geofences.length > 0
    ? [geofences[0].latitude, geofences[0].longitude]
    : device?.lastLocation?.latitude
      ? [device.lastLocation.latitude, device.lastLocation.longitude]
      : [25.4610, 68.7183];

  const activeCount = geofences.filter((g) => g.isActive).length;

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Back */}
        <button
          onClick={() => navigate(`/devices/${id}`)}
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: 'var(--accent-primary)' }}
        >
          <IconArrowLeft size={14} /> Back to {device?.name || 'bus'}
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {device?.name || 'Bus'} — Stops
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              {geofences.length} stop{geofences.length !== 1 ? 's' : ''} · {activeCount} active
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: cardShadow }}
            >
              <IconPlus size={16} />
              Add stop
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-[320px] rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
            {[1, 2].map((i) => (
              <div key={i} className="h-[72px] rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : geofences.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center flex flex-col items-center"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-page)' }}>
              <IconEmpty size={32} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No stops set up yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Add stops to get notified when the bus arrives or leaves.
            </p>
            {isAdmin && (
              <button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                className="mt-5 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <IconPlus size={16} />
                Add your first stop
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Map */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ height: '320px', border: '1px solid var(--border)', boxShadow: cardShadow }}
            >
              <MapContainer
                center={mapCenter}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
              >
                <TileLayer
                  url={
                    theme === 'dark'
                      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                  }
                />
                <GeofenceLayer geofences={geofences} />
                <MapSizeFix />
              </MapContainer>

              {/* Map overlay badge */}
              <div
                className="absolute bottom-3 left-3 text-[11px] font-medium px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)', color: '#FFFFFF' }}
              >
                {geofences.length} stop{geofences.length !== 1 ? 's' : ''} on map
              </div>
            </div>

            {/* Stops list */}
            <div className="space-y-3">
              {geofences.map((fence) => (
                <div
                  key={fence._id}
                  className="rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 transition-all hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderLeftWidth: '3px',
                    borderLeftColor: fence.isActive ? fence.color || 'var(--accent-primary)' : 'var(--border)',
                    boxShadow: cardShadow,
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: fence.color ? fence.color + '18' : 'var(--bg-page)' }}
                    >
                      <IconMapPin size={18} style={{ color: fence.color || 'var(--accent-primary)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{fence.name}</p>
                      <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
                        {fence.type} · {fence.radiusMeters}m radius
                      </p>
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Toggle
                        enabled={fence.isActive}
                        onChange={() => handleToggleActive(fence)}
                        label={fence.isActive ? 'Active' : 'Inactive'}
                      />
                      <div className="w-px h-6" style={{ backgroundColor: 'var(--border)' }} />
                      <button
                        onClick={() => {
                          setEditing(fence);
                          setModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-black/5"
                        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                      >
                        <IconEdit size={13} />
                        Edit
                      </button>

                      {deleteConfirmId === fence._id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(fence._id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: 'var(--accent-critical)' }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black/[0.03] transition-colors"
                            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(fence._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-red-500/10"
                          style={{ color: 'var(--accent-critical)', border: '1px solid var(--accent-critical)', opacity: 0.8 }}
                        >
                          <IconTrash size={13} />
                          Delete
                        </button>
                      )}
                    </div>
                  ) : (
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={
                        fence.isActive
                          ? { backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)' }
                          : { backgroundColor: 'var(--bg-page)', color: 'var(--text-muted)' }
                      }
                    >
                      {fence.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {isAdmin && (
          <GeofenceFormModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
            initialValues={editing}
          />
        )}
      </div>
    </div>
  );
}