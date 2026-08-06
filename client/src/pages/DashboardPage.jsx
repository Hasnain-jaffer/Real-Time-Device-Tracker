// client/src/pages/DashboardPage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useSocket } from '../app/SocketProvider';

export default function DashboardPage() {
  const { user } = useAuth();
  const { isConnected } = useSocket();

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="glass rounded-2xl shadow-soft p-6">
        <p>Welcome, {user?.name || 'device tracker user'} 👋</p>

        <p
          className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5"
          role="status"
          aria-live="polite"
        >
          Socket status:{' '}
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isConnected ? 'bg-success' : 'bg-danger'
            }`}
            aria-hidden="true"
          />
          {isConnected ? 'Connected' : 'Disconnected — retrying…'}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link
            to="/tracking"
            className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-medium shadow-soft hover:bg-primary-600 transition"
          >
            Open Live Tracking →
          </Link>
          <Link
            to="/history"
            className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            View Device History →
          </Link>
        </div>
      </div>
    </div>
  );
}