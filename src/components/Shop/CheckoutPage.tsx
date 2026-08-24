import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { useShopCart } from '../../contexts/ShopCartContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatETB, PAYMENT_METHOD_LABELS } from './shopTypes';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface CheckoutForm {
  shippingFullName: string;
  shippingPhone: string;
  shippingRegion: string;
  shippingCity: string;
  shippingAddress: string;
  shippingPostalCode?: string;
  shippingNotes?: string;
  notes?: string;
  paymentMethod: 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CASH_ON_DELIVERY';
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useShopCart();
  const { user } = useAuth();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: {
      shippingFullName: user?.name || '',
      paymentMethod: 'BANK_TRANSFER',
    },
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const selectedPaymentMethod = watch('paymentMethod');
  const needsReceipt = selectedPaymentMethod !== 'CASH_ON_DELIVERY';

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-aura-sand text-lg mb-4">Your cart is empty.</p>
        <button onClick={() => navigate('/shop')} className="text-aura-clay hover:text-aura-sand">
          ← Go to Shop
        </button>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutForm) => {
    setSubmitting(true);
    setSubmitError('');

    // Client-side guard: server also enforces this, but fail fast for UX.
    if (data.paymentMethod !== 'CASH_ON_DELIVERY' && !receiptFile) {
      setSubmitError('Please upload your payment receipt to continue.');
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('items', JSON.stringify(items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }))));
      formData.append('paymentMethod', data.paymentMethod);
      formData.append('shippingFullName', data.shippingFullName);
      formData.append('shippingPhone', data.shippingPhone);
      formData.append('shippingRegion', data.shippingRegion);
      formData.append('shippingCity', data.shippingCity);
      formData.append('shippingAddress', data.shippingAddress);
      if (data.shippingPostalCode) formData.append('shippingPostalCode', data.shippingPostalCode);
      if (data.shippingNotes) formData.append('shippingNotes', data.shippingNotes);
      if (data.notes) formData.append('notes', data.notes);

      // Generate guest token if not logged in
      // NOTE: the server now mints a fresh per-order guest token and ignores
      // any client-supplied value, so we do not send one. The returned token
      // is appended to the order-confirmation URL below.
      if (!user) {
        // no-op — server returns guestToken in the response
      }

      if (receiptFile && data.paymentMethod !== 'CASH_ON_DELIVERY') {
        formData.append('receipt', receiptFile);
      }

      const response = await api.postForm<{ message: string; order: { id: string }; guestToken?: string }>(
        '/api/shop/orders',
        formData
      );

      clearCart();
      const guestToken = response.guestToken;
      navigate(`/shop/orders/${response.order.id}${!user && guestToken ? `?guestToken=${guestToken}` : ''}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-sm text-aura-sand hover:text-aura-clay">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Cart
      </button>

      <h1 className="text-2xl font-serif text-aura-ivory">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-6">
        {/* Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping address */}
          <div className="bg-aura-ink rounded-xl border border-aura-umber p-6 space-y-4">
            <h2 className="text-lg font-serif text-aura-ivory">Shipping Address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Full Name *</label>
                <input
                  {...register('shippingFullName', { required: 'Required' })}
                  className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
                />
                {errors.shippingFullName && <p className="text-xs text-red-400 mt-1">{errors.shippingFullName.message}</p>}
              </div>
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Phone *</label>
                <input
                  {...register('shippingPhone', { required: 'Required' })}
                  className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
                />
                {errors.shippingPhone && <p className="text-xs text-red-400 mt-1">{errors.shippingPhone.message}</p>}
              </div>
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Region *</label>
                <input
                  {...register('shippingRegion', { required: 'Required' })}
                  className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
                />
                {errors.shippingRegion && <p className="text-xs text-red-400 mt-1">{errors.shippingRegion.message}</p>}
              </div>
              <div>
                <label className="text-sm text-aura-sand mb-1 block">City *</label>
                <input
                  {...register('shippingCity', { required: 'Required' })}
                  className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
                />
                {errors.shippingCity && <p className="text-xs text-red-400 mt-1">{errors.shippingCity.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-aura-sand mb-1 block">Address *</label>
                <input
                  {...register('shippingAddress', { required: 'Required' })}
                  placeholder="Street, building, apartment..."
                  className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
                />
                {errors.shippingAddress && <p className="text-xs text-red-400 mt-1">{errors.shippingAddress.message}</p>}
              </div>
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Postal Code</label>
                <input
                  {...register('shippingPostalCode')}
                  className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
                />
              </div>
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Delivery Notes</label>
                <input
                  {...register('shippingNotes')}
                  placeholder="Landmark, delivery time..."
                  className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
                />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-aura-ink rounded-xl border border-aura-umber p-6 space-y-4">
            <h2 className="text-lg font-serif text-aura-ivory">Payment Method</h2>
            <div className="space-y-2">
              {(Object.keys(PAYMENT_METHOD_LABELS) as Array<keyof typeof PAYMENT_METHOD_LABELS>).map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-3 p-3 border border-aura-umber rounded-lg cursor-pointer hover:border-aura-sand"
                >
                  <input
                    type="radio"
                    value={method}
                    {...register('paymentMethod')}
                    className="accent-purple-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-aura-cream">{PAYMENT_METHOD_LABELS[method]}</span>
                    {method === 'CASH_ON_DELIVERY' && (
                      <p className="text-xs text-aura-sand/60">Pay with cash when your order arrives.</p>
                    )}
                    {method === 'BANK_TRANSFER' && (
                      <p className="text-xs text-aura-sand/60">Transfer to the studio's bank account and upload your receipt.</p>
                    )}
                    {method === 'MOBILE_MONEY' && (
                      <p className="text-xs text-aura-sand/60">Pay via mobile money and upload a screenshot of the transaction.</p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {/* Receipt upload */}
            <div>
              <label className="text-sm text-aura-sand mb-1 block">
                Payment Receipt {needsReceipt ? '*' : '(not required for Cash on Delivery)'}
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-aura-cream file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-aura-clay file:text-aura-ink file:font-medium file:cursor-pointer"
              />
              {needsReceipt && receiptFile && (
                <p className="text-xs text-green-400 mt-1">
                  Selected: {receiptFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Order notes */}
          <div className="bg-aura-ink rounded-xl border border-aura-umber p-6">
            <label className="text-sm text-aura-sand mb-1 block">Order Notes (optional)</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any special instructions for your order..."
              className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
            />
          </div>
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          <div className="bg-aura-ink rounded-xl border border-aura-umber p-6 space-y-3 sticky top-4">
            <h2 className="text-lg font-serif text-aura-ivory">Order Summary</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                  <span className="text-aura-sand">
                    {item.name} × {item.quantity}
                    {item.variantLabel && <span className="block text-xs text-aura-sand/60">{item.variantLabel}</span>}
                  </span>
                  <span className="text-aura-cream">{formatETB(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-aura-umber pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-aura-sand">Subtotal</span>
                <span className="text-aura-cream">{formatETB(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-aura-sand">Shipping</span>
                <span className="text-aura-cream">Free</span>
              </div>
              <div className="border-t border-aura-umber pt-2 flex justify-between items-baseline">
                <span className="text-aura-cream font-medium">Total</span>
                <span className="text-xl font-bold text-aura-cream">{formatETB(subtotal)}</span>
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-red-400 bg-red-900/20 rounded p-2">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                submitting
                  ? 'bg-gray-700 text-gray-400 cursor-wait'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {submitting ? 'Placing order...' : 'Place Order'}
            </button>

            {!user && (
              <p className="text-xs text-aura-sand/60 text-center">
                You can check out as a guest. Your order link will be saved for tracking.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
