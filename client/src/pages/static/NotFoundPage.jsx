// client/src/pages/static/NotFoundPage.jsx
import { Link } from 'react-router-dom';
import { useTheme } from '../../app/ThemeContext';

const IconMapLost = ({ size = 80, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 14v4" /><path d="M9 18h6" />
  </svg>
);

const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--text-primary': '#173B32',
  '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61',
};

const darkTokens = {
  '--bg-page': '#12181A',
  '--text-primary': '#F1EEE4',
  '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C',
};

function useSafeTheme() {
  try {
    const { theme } = useTheme();
    return theme;
  } catch {
    return 'light';
  }
}

export default function NotFoundPage() {
  const theme = useSafeTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 text-center">
      <div style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
        <IconMapLost size={72} />
      </div>
      <div>
        <p className="text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>404</p>
        <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
          This page took a wrong turn.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}