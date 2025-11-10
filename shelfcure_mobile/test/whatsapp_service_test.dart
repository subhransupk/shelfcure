import 'package:flutter_test/flutter_test.dart';
import '../lib/services/whatsapp_service.dart';

void main() {
  group('WhatsAppService', () {
    test('Format phone number - 10 digit number', () {
      final result = WhatsAppService.formatPhoneNumber('9876543210');
      expect(result, '919876543210');
    });

    test('Format phone number - with country code', () {
      final result = WhatsAppService.formatPhoneNumber('919876543210');
      expect(result, '919876543210');
    });

    test('Format phone number - with special characters', () {
      final result = WhatsAppService.formatPhoneNumber('+91-9876-543-210');
      expect(result, '919876543210');
    });

    test('Format phone number - with spaces', () {
      final result = WhatsAppService.formatPhoneNumber('98 76 54 32 10');
      expect(result, '919876543210');
    });

    test('Generate WhatsApp URL', () {
      final url = WhatsAppService.generateWhatsAppUrl(
        '9876543210',
        'Hello World',
      );
      expect(url, contains('https://wa.me/919876543210'));
      expect(url, contains('text='));
    });

    test('Generate invoice message', () {
      final message = WhatsAppService.generateInvoiceMessage(
        invoiceNumber: 'INV-001',
        invoiceDate: DateTime(2024, 1, 15),
        itemCount: 3,
        totalAmount: 1500.00,
        paymentMethod: 'cash',
        customerName: 'John Doe',
        storeName: 'MediCare Pharmacy',
        storeAddress: '123 Main St',
        storePhone: '9876543210',
      );

      expect(message, contains('INV-001'));
      expect(message, contains('3 items'));
      expect(message, contains('₹1500.00'));
      expect(message, contains('John Doe'));
      expect(message, contains('MediCare Pharmacy'));
    });

    test('Generate reorder message', () {
      final items = [
        {'name': 'Aspirin', 'quantity': 10, 'unitType': 'strips'},
        {'name': 'Paracetamol', 'quantity': 5, 'unitType': 'boxes'},
      ];

      final message = WhatsAppService.generateReorderMessage(
        items: items,
        customMessage: 'Urgent',
      );

      expect(message, contains('Aspirin'));
      expect(message, contains('Paracetamol'));
      expect(message, contains('Urgent'));
      expect(message, contains('Reorder Request'));
    });

    test('Generate low stock alert message', () {
      final message = WhatsAppService.generateLowStockMessage(
        medicineName: 'Aspirin',
        currentStock: 5,
        minimumStock: 20,
        storeName: 'MediCare Pharmacy',
      );

      expect(message, contains('Aspirin'));
      expect(message, contains('5 units'));
      expect(message, contains('20 units'));
      expect(message, contains('Low Stock Alert'));
    });

    test('Generate payment reminder message', () {
      final message = WhatsAppService.generatePaymentReminderMessage(
        invoiceNumber: 'INV-001',
        pendingAmount: 500.00,
        storeName: 'MediCare Pharmacy',
      );

      expect(message, contains('INV-001'));
      expect(message, contains('₹500.00'));
      expect(message, contains('Payment Reminder'));
    });

    test('Message encoding for URL', () {
      final message = 'Hello! This is a test message with special chars: @#\$%';
      final url = WhatsAppService.generateWhatsAppUrl('9876543210', message);

      // URL should be properly encoded
      expect(url, contains('wa.me'));
      expect(url, contains('text='));
      // Should not contain unencoded special characters in the URL
      expect(url, isNot(contains(' ')));
    });

    test('Empty phone number handling', () {
      final result = WhatsAppService.formatPhoneNumber('');
      expect(result, '');
    });

    test('Phone number with only special characters', () {
      final result = WhatsAppService.formatPhoneNumber('+-()');
      expect(result, '');
    });
  });
}
