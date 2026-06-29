import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface Package {
  id: string;
  name: string;
  description?: string;
  classType?: string;
  sessionsCount: number;
  price: number;
  validityDays?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    userPackages: number;
  };
}

interface PackageFormData {
  classType: string;
  name: string;
  description?: string;
  sessionsCount: number;
  price: number;
  validityDays?: number;
}

interface PackageDefinition {
  name: string;
  sessionsCount: number;
  price: number;
  validityDays: number;
}

const CLASS_TYPES = ['PILATES', 'PRENATAL', 'POSTPARTUM', 'MEDITATION'] as const;

const PACKAGE_DEFINITIONS: Record<string, PackageDefinition[]> = {
  'PILATES': [
    { name: 'Drop - in', sessionsCount: 1, price: 2000, validityDays: 1 },
    { name: '4 Class Packs', sessionsCount: 4, price: 7000, validityDays: 30 },
    { name: '8 Class Packs', sessionsCount: 8, price: 12000, validityDays: 60 },
    { name: 'Unlimited Monthly', sessionsCount: 0, price: 20000, validityDays: 30 },
    { name: 'Unlimited 3 Month', sessionsCount: 0, price: 54000, validityDays: 90 },
    { name: 'Unlimited 6month', sessionsCount: 0, price: 96000, validityDays: 180 },
    { name: 'Unlimited 1year', sessionsCount: 0, price: 168000, validityDays: 365 },
  ],
  'PRENATAL': [
    { name: 'Drop - in', sessionsCount: 1, price: 2500, validityDays: 1 },
    { name: '4 Class Packs', sessionsCount: 4, price: 9000, validityDays: 30 },
    { name: '8 Class Packs', sessionsCount: 8, price: 14000, validityDays: 60 },
    { name: 'Unlimited Monthly', sessionsCount: 0, price: 22000, validityDays: 30 },
    { name: 'Unlimited 3 Month', sessionsCount: 0, price: 60000, validityDays: 90 },
    { name: 'Unlimited 6month', sessionsCount: 0, price: 108000, validityDays: 180 },
    { name: 'Unlimited 1year', sessionsCount: 0, price: 192000, validityDays: 365 },
  ],
  'POSTPARTUM': [
    { name: 'Drop - in', sessionsCount: 1, price: 2500, validityDays: 1 },
    { name: '4 Class Packs', sessionsCount: 4, price: 9000, validityDays: 30 },
    { name: '8 Class Packs', sessionsCount: 8, price: 14000, validityDays: 60 },
    { name: 'Unlimited Monthly', sessionsCount: 0, price: 22000, validityDays: 30 },
    { name: 'Unlimited 3 Month', sessionsCount: 0, price: 60000, validityDays: 90 },
    { name: 'Unlimited 6month', sessionsCount: 0, price: 108000, validityDays: 180 },
    { name: 'Unlimited 1year', sessionsCount: 0, price: 192000, validityDays: 365 },
  ],
  'MEDITATION': [
    { name: 'Drop - in', sessionsCount: 1, price: 2000, validityDays: 1 },
    { name: '4 Class Packs', sessionsCount: 4, price: 7000, validityDays: 30 },
    { name: '8 Class Packs', sessionsCount: 8, price: 12000, validityDays: 60 },
    { name: 'Unlimited Monthly', sessionsCount: 0, price: 20000, validityDays: 30 },
    { name: 'Unlimited 3 Month', sessionsCount: 0, price: 54000, validityDays: 90 },
    { name: 'Unlimited 6month', sessionsCount: 0, price: 96000, validityDays: 180 },
    { name: 'Unlimited 1year', sessionsCount: 0, price: 168000, validityDays: 365 },
  ],
};

const getPackageClassType = (name: string, price: number): string => {
  for (const [classType, packages] of Object.entries(PACKAGE_DEFINITIONS)) {
    if (packages.some(p => p.name === name && p.price === price)) {
      return classType;
    }
  }
  return 'Pilates';
};

