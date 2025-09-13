#!/usr/bin/env node

/**
 * Test script for Sales History Pagination functionality
 * This script tests the pagination implementation for the ShelfCure Sales History feature
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
 * Test Cases for Pagination
 */
const testCases = [
  {
    name: 'Fetch first page (default pagination)',
    endpoint: '/api/store-manager/sales?page=1&limit=20',
    expectedBehavior: 'Should return first 20 sales with pagination metadata'
  },
  {
    name: 'Fetch second page',
    endpoint: '/api/store-manager/sales?page=2&limit=20',
    expectedBehavior: 'Should return sales 21-40 with correct pagination info'
  },
  {
    name: 'Fetch with custom limit',
    endpoint: '/api/store-manager/sales?page=1&limit=10',
    expectedBehavior: 'Should return first 10 sales with updated pagination'
  },
  {
    name: 'Pagination with date filter',
    endpoint: (() => {
      const today = new Date().toISOString().split('T')[0];
      return `/api/store-manager/sales?startDate=${today}&page=1&limit=20`;
    })(),
    expectedBehavior: 'Should return paginated results within date filter'
  },
  {
    name: 'Invalid page number (too high)',
    endpoint: '/api/store-manager/sales?page=999&limit=20',
    expectedBehavior: 'Should return empty results with correct pagination metadata'
  }
];

/**
 * Validate pagination response structure
 */
function validatePaginationResponse(data, testName) {
  const issues = [];
  
  if (!data.pagination) {
    issues.push('Missing pagination object');
  } else {
    const { page, limit, total, pages } = data.pagination;
    
    if (typeof page !== 'number') issues.push('page should be a number');
    if (typeof limit !== 'number') issues.push('limit should be a number');
    if (typeof total !== 'number') issues.push('total should be a number');
    if (typeof pages !== 'number') issues.push('pages should be a number');
    
    if (pages !== Math.ceil(total / limit)) {
      issues.push(`pages calculation incorrect: expected ${Math.ceil(total / limit)}, got ${pages}`);
    }
    
    if (page > pages && total > 0) {
      issues.push(`page ${page} exceeds total pages ${pages}`);
    }
  }
  
  if (!Array.isArray(data.data)) {
    issues.push('data should be an array');
  }
  
  return issues;
}

/**
 * Run all test cases
 */
async function runTests() {
  console.log('🧪 Starting Sales History Pagination Tests...\n');

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
      
      // Validate pagination structure
      const validationIssues = validatePaginationResponse(result.data, testCase.name);
      
      if (validationIssues.length === 0) {
        console.log('✅ Pagination structure valid');
        
        const { pagination, data } = result.data;
        console.log(`📊 Results: Page ${pagination.page} of ${pagination.pages}`);
        console.log(`📈 Records: ${data.length} of ${pagination.total} total`);
        console.log(`🔢 Range: ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)}`);
        
        if (data.length > 0) {
          const firstSale = data[0];
          console.log(`📅 First sale: ${new Date(firstSale.createdAt).toLocaleDateString()}`);
        }
      } else {
        console.log('❌ Pagination validation issues:');
        validationIssues.forEach(issue => console.log(`   - ${issue}`));
      }
    } else {
      console.log(`❌ Status: ${result.status}`);
      console.log(`💬 Message: ${result.data?.message || result.error}`);
    }
    
    console.log('─'.repeat(50));
  }

  console.log('\n🎉 Tests completed!');
  console.log('\n📋 Frontend Testing Checklist:');
  console.log('1. ✅ Open http://localhost:3000/store-panel/sales');
  console.log('2. ✅ Switch to "Sales History" tab');
  console.log('3. ✅ Verify pagination controls appear (if >20 sales)');
  console.log('4. ✅ Test page navigation using numbers and Previous/Next');
  console.log('5. ✅ Verify current page highlighting');
  console.log('6. ✅ Test pagination with date filters');
  console.log('7. ✅ Verify count displays are accurate');
  console.log('8. ✅ Test responsive design on mobile');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest, testCases, validatePaginationResponse };
