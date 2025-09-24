/**
 * Utility functions for input validation and formatting
 */

/**
 * Validates and formats numeric input to prevent non-numeric characters
 * @param {string} value - The input value
 * @param {Object} options - Validation options
 * @param {boolean} options.allowDecimals - Allow decimal points (default: true)
 * @param {boolean} options.allowNegative - Allow negative numbers (default: false)
 * @param {number} options.maxDecimals - Maximum decimal places (default: 2)
 * @param {number} options.min - Minimum value (optional)
 * @param {number} options.max - Maximum value (optional)
 * @returns {string} - Validated and formatted value
 */
export const validateNumericInput = (value, options = {}) => {
  const {
    allowDecimals = true,
    allowNegative = false,
    maxDecimals = 2,
    min,
    max
  } = options;

  // Convert to string if not already
  let stringValue = String(value);

  // Remove any non-numeric characters except decimal point and minus sign
  let cleanValue = stringValue.replace(/[^\d.-]/g, '');

  // Handle negative sign
  if (!allowNegative) {
    cleanValue = cleanValue.replace(/-/g, '');
  } else {
    // Only allow one minus sign at the beginning
    const minusCount = (cleanValue.match(/-/g) || []).length;
    if (minusCount > 1) {
      cleanValue = cleanValue.replace(/-/g, '');
      if (stringValue.startsWith('-')) {
        cleanValue = '-' + cleanValue;
      }
    } else if (cleanValue.includes('-') && !cleanValue.startsWith('-')) {
      cleanValue = cleanValue.replace(/-/g, '');
    }
  }

  // Handle decimal points
  if (!allowDecimals) {
    cleanValue = cleanValue.replace(/\./g, '');
  } else {
    // Only allow one decimal point
    const decimalCount = (cleanValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const parts = cleanValue.split('.');
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limit decimal places
    if (cleanValue.includes('.')) {
      const [integerPart, decimalPart] = cleanValue.split('.');
      if (decimalPart && decimalPart.length > maxDecimals) {
        cleanValue = integerPart + '.' + decimalPart.substring(0, maxDecimals);
      }
    }
  }

  // Apply min/max constraints if specified
  if (cleanValue !== '' && cleanValue !== '-' && cleanValue !== '.') {
    const numericValue = parseFloat(cleanValue);
    if (!isNaN(numericValue)) {
      if (typeof min === 'number' && numericValue < min) {
        cleanValue = String(min);
      }
      if (typeof max === 'number' && numericValue > max) {
        cleanValue = String(max);
      }
    }
  }

  return cleanValue;
};

/**
 * Creates an onChange handler for numeric inputs
 * @param {Function} setter - State setter function
 * @param {string} fieldName - Field name for nested objects (optional)
 * @param {Object} options - Validation options (same as validateNumericInput)
 * @returns {Function} - onChange handler function
 */
export const createNumericInputHandler = (setter, fieldName = null, options = {}) => {
  return (e) => {
    const validatedValue = validateNumericInput(e.target.value, options);
    
    if (fieldName) {
      // Handle nested field updates (e.g., 'stripInfo.purchasePrice')
      if (fieldName.includes('.')) {
        const parts = fieldName.split('.');
        setter(prev => {
          const newState = { ...prev };
          let current = newState;
          
          // Navigate to the nested property
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          
          // Set the final value
          current[parts[parts.length - 1]] = validatedValue;
          return newState;
        });
      } else {
        // Handle simple field updates
        setter(prev => ({
          ...prev,
          [fieldName]: validatedValue
        }));
      }
    } else {
      // Direct state update
      setter(validatedValue);
    }
  };
};

/**
 * Validates phone number input (digits only, max 15 characters)
 * @param {string} value - The phone number input
 * @returns {string} - Validated phone number
 */
export const validatePhoneInput = (value) => {
  // Remove all non-digit characters except + at the beginning
  let cleanValue = String(value).replace(/[^\d+]/g, '');
  
  // Only allow + at the beginning
  if (cleanValue.includes('+')) {
    const plusCount = (cleanValue.match(/\+/g) || []).length;
    if (plusCount > 1 || (cleanValue.includes('+') && !cleanValue.startsWith('+'))) {
      cleanValue = cleanValue.replace(/\+/g, '');
    }
  }
  
  // Limit to reasonable phone number length (15 digits max as per ITU-T E.164)
  if (cleanValue.startsWith('+')) {
    cleanValue = '+' + cleanValue.substring(1).substring(0, 15);
  } else {
    cleanValue = cleanValue.substring(0, 15);
  }
  
  return cleanValue;
};

/**
 * Creates an onChange handler for phone number inputs
 * @param {Function} setter - State setter function
 * @param {string} fieldName - Field name for nested objects (optional)
 * @returns {Function} - onChange handler function
 */
export const createPhoneInputHandler = (setter, fieldName = null) => {
  return (e) => {
    const validatedValue = validatePhoneInput(e.target.value);
    
    if (fieldName) {
      if (fieldName.includes('.')) {
        const parts = fieldName.split('.');
        setter(prev => {
          const newState = { ...prev };
          let current = newState;
          
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          
          current[parts[parts.length - 1]] = validatedValue;
          return newState;
        });
      } else {
        setter(prev => ({
          ...prev,
          [fieldName]: validatedValue
        }));
      }
    } else {
      setter(validatedValue);
    }
  };
};

/**
 * Common validation options for different input types
 */
export const VALIDATION_OPTIONS = {
  // For prices (allows decimals, no negative, 2 decimal places)
  PRICE: {
    allowDecimals: true,
    allowNegative: false,
    maxDecimals: 2,
    min: 0
  },
  
  // For quantities/stock (integers only, no negative)
  QUANTITY: {
    allowDecimals: false,
    allowNegative: false,
    min: 0
  },
  
  // For percentages (allows decimals, no negative, max 100)
  PERCENTAGE: {
    allowDecimals: true,
    allowNegative: false,
    maxDecimals: 2,
    min: 0,
    max: 100
  },
  
  // For general positive numbers
  POSITIVE_NUMBER: {
    allowDecimals: true,
    allowNegative: false,
    maxDecimals: 2,
    min: 0
  },
  
  // For integers only
  INTEGER: {
    allowDecimals: false,
    allowNegative: false,
    min: 0
  }
};
