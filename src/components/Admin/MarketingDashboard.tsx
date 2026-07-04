import React, { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  subject: string;
  body: string;
  sentAt?: string;
  recipientCount: number;
  status: 'DRAFT' | 'SENT';
}

const MarketingDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ totalUsers: 0, subscribers: 0 });

  useEffect(() => {
    fetchStats();
    fetchCampaigns();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({ ...prev, totalUsers: data.totalUsers || 0 }));
      }
    } catch {
      // ignore
    }
  };

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, body }),
      });
      if (response.ok) {
        setMessage('Campaign sent successfully');
        setSubject('');
        setBody('');
        fetchCampaigns();
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to send campaign');
      }
    } catch {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-aura-cream">Marketing</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-aura-ink rounded-xl border border-aura-umber p-5">
          <p className="text-sm text-aura-sand/70">Total Users</p>
          <p className="text-3xl font-bold text-aura-cream">{stats.totalUsers}</p>
        </div>
        <div className="bg-aura-ink rounded-xl border border-aura-umber p-5">
          <p className="text-sm text-aura-sand/70">Past Campaigns</p>
          <p className="text-3xl font-bold text-aura-cream">{campaigns.length}</p>
        </div>
      </div>

      <div className="bg-aura-ink rounded-xl border border-aura-umber p-6">
        <h2 className="text-lg font-semibold text-aura-cream mb-4">New Email Campaign</h2>
        {message && (
          <div className={`mb-4 px-4 py-3 rounded ${message.includes('success') ? 'bg-green-900/40 text-green-200' : 'bg-red-900/40 text-red-200'}`}>
            {message}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-aura-cream mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:ring-2 focus:ring-aura-sand"
              placeholder="Campaign subject"
            />
          </div>
          <div>
            <label className="block text-sm text-aura-cream mb-1">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:ring-2 focus:ring-aura-sand"
              placeholder="Write your campaign message..."
            />
          </div>
          <button
            onClick={handleSend}
            disabled={loading || !subject.trim() || !body.trim()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send to All Users'}
          </button>
        </div>
      </div>

      <div className="bg-aura-ink rounded-xl border border-aura-umber p-6">
        <h2 className="text-lg font-semibold text-aura-cream mb-4">Campaign History</h2>
        {campaigns.length === 0 ? (
          <p className="text-aura-sand/70 text-sm">No campaigns sent yet.</p>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="border-b border-aura-umber pb-3 last:border-0">
                <p className="text-aura-cream font-medium">{c.subject}</p>
                <p className="text-aura-sand/70 text-sm">
                  {c.status} — {c.recipientCount} recipients
                  {c.sentAt && ` on ${new Date(c.sentAt).toLocaleDateString()}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingDashboard;
