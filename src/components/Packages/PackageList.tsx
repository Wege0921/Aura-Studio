import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSEO } from '../../hooks/useSEO';
import PackageCard from './PackageCard';
import PurchaseModal from './PurchaseModal';
import { api } from '../../lib/api';

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

interface PackageListProps {
  showUserPackages?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  PILATES: 'Pilates',
  PRENATAL: 'Prenatal',
  POSTPARTUM: 'Postpartum',
};

const PackageList: React.FC<PackageListProps> = ({ showUserPackages = false }) => {
  useSEO({ title: 'Packages — AURA Studio' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [classTypeFilter, setClassTypeFilter] = useState<string>('');
  const [sessionsFilter, setSessionsFilter] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('');
  const [validityFilter, setValidityFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  const token = localStorage.getItem('token');

  const { data: packagesData, isLoading: loading, error: packagesError } = useQuery<Package[]>({
    queryKey: ['packages-available'],
    queryFn: () => api.get<Package[]>('/api/packages/available'),
  });
  const packages: Package[] = packagesData ?? [];

  const { data: userPackagesData } = useQuery<UserPackage[]>({
    queryKey: ['my-packages'],
    queryFn: () => api.get<UserPackage[]>('/api/packages/my-packages'),
    enabled: !!token && !showUserPackages,
  });
  const userPackages: UserPackage[] = userPackagesData ?? [];

  const error = packagesError ? (packagesError as Error).message : '';

  // Sync URL classType param with filter state
  useEffect(() => {
    const urlType = searchParams.get('classType');
    if (urlType) {
      setClassTypeFilter(urlType.toUpperCase());
    }
  }, [searchParams]);

  const handlePurchase = (packageId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?returnTo=/packages');
      return;
    }

    const pkg = packages.find(p => p.id === packageId);
    if (pkg) {
      setSelectedPackage(pkg);
      setShowPurchaseModal(true);
    }
  };

  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const handleConfirmPurchase = async (paymentMethod: string, receiptFile?: File) => {
    if (!selectedPackage) return;
    try {
      setPurchaseLoading(true);
      setPurchasing(selectedPackage.id);
      const formData = new FormData();
      formData.append('packageId', selectedPackage.id);
      formData.append('paymentMethod', paymentMethod);
      if (receiptFile) formData.append('paymentReceipt', receiptFile);
      const data = await api.postForm<{ message?: string; error?: string }>('/api/packages/purchase', formData);
      setSuccessMessage(data.message || 'Purchase request submitted successfully!');
      setShowPurchaseModal(false);
      setSelectedPackage(null);
      queryClient.invalidateQueries({ queryKey: ['my-packages'] });
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setPurchaseError((err as Error).message || 'Purchase failed');
    } finally {
      setPurchaseLoading(false);
      setPurchasing(null);
    }
  };

  // Apply all filters (case-insensitive for backwards compatibility)
  const filteredPackages = packages.filter(pkg => {
    const pkgType = (pkg.classType || 'ALL').toUpperCase();
    if (classTypeFilter && pkgType !== classTypeFilter) return false;

    if (sessionsFilter) {
      if (sessionsFilter === 'unlimited') {
        if (pkg.sessionsCount !== 999 && pkg.sessionsCount < 100) return false;
      } else {
        if (pkg.sessionsCount !== parseInt(sessionsFilter, 10)) return false;
      }
    }

    if (priceFilter) {
      if (priceFilter === 'under5000' && pkg.price >= 5000) return false;
      if (priceFilter === '5000to10000' && (pkg.price < 5000 || pkg.price > 10000)) return false;
      if (priceFilter === 'over10000' && pkg.price <= 10000) return false;
    }

    if (validityFilter) {
      if (validityFilter === 'unlimited') {
        if (pkg.validityDays) return false;
      } else {
        const days = parseInt(validityFilter, 10);
        if (pkg.validityDays !== days) return false;
      }
    }

    return true;
  });

  // Combine available packages with user packages for rendering
  const packagesWithUserPackages = (pkgs: Package[]) => pkgs.map(pkg => {
    const userPackage = userPackages.find(up => up.package.id === pkg.id);
    return { package: pkg, userPackage };
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aura-umber"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="bg-green-900/60 border border-green-600/40 text-green-200 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {(error || purchaseError) && (
        <div className="bg-red-900/60 border border-red-600/40 text-red-200 px-4 py-3 rounded">
          {error || purchaseError}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-aura-cream mb-2">
          {showUserPackages ? 'My Packages' : 'Available Packages'}
        </h2>
        <p className="text-aura-sand">
          {showUserPackages
            ? 'Manage your purchased packages and track remaining sessions'
            : 'Choose the perfect package for your pilates journey'
          }
        </p>
      </div>

      {/* User Packages Summary (when not showing only user packages) */}
      {!showUserPackages && userPackages.length > 0 && (
        <div className="bg-aura-ink border border-aura-sand/10 rounded-xl p-6 shadow-lg shadow-black/20">
          <h3 className="text-lg font-semibold text-aura-cream mb-4">Your Active Packages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userPackages
              .filter(up => up.remainingSessions > 0 && (!up.expiresAt || new Date(up.expiresAt) >= new Date()))
              .map(userPackage => (
                <div key={userPackage.id} className="bg-aura-bark rounded-lg p-4 shadow-sm border border-aura-sand/10">
                  <h4 className="font-medium text-aura-cream">{userPackage.package.name}</h4>
                  <p className="text-sm text-aura-sand mt-1">
                    {userPackage.remainingSessions} sessions remaining
                  </p>
                  {userPackage.expiresAt && (
                    <p className="text-xs text-aura-clay mt-1">
                      Expires {new Date(userPackage.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {!showUserPackages && (
        <div className="bg-aura-ink p-3 rounded-lg border border-aura-sand/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label htmlFor="pkg-classType" className="block text-xs font-medium text-aura-sand/70 mb-0.5">Type</label>
              <select
                id="pkg-classType"
                value={classTypeFilter}
                onChange={(e) => { setClassTypeFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 text-sm border border-aura-sand/30 rounded-md focus:outline-none focus:ring-aura-sand focus:border-aura-sand bg-aura-bark text-aura-cream placeholder:text-aura-sand/70"
              >
                <option value="">All</option>
                <option value="PILATES">Pilates</option>
                <option value="PRENATAL">Prenatal</option>
                <option value="POSTPARTUM">Postpartum</option>
              </select>
            </div>

            <div>
              <label htmlFor="pkg-sessions" className="block text-xs font-medium text-aura-sand/70 mb-0.5">Sessions</label>
              <select
                id="pkg-sessions"
                value={sessionsFilter}
                onChange={(e) => { setSessionsFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 text-sm border border-aura-sand/30 rounded-md focus:outline-none focus:ring-aura-sand focus:border-aura-sand bg-aura-bark text-aura-cream placeholder:text-aura-sand/70"
              >
                <option value="">All</option>
                <option value="1">1 (Drop-in)</option>
                <option value="4">4 Pack</option>
                <option value="8">8 Pack</option>
                <option value="12">12 Pack</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>

            <div>
              <label htmlFor="pkg-price" className="block text-xs font-medium text-aura-sand/70 mb-0.5">Price</label>
              <select
                id="pkg-price"
                value={priceFilter}
                onChange={(e) => { setPriceFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 text-sm border border-aura-sand/30 rounded-md focus:outline-none focus:ring-aura-sand focus:border-aura-sand bg-aura-bark text-aura-cream placeholder:text-aura-sand/70"
              >
                <option value="">All</option>
                <option value="under5000">Under ETB 5,000</option>
                <option value="5000to10000">ETB 5,000 - 10,000</option>
                <option value="over10000">Over ETB 10,000</option>
              </select>
            </div>

            <div>
              <label htmlFor="pkg-validity" className="block text-xs font-medium text-aura-sand/70 mb-0.5">Validity</label>
              <select
                id="pkg-validity"
                value={validityFilter}
                onChange={(e) => { setValidityFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-2.5 py-1.5 text-sm border border-aura-sand/30 rounded-md focus:outline-none focus:ring-aura-sand focus:border-aura-sand bg-aura-bark text-aura-cream placeholder:text-aura-sand/70"
              >
                <option value="">All</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => { setClassTypeFilter(''); setSessionsFilter(''); setPriceFilter(''); setValidityFilter(''); setCurrentPage(1); }}
            className="mt-2 text-xs text-aura-sand/70 hover:text-aura-cream"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => { setShowPurchaseModal(false); setSelectedPackage(null); }}
        onConfirm={handleConfirmPurchase}
        packageInfo={selectedPackage}
        loading={purchaseLoading}
      />

      {/* Packages Grid */}
      {filteredPackages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-aura-cream">
            {showUserPackages ? 'No packages found.' : 'No packages available at the moment.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {(() => {
              const paginated = filteredPackages.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
              const grouped = paginated.reduce<Record<string, Package[]>>((acc, pkg) => {
                const type = (pkg.classType || 'ALL').toUpperCase();
                if (!acc[type]) acc[type] = [];
                acc[type].push(pkg);
                return acc;
              }, {});
              return Object.entries(grouped).map(([classType, pkgs]) => (
                <div key={classType}>
                  {classTypeFilter === '' && (
                    <h3 className="text-lg font-semibold text-aura-cream mb-4 font-serif">
                      {CATEGORY_LABELS[classType] || classType}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packagesWithUserPackages(pkgs).map(({ package: pkg, userPackage }) => (
                      <PackageCard
                        key={pkg.id}
                        package={pkg}
                        userPackage={userPackage}
                        onPurchase={handlePurchase}
                        loading={purchasing === pkg.id}
                      />
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Pagination */}
          {filteredPackages.length > ITEMS_PER_PAGE && (
            <div className="bg-aura-ink px-4 py-3 mt-6 mb-20 flex items-center justify-between border border-aura-sand/10 rounded-lg">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-aura-sand/20 text-sm font-medium rounded-md text-aura-sand bg-aura-ink hover:bg-aura-umber/30 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredPackages.length / ITEMS_PER_PAGE), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredPackages.length / ITEMS_PER_PAGE)}
                  className="relative inline-flex items-center px-4 py-2 border border-aura-sand/20 text-sm font-medium rounded-md text-aura-sand bg-aura-ink hover:bg-aura-umber/30 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-aura-sand">
                    Showing <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPackages.length)}</span> of <span className="font-medium">{filteredPackages.length}</span> results
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
                    {Array.from({ length: Math.ceil(filteredPackages.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
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
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredPackages.length / ITEMS_PER_PAGE), prev + 1))}
                      disabled={currentPage === Math.ceil(filteredPackages.length / ITEMS_PER_PAGE)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-aura-sand/20 bg-aura-ink text-sm font-medium text-aura-sand hover:bg-aura-umber/30 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PackageList;
