const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIDataService = require('./aiDataService');
const Customer = require('../models/Customer');
const Medicine = require('../models/Medicine');
const Sale = require('../models/Sale');
const fs = require('fs').promises;
const path = require('path');

class GeminiAIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    this.conversationHistory = new Map(); // Store conversation history
    this.aiDataService = new AIDataService(); // Instantiate the data service
  }

  /**
   * Process a store management query using Gemini AI
   * @param {string} message - User's message
   * @param {Object} context - Store and user context
   * @returns {Object} AI response with actions and suggestions
   */
  async processStoreQuery(message, context) {
    try {
      const { store, user, conversationId, documents } = context;
      
      // Get conversation history
      const history = this.getConversationHistory(conversationId);

      // Fetch relevant data based on the message intent
      const relevantData = await this.fetchRelevantData(message, store._id);

      // Build comprehensive prompt with store context and real data
      const prompt = this.buildStoreManagementPrompt(message, store, user, history, relevantData, documents);
      
      // Generate response using Gemini with retry logic
      const result = await this.retryGeminiRequest(async () => {
        return await this.model.generateContent(prompt);
      });
      const response = result.response;
      const text = response.text();

      // If we get here, Gemini is working
      console.log('✅ Gemini AI response received successfully');
      
      // Parse the AI response to extract structured data
      const parsedResponse = this.parseAIResponse(text);

      // Execute actions if the AI requested them
      const actionResult = await this.executeActions(parsedResponse, context, message);

      // Always set action execution status based on actual result
      if (actionResult && actionResult.executed) {
        // Update the response with action results
        parsedResponse.message = actionResult.message;
        parsedResponse.actionExecuted = true;
        parsedResponse.actionResult = actionResult.result;
      } else {
        // No action was executed or action failed
        parsedResponse.actionExecuted = actionResult ? actionResult.executed : false;
        if (actionResult && actionResult.message) {
          parsedResponse.message = actionResult.message;
        }
      }

      // Update conversation history
      this.updateConversationHistory(conversationId, message, parsedResponse);

      const finalResponse = {
        success: true,
        response: parsedResponse.message,
        suggestions: parsedResponse.suggestions || [],
        quickActions: parsedResponse.quickActions || [],
        intent: parsedResponse.intent || 'general',
        confidence: parsedResponse.confidence || 0.8,
        conversationId: conversationId || this.generateConversationId()
      };

      // Add follow-up actions if available
      if (actionResult && actionResult.followUpActions) {
        finalResponse.followUpActions = actionResult.followUpActions;
      }

      // Always add action execution status
      finalResponse.actionExecuted = parsedResponse.actionExecuted || false;
      if (parsedResponse.actionResult) {
        finalResponse.actionResult = parsedResponse.actionResult;
      }

      // Add confirmation requirements for customer deletion
      if (actionResult && actionResult.requiresConfirmation) {
        finalResponse.requiresConfirmation = actionResult.requiresConfirmation;
        finalResponse.confirmationData = actionResult.confirmationData;
      }

      return finalResponse;
      
    } catch (error) {
      console.error('Gemini AI Service Error:', error);

      // Enhanced fallback system for various error types
      if (error.message.includes('quota') ||
          error.message.includes('429') ||
          error.message.includes('503') ||
          error.message.includes('Service Unavailable') ||
          error.message.includes('not found') ||
          error.message.includes('404')) {
        console.log('🔄 Using enhanced fallback system due to API unavailability');
        return this.generateEnhancedFallbackResponse(message, context);
      }

      return {
        success: false,
        response: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact support if the issue persists.",
        error: error.message
      };
    }
  }

  /**
   * Fetch relevant data based on message intent
   */
  async fetchRelevantData(message, storeId) {
    const lowerMessage = message.toLowerCase();
    const data = {};

    try {
      // Sales related queries
      if (lowerMessage.includes('sales') || lowerMessage.includes('revenue') || lowerMessage.includes('today') || lowerMessage.includes('month')) {
        if (lowerMessage.includes('today')) {
          data.todaysSales = await this.aiDataService.getTodaysSales(storeId);
        }
        if (lowerMessage.includes('month') || lowerMessage.includes('monthly')) {
          data.monthlySales = await this.aiDataService.getMonthlySales(storeId);
        }
      }

      // Inventory related queries
      if (lowerMessage.includes('stock') || lowerMessage.includes('inventory') || lowerMessage.includes('low')) {
        data.lowStock = await this.aiDataService.getLowStockMedicines(storeId);
      }

      // Expiry related queries
      if (lowerMessage.includes('expir') || lowerMessage.includes('expir')) {
        data.expiringMedicines = await this.aiDataService.getExpiringMedicines(storeId);
      }

      // Customer related queries
      if (lowerMessage.includes('customer') || lowerMessage.includes('top customer')) {
        data.topCustomers = await this.aiDataService.getTopCustomers(storeId);
      }

      // Supplier related queries
      if (lowerMessage.includes('supplier') || lowerMessage.includes('purchase order')) {
        data.suppliers = await this.aiDataService.getSuppliers(storeId);
        data.pendingPurchases = await this.aiDataService.getPendingPurchases(storeId);
      }

      // General analytics/dashboard queries
      if (lowerMessage.includes('dashboard') || lowerMessage.includes('overview') || lowerMessage.includes('analytics')) {
        data.analytics = await this.aiDataService.getStoreAnalytics(storeId);
      }

    } catch (error) {
      console.error('Error fetching relevant data:', error);
      // Continue without data if there's an error
    }

    return data;
  }

  /**
   * Build a comprehensive prompt for store management queries
   */
  buildStoreManagementPrompt(message, store, user, history, relevantData = {}, documents = []) {
    // Format real data for the prompt
    let realDataSection = '';
    if (Object.keys(relevantData).length > 0) {
      realDataSection = '\nREAL STORE DATA:\n';

      if (relevantData.todaysSales) {
        const sales = relevantData.todaysSales;
        realDataSection += `TODAY'S SALES:
- Total Revenue: ₹${(sales.totalRevenue || 0).toFixed(2)}
- Total Transactions: ${sales.totalTransactions || 0}
- Average Transaction: ₹${(sales.averageTransaction || 0).toFixed(2)}
`;
      }

      if (relevantData.monthlySales) {
        const sales = relevantData.monthlySales;
        realDataSection += `MONTHLY SALES (${sales.monthName || 'Current Month'}):
- Total Revenue: ₹${(sales.totalRevenue || 0).toFixed(2)}
- Total Transactions: ${sales.totalTransactions || 0}
- Average Transaction: ₹${(sales.averageTransaction || 0).toFixed(2)}
`;
      }

      if (relevantData.lowStock && Array.isArray(relevantData.lowStock)) {
        realDataSection += `LOW STOCK MEDICINES (${relevantData.lowStock.length} items):
${relevantData.lowStock.slice(0, 10).map(med =>
  `- ${med.name || 'Unknown'} (${med.genericName || 'N/A'}): ${med.stripsInStock || 0} strips, ${med.unitsInStock || 0} units`
).join('\n')}
`;
      }

      if (relevantData.expiringMedicines && Array.isArray(relevantData.expiringMedicines)) {
        realDataSection += `EXPIRING MEDICINES (${relevantData.expiringMedicines.length} items):
${relevantData.expiringMedicines.slice(0, 10).map(med =>
  `- ${med.name || 'Unknown'}: Expires in ${med.daysUntilExpiry || 0} days (${med.expiryDate ? med.expiryDate.toDateString() : 'Unknown date'})`
).join('\n')}
`;
      }

      if (relevantData.topCustomers && Array.isArray(relevantData.topCustomers)) {
        realDataSection += `TOP CUSTOMERS:
${relevantData.topCustomers.map(customer =>
  `- ${customer.name || 'Unknown'} (${customer.phone || 'N/A'}): ₹${(customer.totalPurchases || 0).toFixed(2)} total purchases`
).join('\n')}
`;
      }

      if (relevantData.suppliers && Array.isArray(relevantData.suppliers)) {
        realDataSection += `SUPPLIERS (${relevantData.suppliers.length} total):
${relevantData.suppliers.slice(0, 5).map(supplier =>
  `- ${supplier.name || 'Unknown'} (${supplier.contactPerson || 'N/A'}): ${supplier.phone || 'N/A'}`
).join('\n')}
`;
      }

      if (relevantData.pendingPurchases && Array.isArray(relevantData.pendingPurchases)) {
        realDataSection += `PENDING PURCHASES (${relevantData.pendingPurchases.length} purchases):
${relevantData.pendingPurchases.map(purchase =>
  `- Purchase #${purchase.purchaseNumber || 'N/A'}: ${purchase.supplierName || 'Unknown'} - ₹${(purchase.totalAmount || 0).toFixed(2)} (${purchase.status || 'Unknown'})`
).join('\n')}
`;
      }
    }

    // Add document context if documents are available
    let documentSection = '';
    if (documents && documents.length > 0) {
      documentSection = '\nUPLOADED DOCUMENTS:\n';
      documents.forEach((doc, index) => {
        documentSection += `Document ${index + 1}: ${doc.name} (${doc.type})\n`;
        if (doc.analysis) {
          documentSection += `- Type: ${doc.analysis.documentType || 'unknown'}\n`;
          documentSection += `- Summary: ${doc.analysis.summary || 'No summary available'}\n`;
          if (doc.analysis.extractedData) {
            const data = doc.analysis.extractedData;
            if (data.medicines && data.medicines.length > 0) {
              documentSection += `- Medicines: ${data.medicines.slice(0, 5).join(', ')}${data.medicines.length > 5 ? '...' : ''}\n`;
            }
            if (data.supplier) {
              documentSection += `- Supplier: ${data.supplier}\n`;
            }
            if (data.totals) {
              documentSection += `- Total Amount: ${data.totals}\n`;
            }
          }
        }
        documentSection += '\n';
      });

      documentSection += `The user can ask you to:
- Extract specific information from these documents
- Create purchase orders from bills/invoices
- Add medicines to inventory from prescriptions
- Generate reports based on document data
- Answer questions about document content
- Perform any pharmacy management action based on the documents

`;
    }

    const contextInfo = `
STORE CONTEXT:
- Store Name: ${store.name}
- Store Manager: ${user.name}
- Store Address: ${store.address || 'Not specified'}
- Store Phone: ${store.phone || 'Not specified'}
${realDataSection}${documentSection}
CONVERSATION HISTORY:
${history.map(h => `User: ${h.message}\nAssistant: ${h.response}`).join('\n')}

CURRENT USER MESSAGE: ${message}

You are an AI assistant for ShelfCure, a comprehensive pharmacy management system. You help store managers with:

1. INVENTORY MANAGEMENT: Check stock levels, low stock alerts, medicine details, batch management
2. SALES & POS: Process sales, view sales reports, customer transactions, daily/monthly sales
3. CUSTOMER MANAGEMENT: Customer information, purchase history, loyalty programs
4. SUPPLIER MANAGEMENT: Supplier details, purchase orders, supplier payments
5. ANALYTICS & REPORTS: Sales analytics, inventory reports, financial summaries
6. PURCHASE MANAGEMENT: Create purchase orders, track deliveries, manage returns
7. EXPIRY ALERTS: Monitor expiring medicines, generate alerts
8. STAFF MANAGEMENT: Staff information, roles, permissions

IMPORTANT: Use the REAL STORE DATA provided above to answer questions. When users ask for sales data, inventory information, customer details, etc., use the actual data from their store. Don't provide generic responses - give specific numbers, names, and details from the real data.

RESPONSE FORMAT:
Please respond in JSON format with the following structure:
{
  "message": "Your helpful response to the user",
  "intent": "primary intent (inventory/sales/customers/suppliers/analytics/purchases/general)",
  "confidence": 0.95,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "quickActions": [
    {"label": "Action Name", "action": "action_type", "params": {}}
  ],
  "needsData": false,
  "dataType": "sales/inventory/customers/etc"
}

IMPORTANT GUIDELINES:
- Always be helpful, professional, and pharmacy-focused
- Provide specific, actionable responses
- If you need more information, ask clarifying questions
- Suggest relevant follow-up actions
- Keep responses concise but informative
- Use pharmacy and medical terminology appropriately
- Always prioritize patient safety and regulatory compliance

ACTION EXECUTION:
When users ask you to ADD/CREATE something (customers, medicines, etc.), follow these rules:
1. If the user provides complete information (name, phone for customers), respond as if you successfully added it
2. Use specific language like "Customer 'Name' with phone number XXXXXXXXXX and email email@domain.com has been successfully added"
3. The system will automatically detect this pattern and actually create the record in the database
4. If information is missing, ask for the required details before confirming the action

ENHANCED NATURAL LANGUAGE UNDERSTANDING:
You can understand and process complex, multi-step requests such as:
- "Add customer John Doe with phone 9876543210, then show me all customers"
- "Update Paracetamol stock to 50 strips and check if we need to reorder anything else"
- "Create a sale for customer with phone 9876543210 for 2 strips of Paracetamol at ₹20 each"
- "Show me sales for this week and compare with last week"
- "Find all medicines expiring in next 30 days and create a return order"

CONTEXT AWARENESS:
- Remember previous conversation context and user preferences
- Understand follow-up questions without requiring full context repetition
- Maintain conversation flow across multiple related queries
- Provide proactive suggestions based on current store status

PARAMETER EXTRACTION:
Extract and validate parameters from natural language:
- Medicine names, quantities, prices, batch numbers
- Customer names, phone numbers, addresses
- Date ranges, time periods, numerical values
- Supplier information, purchase order details
- Settings configurations and thresholds

CUSTOMER MANAGEMENT WORKFLOW:
After successfully adding a customer, always offer interactive follow-up options:
1. Ask if they want to add more details (address, customer type, credit limit, etc.)
2. Offer to edit any information they just entered
3. Suggest adding another customer or viewing the customer list
4. Provide natural language examples for updates like "Update [name]'s phone number to [new number]"

For customer updates, use patterns like:
- "Update customer 'Name'" or "Change Name's phone to XXXXXXXXXX"
- Support updating phone, email, address, customer type, credit limit
- Always confirm successful updates with specific details

CUSTOMER DELETION WORKFLOW:
For customer deletion requests, NEVER immediately confirm deletion. Instead:
1. When user requests "delete customer [name]", respond that you're searching for matching customers
2. The system will automatically find and display all matching customers with full details
3. If multiple customers found, ask user to specify which one to delete
4. Always show complete customer information before deletion (ID, name, phone, email, purchase history)
5. Require explicit confirmation before proceeding with deletion
6. Use patterns like "delete customer 'Name'" or "remove customer Name" to trigger the search phase
7. For confirmation, use patterns like "confirm delete customer [ID]" to trigger actual deletion

Now please respond to the user's message:`;

    return contextInfo;
  }

  /**
   * Parse AI response to extract structured data
   */
  parseAIResponse(text) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          message: parsed.message || text,
          intent: parsed.intent || 'general',
          confidence: parsed.confidence || 0.8,
          suggestions: parsed.suggestions || [],
          quickActions: parsed.quickActions || [],
          needsData: parsed.needsData || false,
          dataType: parsed.dataType || null
        };
      }
    } catch (error) {
      console.log('Failed to parse JSON response, using plain text');
    }
    
    // Fallback to plain text response
    return {
      message: text,
      intent: this.inferIntent(text),
      confidence: 0.7,
      suggestions: this.generateSuggestions(text),
      quickActions: [],
      needsData: false,
      dataType: null
    };
  }

  /**
   * Execute actions requested by the AI - COMPREHENSIVE VERSION
   * @param {Object} parsedResponse - Parsed AI response
   * @param {Object} context - Store and user context
   * @param {String} originalMessage - Original user message
   * @returns {Object} Action execution result
   */
  async executeActions(parsedResponse, context, originalMessage = null) {
    try {
      const { store, user } = context;
      // Use original message if provided, otherwise fall back to parsed response
      const message = originalMessage ? originalMessage.toLowerCase() : parsedResponse.message.toLowerCase();
      const quickActions = parsedResponse.quickActions || [];

      // Check for creation/addition commands first (higher priority than quick actions)
      const userMessage = originalMessage || message;
      const isCreationCommand = userMessage.toLowerCase().includes('add') ||
                               userMessage.toLowerCase().includes('create') ||
                               userMessage.toLowerCase().includes('new');

      // DOCUMENT-BASED ACTIONS (highest priority)
      const documentResult = await this.handleDocumentActions(userMessage, parsedResponse, context);
      if (documentResult) {
        return documentResult; // Return any result (success or failure)
      }

      if (isCreationCommand) {
        console.log('🎯 Creation command detected, prioritizing handlers over quick actions');

        // INVENTORY MANAGEMENT ACTIONS
        const inventoryResult = await this.handleInventoryActions(userMessage, parsedResponse, context);
        if (inventoryResult) {
          return inventoryResult; // Return any result (success or failure)
        }

        // CUSTOMER MANAGEMENT ACTIONS
        const customerResult = await this.handleCustomerActions(userMessage, parsedResponse, context);
        if (customerResult) {
          return customerResult; // Return any result (success or failure)
        }

        // SUPPLIER MANAGEMENT ACTIONS
        const supplierResult = await this.handleSupplierActions(userMessage, parsedResponse, context);
        if (supplierResult) {
          return supplierResult; // Return any result (success or failure)
        }

        // SALES MANAGEMENT ACTIONS
        const salesResult = await this.handleSalesActions(userMessage, parsedResponse, context);
        if (salesResult) {
          return salesResult; // Return any result (success or failure)
        }
      }

      // Process quick actions for non-creation commands
      if (quickActions.length > 0) {
        for (const action of quickActions) {
          const result = await this.executeQuickAction(action, context);
          if (result.executed) {
            return result;
          }
        }
      }

      // Process remaining handlers for non-creation commands
      if (!isCreationCommand) {
        // INVENTORY MANAGEMENT ACTIONS
        const inventoryResult = await this.handleInventoryActions(userMessage, parsedResponse, context);
        if (inventoryResult && inventoryResult.executed) {
          return inventoryResult;
        }

        // CUSTOMER MANAGEMENT ACTIONS
        const customerResult = await this.handleCustomerActions(userMessage, parsedResponse, context);
        if (customerResult && customerResult.executed) {
          return customerResult;
        }

        // SALES MANAGEMENT ACTIONS
        const salesResult = await this.handleSalesActions(userMessage, parsedResponse, context);
        if (salesResult && salesResult.executed) {
          return salesResult;
        }
      }

      // PURCHASE MANAGEMENT ACTIONS
      const purchaseResult = await this.handlePurchaseActions(originalMessage || message, parsedResponse, context);
      if (purchaseResult && purchaseResult.executed) {
        return purchaseResult;
      }

      // SUPPLIER MANAGEMENT ACTIONS
      const supplierResult = await this.handleSupplierActions(originalMessage || message, parsedResponse, context);
      if (supplierResult && supplierResult.executed) {
        return supplierResult;
      }

      // SETTINGS MANAGEMENT ACTIONS
      const settingsResult = await this.handleSettingsActions(message, parsedResponse, context);
      if (settingsResult && settingsResult.executed) {
        return settingsResult;
      }

      // ANALYTICS AND REPORTING ACTIONS
      const analyticsResult = await this.handleAnalyticsActions(message, parsedResponse, context);
      if (analyticsResult && analyticsResult.executed) {
        return analyticsResult;
      }

      // DOCTOR MANAGEMENT ACTIONS
      const doctorResult = await this.handleDoctorActions(message, parsedResponse, context);
      if (doctorResult && doctorResult.executed) {
        return doctorResult;
      }

      // STAFF MANAGEMENT ACTIONS
      const staffResult = await this.handleStaffActions(message, parsedResponse, context);
      if (staffResult && staffResult.executed) {
        return staffResult;
      }

      // RETURN PROCESSING ACTIONS
      const returnResult = await this.handleReturnActions(message, parsedResponse, context);
      if (returnResult && returnResult.executed) {
        return returnResult;
      }

      return { executed: false };
    } catch (error) {
      console.error('Error executing actions:', error);
      return {
        executed: true,
        message: `❌ Error executing action: ${error.message}. Please try again.`,
        result: null
      };
    }
  }

  /**
   * Execute quick actions from AI response
   */
  async executeQuickAction(action, context) {
    try {
      const { store, user } = context;

      switch (action.action) {
        case 'view_inventory':
          const inventory = await this.aiDataService.getInventorySummary(store._id);
          return {
            executed: true,
            message: this.formatInventorySummary(inventory),
            result: inventory
          };

        case 'view_sales':
          const sales = await this.aiDataService.getTodaysSales(store._id);
          return {
            executed: true,
            message: this.formatSalesSummary(sales),
            result: sales
          };

        case 'view_customers':
          const customers = await this.aiDataService.getTopCustomers(store._id, 10);
          return {
            executed: true,
            message: this.formatCustomersList(customers),
            result: customers
          };

        default:
          return { executed: false };
      }
    } catch (error) {
      console.error('Error executing quick action:', error);
      return { executed: false };
    }
  }

  // ==========================================
  // COMPREHENSIVE ACTION HANDLERS
  // ==========================================

  /**
   * Handle document-based actions
   */
  async handleDocumentActions(message, parsedResponse, context) {
    const { store, user, documents } = context;

    // Only process if documents are available
    if (!documents || documents.length === 0) {
      return null;
    }

    console.log('📄 Document handler triggered for:', message);

    try {
      const lowerMessage = message.toLowerCase();

      // Extract information from document
      if (lowerMessage.includes('extract') || lowerMessage.includes('what') || lowerMessage.includes('show') ||
          lowerMessage.includes('get') || lowerMessage.includes('tell') || lowerMessage.includes('find') ||
          lowerMessage.includes('medicines') || lowerMessage.includes('information') || lowerMessage.includes('details') ||
          lowerMessage.includes('supplier') || lowerMessage.includes('total') || lowerMessage.includes('amount')) {
        return await this.extractDocumentInformation(lowerMessage, documents, context);
      }

      // Create purchase order from document
      if ((lowerMessage.includes('create') || lowerMessage.includes('make') || lowerMessage.includes('generate')) &&
          (lowerMessage.includes('purchase') || lowerMessage.includes('order') || lowerMessage.includes('po'))) {
        return await this.createPurchaseFromDocument(lowerMessage, documents, context);
      }

      // Add medicines to inventory from document
      if ((lowerMessage.includes('add') || lowerMessage.includes('update')) &&
          (lowerMessage.includes('inventory') || lowerMessage.includes('stock') || lowerMessage.includes('medicine'))) {
        return await this.addMedicinesFromDocument(lowerMessage, documents, context);
      }

      // Generate report from document
      if (lowerMessage.includes('report') || lowerMessage.includes('summary') ||
          (lowerMessage.includes('analyze') && !lowerMessage.includes('extract'))) {
        return await this.generateDocumentReport(lowerMessage, documents, context);
      }

      return null;

    } catch (error) {
      console.error('❌ Document action error:', error);
      return {
        executed: false,
        message: `I encountered an error while processing the document: ${error.message}. Please try again or ask me to do something else with the document.`,
        result: null
      };
    }
  }

  /**
   * Extract specific information from documents
   */
  async extractDocumentInformation(message, documents, context) {
    console.log('🔍 Extracting information from documents');

    let extractedInfo = '';
    let totalMedicines = 0;
    let totalAmount = 0;

    documents.forEach((doc, index) => {
      extractedInfo += `\n📄 **${doc.name}**:\n`;

      if (doc.analysis && doc.analysis.extractedData) {
        const data = doc.analysis.extractedData;

        if (data.supplier) {
          extractedInfo += `• Supplier: ${data.supplier}\n`;
        }

        if (data.medicines && data.medicines.length > 0) {
          extractedInfo += `• Medicines (${data.medicines.length}): ${data.medicines.join(', ')}\n`;
          totalMedicines += data.medicines.length;
        }

        if (data.quantities && data.quantities.length > 0) {
          extractedInfo += `• Quantities: ${data.quantities.join(', ')}\n`;
        }

        if (data.prices && data.prices.length > 0) {
          extractedInfo += `• Prices: ${data.prices.join(', ')}\n`;
        }

        if (data.totals) {
          extractedInfo += `• Total Amount: ${data.totals}\n`;
          // Try to extract numeric value
          const numericTotal = data.totals.match(/[\d,]+\.?\d*/);
          if (numericTotal) {
            totalAmount += parseFloat(numericTotal[0].replace(/,/g, ''));
          }
        }

        if (data.dates) {
          extractedInfo += `• Dates: ${Array.isArray(data.dates) ? data.dates.join(', ') : data.dates}\n`;
        }
      } else {
        extractedInfo += `• Document analyzed but detailed data not available\n`;
      }
    });

    const summary = `I've extracted the following information from your ${documents.length} document(s):${extractedInfo}\n\n📊 **Summary**: ${totalMedicines} medicines found across all documents${totalAmount > 0 ? `, total value: ₹${totalAmount.toFixed(2)}` : ''}.`;

    return {
      executed: true,
      message: summary,
      result: {
        totalDocuments: documents.length,
        totalMedicines,
        totalAmount,
        extractedData: documents.map(doc => doc.analysis?.extractedData).filter(Boolean)
      }
    };
  }

  /**
   * Create purchase order from document
   */
  async createPurchaseFromDocument(message, documents, context) {
    console.log('📦 Creating purchase order from documents');

    // Find purchase bill documents
    const purchaseBills = documents.filter(doc =>
      doc.analysis?.documentType === 'purchase_bill' ||
      doc.name.toLowerCase().includes('bill') ||
      doc.name.toLowerCase().includes('invoice')
    );

    if (purchaseBills.length === 0) {
      return {
        executed: false,
        message: "I couldn't find any purchase bills in the uploaded documents. Please upload a purchase bill or invoice to create a purchase order.",
        result: null
      };
    }

    // For now, provide instructions on how to create purchase order
    // In a full implementation, this would integrate with the purchase order system
    let response = `I found ${purchaseBills.length} purchase bill(s). To create a purchase order, I would need to:\n\n`;

    purchaseBills.forEach((doc, index) => {
      response += `📄 **${doc.name}**:\n`;
      if (doc.analysis?.extractedData) {
        const data = doc.analysis.extractedData;
        response += `• Supplier: ${data.supplier || 'Not found'}\n`;
        response += `• Medicines: ${data.medicines?.length || 0} items\n`;
        response += `• Total: ${data.totals || 'Not found'}\n`;
      }
      response += '\n';
    });

    response += `Would you like me to:\n• Extract the medicine details for review\n• Help you navigate to the purchase order creation page\n• Show you the supplier information\n• Something else?`;

    return {
      executed: true,
      message: response,
      result: {
        documentType: 'purchase_order_ready',
        documents: purchaseBills,
        nextSteps: ['extract_details', 'navigate_to_po', 'show_supplier']
      }
    };
  }

  /**
   * Add medicines from document to inventory
   */
  async addMedicinesFromDocument(message, documents, context) {
    console.log('💊 Adding medicines from documents to inventory');

    let medicineCount = 0;
    let response = "I've analyzed your documents for medicines to add to inventory:\n\n";

    documents.forEach((doc, index) => {
      if (doc.analysis?.extractedData?.medicines) {
        const medicines = doc.analysis.extractedData.medicines;
        medicineCount += medicines.length;

        response += `📄 **${doc.name}**: ${medicines.length} medicines found\n`;
        response += `• ${medicines.slice(0, 5).join(', ')}${medicines.length > 5 ? '...' : ''}\n\n`;
      }
    });

    if (medicineCount === 0) {
      return {
        executed: false,
        message: "I couldn't find any medicines in the uploaded documents. Please upload a prescription, purchase bill, or inventory document that contains medicine information.",
        result: null
      };
    }

    response += `📊 **Total**: ${medicineCount} medicines identified across all documents.\n\n`;
    response += `To add these to your inventory, I would need to:\n`;
    response += `• Match medicines with existing inventory\n`;
    response += `• Get quantities and pricing information\n`;
    response += `• Update stock levels\n\n`;
    response += `Would you like me to help you navigate to the inventory management page or extract more details about these medicines?`;

    return {
      executed: true,
      message: response,
      result: {
        documentType: 'inventory_update_ready',
        medicineCount,
        documents: documents.filter(doc => doc.analysis?.extractedData?.medicines)
      }
    };
  }

  /**
   * Generate report from document
   */
  async generateDocumentReport(message, documents, context) {
    console.log('📊 Generating report from documents');

    let report = `# Document Analysis Report\n\n`;
    report += `**Generated**: ${new Date().toLocaleString()}\n`;
    report += `**Store**: ${context.store.name}\n`;
    report += `**Documents Analyzed**: ${documents.length}\n\n`;

    let totalMedicines = 0;
    let totalValue = 0;
    let suppliers = new Set();

    documents.forEach((doc, index) => {
      report += `## Document ${index + 1}: ${doc.name}\n`;
      report += `**Type**: ${doc.analysis?.documentType || 'Unknown'}\n`;
      report += `**Size**: ${(doc.size / 1024).toFixed(1)} KB\n`;

      if (doc.analysis?.extractedData) {
        const data = doc.analysis.extractedData;

        if (data.supplier) {
          report += `**Supplier**: ${data.supplier}\n`;
          suppliers.add(data.supplier);
        }

        if (data.medicines) {
          report += `**Medicines**: ${data.medicines.length} items\n`;
          totalMedicines += data.medicines.length;
          data.medicines.forEach(med => {
            report += `  • ${med}\n`;
          });
        }

        if (data.totals) {
          report += `**Total Amount**: ${data.totals}\n`;
          const numericTotal = data.totals.match(/[\d,]+\.?\d*/);
          if (numericTotal) {
            totalValue += parseFloat(numericTotal[0].replace(/,/g, ''));
          }
        }
      }

      report += `\n`;
    });

    report += `## Summary\n`;
    report += `• **Total Medicines**: ${totalMedicines}\n`;
    report += `• **Total Value**: ₹${totalValue.toFixed(2)}\n`;
    report += `• **Unique Suppliers**: ${suppliers.size}\n`;
    report += `• **Document Types**: ${[...new Set(documents.map(d => d.analysis?.documentType).filter(Boolean))].join(', ')}\n`;

    return {
      executed: true,
      message: report,
      result: {
        reportType: 'document_analysis',
        totalDocuments: documents.length,
        totalMedicines,
        totalValue,
        uniqueSuppliers: suppliers.size
      }
    };
  }

  /**
   * Handle inventory management actions
   */
  async handleInventoryActions(message, parsedResponse, context) {
    const { store, user } = context;

    console.log('💊 Inventory handler triggered for:', message);

    // Add medicine
    if (message.toLowerCase().includes('medicine') &&
        (message.toLowerCase().includes('add') ||
         message.toLowerCase().includes('create') ||
         message.toLowerCase().includes('new'))) {

      console.log('💊 Attempting to add medicine...');
      const medicineData = this.extractMedicineData(message); // Use original message

      console.log('💊 Extracted medicine data:', medicineData);

      if (medicineData && medicineData.name) {
        try {
          const medicine = await this.aiDataService.createMedicine(store._id, {
            ...medicineData,
            createdBy: user._id
          });

          console.log('✅ Medicine created successfully:', medicine._id);

          return {
            executed: true,
            message: `✅ Medicine '${medicineData.name}' has been successfully added to your inventory.`,
            result: medicine
          };
        } catch (error) {
          console.error('❌ Medicine creation failed:', error.message);
          return {
            executed: false,
            message: `❌ Failed to add medicine: ${error.message}`,
            result: null
          };
        }
      } else {
        console.log('❌ No valid medicine data extracted');
        return {
          executed: false,
          message: `❌ Could not extract medicine information from your request. Please provide at least a name.`,
          result: null
        };
      }
    }

    // Update stock
    if (message.includes('update') && message.includes('stock')) {
      const stockData = this.extractStockUpdateData(parsedResponse.message);
      if (stockData) {
        try {
          const medicine = await this.aiDataService.updateMedicineStock(store._id, stockData.medicineId, stockData);
          return {
            executed: true,
            message: `✅ Stock updated for '${medicine.name}': ${stockData.strips} strips, ${stockData.units} units`,
            result: medicine
          };
        } catch (error) {
          return {
            executed: true,
            message: `❌ Failed to update stock: ${error.message}`,
            result: null
          };
        }
      }
    }

    return null;
  }

  /**
   * Handle customer management actions
   */
  async handleCustomerActions(message, parsedResponse, context) {
    const { store, user } = context;

    console.log('🧑‍💼 Customer handler triggered for:', message);

    // Add customer - fix the trigger condition
    if (message.toLowerCase().includes('customer') &&
        (message.toLowerCase().includes('add') ||
         message.toLowerCase().includes('create') ||
         message.toLowerCase().includes('new'))) {

      console.log('🧑‍💼 Attempting to add customer...');
      const customerData = this.extractCustomerData(message); // Use original message, not parsed response

      console.log('🧑‍💼 Extracted customer data:', customerData);

      if (customerData && customerData.name) {
        // Validate required fields
        if (!customerData.phone || customerData.phone.length !== 10) {
          console.log('❌ Customer phone validation failed');
          return {
            executed: false,
            message: `❌ Customer phone number is required and must be exactly 10 digits. Please provide a valid phone number.`,
            result: null
          };
        }

        try {
          const customer = await this.aiDataService.createCustomer(store._id, {
            ...customerData,
            createdBy: user._id
          });

          console.log('✅ Customer created successfully:', customer._id);

          return {
            executed: true,
            message: this.generateCustomerCreationResponse(customerData, customer),
            result: customer,
            followUpActions: this.generateCustomerFollowUpActions(customer)
          };
        } catch (error) {
          console.error('❌ Customer creation failed:', error.message);
          return {
            executed: false,
            message: `❌ Failed to add customer: ${error.message}`,
            result: null
          };
        }
      } else {
        console.log('❌ No valid customer data extracted');
        return {
          executed: false,
          message: `❌ Could not extract customer information from your request. Please provide at least a name.`,
          result: null
        };
      }
    }

    // Update customer
    if (message.includes('update') && message.includes('customer')) {
      const updateData = this.extractCustomerUpdateData(parsedResponse.message);
      if (updateData) {
        try {
          const customer = await this.aiDataService.updateCustomer(store._id, updateData.customerId, updateData);
          return {
            executed: true,
            message: `✅ Customer '${customer.name}' has been successfully updated.`,
            result: customer
          };
        } catch (error) {
          return {
            executed: true,
            message: `❌ Failed to update customer: ${error.message}`,
            result: null
          };
        }
      }
    }

    // Delete customer
    if (message.includes('delete') && message.includes('customer')) {
      const deleteData = this.extractCustomerDeleteData(parsedResponse.message);
      if (deleteData) {
        return await this.handleCustomerDeletion(deleteData, store._id, context);
      }
    }

    return null;
  }

  /**
   * Handle sales management actions
   */
  async handleSalesActions(message, parsedResponse, context) {
    const { store, user } = context;

    // Create sale
    if (message.includes('sale') && (message.includes('create') || message.includes('add'))) {
      const saleData = this.extractSaleData(parsedResponse.message);
      if (saleData) {
        try {
          const sale = await this.aiDataService.createSale(store._id, {
            ...saleData,
            createdBy: user._id
          });
          return {
            executed: true,
            message: `✅ Sale created successfully. Invoice #${sale.invoiceNumber} - Total: ₹${sale.totalAmount}`,
            result: sale
          };
        } catch (error) {
          return {
            executed: true,
            message: `❌ Failed to create sale: ${error.message}`,
            result: null
          };
        }
      }
    }

    return null;
  }

  /**
   * Handle purchase management actions
   */
  async handlePurchaseActions(message, parsedResponse, context) {
    const { store, user } = context;

    // Create purchase order
    if (message.includes('purchase') && (message.includes('create') || message.includes('order'))) {
      const purchaseData = this.extractPurchaseData(parsedResponse.message);
      if (purchaseData) {
        try {
          const purchase = await this.aiDataService.createPurchaseOrder(store._id, {
            ...purchaseData,
            createdBy: user._id
          });
          return {
            executed: true,
            message: `✅ Purchase order created successfully. PO #${purchase.purchaseOrderNumber} - Total: ₹${purchase.totalAmount}`,
            result: purchase
          };
        } catch (error) {
          return {
            executed: true,
            message: `❌ Failed to create purchase order: ${error.message}`,
            result: null
          };
        }
      }
    }

    return null;
  }

  /**
   * Handle supplier management actions
   */
  async handleSupplierActions(message, parsedResponse, context) {
    const { store, user } = context;

    console.log('🏭 Supplier handler triggered for:', message);

    // Add supplier
    if (message.toLowerCase().includes('supplier') &&
        (message.toLowerCase().includes('add') ||
         message.toLowerCase().includes('create') ||
         message.toLowerCase().includes('new'))) {

      console.log('🏭 Attempting to add supplier...');
      const supplierData = this.extractSupplierData(message); // Use original message

      console.log('🏭 Extracted supplier data:', supplierData);

      if (supplierData && supplierData.name) {
        try {
          const supplier = await this.aiDataService.createSupplier(store._id, {
            ...supplierData,
            createdBy: user._id
          });

          console.log('✅ Supplier created successfully:', supplier._id);

          return {
            executed: true,
            message: `✅ Supplier '${supplier.name}' has been successfully added.`,
            result: supplier
          };
        } catch (error) {
          console.error('❌ Supplier creation failed:', error.message);
          return {
            executed: false,
            message: `❌ Failed to add supplier: ${error.message}`,
            result: null
          };
        }
      } else {
        console.log('❌ No valid supplier data extracted');
        return {
          executed: false,
          message: `❌ Could not extract supplier information from your request. Please provide at least a name.`,
          result: null
        };
      }
    }

    return null;
  }

  /**
   * Handle settings management actions
   */
  async handleSettingsActions(message, parsedResponse, context) {
    const { store, user } = context;

    // View settings
    if (message.includes('settings') && (message.includes('show') || message.includes('view'))) {
      try {
        const settings = await this.aiDataService.getStoreSettings(store._id);
        return {
          executed: true,
          message: this.formatStoreSettings(settings),
          result: settings
        };
      } catch (error) {
        return {
          executed: true,
          message: `❌ Failed to load settings: ${error.message}`,
          result: null
        };
      }
    }

    // Update GST rate
    if (message.includes('gst') && (message.includes('set') || message.includes('update'))) {
      const gstMatch = message.match(/(\d+(?:\.\d+)?)\s*%?/);
      if (gstMatch) {
        try {
          const gstRate = parseFloat(gstMatch[1]);
          const currentSettings = await this.aiDataService.getStoreSettings(store._id);
          const updatedSettings = {
            ...currentSettings.settings,
            gstRate: gstRate
          };
          await this.aiDataService.updateStoreSettings(store._id, updatedSettings);
          return {
            executed: true,
            message: `✅ GST rate updated to ${gstRate}%`,
            result: { gstRate }
          };
        } catch (error) {
          return {
            executed: true,
            message: `❌ Failed to update GST rate: ${error.message}`,
            result: null
          };
        }
      }
    }

    return null;
  }

  /**
   * Handle analytics and reporting actions
   */
  async handleAnalyticsActions(message, parsedResponse, context) {
    const { store, user } = context;

    // Show analytics/dashboard
    if (message.includes('analytics') || message.includes('dashboard') || message.includes('overview')) {
      try {
        const analytics = await this.aiDataService.getStoreAnalytics(store._id);
        return {
          executed: true,
          message: this.formatStoreAnalytics(analytics),
          result: analytics
        };
      } catch (error) {
        return {
          executed: true,
          message: `❌ Failed to load analytics: ${error.message}`,
          result: null
        };
      }
    }

    // Staff information
    if (message.includes('staff') && (message.includes('show') || message.includes('view'))) {
      try {
        const staff = await this.aiDataService.getStaffInfo(store._id);
        return {
          executed: true,
          message: this.formatStaffInfo(staff),
          result: staff
        };
      } catch (error) {
        return {
          executed: true,
          message: `❌ Failed to load staff information: ${error.message}`,
          result: null
        };
      }
    }

    return null;
  }

  /**
   * Handle doctor management actions
   */
  async handleDoctorActions(message, parsedResponse, context) {
    const { store, user } = context;

    // Add doctor
    if (message.includes('doctor') && (message.includes('add') || message.includes('create'))) {
      const doctorData = this.extractDoctorData(parsedResponse.message);
      if (doctorData) {
        try {
          const doctor = await this.aiDataService.createDoctor(store._id, {
            ...doctorData,
            createdBy: user._id
          });
          return {
            executed: true,
            message: `✅ Doctor '${doctorData.name}' has been successfully added to your system.`,
            result: doctor
          };
        } catch (error) {
          return {
            executed: true,
            message: `❌ Failed to add doctor: ${error.message}`,
            result: null
          };
        }
      }
    }

    return null;
  }

  /**
   * Handle staff management actions
   */
  async handleStaffActions(message, parsedResponse, context) {
    const { store, user } = context;

    // Add staff
    if (message.includes('staff') && (message.includes('add') || message.includes('create'))) {
      const staffData = this.extractStaffData(parsedResponse.message);
      if (staffData) {
        try {
          const staff = await this.aiDataService.createStaff(store._id, {
            ...staffData,
            createdBy: user._id
          });
          return {
            executed: true,
            message: `✅ Staff member '${staffData.name}' has been successfully added to your team.`,
            result: staff
          };
        } catch (error) {
          return {
            executed: true,
            message: `❌ Failed to add staff member: ${error.message}`,
            result: null
          };
        }
      }
    }

    return null;
  }

  /**
   * Handle return processing actions
   */
  async handleReturnActions(message, parsedResponse, context) {
    const { store, user } = context;

    // Process return
    if (message.includes('return') && (message.includes('process') || message.includes('create'))) {
      const returnData = this.extractReturnData(parsedResponse.message);
      if (returnData) {
        try {
          const returnRecord = await this.aiDataService.processReturn(store._id, {
            ...returnData,
            processedBy: user._id
          });
          return {
            executed: true,
            message: `✅ Return has been processed successfully. Return ID: ${returnRecord._id}`,
            result: returnRecord
          };
        } catch (error) {
          return {
            executed: true,
            message: `❌ Failed to process return: ${error.message}`,
            result: null
          };
        }
      }
    }

    return null;
  }

  // ==========================================
  // DATA EXTRACTION METHODS
  // ==========================================

  /**
   * Extract customer data from AI response
   */
  extractCustomerData(message) {
    try {
      console.log('🔍 Extracting customer data from:', message);

      // Enhanced extraction logic with multiple pattern matching
      // Pattern 1: "Add customer 'Name'" or "customer 'Name'"
      let nameMatch = message.match(/(?:add\s+)?customer\s+['"']([^'"]+)['"']/i);

      // Pattern 2: "Add customer Name" (without quotes)
      if (!nameMatch) {
        nameMatch = message.match(/(?:add\s+)?customer\s+([A-Za-z\s]+?)(?:\s+with|\s+phone|\s+email|$)/i);
      }

      // Pattern 3: "'Name'" anywhere in the message
      if (!nameMatch) {
        nameMatch = message.match(/['"']([A-Za-z\s]+)['"']/i);
      }

      // Phone extraction with flexible patterns
      const phoneMatch = message.match(/phone\s+(?:number\s+)?['"']?(\d{10,15})['"']?/i) ||
                        message.match(/(\d{10,15})/);

      // Email extraction
      const emailMatch = message.match(/email\s+['"']?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})['"']?/i);

      // Address extraction
      const addressMatch = message.match(/address\s+['"']?([^'"]+)['"']?/i);

      // Gender extraction
      const genderMatch = message.match(/gender\s+([a-zA-Z]+)/i);

      console.log('🔍 Extraction results:', {
        nameMatch: nameMatch ? nameMatch[1] : null,
        phoneMatch: phoneMatch ? phoneMatch[1] : null,
        emailMatch: emailMatch ? emailMatch[1] : null,
        addressMatch: addressMatch ? addressMatch[1] : null
      });

      if (nameMatch) {
        // Validate gender against enum values
        let gender = undefined;
        if (genderMatch) {
          const extractedGender = genderMatch[1].toLowerCase();
          if (['male', 'female', 'other'].includes(extractedGender)) {
            gender = extractedGender;
          }
        }

        const customerData = {
          name: nameMatch[1].trim(),
          phone: phoneMatch ? phoneMatch[1] : '',
          email: emailMatch ? emailMatch[1] : '',
          address: addressMatch ? addressMatch[1] : '',
          gender: gender,
          customerType: 'regular',
          status: 'active',
          totalPurchases: 0,
          totalSpent: 0,
          loyaltyPoints: 0,
          creditLimit: 0,
          creditBalance: 0,
          creditStatus: 'good',
          preferredPaymentMethod: 'cash',
          communicationPreferences: {
            sms: true,
            email: false,
            whatsapp: false
          },
          discountEligible: false,
          discountPercentage: 0,
          visitCount: 0
        };

        console.log('✅ Customer data extracted:', customerData);
        return customerData;
      }

      console.log('❌ No customer name found in message');
      return null;
    } catch (error) {
      console.error('Error extracting customer data:', error);
      return null;
    }
  }

  /**
   * Extract customer update data from AI response
   */
  extractCustomerUpdateData(message) {
    try {
      // Look for patterns like "Update customer 'Name'" or "Change Name's phone to XXXXXXXXXX"
      const nameMatch = message.match(/(?:update|change)\s+(?:customer\s+)?['"']?([^'"'\s]+)['"']?/i);
      const phoneMatch = message.match(/phone\s+(?:number\s+)?(?:to\s+)?(\d{10})/i);
      const emailMatch = message.match(/email\s+(?:to\s+)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const addressMatch = message.match(/address\s+(?:to\s+)?['"']([^'"]+)['"']/i);

      if (nameMatch) {
        const updateData = {
          identifier: nameMatch[1].trim()
        };

        if (phoneMatch) updateData.phone = phoneMatch[1];
        if (emailMatch) updateData.email = emailMatch[1];
        if (addressMatch) updateData.address = addressMatch[1];

        return updateData;
      }

      return null;
    } catch (error) {
      console.error('Error extracting customer update data:', error);
      return null;
    }
  }

  /**
   * Extract customer delete data from AI response
   */
  extractCustomerDeleteData(message) {
    try {
      // Look for patterns like "delete customer 'Name'" or "remove customer Name"
      const nameMatch = message.match(/(?:delete|remove)\s+(?:customer\s+)?(?:name\s+)?['"']?([^'"'\s]+)['"']?/i);

      if (nameMatch) {
        return {
          identifier: nameMatch[1].trim()
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting customer delete data:', error);
      return null;
    }
  }

  /**
   * Extract delete confirmation data from AI response
   */
  extractDeleteConfirmationData(message) {
    try {
      // Look for patterns like "confirm delete customer ID" or "yes delete customer 123"
      const confirmMatch = message.match(/(?:confirm|yes)\s+delete\s+(?:customer\s+)?(?:id\s+)?([a-zA-Z0-9]+)/i);

      if (confirmMatch) {
        return {
          customerId: confirmMatch[1].trim()
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting delete confirmation data:', error);
      return null;
    }
  }

  /**
   * Generate enhanced customer creation response
   */
  generateCustomerCreationResponse(customerData, createdCustomer) {
    let response = `✅ **Customer Successfully Added!**\n\n`;
    response += `📋 **Customer Details:**\n`;
    response += `• Name: ${customerData.name}\n`;
    response += `• Phone: ${customerData.phone}\n`;
    if (customerData.email) {
      response += `• Email: ${customerData.email}\n`;
    }
    response += `• Customer ID: ${createdCustomer._id}\n\n`;

    response += `🔄 **What would you like to do next?**\n`;
    response += `• Add more details to this customer profile\n`;
    response += `• Edit any information for this customer\n`;
    response += `• Add another customer\n`;
    response += `• View customer list\n\n`;

    response += `💡 **You can also say:**\n`;
    response += `• "Add address for ${customerData.name}"\n`;
    response += `• "Update ${customerData.name}'s phone number"\n`;
    response += `• "Set credit limit for ${customerData.name}"\n`;
    response += `• "Add another customer"`;

    return response;
  }

  /**
   * Generate follow-up actions for customer creation
   */
  generateCustomerFollowUpActions(customer) {
    return [
      {
        label: "Add More Details",
        action: "add_customer_details",
        params: { customerId: customer._id, customerName: customer.name }
      },
      {
        label: "Edit Customer Info",
        action: "edit_customer",
        params: { customerId: customer._id, customerName: customer.name }
      },
      {
        label: "Add Another Customer",
        action: "add_customer",
        params: {}
      },
      {
        label: "View Customer List",
        action: "view_customers",
        params: {}
      }
    ];
  }

  /**
   * Handle customer deletion workflow
   */
  async handleCustomerDeletion(deleteData, storeId, context) {
    try {
      // Search for customers matching the identifier
      const customers = await Customer.find({
        store: storeId,
        name: { $regex: new RegExp(deleteData.identifier, 'i') }
      }).sort({ createdAt: -1 });

      if (customers.length === 0) {
        return {
          executed: true,
          message: `❌ No customers found with the name '${deleteData.identifier}' in your store. Please check the name and try again.`,
          result: null
        };
      }

      // Generate detailed customer information for confirmation
      const customerDetails = await this.generateCustomerDeletionDetails(customers, storeId);

      if (customers.length === 1) {
        return {
          executed: true,
          message: customerDetails.singleCustomerMessage,
          result: customers[0],
          requiresConfirmation: true,
          confirmationData: { customers: customers },
          followUpActions: [
            {
              label: `Confirm Delete ${customers[0].name}`,
              action: "confirm_delete",
              params: { customerId: customers[0]._id.toString() }
            },
            {
              label: "Cancel Deletion",
              action: "cancel_delete",
              params: {}
            }
          ]
        };
      } else {
        return {
          executed: true,
          message: customerDetails.multipleCustomersMessage,
          result: customers,
          requiresConfirmation: true,
          confirmationData: { customers: customers },
          followUpActions: customers.map((customer, index) => ({
            label: `Delete Customer ${index + 1}`,
            action: "confirm_delete",
            params: { customerId: customer._id.toString() }
          })).concat([
            {
              label: "Cancel Deletion",
              action: "cancel_delete",
              params: {}
            }
          ])
        };
      }
    } catch (error) {
      console.error('Error handling customer deletion:', error);
      return {
        executed: true,
        message: `❌ Error searching for customers: ${error.message}. Please try again.`,
        result: null
      };
    }
  }

  /**
   * Extract medicine data from AI response
   */
  extractMedicineData(message) {
    try {
      // Enhanced extraction logic to match Medicine schema requirements
      const nameMatch = message.match(/medicine['\s]*['"]?([^'"]+)['"]?/i);
      const manufacturerMatch = message.match(/manufacturer['\s]*['"]?([^'"]+)['"]?/i);
      const categoryMatch = message.match(/category['\s]*['"]?([^'"]+)['"]?/i);
      const compositionMatch = message.match(/composition['\s]*['"]?([^'"]+)['"]?/i);

      // Valid categories from Medicine schema
      const validCategories = [
        'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment',
        'Powder', 'Inhaler', 'Spray', 'Gel', 'Lotion', 'Solution', 'Suspension',
        'Patch', 'Suppository', 'Other'
      ];

      if (nameMatch) {
        // Extract category and validate against enum
        let category = 'Other'; // Default fallback
        if (categoryMatch) {
          const extractedCategory = categoryMatch[1].trim();
          // Find matching category (case insensitive)
          const matchedCategory = validCategories.find(cat =>
            cat.toLowerCase() === extractedCategory.toLowerCase()
          );
          category = matchedCategory || 'Other';
        }

        // Extract composition - required field
        let composition = compositionMatch ? compositionMatch[1].trim() : nameMatch[1].trim();

        return {
          name: nameMatch[1].trim(),
          manufacturer: manufacturerMatch ? manufacturerMatch[1].trim() : 'Unknown',
          category: category,
          composition: composition,
          // Add required dual unit system structure
          unitTypes: {
            hasStrips: true,
            hasIndividual: true,
            unitsPerStrip: 10
          },
          stripInfo: {
            purchasePrice: 0,
            sellingPrice: 0,
            mrp: 0,
            stock: 0,
            minStock: 5,
            reorderLevel: 10
          },
          individualInfo: {
            purchasePrice: 0,
            sellingPrice: 0,
            mrp: 0,
            stock: 0,
            minStock: 50,
            reorderLevel: 100
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting medicine data:', error);
      return null;
    }
  }

  /**
   * Extract stock update data from AI response
   */
  extractStockUpdateData(message) {
    try {
      const medicineMatch = message.match(/(?:update|set)\s+(?:stock\s+for\s+)?['"']?([^'"'\s]+)['"']?/i);
      const stripsMatch = message.match(/(\d+)\s+strips?/i);
      const unitsMatch = message.match(/(\d+)\s+units?/i);
      const medicineIdMatch = message.match(/medicine\s+id[:\s]+([a-zA-Z0-9]+)/i);

      if (medicineMatch && (stripsMatch || unitsMatch)) {
        return {
          medicineId: medicineIdMatch ? medicineIdMatch[1] : null,
          medicineName: medicineMatch[1].trim(),
          strips: stripsMatch ? parseInt(stripsMatch[1]) : 0,
          units: unitsMatch ? parseInt(unitsMatch[1]) : 0,
          unitsPerStrip: 10 // Default
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting stock update data:', error);
      return null;
    }
  }

  /**
   * Extract sale data from AI response
   */
  extractSaleData(message) {
    try {
      const customerMatch = message.match(/customer[:\s]+['"']?([^'"'\s]+)['"']?/i);
      const totalMatch = message.match(/total[:\s]+₹?(\d+(?:\.\d{2})?)/i);
      const itemsMatch = message.match(/items?[:\s]+\[([^\]]+)\]/i);

      if (totalMatch) {
        const saleData = {
          totalAmount: parseFloat(totalMatch[1]),
          subtotal: parseFloat(totalMatch[1]),
          items: [],
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          invoiceNumber: `INV-${Date.now()}`
        };

        if (customerMatch) {
          saleData.customerName = customerMatch[1].trim();
        }

        if (itemsMatch) {
          // Parse items from string format
          const itemsStr = itemsMatch[1];
          // This would need more sophisticated parsing for real implementation
          saleData.items = []; // Placeholder
        }

        return saleData;
      }

      return null;
    } catch (error) {
      console.error('Error extracting sale data:', error);
      return null;
    }
  }

  /**
   * Extract purchase data from AI response
   */
  extractPurchaseData(message) {
    try {
      const supplierMatch = message.match(/supplier[:\s]+['"']?([^'"'\s]+)['"']?/i);
      const totalMatch = message.match(/total[:\s]+₹?(\d+(?:\.\d{2})?)/i);
      const itemsMatch = message.match(/items?[:\s]+\[([^\]]+)\]/i);

      if (supplierMatch && totalMatch) {
        return {
          supplierName: supplierMatch[1].trim(),
          totalAmount: parseFloat(totalMatch[1]),
          subtotal: parseFloat(totalMatch[1]),
          items: [], // Would need sophisticated parsing
          purchaseOrderNumber: `PO-${Date.now()}`,
          status: 'pending'
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting purchase data:', error);
      return null;
    }
  }

  /**
   * Extract supplier data from AI response
   */
  extractSupplierData(message) {
    try {
      console.log('🏭 Extracting supplier data from:', message);

      // Enhanced extraction logic with multiple pattern matching
      // Pattern 1: "Add supplier 'Name'" or "supplier 'Name'"
      let nameMatch = message.match(/(?:add\s+)?supplier\s+['"']([^'"]+)['"']/i);

      // Pattern 2: "Add supplier Name" (without quotes)
      if (!nameMatch) {
        nameMatch = message.match(/(?:add\s+)?supplier\s+([A-Za-z\s]+?)(?:\s+with|\s+phone|\s+email|$)/i);
      }

      // Pattern 3: "'Name'" anywhere in the message
      if (!nameMatch) {
        nameMatch = message.match(/['"']([A-Za-z\s]+)['"']/i);
      }

      // Phone extraction with flexible patterns
      const phoneMatch = message.match(/phone\s+(?:number\s+)?['"']?(\d{10,15})['"']?/i) ||
                        message.match(/(\d{10,15})/);

      // Email extraction
      const emailMatch = message.match(/email\s+['"']?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})['"']?/i);

      // Contact person extraction
      const contactPersonMatch = message.match(/contact\s+person\s+['"']?([^'"]+)['"']?/i);

      // Address extraction
      const addressMatch = message.match(/address\s+['"']?([^'"]+)['"']?/i);

      console.log('🏭 Extraction results:', {
        nameMatch: nameMatch ? nameMatch[1] : null,
        phoneMatch: phoneMatch ? phoneMatch[1] : null,
        emailMatch: emailMatch ? emailMatch[1] : null,
        contactPersonMatch: contactPersonMatch ? contactPersonMatch[1] : null,
        addressMatch: addressMatch ? addressMatch[1] : null
      });

      if (nameMatch) {
        const supplierData = {
          name: nameMatch[1].trim(),
          phone: phoneMatch ? phoneMatch[1] : '',
          email: emailMatch ? emailMatch[1] : '',
          contactPerson: contactPersonMatch ? contactPersonMatch[1] : '',
          address: addressMatch ? addressMatch[1] : ''
        };

        console.log('✅ Supplier data extracted:', supplierData);
        return supplierData;
      }

      console.log('❌ No supplier name found in message');
      return null;
    } catch (error) {
      console.error('Error extracting supplier data:', error);
      return null;
    }
  }

  // ==========================================
  // ENHANCED PARAMETER EXTRACTION METHODS
  // ==========================================

  /**
   * Extract complex multi-step commands from user input
   */
  extractMultiStepCommands(message) {
    const commands = [];
    const lowerMessage = message.toLowerCase();

    // Look for "then", "and then", "after that", "also" patterns
    const stepSeparators = /(?:\s+then\s+|\s+and\s+then\s+|\s+after\s+that\s+|\s+also\s+|\s+,\s+and\s+)/i;
    const steps = message.split(stepSeparators);

    steps.forEach((step, index) => {
      const trimmedStep = step.trim();
      if (trimmedStep) {
        const command = this.parseIndividualCommand(trimmedStep);
        if (command) {
          command.stepOrder = index + 1;
          commands.push(command);
        }
      }
    });

    return commands.length > 0 ? commands : null;
  }

  /**
   * Parse individual command from text
   */
  parseIndividualCommand(text) {
    const lowerText = text.toLowerCase();

    // Customer operations
    if (lowerText.includes('add') && lowerText.includes('customer')) {
      return {
        action: 'add_customer',
        type: 'customer',
        data: this.extractCustomerData(text)
      };
    }

    // Medicine operations
    if (lowerText.includes('update') && lowerText.includes('stock')) {
      return {
        action: 'update_stock',
        type: 'inventory',
        data: this.extractStockUpdateData(text)
      };
    }

    // Sales operations
    if (lowerText.includes('create') && lowerText.includes('sale')) {
      return {
        action: 'create_sale',
        type: 'sales',
        data: this.extractSaleData(text)
      };
    }

    // View operations
    if (lowerText.includes('show') || lowerText.includes('view') || lowerText.includes('display')) {
      return {
        action: 'view_data',
        type: this.inferDataType(text),
        data: { query: text }
      };
    }

    return null;
  }

  /**
   * Infer data type from text
   */
  inferDataType(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('customer')) return 'customers';
    if (lowerText.includes('medicine') || lowerText.includes('inventory') || lowerText.includes('stock')) return 'inventory';
    if (lowerText.includes('sale') || lowerText.includes('revenue')) return 'sales';
    if (lowerText.includes('supplier')) return 'suppliers';
    if (lowerText.includes('purchase')) return 'purchases';
    if (lowerText.includes('expir')) return 'expiry';

    return 'general';
  }

  /**
   * Extract date ranges from natural language
   */
  extractDateRange(text) {
    const lowerText = text.toLowerCase();
    const today = new Date();

    // This week
    if (lowerText.includes('this week')) {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return { start: startOfWeek, end: endOfWeek, period: 'this_week' };
    }

    // Last week
    if (lowerText.includes('last week')) {
      const startOfLastWeek = new Date(today);
      startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      return { start: startOfLastWeek, end: endOfLastWeek, period: 'last_week' };
    }

    // This month
    if (lowerText.includes('this month')) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: startOfMonth, end: endOfMonth, period: 'this_month' };
    }

    // Last month
    if (lowerText.includes('last month')) {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: startOfLastMonth, end: endOfLastMonth, period: 'last_month' };
    }

    // Today
    if (lowerText.includes('today')) {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      return { start: startOfDay, end: endOfDay, period: 'today' };
    }

    // Yesterday
    if (lowerText.includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const startOfYesterday = new Date(yesterday);
      startOfYesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return { start: startOfYesterday, end: endOfYesterday, period: 'yesterday' };
    }

    // Next X days
    const nextDaysMatch = lowerText.match(/next\s+(\d+)\s+days?/);
    if (nextDaysMatch) {
      const days = parseInt(nextDaysMatch[1]);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + days);
      return { start: today, end: endDate, period: `next_${days}_days` };
    }

    return null;
  }

  /**
   * Extract numerical values with units
   */
  extractQuantityWithUnit(text) {
    const patterns = [
      /(\d+)\s*(strips?|strip)/i,
      /(\d+)\s*(units?|unit|tablets?|tablet|capsules?|capsule)/i,
      /(\d+)\s*(bottles?|bottle|vials?|vial)/i,
      /(\d+)\s*(boxes?|box|packs?|pack)/i
    ];

    const results = [];

    patterns.forEach(pattern => {
      const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        results.push({
          quantity: parseInt(match[1]),
          unit: match[2].toLowerCase(),
          originalText: match[0]
        });
      }
    });

    return results.length > 0 ? results : null;
  }

  /**
   * Extract price information
   */
  extractPriceInfo(text) {
    const pricePatterns = [
      /₹\s*(\d+(?:\.\d{2})?)/g,
      /(?:rs\.?|rupees?)\s*(\d+(?:\.\d{2})?)/gi,
      /(\d+(?:\.\d{2})?)\s*(?:rs\.?|rupees?)/gi
    ];

    const prices = [];

    pricePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        prices.push({
          amount: parseFloat(match[1]),
          originalText: match[0],
          currency: 'INR'
        });
      }
    });

    return prices.length > 0 ? prices : null;
  }

  /**
   * Extract doctor data from AI response
   */
  extractDoctorData(message) {
    try {
      const nameMatch = message.match(/doctor\s+['"']([^'"]+)['"']/i);
      const phoneMatch = message.match(/phone\s+(?:number\s+)?(\d{10})/i);
      const emailMatch = message.match(/email\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const specializationMatch = message.match(/specialization\s+['"']([^'"]+)['"']/i);

      if (nameMatch) {
        return {
          name: nameMatch[1].trim(),
          phone: phoneMatch ? phoneMatch[1] : '',
          email: emailMatch ? emailMatch[1] : '',
          specialization: specializationMatch ? specializationMatch[1].trim() : 'General Medicine',
          qualification: '',
          experience: 0,
          registrationNumber: '',
          address: {},
          hospital: {},
          commissionRate: 0,
          commissionType: 'percentage',
          fixedCommissionAmount: 0
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting doctor data:', error);
      return null;
    }
  }

  /**
   * Extract staff data from AI response
   */
  extractStaffData(message) {
    try {
      const nameMatch = message.match(/staff\s+(?:member\s+)?['"']([^'"]+)['"']/i);
      const phoneMatch = message.match(/phone\s+(?:number\s+)?(\d{10})/i);
      const emailMatch = message.match(/email\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const roleMatch = message.match(/role\s+['"']([^'"]+)['"']/i);

      // Valid roles from Staff schema
      const validRoles = [
        'store_manager', 'pharmacist', 'assistant', 'cashier',
        'inventory_manager', 'sales_executive', 'supervisor'
      ];

      if (nameMatch) {
        let role = 'assistant'; // Default role
        if (roleMatch) {
          const extractedRole = roleMatch[1].toLowerCase().replace(/\s+/g, '_');
          role = validRoles.includes(extractedRole) ? extractedRole : 'assistant';
        }

        return {
          name: nameMatch[1].trim(),
          phone: phoneMatch ? phoneMatch[1] : '',
          email: emailMatch ? emailMatch[1] : '',
          role: role,
          department: 'pharmacy',
          dateOfJoining: new Date(),
          salary: 0,
          workingHours: 'full_time',
          address: {},
          emergencyContact: {},
          qualifications: [],
          certifications: [],
          permissions: []
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting staff data:', error);
      return null;
    }
  }

  /**
   * Extract return data from AI response
   */
  extractReturnData(message) {
    try {
      const invoiceMatch = message.match(/invoice\s+([A-Z0-9]+)/i);
      const quantityMatch = message.match(/(\d+)\s+(?:strip|unit)/i);
      const reasonMatch = message.match(/(?:due to|reason|because)\s+([^.]+)/i);

      if (invoiceMatch || quantityMatch) {
        return {
          originalSaleId: null, // Would need to lookup by invoice number
          customerId: null,
          items: [{
            medicineId: null, // Would need to extract medicine name and lookup
            quantity: quantityMatch ? parseInt(quantityMatch[1]) : 1,
            unitType: 'strip',
            unitPrice: 0,
            totalPrice: 0,
            reason: reasonMatch ? reasonMatch[1].trim() : 'other'
          }],
          totalAmount: 0,
          refundAmount: 0,
          reason: reasonMatch ? reasonMatch[1].trim() : 'other',
          refundMethod: 'cash',
          restoreInventory: true,
          notes: ''
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting return data:', error);
      return null;
    }
  }

  // ==========================================
  // FORMATTING METHODS FOR QUICK ACTIONS
  // ==========================================

  /**
   * Format inventory summary for display
   */
  formatInventorySummary(inventory) {
    if (!inventory) {
      return "❌ Unable to load inventory data at the moment.";
    }

    let response = "📦 **INVENTORY SUMMARY**\n\n";
    response += `• **Total Medicines**: ${inventory.totalMedicines || 0}\n`;
    response += `• **Total Value**: ₹${(inventory.totalValue || 0).toFixed(2)}\n`;
    response += `• **In Stock**: ${inventory.inStock || 0} medicines\n`;
    response += `• **Low Stock**: ${inventory.lowStock || 0} medicines\n`;
    response += `• **Out of Stock**: ${inventory.outOfStock || 0} medicines\n\n`;

    if (inventory.categoryBreakdown && inventory.categoryBreakdown.length > 0) {
      response += "📊 **TOP CATEGORIES**:\n";
      inventory.categoryBreakdown.slice(0, 3).forEach((cat, index) => {
        response += `${index + 1}. ${cat.category}: ${cat.count} medicines (₹${cat.value.toFixed(2)})\n`;
      });
    }

    return response;
  }

  /**
   * Format sales summary for display
   */
  formatSalesSummary(sales) {
    if (!sales) {
      return "❌ Unable to load sales data at the moment.";
    }

    let response = "💰 **TODAY'S SALES SUMMARY**\n\n";
    response += `• **Total Revenue**: ₹${(sales.totalRevenue || 0).toFixed(2)}\n`;
    response += `• **Total Transactions**: ${sales.totalTransactions || 0}\n`;
    response += `• **Items Sold**: ${sales.totalItemsSold || 0}\n`;
    response += `• **Average Transaction**: ₹${(sales.averageTransaction || 0).toFixed(2)}\n`;

    if (sales.topSellingMedicines && sales.topSellingMedicines.length > 0) {
      response += "\n🏆 **TOP SELLING MEDICINES**:\n";
      sales.topSellingMedicines.slice(0, 3).forEach((med, index) => {
        response += `${index + 1}. ${med.name}: ${med.quantitySold} units\n`;
      });
    }

    return response;
  }

  /**
   * Format customers list for display
   */
  formatCustomersList(customers) {
    if (!customers || customers.length === 0) {
      return "❌ No customer data available at the moment.";
    }

    let response = "👥 **TOP CUSTOMERS**\n\n";
    customers.slice(0, 10).forEach((customer, index) => {
      response += `${index + 1}. **${customer.name}**\n`;
      response += `   📞 ${customer.phone}\n`;
      if (customer.email) {
        response += `   📧 ${customer.email}\n`;
      }
      if (customer.totalPurchases) {
        response += `   💰 Total Purchases: ₹${customer.totalPurchases.toFixed(2)}\n`;
      }
      response += "\n";
    });

    return response;
  }

  /**
   * Format store settings for display
   */
  formatStoreSettings(settings) {
    if (!settings) {
      return "❌ Unable to load store settings at the moment.";
    }

    let response = "⚙️ **STORE SETTINGS**\n\n";
    response += `🏪 **Store Information**:\n`;
    response += `• Name: ${settings.storeName || 'Not set'}\n`;
    response += `• Address: ${settings.address || 'Not set'}\n`;
    response += `• Phone: ${settings.phone || 'Not set'}\n`;
    response += `• Email: ${settings.email || 'Not set'}\n`;
    response += `• GST Number: ${settings.gstNumber || 'Not set'}\n\n`;

    if (settings.settings) {
      response += `💰 **Business Settings**:\n`;
      response += `• GST Rate: ${settings.settings.gstRate || 18}%\n`;
      response += `• Low Stock Threshold: ${settings.settings.lowStockThreshold || 10} units\n`;
      response += `• Auto Reorder: ${settings.settings.autoReorderEnabled ? 'Enabled' : 'Disabled'}\n`;
      response += `• Print Invoice After Sale: ${settings.settings.printInvoiceAfterSale ? 'Yes' : 'No'}\n`;
      response += `• Require Prescription for Scheduled Drugs: ${settings.settings.requirePrescriptionForScheduledDrugs ? 'Yes' : 'No'}\n`;
    }

    return response;
  }

  /**
   * Format store analytics for display
   */
  formatStoreAnalytics(analytics) {
    if (!analytics) {
      return "❌ Unable to load analytics data at the moment.";
    }

    let response = "📊 **STORE ANALYTICS DASHBOARD**\n\n";

    // Sales analytics
    response += `💰 **SALES PERFORMANCE**:\n`;
    response += `• **Today**: ₹${(analytics.sales.today.totalRevenue || 0).toFixed(2)} (${analytics.sales.today.totalTransactions || 0} transactions)\n`;
    response += `• **This Week**: ₹${(analytics.sales.week.totalRevenue || 0).toFixed(2)} (${analytics.sales.week.totalTransactions || 0} transactions)\n`;
    response += `• **This Month**: ₹${(analytics.sales.month.totalRevenue || 0).toFixed(2)} (${analytics.sales.month.totalTransactions || 0} transactions)\n\n`;

    // Inventory analytics
    response += `📦 **INVENTORY STATUS**:\n`;
    response += `• **Total Medicines**: ${analytics.inventory.totalMedicines || 0}\n`;
    response += `• **Total Inventory Value**: ₹${(analytics.inventory.totalValue || 0).toFixed(2)}\n`;
    response += `• **Low Stock Items**: ${analytics.inventory.lowStock || 0}\n\n`;

    // Customer analytics
    response += `👥 **CUSTOMER BASE**:\n`;
    response += `• **Total Customers**: ${analytics.customers.totalCustomers || 0}\n`;
    response += `• **Active Customers**: ${analytics.customers.activeCustomers || 0}\n\n`;

    response += `📅 **Generated**: ${analytics.generatedAt ? analytics.generatedAt.toLocaleString() : 'Just now'}`;

    return response;
  }

  /**
   * Format staff information for display
   */
  formatStaffInfo(staff) {
    if (!staff || staff.length === 0) {
      return "❌ No staff information available at the moment.";
    }

    let response = "👥 **STAFF INFORMATION**\n\n";
    staff.forEach((member, index) => {
      response += `${index + 1}. **${member.name}**\n`;
      response += `   🏷️ Role: ${member.role}\n`;
      response += `   📞 Phone: ${member.phone || 'Not provided'}\n`;
      response += `   📧 Email: ${member.email || 'Not provided'}\n`;
      response += `   ✅ Status: ${member.isActive ? 'Active' : 'Inactive'}\n`;
      response += `   📅 Joined: ${member.joinedDate ? member.joinedDate.toDateString() : 'Unknown'}\n\n`;
    });

    return response;
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData, storeId, userId) {
    try {
      const customer = await Customer.create({
        store: storeId,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        customerType: 'regular',
        createdBy: userId
      });

      return { success: true, customer };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(updateData, storeId) {
    try {
      // Find customer by name or phone
      let customer = await Customer.findOne({
        store: storeId,
        $or: [
          { name: { $regex: new RegExp(updateData.identifier, 'i') } },
          { phone: updateData.identifier }
        ]
      });

      if (!customer) {
        return { success: false, error: `Customer '${updateData.identifier}' not found` };
      }

      // Update fields
      const updateFields = {};
      if (updateData.phone) updateFields.phone = updateData.phone;
      if (updateData.email) updateFields.email = updateData.email;
      if (updateData.address) updateFields.address = updateData.address;
      if (updateData.customerType) updateFields.customerType = updateData.customerType;
      if (updateData.creditLimit !== undefined) updateFields.creditLimit = updateData.creditLimit;

      customer = await Customer.findByIdAndUpdate(
        customer._id,
        updateFields,
        { new: true, runValidators: true }
      );

      return { success: true, customer };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate detailed customer information for deletion confirmation
   */
  async generateCustomerDeletionDetails(customers, storeId) {
    try {
      const Sale = require('../models/Sale');

      if (customers.length === 1) {
        const customer = customers[0];

        // Get customer's purchase history
        const sales = await Sale.find({
          store: storeId,
          customer: customer._id
        }).sort({ createdAt: -1 });

        const totalPurchases = sales.length;
        const totalAmount = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

        const message = `⚠️ **CUSTOMER DELETION CONFIRMATION REQUIRED**

📋 **Customer Details:**
• **Customer ID**: ${customer._id}
• **Name**: ${customer.name}
• **Phone**: ${customer.phone}
• **Email**: ${customer.email || 'Not provided'}
• **Customer Type**: ${customer.customerType || 'Regular'}
• **Address**: ${customer.address || 'Not provided'}
• **Credit Limit**: ₹${customer.creditLimit || 0}
• **Registration Date**: ${customer.createdAt.toDateString()}

📊 **Purchase History:**
• **Total Purchases**: ${totalPurchases} transactions
• **Total Amount**: ₹${totalAmount.toFixed(2)}

🚨 **WARNING**: This action is PERMANENT and cannot be undone!

**To proceed with deletion, please confirm by clicking the "Confirm Delete" button below.**`;

        return { singleCustomerMessage: message };
      } else {
        let message = `⚠️ **MULTIPLE CUSTOMERS FOUND - PLEASE SELECT ONE TO DELETE**

Found ${customers.length} customers matching '${customers[0].name}':

`;

        for (let i = 0; i < customers.length; i++) {
          const customer = customers[i];
          const sales = await Sale.find({
            store: storeId,
            customer: customer._id
          });

          const totalPurchases = sales.length;
          const totalAmount = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

          message += `**${i + 1}. Customer Details:**
• **ID**: ${customer._id}
• **Name**: ${customer.name}
• **Phone**: ${customer.phone}
• **Email**: ${customer.email || 'Not provided'}
• **Registration**: ${customer.createdAt.toDateString()}
• **Purchases**: ${totalPurchases} (₹${totalAmount.toFixed(2)})

`;
        }

        message += `🚨 **WARNING**: Deletion is PERMANENT and cannot be undone!

**Please select the specific customer you want to delete using the buttons below.**`;

        return { multipleCustomersMessage: message };
      }
    } catch (error) {
      console.error('Error generating customer deletion details:', error);
      return {
        singleCustomerMessage: `Error loading customer details: ${error.message}`,
        multipleCustomersMessage: `Error loading customer details: ${error.message}`
      };
    }
  }

  /**
   * Execute customer deletion after confirmation
   */
  async executeCustomerDeletion(confirmData, storeId) {
    try {
      // Find the customer to delete
      const customer = await Customer.findOne({
        _id: confirmData.customerId,
        store: storeId
      });

      if (!customer) {
        return {
          success: false,
          error: 'Customer not found or you do not have permission to delete this customer'
        };
      }

      // Get customer's purchase history for the confirmation message
      const Sale = require('../models/Sale');
      const sales = await Sale.find({
        store: storeId,
        customer: customer._id
      });

      const totalPurchases = sales.length;
      const totalAmount = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

      // Store customer details before deletion
      const deletedCustomerInfo = {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalPurchases,
        totalAmount
      };

      // Delete the customer
      await Customer.findByIdAndDelete(customer._id);

      const successMessage = `✅ **CUSTOMER SUCCESSFULLY DELETED**

📋 **Deleted Customer Details:**
• **Name**: ${deletedCustomerInfo.name}
• **Phone**: ${deletedCustomerInfo.phone}
• **Email**: ${deletedCustomerInfo.email || 'Not provided'}
• **Total Purchases**: ${deletedCustomerInfo.totalPurchases} transactions
• **Total Amount**: ₹${deletedCustomerInfo.totalAmount.toFixed(2)}

🗑️ The customer has been permanently removed from your database.

**Note**: All associated purchase history remains intact for record-keeping purposes.`;

      return {
        success: true,
        message: successMessage,
        deletedCustomer: deletedCustomerInfo
      };
    } catch (error) {
      console.error('Error executing customer deletion:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate post-deletion follow-up actions
   */
  generatePostDeletionActions() {
    return [
      {
        label: "View Customer List",
        action: "view_customers",
        params: {}
      },
      {
        label: "Add New Customer",
        action: "add_customer",
        params: {}
      },
      {
        label: "Search Customers",
        action: "search_customers",
        params: {}
      },
      {
        label: "Customer Analytics",
        action: "customer_analytics",
        params: {}
      }
    ];
  }

  /**
   * Create a new medicine
   */
  async createMedicine(medicineData, storeId, userId) {
    try {
      const medicine = await Medicine.create({
        store: storeId,
        name: medicineData.name,
        category: medicineData.category,
        manufacturer: medicineData.manufacturer,
        inventory: {
          strips: 0,
          units: 0,
          unitsPerStrip: 10
        },
        pricing: {
          stripPrice: 0,
          unitPrice: 0
        },
        createdBy: userId
      });

      return { success: true, medicine };
    } catch (error) {
      console.error('Error creating medicine:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Infer intent from plain text response
   */
  inferIntent(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('inventory') || lowerText.includes('stock') || lowerText.includes('medicine')) {
      return 'inventory';
    } else if (lowerText.includes('sales') || lowerText.includes('transaction') || lowerText.includes('revenue')) {
      return 'sales';
    } else if (lowerText.includes('customer') || lowerText.includes('patient')) {
      return 'customers';
    } else if (lowerText.includes('supplier') || lowerText.includes('purchase') || lowerText.includes('order')) {
      return 'suppliers';
    } else if (lowerText.includes('report') || lowerText.includes('analytics') || lowerText.includes('analysis')) {
      return 'analytics';
    }
    
    return 'general';
  }

  /**
   * Generate suggestions based on response content
   */
  generateSuggestions(text) {
    const suggestions = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('inventory') || lowerText.includes('stock')) {
      suggestions.push('Check low stock medicines', 'View inventory report', 'Add new medicine');
    }
    
    if (lowerText.includes('sales')) {
      suggestions.push('View today\'s sales', 'Create new sale', 'Sales analytics');
    }
    
    if (lowerText.includes('customer')) {
      suggestions.push('View customers', 'Add new customer', 'Customer analytics');
    }
    
    // Default suggestions if none specific
    if (suggestions.length === 0) {
      suggestions.push('Show dashboard', 'View sales', 'Check inventory');
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Get conversation history for a conversation ID
   */
  getConversationHistory(conversationId) {
    if (!conversationId) return [];
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Update conversation history
   */
  updateConversationHistory(conversationId, message, response) {
    if (!conversationId) return;
    
    const history = this.getConversationHistory(conversationId);
    history.push({
      message,
      response: response.message,
      timestamp: new Date(),
      intent: response.intent
    });
    
    // Keep only last 10 interactions to manage memory
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
    
    this.conversationHistory.set(conversationId, history);
  }

  /**
   * Generate a unique conversation ID
   */
  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear conversation history for a specific conversation
   */
  clearConversation(conversationId) {
    if (conversationId) {
      this.conversationHistory.delete(conversationId);
    }
  }

  /**
   * Get all active conversations for cleanup
   */
  getActiveConversations() {
    return Array.from(this.conversationHistory.keys());
  }

  /**
   * Cleanup old conversations (older than 24 hours)
   */
  cleanupOldConversations() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    for (const [conversationId, history] of this.conversationHistory.entries()) {
      if (history.length > 0) {
        const lastInteraction = history[history.length - 1];
        if (lastInteraction.timestamp.getTime() < cutoffTime) {
          this.conversationHistory.delete(conversationId);
        }
      }
    }
  }

  /**
   * Generate enhanced fallback response with real data when Gemini is unavailable
   */
  async generateEnhancedFallbackResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    const { store, conversationId } = context;

    try {
      // Fetch relevant data for enhanced responses
      const relevantData = await this.fetchRelevantData(message, store._id);

      // Enhanced inventory responses with real data
      if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
        let response = "Here's your current inventory status:\n\n";

        if (relevantData.lowStock && relevantData.lowStock.length > 0) {
          response += `⚠️ **Low Stock Alert**: ${relevantData.lowStock.length} medicines are running low:\n`;
          relevantData.lowStock.slice(0, 3).forEach(med => {
            response += `• ${med.name} - Only ${med.currentStock} ${med.unit} left\n`;
          });
          if (relevantData.lowStock.length > 3) {
            response += `• And ${relevantData.lowStock.length - 3} more...\n`;
          }
        } else {
          response += "✅ **Stock Status**: Your inventory levels look good!\n";
        }

        return {
          success: true,
          response: response + "\nI can help you manage your inventory more effectively once our AI service is fully restored.",
          suggestions: ['View all low stock', 'Check expiry alerts', 'Add new medicine', 'Update stock levels'],
          intent: 'inventory',
          confidence: 0.95,
          conversationId: conversationId || this.generateConversationId()
        };
      }

      // Enhanced sales responses with real data
      if (lowerMessage.includes('sales') || lowerMessage.includes('revenue') || lowerMessage.includes('today')) {
        let response = "Here's your sales overview:\n\n";

        if (relevantData.todaysSales) {
          response += `📈 **Today's Performance**:\n`;
          response += `• Revenue: ₹${relevantData.todaysSales.totalRevenue || 0}\n`;
          response += `• Transactions: ${relevantData.todaysSales.totalTransactions || 0}\n`;
          response += `• Items Sold: ${relevantData.todaysSales.totalItemsSold || 0}\n`;
        }

        if (relevantData.monthlySales) {
          response += `\n📊 **This Month**:\n`;
          response += `• Revenue: ₹${relevantData.monthlySales.totalRevenue || 0}\n`;
          response += `• Transactions: ${relevantData.monthlySales.totalTransactions || 0}\n`;
        }

        return {
          success: true,
          response: response + "\nI can provide more detailed analytics once our AI service is fully restored.",
          suggestions: ['View detailed sales report', 'Compare with last month', 'Top selling medicines', 'Customer analytics'],
          intent: 'sales',
          confidence: 0.95,
          conversationId: conversationId || this.generateConversationId()
        };
      }

      // Enhanced expiry responses with real data
      if (lowerMessage.includes('expir')) {
        let response = "Here's your medicine expiry status:\n\n";

        if (relevantData.expiringMedicines && relevantData.expiringMedicines.length > 0) {
          response += `⚠️ **Expiry Alert**: ${relevantData.expiringMedicines.length} medicines expiring soon:\n`;
          relevantData.expiringMedicines.slice(0, 3).forEach(med => {
            const daysLeft = Math.ceil((new Date(med.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            response += `• ${med.name} - Expires in ${daysLeft} days\n`;
          });
          if (relevantData.expiringMedicines.length > 3) {
            response += `• And ${relevantData.expiringMedicines.length - 3} more...\n`;
          }
        } else {
          response += "✅ **Expiry Status**: No medicines expiring soon. Your inventory is well-managed!\n";
        }

        return {
          success: true,
          response: response + "\nI can help you manage expiring medicines more effectively once our AI service is fully restored.",
          suggestions: ['View all expiring medicines', 'Set expiry alerts', 'Create return order', 'Update inventory'],
          intent: 'expiry_alerts',
          confidence: 0.95,
          conversationId: conversationId || this.generateConversationId()
        };
      }

    } catch (dataError) {
      console.error('Error fetching data for enhanced fallback:', dataError);
    }

    // Fall back to basic pattern-based response
    return this.generateFallbackResponse(message, context);
  }

  /**
   * Generate intelligent fallback response when Gemini is unavailable
   */
  generateFallbackResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    const { conversationId } = context;

    // Pattern-based responses for common queries
    if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) {
      return {
        success: true,
        response: "I can help you with sales analysis! To view your sales data, you can:\n\n• Check today's sales performance\n• View monthly sales reports\n• Analyze customer purchase patterns\n• Compare sales across different periods\n\nWould you like me to guide you to the sales analytics section?",
        suggestions: ['View today\'s sales', 'Monthly sales report', 'Customer analytics', 'Sales comparison'],
        intent: 'sales',
        confidence: 0.9,
        conversationId: conversationId || this.generateConversationId()
      };
    }

    if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
      return {
        success: true,
        response: "I can help you manage your pharmacy inventory! Here's what I can assist with:\n\n• Check current stock levels\n• Identify low stock medicines\n• Monitor expiring medicines\n• Manage medicine locations\n• Track inventory movements\n\nWhat specific inventory task would you like help with?",
        suggestions: ['Check low stock', 'View inventory', 'Expiry alerts', 'Medicine locations'],
        intent: 'inventory',
        confidence: 0.9,
        conversationId: conversationId || this.generateConversationId()
      };
    }

    if (lowerMessage.includes('customer') || lowerMessage.includes('patient')) {
      return {
        success: true,
        response: "I can help you with customer management! Here are the customer-related tasks I can assist with:\n\n• Find customer information\n• View purchase history\n• Add new customers\n• Manage customer profiles\n• Track customer loyalty\n\nWhat would you like to do with customer data?",
        suggestions: ['Find customer', 'Add new customer', 'Purchase history', 'Customer list'],
        intent: 'customers',
        confidence: 0.9,
        conversationId: conversationId || this.generateConversationId()
      };
    }

    if (lowerMessage.includes('supplier') || lowerMessage.includes('purchase') || lowerMessage.includes('order')) {
      return {
        success: true,
        response: "I can help you with supplier and purchase management! Here's what I can do:\n\n• Manage supplier information\n• Create purchase orders\n• Track deliveries\n• Monitor supplier payments\n• Analyze purchase patterns\n\nWhat supplier-related task can I help you with?",
        suggestions: ['View suppliers', 'Create purchase order', 'Track deliveries', 'Supplier payments'],
        intent: 'suppliers',
        confidence: 0.9,
        conversationId: conversationId || this.generateConversationId()
      };
    }

    // Default fallback response
    return {
      success: true,
      response: "I'm your AI assistant for ShelfCure pharmacy management! I'm currently operating in simplified mode but can still help you with:\n\n• 📊 **Sales & Analytics** - View sales reports and performance metrics\n• 📦 **Inventory Management** - Check stock levels and manage medicines\n• 👥 **Customer Management** - Find customers and view purchase history\n• 🏪 **Supplier Management** - Manage suppliers and purchase orders\n• 📈 **Reports & Analytics** - Generate various business reports\n\nWhat would you like help with today?",
      suggestions: ['View sales', 'Check inventory', 'Find customer', 'Manage suppliers', 'Generate report'],
      intent: 'general',
      confidence: 0.8,
      conversationId: conversationId || this.generateConversationId()
    };
  }

  /**
   * Analyze uploaded document using Gemini AI
   * @param {string} filePath - Path to the uploaded file
   * @param {string} mimeType - MIME type of the file
   * @param {Object} context - Store and user context
   * @returns {Object} Analysis result with summary and suggestions
   */
  async analyzeDocument(filePath, mimeType, context) {
    try {
      console.log('📄 Analyzing document:', filePath, 'Type:', mimeType);

      // Read the file
      const fileData = await fs.readFile(filePath);
      const base64Data = fileData.toString('base64');

      // Prepare the document for Gemini
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      // Create analysis prompt
      const prompt = this.buildDocumentAnalysisPrompt(context);

      // Generate analysis using Gemini Vision with retry logic
      const result = await this.retryGeminiRequest(async () => {
        return await this.model.generateContent([prompt, imagePart]);
      });

      const response = result.response;
      const analysisText = response.text();

      console.log('✅ Document analysis completed');
      console.log('📊 Analysis preview:', analysisText.substring(0, 200) + '...');

      // Parse the analysis response
      const analysis = this.parseDocumentAnalysis(analysisText);

      return analysis;

    } catch (error) {
      console.error('❌ Document analysis failed:', error);

      // Fallback analysis
      return {
        summary: "I've received your document but couldn't analyze it fully. Please tell me what you'd like me to do with it.",
        documentType: 'unknown',
        extractedData: {},
        suggestions: [
          "What information should I extract?",
          "Create a purchase order",
          "Add medicines to inventory",
          "Generate a report"
        ],
        confidence: 0.3,
        error: error.message
      };
    }
  }

  /**
   * Build document analysis prompt
   * @param {Object} context - Store and user context
   * @returns {string} Analysis prompt
   */
  buildDocumentAnalysisPrompt(context) {
    const { store, user } = context;

    return `You are an AI assistant for ${store.name}, a medicine store management system.

Analyze this uploaded document and provide a comprehensive analysis. The document could be:
- Medicine purchase bill/invoice
- Prescription from doctor
- Inventory report
- Sales receipt
- Supplier catalog
- Medical certificate
- Any other pharmacy-related document

Please analyze the document and respond in this JSON format:
{
  "summary": "Brief description of what this document contains",
  "documentType": "purchase_bill|prescription|inventory|sales_receipt|catalog|certificate|other",
  "extractedData": {
    "supplier": "supplier name if found",
    "medicines": ["list of medicine names found"],
    "quantities": ["quantities if found"],
    "prices": ["prices if found"],
    "totals": "total amounts if found",
    "dates": "dates found in document",
    "patientInfo": "patient information if prescription",
    "doctorInfo": "doctor information if prescription",
    "other": "any other relevant data"
  },
  "suggestions": [
    "List of 3-4 specific actions user can take with this document",
    "Based on the document type and content"
  ],
  "confidence": 0.9
}

Store Context:
- Store Name: ${store.name}
- Store Manager: ${user.name}
- Current Date: ${new Date().toLocaleDateString()}

Analyze the document thoroughly and provide actionable insights for pharmacy management.`;
  }

  /**
   * Parse document analysis response
   * @param {string} analysisText - Raw analysis text from Gemini
   * @returns {Object} Parsed analysis object
   */
  parseDocumentAnalysis(analysisText) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);

        // Validate and enhance the analysis
        return {
          summary: analysis.summary || "Document analyzed successfully",
          documentType: analysis.documentType || 'unknown',
          extractedData: analysis.extractedData || {},
          suggestions: analysis.suggestions || [
            "Extract information from document",
            "Create purchase order",
            "Add to inventory",
            "Generate report"
          ],
          confidence: analysis.confidence || 0.7
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not parse JSON analysis, using text analysis');
    }

    // Fallback: analyze text content
    const documentType = this.detectDocumentType(analysisText);
    const suggestions = this.generateDocumentSuggestions(documentType, analysisText);

    return {
      summary: analysisText.substring(0, 200) + (analysisText.length > 200 ? '...' : ''),
      documentType: documentType,
      extractedData: this.extractBasicData(analysisText),
      suggestions: suggestions,
      confidence: 0.6
    };
  }

  /**
   * Detect document type from analysis text
   * @param {string} text - Analysis text
   * @returns {string} Document type
   */
  detectDocumentType(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('invoice') || lowerText.includes('bill') || lowerText.includes('purchase')) {
      return 'purchase_bill';
    } else if (lowerText.includes('prescription') || lowerText.includes('doctor') || lowerText.includes('patient')) {
      return 'prescription';
    } else if (lowerText.includes('inventory') || lowerText.includes('stock')) {
      return 'inventory';
    } else if (lowerText.includes('sales') || lowerText.includes('receipt')) {
      return 'sales_receipt';
    } else if (lowerText.includes('catalog') || lowerText.includes('price list')) {
      return 'catalog';
    }

    return 'other';
  }

  /**
   * Generate suggestions based on document type
   * @param {string} documentType - Type of document
   * @param {string} analysisText - Analysis text
   * @returns {Array} List of suggestions
   */
  generateDocumentSuggestions(documentType, analysisText) {
    switch (documentType) {
      case 'purchase_bill':
        return [
          "Extract all medicine names and prices",
          "Create purchase order from this bill",
          "Add medicines to inventory",
          "Update supplier information"
        ];
      case 'prescription':
        return [
          "Extract prescribed medicines",
          "Check medicine availability",
          "Create sales order",
          "Generate medicine list for patient"
        ];
      case 'inventory':
        return [
          "Update current stock levels",
          "Identify low stock medicines",
          "Generate reorder report",
          "Compare with system inventory"
        ];
      case 'sales_receipt':
        return [
          "Record this sale in system",
          "Update customer purchase history",
          "Check medicine stock levels",
          "Generate sales report"
        ];
      default:
        return [
          "Extract key information",
          "Tell me what to do with this document",
          "Create relevant records",
          "Generate summary report"
        ];
    }
  }

  /**
   * Extract basic data from analysis text
   * @param {string} text - Analysis text
   * @returns {Object} Extracted data
   */
  extractBasicData(text) {
    const data = {};

    // Extract medicine names (basic pattern matching)
    const medicineMatches = text.match(/(?:medicine|drug|tablet|capsule|syrup)[\s:]*([a-zA-Z0-9\s]+)/gi);
    if (medicineMatches) {
      data.medicines = medicineMatches.map(match => match.replace(/(?:medicine|drug|tablet|capsule|syrup)[\s:]*/i, '').trim());
    }

    // Extract amounts/prices
    const priceMatches = text.match(/(?:₹|rs\.?|rupees?)\s*(\d+(?:\.\d{2})?)/gi);
    if (priceMatches) {
      data.prices = priceMatches;
    }

    // Extract dates
    const dateMatches = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g);
    if (dateMatches) {
      data.dates = dateMatches;
    }

    return data;
  }

  /**
   * Retry Gemini API requests with exponential backoff
   * @param {Function} requestFn - The request function to retry
   * @param {number} maxRetries - Maximum number of retries (default: 3)
   * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
   * @returns {Promise} The result of the successful request
   */
  async retryGeminiRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Gemini API attempt ${attempt + 1}/${maxRetries + 1}`);
        const result = await requestFn();

        if (attempt > 0) {
          console.log(`✅ Gemini API succeeded on attempt ${attempt + 1}`);
        }

        return result;

      } catch (error) {
        lastError = error;

        // Check if it's a retryable error (503 Service Unavailable, 429 Too Many Requests)
        const isRetryable = error.status === 503 || error.status === 429 ||
                           error.message?.includes('overloaded') ||
                           error.message?.includes('rate limit');

        if (!isRetryable || attempt === maxRetries) {
          console.log(`❌ Gemini API failed permanently on attempt ${attempt + 1}`);
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`⏳ Gemini API overloaded, retrying in ${Math.round(delay)}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

module.exports = new GeminiAIService();
