// Role-based permission utilities for rack management

export const ROLES = {
  STORE_OWNER: 'store_owner',
  STORE_MANAGER: 'store_manager',
  STAFF: 'staff',
  CASHIER: 'cashier'
};

export const RACK_PERMISSIONS = {
  // Rack CRUD operations
  CREATE_RACK: 'create_rack',
  VIEW_RACK: 'view_rack',
  UPDATE_RACK: 'update_rack',
  DELETE_RACK: 'delete_rack',
  
  // Medicine location management
  ASSIGN_MEDICINE: 'assign_medicine',
  UPDATE_LOCATION: 'update_location',
  MOVE_MEDICINE: 'move_medicine',
  REMOVE_MEDICINE: 'remove_medicine',
  
  // Search and view permissions
  SEARCH_LOCATIONS: 'search_locations',
  VIEW_LOCATIONS: 'view_locations',
  VIEW_OCCUPANCY: 'view_occupancy'
};

// Define role-based permissions
const ROLE_PERMISSIONS = {
  [ROLES.STORE_OWNER]: [
    // Store owners have all permissions
    ...Object.values(RACK_PERMISSIONS)
  ],
  
  [ROLES.STORE_MANAGER]: [
    // Store managers have all permissions except some advanced ones
    RACK_PERMISSIONS.CREATE_RACK,
    RACK_PERMISSIONS.VIEW_RACK,
    RACK_PERMISSIONS.UPDATE_RACK,
    RACK_PERMISSIONS.DELETE_RACK,
    RACK_PERMISSIONS.ASSIGN_MEDICINE,
    RACK_PERMISSIONS.UPDATE_LOCATION,
    RACK_PERMISSIONS.MOVE_MEDICINE,
    RACK_PERMISSIONS.REMOVE_MEDICINE,
    RACK_PERMISSIONS.SEARCH_LOCATIONS,
    RACK_PERMISSIONS.VIEW_LOCATIONS,
    RACK_PERMISSIONS.VIEW_OCCUPANCY
  ],
  
  [ROLES.STAFF]: [
    // Staff can only view and search
    RACK_PERMISSIONS.VIEW_RACK,
    RACK_PERMISSIONS.SEARCH_LOCATIONS,
    RACK_PERMISSIONS.VIEW_LOCATIONS
  ],
  
  [ROLES.CASHIER]: [
    // Cashiers can only view and search (same as staff)
    RACK_PERMISSIONS.VIEW_RACK,
    RACK_PERMISSIONS.SEARCH_LOCATIONS,
    RACK_PERMISSIONS.VIEW_LOCATIONS
  ]
};

/**
 * Check if a user has a specific permission
 * @param {string} userRole - The user's role
 * @param {string} permission - The permission to check
 * @returns {boolean} - Whether the user has the permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

/**
 * Check if a user can manage racks (create, edit, delete)
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user can manage racks
 */
export const canManageRacks = (userRole) => {
  return hasPermission(userRole, RACK_PERMISSIONS.CREATE_RACK) ||
         hasPermission(userRole, RACK_PERMISSIONS.UPDATE_RACK) ||
         hasPermission(userRole, RACK_PERMISSIONS.DELETE_RACK);
};

/**
 * Check if a user can manage medicine locations
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user can manage medicine locations
 */
export const canManageLocations = (userRole) => {
  return hasPermission(userRole, RACK_PERMISSIONS.ASSIGN_MEDICINE) ||
         hasPermission(userRole, RACK_PERMISSIONS.UPDATE_LOCATION) ||
         hasPermission(userRole, RACK_PERMISSIONS.MOVE_MEDICINE) ||
         hasPermission(userRole, RACK_PERMISSIONS.REMOVE_MEDICINE);
};

/**
 * Check if a user can only view (read-only access)
 * @param {string} userRole - The user's role
 * @returns {boolean} - Whether the user has read-only access
 */
