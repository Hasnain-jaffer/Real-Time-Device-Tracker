// client/src/pages/SettingsPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../app/ThemeContext';
import { useAuth } from '../app/AuthContext';

/* ─── SVG Icons ─── */
const IconSun = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const IconMoon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconMonitor = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconRuler = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 6H3M21 10H3M21 14H3M21 18H3" />
  </svg>
);

const IconMap = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const IconBell = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconUser = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconShield = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconChevronRight = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconTrash = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconLogout = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ─── Theme Tokens ─── */
const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--bg-surface': '#FFFFFF',
  '--bg-sidebar': '#173B32',
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
  '--bg-sidebar': '#0E1F1B',
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

/* ─── Reusable Toggle Switch ─── */
function Toggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200"
        style={{ backgroundColor: enabled ? 'var(--accent-primary)' : 'var(--border)' }}
      >
        <span
          className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}

/* ─── Reusable Setting Section Card ─── */
function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'rgba(94,140,97,0.10)', color: 'var(--accent-primary)' }}
        >
          <Icon size={18} />
        </div>
        <div>
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--border)' }} className="pt-4">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setExplicitTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [units, setUnits] = useState(localStorage.getItem('units') || 'metric');
  const [mapStyle, setMapStyle] = useState(localStorage.getItem('mapStyle') || 'street');
  const [emailAlerts, setEmailAlerts] = useState(localStorage.getItem('emailAlerts') !== 'false');
  const [pushAlerts, setPushAlerts] = useState(localStorage.getItem('pushAlerts') !== 'false');
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('soundEnabled') === 'true');

  const isDark = theme === 'dark';
  const tokens = isDark ? darkTokens : lightTokens;

  function handleUnitsChange(value) {
    setUnits(value);
    localStorage.setItem('units', value);
  }

  function handleMapStyleChange(value) {
    setMapStyle(value);
    localStorage.setItem('mapStyle', value);
  }

  function handleToggle(key, value, setter) {
    setter(value);
    localStorage.setItem(key, value);
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const themeOptions = [
    { key: 'light', label: 'Light', Icon: IconSun, desc: 'Clean and crisp' },
    { key: 'dark', label: 'Dark', Icon: IconMoon, desc: 'Easy on the eyes' },
    { key: 'system', label: 'System', Icon: IconMonitor, desc: 'Follows OS' },
  ];

  const mapOptions = [
    { key: 'street', label: 'Street', desc: 'Standard road map' },
    { key: 'satellite', label: 'Satellite', desc: 'Aerial imagery' },
    { key: 'dark', label: 'Dark', desc: 'Midnight style' },
  ];

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage your preferences and account settings
          </p>
        </div>

        {/* Appearance */}
        <SectionCard icon={IconSun} title="Appearance" description="Choose how RoutePulse looks on your device.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const active = (option.key === 'system' && !localStorage.getItem('theme-explicit')) || theme === option.key;
              return (
                <button
                  key={option.key}
                  onClick={() => {
                    if (option.key === 'system') {
                      localStorage.removeItem('theme-explicit');
                      window.location.reload();
                    } else {
                      setExplicitTheme(option.key);
                    }
                  }}
                  className="relative rounded-xl p-4 text-left border-2 transition-all hover:shadow-sm"
                  style={{
                    backgroundColor: active ? 'var(--bg-page)' : 'var(--bg-surface)',
                    borderColor: active ? 'var(--accent-primary)' : 'var(--border)',
                    boxShadow: active ? cardShadow : 'none',
                  }}
                >
                  {active && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                  )}
                  <option.Icon size={22} style={{ color: active ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                  <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>{option.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{option.desc}</p>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Units */}
        <SectionCard icon={IconRuler} title="Units" description="Choose your preferred measurement system.">
          <div className="flex p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
            {['metric', 'imperial'].map((option) => (
              <button
                key={option}
                onClick={() => handleUnitsChange(option)}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: units === option ? 'var(--bg-surface)' : 'transparent',
                  color: units === option ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: units === option ? cardShadow : 'none',
                }}
              >
                {option === 'metric' ? 'Metric (km)' : 'Imperial (mi)'}
              </button>
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
            Applies to distance figures on the Device History and Tracking pages.
          </p>
        </SectionCard>

        {/* Map Style */}
        <SectionCard icon={IconMap} title="Default Map Style" description="Select the default map appearance for live tracking.">
          <div className="flex p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}>
            {mapOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => handleMapStyleChange(option.key)}
                className="px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={{
                  backgroundColor: mapStyle === option.key ? 'var(--bg-surface)' : 'transparent',
                  color: mapStyle === option.key ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: mapStyle === option.key ? cardShadow : 'none',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
            Satellite and Dark layers will be wired into the Live Tracking map in a future update.
          </p>
        </SectionCard>

        {/* Notifications */}
        <SectionCard icon={IconBell} title="Notifications" description="Control how and when you receive alerts.">
          <div className="space-y-5">
            <Toggle
              enabled={emailAlerts}
              onChange={(v) => handleToggle('emailAlerts', v, setEmailAlerts)}
              label="Email alerts"
              description="Receive summary emails about device status."
            />
            <Toggle
              enabled={pushAlerts}
              onChange={(v) => handleToggle('pushAlerts', v, setPushAlerts)}
              label="Push notifications"
              description="Real-time alerts when buses go offline or deviate."
            />
            <Toggle
              enabled={soundEnabled}
              onChange={(v) => handleToggle('soundEnabled', v, setSoundEnabled)}
              label="Sound effects"
              description="Play a sound for critical alerts."
            />
          </div>
        </SectionCard>

        {/* Account */}
        <SectionCard icon={IconUser} title="Account" description="Manage your profile and session.">
          <div className="space-y-2">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-black/[0.03] group"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
                >
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{user?.email || user?.role}</p>
                </div>
              </div>
              <IconChevronRight size={16} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-red-500/5 group"
              style={{ border: '1px solid var(--border)' }}
            >
              <IconLogout size={18} style={{ color: 'var(--accent-critical)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--accent-critical)' }}>Log out</span>
            </button>
          </div>
        </SectionCard>

        {/* Danger Zone */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--accent-critical)', opacity: 0.9 }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(185,74,58,0.10)', color: 'var(--accent-critical)' }}
            >
              <IconShield size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--accent-critical)' }}>Danger Zone</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Destructive actions that cannot be undone.
              </p>
            </div>
          </div>
          <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Delete all device data</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Permanently remove all buses, history, and schedules.
                </p>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity flex-shrink-0"
                style={{ backgroundColor: 'var(--accent-critical)' }}
                onClick={() => alert('This would trigger a confirmation modal in production.')}
              >
                <IconTrash size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] pb-4" style={{ color: 'var(--text-muted)' }}>
          RoutePulse v1.0 · Built with care
        </p>
      </div>
    </div>
  );
}