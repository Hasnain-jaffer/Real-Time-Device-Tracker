// client/src/components/layout/Navbar.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../app/AuthContext';
import { useSocket } from '../../app/SocketProvider';
import GlobalSearchModal from '../../features/search/components/GlobalSearchModal';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/devices', label: 'Devices' },
  { to: '/tracking', label: 'Live Tracking' },
  { to: '/history', label: 'History' },
  { to: '/stops', label: 'Stops' },
  { to: '/analytics', label: 'Analytics' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-sm hover:text-primary transition">
              Admin
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1.5"
          >
            🔍 Search <kbd className="text-[10px] opacity-60">Ctrl K</kbd>
          </button>
          <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
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
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setIsMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              🛡️ Admin
            </Link>
          )}
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