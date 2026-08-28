import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ShopOrder, formatETB, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_COLORS } from './shopTypes';
import { CheckCircleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const guestToken = searchParams.get('guestToken');
        const url = `/api/shop/orders/${id}${guestToken ? `?guestToken=${guestToken}` : ''}`;
        const data = await api.get<ShopOrder>(url);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aura-umber"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-aura-sand text-lg">Order not found.</p>
        <button onClick={() => navigate('/shop')} className="mt-4 text-aura-clay hover:text-aura-sand">
          ← Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success header */}
      <div className="text-center py-6">
        <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl font-serif text-aura-ivory mb-2">Order Confirmed!</h1>
        <p className="text-aura-sand">Thank you for your order. We'll process it shortly.</p>
      </div>

      {/* Order details */}
      <div className="bg-aura-ink rounded-xl border border-aura-umber p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-aura-sand">Order Number</p>
            <p className="text-lg font-bold text-aura-cream">{order.orderNumber}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || ''}`}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>
        </div>

        <div className="border-t border-aura-umber pt-4">
          <h2 className="text-sm font-semibold text-aura-cream mb-3">Items</h2>
          <div className="space-y-2">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="text-aura-cream">{item.name}</span>
                  {item.variantLabel && <span className="text-aura-sand"> — {item.variantLabel}</span>}
                  <span className="text-aura-sand"> × {item.quantity}</span>
                </div>
                <span className="text-aura-cream">{formatETB(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-aura-umber pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-aura-sand">Subtotal</span>
            <span className="text-aura-cream">{formatETB(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-aura-sand">Shipping</span>
            <span className="text-aura-cream">{order.shippingCost === 0 ? 'Free' : formatETB(order.shippingCost)}</span>
          </div>
          <div className="border-t border-aura-umber pt-2 flex justify-between items-baseline">
            <span className="text-aura-cream font-medium">Total</span>
            <span className="text-xl font-bold text-aura-cream">{formatETB(order.total)}</span>
          </div>
        </div>

        {/* Payment info */}
        <div className="border-t border-aura-umber pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-aura-sand">Payment Method</span>
            <span className="text-aura-cream">{order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod : '—'}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-aura-sand">Payment Status</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[order.paymentStatus] || ''}`}>
              {order.paymentStatus}
            </span>
          </div>
          {order.paymentStatus === 'PENDING' && order.paymentMethod !== 'CASH_ON_DELIVERY' && (
            <p className="text-xs text-aura-sand bg-amber-900/20 rounded p-2">
              Your payment is being verified. You'll receive a notification once confirmed.
            </p>
          )}
        </div>

        {/* Shipping address */}
        {order.shippingAddress && (
          <div className="border-t border-aura-umber pt-4">
            <h2 className="text-sm font-semibold text-aura-cream mb-2">Shipping Address</h2>
            <div className="text-sm text-aura-sand space-y-0.5">
              <p className="text-aura-cream">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.address}</p>
              {order.shippingAddress.postalCode && <p>{order.shippingAddress.postalCode}</p>}
            </div>
          </div>
        )}

        {/* Status history */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="border-t border-aura-umber pt-4">
            <h2 className="text-sm font-semibold text-aura-cream mb-2">Order Updates</h2>
            <div className="space-y-2">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="text-sm flex justify-between">
                  <span className="text-aura-cream">{ORDER_STATUS_LABELS[h.status] || h.status}</span>
                  <span className="text-aura-sand text-xs">{new Date(h.createdAt).toLocaleDateString()}</span>
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
          className="flex-1 px-6 py-3 rounded-lg border border-aura-umber text-aura-cream text-sm font-medium hover:border-aura-sand flex items-center justify-center gap-2"
        >
          <ShoppingBagIcon className="w-5 h-5" /> Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
