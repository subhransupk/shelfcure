/**
 * Invoice Service
 * Handles invoice generation and PDF creation
 */

/**
 * Generate invoice PDF (placeholder implementation)
 * @param {Object} saleData - Sale data for invoice
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateInvoicePDF = async (saleData) => {
  try {
    // Placeholder implementation
    // In a real implementation, you would use a PDF library like puppeteer, jsPDF, or PDFKit
    console.log('📄 Generating invoice PDF for sale:', saleData._id);
    
    // Return a simple text buffer as placeholder
    const invoiceText = `
INVOICE
=======
Invoice Number: ${saleData.invoiceNumber || 'N/A'}
Date: ${new Date(saleData.createdAt).toLocaleDateString()}
Customer: ${saleData.customer?.name || 'Walk-in Customer'}
Total Amount: ₹${saleData.totalAmount}

Items:
${saleData.items.map(item => `- ${item.medicine?.name || 'Unknown'}: ${item.quantity} x ₹${item.unitPrice} = ₹${item.totalPrice}`).join('\n')}

Subtotal: ₹${saleData.subtotal}
Discount: ₹${saleData.discountAmount || 0}
Tax: ₹${saleData.totalTaxAmount || 0}
Total: ₹${saleData.totalAmount}

Thank you for your business!
    `;
    
    return Buffer.from(invoiceText, 'utf8');
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  }
};

/**
 * Generate invoice HTML (placeholder implementation)
 * @param {Object} saleData - Sale data for invoice
 * @returns {Promise<string>} HTML string
 */
const generateInvoiceHTML = async (saleData) => {
  try {
    console.log('📄 Generating invoice HTML for sale:', saleData._id);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Invoice ${saleData.invoiceNumber || 'N/A'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .totals { text-align: right; }
        .total-row { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>INVOICE</h1>
        <p>Invoice Number: ${saleData.invoiceNumber || 'N/A'}</p>
        <p>Date: ${new Date(saleData.createdAt).toLocaleDateString()}</p>
    </div>
    
    <div class="invoice-details">
        <p><strong>Customer:</strong> ${saleData.customer?.name || 'Walk-in Customer'}</p>
        <p><strong>Payment Method:</strong> ${saleData.paymentMethod || 'Cash'}</p>
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${saleData.items.map(item => `
                <tr>
                    <td>${item.medicine?.name || 'Unknown'}</td>
                    <td>${item.quantity} ${item.unitType || 'units'}</td>
                    <td>₹${item.unitPrice}</td>
                    <td>₹${item.totalPrice}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="totals">
        <p>Subtotal: ₹${saleData.subtotal}</p>
        <p>Discount: ₹${saleData.discountAmount || 0}</p>
        <p>Tax: ₹${saleData.totalTaxAmount || 0}</p>
        <p class="total-row">Total: ₹${saleData.totalAmount}</p>
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
        <p>Thank you for your business!</p>
    </div>
</body>
</html>
    `;
    
    return html;
  } catch (error) {
    console.error('Error generating invoice HTML:', error);
    throw error;
  }
};

/**
 * Save invoice to file system (placeholder implementation)
 * @param {Object} saleData - Sale data
 * @param {Buffer} pdfBuffer - PDF buffer
 * @returns {Promise<string>} File path
 */
const saveInvoiceToFile = async (saleData, pdfBuffer) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Create invoices directory if it doesn't exist
    const invoicesDir = path.join(__dirname, '..', 'invoices');
    try {
      await fs.mkdir(invoicesDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Generate filename
    const filename = `invoice_${saleData.invoiceNumber || saleData._id}_${Date.now()}.pdf`;
    const filepath = path.join(invoicesDir, filename);
    
    // Save file
    await fs.writeFile(filepath, pdfBuffer);
    
    console.log('📁 Invoice saved to:', filepath);
    return filepath;
  } catch (error) {
    console.error('Error saving invoice to file:', error);
    throw error;
  }
};

/**
 * Get invoice file path
 * @param {string} invoiceNumber - Invoice number
 * @returns {Promise<string>} File path
 */
const getInvoiceFilePath = async (invoiceNumber) => {
  try {
    const path = require('path');
    const fs = require('fs').promises;
    
    const invoicesDir = path.join(__dirname, '..', 'invoices');
    const files = await fs.readdir(invoicesDir);
    
    // Find file that starts with the invoice number
    const invoiceFile = files.find(file => file.startsWith(`invoice_${invoiceNumber}_`));
    
    if (invoiceFile) {
      return path.join(invoicesDir, invoiceFile);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting invoice file path:', error);
    return null;
  }
};

module.exports = {
  generateInvoicePDF,
  generateInvoiceHTML,
  saveInvoiceToFile,
  getInvoiceFilePath
};
