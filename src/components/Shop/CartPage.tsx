import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBagIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useShopCart } from '../../contexts/ShopCartContext';
import { formatETB } from './shopTypes';

const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, subtotal, totalItems, clearCart } = useShopCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBagIcon className="w-16 h-16 text-content-secondary mx-auto mb-4" />
        <h1 className="text-xl font-serif text-content-emphasis mb-2">Your cart is empty</h1>
        <p className="text-content-secondary mb-6">Browse the shop and add some items.</p>
        <button
          onClick={() => navigate('/shop')}
          className="px-6 py-2.5 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700"
        >
          Go to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif text-content-emphasis">Shopping Cart ({totalItems})</h1>
        <button
          onClick={clearCart}
          className="text-sm text-content-secondary hover:text-danger"
        >
          Clear cart
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="flex gap-4 bg-surface rounded-xl border border-edge p-4"
          >
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-sunken flex-shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBagIcon className="w-8 h-8 text-content-secondary" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-content">{item.name}</h3>
                  {item.variantLabel && (
                    <p className="text-xs text-content-secondary mt-0.5">{item.variantLabel}</p>
                  )}
                  <p className="text-sm text-content mt-1">{formatETB(item.price)}</p>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  aria-label={`Remove ${item.name} from cart`}
                  className="icon-btn text-content-muted hover:text-danger transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                    className="w-8 h-8 rounded border border-edge text-content hover:border-edge-strong"
                  >
                    −
                  </button>
                  <span className="text-content w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                    className="w-8 h-8 rounded border border-edge text-content hover:border-edge-strong"
                  >
                    +
                  </button>
                </div>
                <span className="text-lg font-bold text-content">
                  {formatETB(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-surface rounded-xl border border-edge p-6 space-y-3">
        <div className="flex justify-between text-content-secondary">
          <span>Subtotal</span>
          <span className="text-content font-medium">{formatETB(subtotal)}</span>
        </div>
        <div className="flex justify-between text-content-secondary">
          <span>Shipping</span>
          <span className="text-content">Calculated at checkout</span>
        </div>
        <div className="border-t border-edge pt-3 flex justify-between items-baseline">
          <span className="text-content font-medium">Total</span>
          <span className="text-2xl font-bold text-content">{formatETB(subtotal)}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full px-6 py-3 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700 transition-colors"
        >
          Proceed to Checkout
        </button>
        <button
          onClick={() => navigate('/shop')}
          className="w-full text-center text-sm text-accent-400 hover:text-content-secondary"
        >
          ← Continue shopping
        </button>
      </div>
    </div>
  );
};

export default CartPage;
