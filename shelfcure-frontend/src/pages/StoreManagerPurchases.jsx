import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Upload,
  Search,
  Filter,
  Eye,
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
  RefreshCw,
  DollarSign,
  Clock,
  History
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import AddMedicineRequestForm from '../components/store-manager/AddMedicineRequestForm';
import { createNumericInputHandler, createPhoneInputHandler, VALIDATION_OPTIONS } from '../utils/inputValidation';

const StoreManagerPurchases = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  const [activeTab, setActiveTab] = useState('list'); // 'list', 'new', 'ocr', 'reorder', 'requests'
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
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
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [bulkConverting, setBulkConverting] = useState(false);

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
  const [paymentModal, setPaymentModal] = useState({ show: false, purchase: null });
  const [paymentHistoryModal, setPaymentHistoryModal] = useState({
    show: false,
    purchase: null,
    paymentHistory: [],
    paymentSummary: null,
    loading: false
  });
  const [deliveryModal, setDeliveryModal] = useState({ show: false, deliveries: [] });
  const [statusModal, setStatusModal] = useState({ show: false, purchase: null });
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Medicine Request Modal
  const [viewRequestModal, setViewRequestModal] = useState({ show: false, request: null });
  const [convertingRequest, setConvertingRequest] = useState(null);
  const [addRequestModal, setAddRequestModal] = useState({ show: false });

  // OCR State
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResults, setOcrResults] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);

  // PO Number Validation State
  const [poNumberValidation, setPoNumberValidation] = useState({
    checking: false,
    isDuplicate: false,
    message: ''
  });

  // New Purchase State
  const [newPurchase, setNewPurchase] = useState({
    supplier: '',
    purchaseOrderNumber: '',
    invoiceNumber: '',
    paymentMethod: 'cash',
    expectedDeliveryDate: '',
    items: [],
    subtotal: 0,
    taxEnabled: false,
    taxPercentage: 0,
    taxAmount: 0,
    totalAmount: 0,
    notes: ''
  });

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    transactionId: '',
    checkNumber: '',
    notes: ''
  });

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'list') {
        fetchPurchases();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle other filters and tab changes immediately
  useEffect(() => {
    if (activeTab === 'list') {
      fetchPurchases();
      fetchSuppliers(); // Fetch suppliers for the filter dropdown
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
  }, [activeTab, currentPage, statusFilter, supplierFilter, paymentMethodFilter, dateFromFilter, dateToFilter]);

  // Auto-dismiss error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);

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

  // Handle preselected medicine from navigation state (from low stock page)
  useEffect(() => {
    if (location.state?.preselectedMedicine && location.state?.action === 'reorder') {
      const preselectedMedicine = location.state.preselectedMedicine;
      console.log('🎯 Handling preselected medicine from reorder:', preselectedMedicine);

      // Switch to the new purchase tab
      setActiveTab('new');

      // Calculate suggested quantity based on stock levels
      let suggestedQuantity = 5; // Default fallback

      if (preselectedMedicine.unitTypes?.hasStrips && preselectedMedicine.stripInfo) {
        const stripStock = preselectedMedicine.stripInfo.stock || 0;
        const stripReorderLevel = preselectedMedicine.stripInfo.reorderLevel || 10;
        const stripMinStock = preselectedMedicine.stripInfo.minStock || 5;

        // Calculate suggested quantity: enough to reach 2x reorder level
        suggestedQuantity = Math.max(
          (stripReorderLevel * 2) - stripStock,
          stripMinStock,
          5 // Minimum of 5
        );
      } else if (preselectedMedicine.unitTypes?.hasIndividual && preselectedMedicine.individualInfo) {
        const individualStock = preselectedMedicine.individualInfo.stock || 0;
        const individualReorderLevel = preselectedMedicine.individualInfo.reorderLevel || 100;
        const individualMinStock = preselectedMedicine.individualInfo.minStock || 50;

        // Calculate suggested quantity: enough to reach 2x reorder level
        suggestedQuantity = Math.max(
          (individualReorderLevel * 2) - individualStock,
          individualMinStock,
          50 // Minimum of 50 for individual units
        );
      }

      // Pre-populate the purchase form with the selected medicine
      setNewPurchase(prev => ({
        ...prev,
        supplier: preselectedMedicine.supplier || '',
        purchaseOrderNumber: `PO-${Date.now()}`,
        items: [{
          medicine: preselectedMedicine._id,
          medicineName: preselectedMedicine.name,
          manufacturer: preselectedMedicine.manufacturer,
          genericName: preselectedMedicine.genericName,
          unitType: preselectedMedicine.unitTypes?.hasStrips ? 'strip' : 'individual',
          quantity: suggestedQuantity,
          unitPrice: preselectedMedicine.unitTypes?.hasStrips
            ? (preselectedMedicine.stripInfo?.purchasePrice || 0)
            : (preselectedMedicine.individualInfo?.purchasePrice || 0),
          totalCost: suggestedQuantity * (preselectedMedicine.unitTypes?.hasStrips
            ? (preselectedMedicine.stripInfo?.purchasePrice || 0)
            : (preselectedMedicine.individualInfo?.purchasePrice || 0)),
          discount: 0,
          discountAmount: 0,
          isFromReorder: true,
          reorderSource: 'low_stock_reorder'
        }]
      }));

      // Initialize medicine search state for the preselected item
      setMedicineSearchStates({
        0: {
          search: preselectedMedicine.name,
          results: [preselectedMedicine],
          showDropdown: false,
          selectedMedicine: preselectedMedicine
        }
      });

      // Clear the navigation state to prevent re-processing
      navigate(location.pathname, { replace: true, state: {} });

      console.log(`✅ Pre-populated purchase form with ${preselectedMedicine.name}, quantity: ${suggestedQuantity}`);
    }
  }, [location.state, navigate, location.pathname]);

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
            suggestedQuantity: medicine.requestedQuantity || 5, // Use requested quantity from medicine request
            priority: medicine.priority || 'high', // Use original priority or default to high
            reason: 'Customer Request',
            supplier: null, // Will need to be selected
            lastOrderDate: null,
            averageConsumption: 0,
            isCustomerRequested: true,
            customerRequestSource: parsedData.source || 'customer_request',
            requestDate: new Date().toISOString()
          }));

          console.log('🎯 Customer requested items created:', customerRequestedItems);
          console.log('🔍 Priority check - Original medicine priorities:', parsedData.medicines.map(m => ({ name: m.name, priority: m.priority })));

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
        ...(statusFilter && { status: statusFilter }),
        ...(supplierFilter && { supplier: supplierFilter }),
        ...(paymentMethodFilter && { paymentMethod: paymentMethodFilter }),
        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter })
      });

      console.log('🔍 Fetching purchases with filters:', {
        supplierFilter,
        paymentMethodFilter,
        statusFilter,
        searchTerm,
        dateFromFilter,
        dateToFilter
      });
      console.log('🔍 API Params:', Object.fromEntries(params));

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
        console.log('📦 Fetched suppliers:', data.data?.length || 0);
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
      // Only fetch pending requests by default (exclude ordered/converted requests)
      const response = await fetch('/api/store-manager/medicine-requests?status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedicineRequests(data.data || []);
        // Clear selected requests when refreshing the list
        setSelectedRequests([]);
      } else {
        console.error('Failed to fetch medicine requests');
      }
    } catch (error) {
      console.error('Error fetching medicine requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Handle individual request selection
  const handleRequestSelection = (requestId, isSelected) => {
    if (isSelected) {
      setSelectedRequests(prev => [...prev, requestId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    }
  };

  // Handle select all / deselect all
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const pendingRequestIds = medicineRequests
        .filter(request => request.status === 'pending')
        .map(request => request._id);
      setSelectedRequests(pendingRequestIds);
    } else {
      setSelectedRequests([]);
    }
  };

  // Bulk convert selected requests to purchase orders
  const handleBulkConvertToPurchase = async () => {
    if (selectedRequests.length === 0) {
      alert('Please select at least one medicine request to convert.');
      return;
    }

    try {
      setBulkConverting(true);
      const token = localStorage.getItem('token');
      const selectedRequestsData = medicineRequests.filter(request =>
        selectedRequests.includes(request._id)
      );

      console.log('🔄 Bulk converting medicine requests:', selectedRequestsData);

      // Update all selected requests to 'ordered' status
      const updatePromises = selectedRequestsData.map(request =>
        fetch(`/api/store-manager/medicine-requests/${request._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            medicineName: request.medicineName,
            manufacturer: request.manufacturer,
            composition: request.composition,
            strength: request.strength,
            packSize: request.packSize,
            requestedQuantity: request.requestedQuantity,
            unitType: request.unitType,
            priority: request.priority,
            category: request.category,
            notes: request.notes || '',
            supplierInfo: request.supplierInfo || {},
            status: 'ordered'
          })
        })
      );

      const updateResults = await Promise.all(updatePromises);

      // Check if all updates were successful
      const failedUpdates = updateResults.filter(response => !response.ok);
      if (failedUpdates.length > 0) {
        throw new Error(`Failed to update ${failedUpdates.length} medicine request(s)`);
      }

      // Convert to reorder data
      const requestData = {
        medicines: selectedRequestsData.map(request => ({
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
        })),
        source: 'medicine_request_bulk'
      };

      localStorage.setItem('reorderData', JSON.stringify(requestData));

      // Refresh medicine requests list
      await fetchMedicineRequests();

      // Switch to reorder tab
      setActiveTab('reorder');

      // Show success message
      alert(`✅ Successfully converted ${selectedRequests.length} medicine request(s) to purchase orders and moved to Reorder Items!`);

    } catch (error) {
      console.error('Error bulk converting medicine requests:', error);
      alert(`Failed to convert medicine requests: ${error.message}`);
    } finally {
      setBulkConverting(false);
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

  // Validate PO Number for duplicates
  const validatePONumber = async (poNumber, supplierId) => {
    if (!poNumber || !poNumber.trim() || !supplierId) {
      setPoNumberValidation({ checking: false, isDuplicate: false, message: '' });
      return;
    }

    try {
      setPoNumberValidation({ checking: true, isDuplicate: false, message: '' });
      const token = localStorage.getItem('token');

      const response = await fetch(
        `/api/store-manager/purchases/validate-po-number?supplier=${supplierId}&purchaseOrderNumber=${encodeURIComponent(poNumber.trim())}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.isDuplicate) {
          // Duplicate found
          setPoNumberValidation({
            checking: false,
            isDuplicate: true,
            message: data.message || 'This Purchase Order Number already exists for this supplier. Please use a different number.'
          });
        } else {
          // No duplicate
          setPoNumberValidation({
            checking: false,
            isDuplicate: false,
            message: ''
          });
        }
      } else {
        // On error, clear validation (don't block user)
        setPoNumberValidation({ checking: false, isDuplicate: false, message: '' });
      }
    } catch (error) {
      console.error('Error validating PO number:', error);
      // On error, clear validation (don't block user)
      setPoNumberValidation({ checking: false, isDuplicate: false, message: '' });
    }
  };

  const handleCreatePurchase = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Validate required fields
      if (!newPurchase.supplier || !newPurchase.supplier.trim()) {
        throw new Error('Supplier is required');
      }
      if (!newPurchase.purchaseOrderNumber.trim()) {
        throw new Error('Purchase order number is required');
      }
      if (!newPurchase.items || newPurchase.items.length === 0) {
        throw new Error('At least one item is required');
      }

      // Check for duplicate PO number
      if (poNumberValidation.isDuplicate) {
        throw new Error(poNumberValidation.message);
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
        supplier: newPurchase.supplier, // Supplier is now required
        purchaseOrderNumber: newPurchase.purchaseOrderNumber.trim(),
        invoiceNumber: newPurchase.invoiceNumber?.trim() || '',
        paymentMethod: newPurchase.paymentMethod || 'cash',
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

      // Reset PO validation state
      setPoNumberValidation({ checking: false, isDuplicate: false, message: '' });

      // Switch back to list tab
      setActiveTab('list');

      // Refresh purchases list
      fetchPurchases();

      // Remove the ordered items from reorder suggestions
      // Since stock levels won't be updated until PO is received, we manually remove ordered items
      const orderedMedicineIds = newPurchase.items.map(item => {
        // For customer requested items, use the generated ID
        if (item.isFromReorder && item.medicine && item.medicine.startsWith('customer_')) {
          return item.medicine;
        }
        // For regular medicines, use the medicine ID
        return item.medicine;
      }).filter(Boolean);

      console.log('🗑️ Removing ordered medicines from reorder suggestions:', orderedMedicineIds);

      setReorderSuggestions(prev => {
        const filtered = prev.filter(suggestion => {
          const suggestionId = suggestion.isCustomerRequested
            ? suggestion._id
            : suggestion.medicine;

          const shouldRemove = orderedMedicineIds.includes(suggestionId);
          if (shouldRemove) {
            console.log(`🗑️ Removing ${suggestion.medicineName || suggestion.medicine?.name} from reorder suggestions`);
          }
          return !shouldRemove;
        });

        console.log(`📊 Reorder suggestions: ${prev.length} → ${filtered.length} (removed ${prev.length - filtered.length} items)`);
        return filtered;
      });

      // Clear selected reorder items since they've been converted to a PO
      setSelectedReorderItems([]);

      // Clear any reorder data from localStorage since items have been processed
      localStorage.removeItem('reorderData');

      // Show success message
      const removedCount = orderedMedicineIds.length;
      alert(`✅ Purchase Order created successfully!\n\n${removedCount} medicine${removedCount > 1 ? 's' : ''} removed from Reorder Items.`);
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





  const handlePaySupplier = (purchase) => {
    console.log('Paying supplier for purchase:', purchase._id);
    const outstandingAmount = purchase.balanceAmount || purchase.creditAmount || 0;
    setPaymentForm({
      amount: outstandingAmount.toString(),
      paymentMethod: 'cash',
      transactionId: '',
      checkNumber: '',
      notes: ''
    });
    setPaymentModal({ show: true, purchase });
  };

  // Handle viewing payment history
  const handleViewPaymentHistory = async (purchase) => {
    setPaymentHistoryModal({
      show: true,
      purchase,
      paymentHistory: [],
      paymentSummary: null,
      loading: true
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/purchases/${purchase._id}/payment-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      setPaymentHistoryModal(prev => ({
        ...prev,
        paymentHistory: data.data.paymentHistory || [],
        paymentSummary: data.data.paymentSummary || null,
        loading: false
      }));

    } catch (error) {
      console.error('Error fetching payment history:', error);
      setError('Failed to load payment history');
      setPaymentHistoryModal(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    // Validate payment amount
    const paymentAmount = parseFloat(paymentForm.amount);
    const outstandingAmount = paymentModal.purchase.balanceAmount || paymentModal.purchase.creditAmount || 0;

    if (paymentAmount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (paymentAmount > outstandingAmount) {
      setError(`Payment amount (₹${paymentAmount.toLocaleString()}) cannot exceed outstanding balance (₹${outstandingAmount.toLocaleString()})`);
      return;
    }

    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/purchases/${paymentModal.purchase._id}/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          transactionId: paymentForm.transactionId,
          checkNumber: paymentForm.checkNumber,
          notes: paymentForm.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record payment');
      }

      const responseData = await response.json();

      // Close modal and refresh list
      setPaymentModal({ show: false, purchase: null });
      setPaymentForm({
        amount: '',
        paymentMethod: 'cash',
        transactionId: '',
        checkNumber: '',
        notes: ''
      });
      fetchPurchases();

      // Show success message with details
      const { paymentAmount, newBalance, paymentStatus } = responseData.data;
      alert(`✅ Payment recorded successfully!\n\nPayment: ₹${paymentAmount.toLocaleString()}\nRemaining Balance: ₹${newBalance.toLocaleString()}\nStatus: ${paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}`);
      console.log('Payment recorded successfully:', responseData);
    } catch (error) {
      console.error('Record payment error:', error);
      setError(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/store-manager/purchases/deliveries', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch delivery information');
      }

      const data = await response.json();
      setDeliveryModal({ show: true, deliveries: data.data || [] });

    } catch (error) {
      console.error('Track deliveries error:', error);
      setError(error.message || 'Failed to fetch delivery information');
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

      console.log('Updating purchase status:', {
        purchaseId: statusModal.purchase._id,
        currentStatus: statusModal.purchase.status,
        newStatus: newStatus
      });

      const response = await fetch(`/api/store-manager/purchases/${statusModal.purchase._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `Failed to update purchase status (${response.status})`);
      }

      const responseData = await response.json();
      console.log('Success response:', responseData);

      // Close modal and refresh list
      setStatusModal({ show: false, purchase: null });
      fetchPurchases();

      // Show success message
      console.log('Purchase status updated successfully to:', newStatus);
    } catch (error) {
      console.error('Update status error:', error);
      setError(error.message || 'Failed to update purchase status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'ordered': { color: 'bg-blue-100 text-blue-800', label: 'Ordered' },
      'confirmed': { color: 'bg-indigo-100 text-indigo-800', label: 'Confirmed' },
      'shipped': { color: 'bg-purple-100 text-purple-800', label: 'Shipped' },
      'received': { color: 'bg-green-100 text-green-800', label: 'Received' },
      'completed': { color: 'bg-emerald-100 text-emerald-800', label: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'partial': { color: 'bg-orange-100 text-orange-800', label: 'Partial' }
    };

    const config = statusConfig[status] || statusConfig['draft'];
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
          <button
            onClick={handleTrackDeliveries}
            disabled={loading}
            className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {loading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
              Loading...
            </div>
          )}
        </div>

        {/* Main Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
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

          {/* Status Filter */}
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
              <option value="draft">Draft</option>
              <option value="ordered">Ordered</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="received">Received</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setSupplierFilter('');
                setPaymentMethodFilter('');
                setDateFromFilter('');
                setDateToFilter('');
                setCurrentPage(1); // Reset to first page when clearing filters
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Supplier and Payment Method Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Supplier Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Supplier</label>
            <select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filtering
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filtering
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="credit">Credit</option>
            </select>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Date Range Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Inputs */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => {
                    setDateFromFilter(e.target.value);
                    // If to date is set and is earlier than from date, clear it
                    if (dateToFilter && e.target.value && new Date(e.target.value) > new Date(dateToFilter)) {
                      setDateToFilter('');
                    }
                    setCurrentPage(1); // Reset to first page when filtering
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateToFilter}
                  min={dateFromFilter || undefined} // Set minimum date to from date
                  onChange={(e) => {
                    setDateToFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page when filtering
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
                {dateFromFilter && dateToFilter && new Date(dateFromFilter) > new Date(dateToFilter) && (
                  <p className="text-xs text-red-600 mt-1">To date must be after from date</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Date Range Presets */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Quick Select
              {(dateFromFilter || dateToFilter) && (
                <span className="ml-2 text-green-600 text-xs">• Active</span>
              )}
            </label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => {
                  const today = new Date();
                  const todayStr = today.toISOString().split('T')[0];
                  setDateFromFilter(todayStr);
                  setDateToFilter(todayStr);
                  setCurrentPage(1);
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  setDateFromFilter(weekAgo.toISOString().split('T')[0]);
                  setDateToFilter(today.toISOString().split('T')[0]);
                  setCurrentPage(1);
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                7 days
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                  setDateFromFilter(monthAgo.toISOString().split('T')[0]);
                  setDateToFilter(today.toISOString().split('T')[0]);
                  setCurrentPage(1);
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                30 days
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {purchases.length} of {totalCount} purchases
              {(searchTerm || statusFilter || dateFromFilter || dateToFilter) && (
                <span className="ml-2 text-green-600">
                  (filtered
                  {dateFromFilter && dateToFilter && (
                    <span className="ml-1">
                      • {dateFromFilter} to {dateToFilter}
                    </span>
                  )}
                  {dateFromFilter && !dateToFilter && (
                    <span className="ml-1">
                      • from {dateFromFilter}
                    </span>
                  )}
                  {!dateFromFilter && dateToFilter && (
                    <span className="ml-1">
                      • until {dateToFilter}
                    </span>
                  )}
                  )
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>
      )}

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
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                      <span className="text-gray-500">Loading purchases...</span>
                    </div>
                  </td>
                </tr>
              ) : purchases.length > 0 ? (
                purchases.map((purchase) => (
                  <tr key={purchase._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 text-left">
                          {purchase.purchaseOrderNumber || 'N/A'}
                        </div>
                        {purchase.invoiceNumber && (
                          <div className="text-xs text-gray-400 text-left">
                            Invoice: {purchase.invoiceNumber}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 text-left">
                          {formatDate(purchase.purchaseDate)}
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
                      <div className="text-sm text-gray-900 text-left capitalize">
                        {purchase.paymentMethod || 'Cash'}
                      </div>
                      {/* Payment Status Information */}
                      {purchase.paymentStatus && purchase.paymentStatus !== 'pending' && (
                        <div className="text-xs text-left mt-1">
                          {purchase.paymentStatus === 'paid' && (
                            <span className="text-green-600 font-medium">
                              ✓ Fully Paid (₹{(purchase.paidAmount || 0).toLocaleString()})
                            </span>
                          )}
                          {purchase.paymentStatus === 'partial' && (
                            <span className="text-yellow-600 font-medium">
                              ⚠ Partial: ₹{(purchase.paidAmount || 0).toLocaleString()} of ₹{(purchase.totalAmount || 0).toLocaleString()}
                            </span>
                          )}
                          {purchase.paymentStatus === 'overdue' && (
                            <span className="text-red-600 font-medium">
                              ⚠ Overdue: ₹{((purchase.balanceAmount || purchase.creditAmount) || 0).toLocaleString()} due
                            </span>
                          )}
                        </div>
                      )}
                      {purchase.paymentMethod === 'credit' && purchase.creditAmount > 0 && (
                        <div className="text-xs text-red-600 text-left">
                          Credit: ₹{purchase.creditAmount?.toLocaleString() || 0}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(purchase.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {purchase.expectedDeliveryDate ? (
                        <div className="text-sm text-gray-900 text-left">
                          {formatDate(purchase.expectedDeliveryDate)}
                          {(() => {
                            if (!purchase.expectedDeliveryDate) return null;
                            const expectedDate = new Date(purchase.expectedDeliveryDate);
                            if (isNaN(expectedDate.getTime())) return null;
                            const today = new Date();
                            const daysRemaining = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
                            const isOverdue = daysRemaining < 0 && purchase.status !== 'received';

                            if (purchase.status === 'received') {
                              return <div className="text-xs text-green-600">Delivered</div>;
                            } else if (isOverdue) {
                              return <div className="text-xs text-red-600">{Math.abs(daysRemaining)} days overdue</div>;
                            } else if (daysRemaining === 0) {
                              return <div className="text-xs text-yellow-600">Due today</div>;
                            } else if (daysRemaining <= 2) {
                              return <div className="text-xs text-yellow-600">{daysRemaining} days left</div>;
                            } else {
                              return <div className="text-xs text-gray-500">{daysRemaining} days left</div>;
                            }
                          })()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not set</span>
                      )}
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
                          onClick={() => handleUpdateStatus(purchase)}
                          disabled={loading}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Update Status"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        {(purchase.paymentStatus === 'pending' || purchase.paymentStatus === 'partial' || purchase.paymentStatus === 'overdue') &&
                         (purchase.balanceAmount > 0 || purchase.creditAmount > 0) && (
                          <button
                            onClick={() => handlePaySupplier(purchase)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Pay Supplier"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        )}
                        {/* Payment History Button - Show for purchases with any payment activity */}
                        {(purchase.paymentStatus === 'partial' || purchase.paymentStatus === 'paid' ||
                          (purchase.paymentHistory && purchase.paymentHistory.length > 0) ||
                          (purchase.paidAmount && purchase.paidAmount > 0)) && (
                          <button
                            onClick={() => handleViewPaymentHistory(purchase)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View Payment History"
                          >
                            <History className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">No purchases found</div>
                      {(searchTerm || statusFilter || dateFromFilter || dateToFilter) ? (
                        <div className="text-sm">
                          Try adjusting your search criteria or{' '}
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('');
                              setDateFromFilter('');
                              setDateToFilter('');
                              setCurrentPage(1);
                            }}
                            className="text-green-600 hover:text-green-700 underline"
                          >
                            clear all filters
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm">
                          No purchase orders have been created yet.{' '}
                          <button
                            onClick={() => setActiveTab('new')}
                            className="text-green-600 hover:text-green-700 underline"
                          >
                            Create your first purchase order
                          </button>
                        </div>
                      )}
                    </div>
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
              Supplier *
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
                placeholder="Search and select a supplier..."
                required
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
              <p className="mt-1 text-sm text-red-600">
                Please select a supplier to continue
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Purchase Order Number *
            </label>
            <div className="relative">
              <input
                type="text"
                value={newPurchase.purchaseOrderNumber || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewPurchase(prev => ({ ...prev, purchaseOrderNumber: value }));
                  // Validate PO number when it changes
                  if (value.trim() && newPurchase.supplier) {
                    validatePONumber(value, newPurchase.supplier);
                  } else {
                    setPoNumberValidation({ checking: false, isDuplicate: false, message: '' });
                  }
                }}
                onBlur={() => {
                  // Validate on blur as well
                  if (newPurchase.purchaseOrderNumber.trim() && newPurchase.supplier) {
                    validatePONumber(newPurchase.purchaseOrderNumber, newPurchase.supplier);
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                  poNumberValidation.isDuplicate ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="PO-001"
                required
              />
              {poNumberValidation.checking && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            {poNumberValidation.isDuplicate && (
              <p className="mt-1 text-sm text-red-600 text-left">
                {poNumberValidation.message}
              </p>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              Payment Method *
            </label>
            <select
              value={newPurchase.paymentMethod || 'cash'}
              onChange={(e) => setNewPurchase(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="credit">Credit</option>
            </select>
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
                      {(item.isFromReorder && item.medicineDetails) || item.medicineName ? (
                        <div className={`w-full px-3 py-2 border rounded-md ${
                          item.isFromReorder ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'
                        }`}>
                          <div className="font-medium text-gray-900">
                            {item.medicineDetails?.name || item.medicineName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.medicineDetails?.manufacturer || item.manufacturer}
                            {(item.medicineDetails?.genericName || item.genericName) &&
                              ` | ${item.medicineDetails?.genericName || item.genericName}`
                            }
                          </div>
                          {item.isFromReorder && (
                            <div className="text-xs text-orange-600 mt-1">
                              Customer requested - Not in current inventory
                            </div>
                          )}
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
                        onChange={createNumericInputHandler(
                          (value) => updatePurchaseItem(index, 'quantity', value),
                          null,
                          { ...VALIDATION_OPTIONS.QUANTITY, min: 1 }
                        )}
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
                        onChange={createNumericInputHandler(
                          (value) => updatePurchaseItem(index, 'unitPrice', value),
                          null,
                          VALIDATION_OPTIONS.PRICE
                        )}
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
            disabled={
              !newPurchase.supplier ||
              !newPurchase.purchaseOrderNumber ||
              newPurchase.items.length === 0 ||
              poNumberValidation.isDuplicate ||
              poNumberValidation.checking
            }
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
    // Use the same key generation logic as the checkboxes
    // This ensures consistency between checkbox checked state and toggle function
    const medicineId = suggestion._id || suggestion.medicine;
    const itemKey = `${medicineId}_${unitType}`;
    const isSelected = selectedReorderItems.some(item => item.key === itemKey);

    console.log('🔧 Toggle Debug:', {
      medicineId,
      unitType,
      itemKey,
      isSelected,
      isCustomerRequested: suggestion.isCustomerRequested,
      suggestionMedicine: suggestion.medicine
    });

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
    console.log('🛒 Creating PO from selected items:', selectedReorderItems);

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
    console.log('🏗️ Creating single PO with supplier group:', supplierGroup);

    // Pre-populate the new purchase form
    setNewPurchase({
      supplier: supplierGroup.supplier?._id || '',
      purchaseOrderNumber: `PO-${Date.now()}`,
      invoiceNumber: '',
      paymentMethod: 'cash',
      expectedDeliveryDate: '',
      items: supplierGroup.items.map((item, index) => {
        console.log(`🔧 Processing item ${index}:`, item);

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
          console.log(`📦 Creating regular reorder item:`, {
            medicine: item.medicine,
            medicineName: item.medicineName,
            manufacturer: item.manufacturer
          });

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

    // Set supplier selection states if supplier is available
    if (supplierGroup.supplier) {
      setSelectedPurchaseSupplier(supplierGroup.supplier);
      setPurchaseSupplierSearch(supplierGroup.supplier.name);
    } else {
      // Reset supplier selection states if no supplier
      setSelectedPurchaseSupplier(null);
      setPurchaseSupplierSearch('');
    }

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
      // Generate CSV content from current reorderSuggestions state with UTF-8 BOM
      let csvContent = '\uFEFF'; // UTF-8 BOM for proper encoding
      csvContent += 'Medicine Name,Manufacturer,Unit Type,Current Stock,Reorder Level,Suggested Qty,Unit Cost,Total Cost,Supplier,Type\n';

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

          csvContent += `"${medicineName}","${manufacturer}",Strip,${suggestion.stripSuggestion.currentStock},${suggestion.stripSuggestion.reorderLevel},${effectiveQuantity},"₹${suggestion.stripSuggestion.unitCost}","₹${totalCost.toFixed(2)}","${supplier}",Regular\n`;
        }
        if (suggestion.individualSuggestion) {
          const effectiveQuantity = getEffectiveQuantity(suggestion.medicine, 'individual', suggestion.individualSuggestion.suggestedQuantity);
          const totalCost = effectiveQuantity * suggestion.individualSuggestion.unitCost;
          const medicineName = suggestion.medicineName.replace(/,/g, ';');
          const manufacturer = suggestion.manufacturer.replace(/,/g, ';');
          const supplier = suggestion.supplier?.name ? suggestion.supplier.name.replace(/,/g, ';') : 'No Supplier';

          csvContent += `"${medicineName}","${manufacturer}",Individual,${suggestion.individualSuggestion.currentStock},${suggestion.individualSuggestion.reorderLevel},${effectiveQuantity},"₹${suggestion.individualSuggestion.unitCost}","₹${totalCost.toFixed(2)}","${supplier}",Regular\n`;
        }
      });

      // Create and download the CSV file with proper UTF-8 encoding
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

    // Validate PO number when supplier changes
    if (newPurchase.purchaseOrderNumber && newPurchase.purchaseOrderNumber.trim()) {
      validatePONumber(newPurchase.purchaseOrderNumber, supplier._id);
    }
  };

  const resetPurchaseSupplierSelection = () => {
    setSelectedPurchaseSupplier(null);
    setPurchaseSupplierSearch('');
    setPurchaseSupplierResults([]);
    setShowPurchaseSupplierDropdown(false);
    setNewPurchase(prev => ({ ...prev, supplier: '' }));

    // Clear PO validation when supplier is cleared
    setPoNumberValidation({ checking: false, isDuplicate: false, message: '' });
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
          reorderMessage += `   • Priority: ${(item.priority || 'HIGH').toUpperCase()} (Customer waiting)\n`;
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
                        <p className={`font-semibold ${
                          suggestion.priority === 'urgent' ? 'text-red-600' :
                          suggestion.priority === 'high' ? 'text-orange-600' :
                          suggestion.priority === 'medium' ? 'text-blue-600' :
                          'text-gray-600'
                        }`}>
                          {suggestion.priority ? suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1) : 'High'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Quantity to Order</p>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={getEffectiveQuantity(suggestion._id || suggestion.medicine, 'strip', suggestion.suggestedQuantity || 5)}
                            onChange={createNumericInputHandler(
                              (value) => handleQuantityChange(suggestion._id || suggestion.medicine, 'strip', value),
                              null,
                              { ...VALIDATION_OPTIONS.QUANTITY, min: 1 }
                            )}
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
                                checked={selectedReorderItems.some(item => item.key === `${suggestion._id || suggestion.medicine}_strip`)}
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
                                checked={selectedReorderItems.some(item => item.key === `${suggestion._id || suggestion.medicine}_individual`)}
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

  const renderMedicineRequestsTab = () => {
    const pendingRequests = medicineRequests.filter(request => request.status === 'pending');
    const selectedCount = selectedRequests.length;
    const allPendingSelected = pendingRequests.length > 0 && selectedCount === pendingRequests.length;
    const someSelected = selectedCount > 0 && selectedCount < pendingRequests.length;

    return (
      <div>
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900 text-left">Medicine Requests</h1>
            <p className="mt-2 text-sm text-gray-700 text-left">
              New medicine requests from store managers that need to be ordered
            </p>
            {selectedCount > 0 && (
              <p className="mt-1 text-sm text-green-600 font-medium">
                {selectedCount} request{selectedCount > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
            {selectedCount > 0 && (
              <button
                onClick={handleBulkConvertToPurchase}
                disabled={bulkConverting}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  bulkConverting
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {bulkConverting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Converting {selectedCount}...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Convert {selectedCount} to Purchase
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setAddRequestModal({ show: true })}
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
                onClick={() => setAddRequestModal({ show: true })}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Request
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {/* Select All Header */}
            {pendingRequests.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    ref={checkbox => {
                      if (checkbox) checkbox.indeterminate = someSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">
                    {allPendingSelected ? 'Deselect All' : someSelected ? 'Select All' : 'Select All'}
                    {pendingRequests.length > 0 && (
                      <span className="text-gray-500 ml-1">
                        ({pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </label>
                </div>
              </div>
            )}

            <ul className="divide-y divide-gray-200">
              {medicineRequests.map((request) => (
                <li key={request._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      {/* Checkbox for pending requests */}
                      {request.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(request._id)}
                          onChange={(e) => handleRequestSelection(request._id, e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-4"
                        />
                      )}

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
                      Requested by {request.requestedBy?.name} on {formatDate(request.createdAt)}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    {request.status === 'pending' && (
                      <button
                        onClick={async () => {
                          try {
                            setConvertingRequest(request._id);
                            console.log('🔄 Converting medicine request:', request);
                            // First, update the medicine request status to 'ordered'
                            const token = localStorage.getItem('token');
                            const updateResponse = await fetch(`/api/store-manager/medicine-requests/${request._id}`, {
                              method: 'PUT',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                // Send all required fields to satisfy validation
                                medicineName: request.medicineName,
                                manufacturer: request.manufacturer,
                                composition: request.composition,
                                strength: request.strength || 'Not specified',
                                packSize: request.packSize || 'Not specified',
                                requestedQuantity: request.requestedQuantity,
                                unitType: request.unitType,
                                priority: request.priority,
                                category: request.category,
                                notes: request.notes || '',
                                supplierInfo: request.supplierInfo || {},
                                status: 'ordered' // This is what we actually want to change
                              })
                            });

                            if (!updateResponse.ok) {
                              const errorData = await updateResponse.json();
                              console.error('Update status error:', errorData);
                              throw new Error(`Failed to update medicine request status: ${errorData.message || updateResponse.statusText}`);
                            }

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

                            // Refresh medicine requests list to remove the converted request
                            await fetchMedicineRequests();

                            // Switch to reorder tab
                            setActiveTab('reorder');

                            // Show success message
                            alert(`✅ Medicine request for "${request.medicineName}" has been converted to purchase order and moved to Reorder Items!`);
                          } catch (error) {
                            console.error('Error converting medicine request:', error);
                            alert('Failed to convert medicine request. Please try again.');
                          } finally {
                            setConvertingRequest(null);
                          }
                        }}
                        disabled={convertingRequest === request._id}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white ${
                          convertingRequest === request._id
                            ? 'bg-green-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {convertingRequest === request._id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Converting...
                          </>
                        ) : (
                          'Convert to Purchase'
                        )}
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
                </div>
              </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

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
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center flex-1">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  <div className="text-red-800 text-left">{error}</div>
                </div>
                <button
                  onClick={() => setError('')}
                  className="ml-4 text-red-400 hover:text-red-600 flex-shrink-0"
                  title="Dismiss"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
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
                    onChange={createPhoneInputHandler(setPhoneNumber)}
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
                        {formatDate(viewModal.purchase.purchaseDate)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Expected Delivery</h4>
                      <p className="text-sm text-gray-900">
                        {formatDate(viewModal.purchase.expectedDeliveryDate)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Payment Method</h4>
                      <p className="text-sm text-gray-900 capitalize">
                        {viewModal.purchase.paymentMethod || 'Cash'}
                      </p>
                      {viewModal.purchase.paymentMethod === 'credit' && viewModal.purchase.creditAmount > 0 && (
                        <p className="text-xs text-red-600">
                          Credit Amount: ₹{viewModal.purchase.creditAmount?.toLocaleString() || 0}
                        </p>
                      )}
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
                        {viewRequestModal.request.requestedBy?.name} on {formatDate(viewRequestModal.request.createdAt)}
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



      {/* Payment Modal */}
      {paymentModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Pay Supplier</h3>
                <button
                  onClick={() => setPaymentModal({ show: false, purchase: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {paymentModal.purchase && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Supplier: <span className="font-medium">{paymentModal.purchase.supplier?.name}</span></p>
                    <p className="text-sm text-gray-600">Purchase Order: <span className="font-medium">{paymentModal.purchase.purchaseOrderNumber}</span></p>
                    <p className="text-sm text-gray-600">Outstanding Amount: <span className="font-medium text-red-600">₹{(paymentModal.purchase.balanceAmount || paymentModal.purchase.creditAmount || 0).toLocaleString()}</span></p>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Payment Amount *
                        </label>
                        <button
                          type="button"
                          onClick={() => setPaymentForm({
                            ...paymentForm,
                            amount: (paymentModal.purchase.balanceAmount || paymentModal.purchase.creditAmount || 0).toString()
                          })}
                          className="text-xs text-green-600 hover:text-green-800 underline"
                        >
                          Pay Full Amount
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={paymentModal.purchase.balanceAmount || paymentModal.purchase.creditAmount}
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter payment amount"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="check">Check</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {(paymentForm.paymentMethod === 'upi' || paymentForm.paymentMethod === 'bank_transfer') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transaction ID
                        </label>
                        <input
                          type="text"
                          value={paymentForm.transactionId}
                          onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter transaction ID"
                        />
                      </div>
                    )}

                    {paymentForm.paymentMethod === 'check' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Check Number
                        </label>
                        <input
                          type="text"
                          value={paymentForm.checkNumber}
                          onChange={(e) => setPaymentForm({ ...paymentForm, checkNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter check number"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows="3"
                        placeholder="Enter payment notes (optional)"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setPaymentModal({ show: false, purchase: null })}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !paymentForm.amount}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Recording...' : 'Record Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Tracking Modal */}
      {deliveryModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Delivery Tracking</h3>
                <button
                  onClick={() => setDeliveryModal({ show: false, deliveries: [] })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Delivery Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">Pending</p>
                        <p className="text-2xl font-semibold text-blue-900">
                          {deliveryModal.deliveries.filter(d => ['ordered', 'confirmed'].includes(d.status)).length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Truck className="h-8 w-8 text-yellow-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-600">Shipped</p>
                        <p className="text-2xl font-semibold text-yellow-900">
                          {deliveryModal.deliveries.filter(d => d.status === 'shipped').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">Delivered</p>
                        <p className="text-2xl font-semibold text-green-900">
                          {deliveryModal.deliveries.filter(d => d.status === 'received').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-600">Overdue</p>
                        <p className="text-2xl font-semibold text-red-900">
                          {deliveryModal.deliveries.filter(d => {
                            if (!d.expectedDeliveryDate || ['received'].includes(d.status)) return false;
                            const expectedDate = new Date(d.expectedDeliveryDate);
                            return !isNaN(expectedDate.getTime()) && expectedDate < new Date();
                          }).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery List */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purchase Order
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expected Delivery
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actual Delivery
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days Remaining
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {deliveryModal.deliveries.length > 0 ? (
                        deliveryModal.deliveries.map((delivery) => {
                          const expectedDate = delivery.expectedDeliveryDate ? new Date(delivery.expectedDeliveryDate) : null;
                          const isValidDate = expectedDate && !isNaN(expectedDate.getTime());
                          const today = new Date();
                          const daysRemaining = isValidDate ? Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24)) : null;
                          const isOverdue = isValidDate && daysRemaining !== null && daysRemaining < 0 && delivery.status !== 'received';

                          return (
                            <tr key={delivery._id} className={isOverdue ? 'bg-red-50' : ''}>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {delivery.purchaseOrderNumber}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {delivery.supplier?.name || 'Unknown'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  delivery.status === 'received' ? 'bg-green-100 text-green-800' :
                                  delivery.status === 'shipped' ? 'bg-yellow-100 text-yellow-800' :
                                  delivery.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                  delivery.status === 'ordered' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {delivery.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(delivery.expectedDeliveryDate)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(delivery.deliveryDate)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₹{delivery.totalAmount?.toLocaleString() || 0}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">
                                {daysRemaining !== null ? (
                                  <span className={`font-medium ${
                                    isOverdue ? 'text-red-600' :
                                    daysRemaining <= 2 ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    {isOverdue ? `${Math.abs(daysRemaining)} days overdue` :
                                     daysRemaining === 0 ? 'Due today' :
                                     `${daysRemaining} days`}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                            No deliveries to track
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setDeliveryModal({ show: false, deliveries: [] })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Request Modal */}
      {addRequestModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 text-left">Add New Medicine Request</h3>
                <button
                  onClick={() => setAddRequestModal({ show: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm text-left">{error}</span>
                </div>
              )}

              <AddMedicineRequestForm
                onSuccess={() => {
                  setAddRequestModal({ show: false });
                  fetchMedicineRequests(); // Refresh the requests list
                }}
                onError={(errorMessage) => setError(errorMessage)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {paymentHistoryModal.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
                <button
                  onClick={() => setPaymentHistoryModal({ show: false, purchase: null, paymentHistory: [], paymentSummary: null, loading: false })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {paymentHistoryModal.purchase && (
                <div className="space-y-6">
                  {/* Purchase Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Purchase Order</p>
                        <p className="font-medium">{paymentHistoryModal.purchase.purchaseOrderNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Supplier</p>
                        <p className="font-medium">{paymentHistoryModal.purchase.supplier?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="font-medium">₹{(paymentHistoryModal.purchase.totalAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  {paymentHistoryModal.paymentSummary && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Payment Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="font-medium text-lg">₹{paymentHistoryModal.paymentSummary.totalAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Paid Amount</p>
                          <p className="font-medium text-lg text-green-600">₹{paymentHistoryModal.paymentSummary.paidAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Balance Amount</p>
                          <p className={`font-medium text-lg ${paymentHistoryModal.paymentSummary.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{paymentHistoryModal.paymentSummary.balanceAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            paymentHistoryModal.paymentSummary.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : paymentHistoryModal.paymentSummary.paymentStatus === 'partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : paymentHistoryModal.paymentSummary.paymentStatus === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {paymentHistoryModal.paymentSummary.paymentStatus.charAt(0).toUpperCase() + paymentHistoryModal.paymentSummary.paymentStatus.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Payment Status Indicators */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {paymentHistoryModal.paymentSummary.isFullyPaid && (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Fully Paid on {new Date(paymentHistoryModal.paymentSummary.paymentDate).toLocaleDateString()}
                          </div>
                        )}
                        {paymentHistoryModal.paymentSummary.isOverdue && (
                          <div className="flex items-center text-red-600 text-sm">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Overdue (Due: {new Date(paymentHistoryModal.paymentSummary.dueDate).toLocaleDateString()})
                          </div>
                        )}
                        {paymentHistoryModal.paymentSummary.paymentStatus === 'partial' && (
                          <div className="flex items-center text-yellow-600 text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            Partially Paid ({paymentHistoryModal.paymentSummary.totalPayments} payment{paymentHistoryModal.paymentSummary.totalPayments !== 1 ? 's' : ''})
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment History */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Payment Timeline</h4>
                    {paymentHistoryModal.loading ? (
                      <div className="flex justify-center py-8">
                        <Loader className="h-6 w-6 animate-spin text-green-600" />
                      </div>
                    ) : paymentHistoryModal.paymentHistory.length > 0 ? (
                      <div className="space-y-4">
                        {paymentHistoryModal.paymentHistory.map((payment, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-2">
                                  <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                                    <span className="font-medium text-lg">₹{payment.amount.toLocaleString()}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {new Date(payment.paymentDate).toLocaleDateString()} at {new Date(payment.paymentDate).toLocaleTimeString()}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Payment Method:</span>
                                    <span className="ml-2 capitalize font-medium">{payment.paymentMethod.replace('_', ' ')}</span>
                                  </div>
                                  {payment.transactionId && (
                                    <div>
                                      <span className="text-gray-600">Transaction ID:</span>
                                      <span className="ml-2 font-mono text-xs">{payment.transactionId}</span>
                                    </div>
                                  )}
                                  {payment.checkNumber && (
                                    <div>
                                      <span className="text-gray-600">Check Number:</span>
                                      <span className="ml-2 font-mono text-xs">{payment.checkNumber}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-gray-600">Processed by:</span>
                                    <span className="ml-2">{payment.processedBy?.name || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Running Balance:</span>
                                    <span className="ml-2 font-medium">₹{payment.runningBalance.toLocaleString()}</span>
                                  </div>
                                </div>

                                {payment.notes && (
                                  <div className="mt-2 text-sm">
                                    <span className="text-gray-600">Notes:</span>
                                    <span className="ml-2 italic">{payment.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No payment history available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </StoreManagerLayout>
  );
};

export default StoreManagerPurchases;
