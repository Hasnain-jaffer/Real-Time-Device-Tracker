// client/src/pages/ResetPasswordPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../lib/apiClient';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass w-full max-w-sm rounded-2xl shadow-glass p-8 text-center">
          <p className="text-danger font-medium mb-2">Invalid or missing reset link</p>
          <Link to="/forgot-password" className="text-primary text-sm hover:underline">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass w-full max-w-sm rounded-2xl shadow-glass p-8">
        <h1 className="text-2xl font-semibold mb-1">Reset your password</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Choose a new password for your account.
        </p>

        {success ? (
          <p className="text-sm text-success">Password reset! Redirecting to sign in…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-primary text-white py-2 font-medium shadow-soft hover:bg-primary-600 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}