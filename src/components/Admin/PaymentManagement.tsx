import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { EyeIcon, CheckCircleIcon, XCircleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  receiptUrl?: string;
  status: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  package?: {
    id: string;
    name: string;
  };
}

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState({
    status: '',
    paymentMethod: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [currentPage, filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filter.status && { status: filter.status }),
        ...(filter.paymentMethod && { paymentMethod: filter.paymentMethod }),
        ...(filter.search && { search: filter.search }),
      });
      
      const response = await fetch(`/api/admin/payments?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${response.status}`);
      }

      const data = await response.json();
      setPayments(data.payments || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setSuccessMessage(`Payment ${status.toLowerCase()} successfully!`);
        fetchPayments();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update payment status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-success-bg text-success border border-success-border';
      case 'REJECTED':
        return 'bg-danger-bg text-danger border border-danger-border';
      case 'PENDING':
        return 'bg-warning-bg text-warning border border-warning-border';
      default:
        return 'bg-aura-umber/40 text-aura-sand';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'BANK_TRANSFER':
        return 'bg-info-bg text-info border border-info-border';
      case 'MOBILE_MONEY':
        return 'bg-accent-100 text-accent-900 border border-accent-400';
      case 'CASH':
        return 'bg-success-bg text-success border border-success-border';
      default:
        return 'bg-aura-umber/40 text-aura-sand';
    }
  };

  const viewPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  const closeModal = () => {
    setShowDetails(false);
    setSelectedPayment(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-aura-cream">Payment Management</h1>
        <p className="text-aura-sand">Review and verify payment transactions</p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-success-bg border border-success-border text-success px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-danger-bg border border-danger-border text-danger px-4 py-3 rounded">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-success hover:text-success">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-aura-ink p-3 rounded-lg border border-aura-umber">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs font-medium text-aura-sand mb-0.5">Status</label>
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="w-full px-2.5 py-1.5 text-sm bg-canvas text-content border border-edge rounded-md focus:outline-none focus:ring-edge-focus"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-aura-sand mb-0.5">Method</label>
            <select
              name="paymentMethod"
              value={filter.paymentMethod}
              onChange={handleFilterChange}
              className="w-full px-2.5 py-1.5 text-sm bg-canvas text-content border border-edge rounded-md focus:outline-none focus:ring-edge-focus"
            >
              <option value="">All</option>
              <option value="BANK_TRANSFER">Bank</option>
              <option value="MOBILE_MONEY">Mobile</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-aura-sand mb-0.5">Search</label>
            <input
              type="text"
              name="search"
              value={filter.search}
              onChange={handleFilterChange}
              placeholder="Name or email"
              className="w-full px-2.5 py-1.5 text-sm bg-canvas text-content border border-edge rounded-md focus:outline-none focus:ring-edge-focus"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: '', paymentMethod: '', search: '' })}
              className="w-full px-2.5 py-1.5 text-sm border border-aura-umber rounded-md text-aura-sand hover:bg-aura-umber/30"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-aura-ink shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-aura-sand/10">
            <thead className="bg-aura-umber/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-aura-sand uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-aura-ink divide-y divide-aura-sand/10">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-aura-cream">{payment.user?.name || 'Unknown'}</div>
                      <div className="text-sm text-aura-sand">{payment.user?.email || ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-aura-cream">ETB {(payment.amount ?? 0).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentMethodColor(payment.paymentMethod)}`}>
                      {(payment.paymentMethod || '').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">
                      {payment.package?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-aura-cream">
                      {payment.createdAt ? format(new Date(payment.createdAt), 'MMM dd, yyyy') : ''}
                    </div>
                    <div className="text-xs text-aura-sand">
                      {payment.createdAt ? format(new Date(payment.createdAt), 'HH:mm') : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(prev => prev === payment.id ? null : payment.id); }}
                        className="text-aura-sand hover:text-aura-cream p-1"
                      >
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </button>
                      {openDropdown === payment.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-aura-ink border border-aura-umber rounded-md shadow-lg z-50 py-1">
                          <button
                            onClick={() => { viewPaymentDetails(payment); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                          >
                            <EyeIcon className="w-4 h-4 mr-2 text-accent-400" /> View
                          </button>
                          {payment.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => { handleVerifyPayment(payment.id, 'VERIFIED'); setOpenDropdown(null); }}
                                className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                              >
                                <CheckCircleIcon className="w-4 h-4 mr-2 text-success" /> Verify
                              </button>
                              <button
                                onClick={() => { handleVerifyPayment(payment.id, 'REJECTED'); setOpenDropdown(null); }}
                                className="flex items-center w-full px-4 py-2 text-sm text-danger hover:bg-[var(--state-hover)]"
                              >
                                <XCircleIcon className="w-4 h-4 mr-2" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {payments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-aura-sand">No payments found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-aura-umber rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-aura-umber rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Payment Details Modal */}
      {showDetails && selectedPayment && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4 z-[60]">
          <div className="bg-aura-ink rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Payment Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-aura-cream">User Information</h3>
                  <p className="text-sm text-aura-sand">{selectedPayment.user?.name || 'N/A'}</p>
                  <p className="text-sm text-aura-sand">{selectedPayment.user?.email || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-aura-cream">Payment Information</h3>
                  <p className="text-sm text-aura-sand">Amount: ETB {(selectedPayment.amount ?? 0).toLocaleString()}</p>
                  <p className="text-sm text-aura-sand">Method: {(selectedPayment.paymentMethod || '').replace('_', ' ')}</p>
                  <p className="text-sm text-aura-sand">Status: {selectedPayment.status}</p>
                </div>
              </div>
              
              {selectedPayment.package && (
                <div>
                  <h3 className="font-medium text-aura-cream">Package Information</h3>
                  <p className="text-sm text-aura-sand">{selectedPayment.package?.name || 'N/A'}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-aura-cream">Timeline</h3>
                <p className="text-sm text-aura-sand">Created: {selectedPayment.createdAt ? format(new Date(selectedPayment.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
                {selectedPayment.verifiedAt && (
                  <p className="text-sm text-aura-sand">Verified: {format(new Date(selectedPayment.verifiedAt), 'MMM dd, yyyy HH:mm')}</p>
                )}
              </div>
              
              {selectedPayment.receiptUrl && (
                <div>
                  <h3 className="font-medium text-aura-cream">Receipt</h3>
                  <a 
                    href={selectedPayment.receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent-400 hover:text-accent-700 text-sm"
                  >
                    View Receipt
                  </a>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              {selectedPayment.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      handleVerifyPayment(selectedPayment.id, 'VERIFIED');
                      closeModal();
                    }}
                    className="px-4 py-2 bg-success text-content-on-accent rounded-md hover:opacity-90"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => {
                      handleVerifyPayment(selectedPayment.id, 'REJECTED');
                      closeModal();
                    }}
                    className="px-4 py-2 bg-danger text-content-on-accent rounded-md hover:opacity-90"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-aura-umber rounded-md text-aura-sand hover:bg-aura-umber/30"
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

export default PaymentManagement;
