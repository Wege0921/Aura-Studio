import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

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
    fetchPayments();
  }, [currentPage, filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
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
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError('Failed to load payments');
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
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'BANK_TRANSFER':
        return 'bg-blue-100 text-blue-800';
      case 'MOBILE_MONEY':
        return 'bg-purple-100 text-purple-800';
      case 'CASH':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600">Review and verify payment transactions</p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-green-700 hover:text-green-600">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              name="paymentMethod"
              value={filter.paymentMethod}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
            >
              <option value="">All Methods</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              name="search"
              value={filter.search}
              onChange={handleFilterChange}
              placeholder="Search by name or email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: '', paymentMethod: '', search: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.user.name}</div>
                      <div className="text-sm text-gray-500">{payment.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">ETB {payment.amount.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentMethodColor(payment.paymentMethod)}`}>
                      {payment.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.package?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(payment.createdAt), 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewPaymentDetails(payment)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      View
                    </button>
                    {payment.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleVerifyPayment(payment.id, 'VERIFIED')}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(payment.id, 'REJECTED')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {payments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payments found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Payment Details Modal */}
      {showDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Payment Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">User Information</h3>
                  <p className="text-sm text-gray-600">{selectedPayment.user.name}</p>
                  <p className="text-sm text-gray-600">{selectedPayment.user.email}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Payment Information</h3>
                  <p className="text-sm text-gray-600">Amount: ETB {selectedPayment.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Method: {selectedPayment.paymentMethod.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-600">Status: {selectedPayment.status}</p>
                </div>
              </div>
              
              {selectedPayment.package && (
                <div>
                  <h3 className="font-medium text-gray-900">Package Information</h3>
                  <p className="text-sm text-gray-600">{selectedPayment.package.name}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-gray-900">Timeline</h3>
                <p className="text-sm text-gray-600">Created: {format(new Date(selectedPayment.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                {selectedPayment.verifiedAt && (
                  <p className="text-sm text-gray-600">Verified: {format(new Date(selectedPayment.verifiedAt), 'MMM dd, yyyy HH:mm')}</p>
                )}
              </div>
              
              {selectedPayment.receiptUrl && (
                <div>
                  <h3 className="font-medium text-gray-900">Receipt</h3>
                  <a 
                    href={selectedPayment.receiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
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
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => {
                      handleVerifyPayment(selectedPayment.id, 'REJECTED');
                      closeModal();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
