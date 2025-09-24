import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';
import {
  Building2,
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Save
} from 'lucide-react';

const AffiliatePharmacyOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('submit');
  const [submissions, setSubmissions] = useState([]);
  
  const [formData, setFormData] = useState({
    pharmacyName: '',
    ownerName: '',
    contactNumber: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    subscriptionPlan: '',
    startDate: '',
    remarks: '',
    documents: {
      license: null,
      gstCertificate: null
    }
  });

  const subscriptionPlans = [
    { id: 'basic', name: 'Basic Plan', price: 999, features: ['Basic inventory', 'Sales tracking', 'Customer management'] },
    { id: 'standard', name: 'Standard Plan', price: 1999, features: ['All Basic features', 'Advanced analytics', 'Multi-store support'] },
    { id: 'premium', name: 'Premium Plan', price: 2999, features: ['All Standard features', 'AI insights', 'Priority support'] }
  ];

  useEffect(() => {
    // Check if user is authenticated as affiliate
    const affiliateToken = localStorage.getItem('affiliateToken');
    const affiliateData = localStorage.getItem('affiliateData');

    if (!affiliateToken || !affiliateData) {
      console.log('No affiliate authentication found, redirecting to login');
      navigate('/affiliate-login');
      return;
    }

    fetchSubmissions();
  }, [navigate]);

  const fetchSubmissions = async () => {
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

      const response = await api.get('/api/affiliate-panel/pharmacy-submissions');

      if (response.data.success) {
        setSubmissions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(`Failed to load submissions: ${error.response?.data?.message || error.message}`);
        // Provide sample data when API fails
        setSubmissions([
          {
            id: 'SAMPLE001',
            pharmacyName: 'Sample Pharmacy',
            ownerName: 'John Doe',
            contactNumber: '+91-9876543210',
            email: 'john@sample.com',
            address: {
              street: '123 Sample Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            },
            subscriptionPlan: 'Premium',
            startDate: '2024-02-01',
            status: 'pending',
            submittedDate: '2024-01-15',
            remarks: 'Sample submission for demonstration'
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validate required fields
      if (!formData.pharmacyName || !formData.ownerName || !formData.contactNumber ||
          !formData.email || !formData.subscriptionPlan) {
        setError('Please fill in all required fields');
        return;
      }

      const submitData = new FormData();

      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key === 'address') {
          submitData.append('address', JSON.stringify(formData.address));
        } else if (key === 'documents') {
          if (formData.documents.license) {
            submitData.append('pharmacyLicense', formData.documents.license);
          }
          if (formData.documents.gstCertificate) {
            submitData.append('gstCertificate', formData.documents.gstCertificate);
          }
        } else {
          submitData.append(key, formData[key]);
        }
      });

      console.log('Submitting pharmacy onboarding...');

      const response = await api.post('/api/affiliate-panel/pharmacy-submissions', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSuccess('Pharmacy onboarding submitted successfully! Your submission ID is: ' + response.data.data.id);
        setFormData({
          pharmacyName: '',
          ownerName: '',
          contactNumber: '',
          email: '',
          address: { street: '', city: '', state: '', pincode: '' },
          subscriptionPlan: '',
          startDate: '',
          remarks: '',
          documents: { license: null, gstCertificate: null }
        });
        fetchSubmissions();
        setActiveTab('track');
      }
    } catch (error) {
      console.error('Error submitting pharmacy:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(error.response?.data?.message || 'Failed to submit pharmacy onboarding. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileUpload = (field, file) => {
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [field]: file }
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'under_review':
        return <Eye className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'under_review':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const tabs = [
    { id: 'submit', name: 'Submit New Pharmacy', icon: Plus },
    { id: 'track', name: 'Track Submissions', icon: Eye }
  ];

  if (loading && submissions.length === 0) {
    return (
      <AffiliatePanelLayout title="Pharmacy Onboarding" subtitle="Submit new pharmacy registrations">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  return (
    <AffiliatePanelLayout title="Pharmacy Onboarding" subtitle="Submit new pharmacy registrations">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading pharmacy submissions</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {error.includes('404') && (
                    <div className="mt-2">
                      <p>This could be due to:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Backend server is not running</li>
                        <li>API endpoint is not available</li>
                        <li>Authentication token has expired</li>
                      </ul>
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs">
                        <strong>Note:</strong> Sample data is being displayed below for demonstration purposes.
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => navigate('/affiliate-login')}
                          className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md mr-2"
                        >
                          Re-login
                        </button>
                        <button
                          onClick={fetchSubmissions}
                          className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Submit New Pharmacy Tab */}
        {activeTab === 'submit' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pharmacy Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pharmacy Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pharmacy Name *
                    </label>
                    <input
                      type="text"
                      value={formData.pharmacyName}
                      onChange={(e) => handleInputChange('pharmacyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        value={formData.address.pincode}
                        onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Plan */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subscriptionPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.subscriptionPlan === plan.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('subscriptionPlan', plan.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{plan.name}</h4>
                        <input
                          type="radio"
                          name="subscriptionPlan"
                          value={plan.id}
                          checked={formData.subscriptionPlan === plan.id}
                          onChange={() => handleInputChange('subscriptionPlan', plan.id)}
                          className="text-green-600 focus:ring-green-500"
                        />
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        ₹{plan.price}/month
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start Date and Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks/Notes
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="Any additional information..."
                  />
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pharmacy License
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <label className="cursor-pointer">
                          <span className="text-sm font-medium text-gray-900">
                            Upload license
                          </span>
                          <span className="text-sm text-gray-500"> (PDF, JPG, PNG)</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload('license', e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.documents.license && (
                        <div className="mt-2 text-sm text-green-600">
                          {formData.documents.license.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Certificate (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <label className="cursor-pointer">
                          <span className="text-sm font-medium text-gray-900">
                            Upload certificate
                          </span>
                          <span className="text-sm text-gray-500"> (PDF, JPG, PNG)</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload('gstCertificate', e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.documents.gstCertificate && (
                        <div className="mt-2 text-sm text-green-600">
                          {formData.documents.gstCertificate.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Submitting...' : 'Submit Pharmacy Onboarding'}
              </button>
            </form>
          </div>
        )}

        {/* Track Submissions Tab */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{submission.pharmacyName}</h3>
                    <p className="text-sm text-gray-600">Owner: {submission.ownerName}</p>
                    <p className="text-sm text-gray-600">Submitted: {new Date(submission.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(submission.status)}
                    <span className={getStatusBadge(submission.status)}>
                      {submission.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Contact:</strong> {submission.contactNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Email:</strong> {submission.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Plan:</strong> {submission.subscriptionPlan}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Start Date:</strong> {submission.startDate ? new Date(submission.startDate).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                </div>

                {submission.adminNotes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm font-medium text-yellow-800">Admin Notes:</p>
                    <p className="text-sm text-yellow-700">{submission.adminNotes}</p>
                  </div>
                )}
              </div>
            ))}

            {submissions.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Submit your first pharmacy onboarding to see it here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliatePharmacyOnboarding;
