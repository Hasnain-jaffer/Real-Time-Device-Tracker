// client/src/pages/static/HelpCenterPage.jsx
import { useState } from 'react';
import StaticPageLayout from './StaticPageLayout';

const IconChevronDown = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

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
    a: 'All accounts use hashed passwords and JWT-based authentication. Location data is encrypted at rest and never shared with third parties.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Go to the login page and click "Forgot Password". You will receive an email with instructions to reset your password.',
  },
  {
    q: 'Can I track multiple devices at once?',
    a: 'Yes — you can view all your registered devices in the Live Tracking page, and switch between them in the dashboard.',
  },
  {
    q: 'Can I export my tracking data?',
    a: 'Data export is coming soon. For now, you can view full history and timelines directly in the History page.',
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.q}</span>
        <IconChevronDown
          size={16}
          className="flex-shrink-0 transition-transform duration-200"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? '200px' : '0px', opacity: open ? 1 : 0 }}
      >
        <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {item.a}
        </p>
      </div>
    </div>
  );
}

export default function HelpCenterPage() {
  return (
    <StaticPageLayout title="Help Center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Frequently asked questions. Can't find what you're looking for?{' '}
        <a href="/contact" className="font-medium hover:underline" style={{ color: 'var(--accent-primary)' }}>
          Contact our team
        </a>.
      </p>

      <div className="space-y-3">
        {FAQS.map((item, i) => (
          <FaqItem key={i} item={item} />
        ))}
      </div>
    </StaticPageLayout>
  );
}