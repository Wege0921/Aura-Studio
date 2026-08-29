import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Product, ProductVariant, formatETB, getVariantPrice } from './shopTypes';
import { useShopCart } from '../../contexts/ShopCartContext';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingBagIcon, HeartIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ProductDetailModalProps {
  slug: string;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ slug, onClose }) => {
  const { addItem } = useShopCart();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Product + cached via React Query (keyed by slug). Cards prefetch this on
  // hover, so the first open of a product shows immediately.
  const { data, isPending: loading, error } = useQuery<{ product: Product }>({
    queryKey: ['shop', 'product', slug],
    queryFn: () => api.get<{ product: Product }>(`/api/shop/products/${slug}`),
    staleTime: 60_000,
  });
  const product: Product | null = data?.product ?? null;
  const loadError = error?.message ?? '';

  // Reset variant/image/quantity when a different product is opened
  useEffect(() => {
    setSelectedImage(0);
    setSelectedVariant(null);
    setQuantity(1);
  }, [slug]);

  // Check wishlist status when product loads
  useEffect(() => {
    if (!user || !product) return;
    const checkWishlist = async () => {
      try {
        const data = await api.get<{ id: string; productId: string }[]>('/api/shop/wishlist');
        setInWishlist(data.some((w) => w.productId === product.id));
      } catch {
        // ignore
      }
    };
    checkWishlist();
  }, [user, product]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const toggleWishlist = async () => {
    if (!user || !product) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await api.delete(`/api/shop/wishlist/${product.id}`);
        setInWishlist(false);
      } else {
        await api.post(`/api/shop/wishlist/${product.id}`, {});
        setInWishlist(true);
      }
    } catch (err) {
      console.error('Wishlist toggle failed:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-overlay p-4" onClick={onClose}>
        <div className="bg-canvas rounded-2xl border border-edge p-8" onClick={(e) => e.stopPropagation()}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-edge mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-overlay p-4" onClick={onClose}>
        <div className="bg-canvas rounded-2xl border border-edge p-8 text-center" onClick={(e) => e.stopPropagation()}>
          {loadError ? (
            <>
              <p className="text-danger text-lg mb-2">Failed to load product</p>
              <p className="text-content-secondary text-sm mb-4">{loadError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-danger underline underline-offset-2 hover:no-underline"
              >
                Retry
              </button>
            </>
          ) : (
            <p className="text-content-secondary text-lg">Product not found.</p>
          )}
          <button onClick={onClose} className="mt-4 text-accent-400 hover:text-content-secondary block mx-auto">← Close</button>
        </div>
      </div>
    );
  }

  const hasVariants = product.variants && product.variants.length > 0;
  const variants = product.variants || [];
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean) as string[]));
  const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean) as string[]));
  const styles = Array.from(new Set(variants.map((v) => v.style).filter(Boolean) as string[]));

  // A variant option is unavailable when no variant carrying that value has stock.
  // Unavailable options are struck through and disabled rather than merely unclickable.
  const optionAvailable = (field: 'size' | 'color' | 'style', value: string): boolean =>
    variants.some((v) => v.stock > 0 && v[field] === value);

  const currentPrice = getVariantPrice(product, selectedVariant);
  const onSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice < product.basePrice;
  const images = product.images || [];

  const variantStock = selectedVariant ? selectedVariant.stock
    : hasVariants ? variants.reduce((sum, v) => sum + v.stock, 0)
    : (product.stock === null || product.stock === undefined ? Number.MAX_SAFE_INTEGER : product.stock);
  const stock = variantStock;
  const outOfStock = product.status === 'OUT_OF_STOCK' || stock <= 0;

  const handleAddToCart = () => {
    if (outOfStock) return;
    if (hasVariants && !selectedVariant) return;

    const cartStock = selectedVariant
      ? selectedVariant.stock
      : (product.stock === null || product.stock === undefined ? null : product.stock);

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantId: selectedVariant?.id || null,
      variantLabel: selectedVariant
        ? [selectedVariant.size, selectedVariant.color, selectedVariant.style].filter(Boolean).join(' / ')
        : null,
      price: currentPrice,
      image: images[0]?.url || null,
      stock: cartStock,
    }, quantity);

    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      onClose();
    }, 1200);
  };

  const selectVariant = (field: 'size' | 'color' | 'style', value: string) => {
    const candidates = variants.filter((v) => {
      if (field === 'size') return v.size === value;
      if (field === 'color') return v.color === value;
      return v.style === value;
    });
    const match = candidates.find((v) =>
      (!sizes.length || v.size === (field === 'size' ? value : selectedVariant?.size)) &&
      (!colors.length || v.color === (field === 'color' ? value : selectedVariant?.color)) &&
      (!styles.length || v.style === (field === 'style' ? value : selectedVariant?.style))
    ) || candidates[0];
    setSelectedVariant(match || null);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-overlay p-3 md:p-6 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-canvas rounded-2xl border border-edge max-w-4xl w-full my-auto max-h-[95vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-surface border border-edge text-content hover:bg-surface-raised hover:text-accent-400 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-6 p-4 md:p-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="aspect-square bg-surface-sunken rounded-xl border border-edge overflow-hidden">
              {images[selectedImage] ? (
                <img src={images[selectedImage].url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBagIcon className="w-16 h-16 text-content-secondary" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                      selectedImage === idx ? 'border-edge-focus' : 'border-edge'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              {product.category && (
                <p className="text-sm text-accent-400 mb-1">{product.category.name}</p>
              )}
              <h1 className="text-xl md:text-2xl font-serif text-content-emphasis">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-xl md:text-2xl font-bold text-content">{formatETB(currentPrice)}</span>
              {onSale && (
                <span className="text-base text-content-secondary line-through">{formatETB(product.basePrice)}</span>
              )}
            </div>

            {/* Stock indicator */}
            <div>
              {outOfStock ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-bg text-danger border border-danger-border">
                  Out of Stock
                </span>
              ) : stock <= 5 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-bg text-warning border border-warning-border">
                  Only {stock} left
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-bg text-success border border-success-border">
                  In Stock
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-content-secondary text-sm leading-relaxed">{product.description}</p>
            )}

            {/* Variant selectors */}
            {sizes.length > 0 && (
              <div>
                <label className="text-sm text-content-secondary mb-2 block">Size</label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const available = optionAvailable('size', s);
                    return (
                      <button
                        key={s}
                        onClick={() => selectVariant('size', s)}
                        disabled={!available}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          !available
                            ? 'border-edge text-content-disabled line-through cursor-not-allowed opacity-60'
                            : selectedVariant?.size === s
                            ? 'bg-accent-600 text-content-on-accent border-edge-focus'
                            : 'border-edge text-content hover:border-edge-strong'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {colors.length > 0 && (
              <div>
                <label className="text-sm text-content-secondary mb-2 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const available = optionAvailable('color', c);
                    return (
                      <button
                        key={c}
                        onClick={() => selectVariant('color', c)}
                        disabled={!available}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          !available
                            ? 'border-edge text-content-disabled line-through cursor-not-allowed opacity-60'
                            : selectedVariant?.color === c
                            ? 'bg-accent-600 text-content-on-accent border-edge-focus'
                            : 'border-edge text-content hover:border-edge-strong'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {styles.length > 0 && (
              <div>
                <label className="text-sm text-content-secondary mb-2 block">Style</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map((s) => {
                    const available = optionAvailable('style', s);
                    return (
                      <button
                        key={s}
                        onClick={() => selectVariant('style', s)}
                        disabled={!available}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          !available
                            ? 'border-edge text-content-disabled line-through cursor-not-allowed opacity-60'
                            : selectedVariant?.style === s
                            ? 'bg-accent-600 text-content-on-accent border-edge-focus'
                            : 'border-edge text-content hover:border-edge-strong'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-sm text-content-secondary mb-2 block">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-lg border border-edge text-content hover:border-edge-strong"
                >
                  −
                </button>
                <span className="text-content font-medium w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stock || 99, quantity + 1))}
                  className="w-9 h-9 rounded-lg border border-edge text-content hover:border-edge-strong"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock || (hasVariants && !selectedVariant)}
                className={`flex-1 px-5 py-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                  outOfStock || (hasVariants && !selectedVariant)
                    ? 'bg-surface-sunken text-content-muted cursor-not-allowed'
                    : 'bg-accent-600 text-content-on-accent hover:bg-accent-700'
                }`}
              >
                {addedToCart ? (
                  <>
                    <CheckIcon className="w-5 h-5" /> Added!
                  </>
                ) : outOfStock ? (
                  'Out of Stock'
                ) : hasVariants && !selectedVariant ? (
                  'Select a variant'
                ) : (
                  <>
                    <ShoppingBagIcon className="w-5 h-5" /> Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={toggleWishlist}
                disabled={!user || wishlistLoading}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  inWishlist
                    ? 'border-danger-border text-danger bg-danger-bg'
                    : 'border-edge text-content hover:border-edge-focus'
                } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={user ? (inWishlist ? 'Remove from wishlist' : 'Add to wishlist') : 'Log in to use wishlist'}
              >
                <HeartIcon className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            {hasVariants && !selectedVariant && (
              <p className="text-xs text-accent-400">Please select a size, color, or style to add to cart.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
