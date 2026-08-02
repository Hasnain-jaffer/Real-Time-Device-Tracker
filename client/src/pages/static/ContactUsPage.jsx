// client/src/pages/static/ContactUsPage.jsx
import { useState } from 'react';
import StaticPageLayout from './StaticPageLayout';

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // Wire to a real /api/contact endpoint in a future batch if needed
    setSubmitted(true);
  }

  return (
    <StaticPageLayout title="Contact Us">
      {submitted ? (
        <p className="text-success font-medium">
          Thanks for reaching out! We'll get back to you soon.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 not-prose">
          <div>
            <label className="block text-sm font-medium mb-1">Your Email</label>
            <input
              type="email"
              required
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              required
              rows={5}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 px-4 py-2"
            />
          </div>
          <button className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-medium shadow-soft hover:bg-primary-600 transition">
            Send Message
          </button>
        </form>
      )}
    </StaticPageLayout>
  );
}