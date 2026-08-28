import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { ProductCategory, Product } from './shopTypes';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import { ShoppingBagIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const ShopLanding: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
    const fetchData = async () => {
      try {
        const [cats, prods, allProds] = await Promise.all([
          api.get<ProductCategory[]>('/api/shop/categories'),
          api.get<{ products: Product[] }>('/api/shop/products?featured=true&limit=8'),
          api.get<{ products: Product[] }>('/api/shop/products?limit=100'),
        ]);
        setCategories(cats);
        setFeatured(prods.products || []);
        setAllProducts(allProds.products || []);
      } catch (err) {
        console.error('Error loading shop data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch products when category, search, sort, or filters change
  useEffect(() => {
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aura-umber"></div>
      </div>
    );
  }

  const showingCategory = !!selectedCategory || !!search || !!selectedSize || !!selectedColor || !!maxPrice || sortBy !== 'newest';
  const currentCat = categories.find((c) => c.slug === selectedCategory);

  // Collect available sizes and colors from ALL products (so filters work on every view)
  const availableSizes: string[] = [];
  const availableColors: string[] = [];
  for (const p of allProducts) {
    if (p.variants) {
      for (const v of p.variants) {
        if (v.size && availableSizes.indexOf(v.size) === -1) availableSizes.push(v.size);
        if (v.color && availableColors.indexOf(v.color) === -1) availableColors.push(v.color);
      }
    }
  }

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
      {/* Categories — circles on all viewports */}
      <section>
        <h2 className="text-lg md:text-xl font-semibold text-aura-cream mb-3 md:mb-4 font-serif">Shop by Category</h2>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 -mx-1 px-1 md:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* All */}
          <button
            onClick={() => { setSelectedCategory(''); setSearch(''); clearFilters(); }}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 overflow-hidden flex items-center justify-center transition-colors duration-200 ${!selectedCategory ? 'border-aura-clay bg-aura-clay/20' : 'border-aura-umber bg-aura-ink'} group-hover:border-aura-clay`}>
              <ShoppingBagIcon className={`w-5 h-5 md:w-6 md:h-6 ${!selectedCategory ? 'text-aura-clay' : 'text-aura-umber'}`} />
            </div>
            <span className={`text-xs md:text-sm font-medium whitespace-nowrap ${!selectedCategory ? 'text-aura-clay' : 'text-aura-cream'}`}>All</span>
          </button>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.slug); setSearch(''); clearFilters(); }}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 overflow-hidden transition-colors duration-200 ${isActive ? 'border-aura-clay' : 'border-aura-umber bg-aura-ink'} group-hover:border-aura-clay`}>
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBagIcon className="w-5 h-5 md:w-6 md:h-6 text-aura-umber" />
                    </div>
                  )}
                </div>
                <span className={`text-xs md:text-sm font-medium whitespace-nowrap ${isActive ? 'text-aura-clay' : 'text-aura-cream'}`}>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Mobile: Search + Sort + Filter toggle (one line) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="relative flex-1 min-w-0">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aura-sand/50" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-aura-ink border border-aura-umber rounded-lg text-aura-cream placeholder-aura-sand/40 focus:outline-none focus:border-aura-clay text-sm"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-2 py-2.5 bg-aura-ink border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay text-sm shrink-0"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price ↑</option>
          <option value="price-high">Price ↓</option>
          <option value="name">A-Z</option>
        </select>
        <button
          ref={filterButtonRef}
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 bg-aura-ink border rounded-lg text-aura-cream flex items-center justify-center transition-colors shrink-0 ${showFilters ? 'border-aura-clay text-aura-clay' : 'border-aura-umber'}`}
          aria-label="Toggle filters"
        >
          <FunnelIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile: Filters panel (toggle) */}
      {showFilters && (
        <div ref={filterPanelRef} className="md:hidden bg-aura-ink border border-aura-umber rounded-lg p-4 space-y-4">
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
              onClick={clearFilters}
              className="text-sm text-aura-clay hover:text-aura-sand"
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
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aura-sand/50" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-aura-ink border border-aura-umber rounded-lg text-aura-cream placeholder-aura-sand/40 focus:outline-none focus:border-aura-clay"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm text-aura-sand mb-2 block">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 bg-aura-ink border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>

          {/* Advanced Filters */}
          <div className="bg-aura-ink border border-aura-umber rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 text-aura-cream font-medium text-sm">
              <FunnelIcon className="w-4 h-4" />
              Filters
            </div>

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
                className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
              />
            </div>

            {(selectedSize || selectedColor || maxPrice) && (
              <button
                onClick={clearFilters}
                className="text-sm text-aura-clay hover:text-aura-sand"
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
                <h2 className="text-lg md:text-xl font-semibold text-aura-cream font-serif">
                  {currentCat?.name || (selectedCategory === 'all' ? 'All Products' : 'Search Results')}
                  {search && <span className="text-aura-sand text-sm font-normal ml-2">— "{search}"</span>}
                </h2>
                <button
                  onClick={resetAll}
                  className="text-sm text-aura-clay hover:text-aura-sand transition-colors"
                >
                  ← Back to featured
                </button>
              </div>
              {categoryLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aura-umber"></div>
                </div>
              ) : categoryProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-aura-sand text-lg">No products found. Try adjusting your filters.</p>
                </div>
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
                  <h2 className="text-lg md:text-xl font-semibold text-aura-cream font-serif">Featured Products</h2>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="text-sm text-aura-clay hover:text-aura-sand transition-colors"
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
              <h2 className="text-lg font-semibold text-aura-cream font-serif">
                {currentCat?.name || (selectedCategory === 'all' ? 'All Products' : 'Search Results')}
                {search && <span className="text-aura-sand text-sm font-normal ml-2">— "{search}"</span>}
              </h2>
              <button
                onClick={resetAll}
                className="text-sm text-aura-clay hover:text-aura-sand transition-colors"
              >
                ← Back
              </button>
            </div>
            {categoryLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aura-umber"></div>
              </div>
            ) : categoryProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-aura-sand text-lg">No products found. Try adjusting your filters.</p>
              </div>
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
                <h2 className="text-lg font-semibold text-aura-cream font-serif">Featured Products</h2>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-sm text-aura-clay hover:text-aura-sand transition-colors"
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
          <ShoppingBagIcon className="w-16 h-16 text-aura-umber mx-auto mb-4" />
          <p className="text-aura-sand text-lg">Products coming soon. Check back shortly!</p>
        </div>
      )}

      {/* Product detail modal (in-place, no page navigation) */}
      {modalSlug && (
        <ProductDetailModal slug={modalSlug} onClose={() => setModalSlug(null)} />
      )}
    </div>
  );
};

export default ShopLanding;
