import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format, isAfter } from 'date-fns';

interface Booking {
  id: string;
  status: string;
  createdAt: string;
  class: {
    id: string;
    name: string;
    instructor: string;
    date: string;
    time: string;
  };
}

interface UserPackage {
  id: string;
  status: string;
  remainingSessions?: number;
  package: {
    id: string;
    name: string;
    sessions: number;
    price: number;
    duration: number;
  };
  expiresAt?: string;
}

const QuickActionCard = ({
  title,
  description,
  icon,
  onClick,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-5 rounded-xl border border-aura-sand/10 bg-aura-ink hover:bg-aura-bark transition-all duration-200 group`}
  >
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-aura-cream font-semibold text-sm mb-1">{title}</h3>
    <p className="text-aura-sand/70 text-xs">{description}</p>
  </button>
);

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');

      const [bookingsRes, packagesRes] = await Promise.all([
        fetch('/api/bookings/my-bookings', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/packages/my-packages', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const upcoming = bookingsData?.filter((booking: Booking) => {
          const classDate = new Date(booking.class.date);
          return isAfter(classDate, new Date()) && booking.status === 'CONFIRMED';
        }).slice(0, 2);
        setUpcomingBookings(upcoming || []);
      }

      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setUserPackages(packagesData || []);
      }
    } catch (err) {
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const goToPackages = () => navigate('/packages');
  const goToPayments = () => navigate('/dashboard/payments');

  const activePkgs = userPackages.filter(
    (up) => up.remainingSessions !== undefined && up.remainingSessions > 0
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/60 border border-red-600/40 text-red-200 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-br from-purple-900/40 to-aura-ink rounded-2xl shadow-lg shadow-black/20 border border-aura-sand/10 p-6 overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-aura-cream mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-aura-sand max-w-lg">
            Ready for your next pilates session? Browse packages, track your progress, and manage your wellness journey.
          </p>
        </div>
        {/* Decorative circle */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-500/10 blur-2xl" />
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-aura-cream mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickActionCard
            title="Browse Packages"
            description="View all available packages"
            color="bg-purple-600/20 text-purple-400"
            onClick={goToPackages}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <QuickActionCard
            title="Buy a Package"
            description="Purchase new sessions"
            color="bg-green-600/20 text-green-400"
            onClick={goToPackages}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          />
          <QuickActionCard
            title="My Packages"
            description="View your active packages"
            color="bg-blue-600/20 text-blue-400"
            onClick={goToPackages}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <QuickActionCard
            title="Payment History"
            description="View your past payments"
            color="bg-amber-600/20 text-amber-400"
            onClick={goToPayments}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-aura-ink rounded-xl border border-aura-sand/10 p-4">
          <p className="text-aura-sand/70 text-xs uppercase tracking-wider mb-1">Active Packages</p>
          <p className="text-2xl font-bold text-aura-cream">{activePkgs.length}</p>
        </div>
        <div className="bg-aura-ink rounded-xl border border-aura-sand/10 p-4">
          <p className="text-aura-sand/70 text-xs uppercase tracking-wider mb-1">Total Sessions</p>
          <p className="text-2xl font-bold text-aura-cream">
            {activePkgs.reduce((sum, up) => sum + (up.remainingSessions || 0), 0)}
          </p>
        </div>
        <div className="bg-aura-ink rounded-xl border border-aura-sand/10 p-4">
          <p className="text-aura-sand/70 text-xs uppercase tracking-wider mb-1">Upcoming</p>
          <p className="text-2xl font-bold text-aura-cream">{upcomingBookings.length}</p>
        </div>
        <div className="bg-aura-ink rounded-xl border border-aura-sand/10 p-4">
          <p className="text-aura-sand/70 text-xs uppercase tracking-wider mb-1">Member Since</p>
          <p className="text-sm font-semibold text-aura-cream mt-1">
            {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'N/A'}
          </p>
        </div>
      </div>

      {/* Two Column: Packages + Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Packages */}
        <div className="bg-aura-ink rounded-xl shadow-lg shadow-black/20 border border-aura-sand/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-aura-cream">Your Packages</h2>
            <button onClick={goToPackages} className="text-xs text-purple-400 hover:text-purple-300">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {userPackages.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-aura-sand/70 text-sm mb-3">No active packages yet</p>
                <button
                  onClick={goToPackages}
                  className="text-sm text-purple-400 hover:text-purple-300 font-medium"
                >
                  Browse packages →
                </button>
              </div>
            ) : (
              userPackages.slice(0, 3).map((up) => (
                <div key={up.id} className="flex items-center justify-between p-3 rounded-lg bg-aura-bark/40 border border-aura-sand/5">
                  <div>
                    <p className="text-sm font-medium text-aura-cream">{up.package.name}</p>
                    <p className="text-xs text-aura-sand">
                      {up.remainingSessions !== undefined
                        ? `${up.remainingSessions} sessions remaining`
                        : 'Unlimited sessions'
                      }
                    </p>
                  </div>
                  {up.expiresAt && (
                    <span className="text-xs text-aura-clay">
                      {Math.ceil((new Date(up.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-aura-ink rounded-xl shadow-lg shadow-black/20 border border-aura-sand/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-aura-cream">Upcoming Classes</h2>
          </div>
          <div className="space-y-3">
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-aura-sand/70 text-sm">No upcoming classes</p>
              </div>
            ) : (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-3 p-3 rounded-lg bg-aura-bark/40 border border-aura-sand/5">
                  <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-aura-cream truncate">{booking.class.name}</p>
                    <p className="text-xs text-aura-sand">
                      {format(new Date(booking.class.date), 'EEE, MMM dd')} at {booking.class.time}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 flex-shrink-0">
                    {booking.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
