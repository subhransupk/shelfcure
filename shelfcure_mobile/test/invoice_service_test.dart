import 'package:flutter_test/flutter_test.dart';
import '../lib/models/sale.dart';
import '../lib/models/sales_invoice.dart';
import '../lib/services/invoice_service.dart';

void main() {
  group('InvoiceService', () {
    late Sale testSale;

    setUp(() {
      testSale = Sale(
        id: 'sale-001',
        invoiceNumber: 'INV-001',
        date: DateTime(2024, 1, 15),
        subtotal: 1000.0,
        discountAmount: 100.0,
        taxableAmount: 900.0,
        totalTaxAmount: 162.0,
        taxBreakdown: [
          {'name': 'GST', 'rate': 18, 'amount': 162.0}
        ],
        totalAmount: 1062.0,
        paymentMethod: 'cash',
        status: 'completed',
        items: [
          SaleItem(
            medicineId: 'med-001',
            medicineName: 'Aspirin',
            quantity: 10,
            unitPrice: 50.0,
            totalPrice: 500.0,
          ),
          SaleItem(
            medicineId: 'med-002',
            medicineName: 'Paracetamol',
            quantity: 10,
            unitPrice: 50.0,
            totalPrice: 500.0,
          ),
        ],
        customerName: 'John Doe',
        customerPhone: '9876543210',
        notes: 'Test sale',
        applyDiscount: true,
        applyTax: true,
      );
    });

    test('Generate invoice from sale', () {
      final invoice = InvoiceService.generateInvoiceFromSale(
        sale: testSale,
        storeId: 'store-001',
        storeName: 'MediCare Pharmacy',
        storeAddress: '123 Main St',
        storePhone: '9876543210',
        storeEmail: 'info@medicare.com',
        gstNumber: 'GST123456',
        licenseNumber: 'LIC123456',
        createdBy: 'user-001',
      );

      expect(invoice, isNotNull);
      expect(invoice.saleId, 'sale-001');
      expect(invoice.storeId, 'store-001');
      expect(invoice.subtotal, 1000.0);
      expect(invoice.discountAmount, 100.0);
      expect(invoice.taxAmount, 162.0);
      expect(invoice.totalAmount, 1062.0);
      expect(invoice.items.length, 2);
      expect(invoice.status, 'active');
    });

    test('Invoice contains customer details', () {
      final invoice = InvoiceService.generateInvoiceFromSale(
        sale: testSale,
        storeId: 'store-001',
        storeName: 'MediCare Pharmacy',
        storeAddress: null,
        storePhone: null,
        storeEmail: null,
        gstNumber: null,
        licenseNumber: null,
        createdBy: 'user-001',
      );

      expect(invoice.customerDetails, isNotNull);
      expect(invoice.customerDetails?.name, 'John Doe');
    });

    test('Invoice contains store details', () {
      final invoice = InvoiceService.generateInvoiceFromSale(
        sale: testSale,
        storeId: 'store-001',
        storeName: 'MediCare Pharmacy',
        storeAddress: '123 Main St',
        storePhone: '9876543210',
        storeEmail: 'info@medicare.com',
        gstNumber: 'GST123456',
        licenseNumber: 'LIC123456',
        createdBy: 'user-001',
      );

      expect(invoice.template?.storeDetails, isNotNull);
      expect(invoice.template?.storeDetails?.name, 'MediCare Pharmacy');
      expect(invoice.template?.storeDetails?.address, '123 Main St');
      expect(invoice.template?.storeDetails?.gstNumber, 'GST123456');
    });

    test('Generate invoice HTML', () {
      final invoice = InvoiceService.generateInvoiceFromSale(
        sale: testSale,
        storeId: 'store-001',
        storeName: 'MediCare Pharmacy',
        storeAddress: '123 Main St',
        storePhone: '9876543210',
        storeEmail: 'info@medicare.com',
        gstNumber: 'GST123456',
        licenseNumber: 'LIC123456',
        createdBy: 'user-001',
      );

      final html = InvoiceService.generateInvoiceHTML(invoice);

      expect(html, contains('<!DOCTYPE html>'));
      expect(html, contains('MediCare Pharmacy'));
      expect(html, contains('INV-'));
      expect(html, contains('Aspirin'));
      expect(html, contains('Paracetamol'));
      expect(html, contains('₹1062.00'));
    });

    test('Invoice HTML contains discount information', () {
      final invoice = InvoiceService.generateInvoiceFromSale(
        sale: testSale,
        storeId: 'store-001',
        storeName: 'MediCare Pharmacy',
        storeAddress: null,
        storePhone: null,
        storeEmail: null,
        gstNumber: null,
        licenseNumber: null,
        createdBy: 'user-001',
      );

      final html = InvoiceService.generateInvoiceHTML(invoice);

      expect(html, contains('Discount'));
      expect(html, contains('100'));
    });

    test('Invoice HTML contains tax information', () {
      final invoice = InvoiceService.generateInvoiceFromSale(
        sale: testSale,
        storeId: 'store-001',
        storeName: 'MediCare Pharmacy',
        storeAddress: null,
        storePhone: null,
        storeEmail: null,
        gstNumber: null,
        licenseNumber: null,
        createdBy: 'user-001',
      );

      final html = InvoiceService.generateInvoiceHTML(invoice);

      expect(html, contains('Tax'));
      expect(html, contains('GST'));
      expect(html, contains('162'));
    });

    test('Record invoice print', () {
      final invoice = InvoiceService.generateInvoiceFromSale(
        sale: testSale,
        storeId: 'store-001',
        storeName: 'MediCare Pharmacy',
        storeAddress: null,
        storePhone: null,
        storeEmail: null,
        gstNumber: null,
        licenseNumber: null,
        createdBy: 'user-001',
      );

      expect(invoice.printHistory.length, 0);

      InvoiceService.recordPrint(invoice, 'user-001', 'original');

      expect(invoice.printHistory.length, 1);
      expect(invoice.printHistory[0].printType, 'original');
    });

    test('Invoice JSON serialization', () {
      final invoice = InvoiceService.generateInvoiceFromSale(
        sale: testSale,
        storeId: 'store-001',
        storeName: 'MediCare Pharmacy',
        storeAddress: '123 Main St',
        storePhone: '9876543210',
        storeEmail: 'info@medicare.com',
        gstNumber: 'GST123456',
        licenseNumber: 'LIC123456',
        createdBy: 'user-001',
      );

      final json = invoice.toJson();

      expect(json['invoiceNumber'], isNotNull);
      expect(json['subtotal'], 1000.0);
      expect(json['totalAmount'], 1062.0);
      expect(json['items'], isNotNull);
    });

    test('Invoice JSON deserialization', () {
      final invoice = InvoiceService.generateInvoiceFromSale(
        sale: testSale,
        storeId: 'store-001',
        storeName: 'MediCare Pharmacy',
        storeAddress: '123 Main St',
        storePhone: '9876543210',
        storeEmail: 'info@medicare.com',
        gstNumber: 'GST123456',
        licenseNumber: 'LIC123456',
        createdBy: 'user-001',
      );

      final json = invoice.toJson();
      final deserializedInvoice = SalesInvoice.fromJson(json);

      expect(deserializedInvoice.subtotal, invoice.subtotal);
      expect(deserializedInvoice.totalAmount, invoice.totalAmount);
      expect(deserializedInvoice.items.length, invoice.items.length);
    });
  });
}

