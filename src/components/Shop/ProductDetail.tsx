import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Product, ProductVariant, formatETB, getVariantPrice, getEffectivePrice } from './shopTypes';
import { useShopCart } from '../../contexts/ShopCartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSEO } from '../../hooks/useSEO';
import ProductCard from './ProductCard';
import { ShoppingBagIcon, HeartIcon, CheckIcon } from '@heroicons/react/24/outline';

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useShopCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await api.get<{ product: Product; related: Product[] }>(`/api/shop/products/${slug}`);
        setProduct(data.product);
        setRelated(data.related || []);
        setSelectedImage(0);
        setSelectedVariant(null);
        setQuantity(1);
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug]);

  // Check wishlist status when product loads (authenticated users only)
  useEffect(() => {
    if (!user || !product) return;
    const checkWishlist = async () => {
      try {
        const data = await api.get<{ id: string; productId: string }[]>('/api/shop/wishlist');
        setInWishlist(data.some((w) => w.productId === product.id));
      } catch {
        // ignore — wishlist is non-critical
      }
    };
    checkWishlist();
  }, [user, product]);

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

  // SEO: update title/meta when product loads
  useSEO({
    title: product ? `${product.name} — AURA Studio Shop` : 'AURA Studio Shop',
    description: product?.description
      ? `${product.description.slice(0, 160)}`
      : 'Shop premium yoga and wellness products at AURA Studio.',
    ogTitle: product ? `${product.name} — AURA Studio` : undefined,
    ogDescription: product?.description?.slice(0, 160),
    ogImage: product?.images?.[0]?.url,
    canonicalPath: product ? `/shop/products/${product.slug}` : undefined,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aura-umber"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-aura-sand text-lg">Product not found.</p>
        <button onClick={() => navigate('/shop')} className="mt-4 text-aura-clay hover:text-aura-sand">
          ← Back to Shop
        </button>
      </div>
    );
  }

  const hasVariants = product.variants && product.variants.length > 0;
  const variants = product.variants || [];
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean) as string[]));
  const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean) as string[]));
  const styles = Array.from(new Set(variants.map((v) => v.style).filter(Boolean) as string[]));

  const currentPrice = getVariantPrice(product, selectedVariant);
  const onSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice < product.basePrice;
  const images = product.images || [];

  // Stock resolution:
  // - If a variant is selected, use its stock.
  // - Else if the product has variants (but none selected yet), sum variant
  //   stock for the "X left" indicator (gating still requires a selection).
  // - Else (simple product), use product.stock. null = unlimited/untracked,
  //   represented as a large number so the UI shows "In Stock".
  const variantStock = selectedVariant ? selectedVariant.stock
    : hasVariants ? variants.reduce((sum, v) => sum + v.stock, 0)
    : (product.stock === null || product.stock === undefined ? Number.MAX_SAFE_INTEGER : product.stock);
  const stock = variantStock;
  const outOfStock = product.status === 'OUT_OF_STOCK' || stock <= 0;

  const handleAddToCart = () => {
    if (outOfStock) return;
    if (hasVariants && !selectedVariant) return;

    // For the cart context, stock is the per-line cap:
    // - variant items: variant.stock
    // - simple products with tracked stock: product.stock
    // - simple products with null/untracked stock: null (no cap)
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
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const selectVariant = (field: 'size' | 'color' | 'style', value: string) => {
    // Find matching variant
    const candidates = variants.filter((v) => {
      if (field === 'size') return v.size === value;
      if (field === 'color') return v.color === value;
      return v.style === value;
    });
    // Try to find one that also matches currently selected other fields
    const match = candidates.find((v) =>
      (!sizes.length || v.size === (field === 'size' ? value : selectedVariant?.size)) &&
      (!colors.length || v.color === (field === 'color' ? value : selectedVariant?.color)) &&
      (!styles.length || v.style === (field === 'style' ? value : selectedVariant?.style))
    ) || candidates[0];
    setSelectedVariant(match || null);
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-aura-sand">
        <button onClick={() => navigate('/shop')} className="hover:text-aura-clay">Shop</button>
        <span>/</span>
        {product.category && (
          <>
            <button onClick={() => navigate(`/shop?category=${product.category!.slug}`)} className="hover:text-aura-clay">
              {product.category!.name}
            </button>
            <span>/</span>
          </>
        )}
        <span className="text-aura-cream">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="aspect-square bg-aura-ink rounded-xl border border-aura-umber overflow-hidden">
            {images[selectedImage] ? (
              <img src={images[selectedImage].url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBagIcon className="w-16 h-16 text-aura-umber" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    selectedImage === idx ? 'border-aura-clay' : 'border-aura-umber'
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
              <p className="text-sm text-aura-sand mb-1">{product.category.name}</p>
            )}
            <h1 className="text-2xl md:text-3xl font-serif text-aura-ivory">{product.name}</h1>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-aura-cream">{formatETB(currentPrice)}</span>
            {onSale && (
              <span className="text-lg text-aura-sand line-through">{formatETB(product.basePrice)}</span>
            )}
          </div>

          {/* Stock indicator */}
          <div>
            {outOfStock ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-300">
                Out of Stock
              </span>
            ) : stock <= 5 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-300">
                Only {stock} left
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-300">
                In Stock
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-aura-sand text-sm leading-relaxed">{product.description}</p>
          )}

          {/* Variant selectors */}
          {sizes.length > 0 && (
            <div>
              <label className="text-sm text-aura-sand mb-2 block">Size</label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => selectVariant('size', s)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      selectedVariant?.size === s
                        ? 'bg-aura-clay text-aura-ink border-aura-clay'
                        : 'border-aura-umber text-aura-cream hover:border-aura-sand'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div>
              <label className="text-sm text-aura-sand mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => selectVariant('color', c)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      selectedVariant?.color === c
                        ? 'bg-aura-clay text-aura-ink border-aura-clay'
                        : 'border-aura-umber text-aura-cream hover:border-aura-sand'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {styles.length > 0 && (
            <div>
              <label className="text-sm text-aura-sand mb-2 block">Style</label>
              <div className="flex flex-wrap gap-2">
                {styles.map((s) => (
                  <button
                    key={s}
                    onClick={() => selectVariant('style', s)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      selectedVariant?.style === s
                        ? 'bg-aura-clay text-aura-ink border-aura-clay'
                        : 'border-aura-umber text-aura-cream hover:border-aura-sand'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="text-sm text-aura-sand mb-2 block">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-aura-umber text-aura-cream hover:border-aura-sand"
              >
                −
              </button>
              <span className="text-aura-cream font-medium w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(stock || 99, quantity + 1))}
                className="w-10 h-10 rounded-lg border border-aura-umber text-aura-cream hover:border-aura-sand"
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
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                outOfStock || (hasVariants && !selectedVariant)
                  ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
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
                  ? 'border-red-500 text-red-400 bg-red-900/20'
                  : 'border-aura-umber text-aura-cream hover:border-aura-clay'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={user ? (inWishlist ? 'Remove from wishlist' : 'Add to wishlist') : 'Log in to use wishlist'}
            >
              <HeartIcon className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>

          {hasVariants && !selectedVariant && (
            <p className="text-xs text-aura-sand">Please select a size, color, or style to add to cart.</p>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-aura-cream mb-4 font-serif">You might also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
