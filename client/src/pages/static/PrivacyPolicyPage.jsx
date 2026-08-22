// client/src/pages/static/PrivacyPolicyPage.jsx
import StaticPageLayout from './StaticPageLayout';

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: 'What we collect',
      body: 'We collect only the information necessary to provide location tracking services: your account details (name, email) and the location data your devices report.',
    },
    {
      title: 'How we use it',
      body: 'Location data is used to display real-time positions, generate history timelines, and calculate route analytics. We do not use your data for advertising.',
    },
    {
      title: 'Data security',
      body: 'All location history is stored securely and is only accessible to your authenticated account. We use industry-standard encryption for data at rest and in transit.',
    },
    {
      title: 'Third parties',
      body: 'We do not sell, rent, or share your location data with third parties. Period.',
    },
    {
      title: 'Your rights',
      body: 'You may request deletion of your account and all associated data at any time from your Profile Settings page. We process deletion requests within 30 days.',
    },
  ];

  return (
    <StaticPageLayout title="Privacy Policy">
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
          Questions? Reach out at <a href="mailto:privacy@routepulse.app" className="font-medium hover:underline" style={{ color: 'var(--accent-primary)' }}>privacy@routepulse.app</a>
        </p>
      </div>
    </StaticPageLayout>
  );
}