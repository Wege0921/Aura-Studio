import React from 'react';
import { format } from 'date-fns';

interface Package {
  id: string;
  name: string;
  description?: string;
  sessionsCount: number;
  price: number;
  validityDays?: number;
  classType?: string;
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
      if (isExpired) return 'bg-aura-sand/15 text-aura-cream';
      if (userPackage.remainingSessions === 0) return 'bg-yellow-900/30 text-yellow-300';
      return 'bg-green-900/30 text-green-300';
    }
    return 'bg-aura-sand/15 text-aura-cream';
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
    <div className="bg-aura-ink rounded-xl shadow-lg shadow-black/20 p-6 hover:shadow-xl transition-shadow duration-200 border border-aura-umber">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-aura-cream">{pkg.name}</h3>
            {pkg.classType && pkg.classType !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-aura-sand/15 text-aura-cream">
                {pkg.classType}
              </span>
            )}
          </div>
          {pkg.description && (
            <p className="text-aura-sand text-sm mb-2">{pkg.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPackageTypeColor()}`}>
          {getPackageTypeText()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-aura-sand">Sessions:</span>
          <span className="text-sm font-medium text-aura-cream">
            {userPackage ? `${userPackage.remainingSessions} / ${pkg.sessionsCount}` : pkg.sessionsCount}
          </span>
        </div>
        
        {pkg.validityDays && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-aura-sand">Validity:</span>
            <span className="text-sm font-medium text-aura-cream">
              {pkg.validityDays} days
            </span>
          </div>
        )}
        
        {userPackage && userPackage.expiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-aura-sand">Expires:</span>
            <span className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-aura-cream'}`}>
              {format(new Date(userPackage.expiresAt), 'MMM dd, yyyy')}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-aura-umber pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-aura-cream">
            ETB {pkg.price.toLocaleString()}
          </span>
          {pkg.sessionsCount > 1 && (
            <span className="text-sm text-aura-sand">
              ETB {(pkg.price / pkg.sessionsCount).toFixed(0)} per session
            </span>
          )}
        </div>

        {!userPackage ? (
          <button
            onClick={handlePurchaseClick}
            disabled={loading || !pkg.isActive}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              !pkg.isActive
                ? 'bg-purple-300/40 text-purple-200 cursor-not-allowed'
                : loading
                ? 'bg-purple-500 text-white cursor-wait'
                : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
            }`}
          >
            {loading ? 'Processing...' : pkg.isActive ? 'Purchase Package' : 'Not Available'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="w-full bg-aura-sand/10 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${isExpired ? 'bg-aura-clay' : userPackage.remainingSessions === 0 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.max((userPackage.remainingSessions / pkg.sessionsCount) * 100, 5)}%` }}
              ></div>
            </div>
            <p className="text-xs text-aura-sand text-center">
              {userPackage.remainingSessions} sessions remaining
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageCard;
