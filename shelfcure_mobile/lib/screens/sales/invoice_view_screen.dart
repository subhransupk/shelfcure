import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../models/sales_invoice.dart';
import '../../providers/invoice_provider.dart';
import '../../services/invoice_service.dart';
import '../../services/whatsapp_service.dart';

class InvoiceViewScreen extends StatefulWidget {
  final String saleId;
  final SalesInvoice? invoice;

  const InvoiceViewScreen({
    Key? key,
    required this.saleId,
    this.invoice,
  }) : super(key: key);

  @override
  State<InvoiceViewScreen> createState() => _InvoiceViewScreenState();
}

class _InvoiceViewScreenState extends State<InvoiceViewScreen> {
  late WebViewController _webViewController;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
    _loadInvoice();
  }

  void _initializeWebView() {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            setState(() => _isLoading = false);
          },
          onWebResourceError: (WebResourceError error) {
            setState(() {
              _error = error.description;
              _isLoading = false;
            });
          },
        ),
      );
  }

  Future<void> _loadInvoice() async {
    try {
      final invoiceProvider =
          Provider.of<InvoiceProvider>(context, listen: false);
      final htmlContent = await invoiceProvider.getInvoiceHTML(widget.saleId);

      if (htmlContent != null && mounted) {
        _webViewController.loadHtmlString(htmlContent);
      } else if (mounted) {
        setState(() {
          _error = 'Failed to load invoice';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Error loading invoice: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _shareViaWhatsApp() async {
    if (widget.invoice == null) return;

    try {
      final invoice = widget.invoice!;
      final message = WhatsAppService.generateInvoiceMessage(
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        itemCount: invoice.items.length,
        totalAmount: invoice.totalAmount,
        paymentMethod: invoice.paymentMethod,
        customerName: invoice.customerDetails?.name,
        storeName: invoice.template?.storeDetails?.name ?? 'Store',
        storeAddress: invoice.template?.storeDetails?.address,
        storePhone: invoice.template?.storeDetails?.phone,
      );

      if (invoice.customerDetails?.phone != null) {
        await WhatsAppService.openWhatsApp(
          invoice.customerDetails!.phone!,
          message,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Customer phone number not available')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  void _printInvoice() {
    _webViewController.runJavaScript('window.print();');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoice'),
        backgroundColor: const Color(0xFF2E7D32),
        actions: [
          if (widget.invoice?.customerDetails?.phone != null)
            IconButton(
              icon: const Icon(Icons.message),
              tooltip: 'Share via WhatsApp',
              onPressed: _shareViaWhatsApp,
            ),
          IconButton(
            icon: const Icon(Icons.print),
            tooltip: 'Print',
            onPressed: _printInvoice,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadInvoice,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : WebViewWidget(controller: _webViewController),
    );
  }
}

