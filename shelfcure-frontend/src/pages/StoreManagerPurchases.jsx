import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Upload,
  Search,
  Filter,
  Eye,
  Edit,
  Download,
  Calendar,
  User,
  Receipt,
  Truck,
  CheckCircle,
  AlertTriangle,
  Camera,
  FileImage,
  X,
  Loader,
  Trash2,
  Printer,
  FileText,
  MessageCircle,
  Users,
  RefreshCw
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';

const StoreManagerPurchases = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'new', 'ocr', 'reorder', 'requests'
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Reorder State
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  const [selectedReorderItems, setSelectedReorderItems] = useState([]);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [reorderSummary, setReorderSummary] = useState(null);
  const [showSupplierGrouping, setShowSupplierGrouping] = useState(false);
  const [whatsappModal, setWhatsappModal] = useState({ show: false, supplier: null, items: [] });
  const [manualQuantities, setManualQuantities] = useState({}); // Store manual quantity overrides

  // Medicine Requests State
  const [medicineRequests, setMedicineRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Supplier Selection State for WhatsApp
  const [supplierSearch, setSupplierSearch] = useState('');
  const [whatsappSuppliers, setWhatsappSuppliers] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierSearchLoading, setSupplierSearchLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Purchase Form Supplier Search State
  const [purchaseSupplierSearch, setPurchaseSupplierSearch] = useState('');
  const [purchaseSupplierResults, setPurchaseSupplierResults] = useState([]);
  const [showPurchaseSupplierDropdown, setShowPurchaseSupplierDropdown] = useState(false);
  const [selectedPurchaseSupplier, setSelectedPurchaseSupplier] = useState(null);

  // Medicine Search State for Purchase Items
  const [medicineSearchStates, setMedicineSearchStates] = useState({});

  // Purchase Action Modals
  const [viewModal, setViewModal] = useState({ show: false, purchase: null });
  const [editModal, setEditModal] = useState({ show: false, purchase: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, purchase: null });
  const [statusModal, setStatusModal] = useState({ show: false, purchase: null });
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Medicine Request Modal
  const [viewRequestModal, setViewRequestModal] = useState({ show: false, request: null });

  // OCR State
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResults, setOcrResults] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);

  // New Purchase State
  const [newPurchase, setNewPurchase] = useState({
    supplier: '',
    purchaseOrderNumber: '',
    invoiceNumber: '',
    expectedDeliveryDate: '',
    items: [],
    subtotal: 0,
    taxEnabled: false,
    taxPercentage: 0,
    taxAmount: 0,
    totalAmount: 0,
    notes: ''
  });

  useEffect(() => {
    if (activeTab === 'list') {
      fetchPurchases();
    } else if (activeTab === 'new') {
      fetchSuppliers();
      fetchMedicines();
    } else if (activeTab === 'reorder') {
      fetchReorderSuggestions().then(() => {
        // Check for reorder data from sales page AFTER API data is loaded
        handleReorderDataFromSales();
      });
    } else if (activeTab === 'requests') {
      fetchMedicineRequests();
    }
  }, [activeTab, currentPage, searchTerm, statusFilter]);

  // Handle clicks outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close purchase supplier dropdown
      if (showPurchaseSupplierDropdown && !event.target.closest('.supplier-search-container')) {
        setShowPurchaseSupplierDropdown(false);
      }

      // Close medicine search dropdowns
      Object.keys(medicineSearchStates).forEach(index => {
        if (medicineSearchStates[index]?.showDropdown && !event.target.closest(`.medicine-search-${index}`)) {
          setMedicineSearchStates(prev => ({
            ...prev,
            [index]: { ...prev[index], showDropdown: false }
          }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPurchaseSupplierDropdown, medicineSearchStates]);

  // Check for reorder data on component mount and handle URL hash
  useEffect(() => {
    // Check URL hash to determine initial tab
    const hash = window.location.hash.substring(1); // Remove the # symbol
    if (hash === 'reorder') {
      setActiveTab('reorder');
    }

    // Always check for reorder data
    handleReorderDataFromSales();
  }, []);

  // Handle reorder data transferred from sales page
  const handleReorderDataFromSales = () => {
    try {
      const reorderData = localStorage.getItem('reorderData');
      console.log('🔍 Checking for reorder data:', reorderData);

      if (reorderData) {
        const parsedData = JSON.parse(reorderData);
        console.log('📦 Parsed reorder data:', parsedData);

        if (parsedData.medicines && parsedData.medicines.length > 0) {
          console.log(`🏥 Processing ${parsedData.medicines.length} customer requested medicines`);

          // Convert reorder medicines to reorder suggestions format
          const customerRequestedItems = parsedData.medicines.map((medicine, index) => ({
            _id: medicine._id || `customer_${Date.now()}_${index}`,
            medicine: {
              _id: medicine.isInInventory && medicine._id && /^[0-9a-fA-F]{24}$/.test(medicine._id) ? medicine._id : '', // Only use valid real ID if medicine is in inventory
              name: medicine.name,
              genericName: medicine.genericName,
              manufacturer: medicine.manufacturer,
              category: medicine.category,
              unitPrice: 0
            },
            medicineName: medicine.name, // Add this for compatibility
            genericName: medicine.genericName,
            manufacturer: medicine.manufacturer,
            currentStock: 0, // Customer requested items are out of stock
            minStockLevel: 1,
            maxStockLevel: 10,
            suggestedQuantity: 5, // Default suggested quantity
            priority: 'high', // Customer requests are high priority
            reason: 'Customer Request',
            supplier: null, // Will need to be selected
            lastOrderDate: null,
            averageConsumption: 0,
            isCustomerRequested: true,
            customerRequestSource: parsedData.source || 'customer_request',
            requestDate: new Date().toISOString()
          }));

          console.log('🎯 Customer requested items created:', customerRequestedItems);

          // Add customer requested items to reorder suggestions
          setReorderSuggestions(prev => {
            const filtered = prev.filter(item => !item.isCustomerRequested);
            const newList = [...customerRequestedItems, ...filtered];
            console.log('📋 Updated reorder suggestions:', newList);

            // Update reorder summary to include customer requests
            updateReorderSummaryWithCustomerRequests(newList);

            return newList;
          });

          // Switch to reorder tab to show the items
          setActiveTab('reorder');

          // Clear the localStorage data after processing
          localStorage.removeItem('reorderData');

          // Show success message
          setTimeout(() => {
            alert(`Successfully added ${parsedData.medicines.length} customer requested medicines to the reorder list!`);
          }, 500);
        } else {
          console.log('❌ No medicines found in reorder data');
        }
      } else {
        console.log('❌ No reorder data found in localStorage');
      }
    } catch (error) {
      console.error('❌ Error processing reorder data:', error);
      // Clear corrupted data
      localStorage.removeItem('reorderData');
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/store-manager/purchases?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }

      const data = await response.json();
      setPurchases(data.data);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Purchases fetch error:', error);
      setError('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  // Update reorder summary to include customer requested items
  const updateReorderSummaryWithCustomerRequests = (allSuggestions) => {
    const customerRequests = allSuggestions.filter(item => item.isCustomerRequested);
    const regularSuggestions = allSuggestions.filter(item => !item.isCustomerRequested);

    // Calculate totals including customer requests
    const totalItems = allSuggestions.length;
    const customerRequestsWithSuppliers = customerRequests.filter(item => item.supplier).length;
    const customerRequestsWithoutSuppliers = customerRequests.filter(item => !item.supplier).length;

    // Update summary with combined data
    setReorderSummary(prev => {
      if (!prev) {
        // If no previous summary, create new one with customer requests only
        return {
          totalItems: customerRequests.length,
          itemsWithSuppliers: customerRequestsWithSuppliers,
          itemsWithoutSuppliers: customerRequestsWithoutSuppliers,
          totalEstimatedCost: 0, // Customer requests don't have cost initially
          customerRequests: customerRequests.length,
          regularSuggestions: 0
        };
      } else {
        // Combine with existing API summary
        return {
          ...prev,
          totalItems: totalItems,
          itemsWithSuppliers: prev.itemsWithSuppliers + customerRequestsWithSuppliers,
          itemsWithoutSuppliers: prev.itemsWithoutSuppliers + customerRequestsWithoutSuppliers,
          customerRequests: customerRequests.length,
          regularSuggestions: regularSuggestions.length
        };
      }
    });

    console.log('📊 Updated reorder summary with customer requests:', {
      totalItems,
      customerRequests: customerRequests.length,
      regularSuggestions: regularSuggestions.length
    });
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchReorderSuggestions = async () => {
    try {
      setReorderLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/purchases/reorder-suggestions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reorder suggestions');
      }

      const data = await response.json();

      // Preserve existing customer requested items
      setReorderSuggestions(prev => {
        const customerRequested = prev.filter(item => item.isCustomerRequested);
        const apiSuggestions = data.data || [];
        const mergedList = [...customerRequested, ...apiSuggestions];

        console.log('🔄 Merging API suggestions with customer requests:', {
          customerRequested: customerRequested.length,
          apiSuggestions: apiSuggestions.length,
          total: mergedList.length
        });

        // Update summary with merged data
        setTimeout(() => {
          updateReorderSummaryWithCustomerRequests(mergedList);
        }, 100);

        return mergedList;
      });

      // Set initial API summary (will be updated by updateReorderSummaryWithCustomerRequests)
      setReorderSummary(data.summary || null);

      // Initialize manual quantities with system suggestions
      const initialQuantities = {};
      data.data?.forEach(suggestion => {
        if (suggestion.stripSuggestion) {
          initialQuantities[`${suggestion.medicine}-strip`] = suggestion.stripSuggestion.suggestedQuantity;
        }
        if (suggestion.individualSuggestion) {
          initialQuantities[`${suggestion.medicine}-individual`] = suggestion.individualSuggestion.suggestedQuantity;
        }
      });
      setManualQuantities(initialQuantities);
    } catch (error) {
      console.error('Reorder suggestions fetch error:', error);
      setError('Failed to load reorder suggestions');
    } finally {
      setReorderLoading(false);
    }
  };

  // Fetch medicine requests
  const fetchMedicineRequests = async () => {
    try {
      setRequestsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/medicine-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedicineRequests(data.data || []);
      } else {
        console.error('Failed to fetch medicine requests');
      }
    } catch (error) {
      console.error('Error fetching medicine requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Delete medicine request
  const deleteMedicineRequest = async (requestId, medicineName) => {
    if (!window.confirm(`Are you sure you want to delete the request for "${medicineName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/medicine-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove the deleted request from the local state
        setMedicineRequests(prev => prev.filter(request => request._id !== requestId));

        // Show success message (you can replace this with a toast notification if available)
        alert(`Medicine request for "${medicineName}" has been deleted successfully.`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete medicine request');
      }
    } catch (error) {
      console.error('Error deleting medicine request:', error);
      alert(`Failed to delete medicine request: ${error.message}`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.includes('image') || file.type === 'application/pdf')) {
      if (file.size <= 10 * 1024 * 1024) { // 10MB limit
        setOcrFile(file);
        setOcrResults(null);
        setError('');
      } else {
        setError('File size must be less than 10MB');
      }
    } else {
      setError('Please upload a valid image (JPG, PNG) or PDF file');
    }
  };

  const processOCR = async () => {
    if (!ocrFile) return;

    setOcrLoading(true);
    setOcrProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('bill', ocrFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setOcrProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/ocr/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setOcrProgress(100);

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const data = await response.json();
      setOcrResults(data.data);
    } catch (error) {
      console.error('OCR Error:', error);
      setError('Failed to process bill. Please try again.');
    } finally {
      setOcrLoading(false);
      setOcrProgress(0);
    }
  };

  const addItemToPurchase = () => {
    const newIndex = newPurchase.items.length;

    // Initialize medicine search state for the new item
    setMedicineSearchStates(prev => ({
      ...prev,
      [newIndex]: {
        search: '',
        results: [],
        showDropdown: false,
        selectedMedicine: null
      }
    }));

    setNewPurchase(prev => ({
      ...prev,
      items: [...prev.items, {
        medicine: '',
        unitType: 'strip',
        quantity: 0,
        unitPrice: 0,
        totalCost: 0,
        discount: 0,
        discountAmount: 0
      }]
    }));
  };

  const updatePurchaseItem = (index, field, value) => {
    setNewPurchase(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };

      // Calculate total cost for item (without tax)
      if (field === 'quantity' || field === 'unitPrice') {
        items[index].totalCost = items[index].quantity * items[index].unitPrice;
      }

      // Calculate subtotal (sum of all item costs without tax)
      const subtotal = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);

      // Calculate tax amount if tax is enabled
      const taxAmount = prev.taxEnabled ? (subtotal * prev.taxPercentage) / 100 : 0;

      // Calculate final total amount
      const totalAmount = subtotal + taxAmount;

      return { ...prev, items, subtotal, taxAmount, totalAmount };
    });
  };

  const removePurchaseItem = (index) => {
    // Clean up medicine search state for this item
    setMedicineSearchStates(prev => {
      const newStates = { ...prev };
      delete newStates[index];

      // Reindex remaining states
      const reindexedStates = {};
      Object.keys(newStates).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex > index) {
          reindexedStates[keyIndex - 1] = newStates[key];
        } else {
          reindexedStates[key] = newStates[key];
        }
      });

      return reindexedStates;
    });

    setNewPurchase(prev => {
      const items = prev.items.filter((_, i) => i !== index);

      // Recalculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
      const taxAmount = prev.taxEnabled ? (subtotal * prev.taxPercentage) / 100 : 0;
      const totalAmount = subtotal + taxAmount;

      return { ...prev, items, subtotal, taxAmount, totalAmount };
    });
  };

  // Handle tax configuration changes
  const updateTaxConfiguration = (field, value) => {
    setNewPurchase(prev => {
      const updates = { [field]: value };

      // If toggling tax enabled/disabled
      if (field === 'taxEnabled') {
        if (!value) {
          // If disabling tax, reset tax percentage and amount
          updates.taxPercentage = 0;
          updates.taxAmount = 0;
          updates.totalAmount = prev.subtotal;
        } else {
          // If enabling tax, calculate with current percentage
          const taxAmount = (prev.subtotal * prev.taxPercentage) / 100;
          updates.taxAmount = taxAmount;
          updates.totalAmount = prev.subtotal + taxAmount;
        }
      }

      // If changing tax percentage
      if (field === 'taxPercentage') {
        const taxAmount = prev.taxEnabled ? (prev.subtotal * value) / 100 : 0;
        updates.taxAmount = taxAmount;
        updates.totalAmount = prev.subtotal + taxAmount;
      }

      return { ...prev, ...updates };
    });
  };

  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch medicines');
      }

      const data = await response.json();
      setMedicines(data.data || []);
    } catch (error) {
      console.error('Medicines fetch error:', error);
      setError('Failed to load medicines');
    }
  };

  const handleCreatePurchase = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Validate required fields
      if (!newPurchase.supplier) {
        throw new Error('Please select a supplier');
      }
      if (!newPurchase.purchaseOrderNumber.trim()) {
        throw new Error('Purchase order number is required');
      }
      if (!newPurchase.items || newPurchase.items.length === 0) {
        throw new Error('At least one item is required');
      }

      // Validate each item
      for (let i = 0; i < newPurchase.items.length; i++) {
        const item = newPurchase.items[i];
        // Skip medicine validation for customer requested items (they may not have medicine ID)
        if (!item.medicine && !(item.isFromReorder && item.medicineDetails)) {
          throw new Error(`Please select a medicine for item ${i + 1}`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Please enter a valid quantity for item ${i + 1}`);
        }
        if (!item.unitPrice || item.unitPrice <= 0) {
          throw new Error(`Please enter a valid unit price for item ${i + 1}`);
        }
      }

      const purchaseData = {
        supplier: newPurchase.supplier,
        purchaseOrderNumber: newPurchase.purchaseOrderNumber.trim(),
        invoiceNumber: newPurchase.invoiceNumber?.trim() || '',
        expectedDeliveryDate: newPurchase.expectedDeliveryDate,
        items: newPurchase.items.map(item => {
          // Handle reorder items (customer requested) vs regular inventory items
          if (item.isFromReorder && item.medicineDetails) {
            // For customer requested items - check if medicine ID is valid (not fake)
            // Valid MongoDB ObjectId is 24 characters and doesn't start with 'customer_'
            const isValidMedicineId = item.medicine &&
                                    typeof item.medicine === 'string' &&
                                    item.medicine.length === 24 &&
                                    !item.medicine.startsWith('customer_') &&
                                    /^[0-9a-fA-F]{24}$/.test(item.medicine);

            return {
              medicine: isValidMedicineId ? item.medicine : null, // Only use real medicine ID, not fake ones
              medicineName: item.medicineDetails.name,
              manufacturer: item.medicineDetails.manufacturer,
              genericName: item.medicineDetails.genericName,
              category: item.medicineDetails.category,
              quantity: parseInt(item.quantity) || 0,
              unitType: item.unitType || 'strip',
              unitCost: parseFloat(item.unitPrice) || 0,
              discount: parseFloat(item.discount) || 0,
              isCustomerRequested: true,
              reorderSource: item.reorderSource
            };
          } else {
            // For regular inventory items
            const selectedMedicine = medicines.find(med => med._id === item.medicine);
            return {
              medicine: item.medicine,
              medicineName: selectedMedicine ? selectedMedicine.name : '',
              manufacturer: selectedMedicine ? selectedMedicine.manufacturer : '',
              quantity: parseInt(item.quantity) || 0,
              unitType: item.unitType || 'strip',
              unitCost: parseFloat(item.unitPrice) || 0,
              discount: parseFloat(item.discount) || 0,
              isCustomerRequested: false
            };
          }
        }),
        subtotal: newPurchase.subtotal,
        taxEnabled: newPurchase.taxEnabled,
        taxPercentage: newPurchase.taxPercentage,
        taxAmount: newPurchase.taxAmount,
        totalAmount: newPurchase.totalAmount,
        notes: newPurchase.notes?.trim() || ''
      };

      // Debug: Log the data being sent
      console.log('Sending purchase data:', JSON.stringify(purchaseData, null, 2));

      const response = await fetch('/api/store-manager/purchases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(purchaseData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);

        // If there are validation errors, show them in detail
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map(err => err.msg).join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }

        throw new Error(errorData.message || 'Failed to create purchase');
      }

      const data = await response.json();

      // Reset form
      setNewPurchase({
        supplier: '',
        purchaseOrderNumber: '',
        invoiceNumber: '',
        expectedDeliveryDate: '',
        items: [],
        subtotal: 0,
        taxEnabled: false,
        taxPercentage: 0,
        taxAmount: 0,
        totalAmount: 0,
        notes: ''
      });

      // Reset search states
      setPurchaseSupplierSearch('');
      setSelectedPurchaseSupplier(null);
      setPurchaseSupplierResults([]);
      setShowPurchaseSupplierDropdown(false);
      setMedicineSearchStates({});

      // Switch back to list tab
      setActiveTab('list');

      // Refresh purchases list
      fetchPurchases();

      // IMPORTANT: Refresh reorder suggestions to remove items that no longer need reordering
      // This ensures that items with updated stock levels are filtered out properly
      await fetchReorderSuggestions();

      // Clear selected reorder items since they've been converted to a PO
      setSelectedReorderItems([]);

      // Show success message (you can add a toast notification here)
      console.log('Purchase created successfully:', data);

    } catch (error) {
      console.error('Create purchase error:', error);
      setError(error.message || 'Failed to create purchase');
    } finally {
      setLoading(false);
    }
  };

  // Purchase Action Handlers
  const handleViewPurchase = async (purchaseId) => {
    try {
      console.log('Viewing purchase:', purchaseId);
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/purchases/${purchaseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch purchase details');
      }

      const data = await response.json();
      setViewModal({ show: true, purchase: data.data });
    } catch (error) {
      console.error('View purchase error:', error);
      setError(error.message || 'Failed to load purchase details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPurchase = async (purchaseId) => {
    try {
      console.log('Editing purchase:', purchaseId);
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/purchases/${purchaseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch purchase details');
      }

      const data = await response.json();
      setEditModal({ show: true, purchase: data.data });
    } catch (error) {
      console.error('Edit purchase error:', error);
      setError(error.message || 'Failed to load purchase details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePurchase = (purchase) => {
    console.log('Deleting purchase:', purchase._id);
    setDeleteModal({ show: true, purchase });
  };

  const confirmDeletePurchase = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/purchases/${deleteModal.purchase._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete purchase');
      }

      // Close modal and refresh list
      setDeleteModal({ show: false, purchase: null });
      fetchPurchases();

      // Show success message
      console.log('Purchase deleted successfully');
    } catch (error) {
      console.error('Delete purchase error:', error);
      setError(error.message || 'Failed to delete purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (purchase) => {
    console.log('Updating status for purchase:', purchase._id);
    setStatusModal({ show: true, purchase });
  };

  const updatePurchaseStatus = async (newStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/purchases/${statusModal.purchase._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update purchase status');
      }

      // Close modal and refresh list
      setStatusModal({ show: false, purchase: null });
      fetchPurchases();

      // Show success message
      console.log('Purchase status updated successfully');
    } catch (error) {
      console.error('Update status error:', error);
      setError(error.message || 'Failed to update purchase status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'received': { color: 'bg-green-100 text-green-800', label: 'Received' },
      'partial': { color: 'bg-blue-100 text-blue-800', label: 'Partial' },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderPurchasesList = () => (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Purchase Management</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Manage purchase orders, track deliveries, and process invoices.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setActiveTab('new')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Purchase
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('ocr')}
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Camera className="h-5 w-5" />
            <span>Scan Bill (OCR)</span>
          </button>
          <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Track Deliveries</span>
          </button>
          <button className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filtering
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
              <option value="partial">Partial</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setCurrentPage(1); // Reset to first page when clearing filters
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.length > 0 ? (
                purchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 text-left">
                          {purchase.invoiceNumber}
                        </div>
                        <div className="text-sm text-gray-500 text-left">
                          {new Date(purchase.invoiceDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400 text-left">
                          {purchase.items?.length || 0} items
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 text-left">
                        {purchase.supplier?.name || 'Unknown Supplier'}
                      </div>
                      <div className="text-sm text-gray-500 text-left">
                        {purchase.supplier?.contact || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{purchase.totalAmount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(purchase.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewPurchase(purchase._id)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="View Purchase Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditPurchase(purchase._id)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit Purchase"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(purchase)}
                          disabled={loading}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Update Status"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePurchase(purchase)}
                          disabled={loading || purchase.status === 'completed'}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={purchase.status === 'completed' ? 'Cannot delete completed purchase' : 'Delete Purchase'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No purchases found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * 20 + 1, totalCount)}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 20, totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-green-50 border-green-500 text-green-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderOCRTab = () => (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Bill OCR Scanner</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Upload bill images or PDFs to automatically extract medicine data using AI.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setActiveTab('list')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {/* Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Bill (JPG, PNG, PDF - Max 10MB)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-green-400">
            <div className="space-y-1 text-center">
              <FileImage className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, PDF up to 10MB
              </p>
            </div>
          </div>
        </div>

        {/* File Preview */}
        {ocrFile && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileImage className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{ocrFile.name}</p>
                  <p className="text-sm text-gray-500">{(ocrFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={processOCR}
                  disabled={ocrLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {ocrLoading ? (
                    <>
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Process OCR
                    </>
                  )}
                </button>
                <button
                  onClick={() => setOcrFile(null)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {ocrLoading && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Processing: {ocrProgress}%</p>
              </div>
            )}
          </div>
        )}

        {/* OCR Results */}
        {ocrResults && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="text-lg font-medium text-green-900">OCR Processing Complete</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Extracted Invoice Details</label>
                <div className="mt-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500">Invoice Number</label>
                    <p className="text-sm font-medium">{ocrResults.invoiceNumber || 'Not found'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Date</label>
                    <p className="text-sm font-medium">{ocrResults.date || 'Not found'}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extracted Medicines ({ocrResults.medicines?.length || 0} found)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {ocrResults.medicines?.map((medicine, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="font-medium">{medicine.name}</span>
                          <span className="block text-xs text-gray-500">
                            Match: {medicine.confidence}%
                          </span>
                        </div>
                        <div>Qty: {medicine.quantity}</div>
                        <div>Price: ₹{medicine.price}</div>
                        <div>Total: ₹{medicine.total}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Review & Edit
                </button>
                <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                  Create Purchase Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderNewPurchaseForm = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Create New Purchase Order</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Create a new purchase order for your suppliers.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setActiveTab('list')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to List
          </button>
        </div>
      </div>

      <form className="space-y-6">
        {/* Supplier Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Supplier
            </label>
            <div className="relative supplier-search-container">
              <input
                type="text"
                value={purchaseSupplierSearch}
                onChange={(e) => handlePurchaseSupplierSearch(e.target.value)}
                onFocus={() => {
                  if (purchaseSupplierSearch.trim() !== '') {
                    setShowPurchaseSupplierDropdown(true);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Search suppliers... (can be assigned later)"
              />

              {selectedPurchaseSupplier && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={resetPurchaseSupplierSelection}
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {showPurchaseSupplierDropdown && purchaseSupplierResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {purchaseSupplierResults.map((supplier) => (
                    <div
                      key={supplier._id}
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50"
                      onClick={() => selectPurchaseSupplier(supplier)}
                    >
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900 block truncate">
                          {supplier.name}
                        </span>
                        <span className="text-gray-500 ml-2 text-sm">
                          - {supplier.contactPerson}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!selectedPurchaseSupplier && (
              <p className="mt-1 text-sm text-yellow-600">
                💡 You can create this purchase order without a supplier and assign one later.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Purchase Order Number *
            </label>
            <input
              type="text"
              value={newPurchase.purchaseOrderNumber || ''}
              onChange={(e) => setNewPurchase(prev => ({ ...prev, purchaseOrderNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="PO-001"
              required
            />
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Invoice Number
            </label>
            <input
              type="text"
              value={newPurchase.invoiceNumber || ''}
              onChange={(e) => setNewPurchase(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="INV-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={newPurchase.expectedDeliveryDate || ''}
              onChange={(e) => setNewPurchase(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Items Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Purchase Items</h3>
            <button
              type="button"
              onClick={addItemToPurchase}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>

          {newPurchase.items.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No items added yet</p>
              <button
                type="button"
                onClick={addItemToPurchase}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {newPurchase.items.map((item, index) => (
                <div key={index} className={`border rounded-lg p-4 ${
                  item.isFromReorder ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                }`}>
                  {/* Customer Request Indicator */}
                  {item.isFromReorder && (
                    <div className="mb-3 flex items-center text-orange-700 bg-orange-100 px-3 py-2 rounded-md">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Customer Requested Item</span>
                      <span className="ml-2 text-xs bg-orange-200 px-2 py-1 rounded">
                        {item.reorderSource === 'customer_request' ? 'From Sales' : 'Reorder'}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Medicine *
                      </label>
                      {item.isFromReorder && item.medicineDetails ? (
                        <div className="w-full px-3 py-2 border border-orange-300 rounded-md bg-orange-50">
                          <div className="font-medium text-gray-900">{item.medicineDetails.name}</div>
                          <div className="text-sm text-gray-600">
                            {item.medicineDetails.manufacturer} | {item.medicineDetails.genericName}
                          </div>
                          <div className="text-xs text-orange-600 mt-1">
                            Customer requested - Not in current inventory
                          </div>
                        </div>
                      ) : (
                        <div className={`relative medicine-search-${index}`}>
                          <input
                            type="text"
                            value={medicineSearchStates[index]?.search || ''}
                            onChange={(e) => handleMedicineSearch(index, e.target.value)}
                            onFocus={() => {
                              if (medicineSearchStates[index]?.search?.trim()) {
                                setMedicineSearchStates(prev => ({
                                  ...prev,
                                  [index]: { ...prev[index], showDropdown: true }
                                }));
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="Search medicines..."
                            required
                          />

                          {medicineSearchStates[index]?.selectedMedicine && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <button
                                onClick={() => resetMedicineSelection(index)}
                                className="text-gray-400 hover:text-gray-600"
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          {medicineSearchStates[index]?.showDropdown && medicineSearchStates[index]?.results?.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                              {medicineSearchStates[index].results.map((medicine) => (
                                <div
                                  key={medicine._id}
                                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50"
                                  onClick={() => selectMedicine(index, medicine)}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-900 block truncate">
                                      {medicine.name}
                                    </span>
                                    <span className="text-gray-500 text-sm">
                                      {medicine.manufacturer} | {medicine.genericName}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updatePurchaseItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Unit Price *
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice || ''}
                        onChange={(e) => updatePurchaseItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                          Total
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                          ₹{(item.totalCost || 0).toFixed(2)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePurchaseItem(index)}
                        className="ml-2 p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tax Configuration */}
        {newPurchase.items.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Tax Configuration</h3>

            <div className="space-y-4">
              {/* Tax Enable/Disable Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="taxEnabled"
                  checked={newPurchase.taxEnabled}
                  onChange={(e) => updateTaxConfiguration('taxEnabled', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="taxEnabled" className="ml-2 block text-sm font-medium text-gray-700">
                  Apply tax to this purchase order
                </label>
              </div>

              {/* Tax Percentage Input */}
              {newPurchase.taxEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Tax Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={newPurchase.taxPercentage}
                      onChange={(e) => updateTaxConfiguration('taxPercentage', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="Enter tax percentage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Tax Amount
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                      ₹{newPurchase.taxAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtotal and Total Summary */}
              <div className="bg-white border border-gray-200 rounded-md p-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal (without tax):</span>
                    <span className="font-medium">₹{newPurchase.subtotal.toFixed(2)}</span>
                  </div>
                  {newPurchase.taxEnabled && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Tax ({newPurchase.taxPercentage}%):</span>
                      <span className="font-medium">₹{newPurchase.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-base font-semibold border-t pt-2">
                    <span className="text-gray-900">Grand Total:</span>
                    <span className="text-green-600">₹{newPurchase.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
            Notes
          </label>
          <textarea
            value={newPurchase.notes || ''}
            onChange={(e) => setNewPurchase(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Additional notes for this purchase order..."
          />
        </div>



        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreatePurchase}
            disabled={!newPurchase.supplier || !newPurchase.purchaseOrderNumber || newPurchase.items.length === 0}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Purchase Order
          </button>
        </div>
      </form>
    </div>
  );

  // Handle manual quantity override
  const handleQuantityChange = (medicineId, unitType, newQuantity) => {
    const key = `${medicineId}-${unitType}`;
    const quantity = Math.max(0, parseInt(newQuantity) || 0);
    setManualQuantities(prev => ({
      ...prev,
      [key]: quantity
    }));

    // Update selected reorder items if this item is already selected
    const itemKey = `${medicineId}_${unitType}`;
    setSelectedReorderItems(prev =>
      prev.map(item =>
        item.key === itemKey
          ? { ...item, quantity: quantity }
          : item
      )
    );
  };

  // Get effective quantity (manual override or system suggestion)
  const getEffectiveQuantity = (medicineId, unitType, systemSuggestion) => {
    const key = `${medicineId}-${unitType}`;
    return manualQuantities[key] !== undefined ? manualQuantities[key] : systemSuggestion;
  };

  const handleReorderItemToggle = (suggestion, unitType) => {
    const medicineId = suggestion.medicine?._id || suggestion.medicine || suggestion._id;
    const itemKey = `${medicineId}_${unitType}`;
    const isSelected = selectedReorderItems.some(item => item.key === itemKey);

    if (isSelected) {
      setSelectedReorderItems(prev => prev.filter(item => item.key !== itemKey));
    } else {
      // Handle customer requested items vs regular reorder suggestions
      if (suggestion.isCustomerRequested) {
        // Customer requested items - use default values
        const effectiveQuantity = getEffectiveQuantity(medicineId, unitType, suggestion.suggestedQuantity || 5);
        setSelectedReorderItems(prev => [...prev, {
          key: itemKey,
          medicine: medicineId,
          medicineName: suggestion.medicine?.name || suggestion.medicineName,
          manufacturer: suggestion.medicine?.manufacturer || suggestion.manufacturer,
          genericName: suggestion.medicine?.genericName || suggestion.genericName,
          category: suggestion.medicine?.category || suggestion.category,
          supplier: suggestion.supplier,
          unitType,
          quantity: effectiveQuantity,
          unitCost: 0, // Will need to be set manually
          currentStock: 0, // Customer requested items are out of stock
          reorderLevel: 1,
          isCustomerRequested: true,
          customerRequestSource: suggestion.customerRequestSource
        }]);
      } else {
        // Regular reorder suggestions
        const suggestionData = unitType === 'strip' ? suggestion.stripSuggestion : suggestion.individualSuggestion;
        const effectiveQuantity = getEffectiveQuantity(medicineId, unitType, suggestionData.suggestedQuantity);
        setSelectedReorderItems(prev => [...prev, {
          key: itemKey,
          medicine: medicineId,
          medicineName: suggestion.medicineName,
          manufacturer: suggestion.manufacturer,
          supplier: suggestion.supplier,
          unitType,
          quantity: effectiveQuantity,
          unitCost: suggestionData.unitCost,
          currentStock: suggestionData.currentStock,
          reorderLevel: suggestionData.reorderLevel
        }]);
      }
    }
  };

  // New flexible purchase order creation
  const createPurchaseOrdersFromReorder = () => {
    if (selectedReorderItems.length === 0) {
      setError('Please select at least one item to reorder');
      return;
    }

    // Group items by supplier
    const itemsBySupplier = selectedReorderItems.reduce((acc, item) => {
      const supplierId = item.supplier?._id || 'no-supplier';
      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplier: item.supplier,
          items: []
        };
      }
      acc[supplierId].items.push(item);
      return acc;
    }, {});

    const supplierGroups = Object.values(itemsBySupplier);

    if (supplierGroups.length === 1) {
      // Single supplier or no supplier - create one purchase order
      const group = supplierGroups[0];
      createSinglePurchaseOrder(group);
    } else {
      // Multiple suppliers - show grouping options
      setShowSupplierGrouping(true);
    }
  };

  const createSinglePurchaseOrder = (supplierGroup) => {
    // Pre-populate the new purchase form
    setNewPurchase({
      supplier: supplierGroup.supplier?._id || '',
      purchaseOrderNumber: `PO-${Date.now()}`,
      invoiceNumber: '',
      expectedDeliveryDate: '',
      items: supplierGroup.items.map(item => {
        // Handle customer requested items vs regular reorder items
        if (item.isCustomerRequested) {
          // Check if medicine ID is valid (not fake) for customer requests
          const isValidMedicineId = item.medicine &&
                                  typeof item.medicine === 'string' &&
                                  item.medicine.length === 24 &&
                                  !item.medicine.startsWith('customer_') &&
                                  /^[0-9a-fA-F]{24}$/.test(item.medicine);

          return {
            medicine: isValidMedicineId ? item.medicine : '',
            medicineName: item.medicineName,
            manufacturer: item.manufacturer,
            unitType: item.unitType,
            quantity: item.quantity,
            unitPrice: item.unitCost,
            totalCost: item.quantity * item.unitCost,
            discount: 0,
            discountAmount: 0,
            // Add required properties for customer requested items
            isFromReorder: true,
            reorderSource: item.customerRequestSource || 'customer_request',
            medicineDetails: {
              name: item.medicineName,
              manufacturer: item.manufacturer,
              genericName: item.genericName || '',
              category: item.category || ''
            }
          };
        } else {
          // Regular reorder items
          return {
            medicine: item.medicine,
            medicineName: item.medicineName,
            manufacturer: item.manufacturer,
            unitType: item.unitType,
            quantity: item.quantity,
            unitPrice: item.unitCost,
            totalCost: item.quantity * item.unitCost,
            discount: 0,
            discountAmount: 0
          };
        }
      }),
      subtotal: supplierGroup.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitCost);
      }, 0),
      taxEnabled: false,
      taxPercentage: 0,
      taxAmount: 0,
      totalAmount: supplierGroup.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitCost);
      }, 0),
      notes: supplierGroup.supplier ?
        `Reorder for ${supplierGroup.supplier.name}` :
        'Reorder - Supplier to be assigned'
    });

    // Switch to new purchase tab
    setActiveTab('new');
    setSelectedReorderItems([]);
    setShowSupplierGrouping(false);
  };

  // Print reorder list
  const printReorderList = () => {
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintableReorderList();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrintableReorderList = () => {
    const currentDate = new Date().toLocaleDateString();
    let html = `
      <html>
        <head>
          <title>Reorder List - ${currentDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .no-supplier { color: #e74c3c; font-style: italic; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Medicine Reorder List</h1>
            <p>Generated on: ${currentDate}</p>
            ${reorderSummary ? `<p>Total Items: ${reorderSummary.totalItems} | Estimated Cost: ₹${reorderSummary.totalEstimatedCost.toFixed(2)}</p>` : ''}
          </div>
    `;

    if (reorderSummary && reorderSummary.totalItems > 0) {
      html += `
        <div class="summary">
          <h3>Summary</h3>
          <p>Items with suppliers: ${reorderSummary.itemsWithSuppliers}</p>
          <p>Items without suppliers: ${reorderSummary.itemsWithoutSuppliers}</p>
          <p>Total estimated cost: ₹${reorderSummary.totalEstimatedCost.toFixed(2)}</p>
        </div>
      `;
    }

    html += `
      <table>
        <thead>
          <tr>
            <th>Medicine Name</th>
            <th>Manufacturer</th>
            <th>Unit Type</th>
            <th>Current Stock</th>
            <th>Reorder Level</th>
            <th>Suggested Qty</th>
            <th>Unit Cost</th>
            <th>Total Cost</th>
            <th>Supplier</th>
          </tr>
        </thead>
        <tbody>
    `;

    reorderSuggestions.forEach(suggestion => {
      // Handle customer requested items
      if (suggestion.isCustomerRequested) {
        const medicineId = suggestion._id || suggestion.medicine;
        const effectiveQuantity = getEffectiveQuantity(medicineId, 'strip', suggestion.suggestedQuantity || 5);
        html += `
          <tr style="background-color: #fff3cd; border-left: 4px solid #ffc107;">
            <td><strong>${suggestion.medicine?.name || suggestion.medicineName}</strong> <em>(Customer Request)</em></td>
            <td>${suggestion.medicine?.manufacturer || suggestion.manufacturer}</td>
            <td>Strip</td>
            <td>0 (Not in inventory)</td>
            <td>-</td>
            <td>${effectiveQuantity}</td>
            <td>TBD</td>
            <td>TBD</td>
            <td>${suggestion.supplier?.name || '<span class="no-supplier">Contact Supplier</span>'}</td>
          </tr>
        `;
      }

      // Handle regular reorder suggestions
      if (suggestion.stripSuggestion) {
        const effectiveQuantity = getEffectiveQuantity(suggestion.medicine, 'strip', suggestion.stripSuggestion.suggestedQuantity);
        const totalCost = effectiveQuantity * suggestion.stripSuggestion.unitCost;
        const quantityDisplay = effectiveQuantity !== suggestion.stripSuggestion.suggestedQuantity ?
          `${effectiveQuantity} (System: ${suggestion.stripSuggestion.suggestedQuantity})` :
          effectiveQuantity;
        html += `
          <tr>
            <td>${suggestion.medicineName}</td>
            <td>${suggestion.manufacturer}</td>
            <td>Strip</td>
            <td>${suggestion.stripSuggestion.currentStock}</td>
            <td>${suggestion.stripSuggestion.reorderLevel}</td>
            <td>${quantityDisplay}</td>
            <td>₹${suggestion.stripSuggestion.unitCost}</td>
            <td>₹${totalCost.toFixed(2)}</td>
            <td>${suggestion.supplier?.name || '<span class="no-supplier">No Supplier</span>'}</td>
          </tr>
        `;
      }
      if (suggestion.individualSuggestion) {
        const effectiveQuantity = getEffectiveQuantity(suggestion.medicine, 'individual', suggestion.individualSuggestion.suggestedQuantity);
        const totalCost = effectiveQuantity * suggestion.individualSuggestion.unitCost;
        const quantityDisplay = effectiveQuantity !== suggestion.individualSuggestion.suggestedQuantity ?
          `${effectiveQuantity} (System: ${suggestion.individualSuggestion.suggestedQuantity})` :
          effectiveQuantity;
        html += `
          <tr>
            <td>${suggestion.medicineName}</td>
            <td>${suggestion.manufacturer}</td>
            <td>Individual</td>
            <td>${suggestion.individualSuggestion.currentStock}</td>
            <td>${suggestion.individualSuggestion.reorderLevel}</td>
            <td>${quantityDisplay}</td>
            <td>₹${suggestion.individualSuggestion.unitCost}</td>
            <td>₹${totalCost.toFixed(2)}</td>
            <td>${suggestion.supplier?.name || '<span class="no-supplier">No Supplier</span>'}</td>
          </tr>
        `;
      }
    });

    html += `
        </tbody>
      </table>
      <div style="margin-top: 30px; font-size: 12px; color: #666;">
        <p>Generated by ShelfCure - Medicine Store Management System</p>
      </div>
    </body>
    </html>
    `;

    return html;
  };

  // Export reorder list as CSV (including customer requests)
  const exportReorderList = () => {
    try {
      // Generate CSV content from current reorderSuggestions state
      let csvContent = 'Medicine Name,Manufacturer,Unit Type,Current Stock,Reorder Level,Suggested Qty,Unit Cost,Total Cost,Supplier,Type\n';

      reorderSuggestions.forEach(suggestion => {
        // Handle customer requested items
        if (suggestion.isCustomerRequested) {
          const medicineId = suggestion._id || suggestion.medicine;
          const effectiveQuantity = getEffectiveQuantity(medicineId, 'strip', suggestion.suggestedQuantity || 5);
          const medicineName = (suggestion.medicine?.name || suggestion.medicineName).replace(/,/g, ';');
          const manufacturer = (suggestion.medicine?.manufacturer || suggestion.manufacturer).replace(/,/g, ';');
          const supplier = suggestion.supplier?.name ? suggestion.supplier.name.replace(/,/g, ';') : 'Contact Supplier';

          csvContent += `"${medicineName} (Customer Request)","${manufacturer}",Strip,"0 (Not in inventory)","-","${effectiveQuantity}",TBD,TBD,"${supplier}",Customer Request\n`;
        }

        // Handle regular reorder suggestions
        if (suggestion.stripSuggestion) {
          const effectiveQuantity = getEffectiveQuantity(suggestion.medicine, 'strip', suggestion.stripSuggestion.suggestedQuantity);
          const totalCost = effectiveQuantity * suggestion.stripSuggestion.unitCost;
          const medicineName = suggestion.medicineName.replace(/,/g, ';');
          const manufacturer = suggestion.manufacturer.replace(/,/g, ';');
          const supplier = suggestion.supplier?.name ? suggestion.supplier.name.replace(/,/g, ';') : 'No Supplier';

          csvContent += `"${medicineName}","${manufacturer}",Strip,${suggestion.stripSuggestion.currentStock},${suggestion.stripSuggestion.reorderLevel},${effectiveQuantity},₹${suggestion.stripSuggestion.unitCost},₹${totalCost.toFixed(2)},"${supplier}",Regular\n`;
        }
        if (suggestion.individualSuggestion) {
          const effectiveQuantity = getEffectiveQuantity(suggestion.medicine, 'individual', suggestion.individualSuggestion.suggestedQuantity);
          const totalCost = effectiveQuantity * suggestion.individualSuggestion.unitCost;
          const medicineName = suggestion.medicineName.replace(/,/g, ';');
          const manufacturer = suggestion.manufacturer.replace(/,/g, ';');
          const supplier = suggestion.supplier?.name ? suggestion.supplier.name.replace(/,/g, ';') : 'No Supplier';

          csvContent += `"${medicineName}","${manufacturer}",Individual,${suggestion.individualSuggestion.currentStock},${suggestion.individualSuggestion.reorderLevel},${effectiveQuantity},₹${suggestion.individualSuggestion.unitCost},₹${totalCost.toFixed(2)},"${supplier}",Regular\n`;
        }
      });

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reorder-list-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting reorder list:', error);
      setError('Failed to export reorder list');
    }
  };

  // Supplier search API function
  const searchSuppliersAPI = async (searchTerm) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/suppliers/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Supplier search error:', error);
      return [];
    }
  };

  // Supplier search functions
  const handleSupplierSearch = async (searchTerm) => {
    setSupplierSearch(searchTerm);
    if (searchTerm.length > 0) {
      setSupplierSearchLoading(true);
      try {
        const filteredSuppliers = await searchSuppliersAPI(searchTerm);
        setWhatsappSuppliers(filteredSuppliers);
        setSupplierSearchLoading(false);
        setShowSupplierDropdown(true);
      } catch (error) {
        console.error('Supplier search error:', error);
        setWhatsappSuppliers([]);
        setSupplierSearchLoading(false);
        setShowSupplierDropdown(false);
      }
    } else {
      setWhatsappSuppliers([]);
      setShowSupplierDropdown(false);
    }
  };

  const selectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearch(supplier.name);
    setPhoneNumber(supplier.phone || '');
    setShowSupplierDropdown(false);
    setWhatsappSuppliers([]);
  };

  const resetSupplierSelection = () => {
    setSelectedSupplier(null);
    setSupplierSearch('');
    setPhoneNumber('');
    setWhatsappSuppliers([]);
    setShowSupplierDropdown(false);
  };

  // Purchase form supplier search functions
  const handlePurchaseSupplierSearch = (searchTerm) => {
    setPurchaseSupplierSearch(searchTerm);
    if (searchTerm.trim() === '') {
      setPurchaseSupplierResults([]);
      setShowPurchaseSupplierDropdown(false);
      return;
    }

    const filtered = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setPurchaseSupplierResults(filtered);
    setShowPurchaseSupplierDropdown(true);
  };

  const selectPurchaseSupplier = (supplier) => {
    setSelectedPurchaseSupplier(supplier);
    setPurchaseSupplierSearch(supplier.name);
    setShowPurchaseSupplierDropdown(false);
    setNewPurchase(prev => ({ ...prev, supplier: supplier._id }));
  };

  const resetPurchaseSupplierSelection = () => {
    setSelectedPurchaseSupplier(null);
    setPurchaseSupplierSearch('');
    setPurchaseSupplierResults([]);
    setShowPurchaseSupplierDropdown(false);
    setNewPurchase(prev => ({ ...prev, supplier: '' }));
  };

  // Medicine search functions for purchase items
  const handleMedicineSearch = (index, searchTerm) => {
    setMedicineSearchStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        search: searchTerm,
        results: searchTerm.trim() === '' ? [] : medicines.filter(medicine =>
          medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.genericName?.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        showDropdown: searchTerm.trim() !== ''
      }
    }));
  };

  const selectMedicine = (index, medicine) => {
    setMedicineSearchStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        search: medicine.name,
        selectedMedicine: medicine,
        showDropdown: false
      }
    }));
    updatePurchaseItem(index, 'medicine', medicine._id);
  };

  const resetMedicineSelection = (index) => {
    setMedicineSearchStates(prev => ({
      ...prev,
      [index]: {
        search: '',
        results: [],
        showDropdown: false,
        selectedMedicine: null
      }
    }));
    updatePurchaseItem(index, 'medicine', '');
  };

  // Send reorder list via WhatsApp (Direct client-side approach like sales page)
  const sendWhatsAppReorderList = async (phoneNumber, items, customMessage = '') => {
    try {
      // Validate inputs
      if (!phoneNumber) {
        setError('Please enter a phone number');
        return;
      }

      if (!items || items.length === 0) {
        setError('No items to send in reorder list');
        return;
      }

      // Format phone number (same as sales page)
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone; // Add India country code
      }

      // Create reorder message (similar to sales invoice format)
      let reorderMessage = `🏥 *Reorder Request*\n\n`;
      reorderMessage += `Dear Supplier,\n\n`;
      reorderMessage += `We would like to place a reorder for the following medicines:\n\n`;

      // Add items to message
      items.forEach((item, index) => {
        const medicineName = item.medicineName || item.medicine?.name || item.name;
        reorderMessage += `${index + 1}. *${medicineName}*\n`;

        // Handle customer requested items
        if (item.isCustomerRequested) {
          const medicineId = item._id || item.medicine;
          const effectiveQuantity = getEffectiveQuantity(medicineId, 'strip', item.suggestedQuantity || 5);
          reorderMessage += `   🔸 *CUSTOMER REQUEST* - Not in current inventory\n`;
          reorderMessage += `   • Quantity: ${effectiveQuantity} strips\n`;
          if (item.medicine?.manufacturer || item.manufacturer) {
            reorderMessage += `   • Manufacturer: ${item.medicine?.manufacturer || item.manufacturer}\n`;
          }
          if (item.medicine?.genericName) {
            reorderMessage += `   • Generic: ${item.medicine.genericName}\n`;
          }
          reorderMessage += `   • Priority: HIGH (Customer waiting)\n`;
        } else {
          // Handle regular reorder suggestions
          if (item.stripSuggestion) {
            reorderMessage += `   • Strips: ${item.stripSuggestion.suggestedQuantity} units\n`;
          }
          if (item.individualSuggestion) {
            reorderMessage += `   • Individual: ${item.individualSuggestion.suggestedQuantity} units\n`;
          }
          if (item.quantity) {
            reorderMessage += `   • Quantity: ${item.quantity} ${item.unit || 'units'}\n`;
          }
          if (item.manufacturer) {
            reorderMessage += `   • Manufacturer: ${item.manufacturer}\n`;
          }
          if (item.lastPurchasePrice) {
            reorderMessage += `   • Last Price: ₹${item.lastPurchasePrice}\n`;
          }
        }
        reorderMessage += `\n`;
      });

      // Add custom message if provided
      if (customMessage && customMessage.trim()) {
        reorderMessage += `*Additional Notes:*\n${customMessage.trim()}\n\n`;
      }

      reorderMessage += `Please confirm availability and pricing.\n\n`;
      reorderMessage += `Thank you! 💊\n`;
      reorderMessage += `Best regards 🌟`;

      // Create WhatsApp URL (same as sales page)
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(reorderMessage)}`;

      // Open WhatsApp (same as sales page)
      window.open(whatsappUrl, '_blank');

      // Close modal and reset
      setWhatsappModal({ show: false, supplier: null, items: [] });
      resetSupplierSelection();

      // Show success message
      alert('WhatsApp opened with reorder list. Please review and send the message to your supplier.');

    } catch (error) {
      console.error('Error sharing reorder list via WhatsApp:', error);
      setError('Error sharing reorder list via WhatsApp');
    }
  };



  const renderReorderTab = () => (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Reorder Items</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Items that are at or below their reorder levels and need restocking
          </p>
          {reorderSummary && (
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Total: {reorderSummary.totalItems} items
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                With Suppliers: {reorderSummary.itemsWithSuppliers}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Without Suppliers: {reorderSummary.itemsWithoutSuppliers}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Est. Cost: ₹{reorderSummary.totalEstimatedCost.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Action Buttons Row 1 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetchReorderSuggestions();
                  setSelectedReorderItems([]);
                }}
                disabled={reorderLoading}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh reorder list"
              >
                <RefreshCw className={`h-4 w-4 ${reorderLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={printReorderList}
                disabled={reorderSuggestions.length === 0}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Print reorder list"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={exportReorderList}
                disabled={reorderSuggestions.length === 0}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export as CSV"
              >
                <FileText className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  resetSupplierSelection();
                  setWhatsappModal({ show: true, supplier: null, items: reorderSuggestions });
                }}
                disabled={reorderSuggestions.length === 0}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send via WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
            {/* Action Buttons Row 2 */}
            <div className="flex gap-2">
              <button
                onClick={createPurchaseOrdersFromReorder}
                disabled={selectedReorderItems.length === 0}
                className={`inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  selectedReorderItems.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create PO ({selectedReorderItems.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {reorderLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : reorderSuggestions.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items need reordering</h3>
          <p className="mt-1 text-sm text-gray-500">All medicines are above their reorder levels.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reorderSuggestions.map((suggestion) => (
            <div key={suggestion._id || suggestion.medicine} className={`bg-white border rounded-lg p-4 ${
              suggestion.isCustomerRequested
                ? 'border-orange-300 bg-orange-50'
                : 'border-gray-200'
            }`}>
              {/* List Item Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {/* Medicine Name */}
                  <h3 className="text-lg font-semibold text-gray-900 text-left mb-1">
                    {suggestion.medicine?.name || suggestion.medicineName}
                  </h3>

                  {/* Medicine Details */}
                  <div className="text-sm text-gray-600 space-y-1">
                    {(suggestion.medicine?.genericName || suggestion.genericName) && (
                      <p>
                        <span className="font-medium text-gray-700">Generic:</span> {suggestion.medicine?.genericName || suggestion.genericName}
                      </p>
                    )}
                    {(suggestion.medicine?.manufacturer || suggestion.manufacturer) && (
                      <p>
                        <span className="font-medium text-gray-700">Manufacturer:</span> {suggestion.medicine?.manufacturer || suggestion.manufacturer}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 ml-4">
                  {suggestion.isCustomerRequested && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      <Users className="h-3 w-3 mr-1" />
                      Customer Request
                    </span>
                  )}
                  {!suggestion.isCustomerRequested && suggestion.priority <= 0.5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Critical
                    </span>
                  )}
                  {suggestion.supplier && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      <Package className="h-3 w-3 mr-1" />
                      {suggestion.supplier.name}
                    </span>
                  )}
                  {!suggestion.supplier && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      No Supplier
                    </span>
                  )}
                </div>
              </div>

              {/* Unit Selection */}
              <div className="mt-3">
                {suggestion.isCustomerRequested ? (
                  /* Customer Requested Items */
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedReorderItems.some(item => item.key === `${suggestion._id || suggestion.medicine}_strip`)}
                            onChange={() => handleReorderItemToggle(suggestion, 'strip')}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Add to Purchase Order</span>
                        </label>
                      </div>
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        Suggested: {suggestion.suggestedQuantity || 5}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Current Stock</p>
                        <p className="font-semibold text-red-600">0 (Not in inventory)</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Priority</p>
                        <p className="font-semibold text-orange-600">High</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Quantity to Order</p>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={getEffectiveQuantity(suggestion._id || suggestion.medicine, 'strip', suggestion.suggestedQuantity || 5)}
                            onChange={(e) => handleQuantityChange(suggestion._id || suggestion.medicine, 'strip', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Qty"
                          />
                          <span className="text-xs text-gray-500">strips</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-orange-600">
                      💰 Unit Cost: To be determined by supplier
                    </div>
                  </div>
                ) : (
                  /* Regular Reorder Suggestions */
                  <div className="border-t pt-3 space-y-3">
                    {suggestion.stripSuggestion && (
                      <div className="border-l-4 border-green-500 pl-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedReorderItems.some(item => item.key === `${suggestion.medicine}_strip`)}
                                onChange={() => handleReorderItemToggle(suggestion, 'strip')}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-2"
                              />
                              <span className="text-sm font-medium text-gray-700">Strip Units</span>
                            </label>
                          </div>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                            Suggested: {suggestion.stripSuggestion.suggestedQuantity}
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Current Stock</p>
                            <p className="font-semibold text-red-600">{suggestion.stripSuggestion.currentStock}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Reorder Level</p>
                            <p className="font-semibold text-orange-600">{suggestion.stripSuggestion.reorderLevel}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Unit Cost</p>
                            <p className="font-semibold text-green-600">₹{suggestion.stripSuggestion.unitCost}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Quantity to Order</p>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                value={getEffectiveQuantity(suggestion.medicine, 'strip', suggestion.stripSuggestion.suggestedQuantity)}
                                onChange={(e) => handleQuantityChange(suggestion.medicine, 'strip', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Qty"
                              />
                              <span className="text-xs text-gray-500">strips</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Total Cost</p>
                            <p className="font-semibold text-green-600">
                              ₹{(getEffectiveQuantity(suggestion.medicine, 'strip', suggestion.stripSuggestion.suggestedQuantity) * suggestion.stripSuggestion.unitCost).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {suggestion.individualSuggestion && (
                      <div className="border-l-4 border-blue-500 pl-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedReorderItems.some(item => item.key === `${suggestion.medicine}_individual`)}
                                onChange={() => handleReorderItemToggle(suggestion, 'individual')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                              />
                              <span className="text-sm font-medium text-gray-700">Individual Units</span>
                            </label>
                          </div>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            Suggested: {suggestion.individualSuggestion.suggestedQuantity}
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Current Stock</p>
                            <p className="font-semibold text-red-600">{suggestion.individualSuggestion.currentStock}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Reorder Level</p>
                            <p className="font-semibold text-orange-600">{suggestion.individualSuggestion.reorderLevel}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Unit Cost</p>
                            <p className="font-semibold text-blue-600">₹{suggestion.individualSuggestion.unitCost}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Quantity to Order</p>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                value={getEffectiveQuantity(suggestion.medicine, 'individual', suggestion.individualSuggestion.suggestedQuantity)}
                                onChange={(e) => handleQuantityChange(suggestion.medicine, 'individual', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Qty"
                              />
                              <span className="text-xs text-gray-500">units</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Total Cost</p>
                            <p className="font-semibold text-blue-600">
                              ₹{(getEffectiveQuantity(suggestion.medicine, 'individual', suggestion.individualSuggestion.suggestedQuantity) * suggestion.individualSuggestion.unitCost).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMedicineRequestsTab = () => (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Medicine Requests</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            New medicine requests from store managers that need to be ordered
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => window.location.href = '/store-panel/add-medicine-request'}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Request
          </button>
        </div>
      </div>

      {requestsLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : medicineRequests.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No medicine requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding a new medicine request.
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.location.href = '/store-panel/add-medicine-request'}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Request
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {medicineRequests.map((request) => (
              <li key={request._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 text-left">
                        {request.medicineName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'received' ? 'bg-purple-100 text-purple-800' :
                          request.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          request.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 text-left">
                      {request.manufacturer && request.manufacturer !== 'Not specified' && (
                        <p><strong>Manufacturer:</strong> {request.manufacturer}</p>
                      )}
                      {request.composition && request.composition !== 'Not specified' && (
                        <p><strong>Composition:</strong> {request.composition}</p>
                      )}
                      {request.strength && request.strength !== 'Not specified' && (
                        <p><strong>Strength:</strong> {request.strength}</p>
                      )}
                      {request.packSize && request.packSize !== 'Not specified' && (
                        <p><strong>Pack Size:</strong> {request.packSize}</p>
                      )}
                      <p><strong>Requested Quantity:</strong> {request.requestedQuantity} {request.unitType}(s)</p>
                      {request.supplierInfo?.name && (
                        <p><strong>Suggested Supplier:</strong> {request.supplierInfo.name}</p>
                      )}
                      {request.notes && !request.notes.startsWith('Added via quick request form') && (
                        <p><strong>Notes:</strong> {request.notes}</p>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-left">
                      Requested by {request.requestedBy?.name} on {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    {request.status === 'pending' && (
                      <button
                        onClick={() => {
                          // Convert to purchase order
                          const requestData = {
                            medicines: [{
                              _id: `request_${request._id}`,
                              name: request.medicineName,
                              manufacturer: request.manufacturer,
                              genericName: request.composition,
                              category: request.category,
                              isInInventory: false,
                              isCustomerRequested: true,
                              requestedQuantity: request.requestedQuantity,
                              unitType: request.unitType,
                              supplierInfo: request.supplierInfo,
                              notes: request.notes,
                              priority: request.priority
                            }],
                            source: 'medicine_request'
                          };
                          localStorage.setItem('reorderData', JSON.stringify(requestData));
                          setActiveTab('reorder');
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                      >
                        Convert to Purchase
                      </button>
                    )}
                    <button
                      onClick={() => setViewRequestModal({ show: true, request })}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => deleteMedicineRequest(request._id, request.medicineName)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                      title="Delete this medicine request"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (loading && purchases.length === 0) {
    return (
      <StoreManagerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </StoreManagerLayout>
    );
  }

  return (
    <StoreManagerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className={`${
                  activeTab === 'list'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Purchase List
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`${
                  activeTab === 'new'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                New Purchase
              </button>
              <button
                onClick={() => setActiveTab('reorder')}
                className={`${
                  activeTab === 'reorder'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Reorder Items
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`${
                  activeTab === 'requests'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Medicine Requests
              </button>
              <button
                onClick={() => setActiveTab('ocr')}
                className={`${
                  activeTab === 'ocr'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Bill OCR Scanner
              </button>
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'list' && renderPurchasesList()}
          {activeTab === 'reorder' && renderReorderTab()}
          {activeTab === 'requests' && renderMedicineRequestsTab()}
          {activeTab === 'ocr' && renderOCRTab()}
          {activeTab === 'new' && renderNewPurchaseForm()}
        </div>
      </div>

      {/* Supplier Grouping Modal */}
      {showSupplierGrouping && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Purchase Orders by Supplier</h3>
                <button
                  onClick={() => setShowSupplierGrouping(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Group items by supplier */}
                {(() => {
                  const itemsBySupplier = selectedReorderItems.reduce((acc, item) => {
                    const supplierId = item.supplier?._id || 'no-supplier';
                    if (!acc[supplierId]) {
                      acc[supplierId] = {
                        supplier: item.supplier,
                        items: []
                      };
                    }
                    acc[supplierId].items.push(item);
                    return acc;
                  }, {});

                  return Object.entries(itemsBySupplier).map(([supplierId, group]) => (
                    <div key={supplierId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-gray-400 mr-2" />
                          <h4 className="text-md font-medium text-gray-900">
                            {group.supplier ? group.supplier.name : 'No Supplier Assigned'}
                          </h4>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {group.items.length} items
                          </span>
                        </div>
                        <button
                          onClick={() => createSinglePurchaseOrder(group)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create PO
                        </button>
                      </div>

                      {group.supplier && (
                        <div className="text-sm text-gray-600 mb-3">
                          <p>Contact: {group.supplier.contactPerson}</p>
                          <p>Phone: {group.supplier.phone}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {group.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{item.medicineName}</span>
                              <span className="text-sm text-gray-500 ml-2">({item.unitType})</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Qty: {item.quantity} | Cost: ₹{(item.quantity * item.unitCost).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Cost:</span>
                          <span className="font-medium text-green-600">
                            ₹{group.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSupplierGrouping(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Create all purchase orders at once
                    const itemsBySupplier = selectedReorderItems.reduce((acc, item) => {
                      const supplierId = item.supplier?._id || 'no-supplier';
                      if (!acc[supplierId]) {
                        acc[supplierId] = {
                          supplier: item.supplier,
                          items: []
                        };
                      }
                      acc[supplierId].items.push(item);
                      return acc;
                    }, {});

                    // For now, create the first one and show a message about the others
                    const groups = Object.values(itemsBySupplier);
                    if (groups.length > 0) {
                      createSinglePurchaseOrder(groups[0]);
                      if (groups.length > 1) {
                        alert(`Created purchase order for ${groups[0].supplier?.name || 'No Supplier'}. Please repeat for the remaining ${groups.length - 1} supplier(s).`);
                      }
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Create First PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {whatsappModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Send Reorder List via WhatsApp</h3>
                <button
                  onClick={() => {
                    setWhatsappModal({ show: false, supplier: null, items: [] });
                    resetSupplierSelection();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Supplier Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Supplier (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={supplierSearch}
                      onChange={(e) => handleSupplierSearch(e.target.value)}
                      onFocus={() => {
                        if (supplierSearch.length > 0) {
                          setShowSupplierDropdown(true);
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                      placeholder="Search suppliers by name..."
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />

                    {supplierSearchLoading && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                      </div>
                    )}

                    {selectedSupplier && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          onClick={resetSupplierSelection}
                          className="text-gray-400 hover:text-gray-600"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Supplier Dropdown */}
                    {showSupplierDropdown && whatsappSuppliers.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {whatsappSuppliers.map((supplier) => (
                          <div
                            key={supplier._id}
                            onClick={() => selectSupplier(supplier)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                                <div className="text-xs text-gray-500">{supplier.contactPerson}</div>
                                {supplier.address?.city && (
                                  <div className="text-xs text-gray-400">{supplier.address.city}</div>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">{supplier.phone}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSupplier && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-green-800">{selectedSupplier.name}</div>
                          <div className="text-xs text-green-600">{selectedSupplier.contactPerson}</div>
                        </div>
                        <div className="text-sm text-green-700">{selectedSupplier.phone}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number (e.g., +919876543210)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  {selectedSupplier && (
                    <p className="mt-1 text-xs text-gray-500">
                      Phone number auto-filled from selected supplier
                    </p>
                  )}
                </div>

                {/* Custom Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message (Optional)
                  </label>
                  <textarea
                    placeholder="Add a custom message..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    id="whatsapp-message"
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    This will send a reorder list for {whatsappModal.items.length} medicine(s) to the specified phone number.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setWhatsappModal({ show: false, supplier: null, items: [] });
                    resetSupplierSelection();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const message = document.getElementById('whatsapp-message').value;
                    if (phoneNumber) {
                      sendWhatsAppReorderList(phoneNumber, whatsappModal.items, message);
                    } else {
                      setError('Please enter a phone number');
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <MessageCircle className="h-4 w-4 mr-2 inline" />
                  Send WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Purchase Modal */}
      {viewModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Purchase Order Details</h3>
                <button
                  onClick={() => setViewModal({ show: false, purchase: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {viewModal.purchase && (
                <div className="space-y-6">
                  {/* Purchase Header */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Purchase Order Number</h4>
                      <p className="text-sm text-gray-900">{viewModal.purchase.purchaseOrderNumber}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Invoice Number</h4>
                      <p className="text-sm text-gray-900">{viewModal.purchase.invoiceNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Supplier</h4>
                      <p className="text-sm text-gray-900">{viewModal.purchase.supplier?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Status</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        viewModal.purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                        viewModal.purchase.status === 'received' ? 'bg-blue-100 text-blue-800' :
                        viewModal.purchase.status === 'ordered' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {viewModal.purchase.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Purchase Date</h4>
                      <p className="text-sm text-gray-900">
                        {new Date(viewModal.purchase.purchaseDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Expected Delivery</h4>
                      <p className="text-sm text-gray-900">
                        {viewModal.purchase.expectedDeliveryDate ?
                          new Date(viewModal.purchase.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Items</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {viewModal.purchase.items?.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.medicineName}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">₹{item.unitCost?.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">₹{item.totalCost?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-green-600">₹{viewModal.purchase.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {viewModal.purchase.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewModal.purchase.notes}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewModal({ show: false, purchase: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
                <button
                  onClick={() => setDeleteModal({ show: false, purchase: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-12 w-12 text-red-500 mr-4" />
                  <div>
                    <p className="text-sm text-gray-900">
                      Are you sure you want to delete this purchase order?
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PO: {deleteModal.purchase?.purchaseOrderNumber}
                    </p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">
                    This action cannot be undone. The purchase order and all associated data will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModal({ show: false, purchase: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePurchase}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Purchase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Update Purchase Status</h3>
                <button
                  onClick={() => setStatusModal({ show: false, purchase: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Current Status: <span className="font-medium">{statusModal.purchase?.status}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  PO: {statusModal.purchase?.purchaseOrderNumber}
                </p>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Select New Status:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['draft', 'ordered', 'confirmed', 'shipped', 'received', 'completed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updatePurchaseStatus(status)}
                        disabled={loading || status === statusModal.purchase?.status}
                        className={`px-3 py-2 text-sm font-medium rounded-md border ${
                          status === statusModal.purchase?.status
                            ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                            : status === 'completed'
                            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                            : status === 'cancelled'
                            ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                            : status === 'received'
                            ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStatusModal({ show: false, purchase: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medicine Request View Modal */}
      {viewRequestModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Medicine Request Details</h3>
                <button
                  onClick={() => setViewRequestModal({ show: false, request: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {viewRequestModal.request && (
                <div className="space-y-4">
                  {/* Request Header */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Medicine Name</label>
                      <p className="mt-1 text-sm text-gray-900">{viewRequestModal.request.medicineName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Requested Quantity</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {viewRequestModal.request.requestedQuantity} {viewRequestModal.request.unitType}(s)
                      </p>
                    </div>
                  </div>

                  {/* Medicine Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewRequestModal.request.manufacturer && viewRequestModal.request.manufacturer !== 'Not specified' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                        <p className="mt-1 text-sm text-gray-900">{viewRequestModal.request.manufacturer}</p>
                      </div>
                    )}
                    {viewRequestModal.request.composition && viewRequestModal.request.composition !== 'Not specified' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Composition</label>
                        <p className="mt-1 text-sm text-gray-900">{viewRequestModal.request.composition}</p>
                      </div>
                    )}
                    {viewRequestModal.request.strength && viewRequestModal.request.strength !== 'Not specified' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Strength</label>
                        <p className="mt-1 text-sm text-gray-900">{viewRequestModal.request.strength}</p>
                      </div>
                    )}
                    {viewRequestModal.request.packSize && viewRequestModal.request.packSize !== 'Not specified' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pack Size</label>
                        <p className="mt-1 text-sm text-gray-900">{viewRequestModal.request.packSize}</p>
                      </div>
                    )}
                  </div>

                  {/* Request Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        viewRequestModal.request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        viewRequestModal.request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        viewRequestModal.request.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                        viewRequestModal.request.status === 'received' ? 'bg-purple-100 text-purple-800' :
                        viewRequestModal.request.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {viewRequestModal.request.status.charAt(0).toUpperCase() + viewRequestModal.request.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        viewRequestModal.request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        viewRequestModal.request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        viewRequestModal.request.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {viewRequestModal.request.priority.charAt(0).toUpperCase() + viewRequestModal.request.priority.slice(1)} Priority
                      </span>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 gap-4">
                    {viewRequestModal.request.supplierInfo?.name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Suggested Supplier</label>
                        <p className="mt-1 text-sm text-gray-900">{viewRequestModal.request.supplierInfo.name}</p>
                      </div>
                    )}
                    {viewRequestModal.request.notes && !viewRequestModal.request.notes.startsWith('Added via quick request form') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <p className="mt-1 text-sm text-gray-900">{viewRequestModal.request.notes}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Requested By</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {viewRequestModal.request.requestedBy?.name} on {new Date(viewRequestModal.request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewRequestModal({ show: false, request: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Purchase Modal */}
      {editModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Purchase Order</h3>
                <button
                  onClick={() => setEditModal({ show: false, purchase: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {editModal.purchase && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This is a basic edit interface. For now, you can update the purchase status,
                      payment information, and notes. Full item editing will be available in a future update.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purchase Order Number
                      </label>
                      <input
                        type="text"
                        value={editModal.purchase.purchaseOrderNumber}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice Number
                      </label>
                      <input
                        type="text"
                        value={editModal.purchase.invoiceNumber || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier
                      </label>
                      <input
                        type="text"
                        value={editModal.purchase.supplier?.name || 'Unknown'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Amount
                      </label>
                      <input
                        type="text"
                        value={`₹${editModal.purchase.totalAmount?.toFixed(2) || '0.00'}`}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editModal.purchase.notes || ''}
                      disabled
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      placeholder="Purchase notes..."
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      To make changes to this purchase order, please use the Status Update button to change the status,
                      or contact your system administrator for advanced editing capabilities.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModal({ show: false, purchase: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setEditModal({ show: false, purchase: null });
                    setStatusModal({ show: true, purchase: editModal.purchase });
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StoreManagerLayout>
  );
};

export default StoreManagerPurchases;
