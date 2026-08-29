import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { Product, formatETB, getEffectivePrice, getFirstImage } from './shopTypes';
import { useShopCart } from '../../contexts/ShopCartContext';
import { api } from '../../lib/api';

interface ProductCardProps {
  product: Product;
  onOpen?: (slug: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onOpen }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addItem } = useShopCart();

  const price = getEffectivePrice(product);
  const onSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice < product.basePrice;
  const image = getFirstImage(product);
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
  const simpleStock = product.stock;
  const outOfStock = product.status === 'OUT_OF_STOCK' ||
    (product.variants && product.variants.length > 0 && totalStock === 0) ||
    (!product.variants?.length && simpleStock !== null && simpleStock !== undefined && simpleStock <= 0);

  const handleClick = () => {
    if (onOpen) onOpen(product.slug);
    else navigate(`/shop/product/${product.slug}`);
  };

  // Prefetch the detail modal chunk + product data on hover/focus so the
  // first open of a product is instant instead of loading on click.
  const prefetchDetail = () => {
    if (!onOpen) return;
    import('./ProductDetailModal').catch(() => {});
    queryClient.prefetchQuery({
      queryKey: ['shop', 'product', product.slug],
      queryFn: () => api.get<{ product: Product }>(`/api/shop/products/${product.slug}`),
      staleTime: 60_000,
    });
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    // If product has variants, open detail for selection
    if (product.variants && product.variants.length > 0) {
      handleClick();
      return;
    }
    // No variants — add directly
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantId: null,
      variantLabel: null,
      price,
      image,
      stock: simpleStock ?? null,
    });
  };

  return (
    <div
      className="bg-surface rounded-xl shadow-elev-1 border border-edge overflow-hidden hover:shadow-elev-2 transition-shadow duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-edge-focus"
      onClick={handleClick}
      onPointerEnter={prefetchDetail}
      onFocus={prefetchDetail}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={`View ${product.name}`}
    >
      {/* Image */}
      <div className="aspect-square bg-surface-sunken overflow-hidden relative">
        {image ? (
          <>
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="w-full h-full flex items-center justify-center absolute inset-0" style={{display:'none'}}>
            <ShoppingBagIcon className="w-12 h-12 text-content-secondary" />
          </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBagIcon className="w-12 h-12 text-content-secondary" />
          </div>
        )}
        {onSale && (
          <span className="absolute top-2 left-2 bg-success-bg text-success border border-success-border text-xs font-semibold px-2 py-1 rounded">
            On Sale
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-2 right-2 bg-danger-bg text-danger border border-danger-border text-xs font-medium px-2 py-1 rounded">
            Out of Stock
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-content mb-1 line-clamp-2">{product.name}</h3>
        {product.category && (
          <p className="text-xs text-content-secondary mb-2">{product.category.name}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-content">{formatETB(price)}</span>
            {onSale && (
              <span className="text-sm text-content-secondary line-through">{formatETB(product.basePrice)}</span>
            )}
          </div>
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={outOfStock}
          className={`w-full mt-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            outOfStock
              ? 'bg-surface-sunken text-content-muted cursor-not-allowed'
              : 'bg-accent-600 text-content-on-accent hover:bg-accent-700'
          }`}
        >
          {outOfStock ? 'Out of Stock' : product.variants && product.variants.length > 0 ? 'View Options' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);
