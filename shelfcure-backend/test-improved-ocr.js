const ocrService = require('./services/ocrService');

// Test the improved OCR parsing with sample Indian medical bill text
const sampleBillText = `
TAX INVOICE
MEDICO PHARMA DISTRIBUTORS PVT LTD
123 Medical Street, Mumbai - 400001
Phone: 9876543210
GSTIN: 27ABCDE1234F1Z5

Bill No: INV-2024-001
Date: 15/03/2024

To: ABC Medical Store
Address: Shop 45, Health Plaza, Delhi

Sr. Medicine Name                    Batch   Exp    Qty  Rate   Amount
1.  Paracetamol 500mg Tab           B123    12/25   10   8.50   85.00
2.  Amoxicillin 250mg Cap           B456    06/26   20   12.00  240.00
3.  Crocin Advance Tablet           B789    09/25   15   9.75   146.25
4.  Azithromycin 500mg Tab          B101    03/26   5    45.00  225.00
5.  Dolo 650mg Tablet               B202    11/25   25   6.80   170.00

                                    Subtotal:        866.25
                                    GST 12%:         103.95
                                    Total Amount:    970.20

Thank you for your business!
`;

async function testImprovedOCR() {
  console.log('🧪 Testing Improved OCR Parsing');
  console.log('================================');
  
  try {
    // Split text into lines like OCR would do
    const lines = sampleBillText.split('\n').map(line => line.trim()).filter(line => line);
    
    console.log('📄 Sample bill lines:', lines.length);
    
    // Test supplier extraction
    console.log('\n🏢 Testing Supplier Extraction:');
    const supplier = ocrService.extractSupplierInfo(lines);
    console.log('Supplier:', supplier);
    
    // Test medicine extraction
    console.log('\n💊 Testing Medicine Extraction:');
    const medicines = ocrService.extractMedicines(lines);
    console.log('Medicines found:', medicines.length);
    medicines.forEach((med, index) => {
      console.log(`${index + 1}. ${med.name} - Qty: ${med.quantity}, Price: ${med.unitPrice || med.totalPrice}`);
    });
    
    // Test totals extraction
    console.log('\n💰 Testing Totals Extraction:');
    const totals = ocrService.extractTotals(lines);
    console.log('Totals:', totals);
    
    // Test bill number and date
    console.log('\n📋 Testing Bill Info:');
    const billNumber = ocrService.extractBillNumber(lines);
    const billDate = ocrService.extractBillDate(lines);
    console.log('Bill Number:', billNumber);
    console.log('Bill Date:', billDate);
    
    console.log('\n✅ OCR Parsing Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testImprovedOCR();
