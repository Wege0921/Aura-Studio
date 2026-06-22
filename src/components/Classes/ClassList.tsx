import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlClassType = searchParams.get('classType') || '';

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    classType: urlClassType,
    instructor: '',
    packageType: '',
  });
  const [activePackages, setActivePackages] = useState<{ id: string; name: string; remainingSessions: number }[]>([]);
  const [waitlistedClassIds, setWaitlistedClassIds] = useState<string[]>([]);

  useEffect(() => {
    fetchClasses();
    fetchActivePackages();
  }, [filters]);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('/api/waitlist/my-waitlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setWaitlistedClassIds((Array.isArray(data) ? data : []).map((e: any) => e.classId));
    } catch (err) {
      // Non-fatal.
    }
  };

  const handleJoinWaitlist = async (classId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to join the waitlist');
      return;
    }
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classId }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(data.message || 'Added to the waitlist.');
        fetchWaitlist();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to join waitlist');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

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
    if (filterName === 'classType') {
      const packageType = value ? `${value}|dropin` : '';
      setFilters(prev => ({
        ...prev,
        classType: value,
        packageType,
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterName]: value,
      }));
    }
  };

  const handlePackageFilter = (value: string) => {
    if (!value) {
      setFilters(prev => ({ ...prev, packageType: '', classType: '' }));
      return;
    }
    const [classType] = value.split('|');
    setFilters(prev => ({
      ...prev,
      packageType: value,
      classType,
    }));
  };

  const handleBookClick = (classId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?returnTo=/classes');
      return;
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aura-umber"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-900/60 border border-green-600/40 text-green-200 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/60 border border-red-600/40 text-red-200 px-4 py-3 rounded">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-4 text-red-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-aura-ink p-6 rounded-xl shadow-lg shadow-black/20 border border-aura-sand/10">
        <h2 className="text-lg font-semibold text-aura-cream mb-4">Filter Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-aura-cream mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-aura-sand/30 rounded-md focus:outline-none focus:ring-aura-sand focus:border-aura-sand bg-aura-bark text-aura-cream placeholder:text-aura-sand/70"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div>
            <label htmlFor="classType" className="block text-sm font-medium text-aura-cream mb-1">
              Class Type
            </label>
            <select
              id="classType"
              value={filters.classType}
              onChange={(e) => handleFilterChange('classType', e.target.value)}
              className="w-full px-3 py-2 border border-aura-sand/30 rounded-md focus:outline-none focus:ring-aura-sand focus:border-aura-sand bg-aura-bark text-aura-cream placeholder:text-aura-sand/70"
            >
              <option value="">All Types</option>
              <option value="PILATES">Pilates</option>
              <option value="PRENATAL">Prenatal</option>
              <option value="POSTPARTUM">Postpartum</option>
            </select>
          </div>

          <div>
            <label htmlFor="packageType" className="block text-sm font-medium text-aura-cream mb-1">
              Package
            </label>
            <select
              id="packageType"
              value={filters.packageType || ''}
              onChange={(e) => handlePackageFilter(e.target.value)}
              className="w-full px-3 py-2 border border-aura-sand/30 rounded-md focus:outline-none focus:ring-aura-sand focus:border-aura-sand bg-aura-bark text-aura-cream placeholder:text-aura-sand/70"
            >
              <option value="">All Packages</option>
              {(filters.classType === '' || filters.classType === 'PILATES') && (
                <optgroup label="Pilates">
                  <option value="PILATES|dropin">Drop-in</option>
                  <option value="PILATES|4pack">4 Class Pack</option>
                  <option value="PILATES|8pack">8 Class Pack</option>
                  <option value="PILATES|unlimited1">Unlimited Monthly</option>
                  <option value="PILATES|unlimited3">Unlimited 3 Month</option>
                  <option value="PILATES|unlimited6">Unlimited 6 Month</option>
                  <option value="PILATES|unlimited12">Unlimited 1 Year</option>
                </optgroup>
              )}
              {(filters.classType === '' || filters.classType === 'PRENATAL') && (
                <optgroup label="Prenatal">
                  <option value="PRENATAL|dropin">Drop-in</option>
                  <option value="PRENATAL|4pack">4 Class Pack</option>
                  <option value="PRENATAL|8pack">8 Class Pack</option>
                  <option value="PRENATAL|unlimited1">Unlimited Monthly</option>
                  <option value="PRENATAL|unlimited3">Unlimited 3 Month</option>
                  <option value="PRENATAL|unlimited6">Unlimited 6 Month</option>
                  <option value="PRENATAL|unlimited12">Unlimited 1 Year</option>
                </optgroup>
              )}
              {(filters.classType === '' || filters.classType === 'POSTPARTUM') && (
                <optgroup label="Postpartum">
                  <option value="POSTPARTUM|dropin">Drop-in</option>
                  <option value="POSTPARTUM|4pack">4 Class Pack</option>
                  <option value="POSTPARTUM|8pack">8 Class Pack</option>
                  <option value="POSTPARTUM|unlimited1">Unlimited Monthly</option>
                  <option value="POSTPARTUM|unlimited3">Unlimited 3 Month</option>
                  <option value="POSTPARTUM|unlimited6">Unlimited 6 Month</option>
                  <option value="POSTPARTUM|unlimited12">Unlimited 1 Year</option>
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="instructor" className="block text-sm font-medium text-aura-cream mb-1">
              Instructor
            </label>
            <select
              id="instructor"
              value={filters.instructor}
              onChange={(e) => handleFilterChange('instructor', e.target.value)}
              className="w-full px-3 py-2 border border-aura-sand/30 rounded-md focus:outline-none focus:ring-aura-sand focus:border-aura-sand bg-aura-bark text-aura-cream placeholder:text-aura-sand/70"
            >
              <option value="">All Instructors</option>
              {Array.from(new Set(classes.map(c => c.instructor).filter(Boolean))).sort().map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setFilters({ date: '', classType: '', instructor: '', packageType: '' })}
          className="mt-4 text-sm text-aura-cream hover:text-white"
        >
          Clear all filters
        </button>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-aura-cream">No classes found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              onBook={handleBookClick}
              onJoinWaitlist={handleJoinWaitlist}
              onWaitlist={waitlistedClassIds.includes(classItem.id)}
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
