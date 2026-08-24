import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ShopOrder, formatETB, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from './shopTypes';
import { ShoppingBagIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
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
  }, [user]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setLookupLoading(true);
    try {
      const data = await api.post<{ orderId: string; guestToken: string; orderNumber: string }>(
        '/api/shop/orders/lookup',
        { orderNumber: lookupNumber, phone: lookupPhone }
      );
      navigate(`/shop/orders/${data.orderId}?guestToken=${data.guestToken}`);
    } catch (err: any) {
      setLookupError(err.message || 'Order not found. Check your order number and phone.');
    } finally {
      setLookupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aura-umber"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <ShoppingBagIcon className="w-16 h-16 text-aura-umber mx-auto mb-4" />
          <h2 className="text-xl font-serif text-aura-ivory mb-2">
            {user ? 'No orders yet' : 'Track your order'}
          </h2>
          <p className="text-aura-sand mb-6">
            {user
              ? 'When you place an order, it will appear here.'
              : 'Enter your order number and phone to view your order.'}
          </p>
          {user && (
            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
            >
              Go to Shop
            </button>
          )}
        </div>

        {/* Guest order lookup */}
        {!user && (
          <div className="max-w-md mx-auto bg-aura-ink rounded-xl border border-aura-umber p-6">
            <h3 className="text-lg font-serif text-aura-ivory mb-4 flex items-center gap-2">
              <MagnifyingGlassIcon className="w-5 h-5" /> Find your order
            </h3>
            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Order Number</label>
                <input
                  type="text"
                  required
                  value={lookupNumber}
                  onChange={(e) => setLookupNumber(e.target.value)}
                  placeholder="e.g. AURA-2026-00001"
                  className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
                />
              </div>
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="The phone you used at checkout"
                  className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
                />
              </div>
              {lookupError && <p className="text-sm text-red-400">{lookupError}</p>}
              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {lookupLoading ? 'Searching...' : 'Find Order'}
              </button>
            </form>
          </div>
        )}
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
