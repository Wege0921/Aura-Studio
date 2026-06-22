import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  totalClasses: number;
  totalBookings: number;
  totalRevenue: number;
  activePackages: number;
  pendingPayments: number;
}

interface RecentBooking {
  id: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  class: {
    name: string;
    date: string;
    time: string;
  };
}

interface RecentPayment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  paymentMethod: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [statsResponse, bookingsResponse, paymentsResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/admin/bookings?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/payments?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setRecentBookings(bookingsData.bookings || []);
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setRecentPayments(paymentsData.payments || []);
      }

    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'VERIFIED':
        return 'bg-green-900/40 text-green-200';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-900/40 text-red-200';
      case 'PENDING':
        return 'bg-amber-900/40 text-amber-200';
      case 'COMPLETED':
        return 'bg-aura-umber/40 text-aura-sand';
      default:
        return 'bg-aura-sand/10 text-aura-sand';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-aura-cream">Admin Dashboard</h1>
        <p className="text-aura-sand">Manage your pilates studio operations</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/60 border border-red-600/40 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-aura-sand">Total Users</p>
                <p className="text-2xl font-bold text-aura-cream">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-aura-sand">Total Classes</p>
                <p className="text-2xl font-bold text-aura-cream">{stats.totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-900/30 rounded-lg p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-aura-sand">Total Bookings</p>
                <p className="text-2xl font-bold text-aura-cream">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-aura-sand">Total Revenue</p>
                <p className="text-2xl font-bold text-aura-cream">ETB {stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-pink-100 rounded-lg p-3">
                <svg className="h-6 w-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-aura-sand">Active Packages</p>
                <p className="text-2xl font-bold text-aura-cream">{stats.activePackages}</p>
              </div>
            </div>
          </div>

          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-900/30 rounded-lg p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-aura-sand">Pending Payments</p>
                <p className="text-2xl font-bold text-aura-cream">{stats.pendingPayments}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-aura-ink rounded-lg shadow">
          <div className="px-6 py-4 border-b border-aura-sand/10">
            <h2 className="text-lg font-medium text-aura-cream">Recent Bookings</h2>
          </div>
          <div className="p-6">
            {recentBookings.length === 0 ? (
              <p className="text-aura-sand/70 text-center py-4">No recent bookings</p>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-aura-cream">{booking.user.name}</p>
                      <p className="text-xs text-aura-sand/70">{booking.class.name}</p>
                      <p className="text-xs text-aura-sand/50">
                        {format(new Date(booking.class.date), 'MMM dd')} at {booking.class.time}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="bg-aura-ink rounded-lg shadow">
          <div className="px-6 py-4 border-b border-aura-sand/10">
            <h2 className="text-lg font-medium text-aura-cream">Navigation</h2>
          </div>
          <div className="p-6">
            <div className="bg-aura-ink rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-aura-cream mb-4">Management</h2>
              <div className="space-y-3">
                <a href="/admin/classes" className="block w-full text-left px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  Manage Classes
                </a>
                <a href="/admin/packages" className="block w-full text-left px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  Manage Packages
                </a>
                <a href="/admin/bookings" className="block w-full text-left px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  Manage Bookings
                </a>
                <a href="/admin/analytics" className="block w-full text-left px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  Manage Payments
                </a>
                <a href="/admin/users" className="block w-full text-left px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  Manage Users
                </a>
              </div>
            </div>
            <div className="bg-aura-ink rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-aura-cream mb-4">Tools</h2>
              <div className="space-y-3">
                <a href="/admin/marketing" className="block w-full text-left px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  Marketing Tools
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-aura-ink rounded-lg shadow">
          <div className="px-6 py-4 border-b border-aura-sand/10">
            <h2 className="text-lg font-medium text-aura-cream">Recent Payments</h2>
          </div>
          <div className="p-6">
            {recentPayments.length === 0 ? (
              <p className="text-aura-sand/70 text-center py-4">No recent payments</p>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-aura-cream">{payment.user.name}</p>
                      <p className="text-xs text-aura-sand/70">{payment.paymentMethod}</p>
                      <p className="text-xs text-aura-sand/50">
                        {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-aura-cream">ETB {payment.amount.toLocaleString()}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
