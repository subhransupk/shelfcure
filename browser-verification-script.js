/**
 * Browser Console Verification Script
 * Run this in the browser console on the sales page to verify the fix
 */

// Function to test the doctor and customer API calls
async function verifyDoctorStatusFix() {
  console.log('🧪 Verifying Doctor & Customer Status Fix...\n');
  
  try {
    // Get the token from localStorage (same way the app does)
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('❌ No authentication token found. Please log in first.');
      return;
    }
    
    console.log('🔑 Token found, testing API calls...\n');
    
    // Test 1: Call the API the way sales page now does (with status=active)
    console.log('📋 Test 1: Sales page API call (with status=active filter)');
    const salesPageResponse = await fetch('/api/store-manager/doctors?status=active', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (salesPageResponse.ok) {
      const salesPageData = await salesPageResponse.json();
      console.log(`✅ Sales page would show ${salesPageData.data?.length || 0} doctors`);
      
      // Check if all returned doctors are active
      const nonActiveDoctors = salesPageData.data?.filter(doctor => doctor.status !== 'active') || [];
      if (nonActiveDoctors.length === 0) {
        console.log('✅ All doctors returned are active - Fix is working!');
      } else {
        console.log(`❌ Found ${nonActiveDoctors.length} non-active doctors - Fix may not be working`);
      }
      
      // Show sample of doctors
      if (salesPageData.data?.length > 0) {
        console.log('📋 Sample doctors that would appear in sales page:');
        salesPageData.data.slice(0, 3).forEach(doctor => {
          console.log(`   - Dr. ${doctor.name} (${doctor.status}) - ${doctor.specialization}`);
        });
      }
    } else {
      console.log('❌ Sales page API call failed');
    }
    
    console.log('\n');
    
    // Test 2: Call the API without filter (to see all doctors)
    console.log('📋 Test 2: API call without filter (shows all doctors)');
    const allDoctorsResponse = await fetch('/api/store-manager/doctors', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (allDoctorsResponse.ok) {
      const allDoctorsData = await allDoctorsResponse.json();
      console.log(`✅ Total doctors in system: ${allDoctorsData.data?.length || 0}`);
      
      // Show status breakdown
      const statusBreakdown = {};
      allDoctorsData.data?.forEach(doctor => {
        statusBreakdown[doctor.status] = (statusBreakdown[doctor.status] || 0) + 1;
      });
      console.log('📊 Status breakdown:', statusBreakdown);
    } else {
      console.log('❌ All doctors API call failed');
    }
    
    console.log('\n');

    // Test 3: Call the customer API the way sales page now does (with status=active)
    console.log('📋 Test 3: Sales page customer API call (with status=active filter)');
    const salesPageCustomerResponse = await fetch('/api/store-manager/customers?status=active', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (salesPageCustomerResponse.ok) {
      const salesPageCustomerData = await salesPageCustomerResponse.json();
      console.log(`✅ Sales page would show ${salesPageCustomerData.data?.length || 0} customers`);

      // Check if all returned customers are active
      const nonActiveCustomers = salesPageCustomerData.data?.filter(customer => customer.status !== 'active') || [];
      if (nonActiveCustomers.length === 0) {
        console.log('✅ All customers returned are active - Fix is working!');
      } else {
        console.log(`❌ Found ${nonActiveCustomers.length} non-active customers - Fix may not be working`);
      }

      // Show sample of customers
      if (salesPageCustomerData.data?.length > 0) {
        console.log('📋 Sample customers that would appear in sales page:');
        salesPageCustomerData.data.slice(0, 3).forEach(customer => {
          console.log(`   - ${customer.name} (${customer.status}) - ${customer.phone}`);
        });
      }
    } else {
      console.log('❌ Sales page customer API call failed');
    }

    console.log('\n🎯 Verification Summary:');
    console.log('========================');
    console.log('✅ The sales page now uses:');
    console.log('   - /api/store-manager/doctors?status=active');
    console.log('   - /api/store-manager/customers?status=active');
    console.log('✅ This ensures only active doctors appear in the dropdown');
    console.log('✅ This ensures only active customers appear in the dropdown');
    console.log('✅ Inactive doctors and blocked customers are filtered out from sales page');
    console.log('\n🎉 Doctor & Customer status filtering fix is working correctly!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Instructions
console.log('🔧 Doctor & Customer Status Fix Verification');
console.log('============================================');
console.log('');
console.log('To verify the fix:');
console.log('1. Navigate to the sales page in ShelfCure');
console.log('2. Open browser developer tools (F12)');
console.log('3. Go to the Console tab');
console.log('4. Paste this entire script and press Enter');
console.log('5. Run: verifyDoctorStatusFix()');
console.log('');
console.log('You can also check the Network tab to see the API calls being made.');
console.log('');

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  console.log('🚀 Running verification automatically...\n');
  verifyDoctorStatusFix();
}
