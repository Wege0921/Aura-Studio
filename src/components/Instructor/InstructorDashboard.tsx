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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-danger-bg border border-danger-border text-danger px-4 py-3 rounded">{error}</div>;
  }

  const upcoming = classes.filter(c => isAfter(new Date(c.date), new Date()));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-content">Instructor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-edge p-5">
          <p className="text-sm text-content-secondary">Upcoming Classes</p>
          <p className="text-3xl font-bold text-content">{upcoming.length}</p>
        </div>
        <div className="bg-surface rounded-xl border border-edge p-5">
          <p className="text-sm text-content-secondary">Total Students This Month</p>
          <p className="text-3xl font-bold text-content">
            {classes.reduce((sum, c) => sum + c.bookings.length, 0)}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-edge p-5">
          <p className="text-sm text-content-secondary">Avg Class Size</p>
          <p className="text-3xl font-bold text-content">
            {classes.length ? Math.round(classes.reduce((sum, c) => sum + c.bookings.length, 0) / classes.length) : 0}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-content">Your Classes</h2>
        {classes.length === 0 ? (
          <p className="text-content-secondary">No classes assigned yet.</p>
        ) : (
          classes.map(cls => (
            <div key={cls.id} className="bg-surface rounded-xl border border-edge p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-content">{cls.name}</h3>
                  <p className="text-content-secondary text-sm">
                    {format(new Date(cls.date), 'MMM dd, yyyy')} at {cls.time} · {cls.duration} min
                  </p>
                  <p className="text-content-secondary text-sm">
                    {cls.bookings.length} / {cls.capacity} booked
                  </p>
                </div>
              </div>
              {cls.bookings.length > 0 && (
                <div className="mt-4 border-t border-edge pt-3">
                  <p className="text-xs text-content-secondary uppercase tracking-wider mb-2">Student Roster</p>
                  <div className="flex flex-wrap gap-2">
                    {cls.bookings.map((b, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-canvas text-content text-xs border border-edge">
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
