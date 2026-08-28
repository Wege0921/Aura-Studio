import React, { useState, useEffect } from 'react';
import { format, isAfter } from 'date-fns';

interface ClassItem {
  id: string;
  name: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  availableSpots: number;
  bookings: { user: { name: string; email: string } }[];
}

const InstructorDashboard: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/classes/instructor/my-classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data || []);
      } else {
        setError('Failed to load classes');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-900/60 border border-red-600/40 text-red-200 px-4 py-3 rounded">{error}</div>;
  }

  const upcoming = classes.filter(c => isAfter(new Date(c.date), new Date()));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-aura-cream">Instructor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-aura-ink rounded-xl border border-aura-umber p-5">
          <p className="text-sm text-aura-sand">Upcoming Classes</p>
          <p className="text-3xl font-bold text-aura-cream">{upcoming.length}</p>
        </div>
        <div className="bg-aura-ink rounded-xl border border-aura-umber p-5">
          <p className="text-sm text-aura-sand">Total Students This Month</p>
          <p className="text-3xl font-bold text-aura-cream">
            {classes.reduce((sum, c) => sum + c.bookings.length, 0)}
          </p>
        </div>
        <div className="bg-aura-ink rounded-xl border border-aura-umber p-5">
          <p className="text-sm text-aura-sand">Avg Class Size</p>
          <p className="text-3xl font-bold text-aura-cream">
            {classes.length ? Math.round(classes.reduce((sum, c) => sum + c.bookings.length, 0) / classes.length) : 0}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-aura-cream">Your Classes</h2>
        {classes.length === 0 ? (
          <p className="text-aura-sand">No classes assigned yet.</p>
        ) : (
          classes.map(cls => (
            <div key={cls.id} className="bg-aura-ink rounded-xl border border-aura-umber p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-aura-cream">{cls.name}</h3>
                  <p className="text-aura-sand text-sm">
                    {format(new Date(cls.date), 'MMM dd, yyyy')} at {cls.time} · {cls.duration} min
                  </p>
                  <p className="text-aura-sand text-sm">
                    {cls.bookings.length} / {cls.capacity} booked
                  </p>
                </div>
              </div>
              {cls.bookings.length > 0 && (
                <div className="mt-4 border-t border-aura-umber pt-3">
                  <p className="text-xs text-aura-sand uppercase tracking-wider mb-2">Student Roster</p>
                  <div className="flex flex-wrap gap-2">
                    {cls.bookings.map((b, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-aura-bark text-aura-cream text-xs border border-aura-umber">
                        {b.user.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;
