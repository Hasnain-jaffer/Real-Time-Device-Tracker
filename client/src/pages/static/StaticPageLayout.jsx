// client/src/pages/static/StaticPageLayout.jsx
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../app/ThemeContext';

const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--bg-surface': '#FFFFFF',
  '--border': '#E1D9C8',
  '--text-primary': '#173B32',
  '--text-secondary': '#5B6B5F',
  '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61',
};

const darkTokens = {
  '--bg-page': '#12181A',
  '--bg-surface': '#182220',
  '--border': '#263531',
  '--text-primary': '#F1EEE4',
  '--text-secondary': '#8A9690',
  '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C',
};

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

const IconLogo = ({ size = 20, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

export default function StaticPageLayout({ title, children }) {
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;
  const location = useLocation();

  const navLinks = [
    { to: '/about', label: 'About' },
    { to: '/help', label: 'Help' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between backdrop-blur-md"
        style={{ backgroundColor: 'rgba(var(--bg-surface), 0.8)', borderBottom: '1px solid var(--border)' }}
      >
        <Link to="/" className="flex items-center gap-2.5 font-bold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}>
            <IconLogo size={16} />
          </span>
          RoutePulse
        </Link>
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: location.pathname === link.to ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: location.pathname === link.to ? 'var(--bg-page)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        <div className="space-y-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} RoutePulse. All rights reserved.
        </p>
      </footer>
    </div>
  );
}