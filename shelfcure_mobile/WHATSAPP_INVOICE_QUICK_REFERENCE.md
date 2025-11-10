# WhatsApp & Invoice Features - Quick Reference

## Quick Start

### 1. View All Invoices
```dart
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => const InvoiceListScreen()),
);
```

### 2. View Single Invoice
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => InvoiceViewScreen(
      saleId: sale.id,
      invoice: invoice,
    ),
  ),
);
```

### 3. Share Invoice via WhatsApp
```dart
final message = WhatsAppService.generateInvoiceMessage(
  invoiceNumber: invoice.invoiceNumber,
  invoiceDate: invoice.invoiceDate,
  itemCount: invoice.items.length,
  totalAmount: invoice.totalAmount,
  paymentMethod: invoice.paymentMethod,
  customerName: invoice.customerDetails?.name,
  storeName: 'Store Name',
  storeAddress: 'Address',
  storePhone: 'Phone',
);

await WhatsAppService.openWhatsApp(
  invoice.customerDetails?.phone ?? '',
  message,
);
```

### 4. Generate Invoice from Sale
```dart
final invoice = InvoiceService.generateInvoiceFromSale(
  sale: sale,
  storeId: storeId,
  storeName: storeName,
  storeAddress: storeAddress,
  storePhone: storePhone,
  storeEmail: storeEmail,
  gstNumber: gstNumber,
  licenseNumber: licenseNumber,
  createdBy: userId,
);
```

### 5. Generate Invoice HTML
```dart
final html = InvoiceService.generateInvoiceHTML(invoice);
// Use in WebView or save to file
```

## Key Classes

### WhatsAppService
- `formatPhoneNumber(String)` → String
- `generateWhatsAppUrl(String, String)` → String
- `openWhatsApp(String, String)` → Future<void>
- `generateInvoiceMessage(...)` → String
- `generateReorderMessage(...)` → String
- `generateLowStockMessage(...)` → String
- `generatePaymentReminderMessage(...)` → String
- `isWhatsAppInstalled()` → Future<bool>

### InvoiceService
- `generateInvoiceFromSale(...)` → SalesInvoice
- `generateInvoiceHTML(SalesInvoice)` → String
- `recordPrint(SalesInvoice, String, String)` → void

### InvoiceProvider
- `fetchInvoices()` → Future<void>
- `fetchInvoiceById(String)` → Future<void>
- `fetchInvoiceBySaleId(String)` → Future<SalesInvoice?>
- `createInvoice(Map)` → Future<SalesInvoice?>
- `recordInvoicePrint(String, String)` → Future<bool>
- `getInvoiceHTML(String)` → Future<String?>
- `searchInvoices(String)` → Future<void>

## Data Models

### SalesInvoice
```dart
SalesInvoice(
  id: String,
  invoiceNumber: String,
  invoiceDate: DateTime,
  saleId: String,
  storeId: String,
  customerId: String?,
  customerDetails: CustomerDetails?,
  items: List<InvoiceItem>,
  subtotal: double,
  discountAmount: double,
  discountType: DiscountInfo?,
  taxAmount: double,
  totalAmount: double,
  paymentMethod: String,
  paymentStatus: String,
  template: InvoiceTemplate?,
  status: String,
  printHistory: List<PrintRecord>,
  createdBy: String,
  createdAt: DateTime,
)
```

### InvoiceItem
```dart
InvoiceItem(
  medicineName: String,
  genericName: String?,
  quantity: int,
  unitType: String, // 'strip' or 'individual'
  unitPrice: double,
  totalPrice: double,
  batch: BatchInfo?,
)
```

## Phone Number Formatting
- 10-digit: `9876543210` → `919876543210`
- With country code: `919876543210` → `919876543210`
- With special chars: `+91-9876-543-210` → `919876543210`
- With spaces: `98 76 54 32 10` → `919876543210`

## Message Templates

### Invoice Message
```
📋 *Invoice Details:*
• Invoice No: INV-001
• Date: 2024-01-15
• Items: 3 items
• Total Amount: ₹1500.00
• Payment: cash

👤 *Customer:* John Doe

🏪 *Store Details:*
MediCare Pharmacy
123 Main St
Phone: 9876543210

Thank you for choosing us! 💊
Get well soon! 🌟
```

### Reorder Message
```
📦 *Reorder Request*

*Items Needed:*
• Aspirin: 10 strips
• Paracetamol: 5 boxes

*Additional Notes:*
Urgent

Please confirm availability and pricing.

Thank you! 💊
Best regards 🌟
```

### Low Stock Alert
```
⚠️ *Low Stock Alert*

Medicine: Aspirin
Current Stock: 5 units
Minimum Required: 20 units

Store: MediCare Pharmacy

Please reorder this medicine urgently.

Thank you! 💊
```

### Payment Reminder
```
💰 *Payment Reminder*

Invoice: INV-001
Pending Amount: ₹500.00

Store: MediCare Pharmacy

Please complete the payment at your earliest convenience.

Thank you! 💊
```

## Testing

### Run All Tests
```bash
flutter test test/whatsapp_service_test.dart test/invoice_service_test.dart
```

### Run Specific Test
```bash
flutter test test/whatsapp_service_test.dart -k "Format phone number"
```

## Common Issues & Solutions

### WhatsApp Not Opening
- Check if WhatsApp is installed: `WhatsAppService.isWhatsAppInstalled()`
- Verify phone number format: `WhatsAppService.formatPhoneNumber(phone)`
- Check URL encoding: `WhatsAppService.generateWhatsAppUrl(phone, message)`

### Invoice Not Displaying
- Verify HTML generation: `InvoiceService.generateInvoiceHTML(invoice)`
- Check WebView initialization
- Ensure invoice data is complete

### Phone Number Issues
- Always use `formatPhoneNumber()` before opening WhatsApp
- Supports 10-digit Indian numbers (auto-adds 91 prefix)
- Removes all non-digit characters

## Integration Checklist
- [ ] Add dependencies to pubspec.yaml
- [ ] Run `flutter pub get`
- [ ] Register InvoiceProvider in main.dart
- [ ] Update Sale model with invoice fields
- [ ] Integrate invoice generation in CreateSaleScreen
- [ ] Add invoice screens to navigation
- [ ] Test WhatsApp integration
- [ ] Test invoice generation and display
- [ ] Configure store details in settings
- [ ] Test with real phone numbers

