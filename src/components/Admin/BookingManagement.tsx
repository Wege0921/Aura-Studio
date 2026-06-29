import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { EyeIcon, TrashIcon, ExclamationTriangleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface Booking {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  class: {
    id: string;
    name: string;
    instructor: string;
    date: string;
    time: string;
    duration: number;
    classType: string;
    capacity: number;
  };
}

interface Class {
  id: string;
  name: string;
  date: string;
  time: string;
  instructor: string;
}

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState({
    status: '',
    classId: '',
    date: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const statusOptions = ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'PENDING'];

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchClasses();
  }, [filter, currentPage]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filter.status && { status: filter.status }),
        ...(filter.classId && { classId: filter.classId }),
        ...(filter.date && { date: filter.date }),
        ...(filter.search && { search: filter.search }),
      });

      const response = await fetch(`/api/admin/bookings?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/classes', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSuccessMessage('Booking status updated successfully!');
        fetchBookings();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update booking status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const openDeleteModal = (bookingId: string) => {
    setDeleteTargetId(bookingId);
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
      const response = await fetch(`/api/admin/bookings/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Booking deleted successfully!');
        fetchBookings();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete booking');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      closeDeleteModal();
    }
  };

  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-900/40 text-green-200';
      case 'CANCELLED':
        return 'bg-red-900/40 text-red-200';
      case 'COMPLETED':
        return 'bg-aura-umber/40 text-aura-sand';
      case 'PENDING':
        return 'bg-amber-900/40 text-amber-200';
      default:
        return 'bg-aura-umber/40 text-aura-sand';
    }
  };

  const getClassTypeColor = (classType: string) => {
    switch (classType) {
      case 'PILATES':
        return 'bg-pink-900/40 text-pink-200';
      case 'PRENATAL':
        return 'bg-amber-900/40 text-amber-200';
      case 'POSTPARTUM':
        return 'bg-rose-900/40 text-rose-200';
      default:
        return 'bg-aura-umber/40 text-aura-sand';
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
        <h1 className="text-3xl font-bold text-aura-cream">Booking Management</h1>
        <p className="text-aura-sand/70">Manage and monitor all class bookings</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-medium text-aura-sand/70 mb-0.5">Status</label>
            <select
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
            >
              <option value="">All</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-aura-sand/70 mb-0.5">Class</label>
            <select
              value={filter.classId}
              onChange={(e) => handleFilterChange('classId', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
            >
              <option value="">All</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-aura-sand/70 mb-0.5">Date</label>
            <input
              type="date"
              value={filter.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm bg-aura-bark text-aura-cream border border-aura-sand/20 rounded-md focus:outline-none focus:ring-purple-500"
            />
          </div>

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
        </div>

        <button
          onClick={() => setFilter({ status: '', classId: '', date: '', search: '' })}
          className="mt-2 text-xs text-aura-clay hover:text-aura-sand"
        >
          Clear filters
        </button>
      </div>

      {/* Bookings Table */}
      <div className="bg-aura-ink shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-aura-sand/10">
            <thead className="bg-aura-umber/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Booked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand/50 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-aura-ink divide-y divide-aura-sand/10">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-aura-cream">{booking.user.name}</div>
                      <div className="text-sm text-aura-sand/50">{booking.user.email}</div>
                      <div className="text-xs text-aura-sand/40">{booking.user.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-aura-cream">{booking.class.name}</div>
                      <div className="text-sm text-aura-sand/50">{booking.class.instructor}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getClassTypeColor(booking.class.classType)}`}>
                        {booking.class.classType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">
                      {format(new Date(booking.class.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-sm text-aura-sand/50">{booking.class.time}</div>
                    <div className="text-xs text-aura-sand/40">{booking.class.duration} min</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-aura-sand/50">
                    {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(prev => prev === booking.id ? null : booking.id); }}
                        className="text-aura-sand hover:text-aura-cream p-1"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                      {openDropdown === booking.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-aura-ink border border-aura-sand/20 rounded-md shadow-lg z-50 py-1">
                          <button
                            onClick={() => { viewBookingDetails(booking); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                          >
                            <EyeIcon className="w-4 h-4 mr-2 text-indigo-400" /> View
                          </button>
                          <div className="px-4 py-2">
                            <select
                              value={booking.status}
                              onChange={(e) => { handleStatusUpdate(booking.id, e.target.value); setOpenDropdown(null); }}
                              className="text-sm border border-aura-sand/20 rounded px-2 py-1 w-full bg-aura-bark text-aura-cream"
                            >
                              {statusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => { openDeleteModal(booking.id); setOpenDropdown(null); }}
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

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-aura-sand/50">No bookings found matching your criteria.</p>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-900/60 flex items-center justify-center mr-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-aura-cream">Delete Booking</h3>
            </div>
            <p className="text-aura-sand mb-6">Are you sure you want to delete this booking? This action cannot be undone.</p>
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

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Booking Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-aura-cream">User Information</h3>
                  <p className="text-sm text-aura-sand/70">Name: {selectedBooking.user.name}</p>
                  <p className="text-sm text-aura-sand/70">Email: {selectedBooking.user.email}</p>
                  <p className="text-sm text-aura-sand/70">Phone: {selectedBooking.user.phone}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-aura-cream">Class Information</h3>
                  <p className="text-sm text-aura-sand/70">Class: {selectedBooking.class.name}</p>
                  <p className="text-sm text-aura-sand/70">Instructor: {selectedBooking.class.instructor}</p>
                  <p className="text-sm text-aura-sand/70">Type: {selectedBooking.class.classType}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-aura-cream">Schedule</h3>
                  <p className="text-sm text-aura-sand/70">
                    Date: {format(new Date(selectedBooking.class.date), 'MMMM dd, yyyy')}
                  </p>
                  <p className="text-sm text-aura-sand/70">Time: {selectedBooking.class.time}</p>
                  <p className="text-sm text-aura-sand/70">Duration: {selectedBooking.class.duration} minutes</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-aura-cream">Booking Status</h3>
                  <p className="text-sm text-aura-sand/70">Status: {selectedBooking.status}</p>
                  <p className="text-sm text-aura-sand/70">
                    Booked on: {format(new Date(selectedBooking.createdAt), 'MMMM dd, yyyy')}
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
    </div>
  );
};

export default BookingManagement;
