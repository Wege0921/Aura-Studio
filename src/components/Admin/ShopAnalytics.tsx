import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { formatETB } from '../Shop/shopTypes';

interface ShopAnalyticsData {
  summary: {
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    pendingPayments: number;
  };
  topProducts: Array<{
    productId: string;
    name: string;
    slug: string;
    _sum: { quantity: number; lineTotal: number };
  }>;
}

const ShopAnalytics: React.FC = () => {
  const [data, setData] = useState<ShopAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await api.get<ShopAnalyticsData>('/api/admin/shop/analytics/summary');
        setData(result);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aura-umber"></div></div>;
  }

  if (!data) {
    return <div className="text-center py-10 text-aura-sand">Unable to load analytics.</div>;
  }

  const { summary } = data;

  const stats = [
    { label: 'Total Orders', value: summary.totalOrders, color: 'text-aura-cream' },
    { label: 'Total Revenue', value: formatETB(summary.totalRevenue), color: 'text-green-300' },
    { label: 'Pending Orders', value: summary.pendingOrders, color: 'text-amber-300' },
    { label: 'Confirmed', value: summary.confirmedOrders, color: 'text-green-300' },
    { label: 'Shipped', value: summary.shippedOrders, color: 'text-indigo-300' },
    { label: 'Delivered', value: summary.deliveredOrders, color: 'text-green-200' },
    { label: 'Cancelled', value: summary.cancelledOrders, color: 'text-red-300' },
    { label: 'Pending Payments', value: summary.pendingPayments, color: 'text-amber-300' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-aura-ivory">Shop Analytics</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-aura-ink rounded-xl border border-aura-umber p-4">
            <p className="text-xs text-aura-sand mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Top products */}
      <div className="bg-aura-ink rounded-xl border border-aura-umber p-6">
        <h2 className="text-lg font-serif text-aura-ivory mb-4">Top Products (by revenue)</h2>
        {data.topProducts.length === 0 ? (
          <p className="text-sm text-aura-sand text-center py-4">No sales data yet.</p>
        ) : (
          <div className="space-y-2">
            {data.topProducts.map((p, idx) => (
              <div key={p.productId} className="flex items-center justify-between bg-aura-bark rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-aura-sand text-sm w-6">{idx + 1}.</span>
                  <span className="text-sm text-aura-cream">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-aura-cream">{formatETB(p._sum.lineTotal)}</p>
                  <p className="text-xs text-aura-sand">{p._sum.quantity} sold</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopAnalytics;
