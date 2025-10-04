const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// Import the OCR service instance
const ocrService = require('./services/ocrService');

async function testCompleteOCRFlow() {
  console.log('🧪 Testing Complete OCR Flow');
  console.log('==============================\n');

  // Test 1: Create a test image with text
  console.log('📸 Test 1: Creating Test Image with Medicine Bill Text');
  console.log('------------------------------------------------------');
  
  try {
    // Create a simple test image with text using Sharp
    const testImagePath = path.join(__dirname, 'uploads', 'ocr', 'test-bill.png');
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(testImagePath), { recursive: true });
    
    // Create a white image with text overlay
    const width = 800;
    const height = 600;
    
    const svgText = `
      <svg width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50" y="50" font-family="Arial" font-size="24" fill="black">MEDICO PHARMA DISTRIBUTORS</text>
        <text x="50" y="80" font-family="Arial" font-size="16" fill="black">123 Medical Street, Mumbai - 400001</text>
        <text x="50" y="100" font-family="Arial" font-size="16" fill="black">Phone: 9876543210</text>
        <text x="50" y="120" font-family="Arial" font-size="16" fill="black">GST: 27ABCDE1234F1Z5</text>
        <text x="50" y="160" font-family="Arial" font-size="18" fill="black">TAX INVOICE</text>
        <text x="50" y="180" font-family="Arial" font-size="16" fill="black">Bill No: INV-2024-001</text>
        <text x="50" y="200" font-family="Arial" font-size="16" fill="black">Date: 15/03/2024</text>
        
        <text x="50" y="250" font-family="Arial" font-size="16" fill="black">Medicine Name          Qty    Rate    Amount</text>
        <text x="50" y="280" font-family="Arial" font-size="14" fill="black">Paracetamol 500mg Tab   10    8.50    85.00</text>
        <text x="50" y="300" font-family="Arial" font-size="14" fill="black">Amoxicillin 250mg Cap   20   12.00   240.00</text>
        <text x="50" y="320" font-family="Arial" font-size="14" fill="black">Crocin Advance Tab      15    9.75   146.25</text>
        <text x="50" y="340" font-family="Arial" font-size="14" fill="black">Azithromycin 500mg      5    45.00   225.00</text>
        <text x="50" y="360" font-family="Arial" font-size="14" fill="black">Dolo 650mg Tab         25     6.80   170.00</text>
        
        <text x="50" y="420" font-family="Arial" font-size="16" fill="black">Subtotal: 866.25</text>
        <text x="50" y="440" font-family="Arial" font-size="16" fill="black">GST (12%): 103.95</text>
        <text x="50" y="460" font-family="Arial" font-size="18" fill="black">Total: 970.20</text>
      </svg>
    `;
    
    await sharp(Buffer.from(svgText))
      .png()
      .toFile(testImagePath);
    
    console.log('✅ Test image created:', testImagePath);
    
    // Test 2: Process the image with OCR
    console.log('\n🔍 Test 2: Processing Image with OCR');
    console.log('------------------------------------');
    
    const ocrResult = await ocrService.processDocument(testImagePath, 'image/png');
    
    if (ocrResult.success) {
      console.log('✅ OCR Processing successful');
      console.log('📄 Extracted text length:', ocrResult.text.length);
      console.log('🎯 Confidence:', ocrResult.confidence + '%');
      console.log('🔧 Method:', ocrResult.method);
      console.log('\n📝 First 500 characters of extracted text:');
      console.log('-------------------------------------------');
      console.log(ocrResult.text.substring(0, 500));
      
      // Test 3: Parse the extracted text
      console.log('\n📋 Test 3: Parsing Purchase Bill Data');
      console.log('-------------------------------------');
      
      try {
        const billData = ocrService.parsePurchaseBill(ocrResult.text);
        
        console.log('✅ Bill parsing successful');
        console.log('🏢 Supplier:', billData.supplier.name);
        console.log('📞 Phone:', billData.supplier.phone);
        console.log('🏛️ GST:', billData.supplier.gstNumber);
        console.log('📄 Bill Number:', billData.billNumber);
        console.log('📅 Bill Date:', billData.billDate);
        console.log('💊 Medicines found:', billData.medicines.length);
        console.log('💰 Total Amount:', billData.totals.totalAmount);
        
        if (billData.medicines.length > 0) {
          console.log('\n💊 Medicine Details:');
          billData.medicines.forEach((med, index) => {
            console.log(`${index + 1}. ${med.name} - Qty: ${med.quantity}, Price: ₹${med.unitPrice || med.totalPrice}`);
          });
        }
        
        if (billData.warnings && billData.warnings.length > 0) {
          console.log('\n⚠️ Warnings:', billData.warnings);
        }
        
      } catch (parseError) {
        console.error('❌ Bill parsing failed:', parseError.message);
        console.log('📝 Raw OCR text for debugging:');
        console.log(ocrResult.text);
      }
      
    } else {
      console.error('❌ OCR Processing failed:', ocrResult.error);
    }
    
    // Test 4: Test with different image qualities
    console.log('\n📸 Test 4: Testing Different Image Qualities');
    console.log('--------------------------------------------');
    
    // Create a lower quality version
    const lowQualityPath = path.join(__dirname, 'uploads', 'ocr', 'test-bill-low-quality.png');
    await sharp(testImagePath)
      .resize(400, 300) // Smaller size
      .blur(0.5) // Slight blur
      .png({ quality: 50 })
      .toFile(lowQualityPath);
    
    console.log('📸 Testing low quality image...');
    const lowQualityResult = await ocrService.processDocument(lowQualityPath, 'image/png');
    
    if (lowQualityResult.success) {
      console.log('✅ Low quality OCR successful');
      console.log('🎯 Confidence:', lowQualityResult.confidence + '%');
      console.log('📄 Text length:', lowQualityResult.text.length);
    } else {
      console.log('❌ Low quality OCR failed:', lowQualityResult.error);
    }
    
    // Clean up test files
    try {
      await fs.unlink(testImagePath);
      await fs.unlink(lowQualityPath);
      console.log('\n🧹 Test files cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Could not clean up test files:', cleanupError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
  
  // Test 5: Test error handling
  console.log('\n🚨 Test 5: Error Handling');
  console.log('-------------------------');
  
  try {
    // Test with non-existent file
    await ocrService.processDocument('/non/existent/file.png', 'image/png');
  } catch (error) {
    console.log('✅ Non-existent file error handled:', error.message);
  }
  
  try {
    // Test with invalid file type
    const validation = ocrService.validateFile('/test.txt', 'text/plain');
    console.log('✅ Invalid file type validation:', validation.isValid ? 'Failed' : 'Passed');
  } catch (error) {
    console.log('✅ Invalid file type error handled:', error.message);
  }
  
  console.log('\n🎉 Complete OCR Flow Test Finished!');
  console.log('===================================');
}

// Run the test
testCompleteOCRFlow().catch(console.error);
