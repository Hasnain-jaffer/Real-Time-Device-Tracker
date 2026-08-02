// client/src/pages/VerifyEmailPage.jsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../lib/apiClient';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    apiClient
      .get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass w-full max-w-sm rounded-2xl shadow-glass p-8 text-center">
        {status === 'loading' && <p className="text-gray-500">Verifying your email…</p>}
        {status === 'success' && (
          <>
            <p className="text-3xl mb-2">✅</p>
            <h1 className="text-xl font-semibold mb-2">Email verified</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{message}</p>
            <Link to="/login" className="text-primary text-sm font-medium hover:underline">
              Continue to Sign In
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-3xl mb-2">⚠️</p>
            <h1 className="text-xl font-semibold mb-2">Verification failed</h1>
            <p className="text-sm text-danger mb-4">{message}</p>
            <Link to="/login" className="text-primary text-sm font-medium hover:underline">
              Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}