const fetch = require('node-fetch');

// Test business settings API endpoint
async function testBusinessSettings() {
  try {
    console.log('Testing business settings API...');
    
    // First, let's test the health endpoint
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test business settings GET endpoint (without auth to see what happens)
    console.log('\nTesting GET business settings without auth...');
    const getResponse = await fetch('http://localhost:5000/api/store-manager/business-settings');
    console.log('GET Response status:', getResponse.status);
    const getData = await getResponse.json();
    console.log('GET Response data:', getData);
    
    // Test business settings POST endpoint (without auth to see what happens)
    console.log('\nTesting POST business settings without auth...');
    const postResponse = await fetch('http://localhost:5000/api/store-manager/business-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gstEnabled: true,
        defaultGstRate: 18,
        gstNumber: '',
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
      })
    });
    console.log('POST Response status:', postResponse.status);
    const postData = await postResponse.json();
    console.log('POST Response data:', postData);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testBusinessSettings();
