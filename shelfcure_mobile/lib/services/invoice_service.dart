import '../models/sales_invoice.dart';
import '../models/sale.dart';

class InvoiceService {
  /// Generate HTML invoice from SalesInvoice
  static String generateInvoiceHTML(SalesInvoice invoice) {
    final storeDetails = invoice.template?.storeDetails;
    final footer = invoice.template?.footer;

    final itemsHtml = invoice.items.map((item) {
      return '''
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
            ${item.medicineName}${item.genericName != null ? '<br><small style="color: #6b7280;">${item.genericName}</small>' : ''}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            ${item.quantity} ${item.unitType}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ₹${item.unitPrice.toStringAsFixed(2)}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ₹${item.totalPrice.toStringAsFixed(2)}
          </td>
        </tr>
      ''';
    }).join('');

    return '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f9fafb;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 30px;
      border-bottom: 2px solid #2e7d32;
      padding-bottom: 20px;
    }
    .store-info h1 {
      margin: 0;
      color: #2e7d32;
      font-size: 24px;
    }
    .store-info p {
      margin: 5px 0;
      color: #6b7280;
      font-size: 12px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta p {
      margin: 5px 0;
      color: #6b7280;
      font-size: 12px;
    }
    .invoice-number {
      font-size: 18px;
      font-weight: bold;
      color: #111827;
    }
    .customer-section {
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .customer-section h3 {
      margin: 0 0 10px 0;
      color: #111827;
      font-size: 14px;
      font-weight: bold;
    }
    .customer-section p {
      margin: 5px 0;
      color: #6b7280;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: bold;
      color: #111827;
      border-bottom: 2px solid #e5e7eb;
      font-size: 12px;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-table {
      width: 300px;
    }
    .totals-table tr td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
    }
    .totals-table tr td:first-child {
      color: #6b7280;
    }
    .totals-table tr td:last-child {
      text-align: right;
      font-weight: bold;
      color: #111827;
    }
    .total-row td {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #2e7d32;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .print-button {
      text-align: center;
      margin-top: 20px;
    }
    @media print {
      body {
        background-color: white;
        padding: 0;
      }
      .invoice-container {
        box-shadow: none;
        padding: 0;
      }
      .print-button {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="store-info">
        <h1>${storeDetails?.name ?? 'Store'}</h1>
        ${storeDetails?.address != null ? '<p>${storeDetails!.address}</p>' : ''}
        ${storeDetails?.phone != null ? '<p>Phone: ${storeDetails!.phone}</p>' : ''}
        ${storeDetails?.email != null ? '<p>Email: ${storeDetails!.email}</p>' : ''}
        ${storeDetails?.gstNumber != null ? '<p>GST: ${storeDetails!.gstNumber}</p>' : ''}
      </div>
      <div class="invoice-meta">
        <p class="invoice-number">Invoice #${invoice.invoiceNumber}</p>
        <p>Date: ${invoice.invoiceDate.toLocal().toString().split(' ')[0]}</p>
        <p>Status: ${invoice.status.toUpperCase()}</p>
      </div>
    </div>

    <div class="customer-section">
      <div>
        <h3>Bill To:</h3>
        <p>${invoice.customerDetails?.name ?? 'Walk-in Customer'}</p>
        ${invoice.customerDetails?.phone != null ? '<p>Phone: ${invoice.customerDetails!.phone}</p>' : ''}
        ${invoice.customerDetails?.email != null ? '<p>Email: ${invoice.customerDetails!.email}</p>' : ''}
        ${invoice.customerDetails?.address != null ? '<p>${invoice.customerDetails!.address}</p>' : ''}
      </div>
      <div>
        <h3>Payment Details:</h3>
        <p>Method: ${invoice.paymentMethod}</p>
        <p>Status: ${invoice.paymentStatus}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Medicine</th>
          <th style="text-align: center;">Quantity</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        $itemsHtml
      </tbody>
    </table>

    <div class="totals">
      <table class="totals-table">
        <tr>
          <td>Subtotal:</td>
          <td>₹${invoice.subtotal.toStringAsFixed(2)}</td>
        </tr>
        ${invoice.discountAmount > 0 ? '''
        <tr>
          <td>Discount:</td>
          <td>-₹${invoice.discountAmount.toStringAsFixed(2)}</td>
        </tr>
        ''' : ''}
        ${invoice.taxAmount > 0 ? '''
        <tr>
          <td>Tax (GST):</td>
          <td>₹${invoice.taxAmount.toStringAsFixed(2)}</td>
        </tr>
        ''' : ''}
        <tr class="total-row">
          <td>Total:</td>
          <td>₹${invoice.totalAmount.toStringAsFixed(2)}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p>${footer?.thankYouMessage ?? 'Thank you for your business!'}</p>
      <p>${footer?.terms ?? 'Get well soon!'}</p>
      <p style="margin-top: 20px; font-size: 10px; color: #9ca3af;">
        This is a computer-generated invoice. No signature required.
      </p>
    </div>
  </div>

  <div class="print-button">
    <button onclick="window.print()" style="padding: 10px 20px; background-color: #2e7d32; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
      Print Invoice
    </button>
  </div>
</body>
</html>
    ''';
  }

  /// Generate invoice from sale data
  static SalesInvoice generateInvoiceFromSale({
    required Sale sale,
    required String storeId,
    required String storeName,
    required String? storeAddress,
    required String? storePhone,
    required String? storeEmail,
    required String? gstNumber,
    required String? licenseNumber,
    required String createdBy,
  }) {
    final invoiceNumber = 'INV-${DateTime.now().millisecondsSinceEpoch}';
    final now = DateTime.now();

    return SalesInvoice(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      invoiceNumber: invoiceNumber,
      invoiceDate: now,
      saleId: sale.id,
      storeId: storeId,
      customerId: null,
      customerDetails: sale.customerName != null
          ? CustomerDetails(
              name: sale.customerName!,
              phone: null,
              email: null,
              address: null,
            )
          : null,
      items: sale.items
          .map((item) => InvoiceItem(
                medicineName: item.medicineName,
                quantity: item.quantity,
                unitType: 'strip',
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              ))
          .toList(),
      subtotal: sale.subtotal,
      discountAmount: sale.discountAmount,
      discountType: sale.selectedDiscount != null
          ? DiscountInfo(
              name: sale.selectedDiscount!['name'] ?? 'Discount',
              type: sale.selectedDiscount!['type'] ?? 'percentage',
              value: (sale.selectedDiscount!['value'] ?? 0).toDouble(),
            )
          : null,
      taxAmount: sale.totalTaxAmount,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      paymentStatus: 'paid',
      template: InvoiceTemplate(
        storeDetails: StoreDetails(
          name: storeName,
          address: storeAddress,
          phone: storePhone,
          email: storeEmail,
          gstNumber: gstNumber,
          licenseNumber: licenseNumber,
        ),
        footer: InvoiceFooter(
          terms: 'Thank you for your business!',
          thankYouMessage: 'Get well soon!',
        ),
      ),
      status: 'active',
      printHistory: [],
      createdBy: createdBy,
      createdAt: now,
    );
  }

  /// Record invoice print
  static void recordPrint(SalesInvoice invoice, String userId, String printType) {
    invoice.printHistory.add(
      PrintRecord(
        printedAt: DateTime.now(),
        printedBy: userId,
        printType: printType,
      ),
    );
  }
}

