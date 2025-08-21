import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import CommissionService from '../services/commissionService';
import {
  ArrowLeft, CheckCircle, CreditCard, Download, Calendar,
  DollarSign, User, Store, FileText, Clock, AlertTriangle
} from 'lucide-react';

const CommissionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [commission, setCommission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch commission details
  useEffect(() => {
    fetchCommissionDetails();
  }, [id]);

  const fetchCommissionDetails = async () => {
    try {
      setLoading(true);
      const response = await CommissionService.getCommissionById(id);
      
      if (response.success) {
        setCommission(response.data);
      } else {
        setError('Failed to fetch commission details');
      }
    } catch (error) {
      console.error('Error fetching commission details:', error);
      setError('Failed to fetch commission details: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  };

  // Handle approve commission
  const handleApproveCommission = async () => {
    try {
      setActionLoading(true);
      const response = await CommissionService.approveCommission(id);
      
      if (response.success) {
        setCommission(prev => ({ ...prev, status: 'approved' }));
        alert('Commission approved successfully!');
      }
    } catch (error) {
      console.error('Error approving commission:', error);
      alert('Failed to approve commission: ' + (error.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle process payment
  const handleProcessPayment = async () => {
    try {
      setActionLoading(true);
      const paymentData = {
        method: 'bank_transfer',
        notes: 'Commission payment processed'
      };

      const response = await CommissionService.processPayment([id], paymentData);
      
      if (response.success) {
        setCommission(prev => ({ 
          ...prev, 
          paymentStatus: 'paid', 
          paidDate: new Date(),
          payment: {
            ...prev.payment,
            method: 'bank_transfer',
            notes: 'Commission payment processed'
          }
        }));
        alert('Commission payment processed successfully!');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment: ' + (error.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle download receipt
  const handleDownloadReceipt = () => {
    alert(`Downloading receipt for commission ID: ${id}`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-lg">Loading commission details...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Commission</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin/affiliate-commissions')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Commissions
          </button>
        </div>
      </AdminLayout>
    );
  }

  if (!commission) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <FileText className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Commission Not Found</h2>
          <p className="text-gray-600 mb-4">The requested commission could not be found.</p>
          <button
            onClick={() => navigate('/admin/affiliate-commissions')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Commissions
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/affiliate-commissions')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Commissions
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Commission Details</h1>
              <p className="text-gray-600">ID: {commission._id}</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            {commission.status === 'pending' && (
              <button
                onClick={handleApproveCommission}
                disabled={actionLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Commission
              </button>
            )}
            {commission.status === 'approved' && commission.paymentStatus !== 'paid' && (
              <button
                onClick={handleProcessPayment}
                disabled={actionLoading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Process Payment
              </button>
            )}
            {commission.paymentStatus === 'paid' && (
              <button
                onClick={handleDownloadReceipt}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </button>
            )}
          </div>
        </div>

        {/* Status Banner */}
        <div className={`p-4 rounded-lg border-l-4 ${
          commission.status === 'paid' ? 'bg-green-50 border-green-400' :
          commission.status === 'approved' ? 'bg-blue-50 border-blue-400' :
          commission.status === 'pending' ? 'bg-yellow-50 border-yellow-400' :
          'bg-red-50 border-red-400'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                Commission Status: <span className="capitalize">{commission.status}</span>
              </h3>
              <p className="text-sm text-gray-600">
                Payment Status: <span className="capitalize">{commission.paymentStatus}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(commission.commissionAmount)}
              </div>
              <div className="text-sm text-gray-600">Commission Amount</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Basic Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Commission ID:</span>
                <span className="font-medium">{commission._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{commission.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Period:</span>
                <span className="font-medium">
                  {commission.formattedPeriod || `${commission.period?.month}/${commission.period?.year}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Currency:</span>
                <span className="font-medium">{commission.currency || 'INR'}</span>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Financial Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Amount:</span>
                <span className="font-medium">{formatCurrency(commission.baseAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission Rate:</span>
                <span className="font-medium">{commission.commissionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission Amount:</span>
                <span className="font-medium text-green-600">{formatCurrency(commission.commissionAmount)}</span>
              </div>
              {commission.payment?.netAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Amount:</span>
                  <span className="font-medium">{formatCurrency(commission.payment.netAmount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Affiliate and Store Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Affiliate Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Affiliate Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{commission.affiliate?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{commission.affiliate?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Affiliate Code:</span>
                <span className="font-medium">{commission.affiliate?.affiliateCode || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{commission.affiliate?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Store Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Store className="w-5 h-5 mr-2" />
              Store Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Store Name:</span>
                <span className="font-medium">{commission.store?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Store Code:</span>
                <span className="font-medium">{commission.store?.code || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Owner:</span>
                <span className="font-medium">{commission.store?.owner?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{commission.store?.address?.city || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dates Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Important Dates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="text-gray-600 block text-sm">Earned Date:</span>
              <span className="font-medium text-lg">{formatDate(commission.earnedDate)}</span>
            </div>
            <div>
              <span className="text-gray-600 block text-sm">Due Date:</span>
              <span className="font-medium text-lg">{formatDate(commission.dueDate)}</span>
            </div>
            {commission.paidDate && (
              <div>
                <span className="text-gray-600 block text-sm">Paid Date:</span>
                <span className="font-medium text-lg text-green-600">{formatDate(commission.paidDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Information */}
        {commission.payment && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-gray-600 block text-sm">Payment Method:</span>
                <span className="font-medium capitalize">{commission.payment.method || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600 block text-sm">Transaction ID:</span>
                <span className="font-medium">{commission.payment.transactionId || 'N/A'}</span>
              </div>
              {commission.payment.processingFee && (
                <div>
                  <span className="text-gray-600 block text-sm">Processing Fee:</span>
                  <span className="font-medium">{formatCurrency(commission.payment.processingFee)}</span>
                </div>
              )}
              {commission.payment.notes && (
                <div className="md:col-span-2">
                  <span className="text-gray-600 block text-sm">Payment Notes:</span>
                  <span className="font-medium">{commission.payment.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subscription Information */}
        {commission.subscription && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Subscription Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-gray-600 block text-sm">Plan Name:</span>
                <span className="font-medium">{commission.subscription.planName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600 block text-sm">Plan Type:</span>
                <span className="font-medium">{commission.subscription.planType || 'N/A'}</span>
              </div>
              {commission.subscription.subscriptionStartDate && (
                <div>
                  <span className="text-gray-600 block text-sm">Start Date:</span>
                  <span className="font-medium">{formatDate(commission.subscription.subscriptionStartDate)}</span>
                </div>
              )}
              {commission.subscription.subscriptionEndDate && (
                <div>
                  <span className="text-gray-600 block text-sm">End Date:</span>
                  <span className="font-medium">{formatDate(commission.subscription.subscriptionEndDate)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {commission.notes && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h3>
            <p className="text-gray-700">{commission.notes}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CommissionDetailsPage;
