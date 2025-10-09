// Simple test using built-in fetch (Node.js 18+)
async function testBusinessSettings() {
  try {
    console.log('Testing business settings API with mock data...');
    
    // Test data similar to what the frontend sends
    const testData = {
      gstEnabled: true,
      defaultGstRate: 18,
      gstNumber: '', // Empty GST number should be allowed
      includeTaxInPrice: true,
      allowDiscounts: true,
      maxDiscountPercent: 50,
      maxDiscountAmountPerBill: 0,
      requireManagerApproval: true,
      discountOnMRP: true,
      autoApplyDiscounts: false,
      autoDiscountRules: [],
      allowNegativeStock: false,
      requirePrescription: true,
      printReceiptByDefault: true,
      currency: 'INR',
      currencySymbol: '₹',
      decimalPlaces: 2,
      discountTypes: [],
      taxTypes: []
    };
    
    // Test POST without auth (should fail with 401)
    console.log('\n1. Testing POST without authentication...');
    const response = await fetch('http://localhost:5000/api/store-manager/business-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    if (response.status === 401) {
      console.log('✅ Authentication check working correctly - got 401 as expected');
    } else {
      console.log('❌ Unexpected response status');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run the test
testBusinessSettings();
