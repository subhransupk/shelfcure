import React, { useState } from 'react';
import {
  ArrowLeft,
  QrCode,
  Mail,
  Share2,
  Copy,
  Download,
  MessageSquare,
  Link,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';

const AffiliateReferralMaterials = () => {
  const [activeTab, setActiveTab] = useState('links');
  const [materials, setMaterials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [campaign, setCampaign] = useState('');
  const [copied, setCopied] = useState('');
  const navigate = useNavigate();

  const tabs = [
    { id: 'links', label: 'Referral Links', icon: Link },
    { id: 'qr_code', label: 'QR Codes', icon: QrCode },
    { id: 'email_template', label: 'Email Templates', icon: Mail },
    { id: 'social_media', label: 'Social Media', icon: Share2 }
  ];

  const generateMaterials = async (type) => {
    setLoading(true);
    try {
      const response = await api.post('/api/affiliate-panel/referrals/materials', {
        type,
        customMessage,
        campaign
      });

      if (response.data.success) {
        setMaterials(response.data.data);
      }
    } catch (error) {
      console.error('Error generating materials:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const downloadQRCode = () => {
    if (materials?.materials?.qrCode?.downloadUrl) {
      window.open(materials.materials.qrCode.downloadUrl, '_blank');
    }
  };

  React.useEffect(() => {
    if (activeTab) {
      generateMaterials(activeTab);
    }
  }, [activeTab, customMessage, campaign]);

  return (
    <AffiliatePanelLayout title="Referral Materials" subtitle="Generate and customize your referral links, QR codes, and promotional content">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/affiliate-panel/referral-management')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
          </div>
        </div>
        {/* Customization Options */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customize Your Materials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personal touch to your referral materials..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                maxLength={200}
              />
              <p className="text-sm text-gray-500 mt-1">{customMessage.length}/200 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name (Optional)
              </label>
              <input
                type="text"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="e.g., summer2024, newsletter, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">Helps track which campaigns perform best</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Generating materials...</p>
              </div>
            ) : (
              <>
                {/* Referral Links */}
                {activeTab === 'links' && materials && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Your Referral Link</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={materials.referralLink}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        <button
                          onClick={() => copyToClipboard(materials.referralLink, 'link')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {copied === 'link' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-2">💡 How to Use Your Referral Link</h5>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Share this link via email, social media, or messaging apps</li>
                        <li>• When someone clicks and registers, you'll earn referral commissions</li>
                        <li>• Track performance in your analytics dashboard</li>
                        <li>• Customize with campaign names to track different sources</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* QR Code */}
                {activeTab === 'qr_code' && materials?.materials?.qrCode && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 mb-4">Your Referral QR Code</h4>
                      <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                        <img
                          src={materials.materials.qrCode.imageUrl}
                          alt="Referral QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="mt-4 flex justify-center gap-4">
                        <button
                          onClick={() => copyToClipboard(materials.materials.qrCode.url, 'qr')}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {copied === 'qr' ? 'Copied!' : 'Copy Link'}
                        </button>
                        <button
                          onClick={downloadQRCode}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <h5 className="font-medium text-purple-900 mb-2">📱 QR Code Usage Ideas</h5>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>• Add to business cards and flyers</li>
                        <li>• Include in email signatures</li>
                        <li>• Display at events and conferences</li>
                        <li>• Share on social media posts</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Email Template */}
                {activeTab === 'email_template' && materials?.materials?.emailTemplate && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Email Subject Line</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={materials.materials.emailTemplate.subject}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        <button
                          onClick={() => copyToClipboard(materials.materials.emailTemplate.subject, 'subject')}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {copied === 'subject' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Email Content (HTML)</h4>
                      <div className="border border-gray-300 rounded-lg">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex justify-between items-center">
                          <span className="text-sm text-gray-600">HTML Template</span>
                          <button
                            onClick={() => copyToClipboard(materials.materials.emailTemplate.html, 'html')}
                            className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            {copied === 'html' ? 'Copied!' : 'Copy HTML'}
                          </button>
                        </div>
                        <div className="p-3 max-h-64 overflow-y-auto">
                          <div dangerouslySetInnerHTML={{ __html: materials.materials.emailTemplate.html }} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Plain Text Version</h4>
                      <div className="flex gap-2">
                        <textarea
                          value={materials.materials.emailTemplate.text}
                          readOnly
                          rows={4}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        <button
                          onClick={() => copyToClipboard(materials.materials.emailTemplate.text, 'text')}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {copied === 'text' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Media */}
                {activeTab === 'social_media' && materials?.materials?.socialMedia && (
                  <div className="space-y-6">
                    {Object.entries(materials.materials.socialMedia).map(([platform, content]) => {
                      const icons = {
                        facebook: Facebook,
                        twitter: Twitter,
                        linkedin: Linkedin,
                        whatsapp: MessageCircle
                      };
                      const Icon = icons[platform];
                      
                      return (
                        <div key={platform} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Icon className="h-5 w-5 text-gray-600" />
                            <h4 className="font-medium text-gray-900 capitalize">{platform}</h4>
                          </div>
                          <div className="flex gap-2">
                            <textarea
                              value={content}
                              readOnly
                              rows={3}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                            />
                            <button
                              onClick={() => copyToClipboard(content, platform)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              {copied === platform ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-medium text-green-900 mb-2">🚀 Social Media Tips</h5>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Post during peak hours for your audience</li>
                        <li>• Use relevant hashtags to increase visibility</li>
                        <li>• Engage with comments and questions</li>
                        <li>• Share success stories and testimonials</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateReferralMaterials;
