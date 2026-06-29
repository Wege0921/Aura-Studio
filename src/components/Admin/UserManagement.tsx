import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { EyeIcon, PencilIcon, TrashIcon, ShieldCheckIcon, ExclamationTriangleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    bookings: number;
    userPackages: number;
    payments: number;
  };
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState({
    search: '',
    role: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showRoleEdit, setShowRoleEdit] = useState(false);
  const [showInstructorForm, setShowInstructorForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'USER',
  });
  const [instructorForm, setInstructorForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const roles = ['USER', 'ADMIN', 'INSTRUCTOR'];

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchInstructors();
  }, [filter, currentPage]);

  const fetchInstructors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/instructors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInstructors(data.instructors || []);
      }
    } catch (err) {
      console.error('Failed to fetch instructors:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filter.search && { search: filter.search }),
        ...(filter.role && { role: filter.role }),
      });

      const response = await fetch(`/api/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setShowEditForm(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/users/${selectedUser.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setSuccessMessage('User updated successfully!');
        setShowEditForm(false);
        setSelectedUser(null);
        fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const openDeleteModal = (userId: string) => {
    setDeleteTargetId(userId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeleteTargetId(null);
    setShowDeleteModal(false);
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('User deleted successfully!');
        fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      closeDeleteModal();
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setSuccessMessage(`User ${isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetails(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-900/40 text-purple-200';
      case 'USER':
        return 'bg-blue-900/40 text-blue-200';
      case 'INSTRUCTOR':
        return 'bg-green-900/40 text-green-200';
      default:
        return 'bg-aura-umber/40 text-aura-sand';
    }
  };

  const handleCreateInstructor = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/users/instructor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(instructorForm)
      });

      if (response.ok) {
        setSuccessMessage('Instructor created successfully!');
        setInstructorForm({ name: '', email: '', password: '', phone: '' });
        setShowInstructorForm(false);
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
      <div>
        <h1 className="text-3xl font-bold text-aura-cream">User Management</h1>
        <p className="text-aura-sand/70">Manage and monitor all users</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-aura-cream">Users</h2>
        <span className="text-sm text-aura-sand/50">
          Showing {users.length} users
        </span>
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

      {/* Filters */}
      <div className="bg-aura-ink p-3 rounded-lg border border-aura-sand/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-aura-sand/70 mb-0.5">Search</label>
            <input
              type="text"
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Name or email"
              className="w-full px-2.5 py-1.5 text-sm bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-aura-sand/70 mb-0.5">Role</label>
            <select
              value={filter.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
            >
              <option value="">All</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setFilter({ search: '', role: '' })}
          className="mt-2 text-xs text-aura-clay hover:text-aura-sand"
        >
          Clear filters
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-aura-ink shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-aura-sand/10">
            <thead className="bg-aura-umber/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Role
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
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-aura-cream">{user.name}</div>
                      <div className="text-sm text-aura-sand/50">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">
                      {user._count.bookings} bookings
                    </div>
                    <div className="text-sm text-aura-sand/50">
                      {user._count.payments} payments
                    </div>
                    <div className="text-xs text-aura-sand/40">
                      {user._count.userPackages} packages
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(prev => prev === user.id ? null : user.id); }}
                        className="text-aura-sand hover:text-aura-cream p-1"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                      {openDropdown === user.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-aura-ink border border-aura-sand/20 rounded-md shadow-lg z-50 py-1">
                          <button
                            onClick={() => { viewUserDetails(user); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                          >
                            <EyeIcon className="w-4 h-4 mr-2 text-indigo-400" /> View
                          </button>
                          <button
                            onClick={() => { handleEditUser(user); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                          >
                            <PencilIcon className="w-4 h-4 mr-2 text-blue-400" /> Edit
                          </button>
                          <button
                            onClick={() => { setShowRoleEdit(true); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                          >
                            <ShieldCheckIcon className="w-4 h-4 mr-2 text-purple-400" /> Role
                          </button>
                          <button
                            onClick={() => { openDeleteModal(user.id); setOpenDropdown(null); }}
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

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-aura-sand/50">No users found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-aura-ink px-4 py-3 flex items-center justify-between border-t border-aura-sand/10">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-aura-sand/20 text-sm font-medium rounded-md text-aura-sand bg-aura-ink hover:bg-aura-umber/30 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-aura-sand/20 text-sm font-medium rounded-md text-aura-sand bg-aura-ink hover:bg-aura-umber/30 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-aura-sand">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-aura-sand/20 bg-aura-ink text-sm font-medium text-aura-sand hover:bg-aura-umber/30 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
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

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">User Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-aura-cream">Basic Information</h3>
                  <p className="text-sm text-aura-sand/70">Name: {selectedUser.name}</p>
                  <p className="text-sm text-aura-sand/70">Email: {selectedUser.email}</p>
                  <p className="text-sm text-aura-sand/70">Role: {selectedUser.role}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-aura-cream">Account Information</h3>
                  <p className="text-sm text-aura-sand/70">
                    Joined: {format(new Date(selectedUser.createdAt), 'MMMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-aura-sand/70">
                    Updated: {format(new Date(selectedUser.updatedAt), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-aura-cream">Activity Summary</h3>
                  <p className="text-sm text-aura-sand/70">Total Bookings: {selectedUser._count.bookings}</p>
                  <p className="text-sm text-aura-sand/70">Total Payments: {selectedUser._count.payments}</p>
                  <p className="text-sm text-aura-sand/70">
                    Total Packages: {selectedUser._count.userPackages}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-900/60 flex items-center justify-center mr-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-aura-cream">Delete User</h3>
            </div>
            <p className="text-aura-sand mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-aura-sand/20 rounded-md text-aura-sand hover:bg-aura-umber/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditForm && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-aura-sand mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-aura-sand mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-aura-sand mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 border border-aura-sand/20 rounded-md text-aura-sand hover:bg-aura-umber/30"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  {/* Add Instructor Modal */}
  {showInstructorForm && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-aura-ink rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Instructor</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-aura-sand mb-1">Name</label>
            <input
              type="text"
              value={instructorForm.name}
              onChange={(e) => setInstructorForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
              placeholder="Enter instructor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-aura-sand mb-1">Email</label>
            <input
              type="email"
              value={instructorForm.email}
              onChange={(e) => setInstructorForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
              placeholder="Enter instructor email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-aura-sand mb-1">Password</label>
            <input
              type="password"
              value={instructorForm.password}
              onChange={(e) => setInstructorForm(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
              placeholder="Enter instructor password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-aura-sand mb-1">Phone</label>
            <input
              type="tel"
              value={instructorForm.phone}
              onChange={(e) => setInstructorForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
              placeholder="Enter instructor phone"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowInstructorForm(false)}
            className="px-4 py-2 border border-aura-sand/20 rounded-md text-aura-sand hover:bg-aura-umber/30"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateInstructor}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create Instructor
          </button>
        </div>
      </div>
    </div>
  )}
};

export default UserManagement;
