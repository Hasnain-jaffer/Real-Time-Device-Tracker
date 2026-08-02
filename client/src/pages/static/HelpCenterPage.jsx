// client/src/pages/static/HelpCenterPage.jsx
import StaticPageLayout from './StaticPageLayout';

const FAQS = [
  {
    q: 'How do I share my live location?',
    a: 'Open Live Tracking from the dashboard and allow location access when prompted. Your position updates automatically for anyone else viewing the same session.',
  },
  {
    q: 'Can I see where a device has been in the past?',
    a: 'Yes — the Device History page shows a full path, timeline, distance, and duration for any tracked device.',
  },
  {
    q: 'Is my data secure?',
    a: 'All accounts use hashed passwords and JWT-based authentication. See our Privacy Policy for full details.',
  },
];

export default function HelpCenterPage() {
  return (
    <StaticPageLayout title="Help Center">
      <div className="space-y-4 not-prose">
        {FAQS.map((item, i) => (
          <div key={i} className="glass rounded-xl shadow-soft p-4">
            <p className="font-medium">{item.q}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.a}</p>
          </div>
        ))}
      </div>
    </StaticPageLayout>
  );
}