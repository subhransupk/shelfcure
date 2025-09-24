import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  Users,
  Mail,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  MoreVertical,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';

const AffiliateReferralList = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvitations();
  }, [filters]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/api/affiliate-panel/referrals/invitations?${queryParams}`);

      if (response.data.success) {
        setInvitations(response.data.data.invitations);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Fetch invitations error:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError('Failed to fetch invitations');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
      page: 1
    }));
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({
      ...prev,
      status,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const resendInvitation = async (invitationId) => {
    try {
      const response = await api.post(`/api/affiliate-panel/referrals/invitations/${invitationId}/resend`);

      if (response.data.success) {
        // Refresh the list
        fetchInvitations();
      }
    } catch (error) {
      console.error('Resend invitation error:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(error.response?.data?.message || 'Failed to resend invitation');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'opened':
        return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'registered':
      case 'verified':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-red-600" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'opened':
        return 'bg-yellow-100 text-yellow-800';
      case 'registered':
      case 'verified':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status', count: pagination.totalItems || 0 },
    { value: 'sent', label: 'Sent', count: 0 },
    { value: 'opened', label: 'Opened', count: 0 },
    { value: 'registered', label: 'Registered', count: 0 },
    { value: 'active', label: 'Active', count: 0 },
    { value: 'expired', label: 'Expired', count: 0 }
  ];

  return (
    <AffiliatePanelLayout title="My Referral Invitations" subtitle="Track and manage all your referral invitations">
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
          <div className="flex-1">
            <button
              onClick={() => navigate('/affiliate-panel/referrals/invite')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              New Invitation
            </button>
          </div>
          </div>
        </div>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusFilter(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    filters.status === option.value
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                  {option.count > 0 && (
                    <span className="ml-1 text-xs">({option.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Invitations List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading invitations...</p>
            </div>
          ) : invitations.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Invitee</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Sent Date</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Activity</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invitations.map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-900">{invitation.inviteeName}</p>
                            <p className="text-sm text-gray-600">{invitation.inviteeEmail}</p>
                            {invitation.inviteePhone && (
                              <p className="text-sm text-gray-500">{invitation.inviteePhone}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(invitation.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                              {invitation.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm text-gray-900">
                              {new Date(invitation.sentDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(invitation.sentDate).toLocaleTimeString()}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            <p className="text-gray-900">
                              {invitation.emailsSent} email{invitation.emailsSent !== 1 ? 's' : ''} sent
                            </p>
                            {invitation.remindersSent > 0 && (
                              <p className="text-gray-600">
                                {invitation.remindersSent} reminder{invitation.remindersSent !== 1 ? 's' : ''}
                              </p>
                            )}
                            {invitation.openedDate && (
                              <p className="text-green-600">
                                Opened {new Date(invitation.openedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {['sent', 'opened'].includes(invitation.status) && !invitation.isExpired && (
                              <button
                                onClick={() => resendInvitation(invitation.id)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Resend invitation"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            )}
                            {invitation.registeredAffiliate && (
                              <button
                                onClick={() => navigate(`/affiliate-panel/referrals/affiliate/${invitation.registeredAffiliate._id}`)}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="View affiliate details"
                              >
                                <Users className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="border-t px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                      {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                      {pagination.totalItems} results
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 border rounded text-sm ${
                            page === pagination.currentPage
                              ? 'bg-green-600 text-white border-green-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.status !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'You haven\'t sent any referral invitations yet'}
              </p>
              <button
                onClick={() => navigate('/affiliate-panel/referrals/invite')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Send Your First Invitation
              </button>
            </div>
          )}
        </div>
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateReferralList;
