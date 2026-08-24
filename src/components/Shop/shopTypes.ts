// Shared shop types for frontend

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface ProductVariant {
  id: string;
  productId: string;
  size?: string | null;
  color?: string | null;
  style?: string | null;
  sku?: string | null;
  priceDelta: number;
  stock: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  categoryId: string;
  basePrice: number;
  salePrice?: number | null;
  sku?: string;
  status: string;
  isFeatured: boolean;
  weightGrams?: number | null;
  stock?: number | null; // product-level stock for simple products; null = unlimited/untracked
  category?: { id: string; name: string; slug: string };
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ShopOrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  name: string;
  variantLabel?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  product?: { name: string; slug: string; images?: ProductImage[] };
}

export interface ShippingAddress {
  id: string;
  orderId: string;
  fullName: string;
  phone: string;
  region: string;
  city: string;
  address: string;
  postalCode?: string;
  notes?: string;
}

export interface ShopOrderStatusHistory {
  id: string;
  orderId: string;
  status: string;
  note?: string;
  changedBy?: string;
  createdAt: string;
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  userId?: string;
  guestToken?: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  paymentReceiptUrl?: string;
  paymentStatus: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: ShopOrderItem[];
  shippingAddress?: ShippingAddress;
  statusHistory?: ShopOrderStatusHistory[];
  user?: { id: string; name: string; email: string; phone?: string };
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-900/30 text-amber-300',
  CONFIRMED: 'bg-green-900/30 text-green-300',
  PROCESSING: 'bg-blue-900/30 text-blue-300',
  SHIPPED: 'bg-indigo-900/30 text-indigo-300',
  DELIVERED: 'bg-green-900/40 text-green-200',
  CANCELLED: 'bg-red-900/30 text-red-300',
  REFUNDED: 'bg-red-900/30 text-red-300',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-900/30 text-amber-300',
  VERIFIED: 'bg-green-900/30 text-green-300',
  REJECTED: 'bg-red-900/30 text-red-300',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_MONEY: 'Mobile Money',
  CASH_ON_DELIVERY: 'Cash on Delivery',
};

export function formatETB(amount: number): string {
  return `ETB ${amount.toLocaleString()}`;
}

export function getEffectivePrice(product: Pick<Product, 'basePrice' | 'salePrice'>): number {
  return product.salePrice ?? product.basePrice;
}

export function getVariantPrice(product: Pick<Product, 'basePrice' | 'salePrice'>, variant?: ProductVariant | null): number {
  const base = getEffectivePrice(product);
  return variant ? base + variant.priceDelta : base;
}

export function getFirstImage(product: Pick<Product, 'images'>): string | null {
  if (!product.images || product.images.length === 0) return null;
  return product.images[0].url;
}
