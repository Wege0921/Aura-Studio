import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface Class {
  id: string;
  name: string;
  description?: string;
  instructor: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  classType: string;
  price?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    bookings: number;
  };
}

interface ClassFormData {
  name: string;
  description?: string;
  instructor: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  classType: string;
  price?: number;
  imageUrl?: string;
}

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    description: '',
    instructor: '',
    date: '',
    time: '',
    duration: 60,
    capacity: 20,
    classType: 'PILATES',
    price: 0,
    imageUrl: '',
  });

  const classTypes = ['PILATES', 'PRENATAL', 'POSTPARTUM', 'MEDITATION'];
  const [instructors, setInstructors] = useState<string[]>([]);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/instructors', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInstructors(data.instructors.map((u: any) => u.name));
      }
    } catch {
      // fallback to empty list
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/classes', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingClass 
        ? `/api/admin/classes/${editingClass.id}`
        : '/api/admin/classes';
      
      const method = editingClass ? 'PUT' : 'POST';
      
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
        setSuccessMessage(editingClass ? 'Class updated successfully!' : 'Class created successfully!');
        setShowForm(false);
        setEditingClass(null);
        resetForm();
        setCurrentPage(1);
        fetchClasses();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || '',
      instructor: classItem.instructor,
      date: classItem.date,
      time: classItem.time,
      duration: classItem.duration,
      capacity: classItem.capacity,
      classType: classItem.classType,
      price: classItem.price || 0,
      imageUrl: classItem.imageUrl || '',
    });
    setShowForm(true);
  };

  const openDeleteModal = (classId: string) => {
    setDeleteTargetId(classId);
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
      const response = await fetch(`/api/admin/classes/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Class deleted successfully!');
        setCurrentPage(1);
        fetchClasses();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete class');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      closeDeleteModal();
    }
  };

  const toggleClassStatus = async (classId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/classes/${classId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setSuccessMessage(`Class ${isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchClasses();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update class status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      instructor: '',
      date: '',
      time: '',
      duration: 60,
      capacity: 20,
      classType: 'PILATES',
      price: 0,
      imageUrl: '',
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingClass(null);
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
          <h1 className="text-3xl font-bold text-aura-cream">Class Management</h1>
          <p className="text-aura-sand/70">Create and manage pilates classes</p>
        </div>
          <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          Create New Class
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

      {/* Class Form Modal */}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-900/60 flex items-center justify-center mr-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-aura-cream">Delete Class</h3>
            </div>
            <p className="text-aura-sand mb-6">Are you sure you want to delete this class? This action cannot be undone.</p>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingClass ? 'Edit Class' : 'Create New Class'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Class Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Instructor *</label>
                  <select
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  >
                    <option value="">Select Instructor</option>
                    {instructors.map(instructor => (
                      <option key={instructor} value={instructor}>{instructor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Duration (minutes) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="30"
                    max="180"
                    required
                    className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    max="50"
                    required
                    className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Class Type *</label>
                  <select
                    name="classType"
                    value={formData.classType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  >
                    {classTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-aura-sand mb-1">Price (ETB)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-aura-sand mb-1">Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
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
                  {editingClass ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classes List */}
      <div className="bg-aura-ink shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-aura-sand/10">
            <thead className="bg-aura-umber/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Class Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Capacity
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
              {classes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((classItem) => (
                <tr key={classItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-aura-cream">{classItem.name}</div>
                      <div className="text-sm text-aura-sand/50">{classItem.instructor}</div>
                      <div className="text-xs text-aura-sand/40">{classItem.classType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">
                      {format(new Date(classItem.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-sm text-aura-sand/50">{classItem.time}</div>
                    <div className="text-xs text-aura-sand/40">{classItem.duration} min</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">
                      {classItem._count.bookings}/{classItem.capacity}
                    </div>
                    <div className="text-xs text-aura-sand/40">
                      {classItem.price && `ETB ${classItem.price}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      classItem.isActive 
                        ? 'bg-green-900/40 text-green-200' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {classItem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(prev => prev === classItem.id ? null : classItem.id); }}
                        className="text-aura-sand hover:text-aura-cream p-1"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                      {openDropdown === classItem.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-aura-ink border border-aura-sand/20 rounded-md shadow-lg z-50 py-1">
                          <button
                            onClick={() => { handleEdit(classItem); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                          >
                            <PencilIcon className="w-4 h-4 mr-2 text-indigo-400" /> Edit
                          </button>
                          <button
                            onClick={() => { toggleClassStatus(classItem.id, !classItem.isActive); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                          >
                            {classItem.isActive ? <XCircleIcon className="w-4 h-4 mr-2 text-yellow-400" /> : <CheckCircleIcon className="w-4 h-4 mr-2 text-green-400" />}
                            {classItem.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => { openDeleteModal(classItem.id); setOpenDropdown(null); }}
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
        
        {classes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-aura-sand/50">No classes found. Create your first class!</p>
          </div>
        )}

        {/* Pagination */}
        {classes.length > ITEMS_PER_PAGE && (
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
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(classes.length / ITEMS_PER_PAGE), prev + 1))}
                disabled={currentPage === Math.ceil(classes.length / ITEMS_PER_PAGE)}
                className="relative inline-flex items-center px-4 py-2 border border-aura-sand/20 text-sm font-medium rounded-md text-aura-sand bg-aura-ink hover:bg-aura-umber/30 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-aura-sand">
                  Showing <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, classes.length)}</span> of <span className="font-medium">{classes.length}</span> results
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
                  {Array.from({ length: Math.ceil(classes.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
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
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(classes.length / ITEMS_PER_PAGE), prev + 1))}
                    disabled={currentPage === Math.ceil(classes.length / ITEMS_PER_PAGE)}
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
    </div>
  );
};

export default ClassManagement;
