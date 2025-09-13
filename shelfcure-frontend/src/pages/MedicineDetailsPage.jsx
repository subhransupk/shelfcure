import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ArrowLeft,
  Eye,
  Calendar,
  MapPin,
  Pill,
  User,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Building2,
  Phone,
  Mail
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import { getCurrentUser } from '../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MedicineDetailsPage = () => {
  const { medicineId } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'sales', 'purchases'

  useEffect(() => {
    fetchMedicineDetails();
    fetchTransactionHistory();
  }, [medicineId]);

  const fetchMedicineDetails = async () => {
    try {
      const user = getCurrentUser();
      const token = localStorage.getItem('token');

      if (!user || !token) {
        setError('Authentication required - Please log in as a store manager');
        return;
      }

      const url = `${API_BASE_URL}/api/store-manager/medicines/${medicineId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to fetch medicine details`);
      }

      if (data.success) {
        setMedicine(data.data);
      } else {
        setError(data.message || 'Failed to fetch medicine details');
      }
    } catch (error) {
      console.error('Error fetching medicine details:', error);
      setError(`Error fetching medicine details: ${error.message}`);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const user = getCurrentUser();
      const token = localStorage.getItem('token');

      if (!user || !token) {
        return;
      }

      // Fetch sales history
      const salesResponse = await fetch(`${API_BASE_URL}/api/store-manager/medicines/${medicineId}/sales-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        if (salesData.success) {
          setSalesHistory(salesData.data || []);
        }
      }

      // Fetch purchase history
      const purchaseResponse = await fetch(`${API_BASE_URL}/api/store-manager/medicines/${medicineId}/purchase-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (purchaseResponse.ok) {
        const purchaseData = await purchaseResponse.json();
        if (purchaseData.success) {
          setPurchaseHistory(purchaseData.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = (current, min) => {
    if (current === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (current <= min) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  if (loading) {
    return (
      <StoreManagerLayout>
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
            </div>
          </div>
        </div>
      </StoreManagerLayout>
    );
  }

  if (error) {
    return (
      <StoreManagerLayout>
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StoreManagerLayout>
    );
  }

  if (!medicine) {
    return (
      <StoreManagerLayout>
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Medicine not found</h3>
              <p className="mt-1 text-sm text-gray-500">The requested medicine could not be found.</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/store-panel/inventory')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      </StoreManagerLayout>
    );
  }

  return (
    <StoreManagerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/store-panel/inventory')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 text-left">{medicine.name}</h1>
              <p className="text-sm text-gray-600 text-left">{medicine.genericName || 'No generic name'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/store-panel/inventory/edit/${medicineId}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              Edit Medicine
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Medicine Details
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sales'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sales History ({salesHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'purchases'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Purchase History ({purchaseHistory.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Basic Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Medicine Name</label>
                    <p className="text-lg font-semibold text-gray-900 text-left">{medicine.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Generic Name</label>
                    <p className="text-gray-900 text-left">{medicine.genericName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Composition</label>
                    <p className="text-gray-900 text-left">{medicine.composition || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Manufacturer</label>
                    <p className="text-gray-900 text-left">{medicine.manufacturer || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Category</label>
                    <p className="text-gray-900 text-left">{medicine.category || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Barcode</label>
                    <p className="text-gray-900 text-left">{medicine.barcode || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Stock Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {medicine.unitTypes?.hasStrips && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-3 text-left">Strip Information</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Current Stock:</span>
                          <span className="text-sm font-medium">{medicine.stripInfo?.stock || 0} strips</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">MRP:</span>
                          <span className="text-sm font-medium">{formatCurrency(medicine.stripInfo?.mrp || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Selling Price:</span>
                          <span className="text-sm font-medium">{formatCurrency(medicine.stripInfo?.sellingPrice || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Min Stock:</span>
                          <span className="text-sm font-medium">{medicine.stripInfo?.minStock || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatus(medicine.stripInfo?.stock || 0, medicine.stripInfo?.minStock || 0).color}`}>
                            {getStockStatus(medicine.stripInfo?.stock || 0, medicine.stripInfo?.minStock || 0).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {medicine.unitTypes?.hasIndividual && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-medium text-green-900 mb-3 text-left">Individual Information</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Current Stock:</span>
                          <span className="text-sm font-medium">{medicine.individualInfo?.stock || 0} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">MRP:</span>
                          <span className="text-sm font-medium">{formatCurrency(medicine.individualInfo?.mrp || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Selling Price:</span>
                          <span className="text-sm font-medium">{formatCurrency(medicine.individualInfo?.sellingPrice || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Min Stock:</span>
                          <span className="text-sm font-medium">{medicine.individualInfo?.minStock || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatus(medicine.individualInfo?.stock || 0, medicine.individualInfo?.minStock || 0).color}`}>
                            {getStockStatus(medicine.individualInfo?.stock || 0, medicine.individualInfo?.minStock || 0).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Additional Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Batch Number</label>
                    <p className="text-gray-900 text-left">{medicine.batchNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Expiry Date</label>
                    <p className="text-gray-900 text-left">{medicine.expiryDate ? formatDate(medicine.expiryDate) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Storage Location</label>
                    <p className="text-gray-900 text-left">{medicine.storageLocation || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Supplier</label>
                    <p className="text-gray-900 text-left">{medicine.supplier || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Notes</label>
                    <p className="text-gray-900 text-left">{medicine.notes || 'No additional notes'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales History Tab */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Sales History
              </h3>
            </div>
            <div className="p-6">
              {salesHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Method
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesHistory.map((sale, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(sale.saleDate || sale.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 text-left">
                                  {sale.customer?.name || 'Walk-in Customer'}
                                </div>
                                {sale.customer?.phone && (
                                  <div className="text-sm text-gray-500 text-left">
                                    {sale.customer.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale.quantity} {sale.unitType || 'units'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(sale.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(sale.totalPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {sale.paymentMethod || 'Cash'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No sales history</h3>
                  <p className="mt-1 text-sm text-gray-500">This medicine has not been sold yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Purchase History Tab */}
        {activeTab === 'purchases' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Purchase History
              </h3>
            </div>
            <div className="p-6">
              {purchaseHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch Info
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseHistory.map((purchase, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(purchase.purchaseDate || purchase.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 text-left">
                                  {purchase.supplier?.name || 'Unknown Supplier'}
                                </div>
                                {purchase.supplier?.phone && (
                                  <div className="text-sm text-gray-500 text-left">
                                    {purchase.supplier.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {purchase.quantity} {purchase.unitType || 'units'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(purchase.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(purchase.totalPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              {purchase.batchNumber && (
                                <div className="text-left">Batch: {purchase.batchNumber}</div>
                              )}
                              {purchase.expiryDate && (
                                <div className="text-left">Exp: {formatDate(purchase.expiryDate)}</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No purchase history</h3>
                  <p className="mt-1 text-sm text-gray-500">This medicine has not been purchased yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </StoreManagerLayout>
  );
};

export default MedicineDetailsPage;
