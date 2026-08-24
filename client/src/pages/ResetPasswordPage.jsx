// client/src/pages/ResetPasswordPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useTheme } from '../app/ThemeContext';

/* ─── SVG Icons ─── */
const IconLogo = ({ size = 20, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const IconLock = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconCheck = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconAlert = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconLoader = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" />
  </svg>
);

const IconArrowLeft = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

/* ─── Tokens ─── */
const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--bg-surface': '#FFFFFF',
  '--border': '#E1D9C8',
  '--text-primary': '#173B32',
  '--text-secondary': '#5B6B5F',
  '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61',
  '--accent-critical': '#B94A3A',
  '--badge-success-bg': '#EAF3DE',
  '--badge-success-text': '#3B6D26',
};

const darkTokens = {
  '--bg-page': '#12181A',
  '--bg-surface': '#182220',
  '--border': '#263531',
  '--text-primary': '#F1EEE4',
  '--text-secondary': '#8A9690',
  '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C',
  '--accent-critical': '#C15D4C',
  '--badge-success-bg': 'rgba(94,140,97,0.15)',
  '--badge-success-text': '#79B37C',
};

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function ResetPasswordPage() {
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px] pointer-events-none" style={{ backgroundColor: 'var(--accent-primary)' }} />

        <div className="relative w-full max-w-sm text-center">
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
              >
                <IconLogo size={20} />
              </div>
              <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>RoutePulse</span>
            </Link>
          </div>

          <div
            className="rounded-2xl p-8 sm:p-10 space-y-5"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div className="flex justify-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-critical)' + '15', color: 'var(--accent-critical)' }}
              >
                <IconAlert size={32} />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Invalid reset link</h1>
              <p className="text-[13px] mt-2" style={{ color: 'var(--text-secondary)' }}>
                The password reset link is missing or malformed.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: cardShadow }}
            >
              Request new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden py-12">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 blur-[120px] pointer-events-none" style={{ backgroundColor: 'var(--accent-primary)' }} />

      <div className="relative w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
            >
              <IconLogo size={20} />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>RoutePulse</span>
          </Link>
        </div>

        <div
          className="rounded-2xl p-7 sm:p-8 space-y-5"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Reset your password</h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Choose a new password for your account.
            </p>
          </div>

          {success ? (
            <div className="space-y-5">
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ color: 'var(--badge-success-text)', backgroundColor: 'var(--badge-success-bg)', border: '1px solid var(--badge-success-bg)' }}
              >
                <IconCheck size={16} />
                Password reset successfully. Redirecting…
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }} htmlFor="password">
                  New Password
                </label>
                <div className="relative">
                  <IconLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-[1.5px] transition-all"
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      '--tw-ring-color': 'var(--accent-primary)',
                    }}
                  />
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Minimum 8 characters.</p>
              </div>

              {error && (
                <div
                  className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs font-medium"
                  style={{ color: 'var(--accent-critical)', backgroundColor: 'var(--accent-critical)' + '10', border: '1px solid var(--accent-critical)' + '25' }}
                >
                  <IconAlert size={14} className="flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)', boxShadow: cardShadow }}
              >
                {isSubmitting ? (
                  <>
                    <IconLoader size={16} className="animate-spin" />
                    Resetting…
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

                    <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-sm font-semibold transition hover:opacity-80"
            style={{ color: 'var(--accent-primary)' }}
          >
            <IconArrowLeft size={14} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}