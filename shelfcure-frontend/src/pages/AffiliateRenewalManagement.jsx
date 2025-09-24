import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';
import {
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Eye,
  Filter,
  Download,
  Building2,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';

const AffiliateRenewalManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [renewals, setRenewals] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDays, setFilterDays] = useState('all');
  const [sendingReminder, setSendingReminder] = useState(null);

  useEffect(() => {
    // Check if user is authenticated as affiliate
    const affiliateToken = localStorage.getItem('affiliateToken');
    const affiliateData = localStorage.getItem('affiliateData');

    if (!affiliateToken || !affiliateData) {
      console.log('No affiliate authentication found, redirecting to login');
      navigate('/affiliate-login');
      return;
    }

    fetchRenewals();
  }, [filterStatus, filterDays, navigate]);

  const fetchRenewals = async () => {
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

      const params = new URLSearchParams({
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterDays !== 'all' && { daysFilter: filterDays })
      });

      const response = await api.get(`/api/affiliate-panel/renewals?${params}`);

      if (response.data.success) {
        setRenewals(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching renewals:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(`Failed to load renewal data: ${error.response?.data?.message || error.message}`);
        // Provide sample data when API fails
        setRenewals([
          {
            id: 'SAMPLE001',
            pharmacyName: 'Sample Pharmacy',
            ownerName: 'John Doe',
            contactNumber: '+91-9876543210',
            email: 'john@sample.com',
            currentPlan: 'Premium',
            expiryDate: '2024-03-15',
            daysUntilExpiry: 25,
            status: 'upcoming',
            lastReminderSent: '2024-02-10',
            reminderCount: 2,
            totalEarnings: 15000,
            renewalValue: 25000,
            address: {
              street: '123 Sample Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            }
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (pharmacyId, reminderType = 'email') => {
    try {
      setSendingReminder(pharmacyId);
      setError('');
      setSuccess('');

      console.log(`Sending ${reminderType} reminder to pharmacy ${pharmacyId}`);

      const response = await api.post(`/api/affiliate-panel/renewals/${pharmacyId}/reminder`, {
        type: reminderType
      });

      if (response.data.success) {
        setSuccess(`Reminder sent successfully via ${reminderType}`);
        fetchRenewals(); // Refresh data
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(error.response?.data?.message || 'Failed to send reminder. Please try again.');
      }
    } finally {
      setSendingReminder(null);
    }
  };

  const exportRenewals = async () => {
    try {
      setError('');
      setSuccess('');

      console.log('Exporting renewals data...');

      const params = new URLSearchParams({
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterDays !== 'all' && { daysFilter: filterDays })
      });

      const response = await api.get(`/api/affiliate-panel/renewals/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `renewals-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccess('Renewal data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(error.response?.data?.message || 'Failed to export renewal data. Please try again.');
      }
    }
  };

  const getDaysUntilRenewal = (renewalDate) => {
    const today = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expiring_soon':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status, daysUntilRenewal) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    if (daysUntilRenewal < 0) {
      return `${baseClasses} bg-red-100 text-red-800`;
    } else if (daysUntilRenewal <= 7) {
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    } else if (daysUntilRenewal <= 30) {
      return `${baseClasses} bg-blue-100 text-blue-800`;
    } else {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
  };

  const getStatusText = (daysUntilRenewal) => {
    if (daysUntilRenewal < 0) {
      return `Expired ${Math.abs(daysUntilRenewal)} days ago`;
    } else if (daysUntilRenewal === 0) {
      return 'Expires today';
    } else if (daysUntilRenewal <= 7) {
      return `Expires in ${daysUntilRenewal} days`;
    } else {
      return `${daysUntilRenewal} days remaining`;
    }
  };

  const getPriorityColor = (daysUntilRenewal) => {
    if (daysUntilRenewal < 0) return 'border-l-red-500';
    if (daysUntilRenewal <= 7) return 'border-l-yellow-500';
    if (daysUntilRenewal <= 30) return 'border-l-blue-500';
    return 'border-l-green-500';
  };

  if (loading) {
    return (
      <AffiliatePanelLayout title="Renewal Management" subtitle="Track and manage pharmacy subscription renewals">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  return (
    <AffiliatePanelLayout title="Renewal Management" subtitle="Track and manage pharmacy subscription renewals">
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
                <h3 className="text-sm font-medium text-red-800">Error loading renewal data</h3>
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
                          onClick={fetchRenewals}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <RefreshCw className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Renewals</p>
                <p className="text-2xl font-bold text-gray-900">{renewals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">
                  {renewals.filter(r => getDaysUntilRenewal(r.renewalDate) <= 7 && getDaysUntilRenewal(r.renewalDate) >= 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-900">
                  {renewals.filter(r => getDaysUntilRenewal(r.renewalDate) < 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {renewals.filter(r => getDaysUntilRenewal(r.renewalDate) > 7).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>

              <select
                value={filterDays}
                onChange={(e) => setFilterDays(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Time</option>
                <option value="7">Next 7 days</option>
                <option value="15">Next 15 days</option>
                <option value="30">Next 30 days</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <button
              onClick={exportRenewals}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Renewals List */}
        <div className="space-y-4">
          {renewals.map((renewal) => {
            const daysUntilRenewal = getDaysUntilRenewal(renewal.renewalDate);
            
            return (
              <div
                key={renewal.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 ${getPriorityColor(daysUntilRenewal)} p-6`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">{renewal.pharmacyName}</h3>
                      <span className={getStatusBadge(renewal.status, daysUntilRenewal)}>
                        {getStatusText(daysUntilRenewal)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Owner:</strong> {renewal.ownerName}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {renewal.contactNumber}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {renewal.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Plan:</strong> {renewal.subscriptionPlan}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Start Date:</strong> {new Date(renewal.subscriptionStart).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Renewal Date:</strong> {new Date(renewal.renewalDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Last Reminder:</strong> {renewal.lastReminderSent ? new Date(renewal.lastReminderSent).toLocaleDateString() : 'Never'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Reminders Sent:</strong> {renewal.reminderCount || 0}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Status:</strong> {renewal.renewalStatus || 'Pending'}
                        </p>
                      </div>
                    </div>

                    {renewal.notes && (
                      <div className="bg-gray-50 rounded-md p-3 mb-4">
                        <p className="text-sm text-gray-700">{renewal.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => sendReminder(renewal.id, 'email')}
                        disabled={sendingReminder === renewal.id}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Mail className="w-3 h-3" />
                        {sendingReminder === renewal.id ? 'Sending...' : 'Email'}
                      </button>
                      
                      <button
                        onClick={() => sendReminder(renewal.id, 'whatsapp')}
                        disabled={sendingReminder === renewal.id}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <MessageSquare className="w-3 h-3" />
                        WhatsApp
                      </button>
                    </div>

                    <button
                      onClick={() => navigate(`/affiliate-panel/renewals/${renewal.id}`)}
                      className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {renewals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <RefreshCw className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No renewals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Renewal data will appear here as your referred pharmacies approach their renewal dates.
            </p>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <Calendar className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Renewal Management Tips
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Send reminders 15 days before renewal for best results</li>
                  <li>Follow up with expired customers within 7 days</li>
                  <li>Use WhatsApp for immediate attention, email for detailed information</li>
                  <li>Track reminder effectiveness and adjust your strategy</li>
                  <li>Offer incentives for early renewals to improve retention</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateRenewalManagement;
