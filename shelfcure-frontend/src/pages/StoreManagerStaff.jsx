import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Eye,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  TrendingUp,
  Download,
  Filter,
  Phone,
  Mail,
  LogOut,
  History,
  MapPin,
  Trash2
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import StoreManagerAttendanceHistory from './StoreManagerAttendanceHistory';
import useAutoMessage from '../hooks/useAutoMessage';

const StoreManagerStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, success, setError, setSuccess, clearError, clearSuccess } = useAutoMessage(4000);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [quickAttendanceLoading, setQuickAttendanceLoading] = useState(null); // Store staff ID being processed
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'attendance', 'payroll', 'add'
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeModalData, setTimeModalData] = useState({ staffId: null, type: null, currentTime: '' });

  // Attendance-specific state
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalStaff: 0,
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    notMarked: 0
  });
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [staffWithAttendance, setStaffWithAttendance] = useState([]);

  // Date State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Payroll State
  const [payrollData, setPayrollData] = useState([]);
  const [payrollStats, setPayrollStats] = useState({
    totalPayroll: 0,
    totalStaff: 0,
    processedCount: 0,
    paidCount: 0,
    pendingCount: 0,
    notProcessed: 0,
    avgSalary: 0
  });
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [salaryConfigs, setSalaryConfigs] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Staff Stats State
  const [staffStats, setStaffStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    onLeaveStaff: 0,
    averageSalary: 0,
    totalSalaryExpense: 0,
    roleDistribution: []
  });
  const [staffStatsLoading, setStaffStatsLoading] = useState(false);

  // Today's Attendance Stats for main cards
  const [todayAttendanceStats, setTodayAttendanceStats] = useState({
    totalStaff: 0,
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    notMarked: 0
  });

  // Current Month Payroll Stats for main cards
  const [currentMonthPayrollStats, setCurrentMonthPayrollStats] = useState({
    totalPayroll: 0,
    totalStaff: 0,
    processedCount: 0,
    paidCount: 0,
    pendingCount: 0,
    avgSalary: 0
  });

  // Add Staff Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    role: '',
    department: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    salary: '',
    workingHours: 'full_time',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    dateOfBirth: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    qualifications: [],
    certifications: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchStaff();
      fetchStaffStats();
      fetchTodayAttendanceStats();
      fetchCurrentMonthPayrollStats();
    } else if (activeTab === 'attendance') {
      fetchAttendanceStats();
      fetchStaffWithAttendance();
    } else if (activeTab === 'payroll') {
      fetchPayrollStats();
      fetchPayroll();
    }
  }, [activeTab, currentPage, searchTerm, roleFilter, statusFilter, selectedDate, selectedMonth]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/store-manager/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }

      const data = await response.json();
      setStaff(data.data);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Staff fetch error:', error);
      setError('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffStats = async () => {
    try {
      setStaffStatsLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/store-manager/staff/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStaffStats(data.data || {
          totalStaff: 0,
          activeStaff: 0,
          inactiveStaff: 0,
          onLeaveStaff: 0,
          averageSalary: 0,
          totalSalaryExpense: 0,
          roleDistribution: []
        });
      }
    } catch (error) {
      console.error('Staff stats fetch error:', error);
    } finally {
      setStaffStatsLoading(false);
    }
  };

  const fetchTodayAttendanceStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];

      const response = await fetch(`/api/store-manager/attendance/stats?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTodayAttendanceStats(data.data || {
          totalStaff: 0,
          present: 0,
          absent: 0,
          late: 0,
          onLeave: 0,
          notMarked: 0
        });
      }
    } catch (error) {
      console.error('Today attendance stats fetch error:', error);
    }
  };

  const fetchCurrentMonthPayrollStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const response = await fetch(`/api/store-manager/payroll/stats?month=${currentMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentMonthPayrollStats(data.data || {
          totalPayroll: 0,
          totalStaff: 0,
          processedCount: 0,
          paidCount: 0,
          pendingCount: 0,
          avgSalary: 0
        });
      }
    } catch (error) {
      console.error('Current month payroll stats fetch error:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/attendance?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.data || []);
      } else {
        throw new Error('Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('Attendance fetch error:', error);
      setError('Failed to load attendance data');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/attendance/stats?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceStats(data.data || {
          totalStaff: 0,
          present: 0,
          absent: 0,
          late: 0,
          onLeave: 0,
          notMarked: 0
        });
      }
    } catch (error) {
      console.error('Attendance stats fetch error:', error);
    }
  };

  const fetchStaffWithAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/attendance/staff-list?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStaffWithAttendance(data.data || []);
      } else {
        throw new Error('Failed to fetch staff attendance data');
      }
    } catch (error) {
      console.error('Staff attendance fetch error:', error);
      setError('Failed to load staff attendance data');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchPayroll = async () => {
    try {
      setPayrollLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/payroll?month=${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayrollData(data.data || []);
      } else {
        throw new Error('Failed to fetch payroll data');
      }
    } catch (error) {
      console.error('Payroll fetch error:', error);
      setError('Failed to load payroll data');
    } finally {
      setPayrollLoading(false);
    }
  };

  const fetchPayrollStats = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/payroll/stats?month=${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayrollStats(data.data || {
          totalPayroll: 0,
          totalStaff: 0,
          processedCount: 0,
          paidCount: 0,
          pendingCount: 0,
          notProcessed: 0,
          avgSalary: 0
        });
      }
    } catch (error) {
      console.error('Payroll stats fetch error:', error);
    }
  };

  const processPayroll = async (staffIds = null) => {
    try {
      setPayrollLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/store-manager/payroll/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: selectedMonth,
          staffIds: staffIds
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Payroll processed:', data.message);

        // Refresh payroll data
        await Promise.all([
          fetchPayroll(),
          fetchPayrollStats()
        ]);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to process payroll');
      }
    } catch (error) {
      console.error('Process payroll error:', error);
      setError('Failed to process payroll');
    } finally {
      setPayrollLoading(false);
    }
  };

  const updatePayrollStatus = async (payrollId, status, paymentMethod = null, paymentReference = null, notes = null) => {
    try {
      const token = localStorage.getItem('token');

      const requestBody = { status };
      if (paymentMethod) requestBody.paymentMethod = paymentMethod;
      if (paymentReference) requestBody.paymentReference = paymentReference;
      if (notes) requestBody.notes = notes;

      const response = await fetch(`/api/store-manager/payroll/${payrollId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Payroll status updated:', data.message);

        // Refresh payroll data
        await Promise.all([
          fetchPayroll(),
          fetchPayrollStats()
        ]);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update payroll status');
      }
    } catch (error) {
      console.error('Update payroll status error:', error);
      setError('Failed to update payroll status');
    }
  };

  const markAttendance = async (staffId, status, checkIn = null, checkOut = null) => {
    try {
      const token = localStorage.getItem('token');

      const requestBody = {
        staffId,
        date: selectedDate,
        status
      };

      // Auto-set check-in time for present/late status if not provided
      if ((status === 'present' || status === 'late') && !checkIn) {
        requestBody.checkIn = new Date().toISOString();
      } else if (checkIn) {
        requestBody.checkIn = checkIn;
      }

      if (checkOut) requestBody.checkOut = checkOut;

      const response = await fetch('/api/store-manager/attendance/mark', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Attendance marked:', data.message);

        // Refresh all attendance data
        await Promise.all([
          fetchAttendance(),
          fetchAttendanceStats(),
          fetchStaffWithAttendance()
        ]);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Mark attendance error:', error);
      setError('Failed to mark attendance');
    }
  };

  const markCheckOut = async (staffId) => {
    try {
      const token = localStorage.getItem('token');

      const requestBody = {
        staffId,
        date: selectedDate,
        checkOut: new Date().toISOString()
      };

      const response = await fetch('/api/store-manager/attendance/mark', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Check-out marked:', data.message);

        // Refresh all attendance data
        await Promise.all([
          fetchAttendance(),
          fetchAttendanceStats(),
          fetchStaffWithAttendance()
        ]);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to mark check-out');
      }
    } catch (error) {
      console.error('Mark check-out error:', error);
      setError('Failed to mark check-out');
    }
  };

  const viewStaffDetails = (member) => {
    setSelectedStaff(member);
    setShowStaffModal(true);
  };

  const viewStaffAttendanceHistory = (member) => {
    // Set the staff filter and show attendance history
    setShowAttendanceHistory(true);
    // We'll pass the staff ID to the attendance history component
    // For now, we'll just show the history and let user filter manually
  };

  // Manual time entry functions
  const openTimeModal = (staffId, type) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    setTimeModalData({ staffId, type, currentTime });
    setShowTimeModal(true);
  };

  const handleManualTimeEntry = async () => {
    try {
      const { staffId, type, currentTime } = timeModalData;
      const token = localStorage.getItem('token');

      // Create a date object with today's date and the specified time
      const today = new Date();
      const [hours, minutes] = currentTime.split(':');
      const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);

      const response = await fetch('/api/store-manager/attendance/manual-time', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          staffId,
          type, // 'checkIn' or 'checkOut'
          time: timeDate.toISOString(),
          date: selectedDate
        })
      });

      if (response.ok) {
        setShowTimeModal(false);
        setTimeModalData({ staffId: null, type: null, currentTime: '' });
        fetchStaffWithAttendance(); // Refresh the attendance data
        setSuccess(`${type === 'checkIn' ? 'Check-in' : 'Check-out'} time set successfully`);
      } else {
        throw new Error('Failed to set time');
      }
    } catch (error) {
      console.error('Manual time entry error:', error);
      setError('Failed to set time. Please try again.');
    }
  };

  const editStaff = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      employeeId: member.employeeId || '',
      role: member.role || '',
      department: member.department || '',
      dateOfJoining: member.dateOfJoining ? new Date(member.dateOfJoining).toISOString().split('T')[0] : '',
      salary: member.salary || '',
      workingHours: member.workingHours || 'full_time',
      address: {
        street: member.address?.street || '',
        city: member.address?.city || '',
        state: member.address?.state || '',
        pincode: member.address?.pincode || ''
      },
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
      emergencyContact: {
        name: member.emergencyContact?.name || '',
        phone: member.emergencyContact?.phone || '',
        relationship: member.emergencyContact?.relationship || ''
      },
      qualifications: member.qualifications || [],
      certifications: member.certifications || []
    });
    setShowEditModal(true);
  };

  const confirmDeleteStaff = (member) => {
    setStaffToDelete(member);
    setShowDeleteModal(true);
  };

  const deleteStaffMember = async () => {
    if (!staffToDelete) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/staff/${staffToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setStaffToDelete(null);
        fetchStaff(); // Refresh the staff list
        setSuccess('Staff member deleted successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Delete staff error:', error);
      setError('Failed to delete staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickMarkAttendance = async (member, status) => {
    try {
      setQuickAttendanceLoading(member._id); // Set loading state for this specific staff member
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];

      const requestBody = {
        staffId: member._id,
        date: today,
        status
      };

      const response = await fetch('/api/store-manager/attendance/mark', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Quick attendance marked:', data.message);

        // Refresh staff list and today's attendance stats for the cards
        await Promise.all([
          fetchStaff(),
          fetchTodayAttendanceStats(),
          fetchStaffStats()
        ]);

        setSuccess(`Successfully marked ${member.name} as ${status}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Failed to mark ${member.name} as ${status}`);
      }
    } catch (error) {
      console.error('Quick mark attendance error:', error);
      setError(`Failed to mark ${member.name} as ${status}`);
    } finally {
      setQuickAttendanceLoading(null); // Clear loading state
    }
  };

  const updateStaffMember = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      setIsSubmitting(true);
      setFormErrors({});
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/staff/${editingStaff._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setShowEditModal(false);
        setEditingStaff(null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          employeeId: '',
          role: '',
          department: '',
          dateOfJoining: new Date().toISOString().split('T')[0],
          salary: '',
          workingHours: 'full_time',
          address: {
            street: '',
            city: '',
            state: '',
            pincode: ''
          },
          dateOfBirth: '',
          emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
          },
          qualifications: [],
          certifications: []
        });
        fetchStaff(); // Refresh the staff list
        setSuccess('Staff member updated successfully');
      } else {
        if (data.errors) {
          setFormErrors(data.errors);
        } else {
          setError(data.message || 'Failed to update staff member');
        }
      }
    } catch (error) {
      console.error('Update staff error:', error);
      setError('Failed to update staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { color: 'bg-green-100 text-green-800', label: 'Active' },
      'inactive': { color: 'bg-red-100 text-red-800', label: 'Inactive' },
      'on_leave': { color: 'bg-yellow-100 text-yellow-800', label: 'On Leave' }
    };
    
    const config = statusConfig[status] || statusConfig['active'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'pharmacist': { color: 'bg-blue-100 text-blue-800', label: 'Pharmacist' },
      'cashier': { color: 'bg-green-100 text-green-800', label: 'Cashier' },
      'assistant': { color: 'bg-purple-100 text-purple-800', label: 'Assistant' },
      'store_manager': { color: 'bg-orange-100 text-orange-800', label: 'Store Manager' }
    };
    
    const config = roleConfig[role] || roleConfig['assistant'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getAttendanceIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'half_day':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'sick_leave':
      case 'casual_leave':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'not_marked':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderStaffList = () => (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Staff Management</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Manage staff members, track attendance, and process payroll.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setActiveTab('add')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              {staffStatsLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  <p className="text-lg text-gray-400">Loading...</p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{staffStats.totalStaff}</p>
              )}
              <p className="text-xs text-blue-600">{staffStats.activeStaff} active</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              {staffStatsLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-2"></div>
                  <p className="text-lg text-gray-400">Loading...</p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{todayAttendanceStats.present}</p>
              )}
              <p className="text-xs text-green-600">
                {todayAttendanceStats.totalStaff > 0
                  ? `${Math.round((todayAttendanceStats.present / todayAttendanceStats.totalStaff) * 100)}% attendance`
                  : 'No staff data'
                }
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Leave</p>
              {staffStatsLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-2"></div>
                  <p className="text-lg text-gray-400">Loading...</p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{staffStats.onLeaveStaff}</p>
              )}
              <p className="text-xs text-yellow-600">
                {todayAttendanceStats.onLeave > 0 ? `${todayAttendanceStats.onLeave} today` : 'None today'}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full">
              <UserX className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
              {staffStatsLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
                  <p className="text-lg text-gray-400">Loading...</p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  ₹{currentMonthPayrollStats.totalPayroll?.toLocaleString() || staffStats.totalSalaryExpense?.toLocaleString() || '0'}
                </p>
              )}
              <p className="text-xs text-blue-600">
                {currentMonthPayrollStats.processedCount > 0
                  ? `${currentMonthPayrollStats.processedCount} processed`
                  : 'Current month'
                }
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('attendance')}
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
          >
            <Clock className="h-5 w-5" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <DollarSign className="h-5 w-5" />
            <span>Process Payroll</span>
          </button>
          <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2">
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
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Roles</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="cashier">Cashier</option>
              <option value="assistant">Assistant</option>
              <option value="store_manager">Store Manager</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setStatusFilter('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
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
              {staff.length > 0 ? (
                staff.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {member.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 text-left">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500 text-left">
                            ID: {member.employeeId || 'Not assigned'}
                          </div>
                          <div className="text-xs text-gray-400 text-left">
                            Joined: {member.dateOfJoining ? new Date(member.dateOfJoining).toLocaleDateString() : 'Not available'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(member.role)}
                      <div className="text-xs text-gray-500 mt-1">
                        {member.department || 'General'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center text-left">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          {member.phone || 'Not provided'}
                        </div>
                        <div className="flex items-center text-left mt-1">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          {member.email || 'Not provided'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="text-left">
                        <div className="text-green-600">
                          ₹{member.salary?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          per month
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.status)}
                      <div className="text-xs text-gray-500 mt-1">
                        Last seen: {member.lastSeen ? new Date(member.lastSeen).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewStaffDetails(member)}
                          className="text-green-600 hover:text-green-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => editStaff(member)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Staff"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => viewStaffAttendanceHistory(member)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Attendance History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => quickMarkAttendance(member, 'present')}
                          disabled={quickAttendanceLoading === member._id}
                          className={`${
                            quickAttendanceLoading === member._id
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-purple-600 hover:text-purple-900'
                          }`}
                          title={quickAttendanceLoading === member._id ? 'Marking Present...' : 'Quick Mark Present'}
                        >
                          {quickAttendanceLoading === member._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => confirmDeleteStaff(member)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Staff"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No staff members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAttendanceTab = () => (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Attendance Management</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Track daily attendance and manage staff check-ins.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={() => setShowAttendanceHistory(true)}
            className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
          >
            <History className="h-4 w-4 mr-2" />
            View History
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Staff
          </button>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-blue-600">{attendanceStats.onLeave}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">
          Attendance for {new Date(selectedDate).toLocaleDateString()}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours Worked
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
              {attendanceLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-gray-500">Loading attendance...</span>
                    </div>
                  </td>
                </tr>
              ) : staffWithAttendance.length > 0 ? (
                staffWithAttendance.map((staffMember) => {
                  const attendance = staffMember.attendance;
                  const checkInTime = attendance?.checkIn?.time ? new Date(attendance.checkIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
                  const checkOutTime = attendance?.checkOut?.time ? new Date(attendance.checkOut.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;

                  // Calculate hours worked
                  let hoursWorked = attendance?.workingHours?.actual || 0;
                  let isCurrentlyWorking = false;

                  // If checked in but not checked out, calculate current working hours
                  if (attendance?.checkIn?.time && !attendance?.checkOut?.time) {
                    const checkInDate = new Date(attendance.checkIn.time);
                    const now = new Date();
                    const diffMs = now - checkInDate;
                    hoursWorked = diffMs / (1000 * 60 * 60);
                    isCurrentlyWorking = true;
                  }

                  return (
                    <tr key={staffMember._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {staffMember.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 text-left">{staffMember.name}</div>
                            <div className="text-xs text-gray-500 text-left">{staffMember.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className={checkInTime ? 'text-gray-900' : 'text-gray-400'}>
                            {checkInTime || 'Not checked in'}
                          </span>
                          {attendance?.checkIn?.time && (
                            <span className="text-xs text-gray-500">
                              {new Date(attendance.checkIn.time).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className={checkOutTime ? 'text-gray-900' : 'text-gray-400'}>
                            {checkOutTime || 'Not checked out'}
                          </span>
                          {attendance?.checkOut?.time && (
                            <span className="text-xs text-gray-500">
                              {new Date(attendance.checkOut.time).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className={hoursWorked > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                            {hoursWorked > 0 ? `${hoursWorked.toFixed(2)} hrs` : 'No hours logged'}
                          </span>
                          {isCurrentlyWorking && (
                            <span className="text-xs text-blue-600 animate-pulse">Currently working</span>
                          )}
                          {!isCurrentlyWorking && attendance?.checkOut?.time && (
                            <span className="text-xs text-green-600">Completed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getAttendanceIcon(staffMember.attendanceStatus)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {staffMember.attendanceStatus === 'not_marked' ? 'Not Marked' : staffMember.attendanceStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col gap-2">
                          {/* Check-in buttons */}
                          {!attendance?.checkIn?.time && (
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => markAttendance(staffMember._id, 'present')}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                                  title="Check In (On Time)"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Check In
                                </button>
                                <button
                                  onClick={() => markAttendance(staffMember._id, 'late')}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-colors"
                                  title="Check In (Late)"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Late
                                </button>
                              </div>
                              <button
                                onClick={() => openTimeModal(staffMember._id, 'checkIn')}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Set Custom Check-in Time"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Set Time
                              </button>
                            </div>
                          )}

                          {/* Check-out button */}
                          {attendance?.checkIn?.time && !attendance?.checkOut?.time && (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => markCheckOut(staffMember._id)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors"
                                title="Check Out"
                              >
                                <LogOut className="h-3 w-3 mr-1" />
                                Check Out
                              </button>
                              <button
                                onClick={() => openTimeModal(staffMember._id, 'checkOut')}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                title="Set Custom Check-out Time"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Set Time
                              </button>
                            </div>
                          )}

                          {/* Status buttons */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => markAttendance(staffMember._id, 'absent')}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                              title="Mark Absent"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Absent
                            </button>
                            <button
                              onClick={() => markAttendance(staffMember._id, 'sick_leave')}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                              title="Mark On Leave"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Leave
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No staff members found for the selected date
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPayrollTab = () => (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Payroll Management</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Process monthly payroll and manage salary calculations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={() => processPayroll()}
            disabled={payrollLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {payrollLoading ? 'Processing...' : 'Process Payroll'}
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Staff
          </button>
        </div>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900">₹{payrollStats.totalPayroll?.toLocaleString() || '0'}</p>
              <p className="text-xs text-green-600">This month</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{payrollStats.paidCount || 0}</p>
              <p className="text-xs text-green-600">Salaries paid</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{payrollStats.pendingCount || 0}</p>
              <p className="text-xs text-orange-600">Awaiting payment</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Salary</p>
              <p className="text-2xl font-bold text-gray-900">₹{Math.round(payrollStats.avgSalary || 0).toLocaleString()}</p>
              <p className="text-xs text-blue-600">Per employee</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">
          Payroll for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Worked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrollLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-gray-500">Loading payroll...</span>
                    </div>
                  </td>
                </tr>
              ) : payrollData.length > 0 ? (
                payrollData.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {record.staff?.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 text-left">{record.staff?.name}</div>
                          <div className="text-xs text-gray-500 text-left">{record.staff?.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{record.baseSalary?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.attendanceData?.daysWorked || 0} / {record.attendanceData?.totalWorkingDays || 30}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      +₹{record.totalAllowances?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -₹{record.totalDeductions?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{record.netSalary?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : record.paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {record.paymentStatus === 'paid' ? 'Paid' : record.paymentStatus === 'pending' ? 'Pending' : 'Draft'}
                        </span>
                        {record.paymentStatus === 'pending' && (
                          <button
                            onClick={() => updatePayrollStatus(record._id, 'paid', 'bank_transfer')}
                            className="text-green-600 hover:text-green-900 text-xs"
                            title="Mark as Paid"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No payroll records found for the selected month
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) errors.name = 'Name is required';
    if (!formData.email?.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    if (!formData.phone?.trim()) errors.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(formData.phone)) errors.phone = 'Phone must be 10 digits';
    if (!formData.role) errors.role = 'Role is required';
    if (!formData.department) errors.department = 'Department is required';
    if (!formData.dateOfJoining) errors.dateOfJoining = 'Date of joining is required';
    if (!formData.salary || isNaN(formData.salary) || parseInt(formData.salary) <= 0) {
      errors.salary = 'Valid salary is required (must be a positive number)';
    }
    if (!formData.workingHours) errors.workingHours = 'Working hours is required';

    console.log('Form validation errors:', errors);
    console.log('Form data:', formData);

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmitStaff = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');

      // Prepare form data with proper data types
      const submitData = {
        ...formData,
        salary: parseInt(formData.salary) || 0,
        employeeId: formData.employeeId?.trim() || '', // Allow empty for auto-generation
        phone: formData.phone?.trim(),
        email: formData.email?.trim().toLowerCase(),
        name: formData.name?.trim()
      };

      console.log('Submitting staff data:', submitData);

      const response = await fetch('/api/store-manager/staff', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Staff created successfully:', data);

        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          employeeId: '',
          role: '',
          department: '',
          dateOfJoining: new Date().toISOString().split('T')[0],
          salary: '',
          workingHours: 'full_time',
          address: { street: '', city: '', state: '', pincode: '' },
          dateOfBirth: '',
          emergencyContact: { name: '', phone: '', relationship: '' },
          qualifications: [],
          certifications: []
        });
        setFormErrors({});
        setSuccess('Staff member added successfully');
        setActiveTab('list');
        fetchStaff(); // Refresh staff list
      } else {
        const data = await response.json();
        console.error('Staff creation failed:', data);

        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          setError(`Validation Error: ${data.errors.join(', ')}`);
        } else {
          setError(data.message || 'Failed to add staff member');
        }
      }
    } catch (error) {
      console.error('Add staff error:', error);
      setError('Failed to add staff member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Add Staff Form
  const renderAddStaffForm = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">Add New Staff Member</h2>
        <button
          onClick={() => setActiveTab('list')}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmitStaff} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter 10-digit phone number"
              />
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>
        </div>

        {/* Role and Department */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Role & Department</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.role ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Role</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="assistant">Assistant</option>
                <option value="cashier">Cashier</option>
                <option value="inventory_manager">Inventory Manager</option>
                <option value="sales_executive">Sales Executive</option>
                <option value="supervisor">Supervisor</option>
              </select>
              {formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.department ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Department</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="sales">Sales</option>
                <option value="inventory">Inventory</option>
                <option value="administration">Administration</option>
                <option value="customer_service">Customer Service</option>
              </select>
              {formErrors.department && <p className="text-red-500 text-xs mt-1">{formErrors.department}</p>}
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Joining *
              </label>
              <input
                type="date"
                name="dateOfJoining"
                value={formData.dateOfJoining}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.dateOfJoining ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {formErrors.dateOfJoining && <p className="text-red-500 text-xs mt-1">{formErrors.dateOfJoining}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Salary (₹) *
              </label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                  formErrors.salary ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter monthly salary"
                min="0"
              />
              {formErrors.salary && <p className="text-red-500 text-xs mt-1">{formErrors.salary}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Working Hours
              </label>
              <select
                name="workingHours"
                value={formData.workingHours}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Staff Member'}
          </button>
        </div>
      </form>
    </div>
  );

  if (loading && staff.length === 0) {
    return (
      <StoreManagerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </StoreManagerLayout>
    );
  }

  // Show attendance history if requested
  if (showAttendanceHistory) {
    return (
      <StoreManagerLayout>
        <div className="relative">
          <button
            onClick={() => setShowAttendanceHistory(false)}
            className="absolute top-4 left-4 z-10 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Attendance
          </button>
          <StoreManagerAttendanceHistory />
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
                Staff List
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`${
                  activeTab === 'attendance'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab('payroll')}
                className={`${
                  activeTab === 'payroll'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Payroll
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`${
                  activeTab === 'add'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Add Staff
              </button>
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-red-800">{error}</div>
                <button
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800 ml-4"
                  aria-label="Dismiss error"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-green-800">{success}</div>
                <button
                  onClick={clearSuccess}
                  className="text-green-600 hover:text-green-800 ml-4"
                  aria-label="Dismiss success message"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'list' && renderStaffList()}
          {activeTab === 'attendance' && renderAttendanceTab()}
          {activeTab === 'payroll' && renderPayrollTab()}
          {activeTab === 'add' && renderAddStaffForm()}
        </div>
      </div>

      {/* Staff Details Modal */}
      {showStaffModal && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Staff Details</h3>
              <button
                onClick={() => setShowStaffModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedStaff.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedStaff.employeeId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedStaff.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedStaff.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedStaff.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedStaff.department || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Joining</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedStaff.dateOfJoining ? new Date(selectedStaff.dateOfJoining).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Salary</label>
                  <p className="mt-1 text-sm text-gray-900">₹{selectedStaff.salary?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedStaff.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Working Hours</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedStaff.workingHours?.replace('_', ' ') || 'N/A'}</p>
                </div>
              </div>

              {selectedStaff.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {[selectedStaff.address.street, selectedStaff.address.city, selectedStaff.address.state, selectedStaff.address.pincode]
                      .filter(Boolean).join(', ') || 'N/A'}
                  </p>
                </div>
              )}

              {selectedStaff.emergencyContact && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedStaff.emergencyContact.name} ({selectedStaff.emergencyContact.relationship}) - {selectedStaff.emergencyContact.phone}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStaffModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowStaffModal(false);
                  editStaff(selectedStaff);
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Edit Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Staff Member</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStaff(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={updateStaffMember} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                  {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Leave empty for auto-generation"
                  />
                  {formErrors.employeeId && <p className="mt-1 text-sm text-red-600">{formErrors.employeeId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                  {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                  {formErrors.phone && <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="assistant">Assistant</option>
                    <option value="cashier">Cashier</option>
                    <option value="inventory_manager">Inventory Manager</option>
                    <option value="sales_executive">Sales Executive</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="store_manager">Store Manager</option>
                  </select>
                  {formErrors.role && <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Salary</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter monthly salary"
                  />
                  {formErrors.salary && <p className="mt-1 text-sm text-red-600">{formErrors.salary}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStaff(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && staffToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Staff Member</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <strong>{staffToDelete.name}</strong>?
                  This action will deactivate the staff member and cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setStaffToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteStaffMember}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Entry Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Set {timeModalData.type === 'checkIn' ? 'Check-in' : 'Check-out'} Time
              </h3>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time (24-hour format)
                </label>
                <input
                  type="time"
                  value={timeModalData.currentTime}
                  onChange={(e) => setTimeModalData({...timeModalData, currentTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTimeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualTimeEntry}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Set Time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StoreManagerLayout>
  );
};

export default StoreManagerStaff;
