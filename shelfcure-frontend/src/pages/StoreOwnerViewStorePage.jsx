import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StoreOwnerLayout from '../components/store-owner/StoreOwnerLayout';
import {
  ArrowLeft, Store, MapPin, Phone, Mail, Calendar,
  User, Users, CheckCircle, XCircle, Edit,
  Building, Clock, Shield, Package
} from 'lucide-react';

const StoreOwnerViewStorePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStore();
  }, [id]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/store-owner/stores/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setStoreData(data.data);
      } else {
        setError(data.message || 'Failed to fetch store details');
      }
    } catch (error) {
      console.error('Error fetching store:', error);
      setError('Error fetching store details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StoreOwnerLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </StoreOwnerLayout>
    );
  }

  if (error) {
    return (
      <StoreOwnerLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StoreOwnerLayout>
    );
  }

  if (!storeData) {
    return (
      <StoreOwnerLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Store not found</h3>
            <p className="mt-1 text-sm text-gray-500">The store you're looking for doesn't exist.</p>
          </div>
        </div>
      </StoreOwnerLayout>
    );
  }

  const store = storeData;

  return (
    <StoreOwnerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/store-owner/stores')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Stores
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/store-owner/stores/${id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Store
              </button>
            </div>
          </div>
        </div>

        {/* Store Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
                <p className="text-sm text-gray-500">Store Code: {store.code}</p>
              </div>
              <div className="ml-auto">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  store.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {store.isActive ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 text-left">Contact Information</h3>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">Email</p>
                    <p className="text-gray-900 text-left">{store.contact?.email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">Phone</p>
                    <p className="text-gray-900 text-left">{store.contact?.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">Address</p>
                    <p className="text-gray-900 text-left">
                      {store.address ? (
                        <>
                          {store.address.street && <span>{store.address.street}<br /></span>}
                          {store.address.city && <span>{store.address.city}, </span>}
                          {store.address.state && <span>{store.address.state} </span>}
                          {store.address.pincode && <span>{store.address.pincode}</span>}
                        </>
                      ) : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 text-left">Business Information</h3>
                
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">License Number</p>
                    <p className="text-gray-900 text-left">{store.business?.licenseNumber || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">GST Number</p>
                    <p className="text-gray-900 text-left">{store.business?.gstNumber || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">Created</p>
                    <p className="text-gray-900 text-left">
                      {store.createdAt ? new Date(store.createdAt).toLocaleDateString() : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-left">Store Statistics</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{store.stats?.totalProducts || 0}</div>
                <div className="text-sm text-gray-500">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{store.stats?.totalSales || 0}</div>
                <div className="text-sm text-gray-500">Total Sales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{store.stats?.totalCustomers || 0}</div>
                <div className="text-sm text-gray-500">Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{store.totalStaff || 0}</div>
                <div className="text-sm text-gray-500">Staff Members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreOwnerLayout>
  );
};

export default StoreOwnerViewStorePage;
