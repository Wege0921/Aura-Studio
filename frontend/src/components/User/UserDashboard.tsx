import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { format, isAfter, addDays } from 'date-fns';

interface Booking {
  id: string;
  status: string;
  createdAt: string;
  class: {
    id: string;
    name: string;
    instructor: string;
    date: string;
    time: string;
  };
}

interface UserPackage {
  id: string;
  status: string;
  remainingSessions?: number;
  package: {
    id: string;
    name: string;
    sessions: number;
    price: number;
    duration: number;
  };
  expiresAt?: string;
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user bookings
      const bookingsResponse = await fetch('/api/bookings/my-bookings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      // Fetch user packages
      const packagesResponse = await fetch('/api/packages/my-packages', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        // Filter for upcoming classes
        const upcoming = bookingsData?.filter((booking: Booking) => {
          const classDate = new Date(booking.class.date);
          const now = new Date();
          return isAfter(classDate, now) && booking.status === 'CONFIRMED';
        }).slice(0, 2); // Show only next 2 classes
        setUpcomingBookings(upcoming || []);
      }

      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setUserPackages(packagesData || []);
      }
    } catch (err) {
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookClass = () => {
    window.location.href = '/classes';
  };

  const handleBuyPackage = () => {
    window.location.href = '/packages';
  };

  const handleViewSchedule = () => {
    window.location.href = '/classes';
  };

  const getPackageStatus = (userPackage: UserPackage) => {
    if (userPackage.expiresAt) {
      const expiryDate = new Date(userPackage.expiresAt);
      const now = new Date();
      if (isAfter(now, expiryDate)) {
        return { text: 'Expired', color: 'text-red-900', border: 'border-red-200' };
      }
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) {
        return { text: `Expires in ${daysLeft} days`, color: 'text-yellow-900', border: 'border-yellow-200' };
      }
      return { text: `Expires in ${daysLeft} days`, color: 'text-green-900', border: 'border-green-200' };
    }
    return { text: 'Active', color: 'text-green-900', border: 'border-green-200' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mb-6">
          Here's your personal yoga dashboard. View your upcoming classes, manage bookings, and track your progress.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Classes</h2>
          <div className="space-y-3">
            {upcomingBookings.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming classes booked</p>
            ) : (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="border-l-4 border-purple-200 pl-4">
                  <div className="text-sm">
                    <p className="font-medium text-purple-900">{booking.class.name}</p>
                    <p className="text-gray-600">
                      {format(new Date(booking.class.date), 'MMM dd')} at {booking.class.time}
                    </p>
                    <p className="text-xs text-gray-500">with {booking.class.instructor}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Packages</h2>
          <div className="space-y-3">
            {userPackages.length === 0 ? (
              <p className="text-gray-500 text-sm">No active packages</p>
            ) : (
              userPackages.map((userPackage) => {
                const status = getPackageStatus(userPackage);
                return (
                  <div key={userPackage.id} className={`border-l-4 ${status.border} pl-4`}>
                    <div className="text-sm">
                      <p className={`font-medium ${status.color}`}>{userPackage.package.name}</p>
                      <p className="text-gray-600">
                        {userPackage.remainingSessions !== undefined 
                          ? `${userPackage.remainingSessions} sessions remaining` 
                          : 'Unlimited sessions'
                        }
                      </p>
                      <p className="text-xs text-gray-500">{status.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              onClick={handleBookClass}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
            >
              Book a Class
            </button>
            <button 
              onClick={handleBuyPackage}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Buy a Package
            </button>
            <button 
              onClick={handleViewSchedule}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              View Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
