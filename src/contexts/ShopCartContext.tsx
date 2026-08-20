import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  variantId: string | null;
  variantLabel: string | null;
  price: number; // unit price (including variant delta)
  quantity: number;
  image: string | null;
  stock: number | null; // variant stock or null
}

interface ShopCartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const ShopCartContext = createContext<ShopCartContextType | undefined>(undefined);

const STORAGE_KEY = 'aura-shop-cart';

export const useShopCart = () => {
  const context = useContext(ShopCartContext);
  if (context === undefined) {
    throw new Error('useShopCart must be used within a ShopCartProvider');
  }
  return context;
};

export const ShopCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  const addItem: ShopCartContextType['addItem'] = (item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );
      if (existing) {
        const newQty = existing.quantity + quantity;
        // Cap at stock if known
        const cappedQty = item.stock !== null ? Math.min(newQty, item.stock) : newQty;
        return prev.map((i) =>
          i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: cappedQty }
            : i
        );
      }
      const cappedQty = item.stock !== null ? Math.min(quantity, item.stock) : quantity;
      return [...prev, { ...item, quantity: cappedQty }];
    });
    setIsCartOpen(true);
  };

  const removeItem: ShopCartContextType['removeItem'] = (productId, variantId) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)));
  };

  const updateQuantity: ShopCartContextType['updateQuantity'] = (productId, variantId, quantity) => {
    if (quantity < 1) {
      removeItem(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId && i.variantId === variantId) {
          const cappedQty = i.stock !== null ? Math.min(quantity, i.stock) : quantity;
          return { ...i, quantity: cappedQty };
        }
        return i;
      })
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const value: ShopCartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    isCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
  };

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>;
};
