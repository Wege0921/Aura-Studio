import React, { useState, useEffect } from 'react';
import ClassCard from './ClassCard';
import BookingModal from '../Booking/BookingModal';

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
  availableSpots: number;
  isFullyBooked: boolean;
  price?: number;
}

interface ClassListProps {
  onBookClass?: (classId: string) => void;
}

const ClassList: React.FC<ClassListProps> = ({ onBookClass }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    classType: '',
    instructor: '',
  });
  const [activePackages, setActivePackages] = useState<{ id: string; name: string; remainingSessions: number }[]>([]);

  useEffect(() => {
    fetchClasses();
    fetchActivePackages();
  }, [filters]);

  const fetchActivePackages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('/api/packages/my-packages', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const active = data
          .filter((pkg: any) => pkg.remainingSessions > 0 && (!pkg.expiresAt || new Date(pkg.expiresAt) >= new Date()))
          .map((pkg: any) => ({
            id: pkg.id,
            name: pkg.package.name,
            remainingSessions: pkg.remainingSessions,
          }));
        setActivePackages(active);
      }
    } catch (e) {
      console.error('Failed to fetch active packages', e);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.date) queryParams.append('date', filters.date);
      if (filters.classType) queryParams.append('classType', filters.classType);
      if (filters.instructor) queryParams.append('instructor', filters.instructor);

      const response = await fetch(`/api/classes?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError('Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleBookClick = (classId: string) => {
    const classItem = classes.find(c => c.id === classId);
    if (classItem && !classItem.isFullyBooked) {
      setSelectedClass(classItem);
      setShowBookingModal(true);
    }
  };

  const handleConfirmBooking = async (paymentMethod: string, receiptFile?: File, usePackageSession?: boolean) => {
    if (!selectedClass) return;

    try {
      setBookingLoading(true);
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('classId', selectedClass.id);
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentAmount', (selectedClass.price || 0).toString());
      if (usePackageSession) {
        formData.append('usePackageSession', 'true');
      }
      
      if (receiptFile) {
        formData.append('paymentReceipt', receiptFile);
      }
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Booking successful!');
        setShowBookingModal(false);
        setSelectedClass(null);
        // Refresh classes and packages to update availability
        fetchClasses();
        fetchActivePackages();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(data.error || 'Booking failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedClass(null);
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
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-4 text-green-700 hover:text-green-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Filter Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          <div>
            <label htmlFor="classType" className="block text-sm font-medium text-gray-700 mb-1">
              Class Type
            </label>
            <select
              id="classType"
              value={filters.classType}
              onChange={(e) => handleFilterChange('classType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Types</option>
              <option value="YOGA">Yoga</option>
              <option value="PILATES">Pilates</option>
              <option value="MEDITATION">Meditation</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-1">
              Instructor
            </label>
            <input
              type="text"
              id="instructor"
              value={filters.instructor}
              onChange={(e) => handleFilterChange('instructor', e.target.value)}
              placeholder="Search by instructor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
        
        <button
          onClick={() => setFilters({ date: '', classType: '', instructor: '' })}
          className="mt-4 text-sm text-purple-600 hover:text-purple-500"
        >
          Clear all filters
        </button>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No classes found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              onBook={handleBookClick}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmBooking}
        classInfo={selectedClass ? {
          name: selectedClass.name,
          instructor: selectedClass.instructor,
          date: selectedClass.date,
          time: selectedClass.time,
          duration: selectedClass.duration,
        } : null}
        loading={bookingLoading}
        activePackages={activePackages}
      />
    </div>
  );
};

export default ClassList;
