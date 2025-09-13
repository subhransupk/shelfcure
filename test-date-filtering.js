#!/usr/bin/env node

/**
 * Test script for Sales Date Filtering functionality
 * This script tests the date filtering implementation for the ShelfCure Sales History feature
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace these with actual values from your system
  token: 'your-jwt-token-here', // Get this from localStorage after logging in
  storeId: 'your-store-id-here'
};

/**
 * Helper function to make authenticated API requests
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test Cases for Date Filtering
 */
const testCases = [
  {
    name: 'Fetch all sales (no date filter)',
    endpoint: '/api/store-manager/sales',
    expectedBehavior: 'Should return all sales for the store'
  },
  {
    name: 'Single date filter (today)',
    endpoint: `/api/store-manager/sales?startDate=${new Date().toISOString().split('T')[0]}`,
    expectedBehavior: 'Should return only today\'s sales'
  },
  {
    name: 'Date range filter (last 7 days)',
    endpoint: (() => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      return `/api/store-manager/sales?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
    })(),
    expectedBehavior: 'Should return sales from the last 7 days'
  },
  {
    name: 'Invalid date format',
    endpoint: '/api/store-manager/sales?startDate=invalid-date',
    expectedBehavior: 'Should return error for invalid date format'
  },
  {
    name: 'Start date after end date',
    endpoint: (() => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1);
      return `/api/store-manager/sales?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
    })(),
    expectedBehavior: 'Should return error for invalid date range'
  }
];

/**
 * Run all test cases
 */
async function runTests() {
  console.log('🧪 Starting Sales Date Filtering Tests...\n');

  if (TEST_CONFIG.token === 'your-jwt-token-here') {
    console.log('❌ Please update TEST_CONFIG with your actual JWT token');
    console.log('   You can get this from localStorage after logging into the frontend');
    return;
  }

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📋 Test ${i + 1}: ${testCase.name}`);
    console.log(`🔗 Endpoint: ${testCase.endpoint}`);
    console.log(`📝 Expected: ${testCase.expectedBehavior}`);

    const result = await makeRequest(testCase.endpoint);
    
    if (result.success) {
      console.log(`✅ Status: ${result.status}`);
      console.log(`📊 Results: ${result.data.count || 0} sales found`);
      if (result.data.data && result.data.data.length > 0) {
        const firstSale = result.data.data[0];
        console.log(`📅 First sale date: ${new Date(firstSale.createdAt).toLocaleDateString()}`);
      }
    } else {
      console.log(`❌ Status: ${result.status}`);
      console.log(`💬 Message: ${result.data?.message || result.error}`);
    }
    
    console.log('─'.repeat(50));
  }

  console.log('\n🎉 Tests completed!');
  console.log('\n📋 Manual Testing Checklist:');
  console.log('1. ✅ Open http://localhost:3000/store-panel/sales');
  console.log('2. ✅ Switch to "Sales History" tab');
  console.log('3. ✅ Test single date filtering');
  console.log('4. ✅ Test date range filtering');
  console.log('5. ✅ Test "Clear" button functionality');
  console.log('6. ✅ Verify filter status display');
  console.log('7. ✅ Test edge cases (invalid dates, future dates)');
  console.log('8. ✅ Verify existing functionality still works');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest, testCases };
