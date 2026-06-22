import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);

  useEffect(() => {
    // Supabase recovery links include access_token & refresh_token in the URL hash
    // e.g. /reset-password#access_token=xxx&type=recovery
    supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setHasRecoveryToken(true);
      }
    });

    // Also check if there's already a recovery session in the URL
    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      if (data.session) {
        setHasRecoveryToken(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Password updated successfully. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasRecoveryToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aura-bark py-12 px-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-aura-cream mb-4">Invalid or Expired Link</h2>
          <p className="text-aura-sand mb-4">The reset link is missing or has expired.</p>
          <Link to="/forgot-password" className="text-aura-sand hover:text-aura-cream">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-aura-bark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-aura-cream">
            Reset your password
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className="bg-green-900/30 border border-green-700/40 text-green-300 px-4 py-3 rounded backdrop-blur-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-900/30 border border-red-700/40 text-red-300 px-4 py-3 rounded backdrop-blur-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">New Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-aura-sand/20 placeholder:text-aura-sand/50 text-aura-cream focus:outline-none focus:ring-aura-sand focus:border-aura-sand focus:z-10 sm:text-sm bg-aura-ink/40"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-aura-sand/20 placeholder:text-aura-sand/50 text-aura-cream focus:outline-none focus:ring-aura-sand focus:border-aura-sand focus:z-10 sm:text-sm bg-aura-ink/40"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-aura-ivory bg-aura-bark hover:bg-aura-umber focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aura-umber disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
          <div className="text-center">
            <Link to="/login" className="text-sm text-aura-sand hover:text-aura-cream">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
