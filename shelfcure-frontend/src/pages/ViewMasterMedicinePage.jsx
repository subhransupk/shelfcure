import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '../config/api';
import {
  ArrowLeft, Edit, Trash2, Pill, Building, User, Calendar,
  Package, DollarSign, AlertTriangle, CheckCircle, XCircle,
  FileText, Tag, Beaker, Factory, Shield, Clock
} from 'lucide-react';

const ViewMasterMedicinePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMedicine();
  }, [id]);

  const fetchMedicine = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await makeAuthenticatedRequest(`${API_ENDPOINTS.ADMIN_MEDICINES}/${id}`);
      
      if (data.success) {
        setMedicine(data.data);
      } else {
        setError(data.message || 'Failed to fetch medicine details');
      }
    } catch (error) {
      console.error('Error fetching medicine:', error);
      setError('Error fetching medicine details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) {
      try {
        const data = await makeAuthenticatedRequest(`${API_ENDPOINTS.ADMIN_MEDICINES}/${id}`, {
          method: 'DELETE'
        });
        
        if (data.success) {
          alert('Medicine deleted successfully!');
          navigate('/admin/master-medicines');
        } else {
          alert(`Failed to delete medicine: ${data.message}`);
        }
      } catch (error) {
        console.error('Error deleting medicine:', error);
        alert('Error deleting medicine. Please try again.');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Pill className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/admin/master-medicines')}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Back to Medicines
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!medicine) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Medicine Not Found</h2>
            <p className="text-gray-600 mb-4">The medicine you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/admin/master-medicines')}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Back to Medicines
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/master-medicines')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 text-left">Medicine Details</h1>
              <p className="text-gray-600 text-left">View and manage medicine information</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/admin/master-medicines/${id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Medicine
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Medicine
            </button>
          </div>
        </div>

        {/* Medicine Status Badge */}
        <div className="flex items-center gap-2">
          {medicine.isActive ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircle className="w-3 h-3 mr-1" />
              Inactive
            </span>
          )}
          
          {medicine.requiresPrescription && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <Shield className="w-3 h-3 mr-1" />
              Prescription Required
            </span>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Basic Information
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Medicine Name</label>
                <p className="text-lg font-semibold text-gray-900 text-left">{medicine.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Generic Name</label>
                <p className="text-gray-900 text-left">{medicine.genericName || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Category</label>
                <p className="text-gray-900 text-left">{medicine.category || 'N/A'}</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Composition</label>
                <p className="text-gray-900 text-left">{medicine.composition || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Description</label>
                <p className="text-gray-900 text-left">{medicine.description || 'No description available'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Manufacturer & Supplier Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
              <Factory className="w-5 h-5" />
              Manufacturer & Supplier
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Manufacturer</label>
                <p className="text-gray-900 text-left">{medicine.manufacturer || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Supplier</label>
                <p className="text-gray-900 text-left">{medicine.supplier || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Batch Number</label>
                <p className="text-gray-900 text-left">{medicine.batchNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Barcode</label>
                <p className="text-gray-900 text-left font-mono">{medicine.barcode || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing Information
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Purchase Price</label>
                <p className="text-lg font-semibold text-gray-900 text-left">{formatCurrency(medicine.purchasePrice)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Selling Price</label>
                <p className="text-lg font-semibold text-gray-900 text-left">{formatCurrency(medicine.sellingPrice)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">MRP</label>
                <p className="text-lg font-semibold text-gray-900 text-left">{formatCurrency(medicine.mrp)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Discount (%)</label>
                <p className="text-gray-900 text-left">{medicine.discount || 0}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Tax Rate (%)</label>
                <p className="text-gray-900 text-left">{medicine.taxRate || 0}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Information
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Unit</label>
                <p className="text-gray-900 text-left">{medicine.unit || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Pack Size</label>
                <p className="text-gray-900 text-left">{medicine.packSize || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Minimum Stock Level</label>
                <p className="text-gray-900 text-left">{medicine.minStockLevel || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Maximum Stock Level</label>
                <p className="text-gray-900 text-left">{medicine.maxStockLevel || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Reorder Level</label>
                <p className="text-gray-900 text-left">{medicine.reorderLevel || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dates & Expiry */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Important Dates
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Manufacturing Date</label>
                <p className="text-gray-900 text-left">
                  {medicine.manufacturingDate ? formatDate(medicine.manufacturingDate) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Expiry Date</label>
                <p className="text-gray-900 text-left">
                  {medicine.expiryDate ? formatDate(medicine.expiryDate) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Created Date</label>
                <p className="text-gray-900 text-left">{formatDate(medicine.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Last Updated</label>
                <p className="text-gray-900 text-left">{formatDate(medicine.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Additional Information
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Storage Instructions</label>
                <p className="text-gray-900 text-left">{medicine.storageInstructions || 'No special storage instructions'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Side Effects</label>
                <p className="text-gray-900 text-left">{medicine.sideEffects || 'No side effects listed'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Dosage Instructions</label>
                <p className="text-gray-900 text-left">{medicine.dosageInstructions || 'No dosage instructions available'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Contraindications</label>
                <p className="text-gray-900 text-left">{medicine.contraindications || 'No contraindications listed'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Created/Updated By */}
        {(medicine.createdBy || medicine.updatedBy) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
                <User className="w-5 h-5" />
                Record Information
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {medicine.createdBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Created By</label>
                    <p className="text-gray-900 text-left">{medicine.createdBy.name} ({medicine.createdBy.email})</p>
                  </div>
                )}
                {medicine.updatedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Last Updated By</label>
                    <p className="text-gray-900 text-left">{medicine.updatedBy.name} ({medicine.updatedBy.email})</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ViewMasterMedicinePage;
