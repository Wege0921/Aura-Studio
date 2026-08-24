import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PhotoIcon, PlusIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
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
  }, []);

  useEffect(() => {
    const handler = () => setOpenDropdown(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await api.get<{ products: Product[] }>('/api/admin/shop/products');
      setProducts(data.products || []);
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/api/admin/shop/products/${id}`);
      setSuccessMsg('Product deleted');
      fetchProducts();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
    setOpenDropdown(null);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-aura-ivory">Shop Products</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
        >
          <PlusIcon className="w-4 h-4" /> Add Product
        </button>
      </div>

      {error && <div className="bg-red-900/20 text-red-300 rounded-lg p-3 text-sm">{error}</div>}
      {successMsg && <div className="bg-green-900/20 text-green-300 rounded-lg p-3 text-sm">{successMsg}</div>}

      {/* Search */}
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 bg-aura-ink border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay"
      />

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
          <div className="bg-aura-ink border border-aura-umber rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-serif text-aura-ivory mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
              </div>
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-aura-sand mb-1 block">Category *</label>
                  <select required value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay">
                    <option value="">Select...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-aura-sand mb-1 block">SKU</label>
                  <input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
                </div>
                <div>
                  <label className="text-sm text-aura-sand mb-1 block">Base Price (ETB) *</label>
                  <input type="number" required min="0" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
                </div>
                <div>
                  <label className="text-sm text-aura-sand mb-1 block">Sale Price (ETB)</label>
                  <input type="number" min="0" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
                </div>
                <div>
                  <label className="text-sm text-aura-sand mb-1 block">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay">
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-aura-sand mb-1 block">Weight (grams)</label>
                  <input type="number" min="0" value={formData.weightGrams} onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                    className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
                </div>
                <div>
                  <label className="text-sm text-aura-sand mb-1 block">
                    Product Stock
                    <span className="text-xs text-aura-sand/60 ml-1">(blank = unlimited / use variant stock)</span>
                  </label>
                  <input type="number" min="0" placeholder="blank = untracked" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-aura-cream">
                <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="accent-purple-600" />
                Featured product (show on shop landing)
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">
                  {editingProduct ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-aura-umber text-aura-cream text-sm">
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aura-umber"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((product) => {
            const price = getEffectivePrice(product);
            const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
            return (
              <div key={product.id} className="bg-aura-ink rounded-lg border border-aura-umber p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-aura-bark flex-shrink-0">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="w-6 h-6 text-aura-umber" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-aura-cream truncate">{product.name}</p>
                  <p className="text-xs text-aura-sand/60">{product.category?.name} · {formatETB(price)} · Stock: {totalStock}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${product.status === 'ACTIVE' ? 'bg-green-900/30 text-green-300' : 'bg-gray-700/50 text-gray-400'}`}>{product.status}</span>
                    {product.isFeatured && <span className="text-xs px-2 py-0.5 rounded bg-aura-clay/20 text-aura-cream">Featured</span>}
                  </div>
                </div>
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === product.id ? null : product.id); }}
                    className="p-1.5 text-aura-sand hover:text-aura-cream rounded">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                  {openDropdown === product.id && (
                    <div className="absolute right-0 mt-1 w-44 bg-aura-bark border border-aura-umber rounded-lg shadow-lg z-50 py-1">
                      <button onClick={() => handleEdit(product)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30">
                        <PencilIcon className="w-4 h-4" /> Edit
                      </button>
                      <button onClick={() => { setShowVariants(product); setOpenDropdown(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30">
                        <PlusIcon className="w-4 h-4" /> Variants
                      </button>
                      <button onClick={() => { setShowImages(product); setOpenDropdown(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30">
                        <PhotoIcon className="w-4 h-4" /> Images
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-aura-umber/30">
                        <TrashIcon className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length > ITEMS_PER_PAGE && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: Math.ceil(filtered.length / ITEMS_PER_PAGE) }, (_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded text-sm ${currentPage === i + 1 ? 'bg-aura-clay text-aura-ink' : 'border border-aura-umber text-aura-cream'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this variant?')) return;
    await api.delete(`/api/admin/shop/variants/${id}`);
    fetchVariants();
  };

  const handleStockUpdate = async (id: string, stock: number) => {
    await api.patch(`/api/admin/shop/variants/${id}/stock`, { stock });
    fetchVariants();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-aura-ink border border-aura-umber rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-serif text-aura-ivory">Variants — {product.name}</h2>
          <button onClick={onClose} className="text-aura-sand hover:text-aura-cream">✕</button>
        </div>

        <div className="space-y-2 mb-4">
          {variants.length === 0 ? (
            <p className="text-sm text-aura-sand text-center py-4">No variants. Product uses default stock.</p>
          ) : (
            variants.map((v) => (
              <div key={v.id} className="flex items-center gap-2 bg-aura-bark rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-sm text-aura-cream">{[v.size, v.color, v.style].filter(Boolean).join(' / ') || 'Default'}</p>
                  <p className="text-xs text-aura-sand/60">+{formatETB(v.priceDelta)} · SKU: {v.sku || '—'}</p>
                </div>
                <input
                  type="number"
                  defaultValue={v.stock}
                  onBlur={(e) => handleStockUpdate(v.id, Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-aura-ink border border-aura-umber rounded text-aura-cream text-sm"
                  title="Stock"
                />
                <button onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-300">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {showAdd ? (
          <form onSubmit={handleAdd} className="space-y-3 border-t border-aura-umber pt-4">
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Size" value={newVariant.size} onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })} className="px-2 py-1.5 bg-aura-bark border border-aura-umber rounded text-aura-cream text-sm" />
              <input placeholder="Color" value={newVariant.color} onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })} className="px-2 py-1.5 bg-aura-bark border border-aura-umber rounded text-aura-cream text-sm" />
              <input placeholder="Style" value={newVariant.style} onChange={(e) => setNewVariant({ ...newVariant, style: e.target.value })} className="px-2 py-1.5 bg-aura-bark border border-aura-umber rounded text-aura-cream text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="SKU" value={newVariant.sku} onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })} className="px-2 py-1.5 bg-aura-bark border border-aura-umber rounded text-aura-cream text-sm" />
              <input type="number" placeholder="Price Δ" value={newVariant.priceDelta} onChange={(e) => setNewVariant({ ...newVariant, priceDelta: Number(e.target.value) })} className="px-2 py-1.5 bg-aura-bark border border-aura-umber rounded text-aura-cream text-sm" />
              <input type="number" placeholder="Stock" value={newVariant.stock} onChange={(e) => setNewVariant({ ...newVariant, stock: Number(e.target.value) })} className="px-2 py-1.5 bg-aura-bark border border-aura-umber rounded text-aura-cream text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 px-3 py-1.5 rounded bg-purple-600 text-white text-sm">Add</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded border border-aura-umber text-aura-cream text-sm">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowAdd(true)} className="w-full px-4 py-2 rounded-lg border border-aura-umber text-aura-cream text-sm hover:border-aura-sand flex items-center justify-center gap-2">
            <PlusIcon className="w-4 h-4" /> Add Variant
          </button>
        )}
      </div>
    </div>
  );
};

// Images sub-modal
const ImagesModal: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
  const [images, setImages] = useState(product.images || []);
  const [uploading, setUploading] = useState(false);

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
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/shop/products/${product.id}/images`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        input.value = '';
        // Refresh
        const data = await api.get<{ products: Product[] }>('/api/admin/shop/products');
        const updated = data.products.find((p) => p.id === product.id);
        if (updated) setImages(updated.images || []);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Delete this image?')) return;
    await api.delete(`/api/admin/shop/products/${product.id}/images/${imageId}`);
    setImages(images.filter((i) => i.id !== imageId));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-aura-ink border border-aura-umber rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-serif text-aura-ivory">Images — {product.name}</h2>
          <button onClick={onClose} className="text-aura-sand hover:text-aura-cream">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.url} alt="" className="w-full aspect-square object-cover rounded-lg" />
              <button
                onClick={() => handleDeleteImage(img.id)}
                className="absolute top-1 right-1 bg-red-900/80 text-red-200 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          {images.length === 0 && <p className="col-span-3 text-sm text-aura-sand text-center py-4">No images yet.</p>}
        </div>

        <div className="border-t border-aura-umber pt-4">
          <label className="text-sm text-aura-sand mb-2 block">Upload new images (JPG, PNG, WebP — max 5MB each)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="w-full text-sm text-aura-cream file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-aura-clay file:text-aura-ink file:font-medium file:cursor-pointer"
          />
          {uploading && <p className="text-xs text-aura-sand/60 mt-2">Uploading...</p>}
        </div>
      </div>
    </div>
  );
};

export default ShopProductManagement;
