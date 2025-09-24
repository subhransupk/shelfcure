import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';
import {
  Download,
  Eye,
  Copy,
  Share2,
  Image,
  FileText,
  Video,
  MessageSquare,
  Palette,
  Search,
  Filter,
  CheckCircle,
  ExternalLink,
  Smartphone,
  Monitor,
  Printer,
  QrCode
} from 'lucide-react';

const AffiliateMarketingResources = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [previewModal, setPreviewModal] = useState({ open: false, resource: null });
  const [copiedText, setCopiedText] = useState('');
  const [qrCodes, setQrCodes] = useState([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrGenerating, setQrGenerating] = useState(false);

  const categories = [
    { id: 'all', name: 'All Categories', icon: Palette },
    { id: 'logos', name: 'Logos & Brand Assets', icon: Image },
    { id: 'flyers', name: 'Flyers & Brochures', icon: FileText },
    { id: 'social', name: 'Social Media', icon: Share2 },
    { id: 'whatsapp', name: 'WhatsApp Templates', icon: MessageSquare },
    { id: 'videos', name: 'Videos', icon: Video },
    { id: 'catalogs', name: 'Product Catalogs', icon: FileText },
    { id: 'qrcodes', name: 'QR Codes', icon: QrCode }
  ];

  const types = [
    { id: 'all', name: 'All Types' },
    { id: 'image', name: 'Images' },
    { id: 'pdf', name: 'PDFs' },
    { id: 'video', name: 'Videos' },
    { id: 'text', name: 'Text Templates' }
  ];

  useEffect(() => {
    fetchMarketingResources();
    fetchQrCodes();
  }, []);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, categoryFilter, typeFilter]);

  const fetchMarketingResources = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/affiliate-panel/marketing-resources');
      
      if (response.data.success) {
        setResources(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching marketing resources:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError('Failed to load marketing resources');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(resource => resource.category === categoryFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(resource => resource.type === typeFilter);
    }

    setFilteredResources(filtered);
  };

  const handleDownload = async (resourceId, filename) => {
    try {
      const response = await api.get(`/api/affiliate-panel/marketing-resources/${resourceId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Resource downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download resource');
    }
  };

  const handleCopyText = async (text, type = 'text') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setSuccess(`${type} copied to clipboard`);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      setError('Failed to copy to clipboard');
    }
  };

  const handlePreview = (resource) => {
    setPreviewModal({ open: true, resource });
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'text':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getResourceTypeColor = (type) => {
    switch (type) {
      case 'image':
        return 'bg-blue-100 text-blue-800';
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'video':
        return 'bg-purple-100 text-purple-800';
      case 'text':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchQrCodes = async () => {
    try {
      const response = await api.get('/api/affiliate-panel/qr-codes');
      if (response.data.success) {
        setQrCodes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
    }
  };

  const generateQrCode = async (type = 'affiliate_link', data = {}) => {
    try {
      setQrGenerating(true);
      const response = await api.post('/api/affiliate-panel/qr-codes/generate', {
        type,
        data,
        title: `${type.replace('_', ' ')} QR Code`,
        description: `QR code for ${type.replace('_', ' ')}`
      });

      if (response.data.success) {
        setQrCodes(prev => [...prev, response.data.data]);
        setSuccess('QR code generated successfully');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code');
    } finally {
      setQrGenerating(false);
    }
  };

  const downloadQrCode = async (qrCodeId, filename) => {
    try {
      const response = await api.get(`/api/affiliate-panel/qr-codes/${qrCodeId}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('QR code downloaded successfully');
    } catch (error) {
      console.error('QR code download error:', error);
      setError('Failed to download QR code');
    }
  };

  if (loading) {
    return (
      <AffiliatePanelLayout title="Marketing Resources" subtitle="Download promotional materials and templates">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  return (
    <AffiliatePanelLayout title="Marketing Resources" subtitle="Download promotional materials and templates">
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

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                {types.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setCategoryFilter(category.id)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      categoryFilter === category.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* QR Codes Section */}
        {categoryFilter === 'qrcodes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Your QR Codes</h2>
              <button
                onClick={() => generateQrCode('affiliate_link')}
                disabled={qrGenerating}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                <span>{qrGenerating ? 'Generating...' : 'Generate QR Code'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qrCodes.map((qrCode) => (
                <div key={qrCode.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{qrCode.title}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {qrCode.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={qrCode.imageUrl}
                      alt="QR Code"
                      className="w-20 h-20 border rounded"
                    />

                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">{qrCode.description}</p>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>Scans: {qrCode.scans || 0}</span>
                        <span>Created: {new Date(qrCode.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadQrCode(qrCode.id, `qr-${qrCode.title.toLowerCase().replace(/\s+/g, '-')}.png`)}
                      className="flex-1 bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center space-x-1 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={() => handleCopyText(qrCode.url, 'QR code URL')}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {qrCodes.length === 0 && (
              <div className="text-center py-12">
                <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No QR codes generated yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Generate QR codes for easy offline sharing of your affiliate links.
                </p>
                <button
                  onClick={() => generateQrCode('affiliate_link')}
                  disabled={qrGenerating}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {qrGenerating ? 'Generating...' : 'Generate Your First QR Code'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resources Grid */}
        {categoryFilter !== 'qrcodes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Resource Preview */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                {resource.type === 'image' && resource.thumbnailUrl ? (
                  <img
                    src={resource.thumbnailUrl}
                    alt={resource.title}
                    className="w-full h-48 object-cover"
                  />
                ) : resource.type === 'video' && resource.thumbnailUrl ? (
                  <div className="relative w-full h-48">
                    <img
                      src={resource.thumbnailUrl}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-50 rounded-full p-3">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 flex items-center justify-center">
                    {getResourceIcon(resource.type)}
                  </div>
                )}
              </div>

              {/* Resource Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                    {resource.title}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getResourceTypeColor(resource.type)}`}>
                    {resource.type.toUpperCase()}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {resource.description}
                </p>

                {/* Resource Details */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Size: {resource.fileSize || 'N/A'}</span>
                  <span>Format: {resource.format || resource.type}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {resource.type === 'text' ? (
                    <button
                      onClick={() => handleCopyText(resource.content, 'Template')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedText === resource.content ? 'Copied!' : 'Copy Text'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePreview(resource)}
                        className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownload(resource.id, resource.filename)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </>
                  )}
                </div>

                {/* WhatsApp Templates Special Content */}
                {resource.category === 'whatsapp' && resource.content && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">WhatsApp Message</span>
                      <button
                        onClick={() => handleCopyText(resource.content, 'WhatsApp message')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-green-700 line-clamp-3">
                      {resource.content}
                    </p>
                  </div>
                )}

                {/* Usage Guidelines */}
                {resource.usageGuidelines && (
                  <div className="mt-3 text-xs text-gray-500">
                    <strong>Usage:</strong> {resource.usageGuidelines}
                  </div>
                )}
              </div>
            </div>
            ))}
          </div>
        )}

        {filteredResources.length === 0 && !loading && categoryFilter !== 'qrcodes' && (
          <div className="text-center py-12">
            <Share2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {/* Preview Modal */}
        {previewModal.open && previewModal.resource && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setPreviewModal({ open: false, resource: null })}
              />

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {previewModal.resource.title}
                    </h3>
                    <button
                      onClick={() => setPreviewModal({ open: false, resource: null })}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="max-h-96 overflow-auto">
                    {previewModal.resource.type === 'image' && (
                      <img
                        src={previewModal.resource.previewUrl || previewModal.resource.thumbnailUrl}
                        alt={previewModal.resource.title}
                        className="w-full h-auto"
                      />
                    )}
                    {previewModal.resource.type === 'video' && (
                      <video
                        src={previewModal.resource.previewUrl}
                        controls
                        className="w-full h-auto"
                      />
                    )}
                    {previewModal.resource.type === 'pdf' && (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-16 w-16 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          PDF preview not available. Download to view.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => handleDownload(previewModal.resource.id, previewModal.resource.filename)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={() => setPreviewModal({ open: false, resource: null })}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateMarketingResources;
