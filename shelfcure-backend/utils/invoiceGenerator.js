const SalesInvoice = require('../models/SalesInvoice');
const Store = require('../models/Store');
const Customer = require('../models/Customer');
const Medicine = require('../models/Medicine');

/**
 * Generate invoice for a sale
 * @param {Object} sale - Sale object
 * @param {Object} user - User who created the sale
 * @returns {Object} Generated invoice
 */
const generateInvoiceForSale = async (sale, user) => {
  try {
    console.log('🧾 Starting invoice generation for sale:', sale._id);

    // Get store details
    const store = await Store.findById(sale.store).select('name address contact business code');
    if (!store) {
      throw new Error('Store not found');
    }
    console.log('🏪 Store found:', store.name, 'Code:', store.code);

    // Format store address
    const formatAddress = (address) => {
      if (!address) return '';
      const parts = [
        address.street,
        address.city,
        address.state,
        address.country,
        address.pincode
      ].filter(Boolean);
      return parts.join(', ');
    };

    // Get customer details if customer exists
    let customerDetails = null;
    if (sale.customer) {
      const customer = await Customer.findById(sale.customer).select('name phone email fullAddress');
      if (customer) {
        customerDetails = {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.fullAddress
        };
      }
    }

    // Get medicine details for invoice items (keep original structure for database)
    const invoiceItems = [];
    for (const item of sale.items) {
      const medicine = await Medicine.findById(item.medicine).select('name genericName');
      invoiceItems.push({
        medicineName: medicine?.name || 'Unknown Medicine',
        genericName: medicine?.genericName || '',
        quantity: item.quantity,
        unitType: item.unitType,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        batch: item.batch || {}
      });
    }

    // Create invoice data
    const invoiceData = {
      sale: sale._id,
      store: sale.store,
      customer: sale.customer,
      customerDetails,
      items: invoiceItems,
      subtotal: sale.subtotal,
      discountAmount: sale.discountAmount || 0,
      discountType: sale.discountType,
      taxAmount: sale.totalTaxAmount || sale.gstAmount || 0,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus || 'paid',
      template: {
        storeDetails: {
          name: store.name,
          address: formatAddress(store.address),
          phone: store.contact?.phone || '',
          email: store.contact?.email || '',
          gstNumber: store.business?.gstNumber || '',
          licenseNumber: store.business?.licenseNumber || ''
        },
        footer: {
          terms: 'Thank you for your business!',
          thankYouMessage: 'Get well soon!'
        }
      },
      createdBy: user._id
    };

    console.log('📋 Invoice data prepared:', {
      saleId: invoiceData.sale,
      storeId: invoiceData.store,
      itemCount: invoiceData.items.length,
      totalAmount: invoiceData.totalAmount,
      storeDetails: invoiceData.template.storeDetails
    });

    // Create the invoice
    const invoice = await SalesInvoice.create(invoiceData);
    console.log('✅ Invoice created successfully:', invoice.invoiceNumber);

    // Update the sale with invoice number
    await sale.updateOne({ invoiceNumber: invoice.invoiceNumber });
    console.log('🔗 Sale updated with invoice number');

    return invoice;
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};

/**
 * Generate HTML template for invoice
 * @param {Object} invoice - Invoice object
 * @returns {String} HTML template
 */
const generateInvoiceHTML = (invoice) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toFixed(2)}`;
  };

  const formatContactInfo = (phone, email) => {
    const parts = [];
    if (phone) parts.push(`Phone: ${phone}`);
    if (email) parts.push(`Email: ${email}`);
    return parts.join(' | ');
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${invoice.invoiceNumber}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .invoice-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        
        .store-name {
            font-size: 24px;
            font-weight: bold;
            color: #2d5a27;
            margin-bottom: 5px;
        }
        
        .store-details {
            font-size: 11px;
            color: #666;
        }
        
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        
        .invoice-details, .customer-details {
            width: 48%;
        }
        
        .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            color: #2d5a27;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        .items-table .text-right {
            text-align: right;
        }
        
        .totals-section {
            float: right;
            width: 300px;
            margin-bottom: 20px;
        }
        
        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .totals-table td {
            padding: 5px 10px;
            border-bottom: 1px solid #eee;
        }
        
        .totals-table .total-row {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #333;
        }
        
        .footer {
            clear: both;
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 11px;
            color: #666;
        }
        
        .print-button {
            background-color: #2d5a27;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 20px;
        }
        
        .print-button:hover {
            background-color: #1e3a1a;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">Print Invoice</button>
    
    <div class="invoice-header">
        <div class="store-name">${invoice.template.storeDetails.name || 'ShelfCure Pharmacy'}</div>
        <div class="store-details">
            ${invoice.template.storeDetails.address || ''}<br>
            ${formatContactInfo(invoice.template.storeDetails.phone, invoice.template.storeDetails.email)}<br>
            ${invoice.template.storeDetails.gstNumber ? `GST: ${invoice.template.storeDetails.gstNumber} | ` : ''}
            ${invoice.template.storeDetails.licenseNumber ? `License: ${invoice.template.storeDetails.licenseNumber}` : ''}
        </div>
    </div>
    
    <div class="invoice-info">
        <div class="invoice-details">
            <div class="section-title">Invoice Details</div>
            <strong>Invoice #:</strong> ${invoice.invoiceNumber}<br>
            <strong>Date:</strong> ${formatDate(invoice.invoiceDate)}<br>
            <strong>Payment Method:</strong> ${invoice.paymentMethod.toUpperCase()}<br>
            <strong>Status:</strong> ${invoice.paymentStatus.toUpperCase()}
        </div>
        
        <div class="customer-details">
            <div class="section-title">Customer Details</div>
            ${invoice.customerDetails ? `
                <strong>Name:</strong> ${invoice.customerDetails.name}<br>
                ${invoice.customerDetails.phone ? `<strong>Phone:</strong> ${invoice.customerDetails.phone}<br>` : ''}
                ${invoice.customerDetails.email ? `<strong>Email:</strong> ${invoice.customerDetails.email}<br>` : ''}
                ${invoice.customerDetails.address ? `<strong>Address:</strong> ${invoice.customerDetails.address}` : ''}
            ` : '<em>Walk-in Customer</em>'}
        </div>
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>S.No.</th>
                <th>Medicine Name</th>
                <th>Generic Name</th>
                <th>Unit Type</th>
                <th>Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            ${(() => {
              // Group items by medicine name for display
              const medicineGroups = {};

              invoice.items.forEach(item => {
                const medicineName = item.medicineName;
                if (!medicineGroups[medicineName]) {
                  medicineGroups[medicineName] = {
                    medicineName,
                    genericName: item.genericName,
                    units: [],
                    totalPrice: 0
                  };
                }
                medicineGroups[medicineName].units.push({
                  unitType: item.unitType,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice
                });
                medicineGroups[medicineName].totalPrice += item.totalPrice;
              });

              const groupedItems = Object.values(medicineGroups);

              return groupedItems.map((group, groupIndex) => {
                if (group.units.length > 1) {
                  // Multiple units - show grouped
                  return `
                    <tr>
                      <td rowspan="${group.units.length}">${groupIndex + 1}</td>
                      <td rowspan="${group.units.length}">${group.medicineName}</td>
                      <td rowspan="${group.units.length}">${group.genericName || '-'}</td>
                      <td>${group.units[0].unitType}</td>
                      <td>${group.units[0].quantity}</td>
                      <td class="text-right">${formatCurrency(group.units[0].unitPrice)}</td>
                      <td rowspan="${group.units.length}" class="text-right">${formatCurrency(group.totalPrice)}</td>
                    </tr>
                    ${group.units.slice(1).map(unit => `
                      <tr>
                        <td>${unit.unitType}</td>
                        <td>${unit.quantity}</td>
                        <td class="text-right">${formatCurrency(unit.unitPrice)}</td>
                      </tr>
                    `).join('')}
                  `;
                } else {
                  // Single unit - show normally
                  const unit = group.units[0];
                  return `
                    <tr>
                      <td>${groupIndex + 1}</td>
                      <td>${group.medicineName}</td>
                      <td>${group.genericName || '-'}</td>
                      <td>${unit.unitType}</td>
                      <td>${unit.quantity}</td>
                      <td class="text-right">${formatCurrency(unit.unitPrice)}</td>
                      <td class="text-right">${formatCurrency(unit.totalPrice)}</td>
                    </tr>
                  `;
                }
              }).join('');
            })()}
        </tbody>
    </table>
    
    <div class="totals-section">
        <table class="totals-table">
            <tr>
                <td>Subtotal:</td>
                <td class="text-right">${formatCurrency(invoice.subtotal)}</td>
            </tr>
            ${invoice.discountAmount > 0 ? `
                <tr>
                    <td>Discount:</td>
                    <td class="text-right">-${formatCurrency(invoice.discountAmount)}</td>
                </tr>
            ` : ''}
            ${invoice.taxAmount > 0 ? `
                <tr>
                    <td>Tax (GST):</td>
                    <td class="text-right">${formatCurrency(invoice.taxAmount)}</td>
                </tr>
            ` : ''}
            <tr class="total-row">
                <td>Total Amount:</td>
                <td class="text-right">${formatCurrency(invoice.totalAmount)}</td>
            </tr>
        </table>
    </div>
    
    <div class="footer">
        <p>${invoice.template.footer.thankYouMessage}</p>
        <p><em>${invoice.template.footer.terms}</em></p>
        <p>This is a computer generated invoice.</p>
    </div>
</body>
</html>`;
};

/**
 * Record invoice print
 * @param {String} invoiceId - Invoice ID
 * @param {Object} user - User who printed the invoice
 * @param {String} printType - Type of print (original, duplicate, reprint)
 */
const recordInvoicePrint = async (invoiceId, user, printType = 'reprint') => {
  try {
    await SalesInvoice.findByIdAndUpdate(invoiceId, {
      $push: {
        printHistory: {
          printedBy: user._id,
          printType
        }
      }
    });
  } catch (error) {
    console.error('Error recording invoice print:', error);
  }
};

module.exports = {
  generateInvoiceForSale,
  generateInvoiceHTML,
  recordInvoicePrint
};
