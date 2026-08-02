// client/src/pages/DashboardPage.jsx
import { useAuth } from '../app/AuthContext';
import { useSocket } from '../app/SocketProvider';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={logout}
          className="text-sm rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          Log out
        </button>
      </div>

      <div className="glass rounded-2xl shadow-soft p-6">
        <p>Welcome, {user?.name || 'device tracker user'} 👋</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Socket status: {isConnected ? 'Connected 🟢' : 'Disconnected 🔴'}
          <Link
          to="/tracking"
          className="inline-block mt-4 rounded-xl bg-primary text-white px-4 py-2 text-sm font-medium shadow-soft hover:bg-primary-600 transition"
        >
          Open Live Tracking →
        </Link>
        </p>
      </div>
    </div>
  );
}