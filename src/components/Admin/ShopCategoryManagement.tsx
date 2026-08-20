import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category? Products in this category must be moved first.')) return;
    try {
      await api.delete(`/api/admin/shop/categories/${id}`);
      setSuccessMsg('Category deleted');
      fetchCategories();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) { setError(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-aura-ivory">Shop Categories</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">
          <PlusIcon className="w-4 h-4" /> Add Category
        </button>
      </div>

      {error && <div className="bg-red-900/20 text-red-300 rounded-lg p-3 text-sm">{error}</div>}
      {successMsg && <div className="bg-green-900/20 text-green-300 rounded-lg p-3 text-sm">{successMsg}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-aura-ink border border-aura-umber rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-serif text-aura-ivory mb-4">{editing ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
              </div>
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Slug (URL)</label>
                <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generated from name" className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
              </div>
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
              </div>
              <div>
                <label className="text-sm text-aura-sand mb-1 block">Image URL</label>
                <input value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-aura-sand mb-1 block">Sort Order</label>
                  <input type="number" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })} className="w-full px-3 py-2 bg-aura-bark border border-aura-umber rounded-lg text-aura-cream focus:outline-none focus:border-aura-clay" />
                </div>
                <label className="flex items-center gap-2 text-sm text-aura-cream pt-6">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="accent-purple-600" /> Active
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-aura-umber text-aura-cream text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aura-umber"></div></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-aura-ink rounded-xl border border-aura-umber p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-aura-cream">{cat.name}</h3>
                  <p className="text-xs text-aura-sand/60">/{cat.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(cat)} className="p-1 text-aura-sand hover:text-aura-cream"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1 text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                </div>
              </div>
              {cat.description && <p className="text-xs text-aura-sand mb-2">{cat.description}</p>}
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${cat.isActive ? 'bg-green-900/30 text-green-300' : 'bg-gray-700/50 text-gray-400'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-aura-umber/30 text-aura-cream">{cat._count?.products || 0} products</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopCategoryManagement;
