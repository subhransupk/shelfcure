import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';
import {
  Link,
  QrCode,
  Copy,
  Download,
  Share2,
  Plus,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Smartphone,
  Monitor,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const AffiliateLinksQR = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [affiliateData, setAffiliateData] = useState(null);
  const [customLinks, setCustomLinks] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  
  const [newLink, setNewLink] = useState({
    name: '',
    targetUrl: '',
    description: '',
    campaign: ''
  });

  const defaultLinks = [
    {
      id: 'homepage',
      name: 'ShelfCure Homepage',
      description: 'Main landing page for new visitors',
      targetUrl: 'https://shelfcure.com',
      clicks: 0,
      conversions: 0
    },
    {
      id: 'pharmacy-signup',
      name: 'Pharmacy Sign-Up',
      description: 'Direct link to pharmacy registration',
      targetUrl: 'https://shelfcure.com/register',
      clicks: 0,
      conversions: 0
    },
    {
      id: 'subscription',
      name: 'Subscription Plans',
      description: 'View available subscription plans',
      targetUrl: 'https://shelfcure.com/pricing',
      clicks: 0,
      conversions: 0
    }
  ];

  useEffect(() => {
    fetchAffiliateData();
    fetchCustomLinks();
  }, []);

  const fetchAffiliateData = async () => {
    try {
      const data = localStorage.getItem('affiliateData');
      if (data) {
        setAffiliateData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    }
  };

  const fetchCustomLinks = async () => {
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

      const response = await api.get('/api/affiliate-panel/custom-links');

      if (response.data.success) {
        setCustomLinks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching custom links:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(`Failed to load custom links: ${error.response?.data?.message || error.message}`);
        // Provide sample data when API fails
        setCustomLinks([
          {
            id: 'SAMPLE001',
            name: 'Sample Custom Link',
            url: 'https://shelfcure.com/register?ref=SAMPLE001',
            description: 'Sample custom link for demonstration',
            clicks: 0,
            conversions: 0,
            conversionRate: 0,
            earnings: 0,
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateAffiliateLink = (baseUrl, linkId = null) => {
    const affiliateCode = affiliateData?.affiliateCode || 'DEMO123';
    const separator = baseUrl.includes('?') ? '&' : '?';
    let link = `${baseUrl}${separator}ref=${affiliateCode}`;
    
    if (linkId) {
      link += `&campaign=${linkId}`;
    }
    
    return link;
  };

  const handleCopyLink = async (link, name) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedText(link);
      setSuccess(`${name} link copied to clipboard`);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      setError('Failed to copy link');
    }
  };

  const handleCreateCustomLink = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/affiliate-panel/custom-links', newLink);
      
      if (response.data.success) {
        setCustomLinks([...customLinks, response.data.data]);
        setNewLink({ name: '', targetUrl: '', description: '', campaign: '' });
        setShowCreateForm(false);
        setSuccess('Custom link created successfully');
      }
    } catch (error) {
      console.error('Error creating custom link:', error);
      setError('Failed to create custom link');
    }
  };

  const handleDeleteCustomLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this custom link?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/affiliate-panel/custom-links/${linkId}`);
      
      if (response.data.success) {
        setCustomLinks(customLinks.filter(link => link.id !== linkId));
        setSuccess('Custom link deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting custom link:', error);
      setError('Failed to delete custom link');
    }
  };

  const downloadQRCode = async (link, name) => {
    try {
      const response = await api.post('/api/affiliate-panel/generate-qr', {
        url: link,
        name: name
      }, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSuccess('QR code downloaded successfully');
    } catch (error) {
      console.error('QR code generation error:', error);
      setError('Failed to generate QR code');
    }
  };

  const shareLink = async (link, name) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ShelfCure - ${name}`,
          text: `Check out ShelfCure's ${name}`,
          url: link
        });
      } catch (error) {
        console.error('Share error:', error);
        handleCopyLink(link, name);
      }
    } else {
      handleCopyLink(link, name);
    }
  };

  if (loading) {
    return (
      <AffiliatePanelLayout title="Affiliate Links & QR Codes" subtitle="Manage your referral links and generate QR codes">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  return (
    <AffiliatePanelLayout title="Affiliate Links & QR Codes" subtitle="Manage your referral links and generate QR codes">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Affiliate Code Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Your Affiliate Code</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {affiliateData?.affiliateCode || 'Loading...'}
                </div>
                <div className="text-sm text-gray-500">
                  Use this code in all your referral links
                </div>
              </div>
              <button
                onClick={() => handleCopyLink(affiliateData?.affiliateCode || '', 'Affiliate code')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copiedText === affiliateData?.affiliateCode ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>

        {/* Default Links Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Default Referral Links</h3>
            <div className="text-sm text-gray-500">
              Ready-to-use links for common pages
            </div>
          </div>

          <div className="grid gap-4">
            {defaultLinks.map((link) => {
              const affiliateLink = generateAffiliateLink(link.targetUrl, link.id);
              
              return (
                <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{link.name}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Default
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                      
                      <div className="bg-gray-50 rounded-md p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Link className="w-4 h-4 text-gray-400" />
                          <code className="text-sm text-gray-700 break-all">{affiliateLink}</code>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {link.clicks} clicks
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {link.conversions} conversions
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleCopyLink(affiliateLink, link.name)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Copy Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadQRCode(affiliateLink, link.name)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Download QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => shareLink(affiliateLink, link.name)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Share Link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <a
                        href={affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Open Link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Links Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Custom Links</h3>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Custom Link
            </button>
          </div>

          {/* Create Custom Link Form */}
          {showCreateForm && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Create Custom Link</h4>
              <form onSubmit={handleCreateCustomLink} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Name *
                    </label>
                    <input
                      type="text"
                      value={newLink.name}
                      onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., Special Offer Page"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={newLink.campaign}
                      onChange={(e) => setNewLink({ ...newLink, campaign: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., summer-2024"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target URL *
                  </label>
                  <input
                    type="url"
                    value={newLink.targetUrl}
                    onChange={(e) => setNewLink({ ...newLink, targetUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="https://shelfcure.com/special-offer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newLink.description}
                    onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="Brief description of this link's purpose"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Custom Links List */}
          <div className="grid gap-4">
            {customLinks.map((link) => {
              const affiliateLink = generateAffiliateLink(link.targetUrl, link.campaign);
              
              return (
                <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{link.name}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Custom
                        </span>
                        {link.campaign && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {link.campaign}
                          </span>
                        )}
                      </div>
                      {link.description && (
                        <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                      )}
                      
                      <div className="bg-gray-50 rounded-md p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Link className="w-4 h-4 text-gray-400" />
                          <code className="text-sm text-gray-700 break-all">{affiliateLink}</code>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {link.clicks || 0} clicks
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {link.conversions || 0} conversions
                        </div>
                        <div className="text-xs">
                          Created: {new Date(link.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleCopyLink(affiliateLink, link.name)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Copy Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadQRCode(affiliateLink, link.name)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Download QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => shareLink(affiliateLink, link.name)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Share Link"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <a
                        href={affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Open Link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteCustomLink(link.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {customLinks.length === 0 && !showCreateForm && (
            <div className="text-center py-12">
              <Link className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No custom links</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create custom links for specific campaigns or pages.
              </p>
            </div>
          )}
        </div>

        {/* Usage Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Tips for Using Affiliate Links
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Use QR codes for offline marketing and field visits</li>
                  <li>Create custom links for specific campaigns to track performance</li>
                  <li>Share links on social media, WhatsApp, and email campaigns</li>
                  <li>Monitor click and conversion rates to optimize your strategy</li>
                  <li>Use descriptive campaign names to organize your links</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateLinksQR;
