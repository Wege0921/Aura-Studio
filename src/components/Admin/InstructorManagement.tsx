import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { TrashIcon, ExclamationTriangleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface Instructor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    bookings: number;
    classes: number;
  };
}

const InstructorManagement: React.FC = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
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
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/instructors', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
      }

      const data = await response.json();
      setInstructors(data.instructors || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load instructors');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/instructor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessage('Instructor created successfully!');
        setFormData({ name: '', email: '', password: '', phone: '' });
        setShowForm(false);
        setCurrentPage(1);
        fetchInstructors();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create instructor');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const openDeleteModal = (instructorId: string) => {
    setDeleteTargetId(instructorId);
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
      const response = await fetch(`/api/users/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Instructor deleted successfully!');
        setCurrentPage(1);
        fetchInstructors();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete instructor');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      closeDeleteModal();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '' });
  };

  const cancelForm = () => {
    setShowForm(false);
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
          <h1 className="text-3xl font-bold text-aura-cream">Instructor Management</h1>
          <p className="text-aura-sand/70">Manage and monitor all instructors</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Add Instructor
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-900/60 flex items-center justify-center mr-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-aura-cream">Delete Instructor</h3>
            </div>
            <p className="text-aura-sand mb-6">Are you sure you want to delete this instructor? This action cannot be undone.</p>
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

      {/* Add Instructor Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-aura-cream mb-4">Add New Instructor</h2>

            <form onSubmit={handleCreateInstructor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-aura-sand mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  placeholder="Enter instructor name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-aura-sand mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  placeholder="Enter instructor email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-aura-sand mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  placeholder="Enter instructor password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-aura-sand mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                  placeholder="Enter instructor phone"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
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
                  Create Instructor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructors List */}
      <div className="bg-aura-ink shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-aura-sand/10">
            <thead className="bg-aura-umber/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-aura-ink divide-y divide-aura-sand/10">
              {instructors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((instructor) => (
                <tr key={instructor.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-aura-cream">{instructor.name}</div>
                      <div className="text-sm text-aura-sand/50">{instructor.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">{instructor.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">
                      {instructor._count?.classes || 0} classes
                    </div>
                    <div className="text-xs text-aura-sand/40">
                      {instructor._count?.bookings || 0} bookings
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">
                      {format(new Date(instructor.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(prev => prev === instructor.id ? null : instructor.id); }}
                        className="text-aura-sand hover:text-aura-cream p-1"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                      {openDropdown === instructor.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-aura-ink border border-aura-sand/20 rounded-md shadow-lg z-50 py-1">
                          <button
                            onClick={() => { openDeleteModal(instructor.id); setOpenDropdown(null); }}
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

        {instructors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-aura-sand/50">No instructors found. Add your first instructor!</p>
          </div>
        )}

        {/* Pagination */}
        {instructors.length > ITEMS_PER_PAGE && (
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
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(instructors.length / ITEMS_PER_PAGE), prev + 1))}
                disabled={currentPage === Math.ceil(instructors.length / ITEMS_PER_PAGE)}
                className="relative inline-flex items-center px-4 py-2 border border-aura-sand/20 text-sm font-medium rounded-md text-aura-sand bg-aura-ink hover:bg-aura-umber/30 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-aura-sand">
                  Showing <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, instructors.length)}</span> of <span className="font-medium">{instructors.length}</span> results
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
                  {Array.from({ length: Math.ceil(instructors.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
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
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(instructors.length / ITEMS_PER_PAGE), prev + 1))}
                    disabled={currentPage === Math.ceil(instructors.length / ITEMS_PER_PAGE)}
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

export default InstructorManagement;
