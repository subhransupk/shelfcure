import React, { useState } from 'react';
import { ArrowLeft, Mail, User, MessageSquare, Send, Copy, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';

const AffiliateReferralInvite = () => {
  const [formData, setFormData] = useState({
    inviteeName: '',
    inviteeEmail: '',
    personalMessage: '',
    referralSource: 'email'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [invitationResult, setInvitationResult] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/affiliate-panel/referrals/invite', formData);

      if (response.data.success) {
        setInvitationResult(response.data.data);
        setSuccess(true);
        setFormData({
          inviteeName: '',
          inviteeEmail: '',
          personalMessage: '',
          referralSource: 'email'
        });
      }
    } catch (error) {
      console.error('Send invitation error:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(error.response?.data?.message || 'Failed to send invitation');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationLink = () => {
    if (invitationResult?.invitationLink) {
      navigator.clipboard.writeText(invitationResult.invitationLink);
      // You could add a toast notification here
    }
  };

  const shareInvitation = () => {
    if (navigator.share && invitationResult?.invitationLink) {
      navigator.share({
        title: 'Join ShelfCure Affiliate Program',
        text: `${formData.inviteeName}, you're invited to join the ShelfCure Affiliate Program!`,
        url: invitationResult.invitationLink
      });
    }
  };

  if (success && invitationResult) {
    return (
      <AffiliatePanelLayout
        title="Invitation Sent"
        subtitle="Your referral invitation has been sent successfully"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Invitation Sent Successfully!</h2>
              <p className="text-gray-600 mt-2">
                Your referral invitation has been sent to {invitationResult.inviteeEmail}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Invitation Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invitee:</span>
                  <span className="font-medium">{invitationResult.inviteeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{invitationResult.inviteeEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    {invitationResult.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sent:</span>
                  <span className="font-medium">
                    {new Date(invitationResult.sentDate).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invitation Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invitationResult.invitationLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={copyInvitationLink}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
                {navigator.share && (
                  <button
                    onClick={shareInvitation}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSuccess(false)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
              >
                Send Another Invitation
              </button>
              <button
                onClick={() => navigate('/affiliate-panel/referrals')}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  return (
    <AffiliatePanelLayout
      title="Invite New Affiliate"
      subtitle="Send a referral invitation to invite others to join the affiliate program"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/affiliate-panel/referral-management')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invite New Affiliate</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Send a referral invitation to invite others to join the affiliate program
              </p>
            </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Invitee Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Invitee Name *
              </label>
              <input
                type="text"
                name="inviteeName"
                value={formData.inviteeName}
                onChange={handleInputChange}
                required
                placeholder="Enter the person's full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Invitee Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                name="inviteeEmail"
                value={formData.inviteeEmail}
                onChange={handleInputChange}
                required
                placeholder="Enter their email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>



            {/* Personal Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Personal Message (Optional)
              </label>
              <textarea
                name="personalMessage"
                value={formData.personalMessage}
                onChange={handleInputChange}
                rows={4}
                placeholder="Add a personal message to make your invitation more compelling..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.personalMessage.length}/500 characters
              </p>
            </div>

            {/* Referral Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Source
              </label>
              <select
                name="referralSource"
                value={formData.referralSource}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="social_media">Social Media</option>
                <option value="direct_link">Direct Link</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/affiliate-panel/referrals')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
          </div>

          {/* Tips */}
          <div className="mt-6 sm:mt-8 bg-blue-50 rounded-lg p-4 sm:p-6">
            <h3 className="font-medium text-blue-900 mb-3">💡 Tips for Successful Referrals</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Personalize your message to explain why you think they'd be a good fit</li>
              <li>• Mention the benefits of joining the affiliate program</li>
              <li>• Follow up if they don't respond within a few days</li>
              <li>• Share your own success story to motivate them</li>
            </ul>
          </div>
        </div>
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateReferralInvite;
