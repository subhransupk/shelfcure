import React, { useState } from 'react';
import {
  Upload,
  FileImage,
  FileText,
  X,
  Loader,
  CheckCircle,
  AlertCircle,
  Camera,
  Pill
} from 'lucide-react';

const OCRUploadModal = ({ isOpen, onClose, onProcessComplete, type = 'purchase' }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const acceptedTypes = {
    purchase: {
      title: 'Upload Purchase Bill',
      description: 'Upload a purchase bill to automatically extract supplier details, medicine information, quantities, and prices.',
      icon: FileText,
      endpoint: '/api/store-manager/ocr/purchase-bill',
      fileField: 'bill'
    },
    prescription: {
      title: 'Upload Prescription',
      description: 'Upload a medical prescription to automatically extract medicine names and add them to the sales cart.',
      icon: Pill,
      endpoint: '/api/store-manager/ocr/prescription',
      fileField: 'prescription'
    }
  };

  const config = acceptedTypes[type];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    setError('');
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image (JPG, PNG) or PDF file');
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
  };

  const processOCR = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append(config.fileField, file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const token = localStorage.getItem('token');
      console.log('🔐 Token:', token ? 'Present' : 'Missing');
      console.log('📡 Making request to:', config.endpoint);
      console.log('📄 File:', file.name, file.type, file.size);

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response ok:', response.ok);

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        let errorMessage = 'OCR processing failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('❌ Server error response:', errorData);
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            console.error('❌ Server error text:', errorText);
            errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
          } catch (textError) {
            console.error('❌ Could not parse error response:', textError);
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Call the completion handler with the processed data
      onProcessComplete(data.data);
      
      // Close modal after successful processing
      setTimeout(() => {
        onClose();
        resetModal();
      }, 1000);

    } catch (error) {
      console.error('OCR Error:', error);
      setError(error.message || 'Failed to process document. Please try again.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setIsProcessing(false);
    setProgress(0);
    setError('');
    setDragActive(false);
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetModal();
      onClose();
    }
  };

  if (!isOpen) return null;

  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <IconComponent className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 text-left">{config.title}</h2>
              <p className="text-xs sm:text-sm text-gray-500 text-left">AI-powered document processing</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 p-1"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 text-left">
            {config.description}
          </p>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-green-400 bg-green-50'
                : file
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-green-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                  {file.type === 'application/pdf' ? (
                    <FileText className="w-6 h-6 text-green-600" />
                  ) : (
                    <FileImage className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                {!isProcessing && (
                  <button
                    onClick={() => setFile(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove file
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <label className="cursor-pointer">
                    <span className="text-sm font-medium text-green-600 hover:text-green-500">
                      Click to upload
                    </span>
                    <span className="text-sm text-gray-500"> or drag and drop</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  JPG, PNG, PDF up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Processing document...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 text-left">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {progress === 100 && !error && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700">Document processed successfully!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={processOCR}
            disabled={!file || isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 order-1 sm:order-2"
          >
            {isProcessing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Process Document</span>
                <span className="sm:hidden">Process</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OCRUploadModal;
