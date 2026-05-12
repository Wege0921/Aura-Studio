import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Documentation {
  id: string;
  title: string;
  type: 'USER_GUIDE' | 'ADMIN_GUIDE' | 'API_DOCS' | 'FAQ' | 'TUTORIAL' | 'VIDEO';
  category: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
  tags: string[];
}

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  type: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'INTERACTIVE';
  category: string;
  duration: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  author: string;
  createdAt: string;
  enrolledCount: number;
  completedCount: number;
  rating: number;
  prerequisites: string[];
}

interface TrainingProgress {
  id: string;
  userId: string;
  moduleId: string;
  progress: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt?: string;
  completedAt?: string;
  quizScore?: number;
}

interface KnowledgeBase {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
}

const DocumentationTraining: React.FC = () => {
  const [activeTab, setActiveTab] = useState('documentation');
  const [documentation, setDocumentation] = useState<Documentation[]>([]);
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    type: 'USER_GUIDE' as const,
    category: '',
    content: '',
    tags: [] as string[],
  });

  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [trainingForm, setTrainingForm] = useState({
    title: '',
    description: '',
    type: 'ARTICLE' as const,
    category: '',
    duration: 0,
    difficulty: 'BEGINNER' as const,
    prerequisites: [] as string[],
  });

  const [showKbForm, setShowKbForm] = useState(false);
  const [kbForm, setKbForm] = useState({
    question: '',
    answer: '',
    category: '',
    tags: [] as string[],
  });

  useEffect(() => {
    fetchDocumentationData();
  }, [activeTab]);

  const fetchDocumentationData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoints = {
        documentation: '/api/admin/documentation',
        training: '/api/admin/training',
        progress: '/api/admin/training/progress',
        knowledge: '/api/admin/knowledge-base',
      };

      if (activeTab === 'documentation') {
        const response = await fetch(endpoints.documentation, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setDocumentation(data);
        }
      } else if (activeTab === 'training') {
        const response = await fetch(endpoints.training, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTrainingModules(data);
        }
      } else if (activeTab === 'progress') {
        const response = await fetch(endpoints.progress, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTrainingProgress(data);
        }
      } else if (activeTab === 'knowledge') {
        const response = await fetch(endpoints.knowledge, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setKnowledgeBase(data);
        }
      }
    } catch (err) {
      setError('Failed to load documentation data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocumentation = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/documentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(docForm),
      });

      if (response.ok) {
        setSuccessMessage('Documentation created successfully!');
        setShowDocForm(false);
        setDocForm({
          title: '',
          type: 'USER_GUIDE',
          category: '',
          content: '',
          tags: [],
        });
        fetchDocumentationData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create documentation');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleCreateTraining = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(trainingForm),
      });

      if (response.ok) {
        setSuccessMessage('Training module created successfully!');
        setShowTrainingForm(false);
        setTrainingForm({
          title: '',
          description: '',
          type: 'ARTICLE',
          category: '',
          duration: 0,
          difficulty: 'BEGINNER',
          prerequisites: [],
        });
        fetchDocumentationData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create training module');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleCreateKnowledgeBase = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(kbForm),
      });

      if (response.ok) {
        setSuccessMessage('Knowledge base entry created successfully!');
        setShowKbForm(false);
        setKbForm({
          question: '',
          answer: '',
          category: '',
          tags: [],
        });
        fetchDocumentationData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create knowledge base entry');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handlePublishDocumentation = async (docId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/documentation/${docId}/publish`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Documentation published successfully!');
        fetchDocumentationData();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to publish documentation');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'USER_GUIDE':
      case 'VIDEO':
        return 'bg-blue-100 text-blue-800';
      case 'ADMIN_GUIDE':
      case 'ARTICLE':
        return 'bg-purple-100 text-purple-800';
      case 'API_DOCS':
      case 'INTERACTIVE':
        return 'bg-green-100 text-green-800';
      case 'FAQ':
      case 'QUIZ':
        return 'bg-orange-100 text-orange-800';
      case 'TUTORIAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED': return 'bg-red-100 text-red-800';
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
          <h1 className="text-3xl font-bold text-gray-900">Documentation & Training</h1>
          <p className="text-gray-600">Manage documentation, training modules, and knowledge base</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'documentation' && (
            <button
              onClick={() => setShowDocForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              New Documentation
            </button>
          )}
          {activeTab === 'training' && (
            <button
              onClick={() => setShowTrainingForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              New Training Module
            </button>
          )}
          {activeTab === 'knowledge' && (
            <button
              onClick={() => setShowKbForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              New KB Entry
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
          {['documentation', 'training', 'progress', 'knowledge'].map((tab) => (
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

      {/* Documentation Tab */}
      {activeTab === 'documentation' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documentation.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                        <div className="text-sm text-gray-500">{doc.tags.join(', ')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(doc.type)}`}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.views}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(doc.updatedAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {doc.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePublishDocumentation(doc.id)}
                            className="text-purple-600 hover:text-purple-900 mr-3"
                          >
                            Publish
                          </button>
                        )}
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

      {/* Training Modules Tab */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trainingModules.map((module) => (
                    <tr key={module.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{module.title}</div>
                        <div className="text-sm text-gray-500">{module.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(module.type)}`}>
                          {module.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(module.difficulty)}`}>
                          {module.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {module.duration} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {module.enrolledCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {module.completedCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {module.rating.toFixed(1)} ⭐
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(module.status)}`}>
                          {module.status}
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

      {/* Training Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trainingProgress.map((progress) => (
                    <tr key={progress.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        User {progress.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trainingModules.find(m => m.id === progress.moduleId)?.title || 'Unknown Module'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${progress.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">{progress.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(progress.status)}`}>
                          {progress.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {progress.startedAt ? format(new Date(progress.startedAt), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {progress.completedAt ? format(new Date(progress.completedAt), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {progress.quizScore ? `${progress.quizScore}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Helpful</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Not Helpful</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {knowledgeBase.map((kb) => (
                    <tr key={kb.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{kb.question}</div>
                        <div className="text-sm text-gray-500">{kb.answer.substring(0, 100)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {kb.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {kb.tags.join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {kb.helpful}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {kb.notHelpful}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(kb.updatedAt), 'MMM dd, yyyy')}
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

      {/* Documentation Form Modal */}
      {showDocForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">New Documentation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={docForm.title}
                  onChange={(e) => setDocForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={docForm.type}
                  onChange={(e) => setDocForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="USER_GUIDE">User Guide</option>
                  <option value="ADMIN_GUIDE">Admin Guide</option>
                  <option value="API_DOCS">API Documentation</option>
                  <option value="FAQ">FAQ</option>
                  <option value="TUTORIAL">Tutorial</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={docForm.category}
                  onChange={(e) => setDocForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={docForm.content}
                  onChange={(e) => setDocForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={docForm.tags.join(', ')}
                  onChange={(e) => setDocForm(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                  placeholder="yoga, meditation, wellness"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDocForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocumentation}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Create Documentation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Form Modal */}
      {showTrainingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">New Training Module</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={trainingForm.title}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={trainingForm.description}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={trainingForm.type}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="VIDEO">Video</option>
                  <option value="ARTICLE">Article</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="INTERACTIVE">Interactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={trainingForm.category}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={trainingForm.duration}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={trainingForm.difficulty}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites (comma-separated)</label>
                <input
                  type="text"
                  value={trainingForm.prerequisites.join(', ')}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, prerequisites: e.target.value.split(',').map(p => p.trim()) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                  placeholder="Basic yoga knowledge, Meditation experience"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTrainingForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTraining}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Create Training Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Base Form Modal */}
      {showKbForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">New Knowledge Base Entry</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  value={kbForm.question}
                  onChange={(e) => setKbForm(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                <textarea
                  value={kbForm.answer}
                  onChange={(e) => setKbForm(prev => ({ ...prev, answer: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={kbForm.category}
                  onChange={(e) => setKbForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={kbForm.tags.join(', ')}
                  onChange={(e) => setKbForm(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500"
                  placeholder="booking, payment, classes"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowKbForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKnowledgeBase}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Create KB Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationTraining;
