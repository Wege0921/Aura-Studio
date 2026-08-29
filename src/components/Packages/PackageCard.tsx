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
      if (isExpired) return 'bg-[var(--state-hover)] text-content';
      if (userPackage.remainingSessions === 0) return 'bg-warning-bg text-warning';
      return 'bg-success-bg text-success';
    }
    return 'bg-[var(--state-hover)] text-content';
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
    <div className="bg-surface rounded-xl shadow-elev-1 p-6 hover:shadow-elev-2 transition-shadow duration-200 border border-edge">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-content">{pkg.name}</h3>
            {pkg.classType && pkg.classType !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--state-hover)] text-content">
                {pkg.classType}
              </span>
            )}
          </div>
          {pkg.description && (
            <p className="text-content-secondary text-sm mb-2">{pkg.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPackageTypeColor()}`}>
          {getPackageTypeText()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-content-secondary">Sessions:</span>
          <span className="text-sm font-medium text-content">
            {userPackage ? `${userPackage.remainingSessions} / ${pkg.sessionsCount}` : pkg.sessionsCount}
          </span>
        </div>
        
        {pkg.validityDays && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-content-secondary">Validity:</span>
            <span className="text-sm font-medium text-content">
              {pkg.validityDays} days
            </span>
          </div>
        )}
        
        {userPackage && userPackage.expiresAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-content-secondary">Expires:</span>
            <span className={`text-sm font-medium ${isExpired ? 'text-danger' : 'text-content'}`}>
              {format(new Date(userPackage.expiresAt), 'MMM dd, yyyy')}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-edge pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-content">
            ETB {pkg.price.toLocaleString()}
          </span>
          {pkg.sessionsCount > 1 && (
            <span className="text-sm text-content-secondary">
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
                ? 'bg-accent-200/40 text-accent-200 cursor-not-allowed'
                : loading
                ? 'bg-accent-500 text-content-on-accent cursor-wait'
                : 'bg-accent-600 text-content-on-accent hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2'
            }`}
          >
            {loading ? 'Processing...' : pkg.isActive ? 'Purchase Package' : 'Not Available'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="w-full bg-[var(--state-hover)] rounded-full h-2">
              <div
                className={`h-2 rounded-full ${isExpired ? 'bg-accent-600' : userPackage.remainingSessions === 0 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${Math.max((userPackage.remainingSessions / pkg.sessionsCount) * 100, 5)}%` }}
              ></div>
            </div>
            <p className="text-xs text-content-secondary text-center">
              {userPackage.remainingSessions} sessions remaining
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageCard;
