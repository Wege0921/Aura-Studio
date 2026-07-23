import React, { useState } from 'react';

interface PackageInfo {
  id: string;
  name: string;
  sessionsCount: number;
  price: number;
  validityDays?: number;
  classType?: string;
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string, receiptFile?: File) => void;
  packageInfo: PackageInfo | null;
  loading?: boolean;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  packageInfo,
  loading = false,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');

  if (!isOpen || !packageInfo) return null;

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
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Please upload a valid receipt (JPEG, PNG, GIF, or PDF)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }

      setReceiptFile(file);
      setUploadError('');
    }
  };

  const handleConfirm = () => {
    if (selectedPaymentMethod !== 'CASH' && !receiptFile) {
      setUploadError('Payment receipt is required for bank transfer and mobile money payments');
      return;
    }

    onConfirm(selectedPaymentMethod, receiptFile || undefined);
  };

  return (
    <div className="fixed inset-0 bg-aura-ink/50 overflow-y-auto h-full w-full z-[60] modal-scroll-safe">
      <div className="relative top-20 mx-auto p-5 pb-24 md:pb-5 border border-aura-umber w-full max-w-md shadow-lg shadow-black/30 rounded-xl bg-aura-bark">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-aura-cream">Purchase Package</h3>
            <button
              onClick={onClose}
              className="text-aura-clay hover:text-aura-cream"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-aura-sand mb-4">You are purchasing:</p>
            <div className="bg-aura-ink/40 p-4 rounded-lg">
              <h4 className="font-semibold text-aura-cream mb-2">{packageInfo.name}</h4>
              <div className="space-y-1 text-sm text-aura-sand">
                <p>Sessions: {packageInfo.sessionsCount}</p>
                {packageInfo.validityDays && (
                  <p>Validity: {packageInfo.validityDays} days</p>
                )}
                {packageInfo.classType && packageInfo.classType !== 'ALL' && (
                  <p>Type: {packageInfo.classType}</p>
                )}
                <p className="text-aura-cream font-medium">Price: ETB {packageInfo.price.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-medium text-aura-cream mb-3">Select Payment Method</h4>
            <div className="space-y-2">
              {paymentMethods.map(method => (
                <label key={method.value} className="flex items-start">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={selectedPaymentMethod === method.value}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mt-1 h-4 w-4 text-aura-umber focus:ring-aura-umber border-aura-umber"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-aura-cream">{method.label}</span>
                    <p className="text-xs text-aura-clay">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {selectedPaymentMethod === 'BANK_TRANSFER' && (
              <div className="mt-3 bg-aura-ink/40 border border-aura-umber rounded-md p-3">
                <p className="text-xs font-medium text-aura-cream mb-1">Bank Transfer Details</p>
                <div className="space-y-1 text-xs text-aura-sand">
                  <p><strong>Account:</strong> {bankDetails.accountName}</p>
                  <p><strong>Bank:</strong> {bankDetails.bankName}</p>
                  <p><strong>Number:</strong> {bankDetails.accountNumber}</p>
                </div>
              </div>
            )}

            {selectedPaymentMethod === 'MOBILE_MONEY' && (
              <div className="mt-3 bg-aura-ink/40 border border-aura-umber rounded-md p-3">
                <p className="text-xs font-medium text-aura-cream mb-1">Mobile Money Details</p>
                <div className="space-y-1 text-xs text-aura-sand">
                  <p><strong>Telebirr:</strong> +251 900 410 603</p>
                </div>
              </div>
            )}

            {selectedPaymentMethod === 'CASH' && (
              <div className="mt-3 bg-yellow-900/20 border border-yellow-700/30 rounded-md p-3">
                <p className="text-xs font-medium text-yellow-300 mb-1">Cash Payment</p>
                <p className="text-xs text-yellow-400/80">Please visit our studio to make the cash payment.</p>
              </div>
            )}

            {selectedPaymentMethod !== 'CASH' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-aura-cream mb-2">
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
                        <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-green-400">{receiptFile.name}</p>
                        <p className="text-xs text-aura-clay">Click to change file</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg className="mx-auto h-12 w-12 text-aura-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-aura-sand">Click to upload payment receipt</p>
                        <p className="text-xs text-aura-clay">JPEG, PNG, GIF, or PDF (max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mt-3 bg-red-900/30 border border-red-700/40 text-red-300 px-3 py-2 rounded text-sm">
                {uploadError}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-aura-cream bg-aura-sand/20 rounded-md hover:bg-aura-sand/30 focus:outline-none focus:ring-2 focus:ring-aura-sand"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || (selectedPaymentMethod !== 'CASH' && !receiptFile)}
              className="px-4 py-2 bg-aura-bark text-aura-ivory rounded-md hover:bg-aura-umber focus:outline-none focus:ring-2 focus:ring-aura-umber disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Confirm Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;
