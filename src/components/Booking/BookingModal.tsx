import React, { useState } from 'react';
import { format } from 'date-fns';

interface PackageOption {
  id: string;
  name: string;
  remainingSessions: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string, receiptFile?: File, usePackageSession?: boolean) => void;
  classInfo: {
    name: string;
    instructor: string;
    date: string;
    time: string;
    duration: number;
    price?: number;
  } | null;
  loading?: boolean;
  activePackages?: PackageOption[];
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  classInfo,
  loading = false,
  activePackages = [],
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [usePackageSession, setUsePackageSession] = useState<boolean>(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');

  if (!isOpen || !classInfo) return null;

  const paymentMethods = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', description: 'Transfer to our bank account' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money', description: 'Telebirr, M-Pesa, or other mobile money' },
    { value: 'CASH', label: 'Cash Payment', description: 'Pay in person at the studio' },
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
        setUploadError('Please upload a valid receipt (JPEG, PNG, GIF, or PDF)');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }

      setReceiptFile(file);
      setUploadError('');
    }
  };

  const handleConfirm = () => {
    if (usePackageSession) {
      onConfirm('PACKAGE_SESSION', undefined, true);
      return;
    }

    // Validate receipt requirement for non-cash payments
    if (selectedPaymentMethod !== 'CASH' && !receiptFile) {
      setUploadError('Payment receipt is required for bank transfer and mobile money payments');
      return;
    }

    onConfirm(selectedPaymentMethod, receiptFile || undefined, false);
  };

  return (
    <div className="fixed inset-0 bg-overlay/50 overflow-y-auto h-full w-full z-[60] modal-scroll-safe">
      <div className="relative top-20 mx-auto p-5 pb-24 md:pb-5 border border-edge w-full max-w-md shadow-elev-2 rounded-xl bg-canvas">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-content">Confirm Booking</h3>
            <button
              onClick={onClose}
              className="text-accent-600 hover:text-content"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-content-secondary mb-4">You're about to book:</p>
            <div className="bg-surface/40 p-4 rounded-lg">
              <h4 className="font-semibold text-content mb-2">{classInfo.name}</h4>
              <div className="space-y-1 text-sm text-content-secondary">
                <p>Instructor: {classInfo.instructor}</p>
                <p>Date: {format(new Date(classInfo.date), 'MMMM dd, yyyy')}</p>
                <p>Time: {classInfo.time}</p>
                <p>Duration: {classInfo.duration} minutes</p>
              </div>
            </div>
          </div>

          {/* Package Session Option */}
          {activePackages.length > 0 && (
            <div className="mb-6 bg-success-bg border border-success-border rounded-lg p-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={usePackageSession}
                  onChange={(e) => setUsePackageSession(e.target.checked)}
                  className="mt-1"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-success">Use Package Session</span>
                  <p className="text-xs text-success/80">
                    You have {activePackages[0].remainingSessions} session(s) remaining in {activePackages[0].name}
                  </p>
                </div>
              </label>
            </div>
          )}

          {!usePackageSession && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-content mb-3">Select Payment Method</h4>
              <div className="space-y-2">
                {paymentMethods.map(method => (
                  <label key={method.value} className="flex items-start">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={selectedPaymentMethod === method.value}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="mt-1 h-4 w-4 text-edge focus:ring-edge border-edge"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-content">{method.label}</span>
                      <p className="text-xs text-accent-600">{method.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Payment Details */}
              {selectedPaymentMethod === 'BANK_TRANSFER' && (
                <div className="mt-3 bg-surface/40 border border-edge rounded-md p-3">
                  <p className="text-xs font-medium text-content mb-1">Bank Transfer Details</p>
                  <div className="space-y-1 text-xs text-content-secondary">
                    <p><strong>Account:</strong> {bankDetails.accountName}</p>
                    <p><strong>Bank:</strong> {bankDetails.bankName}</p>
                    <p><strong>Number:</strong> {bankDetails.accountNumber}</p>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'MOBILE_MONEY' && (
                <div className="mt-3 bg-surface/40 border border-edge rounded-md p-3">
                  <p className="text-xs font-medium text-content mb-1">Mobile Money Details</p>
                  <div className="space-y-1 text-xs text-content-secondary">
                    <p><strong>Telebirr:</strong> +251 900 410 603</p>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'CASH' && (
                <div className="mt-3 bg-warning-bg border border-warning-border rounded-md p-3">
                  <p className="text-xs font-medium text-warning mb-1">Cash Payment</p>
                  <p className="text-xs text-warning/80">Please visit our studio to make the cash payment.</p>
                </div>
              )}

              {/* Receipt Upload for Non-Cash Payments */}
              {selectedPaymentMethod !== 'CASH' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-content mb-2">
                    Payment Receipt *
                  </label>
                  <div className="border-2 border-dashed border-edge rounded-lg p-4 text-center">
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
                          <svg className="mx-auto h-12 w-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-success">{receiptFile.name}</p>
                          <p className="text-xs text-accent-600">Click to change file</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <svg className="mx-auto h-12 w-12 text-content-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm text-content-secondary">Click to upload payment receipt</p>
                          <p className="text-xs text-accent-600">JPEG, PNG, GIF, or PDF (max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className="mt-3 bg-danger-bg border border-danger-border text-danger px-3 py-2 rounded text-sm">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-content bg-[var(--state-selected)] hover:bg-[var(--state-hover)] focus:outline-none focus:ring-2 focus:ring-content-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || (!usePackageSession && selectedPaymentMethod !== 'CASH' && !receiptFile)}
              className="px-4 py-2 bg-canvas text-content-emphasis rounded-md hover:bg-[var(--state-hover)] focus:outline-none focus:ring-2 focus:ring-edge disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
