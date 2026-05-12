import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface TestSuite {
  id: string;
  name: string;
  type: 'UNIT' | 'INTEGRATION' | 'E2E' | 'PERFORMANCE' | 'SECURITY';
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED';
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  lastRun: string;
  coverage?: number;
}

interface Deployment {
  id: string;
  version: string;
  environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  status: 'PENDING' | 'DEPLOYING' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  branch: string;
  commit: string;
  deployedBy: string;
  deployedAt: string;
  rollbackAvailable: boolean;
  healthCheck?: 'PENDING' | 'PASSING' | 'FAILING';
}

interface TestResult {
  id: string;
  suiteId: string;
  testName: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  timestamp: string;
}

interface DeploymentConfig {
  id: string;
  name: string;
  environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  autoDeploy: boolean;
  requireApproval: boolean;
  healthCheckEnabled: boolean;
  rollbackEnabled: boolean;
  notificationChannels: string[];
  deploymentScript: string;
}

const TestingDeployment: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tests');
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [deploymentConfigs, setDeploymentConfigs] = useState<DeploymentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [showDeployForm, setShowDeployForm] = useState(false);
  const [deployForm, setDeployForm] = useState({
    version: '',
    environment: 'STAGING' as const,
    branch: 'main',
    commit: '',
  });

  const [showConfigForm, setShowConfigForm] = useState(false);
  const [configForm, setConfigForm] = useState({
    name: '',
    environment: 'STAGING' as const,
    autoDeploy: false,
    requireApproval: true,
    healthCheckEnabled: true,
    rollbackEnabled: true,
    notificationChannels: [] as string[],
    deploymentScript: '',
  });

  useEffect(() => {
    fetchTestingDeploymentData();
  }, [activeTab]);

  const fetchTestingDeploymentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoints = {
        tests: '/api/admin/testing/suites',
        deployments: '/api/admin/deployments',
        results: '/api/admin/testing/results',
        configs: '/api/admin/deployments/configs',
      };

      if (activeTab === 'tests') {
        const response = await fetch(endpoints.tests, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTestSuites(data);
        }
      } else if (activeTab === 'deployments') {
        const response = await fetch(endpoints.deployments, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setDeployments(data);
        }
      } else if (activeTab === 'results') {
        const response = await fetch(endpoints.results, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTestResults(data);
        }
      } else if (activeTab === 'configs') {
        const response = await fetch(endpoints.configs, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setDeploymentConfigs(data);
        }
      }
    } catch (err) {
      setError('Failed to load testing and deployment data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunTests = async (suiteId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/testing/suites/${suiteId}/run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Test suite started successfully!');
        fetchTestingDeploymentData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to run test suite');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleDeploy = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/deployments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(deployForm),
      });

      if (response.ok) {
        setSuccessMessage('Deployment initiated successfully!');
        setShowDeployForm(false);
        setDeployForm({
          version: '',
          environment: 'STAGING',
          branch: 'main',
          commit: '',
        });
        fetchTestingDeploymentData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to initiate deployment');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleRollback = async (deploymentId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/deployments/${deploymentId}/rollback`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Rollback initiated successfully!');
        fetchTestingDeploymentData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to initiate rollback');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleCreateConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/deployments/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(configForm),
      });

      if (response.ok) {
        setSuccessMessage('Deployment configuration created successfully!');
        setShowConfigForm(false);
        setConfigForm({
          name: '',
          environment: 'STAGING',
          autoDeploy: false,
          requireApproval: true,
          healthCheckEnabled: true,
          rollbackEnabled: true,
          notificationChannels: [],
          deploymentScript: '',
        });
        fetchTestingDeploymentData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create configuration');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
      case 'SUCCESS':
      case 'PASSING':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
      case 'FAILING':
        return 'bg-red-100 text-red-800';
      case 'RUNNING':
      case 'DEPLOYING':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SKIPPED':
      case 'ROLLED_BACK':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'UNIT': return 'bg-blue-100 text-blue-800';
      case 'INTEGRATION': return 'bg-purple-100 text-purple-800';
      case 'E2E': return 'bg-green-100 text-green-800';
      case 'PERFORMANCE': return 'bg-orange-100 text-orange-800';
      case 'SECURITY': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'DEVELOPMENT': return 'bg-blue-100 text-blue-800';
      case 'STAGING': return 'bg-yellow-100 text-yellow-800';
      case 'PRODUCTION': return 'bg-green-100 text-green-800';
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
          <h1 className="text-3xl font-bold text-gray-900">Testing & Deployment</h1>
          <p className="text-gray-600">Manage test suites, deployments, and quality assurance</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'deployments' && (
            <button
              onClick={() => setShowDeployForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              New Deployment
            </button>
          )}
          {activeTab === 'configs' && (
            <button
              onClick={() => setShowConfigForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              New Configuration
            </button>
          )}
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['tests', 'deployments', 'results', 'configs'].map((tab) => (
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

      {/* Test Suites Tab */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suite</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Results</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testSuites.map((suite) => (
                    <tr key={suite.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{suite.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTestTypeColor(suite.type)}`}>
                          {suite.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(suite.status)}`}>
                          {suite.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <span className="text-green-600">{suite.passed} passed</span>
                          <span className="text-red-600">{suite.failed} failed</span>
                          <span className="text-gray-500">{suite.skipped} skipped</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {suite.coverage ? `${suite.coverage}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {suite.duration}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(suite.lastRun), 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRunTests(suite.id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Run Tests
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

      {/* Deployments Tab */}
      {activeTab === 'deployments' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Environment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployed By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployed At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Check</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deployments.map((deployment) => (
                    <tr key={deployment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{deployment.version}</div>
                        <div className="text-sm text-gray-500">{deployment.commit.substring(0, 7)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEnvironmentColor(deployment.environment)}`}>
                          {deployment.environment}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(deployment.status)}`}>
                          {deployment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deployment.branch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {deployment.deployedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(deployment.deployedAt), 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {deployment.healthCheck && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(deployment.healthCheck)}`}>
                            {deployment.healthCheck}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {deployment.rollbackAvailable && deployment.status === 'SUCCESS' && (
                          <button
                            onClick={() => handleRollback(deployment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Rollback
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

      {/* Test Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suite</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testResults.map((result) => (
                    <tr key={result.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{result.testName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {testSuites.find(s => s.id === result.suiteId)?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.duration}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(result.timestamp), 'MMM dd, HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.errorMessage && (
                          <span className="text-red-600" title={result.errorMessage}>
                            Error
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

      {/* Configurations Tab */}
      {activeTab === 'configs' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Environment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auto Deploy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Required</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Check</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rollback</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deploymentConfigs.map((config) => (
                    <tr key={config.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{config.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEnvironmentColor(config.environment)}`}>
                          {config.environment}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          config.autoDeploy ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {config.autoDeploy ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          config.requireApproval ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {config.requireApproval ? 'Required' : 'Not Required'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          config.healthCheckEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {config.healthCheckEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          config.rollbackEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {config.rollbackEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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

      {/* Deployment Form Modal */}
      {showDeployForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Deployment</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input
                  type="text"
                  value={deployForm.version}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, version: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                  placeholder="v1.0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <select
                  value={deployForm.environment}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, environment: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="DEVELOPMENT">Development</option>
                  <option value="STAGING">Staging</option>
                  <option value="PRODUCTION">Production</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <input
                  type="text"
                  value={deployForm.branch}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commit Hash</label>
                <input
                  type="text"
                  value={deployForm.commit}
                  onChange={(e) => setDeployForm(prev => ({ ...prev, commit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                  placeholder="abc123def456"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeployForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form Modal */}
      {showConfigForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Deployment Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={configForm.name}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <select
                  value={configForm.environment}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, environment: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="DEVELOPMENT">Development</option>
                  <option value="STAGING">Staging</option>
                  <option value="PRODUCTION">Production</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configForm.autoDeploy}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, autoDeploy: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto Deploy</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configForm.requireApproval}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, requireApproval: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Require Approval</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configForm.healthCheckEnabled}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, healthCheckEnabled: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Health Check</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configForm.rollbackEnabled}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, rollbackEnabled: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Rollback</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deployment Script</label>
                <textarea
                  value={configForm.deploymentScript}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, deploymentScript: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                  placeholder="# Deployment commands"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConfigForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConfig}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Create Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestingDeployment;
