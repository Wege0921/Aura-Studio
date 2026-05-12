import React, { useState, useEffect } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface AdvancedAnalyticsData {
  cohortAnalysis: Array<{
    cohort: string;
    period: number;
    users: number;
    retentionRate: number;
    revenue: number;
  }>;
  predictiveMetrics: {
    nextMonthRevenue: number;
    nextMonthBookings: number;
    churnRisk: number;
    growthRate: number;
  };
  customerLifetimeValue: {
    averageCLV: number;
    clvBySegment: Array<{
      segment: string;
      clv: number;
      users: number;
    }>;
  };
  revenueAttribution: {
    channels: Array<{
      channel: string;
      revenue: number;
      users: number;
      conversionRate: number;
    }>;
  };
  seasonalTrends: {
    monthlyPatterns: Array<{
      month: string;
      revenue: number;
      bookings: number;
      newUsers: number;
    }>;
    peakTimes: Array<{
      dayOfWeek: string;
      timeSlot: string;
      averageBookings: number;
    }>;
  };
  userSegmentation: {
    segments: Array<{
      name: string;
      count: number;
      avgRevenue: number;
      avgBookings: number;
      characteristics: string[];
    }>;
  };
}

const AdvancedAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AdvancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('90'); // days
  const [activeTab, setActiveTab] = useState('cohort');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [dateRange]);

  const fetchAdvancedAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/analytics/advanced?days=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch advanced analytics');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError('Failed to load advanced analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateCustomReport = async (reportType: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/analytics/custom-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportType,
          dateRange,
          metrics: ['revenue', 'bookings', 'users', 'retention'],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate custom report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `advanced-analytics-${reportType}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to generate custom report');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No advanced analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Deep insights and predictive analytics for your yoga studio</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={() => generateCustomReport('comprehensive')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-green-700 hover:text-green-600">×</button>
        </div>
      )}

      {/* Predictive Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Predicted Revenue</p>
              <p className="text-2xl font-bold">ETB {analyticsData.predictiveMetrics.nextMonthRevenue.toLocaleString()}</p>
              <p className="text-blue-100 text-xs mt-1">Next month</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Predicted Bookings</p>
              <p className="text-2xl font-bold">{analyticsData.predictiveMetrics.nextMonthBookings}</p>
              <p className="text-green-100 text-xs mt-1">Next month</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Churn Risk</p>
              <p className="text-2xl font-bold">{analyticsData.predictiveMetrics.churnRisk}%</p>
              <p className="text-yellow-100 text-xs mt-1">At risk users</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Growth Rate</p>
              <p className="text-2xl font-bold">+{analyticsData.predictiveMetrics.growthRate}%</p>
              <p className="text-purple-100 text-xs mt-1">Monthly growth</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['cohort', 'clv', 'attribution', 'seasonal', 'segments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'clv' ? 'Customer Lifetime Value' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Cohort Analysis Tab */}
      {activeTab === 'cohort' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Cohort Retention Analysis</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cohort</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period 0</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period 1</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period 2</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period 3</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.cohortAnalysis.slice(0, 5).map((cohort, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cohort.cohort}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cohort.users}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cohort.retentionRate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {analyticsData.cohortAnalysis.find(c => c.cohort === cohort.cohort && c.period === 2)?.retentionRate || '-'}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {analyticsData.cohortAnalysis.find(c => c.cohort === cohort.cohort && c.period === 3)?.retentionRate || '-'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Cohort Revenue Trends</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">Cohort revenue chart would be displayed here</p>
            </div>
          </div>
        </div>
      )}

      {/* Customer Lifetime Value Tab */}
      {activeTab === 'clv' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Average CLV</p>
              <p className="text-2xl font-bold text-gray-900">ETB {analyticsData.customerLifetimeValue.averageCLV.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Top Segment CLV</p>
              <p className="text-2xl font-bold text-green-600">
                ETB {Math.max(...analyticsData.customerLifetimeValue.clvBySegment.map(s => s.clv)).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">CLV Growth</p>
              <p className="text-2xl font-bold text-blue-600">+18.5%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">CLV by Customer Segment</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg CLV</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.customerLifetimeValue.clvBySegment.map((segment, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{segment.segment}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{segment.users}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ETB {segment.clv.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Attribution Tab */}
      {activeTab === 'attribution' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Revenue by Channel</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">Channel attribution chart would be displayed here</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Channel Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.revenueAttribution.channels.map((channel, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{channel.channel}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ETB {channel.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{channel.users}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{channel.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Seasonal Trends Tab */}
      {activeTab === 'seasonal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Monthly Patterns</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Seasonal trends chart would be displayed here</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Peak Booking Times</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Peak times chart would be displayed here</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Peak Performance Times</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Bookings</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.seasonalTrends.peakTimes.map((peak, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{peak.dayOfWeek}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{peak.timeSlot}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{peak.averageBookings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Segmentation Tab */}
      {activeTab === 'segments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">User Segments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyticsData.userSegmentation.segments.map((segment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{segment.name}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Users:</span>
                      <span className="text-sm font-medium">{segment.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Revenue:</span>
                      <span className="text-sm font-medium">ETB {segment.avgRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Bookings:</span>
                      <span className="text-sm font-medium">{segment.avgBookings}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Characteristics:</p>
                    <div className="flex flex-wrap gap-1">
                      {segment.characteristics.map((char, charIndex) => (
                        <span key={charIndex} className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;
