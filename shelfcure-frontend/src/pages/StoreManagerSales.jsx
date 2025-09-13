import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Minus,
  Trash2,
  Search,
  Receipt,
  User,
  UserPlus,
  Stethoscope,
  FileText,
  X,
  AlertCircle,
  ShoppingCart,
  MessageCircle,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import AddMedicineModal from '../components/store-manager/AddMedicineModal';

const StoreManagerSales = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' or 'history'
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [masterMedicines, setMasterMedicines] = useState([]);
  const [reorderList, setReorderList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Search states for customer and doctor
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [doctorSearchResults, setDoctorSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  // Refs for click-outside functionality
  const customerDropdownRef = useRef(null);
  const doctorDropdownRef = useRef(null);
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionFileError, setPrescriptionFileError] = useState('');
  const [discount, setDiscount] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState({}); // For quantity selection before adding to cart
  const [medicinesLoading, setMedicinesLoading] = useState(false);

  // Date filtering state for Sales History
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [isDateFilterApplied, setIsDateFilterApplied] = useState(false);

  // Pagination state for Sales History
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [itemsPerPage] = useState(20); // Fixed at 20 items per page

  // Quick entry modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: '',
    licenseNumber: ''
  });
  const [businessSettings, setBusinessSettings] = useState({
    allowDiscounts: true,
    maxDiscountPercent: 50,
    defaultGstRate: 18,
    gstEnabled: true,
    includeTaxInPrice: true
  });
  const [discountTypes, setDiscountTypes] = useState([]);
  const [taxTypes, setTaxTypes] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);

  // Tax selection states
  const [applyTax, setApplyTax] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);

  // Discount selection states
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);

  useEffect(() => {
    fetchBusinessSettings();
    fetchStoreInfo();
    if (activeTab === 'pos') {
      // Don't automatically load medicines - only load when user searches
      fetchCustomers();
      fetchDoctors();
    } else {
      // When switching to history tab, fetch sales with current date filters
      if (isDateFilterApplied && dateFilterFrom) {
        fetchSalesHistory(dateFilterFrom, dateFilterTo, currentPage);
      } else {
        fetchSalesHistory(null, null, currentPage);
      }
    }
  }, [activeTab]);

  // Handle prefilled cart from customer purchase history
  useEffect(() => {
    const prefilledCart = localStorage.getItem('prefilledCart');
    if (prefilledCart && activeTab === 'pos') {
      try {
        const cartData = JSON.parse(prefilledCart);

        // Set customer information
        if (cartData.customerId && cartData.customerName) {
          setSelectedCustomer({
            _id: cartData.customerId,
            name: cartData.customerName,
            phone: cartData.customerPhone
          });
        }

        // Set cart items
        if (cartData.items && cartData.items.length > 0) {
          const formattedItems = cartData.items.map(item => {
            const unitPrice = item.price || 0;
            return {
              medicine: {
                _id: item.medicineId,
                name: item.name
              },
              quantity: item.quantity,
              unitType: item.unit, // Map 'unit' to 'unitType' for consistency
              unitPrice: unitPrice, // Price per unit
              totalPrice: unitPrice * item.quantity, // Calculate total price
              discount: 0,
              tax: 0,
              unitData: item.unitData // Keep unit data for reference
            };
          });

          setCart(formattedItems);
        }

        // Clear the prefilled cart from localStorage
        localStorage.removeItem('prefilledCart');

        // Show success message
        alert(`Added ${cartData.items.length} items from ${cartData.customerName}'s purchase history to cart!`);

      } catch (error) {
        console.error('Error loading prefilled cart:', error);
        localStorage.removeItem('prefilledCart');
      }
    }
  }, [activeTab]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target)) {
        setShowDoctorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load medicines when user starts searching
  useEffect(() => {
    if (activeTab === 'pos' && searchTerm.trim().length > 0) {
      fetchMedicines();
      fetchMasterMedicines();
    } else if (activeTab === 'pos' && searchTerm.trim().length === 0) {
      // Clear results when search is empty
      setMedicines([]);
      setMasterMedicines([]);
    }
  }, [searchTerm, activeTab]);

  const fetchMedicines = async () => {
    try {
      setMedicinesLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedicines(data.data || []);
      } else {
        console.error('Failed to fetch medicines:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setMedicinesLoading(false);
    }
  };

  const fetchMasterMedicines = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        search: searchTerm,
        limit: 50 // Get more results for comprehensive search
      });

      const response = await fetch(`/api/store-manager/master-medicines?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMasterMedicines(data.data || []);
      } else {
        console.error('Failed to fetch master medicines:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching master medicines:', error);
    }
  };

  const addToReorderList = (medicine) => {
    // Check if medicine is already in reorder list
    const isAlreadyInList = reorderList.some(item => item._id === medicine._id);

    if (!isAlreadyInList) {
      setReorderList(prev => [...prev, {
        ...medicine,
        addedAt: new Date(),
        requestedBy: 'Store Manager'
      }]);

      // Show success message
      alert(`${medicine.name} has been added to your reorder list!`);
    } else {
      alert(`${medicine.name} is already in your reorder list.`);
    }
  };

  const removeFromReorderList = (medicineId) => {
    setReorderList(prev => prev.filter(item => item._id !== medicineId));
  };

  const isInInventory = (masterMedicine) => {
    return medicines.some(inventoryMedicine =>
      inventoryMedicine.name.toLowerCase() === masterMedicine.name.toLowerCase() &&
      inventoryMedicine.manufacturer?.toLowerCase() === masterMedicine.manufacturer?.toLowerCase()
    );
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/customers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  // Customer search functionality
  const searchCustomers = (searchTerm) => {
    if (!searchTerm.trim()) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );

    setCustomerSearchResults(filtered);
    setShowCustomerDropdown(true);
  };

  // Doctor search functionality
  const searchDoctors = (searchTerm) => {
    if (!searchTerm.trim()) {
      setDoctorSearchResults([]);
      setShowDoctorDropdown(false);
      return;
    }

    const filtered = doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.phone.includes(searchTerm)
    );

    setDoctorSearchResults(filtered);
    setShowDoctorDropdown(true);
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(`${customer.name} - ${customer.phone}`);
    setShowCustomerDropdown(false);
  };

  // Handle doctor selection
  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setDoctorSearchTerm(`Dr. ${doctor.name} - ${doctor.specialization}`);
    setShowDoctorDropdown(false);
  };

  // Handle customer search input change
  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);

    if (!value.trim()) {
      setSelectedCustomer(null);
    }

    searchCustomers(value);
  };

  // Handle doctor search input change
  const handleDoctorSearchChange = (e) => {
    const value = e.target.value;
    setDoctorSearchTerm(value);

    if (!value.trim()) {
      setSelectedDoctor(null);
    }

    searchDoctors(value);
  };

  // Invoice handling functions
  const viewInvoice = async (saleId) => {
    try {
      const token = localStorage.getItem('token');

      // Fetch the HTML invoice with authentication
      const response = await fetch(`/api/store-manager/sales/${saleId}/invoice?format=html`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const htmlContent = await response.text();

        // Create a new window and write the HTML content
        const invoiceWindow = window.open('', '_blank');
        if (invoiceWindow) {
          invoiceWindow.document.write(htmlContent);
          invoiceWindow.document.close();
        } else {
          alert('Please allow popups to view the invoice');
        }
      } else {
        const errorText = await response.text();
        console.error('Invoice fetch error:', errorText);
        alert('Failed to fetch invoice. Please try again.');
      }
    } catch (error) {
      console.error('Error viewing invoice:', error);
      alert('Error viewing invoice');
    }
  };

  const printInvoice = async (saleId) => {
    try {
      const token = localStorage.getItem('token');

      // Fetch the HTML invoice with authentication
      const response = await fetch(`/api/store-manager/sales/${saleId}/invoice?format=html`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const htmlContent = await response.text();

        // Create a new window and write the HTML content
        const invoiceWindow = window.open('', '_blank');
        if (invoiceWindow) {
          invoiceWindow.document.write(htmlContent);
          invoiceWindow.document.close();

          // Wait for content to load then print
          invoiceWindow.onload = () => {
            invoiceWindow.print();
          };
        } else {
          alert('Please allow popups to print the invoice');
        }
      } else {
        const errorText = await response.text();
        console.error('Invoice print error:', errorText);
        alert('Failed to fetch invoice for printing. Please try again.');
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Error printing invoice');
    }
  };

  const fetchStoreInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/store-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStoreInfo(data.data);
      } else {
        console.error('Failed to fetch store info:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching store info:', error);
    }
  };

  const shareInvoiceWhatsApp = async (sale) => {
    try {
      // Check if customer has phone number
      const customerPhone = sale.customer?.phone;
      if (!customerPhone) {
        alert('Customer phone number not available for WhatsApp sharing');
        return;
      }

      // Format phone number (remove any non-digits and ensure it starts with country code)
      let formattedPhone = customerPhone.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone; // Add India country code
      }

      // Create invoice message
      const storeName = storeInfo?.name || 'ShelfCure Pharmacy';
      const storePhone = storeInfo?.contact?.phone || storeInfo?.phone || '';
      const storeAddress = storeInfo?.address ?
        `${storeInfo.address.street}, ${storeInfo.address.city}, ${storeInfo.address.state} - ${storeInfo.address.pincode}` :
        '';

      const invoiceMessage = `🧾 *Invoice from ${storeName}*

📋 *Invoice Details:*
• Invoice No: ${sale.invoiceNumber || `INV-${sale._id.slice(-6).toUpperCase()}`}
• Date: ${new Date(sale.createdAt).toLocaleDateString('en-IN')}
• Items: ${sale.items?.length || 0} items
• Total Amount: ₹${sale.totalAmount?.toFixed(2) || '0.00'}
• Payment: ${sale.paymentMethod || 'Cash'}

👤 *Customer:* ${sale.customer?.name || 'Walk-in Customer'}

🏪 *Store Details:*
${storeName}${storeAddress ? `\n${storeAddress}` : ''}${storePhone ? `\nPhone: ${storePhone}` : ''}

🔗 View detailed invoice: ${window.location.origin}/api/store-manager/sales/${sale._id}/invoice?format=html

Thank you for choosing us! 💊
Get well soon! 🌟`;

      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(invoiceMessage)}`;

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');

    } catch (error) {
      console.error('Error sharing invoice via WhatsApp:', error);
      alert('Error sharing invoice via WhatsApp');
    }
  };

  const handleQuickCustomerAdd = async () => {
    try {
      // Basic validation
      const name = newCustomer.name?.trim();
      const phone = (newCustomer.phone || '').trim();
      if (!name) {
        alert('Please enter customer name');
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCustomer)
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers([...customers, data.data]);
        setSelectedCustomer(data.data);
        setNewCustomer({ name: '', phone: '', email: '', address: '' });
        setShowCustomerModal(false);
        alert('Customer added successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to add customer');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer');
    }
  };

  const handleQuickDoctorAdd = async () => {
    try {
      // Basic validation
      const name = newDoctor.name?.trim();
      const phone = (newDoctor.phone || '').trim();
      const specialization = newDoctor.specialization?.trim();
      if (!name) {
        alert('Please enter doctor name');
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
      }
      if (!specialization) {
        alert('Please enter specialization');
        return;
      }

      const payload = {
        ...newDoctor,
        registrationNumber: newDoctor.licenseNumber || undefined
      };

      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/doctors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors([...doctors, data.data]);
        setSelectedDoctor(data.data);
        setNewDoctor({ name: '', phone: '', email: '', specialization: '', licenseNumber: '' });
        setShowDoctorModal(false);
        alert('Doctor added successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to add doctor');
      }
    } catch (error) {
      console.error('Error adding doctor:', error);
      alert('Failed to add doctor');
    }
  };

  const fetchSalesHistory = async (fromDate = null, toDate = null, page = currentPage) => {
    try {
      setSalesLoading(true);
      const token = localStorage.getItem('token');
      console.log('Fetching sales history...', { fromDate, toDate, page });

      // Build query parameters
      const params = new URLSearchParams();
      params.append('_t', Date.now()); // Cache-busting parameter

      // Add pagination parameters
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());

      // Add date filters if provided
      if (fromDate) {
        params.append('startDate', fromDate);
      }
      if (toDate) {
        // Add end of day to include the entire end date
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(`/api/store-manager/sales?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log('Sales history response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Sales history data received:', data);
        console.log('Sales array:', data.data);
        console.log('Pagination info:', data.pagination);

        // Update sales data
        setSalesHistory(data.data || []);

        // Update pagination state
        if (data.pagination) {
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.pages);
          setTotalSales(data.pagination.total);
        }
      } else {
        console.error('Failed to fetch sales history:', response.status);
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
          if (errorData.message) {
            alert(`Error: ${errorData.message}`);
          }
        } catch (e) {
          alert('Failed to fetch sales history. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error fetching sales history:', error);
      alert('Network error while fetching sales history. Please check your connection.');
    } finally {
      setSalesLoading(false);
    }
  };

  // Date filter functions
  const handleApplyDateFilter = () => {
    if (dateFilterFrom && dateFilterTo) {
      // Validate date range
      const fromDate = new Date(dateFilterFrom);
      const toDate = new Date(dateFilterTo);

      if (fromDate > toDate) {
        alert('From date cannot be later than To date');
        return;
      }

      // Check if dates are not in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (fromDate > today || toDate > today) {
        alert('Cannot filter for future dates');
        return;
      }

      setIsDateFilterApplied(true);
      setCurrentPage(1); // Reset to first page when applying filters
      fetchSalesHistory(dateFilterFrom, dateFilterTo, 1);
    } else if (dateFilterFrom && !dateFilterTo) {
      // Single date filter
      setIsDateFilterApplied(true);
      setCurrentPage(1); // Reset to first page when applying filters
      fetchSalesHistory(dateFilterFrom, dateFilterFrom, 1);
    } else {
      alert('Please select at least a From date');
    }
  };

  const handleClearDateFilter = () => {
    setDateFilterFrom('');
    setDateFilterTo('');
    setIsDateFilterApplied(false);
    setCurrentPage(1); // Reset to first page when clearing filters
    fetchSalesHistory(null, null, 1); // Fetch all sales from page 1
  };

  // Pagination functions
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      if (isDateFilterApplied && dateFilterFrom) {
        fetchSalesHistory(dateFilterFrom, dateFilterTo, newPage);
      } else {
        fetchSalesHistory(null, null, newPage);
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const fetchBusinessSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/business-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const { discountTypes: fetchedDiscountTypes, taxTypes: fetchedTaxTypes, ...settings } = data.data;
          setBusinessSettings(settings);

          // Set discount types (only active ones)
          if (fetchedDiscountTypes) {
            const activeDiscountTypes = fetchedDiscountTypes.filter(dt => dt.isActive);
            setDiscountTypes(activeDiscountTypes);
          }

          // Set tax types (only active ones)
          if (fetchedTaxTypes) {
            const activeTaxTypes = fetchedTaxTypes.filter(tt => tt.isActive);
            setTaxTypes(activeTaxTypes);
          }
        }
      } else {
        console.error('Sales page - failed to fetch business settings:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
    }
  };

  // Helper functions for quantity selection
  const getSelectedQuantity = (medicineId, unitType) => {
    const key = `${medicineId}_${unitType}`;
    return selectedQuantities[key] || 0;
  };

  const setSelectedQuantity = (medicineId, unitType, quantity) => {
    const key = `${medicineId}_${unitType}`;
    setSelectedQuantities(prev => ({
      ...prev,
      [key]: Math.max(0, quantity)
    }));
  };

  const addToCart = (medicine, unitType = 'strip') => {
    const selectedQty = getSelectedQuantity(medicine._id, unitType);

    // Don't add to cart if quantity is 0
    if (selectedQty <= 0) {
      alert('Please select a quantity greater than 0');
      return;
    }

    const existingItem = cart.find(item =>
      item.medicine._id === medicine._id && item.unitType === unitType
    );

    const unitPrice = unitType === 'strip'
      ? medicine.pricing?.stripSellingPrice || 0
      : medicine.pricing?.individualSellingPrice || 0;

    const stripStock = medicine.inventory?.stripQuantity || 0;
    const individualStock = medicine.inventory?.individualQuantity || 0;
    const unitsPerStrip = medicine.unitTypes?.unitsPerStrip || 10;

    // Calculate available stock considering auto-conversion
    let availableStock;
    if (unitType === 'strip') {
      availableStock = stripStock;
    } else {
      // For individual units: direct stock + convertible from strips
      availableStock = individualStock + (stripStock * unitsPerStrip);
    }

    if (availableStock <= 0) {
      alert('This item is out of stock');
      return;
    }

    const newQuantity = existingItem ? existingItem.quantity + selectedQty : selectedQty;

    if (newQuantity > availableStock) {
      alert(`Cannot add ${selectedQty} items. Only ${availableStock - (existingItem?.quantity || 0)} items available.`);
      return;
    }

    // For individual units, show conversion message if needed
    if (unitType === 'individual' && individualStock === 0 && stripStock > 0) {
      const stripsNeeded = Math.ceil(selectedQty / unitsPerStrip);
      alert(`Note: ${selectedQty} individual units will be converted from ${stripsNeeded} strip(s).`);
    }

    if (existingItem) {
      updateCartQuantity(medicine._id, unitType, newQuantity);
    } else {
      const newItem = {
        medicine,
        unitType,
        quantity: selectedQty,
        unitPrice,
        totalPrice: unitPrice * selectedQty
      };
      setCart([...cart, newItem]);
    }

    // Reset selected quantity after adding to cart
    setSelectedQuantity(medicine._id, unitType, 0);
  };

  const updateCartQuantity = (medicineId, unitType, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(medicineId, unitType);
      return;
    }

    setCart(cart.map(item => {
      if (item.medicine._id === medicineId && item.unitType === unitType) {
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: item.unitPrice * newQuantity
        };
      }
      return item;
    }));
  };

  // Function to group cart items by medicine for display
  const getGroupedCartItems = () => {
    const grouped = {};

    cart.forEach(item => {
      const medicineId = item.medicine._id;
      if (!grouped[medicineId]) {
        grouped[medicineId] = {
          medicine: item.medicine,
          units: []
        };
      }
      grouped[medicineId].units.push(item);
    });

    return Object.values(grouped);
  };

  const removeFromCart = (medicineId, unitType) => {
    setCart(cart.filter(item =>
      !(item.medicine._id === medicineId && item.unitType === unitType)
    ));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    // Calculate discount amount: only when applyDiscount is checked
    let discountAmount = 0;

    if (applyDiscount) {
      if (selectedDiscount) {
        // Use selected discount type
        if (selectedDiscount.type === 'percentage') {
          discountAmount = (subtotal * selectedDiscount.value) / 100;
          // Apply discount type's maxValue cap (as percent of subtotal)
          const maxDiscount = (subtotal * (selectedDiscount.maxValue || 100)) / 100;
          discountAmount = Math.min(discountAmount, maxDiscount);
        } else if (selectedDiscount.type === 'amount') {
          discountAmount = Math.min(selectedDiscount.value, subtotal);
        }
      } else if (discount > 0) {
        // Use manual percentage discount with store-level cap
        const cappedPercent = Math.min(discount, businessSettings.maxDiscountPercent ?? 50);
        discountAmount = (subtotal * cappedPercent) / 100;
      }

      // Apply per-bill cap if configured
      const perBillCap = businessSettings.maxDiscountAmountPerBill || 0;
      if (perBillCap > 0) {
        discountAmount = Math.min(discountAmount, perBillCap);
      }
    }
    // When applyDiscount is false, no discount is applied (discountAmount remains 0)

    const taxableAmount = subtotal - discountAmount;

    // Calculate tax using selected tax or active tax types
    let totalTaxAmount = 0;
    let taxBreakdown = [];

    if (applyTax && selectedTax) {
      // Use the specifically selected tax
      totalTaxAmount = (taxableAmount * selectedTax.rate) / 100;
      taxBreakdown = [{
        name: selectedTax.name,
        rate: selectedTax.rate,
        amount: totalTaxAmount
      }];
    }
    // When applyTax is false, no tax is applied (totalTaxAmount remains 0)

    const total = taxableAmount + totalTaxAmount;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      gstAmount: totalTaxAmount, // Keep for backward compatibility
      gstRate: taxBreakdown.length > 0 ? taxBreakdown[0].rate : 0, // Keep for backward compatibility
      totalTaxAmount,
      taxBreakdown,
      total
    };
  };

  const processSale = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    // Validate prescription requirements
    if (prescriptionRequired) {
      if (!selectedDoctor) {
        alert('Please select a doctor for prescription sales');
        return;
      }
      if (!prescriptionFile) {
        alert('Please upload a prescription (image/PDF)');
        return;
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const totals = calculateTotals();

      const saleData = {
        customer: selectedCustomer?._id,
        doctor: selectedDoctor?._id,
        prescriptionRequired,
        items: cart.map(item => ({
          medicine: item.medicine._id,
          quantity: item.quantity,
          unitType: item.unitType
        })),
        paymentMethod,
        // Discount information
        applyDiscount,
        discount: (!applyDiscount || selectedDiscount) ? 0 : discount, // Use manual discount only when applyDiscount is true and no discount type selected
        selectedDiscount: selectedDiscount ? {
          id: selectedDiscount.id,
          name: selectedDiscount.name,
          type: selectedDiscount.type,
          value: selectedDiscount.value,
          maxValue: selectedDiscount.maxValue
        } : null,
        discountType: selectedDiscount ? {
          id: selectedDiscount.id,
          name: selectedDiscount.name,
          type: selectedDiscount.type,
          value: selectedDiscount.value,
          maxValue: selectedDiscount.maxValue
        } : null,
        discountAmount: totals.discountAmount,
        // Tax information
        applyTax,
        selectedTax: selectedTax ? {
          id: selectedTax.id,
          name: selectedTax.name,
          type: selectedTax.type,
          rate: selectedTax.rate,
          category: selectedTax.category
        } : null,
        taxBreakdown: totals.taxBreakdown,
        totalTaxAmount: totals.totalTaxAmount
      };

      // Build multipart form data for prescription file upload
      const formData = new FormData();
      formData.append('data', JSON.stringify(saleData));
      if (prescriptionRequired && prescriptionFile) {
        formData.append('prescription', prescriptionFile);
      }

      const response = await fetch('/api/store-manager/sales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: do not set Content-Type for FormData; browser sets it with boundary
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();

        // Show success message and offer to print invoice
        const printInvoice = window.confirm('Sale completed successfully! Would you like to print the invoice?');

        if (printInvoice && data.invoice) {
          // Fetch and print invoice with authentication
          try {
            const invoiceResponse = await fetch(`/api/store-manager/sales/${data.data._id}/invoice?format=html`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (invoiceResponse.ok) {
              const htmlContent = await invoiceResponse.text();
              const invoiceWindow = window.open('', '_blank');
              if (invoiceWindow) {
                invoiceWindow.document.write(htmlContent);
                invoiceWindow.document.close();
                invoiceWindow.onload = () => {
                  invoiceWindow.print();
                };
              } else {
                alert('Please allow popups to print the invoice');
              }
            } else {
              alert('Failed to fetch invoice for printing');
            }
          } catch (invoiceError) {
            console.error('Error fetching invoice:', invoiceError);
            alert('Error fetching invoice for printing');
          }
        } else if (printInvoice && !data.invoice) {
          alert('Invoice was not generated. Please check with administrator.');
        }

        // Reset cart and form
        setCart([]);
        setSelectedCustomer(null);
        setSelectedDoctor(null);
        setCustomerSearchTerm('');
        setDoctorSearchTerm('');
        setShowCustomerDropdown(false);
        setShowDoctorDropdown(false);
        setPrescriptionRequired(false);
        setPrescriptionFile(null);
        setDiscount(0);

        // Reset new discount selection states
        setApplyDiscount(false);
        setSelectedDiscount(null);
        // Reset tax selection states
        setApplyTax(false);
        setSelectedTax(null);
        setPaymentMethod('cash');

        // Refresh medicines to update stock
        fetchMedicines();

        // Refresh sales history to show the new sale
        if (isDateFilterApplied && dateFilterFrom) {
          fetchSalesHistory(dateFilterFrom, dateFilterTo, currentPage);
        } else {
          fetchSalesHistory(null, null, currentPage);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to process sale');
      }
    } catch (error) {
      console.error('Sale processing error:', error);
      alert('Failed to process sale');
    } finally {
      setLoading(false);
    }
  };

  // Combine inventory medicines and master medicines for comprehensive search
  const filteredMedicines = React.useMemo(() => {
    // Only show medicines when there's a search term
    if (!searchTerm.trim()) return [];

    const searchLower = searchTerm.toLowerCase().trim();

    // Filter inventory medicines (in stock)
    const inventoryResults = medicines.filter(medicine =>
      medicine.name?.toLowerCase().includes(searchLower) ||
      medicine.genericName?.toLowerCase().includes(searchLower) ||
      medicine.manufacturer?.toLowerCase().includes(searchLower) ||
      medicine.category?.toLowerCase().includes(searchLower)
    ).map(medicine => ({ ...medicine, isInInventory: true }));

    // Filter master medicines that are NOT in inventory (out of stock/not added)
    const masterResults = masterMedicines.filter(masterMedicine => {
      const matchesSearch =
        masterMedicine.name?.toLowerCase().includes(searchLower) ||
        masterMedicine.genericName?.toLowerCase().includes(searchLower) ||
        masterMedicine.manufacturer?.toLowerCase().includes(searchLower) ||
        masterMedicine.category?.toLowerCase().includes(searchLower);

      const notInInventory = !isInInventory(masterMedicine);

      return matchesSearch && notInInventory;
    }).map(medicine => ({ ...medicine, isInInventory: false }));

    // Combine results: inventory first, then master medicines
    return [...inventoryResults, ...masterResults];
  }, [medicines, masterMedicines, searchTerm]);

  const totals = calculateTotals();

  // Handle return functionality
  const handleReturnSale = (sale) => {
    // Navigate to returns page with pre-selected sale
    navigate('/store-panel/returns', {
      state: {
        preSelectedSale: sale,
        activeTab: 'create'
      }
    });
  };

  // Check if a sale can be returned (within return window and not already fully returned)
  const canReturnSale = (sale) => {
    // Check if sale is completed
    if (sale.status !== 'completed') return false;

    // Check if sale is already fully returned
    if (sale.status === 'returned' || sale.isReturned) return false;

    // Check return window (30 days)
    const saleDate = new Date(sale.saleDate || sale.createdAt);
    const daysSinceSale = Math.floor((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysSinceSale <= 30;
  };

  return (
    <StoreManagerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Tabs */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-900 text-left">Sales & POS</h1>
              <button
                onClick={() => setShowAddMedicineModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Medicine for Purchase
              </button>
            </div>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('pos')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'pos'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Point of Sale
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'history'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Sales History
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'pos' ? (
            <div className="space-y-6">
                {/* Sales Options Panel */}
                <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 text-left">Sales Options</h3>
                  <div className="flex items-center space-x-4">
                    {/* Prescription Required Toggle */}
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prescriptionRequired}
                          onChange={(e) => setPrescriptionRequired(e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Prescription Required</span>
                      </label>
                      {prescriptionRequired && (
                        <FileText className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Entry Shortcuts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Customer Quick Entry */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-left flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Customer
                      </h4>
                      <button
                        onClick={() => setShowCustomerModal((v) => !v)}
                        className="inline-flex items-center px-2 py-1 border border-green-300 rounded text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        {showCustomerModal ? 'Close' : 'Quick Add'}
                      </button>
                    </div>
                    <div className="relative" ref={customerDropdownRef}>
                      <input
                        type="text"
                        value={customerSearchTerm}
                        onChange={handleCustomerSearchChange}
                        onFocus={() => {
                          if (customerSearchTerm.trim()) {
                            searchCustomers(customerSearchTerm);
                          }
                        }}
                        placeholder="Search customer by name or phone number..."
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
                      />

                      {/* Customer Search Results Dropdown */}
                      {showCustomerDropdown && customerSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {customerSearchResults.map((customer) => (
                            <div
                              key={customer._id}
                              onClick={() => handleCustomerSelect(customer)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-gray-600 text-xs">{customer.phone}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No results message */}
                      {showCustomerDropdown && customerSearchTerm.trim() && customerSearchResults.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No customers found. Try searching by name or phone number.
                          </div>
                        </div>
                      )}
                    </div>

                    {showCustomerModal && (
                      <div className="mt-3 p-3 border border-green-200 rounded-md bg-green-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            placeholder="Full name"
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          />
                          <input
                            type="tel"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            placeholder="Phone (10 digits)"
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          />
                          <input
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            placeholder="Email (optional)"
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          />
                          <input
                            type="text"
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                            placeholder="Address (optional)"
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div className="mt-3 flex justify-end space-x-2">
                          <button
                            onClick={() => setShowCustomerModal(false)}
                            className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleQuickCustomerAdd}
                            className="px-3 py-1 rounded text-xs text-white bg-green-600 hover:bg-green-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Doctor Quick Entry */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-left flex items-center">
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Doctor {prescriptionRequired && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                      <button
                        onClick={() => setShowDoctorModal((v) => !v)}
                        className="inline-flex items-center px-2 py-1 border border-blue-300 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        {showDoctorModal ? 'Close' : 'Quick Add'}
                      </button>
                    </div>
                    <div className="relative" ref={doctorDropdownRef}>
                      <input
                        type="text"
                        value={doctorSearchTerm}
                        onChange={handleDoctorSearchChange}
                        onFocus={() => {
                          if (doctorSearchTerm.trim()) {
                            searchDoctors(doctorSearchTerm);
                          }
                        }}
                        placeholder="Search doctor by name or phone number..."
                        className={`block w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-1 text-sm ${
                          prescriptionRequired && !selectedDoctor
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                        }`}
                      />

                      {/* Doctor Search Results Dropdown */}
                      {showDoctorDropdown && doctorSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {doctorSearchResults.map((doctor) => (
                            <div
                              key={doctor._id}
                              onClick={() => handleDoctorSelect(doctor)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">Dr. {doctor.name}</div>
                              <div className="text-gray-600 text-xs">{doctor.specialization} • {doctor.phone}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No results message */}
                      {showDoctorDropdown && doctorSearchTerm.trim() && doctorSearchResults.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No doctors found. Try searching by name or phone number.
                          </div>
                        </div>
                      )}
                    </div>
                    {prescriptionRequired && !selectedDoctor && (
                      <p className="text-xs text-red-600 mt-1">Doctor selection is required for prescription sales</p>
                    )}

	                    {showDoctorModal && (
	                      <div className="mt-3 p-3 border border-blue-200 rounded-md bg-blue-50">
	                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
	                          <input
	                            type="text"
	                            value={newDoctor.name}
	                            onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
	                            placeholder="Doctor name"
	                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
	                          />
	                          <input
	                            type="tel"
	                            value={newDoctor.phone}
	                            onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
	                            placeholder="Phone (10 digits)"
	                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
	                          />
	                          <input
	                            type="email"
	                            value={newDoctor.email}
	                            onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
	                            placeholder="Email (optional)"
	                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
	                          />
	                          <input
	                            type="text"
	                            value={newDoctor.specialization}
	                            onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
	                            placeholder="Specialization"
	                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
	                          />
	                          <input
	                            type="text"
	                            value={newDoctor.licenseNumber}
	                            onChange={(e) => setNewDoctor({ ...newDoctor, licenseNumber: e.target.value })}
	                            placeholder="Registration No (optional)"
	                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
	                          />
	                        </div>
	                        <div className="mt-3 flex justify-end space-x-2">
	                          <button
	                            onClick={() => setShowDoctorModal(false)}
	                            className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 bg-white hover:bg-gray-50"
	                          >
	                            Cancel
	                          </button>
	                          <button
	                            onClick={handleQuickDoctorAdd}
	                            className="px-3 py-1 rounded text-xs text-white bg-blue-600 hover:bg-blue-700"
	                          >
	                            Save
	                          </button>
	                        </div>
	                      </div>
	                    )}

                  </div>
                </div>

                {/* Prescription Upload (if required) */}
                {prescriptionRequired && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Upload Prescription <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) { setPrescriptionFile(null); return; }
                        if (!(file.type.includes('image') || file.type === 'application/pdf')) {
                          setPrescriptionFileError('Please upload an image (JPG, PNG) or PDF file');
                          setPrescriptionFile(null);
                          return;
                        }
                        if (file.size > 10 * 1024 * 1024) {
                          setPrescriptionFileError('File size must be less than 10MB');
                          setPrescriptionFile(null);
                          return;
                        }
                        setPrescriptionFileError('');
                        setPrescriptionFile(file);
                      }}
                      className="block w-full text-sm text-gray-700"
                    />
                    {prescriptionFileError && (
                      <p className="text-xs text-red-600 mt-1 text-left">{prescriptionFileError}</p>
                    )}
                    {prescriptionFile && (
                      <p className="text-xs text-gray-600 mt-1 text-left">Selected: {prescriptionFile.name}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Medicine Selection */}
                <div className="lg:col-span-2">
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="mb-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search by medicine name, generic name, manufacturer, or category..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                      {searchTerm && (
                        <p className="text-sm text-gray-600 mt-2 text-left">
                          Showing {filteredMedicines.length} result{filteredMedicines.length !== 1 ? 's' : ''} for "{searchTerm}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {medicinesLoading ? (
                      <div className="col-span-2 text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading medicines...</p>
                      </div>
                    ) : filteredMedicines.length > 0 ? (
                      filteredMedicines.map((medicine) => {
                        const isInStock = medicine.isInInventory;
                        const hasStripStock = isInStock && medicine.inventory?.stripQuantity > 0;
                        const hasIndividualStock = isInStock && medicine.inventory?.individualQuantity > 0;
                        const hasAnyStock = hasStripStock || hasIndividualStock;

                        // Check unit configuration to determine what options to show
                        const hasStripsConfigured = medicine.unitTypes?.hasStrips !== false; // Default true for backward compatibility
                        const hasIndividualConfigured = medicine.unitTypes?.hasIndividual !== false; // Default true for backward compatibility
                        const unitsPerStrip = medicine.unitTypes?.unitsPerStrip || 10;

                        // For individual units, allow adding even if stock is 0 (if strips are available for conversion)
                        const canAddIndividual = hasIndividualConfigured && (hasIndividualStock || hasStripStock);
                        const canAddStrip = hasStripsConfigured && hasStripStock;

                        return (
                          <div key={medicine._id} className={`border rounded-lg p-4 transition-shadow ${
                            isInStock
                              ? (hasAnyStock ? 'border-gray-200 hover:shadow-md' : 'border-red-200 bg-red-50')
                              : 'border-orange-200 bg-orange-50'
                          }`}>
                            <div className="mb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900 text-left">{medicine.name}</h3>
                                  <p className="text-sm text-gray-500 text-left">{medicine.genericName}</p>
                                  <p className="text-xs text-gray-400 text-left">{medicine.manufacturer}</p>
                                </div>
                                {!isInStock && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Not Available
                                  </span>
                                )}
                              </div>

                              {/* Unit Conversion Information - Only show for in-stock medicines */}
                              {isInStock && hasStripsConfigured && hasIndividualConfigured && medicine.unitTypes?.unitsPerStrip && (
                                <div className="mt-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-left">
                                  <p className="text-xs text-blue-700 font-medium">
                                    📦 1 strip = {medicine.unitTypes.unitsPerStrip} individual units
                                  </p>
                                </div>
                              )}

                              {/* Stock Status */}
                              {isInStock && !hasAnyStock && (
                                <p className="text-xs text-red-600 font-medium text-left mt-1">Out of Stock</p>
                              )}
                              {!isInStock && (
                                <p className="text-xs text-orange-600 font-medium text-left mt-1">Not in inventory - Customer requested</p>
                              )}
                            </div>

                            <div className="space-y-3">
                              {/* Show add-to-cart options for in-stock medicines */}
                              {isInStock ? (
                                <>
                                  {/* Strip Option - Only show if configured */}
                                  {hasStripsConfigured && (
                                <div className={`${hasStripStock ? '' : 'opacity-50'}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-left">
                                      <span className="text-sm font-medium">Strip</span>
                                      <div className="text-xs text-gray-500">
                                        Stock: {medicine.inventory?.stripQuantity || 0} | ₹{medicine.pricing?.stripSellingPrice || 0}
                                      </div>
                                    </div>
                                  </div>
                                  {canAddStrip && (
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center border border-gray-300 rounded">
                                        <button
                                          onClick={() => setSelectedQuantity(medicine._id, 'strip', getSelectedQuantity(medicine._id, 'strip') - 1)}
                                          className="px-2 py-1 text-gray-600 hover:text-gray-800"
                                          disabled={getSelectedQuantity(medicine._id, 'strip') <= 0}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">
                                          {getSelectedQuantity(medicine._id, 'strip')}
                                        </span>
                                        <button
                                          onClick={() => setSelectedQuantity(medicine._id, 'strip', getSelectedQuantity(medicine._id, 'strip') + 1)}
                                          className="px-2 py-1 text-gray-600 hover:text-gray-800"
                                          disabled={getSelectedQuantity(medicine._id, 'strip') >= medicine.inventory.stripQuantity}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => addToCart(medicine, 'strip')}
                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                                      >
                                        <ShoppingCart className="h-3 w-3" />
                                        Add
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Individual Option - Only show if configured */}
                              {hasIndividualConfigured && (
                                <div className={`${hasIndividualStock ? '' : 'opacity-50'}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-left">
                                      <span className="text-sm font-medium">Individual</span>
                                      <div className="text-xs text-gray-500">
                                        Stock: {medicine.inventory?.individualQuantity || 0} | ₹{medicine.pricing?.individualSellingPrice || 0}
                                        {!hasIndividualStock && hasStripStock && (
                                          <span className="text-blue-600 ml-1">(Can convert from strips)</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {canAddIndividual && (
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center border border-gray-300 rounded">
                                        <button
                                          onClick={() => setSelectedQuantity(medicine._id, 'individual', getSelectedQuantity(medicine._id, 'individual') - 1)}
                                          className="px-2 py-1 text-gray-600 hover:text-gray-800"
                                          disabled={getSelectedQuantity(medicine._id, 'individual') <= 0}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">
                                          {getSelectedQuantity(medicine._id, 'individual')}
                                        </span>
                                        <button
                                          onClick={() => setSelectedQuantity(medicine._id, 'individual', getSelectedQuantity(medicine._id, 'individual') + 1)}
                                          className="px-2 py-1 text-gray-600 hover:text-gray-800"
                                          disabled={!hasIndividualStock && getSelectedQuantity(medicine._id, 'individual') >= (medicine.inventory.stripQuantity * unitsPerStrip)}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => addToCart(medicine, 'individual')}
                                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                                      >
                                        <ShoppingCart className="h-3 w-3" />
                                        Add
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                                </>
                              ) : (
                                /* Show reorder option for out-of-stock medicines */
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                  <div className="text-center">
                                    <p className="text-sm text-orange-700 mb-3">
                                      This medicine is not currently available in your inventory.
                                    </p>
                                    <button
                                      onClick={() => addToReorderList(medicine)}
                                      className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700 flex items-center gap-2 mx-auto"
                                    >
                                      <Plus className="h-4 w-4" />
                                      Add to Reorder List
                                    </button>
                                    <p className="text-xs text-orange-600 mt-2">
                                      This will help you remember to order this medicine for future customers.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center py-8">
                        <p className="text-gray-500">
                          {searchTerm ? 'No medicines found matching your search.' : 'No medicines available.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cart and Checkout */}
              <div className="lg:col-span-1">
                <div className="bg-white shadow rounded-lg p-6 sticky top-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Shopping Cart</h3>

                  {/* Selected Customer & Doctor Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-700">Customer:</span>
                        <span className="text-gray-900">
                          {selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone})` : 'Walk-in Customer'}
                        </span>
                      </div>
                      {selectedDoctor && (
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700">Doctor:</span>
                          <span className="text-gray-900">Dr. {selectedDoctor.name}</span>
                        </div>
                      )}
                      {prescriptionRequired && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">Prescription:</span>
                          <span className="text-gray-900">{prescriptionFile ? prescriptionFile.name : 'Not uploaded'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {cart.length > 0 ? (
                      getGroupedCartItems().map((group, groupIndex) => (
                        <div key={group.medicine._id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 text-left">
                              <p className="font-medium text-sm">{group.medicine.name}</p>
                              <p className="text-xs text-gray-500">{group.medicine.genericName}</p>
                            </div>
                          </div>

                          {/* Unit Types for this medicine */}
                          <div className="space-y-2">
                            {group.units.map((item, unitIndex) => (
                              <div key={`${item.medicine._id}-${item.unitType}`} className="flex items-center justify-between pl-4 py-2 bg-white rounded border-l-4 border-green-200">
                                <div className="flex-1 text-left">
                                  <p className="text-xs text-gray-600 capitalize font-medium">{item.unitType}</p>
                                  <p className="text-xs text-gray-500">₹{item.unitPrice} each</p>
                                  <p className="text-xs text-green-600 font-medium">
                                    ₹{item.unitPrice} × {item.quantity} = ₹{item.totalPrice}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => updateCartQuantity(item.medicine._id, item.unitType, item.quantity - 1)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="font-medium text-sm min-w-[20px] text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => updateCartQuantity(item.medicine._id, item.unitType, item.quantity + 1)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => removeFromCart(item.medicine._id, item.unitType)}
                                    className="text-red-600 hover:text-red-800 ml-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Medicine Group Total (show only if multiple unit types) */}
                          {group.units.length > 1 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-600 font-medium">Medicine Total:</p>
                                <p className="text-sm text-green-700 font-bold">
                                  ₹{group.units.reduce((total, item) => total + item.totalPrice, 0)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">Cart is empty</p>
                    )}
                  </div>

                  {/* Reorder List */}
                  {reorderList.length > 0 && (
                    <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-orange-800">Customer Requested Items</h3>
                        <span className="text-xs text-orange-600">{reorderList.length} item{reorderList.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {reorderList.map((medicine, index) => (
                          <div key={medicine._id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1 text-left">
                              <p className="text-xs font-medium text-gray-900">{medicine.name}</p>
                              <p className="text-xs text-gray-500">{medicine.manufacturer}</p>
                            </div>
                            <button
                              onClick={() => removeFromReorderList(medicine._id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove from reorder list"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <button
                          onClick={() => {
                            // Navigate to purchase orders reorder tab with reorder list
                            const reorderData = {
                              medicines: reorderList,
                              source: 'customer_request'
                            };
                            console.log('🚀 Storing reorder data:', reorderData);
                            localStorage.setItem('reorderData', JSON.stringify(reorderData));
                            console.log('✅ Reorder data stored, opening purchase page');
                            window.open('/store-panel/purchases#reorder', '_blank');
                          }}
                          className="w-full bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Add to Reorder List
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Discount and Payment */}
                  <div className="space-y-3 mb-4">
                    {/* Discount Selection */}
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <input
                          type="checkbox"
                          id="applyDiscount"
                          checked={applyDiscount}
                          onChange={(e) => {
                            if (!businessSettings.allowDiscounts) {
                              alert('Discounts are not allowed for this store');
                              return;
                            }
                            setApplyDiscount(e.target.checked);
                            if (!e.target.checked) {
                              setSelectedDiscount(null);

                              setDiscount(0);
                            }
                          }}
                          disabled={!businessSettings.allowDiscounts}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="applyDiscount" className="text-sm font-medium text-gray-700">
                          Apply Discount
                          {!businessSettings.allowDiscounts && <span className="text-red-500 ml-1">- Disabled</span>}
                          <span className="text-xs text-gray-500 ml-2">({discountTypes.length} available)</span>
                        </label>
                      </div>

                      {/* Discount Type Selection Dropdown */}
                      {applyDiscount && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                            Select Discount Type
                          </label>
                          <select
                            value={selectedDiscount?.id || ''}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const discountType = discountTypes.find(dt => dt.id == selectedId);
                              setSelectedDiscount(discountType || null);

                              setDiscount(0); // Reset manual discount when selecting a type
                            }}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="">Select Discount Type</option>
                            {discountTypes.length === 0 ? (
                              <option value="" disabled>No discount types available</option>
                            ) : (
                              discountTypes.map(discountType => (
                                <option key={discountType.id} value={discountType.id}>
                                  {discountType.name} - {discountType.type === 'amount' ? `₹${discountType.value}` : `${discountType.value}%`}
                                </option>
                              ))
                            )}
                          </select>
                          {selectedDiscount && (
                            <div className="mt-2 p-2 bg-green-50 rounded-md">
                              <p className="text-xs text-green-700">
                                <strong>{selectedDiscount.name}:</strong> {selectedDiscount.description}
                              </p>
                              <p className="text-xs text-green-600">
                                Value: {selectedDiscount.type === 'amount'
                                  ? `₹${selectedDiscount.value}`
                                  : `${selectedDiscount.value}%`
                                }
                                | Max: {selectedDiscount.type === 'amount'
                                  ? `₹${selectedDiscount.maxValue}`
                                  : `${selectedDiscount.maxValue}%`
                                }
                              </p>
                            </div>
                          )}

                          {/* Manual Discount (when no discount type selected) */}
                          {!selectedDiscount && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                                Manual Discount (%)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={businessSettings.maxDiscountPercent || 100}
                                value={discount}
                                onChange={(e) => {
                                  const value = Number(e.target.value);
                                  if (value > (businessSettings.maxDiscountPercent || 100)) {
                                    alert(`Maximum discount allowed is ${businessSettings.maxDiscountPercent || 100}%`);
                                    return;
                                  }
                                  setDiscount(value);
                                }}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter discount percentage"
                              />
                              {businessSettings.maxDiscountPercent && (
                                <p className="text-xs text-gray-500 mt-1">Maximum: {businessSettings.maxDiscountPercent}%</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tax Selection */}
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <input
                          type="checkbox"
                          id="applyTax"
                          checked={applyTax}
                          onChange={(e) => {
                            setApplyTax(e.target.checked);
                            if (!e.target.checked) {
                              setSelectedTax(null);
                            }
                          }}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="applyTax" className="text-sm font-medium text-gray-700">
                          Apply Tax
                          <span className="text-xs text-gray-500 ml-2">({taxTypes.length} available)</span>
                        </label>
                      </div>

                      {/* Tax Selection Dropdown */}
                      {applyTax && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                            Select Tax Type
                          </label>
                          <select
                            value={selectedTax?.id || ''}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const tax = taxTypes.find(tt => tt.id == selectedId);
                              setSelectedTax(tax || null);
                            }}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="">Select Tax Type</option>
                            {taxTypes.length === 0 ? (
                              <option value="" disabled>No tax types available</option>
                            ) : (
                              taxTypes.map(tax => (
                                <option key={tax.id} value={tax.id}>
                                  {tax.name} - {tax.rate}% ({tax.type.toUpperCase()})
                                </option>
                              ))
                            )}
                          </select>
                          {selectedTax && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-md">
                              <p className="text-xs text-blue-700">
                                <strong>{selectedTax.name}:</strong> {selectedTax.description || 'No description'}
                              </p>
                              <p className="text-xs text-blue-600">
                                Rate: {selectedTax.rate}% | Type: {selectedTax.type.toUpperCase()} | Category: {selectedTax.category}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Discount:</span>
                      <span>-₹{totals.discountAmount.toFixed(2)}</span>
                      {selectedDiscount && (
                        <span className="text-xs text-gray-500 ml-2">({selectedDiscount.name})</span>
                      )}
                    </div>

                    {/* Dynamic Tax Breakdown */}
                    {totals.taxBreakdown && totals.taxBreakdown.length > 0 ? (
                      totals.taxBreakdown.map((tax, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{tax.name} ({tax.rate}%):</span>
                          <span>₹{tax.amount.toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      totals.totalTaxAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Tax:</span>
                          <span>₹{totals.totalTaxAmount.toFixed(2)}</span>
                        </div>
                      )
                    )}

                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>₹{totals.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={processSale}
                    disabled={
                      loading ||
                      cart.length === 0 ||
                      (prescriptionRequired && (!selectedDoctor || !prescriptionFile))
                    }
                    className="w-full mt-4 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Receipt className="h-5 w-5" />
                        <span>Complete Sale</span>
                      </>
                    )}
                  </button>

                  {/* Prescription Validation Message */}
                  {prescriptionRequired && (!selectedDoctor || !prescriptionFile) && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                        <p className="text-xs text-red-600">
                          {!selectedDoctor && !prescriptionFile
                            ? 'Please select a doctor and upload prescription'
                            : !selectedDoctor
                            ? 'Please select a doctor for prescription sales'
                            : 'Please upload prescription'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 text-left">Sales History</h3>
              </div>

              {/* Date Filter Controls */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">From Date</label>
                      <input
                        type="date"
                        value={dateFilterFrom}
                        onChange={(e) => setDateFilterFrom(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        max={new Date().toISOString().split('T')[0]} // Prevent future dates
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">To Date</label>
                      <input
                        type="date"
                        value={dateFilterTo}
                        onChange={(e) => setDateFilterTo(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        max={new Date().toISOString().split('T')[0]} // Prevent future dates
                        min={dateFilterFrom} // Ensure To date is not before From date
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleApplyDateFilter}
                      disabled={!dateFilterFrom}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                    >
                      <Filter className="h-4 w-4" />
                      Apply Filter
                    </button>
                    <button
                      onClick={handleClearDateFilter}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2 text-sm font-medium"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </button>
                  </div>
                </div>

                {/* Current Filter Display */}
                {isDateFilterApplied && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Showing sales from {new Date(dateFilterFrom).toLocaleDateString('en-IN')}
                      {dateFilterTo && dateFilterFrom !== dateFilterTo && (
                        <> to {new Date(dateFilterTo).toLocaleDateString('en-IN')}</>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                {salesLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="mt-2 text-gray-500">Loading sales history...</p>
                  </div>
                ) : salesHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sales found</p>
                ) : (
                  <div>
                    {/* Sales Summary */}
                    <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
                      <div>
                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalSales)} of {totalSales} sales
                        {isDateFilterApplied && (
                          <span className="ml-2 text-green-600">
                            (filtered by date)
                          </span>
                        )}
                      </div>
                      <div>
                        Page {currentPage} of {totalPages}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {salesHistory.map((sale) => (
                          <tr key={sale._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(sale.createdAt).toLocaleString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {sale.invoiceNumber || `INV-${sale._id.slice(-6).toUpperCase()}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {typeof sale.customer === 'object' && sale.customer?.name
                                ? sale.customer.name
                                : typeof sale.customer === 'string'
                                ? sale.customer
                                : 'Walk-in Customer'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sale.items?.length || 0} items
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              ₹{sale.totalAmount?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {sale.paymentMethod || 'Cash'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => viewInvoice(sale._id)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                                  title="View Invoice"
                                >
                                  View Invoice
                                </button>
                                <button
                                  onClick={() => printInvoice(sale._id)}
                                  className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                                  title="Print Invoice"
                                >
                                  Print
                                </button>
                                <button
                                  onClick={() => shareInvoiceWhatsApp(sale)}
                                  className={`px-2 py-1 rounded-md transition-colors flex items-center ${
                                    sale.customer?.phone
                                      ? 'text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100'
                                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                  }`}
                                  title={sale.customer?.phone ? "Share via WhatsApp" : "Customer phone number required"}
                                  disabled={!sale.customer?.phone}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                                {canReturnSale(sale) && (
                                  <button
                                    onClick={() => handleReturnSale(sale)}
                                    className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-md transition-colors flex items-center"
                                    title="Create Return"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                  {salesHistory.length > 0 && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        {/* Total Count Display */}
                        <div className="text-sm text-gray-700">
                          Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalSales)} of {totalSales} sales
                        </div>

                        {/* Pagination Navigation */}
                        <div className="flex items-center gap-2">
                          {/* Previous Button */}
                          <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </button>

                          {/* Page Numbers */}
                          <div className="flex items-center gap-1">
                            {(() => {
                              const pages = [];
                              const maxVisiblePages = 5;
                              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                              // Adjust start page if we're near the end
                              if (endPage - startPage + 1 < maxVisiblePages) {
                                startPage = Math.max(1, endPage - maxVisiblePages + 1);
                              }

                              // Add first page and ellipsis if needed
                              if (startPage > 1) {
                                pages.push(
                                  <button
                                    key={1}
                                    onClick={() => handlePageChange(1)}
                                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                  >
                                    1
                                  </button>
                                );
                                if (startPage > 2) {
                                  pages.push(
                                    <span key="ellipsis1" className="px-2 py-2 text-sm text-gray-500">
                                      ...
                                    </span>
                                  );
                                }
                              }

                              // Add visible page numbers
                              for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                  <button
                                    key={i}
                                    onClick={() => handlePageChange(i)}
                                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                                      i === currentPage
                                        ? 'text-white bg-green-600 border border-green-600'
                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {i}
                                  </button>
                                );
                              }

                              // Add ellipsis and last page if needed
                              if (endPage < totalPages) {
                                if (endPage < totalPages - 1) {
                                  pages.push(
                                    <span key="ellipsis2" className="px-2 py-2 text-sm text-gray-500">
                                      ...
                                    </span>
                                  );
                                }
                                pages.push(
                                  <button
                                    key={totalPages}
                                    onClick={() => handlePageChange(totalPages)}
                                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                  >
                                    {totalPages}
                                  </button>
                                );
                              }

                              return pages;
                            })()}
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Medicine Modal */}
      <AddMedicineModal
        isOpen={showAddMedicineModal}
        onClose={() => setShowAddMedicineModal(false)}
        onMedicineAdded={() => {
          // Medicine request submitted successfully
          console.log('Medicine request submitted successfully');
          // You can add additional logic here like showing a notification
          // or refreshing data if needed
        }}
      />
    </StoreManagerLayout>
  );
};

export default StoreManagerSales;
