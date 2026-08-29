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
  trackingNumber?: string | null;
  carrier?: string | null;
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

/* Status styling resolves through semantic tokens (see src/styles/tokens.css),
   so badges adapt to every theme instead of being tuned for dark surfaces. */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-warning-bg text-warning border border-warning-border',
  CONFIRMED: 'bg-info-bg text-info border border-info-border',
  PROCESSING: 'bg-info-bg text-info border border-info-border',
  SHIPPED: 'bg-accent-100 text-accent-900 border border-accent-400',
  DELIVERED: 'bg-success-bg text-success border border-success-border',
  CANCELLED: 'bg-danger-bg text-danger border border-danger-border',
  REFUNDED: 'bg-danger-bg text-danger border border-danger-border',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-warning-bg text-warning border border-warning-border',
  VERIFIED: 'bg-success-bg text-success border border-success-border',
  REJECTED: 'bg-danger-bg text-danger border border-danger-border',
};

/* Status must never be conveyed by colour alone (WCAG 1.4.1). Each status
   carries a glyph that is rendered alongside the label in StatusBadge. */
export const ORDER_STATUS_GLYPHS: Record<string, string> = {
  PENDING: '○',
  CONFIRMED: '◉',
  PROCESSING: '◑',
  SHIPPED: '➤',
  DELIVERED: '✓',
  CANCELLED: '✕',
  REFUNDED: '↩',
};

export const PAYMENT_STATUS_GLYPHS: Record<string, string> = {
  PENDING: '○',
  VERIFIED: '✓',
  REJECTED: '✕',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_MONEY: 'Mobile Money',
  CASH_ON_DELIVERY: 'Cash on Delivery',
};

export function formatETB(amount: number | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'ETB —';
  return `ETB ${n.toLocaleString()}`;
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
