import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface WaitlistEntry {
  id: string;
  position: number;
  status: string;
  class: {
    id: string;
    name: string;
    instructor: string;
    date: string;
    time: string;
  };
}

const MyWaitlist: React.FC = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWaitlist = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/waitlist/my-waitlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEntries(data || []);
      } else {
        setError('Failed to load waitlist');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const handleLeave = async (id: string) => {
    if (!window.confirm('Leave this waitlist?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/waitlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setEntries(prev => prev.filter(e => e.id !== id));
      } else {
        alert('Failed to leave waitlist');
      }
    } catch {
      alert('Network error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-bg border border-danger-border text-danger px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-content">My Waitlist</h1>
      {entries.length === 0 ? (
        <div className="bg-surface rounded-xl border border-edge p-8 text-center">
          <p className="text-content-secondary">You are not on any waitlists.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map(entry => (
            <div
              key={entry.id}
              className="bg-surface rounded-xl border border-edge p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <h3 className="text-lg font-semibold text-content">{entry.class.name}</h3>
                <p className="text-content-secondary text-sm">
                  {format(new Date(entry.class.date), 'MMM dd, yyyy')} at {entry.class.time}
                </p>
                <p className="text-content-secondary text-sm">with {entry.class.instructor}</p>
                <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-surface-sunken text-content-secondary">
                  Position: #{entry.position} — {entry.status}
                </span>
              </div>
              <button
                onClick={() => handleLeave(entry.id)}
                className="bg-danger/80 text-content-on-accent px-4 py-2 rounded-lg hover:opacity-90 transition-colors text-sm"
              >
                Leave Waitlist
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyWaitlist;
