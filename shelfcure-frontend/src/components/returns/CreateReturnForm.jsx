import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Minus,
  Plus,
  RotateCcw,
  DollarSign,
  Info
} from 'lucide-react';
import UnitSelector from '../UnitSelector';

const CreateReturnForm = ({ onSubmit, onCancel, loading = false, preSelectedSale = null }) => {
  const [step, setStep] = useState(1); // 1: Select Sale, 2: Select Items, 3: Return Details, 4: Review
  const [selectedSale, setSelectedSale] = useState(null);
  const [salesSearch, setSalesSearch] = useState('');
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [returnItems, setReturnItems] = useState([]);
  const [returnDetails, setReturnDetails] = useState({
    returnReason: '',
    returnReasonDetails: '',
    refundMethod: 'cash',
    restoreInventory: true,
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch sales for selection
  const fetchSales = async (search = '') => {
    setLoadingSales(true);
    setErrors({}); // Clear previous errors

    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token available:', !!token);

      const queryParams = new URLSearchParams({
        page: '1',
        limit: '20',
        status: 'completed',
        ...(search && { search })
      });

      console.log('🌐 Fetching sales from:', `/api/store-manager/sales?${queryParams}`);

      const response = await fetch(`/api/store-manager/sales?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sales data received:', data);
        const salesData = data.data || [];

        // If no sales found, add some mock data for testing
        if (salesData.length === 0) {
          console.log('⚠️ No sales found, adding mock data for testing');
          const mockSales = [
            {
              _id: 'mock-sale-1',
              receiptNumber: 'RCP-001',
              invoiceNumber: 'INV-001',
              saleDate: new Date().toISOString(),
              customer: { name: 'Test Customer', phone: '1234567890' },
              totalAmount: 150.00,
              status: 'completed',
              items: [
                {
                  _id: 'mock-item-1',
                  medicine: {
                    _id: 'mock-med-1',
                    name: 'Paracetamol 500mg',
                    genericName: 'Paracetamol'
                  },
                  quantity: 2,
                  unitType: 'strip',
                  unitPrice: 25.00
                },
                {
                  _id: 'mock-item-2',
                  medicine: {
                    _id: 'mock-med-2',
                    name: 'Amoxicillin 250mg',
                    genericName: 'Amoxicillin'
                  },
                  quantity: 1,
                  unitType: 'strip',
                  unitPrice: 100.00
                }
              ]
            }
          ];
          setSales(mockSales);
        } else {
          setSales(salesData);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to fetch sales - Status:', response.status, response.statusText, 'Error:', errorData);

        let errorMessage = `HTTP ${response.status} ${response.statusText}`;
        if (errorData.message) {
          errorMessage += `: ${errorData.message}`;
        }

        // Add specific error messages for common status codes
        if (response.status === 401) {
          errorMessage += ' - Please log in again';
        } else if (response.status === 403) {
          errorMessage += ' - Access denied. Store manager role required';
        } else if (response.status === 500) {
          errorMessage += ' - Server error. Please try again later';
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      // You might want to show this error to the user
      setErrors({ fetch: error.message });
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchSales(salesSearch);
  }, [salesSearch]);

  // Check authentication status on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('🔍 Auth Status Check:');
    console.log('Token present:', !!token);
    console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'None');
    console.log('User data:', user ? JSON.parse(user) : 'None');

    if (!token) {
      setErrors({ auth: 'No authentication token found. Please log in again.' });
    } else {
      // Try to decode the token to check if it's expired
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        console.log('Token payload:', tokenPayload);
        console.log('Token expires at:', new Date(tokenPayload.exp * 1000));
        console.log('Current time:', new Date());
        console.log('Token expired:', tokenPayload.exp < currentTime);

        if (tokenPayload.exp < currentTime) {
          setErrors({ auth: 'Authentication token has expired. Please log in again.' });
        }
      } catch (tokenError) {
        console.error('Error decoding token:', tokenError);
        setErrors({ auth: 'Invalid authentication token. Please log in again.' });
      }
    }
  }, []);

  // Handle pre-selected sale
  useEffect(() => {
    if (preSelectedSale) {
      handleSaleSelect(preSelectedSale);
    }
  }, [preSelectedSale]);

  // Test authentication and connectivity
  const testAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      console.log('🔑 Testing auth with token:', token ? 'Present' : 'Missing');
      console.log('👤 User data:', user ? JSON.parse(user) : 'None');

      // First test basic connectivity
      console.log('🌐 Testing connectivity...');
      try {
        const testResponse = await fetch('/api/test');
        console.log('🧪 Test endpoint:', testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('✅ Test endpoint data:', testData);
        }
      } catch (testError) {
        console.error('❌ Test endpoint failed:', testError);
      }

      // Test health endpoint
      try {
        const healthResponse = await fetch('/api/health');
        console.log('🏥 Health check:', healthResponse.status);
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('✅ Health data:', healthData);
        }
      } catch (healthError) {
        console.error('❌ Health check failed:', healthError);
      }

      // Then test authentication
      const response = await fetch('/api/store-manager/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔐 Auth test response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Auth test successful:', data);
        alert('Authentication test successful!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Auth test failed:', response.status, response.statusText, errorData);
        alert(`Auth test failed: ${response.status} ${response.statusText}\n${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Auth test error:', error);
      alert(`Auth test error: ${error.message}`);
    }
  };

  // Handle sale selection
  const handleSaleSelect = async (sale) => {
    console.log('🛒 Sale selected:', sale);
    setSelectedSale(sale);

    // Fetch available items for return from the backend
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/sales/${sale._id}/available-for-return`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const availableItems = data.data.availableItems;

        console.log('📦 Available items for return:', availableItems);

        if (availableItems.length === 0) {
          console.log('⚠️ No items available for return from this sale');
          setReturnItems([]);
          setErrors({ sale: 'No items from this sale are available for return. All items may have already been returned.' });
          return;
        }

        // Initialize return items with available items only
        const initialReturnItems = availableItems.map(item => ({
          originalSaleItem: item._id,
          medicine: item.medicine,
          originalQuantity: item.quantity,
          originalUnitType: item.unitType,
          returnQuantity: 0,
          unitType: item.unitType,
          unitPrice: item.unitPrice,
          restoreToInventory: true,
          selected: false,
          availableQuantity: item.availableQuantity,
          alreadyReturned: item.alreadyReturned
        }));

        console.log('📦 Initialized return items:', initialReturnItems);
        setReturnItems(initialReturnItems);
        setErrors({}); // Clear any previous errors
        setStep(2);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to fetch available items:', errorData);
        setErrors({ sale: errorData.message || 'Failed to load available items for return' });
        setReturnItems([]);
      }
    } catch (error) {
      console.error('❌ Error fetching available items:', error);
      setErrors({ sale: 'Failed to load available items for return' });
      setReturnItems([]);
    }
  };

  // Handle return item changes
  const handleReturnItemChange = (index, field, value) => {
    const newItems = [...returnItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setReturnItems(newItems);
  };

  // Toggle item selection
  const toggleItemSelection = (index) => {
    if (index < 0 || index >= returnItems.length) {
      console.error('❌ Invalid index:', index, 'Array length:', returnItems.length);
      return;
    }

    setReturnItems(prev => {
      const updated = [...prev];
      const wasSelected = updated[index].selected;
      updated[index].selected = !wasSelected;

      // If unselecting, reset quantity to 0
      if (!updated[index].selected) {
        updated[index].returnQuantity = 0;
      }
      // If selecting and quantity is 0, set to maximum available quantity
      else if (updated[index].returnQuantity === 0) {
        const maxAvailable = updated[index].availableQuantity ?
          updated[index].availableQuantity[updated[index].unitType] :
          (updated[index].unitType === updated[index].originalUnitType ? updated[index].originalQuantity : 0);
        updated[index].returnQuantity = maxAvailable;
      }

      return updated;
    });
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};
    
    if (step === 1 && !selectedSale) {
      newErrors.sale = 'Please select a sale to return';
    }
    
    if (step === 2) {
      const selectedItems = returnItems.filter(item => item.selected && item.returnQuantity > 0);
      if (selectedItems.length === 0) {
        newErrors.items = 'Please select at least one item to return';
      }
      
      // Validate quantities
      selectedItems.forEach((item, index) => {
        // Use available quantity for the selected unit type, considering unit conversions
        const maxAvailable = item.availableQuantity ?
          item.availableQuantity[item.unitType] :
          (item.unitType === item.originalUnitType ? item.originalQuantity : 0);

        if (item.returnQuantity > maxAvailable) {
          newErrors[`quantity_${index}`] = `Return quantity cannot exceed available quantity (${maxAvailable} ${item.unitType}${maxAvailable !== 1 ? 's' : ''})`;
        }

        if (item.returnQuantity <= 0) {
          newErrors[`quantity_${index}`] = 'Return quantity must be greater than 0';
        }
      });
    }
    
    if (step === 3) {
      if (!returnDetails.returnReason) {
        newErrors.returnReason = 'Please select a return reason';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setStep(step - 1);
    setErrors({});
  };

  // Helper function to calculate correct unit price based on unit conversion
  const calculateUnitPrice = (item) => {
    const returnUnitType = item.unitType;
    const medicine = item.medicine;

    // Use the actual selling price from medicine data based on return unit type
    if (returnUnitType === 'strip') {
      // Return strip selling price from medicine data
      const stripPrice = medicine?.stripInfo?.sellingPrice || medicine?.pricing?.stripSellingPrice;
      return stripPrice || item.unitPrice;
    } else if (returnUnitType === 'individual') {
      // Return individual selling price from medicine data
      const individualPrice = medicine?.individualInfo?.sellingPrice || medicine?.pricing?.individualSellingPrice;
      return individualPrice || item.unitPrice;
    }

    // Fallback to original price
    return item.unitPrice;
  };

  // Calculate return totals
  const calculateTotals = () => {
    // Safety check to ensure returnItems is an array
    if (!returnItems || !Array.isArray(returnItems)) {
      return {
        itemCount: 0,
        totalQuantity: 0,
        subtotal: 0,
        totalReturnAmount: 0
      };
    }

    const selectedItems = returnItems.filter(item => item && item.selected && item.returnQuantity > 0);
    const subtotal = selectedItems.reduce((total, item) => {
      const correctUnitPrice = calculateUnitPrice(item);
      return total + (item.returnQuantity * correctUnitPrice);
    }, 0);

    return {
      itemCount: selectedItems.length,
      totalQuantity: selectedItems.reduce((total, item) => total + item.returnQuantity, 0),
      subtotal,
      totalReturnAmount: subtotal // Will be adjusted for tax/discount on backend
    };
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    const selectedItems = returnItems.filter(item => item.selected && item.returnQuantity > 0);
    
    const returnData = {
      originalSaleId: selectedSale._id,
      items: selectedItems.map(item => ({
        originalSaleItem: item.originalSaleItem,
        returnQuantity: item.returnQuantity,
        unitType: item.unitType,
        restoreToInventory: item.restoreToInventory
      })),
      ...returnDetails
    };
    
    await onSubmit(returnData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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

  // Step 1: Select Sale
  const renderSaleSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Sale to Return</h3>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by receipt number, invoice number, or customer name..."
            value={salesSearch}
            onChange={(e) => setSalesSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        {errors.sale && (
          <div className="text-red-600 text-sm mb-4">{errors.sale}</div>
        )}

        {errors.auth && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Authentication Issue</h4>
                <p className="text-sm text-yellow-600 mt-1">{errors.auth}</p>
              </div>
            </div>
          </div>
        )}



        {errors.fetch && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Failed to load sales</h4>
                <p className="text-sm text-red-600 mt-1">{errors.fetch}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => fetchSales(salesSearch)}
                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔍 Debug Info:');
                      console.log('Token:', localStorage.getItem('token'));
                      console.log('User:', localStorage.getItem('user'));
                      console.log('Current URL:', window.location.href);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Debug
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sales List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loadingSales ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading sales...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No completed sales found</p>
          </div>
        ) : (
          sales.map((sale) => (
            <div
              key={sale._id}
              onClick={() => handleSaleSelect(sale)}
              className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {sale.receiptNumber || sale.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(sale.saleDate)}
                      </p>
                    </div>
                    
                    {sale.customer && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {sale.customer.name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span>{sale.items?.length || 0} items</span>
                    <span>{formatCurrency(sale.totalAmount)}</span>
                    <span className="capitalize">{sale.paymentMethod}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(sale.totalAmount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {sale.items?.length || 0} items
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Step 2: Select Items to Return
  const renderItemSelection = () => {
    const totals = calculateTotals();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-lg font-medium text-gray-900 text-left">Select Items to Return</h3>
            <p className="text-sm text-gray-500 text-left">
              Sale: {selectedSale?.receiptNumber || selectedSale?.invoiceNumber} - {formatDate(selectedSale?.saleDate)}
            </p>
          </div>

          {totals.itemCount > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500">{totals.itemCount} items selected</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totals.subtotal)}</p>
            </div>
          )}
        </div>

        {errors.items && (
          <div className="text-red-600 text-sm text-left">{errors.items}</div>
        )}

        {returnItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No items available for return</p>
          </div>
        )}







        <div className="space-y-4">
          {returnItems.map((item, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 transition-colors ${
                item.selected ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Selection Checkbox */}
                <div className="flex items-center pt-1">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) => {
                      const newItems = [...returnItems];
                      newItems[index].selected = e.target.checked;
                      if (e.target.checked) {
                        const maxAvailable = item.availableQuantity ?
                          item.availableQuantity[item.unitType] :
                          (item.unitType === item.originalUnitType ? item.originalQuantity : 0);
                        newItems[index].returnQuantity = maxAvailable;
                      } else {
                        newItems[index].returnQuantity = 0;
                      }
                      setReturnItems(newItems);
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-600">Select</span>
                </div>

                {/* Medicine Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900 text-left">
                        {item.medicine?.name || 'Unknown Medicine'}
                      </h4>
                      {item.medicine?.genericName && (
                        <p className="text-sm text-gray-500 text-left">{item.medicine.genericName}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">Unit Price</p>
                      <p className="font-medium">{formatCurrency(calculateUnitPrice(item))}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Original Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Original Quantity
                      </label>
                      <div className="text-sm text-gray-900 text-left">
                        {item.originalQuantity} {item.originalUnitType}(s)
                      </div>
                      {item.alreadyReturned && (item.alreadyReturned.strip > 0 || item.alreadyReturned.individual > 0) && (
                        <div className="text-xs text-orange-600 mt-1 text-left">
                          Already returned: {item.alreadyReturned.strip > 0 && `${item.alreadyReturned.strip} strip(s)`}
                          {item.alreadyReturned.strip > 0 && item.alreadyReturned.individual > 0 && ', '}
                          {item.alreadyReturned.individual > 0 && `${item.alreadyReturned.individual} individual(s)`}
                        </div>
                      )}
                    </div>

                    {/* Return Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Return Quantity *
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...returnItems];
                            const newQuantity = Math.max(0, item.returnQuantity - 1);
                            newItems[index].returnQuantity = newQuantity;
                            setReturnItems(newItems);
                          }}
                          disabled={!item.selected || item.returnQuantity <= 0}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <input
                          type="number"
                          min="0"
                          max={item.availableQuantity ? item.availableQuantity[item.unitType] : (item.unitType === item.originalUnitType ? item.originalQuantity : 0)}
                          value={item.returnQuantity}
                          onChange={(e) => {
                            const newItems = [...returnItems];
                            const maxAvailable = item.availableQuantity ?
                              item.availableQuantity[item.unitType] :
                              (item.unitType === item.originalUnitType ? item.originalQuantity : 0);
                            const value = Math.min(maxAvailable, Math.max(0, parseInt(e.target.value) || 0));
                            newItems[index].returnQuantity = value;
                            setReturnItems(newItems);
                          }}
                          disabled={!item.selected}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...returnItems];
                            const maxAvailable = item.availableQuantity ?
                              item.availableQuantity[item.unitType] :
                              (item.unitType === item.originalUnitType ? item.originalQuantity : 0);
                            const newQuantity = Math.min(maxAvailable, item.returnQuantity + 1);
                            newItems[index].returnQuantity = newQuantity;
                            setReturnItems(newItems);
                          }}
                          disabled={!item.selected || item.returnQuantity >= (item.availableQuantity ?
                            item.availableQuantity[item.unitType] :
                            (item.unitType === item.originalUnitType ? item.originalQuantity : 0))}
                          className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {errors[`quantity_${index}`] && (
                        <div className="text-red-600 text-xs mt-1">{errors[`quantity_${index}`]}</div>
                      )}
                    </div>

                    {/* Unit Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Type
                      </label>
                      <select
                        value={item.unitType}
                        onChange={(e) => {
                          const newItems = [...returnItems];
                          const newUnitType = e.target.value;
                          newItems[index].unitType = newUnitType;

                          // Reset return quantity when unit type changes to prevent invalid quantities
                          const maxAvailable = item.availableQuantity ? item.availableQuantity[newUnitType] :
                            (newUnitType === item.originalUnitType ? item.originalQuantity : 0);
                          newItems[index].returnQuantity = Math.min(newItems[index].returnQuantity, maxAvailable);

                          setReturnItems(newItems);
                        }}
                        disabled={!item.selected}
                        className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                      >
                        <option value="strip">Strip</option>
                        <option value="individual">Individual</option>
                      </select>
                      {item.availableQuantity && (
                        <div className="text-xs text-gray-500 mt-1">
                          Available: {item.availableQuantity[item.unitType]} {item.unitType}(s)
                        </div>
                      )}
                    </div>


                  </div>

                  {/* Inventory Restoration Toggle */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.restoreToInventory}
                      onChange={(e) => {
                        const newItems = [...returnItems];
                        newItems[index].restoreToInventory = e.target.checked;
                        setReturnItems(newItems);
                      }}
                      disabled={!item.selected}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">
                      Add back to inventory
                    </label>
                    <Info className="h-4 w-4 text-gray-400" title="When checked, returned medicines will be added back to your inventory" />
                  </div>

                  {/* Return Amount */}
                  {item.selected && item.returnQuantity > 0 && (
                    <div className="mt-3 text-right">
                      <p className="text-sm text-gray-500">Return Amount</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(item.returnQuantity * calculateUnitPrice(item))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {totals.itemCount > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Return Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Items</p>
                <p className="font-medium">{totals.itemCount}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Quantity</p>
                <p className="font-medium">{totals.totalQuantity}</p>
              </div>
              <div>
                <p className="text-gray-500">Return Amount</p>
                <p className="font-medium text-green-600">{formatCurrency(totals.subtotal)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Step 3: Return Details
  const renderReturnDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Return Details</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Return Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
            Return Reason *
          </label>
          <select
            value={returnDetails.returnReason}
            onChange={(e) => setReturnDetails(prev => ({ ...prev, returnReason: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select reason</option>
            <option value="defective_product">Defective Product</option>
            <option value="expired_medicine">Expired Medicine</option>
            <option value="wrong_medicine_dispensed">Wrong Medicine Dispensed</option>
            <option value="customer_dissatisfaction">Customer Dissatisfaction</option>
            <option value="doctor_prescription_change">Doctor Prescription Change</option>
            <option value="adverse_reaction">Adverse Reaction</option>
            <option value="duplicate_purchase">Duplicate Purchase</option>
            <option value="billing_error">Billing Error</option>
            <option value="quality_issue">Quality Issue</option>
            <option value="other">Other</option>
          </select>
          {errors.returnReason && (
            <div className="text-red-600 text-sm mt-1 text-left">{errors.returnReason}</div>
          )}
        </div>

        {/* Refund Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
            Refund Method
          </label>
          <select
            value={returnDetails.refundMethod}
            onChange={(e) => setReturnDetails(prev => ({ ...prev, refundMethod: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="store_credit">Store Credit</option>
            <option value="exchange">Exchange</option>
          </select>
        </div>
      </div>

      {/* Return Reason Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
          Additional Details
        </label>
        <textarea
          value={returnDetails.returnReasonDetails}
          onChange={(e) => setReturnDetails(prev => ({ ...prev, returnReasonDetails: e.target.value }))}
          placeholder="Provide additional details about the return..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Global Inventory Restoration */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={returnDetails.restoreInventory}
            onChange={(e) => setReturnDetails(prev => ({ ...prev, restoreInventory: e.target.checked }))}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
          />
          <div className="text-left">
            <label className="text-sm font-medium text-gray-900 text-left">
              Restore returned medicines to inventory
            </label>
            <p className="text-sm text-gray-600 mt-1 text-left">
              When enabled, returned medicines will be automatically added back to your inventory.
              Disable this for damaged or expired medicines that cannot be resold.
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Internal Notes
        </label>
        <textarea
          value={returnDetails.notes}
          onChange={(e) => setReturnDetails(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Add any internal notes about this return..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
        />
      </div>
    </div>
  );

  // Step 4: Review
  const renderReview = () => {
    const totals = calculateTotals();
    const selectedItems = returnItems.filter(item => item.selected && item.returnQuantity > 0);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Review Return</h3>
          <p className="text-sm text-gray-500 text-left">
            Please review all details before creating the return
          </p>
        </div>

        {/* Sale Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 text-left">Original Sale</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Receipt/Invoice</p>
              <p className="font-medium">{selectedSale?.receiptNumber || selectedSale?.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Sale Date</p>
              <p className="font-medium">{formatDate(selectedSale?.saleDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-medium">{selectedSale?.customer?.name || 'Walk-in Customer'}</p>
            </div>
            <div>
              <p className="text-gray-500">Original Amount</p>
              <p className="font-medium">{formatCurrency(selectedSale?.totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Return Items */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Return Items</h4>
          <div className="space-y-3">
            {selectedItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.medicine?.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.returnQuantity} {item.unitType}(s)
                    </p>
                    {!item.restoreToInventory && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Will not be added back to inventory
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.returnQuantity * calculateUnitPrice(item))}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Return Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Return Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Return Reason</p>
              <p className="font-medium">{returnDetails.returnReason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            <div>
              <p className="text-gray-500">Refund Method</p>
              <p className="font-medium">{returnDetails.refundMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
          </div>

          {returnDetails.returnReasonDetails && (
            <div className="mt-3">
              <p className="text-gray-500 text-sm">Additional Details</p>
              <p className="text-gray-900 text-sm">{returnDetails.returnReasonDetails}</p>
            </div>
          )}

          {returnDetails.notes && (
            <div className="mt-3">
              <p className="text-gray-500 text-sm">Internal Notes</p>
              <p className="text-gray-900 text-sm">{returnDetails.notes}</p>
            </div>
          )}
        </div>

        {/* Return Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Return Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Items</p>
              <p className="text-xl font-semibold text-gray-900">{totals.itemCount}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Quantity</p>
              <p className="text-xl font-semibold text-gray-900">{totals.totalQuantity}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Return Amount</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.subtotal)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 text-left">Create Return</h2>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber === step
                    ? 'bg-green-600 text-white'
                    : stepNumber < step
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {stepNumber < step ? <CheckCircle className="h-4 w-4" /> : stepNumber}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-600 text-left">
          {step === 1 && 'Select the original sale'}
          {step === 2 && 'Choose items to return'}
          {step === 3 && 'Enter return details'}
          {step === 4 && 'Review and confirm'}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {step === 1 && renderSaleSelection()}
        {step === 2 && renderItemSelection()}
        {step === 3 && renderReturnDetails()}
        {step === 4 && renderReview()}
      </div>

      {/* Navigation Buttons */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={handlePrevious}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
          )}
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && !selectedSale}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Return...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Create Return
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateReturnForm;
