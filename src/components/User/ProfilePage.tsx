import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSEO } from '../../hooks/useSEO';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  useSEO({ title: 'Your Profile — AURA Studio', canonicalPath: '/dashboard' });
  const [form, setForm] = useState<ProfileData>({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          updateUser(data.user);
        }
        setMessage('Profile updated successfully');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-surface rounded-xl shadow-elev-1 border border-edge p-6">
        <h1 className="text-2xl font-bold text-content mb-2">Your Profile</h1>
        <p className="text-content-secondary mb-6">Update your personal information</p>

        {message && (
          <div className="bg-success-bg border border-success-border text-success px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-danger-bg border border-danger-border text-danger px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-content-secondary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-content-secondary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-content-secondary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-accent-600 text-content-on-accent px-6 py-2 rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="bg-surface rounded-xl shadow-elev-1 border border-edge p-6">
        <h2 className="text-lg font-semibold text-content mb-2">Account Info</h2>
        <div className="text-sm text-content-secondary space-y-1">
          <p><span className="text-content-secondary">Role:</span> {user?.role}</p>
          <p><span className="text-content-secondary">Member since:</span> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
