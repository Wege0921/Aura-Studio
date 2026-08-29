import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PhotoIcon, PlusIcon, EllipsisVerticalIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { Product, ProductCategory, ProductVariant, formatETB, getEffectivePrice } from '../Shop/shopTypes';

const ShopProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showVariants, setShowVariants] = useState<Product | null>(null);
  const [showImages, setShowImages] = useState<Product | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'variant' | 'image'; id: string; name?: string; productId?: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    basePrice: 0,
    salePrice: '',
    sku: '',
    status: 'ACTIVE',
    isFeatured: false,
    weightGrams: '',
    stock: '',
  });

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage]);

  // Debounced search: reset to page 1 and refetch
  useEffect(() => {
    const t = setTimeout(() => { if (currentPage !== 1) setCurrentPage(1); else fetchProducts(); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const handler = () => setOpenDropdown(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(currentPage));
      params.set('limit', String(ITEMS_PER_PAGE));
      const data = await api.get<{ products: Product[]; pagination: { total: number; pages: number } }>(`/api/admin/shop/products?${params.toString()}`);
      setProducts(data.products || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get<ProductCategory[]>('/api/admin/shop/categories');
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', categoryId: '', basePrice: 0, salePrice: '', sku: '', status: 'ACTIVE', isFeatured: false, weightGrams: '', stock: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      basePrice: product.basePrice,
      salePrice: product.salePrice?.toString() || '',
      sku: product.sku || '',
      status: product.status,
      isFeatured: product.isFeatured,
      weightGrams: product.weightGrams?.toString() || '',
      stock: product.stock === null || product.stock === undefined ? '' : product.stock.toString(),
    });
    setShowForm(true);
    setOpenDropdown(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        ...formData,
        basePrice: Number(formData.basePrice),
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        weightGrams: formData.weightGrams ? Number(formData.weightGrams) : null,
        // empty string => null (unlimited / untracked at product level)
        stock: formData.stock === '' ? null : Number(formData.stock),
      };
      if (editingProduct) {
        await api.put(`/api/admin/shop/products/${editingProduct.id}`, payload);
        setSuccessMsg('Product updated successfully');
      } else {
        await api.post('/api/admin/shop/products', payload);
        setSuccessMsg('Product created successfully');
      }
      resetForm();
      fetchProducts();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteTarget.type !== 'product') return;
    try {
      await api.delete(`/api/admin/shop/products/${deleteTarget.id}`);
      setSuccessMsg('Product deleted');
      setDeleteTarget(null);
      fetchProducts();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
      setDeleteTarget(null);
    }
    setOpenDropdown(null);
  };

  const paginated = products;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-content-emphasis">Shop Products</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700"
        >
          <PlusIcon className="w-4 h-4" /> Add Product
        </button>
      </div>

      {error && <div className="bg-danger-bg text-danger rounded-lg p-3 text-sm">{error}</div>}
      {successMsg && <div className="bg-success-bg text-success rounded-lg p-3 text-sm">{successMsg}</div>}

      {/* Search */}
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 bg-surface border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus"
      />

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-overlay z-[70] flex items-center justify-center p-4" onClick={() => resetForm()}>
          <div className="bg-surface border border-edge rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-serif text-content-emphasis mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-content-secondary mb-1 block">Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus" />
              </div>
              <div>
                <label className="text-sm text-content-secondary mb-1 block">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-content-secondary mb-1 block">Category *</label>
                  <select required value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus">
                    <option value="">Select...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-content-secondary mb-1 block">SKU</label>
                  <input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus" />
                </div>
                <div>
                  <label className="text-sm text-content-secondary mb-1 block">Base Price (ETB) *</label>
                  <input type="number" required min="0" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus" />
                </div>
                <div>
                  <label className="text-sm text-content-secondary mb-1 block">Sale Price (ETB)</label>
                  <input type="number" min="0" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus" />
                </div>
                <div>
                  <label className="text-sm text-content-secondary mb-1 block">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus">
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-content-secondary mb-1 block">Weight (grams)</label>
                  <input type="number" min="0" value={formData.weightGrams} onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus" />
                </div>
                <div>
                  <label className="text-sm text-content-secondary mb-1 block">
                    Product Stock
                    <span className="text-xs text-content-secondary ml-1">(blank = unlimited / use variant stock)</span>
                  </label>
                  <input type="number" min="0" placeholder="blank = untracked" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-content">
                <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} />
                Featured product (show on shop landing)
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700">
                  {editingProduct ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-edge text-content text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variants modal */}
      {showVariants && (
        <VariantsModal product={showVariants} onClose={() => setShowVariants(null)} />
      )}

      {/* Images modal */}
      {showImages && (
        <ImagesModal product={showImages} onClose={() => setShowImages(null)} />
      )}

      {/* Products list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edge"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((product) => {
            const price = getEffectivePrice(product);
            const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
            return (
              <div key={product.id} className="bg-surface rounded-lg border border-edge p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-canvas flex-shrink-0">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="w-6 h-6 text-content-secondary" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-content truncate">{product.name}</p>
                  <p className="text-xs text-content-secondary">{product.category?.name} · {formatETB(price)} · Stock: {totalStock}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${product.status === 'ACTIVE' ? 'bg-success-bg text-success' : 'bg-surface-sunken text-content-muted'}`}>{product.status}</span>
                    {product.isFeatured && <span className="text-xs px-2 py-0.5 rounded bg-accent-100 text-content">Featured</span>}
                  </div>
                </div>
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === product.id ? null : product.id); }}
                    className="p-1.5 text-content-secondary hover:text-content rounded">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                  {openDropdown === product.id && (
                    <div className="absolute right-0 mt-1 w-44 bg-canvas border border-edge rounded-lg shadow-lg z-50 py-1">
                      <button onClick={() => handleEdit(product)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-content hover:bg-[var(--state-hover)]">
                        <PencilIcon className="w-4 h-4" /> Edit
                      </button>
                      <button onClick={() => { setShowVariants(product); setOpenDropdown(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-content hover:bg-[var(--state-hover)]">
                        <PlusIcon className="w-4 h-4" /> Variants
                      </button>
                      <button onClick={() => { setShowImages(product); setOpenDropdown(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-content hover:bg-[var(--state-hover)]">
                        <PhotoIcon className="w-4 h-4" /> Images
                      </button>
                      <button onClick={() => { setDeleteTarget({ type: 'product', id: product.id, name: product.name }); setOpenDropdown(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger hover:bg-[var(--state-hover)]">
                        <TrashIcon className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded text-sm ${currentPage === i + 1 ? 'bg-accent-600 text-content-on-accent' : 'border border-edge text-content'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && deleteTarget.type === 'product' && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-[70]" onClick={() => setDeleteTarget(null)}>
          <div className="bg-surface rounded-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center mr-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
              </div>
              <h3 className="text-lg font-bold text-content">Delete Product</h3>
            </div>
            <p className="text-content-secondary mb-6">
              Are you sure you want to delete <strong className="text-content">{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-edge rounded-md text-content-secondary hover:bg-[var(--state-hover)] transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-danger text-content-on-accent rounded-md hover:opacity-90 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Variants sub-modal
const VariantsModal: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
  const [showAdd, setShowAdd] = useState(false);
  const [newVariant, setNewVariant] = useState({ size: '', color: '', style: '', sku: '', priceDelta: 0, stock: 0 });
  const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);

  const fetchVariants = async () => {
    const data = await api.get<{ products: Product[] }>('/api/admin/shop/products');
    const updated = data.products.find((p) => p.id === product.id);
    if (updated) setVariants(updated.variants || []);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post(`/api/admin/shop/products/${product.id}/variants`, {
      ...newVariant,
      priceDelta: Number(newVariant.priceDelta),
      stock: Number(newVariant.stock),
    });
    setNewVariant({ size: '', color: '', style: '', sku: '', priceDelta: 0, stock: 0 });
    setShowAdd(false);
    fetchVariants();
  };

  const handleDelete = async () => {
    if (!deleteVariantId) return;
    await api.delete(`/api/admin/shop/variants/${deleteVariantId}`);
    setDeleteVariantId(null);
    fetchVariants();
  };

  const handleStockUpdate = async (id: string, stock: number) => {
    await api.patch(`/api/admin/shop/variants/${id}/stock`, { stock });
    fetchVariants();
  };

  return (
    <div className="fixed inset-0 bg-overlay z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-edge rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-serif text-content-emphasis">Variants — {product.name}</h2>
          <button onClick={onClose} className="text-content-secondary hover:text-content">✕</button>
        </div>

        <div className="space-y-2 mb-4">
          {variants.length === 0 ? (
            <p className="text-sm text-content-secondary text-center py-4">No variants. Product uses default stock.</p>
          ) : (
            variants.map((v) => (
              <div key={v.id} className="flex items-center gap-2 bg-canvas rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-sm text-content">{[v.size, v.color, v.style].filter(Boolean).join(' / ') || 'Default'}</p>
                  <p className="text-xs text-content-secondary">+{formatETB(v.priceDelta)} · SKU: {v.sku || '—'}</p>
                </div>
                <input
                  type="number"
                  defaultValue={v.stock}
                  onBlur={(e) => handleStockUpdate(v.id, Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-surface border border-edge rounded text-content text-sm"
                  title="Stock"
                />
                <button onClick={() => setDeleteVariantId(v.id)} className="icon-btn text-danger hover:opacity-80">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {showAdd ? (
          <form onSubmit={handleAdd} className="space-y-3 border-t border-edge pt-4">
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Size" value={newVariant.size} onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })} className="px-2 py-1.5 bg-canvas border border-edge rounded text-content text-sm" />
              <input placeholder="Color" value={newVariant.color} onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })} className="px-2 py-1.5 bg-canvas border border-edge rounded text-content text-sm" />
              <input placeholder="Style" value={newVariant.style} onChange={(e) => setNewVariant({ ...newVariant, style: e.target.value })} className="px-2 py-1.5 bg-canvas border border-edge rounded text-content text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="SKU" value={newVariant.sku} onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })} className="px-2 py-1.5 bg-canvas border border-edge rounded text-content text-sm" />
              <input type="number" placeholder="Price Δ" value={newVariant.priceDelta} onChange={(e) => setNewVariant({ ...newVariant, priceDelta: Number(e.target.value) })} className="px-2 py-1.5 bg-canvas border border-edge rounded text-content text-sm" />
              <input type="number" placeholder="Stock" value={newVariant.stock} onChange={(e) => setNewVariant({ ...newVariant, stock: Number(e.target.value) })} className="px-2 py-1.5 bg-canvas border border-edge rounded text-content text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 px-3 py-1.5 rounded bg-accent-600 text-content-on-accent text-sm">Add</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded border border-edge text-content text-sm">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowAdd(true)} className="w-full px-4 py-2 rounded-lg border border-edge text-content text-sm hover:border-edge-strong flex items-center justify-center gap-2">
            <PlusIcon className="w-4 h-4" /> Add Variant
          </button>
        )}
      </div>

      {/* Delete Variant Modal */}
      {deleteVariantId && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-[80]" onClick={() => setDeleteVariantId(null)}>
          <div className="bg-surface rounded-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center mr-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
              </div>
              <h3 className="text-lg font-bold text-content">Delete Variant</h3>
            </div>
            <p className="text-content-secondary mb-6">Are you sure you want to delete this variant? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeleteVariantId(null)} className="px-4 py-2 border border-edge rounded-md text-content-secondary hover:bg-[var(--state-hover)] transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-danger text-content-on-accent rounded-md hover:opacity-90 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Images sub-modal
