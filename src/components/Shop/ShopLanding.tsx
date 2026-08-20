import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ProductCategory, Product, formatETB, getEffectivePrice, getFirstImage } from './shopTypes';
import ProductCard from './ProductCard';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

const ShopLanding: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          api.get<ProductCategory[]>('/api/shop/categories'),
          api.get<{ products: Product[] }>('/api/shop/products?featured=true&limit=8'),
        ]);
        setCategories(cats);
        setFeatured(prods.products || []);
      } catch (err) {
        console.error('Error loading shop data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aura-umber"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-aura-ink to-aura-bark border border-aura-umber p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-serif text-aura-ivory mb-3">AURA Shop</h1>
          <p className="text-aura-sand text-base md:text-lg max-w-xl">
            Studio essentials curated by AURA — outfits, cups, bags, grip socks, and hair accessories.
          </p>
        </div>
      </div>

      {/* Categories */}
      <section>
        <h2 className="text-xl font-semibold text-aura-cream mb-4 font-serif">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/shop/${cat.slug}`)}
              className="bg-aura-ink rounded-xl border border-aura-umber overflow-hidden hover:border-aura-clay transition-colors duration-200 group text-left"
            >
              <div className="aspect-square bg-aura-bark overflow-hidden">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBagIcon className="w-10 h-10 text-aura-umber" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-aura-cream">{cat.name}</h3>
                {cat._count && cat._count.products > 0 && (
                  <p className="text-xs text-aura-sand/60 mt-0.5">{cat._count.products} items</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-aura-cream font-serif">Featured Products</h2>
            <button
              onClick={() => navigate('/shop/all')}
              className="text-sm text-aura-clay hover:text-aura-sand transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {categories.length === 0 && featured.length === 0 && (
        <div className="text-center py-20">
          <ShoppingBagIcon className="w-16 h-16 text-aura-umber mx-auto mb-4" />
          <p className="text-aura-sand text-lg">Products coming soon. Check back shortly!</p>
        </div>
      )}
    </div>
  );
};

export default ShopLanding;
