# Conversational Document AI System

## Overview

The new ShelfCure AI system works exactly like ChatGPT or Gemini - users can upload documents (images/PDFs) directly in the chat and give natural language instructions about what to do with them.

## ✅ What's New

### 🎯 ChatGPT-Like Interface
- **Drag & Drop**: Drop images/PDFs directly into chat
- **Upload Button**: Click paperclip icon to select files
- **Document Preview**: See uploaded documents in chat
- **Natural Language**: Ask anything about your documents

### 🤖 AI Document Analysis
- **Automatic Analysis**: AI analyzes documents immediately upon upload
- **Smart Recognition**: Detects purchase bills, prescriptions, inventory reports, etc.
- **Data Extraction**: Extracts medicines, suppliers, prices, totals automatically
- **Conversational Responses**: AI explains what it found and suggests actions

### 💬 Natural Language Instructions
Users can say things like:
- "What medicines are in this document?"
- "Extract all information from this bill"
- "Create a purchase order from this invoice"
- "Add these medicines to inventory"
- "Who is the supplier?"
- "What's the total amount?"
- "Generate a report from this document"

## 🚀 How It Works

### 1. Upload Document
```
User: [Uploads purchase bill image]
AI: "I've analyzed your document 'purchase-bill.jpg'. This is a purchase bill from Medico Pharma containing 5 medicines with a total amount of ₹970.20. What would you like me to do with this document?"
```

### 2. Natural Language Query
```
User: "What medicines are in this bill?"
AI: "I found 5 medicines in your purchase bill:
• Paracetamol 500mg - Qty: 10, Price: ₹8.50
• Amoxicillin 250mg - Qty: 20, Price: ₹12.00
• Crocin Advance - Qty: 15, Price: ₹9.75
• Azithromycin 500mg - Qty: 5, Price: ₹45.00
• Dolo 650mg - Qty: 25, Price: ₹6.80

Total: ₹970.20 from Medico Pharma Distributors"
```

### 3. Action-Based Instructions
```
User: "Create a purchase order from this bill"
AI: "I found your purchase bill from Medico Pharma Distributors with 5 medicines totaling ₹970.20. 

Would you like me to:
• Extract the medicine details for review
• Help you navigate to the purchase order creation page
• Show you the supplier information
• Something else?"
```

## 📋 Supported Document Types

### 🧾 Purchase Bills/Invoices
- **Auto-detects**: Supplier info, medicine names, quantities, prices
- **Actions**: Create purchase orders, update supplier info, add to inventory
- **Example**: "Create PO from this invoice"

### 💊 Prescriptions
- **Auto-detects**: Patient info, doctor details, prescribed medicines
- **Actions**: Check availability, create sales orders, generate medicine lists
- **Example**: "What medicines are prescribed here?"

### 📊 Inventory Reports
- **Auto-detects**: Stock levels, medicine lists, expiry dates
- **Actions**: Update inventory, identify low stock, generate reorder reports
- **Example**: "Update my inventory from this report"

### 🧾 Sales Receipts
- **Auto-detects**: Customer info, purchased medicines, amounts
- **Actions**: Record sales, update customer history, check stock
- **Example**: "Add this sale to the system"

## 🎯 Key Features

### ✅ Conversational Interface
- Natural language understanding
- Context-aware responses
- Follow-up questions supported
- Multi-document handling

### ✅ Smart Document Analysis
- Automatic document type detection
- Medicine name extraction
- Price and quantity recognition
- Supplier information extraction

### ✅ Action-Based Responses
- Extract specific information
- Create purchase orders
- Add medicines to inventory
- Generate comprehensive reports
- Update supplier/customer data

### ✅ File Support
- **Images**: JPG, PNG (up to 10MB)
- **Documents**: PDF files
- **Quality**: Handles various image qualities
- **Languages**: English and Hindi text

## 🔧 Technical Implementation

### Frontend Changes
- **Document Upload UI**: Drag & drop area with file preview
- **Chat Integration**: Documents appear in conversation
- **Real-time Preview**: Image thumbnails in chat
- **Upload Progress**: Loading indicators

### Backend Enhancements
- **Multer Integration**: File upload handling
- **Gemini Vision API**: Document analysis
- **Natural Language Processing**: Intent recognition
- **Action Handlers**: Document-based operations

### AI Service Upgrades
- **Document Analysis**: `analyzeDocument()` method
- **Context Awareness**: Documents included in conversation context
- **Action Routing**: `handleDocumentActions()` for document operations
- **Response Generation**: Conversational, helpful responses

## 📊 Usage Examples

### Example 1: Medicine Bill Analysis
```
User: [Uploads medicine bill]
AI: "I've analyzed your purchase bill. Found 8 medicines from ABC Pharma totaling ₹1,245.50"

User: "Show me all the medicine names"
AI: "Here are the medicines from your bill:
1. Paracetamol 500mg Tab - ₹85.00
2. Amoxicillin 250mg Cap - ₹240.00
3. Crocin Advance Tab - ₹146.25
..."

User: "Create a purchase order"
AI: "I'll help you create a purchase order from this bill. The supplier is ABC Pharma with 8 medicines. Would you like me to extract all details for review first?"
```

### Example 2: Prescription Processing
```
User: [Uploads prescription]
AI: "I've analyzed this prescription from Dr. Smith for patient John Doe. Found 4 prescribed medicines."

User: "Check if we have these medicines in stock"
AI: "I found the prescribed medicines. Let me check your inventory:
• Medicine A: In stock (25 strips available)
• Medicine B: Low stock (3 strips remaining)
• Medicine C: Out of stock
• Medicine D: In stock (15 strips available)"
```

## 🎉 Benefits

### For Store Managers
- **Faster Processing**: No more manual data entry
- **Natural Interface**: Just talk to the AI like ChatGPT
- **Accurate Data**: AI extracts information precisely
- **Time Saving**: Instant document analysis and actions

### For Business Operations
- **Reduced Errors**: Automated data extraction
- **Better Workflow**: Conversational interface is intuitive
- **Comprehensive Analysis**: AI understands document context
- **Flexible Actions**: Multiple ways to process same document

## 🚀 Getting Started

1. **Open AI Assistant**: Go to Store Manager → AI Assistant
2. **Upload Document**: Drag & drop or click paperclip icon
3. **Wait for Analysis**: AI will analyze and respond automatically
4. **Give Instructions**: Ask anything about the document in natural language
5. **Take Actions**: Follow AI suggestions or give custom instructions

The system is now live and ready to use! It completely replaces the old rigid OCR system with a flexible, conversational interface that works just like ChatGPT or Gemini.
