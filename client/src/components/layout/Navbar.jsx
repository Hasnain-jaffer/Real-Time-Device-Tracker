// client/src/components/layout/Navbar.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../app/AuthContext';
import { useSocket } from '../../app/SocketProvider';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/devices', label: 'Devices' },
  { to: '/tracking', label: 'Live Tracking' },
  { to: '/history', label: 'History' },
  { to: '/stops', label: 'Stops' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    function fetchUnread() {
      apiClient
        .get('/notifications')
        .then(({ data }) => {
          if (isMounted) setUnreadCount(data.unreadCount);
        })
        .catch(() => {});
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);
  
  const { socket } = useSocket();

  useEffect(() => {
    function handleNewNotification() {
      setUnreadCount((prev) => prev + 1);
    }
    socket.on('notification', handleNewNotification);
    return () => socket.off('notification', handleNewNotification);
  }, [socket]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="glass sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-soft">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="font-semibold text-lg text-primary">
          Device Tracker
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm hover:text-primary transition">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/notifications" className="relative">
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-danger text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link to="/settings" className="text-sm hover:text-primary transition">
            ⚙️
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

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 flex flex-col gap-1 pb-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/notifications"
            onClick={() => setIsMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-2"
          >
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="bg-danger text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/profile"
            onClick={() => setIsMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            👤 Profile
          </Link>
          <Link
            to="/settings"
            onClick={() => setIsMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            ⚙️ Settings
          </Link>
          <button
            onClick={handleLogout}
            className="text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}