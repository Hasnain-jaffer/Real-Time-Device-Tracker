// client/src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } finally {
      // Always show the same message, matching the backend's anti-enumeration behavior
      setSubmitted(true);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass w-full max-w-sm rounded-2xl shadow-glass p-8">
        <h1 className="text-2xl font-semibold mb-1">Forgot password</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter your email and we'll send you a reset link.
        </p>

        {submitted ? (
          <p className="text-sm text-primary">
            If that email exists, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-primary text-white py-2 font-medium shadow-soft hover:bg-primary-600 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-4">
          <Link to="/login" className="text-primary font-medium hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}