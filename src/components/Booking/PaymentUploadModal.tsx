import React, { useState } from 'react';

interface PaymentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  classInfo: {
    name: string;
    instructor: string;
    date: string;
    time: string;
    price?: number;
  };
  onSuccess: () => void;
}

const PaymentUploadModal: React.FC<PaymentUploadModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  classInfo,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const paymentMethods = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  ];

  const bankDetails = {
    accountName: 'AURA Pilates Studio (Helen Gebrehiwot)',
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    accountNumber: '1000367937762',
    branch: 'Addis Ababa',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid receipt (JPEG, PNG, GIF, or PDF)');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setReceiptFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receiptFile) {
      setError('Please upload your payment receipt');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to upload payment');
        return;
      }

      const formData = new FormData();
      formData.append('receipt', receiptFile);
      formData.append('paymentMethod', paymentMethod);

      const response = await fetch(`/api/bookings/${bookingId}/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Payment upload failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-[60] modal-scroll-safe">
      <div className="relative top-20 mx-auto p-5 pb-24 md:pb-5 border w-full max-w-md shadow-lg rounded-md bg-aura-ink">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-aura-cream">Upload Payment Receipt</h3>
            <button
              onClick={onClose}
              className="text-aura-sand hover:text-aura-cream"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-aura-sand mb-4">Please upload your payment receipt for:</p>
            <div className="bg-purple-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-200 mb-2">{classInfo.name}</h4>
              <div className="space-y-1 text-sm text-purple-300">
                <p>Instructor: {classInfo.instructor}</p>
                <p>Date: {new Date(classInfo.date).toLocaleDateString()}</p>
                <p>Time: {classInfo.time}</p>
                {classInfo.price && <p className="font-semibold">Amount: ETB {classInfo.price.toLocaleString()}</p>}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-aura-sand mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-aura-umber rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Details */}
            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="bg-aura-umber/30 border border-aura-umber rounded-md p-3">
                <p className="text-xs font-medium text-aura-cream mb-1">Bank Transfer Details</p>
                <div className="space-y-1 text-xs text-aura-sand">
                  <p><strong>Account:</strong> {bankDetails.accountName}</p>
                  <p><strong>Bank:</strong> {bankDetails.bankName}</p>
                  <p><strong>Number:</strong> {bankDetails.accountNumber}</p>
                </div>
              </div>
            )}

            {/* Receipt Upload */}
            <div>
              <label className="block text-sm font-medium text-aura-sand mb-2">
                Payment Receipt *
              </label>
              <div className="border-2 border-dashed border-aura-umber rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="receipt"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="receipt" className="cursor-pointer">
                  {receiptFile ? (
                    <div className="space-y-2">
                      <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-green-400">{receiptFile.name}</p>
                      <p className="text-xs text-aura-sand">Click to change file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="mx-auto h-12 w-12 text-aura-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-aura-sand">Click to upload receipt</p>
                      <p className="text-xs text-aura-sand">JPEG, PNG, GIF, or PDF (max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/60 border border-red-600/40 text-red-200 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-aura-sand bg-aura-umber/40 rounded-md hover:bg-aura-umber/60 focus:outline-none focus:ring-2 focus:ring-aura-clay"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !receiptFile}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload Receipt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentUploadModal;
