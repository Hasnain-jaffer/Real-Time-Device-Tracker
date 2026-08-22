// client/src/pages/static/TermsPage.jsx
import StaticPageLayout from './StaticPageLayout';

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function TermsPage() {
  const sections = [
    {
      title: 'Acceptable use',
      body: 'By using RoutePulse, you agree to use the service responsibly and only track devices you own or have explicit permission to monitor.',
    },
    {
      title: 'Account suspension',
      body: 'We reserve the right to suspend accounts found to be misusing the location tracking features for unauthorized surveillance or illegal activity.',
    },
    {
      title: 'Disclaimer',
      body: 'This service is provided as-is without warranty of any kind. We do not guarantee 100% uptime or location accuracy in all conditions.',
    },
    {
      title: 'Changes to terms',
      body: 'We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.',
    },
  ];

  return (
    <StaticPageLayout title="Terms & Conditions">
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </p>

      <div className="space-y-4">
        {sections.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
              >
                {i + 1}
              </span>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{s.title}</h2>
            </div>
            <p className="text-sm leading-relaxed pl-9" style={{ color: 'var(--text-secondary)' }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl px-5 py-4 text-center"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Questions? Reach out at <a href="mailto:legal@routepulse.app" className="font-medium hover:underline" style={{ color: 'var(--accent-primary)' }}>legal@routepulse.app</a>
        </p>
      </div>
    </StaticPageLayout>
  );
}