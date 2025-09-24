import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';
import {
  BookOpen,
  Video,
  FileText,
  Award,
  Play,
  Download,
  CheckCircle,
  Clock,
  Star,
  Users,
  TrendingUp,
  Shield,
  Target,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

const AffiliateTraining = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [completedModules, setCompletedModules] = useState([]);
  const [progress, setProgress] = useState({
    totalModules: 0,
    completedModules: 0,
    certificatesEarned: 0
  });

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: BookOpen },
    { id: 'marketing', name: 'Marketing Strategies', icon: TrendingUp },
    { id: 'compliance', name: 'Compliance & Guidelines', icon: Shield },
    { id: 'best-practices', name: 'Best Practices', icon: Target },
    { id: 'advanced', name: 'Advanced Techniques', icon: Lightbulb }
  ];

  const trainingModules = {
    'getting-started': [
      {
        id: 'intro-affiliate',
        title: 'Introduction to Affiliate Marketing',
        description: 'Learn the basics of affiliate marketing and how ShelfCure\'s program works',
        type: 'video',
        duration: '15 min',
        difficulty: 'Beginner',
        videoUrl: '/training/intro-affiliate.mp4',
        materials: [
          { name: 'Getting Started Guide', type: 'pdf', url: '/materials/getting-started.pdf' }
        ]
      },
      {
        id: 'dashboard-overview',
        title: 'Dashboard Overview',
        description: 'Navigate your affiliate dashboard and understand key metrics',
        type: 'interactive',
        duration: '10 min',
        difficulty: 'Beginner',
        materials: [
          { name: 'Dashboard Walkthrough', type: 'pdf', url: '/materials/dashboard-guide.pdf' }
        ]
      },
      {
        id: 'first-referral',
        title: 'Making Your First Referral',
        description: 'Step-by-step guide to making your first successful referral',
        type: 'video',
        duration: '20 min',
        difficulty: 'Beginner',
        videoUrl: '/training/first-referral.mp4'
      }
    ],
    'marketing': [
      {
        id: 'target-audience',
        title: 'Identifying Your Target Audience',
        description: 'Learn how to identify and reach potential pharmacy customers',
        type: 'video',
        duration: '25 min',
        difficulty: 'Intermediate',
        videoUrl: '/training/target-audience.mp4'
      },
      {
        id: 'social-media',
        title: 'Social Media Marketing for Affiliates',
        description: 'Effective strategies for promoting on social platforms',
        type: 'article',
        duration: '15 min',
        difficulty: 'Intermediate',
        materials: [
          { name: 'Social Media Templates', type: 'zip', url: '/materials/social-templates.zip' }
        ]
      },
      {
        id: 'whatsapp-marketing',
        title: 'WhatsApp Marketing Strategies',
        description: 'Master WhatsApp marketing for pharmacy outreach',
        type: 'video',
        duration: '30 min',
        difficulty: 'Intermediate',
        videoUrl: '/training/whatsapp-marketing.mp4'
      }
    ],
    'compliance': [
      {
        id: 'healthcare-compliance',
        title: 'Healthcare Marketing Compliance',
        description: 'Essential compliance rules for healthcare marketing in India',
        type: 'article',
        duration: '20 min',
        difficulty: 'Important',
        materials: [
          { name: 'Compliance Checklist', type: 'pdf', url: '/materials/compliance-checklist.pdf' }
        ]
      },
      {
        id: 'data-privacy',
        title: 'Data Privacy and Protection',
        description: 'Understanding data privacy laws and customer protection',
        type: 'video',
        duration: '18 min',
        difficulty: 'Important',
        videoUrl: '/training/data-privacy.mp4'
      }
    ],
    'best-practices': [
      {
        id: 'relationship-building',
        title: 'Building Long-term Relationships',
        description: 'Strategies for building lasting relationships with pharmacy owners',
        type: 'video',
        duration: '22 min',
        difficulty: 'Intermediate',
        videoUrl: '/training/relationship-building.mp4'
      },
      {
        id: 'follow-up-strategies',
        title: 'Effective Follow-up Strategies',
        description: 'Master the art of following up without being pushy',
        type: 'article',
        duration: '12 min',
        difficulty: 'Intermediate'
      }
    ],
    'advanced': [
      {
        id: 'analytics-optimization',
        title: 'Analytics and Performance Optimization',
        description: 'Use data to optimize your affiliate performance',
        type: 'video',
        duration: '35 min',
        difficulty: 'Advanced',
        videoUrl: '/training/analytics-optimization.mp4'
      },
      {
        id: 'automation-tools',
        title: 'Marketing Automation Tools',
        description: 'Leverage automation to scale your affiliate business',
        type: 'video',
        duration: '28 min',
        difficulty: 'Advanced',
        videoUrl: '/training/automation-tools.mp4'
      }
    ]
  };

  useEffect(() => {
    // Check if user is authenticated as affiliate
    const affiliateToken = localStorage.getItem('affiliateToken');
    const affiliateData = localStorage.getItem('affiliateData');

    if (!affiliateToken || !affiliateData) {
      console.log('No affiliate authentication found, redirecting to login');
      navigate('/affiliate-login');
      return;
    }

    fetchTrainingProgress();
  }, [navigate]);

  const fetchTrainingProgress = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors

      // Check if user is authenticated
      const affiliateToken = localStorage.getItem('affiliateToken');
      if (!affiliateToken) {
        console.log('No affiliate authentication found, redirecting to login');
        navigate('/affiliate-login');
        return;
      }

      const response = await api.get('/api/affiliate-panel/training-progress');

      if (response.data.success) {
        setCompletedModules(response.data.data.completedModules || []);
        setProgress(response.data.data.progress || {
          totalModules: 0,
          completedModules: 0,
          certificatesEarned: 0
        });
      }
    } catch (error) {
      console.error('Error fetching training progress:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(`Failed to load training progress: ${error.response?.data?.message || error.message}`);
        // Provide default progress when API fails
        setProgress({
          totalModules: 24,
          completedModules: 0,
          certificatesEarned: 0
        });
        setCompletedModules([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const markModuleComplete = async (moduleId) => {
    try {
      const response = await api.post(`/api/affiliate-panel/training-progress/${moduleId}/complete`);
      
      if (response.data.success) {
        setCompletedModules(prev => [...prev, moduleId]);
        setProgress(prev => ({
          ...prev,
          completedModules: prev.completedModules + 1
        }));
      }
    } catch (error) {
      console.error('Error marking module complete:', error);
      setError('Failed to update progress');
    }
  };

  const getModuleIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'article':
        return <FileText className="w-5 h-5" />;
      case 'interactive':
        return <Target className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'Advanced':
        return 'bg-purple-100 text-purple-800';
      case 'Important':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateCategoryProgress = (categoryId) => {
    const modules = trainingModules[categoryId] || [];
    const completed = modules.filter(module => completedModules.includes(module.id)).length;
    return modules.length > 0 ? (completed / modules.length) * 100 : 0;
  };

  if (loading) {
    return (
      <AffiliatePanelLayout title="Training & Learning" subtitle="Enhance your affiliate marketing skills">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  return (
    <AffiliatePanelLayout title="Training & Learning" subtitle="Enhance your affiliate marketing skills">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Modules Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress.completedModules}/{progress.totalModules}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Certificates Earned</p>
                <p className="text-2xl font-bold text-gray-900">{progress.certificatesEarned}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress.totalModules > 0 ? Math.round((progress.completedModules / progress.totalModules) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {categories.map((category) => {
                const Icon = category.icon;
                const progress = calculateCategoryProgress(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeCategory === category.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                    {progress > 0 && (
                      <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        {Math.round(progress)}%
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Training Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(trainingModules[activeCategory] || []).map((module) => {
            const isCompleted = completedModules.includes(module.id);
            const ModuleIcon = getModuleIcon(module.type);
            
            return (
              <div key={module.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          ModuleIcon
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{module.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                            {module.difficulty}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {module.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isCompleted && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4">{module.description}</p>

                  {/* Materials */}
                  {module.materials && module.materials.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Materials:</h4>
                      <div className="space-y-1">
                        {module.materials.map((material, index) => (
                          <a
                            key={index}
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Download className="w-3 h-3" />
                            {material.name} ({material.type.toUpperCase()})
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {module.type === 'video' && module.videoUrl && (
                      <button
                        onClick={() => window.open(module.videoUrl, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Watch Video
                      </button>
                    )}
                    
                    {module.type === 'article' && (
                      <button
                        onClick={() => navigate(`/affiliate-panel/training/${module.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Read Article
                      </button>
                    )}

                    {module.type === 'interactive' && (
                      <button
                        onClick={() => navigate(`/affiliate-panel/training/${module.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        <Target className="w-4 h-4" />
                        Start Interactive
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        onClick={() => markModuleComplete(module.id)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {(trainingModules[activeCategory] || []).length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No modules available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Training modules for this category are coming soon.
            </p>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <Lightbulb className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Training Tips
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Complete modules in order for the best learning experience</li>
                  <li>Take notes and apply what you learn immediately</li>
                  <li>Download and use the provided materials and templates</li>
                  <li>Join our affiliate community for discussions and support</li>
                  <li>Earn certificates by completing all modules in a category</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateTraining;
