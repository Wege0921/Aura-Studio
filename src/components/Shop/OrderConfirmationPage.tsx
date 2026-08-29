import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ShopOrder, formatETB, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from './shopTypes';
import StatusBadge from './StatusBadge';
import { CheckCircleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const guestToken = searchParams.get('guestToken');
        const url = `/api/shop/orders/${id}${guestToken ? `?guestToken=${guestToken}` : ''}`;
        const data = await api.get<ShopOrder>(url);
        setOrder(data);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setFetchError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-edge"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-content-secondary text-lg">{fetchError || 'Order not found.'}</p>
        <button onClick={() => navigate('/shop')} className="mt-4 text-accent-400 hover:text-content-secondary">
          ← Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success header */}
      <div className="text-center py-6">
        <CheckCircleIcon className="w-16 h-16 text-success mx-auto mb-4" />
        <h1 className="text-2xl font-serif text-content-emphasis mb-2">Order Confirmed!</h1>
        <p className="text-content-secondary">Thank you for your order. We'll process it shortly.</p>
      </div>

      {/* Order details */}
      <div className="bg-surface rounded-xl border border-edge p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-content-secondary">Order Number</p>
            <p className="text-lg font-bold text-content">{order.orderNumber}</p>
          </div>
          <StatusBadge status={order.status} kind="order" />
        </div>

        <div className="border-t border-edge pt-4">
          <h2 className="text-sm font-semibold text-content mb-3">Items</h2>
          <div className="space-y-2">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="text-content">{item.name}</span>
                  {item.variantLabel && <span className="text-content-secondary"> — {item.variantLabel}</span>}
                  <span className="text-content-secondary"> × {item.quantity}</span>
                </div>
                <span className="text-content">{formatETB(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-edge pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-content-secondary">Subtotal</span>
            <span className="text-content">{formatETB(order.subtotal)}</span>
          </div>
          {order.discount && order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-content-secondary">Discount</span>
              <span className="text-success">-{formatETB(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-content-secondary">Shipping</span>
            <span className="text-content">{order.shippingCost === 0 ? 'Free' : formatETB(order.shippingCost)}</span>
          </div>
          <div className="border-t border-edge pt-2 flex justify-between items-baseline">
            <span className="text-content font-medium">Total</span>
            <span className="text-xl font-bold text-content">{formatETB(order.total)}</span>
          </div>
        </div>

        {/* Payment info */}
        <div className="border-t border-edge pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-content-secondary">Payment Method</span>
            <span className="text-content">{order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod : '—'}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-content-secondary">Payment Status</span>
            <StatusBadge status={order.paymentStatus} kind="payment" srPrefix="Payment" />
          </div>
          {order.paymentStatus === 'PENDING' && order.paymentMethod !== 'CASH_ON_DELIVERY' && (
            <p className="text-xs text-content-secondary bg-warning-bg rounded p-2">
              Your payment is being verified. You'll receive a notification once confirmed.
            </p>
          )}
        </div>

        {/* Shipping address */}
        {order.shippingAddress && (
          <div className="border-t border-edge pt-4">
            <h2 className="text-sm font-semibold text-content mb-2">Shipping Address</h2>
            <div className="text-sm text-content-secondary space-y-0.5">
              <p className="text-content">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.address}</p>
              {order.shippingAddress.postalCode && <p>{order.shippingAddress.postalCode}</p>}
            </div>
          </div>
        )}

        {/* Status history */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="border-t border-edge pt-4">
            <h2 className="text-sm font-semibold text-content mb-2">Order Updates</h2>
            <div className="space-y-2">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="text-sm flex justify-between">
                  <span className="text-content">{ORDER_STATUS_LABELS[h.status] || h.status}</span>
                  <span className="text-content-secondary text-xs">{new Date(h.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/shop')}
          className="flex-1 px-6 py-3 rounded-lg border border-edge text-content text-sm font-medium hover:border-edge-strong flex items-center justify-center gap-2"
        >
          <ShoppingBagIcon className="w-5 h-5" /> Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
