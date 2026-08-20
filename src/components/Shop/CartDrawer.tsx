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
          <div className="fixed inset-0 bg-black/60" />
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
            <Dialog.Panel className="h-full bg-aura-ink border-l border-aura-umber flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-aura-umber">
                <Dialog.Title className="text-lg font-serif text-aura-ivory flex items-center gap-2">
                  <ShoppingBagIcon className="w-5 h-5" />
                  Cart ({totalItems})
                </Dialog.Title>
                <button
                  onClick={closeCart}
                  className="p-1.5 text-aura-cream hover:text-aura-ivory hover:bg-aura-sand/10 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBagIcon className="w-12 h-12 text-aura-umber mx-auto mb-3" />
                    <p className="text-aura-sand">Your cart is empty</p>
                    <button
                      onClick={() => { closeCart(); navigate('/shop'); }}
                      className="mt-4 text-aura-clay hover:text-aura-sand text-sm"
                    >
                      Browse products →
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 bg-aura-bark rounded-lg p-3 border border-aura-umber/50">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-aura-ink flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBagIcon className="w-6 h-6 text-aura-umber" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-aura-cream truncate">{item.name}</p>
                        {item.variantLabel && (
                          <p className="text-xs text-aura-sand/70">{item.variantLabel}</p>
                        )}
                        <p className="text-sm text-aura-cream mt-1">{formatETB(item.price)}</p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              className="w-7 h-7 rounded border border-aura-umber text-aura-cream text-sm hover:border-aura-sand"
                            >
                              −
                            </button>
                            <span className="text-aura-cream text-sm w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              className="w-7 h-7 rounded border border-aura-umber text-aura-cream text-sm hover:border-aura-sand"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="text-aura-sand/60 hover:text-red-400"
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
                <div className="border-t border-aura-umber p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-aura-sand">Subtotal</span>
                    <span className="text-lg font-bold text-aura-cream">{formatETB(subtotal)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleViewCart}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-aura-umber text-aura-cream text-sm font-medium hover:border-aura-sand"
                    >
                      View Cart
                    </button>
                    <button
                      onClick={handleCheckout}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
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
