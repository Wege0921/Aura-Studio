import React from 'react';
import { format } from 'date-fns';

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

interface PackageCardProps {
  package: Package;
  userPackage?: UserPackage;
  onPurchase?: (packageId: string) => void;
  loading?: boolean;
}

const PackageCard: React.FC<PackageCardProps> = ({ 
  package: pkg, 
  userPackage, 
  onPurchase, 
  loading = false 
}) => {
  const isExpired = userPackage && userPackage.expiresAt 
    ? new Date(userPackage.expiresAt) < new Date() 
    : false;

  const getPackageTypeColor = () => {
    if (userPackage) {
      if (isExpired) return 'bg-gray-100 text-gray-800';
      if (userPackage.remainingSessions === 0) return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
    }
    return 'bg-purple-100 text-purple-800';
  };

  const getPackageTypeText = () => {
    if (userPackage) {
      if (isExpired) return 'Expired';
      if (userPackage.remainingSessions === 0) return 'Used Up';
      return 'Active';
    }
    return 'Available';
  };

  const handlePurchaseClick = () => {
    if (onPurchase && !userPackage) {
      onPurchase(pkg.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{pkg.name}</h3>
          {pkg.description && (
            <p className="text-gray-600 text-sm mb-2">{pkg.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPackageTypeColor()}`}>
          {getPackageTypeText()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Sessions:</span>
          <span className="text-sm font-medium text-gray-900">
            {userPackage ? `${userPackage.remainingSessions} / ${pkg.sessionsCount}` : pkg.sessionsCount}
          </span>
        </div>
        
        {pkg.validityDays && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Validity:</span>
            <span className="text-sm font-medium text-gray-900">
              {pkg.validityDays} days
            </span>
          </div>
        )}
        
        {userPackage && userPackage.expiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Expires:</span>
            <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
              {format(new Date(userPackage.expiresAt), 'MMM dd, yyyy')}
            </span>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-gray-900">
            ETB {pkg.price.toLocaleString()}
          </span>
          {pkg.sessionsCount > 1 && (
            <span className="text-sm text-gray-600">
              ETB {(pkg.price / pkg.sessionsCount).toFixed(0)} per session
            </span>
          )}
        </div>

        {!userPackage ? (
          <button
            onClick={handlePurchaseClick}
            disabled={loading || !pkg.isActive}
            className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              !pkg.isActive
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : loading
                ? 'bg-purple-600 text-white cursor-wait'
                : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
            }`}
          >
            {loading ? 'Processing...' : pkg.isActive ? 'Purchase Package' : 'Not Available'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${isExpired ? 'bg-gray-400' : userPackage.remainingSessions === 0 ? 'bg-yellow-400' : 'bg-green-400'}`}
                style={{ width: `${Math.max((userPackage.remainingSessions / pkg.sessionsCount) * 100, 5)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 text-center">
              {userPackage.remainingSessions} sessions remaining
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageCard;
