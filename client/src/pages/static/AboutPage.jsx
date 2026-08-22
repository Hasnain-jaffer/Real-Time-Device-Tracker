// client/src/pages/static/AboutPage.jsx
import StaticPageLayout from './StaticPageLayout';

const IconTarget = ({ size = 24, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

const IconShield = ({ size = 24, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconZap = ({ size = 24, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function AboutPage() {
  const values = [
    {
      icon: IconTarget,
      title: 'Precision First',
      desc: 'Sub-meter accuracy with real-time updates so you always know exactly where your fleet stands.',
    },
    {
      icon: IconShield,
      title: 'Built Secure',
      desc: 'End-to-end encryption, hashed credentials, and zero third-party data sharing by design.',
    },
    {
      icon: IconZap,
      title: 'Lightning Fast',
      desc: 'Optimized WebSocket pipelines deliver location pings in milliseconds, not seconds.',
    },
  ];

  return (
    <StaticPageLayout title="About RoutePulse">
      <div className="rounded-2xl p-6 sm:p-8 space-y-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}>
        <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          RoutePulse is a real-time location tracking platform built for fleet operators, transit teams, and logistics coordinators who need reliable, live visibility into their vehicles.
        </p>
        <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Our mission is to make real-time location sharing simple, secure, and genuinely useful — without unnecessary complexity or bloated dashboards.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {values.map((v) => (
          <div
            key={v.title}
            className="rounded-2xl p-5 space-y-3"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(94,140,97,0.10)', color: 'var(--accent-primary)' }}
            >
              <v.icon size={20} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{v.title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{v.desc}</p>
          </div>
        ))}
      </div>
    </StaticPageLayout>
  );
}