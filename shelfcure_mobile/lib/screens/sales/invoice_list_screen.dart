import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/sales_invoice.dart';
import '../../providers/invoice_provider.dart';
import '../../services/whatsapp_service.dart';
import 'invoice_view_screen.dart';

class InvoiceListScreen extends StatefulWidget {
  const InvoiceListScreen({Key? key}) : super(key: key);

  @override
  State<InvoiceListScreen> createState() => _InvoiceListScreenState();
}

class _InvoiceListScreenState extends State<InvoiceListScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<InvoiceProvider>(context, listen: false).fetchInvoices();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    if (query.isEmpty) {
      Provider.of<InvoiceProvider>(context, listen: false).fetchInvoices();
    } else {
      Provider.of<InvoiceProvider>(context, listen: false).searchInvoices(query);
    }
  }

  void _viewInvoice(SalesInvoice invoice) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => InvoiceViewScreen(
          saleId: invoice.saleId,
          invoice: invoice,
        ),
      ),
    );
  }

  Future<void> _shareViaWhatsApp(SalesInvoice invoice) async {
    try {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoices'),
        backgroundColor: const Color(0xFF2E7D32),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearch,
              decoration: InputDecoration(
                hintText: 'Search invoices...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
          Expanded(
            child: Consumer<InvoiceProvider>(
              builder: (context, invoiceProvider, _) {
                if (invoiceProvider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (invoiceProvider.invoices.isEmpty) {
                  return const Center(
                    child: Text('No invoices found'),
                  );
                }

                return ListView.builder(
                  itemCount: invoiceProvider.invoices.length,
                  itemBuilder: (context, index) {
                    final invoice = invoiceProvider.invoices[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: ListTile(
                        title: Text('Invoice #${invoice.invoiceNumber}'),
                        subtitle: Text(
                          '${invoice.customerDetails?.name ?? 'Walk-in'} • ₹${invoice.totalAmount.toStringAsFixed(2)}',
                        ),
                        trailing: PopupMenuButton(
                          itemBuilder: (context) => [
                            PopupMenuItem(
                              child: const Text('View'),
                              onTap: () => _viewInvoice(invoice),
                            ),
                            if (invoice.customerDetails?.phone != null)
                              PopupMenuItem(
                                child: const Text('Share via WhatsApp'),
                                onTap: () => _shareViaWhatsApp(invoice),
                              ),
                          ],
                        ),
                        onTap: () => _viewInvoice(invoice),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

