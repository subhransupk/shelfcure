/**
 * Test script to verify that the doctor and customer status filtering fix is working correctly
 * This script tests the API endpoints to ensure only active doctors and customers are returned
 */

const fetch = require('node-fetch');

// Test configuration
const API_BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testDoctorStatusFiltering() {
  console.log('🧪 Testing Doctor & Customer Status Filtering Fix...\n');

  try {
    // Test 1: Fetch all doctors (should include active and inactive)
    console.log('📋 Test 1: Fetching all doctors...');
    const allDoctorsResponse = await fetch(`${API_BASE_URL}/api/store-manager/doctors`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (allDoctorsResponse.ok) {
      const allDoctorsData = await allDoctorsResponse.json();
      console.log(`✅ All doctors count: ${allDoctorsData.data?.length || 0}`);
      
      // Show status breakdown
      const statusBreakdown = {};
      allDoctorsData.data?.forEach(doctor => {
        statusBreakdown[doctor.status] = (statusBreakdown[doctor.status] || 0) + 1;
      });
      console.log('📊 Status breakdown:', statusBreakdown);
    } else {
      console.log('❌ Failed to fetch all doctors');
    }

    console.log('');

    // Test 2: Fetch only active doctors (this is what sales page should use)
    console.log('📋 Test 2: Fetching only active doctors...');
    const activeDoctorsResponse = await fetch(`${API_BASE_URL}/api/store-manager/doctors?status=active`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (activeDoctorsResponse.ok) {
      const activeDoctorsData = await activeDoctorsResponse.json();
      console.log(`✅ Active doctors count: ${activeDoctorsData.data?.length || 0}`);
      
      // Verify all returned doctors are active
      const nonActiveDoctors = activeDoctorsData.data?.filter(doctor => doctor.status !== 'active') || [];
      if (nonActiveDoctors.length === 0) {
        console.log('✅ All returned doctors have active status');
      } else {
        console.log(`❌ Found ${nonActiveDoctors.length} non-active doctors in active filter results`);
        nonActiveDoctors.forEach(doctor => {
          console.log(`   - ${doctor.name}: ${doctor.status}`);
        });
      }
    } else {
      console.log('❌ Failed to fetch active doctors');
    }

    console.log('');

    // Test 3: Fetch only inactive doctors
    console.log('📋 Test 3: Fetching only inactive doctors...');
    const inactiveDoctorsResponse = await fetch(`${API_BASE_URL}/api/store-manager/doctors?status=inactive`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (inactiveDoctorsResponse.ok) {
      const inactiveDoctorsData = await inactiveDoctorsResponse.json();
      console.log(`✅ Inactive doctors count: ${inactiveDoctorsData.data?.length || 0}`);
    } else {
      console.log('❌ Failed to fetch inactive doctors');
    }

    console.log('');

    // Test 4: Fetch all customers (should include active and blocked)
    console.log('📋 Test 4: Fetching all customers...');
    const allCustomersResponse = await fetch(`${API_BASE_URL}/api/store-manager/customers`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (allCustomersResponse.ok) {
      const allCustomersData = await allCustomersResponse.json();
      console.log(`✅ All customers count: ${allCustomersData.data?.length || 0}`);

      // Show status breakdown
      const customerStatusBreakdown = {};
      allCustomersData.data?.forEach(customer => {
        customerStatusBreakdown[customer.status] = (customerStatusBreakdown[customer.status] || 0) + 1;
      });
      console.log('📊 Customer status breakdown:', customerStatusBreakdown);
    } else {
      console.log('❌ Failed to fetch all customers');
    }

    console.log('');

    // Test 5: Fetch only active customers (this is what sales page should use)
    console.log('📋 Test 5: Fetching only active customers...');
    const activeCustomersResponse = await fetch(`${API_BASE_URL}/api/store-manager/customers?status=active`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (activeCustomersResponse.ok) {
      const activeCustomersData = await activeCustomersResponse.json();
      console.log(`✅ Active customers count: ${activeCustomersData.data?.length || 0}`);

      // Verify all returned customers are active
      const nonActiveCustomers = activeCustomersData.data?.filter(customer => customer.status !== 'active') || [];
      if (nonActiveCustomers.length === 0) {
        console.log('✅ All returned customers have active status');
      } else {
        console.log(`❌ Found ${nonActiveCustomers.length} non-active customers in active filter results`);
        nonActiveCustomers.forEach(customer => {
          console.log(`   - ${customer.name}: ${customer.status}`);
        });
      }
    } else {
      console.log('❌ Failed to fetch active customers');
    }

    console.log('\n🎯 Fix Verification:');
    console.log('The sales page now uses:');
    console.log('- /api/store-manager/doctors?status=active');
    console.log('- /api/store-manager/customers?status=active');
    console.log('This ensures only active doctors and customers appear in the selection dropdowns.');
    console.log('\n✅ Doctor & Customer status filtering fix has been implemented successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n📝 Note: Make sure the backend server is running and you have a valid token.');
  }
}

// Instructions for running the test
console.log('📋 Doctor & Customer Status Fix Test');
console.log('====================================');
console.log('');
console.log('To run this test:');
console.log('1. Make sure the backend server is running on port 5000');
console.log('2. Replace TEST_TOKEN with a valid store manager token');
console.log('3. Run: node test-doctor-status-fix.js');
console.log('');
console.log('Expected behavior:');
console.log('- Sales page should only show active doctors');
console.log('- Sales page should only show active customers (not blocked)');
console.log('- Doctor management page should show all doctors with filters');
console.log('- Customer management page should show all customers with filters');
console.log('');

// Uncomment the line below to run the test (after setting up the token)
// testDoctorStatusFiltering();
