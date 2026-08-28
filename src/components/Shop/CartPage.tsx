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
        <ShoppingBagIcon className="w-16 h-16 text-aura-umber mx-auto mb-4" />
        <h1 className="text-xl font-serif text-aura-ivory mb-2">Your cart is empty</h1>
        <p className="text-aura-sand mb-6">Browse the shop and add some items.</p>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif text-aura-ivory">Shopping Cart ({totalItems})</h1>
        <button
          onClick={clearCart}
          className="text-sm text-aura-sand/60 hover:text-red-400"
        >
          Clear cart
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId}`}
            className="flex gap-4 bg-aura-ink rounded-xl border border-aura-umber p-4"
          >
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-aura-bark flex-shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBagIcon className="w-8 h-8 text-aura-umber" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-aura-cream">{item.name}</h3>
                  {item.variantLabel && (
                    <p className="text-xs text-aura-sand mt-0.5">{item.variantLabel}</p>
                  )}
                  <p className="text-sm text-aura-cream mt-1">{formatETB(item.price)}</p>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="icon-btn text-red-400 hover:text-red-300 transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                    className="w-8 h-8 rounded border border-aura-umber text-aura-cream hover:border-aura-sand"
                  >
                    −
                  </button>
                  <span className="text-aura-cream w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                    className="w-8 h-8 rounded border border-aura-umber text-aura-cream hover:border-aura-sand"
                  >
                    +
                  </button>
                </div>
                <span className="text-lg font-bold text-aura-cream">
                  {formatETB(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-aura-ink rounded-xl border border-aura-umber p-6 space-y-3">
        <div className="flex justify-between text-aura-sand">
          <span>Subtotal</span>
          <span className="text-aura-cream font-medium">{formatETB(subtotal)}</span>
        </div>
        <div className="flex justify-between text-aura-sand">
          <span>Shipping</span>
          <span className="text-aura-cream">Calculated at checkout</span>
        </div>
        <div className="border-t border-aura-umber pt-3 flex justify-between items-baseline">
          <span className="text-aura-cream font-medium">Total</span>
          <span className="text-2xl font-bold text-aura-cream">{formatETB(subtotal)}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full px-6 py-3 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Proceed to Checkout
        </button>
        <button
          onClick={() => navigate('/shop')}
          className="w-full text-center text-sm text-aura-clay hover:text-aura-sand"
        >
          ← Continue shopping
        </button>
      </div>
    </div>
  );
};

export default CartPage;
