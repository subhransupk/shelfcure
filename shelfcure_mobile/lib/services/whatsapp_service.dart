import 'package:url_launcher/url_launcher.dart';

class WhatsAppService {
  /// Format phone number to international format
  /// Adds India country code (91) if it's a 10-digit number
  static String formatPhoneNumber(String phoneNumber) {
    // Remove all non-digit characters
    String formattedPhone = phoneNumber.replaceAll(RegExp(r'[^0-9]'), '');

    // Add India country code if it's a 10-digit number
    if (formattedPhone.length == 10) {
      formattedPhone = '91$formattedPhone';
    }

    return formattedPhone;
  }

  /// Generate WhatsApp click-to-chat URL
  static String generateWhatsAppUrl(String phoneNumber, String message) {
    final formattedPhone = formatPhoneNumber(phoneNumber);
    final encodedMessage = Uri.encodeComponent(message);
    return 'https://wa.me/$formattedPhone?text=$encodedMessage';
  }

  /// Open WhatsApp with pre-filled message
  static Future<void> openWhatsApp(String phoneNumber, String message) async {
    try {
      final whatsappUrl = generateWhatsAppUrl(phoneNumber, message);
      
      if (await canLaunchUrl(Uri.parse(whatsappUrl))) {
        await launchUrl(
          Uri.parse(whatsappUrl),
          mode: LaunchMode.externalApplication,
        );
      } else {
        throw Exception('Could not launch WhatsApp');
      }
    } catch (e) {
      throw Exception('Error opening WhatsApp: $e');
    }
  }

  /// Generate invoice sharing message
  static String generateInvoiceMessage({
    required String invoiceNumber,
    required DateTime invoiceDate,
    required int itemCount,
    required double totalAmount,
    required String paymentMethod,
    required String? customerName,
    required String storeName,
    required String? storeAddress,
    required String? storePhone,
  }) {
    final dateStr = invoiceDate.toLocal().toString().split(' ')[0];
    
    return '''📋 *Invoice Details:*
• Invoice No: $invoiceNumber
• Date: $dateStr
• Items: $itemCount items
• Total Amount: ₹${totalAmount.toStringAsFixed(2)}
• Payment: $paymentMethod

👤 *Customer:* ${customerName ?? 'Walk-in Customer'}

🏪 *Store Details:*
$storeName${storeAddress != null ? '\n$storeAddress' : ''}${storePhone != null ? '\nPhone: $storePhone' : ''}

Thank you for choosing us! 💊
Get well soon! 🌟''';
  }

  /// Generate reorder message for supplier
  static String generateReorderMessage({
    required List<Map<String, dynamic>> items,
    required String? customMessage,
  }) {
    String message = '📦 *Reorder Request*\n\n';
    message += '*Items Needed:*\n';

    for (var item in items) {
      message += '• ${item['name']}: ${item['quantity']} ${item['unitType']}\n';
    }

    if (customMessage != null && customMessage.isNotEmpty) {
      message += '\n*Additional Notes:*\n$customMessage\n\n';
    }

    message += 'Please confirm availability and pricing.\n\n';
    message += 'Thank you! 💊\n';
    message += 'Best regards 🌟';

    return message;
  }

  /// Generate low stock alert message
  static String generateLowStockMessage({
    required String medicineName,
    required int currentStock,
    required int minimumStock,
    required String storeName,
  }) {
    return '''⚠️ *Low Stock Alert*

Medicine: $medicineName
Current Stock: $currentStock units
Minimum Required: $minimumStock units

Store: $storeName

Please reorder this medicine urgently.

Thank you! 💊''';
  }

  /// Generate payment reminder message
  static String generatePaymentReminderMessage({
    required String invoiceNumber,
    required double pendingAmount,
    required String storeName,
  }) {
    return '''💰 *Payment Reminder*

Invoice: $invoiceNumber
Pending Amount: ₹${pendingAmount.toStringAsFixed(2)}

Store: $storeName

Please complete the payment at your earliest convenience.

Thank you! 💊''';
  }

  /// Check if WhatsApp is installed
  static Future<bool> isWhatsAppInstalled() async {
    try {
      // Try to launch WhatsApp with a dummy URL
      final whatsappUrl = Uri.parse('https://wa.me/');
      return await canLaunchUrl(whatsappUrl);
    } catch (e) {
      return false;
    }
  }
}

