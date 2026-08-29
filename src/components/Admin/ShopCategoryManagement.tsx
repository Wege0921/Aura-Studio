import React, { useState, useEffect, useRef } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, PhotoIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { ProductCategory } from '../Shop/shopTypes';

const ShopCategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', imageUrl: '', sortOrder: 0, isActive: true });
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.get<ProductCategory[]>('/api/admin/shop/categories');
      setCategories(data);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const resetForm = () => { setFormData({ name: '', slug: '', description: '', imageUrl: '', sortOrder: 0, isActive: true }); setEditing(null); setShowForm(false); };

  const handleEdit = (cat: ProductCategory) => {
    setEditing(cat);
    setFormData({ name: cat.name, slug: cat.slug, description: cat.description || '', imageUrl: cat.imageUrl || '', sortOrder: cat.sortOrder, isActive: cat.isActive });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...formData, sortOrder: Number(formData.sortOrder) };
      if (editing) {
        await api.put(`/api/admin/shop/categories/${editing.id}`, payload);
        setSuccessMsg('Category updated');
      } else {
        await api.post('/api/admin/shop/categories', payload);
        setSuccessMsg('Category created');
      }
      resetForm();
      fetchCategories();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/admin/shop/categories/${deleteTarget.id}`);
      setSuccessMsg('Category deleted');
      setDeleteTarget(null);
      fetchCategories();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) { setError(err.message); setDeleteTarget(null); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editing) return;

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', files[0]);
      const data = await api.postForm<{ imageUrl: string }>(`/api/admin/shop/categories/${editing.id}/image`, formData);
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      setSuccessMsg('Image uploaded');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-content-emphasis">Shop Categories</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700">
          <PlusIcon className="w-4 h-4" /> Add Category
        </button>
      </div>

      {error && <div className="bg-danger-bg text-danger rounded-lg p-3 text-sm">{error}</div>}
      {successMsg && <div className="bg-success-bg text-success rounded-lg p-3 text-sm">{successMsg}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-overlay z-[70] flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-surface border border-edge rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-serif text-content-emphasis mb-4">{editing ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-content-secondary mb-1 block">Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus" />
              </div>
              <div>
                <label className="text-sm text-content-secondary mb-1 block">Slug (URL)</label>
                <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generated from name" className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus" />
              </div>
              <div>
                <label className="text-sm text-content-secondary mb-1 block">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus" />
              </div>
              <div>
                <label className="text-sm text-content-secondary mb-1 block">Category Image</label>
                {formData.imageUrl ? (
                  <div className="relative mb-2">
                    <img src={formData.imageUrl} alt="Category" className="w-full h-32 object-cover rounded-lg border border-edge" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      style={{ position: 'absolute', top: '4px', right: '4px' }}
                      className="icon-btn text-danger hover:opacity-80 transition-colors z-10"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-32 bg-canvas border border-edge rounded-lg flex items-center justify-center mb-2">
                    <PhotoIcon className="w-8 h-8 text-content-secondary" />
                  </div>
                )}
                {editing ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      disabled={imageUploading}
                      className="w-full text-sm text-content file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-600 file:text-content-on-accent file:font-medium file:cursor-pointer"
                    />
                    {imageUploading && <p className="text-xs text-content-secondary mt-1">Uploading...</p>}
                    <p className="text-xs text-content-secondary mt-1">Save the category first, then upload an image.</p>
                  </>
                ) : (
                  <input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Image URL (or upload after creating)"
                    className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus text-sm"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-content-secondary mb-1 block">Sort Order</label>
                  <input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })} className="w-full px-3 py-2 bg-canvas border border-edge rounded-lg text-content focus:outline-none focus:border-edge-focus" />
                </div>
                <label className="flex items-center gap-2 text-sm text-content pt-6">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /> Active
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-accent-600 text-content-on-accent text-sm font-medium hover:bg-accent-700">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-edge text-content text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edge"></div></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-surface rounded-xl border border-edge p-4">
              {cat.imageUrl && (
                <div className="w-full h-24 rounded-lg overflow-hidden mb-3 bg-canvas">
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-content">{cat.name}</h3>
                  <p className="text-xs text-content-secondary">/{cat.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(cat)} className="p-1 text-content-secondary hover:text-content"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(cat)} className="icon-btn p-1 text-danger hover:opacity-80"><TrashIcon className="w-4 h-4" /></button>
                </div>
              </div>
              {cat.description && <p className="text-xs text-content-secondary mb-2">{cat.description}</p>}
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${cat.isActive ? 'bg-success-bg text-success' : 'bg-surface-sunken text-content-muted'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-surface-sunken text-content">{cat._count?.products || 0} products</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-[70]" onClick={() => setDeleteTarget(null)}>
          <div className="bg-surface rounded-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center mr-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
              </div>
              <h3 className="text-lg font-bold text-content">Delete Category</h3>
            </div>
            <p className="text-content-secondary mb-6">
              Are you sure you want to delete <strong className="text-content">{deleteTarget.name}</strong>?
              Products in this category must be moved first. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-edge rounded-md text-content-secondary hover:bg-surface-sunken transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-danger text-content-on-accent rounded-md hover:opacity-90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopCategoryManagement;
