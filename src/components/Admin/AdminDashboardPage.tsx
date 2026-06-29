import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { api } from '../../lib/api';

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
    instructor: string;
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
}

interface AdminDashboardPageProps {
  onTabChange?: (tabId: string) => void;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = React.memo(({ onTabChange }) => {
  const { data: dashboardData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const [statsData, bookingsData, paymentsData] = await Promise.all([
        api.get<DashboardStats>('/api/admin/dashboard/stats'),
        api.get<{ bookings: RecentBooking[] }>('/api/admin/bookings?limit=5'),
        api.get<{ payments: RecentPayment[] }>('/api/payments?limit=5'),
      ]);
      return {
        stats: statsData,
        recentBookings: bookingsData.bookings || [],
        recentPayments: paymentsData.payments || [],
      };
    },
  });

  const stats = dashboardData?.stats ?? null;
  const recentBookings: RecentBooking[] = dashboardData?.recentBookings ?? [];
  const recentPayments: RecentPayment[] = dashboardData?.recentPayments ?? [];
  const error = queryError ? 'Failed to load dashboard data' : '';

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'VERIFIED':
        return 'bg-green-900/40 text-green-200';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-900/40 text-red-200';
      case 'PENDING':
        return 'bg-amber-900/40 text-amber-200';
      default:
        return 'bg-aura-umber/40 text-aura-sand';
    }
  }, []);

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-aura-cream">Admin Dashboard</h1>
        <p className="text-aura-sand">Manage your pilates studio</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-aura-sand">Total Users</p>
                <p className="text-2xl font-bold text-aura-cream">{stats.totalUsers}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-aura-sand">Total Classes</p>
                <p className="text-2xl font-bold text-aura-cream">{stats.totalClasses}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-aura-sand">Total Bookings</p>
                <p className="text-2xl font-bold text-aura-cream">{stats.totalBookings}</p>
              </div>
              <div className="bg-green-900/40 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-aura-sand">Total Revenue</p>
                <p className="text-2xl font-bold text-aura-cream">ETB {stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-amber-900/40 p-3 rounded-full">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-aura-sand">Active Packages</p>
                <p className="text-2xl font-bold text-aura-cream">{stats.activePackages}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-aura-ink p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-aura-sand">Pending Payments</p>
                <p className="text-2xl font-bold text-aura-cream">{stats.pendingPayments}</p>
              </div>
              <div className="bg-red-900/40 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-aura-ink rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-aura-cream mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => onTabChange && onTabChange('admin-classes')} className="block w-full text-left px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Class
            </div>
          </button>
          <button onClick={() => onTabChange && onTabChange('admin-packages')} className="block w-full text-left px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Package
            </div>
          </button>
          <button onClick={() => onTabChange && onTabChange('admin-analytics')} className="block w-full text-left px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              View Analytics
            </div>
          </button>
          <button onClick={() => onTabChange && onTabChange('admin-users')} className="block w-full text-left px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Manage Users
            </div>
          </button>
        </div>
      </div>

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
                    <div>
                      <p className="text-sm font-medium text-aura-cream">{booking.user.name}</p>
                      <p className="text-sm text-aura-sand/70">{booking.class.name}</p>
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
                    <div>
                      <p className="text-sm font-medium text-aura-cream">{payment.user.name}</p>
                      <p className="text-sm text-aura-sand/70">ETB {payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-aura-sand/50">
                        {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdminDashboardPage;
