// client/src/app/SignInPrompt.jsx
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from './ThemeContext';

const lightTokens = {
  '--bg-page': '#F4EFE6', '--bg-surface': '#FFFFFF', '--border': '#E1D9C8',
  '--text-primary': '#173B32', '--text-secondary': '#5B6B5F', '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61',
};
const darkTokens = {
  '--bg-page': '#12181A', '--bg-surface': '#182220', '--border': '#263531',
  '--text-primary': '#F1EEE4', '--text-secondary': '#8A9690', '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C',
};

const IconLock = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function SignInPrompt({ title, message }) {
  const { theme } = useTheme();
  const location = useLocation();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  return (
    <div
      style={{ ...tokens, backgroundColor: 'var(--bg-page)' }}
      className="w-full min-h-[70vh] p-4 sm:p-6 lg:p-8 flex items-center justify-center"
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-page)', color: 'var(--accent-primary)' }}
        >
          <IconLock />
        </div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        <p className="text-[13px] mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        <Link
          to="/login"
          state={{ from: location }}
          className="inline-block mt-6 w-full rounded-xl py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          Sign in
        </Link>
        <p className="text-[12px] mt-4" style={{ color: 'var(--text-muted)' }}>
          No account yet?{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}