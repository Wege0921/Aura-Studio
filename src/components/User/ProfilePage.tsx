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
  useSEO({ title: 'Your Profile — AURA Studio' });
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
      <div className="bg-aura-ink rounded-xl shadow-lg shadow-black/20 border border-aura-sand/10 p-6">
        <h1 className="text-2xl font-bold text-aura-cream mb-2">Your Profile</h1>
        <p className="text-aura-sand mb-6">Update your personal information</p>

        {message && (
          <div className="bg-green-900/40 border border-green-600/30 text-green-200 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-900/40 border border-red-600/30 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-aura-cream mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-aura-bark border border-aura-sand/30 rounded-lg text-aura-cream focus:outline-none focus:ring-2 focus:ring-aura-sand"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-aura-cream mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-aura-bark border border-aura-sand/30 rounded-lg text-aura-cream focus:outline-none focus:ring-2 focus:ring-aura-sand"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-aura-cream mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-aura-bark border border-aura-sand/30 rounded-lg text-aura-cream focus:outline-none focus:ring-2 focus:ring-aura-sand"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="bg-aura-ink rounded-xl shadow-lg shadow-black/20 border border-aura-sand/10 p-6">
        <h2 className="text-lg font-semibold text-aura-cream mb-2">Account Info</h2>
        <div className="text-sm text-aura-sand space-y-1">
          <p><span className="text-aura-sand/70">Role:</span> {user?.role}</p>
          <p><span className="text-aura-sand/70">Member since:</span> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
