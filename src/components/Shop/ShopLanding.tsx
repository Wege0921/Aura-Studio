import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ProductCategory, Product } from './shopTypes';
import ProductCard from './ProductCard';
import { ShoppingBagIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const ProductDetailModal = lazy(() => import('./ProductDetailModal'));

const ShopLanding: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Catalog data is cached via React Query (staleTime per endpoint) so
  // navigating back to /shop shows instantly instead of re-fetching.
  const categoriesQuery = useQuery<ProductCategory[]>({
    queryKey: ['shop', 'categories'],
    queryFn: () => api.get<ProductCategory[]>('/api/shop/categories'),
    staleTime: 5 * 60 * 1000,
  });
  const featuredQuery = useQuery<{ products: Product[] }>({
    queryKey: ['shop', 'featured'],
    queryFn: () => api.get<{ products: Product[] }>('/api/shop/products?featured=true&limit=8'),
    staleTime: 60 * 1000,
  });
  const filtersQuery = useQuery<{ sizes: string[]; colors: string[] }>({
    queryKey: ['shop', 'filters'],
    queryFn: () => api.get<{ sizes: string[]; colors: string[] }>('/api/shop/filters').catch(() => ({ sizes: [], colors: [] })),
    staleTime: 5 * 60 * 1000,
  });

  const categories: ProductCategory[] = categoriesQuery.data ?? [];
  const featured: Product[] = featuredQuery.data?.products ?? [];
  const availableSizes: string[] = filtersQuery.data?.sizes ?? [];
  const availableColors: string[] = filtersQuery.data?.colors ?? [];

  const loading = categoriesQuery.isPending || featuredQuery.isPending;
  const loadError = categoriesQuery.error?.message ?? featuredQuery.error?.message ?? '';

  // In-page category selection (persists throughout the session)
  // Pre-select category from ?category= query param (e.g. from homepage links)
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || ''); // '' = featured, 'all' = all
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [modalSlug, setModalSlug] = useState<string | null>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  // Close mobile filters when clicking outside
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  useEffect(() => {
    // Fetch products when category, search, sort, or filters change
    if (!selectedCategory && !search && !selectedSize && !selectedColor && !maxPrice) {
      setCategoryProducts([]);
      return;
    }
    const fetchProducts = async () => {
      setCategoryLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
        if (search) params.set('search', search);
        if (selectedSize) params.set('size', selectedSize);
        if (selectedColor) params.set('color', selectedColor);
        if (maxPrice) params.set('maxPrice', maxPrice);
        params.set('sort', sortBy);
        params.set('limit', '48');
        const data = await api.get<{ products: Product[] }>(`/api/shop/products?${params.toString()}`);
        setCategoryProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching category products:', err);
      } finally {
        setCategoryLoading(false);
      }
    };
    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [selectedCategory, search, sortBy, selectedSize, selectedColor, maxPrice]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-edge"></div>
      </div>
    );
  }

  const showingCategory = !!selectedCategory || !!search || !!selectedSize || !!selectedColor || !!maxPrice;
  const currentCat = categories.find((c: ProductCategory) => c.slug === selectedCategory);

  const clearFilters = () => {
    setSelectedSize('');
    setSelectedColor('');
    setMaxPrice('');
  };

  const resetAll = () => {
    setSelectedCategory('');
    setSearch('');
    clearFilters();
    setSortBy('newest');
  };

  return (
    <div className="space-y-4 md:space-y-6 mt-2 md:mt-0">
      {loadError && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3">
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
      {/* Categories — circles on all viewports */}
      <section>
        <h2 className="text-lg md:text-xl font-semibold text-content mb-3 md:mb-4 font-serif">Shop by Category</h2>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 -mx-1 px-1 md:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* All */}
          <button
            onClick={() => { setSelectedCategory(''); setSearch(''); clearFilters(); }}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 overflow-hidden flex items-center justify-center transition-colors duration-200 ${!selectedCategory ? 'border-edge-focus bg-accent-100' : 'border-edge bg-surface'} group-hover:border-edge-focus`}>
              <ShoppingBagIcon className={`w-5 h-5 md:w-6 md:h-6 ${!selectedCategory ? 'text-accent-400' : 'text-content-secondary'}`} />
            </div>
            <span className={`text-xs md:text-sm font-medium whitespace-nowrap ${!selectedCategory ? 'text-accent-400' : 'text-content'}`}>All</span>
          </button>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.slug); setSearch(''); clearFilters(); }}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 overflow-hidden transition-colors duration-200 ${isActive ? 'border-edge-focus' : 'border-edge bg-surface'} group-hover:border-edge-focus`}>
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBagIcon className="w-5 h-5 md:w-6 md:h-6 text-content-secondary" />
                    </div>
                  )}
                </div>
                <span className={`text-xs md:text-sm font-medium whitespace-nowrap ${isActive ? 'text-accent-400' : 'text-content'}`}>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Mobile: Search + Sort + Filter toggle (one line) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="relative flex-1 min-w-0">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-surface border border-edge rounded-lg text-content placeholder-content-muted focus:outline-none focus:border-edge-focus text-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-2 py-2.5 bg-surface border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus text-sm shrink-0"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price ↑</option>
          <option value="price-high">Price ↓</option>
          <option value="name">A-Z</option>
        </select>
        <button
          ref={filterButtonRef}
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 bg-surface border rounded-lg text-content flex items-center justify-center transition-colors shrink-0 ${showFilters ? 'border-edge-focus text-accent-400' : 'border-edge'}`}
          aria-label="Toggle filters"
        >
          <FunnelIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile: Filters panel (toggle) */}
      {showFilters && (
        <div ref={filterPanelRef} className="md:hidden bg-surface border border-edge rounded-lg p-4 space-y-4">
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
              onClick={clearFilters}
              className="text-sm text-accent-400 hover:text-content-secondary"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Desktop: sidebar layout with always-visible advanced filters */}
      <div className="hidden md:flex gap-6">
        {/* Filter sidebar */}
        <aside className="w-64 shrink-0 space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-edge rounded-lg text-content placeholder-content-muted focus:outline-none focus:border-edge-focus"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm text-content-secondary mb-2 block">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>

          {/* Advanced Filters */}
          <div className="bg-surface border border-edge rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 text-content font-medium text-sm">
              <FunnelIcon className="w-4 h-4" />
              Filters
            </div>

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
                className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus"
              />
            </div>

            {(selectedSize || selectedColor || maxPrice) && (
              <button
                onClick={clearFilters}
                className="text-sm text-accent-400 hover:text-content-secondary"
              >
                Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* Products area */}
        <div className="flex-1 min-w-0">
          {showingCategory ? (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-content font-serif">
                  {currentCat?.name || (selectedCategory === 'all' ? 'All Products' : 'Search Results')}
                  {search && <span className="text-content-secondary text-sm font-normal ml-2">— "{search}"</span>}
                </h2>
                <button
                  onClick={resetAll}
                  className="text-sm text-accent-400 hover:text-content-secondary transition-colors"
                >
                  ← Back to featured
                </button>
              </div>
              {categoryLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-edge"></div>
                </div>
              ) : categoryProducts.length === 0 ? (
                search ? (
                  <div className="text-center py-16 space-y-3">
                    <MagnifyingGlassIcon className="w-12 h-12 text-edge-strong mx-auto" />
                    <h2 className="text-lg font-serif text-content-emphasis">No results for "{search}"</h2>
                    <p className="text-content-secondary text-sm max-w-md mx-auto">
                      Try a different search term or clear the active filters.
                    </p>
                    <button
                      type="button"
                      onClick={resetAll}
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
                      onClick={resetAll}
                      className="mt-2 px-5 py-2 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700 transition-colors"
                    >
                      Back to featured
                    </button>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onOpen={setModalSlug} />
                  ))}
                </div>
              )}
            </section>
          ) : (
            featured.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-content font-serif">Featured Products</h2>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-sm text-accent-400 hover:text-content-secondary transition-colors"
                  >
                    View all →
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {featured.map((p) => (
                    <ProductCard key={p.id} product={p} onOpen={setModalSlug} />
                  ))}
                </div>
              </section>
            )
          )}
        </div>
      </div>

      {/* Mobile: Products (no sidebar) */}
      <div className="md:hidden">
        {showingCategory ? (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-content font-serif">
                {currentCat?.name || (selectedCategory === 'all' ? 'All Products' : 'Search Results')}
                {search && <span className="text-content-secondary text-sm font-normal ml-2">— "{search}"</span>}
              </h2>
              <button
                onClick={resetAll}
                className="text-sm text-accent-400 hover:text-content-secondary transition-colors"
              >
                ← Back
              </button>
            </div>
            {categoryLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-edge"></div>
              </div>
            ) : categoryProducts.length === 0 ? (
              search ? (
                <div className="text-center py-16 space-y-3">
                  <MagnifyingGlassIcon className="w-12 h-12 text-edge-strong mx-auto" />
                  <h2 className="text-lg font-serif text-content-emphasis">No results for "{search}"</h2>
                  <p className="text-content-secondary text-sm max-w-md mx-auto">
                    Try a different search term or clear the active filters.
                  </p>
                  <button
                    type="button"
                    onClick={resetAll}
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
                    onClick={resetAll}
                    className="mt-2 px-5 py-2 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700 transition-colors"
                  >
                    Back to featured
                  </button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {categoryProducts.map((p) => (
                  <ProductCard key={p.id} product={p} onOpen={setModalSlug} />
                ))}
              </div>
            )}
          </section>
        ) : (
          featured.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-content font-serif">Featured Products</h2>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-sm text-accent-400 hover:text-content-secondary transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {featured.map((p) => (
                  <ProductCard key={p.id} product={p} onOpen={setModalSlug} />
                ))}
              </div>
            </section>
          )
        )}
      </div>

      {categories.length === 0 && featured.length === 0 && (
        <div className="text-center py-20">
          <ShoppingBagIcon className="w-16 h-16 text-content-secondary mx-auto mb-4" />
          <p className="text-content-secondary text-lg">Products coming soon. Check back shortly!</p>
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

export default ShopLanding;
