// client/src/app/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

/* ─── SVG Icon ─── */
const IconLoader = ({ size = 24, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
);

/* ─── Tokens ─── */
const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--accent-primary': '#5E8C61',
};

const darkTokens = {
  '--bg-page': '#12181A',
  '--accent-primary': '#79B37C',
};

export default function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
        style={{ ...tokens, backgroundColor: 'var(--bg-page)' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] pointer-events-none"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />

        <div className="relative">
          <div
            className="w-10 h-10 flex items-center justify-center"
            style={{ color: 'var(--accent-primary)' }}
          >
            <IconLoader size={32} className="animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}