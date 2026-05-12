import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface SystemMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    inbound: number;
    outbound: number;
  };
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  databaseConnections: number;
}

interface PerformanceAlert {
  id: string;
  type: 'CPU' | 'MEMORY' | 'DISK' | 'NETWORK' | 'RESPONSE_TIME' | 'ERROR_RATE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
  resolved: boolean;
}

interface OptimizationSuggestion {
  id: string;
  category: 'PERFORMANCE' | 'SECURITY' | 'DATABASE' | 'CACHE' | 'FRONTEND';
  title: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedImprovement: string;
  implemented: boolean;
}

interface CacheMetrics {
  hitRate: number;
  missRate: number;
  size: number;
  evictions: number;
  keys: number;
}

interface DatabaseMetrics {
  connections: number;
  queryTime: number;
  slowQueries: number;
  indexUsage: number;
  tableSize: Record<string, number>;
}

const SystemOptimization: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics | null>(null);
  const [databaseMetrics, setDatabaseMetrics] = useState<DatabaseMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timeRange, setTimeRange] = useState('1h');

  // Optimization settings
  const [optimizationSettings, setOptimizationSettings] = useState({
    autoOptimization: true,
    alertThresholds: {
      cpu: 80,
      memory: 85,
      disk: 90,
      responseTime: 2000,
      errorRate: 5,
    },
    cacheEnabled: true,
    compressionEnabled: true,
    cdnEnabled: true,
  });

  useEffect(() => {
    fetchSystemData();
  }, [activeTab, timeRange]);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoints = {
        overview: '/api/admin/system/overview',
        metrics: `/api/admin/system/metrics?range=${timeRange}`,
        alerts: '/api/admin/system/alerts',
        suggestions: '/api/admin/system/suggestions',
        cache: '/api/admin/system/cache',
        database: '/api/admin/system/database',
      };

      if (activeTab === 'overview' || activeTab === 'metrics') {
        const response = await fetch(endpoints.metrics, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      }

      if (activeTab === 'alerts') {
        const response = await fetch(endpoints.alerts, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAlerts(data);
        }
      }

      if (activeTab === 'suggestions') {
        const response = await fetch(endpoints.suggestions, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      }

      if (activeTab === 'cache') {
        const response = await fetch(endpoints.cache, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCacheMetrics(data);
        }
      }

      if (activeTab === 'database') {
        const response = await fetch(endpoints.database, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setDatabaseMetrics(data);
        }
      }
    } catch (err) {
      setError('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeSystem = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/system/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        setSuccessMessage(`${type} optimization completed successfully!`);
        fetchSystemData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Optimization failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleClearCache = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/system/cache/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Cache cleared successfully!');
        fetchSystemData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to clear cache');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/system/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Alert resolved successfully!');
        fetchSystemData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to resolve alert');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleImplementSuggestion = async (suggestionId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/system/suggestions/${suggestionId}/implement`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Optimization suggestion implemented successfully!');
        fetchSystemData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to implement suggestion');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/system/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(optimizationSettings),
      });

      if (response.ok) {
        setSuccessMessage('Settings updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update settings');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-blue-100 text-blue-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatus = (value: number, threshold: number) => {
    if (value < threshold * 0.5) return { status: 'HEALTHY', color: 'text-green-600' };
    if (value < threshold * 0.8) return { status: 'WARNING', color: 'text-yellow-600' };
    return { status: 'CRITICAL', color: 'text-red-600' };
  };

  const latestMetrics = metrics[metrics.length - 1];

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
          <h1 className="text-3xl font-bold text-gray-900">System Optimization</h1>
          <p className="text-gray-600">Monitor and optimize system performance</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={() => fetchSystemData()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Refresh
          </button>
        </div>
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

      {/* Overview Cards */}
      {activeTab === 'overview' && latestMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                <p className="text-2xl font-bold text-gray-900">{latestMetrics.cpu.toFixed(1)}%</p>
                <p className={`text-sm ${getHealthStatus(latestMetrics.cpu, optimizationSettings.alertThresholds.cpu).color}`}>
                  {getHealthStatus(latestMetrics.cpu, optimizationSettings.alertThresholds.cpu).status}
                </p>
              </div>
              <div className="text-purple-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                <p className="text-2xl font-bold text-gray-900">{latestMetrics.memory.toFixed(1)}%</p>
                <p className={`text-sm ${getHealthStatus(latestMetrics.memory, optimizationSettings.alertThresholds.memory).color}`}>
                  {getHealthStatus(latestMetrics.memory, optimizationSettings.alertThresholds.memory).status}
                </p>
              </div>
              <div className="text-purple-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{latestMetrics.responseTime}ms</p>
                <p className={`text-sm ${getHealthStatus(latestMetrics.responseTime, optimizationSettings.alertThresholds.responseTime).color}`}>
                  {getHealthStatus(latestMetrics.responseTime, optimizationSettings.alertThresholds.responseTime).status}
                </p>
              </div>
              <div className="text-purple-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{latestMetrics.activeUsers}</p>
                <p className="text-sm text-gray-500">Currently online</p>
              </div>
              <div className="text-purple-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'metrics', 'alerts', 'suggestions', 'cache', 'database', 'settings'].map((tab) => (
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

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">CPU Usage Over Time</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Chart visualization would go here</p>
              </div>
            </div>

            {/* Memory Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Memory Usage Over Time</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Chart visualization would go here</p>
              </div>
            </div>

            {/* Response Time Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Response Time Over Time</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Chart visualization would go here</p>
              </div>
            </div>

            {/* Network Traffic */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Network Traffic</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Chart visualization would go here</p>
              </div>
            </div>
          </div>

          {/* Optimization Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Optimization Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleOptimizeSystem('cache')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Optimize Cache
              </button>
              <button
                onClick={() => handleOptimizeSystem('database')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Optimize Database
              </button>
              <button
                onClick={() => handleOptimizeSystem('images')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Compress Images
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(alert.timestamp), 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alert.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alert.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alert.currentValue} / {alert.threshold}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          alert.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!alert.resolved && (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Resolve
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

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effort</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Improvement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suggestions.map((suggestion) => (
                    <tr key={suggestion.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {suggestion.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{suggestion.title}</div>
                          <div className="text-sm text-gray-500">{suggestion.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getImpactColor(suggestion.impact)}`}>
                          {suggestion.impact}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          suggestion.effort === 'LOW' ? 'bg-green-100 text-green-800' :
                          suggestion.effort === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {suggestion.effort}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {suggestion.estimatedImprovement}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          suggestion.implemented ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {suggestion.implemented ? 'Implemented' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!suggestion.implemented && (
                          <button
                            onClick={() => handleImplementSuggestion(suggestion.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Implement
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

      {/* Cache Tab */}
      {activeTab === 'cache' && cacheMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Hit Rate</h3>
              <p className="text-2xl font-bold text-gray-900">{cacheMetrics.hitRate.toFixed(1)}%</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Cache Size</h3>
              <p className="text-2xl font-bold text-gray-900">{(cacheMetrics.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Keys</h3>
              <p className="text-2xl font-bold text-gray-900">{cacheMetrics.keys.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Evictions</h3>
              <p className="text-2xl font-bold text-gray-900">{cacheMetrics.evictions.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cache Management</h3>
            <div className="space-y-4">
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Clear All Cache
              </button>
              <div className="text-sm text-gray-500">
                Clearing cache may temporarily slow down the system as data is rebuilt.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && databaseMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Connections</h3>
              <p className="text-2xl font-bold text-gray-900">{databaseMetrics.connections}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Avg Query Time</h3>
              <p className="text-2xl font-bold text-gray-900">{databaseMetrics.queryTime.toFixed(1)}ms</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Slow Queries</h3>
              <p className="text-2xl font-bold text-gray-900">{databaseMetrics.slowQueries}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-600">Index Usage</h3>
              <p className="text-2xl font-bold text-gray-900">{databaseMetrics.indexUsage.toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Table Sizes</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(databaseMetrics.tableSize).map(([table, size]) => (
                    <tr key={table}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(size / 1024 / 1024).toFixed(1)} MB
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
              <h3 className="text-lg font-medium text-gray-900">Optimization Settings</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Auto-Optimization</h4>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={optimizationSettings.autoOptimization}
                    onChange={(e) => setOptimizationSettings(prev => ({ ...prev, autoOptimization: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable automatic optimization</span>
                </label>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Alert Thresholds</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">CPU Usage (%)</label>
                    <input
                      type="number"
                      value={optimizationSettings.alertThresholds.cpu}
                      onChange={(e) => setOptimizationSettings(prev => ({
                        ...prev,
                        alertThresholds: { ...prev.alertThresholds, cpu: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Memory Usage (%)</label>
                    <input
                      type="number"
                      value={optimizationSettings.alertThresholds.memory}
                      onChange={(e) => setOptimizationSettings(prev => ({
                        ...prev,
                        alertThresholds: { ...prev.alertThresholds, memory: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Disk Usage (%)</label>
                    <input
                      type="number"
                      value={optimizationSettings.alertThresholds.disk}
                      onChange={(e) => setOptimizationSettings(prev => ({
                        ...prev,
                        alertThresholds: { ...prev.alertThresholds, disk: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Response Time (ms)</label>
                    <input
                      type="number"
                      value={optimizationSettings.alertThresholds.responseTime}
                      onChange={(e) => setOptimizationSettings(prev => ({
                        ...prev,
                        alertThresholds: { ...prev.alertThresholds, responseTime: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Features</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={optimizationSettings.cacheEnabled}
                      onChange={(e) => setOptimizationSettings(prev => ({ ...prev, cacheEnabled: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable caching</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={optimizationSettings.compressionEnabled}
                      onChange={(e) => setOptimizationSettings(prev => ({ ...prev, compressionEnabled: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable compression</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={optimizationSettings.cdnEnabled}
                      onChange={(e) => setOptimizationSettings(prev => ({ ...prev, cdnEnabled: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable CDN</span>
                  </label>
                </div>
              </div>

              <div>
                <button
                  onClick={handleUpdateSettings}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemOptimization;
