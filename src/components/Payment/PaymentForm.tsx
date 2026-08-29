import React, { useState } from 'react';

interface PaymentFormProps {
  amount: number;
  packageId?: string;
  packageName?: string;
  onSuccess?: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  amount, 
  packageId, 
  packageName, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    paymentMethod: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CASH',
    receipt: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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

      setFormData(prev => ({
        ...prev,
        receipt: file,
      }));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.receipt && formData.paymentMethod !== 'CASH') {
      setError('Please upload your payment receipt');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to make a payment');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('amount', amount.toString());
      formDataToSend.append('paymentMethod', formData.paymentMethod);
      if (packageId) {
        formDataToSend.append('packageId', packageId);
      }
      if (formData.receipt) {
        formDataToSend.append('receipt', formData.receipt);
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setError('');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.error || 'Payment submission failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-success-bg border border-success-border rounded-lg p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-bg mb-4">
          <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-success mb-2">Payment Submitted!</h3>
        <p className="text-success mb-4">
          Your payment of ETB {amount.toLocaleString()} has been submitted for verification.
          We'll process it within 24 hours and notify you once it's approved.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-success hover:opacity-80 font-medium"
        >
          Make another payment
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-content mb-4">
        Complete Payment - ETB {amount.toLocaleString()}
      </h3>
      
      {packageName && (
        <div className="bg-accent-700/20 border border-accent-700/30 rounded-md p-3 mb-4">
          <p className="text-sm text-accent-200">
            <strong>Package:</strong> {packageName}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-2">
            Payment Method
          </label>
          <div className="space-y-2">
            {paymentMethods.map(method => (
              <label key={method.value} className="flex items-start">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={formData.paymentMethod === method.value}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-accent-600 focus:ring-accent-500 border-edge"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-content">{method.label}</span>
                  <p className="text-xs text-content-secondary">{method.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Bank Details for Bank Transfer */}
        {formData.paymentMethod === 'BANK_TRANSFER' && (
          <div className="bg-surface-sunken border border-edge rounded-md p-4">
            <h4 className="font-medium text-content mb-2">Bank Transfer Details</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Account Name:</strong> {bankDetails.accountName}</p>
              <p><strong>Bank:</strong> {bankDetails.bankName}</p>
              <p><strong>Account Number:</strong> {bankDetails.accountNumber}</p>
              <p><strong>Branch:</strong> {bankDetails.branch}</p>
            </div>
            <p className="text-xs text-content-secondary mt-2">
              Please upload your transfer receipt after making the payment.
            </p>
          </div>
        )}

        {/* Mobile Money Details */}
        {formData.paymentMethod === 'MOBILE_MONEY' && (
          <div className="bg-surface-sunken border border-edge rounded-md p-4">
            <h4 className="font-medium text-content mb-2">Mobile Money Details</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Telebirr:</strong> +251 900 410 603</p>
            </div>
            <p className="text-xs text-content-secondary mt-2">
              Please upload your transaction receipt after making the payment.
            </p>
          </div>
        )}

        {/* Cash Payment Info */}
        {formData.paymentMethod === 'CASH' && (
          <div className="bg-warning-bg border border-warning-border rounded-md p-4">
            <h4 className="font-medium text-warning mb-2">Cash Payment</h4>
            <p className="text-sm text-warning">
              Please visit our studio to make the cash payment. Our staff will verify your payment and activate your package immediately.
            </p>
            <div className="mt-2 text-sm text-warning">
              <p><strong>Address:</strong> Bole, Addis Ababa</p>
              <p><strong>Hours:</strong> Mon-Sat 6AM-8PM, Sun 7AM-12PM</p>
            </div>
          </div>
        )}

        {/* Receipt Upload */}
        {formData.paymentMethod !== 'CASH' && (
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">
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
                {formData.receipt ? (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-success">{formData.receipt.name}</p>
                    <p className="text-xs text-content-secondary">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-content-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-content-secondary">Click to upload receipt</p>
                    <p className="text-xs text-content-secondary">JPEG, PNG, GIF, or PDF (max 5MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-danger-bg border border-danger-border text-danger px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (formData.paymentMethod !== 'CASH' && !formData.receipt)}
          className="w-full bg-accent-600 text-content-on-accent py-2 px-4 rounded-md hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Payment'}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;
