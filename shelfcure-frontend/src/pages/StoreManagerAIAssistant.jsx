import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import { makeAuthenticatedRequest, API_ENDPOINTS } from '../config/api';

import {
  Send,
  Bot,
  User,
  Lightbulb,
  BarChart3,
  Package,
  Users,
  ShoppingCart,
  Loader,
  AlertCircle,
  RefreshCw,
  Trash2,
  Upload,
  FileText,
  Pill,
  Camera,
  Paperclip,
  X,
  Image,
  FileImage,
  Eye,
  Download
} from 'lucide-react';

const StoreManagerAIAssistant = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Document upload state
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // OCR-related state (keeping for backward compatibility)
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrType, setOCRType] = useState('purchase'); // 'purchase' or 'prescription'
  const [ocrResults, setOCRResults] = useState(null);
  const [showPurchaseReview, setShowPurchaseReview] = useState(false);
  const [showPrescriptionReview, setShowPrescriptionReview] = useState(false);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Initialize with welcome message
    setMessages([{
      id: 'welcome',
      type: 'agent',
      content: "Hello! I'm your AI store management assistant powered by Google Gemini. I can help you with inventory management, sales analysis, customer queries, supplier management, and much more.\n\n📄 **New Feature**: You can now upload documents (images/PDFs) directly in this chat! Just drag & drop or click the 📎 button. I'll analyze your bills, prescriptions, or any pharmacy documents and help you with whatever you need.\n\nWhat would you like to know about your store today?",
      timestamp: new Date(),
      suggestions: [
        "Show me today's sales",
        "Check low stock medicines",
        "Find a customer",
        "Create purchase order",
        "Show dashboard overview"
      ]
    }]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Document upload handlers
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image (JPG, PNG) or PDF file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.STORE_MANAGER.AI_ASSISTANT}/upload-document`,
        {
          method: 'POST',
          body: formData,
          headers: {} // Let browser set Content-Type for FormData
        }
      );

      if (response.success) {
        const documentData = {
          id: Date.now(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: response.data.url,
          analysis: response.data.analysis,
          uploadedAt: new Date()
        };

        setUploadedDocuments(prev => [...prev, documentData]);

        // Add document upload message to chat
        const documentMessage = {
          id: Date.now() + 1,
          type: 'user',
          content: `📄 Uploaded document: ${file.name}`,
          timestamp: new Date(),
          document: documentData
        };

        // Add AI analysis message
        const analysisMessage = {
          id: Date.now() + 2,
          type: 'agent',
          content: `I've analyzed your document "${file.name}". ${response.data.analysis.summary}\n\nWhat would you like me to do with this document? I can:\n• Extract specific information\n• Create purchase orders\n• Add medicines to inventory\n• Generate reports\n• Answer questions about the content`,
          timestamp: new Date(),
          suggestions: response.data.analysis.suggestions || [
            "Extract all medicine names",
            "Create purchase order",
            "What's the total amount?",
            "Add to inventory"
          ]
        };

        setMessages(prev => [...prev, documentMessage, analysisMessage]);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeDocument = (documentId) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const sendMessage = async (messageText = null) => {
    const message = messageText || inputMessage.trim();
    if (!message || isLoading) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      setConnectionStatus('connecting');
      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.STORE_MANAGER.AI_ASSISTANT}/chat`,
        {
          method: 'POST',
          body: JSON.stringify({
            message,
            conversationId,
            documents: uploadedDocuments // Include uploaded documents in context
          })
        }
      );

      if (response.success) {
        setConnectionStatus('connected');
        setRetryCount(0);

        const agentMessage = {
          id: Date.now() + 1,
          type: 'agent',
          content: response.data.response,
          timestamp: new Date(),
          suggestions: response.data.suggestions || [],
          quickActions: response.data.quickActions || [],
          followUpActions: response.data.followUpActions || [],
          intent: response.data.intent,
          confidence: response.data.confidence,
          processingTime: response.data.processingTime,
          actionExecuted: response.data.actionExecuted || false,
          actionResult: response.data.actionResult || null,
          requiresConfirmation: response.data.requiresConfirmation || false,
          confirmationData: response.data.confirmationData || null
        };

        setMessages(prev => [...prev, agentMessage]);

        if (response.data.conversationId) {
          setConversationId(response.data.conversationId);
        }
      } else {
        throw new Error(response.message || 'Failed to get response');
      }

    } catch (error) {
      console.error('AI Assistant error:', error);
      setConnectionStatus('error');
      setRetryCount(prev => prev + 1);

      const errorContent = retryCount < 2 
        ? "I'm having trouble connecting right now. Please try again."
        : "I'm experiencing technical difficulties. Please check your connection and try again later.";

      const errorMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: errorContent,
        timestamp: new Date(),
        isError: true,
        suggestions: retryCount < 2 ? ['Try again', 'Show me dashboard', 'Help'] : []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const clearConversation = async () => {
    if (conversationId) {
      try {
        await makeAuthenticatedRequest(
          `${API_ENDPOINTS.STORE_MANAGER.BASE}/ai-assistant/conversations/${conversationId}`,
          { method: 'DELETE' }
        );
      } catch (error) {
        console.error('Error clearing conversation:', error);
      }
    }

    setMessages([{
      id: 'welcome-new',
      type: 'agent',
      content: "Conversation cleared! How can I help you with your store management today?",
      timestamp: new Date(),
      suggestions: [
        "Show me today's sales",
        "Check inventory status",
        "View customer analytics",
        "Help me with reports"
      ]
    }]);
    setConversationId(null);
  };

  // OCR Handler Functions
  const handleOCRUpload = (type) => {
    setOCRType(type);
    setShowOCRModal(true);
  };

  const handleOCRProcessComplete = (data) => {
    setOCRResults(data);
    setShowOCRModal(false);

    if (ocrType === 'purchase') {
      setShowPurchaseReview(true);
    } else if (ocrType === 'prescription') {
      setShowPrescriptionReview(true);
    }
  };

  const handlePurchaseConfirm = async (confirmData) => {
    try {
      setIsLoading(true);

      const response = await makeAuthenticatedRequest(
        '/api/store-manager/ocr/create-purchase',
        {
          method: 'POST',
          body: JSON.stringify(confirmData)
        }
      );

      if (response.success) {
        setShowPurchaseReview(false);
        setOCRResults(null);

        // Add success message to chat
        const successMessage = {
          id: Date.now(),
          type: 'agent',
          content: `✅ Purchase order created successfully! Order #${response.data.purchaseOrderNumber} has been added with ${response.data.items.length} medicines. Total amount: ₹${response.data.totalAmount.toFixed(2)}`,
          timestamp: new Date(),
          suggestions: [
            'View purchase orders',
            'Check inventory updates',
            'Process another bill'
          ]
        };
        setMessages(prev => [...prev, successMessage]);
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Failed to create purchase order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrescriptionConfirm = async (cartData) => {
    try {
      setIsLoading(true);

      const response = await makeAuthenticatedRequest(
        '/api/store-manager/ocr/add-to-cart',
        {
          method: 'POST',
          body: JSON.stringify(cartData)
        }
      );

      if (response.success) {
        setShowPrescriptionReview(false);
        setOCRResults(null);

        // Store cart data and navigate to sales page
        localStorage.setItem('prefilledCart', JSON.stringify({
          customerId: cartData.customerId,
          items: response.data.cartItems.map(item => ({
            medicineId: item.medicine._id,
            name: item.medicine.name,
            quantity: item.quantity,
            unit: item.unitType,
            price: item.unitPrice,
            unitData: item.medicine
          })),
          prescriptionData: cartData.prescriptionData
        }));

        // Add success message and navigate
        const successMessage = {
          id: Date.now(),
          type: 'agent',
          content: `✅ Prescription processed successfully! ${response.data.summary.totalItems} medicines added to cart. Total amount: ₹${response.data.summary.totalAmount.toFixed(2)}. Redirecting to sales page...`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);

        setTimeout(() => {
          navigate('/store-panel/sales');
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing prescription:', error);
      alert('Failed to process prescription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOCRCancel = () => {
    setShowPurchaseReview(false);
    setShowPrescriptionReview(false);
    setOCRResults(null);
  };

  const quickStartQueries = [
    {
      icon: BarChart3,
      title: "Sales Analytics",
      description: "View sales reports and performance metrics",
      query: "Show me today's sales performance"
    },
    {
      icon: Package,
      title: "Inventory Status",
      description: "Check stock levels and low inventory alerts",
      query: "Show me low stock medicines"
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Find customers and view purchase history",
      query: "Show me top customers this month"
    },
    {
      icon: ShoppingCart,
      title: "Purchase Orders",
      description: "Create and manage purchase orders",
      query: "Show pending purchase orders"
    }
  ];



  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <StoreManagerLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 text-left">AI Store Assistant</h1>
                <p className="text-sm text-gray-500 text-left">
                  Powered by Google Gemini • 
                  <span className={`ml-1 ${
                    connectionStatus === 'connected' ? 'text-green-600' : 
                    connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'connecting' ? 'Connecting...' : 'Connection Error'}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={clearConversation}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick Start Section - Show only when no messages except welcome */}
          {messages.length <= 1 && (
            <div className="space-y-6 mt-6 mb-6">
              {/* AI Chat Quick Start */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center text-left">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                  Quick Start
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickStartQueries.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(item.query)}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-left">{item.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 text-left">{item.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>


            </div>
          )}

          {/* Chat Messages */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6 flex flex-col" style={{ height: '70vh', minHeight: '600px' }}>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-3 max-w-4xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-blue-100' 
                        : message.isError 
                          ? 'bg-red-100' 
                          : 'bg-green-100'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4 text-blue-600" />
                      ) : message.isError ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Bot className="w-4 h-4 text-green-600" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-3 sm:p-4 rounded-lg max-w-full ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.isError
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {/* Document Preview */}
                        {message.document && (
                          <div className="mt-3 p-3 bg-white bg-opacity-20 rounded-lg border border-white border-opacity-30">
                            <div className="flex items-center gap-2 mb-2">
                              {message.document.type.startsWith('image/') ? (
                                <FileImage className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">{message.document.name}</span>
                              <span className="text-xs opacity-75">
                                ({(message.document.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            {message.document.type.startsWith('image/') && (
                              <img
                                src={message.document.url}
                                alt={message.document.name}
                                className="max-w-full h-auto rounded border max-h-48 object-contain"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => sendMessage(suggestion)}
                              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                              disabled={isLoading}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Follow-up Actions for Enhanced Customer Management */}
                      {message.followUpActions && message.followUpActions.length > 0 && (
                        <div className={`mt-4 p-4 border rounded-lg ${
                          message.requiresConfirmation
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <h4 className={`text-sm font-medium mb-3 text-left ${
                            message.requiresConfirmation
                              ? 'text-red-800'
                              : 'text-green-800'
                          }`}>
                            {message.requiresConfirmation ? '⚠️ Confirmation Required:' : 'Quick Actions:'}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {message.followUpActions.map((action, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  if (action.action === 'add_customer_details') {
                                    sendMessage(`Add more details for customer ${action.params.customerName}`);
                                  } else if (action.action === 'edit_customer') {
                                    sendMessage(`Edit customer ${action.params.customerName}`);
                                  } else if (action.action === 'add_customer') {
                                    sendMessage('Add a new customer');
                                  } else if (action.action === 'view_customers') {
                                    sendMessage('Show me all customers');
                                  } else if (action.action === 'confirm_delete') {
                                    sendMessage(`Confirm delete customer ID ${action.params.customerId}`);
                                  } else if (action.action === 'cancel_delete') {
                                    sendMessage('Cancel the deletion request');
                                  } else if (action.action === 'search_customers') {
                                    sendMessage('Search for customers');
                                  } else if (action.action === 'customer_analytics') {
                                    sendMessage('Show customer analytics');
                                  }
                                }}
                                className={`px-3 py-2 text-sm border rounded-lg transition-colors text-left flex items-center justify-center ${
                                  action.action === 'confirm_delete'
                                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                                    : action.action === 'cancel_delete'
                                      ? 'bg-gray-600 text-white border-gray-600 hover:bg-gray-700'
                                      : message.requiresConfirmation
                                        ? 'bg-white border-red-300 text-red-700 hover:bg-red-100'
                                        : 'bg-white border-green-300 text-green-700 hover:bg-green-100'
                                }`}
                                disabled={isLoading}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                          {message.requiresConfirmation && (
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                              <strong>⚠️ Warning:</strong> Customer deletion is permanent and cannot be undone. Please review the customer details carefully before confirming.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Execution Status */}
                      {message.actionExecuted && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 text-left">
                            ✅ Action completed successfully! The database has been updated.
                          </p>
                        </div>
                      )}

                      {/* Processing time for AI messages */}
                      {message.type === 'agent' && message.processingTime && (
                        <p className="text-xs text-gray-400 mt-1">
                          Processed in {message.processingTime}ms
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-4xl">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Loader className="w-4 h-4 text-green-600 animate-spin" />
                    </div>
                    <div className="bg-gray-100 text-gray-800 p-3 sm:p-4 rounded-lg">
                      <p>Analyzing your store data...</p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 sm:p-6">
              {/* Uploaded Documents Preview */}
              {uploadedDocuments.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Uploaded Documents:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uploadedDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          {doc.type.startsWith('image/') ? (
                            <Image className="w-4 h-4 text-blue-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600" />
                          )}
                          <span className="text-sm text-blue-800 truncate max-w-32">{doc.name}</span>
                        </div>
                        <button
                          onClick={() => removeDocument(doc.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drag and Drop Area */}
              <div
                className={`relative ${dragActive ? 'border-2 border-dashed border-green-400 bg-green-50' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your store or upload a document (image/PDF) to analyze... (e.g., 'Show me today's sales' or drag & drop a bill)"
                      className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none overflow-hidden text-sm sm:text-base"
                      rows="1"
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Upload document"
                  >
                    {isUploading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </button>

                  {/* Send Button */}
                  <button
                    onClick={() => sendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Drag Active Overlay */}
                {dragActive && (
                  <div className="absolute inset-0 bg-green-50 bg-opacity-90 border-2 border-dashed border-green-400 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-700 font-medium">Drop your document here</p>
                      <p className="text-green-600 text-sm">Supports images (JPG, PNG) and PDF files</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>


    </StoreManagerLayout>
  );
};

export default StoreManagerAIAssistant;
