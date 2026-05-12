import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  category: 'BOOKING' | 'PAYMENT' | 'REMINDER' | 'PROMOTION' | 'SYSTEM';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationSettings {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  preferences: {
    bookingReminders: boolean;
    paymentConfirmations: boolean;
    classReminders: boolean;
    promotionalOffers: boolean;
    systemUpdates: boolean;
    newsletter: boolean;
  };
  frequency: 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';
}

interface NotificationLog {
  id: string;
  userId?: string;
  templateId?: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  category: 'BOOKING' | 'PAYMENT' | 'REMINDER' | 'PROMOTION' | 'SYSTEM';
  subject?: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt?: string;
  deliveredAt?: string;
  error?: string;
  metadata?: Record<string, any>;
}

interface ScheduledNotification {
  id: string;
  templateId: string;
  scheduledFor: string;
  targetAudience: string;
  status: 'SCHEDULED' | 'SENT' | 'CANCELLED';
  metadata?: Record<string, any>;
}

const NotificationSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [settings, setSettings] = useState<NotificationSettings[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Template form state
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'EMAIL' as const,
    category: 'BOOKING' as const,
    subject: '',
    content: '',
    isActive: true,
  });

  // Schedule form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    templateId: '',
    scheduledFor: '',
    targetAudience: 'ALL',
  });

  useEffect(() => {
    fetchNotificationData();
  }, [activeTab]);

  const fetchNotificationData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoints = {
        templates: '/api/admin/notifications/templates',
        settings: '/api/admin/notifications/settings',
        logs: '/api/admin/notifications/logs',
        scheduled: '/api/admin/notifications/scheduled',
      };

      if (activeTab === 'templates') {
        const response = await fetch(endpoints.templates, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } else if (activeTab === 'settings') {
        const response = await fetch(endpoints.settings, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } else if (activeTab === 'logs') {
        const response = await fetch(endpoints.logs, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        }
      } else if (activeTab === 'scheduled') {
        const response = await fetch(endpoints.scheduled, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setScheduledNotifications(data);
        }
      }
    } catch (err) {
      setError('Failed to load notification data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/notifications/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(templateForm),
      });

      if (response.ok) {
        setSuccessMessage('Template created successfully!');
        setShowTemplateForm(false);
        setTemplateForm({
          name: '',
          type: 'EMAIL',
          category: 'BOOKING',
          subject: '',
          content: '',
          isActive: true,
        });
        fetchNotificationData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create template');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleScheduleNotification = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(scheduleForm),
      });

      if (response.ok) {
        setSuccessMessage('Notification scheduled successfully!');
        setShowScheduleForm(false);
        setScheduleForm({
          templateId: '',
          scheduledFor: '',
          targetAudience: 'ALL',
        });
        fetchNotificationData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to schedule notification');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleToggleTemplate = async (templateId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/notifications/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setSuccessMessage(`Template ${isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchNotificationData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update template');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleCancelScheduled = async (scheduledId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/notifications/scheduled/${scheduledId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Scheduled notification cancelled successfully!');
        fetchNotificationData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to cancel scheduled notification');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleSendTestNotification = async (templateId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/notifications/templates/${templateId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ testEmail: 'admin@example.com' }),
      });

      if (response.ok) {
        setSuccessMessage('Test notification sent successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send test notification');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'EMAIL': return 'bg-blue-100 text-blue-800';
      case 'SMS': return 'bg-green-100 text-green-800';
      case 'PUSH': return 'bg-purple-100 text-purple-800';
      case 'IN_APP': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'BOOKING': return 'bg-indigo-100 text-indigo-800';
      case 'PAYMENT': return 'bg-green-100 text-green-800';
      case 'REMINDER': return 'bg-yellow-100 text-yellow-800';
      case 'PROMOTION': return 'bg-purple-100 text-purple-800';
      case 'SYSTEM': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'SCHEDULED': return 'bg-purple-100 text-purple-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification System</h1>
          <p className="text-gray-600">Manage templates, settings, and notification delivery</p>
        </div>
        {activeTab === 'templates' && (
          <button
            onClick={() => setShowTemplateForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Create Template
          </button>
        )}
        {activeTab === 'scheduled' && (
          <button
            onClick={() => setShowScheduleForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Schedule Notification
          </button>
        )}
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['templates', 'settings', 'logs', 'scheduled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variables</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{template.content}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getNotificationTypeColor(template.type)}`}>
                          {template.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(template.category)}`}>
                          {template.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {template.subject || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((variable, index) => (
                            <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              {variable}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleSendTestNotification(template.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => handleToggleTemplate(template.id, !template.isActive)}
                          className={`mr-3 ${template.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {template.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Global Notification Settings</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Channels</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-purple-600" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-purple-600" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">SMS Notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-purple-600" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">Push Notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-purple-600" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">In-App Notifications</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Default Frequency</h4>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500">
                      <option value="IMMEDIATE">Immediate</option>
                      <option value="DAILY_DIGEST">Daily Digest</option>
                      <option value="WEEKLY_DIGEST">Weekly Digest</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Categories</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-purple-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Booking Reminders</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-purple-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Payment Confirmations</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-purple-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Class Reminders</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-purple-600" />
                      <span className="ml-2 text-sm text-gray-700">Promotional Offers</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-purple-600" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">System Updates</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-purple-600" />
                      <span className="ml-2 text-sm text-gray-700">Newsletter</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.sentAt ? format(new Date(log.sentAt), 'MMM dd, HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getNotificationTypeColor(log.type)}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(log.category)}`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.subject || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.userId || 'System'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.error && (
                          <span className="text-red-600" title={log.error}>
                            Error
                          </span>
                        )}
                        {log.deliveredAt && (
                          <span className="text-green-600">
                            Delivered
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Notifications Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled For</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Audience</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scheduledNotifications.map((scheduled) => (
                    <tr key={scheduled.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(scheduled.scheduledFor), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {templates.find(t => t.id === scheduled.templateId)?.name || 'Unknown Template'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scheduled.targetAudience}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(scheduled.status)}`}>
                          {scheduled.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {scheduled.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleCancelScheduled(scheduled.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Template Form Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Notification Template</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="PUSH">Push Notification</option>
                  <option value="IN_APP">In-App</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="BOOKING">Booking</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="REMINDER">Reminder</option>
                  <option value="PROMOTION">Promotion</option>
                  <option value="SYSTEM">System</option>
                </select>
              </div>

              {templateForm.type === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                  placeholder="Use variables like {{userName}}, {{className}}, {{date}} etc."
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={templateForm.isActive}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTemplateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Schedule Notification</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <select
                  value={scheduleForm.templateId}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, templateId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="">Select a template</option>
                  {templates.filter(t => t.isActive).map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledFor}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select
                  value={scheduleForm.targetAudience}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="ALL">All Users</option>
                  <option value="ACTIVE">Active Users</option>
                  <option value="PREMIUM">Premium Members</option>
                  <option value="NEW">New Users</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScheduleForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleNotification}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
