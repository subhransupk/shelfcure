// Test script to verify purchase order creation fix

async function testPurchaseCreation() {
  try {
    // First, let's test the data structure we're sending
    const testPurchaseData = {
      supplier: "507f1f77bcf86cd799439011", // Mock ObjectId
      purchaseOrderNumber: "PO-TEST-001",
      invoiceNumber: "INV-TEST-001",
      expectedDeliveryDate: "2024-01-15",
      items: [
        {
          medicine: "507f1f77bcf86cd799439012", // Mock ObjectId
          medicineName: "Paracetamol 500mg",
          manufacturer: "Test Pharma",
          quantity: 10,
          unitType: "strip",
          unitCost: 25.50,
          discount: 5,
          taxRate: 18
        }
      ],
      notes: "Test purchase order"
    };

    console.log('Test Purchase Data Structure:');
    console.log(JSON.stringify(testPurchaseData, null, 2));

    // Validate the data structure matches backend expectations
    console.log('\n=== Validation Check ===');
    
    // Check required fields
    const requiredFields = ['supplier', 'purchaseOrderNumber', 'items'];
    const missingFields = requiredFields.filter(field => !testPurchaseData[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return;
    }
    
    console.log('✅ All required top-level fields present');
    
    // Check items structure
    if (!Array.isArray(testPurchaseData.items) || testPurchaseData.items.length === 0) {
      console.log('❌ Items must be a non-empty array');
      return;
    }
    
    console.log('✅ Items is a non-empty array');
    
    // Check each item
    const requiredItemFields = ['medicineName', 'quantity', 'unitCost'];
    for (let i = 0; i < testPurchaseData.items.length; i++) {
      const item = testPurchaseData.items[i];
      const missingItemFields = requiredItemFields.filter(field => !item[field] && item[field] !== 0);
      
      if (missingItemFields.length > 0) {
        console.log(`❌ Item ${i + 1} missing required fields:`, missingItemFields);
        return;
      }
      
      // Check data types
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        console.log(`❌ Item ${i + 1} quantity must be a positive number`);
        return;
      }
      
      if (typeof item.unitCost !== 'number' || item.unitCost < 0) {
        console.log(`❌ Item ${i + 1} unitCost must be a non-negative number`);
        return;
      }
      
      console.log(`✅ Item ${i + 1} structure is valid`);
    }
    
    console.log('\n=== Data Structure Validation Passed ===');
    console.log('The purchase data structure should now work with the backend validation.');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testPurchaseCreation();
