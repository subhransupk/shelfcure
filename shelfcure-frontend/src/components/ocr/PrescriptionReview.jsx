import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  User,
  Calendar,
  Pill,
  Package,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';

const PrescriptionReview = ({ ocrData, onAddToCart, onCancel }) => {
  const [selectedMedicines, setSelectedMedicines] = useState(
    ocrData.matchedMedicines.map(item => ({
      medicineId: item.matched._id,
      medicineName: item.matched.name,
      quantity: 1,
      unitType: item.matched.stock.strips > 0 ? 'strip' : 'individual',
      unitPrice: item.matched.stock.strips > 0 
        ? item.matched.pricing.stripPrice 
        : item.matched.pricing.individualPrice,
      selected: item.matched.stock.hasStock
    }))
  );

  const [customerId, setCustomerId] = useState('');

  const handleMedicineToggle = (index) => {
    setSelectedMedicines(prev => 
      prev.map((med, i) => 
        i === index ? { ...med, selected: !med.selected } : med
      )
    );
  };

  const handleQuantityChange = (index, change) => {
    setSelectedMedicines(prev => 
      prev.map((med, i) => 
        i === index ? { 
          ...med, 
          quantity: Math.max(1, med.quantity + change) 
        } : med
      )
    );
  };

  const handleUnitTypeChange = (index, unitType) => {
    const medicine = ocrData.matchedMedicines[index];
    const unitPrice = unitType === 'strip' 
      ? medicine.matched.pricing.stripPrice 
      : medicine.matched.pricing.individualPrice;

    setSelectedMedicines(prev => 
      prev.map((med, i) => 
        i === index ? { ...med, unitType, unitPrice } : med
      )
    );
  };

  const calculateTotals = () => {
    const selectedItems = selectedMedicines.filter(med => med.selected);
    const totalAmount = selectedItems.reduce((sum, med) => 
      sum + (med.quantity * med.unitPrice), 0
    );

    return {
      totalItems: selectedItems.length,
      totalAmount
    };
  };

  const handleAddToCart = () => {
    const selectedItems = selectedMedicines.filter(med => med.selected);
    
    if (selectedItems.length === 0) {
      alert('Please select at least one medicine to add to cart');
      return;
    }

    const cartData = {
      prescriptionData: ocrData.prescriptionData,
      selectedMedicines: selectedItems,
      customerId: customerId || null
    };

    onAddToCart(cartData);
  };

  const { totalItems, totalAmount } = calculateTotals();

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 text-left">Review Prescription</h2>
          <p className="text-sm text-gray-600 text-left">
            OCR Confidence: {ocrData.ocrResult.confidence}% • 
            Select medicines to add to sales cart
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {ocrData.summary.availableMedicines} available
          </div>
          <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
            {ocrData.summary.unavailableMedicines} unavailable
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Prescription Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Prescription Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-left">
              <Calendar className="w-5 h-5 inline mr-2" />
              Prescription Details
            </h3>
            <div className="space-y-3">
              {ocrData.prescriptionData.doctor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Doctor
                  </label>
                  <p className="text-sm text-gray-900">{ocrData.prescriptionData.doctor}</p>
                </div>
              )}
              {ocrData.prescriptionData.patient && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Patient
                  </label>
                  <p className="text-sm text-gray-900">{ocrData.prescriptionData.patient}</p>
                </div>
              )}
              {ocrData.prescriptionData.date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Date
                  </label>
                  <p className="text-sm text-gray-900">{ocrData.prescriptionData.date}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-left">
              <User className="w-5 h-5 inline mr-2" />
              Customer (Optional)
            </h3>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter customer ID or leave blank"
            />
            <p className="text-xs text-gray-500 mt-1 text-left">
              Leave blank for walk-in customer
            </p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-left">
              <ShoppingCart className="w-5 h-5 inline mr-2" />
              Cart Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Selected Items:</span>
                <span className="text-sm font-medium">{totalItems}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-base font-semibold">Total Amount:</span>
                <span className="text-base font-semibold text-green-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Unavailable Medicines */}
          {ocrData.unavailableMedicines.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold text-red-900 mb-3 text-left">
                <XCircle className="w-5 h-5 inline mr-2" />
                Unavailable Medicines
              </h3>
              <div className="space-y-2">
                {ocrData.unavailableMedicines.map((medicine, index) => (
                  <div key={index} className="text-sm text-red-700">
                    • {medicine.name} {medicine.dosage && `(${medicine.dosage})`}
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-2 text-left">
                These medicines are not available in your inventory
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Available Medicines */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 text-left">
              <Pill className="w-5 h-5 inline mr-2" />
              Available Medicines ({ocrData.matchedMedicines.length})
            </h3>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {ocrData.matchedMedicines.map((item, index) => {
              const medicine = item.matched;
              const selected = selectedMedicines[index];
              const hasStock = medicine.stock.hasStock;

              return (
                <div 
                  key={index} 
                  className={`border rounded-lg p-4 transition-colors ${
                    selected.selected 
                      ? 'border-green-300 bg-green-50' 
                      : hasStock 
                        ? 'border-gray-200 bg-white' 
                        : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selected.selected}
                        onChange={() => handleMedicineToggle(index)}
                        disabled={!hasStock}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                      />
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 text-left">
                          {medicine.name}
                        </h4>
                        <p className="text-sm text-gray-600 text-left">
                          {medicine.genericName} • {medicine.manufacturer}
                        </p>
                        <p className="text-xs text-gray-500 text-left">
                          Category: {medicine.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasStock ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Stock Information */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Strip Stock</span>
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {medicine.stock.strips}
                      </p>
                      <p className="text-xs text-gray-500">₹{medicine.pricing.stripPrice}/strip</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Individual Stock</span>
                        <Pill className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {medicine.stock.individual}
                      </p>
                      <p className="text-xs text-gray-500">₹{medicine.pricing.individualPrice}/unit</p>
                    </div>
                  </div>

                  {/* Quantity and Unit Selection */}
                  {selected.selected && hasStock && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Unit Type
                        </label>
                        <select
                          value={selected.unitType}
                          onChange={(e) => handleUnitTypeChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          {medicine.stock.strips > 0 && (
                            <option value="strip">Strip (₹{medicine.pricing.stripPrice})</option>
                          )}
                          {medicine.stock.individual > 0 && (
                            <option value="individual">Individual (₹{medicine.pricing.individualPrice})</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Quantity
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(index, -1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">
                            {selected.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(index, 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stock Warning */}
                  {!hasStock && (
                    <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">Out of stock</span>
                    </div>
                  )}

                  {/* Total Price */}
                  {selected.selected && hasStock && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Price:</span>
                        <span className="text-lg font-semibold text-green-600">
                          ₹{(selected.quantity * selected.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleAddToCart}
          disabled={totalItems === 0}
          className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart ({totalItems} items)</span>
        </button>
      </div>
    </div>
  );
};

export default PrescriptionReview;
