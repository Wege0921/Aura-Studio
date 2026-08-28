import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { Product, formatETB, getEffectivePrice, getFirstImage } from './shopTypes';
import { useShopCart } from '../../contexts/ShopCartContext';

interface ProductCardProps {
  product: Product;
  onOpen?: (slug: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onOpen }) => {
  const navigate = useNavigate();
  const { addItem } = useShopCart();

  const price = getEffectivePrice(product);
  const onSale = product.salePrice !== null && product.salePrice !== undefined && product.salePrice < product.basePrice;
  const image = getFirstImage(product);
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
  const outOfStock = product.status === 'OUT_OF_STOCK' || (product.variants && product.variants.length > 0 && totalStock === 0);

  const handleClick = () => {
    if (onOpen) onOpen(product.slug);
    else navigate(`/shop/product/${product.slug}`);
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
      stock: null,
    });
  };

  return (
    <div
      className="bg-aura-ink rounded-xl shadow-lg shadow-black/20 border border-aura-umber overflow-hidden hover:shadow-xl transition-shadow duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="aspect-square bg-aura-bark overflow-hidden relative">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBagIcon className="w-12 h-12 text-aura-umber" />
          </div>
        )}
        {onSale && (
          <span className="absolute top-2 left-2 bg-aura-clay text-aura-ink text-xs font-bold px-2 py-1 rounded">
            SALE
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-2 right-2 bg-red-900/60 text-red-200 text-xs font-medium px-2 py-1 rounded">
            Out of Stock
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-aura-cream mb-1 line-clamp-2">{product.name}</h3>
        {product.category && (
          <p className="text-xs text-aura-sand mb-2">{product.category.name}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-aura-cream">{formatETB(price)}</span>
            {onSale && (
              <span className="text-sm text-aura-sand line-through">{formatETB(product.basePrice)}</span>
            )}
          </div>
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={outOfStock}
          className={`w-full mt-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            outOfStock
              ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {outOfStock ? 'Out of Stock' : product.variants && product.variants.length > 0 ? 'View Options' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
