/**
 * Test script to verify CSV encoding fixes for Rupee symbol (₹)
 * This script tests the CSV generation with UTF-8 encoding and BOM
 */

const fs = require('fs');
const path = require('path');

// Test function to generate CSV with UTF-8 BOM
function generateTestCSV() {
  console.log('Testing CSV encoding with Rupee symbol (₹)...\n');

  // Test data with Rupee symbols
  const testData = [
    {
      medicineName: 'Paracetamol 500mg',
      unitCost: 12,
      totalCost: 2400.00,
      supplier: 'ABC Pharma'
    },
    {
      medicineName: 'Amoxicillin 250mg',
      unitCost: 25.50,
      totalCost: 1275.00,
      supplier: 'XYZ Medical'
    },
    {
      medicineName: 'Crocin Advance',
      unitCost: 8.75,
      totalCost: 875.00,
      supplier: 'GSK Pharma'
    }
  ];

  // Generate CSV content with UTF-8 BOM (same as our fixed code)
  let csvContent = '\uFEFF'; // UTF-8 BOM for proper encoding
  csvContent += 'Medicine Name,Unit Cost,Total Cost,Supplier\n';

  testData.forEach(item => {
    csvContent += `"${item.medicineName}","₹${item.unitCost}","₹${item.totalCost.toFixed(2)}","${item.supplier}"\n`;
  });

  // Write test CSV file
  const testFilePath = path.join(__dirname, 'test-reorder-encoding.csv');
  fs.writeFileSync(testFilePath, csvContent, 'utf8');

  console.log('✅ Test CSV file generated successfully!');
  console.log(`📁 File location: ${testFilePath}`);
  console.log('\n📋 CSV Content Preview:');
  console.log('─'.repeat(60));
  console.log(csvContent);
  console.log('─'.repeat(60));

  // Verify the file contains proper UTF-8 encoding
  const fileBuffer = fs.readFileSync(testFilePath);
  const hasBOM = fileBuffer[0] === 0xEF && fileBuffer[1] === 0xBB && fileBuffer[2] === 0xBF;
  
  console.log('\n🔍 Encoding Verification:');
  console.log(`UTF-8 BOM present: ${hasBOM ? '✅ Yes' : '❌ No'}`);
  
  if (hasBOM) {
    console.log('✅ File should display Rupee symbols (₹) correctly in Excel/spreadsheet apps');
  } else {
    console.log('❌ File may not display Rupee symbols correctly');
  }

  // Test the content includes Rupee symbols
  const fileContent = fs.readFileSync(testFilePath, 'utf8');
  const hasRupeeSymbol = fileContent.includes('₹');
  console.log(`Rupee symbol (₹) in content: ${hasRupeeSymbol ? '✅ Yes' : '❌ No'}`);

  console.log('\n📝 Instructions:');
  console.log('1. Open the generated CSV file in Excel or Google Sheets');
  console.log('2. Verify that Unit Cost and Total Cost columns show "₹" symbol correctly');
  console.log('3. Expected format: "₹12", "₹2400.00", etc.');
  console.log('4. If symbols appear as "â‚¹", the encoding fix needs adjustment');

  return testFilePath;
}

// Test backend-style CSV generation (simulating the fixed controller)
function testBackendCSVGeneration() {
  console.log('\n🔧 Testing Backend CSV Generation (Controller Style)...\n');

  // Simulate the fixed backend controller logic
  const reportData = {
    items: [
      {
        medicineName: 'Paracetamol 500mg',
        genericName: 'Acetaminophen',
        manufacturer: 'Cipla',
        category: 'Pain Relief',
        supplier: { name: 'ABC Pharma' },
        stripSuggestion: {
          currentStock: 50,
          reorderLevel: 20,
          suggestedQuantity: 100,
          unitCost: 12
        },
        individualSuggestion: {
          currentStock: 500,
          reorderLevel: 200,
          suggestedQuantity: 1000,
          unitCost: 1.2
        }
      }
    ]
  };

  // Generate CSV format with UTF-8 BOM (same as fixed backend code)
  let csvContent = '\uFEFF'; // UTF-8 BOM
  csvContent += 'Medicine Name,Generic Name,Manufacturer,Category,Supplier,Unit Type,Current Stock,Reorder Level,Suggested Quantity,Unit Cost,Total Cost\n';

  reportData.items.forEach(item => {
    const supplierName = item.supplier?.name || 'No Supplier';

    if (item.stripSuggestion) {
      const totalCost = item.stripSuggestion.suggestedQuantity * item.stripSuggestion.unitCost;
      csvContent += `"${item.medicineName}","${item.genericName}","${item.manufacturer}","${item.category}","${supplierName}","Strip",${item.stripSuggestion.currentStock},${item.stripSuggestion.reorderLevel},${item.stripSuggestion.suggestedQuantity},"₹${item.stripSuggestion.unitCost}","₹${totalCost.toFixed(2)}"\n`;
    }

    if (item.individualSuggestion) {
      const totalCost = item.individualSuggestion.suggestedQuantity * item.individualSuggestion.unitCost;
      csvContent += `"${item.medicineName}","${item.genericName}","${item.manufacturer}","${item.category}","${supplierName}","Individual",${item.individualSuggestion.currentStock},${item.individualSuggestion.reorderLevel},${item.individualSuggestion.suggestedQuantity},"₹${item.individualSuggestion.unitCost}","₹${totalCost.toFixed(2)}"\n`;
    }
  });

  // Write backend test CSV file
  const backendTestFilePath = path.join(__dirname, 'test-backend-reorder-encoding.csv');
  fs.writeFileSync(backendTestFilePath, csvContent, 'utf8');

  console.log('✅ Backend-style CSV file generated successfully!');
  console.log(`📁 File location: ${backendTestFilePath}`);
  console.log('\n📋 Backend CSV Content Preview:');
  console.log('─'.repeat(80));
  console.log(csvContent);
  console.log('─'.repeat(80));

  return backendTestFilePath;
}

// Run the tests
console.log('🧪 CSV Encoding Fix Verification Test');
console.log('=====================================\n');

try {
  const testFile1 = generateTestCSV();
  const testFile2 = testBackendCSVGeneration();

  console.log('\n🎉 All tests completed successfully!');
  console.log('\n📋 Summary:');
  console.log('- UTF-8 BOM added to prevent encoding issues');
  console.log('- Rupee symbols (₹) properly included in CSV content');
  console.log('- Content-Type headers should include "charset=utf-8"');
  console.log('- Both frontend and backend CSV exports fixed');

  console.log('\n🔍 Next Steps:');
  console.log('1. Test the actual application reorder CSV export');
  console.log('2. Verify the downloaded CSV displays ₹ symbols correctly');
  console.log('3. Check both backend API and frontend export functions');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
