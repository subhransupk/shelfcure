import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Edit3,
  Plus,
  Trash2,
  Building,
  Calendar,
  Hash,
  Package,
  DollarSign,
  Save
} from 'lucide-react';

const PurchaseBillReview = ({ ocrData, onConfirm, onCancel }) => {
  const [editedData, setEditedData] = useState({
    supplier: ocrData.matchedSupplier || {
      name: ocrData.billData.supplier.name || '',
      phone: ocrData.billData.supplier.phone || '',
      gstNumber: ocrData.billData.supplier.gstNumber || ''
    },
    billNumber: ocrData.billData.billNumber || '',
    billDate: ocrData.billData.billDate || '',
    medicines: ocrData.matchedMedicines.map(item => ({
      medicineId: item.matches.length > 0 ? item.matches[0]._id : null,
      medicineName: item.extracted.name,
      manufacturer: item.matches.length > 0 ? item.matches[0].manufacturer : '',
      quantity: item.extracted.quantity || 1,
      unitType: item.extracted.unitType || 'strip',
      unitPrice: item.extracted.unitPrice || item.extracted.price || 0,
      batchNumber: item.extracted.batchNumber || '',
      expiryDate: item.extracted.expiryDate || '',
      matches: item.matches
    }))
  });

  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState(`PO-${Date.now()}`);

  const handleSupplierChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      supplier: {
        ...prev.supplier,
        [field]: value
      }
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setEditedData(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const handleMedicineSelect = (index, selectedMedicine) => {
    setEditedData(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? {
          ...med,
          medicineId: selectedMedicine._id,
          medicineName: selectedMedicine.name,
          manufacturer: selectedMedicine.manufacturer
        } : med
      )
    }));
  };

  const addMedicine = () => {
    setEditedData(prev => ({
      ...prev,
      medicines: [...prev.medicines, {
        medicineId: null,
        medicineName: '',
        manufacturer: '',
        quantity: 1,
        unitType: 'strip',
        unitPrice: 0,
        batchNumber: '',
        expiryDate: '',
        matches: []
      }]
    }));
  };

  const removeMedicine = (index) => {
    setEditedData(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = editedData.medicines.reduce((sum, med) => 
      sum + (med.quantity * med.unitPrice), 0
    );
    const gstAmount = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal + gstAmount;

    return { subtotal, gstAmount, totalAmount };
  };

  const handleConfirm = () => {
    const { subtotal, gstAmount, totalAmount } = calculateTotals();
    
    const confirmData = {
      billData: {
        ...ocrData.billData,
        billNumber: editedData.billNumber,
        billDate: editedData.billDate,
        confidence: ocrData.ocrResult.confidence
      },
      selectedSupplier: editedData.supplier._id || null,
      confirmedMedicines: editedData.medicines,
      purchaseOrderNumber,
      totals: {
        subtotal,
        gstAmount,
        totalAmount
      }
    };

    onConfirm(confirmData);
  };

  const { subtotal, gstAmount, totalAmount } = calculateTotals();

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 text-left">Review Purchase Bill</h2>
          <p className="text-sm text-gray-600 text-left">
            OCR Confidence: {ocrData.ocrResult.confidence}% • 
            Please review and confirm the extracted information
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {editedData.medicines.length} medicines
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Bill Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Purchase Order Number */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              <Hash className="w-4 h-4 inline mr-1" />
              Purchase Order Number
            </label>
            <input
              type="text"
              value={purchaseOrderNumber}
              onChange={(e) => setPurchaseOrderNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Bill Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-left">
              <Calendar className="w-5 h-5 inline mr-2" />
              Bill Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Bill Number
                </label>
                <input
                  type="text"
                  value={editedData.billNumber}
                  onChange={(e) => setEditedData(prev => ({ ...prev, billNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter bill number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Bill Date
                </label>
                <input
                  type="date"
                  value={editedData.billDate}
                  onChange={(e) => setEditedData(prev => ({ ...prev, billDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-left">
              <Building className="w-5 h-5 inline mr-2" />
              Supplier Information
            </h3>
            {ocrData.matchedSupplier ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-800">Matched Supplier</span>
                </div>
                <p className="text-sm text-gray-700">{ocrData.matchedSupplier.name}</p>
                <p className="text-xs text-gray-500">{ocrData.matchedSupplier.phone}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-800">New Supplier</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={editedData.supplier.name}
                    onChange={(e) => handleSupplierChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter supplier name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editedData.supplier.phone}
                    onChange={(e) => handleSupplierChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={editedData.supplier.gstNumber}
                    onChange={(e) => handleSupplierChange('gstNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter GST number"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-left">
              <DollarSign className="w-5 h-5 inline mr-2" />
              Bill Totals
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">GST (18%):</span>
                <span className="text-sm font-medium">₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-base font-semibold">Total:</span>
                <span className="text-base font-semibold text-green-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Medicines */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 text-left">
              <Package className="w-5 h-5 inline mr-2" />
              Medicines ({editedData.medicines.length})
            </h3>
            <button
              onClick={addMedicine}
              className="px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {editedData.medicines.map((medicine, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {medicine.matches.length > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium">
                      {medicine.matches.length > 0 ? 'Matched' : 'New Medicine'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeMedicine(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Medicine Name
                    </label>
                    {medicine.matches.length > 0 ? (
                      <select
                        value={medicine.medicineId || ''}
                        onChange={(e) => {
                          const selected = medicine.matches.find(m => m._id === e.target.value);
                          if (selected) handleMedicineSelect(index, selected);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select medicine</option>
                        {medicine.matches.map(match => (
                          <option key={match._id} value={match._id}>
                            {match.name} - {match.manufacturer}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={medicine.medicineName}
                        onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter medicine name"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={medicine.manufacturer}
                      onChange={(e) => handleMedicineChange(index, 'manufacturer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter manufacturer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={medicine.quantity}
                      onChange={(e) => handleMedicineChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Unit Type
                    </label>
                    <select
                      value={medicine.unitType}
                      onChange={(e) => handleMedicineChange(index, 'unitType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="strip">Strip</option>
                      <option value="individual">Individual</option>
                      <option value="box">Box</option>
                      <option value="bottle">Bottle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={medicine.unitPrice}
                      onChange={(e) => handleMedicineChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Total Price
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                      ₹{(medicine.quantity * medicine.unitPrice).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={medicine.batchNumber}
                      onChange={(e) => handleMedicineChange(index, 'batchNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter batch number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={medicine.expiryDate}
                      onChange={(e) => handleMedicineChange(index, 'expiryDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
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
          onClick={handleConfirm}
          className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Create Purchase Order</span>
        </button>
      </div>
    </div>
  );
};

export default PurchaseBillReview;
