import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ShopOrder, formatETB, PAYMENT_METHOD_LABELS } from './shopTypes';
import StatusBadge from './StatusBadge';
import { ShoppingBagIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
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
        setLoadError(err instanceof Error ? err.message : 'Failed to load orders.');
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-edge"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <ShoppingBagIcon className="w-16 h-16 text-content-secondary mx-auto mb-4" />
          <h2 className="text-xl font-serif text-content-emphasis mb-2">
            {user ? 'No orders yet' : 'Track your order'}
          </h2>
          <p className="text-content-secondary mb-6">
            {user
              ? 'When you place an order, it will appear here.'
              : 'Enter your order number and phone to view your order.'}
          </p>
          {user && (
            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-2.5 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700"
            >
              Go to Shop
            </button>
          )}
        </div>

        {/* Guest order lookup */}
        {!user && (
          <div className="max-w-md mx-auto bg-surface rounded-xl border border-edge p-6">
            <h3 className="text-lg font-serif text-content-emphasis mb-4 flex items-center gap-2">
              <MagnifyingGlassIcon className="w-5 h-5" /> Find your order
            </h3>
            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label className="text-sm text-content-secondary mb-1 block">Order Number</label>
                <input
                  type="text"
                  required
                  value={lookupNumber}
                  onChange={(e) => setLookupNumber(e.target.value)}
                  placeholder="e.g. AURA-2026-00001"
                  className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus"
                />
              </div>
              <div>
                <label className="text-sm text-content-secondary mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="The phone you used at checkout"
                  className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus"
                />
              </div>
              {lookupError && <p className="text-sm text-danger">{lookupError}</p>}
              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full px-4 py-2.5 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700 disabled:opacity-50"
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
      {loadError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3">
          <span className="text-danger text-sm flex-1">{loadError}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-danger underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
      <h1 className="text-2xl font-serif text-content-emphasis">My Orders</h1>

      <div className="space-y-3">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => navigate(`/shop/orders/${order.id}`)}
            className="w-full text-left bg-surface rounded-xl border border-edge p-4 hover:border-edge-focus transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm font-bold text-content">{order.orderNumber}</p>
                <p className="text-xs text-content-secondary">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
              <StatusBadge status={order.status} kind="order" />
            </div>

            <div className="space-y-1">
              {order.items?.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-content-secondary">
                    {item.name} × {item.quantity}
                    {item.variantLabel && <span className="text-content-secondary"> ({item.variantLabel})</span>}
                  </span>
                </div>
              ))}
              {order.items && order.items.length > 3 && (
                <p className="text-xs text-content-secondary">+ {order.items.length - 3} more items</p>
              )}
            </div>

            <div className="border-t border-edge mt-3 pt-3 flex justify-between items-center">
              <span className="text-sm text-content-secondary">
                {order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : ''} · {order.paymentStatus}
              </span>
              <span className="text-lg font-bold text-content">{formatETB(order.total)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
