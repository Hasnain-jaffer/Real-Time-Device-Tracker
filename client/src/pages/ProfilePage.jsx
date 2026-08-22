// client/src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useAuth } from '../app/AuthContext';
import { clearAccessToken } from '../lib/tokenStore';
import { useToast } from '../app/ToastContext';
import { useTheme } from '../app/ThemeContext';

/* ─── SVG Icons ─── */
const IconArrowLeft = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconUser = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMail = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconLock = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconShieldAlert = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconTrash = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
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

const cardShadow = '0 1px 2px rgba(0,0,0,0.04)';

/* ─── Modern Input ─── */
function Input({ label, icon: Icon, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
        )}
        <input
          className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-[1.5px] transition-all"
          style={{
            backgroundColor: 'var(--bg-page)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            paddingLeft: Icon ? '2.5rem' : '1rem',
            '--tw-ring-color': 'var(--accent-primary)',
          }}
          {...props}
        />
      </div>
    </div>
  );
}

/* ─── Section ─── */
function Section({ title, description, children, icon: Icon }) {
  return (
    <div className="rounded-2xl p-6 sm:p-8 space-y-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}>
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={16} style={{ color: 'var(--text-muted)' }} />}
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { showToast } = useToast();
  const { logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    apiClient.get('/profile').then(({ data }) => {
      setProfile(data.user);
      setName(data.user.name);
    });
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaveMessage('');
    try {
      const { data } = await apiClient.patch('/profile', { name });
      setProfile(data.user);
      setSaveMessage('Profile updated.');
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMessage('');
    try {
      await apiClient.post('/profile/change-password', { currentPassword, newPassword });
      setPasswordMessage('Password changed. Please log in again.');
      showToast('Password changed. Please log in again.', 'success');
      setTimeout(async () => { await logout(); navigate('/login'); }, 1500);
    } catch (err) {
      setPasswordMessage(err.response?.data?.message || 'Failed to change password.');
    }
  }

  async function handleDeleteAccount() {
    await apiClient.delete('/profile');
    clearAccessToken();
    navigate('/');
  }

  if (!profile) {
    return (
      <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
          <div className="h-48 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl mx-auto space-y-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}
        >
          <IconArrowLeft size={14} /> Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
          >
            {profile.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{profile.name}</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{profile.email}</p>
            <span
              className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1.5 uppercase tracking-wider"
              style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)' }}
            >
              {profile.role}
            </span>
          </div>
        </div>

        {/* Basic Info */}
        <Section title="Basic Info" description="Update your public profile information." icon={IconUser}>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <div className="relative">
                <IconMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                <input
                  value={profile.email}
                  disabled
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    opacity: 0.6,
                  }}
                />
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Email cannot be changed.</p>
            </div>

            {saveMessage && (
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--badge-success-text)' }}>
                <IconCheck size={14} /> {saveMessage}
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </Section>

        {/* Password */}
        <Section title="Change Password" description="Secure your account with a strong password." icon={IconLock}>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <Input
              label="New Password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />

            {passwordMessage && (
              <div
                className="rounded-lg px-3 py-2.5 text-xs font-medium"
                style={{
                  color: passwordMessage.includes('changed') ? 'var(--badge-success-text)' : 'var(--accent-critical)',
                  backgroundColor: passwordMessage.includes('changed') ? 'var(--badge-success-bg)' : 'rgba(185,74,58,0.06)',
                  border: `1px solid ${passwordMessage.includes('changed') ? 'var(--badge-success-bg)' : 'rgba(185,74,58,0.15)'}`,
                }}
              >
                {passwordMessage}
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Change Password
              </button>
            </div>
          </form>
        </Section>

        {/* Danger */}
        <div className="rounded-2xl p-6 sm:p-8 space-y-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--accent-critical)', opacity: 0.92 }}>
          <div className="flex items-center gap-2.5">
            <IconShieldAlert size={16} style={{ color: 'var(--accent-critical)' }} />
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--accent-critical)' }}>Danger Zone</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Destructive actions that cannot be undone.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Delete Account</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Permanently remove your account and all associated data.</p>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0"
                style={{ color: 'var(--accent-critical)', border: '1px solid var(--accent-critical)' }}
              >
                <IconTrash size={14} />
                Delete Account
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--accent-critical)' }}
                >
                  <IconTrash size={14} />
                  Confirm
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold hover:bg-black/[0.03] transition-colors"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
       <p className="text-center text-[11px] pb-4" style={{ color: 'var(--text-muted)' }}>
  Your data is secure, encrypted, and never sold to third parties.
</p>
      </div>
    </div>
  );
}