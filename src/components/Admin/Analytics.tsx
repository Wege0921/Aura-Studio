import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  bookingsByStatus: { status: string; count: number }[];
  revenueByMonth: { labels: string[]; data: number[] };
  usersByMonth: { labels: string[]; data: number[] };
  topClasses: { name: string; bookings: number }[];
  packagePopularity: { name: string; purchases: number }[];
  recentActivity: {
    bookings30d: number;
    completed30d: number;
    payments30d: number;
    revenue30d: number;
  };
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        setError('Failed to load analytics');
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

  if (error || !data) {
    return (
      <div className="bg-red-900/60 border border-red-600/40 text-red-200 px-4 py-3 rounded">
        {error || 'No data'}
        <button onClick={fetchAnalytics} className="ml-4 text-red-200 hover:text-white underline">
          Retry
        </button>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.revenueByMonth.data, 1);
  const maxUsers = Math.max(...data.usersByMonth.data, 1);
  const totalBookings = data.bookingsByStatus.reduce((s, b) => s + b.count, 0);

  const statusColors: Record<string, string> = {
    CONFIRMED: 'bg-green-500',
    COMPLETED: 'bg-blue-500',
    CANCELLED: 'bg-red-500',
    PENDING: 'bg-yellow-500',
    WAITLIST: 'bg-purple-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-aura-cream">Analytics</h1>
        <p className="text-aura-sand/70">Insights and trends for your studio</p>
      </div>

      {/* 30-day Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Bookings (30d)', value: data.recentActivity.bookings30d, color: 'text-blue-400' },
          { label: 'Completed', value: data.recentActivity.completed30d, color: 'text-green-400' },
          { label: 'Payments (30d)', value: data.recentActivity.payments30d, color: 'text-purple-400' },
          { label: 'Revenue (30d)', value: `ETB ${data.recentActivity.revenue30d.toLocaleString()}`, color: 'text-aura-sand' },
        ].map((card) => (
          <div key={card.label} className="bg-aura-ink p-4 rounded-lg border border-aura-umber">
            <p className="text-xs text-aura-sand/60 uppercase tracking-wider">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-aura-ink p-5 rounded-lg border border-aura-umber">
          <h3 className="text-lg font-semibold text-aura-cream mb-4">Revenue Trend (6 Months)</h3>
          <div className="flex items-end gap-3 h-48">
            {data.revenueByMonth.labels.map((label, i) => {
              const val = data.revenueByMonth.data[i];
              const pct = (val / maxRevenue) * 100;
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end h-36">
                    <div
                      className="w-full bg-purple-600 rounded-t transition-all duration-700"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      title={`ETB ${val.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[10px] text-aura-sand/60">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-aura-ink p-5 rounded-lg border border-aura-umber">
          <h3 className="text-lg font-semibold text-aura-cream mb-4">User Growth (6 Months)</h3>
          <div className="flex items-end gap-3 h-48">
            {data.usersByMonth.labels.map((label, i) => {
              const val = data.usersByMonth.data[i];
              const pct = (val / maxUsers) * 100;
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end h-36">
                    <div
                      className="w-full bg-green-600 rounded-t transition-all duration-700"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      title={`${val} users`}
                    />
                  </div>
                  <span className="text-[10px] text-aura-sand/60">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bookings by Status */}
      <div className="bg-aura-ink p-5 rounded-lg border border-aura-umber">
        <h3 className="text-lg font-semibold text-aura-cream mb-4">Bookings by Status</h3>
        <div className="flex flex-wrap gap-4">
          {data.bookingsByStatus.map((b) => (
            <div key={b.status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${statusColors[b.status] || 'bg-gray-500'}`} />
              <span className="text-sm text-aura-sand">{b.status}</span>
              <span className="text-sm font-bold text-aura-cream">{b.count}</span>
              <span className="text-xs text-aura-sand/50">
                ({totalBookings > 0 ? Math.round((b.count / totalBookings) * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex h-4 rounded-full overflow-hidden">
          {data.bookingsByStatus.map((b) => (
            <div
              key={b.status}
              className={`${statusColors[b.status] || 'bg-gray-500'} transition-all duration-700`}
              style={{ width: `${totalBookings > 0 ? (b.count / totalBookings) * 100 : 0}%` }}
              title={`${b.status}: ${b.count}`}
            />
          ))}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Classes */}
        <div className="bg-aura-ink rounded-lg border border-aura-umber overflow-hidden">
          <div className="px-5 py-4 border-b border-aura-umber">
            <h3 className="text-lg font-semibold text-aura-cream">Top Classes</h3>
          </div>
          <div className="p-4 space-y-3">
            {data.topClasses.map((cls, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-aura-cream truncate pr-4">{cls.name}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-24 h-2 bg-aura-umber/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${data.topClasses[0]?.bookings ? (cls.bookings / data.topClasses[0].bookings) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-aura-sand w-8 text-right">{cls.bookings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Package Popularity */}
        <div className="bg-aura-ink rounded-lg border border-aura-umber overflow-hidden">
          <div className="px-5 py-4 border-b border-aura-umber">
            <h3 className="text-lg font-semibold text-aura-cream">Popular Packages</h3>
          </div>
          <div className="p-4 space-y-3">
            {data.packagePopularity.map((pkg, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-aura-cream truncate pr-4">{pkg.name}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-24 h-2 bg-aura-umber/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${data.packagePopularity[0]?.purchases ? (pkg.purchases / data.packagePopularity[0].purchases) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-aura-sand w-8 text-right">{pkg.purchases}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
