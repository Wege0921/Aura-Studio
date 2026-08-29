import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Product, ProductCategory } from './shopTypes';
import ProductCard from './ProductCard';
import { MagnifyingGlassIcon, FunnelIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

const ProductDetailModal = lazy(() => import('./ProductDetailModal'));

const ShopCategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [modalSlug, setModalSlug] = useState<string | null>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const categoriesQuery = useQuery<ProductCategory[]>({
    queryKey: ['shop', 'categories'],
    queryFn: () => api.get<ProductCategory[]>('/api/shop/categories'),
    staleTime: 5 * 60 * 1000,
  });
  const categories: ProductCategory[] = categoriesQuery.data ?? [];

  // Product list is cached per URL-string so revisiting a category/filter
  // combination (e.g. back from a product detail) is instant.
  const buildParams = () => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    if (selectedSize) params.set('size', selectedSize);
    if (selectedColor) params.set('color', selectedColor);
    if (maxPrice) params.set('maxPrice', maxPrice);
    params.set('sort', sortBy);
    params.set('limit', '48');
    return params.toString();
  };
  const [queryKey, setQueryKey] = useState(buildParams);

  // Debounce rapid filter/search typing before flipping the query key
  useEffect(() => {
    const timer = setTimeout(() => setQueryKey(buildParams()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, sortBy, selectedSize, selectedColor, maxPrice]);

  const productsResponse = useQuery<{ products: Product[] }>({
    queryKey: ['shop', 'products', queryKey],
    queryFn: () => api.get<{ products: Product[] }>(`/api/shop/products?${queryKey}`),
    staleTime: 30_000,
  });
  const products: Product[] = productsResponse.data?.products ?? [];
  const loading = productsResponse.isPending;
  const loadError = (productsResponse.error?.message ?? categoriesQuery.error?.message) || '';

  // Close filters on outside click or Escape
  useEffect(() => {
    if (!showFilters) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        filterPanelRef.current && !filterPanelRef.current.contains(target) &&
        filterButtonRef.current && !filterButtonRef.current.contains(target)
      ) {
        setShowFilters(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowFilters(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showFilters]);

  const currentCategory = categories.find((c: ProductCategory) => c.slug === category);

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
      {loadError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3">
          <span className="text-danger text-sm flex-1">{loadError}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-danger underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-content-secondary mb-2">
          <button onClick={() => navigate('/shop')} className="hover:text-accent-400">Shop</button>
          <span>/</span>
          <span className="text-content">{currentCategory?.name || 'All Products'}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-serif text-content-emphasis">
          {currentCategory?.name || 'All Products'}
        </h1>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-edge rounded-lg text-content placeholder-content-muted focus:outline-none focus:border-edge-focus"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name: A to Z</option>
        </select>
        <button
          ref={filterButtonRef}
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2.5 bg-surface border border-edge rounded-lg text-content hover:border-edge-focus flex items-center gap-2"
        >
          <FunnelIcon className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div ref={filterPanelRef} className="bg-surface border border-edge rounded-lg p-4 space-y-4">
          {availableSizes.length > 0 && (
            <div>
              <label className="text-sm text-content-secondary mb-2 block">Size</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSize('')}
                  className={`px-3 py-1 rounded text-sm border ${!selectedSize ? 'bg-accent-600 text-content-on-accent border-edge-focus' : 'border-edge text-content'}`}
                >
                  All
                </button>
                {availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1 rounded text-sm border ${selectedSize === s ? 'bg-accent-600 text-content-on-accent border-edge-focus' : 'border-edge text-content'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {availableColors.length > 0 && (
            <div>
              <label className="text-sm text-content-secondary mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedColor('')}
                  className={`px-3 py-1 rounded text-sm border ${!selectedColor ? 'bg-accent-600 text-content-on-accent border-edge-focus' : 'border-edge text-content'}`}
                >
                  All
                </button>
                {availableColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1 rounded text-sm border ${selectedColor === c ? 'bg-accent-600 text-content-on-accent border-edge-focus' : 'border-edge text-content'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-sm text-content-secondary mb-2 block">Max Price (ETB)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="No limit"
              className="w-full sm:w-48 px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus"
            />
          </div>
          {(selectedSize || selectedColor || maxPrice) && (
            <button
              onClick={() => { setSelectedSize(''); setSelectedColor(''); setMaxPrice(''); }}
              className="text-sm text-accent-400 hover:text-content-secondary"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-edge"></div>
        </div>
      ) : products.length === 0 ? (
        search || selectedSize || selectedColor || maxPrice ? (
          <div className="text-center py-16 space-y-3">
            <MagnifyingGlassIcon className="w-12 h-12 text-edge-strong mx-auto" />
            <h2 className="text-lg font-serif text-content-emphasis">
              No results{search ? ` for "${search}"` : ''}
            </h2>
            <p className="text-content-secondary text-sm max-w-md mx-auto">
              Try adjusting your search or clearing the active filters.
            </p>
            <button
              type="button"
              onClick={() => { setSearch(''); setSelectedSize(''); setSelectedColor(''); setMaxPrice(''); }}
              className="mt-2 px-5 py-2 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700 transition-colors"
            >
              Clear search & filters
            </button>
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <ShoppingBagIcon className="w-12 h-12 text-edge-strong mx-auto" />
            <h2 className="text-lg font-serif text-content-emphasis">No products yet</h2>
            <p className="text-content-secondary text-sm max-w-md mx-auto">
              Products in this category are on their way. Check back soon.
            </p>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="mt-2 px-5 py-2 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700 transition-colors"
            >
              Browse all products
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={setModalSlug} />
          ))}
        </div>
      )}

      {/* Product detail modal (in-place, no page navigation) */}
      {modalSlug && (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-edge" /></div>}>
          <ProductDetailModal slug={modalSlug} onClose={() => setModalSlug(null)} />
        </Suspense>
      )}
    </div>
  );
};

export default ShopCategoryPage;
