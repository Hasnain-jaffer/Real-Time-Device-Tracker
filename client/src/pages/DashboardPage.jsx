// client/src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useSocket } from '../app/SocketProvider';
import apiClient from '../lib/apiClient';

export default function DashboardPage() {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    apiClient
      .get('/devices')
      .then(({ data }) => setDevices(data.devices))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  function handleFindMyBus() {
    if (!selectedId) return;
    navigate(`/tracking?device=${selectedId}`);
  }

  const onlineCount = devices.filter((d) => d.status === 'online').length;

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-semibold">
            Hi, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p
            className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1"
            role="status"
            aria-live="polite"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`} />
            {isConnected ? `Live · ${onlineCount} bus${onlineCount !== 1 ? 'es' : ''} online` : 'Reconnecting…'}
          </p>
        </div>

        {/* Find your bus */}
        <div className="glass rounded-2xl shadow-soft p-6">
          <h2 className="font-semibold mb-1">Find your bus</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Select your route or bus number to jump straight to live tracking.
          </p>

          {isLoading ? (
            <div className="h-11 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ) : devices.length === 0 ? (
            <p className="text-sm text-gray-400">No buses registered yet.</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a bus or route…</option>
                {devices.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} {d.identifier ? `(${d.identifier})` : ''} — {d.status === 'online' ? 'Live' : 'Offline'}
                  </option>
                ))}
              </select>
              <button
                onClick={handleFindMyBus}
                disabled={!selectedId}
                className="rounded-xl bg-primary text-white px-5 py-2.5 text-sm font-medium shadow-soft hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Track it →
              </button>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/devices"
            className="glass rounded-2xl shadow-soft p-4 hover:border-primary/40 border border-transparent transition"
          >
            <p className="font-medium text-sm">All buses</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Browse every bus and route
            </p>
          </Link>
          <Link
            to="/tracking"
            className="glass rounded-2xl shadow-soft p-4 hover:border-primary/40 border border-transparent transition"
          >
            <p className="font-medium text-sm">Live map</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              See all active buses right now
            </p>
          </Link>
        </div>

        {/* Live buses right now */}
        {devices.filter((d) => d.status === 'online').length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1">
              Live right now
            </p>
            <div className="space-y-1.5">
              {devices
                .filter((d) => d.status === 'online')
                .slice(0, 4)
                .map((d) => (
                  <Link
                    key={d._id}
                    to={`/devices/${d._id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl glass shadow-soft hover:border-primary/40 border border-transparent transition"
                  >
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      {d.name}
                    </span>
                    <span className="text-xs text-gray-400">{d.identifier}</span>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}