const ImagesModal: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
  const [images, setImages] = useState(product.images || []);
  const [uploading, setUploading] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }
      await api.postForm(`/api/admin/shop/products/${product.id}/images`, formData);
      input.value = '';
      // Refresh
      const data = await api.get<{ products: Product[] }>('/api/admin/shop/products');
      const updated = data.products.find((p) => p.id === product.id);
      if (updated) setImages(updated.images || []);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteImageId) return;
    await api.delete(`/api/admin/shop/products/${product.id}/images/${deleteImageId}`);
    setImages(images.filter((i) => i.id !== deleteImageId));
    setDeleteImageId(null);
  };

  return (
    <div className="fixed inset-0 bg-overlay z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-edge rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-serif text-content-emphasis">Images — {product.name}</h2>
          <button onClick={onClose} className="text-content-secondary hover:text-content">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {images.map((img) => (
            <div key={img.id} className="relative">
              <img src={img.url} alt="" className="w-full aspect-square object-cover rounded-lg" />
              <button
                onClick={() => setDeleteImageId(img.id)}
                style={{ position: 'absolute', top: '4px', right: '4px' }}
                className="icon-btn text-danger hover:opacity-80 transition-colors z-10"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          {images.length === 0 && <p className="col-span-3 text-sm text-content-secondary text-center py-4">No images yet.</p>}
        </div>

        <div className="border-t border-edge pt-4">
          <label className="text-sm text-content-secondary mb-2 block">Upload new images (JPG, PNG, WebP — max 5MB each)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="w-full text-sm text-content file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-600 file:text-content-on-accent file:font-medium file:cursor-pointer"
          />
          {uploading && <p className="text-xs text-content-secondary mt-2">Uploading...</p>}
        </div>
      </div>

      {/* Delete Image Modal */}
      {deleteImageId && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-[80]" onClick={() => setDeleteImageId(null)}>
          <div className="bg-surface rounded-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center mr-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
              </div>
              <h3 className="text-lg font-bold text-content">Delete Image</h3>
            </div>
            <p className="text-content-secondary mb-6">Are you sure you want to delete this image? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeleteImageId(null)} className="px-4 py-2 border border-edge rounded-md text-content-secondary hover:bg-[var(--state-hover)] transition-colors">Cancel</button>
              <button onClick={handleDeleteImage} className="px-4 py-2 bg-danger text-content-on-accent rounded-md hover:opacity-90 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopProductManagement;
