import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { useShopCart } from '../../contexts/ShopCartContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatETB, PAYMENT_METHOD_LABELS } from './shopTypes';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface CheckoutForm {
  shippingFullName: string;
  shippingPhone: string;
  shippingAddress: string;
  paymentMethod: 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CASH_ON_DELIVERY';
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useShopCart();
  const { user } = useAuth();
  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: {
      shippingFullName: user?.name || '',
      shippingPhone: '',
      paymentMethod: 'BANK_TRANSFER',
    },
  });
  const [step, setStep] = useState<1 | 2>(1);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const selectedPaymentMethod = watch('paymentMethod');
  const selectedName = watch('shippingFullName');
  const selectedPhone = watch('shippingPhone');
  const selectedAddress = watch('shippingAddress');
  const needsReceipt = selectedPaymentMethod !== 'CASH_ON_DELIVERY';

  const discount = appliedCoupon?.discount || 0;
  const orderTotal = subtotal - discount;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const data = await api.post<{ code: string; discount: number }>(
        '/api/shop/coupons/validate',
        { code: couponCode, subtotal }
      );
      setAppliedCoupon({ code: data.code, discount: data.discount });
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const goToStep2 = async () => {
    const valid = await trigger(['shippingFullName', 'shippingPhone', 'shippingAddress']);
    if (!valid) return;
    if (needsReceipt && !receiptFile) {
      setSubmitError('Please upload your payment receipt to continue.');
      return;
    }
    setSubmitError('');
    setStep(2);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-content-secondary text-lg mb-4">Your cart is empty.</p>
        <button onClick={() => navigate('/shop')} className="text-accent-400 hover:text-content-secondary">
          ← Go to Shop
        </button>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutForm) => {
    // If on Step 1, move to Step 2 instead of submitting the order
    if (step === 1) {
      setStep(2);
      return;
    }
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
      formData.append('shippingPhone', '+251' + data.shippingPhone.replace(/^\+251\s?/, '').replace(/^0/, ''));
      formData.append('shippingAddress', data.shippingAddress);
      if (appliedCoupon) formData.append('couponCode', appliedCoupon.code);

      // Generate an idempotency key for this checkout attempt so a double-
      // click or network retry doesn't create a duplicate order. The key is
      // stable for the lifetime of this submit attempt (regenerated on each
      // call to onSubmit).
      const idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      if (receiptFile && data.paymentMethod !== 'CASH_ON_DELIVERY') {
        formData.append('receipt', receiptFile);
      }

      const response = await api.postForm<{ message: string; order: { id: string }; guestToken?: string }>(
        '/api/shop/orders',
        formData,
        { 'Idempotency-Key': idempotencyKey }
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
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-sm text-content-secondary hover:text-accent-400">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Cart
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-serif text-content-emphasis">Checkout</h1>
        {/* Step indicator — state is conveyed by numeral + aria-current, not colour alone */}
        <div className="flex items-center gap-2 text-sm" aria-label="Checkout progress">
          <span className={`flex items-center gap-1.5 ${step === 1 ? 'text-content' : 'text-content-secondary'}`}>
            <span
              aria-current={step === 1 ? 'step' : undefined}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                step === 2
                  ? 'bg-accent-600 text-content-on-accent border-accent-600'
                  : 'bg-accent-100 text-accent-900 border-accent-600'
              }`}
            >1</span>
            Details
          </span>
          <span className="w-8 h-px bg-edge-subtle" />
          <span className={`flex items-center gap-1.5 ${step === 2 ? 'text-content' : 'text-content-secondary'}`}>
            <span
              aria-current={step === 2 ? 'step' : undefined}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                step === 2 ? 'bg-accent-600 text-content-on-accent border-accent-600' : 'border-edge bg-surface text-content-secondary'
              }`}
            >2</span>
            Review
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* STEP 1: Shipping + Payment */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Shipping address */}
            <div className="bg-surface rounded-xl border border-edge p-4 space-y-3">
              <h2 className="text-base font-serif text-content-emphasis">Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-content-secondary mb-0.5 block">Full Name *</label>
                  <input
                    {...register('shippingFullName', { required: 'Required' })}
                    className="w-full px-3 py-1.5 bg-canvas border border-edge rounded-lg text-sm text-content focus:outline-none focus:border-edge-focus"
                  />
                  {errors.shippingFullName && <p className="text-xs text-danger mt-0.5">{errors.shippingFullName.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-content-secondary mb-0.5 block">Phone *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-1.5 bg-surface-sunken border border-edge border-r-0 rounded-l-lg text-content-secondary text-sm whitespace-nowrap">+251</span>
                    <input
                      {...register('shippingPhone', { required: 'Required', pattern: { value: /^9\d{8}$/, message: '9XXXXXXXX' } })}
                      placeholder="9XXXXXXXX"
                      className="flex-1 px-3 py-1.5 bg-canvas border border-edge rounded-r-lg text-sm text-content focus:outline-none focus:border-edge-focus"
                    />
                  </div>
                  {errors.shippingPhone && <p className="text-xs text-danger mt-0.5">{errors.shippingPhone.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-content-secondary mb-0.5 block">Address *</label>
                  <input
                    {...register('shippingAddress', { required: 'Required' })}
                    placeholder="Street, building, apartment..."
                    className="w-full px-3 py-1.5 bg-canvas border border-edge rounded-lg text-sm text-content focus:outline-none focus:border-edge-focus"
                  />
                  {errors.shippingAddress && <p className="text-xs text-danger mt-0.5">{errors.shippingAddress.message}</p>}
                </div>
              </div>
            </div>

            {/* Payment method */}
            <fieldset className="bg-surface rounded-xl border border-edge p-4 space-y-3">
              <legend className="text-base font-serif text-content-emphasis">Payment Method</legend>
              <div className="space-y-2">
                {(Object.keys(PAYMENT_METHOD_LABELS) as Array<keyof typeof PAYMENT_METHOD_LABELS>).map((method) => (
                  <label
                    key={method}
                    className="flex items-center gap-3 p-2 border border-edge rounded-lg cursor-pointer hover:border-edge-strong"
                  >
                    <input
                      type="radio"
                      value={method}
                      {...register('paymentMethod')}
                    />
                    <span className="text-sm font-medium text-content">{PAYMENT_METHOD_LABELS[method]}</span>
                    {method === 'CASH_ON_DELIVERY' && (
                      <span className="text-xs text-content-secondary hidden sm:inline">— Pay with cash on arrival</span>
                    )}
                    {method === 'BANK_TRANSFER' && (
                      <span className="text-xs text-content-secondary hidden sm:inline">— Upload your receipt</span>
                    )}
                    {method === 'MOBILE_MONEY' && (
                      <span className="text-xs text-content-secondary hidden sm:inline">— Upload transaction screenshot</span>
                    )}
                  </label>
                ))}
              </div>

              {/* Receipt upload */}
              <div>
                <label className="text-xs text-content-secondary mb-0.5 block">
                  Payment Receipt {needsReceipt ? '*' : '(not required for Cash on Delivery)'}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-content file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-accent-600 file:text-content-on-accent file:font-medium file:cursor-pointer"
                />
                {needsReceipt && receiptFile && (
                  <p className="text-xs text-success mt-0.5">
                    Selected: {receiptFile.name}
                  </p>
                )}
              </div>
            </fieldset>

            {submitError && (
              <p className="text-sm text-danger bg-danger-bg rounded-lg p-2">{submitError}</p>
            )}

            <button
              type="button"
              onClick={goToStep2}
              className="w-full px-6 py-2.5 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700 transition-colors flex items-center justify-center gap-2"
            >
              Next: Review Order <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Order Summary + Place Order */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Review shipping + payment */}
            <div className="bg-surface rounded-xl border border-edge p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-serif text-content-emphasis">Shipping Details</h2>
                <button type="button" onClick={() => setStep(1)} className="text-sm text-accent-400 hover:text-content-secondary">Edit</button>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-content font-medium">{selectedName}</p>
                <p className="text-content-secondary">+251{selectedPhone.replace(/^\+251\s?/, '').replace(/^0/, '')}</p>
                <p className="text-content-secondary">{selectedAddress}</p>
                <p className="pt-2 text-content">{PAYMENT_METHOD_LABELS[selectedPaymentMethod]}</p>
                {receiptFile && <p className="text-xs text-success">Receipt: {receiptFile.name}</p>}
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-surface-sunken rounded-xl border border-edge p-4 space-y-3">
              <h2 className="text-base font-serif text-content-emphasis">Order Summary</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                    <span className="text-content-secondary">
                      {item.name} × {item.quantity}
                      {item.variantLabel && <span className="block text-xs text-content-secondary">{item.variantLabel}</span>}
                    </span>
                    <span className="text-content">{formatETB(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-edge pt-2 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-content-secondary">Subtotal</span>
                  <span className="text-content">{formatETB(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>−{formatETB(discount)}</span>
                  </div>
                )}
                <div className="border-t border-edge pt-1.5 flex justify-between items-baseline">
                  <span className="text-content font-medium">Total</span>
                  <span className="text-lg font-bold text-content">{formatETB(orderTotal)}</span>
                </div>
              </div>

              {/* Coupon input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 px-3 py-1.5 bg-canvas border border-edge rounded-lg text-content text-sm focus:outline-none focus:border-edge-focus"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2 rounded-lg bg-surface border border-edge text-content text-sm hover:border-edge-focus disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-xs text-danger mt-1">{couponError}</p>}
              {appliedCoupon && <p className="text-xs text-success mt-1">Coupon applied: {formatETB(discount)} off</p>}
            </div>

            {submitError && (
              <p className="text-sm text-danger bg-danger-bg rounded-lg p-3">{submitError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 rounded-lg border border-edge text-content text-sm font-medium hover:border-edge-strong transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  submitting
                    ? 'bg-surface-sunken text-content-muted cursor-wait'
                    : 'bg-accent-600 text-content-on-accent hover:bg-accent-700'
                }`}
              >
                {submitting ? 'Placing order...' : 'Place Order'}
              </button>
            </div>

            {!user && (
              <p className="text-xs text-content-secondary text-center">
                You can check out as a guest. Your order link will be saved for tracking.
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default CheckoutPage;
