// client/src/pages/static/ContactUsPage.jsx
import { useState } from 'react';
import StaticPageLayout from './StaticPageLayout';

const IconMail = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconMessage = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconSend = ({ size = 16, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconCheck = ({ size = 40, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <StaticPageLayout title="Contact Us">
      {submitted ? (
        <div
          className="rounded-2xl p-10 text-center flex flex-col items-center"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--badge-success-bg)', color: 'var(--badge-success-text)' }}
          >
            <IconCheck size={28} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Message sent</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Thanks for reaching out. We'll get back to you within 24 hours.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 sm:p-8 space-y-5"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
        >
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Your Email
            </label>
            <div className="relative">
              <IconMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-[1.5px] transition-all"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--accent-primary)',
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Message
            </label>
            <div className="relative">
              <IconMessage size={15} className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-[1.5px] transition-all resize-none"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--accent-primary)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <IconSend size={15} />
            Send Message
          </button>
        </form>
      )}
    </StaticPageLayout>
  );
}