export const isReadOnlyUser = (userRole) => {
  return userRole === ROLES.STAFF || userRole === ROLES.CASHIER;
};

/**
 * Get user-friendly role name
 * @param {string} userRole - The user's role
 * @returns {string} - User-friendly role name
 */
export const getRoleName = (userRole) => {
  switch (userRole) {
    case ROLES.STORE_OWNER:
      return 'Store Owner';
    case ROLES.STORE_MANAGER:
      return 'Store Manager';
    case ROLES.STAFF:
      return 'Staff';
    case ROLES.CASHIER:
      return 'Cashier';
    default:
      return 'Unknown';
  }
};

/**
 * Get available actions for a user role
 * @param {string} userRole - The user's role
 * @returns {Array} - Array of available actions
 */
export const getAvailableActions = (userRole) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  const actions = [];

  if (permissions.includes(RACK_PERMISSIONS.CREATE_RACK)) {
    actions.push({ key: 'create', label: 'Create Rack', icon: 'plus' });
  }
  
  if (permissions.includes(RACK_PERMISSIONS.UPDATE_RACK)) {
    actions.push({ key: 'edit', label: 'Edit Rack', icon: 'edit' });
  }
  
  if (permissions.includes(RACK_PERMISSIONS.DELETE_RACK)) {
    actions.push({ key: 'delete', label: 'Delete Rack', icon: 'trash' });
  }
  
  if (permissions.includes(RACK_PERMISSIONS.VIEW_RACK)) {
    actions.push({ key: 'view', label: 'View Layout', icon: 'eye' });
  }
  
  if (permissions.includes(RACK_PERMISSIONS.ASSIGN_MEDICINE)) {
    actions.push({ key: 'assign', label: 'Assign Medicine', icon: 'map-pin' });
  }
  
  if (permissions.includes(RACK_PERMISSIONS.SEARCH_LOCATIONS)) {
    actions.push({ key: 'search', label: 'Search Locations', icon: 'search' });
  }

  return actions;
};

/**
 * Filter navigation items based on user role
 * @param {Array} navigationItems - Array of navigation items
 * @param {string} userRole - The user's role
 * @returns {Array} - Filtered navigation items
 */
export const filterNavigationByRole = (navigationItems, userRole) => {
  if (!userRole) return [];

  // Store managers and owners can see all navigation items
  if (userRole === ROLES.STORE_MANAGER || userRole === ROLES.STORE_OWNER) {
    return navigationItems;
  }

  // Staff and cashiers can only see certain items
  const allowedItems = [
    'Dashboard',
    'Medicine Location Search',
    'Inventory', // Read-only
    'Sales & POS', // If they have sales permissions
    'Customers' // Read-only
  ];

  return navigationItems.filter(item => 
    allowedItems.some(allowed => item.name.includes(allowed))
  );
};

/**
 * Get permission-based CSS classes for UI elements
 * @param {string} userRole - The user's role
 * @param {string} permission - The required permission
 * @returns {string} - CSS classes
 */
export const getPermissionClasses = (userRole, permission) => {
  if (hasPermission(userRole, permission)) {
    return 'cursor-pointer hover:bg-gray-50';
  }
  return 'cursor-not-allowed opacity-50';
};

/**
 * Show permission-based tooltips
 * @param {string} userRole - The user's role
 * @param {string} permission - The required permission
 * @returns {string} - Tooltip text
 */
export const getPermissionTooltip = (userRole, permission) => {
  if (hasPermission(userRole, permission)) {
    return '';
  }
  
  const roleName = getRoleName(userRole);
  return `${roleName} role does not have permission for this action`;
};

export default {
  ROLES,
  RACK_PERMISSIONS,
  hasPermission,
  canManageRacks,
  canManageLocations,
  isReadOnlyUser,
  getRoleName,
  getAvailableActions,
  filterNavigationByRole,
  getPermissionClasses,
  getPermissionTooltip
};
