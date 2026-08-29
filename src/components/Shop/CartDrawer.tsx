import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ShoppingBagIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useShopCart } from '../../contexts/ShopCartContext';
import { formatETB } from './shopTypes';

const CartDrawer: React.FC = () => {
  const { items, isCartOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems } = useShopCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    closeCart();
    navigate('/cart');
  };

  return (
    <Transition appear show={isCartOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={closeCart}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-overlay" />
        </Transition.Child>

        <div className="fixed inset-y-0 right-0 w-full max-w-md">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="h-full bg-surface-raised border-l border-edge flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-edge">
                <Dialog.Title className="text-lg font-serif text-content-emphasis flex items-center gap-2">
                  <ShoppingBagIcon className="w-5 h-5" />
                  Cart ({totalItems})
                </Dialog.Title>
                <button
                  onClick={closeCart}
                  className="p-1.5 text-content hover:text-content-emphasis hover:bg-[var(--state-hover)] rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBagIcon className="w-12 h-12 text-content-secondary mx-auto mb-3" />
                    <p className="text-content-secondary">Your cart is empty</p>
                    <button
                      onClick={() => { closeCart(); navigate('/shop'); }}
                      className="mt-4 text-accent-400 hover:text-content-secondary text-sm"
                    >
                      Browse products →
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 bg-canvas rounded-lg p-3 border border-edge-subtle">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBagIcon className="w-6 h-6 text-content-secondary" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-content truncate">{item.name}</p>
                        {item.variantLabel && (
                          <p className="text-xs text-content-secondary">{item.variantLabel}</p>
                        )}
                        <p className="text-sm text-content mt-1">{formatETB(item.price)}</p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              className="w-7 h-7 rounded border border-edge text-content text-sm hover:border-edge-strong"
                            >
                              −
                            </button>
                            <span className="text-content text-sm w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              className="w-7 h-7 rounded border border-edge text-content text-sm hover:border-edge-strong"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            aria-label={`Remove ${item.name} from cart`}
                            className="icon-btn text-content-muted hover:text-danger transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-edge p-4 space-y-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-content-secondary">Subtotal</span>
                    <span className="text-lg font-bold text-content">{formatETB(subtotal)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleViewCart}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-edge text-content text-sm font-medium hover:border-edge-strong"
                    >
                      View Cart
                    </button>
                    <button
                      onClick={handleCheckout}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700"
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CartDrawer;
