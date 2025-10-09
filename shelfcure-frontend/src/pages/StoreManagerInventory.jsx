import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Scan,
  Calendar,
  MapPin,
  Trash2,
  Download,
  Upload,
  BarChart3,
  RefreshCw,
  Info,
  X,
  Settings,
  Pill,
  Thermometer
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import { getCurrentUser } from '../services/authService';
import { createNumericInputHandler, VALIDATION_OPTIONS } from '../utils/inputValidation';

const StoreManagerInventory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'add', 'batches', 'barcode'
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');

  // Medicine action states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMedicineForAction, setSelectedMedicineForAction] = useState(null);
  const [editMedicineData, setEditMedicineData] = useState(null);
  
  // Batch management state
  const [batches, setBatches] = useState([]);
  const [batchStats, setBatchStats] = useState({
    active: 0,
    expiring: 0,
    expired: 0
  });
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedBatchMedicine, setSelectedBatchMedicine] = useState(null);
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    expiryDate: '',
    manufacturingDate: '',
    stripQuantity: 0,
    individualQuantity: 0,
    storageLocation: '',
    supplier: ''
  });
  const [editingBatch, setEditingBatch] = useState(null);
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  const [showDeleteBatchModal, setShowDeleteBatchModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [batchSortBy, setBatchSortBy] = useState('expiryDate');
  const [batchFilter, setBatchFilter] = useState('all');
  const [batchSearch, setBatchSearch] = useState('');

  // Master medicine search state
  const [masterMedicines, setMasterMedicines] = useState([]);
  const [masterMedicineSearch, setMasterMedicineSearch] = useState('');
  const [masterMedicineLoading, setMasterMedicineLoading] = useState(false);
  const [selectedMasterMedicine, setSelectedMasterMedicine] = useState(null);

  // Editable master medicine data (for when master medicine is selected but fields need to be editable)
  const [editableMasterMedicineData, setEditableMasterMedicineData] = useState({
    name: '',
    genericName: '',
    composition: '',
    manufacturer: '',
    category: '',
    requiresPrescription: false,
    unitTypes: {
      hasStrips: true,
      hasIndividual: true,
      unitsPerStrip: 10
    },
    dosage: {
      strength: '',
      form: '',
      frequency: ''
    },
    storageConditions: {
      temperature: {
        min: '',
        max: '',
        unit: 'celsius'
      },
      humidity: {
        min: '',
        max: ''
      },
      specialConditions: []
    },
    sideEffects: '',
    contraindications: '',
    interactions: '',
    barcode: '',
    tags: ''
  });

  // Custom medicine state
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customMedicineData, setCustomMedicineData] = useState({
    // Basic Medicine Information
    name: '',
    genericName: '',
    composition: '',
    manufacturer: '',
    
    // Classification
    categories: [],
    category: '', // Keep single category for backend compatibility
    requiresPrescription: false,
    
    // Unit Configuration
    unitTypes: {
      hasStrips: true,
      hasIndividual: true,
      unitsPerStrip: 10
    },
    
    // Pricing and Stock
    stripInfo: {
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      stock: '',
      minStock: 5,
      reorderLevel: 10
    },
    individualInfo: {
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      stock: '',
      minStock: 50,
      reorderLevel: 100
    },
    
    // Dosage Information
    dosage: {
      strength: '',
      form: '',
      frequency: ''
    },
    
    // Storage Conditions
    storageConditions: {
      temperature: {
        min: '',
        max: '',
        unit: 'celsius'
      },
      humidity: {
        min: '',
        max: ''
      },
      specialConditions: []
    },
    
    // Medical Information
    sideEffects: '',
    contraindications: '',
    interactions: '',
    
    // Additional Info
    batchNumber: '',
    barcode: '',
    expiryDate: '',
    storageLocation: '',
    supplier: '',
    tags: '',
    notes: '',
    isActive: true
  });
  const [customMedicineLoading, setCustomMedicineLoading] = useState(false);

  // Supplier search state
  const [suppliers, setSuppliers] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierSearchLoading, setSupplierSearchLoading] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearchTimeout, setSupplierSearchTimeout] = useState(null);

  // Non-custom mode supplier state
  const [selectedSupplier, setSelectedSupplier] = useState('');

  // Master medicine inventory data (for pricing and stock when adding master medicine to inventory)
  const [masterMedicineInventoryData, setMasterMedicineInventoryData] = useState({
    stripInfo: {
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      stock: '',
      minStock: 5,
      reorderLevel: 10
    },
    individualInfo: {
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      stock: '',
      minStock: 50,
      reorderLevel: 100
    },
    storageLocation: '',
    batchNumber: '',
    expiryDate: '',
    notes: ''
  });

  // Options for dropdowns
  const medicineCategories = [
    'Antibiotics', 'Pain Relief', 'Fever Reducer', 'Anti-inflammatory',
    'Vitamins & Supplements', 'Antacid', 'Cough & Cold', 'Diabetes Care',
    'Heart & Blood Pressure', 'Digestive Health', 'Respiratory', 'Skin Care',
    'Eye Care', 'Ear Care', 'Mental Health', 'Hormonal', 'Allergy Relief',
    'Bone & Joint Care', 'Kidney & Urinary', 'Liver Care', 'Other'
  ];

  const medicineForms = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment',
    'Powder', 'Inhaler', 'Spray', 'Gel', 'Lotion', 'Solution', 'Suspension',
    'Patch', 'Suppository', 'Other'
  ];

  const specialConditionsOptions = [
    'Keep in refrigerator',
    'Store in cool, dry place',
    'Protect from light',
    'Keep away from children',
    'Do not freeze',
    'Store upright',
    'Shake well before use'
  ];

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

  // Handle URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const stockStatus = searchParams.get('stockStatus');
    if (stockStatus) {
      setStockFilter(stockStatus);
    }
  }, [location.search]);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to access the inventory');
      setAuthChecked(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    setAuthChecked(true);
    fetchInventory();
  }, [currentPage, searchTerm, categoryFilter, stockFilter]);

  useEffect(() => {
    if (activeTab === 'batches') {
      fetchAllBatches();
    }
  }, [activeTab]);

  useEffect(() => {
    if (masterMedicineSearch) {
      const debounceTimeout = setTimeout(() => {
        fetchMasterMedicines();
      }, 300);
      return () => clearTimeout(debounceTimeout);
    } else {
      setMasterMedicines([]);
    }
  }, [masterMedicineSearch]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Please log in to access inventory');
        window.location.href = '/login';
        return;
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(stockFilter && { stockStatus: stockFilter })
      });

      const response = await fetch(`/api/store-manager/inventory?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please log in again.');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const data = await response.json();
      setMedicines(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Inventory fetch error:', error);
      setError('Failed to load inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if medicine supports cutting (strip to individual conversion)
  const supportsCutting = (medicine) => {
    // Cut Medicine functionality should only be available for medicines that have BOTH strips AND individual units
    // If a medicine only has individual units (hasStrips: false), it's a single-piece medicine (bottles, injections) - no cutting allowed
    return medicine.unitTypes?.hasStrips === true && medicine.unitTypes?.hasIndividual === true;
  };

  // Helper function to get appropriate label for individual units
  const getIndividualUnitsLabel = (medicine) => {
    if (supportsCutting(medicine)) {
      return 'Cut Medicines';
    } else {
      return 'Individual Units';
    }
  };

  const getStockStatus = (medicine) => {
    const stripStock = medicine.stripInfo?.stock || medicine.inventory?.stripQuantity || 0;
    const individualStock = medicine.individualInfo?.stock || medicine.inventory?.individualQuantity || 0;
    const stripMin = medicine.stripInfo?.minStock || medicine.inventory?.stripMinimumStock || 0;
    const individualMin = medicine.individualInfo?.minStock || medicine.inventory?.individualMinimumStock || 0;

    // Check if both unit types are enabled
    const hasStrips = medicine.unitTypes?.hasStrips;
    const hasIndividual = medicine.unitTypes?.hasIndividual;

    if (hasStrips && hasIndividual) {
      // Both enabled: Low stock calculation based on STRIP STOCK ONLY
      // Individual stock is just cut medicines, not used for low stock calculation
      if (stripStock === 0 && individualStock === 0) {
        return { status: 'out', label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
      } else if (stripStock <= stripMin) {
        return { status: 'low', label: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
      } else {
        return { status: 'good', label: 'In Stock', color: 'text-green-600 bg-green-100' };
      }
    } else if (hasStrips) {
      // Only strips enabled
      if (stripStock === 0) {
        return { status: 'out', label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
      } else if (stripStock <= stripMin) {
        return { status: 'low', label: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
      } else {
        return { status: 'good', label: 'In Stock', color: 'text-green-600 bg-green-100' };
      }
    } else if (hasIndividual) {
      // Only individual enabled: Use individual stock for low stock calculation
      if (individualStock === 0) {
        return { status: 'out', label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
      } else if (individualStock <= individualMin) {
        return { status: 'low', label: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
      } else {
        return { status: 'good', label: 'In Stock', color: 'text-green-600 bg-green-100' };
      }
    }

    // Fallback
    return { status: 'out', label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
  };

  const getStockIcon = (status) => {
    switch (status) {
      case 'out':
        return <XCircle className="h-4 w-4" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4" />;
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Clean up invalid supplier references in batches
  const cleanupBatchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/store-manager/batches/cleanup-suppliers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Supplier cleanup completed: ${data.data.summary.cleaned} batches cleaned`);
      }
    } catch (error) {
      console.error('Error cleaning up suppliers:', error);
    }
  };

  const updateBatchStorageLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setBatchLoading(true);
      const response = await fetch('/api/store-manager/batches/update-storage-locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Storage location update completed: ${data.data.summary.updated} batches updated`);
        // Refresh the batch list to show updated storage locations
        await fetchAllBatches();
      } else {
        console.error('Failed to update storage locations');
      }
    } catch (error) {
      console.error('Error updating storage locations:', error);
    } finally {
      setBatchLoading(false);
    }
  };

  // Migrate medicine batch data to batch documents
  const migrateMedicineBatches = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to migrate batches');
        return;
      }

      // First cleanup any invalid supplier references
      await cleanupBatchSuppliers();

      const response = await fetch('/api/store-manager/batches/migrate-from-medicines', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Migration completed! Created: ${data.data.summary.created}, Skipped: ${data.data.summary.skipped}, Errors: ${data.data.summary.errors}`);
        fetchAllBatches(); // Refresh batches after migration
      } else {
        const errorData = await response.json();
        alert('Migration failed: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error migrating batches:', error);
      alert('Error migrating batches: ' + error.message);
    }
  };

  // Fetch all batches for the store
  const fetchAllBatches = async () => {
    try {
      setBatchLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Please log in to access batches');
        return;
      }

      const response = await fetch('/api/store-manager/batches', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please log in again.');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setBatches(data.data || []);

        // If no batches found, automatically try to migrate from medicines
        if (!data.data || data.data.length === 0) {
          console.log('No batches found, attempting automatic migration...');
          try {
            // First cleanup any invalid supplier references
            await fetch('/api/store-manager/batches/cleanup-suppliers', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            const migrationResponse = await fetch('/api/store-manager/batches/migrate-from-medicines', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (migrationResponse.ok) {
              const migrationData = await migrationResponse.json();
              if (migrationData.data.summary.created > 0) {
                console.log(`Auto-migration successful: ${migrationData.data.summary.created} batches created`);
                // Fetch batches again after successful migration
                const refreshResponse = await fetch('/api/store-manager/batches', {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                if (refreshResponse.ok) {
                  const refreshData = await refreshResponse.json();
                  setBatches(refreshData.data || []);
                }
              }
            }
          } catch (migrationError) {
            console.error('Auto-migration failed:', migrationError);
            // Don't show error to user for auto-migration failure
          }
        } else {
          // Even if batches exist, cleanup any invalid supplier references
          try {
            await fetch('/api/store-manager/batches/cleanup-suppliers', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          } catch (cleanupError) {
            console.error('Auto-cleanup failed:', cleanupError);
          }
        }

        // Calculate batch statistics
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const stats = {
          active: 0,
          expiring: 0,
          expired: 0
        };

        (data.data || []).forEach(batch => {
          const expiryDate = new Date(batch.expiryDate);
          if (expiryDate < now) {
            stats.expired++;
          } else if (expiryDate <= futureDate) {
            stats.expiring++;
          } else {
            stats.active++;
          }
        });

        setBatchStats(stats);
      } else {
        throw new Error('Failed to fetch batches');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to fetch batches. Please try again.');
    } finally {
      setBatchLoading(false);
    }
  };

  const fetchBatches = async (medicineId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/inventory/${medicineId}/batches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBatches(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const addBatch = async () => {
    try {
      if (!selectedBatchMedicine) {
        alert('Please select a medicine first');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to add batches');
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`/api/store-manager/inventory/${selectedBatchMedicine._id}/batches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBatch)
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('Session expired. Please log in again.');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        alert('Batch created successfully!');
        fetchAllBatches(); // Refresh all batches
        setNewBatch({
          batchNumber: '',
          expiryDate: '',
          manufacturingDate: '',
          stripQuantity: 0,
          individualQuantity: 0,
          storageLocation: '',
          supplier: ''
        });
        setShowBatchModal(false);
        setSelectedBatchMedicine(null);
      } else {
        const errorData = await response.json();
        alert('Error creating batch: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding batch:', error);
      alert('Error creating batch: ' + error.message);
    }
  };

  const updateBatch = async () => {
    try {
      if (!editingBatch) return;

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/batches/${editingBatch._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingBatch)
      });

      if (response.ok) {
        alert('Batch updated successfully!');
        fetchAllBatches();
        setShowEditBatchModal(false);
        setEditingBatch(null);
      } else {
        const errorData = await response.json();
        alert('Error updating batch: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      alert('Error updating batch: ' + error.message);
    }
  };

  const deleteBatch = async () => {
    try {
      if (!batchToDelete) return;

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/batches/${batchToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Batch deleted successfully!');
        fetchAllBatches();
        setShowDeleteBatchModal(false);
        setBatchToDelete(null);
      } else {
        const errorData = await response.json();
        alert('Error deleting batch: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Error deleting batch: ' + error.message);
    }
  };

  const scanBarcode = async (barcode) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/inventory/barcode/${barcode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setSelectedMedicine(data.data);
          setShowMedicineModal(true);
        } else {
          setError('Medicine not found for barcode: ' + barcode);
        }
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      setError('Error scanning barcode');
    }
  };

  const generateBarcode = async (medicineId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/inventory/${medicineId}/generate-barcode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle barcode generation success
        fetchInventory();
      }
    } catch (error) {
      console.error('Error generating barcode:', error);
    }
  };

  const exportInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to export inventory');
        return;
      }

      const response = await fetch('/api/store-manager/inventory/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Show success message
        alert('Inventory exported successfully!');
      } else {
        const errorData = await response.json();
        alert('Export failed: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error exporting inventory:', error);
      alert('Error exporting inventory: ' + error.message);
    }
  };

  const handleBarcodeInput = (e) => {
    if (e.key === 'Enter') {
      scanBarcode(scannedBarcode);
      setScannedBarcode('');
    }
  };

  const fetchMasterMedicines = async () => {
    try {
      setMasterMedicineLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        search: masterMedicineSearch,
        limit: 10
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
        console.error('Failed to fetch master medicines');
        setMasterMedicines([]);
      }
    } catch (error) {
      console.error('Error fetching master medicines:', error);
      setMasterMedicines([]);
    } finally {
      setMasterMedicineLoading(false);
    }
  };

  const selectMasterMedicine = (medicine) => {
    setSelectedMasterMedicine(medicine);
    setMasterMedicineSearch('');
    setMasterMedicines([]);
    setIsCustomMode(false); // Clear custom mode when selecting master medicine

    // Initialize editable master medicine data with the selected medicine's data
    setEditableMasterMedicineData({
      name: medicine.name || '',
      genericName: medicine.genericName || '',
      composition: medicine.composition || '',
      manufacturer: medicine.manufacturer || '',
      category: medicine.category || '',
      requiresPrescription: medicine.requiresPrescription || false,
      unitTypes: {
        hasStrips: medicine.unitTypes?.hasStrips ?? true,
        hasIndividual: medicine.unitTypes?.hasIndividual ?? true,
        unitsPerStrip: medicine.unitTypes?.unitsPerStrip || 10
      },
      dosage: {
        strength: medicine.dosage?.strength || '',
        form: medicine.dosage?.form || '',
        frequency: medicine.dosage?.frequency || ''
      },
      storageConditions: {
        temperature: {
          min: medicine.storageConditions?.temperature?.min || '',
          max: medicine.storageConditions?.temperature?.max || '',
          unit: medicine.storageConditions?.temperature?.unit || 'celsius'
        },
        humidity: {
          min: medicine.storageConditions?.humidity?.min || '',
          max: medicine.storageConditions?.humidity?.max || ''
        },
        specialConditions: medicine.storageConditions?.specialConditions || []
      },
      sideEffects: medicine.sideEffects || '',
      contraindications: medicine.contraindications || '',
      interactions: medicine.interactions || '',
      barcode: medicine.barcode || '',
      tags: medicine.tags || ''
    });

    // Reset supplier fields for non-custom mode
    setSelectedSupplier('');
    setSupplierSearch('');
    setSuppliers([]);
    setShowSupplierDropdown(false);
  };

  const startCustomMedicineMode = () => {
    setIsCustomMode(true);
    setSelectedMasterMedicine(null);
    setMasterMedicineSearch('');
    setMasterMedicines([]);
    // Reset supplier fields
    setSelectedSupplier('');
    setSupplierSearch('');
    setSuppliers([]);
    setShowSupplierDropdown(false);
    // Reset custom medicine form data
    setCustomMedicineData({
      // Basic Medicine Information
      name: '',
      genericName: '',
      composition: '',
      manufacturer: '',
      
      // Classification
      categories: [],
      category: '',
      requiresPrescription: false,
      
      // Unit Configuration
      unitTypes: {
        hasStrips: true,
        hasIndividual: true,
        unitsPerStrip: 10
      },
      
      // Pricing and Stock
      stripInfo: {
        purchasePrice: '',
        sellingPrice: '',
        mrp: '',
        stock: '',
        minStock: 5,
        reorderLevel: 10
      },
      individualInfo: {
        purchasePrice: '',
        sellingPrice: '',
        mrp: '',
        stock: '',
        minStock: 50,
        reorderLevel: 100
      },
      
      // Dosage Information
      dosage: {
        strength: '',
        form: '',
        frequency: ''
      },
      
      // Storage Conditions
      storageConditions: {
        temperature: {
          min: '',
          max: '',
          unit: 'celsius'
        },
        humidity: {
          min: '',
          max: ''
        },
        specialConditions: []
      },
      
      // Medical Information
      sideEffects: '',
      contraindications: '',
      interactions: '',
      
      // Additional Info
      batchNumber: '',
      barcode: '',
      expiryDate: '',
      storageLocation: '',
      supplier: '',
      tags: '',
      notes: '',
      isActive: true
    });
  };

  const handleCustomMedicineInputChange = (field, value) => {
    if (field.includes('.')) {
      const parts = field.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setCustomMedicineData(prev => {
          const newData = {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: value
            }
          };

          // Auto-calculate Individual Unit Purchase Price when Strip Purchase Price changes
          if (field === 'stripInfo.purchasePrice' && value && parseFloat(value) > 0) {
            const unitsPerStrip = prev.unitTypes.unitsPerStrip || 10;
            if (unitsPerStrip > 0) {
              newData.individualInfo.purchasePrice = parseFloat((parseFloat(value) / unitsPerStrip).toFixed(2)).toString();
            }
          }

          // Auto-calculate Individual Unit MRP when Strip MRP changes
          if (field === 'stripInfo.mrp' && value && parseFloat(value) > 0) {
            const unitsPerStrip = prev.unitTypes.unitsPerStrip || 10;
            if (unitsPerStrip > 0) {
              newData.individualInfo.mrp = parseFloat((parseFloat(value) / unitsPerStrip).toFixed(2)).toString();
            }
          }

          // Auto-calculate Individual Unit MRP when Strip MRP changes
          if (field === 'stripInfo.mrp' && value > 0) {
            const unitsPerStrip = prev.unitTypes.unitsPerStrip || 10;
            if (unitsPerStrip > 0) {
              newData.individualInfo.mrp = parseFloat((value / unitsPerStrip).toFixed(2));
            }
          }

          return newData;
        });
      } else if (parts.length === 3) {
        const [parent, child, subchild] = parts;
        setCustomMedicineData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subchild]: value
            }
          }
        }));
      }
    } else {
      setCustomMedicineData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleMasterMedicineInventoryChange = (field, value) => {
    if (field.includes('.')) {
      const parts = field.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setMasterMedicineInventoryData(prev => {
          const newData = {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: value
            }
          };

          // Auto-calculate Individual Unit Purchase Price when Strip Purchase Price changes
          if (field === 'stripInfo.purchasePrice' && value && parseFloat(value) > 0) {
            const unitsPerStrip = isCustomMode
              ? customMedicineData.unitTypes.unitsPerStrip
              : editableMasterMedicineData?.unitTypes?.unitsPerStrip || 10;

            if (unitsPerStrip > 0) {
              newData.individualInfo.purchasePrice = parseFloat((parseFloat(value) / unitsPerStrip).toFixed(2)).toString();
            }
          }

          // Auto-calculate Individual Unit MRP when Strip MRP changes
          if (field === 'stripInfo.mrp' && value && parseFloat(value) > 0) {
            const unitsPerStrip = isCustomMode
              ? customMedicineData.unitTypes.unitsPerStrip
              : editableMasterMedicineData?.unitTypes?.unitsPerStrip || 10;

            if (unitsPerStrip > 0) {
              newData.individualInfo.mrp = parseFloat((parseFloat(value) / unitsPerStrip).toFixed(2)).toString();
            }
          }

          return newData;
        });
      }
    } else {
      setMasterMedicineInventoryData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handler for editable master medicine basic info changes
  const handleEditableMasterMedicineChange = (field, value) => {
    if (field.includes('.')) {
      const parts = field.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setEditableMasterMedicineData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setEditableMasterMedicineData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: value
            }
          }
        }));
      }
    } else {
      setEditableMasterMedicineData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handler for special condition toggle for editable master medicine
  const handleEditableMasterMedicineSpecialConditionToggle = (condition) => {
    setEditableMasterMedicineData(prev => ({
      ...prev,
      storageConditions: {
        ...prev.storageConditions,
        specialConditions: prev.storageConditions.specialConditions.includes(condition)
          ? prev.storageConditions.specialConditions.filter(c => c !== condition)
          : [...prev.storageConditions.specialConditions, condition]
      }
    }));
  };

  const handleCategorySelection = (category) => {
    setCustomMedicineData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
      category: prev.categories.includes(category) 
        ? (prev.categories.filter(c => c !== category)[0] || '') 
        : category // Set primary category for backend compatibility
    }));
  };

  const handleSpecialConditionToggle = (condition) => {
    setCustomMedicineData(prev => ({
      ...prev,
      storageConditions: {
        ...prev.storageConditions,
        specialConditions: prev.storageConditions.specialConditions.includes(condition)
          ? prev.storageConditions.specialConditions.filter(c => c !== condition)
          : [...prev.storageConditions.specialConditions, condition]
      }
    }));
  };

  // Supplier search functions
  const handleSupplierSearch = async (searchTerm) => {
    setSupplierSearch(searchTerm);
    if (searchTerm.length > 0) {
      setSupplierSearchLoading(true);
      try {
        const filteredSuppliers = await searchSuppliersAPI(searchTerm);
        setSuppliers(filteredSuppliers);
        setSupplierSearchLoading(false);
        setShowSupplierDropdown(true);
      } catch (error) {
        console.error('Supplier search error:', error);
        setSuppliers([]);
        setSupplierSearchLoading(false);
        setShowSupplierDropdown(false);
      }
    } else {
      setSuppliers([]);
      setShowSupplierDropdown(false);
    }
  };

  const selectSupplier = (supplier) => {
    if (isCustomMode) {
      handleCustomMedicineInputChange('supplier', supplier.name);
    } else {
      setSelectedSupplier(supplier.name);
    }
    setSupplierSearch(supplier.name);
    setShowSupplierDropdown(false);
    setSuppliers([]);
  };

  const handleSupplierInputChange = (value) => {
    if (isCustomMode) {
      handleCustomMedicineInputChange('supplier', value);
    } else {
      setSelectedSupplier(value);
    }
    setSupplierSearch(value);

    // Debounce the API call
    if (supplierSearchTimeout) {
      clearTimeout(supplierSearchTimeout);
    }
    const timeout = setTimeout(() => {
      handleSupplierSearch(value);
    }, 300);
    setSupplierSearchTimeout(timeout);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (supplierSearchTimeout) {
        clearTimeout(supplierSearchTimeout);
      }
    };
  }, [supplierSearchTimeout]);

  // Medicine action handlers
  const handleViewMedicine = (medicine) => {
    navigate(`/store-panel/inventory/medicine/${medicine._id}`);
  };

  const handleEditMedicine = (medicine) => {
    setSelectedMedicineForAction(medicine);
    setEditMedicineData({
      ...medicine,
      // Ensure we have the correct structure for editing - convert numbers to strings for display
      stripInfo: medicine.stripInfo ? {
        ...medicine.stripInfo,
        purchasePrice: medicine.stripInfo.purchasePrice?.toString() || '',
        sellingPrice: medicine.stripInfo.sellingPrice?.toString() || '',
        mrp: medicine.stripInfo.mrp?.toString() || '',
        stock: medicine.stripInfo.stock?.toString() || '',
        minStock: medicine.stripInfo.minStock || 5,
        reorderLevel: medicine.stripInfo.reorderLevel || 10
      } : {
        purchasePrice: '',
        sellingPrice: '',
        mrp: '',
        stock: '',
        minStock: 5,
        reorderLevel: 10
      },
      individualInfo: medicine.individualInfo ? {
        ...medicine.individualInfo,
        purchasePrice: medicine.individualInfo.purchasePrice?.toString() || '',
        sellingPrice: medicine.individualInfo.sellingPrice?.toString() || '',
        mrp: medicine.individualInfo.mrp?.toString() || '',
        stock: medicine.individualInfo.stock?.toString() || '',
        minStock: medicine.individualInfo.minStock || 50,
        reorderLevel: medicine.individualInfo.reorderLevel || 100
      } : {
        purchasePrice: '',
        sellingPrice: '',
        mrp: '',
        stock: '',
        minStock: 50,
        reorderLevel: 100
      },
      // Ensure dosage object exists
      dosage: medicine.dosage || {
        strength: '',
        form: '',
        frequency: ''
      },
      // Ensure arrays are properly initialized
      tags: medicine.tags || [],
      sideEffects: medicine.sideEffects || [],
      contraindications: medicine.contraindications || [],
      interactions: medicine.interactions || [],
      // Ensure other fields have defaults
      notes: medicine.notes || '',
      requiresPrescription: medicine.requiresPrescription || false,
      isActive: medicine.isActive !== false // Default to true unless explicitly false
    });
    setShowEditModal(true);
  };

  const handleDeleteMedicine = (medicine) => {
    setSelectedMedicineForAction(medicine);
    setShowDeleteModal(true);
  };

  const confirmDeleteMedicine = async () => {
    if (!selectedMedicineForAction) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/medicines/${selectedMedicineForAction._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh the inventory list
        await fetchInventory();
        setShowDeleteModal(false);
        setSelectedMedicineForAction(null);
        alert('Medicine deleted successfully!');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete medicine');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      alert('Error deleting medicine: ' + error.message);
    }
  };

  const handleEditMedicineSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMedicineForAction || !editMedicineData) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/medicines/${selectedMedicineForAction._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editMedicineData,
          stripInfo: {
            ...editMedicineData.stripInfo,
            purchasePrice: parseFloat(editMedicineData.stripInfo?.purchasePrice) || 0,
            sellingPrice: parseFloat(editMedicineData.stripInfo?.sellingPrice) || 0,
            mrp: parseFloat(editMedicineData.stripInfo?.mrp) || 0,
            stock: parseInt(editMedicineData.stripInfo?.stock) || 0,
            minStock: parseInt(editMedicineData.stripInfo?.minStock) || 5,
            reorderLevel: parseInt(editMedicineData.stripInfo?.reorderLevel) || 10,
          },
          individualInfo: {
            ...editMedicineData.individualInfo,
            purchasePrice: parseFloat(editMedicineData.individualInfo?.purchasePrice) || 0,
            sellingPrice: parseFloat(editMedicineData.individualInfo?.sellingPrice) || 0,
            mrp: parseFloat(editMedicineData.individualInfo?.mrp) || 0,
            stock: parseInt(editMedicineData.individualInfo?.stock) || 0,
            minStock: parseInt(editMedicineData.individualInfo?.minStock) || 50,
            reorderLevel: parseInt(editMedicineData.individualInfo?.reorderLevel) || 100,
          },
          // Ensure dosage object exists
          dosage: {
            strength: editMedicineData.dosage?.strength || '',
            form: editMedicineData.dosage?.form || '',
            frequency: editMedicineData.dosage?.frequency || ''
          },
          // Convert date to proper format
          expiryDate: editMedicineData.expiryDate ? new Date(editMedicineData.expiryDate).toISOString() : null,
          // Ensure arrays are properly formatted
          tags: Array.isArray(editMedicineData.tags) ? editMedicineData.tags : [],
          sideEffects: Array.isArray(editMedicineData.sideEffects) ? editMedicineData.sideEffects : [],
          contraindications: Array.isArray(editMedicineData.contraindications) ? editMedicineData.contraindications : [],
          interactions: Array.isArray(editMedicineData.interactions) ? editMedicineData.interactions : []
        })
      });

      if (response.ok) {
        // Refresh the inventory list
        await fetchInventory();
        setShowEditModal(false);
        setSelectedMedicineForAction(null);
        setEditMedicineData(null);
        alert('Medicine updated successfully!');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update medicine');
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
      alert('Error updating medicine: ' + error.message);
    }
  };

  const handleEditMedicineInputChange = (field, value) => {
    if (field.includes('.')) {
      const parts = field.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setEditMedicineData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setEditMedicineData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCustomMedicineSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields based on enabled unit types
    const validationErrors = [];

    // Check if strips are enabled and validate strip fields
    if (customMedicineData.unitTypes.hasStrips) {
      if (!customMedicineData.stripInfo.purchasePrice || parseFloat(customMedicineData.stripInfo.purchasePrice) <= 0) {
        validationErrors.push('Strip Purchase Price is required');
      }
      if (!customMedicineData.stripInfo.sellingPrice || parseFloat(customMedicineData.stripInfo.sellingPrice) <= 0) {
        validationErrors.push('Strip Selling Price is required');
      }
    }

    // Check if individual units are enabled and validate individual fields
    if (customMedicineData.unitTypes.hasIndividual) {
      if (!customMedicineData.individualInfo.purchasePrice || parseFloat(customMedicineData.individualInfo.purchasePrice) <= 0) {
        validationErrors.push('Individual Unit Purchase Price is required');
      }
      if (!customMedicineData.individualInfo.sellingPrice || parseFloat(customMedicineData.individualInfo.sellingPrice) <= 0) {
        validationErrors.push('Individual Unit Selling Price is required');
      }
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    try {
      setCustomMedicineLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      // Convert string values to numbers for backend
      const dataToSend = {
        ...customMedicineData,
        stripInfo: {
          ...customMedicineData.stripInfo,
          purchasePrice: parseFloat(customMedicineData.stripInfo.purchasePrice) || 0,
          sellingPrice: parseFloat(customMedicineData.stripInfo.sellingPrice) || 0,
          mrp: parseFloat(customMedicineData.stripInfo.mrp) || 0,
          stock: parseInt(customMedicineData.stripInfo.stock) || 0,
        },
        individualInfo: {
          ...customMedicineData.individualInfo,
          purchasePrice: parseFloat(customMedicineData.individualInfo.purchasePrice) || 0,
          sellingPrice: parseFloat(customMedicineData.individualInfo.sellingPrice) || 0,
          mrp: parseFloat(customMedicineData.individualInfo.mrp) || 0,
          stock: parseInt(customMedicineData.individualInfo.stock) || 0,
        }
      };

      const response = await fetch('http://localhost:5000/api/store-manager/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add custom medicine');
      }

      // Success - refresh inventory and show success message
      await fetchInventory();
      setIsCustomMode(false);
      setActiveTab('list');
      
      // You could add a success notification here
      alert('Custom medicine added successfully!');

    } catch (error) {
      console.error('Error adding custom medicine:', error);
      setError(error.message || 'Failed to add custom medicine');
    } finally {
      setCustomMedicineLoading(false);
    }
  };

  const handleMasterMedicineSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMasterMedicine) {
      setError('Please select a master medicine first');
      return;
    }

    // Validate required fields based on enabled unit types
    const validationErrors = [];

    // Check if strips are enabled and validate strip fields
    if (editableMasterMedicineData.unitTypes?.hasStrips) {
      if (!masterMedicineInventoryData.stripInfo.purchasePrice || masterMedicineInventoryData.stripInfo.purchasePrice <= 0) {
        validationErrors.push('Strip Purchase Price is required');
      }
      if (!masterMedicineInventoryData.stripInfo.sellingPrice || masterMedicineInventoryData.stripInfo.sellingPrice <= 0) {
        validationErrors.push('Strip Selling Price is required');
      }
    }

    // Check if individual units are enabled and validate individual fields
    if (editableMasterMedicineData.unitTypes?.hasIndividual) {
      if (!masterMedicineInventoryData.individualInfo.purchasePrice || masterMedicineInventoryData.individualInfo.purchasePrice <= 0) {
        validationErrors.push('Individual Unit Purchase Price is required');
      }
      if (!masterMedicineInventoryData.individualInfo.sellingPrice || masterMedicineInventoryData.individualInfo.sellingPrice <= 0) {
        validationErrors.push('Individual Unit Selling Price is required');
      }
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    try {
      setCustomMedicineLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      // Prepare the data for master medicine addition
      const inventoryDataConverted = {
        ...masterMedicineInventoryData,
        stripInfo: {
          ...masterMedicineInventoryData.stripInfo,
          purchasePrice: parseFloat(masterMedicineInventoryData.stripInfo.purchasePrice) || 0,
          sellingPrice: parseFloat(masterMedicineInventoryData.stripInfo.sellingPrice) || 0,
          mrp: parseFloat(masterMedicineInventoryData.stripInfo.mrp) || 0,
          stock: parseInt(masterMedicineInventoryData.stripInfo.stock) || 0,
        },
        individualInfo: {
          ...masterMedicineInventoryData.individualInfo,
          purchasePrice: parseFloat(masterMedicineInventoryData.individualInfo.purchasePrice) || 0,
          sellingPrice: parseFloat(masterMedicineInventoryData.individualInfo.sellingPrice) || 0,
          mrp: parseFloat(masterMedicineInventoryData.individualInfo.mrp) || 0,
          stock: parseInt(masterMedicineInventoryData.individualInfo.stock) || 0,
        }
      };

      const medicineData = {
        ...selectedMasterMedicine,
        // Override with editable master medicine data (allows store managers to modify master data)
        name: editableMasterMedicineData.name,
        genericName: editableMasterMedicineData.genericName,
        composition: editableMasterMedicineData.composition,
        manufacturer: editableMasterMedicineData.manufacturer,
        category: editableMasterMedicineData.category,
        requiresPrescription: editableMasterMedicineData.requiresPrescription,
        unitTypes: editableMasterMedicineData.unitTypes,
        dosage: editableMasterMedicineData.dosage,
        storageConditions: editableMasterMedicineData.storageConditions,
        sideEffects: editableMasterMedicineData.sideEffects,
        contraindications: editableMasterMedicineData.contraindications,
        interactions: editableMasterMedicineData.interactions,
        barcode: editableMasterMedicineData.barcode,
        tags: editableMasterMedicineData.tags,
        supplier: selectedSupplier, // Use the selected supplier from non-custom mode
        // Add inventory-specific data
        ...inventoryDataConverted
      };

      const response = await fetch('http://localhost:5000/api/store-manager/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(medicineData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add medicine to inventory');
      }

      // Success - refresh inventory and show success message
      await fetchInventory();
      setSelectedMasterMedicine(null);
      setSelectedSupplier('');

      // Reset editable master medicine data
      setEditableMasterMedicineData({
        name: '',
        genericName: '',
        composition: '',
        manufacturer: '',
        category: '',
        requiresPrescription: false,
        unitTypes: {
          hasStrips: true,
          hasIndividual: true,
          unitsPerStrip: 10
        },
        dosage: {
          strength: '',
          form: '',
          frequency: ''
        },
        storageConditions: {
          temperature: {
            min: '',
            max: '',
            unit: 'celsius'
          },
          humidity: {
            min: '',
            max: ''
          },
          specialConditions: []
        },
        sideEffects: '',
        contraindications: '',
        interactions: '',
        barcode: '',
        tags: ''
      });

      // Reset master medicine inventory data
      setMasterMedicineInventoryData({
        stripInfo: {
          purchasePrice: '',
          sellingPrice: '',
          mrp: '',
          stock: '',
          minStock: 5,
          reorderLevel: 10
        },
        individualInfo: {
          purchasePrice: '',
          sellingPrice: '',
          mrp: '',
          stock: '',
          minStock: 50,
          reorderLevel: 100
        },
        storageLocation: '',
        batchNumber: '',
        expiryDate: '',
        notes: ''
      });

      setActiveTab('list');

      alert('Medicine added to inventory successfully!');

    } catch (error) {
      console.error('Error adding medicine to inventory:', error);
      setError(error.message || 'Failed to add medicine to inventory');
    } finally {
      setCustomMedicineLoading(false);
    }
  };

  const cancelCustomMode = () => {
    setIsCustomMode(false);
    // Use the same reset structure as startCustomMedicineMode for consistency
    startCustomMedicineMode();
    setIsCustomMode(false); // Override to false since we're canceling
  };

  if (loading && medicines.length === 0) {
    return (
      <StoreManagerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </StoreManagerLayout>
    );
  }

  // Show loading screen while checking authentication
  if (!authChecked) {
    return (
      <StoreManagerLayout>
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Checking authentication...</p>
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
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between mb-6">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900 text-left">Inventory Management</h1>
              <p className="mt-2 text-sm text-gray-700 text-left">
                Manage your medicine inventory, track stock levels, batches, and monitor expiry dates.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveTab('add')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medicine
                </button>
                <button
                  onClick={exportInventory}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>

              </div>
            </div>
          </div>

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
                Medicine List
              </button>
              <button
                onClick={() => setActiveTab('batches')}
                className={`${
                  activeTab === 'batches'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Batch Management
              </button>
              <button
                onClick={() => setActiveTab('barcode')}
                className={`${
                  activeTab === 'barcode'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Barcode Scanner
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`${
                  activeTab === 'add'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Add Medicine
              </button>
            </nav>
          </div>

          {/* Quick Actions Bar */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab('barcode')}
                className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Scan className="h-5 w-5" />
                <span>Scan Barcode</span>
              </button>
              <button
                onClick={() => setActiveTab('batches')}
                className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
              >
                <Calendar className="h-5 w-5" />
                <span>Manage Batches</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'list' && (
            <>
              {/* Filters */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Categories</option>
                  <option value="tablet">Tablets</option>
                  <option value="capsule">Capsules</option>
                  <option value="syrup">Syrups</option>
                  <option value="injection">Injections</option>
                  <option value="ointment">Ointments</option>
                  <option value="drops">Drops</option>
                </select>
              </div>

              {/* Stock Filter */}
              <div>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Stock Levels</option>
                  <option value="good">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                    setStockFilter('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* Inventory Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medicine
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      {/* Show Strip Stock header only if any medicine has strips configured */}
                      {medicines.some(medicine => medicine.unitTypes?.hasStrips) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Strip Stock
                        </th>
                      )}
                      {/* Show Strip Pricing header only if any medicine has strips configured */}
                      {medicines.some(medicine => medicine.unitTypes?.hasStrips) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Strip Pricing
                        </th>
                      )}
                      {/* Show Individual Stock header only if any medicine has individual units configured */}
                      {medicines.some(medicine => medicine.unitTypes?.hasIndividual) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Individual Stock
                        </th>
                      )}
                      {/* Show Individual Pricing header only if any medicine has individual units configured */}
                      {medicines.some(medicine => medicine.unitTypes?.hasIndividual) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Individual Pricing
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rack Locations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medicines.length > 0 ? (
                      medicines.map((medicine) => {
                        const stockStatus = getStockStatus(medicine);
                        return (
                          <tr key={medicine._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900 text-left">
                                  {medicine.name}
                                </div>
                                <div className="text-sm text-gray-500 text-left">
                                  {medicine.genericName}
                                </div>
                                <div className="text-xs text-gray-400 text-left">
                                  {medicine.manufacturer}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {medicine.category}
                              </span>
                            </td>
                            {/* Strip Stock - Show if any medicine has strips OR show empty cell to maintain table structure */}
                            {medicines.some(med => med.unitTypes?.hasStrips) && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {medicine.unitTypes?.hasStrips ? (
                                  <div className="text-left">
                                    <div className="font-medium">
                                      {medicine.stripInfo?.stock || medicine.inventory?.stripQuantity || 0} strips
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Min: {medicine.stripInfo?.minStock || medicine.inventory?.stripMinimumStock || 0}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-left">
                                    <span className="text-gray-400 text-xs">N/A</span>
                                  </div>
                                )}
                              </td>
                            )}

                            {/* Strip Pricing - Show if any medicine has strips OR show empty cell to maintain table structure */}
                            {medicines.some(med => med.unitTypes?.hasStrips) && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {medicine.unitTypes?.hasStrips ? (
                                  <div className="text-left">
                                    {medicine.stripInfo ? (
                                      <>
                                        <div className="font-medium">
                                          ₹{medicine.stripInfo.sellingPrice || 0}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          MRP: ₹{medicine.stripInfo.mrp || 0}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          Cost: ₹{medicine.stripInfo.purchasePrice || 0}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 text-xs">Not set</span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-left">
                                    <span className="text-gray-400 text-xs">N/A</span>
                                  </div>
                                )}
                              </td>
                            )}

                            {/* Individual Stock - Show if any medicine has individual units OR show empty cell to maintain table structure */}
                            {medicines.some(med => med.unitTypes?.hasIndividual) && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {medicine.unitTypes?.hasIndividual ? (
                                  <div className="text-left">
                                    <div className="font-medium">
                                      {medicine.individualInfo?.stock || medicine.inventory?.individualQuantity || 0} units
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Min: {medicine.individualInfo?.minStock || medicine.inventory?.individualMinimumStock || 0}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      ({getIndividualUnitsLabel(medicine).toLowerCase()})
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-left">
                                    <span className="text-gray-400 text-xs">N/A</span>
                                  </div>
                                )}
                              </td>
                            )}

                            {/* Individual Pricing - Show if any medicine has individual units OR show empty cell to maintain table structure */}
                            {medicines.some(med => med.unitTypes?.hasIndividual) && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {medicine.unitTypes?.hasIndividual ? (
                                  <div className="text-left">
                                    {medicine.individualInfo ? (
                                      <>
                                        <div className="font-medium">
                                          ₹{medicine.individualInfo.sellingPrice || 0}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          MRP: ₹{medicine.individualInfo.mrp || 0}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          Cost: ₹{medicine.individualInfo.purchasePrice || 0}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-gray-400 text-xs">Not set</span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-left">
                                    <span className="text-gray-400 text-xs">N/A</span>
                                  </div>
                                )}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                                {getStockIcon(stockStatus.status)}
                                <span className="ml-1">{stockStatus.label}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="text-left">
                                {medicine.rackLocations && medicine.rackLocations.length > 0 ? (
                                  <div className="space-y-1">
                                    {medicine.rackLocations.slice(0, 2).map((location, index) => (
                                      <div key={index} className="flex items-center space-x-1">
                                        <MapPin className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs font-medium">
                                          {location.rack?.rackNumber || 'Unknown'}-{location.shelf}-{location.position}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          ({medicine.unitTypes?.hasStrips && medicine.unitTypes?.hasIndividual
                                            ? `${location.stripQuantity || 0}s/${location.individualQuantity || 0}u`
                                            : medicine.unitTypes?.hasStrips
                                              ? `${location.stripQuantity || 0}s`
                                              : `${location.individualQuantity || 0}u`
                                          })
                                        </span>
                                      </div>
                                    ))}
                                    {medicine.rackLocations.length > 2 && (
                                      <div className="text-xs text-gray-500">
                                        +{medicine.rackLocations.length - 2} more
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1 text-gray-400">
                                    <MapPin className="h-3 w-3" />
                                    <span className="text-xs">No location assigned</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewMedicine(medicine)}
                                  className="text-green-600 hover:text-green-900"
                                  title="View Medicine Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditMedicine(medicine)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit Medicine"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMedicine(medicine)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Medicine"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          No medicines found
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
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
            </>
          )}

          {/* Barcode Scanner Tab */}
          {activeTab === 'barcode' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Barcode Scanner</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Scan or enter barcode numbers to quickly find and manage medicines.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Barcode
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    onKeyPress={handleBarcodeInput}
                    placeholder="Scan or type barcode..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={() => scanBarcode(scannedBarcode)}
                    disabled={!scannedBarcode}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <Scan className="h-4 w-4 mr-2 inline" />
                    Search
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Scan className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-blue-800">Barcode Scanning Tips</h4>
                </div>
                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>Use a barcode scanner for quick input</li>
                  <li>Press Enter after typing a barcode manually</li>
                  <li>Ensure good lighting for scanner accuracy</li>
                  <li>Clean barcode surface if scanning fails</li>
                </ul>
              </div>
            </div>
          )}

          {/* Batch Management Tab */}
          {activeTab === 'batches' && (
            <div>
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 text-left">Batch Management</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={migrateMedicineBatches}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      title="Import batch data from medicines that have batch numbers"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import from Medicines
                    </button>
                    <button
                      onClick={() => setShowBatchModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Batch
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="text-sm font-medium text-green-800">Active Batches</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-2">{batchStats.active}</p>
                    <p className="text-xs text-green-600">Currently in stock</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      <h4 className="text-sm font-medium text-yellow-800">Expiring Soon</h4>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900 mt-2">{batchStats.expiring}</p>
                    <p className="text-xs text-yellow-600">Next 30 days</p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                      <h4 className="text-sm font-medium text-red-800">Expired</h4>
                    </div>
                    <p className="text-2xl font-bold text-red-900 mt-2">{batchStats.expired}</p>
                    <p className="text-xs text-red-600">Needs attention</p>
                  </div>
                </div>

                {/* Batch Filters and Sorting */}
                <div className="mb-4 flex flex-wrap gap-4 items-center">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      value={batchSortBy || 'expiryDate'}
                      onChange={(e) => setBatchSortBy(e.target.value)}
                    >
                      <option value="expiryDate">Expiry Date (FEFO)</option>
                      <option value="manufacturingDate">Manufacturing Date (FIFO)</option>
                      <option value="batchNumber">Batch Number</option>
                      <option value="createdAt">Date Added</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Filter:</label>
                    <select
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      value={batchFilter || 'all'}
                      onChange={(e) => setBatchFilter(e.target.value)}
                    >
                      <option value="all">All Batches</option>
                      <option value="active">Active Only</option>
                      <option value="expiring">Expiring Soon</option>
                      <option value="expired">Expired</option>
                      <option value="low-stock">Low Stock</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Search:</label>
                    <input
                      type="text"
                      placeholder="Search batches..."
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm w-48"
                      value={batchSearch}
                      onChange={(e) => setBatchSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Search batches..."
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      value={batchSearch || ''}
                      onChange={(e) => setBatchSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Medicine
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Manufacturing
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {batchLoading ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                            Loading batches...
                          </td>
                        </tr>
                      ) : batches.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <h3 className="text-sm font-medium text-gray-900 mb-2">No batches found</h3>
                              <p className="text-sm text-gray-500 mb-4">
                                If you have medicines with batch numbers, try importing them first.
                              </p>
                              <div className="flex justify-center space-x-3">
                                <button
                                  onClick={migrateMedicineBatches}
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  Import from Medicines
                                </button>
                                <button
                                  onClick={updateBatchStorageLocations}
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                  title="Update storage locations from rack assignments"
                                >
                                  Update Locations
                                </button>
                                <button
                                  onClick={() => setShowBatchModal(true)}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                >
                                  Add New Batch
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        (() => {
                          // Filter batches based on selected filter
                          const now = new Date();
                          const futureDate = new Date();
                          futureDate.setDate(futureDate.getDate() + 30);

                          let filteredBatches = batches.filter(batch => {
                            const expiryDate = new Date(batch.expiryDate);
                            const hasStock = (batch.stripQuantity > 0) || (batch.individualQuantity > 0);

                            // Apply search filter first
                            if (batchSearch) {
                              const searchLower = batchSearch.toLowerCase();
                              const matchesSearch =
                                batch.medicine?.name?.toLowerCase().includes(searchLower) ||
                                batch.medicine?.manufacturer?.toLowerCase().includes(searchLower) ||
                                batch.batchNumber?.toLowerCase().includes(searchLower);
                              if (!matchesSearch) return false;
                            }

                            // Apply status filter
                            switch (batchFilter) {
                              case 'expired':
                                return expiryDate < now;
                              case 'expiring':
                                return expiryDate >= now && expiryDate <= futureDate;
                              case 'active':
                                return expiryDate > futureDate && hasStock;
                              case 'low-stock':
                                return (batch.stripQuantity <= 5 && batch.individualQuantity <= 10) && hasStock;
                              case 'all':
                              default:
                                return true;
                            }
                          });

                          // Sort filtered batches
                          filteredBatches.sort((a, b) => {
                            if (batchSortBy === 'expiryDate') {
                              return new Date(a.expiryDate) - new Date(b.expiryDate);
                            } else if (batchSortBy === 'manufacturingDate') {
                              return new Date(a.manufacturingDate) - new Date(b.manufacturingDate);
                            } else if (batchSortBy === 'medicine') {
                              return (a.medicine?.name || '').localeCompare(b.medicine?.name || '');
                            }
                            return 0;
                          });

                          return filteredBatches.map((batch, index) => {
                            const expiryDate = new Date(batch.expiryDate);

                            let expiryStatus = 'fresh';
                            let expiryColor = 'text-green-600';
                            let priorityBadge = '';
                            let priorityColor = 'bg-green-100 text-green-800';

                            if (expiryDate < now) {
                              expiryStatus = 'expired';
                              expiryColor = 'text-red-600';
                              priorityBadge = 'EXPIRED';
                              priorityColor = 'bg-red-100 text-red-800';
                            } else if (expiryDate <= futureDate) {
                              expiryStatus = 'expiring';
                              expiryColor = 'text-yellow-600';
                              priorityBadge = 'URGENT';
                              priorityColor = 'bg-yellow-100 text-yellow-800';
                            } else {
                              // Determine FIFO/FEFO priority
                              if (index < 3) {
                                priorityBadge = batchSortBy === 'expiryDate' ? 'FEFO' : 'FIFO';
                                priorityColor = 'bg-blue-100 text-blue-800';
                              } else {
                                priorityBadge = 'NORMAL';
                                priorityColor = 'bg-gray-100 text-gray-800';
                              }
                            }

                          const stockText = [];
                          if (batch.stripQuantity > 0) stockText.push(`${batch.stripQuantity} strips`);
                          if (batch.individualQuantity > 0) stockText.push(`${batch.individualQuantity} units`);

                          return (
                            <tr key={batch._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColor}`}>
                                  {priorityBadge}
                                </span>
                                {index < 3 && expiryStatus === 'fresh' && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    Use first
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div>
                                  <div className="font-medium">{batch.medicine.name}</div>
                                  <div className="text-xs text-gray-500">{batch.medicine.manufacturer}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {batch.batchNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(batch.manufacturingDate).toLocaleDateString()}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${expiryColor}`}>
                                {expiryDate.toLocaleDateString()}
                                {expiryStatus === 'expired' && (
                                  <div className="text-xs text-red-500">Expired</div>
                                )}
                                {expiryStatus === 'expiring' && (
                                  <div className="text-xs text-yellow-500">Expiring Soon</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {stockText.length > 0 ? stockText.join(', ') : 'No stock'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {batch.storageLocation || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingBatch({...batch});
                                      setShowEditBatchModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit batch"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setBatchToDelete(batch);
                                      setShowDeleteBatchModal(true);
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete batch"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                        })()
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add Medicine Tab */}
          {activeTab === 'add' && (
            <div>
              {/* Add Medicine Method Selection */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Add Medicine to Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 hover:border-green-400 cursor-pointer transition-colors">
                    <div className="text-center">
                      <Search className="mx-auto h-12 w-12 text-green-600 mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Search Master Medicine</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Find from our master medicine database with pre-filled information
                      </p>
                      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                        <Search className="h-4 w-4 mr-2" />
                        Search Database
                      </button>
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 hover:border-blue-400 cursor-pointer transition-colors">
                    <div className="text-center">
                      <Plus className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Add Custom Medicine</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Manually enter complete medicine information for new products
                      </p>
                      <button 
                        onClick={startCustomMedicineMode}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Custom
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Medicine Search Interface */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 text-left">Search Master Medicines</h4>
                
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={masterMedicineSearch}
                      onChange={(e) => setMasterMedicineSearch(e.target.value)}
                      placeholder="Search by medicine name, composition, or manufacturer..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                    {masterMedicineLoading && (
                      <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5 animate-spin" />
                    )}
                  </div>
                </div>

                {/* Search Results */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {masterMedicineSearch && masterMedicines.length === 0 && !masterMedicineLoading && (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search terms.
                      </p>
                    </div>
                  )}
                  
                  {!masterMedicineSearch && (
                    <div className="text-center py-8">
                      <Search className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Search for medicines</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Start typing to search for master medicines.
                      </p>
                    </div>
                  )}

                  {masterMedicines.map((medicine, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <Package className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 text-left">{medicine.name}</h5>
                              <p className="text-sm text-gray-600 text-left">{medicine.composition}</p>
                              <p className="text-xs text-gray-500 text-left">{medicine.manufacturer} • {medicine.category}</p>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {supportsCutting(medicine) ? 'Cut Medicine' :
                               medicine.unitTypes?.hasStrips ? 'Strip Only' : 'Individual Only'}
                            </span>
                            {medicine.unitTypes?.hasStrips && (
                              <span className="text-xs text-gray-600">
                                {medicine.unitTypes?.unitsPerStrip || 10} units/strip
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <button 
                            onClick={() => selectMasterMedicine(medicine)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Select
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Medicine Form (shown when medicine selected or custom option chosen) */}
              {(selectedMasterMedicine || isCustomMode) && (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-medium text-gray-900 text-left">
                      {isCustomMode ? 'Add Custom Medicine' : 'Medicine Details & Pricing'}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {selectedMasterMedicine && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Selected: {editableMasterMedicineData.name || selectedMasterMedicine.name}
                      </span>
                      )}
                      {isCustomMode && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Custom Medicine Mode
                        </span>
                      )}
                      <button
                        onClick={isCustomMode ? cancelCustomMode : () => setSelectedMasterMedicine(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                                <form onSubmit={isCustomMode ? handleCustomMedicineSubmit : handleMasterMedicineSubmit} className="space-y-8">
                  
                  {/* Basic Medicine Information */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Package className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 text-left">Basic Medicine Information</h3>
                    </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Medicine Name */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Medicine Name *
                        </label>
                        <input
                          type="text"
                          value={isCustomMode ? customMedicineData.name : editableMasterMedicineData.name}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('name', e.target.value) : handleEditableMasterMedicineChange('name', e.target.value)}
                          required
                          placeholder="e.g., Paracetamol 500mg"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Generic Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Generic Name
                        </label>
                      <input
                        type="text"
                          value={isCustomMode ? customMedicineData.genericName : editableMasterMedicineData.genericName}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('genericName', e.target.value) : handleEditableMasterMedicineChange('genericName', e.target.value)}
                          placeholder="e.g., Acetaminophen"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                      {/* Manufacturer */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Manufacturer *
                        </label>
                      <input
                        type="text"
                          value={isCustomMode ? customMedicineData.manufacturer : editableMasterMedicineData.manufacturer}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('manufacturer', e.target.value) : handleEditableMasterMedicineChange('manufacturer', e.target.value)}
                          required
                          placeholder="e.g., Sun Pharmaceuticals"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                      {/* Composition */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Composition *
                        </label>
                        <textarea
                          rows={3}
                          value={isCustomMode ? customMedicineData.composition : editableMasterMedicineData.composition}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('composition', e.target.value) : handleEditableMasterMedicineChange('composition', e.target.value)}
                          required
                          placeholder="e.g., Paracetamol 500mg per tablet"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Classification */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Settings className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 text-left">Classification</h3>
                    </div>

                    <div className="space-y-6">
                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Category *
                        </label>
                        <select
                          value={isCustomMode ? customMedicineData.category : editableMasterMedicineData.category}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('category', e.target.value) : handleEditableMasterMedicineChange('category', e.target.value)}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Category</option>
                          <option value="Tablet">Tablet</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Injection">Injection</option>
                          <option value="Drops">Drops</option>
                          <option value="Cream">Cream</option>
                          <option value="Ointment">Ointment</option>
                          <option value="Powder">Powder</option>
                          <option value="Inhaler">Inhaler</option>
                          <option value="Spray">Spray</option>
                          <option value="Gel">Gel</option>
                          <option value="Lotion">Lotion</option>
                          <option value="Solution">Solution</option>
                          <option value="Suspension">Suspension</option>
                          <option value="Patch">Patch</option>
                          <option value="Suppository">Suppository</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Requires Prescription */}
                      <div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="requiresPrescription"
                            checked={isCustomMode ? customMedicineData.requiresPrescription : (editableMasterMedicineData.requiresPrescription || false)}
                            onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('requiresPrescription', e.target.checked) : handleEditableMasterMedicineChange('requiresPrescription', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="requiresPrescription" className="text-sm font-medium text-gray-700">
                            Requires Prescription
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Custom Mode Categories */}
                  {isCustomMode && (
                    <div className="bg-white rounded-lg border p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Settings className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 text-left">Classification</h3>
                      </div>

                      <div className="space-y-6">
                        {/* Categories */}
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                            Categories *
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {medicineCategories.map((category) => (
                              <label key={category} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={customMedicineData.categories.includes(category)}
                                  onChange={() => handleCategorySelection(category)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{category}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Prescription Requirement */}
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="requiresPrescription"
                            checked={customMedicineData.requiresPrescription}
                            onChange={(e) => handleCustomMedicineInputChange('requiresPrescription', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="requiresPrescription" className="text-sm font-medium text-gray-700">
                            Requires Prescription
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dosage Information */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Pill className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 text-left">Dosage Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Strength */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Strength
                        </label>
                        <input
                          type="text"
                          value={isCustomMode ? customMedicineData.dosage.strength : editableMasterMedicineData.dosage.strength}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('dosage.strength', e.target.value) : handleEditableMasterMedicineChange('dosage.strength', e.target.value)}
                          placeholder="e.g., 500mg, 10ml"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Form */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Form
                        </label>
                        <input
                          type="text"
                          value={isCustomMode ? customMedicineData.dosage.form : editableMasterMedicineData.dosage.form}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('dosage.form', e.target.value) : handleEditableMasterMedicineChange('dosage.form', e.target.value)}
                          placeholder="e.g., Tablet, Capsule, Syrup"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Frequency */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Frequency
                        </label>
                        <input
                          type="text"
                          value={isCustomMode ? customMedicineData.dosage.frequency : editableMasterMedicineData.dosage.frequency}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('dosage.frequency', e.target.value) : handleEditableMasterMedicineChange('dosage.frequency', e.target.value)}
                          placeholder="e.g., Twice daily, As needed"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Custom Mode Dosage */}
                  {isCustomMode && (
                    <div className="bg-white rounded-lg border p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Pill className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 text-left">Dosage Information</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                            Strength
                          </label>
                      <input
                        type="text"
                            value={customMedicineData.dosage.strength}
                            onChange={(e) => handleCustomMedicineInputChange('dosage.strength', e.target.value)}
                            placeholder="e.g., 500mg, 10ml"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                            Form
                          </label>
                          <select
                            value={customMedicineData.dosage.form}
                            onChange={(e) => handleCustomMedicineInputChange('dosage.form', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select form</option>
                            {medicineForms.map((form) => (
                              <option key={form} value={form}>{form}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                            Frequency
                          </label>
                      <input
                        type="text"
                            value={customMedicineData.dosage.frequency}
                            onChange={(e) => handleCustomMedicineInputChange('dosage.frequency', e.target.value)}
                            placeholder="e.g., Twice daily, As needed"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                    </div>
                  )}

                  {/* Storage Conditions */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Thermometer className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 text-left">Storage Conditions</h3>
                    </div>

                    <div className="space-y-6">
                      {/* Temperature Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                          Temperature Range
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Min Temperature</label>
                            <input
                              type="number"
                              value={isCustomMode ? customMedicineData.storageConditions.temperature.min : editableMasterMedicineData.storageConditions.temperature.min}
                              onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('storageConditions.temperature.min', e.target.value) : handleEditableMasterMedicineChange('storageConditions.temperature.min', e.target.value)}
                              placeholder="e.g., 2"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Max Temperature</label>
                            <input
                              type="number"
                              value={isCustomMode ? customMedicineData.storageConditions.temperature.max : editableMasterMedicineData.storageConditions.temperature.max}
                              onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('storageConditions.temperature.max', e.target.value) : handleEditableMasterMedicineChange('storageConditions.temperature.max', e.target.value)}
                              placeholder="e.g., 8"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                            <select
                              value={isCustomMode ? customMedicineData.storageConditions.temperature.unit : editableMasterMedicineData.storageConditions.temperature.unit}
                              onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('storageConditions.temperature.unit', e.target.value) : handleEditableMasterMedicineChange('storageConditions.temperature.unit', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="celsius">Celsius</option>
                              <option value="fahrenheit">Fahrenheit</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Humidity Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                          Humidity Range (%)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Min Humidity</label>
                            <input
                              type="number"
                              value={isCustomMode ? customMedicineData.storageConditions.humidity.min : editableMasterMedicineData.storageConditions.humidity.min}
                              onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('storageConditions.humidity.min', e.target.value) : handleEditableMasterMedicineChange('storageConditions.humidity.min', e.target.value)}
                              placeholder="e.g., 45"
                              min="0"
                              max="100"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Max Humidity</label>
                            <input
                              type="number"
                              value={isCustomMode ? customMedicineData.storageConditions.humidity.max : editableMasterMedicineData.storageConditions.humidity.max}
                              onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('storageConditions.humidity.max', e.target.value) : handleEditableMasterMedicineChange('storageConditions.humidity.max', e.target.value)}
                              placeholder="e.g., 65"
                              min="0"
                              max="100"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Special Conditions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                          Special Storage Conditions
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {['Keep in refrigerator', 'Store in cool, dry place', 'Protect from light', 'Keep away from children', 'Do not freeze', 'Store upright', 'Shake well before use'].map((condition) => (
                            <label key={condition} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isCustomMode ? customMedicineData.storageConditions.specialConditions.includes(condition) : editableMasterMedicineData.storageConditions.specialConditions.includes(condition)}
                                onChange={() => isCustomMode ? handleSpecialConditionToggle(condition) : handleEditableMasterMedicineSpecialConditionToggle(condition)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{condition}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Custom Mode Storage */}
                  {isCustomMode && (
                    <div className="bg-white rounded-lg border p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Thermometer className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 text-left">Storage Conditions</h3>
                      </div>

                      <div className="space-y-6">
                        {/* Temperature */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                            Temperature Range
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Min Temperature</label>
                              <input
                                type="number"
                                value={customMedicineData.storageConditions.temperature.min}
                                onChange={(e) => handleCustomMedicineInputChange('storageConditions.temperature.min', e.target.value)}
                                placeholder="e.g., 2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Max Temperature</label>
                              <input
                                type="number"
                                value={customMedicineData.storageConditions.temperature.max}
                                onChange={(e) => handleCustomMedicineInputChange('storageConditions.temperature.max', e.target.value)}
                                placeholder="e.g., 8"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                              <select
                                value={customMedicineData.storageConditions.temperature.unit}
                                onChange={(e) => handleCustomMedicineInputChange('storageConditions.temperature.unit', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="celsius">Celsius</option>
                                <option value="fahrenheit">Fahrenheit</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Humidity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                            Humidity Range (%)
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Min Humidity</label>
                              <input
                                type="number"
                                value={customMedicineData.storageConditions.humidity.min}
                                onChange={(e) => handleCustomMedicineInputChange('storageConditions.humidity.min', e.target.value)}
                                placeholder="e.g., 45"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Max Humidity</label>
                              <input
                                type="number"
                                value={customMedicineData.storageConditions.humidity.max}
                                onChange={(e) => handleCustomMedicineInputChange('storageConditions.humidity.max', e.target.value)}
                                placeholder="e.g., 65"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Special Conditions */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                            Special Storage Conditions
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {specialConditionsOptions.map((condition) => (
                              <label key={condition} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={customMedicineData.storageConditions.specialConditions.includes(condition)}
                                  onChange={() => handleSpecialConditionToggle(condition)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{condition}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Medical Information */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <AlertTriangle className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 text-left">Medical Information</h3>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Side Effects
                        </label>
                        <textarea
                          rows={3}
                          value={isCustomMode ? customMedicineData.sideEffects : editableMasterMedicineData.sideEffects}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('sideEffects', e.target.value) : handleEditableMasterMedicineChange('sideEffects', e.target.value)}
                          placeholder="List common side effects, separated by commas"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Contraindications
                        </label>
                        <textarea
                          rows={3}
                          value={isCustomMode ? customMedicineData.contraindications : editableMasterMedicineData.contraindications}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('contraindications', e.target.value) : handleEditableMasterMedicineChange('contraindications', e.target.value)}
                          placeholder="List contraindications, separated by commas"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                          Drug Interactions
                        </label>
                        <textarea
                          rows={3}
                          value={isCustomMode ? customMedicineData.interactions : editableMasterMedicineData.interactions}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('interactions', e.target.value) : handleEditableMasterMedicineChange('interactions', e.target.value)}
                          placeholder="List known drug interactions, separated by commas"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Custom Mode Medical Info */}
                  {isCustomMode && (
                    <div className="bg-white rounded-lg border p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <AlertTriangle className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 text-left">Medical Information</h3>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                            Side Effects
                          </label>
                          <textarea
                            rows={3}
                            value={customMedicineData.sideEffects}
                            onChange={(e) => handleCustomMedicineInputChange('sideEffects', e.target.value)}
                            placeholder="List common side effects, separated by commas"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                            Contraindications
                          </label>
                          <textarea
                            rows={3}
                            value={customMedicineData.contraindications}
                            onChange={(e) => handleCustomMedicineInputChange('contraindications', e.target.value)}
                            placeholder="List contraindications, separated by commas"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                            Drug Interactions
                          </label>
                          <textarea
                            rows={3}
                            value={customMedicineData.interactions}
                            onChange={(e) => handleCustomMedicineInputChange('interactions', e.target.value)}
                            placeholder="List known drug interactions, separated by commas"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dual Unit Configuration */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Package className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 text-left">Unit Configuration & Pricing</h3>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      {!isCustomMode && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center">
                            <Info className="h-4 w-4 text-green-600 mr-2" />
                            <p className="text-sm text-green-800">
                              Unit configuration pre-filled from master medicine. You can modify these settings as needed for your store.
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="hasStrips"
                              checked={isCustomMode ? customMedicineData.unitTypes.hasStrips : editableMasterMedicineData.unitTypes.hasStrips}
                              onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('unitTypes.hasStrips', e.target.checked) : handleEditableMasterMedicineChange('unitTypes.hasStrips', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="hasStrips" className="ml-2 text-sm font-medium text-gray-700">
                              Enable Strip Sales
                            </label>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="hasIndividual"
                              checked={isCustomMode ? customMedicineData.unitTypes.hasIndividual : editableMasterMedicineData.unitTypes.hasIndividual}
                              onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('unitTypes.hasIndividual', e.target.checked) : handleEditableMasterMedicineChange('unitTypes.hasIndividual', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="hasIndividual" className="ml-2 text-sm font-medium text-gray-700">
                              Enable Individual Sales
                            </label>
                          </div>

                          {((isCustomMode && customMedicineData.unitTypes.hasStrips) || (!isCustomMode && editableMasterMedicineData.unitTypes.hasStrips)) && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Units per Strip</label>
                              <input
                                type="number"
                                value={isCustomMode ? customMedicineData.unitTypes.unitsPerStrip : editableMasterMedicineData.unitTypes.unitsPerStrip}
                                onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('unitTypes.unitsPerStrip', parseInt(e.target.value) || 10) : handleEditableMasterMedicineChange('unitTypes.unitsPerStrip', parseInt(e.target.value) || 10)}
                                min="1"
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Strip Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {((isCustomMode && customMedicineData.unitTypes.hasStrips) || (!isCustomMode && editableMasterMedicineData.unitTypes?.hasStrips)) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h6 className="text-sm font-medium text-green-900 mb-3 text-left">Strip Pricing & Stock</h6>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">Purchase Price *</label>
                              <input
                                type="number"
                                  step="0.01"
                                  value={isCustomMode ? customMedicineData.stripInfo.purchasePrice : masterMedicineInventoryData.stripInfo.purchasePrice}
                                  onChange={createNumericInputHandler(
                                    isCustomMode ?
                                      (value) => handleCustomMedicineInputChange('stripInfo.purchasePrice', value) :
                                      (value) => handleMasterMedicineInventoryChange('stripInfo.purchasePrice', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                placeholder="0.00"
                                  required={((isCustomMode && customMedicineData.unitTypes.hasStrips) || (!isCustomMode && editableMasterMedicineData.unitTypes?.hasStrips))}
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">Selling Price *</label>
                              <input
                                type="number"
                                  step="0.01"
                                  value={isCustomMode ? customMedicineData.stripInfo.sellingPrice : masterMedicineInventoryData.stripInfo.sellingPrice}
                                  onChange={createNumericInputHandler(
                                    isCustomMode ?
                                      (value) => handleCustomMedicineInputChange('stripInfo.sellingPrice', value) :
                                      (value) => handleMasterMedicineInventoryChange('stripInfo.sellingPrice', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                placeholder="0.00"
                                  required={((isCustomMode && customMedicineData.unitTypes.hasStrips) || (!isCustomMode && editableMasterMedicineData.unitTypes?.hasStrips))}
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">MRP</label>
                              <input
                                type="number"
                                  step="0.01"
                                  value={isCustomMode ? customMedicineData.stripInfo.mrp : masterMedicineInventoryData.stripInfo.mrp}
                                  onChange={createNumericInputHandler(
                                    isCustomMode ?
                                      (value) => handleCustomMedicineInputChange('stripInfo.mrp', value) :
                                      (value) => handleMasterMedicineInventoryChange('stripInfo.mrp', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                placeholder="0.00"
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">Initial Stock</label>
                              <input
                                type="number"
                                  value={isCustomMode ? customMedicineData.stripInfo.stock : masterMedicineInventoryData.stripInfo.stock}
                                  onChange={createNumericInputHandler(
                                    isCustomMode ?
                                      (value) => handleCustomMedicineInputChange('stripInfo.stock', value) :
                                      (value) => handleMasterMedicineInventoryChange('stripInfo.stock', value),
                                    null,
                                    VALIDATION_OPTIONS.QUANTITY
                                  )}
                                placeholder="0"
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">Min Stock Level</label>
                              <input
                                type="number"
                                  value={isCustomMode ? customMedicineData.stripInfo.minStock : masterMedicineInventoryData.stripInfo.minStock}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 5;
                                    if (isCustomMode) {
                                      handleCustomMedicineInputChange('stripInfo.minStock', value);
                                    } else {
                                      handleMasterMedicineInventoryChange('stripInfo.minStock', value);
                                    }
                                  }}
                                placeholder="5"
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">Reorder Level</label>
                              <input
                                type="number"
                                  value={isCustomMode ? customMedicineData.stripInfo.reorderLevel : masterMedicineInventoryData.stripInfo.reorderLevel}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 10;
                                    if (isCustomMode) {
                                      handleCustomMedicineInputChange('stripInfo.reorderLevel', value);
                                    } else {
                                      handleMasterMedicineInventoryChange('stripInfo.reorderLevel', value);
                                    }
                                  }}
                                placeholder="10"
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      )}

                      {((isCustomMode && customMedicineData.unitTypes.hasIndividual) || (!isCustomMode && editableMasterMedicineData.unitTypes?.hasIndividual)) && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h6 className="text-sm font-medium text-purple-900 mb-3 text-left">
                          {isCustomMode
                            ? getIndividualUnitsLabel(customMedicineData)
                            : (editableMasterMedicineData ? getIndividualUnitsLabel(editableMasterMedicineData) : 'Individual Unit')
                          } Pricing & Stock
                        </h6>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">Purchase Price *</label>
                              <input
                                type="number"
                                  step="0.01"
                                  value={isCustomMode ? customMedicineData.individualInfo.purchasePrice : masterMedicineInventoryData.individualInfo.purchasePrice}
                                  onChange={createNumericInputHandler(
                                    isCustomMode ?
                                      (value) => handleCustomMedicineInputChange('individualInfo.purchasePrice', value) :
                                      (value) => handleMasterMedicineInventoryChange('individualInfo.purchasePrice', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                placeholder="0.00"
                                  required={((isCustomMode && customMedicineData.unitTypes.hasIndividual) || (!isCustomMode && editableMasterMedicineData.unitTypes?.hasIndividual))}
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">Selling Price *</label>
                              <input
                                type="number"
                                  step="0.01"
                                  value={isCustomMode ? customMedicineData.individualInfo.sellingPrice : masterMedicineInventoryData.individualInfo.sellingPrice}
                                  onChange={createNumericInputHandler(
                                    isCustomMode ?
                                      (value) => handleCustomMedicineInputChange('individualInfo.sellingPrice', value) :
                                      (value) => handleMasterMedicineInventoryChange('individualInfo.sellingPrice', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                placeholder="0.00"
                                  required={((isCustomMode && customMedicineData.unitTypes.hasIndividual) || (!isCustomMode && editableMasterMedicineData.unitTypes?.hasIndividual))}
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">MRP</label>
                              <input
                                type="number"
                                  step="0.01"
                                  value={isCustomMode ? customMedicineData.individualInfo.mrp : masterMedicineInventoryData.individualInfo.mrp}
                                  onChange={createNumericInputHandler(
                                    isCustomMode ?
                                      (value) => handleCustomMedicineInputChange('individualInfo.mrp', value) :
                                      (value) => handleMasterMedicineInventoryChange('individualInfo.mrp', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                placeholder="0.00"
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">Initial Stock</label>
                              <input
                                type="number"
                                  value={isCustomMode ? customMedicineData.individualInfo.stock : masterMedicineInventoryData.individualInfo.stock}
                                  onChange={createNumericInputHandler(
                                    isCustomMode ?
                                      (value) => handleCustomMedicineInputChange('individualInfo.stock', value) :
                                      (value) => handleMasterMedicineInventoryChange('individualInfo.stock', value),
                                    null,
                                    VALIDATION_OPTIONS.QUANTITY
                                  )}
                                placeholder="0"
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">Min Stock Level</label>
                              <input
                                type="number"
                                  value={isCustomMode ? customMedicineData.individualInfo.minStock : masterMedicineInventoryData.individualInfo.minStock}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 50;
                                    if (isCustomMode) {
                                      handleCustomMedicineInputChange('individualInfo.minStock', value);
                                    } else {
                                      handleMasterMedicineInventoryChange('individualInfo.minStock', value);
                                    }
                                  }}
                                placeholder="50"
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 text-left">Reorder Level</label>
                              <input
                                type="number"
                                  value={isCustomMode ? customMedicineData.individualInfo.reorderLevel : masterMedicineInventoryData.individualInfo.reorderLevel}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 100;
                                    if (isCustomMode) {
                                      handleCustomMedicineInputChange('individualInfo.reorderLevel', value);
                                    } else {
                                      handleMasterMedicineInventoryChange('individualInfo.reorderLevel', value);
                                    }
                                  }}
                                placeholder="100"
                                className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Info className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 text-left">Additional Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 text-left">Supplier</label>
                        {isCustomMode ? (
                          <div className="relative">
                            <input
                              type="text"
                              value={customMedicineData.supplier}
                              onChange={(e) => handleSupplierInputChange(e.target.value)}
                              onFocus={() => setShowSupplierDropdown(customMedicineData.supplier.length > 0)}
                              onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                              placeholder="Search and select supplier or type new supplier name"
                              className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-1">
                              {supplierSearchLoading ? (
                                <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            
                            {/* Supplier Dropdown */}
                            {showSupplierDropdown && suppliers.length > 0 && (
                              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {suppliers.map((supplier) => (
                                  <div
                                    key={supplier._id}
                                    onClick={() => selectSupplier(supplier)}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                                        <div className="text-xs text-gray-500">{supplier.address?.city || ''}</div>
                                      </div>
                                      <div className="text-xs text-gray-400">{supplier.phone}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              value={selectedSupplier}
                              onChange={(e) => handleSupplierInputChange(e.target.value)}
                              onFocus={() => setShowSupplierDropdown(selectedSupplier.length > 0)}
                              onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                              placeholder="Search and select supplier or type new supplier name"
                              className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />

                            {supplierSearchLoading && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                              </div>
                            )}

                            {/* Supplier Dropdown for non-custom mode */}
                            {showSupplierDropdown && suppliers.length > 0 && (
                              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {suppliers.map((supplier) => (
                                  <div
                                    key={supplier._id}
                                    onClick={() => selectSupplier(supplier)}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                                        <div className="text-xs text-gray-500">{supplier.address?.city || ''}</div>
                                      </div>
                                      <div className="text-xs text-gray-400">{supplier.phone}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Storage Location</label>
                        <input
                          type="text"
                          value={isCustomMode ? customMedicineData.storageLocation : masterMedicineInventoryData.storageLocation}
                          onChange={(e) => {
                            if (isCustomMode) {
                              handleCustomMedicineInputChange('storageLocation', e.target.value);
                            } else {
                              handleMasterMedicineInventoryChange('storageLocation', e.target.value);
                            }
                          }}
                          placeholder="e.g., A1-01, Freezer-02"
                          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${
                            isCustomMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-green-500 focus:border-green-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Batch Number</label>
                        <input
                          type="text"
                          value={isCustomMode ? customMedicineData.batchNumber : masterMedicineInventoryData.batchNumber}
                          onChange={(e) => {
                            if (isCustomMode) {
                              handleCustomMedicineInputChange('batchNumber', e.target.value);
                            } else {
                              handleMasterMedicineInventoryChange('batchNumber', e.target.value);
                            }
                          }}
                          placeholder="Enter batch number"
                          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${
                            isCustomMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-green-500 focus:border-green-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Expiry Date</label>
                        <input
                          type="date"
                          value={isCustomMode ? customMedicineData.expiryDate : masterMedicineInventoryData.expiryDate}
                          onChange={(e) => {
                            if (isCustomMode) {
                              handleCustomMedicineInputChange('expiryDate', e.target.value);
                            } else {
                              handleMasterMedicineInventoryChange('expiryDate', e.target.value);
                            }
                          }}
                          className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${
                            isCustomMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-green-500 focus:border-green-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Barcode</label>
                        <input
                          type="text"
                          value={isCustomMode ? customMedicineData.barcode : editableMasterMedicineData.barcode}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('barcode', e.target.value) : handleEditableMasterMedicineChange('barcode', e.target.value)}
                          placeholder="Enter barcode (optional)"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Tags</label>
                        <input
                          type="text"
                          value={isCustomMode ? customMedicineData.tags : editableMasterMedicineData.tags}
                          onChange={(e) => isCustomMode ? handleCustomMedicineInputChange('tags', e.target.value) : handleEditableMasterMedicineChange('tags', e.target.value)}
                          placeholder="Enter tags separated by commas (e.g., fever, pain relief)"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 text-left">Notes</label>
                      <textarea
                        rows={3}
                        value={isCustomMode ? customMedicineData.notes : masterMedicineInventoryData.notes}
                        onChange={(e) => {
                          if (isCustomMode) {
                            handleCustomMedicineInputChange('notes', e.target.value);
                          } else {
                            handleMasterMedicineInventoryChange('notes', e.target.value);
                          }
                        }}
                        placeholder="Any additional notes about this medicine..."
                        className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none ${
                          isCustomMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-green-500 focus:border-green-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        if (isCustomMode) {
                          cancelCustomMode();
                        } else {
                          setSelectedMasterMedicine(null);
                        }
                        setActiveTab('list');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    {!isCustomMode && (
                    <button
                      type="button"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-2 inline" />
                      Preview
                    </button>
                    )}
                    <button
                      type="submit"
                      disabled={customMedicineLoading}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        customMedicineLoading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : isCustomMode 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {customMedicineLoading ? (
                        <RefreshCw className="h-4 w-4 mr-2 inline animate-spin" />
                      ) : (
                      <Plus className="h-4 w-4 mr-2 inline" />
                      )}
                      {customMedicineLoading 
                        ? 'Adding...' 
                        : isCustomMode 
                          ? 'Add Custom Medicine' 
                          : 'Add to Inventory'
                      }
                    </button>
                  </div>
                </form>
                </div>
              )}
            </div>
          )}

          {/* Medicine Details Modal */}
          {showMedicineModal && selectedMedicine && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Medicine Details</h3>
                    <button
                      onClick={() => setShowMedicineModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">{selectedMedicine.name}</h4>
                      <p className="text-sm text-gray-600">{selectedMedicine.genericName}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <p className="text-sm text-gray-900">{selectedMedicine.category}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                        <p className="text-sm text-gray-900">{selectedMedicine.manufacturer}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Strip Stock</label>
                        <p className="text-sm text-gray-900">{selectedMedicine.stripInfo?.stock || selectedMedicine.inventory?.stripQuantity || 0}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Individual Stock</label>
                        <p className="text-sm text-gray-900">{selectedMedicine.individualInfo?.stock || selectedMedicine.inventory?.individualQuantity || 0}</p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setShowMedicineModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Close
                      </button>
                      <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                        Edit Medicine
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Edit Medicine Modal */}
          {showEditModal && selectedMedicineForAction && editMedicineData && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Edit Medicine</h3>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleEditMedicineSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Medicine Name *</label>
                        <input
                          type="text"
                          value={editMedicineData.name || ''}
                          onChange={(e) => handleEditMedicineInputChange('name', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Generic Name</label>
                        <input
                          type="text"
                          value={editMedicineData.genericName || ''}
                          onChange={(e) => handleEditMedicineInputChange('genericName', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Composition *</label>
                        <input
                          type="text"
                          value={editMedicineData.composition || ''}
                          onChange={(e) => handleEditMedicineInputChange('composition', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Manufacturer *</label>
                        <input
                          type="text"
                          value={editMedicineData.manufacturer || ''}
                          onChange={(e) => handleEditMedicineInputChange('manufacturer', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category *</label>
                        <select
                          value={editMedicineData.category || ''}
                          onChange={(e) => handleEditMedicineInputChange('category', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="Tablet">Tablet</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Injection">Injection</option>
                          <option value="Drops">Drops</option>
                          <option value="Cream">Cream</option>
                          <option value="Ointment">Ointment</option>
                          <option value="Powder">Powder</option>
                          <option value="Inhaler">Inhaler</option>
                          <option value="Spray">Spray</option>
                          <option value="Gel">Gel</option>
                          <option value="Lotion">Lotion</option>
                          <option value="Solution">Solution</option>
                          <option value="Suspension">Suspension</option>
                          <option value="Patch">Patch</option>
                          <option value="Suppository">Suppository</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Barcode</label>
                        <input
                          type="text"
                          value={editMedicineData.barcode || ''}
                          onChange={(e) => handleEditMedicineInputChange('barcode', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                        <input
                          type="text"
                          value={editMedicineData.batchNumber || ''}
                          onChange={(e) => handleEditMedicineInputChange('batchNumber', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                        <input
                          type="date"
                          value={editMedicineData.expiryDate ? new Date(editMedicineData.expiryDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleEditMedicineInputChange('expiryDate', e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    {/* Medicine Information */}
                    <div className="border-t pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Medicine Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Strength</label>
                          <input
                            type="text"
                            value={editMedicineData.dosage?.strength || ''}
                            onChange={(e) => handleEditMedicineInputChange('dosage.strength', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., 500mg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Form</label>
                          <input
                            type="text"
                            value={editMedicineData.dosage?.form || ''}
                            onChange={(e) => handleEditMedicineInputChange('dosage.form', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., Tablet"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Frequency</label>
                          <input
                            type="text"
                            value={editMedicineData.dosage?.frequency || ''}
                            onChange={(e) => handleEditMedicineInputChange('dosage.frequency', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., Twice daily"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={editMedicineData.requiresPrescription || false}
                              onChange={(e) => handleEditMedicineInputChange('requiresPrescription', e.target.checked)}
                              className="mr-2"
                            />
                            Requires Prescription
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={editMedicineData.isActive !== false}
                              onChange={(e) => handleEditMedicineInputChange('isActive', e.target.checked)}
                              className="mr-2"
                            />
                            Active
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Stock Information */}
                    <div className="border-t pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Stock Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {editMedicineData.unitTypes?.hasStrips && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h5 className="font-medium text-blue-900 mb-3">Strip Information</h5>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Stock</label>
                                <input
                                  type="number"
                                  value={editMedicineData.stripInfo?.stock || ''}
                                  onChange={createNumericInputHandler(
                                    (value) => handleEditMedicineInputChange('stripInfo.stock', value),
                                    null,
                                    VALIDATION_OPTIONS.QUANTITY
                                  )}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Purchase Price (₹)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editMedicineData.stripInfo?.purchasePrice || ''}
                                  onChange={createNumericInputHandler(
                                    (value) => handleEditMedicineInputChange('stripInfo.purchasePrice', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Selling Price (₹)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editMedicineData.stripInfo?.sellingPrice || ''}
                                  onChange={createNumericInputHandler(
                                    (value) => handleEditMedicineInputChange('stripInfo.sellingPrice', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">MRP (₹)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editMedicineData.stripInfo?.mrp || ''}
                                  onChange={createNumericInputHandler(
                                    (value) => handleEditMedicineInputChange('stripInfo.mrp', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Min Stock</label>
                                <input
                                  type="number"
                                  value={editMedicineData.stripInfo?.minStock || 0}
                                  onChange={(e) => handleEditMedicineInputChange('stripInfo.minStock', parseInt(e.target.value) || 0)}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
                                <input
                                  type="number"
                                  value={editMedicineData.stripInfo?.reorderLevel || 0}
                                  onChange={(e) => handleEditMedicineInputChange('stripInfo.reorderLevel', parseInt(e.target.value) || 0)}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {editMedicineData.unitTypes?.hasIndividual && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h5 className="font-medium text-green-900 mb-3">{getIndividualUnitsLabel(editMedicineData)} Information</h5>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Stock ({getIndividualUnitsLabel(editMedicineData)})</label>
                                <input
                                  type="number"
                                  value={editMedicineData.individualInfo?.stock || ''}
                                  onChange={createNumericInputHandler(
                                    (value) => handleEditMedicineInputChange('individualInfo.stock', value),
                                    null,
                                    VALIDATION_OPTIONS.QUANTITY
                                  )}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Purchase Price (₹)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editMedicineData.individualInfo?.purchasePrice || ''}
                                  onChange={createNumericInputHandler(
                                    (value) => handleEditMedicineInputChange('individualInfo.purchasePrice', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Selling Price (₹)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editMedicineData.individualInfo?.sellingPrice || ''}
                                  onChange={createNumericInputHandler(
                                    (value) => handleEditMedicineInputChange('individualInfo.sellingPrice', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">MRP (₹)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editMedicineData.individualInfo?.mrp || ''}
                                  onChange={createNumericInputHandler(
                                    (value) => handleEditMedicineInputChange('individualInfo.mrp', value),
                                    null,
                                    VALIDATION_OPTIONS.PRICE
                                  )}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Min Stock</label>
                                <input
                                  type="number"
                                  value={editMedicineData.individualInfo?.minStock || 0}
                                  onChange={(e) => handleEditMedicineInputChange('individualInfo.minStock', parseInt(e.target.value) || 0)}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
                                <input
                                  type="number"
                                  value={editMedicineData.individualInfo?.reorderLevel || 0}
                                  onChange={(e) => handleEditMedicineInputChange('individualInfo.reorderLevel', parseInt(e.target.value) || 0)}
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="border-t pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Additional Information</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Notes</label>
                          <textarea
                            value={editMedicineData.notes || ''}
                            onChange={(e) => handleEditMedicineInputChange('notes', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            rows="3"
                            placeholder="Additional notes about this medicine..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(editMedicineData.tags) ? editMedicineData.tags.join(', ') : (editMedicineData.tags || '')}
                            onChange={(e) => {
                              const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                              handleEditMedicineInputChange('tags', tags);
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., pain relief, fever, headache"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Side Effects (comma-separated)</label>
                          <textarea
                            value={Array.isArray(editMedicineData.sideEffects) ? editMedicineData.sideEffects.join(', ') : (editMedicineData.sideEffects || '')}
                            onChange={(e) => {
                              const sideEffects = e.target.value.split(',').map(effect => effect.trim()).filter(effect => effect);
                              handleEditMedicineInputChange('sideEffects', sideEffects);
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            rows="2"
                            placeholder="e.g., nausea, dizziness, drowsiness"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Contraindications (comma-separated)</label>
                          <textarea
                            value={Array.isArray(editMedicineData.contraindications) ? editMedicineData.contraindications.join(', ') : (editMedicineData.contraindications || '')}
                            onChange={(e) => {
                              const contraindications = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                              handleEditMedicineInputChange('contraindications', contraindications);
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            rows="2"
                            placeholder="e.g., pregnancy, liver disease, kidney problems"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Drug Interactions (comma-separated)</label>
                          <textarea
                            value={Array.isArray(editMedicineData.interactions) ? editMedicineData.interactions.join(', ') : (editMedicineData.interactions || '')}
                            onChange={(e) => {
                              const interactions = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                              handleEditMedicineInputChange('interactions', interactions);
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            rows="2"
                            placeholder="e.g., warfarin, aspirin, alcohol"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        Update Medicine
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && selectedMedicineForAction && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Medicine</h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete "{selectedMedicineForAction.name}"? This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex justify-center space-x-3 mt-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteMedicine}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Batch Modal */}
          {showBatchModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 text-left">Add New Batch</h3>
                    <button
                      onClick={() => {
                        setShowBatchModal(false);
                        setSelectedBatchMedicine(null);
                        setNewBatch({
                          batchNumber: '',
                          expiryDate: '',
                          manufacturingDate: '',
                          stripQuantity: 0,
                          individualQuantity: 0,
                          storageLocation: '',
                          supplier: ''
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Medicine Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-left">Select Medicine</label>
                      <select
                        value={selectedBatchMedicine?._id || ''}
                        onChange={(e) => {
                          const medicine = medicines.find(m => m._id === e.target.value);
                          setSelectedBatchMedicine(medicine);
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Select a medicine...</option>
                        {medicines.map(medicine => (
                          <option key={medicine._id} value={medicine._id}>
                            {medicine.name} - {medicine.manufacturer}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Batch Number</label>
                        <input
                          type="text"
                          value={newBatch.batchNumber}
                          onChange={(e) => setNewBatch({...newBatch, batchNumber: e.target.value})}
                          placeholder="Enter batch number"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Storage Location</label>
                        <input
                          type="text"
                          value={newBatch.storageLocation}
                          onChange={(e) => setNewBatch({...newBatch, storageLocation: e.target.value})}
                          placeholder="e.g., A1-01"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Manufacturing Date</label>
                        <input
                          type="date"
                          value={newBatch.manufacturingDate}
                          onChange={(e) => setNewBatch({...newBatch, manufacturingDate: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Expiry Date</label>
                        <input
                          type="date"
                          value={newBatch.expiryDate}
                          onChange={(e) => setNewBatch({...newBatch, expiryDate: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Strip Quantity</label>
                        <input
                          type="number"
                          min="0"
                          value={newBatch.stripQuantity}
                          onChange={createNumericInputHandler(
                            (value) => setNewBatch({...newBatch, stripQuantity: value}),
                            null,
                            VALIDATION_OPTIONS.QUANTITY
                          )}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Individual Quantity</label>
                        <input
                          type="number"
                          min="0"
                          value={newBatch.individualQuantity}
                          onChange={createNumericInputHandler(
                            (value) => setNewBatch({...newBatch, individualQuantity: value}),
                            null,
                            VALIDATION_OPTIONS.QUANTITY
                          )}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-left">Supplier</label>
                      <input
                        type="text"
                        value={newBatch.supplier}
                        onChange={(e) => setNewBatch({...newBatch, supplier: e.target.value})}
                        placeholder="Enter supplier name"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowBatchModal(false);
                          setSelectedBatchMedicine(null);
                          setNewBatch({
                            batchNumber: '',
                            expiryDate: '',
                            manufacturingDate: '',
                            stripQuantity: 0,
                            individualQuantity: 0,
                            storageLocation: '',
                            supplier: ''
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addBatch}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        Add Batch
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Batch Modal */}
          {showEditBatchModal && editingBatch && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 text-left">Edit Batch</h3>
                    <button
                      onClick={() => {
                        setShowEditBatchModal(false);
                        setEditingBatch(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Batch Number</label>
                        <input
                          type="text"
                          value={editingBatch.batchNumber}
                          onChange={(e) => setEditingBatch({...editingBatch, batchNumber: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Storage Location</label>
                        <input
                          type="text"
                          value={editingBatch.storageLocation || ''}
                          onChange={(e) => setEditingBatch({...editingBatch, storageLocation: e.target.value})}
                          placeholder="e.g., A1-01"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Manufacturing Date</label>
                        <input
                          type="date"
                          value={editingBatch.manufacturingDate ? new Date(editingBatch.manufacturingDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditingBatch({...editingBatch, manufacturingDate: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Expiry Date</label>
                        <input
                          type="date"
                          value={editingBatch.expiryDate ? new Date(editingBatch.expiryDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditingBatch({...editingBatch, expiryDate: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Strip Quantity</label>
                        <input
                          type="number"
                          min="0"
                          value={editingBatch.stripQuantity}
                          onChange={(e) => setEditingBatch({...editingBatch, stripQuantity: parseInt(e.target.value) || 0})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Individual Quantity</label>
                        <input
                          type="number"
                          min="0"
                          value={editingBatch.individualQuantity}
                          onChange={(e) => setEditingBatch({...editingBatch, individualQuantity: parseInt(e.target.value) || 0})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-left">Supplier</label>
                      <input
                        type="text"
                        value={editingBatch.supplier || ''}
                        onChange={(e) => setEditingBatch({...editingBatch, supplier: e.target.value})}
                        placeholder="Enter supplier name"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowEditBatchModal(false);
                          setEditingBatch(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateBatch}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        Update Batch
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Batch Modal */}
          {showDeleteBatchModal && batchToDelete && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Batch</h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete batch "{batchToDelete.batchNumber}" for {batchToDelete.medicine?.name}? This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex justify-center space-x-3 mt-4">
                    <button
                      onClick={() => {
                        setShowDeleteBatchModal(false);
                        setBatchToDelete(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={deleteBatch}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerInventory;
