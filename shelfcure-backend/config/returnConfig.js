// Return system configuration
const returnConfig = {
  // Return window in days
  returnWindowDays: 30,
  
  // Maximum returns per user per day
  maxReturnsPerUserPerDay: 10,
  
  // Minimum return amount (in currency)
  minimumReturnAmount: 0,
  
  // Return time restrictions
  timeRestrictions: {
    enabled: false, // Set to true to enable time-based restrictions
    allowedHours: {
      start: 6, // 6 AM
      end: 22   // 10 PM
    }
  },
  
  // Return reasons that require manager approval
  managerApprovalRequired: [
    'billing_error',
    'quality_issue',
    'other'
  ],
  
  // Return reasons that should not restore inventory by default
  noInventoryRestoreReasons: [
    'expired_medicine',
    'defective_product',
    'quality_issue'
  ],
  
  // Maximum return percentage of original sale
  maxReturnPercentage: 100, // 100% means full return allowed
  
  // Days after which returns require manager approval
  managerApprovalAfterDays: 7,
  
  // Enable/disable return features
  features: {
    partialReturns: true,
    inventoryRestoration: true,
    returnAnalytics: true,
    returnNotifications: true
  },
  
  // Return validation rules
  validation: {
    requireReturnReason: true,
    requireCustomerPresence: false,
    requireOriginalReceipt: false,
    allowCrossUnitReturns: true // Allow returning strips as individual units and vice versa
  }
};

module.exports = returnConfig;
