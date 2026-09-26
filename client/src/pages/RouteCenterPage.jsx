// client/src/pages/RouteCenterPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as routeApi from '../features/routes/api/routeApi';
import * as deviceApi from '../features/devices/api/deviceApi';
import { useTheme } from '../app/ThemeContext';
import { useToast } from '../app/ToastContext';

/* ─── SVG Icons ─── */
const IconBus = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
    <circle cx="7.5" cy="18" r="0.5" fill="currentColor" />
    <circle cx="16.5" cy="18" r="0.5" fill="currentColor" />
  </svg>
);

const IconPlus = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconRoute = ({ size = 32, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><line x1="12" y1="19" x2="20" y2="5" />
  </svg>
);

/* ─── Tokens ─── */
const lightTokens = {
  '--bg-page': '#F4EFE6', '--bg-surface': '#FFFFFF', '--border': '#E1D9C8',
  '--text-primary': '#173B32', '--text-secondary': '#5B6B5F', '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61', '--accent-critical': '#B94A3A',
};
const darkTokens = {
  '--bg-page': '#12181A', '--bg-surface': '#182220', '--border': '#263531',
  '--text-primary': '#F1EEE4', '--text-secondary': '#8A9690', '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C', '--accent-critical': '#C15D4C',
};

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function RouteCenterPage() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const [routes, setRoutes] = useState([]);
  const [devices, setDevices] = useState([]);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  function refresh() {
    setIsLoading(true);
    Promise.all([routeApi.listRoutes(), deviceApi.listDevices()])
      .then(([r, d]) => { setRoutes(r); setDevices(d); })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { refresh(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    await routeApi.createRoute({ name: newName });
    setNewName('');
    showToast('Route created', 'success');
    refresh();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this route? Its stops will also be removed.')) return;
    await routeApi.deleteRoute(id);
    showToast('Route deleted', 'success');
    refresh();
  }

  async function handleAssign(deviceId, routeId) {
    await routeApi.assignBusToRoute(deviceId, routeId || null);
    showToast('Bus assignment updated', 'success');
    refresh();
  }

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-[19px] font-semibold" style={{ color: 'var(--text-primary)' }}>Route Center</h1>
          <p className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
            Create routes and assign buses to them.
          </p>
        </div>

        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New route name (e.g. Route 4A)"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'var(--accent-primary)',
            }}
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--accent-primary)', boxShadow: cardShadow }}
          >
            <IconPlus size={15} />
            Create Route
          </button>
        </form>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)' }} />
            ))}
          </div>
        ) : routes.length === 0 ? (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <IconRoute size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No routes yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Create one above to get started.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((route) => {
              const assignedBuses = devices.filter((d) => d.routeId === route._id);
              return (
                <div
                  key={route._id}
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Link
                      to={`/routes/${route._id}`}
                      className="flex items-center gap-2 text-sm font-semibold hover:underline"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--accent-primary)' + '15', color: 'var(--accent-primary)' }}
                      >
                        <IconRoute size={13} />
                      </span>
                      {route.name}
                    </Link>
                    <button
                      onClick={() => handleDelete(route._id)}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition hover:opacity-80"
                      style={{ color: 'var(--accent-critical)', backgroundColor: 'var(--accent-critical)' + '10' }}
                    >
                      <IconTrash size={12} />
                      Delete
                    </button>
                  </div>

                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    {assignedBuses.length} bus{assignedBuses.length !== 1 ? 'es' : ''} assigned
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {devices.map((d) => {
                      const isAssignedHere = d.routeId === route._id;
                      return (
                        <button
                          key={d._id}
                          onClick={() => handleAssign(d._id, isAssignedHere ? null : route._id)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition hover:opacity-90 active:scale-[0.97]"
                          style={
                            isAssignedHere
                              ? { backgroundColor: 'var(--accent-primary)', color: '#fff' }
                              : {
                                  backgroundColor: 'var(--bg-page)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-secondary)',
                                }
                          }
                        >
                          <IconBus size={13} />
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}