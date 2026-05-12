import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'SOCIAL';
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  description: string;
  targetAudience: string;
  scheduledDate?: string;
  sentDate?: string;
  metrics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

interface Promotion {
  id: string;
  name: string;
  type: 'DISCOUNT' | 'FREE_CLASS' | 'PACKAGE_DEAL' | 'REFERRAL';
  discountPercentage?: number;
  discountAmount?: number;
  freeClasses?: number;
  packageId?: string;
  referralBonus?: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  description: string;
}

interface LoyaltyProgram {
  id: string;
  name: string;
  pointsPerBooking: number;
  pointsPerReferral: number;
  redemptionThreshold: number;
  redemptionReward: string;
  isActive: boolean;
  members: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
}

const MarketingTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loyaltyProgram, setLoyaltyProgram] = useState<LoyaltyProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Campaign form state
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'EMAIL' as const,
    description: '',
    targetAudience: 'ALL',
    scheduledDate: '',
  });

  // Promotion form state
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [promotionForm, setPromotionForm] = useState({
    name: '',
    type: 'DISCOUNT' as 'DISCOUNT' | 'FREE_CLASS' | 'PACKAGE_DEAL' | 'REFERRAL',
    discountPercentage: 10,
    discountAmount: 0,
    freeClasses: 1,
    packageId: '',
    referralBonus: 5,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    description: '',
  });

  useEffect(() => {
    fetchMarketingData();
  }, [activeTab]);

  const fetchMarketingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoints = {
        campaigns: '/api/admin/marketing/campaigns',
        promotions: '/api/admin/marketing/promotions',
        loyalty: '/api/admin/marketing/loyalty',
      };

      if (activeTab === 'campaigns') {
        const response = await fetch(endpoints.campaigns, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data);
        }
      } else if (activeTab === 'promotions') {
        const response = await fetch(endpoints.promotions, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPromotions(data);
        }
      } else if (activeTab === 'loyalty') {
        const response = await fetch(endpoints.loyalty, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setLoyaltyProgram(data);
        }
      }
    } catch (err) {
      setError('Failed to load marketing data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(campaignForm),
      });

      if (response.ok) {
        setSuccessMessage('Campaign created successfully!');
        setShowCampaignForm(false);
        setCampaignForm({
          name: '',
          type: 'EMAIL',
          description: '',
          targetAudience: 'ALL',
          scheduledDate: '',
        });
        fetchMarketingData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create campaign');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleCreatePromotion = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/marketing/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(promotionForm),
      });

      if (response.ok) {
        setSuccessMessage('Promotion created successfully!');
        setShowPromotionForm(false);
        setPromotionForm({
          name: '',
          type: 'DISCOUNT',
          discountPercentage: 10,
          discountAmount: 0,
          freeClasses: 1,
          packageId: '',
          referralBonus: 5,
          startDate: '',
          endDate: '',
          usageLimit: 100,
          description: '',
        });
        fetchMarketingData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create promotion');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleTogglePromotion = async (promotionId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/marketing/promotions/${promotionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setSuccessMessage(`Promotion ${isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchMarketingData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update promotion');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleSendTestCampaign = async (campaignId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/marketing/campaigns/${campaignId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccessMessage('Test campaign sent successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send test campaign');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPromotionTypeColor = (type: string) => {
    switch (type) {
      case 'DISCOUNT': return 'bg-red-100 text-red-800';
      case 'FREE_CLASS': return 'bg-green-100 text-green-800';
      case 'PACKAGE_DEAL': return 'bg-blue-100 text-blue-800';
      case 'REFERRAL': return 'bg-purple-100 text-purple-800';
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
          <h1 className="text-3xl font-bold text-gray-900">Marketing Tools</h1>
          <p className="text-gray-600">Manage campaigns, promotions, and customer engagement</p>
        </div>
        {activeTab === 'campaigns' && (
          <button
            onClick={() => setShowCampaignForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Create Campaign
          </button>
        )}
        {activeTab === 'promotions' && (
          <button
            onClick={() => setShowPromotionForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Create Promotion
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
          {['campaigns', 'promotions', 'loyalty'].map((tab) => (
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

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                          <div className="text-sm text-gray-500">{campaign.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {campaign.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCampaignStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.targetAudience}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.metrics && (
                          <div className="space-y-1">
                            <div>Sent: {campaign.metrics.sent}</div>
                            <div>Opened: {campaign.metrics.opened}</div>
                            <div>Clicked: {campaign.metrics.clicked}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleSendTestCampaign(campaign.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Test
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

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promotions.map((promotion) => (
                    <tr key={promotion.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                          <div className="text-sm text-gray-500">{promotion.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPromotionTypeColor(promotion.type)}`}>
                          {promotion.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {promotion.discountPercentage && `${promotion.discountPercentage}%`}
                        {promotion.discountAmount && `ETB ${promotion.discountAmount}`}
                        {promotion.freeClasses && `${promotion.freeClasses} free classes`}
                        {promotion.referralBonus && `ETB ${promotion.referralBonus} bonus`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {promotion.usedCount} / {promotion.usageLimit || 'Unlimited'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(promotion.startDate), 'MMM dd')} - {format(new Date(promotion.endDate), 'MMM dd')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {promotion.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleTogglePromotion(promotion.id, !promotion.isActive)}
                          className={`mr-3 ${promotion.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {promotion.isActive ? 'Deactivate' : 'Activate'}
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

      {/* Loyalty Program Tab */}
      {activeTab === 'loyalty' && loyaltyProgram && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{loyaltyProgram.members}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Points Issued</p>
                  <p className="text-2xl font-bold text-gray-900">{loyaltyProgram.totalPointsIssued}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Points Redeemed</p>
                  <p className="text-2xl font-bold text-gray-900">{loyaltyProgram.totalPointsRedeemed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Points</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loyaltyProgram.totalPointsIssued - loyaltyProgram.totalPointsRedeemed}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Loyalty Program Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                <input
                  type="text"
                  value={loyaltyProgram.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points per Booking</label>
                <input
                  type="number"
                  value={loyaltyProgram.pointsPerBooking}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points per Referral</label>
                <input
                  type="number"
                  value={loyaltyProgram.pointsPerReferral}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Redemption Threshold</label>
                <input
                  type="number"
                  value={loyaltyProgram.redemptionThreshold}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Redemption Reward</label>
              <input
                type="text"
                value={loyaltyProgram.redemptionReward}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
              />
            </div>
            <div className="mt-6 flex items-center">
              <input
                type="checkbox"
                id="loyaltyActive"
                checked={loyaltyProgram.isActive}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="loyaltyActive" className="ml-2 block text-sm text-gray-900">
                Program Active
              </label>
            </div>
            <div className="mt-6">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                Update Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Campaign</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={campaignForm.type}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="PUSH">Push Notification</option>
                  <option value="SOCIAL">Social Media</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select
                  value={campaignForm.targetAudience}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="ALL">All Users</option>
                  <option value="NEW">New Users</option>
                  <option value="ACTIVE">Active Users</option>
                  <option value="INACTIVE">Inactive Users</option>
                  <option value="PREMIUM">Premium Members</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={campaignForm.scheduledDate}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCampaignForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Form Modal */}
      {showPromotionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Promotion</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Name</label>
                <input
                  type="text"
                  value={promotionForm.name}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={promotionForm.type}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="DISCOUNT">Discount</option>
                  <option value="FREE_CLASS">Free Class</option>
                  <option value="PACKAGE_DEAL">Package Deal</option>
                  <option value="REFERRAL">Referral Bonus</option>
                </select>
              </div>

              {promotionForm.type === 'DISCOUNT' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage</label>
                    <input
                      type="number"
                      value={promotionForm.discountPercentage}
                      onChange={(e) => setPromotionForm(prev => ({ ...prev, discountPercentage: parseInt(e.target.value) }))}
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount (ETB)</label>
                    <input
                      type="number"
                      value={promotionForm.discountAmount}
                      onChange={(e) => setPromotionForm(prev => ({ ...prev, discountAmount: parseInt(e.target.value) }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                    />
                  </div>
                </>
              )}

              {promotionForm.type === 'FREE_CLASS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Free Classes</label>
                  <input
                    type="number"
                    value={promotionForm.freeClasses}
                    onChange={(e) => setPromotionForm(prev => ({ ...prev, freeClasses: parseInt(e.target.value) }))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                  />
                </div>
              )}

              {promotionForm.type === 'REFERRAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referral Bonus (ETB)</label>
                  <input
                    type="number"
                    value={promotionForm.referralBonus}
                    onChange={(e) => setPromotionForm(prev => ({ ...prev, referralBonus: parseInt(e.target.value) }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={promotionForm.startDate}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={promotionForm.endDate}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                <input
                  type="number"
                  value={promotionForm.usageLimit}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, usageLimit: parseInt(e.target.value) }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={promotionForm.description}
                  onChange={(e) => setPromotionForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPromotionForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePromotion}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Create Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingTools;
