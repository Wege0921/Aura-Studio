import React, { useState, useEffect } from 'react';
import { subscribeToPushNotifications } from '../../utils/serviceWorkerRegistration';

interface NotificationPreferences {
  bookingReminders: boolean;
  classReminders: boolean;
  paymentConfirmations: boolean;
  promotionalOffers: boolean;
  newsletter: boolean;
}

const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    bookingReminders: true,
    classReminders: true,
    paymentConfirmations: true,
    promotionalOffers: false,
    newsletter: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    fetchPreferences();
    checkPushPermission();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPushPermission = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushEnabled(Notification.permission === 'granted');
    }
  };

  const handleTogglePush = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    if (pushEnabled) {
      // Disable push notifications
      setPushEnabled(false);
      // Note: Browser doesn't allow programmatic unsubscription
      // User needs to disable through browser settings
    } else {
      // Request permission and subscribe
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        try {
          await subscribeToPushNotifications();
          setPushEnabled(true);
        } catch (error) {
          console.error('Error subscribing to push notifications:', error);
          alert('Failed to enable push notifications');
        }
      }
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        alert('Notification preferences saved successfully');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      alert('Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Settings</h2>
      
      {/* Push Notifications Toggle */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-600">Receive notifications even when the app is closed</p>
          </div>
          <button
            onClick={handleTogglePush}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              pushEnabled ? 'bg-purple-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                pushEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {pushEnabled && (
          <p className="text-sm text-green-600">✓ Push notifications are enabled</p>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Types</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Booking Reminders</label>
              <p className="text-xs text-gray-500">Get reminded about upcoming classes</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('bookingReminders')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.bookingReminders ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.bookingReminders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Class Reminders</label>
              <p className="text-xs text-gray-500">Notifications 1 hour before class starts</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('classReminders')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.classReminders ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.classReminders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Payment Confirmations</label>
              <p className="text-xs text-gray-500">Confirmations when payments are processed</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('paymentConfirmations')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.paymentConfirmations ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.paymentConfirmations ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Promotional Offers</label>
              <p className="text-xs text-gray-500">Special deals and package discounts</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('promotionalOffers')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.promotionalOffers ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.promotionalOffers ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Newsletter</label>
              <p className="text-xs text-gray-500">Weekly wellness tips and studio updates</p>
            </div>
            <button
              onClick={() => handlePreferenceChange('newsletter')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.newsletter ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.newsletter ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={savePreferences}
            disabled={isSaving}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
