// client/src/components/layout/Navbar.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../app/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get('/notifications')
      .then(({ data }) => {
        if (isMounted) setUnreadCount(data.unreadCount);
      })
      .catch(() => {});

    // Simple polling for now — swappable for a socket-pushed event later
    const interval = setInterval(() => {
      apiClient
        .get('/notifications')
        .then(({ data }) => {
          if (isMounted) setUnreadCount(data.unreadCount);
        })
        .catch(() => {});
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="glass sticky top-0 z-40 flex items-center justify-between px-6 py-3 shadow-soft">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="font-semibold text-lg text-primary">
          Device Tracker
        </Link>
        <Link to="/dashboard" className="text-sm hover:text-primary transition">
          Dashboard
        </Link>
        <Link to="/tracking" className="text-sm hover:text-primary transition">
          Live Tracking
        </Link>
        <Link to="/history" className="text-sm hover:text-primary transition">
          History
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/notifications" className="relative">
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-danger text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <Link
          to="/profile"
          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium"
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </Link>

        <button
          onClick={handleLogout}
          className="text-sm rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}