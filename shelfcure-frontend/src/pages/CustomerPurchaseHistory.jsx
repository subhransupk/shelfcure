import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Star,
  Receipt,
  Calendar,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import UnitSelector from '../components/UnitSelector';

const CustomerPurchaseHistory = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [customer, setCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [regularMedicines, setRegularMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [activeTab, setActiveTab] = useState('regular'); // 'regular' or 'history'
  const [unitSelections, setUnitSelections] = useState({}); // Track unit selections for each medicine

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch customer details
      const customerResponse = await fetch(`/api/store-manager/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        setCustomer(customerData.data);
      }

      // Fetch purchase history
      const historyResponse = await fetch(`/api/store-manager/customers/${customerId}/purchase-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setPurchaseHistory(historyData.data || []);
      }

      // Fetch regular medicines
      const regularResponse = await fetch(`/api/store-manager/customers/${customerId}/regular-medicines`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (regularResponse.ok) {
        const regularData = await regularResponse.json();
        const regularMeds = regularData.data || [];
        setRegularMedicines(regularMeds);

        // Smart default tab selection - show regular medicines if available, otherwise history
        if (regularMeds.length > 0) {
          setActiveTab('regular');
        } else {
          setActiveTab('history');
        }
      }

    } catch (error) {
      console.error('Error fetching customer data:', error);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (medicine, customQuantity = null, customUnit = null) => {
    try {
      console.log('🛒 Adding to cart:', medicine, 'Custom Quantity:', customQuantity, 'Custom Unit:', customUnit);

      // Handle different medicine object structures
      const medicineId = medicine._id || medicine.id;
      const medicineName = medicine.name;

      if (!medicineId || !medicineName) {
        console.error('❌ Invalid medicine data:', medicine);
        alert('Error: Invalid medicine data');
        return;
      }

      // Get unit selection for this medicine
      const unitSelection = unitSelections[medicineId];
      const selectedUnit = customUnit || unitSelection?.unit || 'strips';
      const selectedQuantity = customQuantity || unitSelection?.quantity || 1;
      const unitData = unitSelection?.unitData;

      console.log('📦 Unit selection:', { selectedUnit, selectedQuantity, unitData });

      setAddingToCart(prev => ({ ...prev, [medicineId]: true }));

      // Calculate actual quantity based on unit type
      let actualQuantity = selectedQuantity;
      let displayUnit = selectedUnit;

      // If adding strips, convert to individual units for internal tracking
      if (selectedUnit === 'strips' && unitData?.conversion > 1) {
        actualQuantity = selectedQuantity * unitData.conversion;
        displayUnit = 'individual';
      }

      // Create cart item with unit information
      const cartItem = {
        medicineId: medicineId,
        name: medicineName,
        quantity: selectedQuantity,
        unit: selectedUnit,
        actualQuantity: actualQuantity, // For internal calculations
        displayUnit: displayUnit,
        unitData: unitData,
        price: unitData?.price || 0
      };

      // Add to local cart state
      const existingItemIndex = cartItems.findIndex(item =>
        item.medicineId === medicineId && item.unit === selectedUnit
      );

      if (existingItemIndex >= 0) {
        setCartItems(prev => prev.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + selectedQuantity,
                actualQuantity: item.actualQuantity + actualQuantity
              }
            : item
        ));
        console.log('✅ Updated existing cart item');
      } else {
        setCartItems(prev => [...prev, cartItem]);
        console.log('✅ Added new cart item');
      }

      // Show success feedback
      setTimeout(() => {
        setAddingToCart(prev => ({ ...prev, [medicineId]: false }));
      }, 1000);

    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      const medicineId = medicine._id || medicine.id;
      setAddingToCart(prev => ({ ...prev, [medicineId]: false }));
      alert('Error adding item to cart');
    }
  };

  const handleUnitSelectionChange = useCallback((medicineId, unitSelection) => {
    setUnitSelections(prev => ({
      ...prev,
      [medicineId]: unitSelection
    }));
  }, []);

  const proceedToSale = () => {
    // Format cart items for the sales page
    const formattedCartItems = cartItems.map(item => ({
      medicineId: item.medicineId,
      name: item.name,
      quantity: item.actualQuantity || item.quantity, // Use actual quantity for internal calculations
      unit: item.displayUnit || item.unit,
      originalUnit: item.unit, // Keep track of original unit selection
      price: item.price || 0,
      unitData: item.unitData
    }));

    // Store cart items in localStorage and navigate to sales page
    localStorage.setItem('prefilledCart', JSON.stringify({
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: formattedCartItems
    }));
    navigate('/store-panel/sales');
  };

  if (loading) {
    return (
      <StoreManagerLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Loading customer data...</span>
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
                  onClick={() => navigate('/store-panel/customers')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 text-left">
                    Purchase History
                  </h1>
                  <p className="text-sm text-gray-500 text-left">
                    View purchase patterns and add medicines to cart
                  </p>
                </div>
              </div>
              
              {cartItems.length > 0 && (
                <button
                  onClick={proceedToSale}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Sale ({cartItems.length} items)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {customer && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-gray-900 text-left">{customer.name}</h2>
                  <div className="flex items-center space-x-4 mt-1">
                    {customer.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-1" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-1" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                  </div>
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
                  <Star className="h-5 w-5 mr-2" />
                  Regular Medicines
                  {regularMedicines.length > 0 && (
                    <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {regularMedicines.length}
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
                  Complete Purchase History
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
                    Frequently Purchased Medicines
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Medicines this customer has purchased 2 or more times, sorted by frequency.
                  </p>
                </div>

                {regularMedicines.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularMedicines.map((medicine, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 mb-3">{medicine.name}</h4>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                              <span className="text-blue-600 font-medium">
                                Purchased {medicine.purchaseCount} times
                              </span>
                            </div>
                            <div className="flex items-center text-sm">
                              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                              <span className="text-gray-600">
                                Total: {medicine.totalQuantity} {medicine.unit}
                              </span>
                            </div>
                            <div className="flex items-center text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-gray-500">
                                Last: {new Date(medicine.lastPurchased).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Unit Selector */}
                          <div className="mb-3">
                            <UnitSelector
                              key={`regular-${medicine._id}`}
                              medicine={medicine}
                              onUnitChange={(unitSelection) => handleUnitSelectionChange(medicine._id, unitSelection)}
                              defaultUnit="strips"
                              defaultQuantity={1}
                              className="w-full"
                            />
                          </div>

                          <button
                            onClick={() => addToCart(medicine)}
                            disabled={addingToCart[medicine._id || medicine.id]}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {addingToCart[medicine._id || medicine.id] ? (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            {addingToCart[medicine._id || medicine.id] ? 'Added to Cart!' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Regular Medicines Found</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      This customer needs more purchase history to identify regular medicine patterns.
                      Medicines appear here after being purchased 2 or more times.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="text-left">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Complete Purchase History
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Chronological list of all purchases made by this customer, sorted by most recent first.
                  </p>
                </div>

                {purchaseHistory.length > 0 ? (
                  <div className="space-y-6">
                    {purchaseHistory.map((purchase) => (
                      <div key={purchase._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-left">
                            <h4 className="font-semibold text-gray-900 text-lg">
                              {purchase.invoiceNumber || `INV-${purchase._id.slice(-6).toUpperCase()}`}
                            </h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1 space-x-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{new Date(purchase.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900">₹{purchase.totalAmount?.toFixed(2) || '0.00'}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="capitalize">{purchase.paymentMethod || 'Cash'}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              // Add all items from this purchase to cart using original units
                              purchase.items?.forEach(item => {
                                if (item.medicine) {
                                  addToCart(item.medicine, item.quantity, item.unit);
                                }
                              });
                            }}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Reorder All
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {purchase.items?.map((item, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-4">
                              <div className="text-left mb-3">
                                <p className="font-medium text-gray-900 mb-1">
                                  {item.medicine?.name || 'Unknown Medicine'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Original: {item.quantity} {item.unit}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Price: ₹{item.price?.toFixed(2) || '0.00'}
                                </p>
                              </div>

                              {/* Unit Selector for individual items */}
                              <div className="mb-3">
                                <UnitSelector
                                  key={`history-${item.medicine?._id}-${idx}`}
                                  medicine={item.medicine}
                                  onUnitChange={(unitSelection) => handleUnitSelectionChange(`${item.medicine?._id}_${idx}`, unitSelection)}
                                  defaultUnit={item.unit || 'strips'}
                                  defaultQuantity={item.quantity || 1}
                                  className="w-full"
                                />
                              </div>

                              <button
                                onClick={() => addToCart(item.medicine)}
                                disabled={!item.medicine?._id}
                                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                                title="Add to cart"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add to Cart
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase History</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      This customer hasn't made any purchases yet. Once they make their first purchase,
                      it will appear here with full transaction details.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart Summary - Always visible when items are present */}
        {cartItems.length > 0 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg shadow-sm">
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-green-900 text-left flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart Summary
                  <span className="ml-2 bg-green-200 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  </span>
                </h3>
                <button
                  onClick={() => setCartItems([])}
                  className="text-sm text-green-700 hover:text-green-900 font-medium transition-colors"
                >
                  Clear Cart
                </button>
              </div>

              <div className="space-y-3 mb-5 max-h-40 overflow-y-auto">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-left flex-1">
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      <p className="text-xs text-gray-500 mt-1">Added from {activeTab === 'regular' ? 'regular medicines' : 'purchase history'}</p>
                      {item.unitData?.conversion > 1 && (
                        <p className="text-xs text-blue-600 mt-1">
                          = {item.actualQuantity} individual units
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{item.quantity} {item.unit}</span>
                      {item.price > 0 && (
                        <p className="text-xs text-gray-500 mt-1">₹{(item.price * item.quantity).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={proceedToSale}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Sale ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                </button>
                <button
                  onClick={() => {
                    // Add functionality to continue shopping (switch tabs if needed)
                    if (activeTab === 'regular' && regularMedicines.length === 0) {
                      setActiveTab('history');
                    } else if (activeTab === 'history' && purchaseHistory.length === 0) {
                      setActiveTab('regular');
                    }
                  }}
                  className="px-4 py-3 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreManagerLayout>
  );
};

export default CustomerPurchaseHistory;
