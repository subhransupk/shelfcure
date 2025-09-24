// Test script to verify GST number synchronization
const fetch = require('node-fetch');

const testGSTSync = async () => {
  try {
    console.log('Testing GST number synchronization...');
    
    // You would need to replace this with a valid token from your browser
    const token = 'YOUR_STORE_MANAGER_TOKEN_HERE';
    
    // Test 1: Get current business settings
    console.log('\n1. Fetching current business settings...');
    const businessResponse = await fetch('http://localhost:5000/api/store-manager/business-settings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (businessResponse.ok) {
      const businessData = await businessResponse.json();
      console.log('Business Settings GST Number:', businessData.data.gstNumber);
    } else {
      console.log('Failed to fetch business settings:', businessResponse.status);
    }
    
    // Test 2: Get current store info
    console.log('\n2. Fetching current store info...');
    const storeResponse = await fetch('http://localhost:5000/api/store-manager/store-info', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (storeResponse.ok) {
      const storeData = await storeResponse.json();
      console.log('Store Info GST Number:', storeData.data.business?.gstNumber);
    } else {
      console.log('Failed to fetch store info:', storeResponse.status);
    }
    
    // Test 3: Update GST number via business settings
    console.log('\n3. Updating GST number via business settings...');
    const testGSTNumber = '27ABCDE1234F1Z5';
    
    const updateResponse = await fetch('http://localhost:5000/api/store-manager/business-settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gstNumber: testGSTNumber,
        gstEnabled: true,
        defaultGstRate: 18,
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
        decimalPlaces: 2
      })
    });
    
    if (updateResponse.ok) {
      console.log('GST number updated successfully');
      
      // Test 4: Verify both fields are updated
      console.log('\n4. Verifying synchronization...');
      
      // Check business settings again
      const businessResponse2 = await fetch('http://localhost:5000/api/store-manager/business-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (businessResponse2.ok) {
        const businessData2 = await businessResponse2.json();
        console.log('Updated Business Settings GST Number:', businessData2.data.gstNumber);
      }
      
      // Check store info again
      const storeResponse2 = await fetch('http://localhost:5000/api/store-manager/store-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (storeResponse2.ok) {
        const storeData2 = await storeResponse2.json();
        console.log('Updated Store Info GST Number:', storeData2.data.business?.gstNumber);
      }
      
    } else {
      console.log('Failed to update GST number:', updateResponse.status);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

console.log('To run this test:');
console.log('1. Get your store manager token from browser dev tools');
console.log('2. Replace YOUR_STORE_MANAGER_TOKEN_HERE with the actual token');
console.log('3. Run: node test-gst-sync.js');

// Uncomment the line below and add your token to run the test
// testGSTSync();
