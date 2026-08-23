// client/src/pages/static/ServerErrorPage.jsx
import { Link } from 'react-router-dom';
import { useTheme } from '../../app/ThemeContext';

const IconServerAlert = ({ size = 80, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
    <path d="M12 10v4" /><path d="M12 22v-2" /><path d="M12 2V0" />
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

export default function ServerErrorPage() {
  const theme = useSafeTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 text-center">
      <div style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
        <IconServerAlert size={72} />
      </div>
      <div>
        <p className="text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>500</p>
        <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
          Something went wrong on our end. We're on it.
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