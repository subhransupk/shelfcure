import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';
import {
  CreditCard,
  Building2,
  Smartphone,
  Globe,
  Save,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  Receipt,
  FileText,
  Upload
} from 'lucide-react';

const AffiliatePaymentSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('payment-methods');
  
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [taxInfo, setTaxInfo] = useState({
    panNumber: '',
    panDocument: null,
    gstNumber: '',
    gstDocument: null,
    tdsApplicable: false
  });
  
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'bank',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    paypalEmail: '',
    isDefault: false
  });
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      const [methodsRes, historyRes, taxRes] = await Promise.all([
        api.get('/api/affiliate-panel/payment-methods'),
        api.get('/api/affiliate-panel/payout-history'),
        api.get('/api/affiliate-panel/tax-info')
      ]);

      if (methodsRes.data.success) {
        setPaymentMethods(methodsRes.data.data);
      }
      if (historyRes.data.success) {
        setPayoutHistory(historyRes.data.data);
      }
      if (taxRes.data.success) {
        setTaxInfo(taxRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError('Failed to load payment settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.post('/api/affiliate-panel/payment-methods', newPaymentMethod);
      
      if (response.data.success) {
        setPaymentMethods([...paymentMethods, response.data.data]);
        setNewPaymentMethod({
          type: 'bank',
          accountHolderName: '',
          accountNumber: '',
          ifscCode: '',
          upiId: '',
          paypalEmail: '',
          isDefault: false
        });
        setShowAddForm(false);
        setSuccess('Payment method added successfully');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      setError('Failed to add payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePaymentMethod = async (id, updates) => {
    try {
      setSaving(true);
      const response = await api.put(`/api/affiliate-panel/payment-methods/${id}`, updates);
      
      if (response.data.success) {
        setPaymentMethods(paymentMethods.map(method => 
          method.id === id ? { ...method, ...updates } : method
        ));
        setEditingMethod(null);
        setSuccess('Payment method updated successfully');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      setError('Failed to update payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.delete(`/api/affiliate-panel/payment-methods/${id}`);
      
      if (response.data.success) {
        setPaymentMethods(paymentMethods.filter(method => method.id !== id));
        setSuccess('Payment method deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      setError('Failed to delete payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleTaxInfoUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      Object.keys(taxInfo).forEach(key => {
        if (taxInfo[key] !== null) {
          formData.append(key, taxInfo[key]);
        }
      });

      const response = await api.put('/api/affiliate-panel/tax-info', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setSuccess('Tax information updated successfully');
      }
    } catch (error) {
      console.error('Error updating tax info:', error);
      setError('Failed to update tax information');
    } finally {
      setSaving(false);
    }
  };

  const downloadPayoutReceipt = async (payoutId) => {
    try {
      const response = await api.get(`/api/affiliate-panel/payout-receipt/${payoutId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payout-receipt-${payoutId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download receipt');
    }
  };

  const getPaymentMethodIcon = (type) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-5 h-5" />;
      case 'upi':
        return <Smartphone className="w-5 h-5" />;
      case 'paypal':
        return <Globe className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const tabs = [
    { id: 'payment-methods', name: 'Payment Methods', icon: CreditCard },
    { id: 'payout-history', name: 'Payout History', icon: Receipt },
    { id: 'tax-compliance', name: 'Tax Compliance', icon: FileText }
  ];

  if (loading) {
    return (
      <AffiliatePanelLayout title="Payment Settings" subtitle="Manage your payout preferences and tax information">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  return (
    <AffiliatePanelLayout title="Payment Settings" subtitle="Manage your payout preferences and tax information">
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

        {/* Payment Methods Tab */}
        {activeTab === 'payment-methods' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Payment Method
              </button>
            </div>

            {/* Payment Methods List */}
            <div className="grid gap-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getPaymentMethodIcon(method.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {method.type.charAt(0).toUpperCase() + method.type.slice(1)} Account
                          </h4>
                          {method.isDefault && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {method.type === 'bank' && `${method.accountHolderName} - ****${method.accountNumber.slice(-4)}`}
                          {method.type === 'upi' && method.upiId}
                          {method.type === 'paypal' && method.paypalEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingMethod(method)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {paymentMethods.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add a payment method to receive your payouts.
                </p>
              </div>
            )}

            {/* Add Payment Method Form */}
            {showAddForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Add Payment Method</h4>
                <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Type
                    </label>
                    <select
                      value={newPaymentMethod.type}
                      onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="bank">Bank Account</option>
                      <option value="upi">UPI</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>

                  {newPaymentMethod.type === 'bank' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={newPaymentMethod.accountHolderName}
                          onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, accountHolderName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={newPaymentMethod.accountNumber}
                          onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, accountNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={newPaymentMethod.ifscCode}
                          onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, ifscCode: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                    </>
                  )}

                  {newPaymentMethod.type === 'upi' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={newPaymentMethod.upiId}
                        onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, upiId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        placeholder="example@upi"
                        required
                      />
                    </div>
                  )}

                  {newPaymentMethod.type === 'paypal' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PayPal Email
                      </label>
                      <input
                        type="email"
                        value={newPaymentMethod.paypalEmail}
                        onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, paypalEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={newPaymentMethod.isDefault}
                      onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, isDefault: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                      Set as default payment method
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Payment Method'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Payout History Tab */}
        {activeTab === 'payout-history' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Payout History</h3>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payoutHistory.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payout.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{payout.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payout.method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payout.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : payout.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payout.transactionId || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {payout.status === 'completed' && (
                            <button
                              onClick={() => downloadPayoutReceipt(payout.id)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {payoutHistory.length === 0 && (
                <div className="text-center py-12">
                  <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No payouts yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your payout history will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tax Compliance Tab */}
        {activeTab === 'tax-compliance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Tax Compliance</h3>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <form onSubmit={handleTaxInfoUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={taxInfo.panNumber}
                      onChange={(e) => setTaxInfo({ ...taxInfo, panNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="ABCDE1234F"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PAN Document
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setTaxInfo({ ...taxInfo, panDocument: e.target.files[0] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={taxInfo.gstNumber}
                      onChange={(e) => setTaxInfo({ ...taxInfo, gstNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Certificate (Optional)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setTaxInfo({ ...taxInfo, gstDocument: e.target.files[0] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tdsApplicable"
                    checked={taxInfo.tdsApplicable}
                    onChange={(e) => setTaxInfo({ ...taxInfo, tdsApplicable: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tdsApplicable" className="ml-2 block text-sm text-gray-900">
                    TDS applicable (Tax will be deducted at source)
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Tax Compliance Information
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>PAN is required for payouts above ₹10,000</li>
                          <li>TDS will be deducted as per government regulations</li>
                          <li>GST registration is optional for businesses</li>
                          <li>All documents should be clear and valid</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Tax Information'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliatePaymentSettings;
