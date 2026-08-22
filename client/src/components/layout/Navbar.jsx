// client/src/components/layout/Navbar.jsx
import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../app/AuthContext';
import { useSocket } from '../../app/SocketProvider';
import { useTheme } from '../../app/ThemeContext';
import GlobalSearchModal from '../../features/search/components/GlobalSearchModal';

/* ═══════════════════════════════════════════
   INLINE SVG ICONS — no extra deps
   ═══════════════════════════════════════════ */
const IconDashboard = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconBus = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M6 18v2" /><path d="M18 18v2" /><path d="M6 10h12" />
  </svg>
);

const IconMapPin = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconClock = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconBarChart = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconShield = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconSettings = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconLogo = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const IconSearch = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconBell = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconMenu = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconClose = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconSun = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const IconMoon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconLogout = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ═══════════════════════════════════════════
   NAV CONFIG
   ═══════════════════════════════════════════ */
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
  { to: '/devices', label: 'Devices', Icon: IconBus },
  { to: '/tracking', label: 'Live tracking', Icon: IconMapPin },
  { to: '/history', label: 'History', Icon: IconClock },
  { to: '/analytics', label: 'Analytics', Icon: IconBarChart, adminOnly: true },
  { to: '/admin', label: 'Admin', Icon: IconShield, adminOnly: true },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
];

const lightTokens = {
  '--bg-sidebar': '#173B32',
  '--border': 'rgba(255,255,255,0.08)',
  '--text-nav-active': '#FFFFFF',
  '--text-nav-inactive': 'rgba(255,255,255,0.55)',
  '--accent-primary': '#5E8C61',
  '--badge-eta-bg': '#F6E9CE',
  '--badge-eta-text': '#8A6423',
  '--nav-active-bg': 'rgba(255,255,255,0.10)',
};

const darkTokens = {
  '--bg-sidebar': '#0E1F1B',
  '--border': 'rgba(255,255,255,0.06)',
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

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const NavList = ({ onItemClick }) => (
    <>
      {visibleItems.map((item) => {
        const showAdminBadge = item.to === '/admin' && isAdmin && isOnAdminRoute;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onItemClick}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 whitespace-nowrap ${
                isActive ? 'font-semibold' : 'hover:bg-white/[0.04]'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
              color: isActive ? 'var(--text-nav-active)' : 'var(--text-nav-inactive)',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  />
                )}
                <item.Icon
                  size={18}
                  className={`flex-shrink-0 transition-opacity duration-200 ${
                    isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'
                  }`}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {showAdminBadge && (
                  <span
                    className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none"
                    style={{ backgroundColor: 'var(--badge-eta-bg)', color: 'var(--badge-eta-text)' }}
                  >
                    Admin
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </>
  );

  const ThemeToggleAndUser = ({ onNavigate }) => (
    <div className="border-t pt-3 px-1 mt-2" style={{ borderColor: 'var(--border)' }}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="relative w-full h-10 rounded-full flex items-center cursor-pointer transition-colors duration-300 hover:bg-white/[0.04]"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <div
          className="absolute top-0.5 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ease-out"
          style={{
            backgroundColor: theme === 'dark' ? '#1a2622' : '#FFFFFF',
            left: theme === 'dark' ? 'calc(100% - 38px)' : '4px',
            boxShadow: theme === 'dark'
              ? '0 2px 8px rgba(0,0,0,0.4)'
              : '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {theme === 'dark' ? (
            <IconMoon size={15} style={{ color: '#E3B15E' }} />
          ) : (
            <IconSun size={15} style={{ color: '#D4941E' }} />
          )}
        </div>

        <span
          className="absolute text-[12px] font-medium tracking-wide transition-all duration-300 select-none"
          style={{
            color: 'rgba(255,255,255,0.85)',
            left: theme === 'dark' ? '14px' : 'auto',
            right: theme === 'dark' ? 'auto' : '14px',
          }}
        >
          {theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      </button>

      {/* User */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-1 mt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] truncate font-medium" style={{ color: 'var(--text-nav-active)' }}>{user?.name}</p>
          <p className="text-[11px] capitalize" style={{ color: 'var(--text-nav-inactive)' }}>{user?.role}</p>
        </div>
      </div>

      <button
        onClick={() => {
          onNavigate?.();
          handleLogout();
        }}
        className="flex items-center gap-2 text-[13px] w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 mt-1 hover:bg-white/[0.04]"
        style={{ color: 'var(--text-nav-inactive)' }}
      >
        <IconLogout size={15} />
        Log out
      </button>
    </div>
  );

  return (
    <>
      {/* ═══════════════════════════════════════
          DESKTOP SIDEBAR
         ═══════════════════════════════════════ */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[240px] py-6 px-3 z-40"
        style={{ ...tokens, backgroundColor: 'var(--bg-sidebar)' }}
      >
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
          >
            <IconLogo size={18} />
          </span>
          <span className="font-bold text-[15px] tracking-tight" style={{ color: 'var(--text-nav-active)' }}>
            RoutePulse
          </span>
        </div>

        <nav className="flex-1 space-y-0.5">
          <NavList />
        </nav>

        <ThemeToggleAndUser />
      </aside>

      {/* ═══════════════════════════════════════
          MOBILE / TABLET HEADER
         ═══════════════════════════════════════ */}
      <header
        className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ ...tokens, backgroundColor: 'var(--bg-sidebar)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
          >
            <IconLogo size={15} />
          </span>
          <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-nav-active)' }}>
            RoutePulse
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search"
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-nav-inactive)' }}
          >
            <IconSearch size={18} />
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Notifications"
            style={{ color: 'var(--text-nav-inactive)' }}
          >
            <IconBell size={18} />
            {unreadCount > 0 && (
              <span
                className="absolute top-0 right-0 text-[9px] font-bold px-1 py-0.5 rounded-full leading-none"
                style={{ backgroundColor: 'var(--badge-eta-bg)', color: 'var(--badge-eta-text)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open menu"
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-nav-active)' }}
          >
            <IconMenu size={18} />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════
          DRAWER BACKDROP
         ═══════════════════════════════════════ */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ═══════════════════════════════════════
          SLIDE-IN DRAWER
         ═══════════════════════════════════════ */}
      <div
        className={`lg:hidden fixed left-0 top-0 bottom-0 w-[75%] max-w-[300px] z-50 flex flex-col py-6 px-3 transition-transform duration-300 ease-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ ...tokens, backgroundColor: 'var(--bg-sidebar)' }}
      >
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
            >
              <IconLogo size={15} />
            </span>
            <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-nav-active)' }}>
              RoutePulse
            </span>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close menu"
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-nav-inactive)' }}
          >
            <IconClose size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          <NavList onItemClick={() => setIsDrawerOpen(false)} />
        </nav>

        <ThemeToggleAndUser onNavigate={() => setIsDrawerOpen(false)} />
      </div>

      {/* ═══════════════════════════════════════
          MOBILE BOTTOM TAB BAR
         ═══════════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-2 px-1 z-40"
        style={{ ...tokens, backgroundColor: 'var(--bg-sidebar)', borderTop: '1px solid var(--border)' }}
      >
        {visibleItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all duration-150 ${
                isActive ? 'font-semibold' : 'opacity-60'
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--text-nav-active)' : 'var(--text-nav-inactive)',
            })}
          >
            {({ isActive }) => (
              <>
                <item.Icon size={20} className={isActive ? 'opacity-100' : 'opacity-70'} />
                <span className="text-[10px]">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}