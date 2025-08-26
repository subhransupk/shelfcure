import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Mail,
  Phone,
  Calendar,
  Building,
  Shield
} from 'lucide-react';
import StoreOwnerLayout from '../components/store-owner/StoreOwnerLayout';
import AddStaffModal from '../components/store-owner/AddStaffModal';
import EditStaffModal from '../components/store-owner/EditStaffModal';

const StoreOwnerStaffPage = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    fetchStores();
    fetchAllStaff();
  }, []);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/store-owner/stores', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data.data || []);
      } else {
        throw new Error('Failed to fetch stores');
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setError('Failed to load stores');
    }
  };

  const fetchAllStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/store-owner/staff', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data.data || []);
      } else {
        throw new Error('Failed to fetch staff');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  // Action handlers
  const handleViewStaff = (staffId) => {
    // Navigate to staff details page when implemented
    console.log('View staff:', staffId);
  };

  const handleEditStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowEditModal(true);
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (window.confirm(`Are you sure you want to delete "${staffName}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/store-owner/staff/${staffId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          // Remove the deleted staff from the list
          setStaff(staff.filter(member => member._id !== staffId));
          alert('Staff member deleted successfully');
        } else {
          const errorData = await response.json();
          alert(`Failed to delete staff member: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Delete staff error:', error);
        alert('Failed to delete staff member. Please try again.');
      }
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'store_manager': return 'bg-purple-100 text-purple-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'cashier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredStaff = staff.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <StoreOwnerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </StoreOwnerLayout>
    );
  }

  return (
    <StoreOwnerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Staff Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage staff across all your pharmacy stores.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Search staff members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Staff Grid */}
        <div className="mt-8">
          {filteredStaff.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStaff.map((member) => (
                <div key={member._id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                            {member.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {member.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      {member.store && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{member.store.name}</span>
                        </div>
                      )}
                      {member.createdAt && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        ID: {member._id?.slice(-6) || 'N/A'}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewStaff(member._id)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="View Staff"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditStaff(member)}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                          title="Edit Staff"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(member._id, member.name)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="Delete Staff"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'No staff members match your search.' : 'Get started by adding your first staff member.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff Member
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        stores={stores}
        onStaffAdded={fetchAllStaff}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        stores={stores}
        onStaffUpdated={fetchAllStaff}
      />
    </StoreOwnerLayout>
  );
};

export default StoreOwnerStaffPage;
