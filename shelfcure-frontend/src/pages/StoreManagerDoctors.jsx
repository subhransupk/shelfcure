import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  FileText,
  Star,
  Clock,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';

const StoreManagerDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'


  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorCommissionData, setDoctorCommissionData] = useState(null);
  const [loadingCommissionData, setLoadingCommissionData] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentReference: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'commissions', 'add', 'edit'
  const [submitting, setSubmitting] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [commissionStats, setCommissionStats] = useState({});
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [commissionHistory, setCommissionHistory] = useState([]);
  const [commissionFilter, setCommissionFilter] = useState('all'); // 'all', 'pending', 'paid'
  const [successMessage, setSuccessMessage] = useState('');
  const [commissionDateRange, setCommissionDateRange] = useState('thisMonth'); // 'thisMonth', 'lastMonth', 'thisYear'
  const [doctorNameFilter, setDoctorNameFilter] = useState(''); // Filter by doctor name
  const [commissionRateFilter, setCommissionRateFilter] = useState('all'); // Filter by commission rate
  const [allCommissionHistory, setAllCommissionHistory] = useState([]); // Store all commission data for client-side filtering

  // Form state for adding/editing doctor
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    specialization: '',
    qualification: '',
    experience: '',
    registrationNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    hospital: {
      name: '',
      address: '',
      phone: ''
    },
    commissionRate: '',
    commissionType: 'percentage',
    notes: ''
  });

  useEffect(() => {
    console.log('useEffect triggered with dependencies:', {
      currentPage,
      searchTerm,
      specializationFilter,
      statusFilter
    });

    const timeoutId = setTimeout(() => {
      fetchDoctors();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, specializationFilter, statusFilter]);

  // Reset page to 1 when search term or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, specializationFilter, statusFilter]);

  useEffect(() => {
    if (activeTab === 'commissions') {
      fetchCommissions();
    }
  }, [activeTab]); // Remove changing dependencies

  // Fetch commission stats on component load for summary cards
  useEffect(() => {
    fetchCommissionStats();
  }, []);

  // Fetch commission stats (separate from full commission data)
  const fetchCommissionStats = async () => {
    try {
      const token = localStorage.getItem('token');

      const statsResponse = await fetch('/api/store-manager/doctors/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setCommissionStats(statsData.data);
      }
    } catch (error) {
      console.error('Fetch commission stats error:', error);
    }
  };

  // Get top referrer from commission stats (now comes from real data)
  const getTopReferrer = () => {
    if (commissionStats && commissionStats.topReferrer) {
      return {
        name: commissionStats.topReferrer.name || 'No data',
        prescriptions: commissionStats.topReferrer.prescriptions || 0
      };
    }
    return { name: 'No data', prescriptions: 0 };
  };

  // Separate useEffect for commission filters
  useEffect(() => {
    if (activeTab === 'commissions') {
      console.log('Commission tab activated, fetching commissions...');
      console.log('Current filters:', { commissionFilter, commissionDateRange, doctorNameFilter, commissionRateFilter });
      fetchCommissions();
    }
  }, [commissionFilter, commissionDateRange, doctorNameFilter, commissionRateFilter]);

  // Filter commission history based on all active filters
  const filterCommissionHistory = (commissions) => {
    return commissions.filter(commission => {
      // Doctor name filter (case-insensitive partial match)
      if (doctorNameFilter.trim() !== '') {
        const doctorName = commission.doctor?.name?.toLowerCase() || '';
        const searchTerm = doctorNameFilter.toLowerCase().trim();
        if (!doctorName.includes(searchTerm)) {
          return false;
        }
      }

      // Commission rate filter
      if (commissionRateFilter !== 'all') {
        const rate = commission.commissionRate || 0;
        switch (commissionRateFilter) {
          case '0-5':
            if (rate < 0 || rate > 5) return false;
            break;
          case '5-10':
            if (rate < 5 || rate > 10) return false;
            break;
          case '10-15':
            if (rate < 10 || rate > 15) return false;
            break;
          case '15-20':
            if (rate < 15 || rate > 20) return false;
            break;
          case '20+':
            if (rate < 20) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
  };

  // Apply filters whenever filter values change
  useEffect(() => {
    if (allCommissionHistory.length > 0) {
      const filtered = filterCommissionHistory(allCommissionHistory);
      setCommissionHistory(filtered);
    }
  }, [doctorNameFilter, commissionRateFilter, allCommissionHistory]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      specialization: '',
      qualification: '',
      experience: '',
      registrationNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      },
      hospital: {
        name: '',
        address: '',
        phone: ''
      },
      commissionRate: '',
      commissionType: 'percentage',
      notes: ''
    });
  };

  // Handle form submission (add or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const isEditing = editingDoctor !== null;
      const url = isEditing
        ? `/api/store-manager/doctors/${editingDoctor._id}`
        : '/api/store-manager/doctors';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Success - refresh doctors list and go back to list tab
        await fetchDoctors();
        resetForm();
        setEditingDoctor(null);
        setActiveTab('list');
      } else {
        setError(data.message || `Failed to ${isEditing ? 'update' : 'add'} doctor`);
      }
    } catch (error) {
      console.error(`${editingDoctor ? 'Update' : 'Add'} doctor error:`, error);
      setError(`Failed to ${editingDoctor ? 'update' : 'add'} doctor. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit doctor
  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      alternatePhone: doctor.alternatePhone || '',
      specialization: doctor.specialization || '',
      qualification: doctor.qualification || '',
      experience: doctor.experience || '',
      registrationNumber: doctor.registrationNumber || '',
      address: {
        street: doctor.address?.street || '',
        city: doctor.address?.city || '',
        state: doctor.address?.state || '',
        pincode: doctor.address?.pincode || ''
      },
      hospital: {
        name: doctor.hospital?.name || '',
        address: doctor.hospital?.address || '',
        phone: doctor.hospital?.phone || ''
      },
      commissionRate: doctor.commissionRate || '',
      commissionType: doctor.commissionType || 'percentage',
      notes: doctor.notes || ''
    });
    setActiveTab('edit');
  };

  // Handle delete doctor
  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to deactivate this doctor?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchDoctors();
        setError(''); // Clear any previous errors
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete doctor');
      }
    } catch (error) {
      console.error('Delete doctor error:', error);
      setError('Failed to delete doctor. Please try again.');
    }
  };

  const handleToggleDoctorStatus = async (doctorId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    if (window.confirm(`Are you sure you want to ${action} this doctor?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/store-manager/doctors/${doctorId}/toggle-status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          await fetchDoctors(); // Refresh the list
          setError(''); // Clear any previous errors
        } else {
          const data = await response.json();
          setError(data.message || `Failed to ${action} doctor`);
        }
      } catch (error) {
        console.error(`Error ${action}ing doctor:`, error);
        setError(`Failed to ${action} doctor. Please try again.`);
      }
    }
  };

  // Fetch commissions data
  const fetchCommissions = async () => {
    setLoadingCommissions(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch commission stats with filters
      const statsParams = new URLSearchParams({
        dateRange: commissionDateRange,
        status: commissionFilter !== 'all' ? commissionFilter : ''
      });

      const statsResponse = await fetch(`/api/store-manager/doctors/stats?${statsParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setCommissionStats(statsData.data);
      }

      // Fetch detailed commission history
      const params = new URLSearchParams({
        dateRange: commissionDateRange,
        status: commissionFilter !== 'all' ? commissionFilter : ''
      });

      console.log('Fetching commission history with params:', params.toString());

      const historyResponse = await fetch(`/api/store-manager/doctors/commissions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Commission history response status:', historyResponse.status);

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log('Commission history data received:', historyData);
        console.log('Commission history array:', historyData.data);

        // Store all commission data for client-side filtering
        const allData = historyData.data || [];
        setAllCommissionHistory(allData);

        // Apply client-side filters to the data
        const filteredData = filterCommissionHistory(allData);
        setCommissionHistory(filteredData);
      } else {
        console.error('Failed to fetch commission history:', historyResponse.status);
        const errorData = await historyResponse.json();
        console.error('Error details:', errorData);
      }

    } catch (error) {
      console.error('Fetch commissions error:', error);
    } finally {
      setLoadingCommissions(false);
    }
  };

  // Mark commission as paid
  const markCommissionPaid = async (commissionId) => {
    console.log('Attempting to mark commission as paid:', commissionId);

    // Add loading state for the specific commission
    setCommissionHistory(prev =>
      prev.map(comm =>
        comm._id === commissionId
          ? { ...comm, isUpdating: true }
          : comm
      )
    );

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/doctors/commissions/${commissionId}/pay`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Mark commission paid response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Mark commission paid success:', data);

        // Clear any previous errors and show success message
        setError('');
        setSuccessMessage('Commission marked as paid successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);

        // Update the specific commission in both all data and filtered data immediately for better UX
        setAllCommissionHistory(prev =>
          prev.map(comm =>
            comm._id === commissionId
              ? {
                  ...comm,
                  status: 'paid',
                  paymentDate: new Date().toISOString(),
                  isUpdating: false
                }
              : comm
          )
        );

        setCommissionHistory(prev =>
          prev.map(comm =>
            comm._id === commissionId
              ? {
                  ...comm,
                  status: 'paid',
                  paymentDate: new Date().toISOString(),
                  isUpdating: false
                }
              : comm
          )
        );

        // Refresh data to ensure consistency
        await fetchCommissions();
      } else {
        const data = await response.json();
        console.error('Mark commission paid failed:', data);
        setError(data.message || 'Failed to mark commission as paid');

        // Remove loading state on error from both data stores
        setAllCommissionHistory(prev =>
          prev.map(comm =>
            comm._id === commissionId
              ? { ...comm, isUpdating: false }
              : comm
          )
        );

        setCommissionHistory(prev =>
          prev.map(comm =>
            comm._id === commissionId
              ? { ...comm, isUpdating: false }
              : comm
          )
        );
      }
    } catch (error) {
      console.error('Mark commission paid error:', error);
      setError('Network error: Failed to mark commission as paid');

      // Remove loading state on error from both data stores
      setAllCommissionHistory(prev =>
        prev.map(comm =>
          comm._id === commissionId
            ? { ...comm, isUpdating: false }
            : comm
        )
      );

      setCommissionHistory(prev =>
        prev.map(comm =>
          comm._id === commissionId
            ? { ...comm, isUpdating: false }
            : comm
        )
      );
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Build query parameters manually
      let queryParams = `page=${currentPage}&limit=20&_t=${Date.now()}`;

      if (searchTerm && searchTerm.trim()) {
        queryParams += `&search=${encodeURIComponent(searchTerm)}`;
      }

      if (specializationFilter && specializationFilter.trim()) {
        queryParams += `&specialization=${encodeURIComponent(specializationFilter)}`;
      }

      if (statusFilter && statusFilter !== 'all') {
        queryParams += `&status=${encodeURIComponent(statusFilter)}`;
      }

      const response = await fetch(`/api/store-manager/doctors?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      console.log('Doctors API Response:', data);
      console.log('Doctors array:', data.data);
      console.log('Number of doctors:', data.data?.length || 0);

      setDoctors(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Doctors fetch error:', error);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const viewDoctorDetails = async (doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(true);
    setDoctorCommissionData(null);

    // Fetch commission data for this doctor
    await fetchDoctorCommissionData(doctor._id);
  };

  const fetchDoctorCommissionData = async (doctorId) => {
    setLoadingCommissionData(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/doctors/${doctorId}/commission-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDoctorCommissionData(data.data);
      } else {
        console.error('Failed to fetch commission data');
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
    } finally {
      setLoadingCommissionData(false);
    }
  };

  const handleRecordPayment = (commission) => {
    setSelectedCommission(commission);
    setPaymentFormData({
      amount: commission.remainingBalance || commission.commissionAmount || '',
      paymentMethod: 'cash',
      paymentReference: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!selectedCommission || !paymentFormData.amount || !paymentFormData.paymentMethod) {
      setError('Please fill in all required payment fields');
      return;
    }

    setSubmittingPayment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/doctors/commissions/${selectedCommission._id}/record-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentFormData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Payment of ₹${paymentFormData.amount} recorded successfully`);
        setShowPaymentModal(false);
        setSelectedCommission(null);
        setPaymentFormData({
          amount: '',
          paymentMethod: 'cash',
          paymentReference: '',
          notes: ''
        });

        // Refresh commission data
        if (selectedDoctor) {
          await fetchDoctorCommissionData(selectedDoctor._id);
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      setError('Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const getSpecializationColor = (specialization) => {
    const colors = {
      'General Medicine': 'bg-blue-100 text-blue-800',
      'Cardiology': 'bg-red-100 text-red-800',
      'Dermatology': 'bg-green-100 text-green-800',
      'Pediatrics': 'bg-yellow-100 text-yellow-800',
      'Orthopedics': 'bg-purple-100 text-purple-800',
      'Gynecology': 'bg-pink-100 text-pink-800',
      'Neurology': 'bg-indigo-100 text-indigo-800',
      'Psychiatry': 'bg-teal-100 text-teal-800'
    };
    return colors[specialization] || 'bg-gray-100 text-gray-800';
  };

  const renderDoctorsList = () => (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Doctor Management</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Manage doctor profiles, track commissions, and monitor prescriptions.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveTab('commissions')}
              className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Commissions
            </button>
            <button
              onClick={() => {
                resetForm();
                setActiveTab('add');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Doctor
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Doctors</p>
              <p className="text-2xl font-bold text-gray-900">{commissionStats.totalDoctors || doctors.length}</p>
              <p className="text-xs text-green-600">{commissionStats.activeDoctors || 0} active</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900">{commissionStats.totalPrescriptions || 0}</p>
              <p className="text-xs text-blue-600">Total prescriptions</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-2xl font-bold text-gray-900">₹{commissionStats.thisMonthCommissions?.toLocaleString() || 0}</p>
              <p className="text-xs text-purple-600">This month</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Referrer</p>
              <p className="text-lg font-bold text-gray-900">Dr. {getTopReferrer().name}</p>
              <p className="text-xs text-orange-600">{getTopReferrer().prescriptions} prescriptions</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full">
              <Award className="h-6 w-6 text-white" />
            </div>
          </div>
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
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Specializations</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Gynecology">Gynecology</option>
              <option value="Neurology">Neurology</option>
              <option value="Psychiatry">Psychiatry</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSpecializationFilter('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Clear Filters
            </button>
          </div>

          {/* DEBUG BUTTONS - REMOVE AFTER TESTING */}
          <div className="flex gap-2">

          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prescriptions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                            <Stethoscope className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center text-sm font-medium text-gray-900 text-left">
                            Dr. {doctor.name}
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              doctor.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : doctor.status === 'inactive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {doctor.status === 'active' ? 'Active' : doctor.status === 'inactive' ? 'Inactive' : 'Unknown'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 text-left">
                            {doctor.registrationNumber || 'Registration not provided'}
                          </div>
                          <div className="flex items-center text-xs text-yellow-500">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            {doctor.rating || '4.5'} rating
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSpecializationColor(doctor.specialization)}`}>
                        {doctor.specialization}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {doctor.experience || 0} years exp.
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center text-left">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          {doctor.phone || 'Not provided'}
                        </div>
                        <div className="flex items-center text-left mt-1">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          {doctor.email || 'Not provided'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-left">
                        <div className="font-medium">
                          {doctor.prescriptionCount || 0} this month
                        </div>
                        <div className="text-xs text-gray-500">
                          {doctor.totalPrescriptions || 0} total
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="text-left">
                        <div className="text-green-600">
                          ₹{doctor.monthlyCommission?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          {doctor.commissionRate || 0}% rate
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowDoctorModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditDoctor(doctor)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Doctor"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleDoctorStatus(doctor._id, doctor.status)}
                          className={`${
                            doctor.status === 'active'
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={doctor.status === 'active' ? 'Deactivate Doctor' : 'Activate Doctor'}
                        >
                          {doctor.status === 'active' ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No doctors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCommissionsTab = () => (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Commission Tracking</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Monitor doctor commissions and prescription-based earnings.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setActiveTab('list')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Doctors
          </button>
        </div>
      </div>

      {/* Commission Summary */}
      {loadingCommissions ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                <p className="text-2xl font-bold text-gray-900">{commissionStats.totalDoctors || 0}</p>
                <p className="text-xs text-green-600">{commissionStats.activeDoctors || 0} active</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">₹{commissionStats.thisMonthCommissions?.toLocaleString() || 0}</p>
                <p className="text-xs text-blue-600">Commission earned</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">₹{commissionStats.pendingCommissions?.toLocaleString() || 0}</p>
                <p className="text-xs text-orange-600">To be paid</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Commission</p>
                <p className="text-2xl font-bold text-gray-900">{commissionStats.averageCommissionRate?.toFixed(1) || 0}%</p>
                <p className="text-xs text-purple-600">Across all doctors</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-4 text-left">Filter Commissions</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={commissionDateRange}
              onChange={(e) => setCommissionDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={commissionFilter}
              onChange={(e) => setCommissionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
            <input
              type="text"
              value={doctorNameFilter}
              onChange={(e) => setDoctorNameFilter(e.target.value)}
              placeholder="Search by doctor name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate</label>
            <select
              value={commissionRateFilter}
              onChange={(e) => setCommissionRateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Rates</option>
              <option value="0-5">0% - 5%</option>
              <option value="5-10">5% - 10%</option>
              <option value="10-15">10% - 15%</option>
              <option value="15-20">15% - 20%</option>
              <option value="20+">20%+</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setCommissionDateRange('thisMonth');
              setCommissionFilter('all');
              setDoctorNameFilter('');
              setCommissionRateFilter('all');
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Commission Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 text-left">Commission Details</h3>
          <div className="text-sm text-gray-500">
            Showing {commissionHistory.length} of {allCommissionHistory.length} records
            {(doctorNameFilter || commissionRateFilter !== 'all') && (
              <span className="ml-2 text-blue-600">(filtered)</span>
            )}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          </div>
        )}
        {loadingCommissions ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prescriptions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commissionHistory.length > 0 ? (
                  commissionHistory.map((commission) => {
                    console.log('Rendering commission:', commission);
                    return (
                    <tr key={commission._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {commission.doctor?.name?.charAt(0) || 'D'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              Dr. {commission.doctor?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {commission.doctor?.specialization || 'General'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commission.prescriptionCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{commission.salesValue?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commission.commissionRate || 0}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₹{commission.commissionAmount?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          commission.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : commission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {commission.status === 'paid' ? 'Paid' : commission.status === 'pending' ? 'Pending' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(commission.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {commission.status === 'pending' && (
                          <button
                            onClick={() => markCommissionPaid(commission._id)}
                            disabled={commission.isUpdating}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md ${
                              commission.isUpdating
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                            }`}
                            title="Mark as Paid"
                          >
                            {commission.isUpdating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              'Mark Paid'
                            )}
                          </button>
                        )}
                        {commission.status === 'paid' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Paid
                            {commission.paymentDate && (
                              <span className="ml-1 text-green-600">
                                ({new Date(commission.paymentDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short'
                                })})
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No commission data found for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderDoctorForm = () => {
    const isEditing = editingDoctor !== null;
    return (
      <div>
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900 text-left">
              {isEditing ? 'Edit Doctor' : 'Add New Doctor'}
            </h1>
            <p className="mt-2 text-sm text-gray-700 text-left">
              {isEditing ? 'Update doctor information and commission settings.' : 'Register a new doctor and set up commission tracking.'}
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Dr. John Doe"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                placeholder="Registration number"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Specialization *</label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select Specialization</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Neurology">Neurology</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="ENT">ENT</option>
                <option value="Dentistry">Dentistry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                placeholder="Years of experience"
                min="0"
                max="70"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="9876543210"
                required
                pattern="[0-9]{10}"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="doctor@example.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Commission Rate (%)</label>
              <input
                type="number"
                name="commissionRate"
                value={formData.commissionRate}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                max="100"
                placeholder="5.0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hospital/Clinic</label>
              <input
                type="text"
                name="hospital.name"
                value={formData.hospital.name}
                onChange={handleInputChange}
                placeholder="Hospital or clinic name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Qualification</label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification}
              onChange={handleInputChange}
              placeholder="MBBS, MD, etc."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              rows={3}
              placeholder="Complete address"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional notes about the doctor"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab('list');
              }}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Doctor' : 'Add Doctor')}
            </button>
          </div>
        </form>
      </div>
    </div>
    );
  };

  if (loading && doctors.length === 0) {
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
                Doctors List
              </button>
              <button
                onClick={() => setActiveTab('commissions')}
                className={`${
                  activeTab === 'commissions'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Commissions
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('add');
                }}
                className={`${
                  activeTab === 'add'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Add Doctor
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
          {activeTab === 'list' && renderDoctorsList()}
          {activeTab === 'commissions' && renderCommissionsTab()}
          {(activeTab === 'add' || activeTab === 'edit') && renderDoctorForm()}

          {/* Doctor Details Modal */}
          {showDoctorModal && selectedDoctor && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 text-left">Doctor Details & Commission Tracking</h3>
                    <button
                      onClick={() => {
                        setShowDoctorModal(false);
                        setDoctorCommissionData(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Doctor Basic Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                            <Stethoscope className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-xl font-semibold text-gray-900 text-left">Dr. {selectedDoctor.name}</h4>
                          <p className="text-gray-600 text-left">{selectedDoctor.specialization}</p>
                          <div className="flex items-center text-yellow-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="ml-1 text-sm">{selectedDoctor.rating || '4.5'} rating</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 text-left">Experience</label>
                          <p className="text-sm text-gray-900 text-left">{selectedDoctor.experience || 0} years</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 text-left">Phone</label>
                          <p className="text-sm text-gray-900 text-left">{selectedDoctor.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 text-left">Email</label>
                          <p className="text-sm text-gray-900 text-left">{selectedDoctor.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 text-left">Commission Rate</label>
                          <p className="text-sm text-green-600 font-medium text-left">{selectedDoctor.commissionRate || 0}%</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 text-left">Registration No.</label>
                          <p className="text-sm text-gray-900 text-left">{selectedDoctor.registrationNumber || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 text-left">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedDoctor.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedDoctor.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Commission Tracking Section */}
                    <div className="border-t pt-6">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4 text-left">Commission Tracking</h5>

                      {loadingCommissionData ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                          <span className="ml-2 text-gray-600">Loading commission data...</span>
                        </div>
                      ) : doctorCommissionData ? (
                        <div className="space-y-6">
                          {/* Commission Summary Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <DollarSign className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-blue-600 text-left">Total Earned</p>
                                  <p className="text-lg font-semibold text-blue-900 text-left">
                                    ₹{doctorCommissionData.summary?.totalCommissionEarned?.toLocaleString() || 0}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-green-600 text-left">Total Paid</p>
                                  <p className="text-lg font-semibold text-green-900 text-left">
                                    ₹{doctorCommissionData.summary?.totalCommissionPaid?.toLocaleString() || 0}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-yellow-50 rounded-lg p-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <Clock className="h-8 w-8 text-yellow-600" />
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-yellow-600 text-left">Pending</p>
                                  <p className="text-lg font-semibold text-yellow-900 text-left">
                                    ₹{doctorCommissionData.summary?.pendingCommissionAmount?.toLocaleString() || 0}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <TrendingUp className="h-8 w-8 text-gray-600" />
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-600 text-left">Status</p>
                                  <p className="text-sm font-semibold text-left">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      doctorCommissionData.summary?.paymentStatus === 'Fully Paid'
                                        ? 'bg-green-100 text-green-800'
                                        : doctorCommissionData.summary?.paymentStatus === 'Partially Paid'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {doctorCommissionData.summary?.paymentStatus || 'Unpaid'}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Payment History Timeline */}
                          {doctorCommissionData.paymentHistory && doctorCommissionData.paymentHistory.length > 0 && (
                            <div>
                              <h6 className="text-md font-medium text-gray-900 mb-3 text-left">Recent Payment History</h6>
                              <div className="bg-white border rounded-lg max-h-64 overflow-y-auto">
                                <div className="divide-y divide-gray-200">
                                  {doctorCommissionData.paymentHistory.slice(0, 5).map((payment, index) => (
                                    <div key={index} className="p-4 hover:bg-gray-50">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          <div className="flex-shrink-0">
                                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                              <DollarSign className="h-4 w-4 text-green-600" />
                                            </div>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-900 text-left">
                                              ₹{payment.amount?.toLocaleString()} payment
                                            </p>
                                            <p className="text-xs text-gray-500 text-left">
                                              {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm text-gray-900 text-left">
                                            {payment.paymentMethod?.replace('_', ' ').toUpperCase()}
                                          </p>
                                          <p className="text-xs text-gray-500 text-left">
                                            Balance: ₹{payment.runningBalance?.toLocaleString() || 0}
                                          </p>
                                        </div>
                                      </div>
                                      {payment.paymentReference && (
                                        <p className="text-xs text-gray-400 mt-1 text-left">
                                          Ref: {payment.paymentReference}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {doctorCommissionData.paymentHistory.length > 5 && (
                                <p className="text-xs text-gray-500 mt-2 text-left">
                                  Showing 5 of {doctorCommissionData.paymentHistory.length} payments
                                </p>
                              )}
                            </div>
                          )}

                          {/* Commission Records Summary */}
                          {doctorCommissionData.commissions && doctorCommissionData.commissions.length > 0 && (
                            <div>
                              <h6 className="text-md font-medium text-gray-900 mb-3 text-left">Commission Records</h6>
                              <div className="bg-white border rounded-lg">
                                <div className="px-4 py-2 bg-gray-50 border-b">
                                  <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                                    <div>Period</div>
                                    <div>Prescriptions</div>
                                    <div>Sales Value</div>
                                    <div>Commission</div>
                                    <div>Status</div>
                                    <div>Actions</div>
                                  </div>
                                </div>
                                <div className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
                                  {doctorCommissionData.commissions.slice(0, 5).map((commission, index) => (
                                    <div key={index} className="px-4 py-3 hover:bg-gray-50">
                                      <div className="grid grid-cols-6 gap-4 text-sm items-center">
                                        <div className="text-gray-900 text-left">
                                          {commission.period?.month}/{commission.period?.year}
                                        </div>
                                        <div className="text-gray-900 text-left">
                                          {commission.prescriptionCount || 0}
                                        </div>
                                        <div className="text-gray-900 text-left">
                                          ₹{commission.salesValue?.toLocaleString() || 0}
                                        </div>
                                        <div className="text-green-600 font-medium text-left">
                                          ₹{commission.commissionAmount?.toLocaleString() || 0}
                                        </div>
                                        <div>
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            commission.status === 'paid'
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {commission.status === 'paid' ? 'Paid' : 'Pending'}
                                          </span>
                                        </div>
                                        <div>
                                          {commission.status === 'pending' && commission.remainingBalance > 0 && (
                                            <button
                                              onClick={() => handleRecordPayment(commission)}
                                              className="inline-flex items-center px-2 py-1 border border-green-600 text-xs font-medium rounded text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                              <DollarSign className="h-3 w-3 mr-1" />
                                              Pay
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No commission data available</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={() => setShowDoctorModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setShowDoctorModal(false);
                          handleEditDoctor(selectedDoctor);
                        }}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commission Payment Modal */}
          {showPaymentModal && selectedCommission && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 text-left">Record Commission Payment</h3>
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        setSelectedCommission(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Commission Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2 text-left">Commission Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Period:</span>
                          <span className="ml-2 text-gray-900">
                            {selectedCommission.period?.month}/{selectedCommission.period?.year}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Commission:</span>
                          <span className="ml-2 text-gray-900">
                            ₹{selectedCommission.commissionAmount?.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Already Paid:</span>
                          <span className="ml-2 text-gray-900">
                            ₹{selectedCommission.totalPaid?.toLocaleString() || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Remaining:</span>
                          <span className="ml-2 text-green-600 font-medium">
                            ₹{selectedCommission.remainingBalance?.toLocaleString() || selectedCommission.commissionAmount?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                          Payment Amount *
                        </label>
                        <input
                          type="number"
                          value={paymentFormData.amount}
                          onChange={(e) => setPaymentFormData({...paymentFormData, amount: e.target.value})}
                          placeholder="Enter payment amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          max={selectedCommission.remainingBalance || selectedCommission.commissionAmount}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                          Payment Method *
                        </label>
                        <select
                          value={paymentFormData.paymentMethod}
                          onChange={(e) => setPaymentFormData({...paymentFormData, paymentMethod: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="cash">Cash</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="upi">UPI</option>
                          <option value="cheque">Cheque</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                          Transaction Reference
                        </label>
                        <input
                          type="text"
                          value={paymentFormData.paymentReference}
                          onChange={(e) => setPaymentFormData({...paymentFormData, paymentReference: e.target.value})}
                          placeholder="Transaction ID, Cheque number, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                          Notes
                        </label>
                        <textarea
                          value={paymentFormData.notes}
                          onChange={(e) => setPaymentFormData({...paymentFormData, notes: e.target.value})}
                          placeholder="Additional notes about this payment"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          setShowPaymentModal(false);
                          setSelectedCommission(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        disabled={submittingPayment}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitPayment}
                        disabled={submittingPayment || !paymentFormData.amount || !paymentFormData.paymentMethod}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingPayment ? 'Recording...' : 'Record Payment'}
                      </button>
                    </div>
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

export default StoreManagerDoctors;
