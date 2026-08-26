import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Product, ProductCategory } from './shopTypes';
import ProductCard from './ProductCard';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const ShopCategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    api.get<ProductCategory[]>('/api/shop/categories').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category && category !== 'all') params.set('category', category);
        if (search) params.set('search', search);
        if (selectedSize) params.set('size', selectedSize);
        if (selectedColor) params.set('color', selectedColor);
        if (maxPrice) params.set('maxPrice', maxPrice);
        params.set('sort', sortBy);
        params.set('limit', '48');

        const data = await api.get<{ products: Product[] }>(`/api/shop/products?${params.toString()}`);
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [category, search, sortBy, selectedSize, selectedColor, maxPrice]);

  const currentCategory = categories.find((c) => c.slug === category);

  // Collect available sizes and colors from products (avoid flatMap — not in es5 lib target)
  const availableSizes: string[] = [];
  const availableColors: string[] = [];
  for (const p of products) {
    if (p.variants) {
      for (const v of p.variants) {
        if (v.size && availableSizes.indexOf(v.size) === -1) availableSizes.push(v.size);
        if (v.color && availableColors.indexOf(v.color) === -1) availableColors.push(v.color);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-aura-sand/60 mb-2">
          <button onClick={() => navigate('/shop')} className="hover:text-aura-clay">Shop</button>
          <span>/</span>
          <span className="text-aura-cream">{currentCategory?.name || 'All Products'}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-serif text-aura-ivory">
          {currentCategory?.name || 'All Products'}
        </h1>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aura-sand/50" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-aura-ink border border-aura-umber rounded-lg text-aura-cream placeholder-aura-sand/40 focus:outline-none focus:border-aura-clay"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 bg-aura-ink border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name: A to Z</option>
        </select>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2.5 bg-aura-ink border border-aura-umber rounded-lg text-aura-cream hover:border-aura-clay flex items-center gap-2"
        >
          <FunnelIcon className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-aura-ink border border-aura-umber rounded-lg p-4 space-y-4">
          {availableSizes.length > 0 && (
            <div>
              <label className="text-sm text-aura-sand mb-2 block">Size</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSize('')}
                  className={`px-3 py-1 rounded text-sm border ${!selectedSize ? 'bg-aura-clay text-aura-ink border-aura-clay' : 'border-aura-umber text-aura-cream'}`}
                >
                  All
                </button>
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1 rounded text-sm border ${selectedSize === s ? 'bg-aura-clay text-aura-ink border-aura-clay' : 'border-aura-umber text-aura-cream'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {availableColors.length > 0 && (
            <div>
              <label className="text-sm text-aura-sand mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedColor('')}
                  className={`px-3 py-1 rounded text-sm border ${!selectedColor ? 'bg-aura-clay text-aura-ink border-aura-clay' : 'border-aura-umber text-aura-cream'}`}
                >
                  All
                </button>
                {availableColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1 rounded text-sm border ${selectedColor === c ? 'bg-aura-clay text-aura-ink border-aura-clay' : 'border-aura-umber text-aura-cream'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-sm text-aura-sand mb-2 block">Max Price (ETB)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="No limit"
              className="w-full sm:w-48 px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
            />
          </div>
          {(selectedSize || selectedColor || maxPrice) && (
            <button
              onClick={() => { setSelectedSize(''); setSelectedColor(''); setMaxPrice(''); }}
              className="text-sm text-aura-clay hover:text-aura-sand"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aura-umber"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-aura-sand text-lg">No products found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopCategoryPage;
