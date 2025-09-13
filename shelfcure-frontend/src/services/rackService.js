import { makeAuthenticatedRequest } from '../config/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to clean parameters
const cleanParams = (params) => {
  return Object.entries(params)
    .filter(([key, value]) => value !== undefined && value !== null && value !== '')
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
};

// ===================
// RACK MANAGEMENT API
// ===================

// Rack CRUD operations
export const getRacks = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(cleanParams(params)).toString();
    const url = `${API_BASE_URL}/api/store-manager/racks${queryString ? `?${queryString}` : ''}`;
    return await makeAuthenticatedRequest(url);
  } catch (error) {
    throw error;
  }
};

export const getRack = async (rackId) => {
  try {
    const url = `${API_BASE_URL}/api/store-manager/racks/${rackId}`;
    return await makeAuthenticatedRequest(url);
  } catch (error) {
    throw error;
  }
};

export const createRack = async (rackData) => {
  try {
    const url = `${API_BASE_URL}/api/store-manager/racks`;
    return await makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(rackData)
    });
  } catch (error) {
    throw error;
  }
};

export const updateRack = async (rackId, rackData) => {
  try {
    const url = `${API_BASE_URL}/api/store-manager/racks/${rackId}`;
    return await makeAuthenticatedRequest(url, {
      method: 'PUT',
      body: JSON.stringify(rackData)
    });
  } catch (error) {
    throw error;
  }
};

export const deleteRack = async (rackId) => {
  try {
    const url = `${API_BASE_URL}/api/store-manager/racks/${rackId}`;
    return await makeAuthenticatedRequest(url, {
      method: 'DELETE'
    });
  } catch (error) {
    throw error;
  }
};

// Rack layout and occupancy
export const getRackLayout = async (rackId) => {
  try {
    const url = `${API_BASE_URL}/api/store-manager/rack-layout/${rackId}`;
    return await makeAuthenticatedRequest(url);
  } catch (error) {
    throw error;
  }
};

export const getRackOccupancy = async () => {
  try {
    const url = `${API_BASE_URL}/api/store-manager/rack-occupancy`;
    return await makeAuthenticatedRequest(url);
  } catch (error) {
    throw error;
  }
};

// Medicine location management
export const assignMedicineToLocation = async (locationData) => {
  try {
    const url = `${API_BASE_URL}/api/store-manager/rack-locations`;
    return await makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(locationData)
    });
  } catch (error) {
    throw error;
  }
};

export const updateLocationQuantity = async (locationId, quantityData) => {
  try {
    const url = `${API_BASE_URL}/api/store-manager/rack-locations/${locationId}`;
    return await makeAuthenticatedRequest(url, {
      method: 'PUT',
      body: JSON.stringify(quantityData)
    });
  } catch (error) {
    throw error;
  }
};

export const moveMedicineLocation = async (locationId, moveData) => {
  try {
    const url = `${API_BASE_URL}/api/store-manager/rack-locations/${locationId}/move`;
    return await makeAuthenticatedRequest(url, {
      method: 'PUT',
      body: JSON.stringify(moveData)
    });
  } catch (error) {
    throw error;
  }
};

export const removeMedicineFromLocation = async (locationId, reason) => {
  try {
    const url = `${API_BASE_URL}/api/store-manager/rack-locations/${locationId}`;
    return await makeAuthenticatedRequest(url, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
  } catch (error) {
    throw error;
  }
};

// Medicine location search
export const searchMedicineLocations = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(cleanParams(params)).toString();
    const url = `${API_BASE_URL}/api/store-manager/medicine-locations/search${queryString ? `?${queryString}` : ''}`;
    return await makeAuthenticatedRequest(url);
  } catch (error) {
    throw error;
  }
};

export const getMedicineLocations = async (medicineId) => {
  try {
    const url = `${API_BASE_URL}/api/store-manager/medicine-locations/${medicineId}`;
    return await makeAuthenticatedRequest(url);
  } catch (error) {
    throw error;
  }
};

export const getUnassignedMedicines = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(cleanParams(params)).toString();
    const url = `${API_BASE_URL}/api/store-manager/medicine-locations/unassigned${queryString ? `?${queryString}` : ''}`;
    return await makeAuthenticatedRequest(url);
  } catch (error) {
    throw error;
  }
};

export const searchMedicinesByLocation = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(cleanParams(params)).toString();
    const url = `${API_BASE_URL}/api/store-manager/medicines/search-by-location${queryString ? `?${queryString}` : ''}`;
    return await makeAuthenticatedRequest(url);
  } catch (error) {
    throw error;
  }
};

// Staff-accessible medicine location search (read-only)
export const searchMedicineLocationsStaff = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(cleanParams(params)).toString();
    const url = `${API_BASE_URL}/api/medicine-locations/search${queryString ? `?${queryString}` : ''}`;
    return await makeAuthenticatedRequest(url);
  } catch (error) {
    throw error;
  }
};

export const getMedicineLocationsStaff = async (medicineId) => {
  try {
    const url = `${API_BASE_URL}/api/medicine-locations/${medicineId}`;
    return await makeAuthenticatedRequest(url);
  } catch (error) {
    throw error;
  }
};

// Utility functions
export const getStockStatusColor = (status) => {
  switch (status?.status) {
    case 'empty':
      return 'text-red-600 bg-red-100';
    case 'low':
      return 'text-yellow-600 bg-yellow-100';
    case 'good':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const formatLocationString = (rack, shelf, position) => {
  const rackNumber = typeof rack === 'object' ? rack.rackNumber : rack;
  return `${rackNumber}-${shelf}-${position}`;
};

export const getRackCategoryColor = (category) => {
  switch (category) {
    case 'general':
      return 'bg-blue-100 text-blue-800';
    case 'refrigerated':
      return 'bg-cyan-100 text-cyan-800';
    case 'controlled_substances':
      return 'bg-red-100 text-red-800';
    case 'otc':
      return 'bg-green-100 text-green-800';
    case 'prescription':
      return 'bg-purple-100 text-purple-800';
    case 'surgical':
      return 'bg-orange-100 text-orange-800';
    case 'emergency':
      return 'bg-pink-100 text-pink-800';
    case 'expired':
      return 'bg-gray-100 text-gray-800';
    case 'quarantine':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'primary':
      return 'bg-green-100 text-green-800';
    case 'secondary':
      return 'bg-blue-100 text-blue-800';
    case 'overflow':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
