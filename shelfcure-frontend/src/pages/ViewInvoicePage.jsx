import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '../config/api';
import {
  Receipt, ArrowLeft, Edit, Download, Send, Trash2,
  Calendar, User, DollarSign, CheckCircle, Clock,
  AlertCircle, Building, Mail, Phone, MapPin
} from 'lucide-react';

const ViewInvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch invoice details
  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await makeAuthenticatedRequest(`${API_ENDPOINTS.ADMIN_INVOICES}/${id}`);
      
      if (data.success) {
        setInvoice(data.data);
      } else {
        setError(data.message || 'Failed to fetch invoice details');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Error fetching invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  // Handle delete invoice
  const handleDeleteInvoice = async () => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        const data = await makeAuthenticatedRequest(`${API_ENDPOINTS.ADMIN_INVOICES}/${id}`, {
          method: 'DELETE'
        });
        
        if (data.success) {
          alert('Invoice deleted successfully!');
          navigate('/admin/invoices');
        } else {
          alert(`Failed to delete invoice: ${data.message}`);
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error deleting invoice. Please try again.');
      }
    }
  };

  // Handle download invoice
  const handleDownloadInvoice = async () => {
    try {
      alert('Download functionality will be implemented soon!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error downloading invoice. Please try again.');
    }
  };

  // Handle send invoice
  const handleSendInvoice = async () => {
    try {
      alert('Send invoice functionality will be implemented soon!');
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Error sending invoice. Please try again.');
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async () => {
    try {
      const data = await makeAuthenticatedRequest(`${API_ENDPOINTS.ADMIN_INVOICES}/${id}/mark-paid`, {
        method: 'PUT'
      });
      
      if (data.success) {
        alert('Invoice marked as paid successfully!');
        fetchInvoice(); // Refresh the invoice data
      } else {
        alert(`Failed to mark invoice as paid: ${data.message}`);
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      alert('Error marking invoice as paid. Please try again.');
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'draft': return <Edit className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Invoice Details" subtitle="Loading invoice details...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Invoice Details" subtitle="Error loading invoice">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Invoice</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/admin/invoices')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!invoice) {
    return (
      <AdminLayout title="Invoice Details" subtitle="Invoice not found">
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Invoice Not Found</h3>
          <p className="mt-1 text-sm text-gray-500">The invoice you're looking for doesn't exist.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/admin/invoices')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={`Invoice ${invoice.invoiceNumber}`} 
      subtitle="View invoice details and manage invoice"
    >
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/invoices')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadInvoice}
              className="flex items-center px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
            <button
              onClick={handleSendInvoice}
              className="flex items-center px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Invoice
            </button>
            <button
              onClick={() => navigate(`/admin/invoices/${invoice.id}/edit`)}
              className="flex items-center px-4 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            {invoice.status === 'pending' && (
              <button
                onClick={handleMarkAsPaid}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Paid
              </button>
            )}
            <button
              onClick={handleDeleteInvoice}
              className="flex items-center px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Invoice Details Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Receipt className="w-8 h-8 text-primary-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Invoice {invoice.invoiceNumber}
                  </h3>
                  <p className="text-sm text-gray-500">{invoice.description}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {getStatusIcon(invoice.status)}
                  <span className="ml-1 capitalize">{invoice.status}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Customer Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{invoice.customer?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{invoice.customer?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{invoice.customer?.phone || 'N/A'}</span>
                  </div>
                  {invoice.store && (
                    <>
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-900">{invoice.store.name}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-900">{invoice.store.location || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Invoice Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Invoice Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Invoice Date:</span>
                    <span className="text-sm text-gray-900">{formatDate(invoice.issueDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Due Date:</span>
                    <span className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</span>
                  </div>
                  {invoice.paidDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Paid Date:</span>
                      <span className="text-sm text-gray-900">{formatDate(invoice.paidDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Type:</span>
                    <span className="text-sm text-gray-900 capitalize">{invoice.type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        {invoice.items && invoice.items.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoice Summary */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Invoice Summary</h3>
          </div>
          <div className="px-6 py-6">
            <div className="max-w-md ml-auto space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Subtotal:</span>
                <span className="text-sm text-gray-900">{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tax:</span>
                <span className="text-sm text-gray-900">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-base font-medium text-gray-900">Total:</span>
                <span className="text-base font-medium text-gray-900">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ViewInvoicePage;
