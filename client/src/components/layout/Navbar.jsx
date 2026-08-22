// client/src/components/layout/Navbar.jsx
import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../app/AuthContext';
import { useSocket } from '../../app/SocketProvider';
import { useTheme } from '../../app/ThemeContext';
import GlobalSearchModal from '../../features/search/components/GlobalSearchModal';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/devices', label: 'Devices', icon: '🚌' },
  { to: '/tracking', label: 'Live tracking', icon: '📍' },
  { to: '/history', label: 'History', icon: '🕒' },
  { to: '/analytics', label: 'Analytics', icon: '📊', adminOnly: true },
  { to: '/admin', label: 'Admin', icon: '🛡️', adminOnly: true },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

const lightTokens = {
  '--bg-sidebar': '#173B32',
  '--border': '#E1D9C8',
  '--text-nav-active': '#FFFFFF',
  '--text-nav-inactive': 'rgba(255,255,255,0.6)',
  '--accent-primary': '#5E8C61',
  '--badge-eta-bg': '#F6E9CE',
  '--badge-eta-text': '#8A6423',
  '--nav-active-bg': 'rgba(255,255,255,0.14)',
};

const darkTokens = {
  '--bg-sidebar': '#0E1F1B',
  '--border': '#263531',
  '--text-nav-active': '#F1EEE4',
  '--text-nav-inactive': '#8A9690',
  '--accent-primary': '#79B37C',
  '--badge-eta-bg': 'rgba(213,154,58,0.15)',
  '--badge-eta-text': '#E3B15E',
  '--nav-active-bg': 'rgba(255,255,255,0.06)',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const tokens = theme === 'dark' ? darkTokens : lightTokens;
  const isAdmin = user?.role === 'admin';
  const isOnAdminRoute = location.pathname.startsWith('/admin');
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  useEffect(() => {
    let isMounted = true;
    function fetchUnread() {
      apiClient.get('/notifications').then(({ data }) => isMounted && setUnreadCount(data.unreadCount)).catch(() => {});
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    function handleNewNotification() {
      setUnreadCount((prev) => prev + 1);
    }
    socket.on('notification', handleNewNotification);
    return () => socket.off('notification', handleNewNotification);
  }, [socket]);

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

  // Close drawer automatically whenever the route changes
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function navLinkClass({ isActive }) {
    return `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
      isActive ? 'font-semibold' : ''
    }`;
  }

  function navLinkStyle({ isActive }) {
    return {
      backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
      color: isActive ? 'var(--text-nav-active)' : 'var(--text-nav-inactive)',
    };
  }

  const NavList = ({ onItemClick }) => (
    <>
      {visibleItems.map((item) => {
        const showAdminBadge = item.to === '/admin' && isAdmin && isOnAdminRoute;
        return (
          <NavLink key={item.to} to={item.to} className={navLinkClass} style={navLinkStyle} onClick={onItemClick}>
            <span aria-hidden="true">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {showAdminBadge && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--badge-eta-bg)', color: 'var(--badge-eta-text)' }}
              >
                Admin mode
              </span>
            )}
          </NavLink>
        );
      })}
    </>
  );

  const ThemeToggleAndUser = ({ onNavigate }) => (
    <div className="border-t pt-2 px-1 mt-2" style={{ borderColor: 'var(--border)' }}>
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full transition-colors duration-150"
        style={{ color: 'var(--text-nav-inactive)' }}
      >
        <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </button>

      <div className="flex items-center gap-2 px-3 pt-2 pb-1 mt-1 border-t" style={{ borderColor: 'var(--border)' }}>
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </span>
        <div className="min-w-0">
          <p className="text-xs truncate" style={{ color: 'var(--text-nav-active)' }}>{user?.name}</p>
          <p className="text-[10px] capitalize" style={{ color: 'var(--text-nav-inactive)' }}>{user?.role}</p>
        </div>
      </div>

      <button
        onClick={() => {
          onNavigate?.();
          handleLogout();
        }}
        className="text-xs w-full text-left px-3 py-1.5 rounded-md transition-colors duration-150"
        style={{ color: 'var(--text-nav-inactive)' }}
      >
        Log out
      </button>
    </div>
  );

  return (
    <>
      {/* DESKTOP: fixed left sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[190px] py-6 px-3 z-40"
        style={{ ...tokens, backgroundColor: 'var(--bg-sidebar)' }}
      >
        <div className="flex items-center gap-2 px-2 mb-8">
          <span
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-sm"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            🛣️
          </span>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-nav-active)' }}>
            RoutePulse
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavList />
        </nav>

        <ThemeToggleAndUser />
      </aside>

      {/* TABLET + MOBILE: top bar */}
      <header
        className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ ...tokens, backgroundColor: 'var(--bg-sidebar)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-[7px] flex items-center justify-center text-xs"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            🛣️
          </span>
          <span className="font-semibold text-sm" style={{ color: 'var(--text-nav-active)' }}>
            RoutePulse
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search"
            style={{ color: 'var(--text-nav-inactive)' }}
          >
            🔍
          </button>
          <button onClick={() => navigate('/notifications')} className="relative" aria-label="Notifications" style={{ color: 'var(--text-nav-inactive)' }}>
            🔔
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-2 text-[9px] font-medium px-1 rounded-full"
                style={{ backgroundColor: 'var(--badge-eta-bg)', color: 'var(--badge-eta-text)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open menu"
            className="w-8 h-8 flex items-center justify-center transition-transform duration-200"
            style={{ color: 'var(--text-nav-active)' }}
          >
            {isDrawerOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Drawer backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-black z-40 transition-opacity duration-200 ${
          isDrawerOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in drawer */}
      <div
        className={`lg:hidden fixed left-0 top-0 bottom-0 w-[75%] max-w-[300px] z-50 flex flex-col py-6 px-3 transition-transform duration-300 ease-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ ...tokens, backgroundColor: 'var(--bg-sidebar)' }}
      >
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-[7px] flex items-center justify-center text-sm"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              🛣️
            </span>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-nav-active)' }}>
              RoutePulse
            </span>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} aria-label="Close menu" style={{ color: 'var(--text-nav-inactive)' }}>
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <NavList onItemClick={() => setIsDrawerOpen(false)} />
        </nav>

        <ThemeToggleAndUser onNavigate={() => setIsDrawerOpen(false)} />
      </div>

      {/* MOBILE ONLY: bottom tab bar, 4 primary items */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-2 z-40"
        style={{ ...tokens, backgroundColor: 'var(--bg-sidebar)', borderTop: '1px solid var(--border)' }}
      >
        {visibleItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-0.5 text-[10px] px-2 transition-colors duration-150"
            style={navLinkStyle}
          >
            <span style={{ fontSize: '18px' }} aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}