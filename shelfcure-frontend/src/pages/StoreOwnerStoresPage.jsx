import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Store, MapPin, Phone, Mail } from 'lucide-react';
import StoreOwnerLayout from '../components/store-owner/StoreOwnerLayout';


const StoreOwnerStoresPage = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/store-owner/stores', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStores(data.data || []);
      } else {
        throw new Error('Failed to fetch stores');
      }
    } catch (error) {
      console.error('Fetch stores error:', error);
      setError('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Action handlers
  const handleViewStore = (storeId) => {
    navigate(`/store-owner/stores/${storeId}`);
  };

  const handleEditStore = (storeId) => {
    navigate(`/store-owner/stores/${storeId}/edit`);
  };

  const handleDeleteStore = async (storeId, storeName) => {
    const store = stores.find(s => s._id === storeId);
    const confirmMessage = store?.isActive
      ? `Are you sure you want to delete "${storeName}"? This will deactivate the store.`
      : `Are you sure you want to remove "${storeName}" from your list?`;

    if (window.confirm(confirmMessage)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/store-owner/stores/${storeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          // Remove the deleted store from the list
          setStores(stores.filter(store => store._id !== storeId));
          alert(responseData.message || 'Store deleted successfully');
        } else {
          const errorData = await response.json();
          alert(`Failed to delete store: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Delete store error:', error);
        alert('Failed to delete store. Please try again.');
      }
    }
  };

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
            <h1 className="text-2xl font-semibold text-gray-900">My Stores</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage all your pharmacy stores from one place.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => navigate('/store-owner/stores/create')}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Store
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
              placeholder="Search stores..."
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

        {/* Stores Grid */}
        <div className="mt-8">
          {filteredStores.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStores.map((store) => (
                <div key={store._id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <Store className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{store.name}</h3>
                        <p className="text-sm text-gray-500">Code: {store.code}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          store.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {store.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {store.address && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">
                            {typeof store.address === 'string'
                              ? store.address
                              : `${store.address.street || ''}, ${store.address.city || ''}, ${store.address.state || ''} ${store.address.pincode || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ',')
                            }
                          </span>
                        </div>
                      )}
                      {store.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{store.phone}</span>
                        </div>
                      )}
                      {store.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{store.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Staff: {store.staffCount || 0}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewStore(store._id)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title="View Store"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditStore(store._id)}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                          title="Edit Store"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStore(store._id, store.name)}
                          className={`p-1 rounded ${
                            store.isActive
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}
                          title={store.isActive ? "Delete Store" : "Remove from List"}
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
              <Store className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No stores</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'No stores match your search.' : 'Get started by creating your first store.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/store-owner/stores/create')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Store
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </StoreOwnerLayout>
  );
};

export default StoreOwnerStoresPage;
