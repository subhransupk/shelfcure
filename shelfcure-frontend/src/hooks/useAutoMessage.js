import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing auto-dismissing messages (error and success)
 * @param {number} timeout - Timeout in milliseconds (default: 4000ms)
 * @returns {object} - Message state and control functions
 */
const useAutoMessage = (timeout = 4000) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const errorTimeoutRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Set error message with auto-dismiss
  const setErrorMessage = (message) => {
    // Clear any existing error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    // Clear success message when showing error
    setSuccess('');
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    setError(message);

    // Set auto-dismiss timeout if message is not empty
    if (message) {
      errorTimeoutRef.current = setTimeout(() => {
        setError('');
        errorTimeoutRef.current = null;
      }, timeout);
    }
  };

  // Set success message with auto-dismiss
  const setSuccessMessage = (message) => {
    // Clear any existing success timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    
    // Clear error message when showing success
    setError('');
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    setSuccess(message);

    // Set auto-dismiss timeout if message is not empty
    if (message) {
      successTimeoutRef.current = setTimeout(() => {
        setSuccess('');
        successTimeoutRef.current = null;
      }, timeout);
    }
  };

  // Clear error message manually
  const clearError = () => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setError('');
  };

  // Clear success message manually
  const clearSuccess = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    setSuccess('');
  };

  // Clear all messages
  const clearAllMessages = () => {
    clearError();
    clearSuccess();
  };

  return {
    error,
    success,
    setError: setErrorMessage,
    setSuccess: setSuccessMessage,
    clearError,
    clearSuccess,
    clearAllMessages,
    // Legacy compatibility - direct state setters without auto-dismiss
    setErrorDirect: setError,
    setSuccessDirect: setSuccess
  };
};

export default useAutoMessage;
