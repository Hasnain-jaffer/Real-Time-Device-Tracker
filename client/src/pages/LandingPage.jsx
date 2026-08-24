// client/src/pages/LandingPage.jsx
import { Link } from 'react-router-dom';
import { useTheme } from '../app/ThemeContext';

/* ─── SVG Icons ─── */
const IconLogo = ({ size = 24, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const IconMapPin = ({ size = 20, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconClock = ({ size = 20, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconShield = ({ size = 20, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconZap = ({ size = 20, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconSmartphone = ({ size = 20, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const IconBarChart = ({ size = 20, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const IconArrowRight = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconCheck = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconGithub = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
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
  '--accent-eta': '#D59A3A',
};

const darkTokens = {
  '--bg-page': '#12181A',
  '--bg-surface': '#182220',
  '--border': '#263531',
  '--text-primary': '#F1EEE4',
  '--text-secondary': '#8A9690',
  '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C',
  '--accent-eta': '#E3B15E',
};

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

/* ─── Components ─── */
function FeatureCard({ Icon, title, description, tint, iconColor }) {
  return (
    <div
      className="rounded-2xl p-6 sm:p-7 space-y-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: cardShadow,
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: tint, color: iconColor }}
      >
        <Icon size={22} />
      </div>
      <div>
        <h3 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
    </div>
  );
}

function StepNumber({ n }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
    >
      {n}
    </div>
  );
}

export default function LandingPage() {
  const { theme } = useTheme();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;
  const accentHex = tokens['--accent-primary'];

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="min-h-screen flex flex-col">
      
      {/* ─── Navigation ─── */}
      <header
        className="sticky top-0 z-50 px-5 sm:px-8 py-4 flex items-center justify-between backdrop-blur-xl"
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(18,34,32,0.75)' : 'rgba(255,255,255,0.75)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: accentHex, color: '#fff' }}
          >
            <IconLogo size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            RoutePulse
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {[
            { to: '/about', label: 'About' },
            { to: '/help', label: 'Help' },
            { to: '/contact', label: 'Contact' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:block px-4 py-2 rounded-xl text-sm font-semibold transition hover:opacity-80"
            style={{ color: 'var(--text-primary)' }}
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: accentHex, boxShadow: cardShadow }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-5 sm:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[100px] pointer-events-none"
          style={{ backgroundColor: accentHex }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider mb-8"
            style={{
              backgroundColor: accentHex + '15',
              color: accentHex,
              border: `1px solid ${accentHex}25`,
            }}
          >
            <IconZap size={12} />
            Now with real-time geofence alerts
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
            Real-time fleet tracking,{' '}
            <span style={{ color: accentHex }}>without the complexity.</span>
          </h1>

          <p className="text-base sm:text-lg mt-6 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Live location updates, full route history with playback, and secure
            team management — built for bus operators and logistics teams who need
            to know where every vehicle is, right now.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: accentHex, boxShadow: '0 4px 20px ' + accentHex + '40' }}
            >
              Create Free Account
              <IconArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition hover:bg-black/5 active:scale-[0.98]"
              style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              Sign In
            </Link>
          </div>

          {/* Mini trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-12 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <IconCheck size={12} style={{ color: accentHex }} /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <IconCheck size={12} style={{ color: accentHex }} /> Free forever plan
            </span>
            <span className="flex items-center gap-1.5">
              <IconCheck size={12} style={{ color: accentHex }} /> Setup in 2 minutes
            </span>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Everything you need to run a fleet
            </h2>
            <p className="text-[13px] sm:text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Powerful features, simple interface, zero setup friction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <FeatureCard
              Icon={IconMapPin}
              title="Live GPS Tracking"
              description="See every bus on an interactive map in real time. No refresh needed — positions update instantly via WebSocket."
              tint={accentHex + '15'}
              iconColor={accentHex}
            />
            <FeatureCard
              Icon={IconClock}
              title="Route History & Playback"
              description="Review full travel history with animated route playback, distance stats, and per-stop timestamps."
              tint={(tokens['--accent-eta'] || '#D59A3A') + '15'}
              iconColor={tokens['--accent-eta'] || '#D59A3A'}
            />
            <FeatureCard
              Icon={IconShield}
              title="Secure by Default"
              description="JWT authentication, bcrypt password hashing, role-based access, and full account deletion control."
              tint={(tokens['--accent-critical'] || '#B94A3A') + '15'}
              iconColor={tokens['--accent-critical'] || '#B94A3A'}
            />
            <FeatureCard
              Icon={IconZap}
              title="Instant Alerts"
              description="Get notified when buses arrive at or leave designated stops. Push, email, and in-app alerts supported."
              tint={accentHex + '15'}
              iconColor={accentHex}
            />
            <FeatureCard
              Icon={IconSmartphone}
              title="Mobile Ready"
              description="Fully responsive dashboard works on phones, tablets, and desktops without installing anything."
              tint={(tokens['--accent-eta'] || '#D59A3A') + '15'}
              iconColor={tokens['--accent-eta'] || '#D59A3A'}
            />
            <FeatureCard
              Icon={IconBarChart}
              title="Fleet Analytics"
              description="Track total distance, average speed, most active vehicles, and daily trends with beautiful charts."
              tint={accentHex + '15'}
              iconColor={accentHex}
            />
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="px-5 sm:px-8 py-20 sm:py-28" style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Up and running in minutes
            </h2>
            <p className="text-[13px] sm:text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              No hardware required. No complex configuration.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                n: 1,
                title: 'Register your fleet',
                desc: 'Create an account, add your buses, and assign unique identifiers. Invite team members with role-based access.',
              },
              {
                n: 2,
                title: 'Configure stops',
                desc: 'Drop geofence pins on the map for every stop. Set radius, name, and type — arrivals and departures are tracked automatically.',
              },
              {
                n: 3,
                title: 'Track in real time',
                desc: 'Open the Live Tracking dashboard and watch your fleet move. Review history, export data, and receive alerts instantly.',
              },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-4 sm:gap-5">
                <StepNumber n={step.n} />
                <div className="pt-1">
                  <h3 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                  <p className="text-[13px] mt-1 leading-relaxed max-w-xl" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="px-5 sm:px-8 py-20 sm:py-24">
        <div
          className="max-w-3xl mx-auto rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{
            backgroundColor: accentHex,
            boxShadow: '0 20px 60px ' + accentHex + '35',
          }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight relative z-10">
            Ready to track your fleet?
          </h2>
          <p className="text-sm sm:text-base mt-3 text-white/80 relative z-10 max-w-lg mx-auto">
            Join operators who use RoutePulse to monitor buses, manage stops, and keep passengers informed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 relative z-10">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#fff', color: accentHex }}
            >
              Get Started Free
              <IconArrowRight size={16} />
            </Link>
            <Link
              to="/contact"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 active:scale-[0.98]"
              style={{ border: '1px solid rgba(255,255,255,0.25)' }}
            >
              Talk to Us
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-5 sm:px-8 py-10 mt-auto" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ backgroundColor: accentHex, color: '#fff' }}
            >
              <IconLogo size={14} />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>RoutePulse</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-medium">
            {[
              { to: '/about', label: 'About' },
              { to: '/help', label: 'Help' },
              { to: '/privacy', label: 'Privacy' },
              { to: '/terms', label: 'Terms' },
              { to: '/contact', label: 'Contact' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="transition hover:opacity-70"
                style={{ color: 'var(--text-secondary)' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            © 2026 RoutePulse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}