const PackageManagement: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<PackageFormData>({
    classType: '',
    name: '',
    description: '',
    sessionsCount: 1,
    price: 0,
    validityDays: 30,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/packages', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }

      const data = await response.json();
      setPackages(data);
    } catch (err) {
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      };

      if (name === 'classType') {
        newData.name = '';
        newData.sessionsCount = 1;
        newData.price = 0;
        newData.validityDays = 30;
      }

      if (name === 'name' && newData.classType) {
        const def = PACKAGE_DEFINITIONS[newData.classType]?.find(p => p.name === value);
        if (def) {
          newData.sessionsCount = def.sessionsCount;
          newData.price = def.price;
          newData.validityDays = def.validityDays;
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingPackage 
        ? `/api/admin/packages/${editingPackage.id}`
        : '/api/admin/packages';
      
      const method = editingPackage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(editingPackage ? 'Package updated successfully!' : 'Package created successfully!');
        setShowForm(false);
        setEditingPackage(null);
        resetForm();
        setCurrentPage(1);
        fetchPackages();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    const classType = pkg.classType || getPackageClassType(pkg.name, pkg.price);
    setFormData({
      classType,
      name: pkg.name,
      description: pkg.description || '',
      sessionsCount: pkg.sessionsCount,
      price: pkg.price,
      validityDays: pkg.validityDays || 30,
    });
    setShowForm(true);
  };

  const openDeleteModal = (packageId: string) => {
    setDeleteTargetId(packageId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeleteTargetId(null);
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/packages/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Package deleted successfully!');
        setCurrentPage(1);
        fetchPackages();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete package');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      closeDeleteModal();
    }
  };

  const togglePackageStatus = async (packageId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/packages/${packageId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setSuccessMessage(`Package ${isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchPackages();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update package status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      classType: '',
      name: '',
      description: '',
      sessionsCount: 1,
      price: 0,
      validityDays: 30,
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingPackage(null);
    resetForm();
    setError('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-aura-cream">Package Management</h1>
          <p className="text-aura-sand/70">Create and manage membership packages</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          Create New Package
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-900/60 border border-green-600/40 text-green-200 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-900/60 border border-red-600/40 text-red-200 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-green-300 hover:text-green-200">×</button>
        </div>
      )}

      {/* Package Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPackage ? 'Edit Package' : 'Create New Package'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Class Type *</label>
                  <select
                    name="classType"
                    value={formData.classType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  >
                    <option value="">Select Class Type</option>
                    {CLASS_TYPES.map(type => (
                      <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Package Name *</label>
                  <select
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  >
                    <option value="">Select Package</option>
                    {formData.classType && PACKAGE_DEFINITIONS[formData.classType]?.map(pkg => (
                      <option key={pkg.name} value={pkg.name}>{pkg.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Sessions Count</label>
                  <input
                    type="number"
                    name="sessionsCount"
                    value={formData.sessionsCount}
                    readOnly
                    className="w-full px-3 py-2 bg-aura-bark/50 text-aura-sand border border-aura-sand/20 rounded-md focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Validity Days</label>
                  <input
                    type="number"
                    name="validityDays"
                    value={formData.validityDays}
                    readOnly
                    className="w-full px-3 py-2 bg-aura-bark/50 text-aura-sand border border-aura-sand/20 rounded-md focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Price (ETB) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-aura-sand mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 border border-aura-sand/20 rounded-md text-aura-sand hover:bg-aura-umber/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packages List */}
      <div className="bg-aura-ink shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-aura-sand/10">
            <thead className="bg-aura-umber/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Package Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Class Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Validity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-aura-ink divide-y divide-aura-sand/10">
              {packages.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((pkg) =>(
                <tr key={pkg.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-aura-cream">{pkg.name}</div>
                      <div className="text-sm text-aura-sand/50">{pkg.description || `ETB ${pkg.price}`}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-aura-umber/40 text-aura-sand">
                      {(pkg.classType ? pkg.classType.charAt(0) + pkg.classType.slice(1).toLowerCase() : getPackageClassType(pkg.name, pkg.price))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">{pkg.sessionsCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">{pkg.validityDays || 'Unlimited'} days</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">{pkg._count.userPackages} users</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      pkg.isActive 
                        ? 'bg-green-900/40 text-green-200' 
                        : 'bg-red-900/40 text-red-200'
                    }`}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(prev => prev === pkg.id ? null : pkg.id); }}
                        className="text-aura-sand hover:text-aura-cream p-1"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                      {openDropdown === pkg.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-aura-ink border border-aura-sand/20 rounded-md shadow-lg z-50 py-1">
                          <button
                            onClick={() => { handleEdit(pkg); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                          >
                            <PencilIcon className="w-4 h-4 mr-2 text-indigo-400" /> Edit
                          </button>
                          <button
                            onClick={() => { togglePackageStatus(pkg.id, !pkg.isActive); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                          >
                            {pkg.isActive ? <XCircleIcon className="w-4 h-4 mr-2 text-yellow-400" /> : <CheckCircleIcon className="w-4 h-4 mr-2 text-green-400" />}
                            {pkg.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => { openDeleteModal(pkg.id); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-aura-umber/30"
                          >
                            <TrashIcon className="w-4 h-4 mr-2" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {packages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-aura-sand/50">No packages found. Create your first package!</p>
          </div>
        )}

        {/* Pagination */}
        {packages.length > ITEMS_PER_PAGE && (
          <div className="bg-aura-ink px-4 py-3 flex items-center justify-between border-t border-aura-sand/10">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-aura-sand/20 text-sm font-medium rounded-md text-aura-sand bg-aura-ink hover:bg-aura-umber/30 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(packages.length / ITEMS_PER_PAGE), prev + 1))}
                disabled={currentPage === Math.ceil(packages.length / ITEMS_PER_PAGE)}
                className="relative inline-flex items-center px-4 py-2 border border-aura-sand/20 text-sm font-medium rounded-md text-aura-sand bg-aura-ink hover:bg-aura-umber/30 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-aura-sand">
                  Showing <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, packages.length)}</span> of <span className="font-medium">{packages.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-aura-sand/20 bg-aura-ink text-sm font-medium text-aura-sand hover:bg-aura-umber/30 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.ceil(packages.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-purple-600 border-purple-600 text-white'
                          : 'bg-aura-ink border-aura-sand/20 text-aura-sand hover:bg-aura-umber/30'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(packages.length / ITEMS_PER_PAGE), prev + 1))}
                    disabled={currentPage === Math.ceil(packages.length / ITEMS_PER_PAGE)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-aura-sand/20 bg-aura-ink text-sm font-medium text-aura-sand hover:bg-aura-umber/30 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-aura-cream">Delete Package</h3>
            </div>
            <p className="text-aura-sand mb-6">Are you sure you want to delete this package? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-aura-sand/20 rounded-md text-aura-sand hover:bg-aura-umber/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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

export default PackageManagement;
