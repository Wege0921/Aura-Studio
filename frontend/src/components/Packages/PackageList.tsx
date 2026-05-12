import React, { useState, useEffect } from 'react';
import PackageCard from './PackageCard';

interface Package {
  id: string;
  name: string;
  description?: string;
  sessionsCount: number;
  price: number;
  validityDays?: number;
  isActive: boolean;
}

interface UserPackage {
  id: string;
  remainingSessions: number;
  expiresAt?: string;
  createdAt: string;
  package: Package;
}

interface PackageListProps {
  showUserPackages?: boolean;
}

const PackageList: React.FC<PackageListProps> = ({ showUserPackages = false }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [showUserPackages]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch available packages
      const packagesResponse = await fetch('/api/packages/available');
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setPackages(packagesData);
      }

      // Fetch user packages if authenticated
      const token = localStorage.getItem('token');
      if (token && !showUserPackages) {
        const userPackagesResponse = await fetch('/api/packages/my-packages', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (userPackagesResponse.ok) {
          const userPackagesData = await userPackagesResponse.json();
          setUserPackages(userPackagesData);
        }
      }
    } catch (err) {
      setError('Failed to load packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasing(packageId);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to purchase packages');
        return;
      }

      const response = await fetch('/api/packages/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Package purchased successfully!');
        // Refresh user packages
        fetchData();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || 'Purchase failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  // Combine available packages with user packages
  const packagesWithUserPackages = packages.map(pkg => {
    const userPackage = userPackages.find(up => up.package.id === pkg.id);
    return {
      package: pkg,
      userPackage,
    };
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

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

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {showUserPackages ? 'My Packages' : 'Available Packages'}
        </h2>
        <p className="text-gray-600">
          {showUserPackages 
            ? 'Manage your purchased packages and track remaining sessions'
            : 'Choose the perfect package for your yoga journey'
          }
        </p>
      </div>

      {/* User Packages Summary (when not showing only user packages) */}
      {!showUserPackages && userPackages.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">Your Active Packages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userPackages
              .filter(up => up.remainingSessions > 0 && (!up.expiresAt || new Date(up.expiresAt) >= new Date()))
              .map(userPackage => (
                <div key={userPackage.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-medium text-gray-900">{userPackage.package.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {userPackage.remainingSessions} sessions remaining
                  </p>
                  {userPackage.expiresAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Expires {new Date(userPackage.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Packages Grid */}
      {packagesWithUserPackages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {showUserPackages ? 'No packages found.' : 'No packages available at the moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packagesWithUserPackages.map(({ package: pkg, userPackage }) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              userPackage={userPackage}
              onPurchase={handlePurchase}
              loading={purchasing === pkg.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PackageList;
