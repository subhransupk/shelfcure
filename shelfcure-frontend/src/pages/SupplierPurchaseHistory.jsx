import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Receipt,
  Calendar,
  Package,
  Truck,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Clock,
  DollarSign,
  FileText
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';

const SupplierPurchaseHistory = () => {
  const { supplierId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [supplier, setSupplier] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [regularPurchases, setRegularPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('regular'); // 'regular' or 'history'
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10
  });

  useEffect(() => {
    fetchSupplierData();
  }, [supplierId]);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch supplier details
      const supplierResponse = await fetch(`/api/store-manager/suppliers/${supplierId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (supplierResponse.ok) {
        const supplierData = await supplierResponse.json();
        setSupplier(supplierData.data);
      }

      // Fetch purchase history
      const historyResponse = await fetch(`/api/store-manager/suppliers/${supplierId}/purchases?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setPurchaseHistory(historyData.data?.purchases || []);
        setPagination(historyData.data?.pagination || pagination);
        
        // Analyze regular purchases from the history
        analyzeRegularPurchases(historyData.data?.purchases || []);
      }

    } catch (error) {
      console.error('Error fetching supplier data:', error);
      setError('Failed to load supplier data');
    } finally {
      setLoading(false);
    }
  };

  const analyzeRegularPurchases = (purchases) => {
    // Group medicines by name and analyze frequency
    const medicineStats = {};
    
    purchases.forEach(purchase => {
      purchase.items?.forEach(item => {
        const medicineName = item.medicineName;
        if (!medicineStats[medicineName]) {
          medicineStats[medicineName] = {
            name: medicineName,
            medicine: item.medicine,
            purchaseCount: 0,
            totalQuantity: 0,
            totalAmount: 0,
            lastPurchased: null,
            avgQuantity: 0,
            unitType: item.unitType || 'strip'
          };
        }
        
        medicineStats[medicineName].purchaseCount += 1;
        medicineStats[medicineName].totalQuantity += item.quantity;
        medicineStats[medicineName].totalAmount += item.totalCost;
        
        const purchaseDate = new Date(purchase.purchaseDate);
        if (!medicineStats[medicineName].lastPurchased || purchaseDate > new Date(medicineStats[medicineName].lastPurchased)) {
          medicineStats[medicineName].lastPurchased = purchase.purchaseDate;
        }
      });
    });

    // Filter medicines purchased 2+ times and calculate averages
    const regularMeds = Object.values(medicineStats)
      .filter(med => med.purchaseCount >= 2)
      .map(med => ({
        ...med,
        avgQuantity: Math.round(med.totalQuantity / med.purchaseCount),
        avgAmount: med.totalAmount / med.purchaseCount
      }))
      .sort((a, b) => b.purchaseCount - a.purchaseCount);

    setRegularPurchases(regularMeds);
    
    // Smart default tab selection
    if (regularMeds.length > 0) {
      setActiveTab('regular');
    } else {
      setActiveTab('history');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'ordered': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-yellow-100 text-yellow-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'received': 'bg-green-100 text-green-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'partial': 'bg-orange-100 text-orange-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <StoreManagerLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Loading supplier data...</span>
        </div>
      </StoreManagerLayout>
    );
  }

  if (error) {
    return (
      <StoreManagerLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </StoreManagerLayout>
    );
  }

  return (
    <StoreManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/store-panel/suppliers')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 text-left">
                    Purchase History
                  </h1>
                  <p className="text-sm text-gray-500 text-left">
                    View purchase patterns and analyze supplier performance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Info */}
        {supplier && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-gray-900 text-left">{supplier.name}</h2>
                  <p className="text-sm text-gray-600 text-left">{supplier.contactPerson}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    {supplier.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-1" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-1" />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address?.city && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{supplier.address.city}, {supplier.address.state}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{((supplier.totalPurchaseAmount || 0) / 100000).toFixed(1)}L
                  </div>
                  <div className="text-xs text-gray-500">Total Purchases</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabbed Interface */}
        <div className="bg-white shadow rounded-lg">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('regular')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'regular'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Regular/Recurring Purchases
                  {regularPurchases.length > 0 && (
                    <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {regularPurchases.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2" />
                  Previous Purchases
                  {purchaseHistory.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {purchaseHistory.length}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-6">
            {activeTab === 'regular' && (
              <div className="space-y-6">
                <div className="text-left">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Frequently Ordered Medicines
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Medicines ordered from this supplier 2 or more times, with suggested reorder quantities based on historical data.
                  </p>
                </div>

                {regularPurchases.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularPurchases.map((medicine, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 mb-3">{medicine.name}</h4>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                              <span className="text-blue-600 font-medium">
                                Ordered {medicine.purchaseCount} times
                              </span>
                            </div>
                            <div className="flex items-center text-sm">
                              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 flex-shrink-0"></div>
                              <span className="text-gray-600">
                                Total: {medicine.totalQuantity} {medicine.unitType}
                              </span>
                            </div>
                            <div className="flex items-center text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                              <span className="text-gray-600">
                                Avg: {medicine.avgQuantity} {medicine.unitType}
                              </span>
                            </div>
                            <div className="flex items-center text-sm">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 flex-shrink-0"></div>
                              <span className="text-gray-500">
                                Last: {new Date(medicine.lastPurchased).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="bg-green-50 rounded-lg p-3 mb-3">
                            <div className="flex items-center text-sm text-green-800">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              <span className="font-medium">Suggested Reorder</span>
                            </div>
                            <div className="text-lg font-semibold text-green-900 mt-1">
                              {Math.ceil(medicine.avgQuantity * 1.2)} {medicine.unitType}
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              Based on 20% buffer over average
                            </div>
                          </div>

                          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                            <div className="flex justify-between">
                              <span>Avg Cost:</span>
                              <span>₹{medicine.avgAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Total Spent:</span>
                              <span>₹{medicine.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Regular Purchase Patterns Found</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      This supplier needs more purchase history to identify regular ordering patterns.
                      Medicines appear here after being ordered 2 or more times.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="text-left">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Previous Purchase Orders
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Chronological list of all purchase orders from this supplier, sorted by most recent first.
                  </p>
                </div>

                {purchaseHistory.length > 0 ? (
                  <div className="space-y-6">
                    {purchaseHistory.map((purchase) => (
                      <div key={purchase._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-left">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {purchase.purchaseOrderNumber || `PO-${purchase._id.slice(-6).toUpperCase()}`}
                            </h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1 space-x-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{new Date(purchase.purchaseDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                <span className="font-medium text-gray-900">₹{purchase.totalAmount?.toFixed(2) || '0.00'}</span>
                              </div>
                              {purchase.invoiceNumber && (
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1" />
                                  <span>{purchase.invoiceNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                              {purchase.status?.charAt(0).toUpperCase() + purchase.status?.slice(1)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(purchase.paymentStatus)}`}>
                              {purchase.paymentStatus?.charAt(0).toUpperCase() + purchase.paymentStatus?.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Purchase Summary */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Items:</span>
                              <span className="ml-2 font-medium">{purchase.items?.length || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Subtotal:</span>
                              <span className="ml-2 font-medium">₹{purchase.subtotal?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Tax:</span>
                              <span className="ml-2 font-medium">₹{purchase.totalTax?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Payment Terms:</span>
                              <span className="ml-2 font-medium">{purchase.paymentTerms || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-900 text-left">Items Purchased:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {purchase.items?.map((item, idx) => (
                              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="text-left">
                                  <p className="font-medium text-gray-900 mb-1">
                                    {item.medicineName || 'Unknown Medicine'}
                                  </p>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                      <span>Quantity:</span>
                                      <span>{item.quantity} {item.unitType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Unit Cost:</span>
                                      <span>₹{item.unitCost?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Total:</span>
                                      <span className="font-medium">₹{item.totalCost?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {item.batch?.batchNumber && (
                                      <div className="flex justify-between">
                                        <span>Batch:</span>
                                        <span>{item.batch.batchNumber}</span>
                                      </div>
                                    )}
                                    {item.batch?.expiryDate && (
                                      <div className="flex justify-between">
                                        <span>Expiry:</span>
                                        <span>{new Date(item.batch.expiryDate).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Additional Info */}
                        {(purchase.notes || purchase.expectedDeliveryDate) && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {purchase.expectedDeliveryDate && (
                                <div>
                                  <span className="text-gray-500 flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Expected Delivery:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {new Date(purchase.expectedDeliveryDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {purchase.notes && (
                                <div>
                                  <span className="text-gray-500">Notes:</span>
                                  <p className="mt-1 text-gray-700">{purchase.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase History</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      No purchase orders have been placed with this supplier yet. Once you create your first purchase order,
                      it will appear here with full transaction details.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreManagerLayout>
  );
};

export default SupplierPurchaseHistory;
