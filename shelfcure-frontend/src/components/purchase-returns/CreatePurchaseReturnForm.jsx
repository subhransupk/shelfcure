import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  AlertCircle,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle,
  RefreshCw,
  Truck,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';

const CreatePurchaseReturnForm = ({ onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Select Purchase, 2: Select Items, 3: Return Details, 4: Review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Purchase Selection
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  
  // Step 2: Item Selection
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Step 3: Return Details
  const [returnDetails, setReturnDetails] = useState({
    returnReason: 'damaged_goods',
    returnReasonDetails: '',
    refundMethod: 'credit_note',
    notes: ''
  });

  // Fetch recent purchases for selection
  const fetchPurchases = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams({
        limit: '50',
        sortBy: 'purchaseDate',
        sortOrder: 'desc',
        ...(purchaseSearchTerm && { search: purchaseSearchTerm })
      });

      const response = await fetch(`/api/store-manager/purchases?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Fetched purchases data:', data.data);
        // Filter purchases that can have returns (received or completed status)
        const returnablePurchases = (data.data || []).filter(purchase =>
          ['received', 'completed'].includes(purchase.status)
        );
        console.log('✅ Returnable purchases:', returnablePurchases);
        setPurchases(returnablePurchases);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch purchases');
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setError('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available items for return from selected purchase
  const fetchAvailableItems = async (purchaseId) => {
    if (!purchaseId) {
      setError('Invalid purchase ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching available items for purchase:', purchaseId);
      const response = await fetch(`/api/store-manager/purchases/${purchaseId}/available-for-return`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Available items for return:', data.data);
        setAvailableItems(data.data.availableItems || []);
        setSelectedItems([]); // Reset selected items
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch available items');
      }
    } catch (error) {
      console.error('Error fetching available items:', error);
      setError('Failed to fetch available items');
    } finally {
      setLoading(false);
    }
  };

  // Load purchases on component mount
  useEffect(() => {
    console.log('🔄 Loading purchases...');
    fetchPurchases();
  }, [purchaseSearchTerm]);

  // Handle purchase selection
  const handlePurchaseSelect = (purchase) => {
    if (!purchase || !purchase._id) {
      console.error('❌ Invalid purchase selected:', purchase);
      setError('Invalid purchase selected');
      return;
    }

    console.log('✅ Purchase selected:', purchase);
    setSelectedPurchase(purchase);
    fetchAvailableItems(purchase._id);
    setStep(2);
  };

  // Handle item selection for return
  const handleItemSelect = (item) => {
    if (!item || !item._id) {
      console.error('❌ Invalid item selected:', item);
      return;
    }

    const existingIndex = selectedItems.findIndex(selected => selected?._id === item._id);

    if (existingIndex >= 0) {
      // Item already selected, remove it
      setSelectedItems(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // Add item with default return quantity of 1
      setSelectedItems(prev => [...prev, {
        ...item,
        returnQuantity: 1,
        itemReturnReason: 'damaged_goods',
        removeFromInventory: true
      }]);
    }
  };

  // Update return quantity for selected item
  const updateReturnQuantity = (itemId, quantity) => {
    if (!itemId) return;

    setSelectedItems(prev => prev.map(item =>
      item?._id === itemId
        ? { ...item, returnQuantity: Math.max(1, Math.min(quantity, item.availableQuantity || 1)) }
        : item
    ));
  };

  // Update item return reason
  const updateItemReturnReason = (itemId, reason) => {
    if (!itemId) return;

    setSelectedItems(prev => prev.map(item =>
      item?._id === itemId ? { ...item, itemReturnReason: reason } : item
    ));
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    
    selectedItems.forEach(item => {
      // Use original unit cost from purchase (strips or individual units)
      const returnAmount = item.returnQuantity * item.unitCost;
      subtotal += returnAmount;
    });

    return {
      subtotal,
      totalReturnAmount: subtotal
    };
  };

  // Submit purchase return
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!selectedPurchase?._id) {
        setError('No purchase selected');
        setLoading(false);
        return;
      }

      if (!selectedItems || selectedItems.length === 0) {
        setError('No items selected for return');
        setLoading(false);
        return;
      }

      // Validate all selected items have required data
      const invalidItems = selectedItems.filter(item => !item?._id);
      if (invalidItems.length > 0) {
        setError('Some selected items are invalid');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');

      const returnData = {
        originalPurchaseId: selectedPurchase._id,
        items: selectedItems.map(item => ({
          originalPurchaseItem: item._id,
          returnQuantity: item.returnQuantity || 1,
          itemReturnReason: item.itemReturnReason || 'damaged_goods',
          removeFromInventory: item.removeFromInventory !== false
        })),
        returnReason: returnDetails.returnReason,
        returnReasonDetails: returnDetails.returnReasonDetails,
        refundMethod: returnDetails.refundMethod,
        notes: returnDetails.notes
      };

      console.log('📤 Submitting return data:', returnData);

      const response = await fetch('/api/store-manager/purchase-returns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(returnData)
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create purchase return');
      }
    } catch (error) {
      console.error('Error creating purchase return:', error);
      setError('Failed to create purchase return');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totals = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create Purchase Return</h2>
            <p className="text-sm text-gray-600">Return items from a purchase order</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Step {step} of 4</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-2 h-2 rounded-full ${
                    stepNum <= step ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="p-6">
        {/* Step 1: Select Purchase */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Purchase Order</h3>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by purchase order number, invoice number, or supplier..."
                  value={purchaseSearchTerm}
                  onChange={(e) => setPurchaseSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Purchases List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading purchases...</span>
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No returnable purchases found</h3>
                <p className="text-gray-600">Only received or completed purchases can have returns.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.filter(purchase => purchase && purchase._id).map((purchase) => (
                  <div
                    key={purchase._id}
                    onClick={() => handlePurchaseSelect(purchase)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {purchase.purchaseOrderNumber}
                            </h4>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">{purchase.supplier?.name}</span> • {formatDate(purchase.purchaseDate)}
                            </p>
                          </div>
                        </div>

                        {/* Medicine List Preview */}
                        {purchase.items && purchase.items.length > 0 && (
                          <div className="ml-11">
                            <p className="text-xs text-gray-500 mb-1">Medicines:</p>
                            <div className="flex flex-wrap gap-1">
                              {purchase.items.slice(0, 3).map((item, index) => (
                                <span
                                  key={index}
                                  className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded"
                                >
                                  {item.medicineName || item.medicine?.name || 'Unknown Medicine'}
                                </span>
                              ))}
                              {purchase.items.length > 3 && (
                                <span className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                                  +{purchase.items.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(purchase.totalAmount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {purchase.items?.length || 0} items
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Status: <span className="capitalize">{purchase.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Items */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Select Items to Return</h3>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Purchase Order: {selectedPurchase?.purchaseOrderNumber}
                      </p>
                      <p className="text-sm text-blue-700">
                        Supplier: {selectedPurchase?.supplier?.name} • Date: {formatDate(selectedPurchase?.purchaseDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-900">
                        Total Purchase: {formatCurrency(selectedPurchase?.totalAmount)}
                      </p>
                      <p className="text-sm text-blue-700">
                        {selectedPurchase?.items?.length || 0} items purchased
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading available items...</span>
              </div>
            ) : availableItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items available for return</h3>
                <p className="text-gray-600">All items from this purchase have already been returned.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableItems.filter(item => item && item._id).map((item) => {
                  const isSelected = selectedItems.some(selected => selected?._id === item._id);
                  const selectedItem = selectedItems.find(selected => selected?._id === item._id);

                  return (
                    <div
                      key={item._id}
                      className={`p-4 border rounded-lg transition-colors ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleItemSelect(item)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {item.medicine?.name || item.medicineName || 'Unknown Medicine'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {(item.medicine?.genericName || item.genericName) && (item.medicine?.manufacturer || item.manufacturer)
                                ? `${item.medicine?.genericName || item.genericName} • ${item.medicine?.manufacturer || item.manufacturer}`
                                : (item.medicine?.genericName || item.genericName) || (item.medicine?.manufacturer || item.manufacturer) || 'No additional details'
                              }
                            </p>
                            <p className="text-sm text-gray-500">
                              Available: {item.availableQuantity} {item.unitType}s • Unit Cost: {formatCurrency(item.unitCost)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Original Qty: {item.originalQuantity} • Already Returned: {item.alreadyReturned || 0}
                            </p>
                          </div>
                        </div>
                        
                        {isSelected && selectedItem && (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-600">Quantity:</label>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateReturnQuantity(item._id, (selectedItem.returnQuantity || 1) - 1)}
                                  disabled={(selectedItem.returnQuantity || 1) <= 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.availableQuantity || 1}
                                  value={selectedItem.returnQuantity || 1}
                                  onChange={(e) => updateReturnQuantity(item._id, parseInt(e.target.value) || 1)}
                                  className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                  onClick={() => updateReturnQuantity(item._id, (selectedItem.returnQuantity || 1) + 1)}
                                  disabled={(selectedItem.returnQuantity || 1) >= (item.availableQuantity || 1)}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(selectedItem.returnQuantity * item.unitCost)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedItems.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedItems.length} item(s) selected • Total: {formatCurrency(totals.totalReturnAmount)}
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Return Details */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Return Details</h3>
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            <div className="space-y-6">
              {/* Return Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Reason *
                </label>
                <select
                  value={returnDetails.returnReason}
                  onChange={(e) => setReturnDetails(prev => ({ ...prev, returnReason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="damaged_goods">Damaged Goods</option>
                  <option value="wrong_delivery">Wrong Delivery</option>
                  <option value="quality_issues">Quality Issues</option>
                  <option value="expired_products">Expired Products</option>
                  <option value="overstock">Overstock</option>
                  <option value="supplier_error">Supplier Error</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Return Reason Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Reason Details
                </label>
                <textarea
                  value={returnDetails.returnReasonDetails}
                  onChange={(e) => setReturnDetails(prev => ({ ...prev, returnReasonDetails: e.target.value }))}
                  placeholder="Provide additional details about the return reason..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {returnDetails.returnReasonDetails.length}/500 characters
                </p>
              </div>

              {/* Refund Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Method
                </label>
                <select
                  value={returnDetails.refundMethod}
                  onChange={(e) => setReturnDetails(prev => ({ ...prev, refundMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="credit_note">Credit Note</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="replacement">Replacement</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={returnDetails.notes}
                  onChange={(e) => setReturnDetails(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes or instructions..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {returnDetails.notes.length}/1000 characters
                </p>
              </div>

              {/* Item-specific return reasons */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Item-specific Return Reasons</h4>
                <div className="space-y-3">
                  {selectedItems.filter(item => item && item._id).map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{item.medicine?.name || item.medicineName || 'Unknown Medicine'}</div>
                        <div className="text-sm text-gray-600">Quantity: {item.returnQuantity || 1}</div>
                      </div>
                      <select
                        value={item.itemReturnReason || 'damaged_goods'}
                        onChange={(e) => updateItemReturnReason(item._id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="damaged_goods">Damaged Goods</option>
                        <option value="wrong_item">Wrong Item</option>
                        <option value="expired">Expired</option>
                        <option value="quality_issue">Quality Issue</option>
                        <option value="overstock">Overstock</option>
                        <option value="supplier_error">Supplier Error</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Review Return
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Review Purchase Return</h3>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>

            <div className="space-y-6">
              {/* Purchase Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Purchase Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Purchase Order:</span>
                    <span className="ml-2 font-medium">{selectedPurchase?.purchaseOrderNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Supplier:</span>
                    <span className="ml-2 font-medium">{selectedPurchase?.supplier?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Purchase Date:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedPurchase?.purchaseDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="ml-2 font-medium">{selectedPurchase?.invoiceNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Return Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Return Items</h4>
                <div className="space-y-2">
                  {selectedItems.filter(item => item && item._id).map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{item.medicine?.name || item.medicineName || 'Unknown Medicine'}</div>
                        <div className="text-sm text-gray-600">
                          {(item.medicine?.genericName || item.genericName) && (item.itemReturnReason || 'damaged_goods')
                            ? `${item.medicine?.genericName || item.genericName || ''} • Reason: ${(item.itemReturnReason || 'damaged_goods').replace('_', ' ').toUpperCase()}`
                            : `Reason: ${(item.itemReturnReason || 'damaged_goods').replace('_', ' ').toUpperCase()}`
                          }
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {item.returnQuantity || 1} × {formatCurrency(item.unitCost || 0)} = {formatCurrency((item.returnQuantity || 1) * (item.unitCost || 0))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Return Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Return Reason:</span>
                    <span className="ml-2 font-medium">{returnDetails.returnReason?.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  {returnDetails.returnReasonDetails && (
                    <div>
                      <span className="text-gray-600">Details:</span>
                      <span className="ml-2">{returnDetails.returnReasonDetails}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Refund Method:</span>
                    <span className="ml-2 font-medium">{returnDetails.refundMethod?.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  {returnDetails.notes && (
                    <div>
                      <span className="text-gray-600">Notes:</span>
                      <span className="ml-2">{returnDetails.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Total Return Amount</h4>
                    <p className="text-sm text-gray-600">{selectedItems.length} item(s)</p>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totals.totalReturnAmount)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Edit Details
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating Return...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Create Purchase Return
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePurchaseReturnForm;
