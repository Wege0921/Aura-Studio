import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ShopOrder, formatETB, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from './shopTypes';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.get<ShopOrder[]>('/api/shop/orders/mine');
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aura-umber"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBagIcon className="w-16 h-16 text-aura-umber mx-auto mb-4" />
        <h2 className="text-xl font-serif text-aura-ivory mb-2">No orders yet</h2>
        <p className="text-aura-sand mb-6">When you place an order, it will appear here.</p>
        <button
          onClick={() => navigate('/shop')}
          className="px-6 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
        >
          Go to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-aura-ivory">My Orders</h1>

      <div className="space-y-3">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => navigate(`/shop/orders/${order.id}`)}
            className="w-full text-left bg-aura-ink rounded-xl border border-aura-umber p-4 hover:border-aura-clay transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-bold text-aura-cream">{order.orderNumber}</p>
                <p className="text-xs text-aura-sand/60">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || ''}`}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div className="space-y-1">
              {order.items?.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-aura-sand">
                    {item.name} × {item.quantity}
                    {item.variantLabel && <span className="text-aura-sand/60"> ({item.variantLabel})</span>}
                  </span>
                </div>
              ))}
              {order.items && order.items.length > 3 && (
                <p className="text-xs text-aura-sand/60">+ {order.items.length - 3} more items</p>
              )}
            </div>

            <div className="border-t border-aura-umber mt-3 pt-3 flex justify-between items-center">
              <span className="text-sm text-aura-sand">
                {order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : ''} · {order.paymentStatus}
              </span>
              <span className="text-lg font-bold text-aura-cream">{formatETB(order.total)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
