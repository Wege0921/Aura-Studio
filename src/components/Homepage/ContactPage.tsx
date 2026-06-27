import React, { useState } from 'react';

const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        setSent(true);
        setForm({ name: '', email: '', message: '' });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send message');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-aura-ink rounded-xl shadow-lg shadow-black/20 border border-aura-sand/10 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-aura-cream mb-2">Contact Us</h1>
        <p className="text-aura-sand mb-6">We would love to hear from you. Send us a message!</p>

        {sent && (
          <div className="bg-green-900/40 border border-green-600/30 text-green-200 px-4 py-3 rounded mb-4">
            Thank you for reaching out. We will get back to you soon.
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
              required
              className="w-full px-3 py-2 bg-aura-bark border border-aura-sand/30 rounded-lg text-aura-cream focus:outline-none focus:ring-2 focus:ring-aura-sand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-aura-cream mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-aura-bark border border-aura-sand/30 rounded-lg text-aura-cream focus:outline-none focus:ring-2 focus:ring-aura-sand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-aura-cream mb-1">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-3 py-2 bg-aura-bark border border-aura-sand/30 rounded-lg text-aura-cream focus:outline-none focus:ring-2 focus:ring-aura-sand"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>

      <div className="bg-aura-ink rounded-xl border border-aura-sand/10 p-6">
        <h2 className="text-lg font-semibold text-aura-cream mb-3">Studio Info</h2>
        <div className="text-sm text-aura-sand space-y-2">
          <p>📍 Addis Ababa, Ethiopia</p>
          <p>📞 +251 911 234 567</p>
          <p>✉️ hello@aurastudio.com</p>
          <div className="flex gap-4 mt-3">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-aura-sand hover:text-aura-cream transition-colors">
              Instagram
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-aura-sand hover:text-aura-cream transition-colors">
              Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
