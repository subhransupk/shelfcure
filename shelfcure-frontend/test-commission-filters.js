// Test script for commission filter functionality
// This can be run in the browser console to test the filtering logic

const testCommissionData = [
  {
    _id: 'comm_1',
    doctor: { name: 'Dr. John Smith', specialization: 'Cardiology' },
    commissionRate: 5,
    commissionAmount: 500,
    status: 'pending',
    prescriptionCount: 10
  },
  {
    _id: 'comm_2',
    doctor: { name: 'Dr. Sarah Johnson', specialization: 'Pediatrics' },
    commissionRate: 12,
    commissionAmount: 1200,
    status: 'paid',
    prescriptionCount: 15
  },
  {
    _id: 'comm_3',
    doctor: { name: 'Dr. Michael Brown', specialization: 'Orthopedics' },
    commissionRate: 18,
    commissionAmount: 1800,
    status: 'pending',
    prescriptionCount: 20
  },
  {
    _id: 'comm_4',
    doctor: { name: 'Dr. Emily Davis', specialization: 'Dermatology' },
    commissionRate: 8,
    commissionAmount: 800,
    status: 'paid',
    prescriptionCount: 12
  },
  {
    _id: 'comm_5',
    doctor: { name: 'Dr. John Wilson', specialization: 'Neurology' },
    commissionRate: 25,
    commissionAmount: 2500,
    status: 'pending',
    prescriptionCount: 25
  }
];

// Filter function (copied from the component)
const filterCommissionHistory = (commissions, doctorNameFilter, commissionRateFilter) => {
  return commissions.filter(commission => {
    // Doctor name filter (case-insensitive partial match)
    if (doctorNameFilter.trim() !== '') {
      const doctorName = commission.doctor?.name?.toLowerCase() || '';
      const searchTerm = doctorNameFilter.toLowerCase().trim();
      if (!doctorName.includes(searchTerm)) {
        return false;
      }
    }

    // Commission rate filter
    if (commissionRateFilter !== 'all') {
      const rate = commission.commissionRate || 0;
      switch (commissionRateFilter) {
        case '0-5':
          if (rate < 0 || rate > 5) return false;
          break;
        case '5-10':
          if (rate < 5 || rate > 10) return false;
          break;
        case '10-15':
          if (rate < 10 || rate > 15) return false;
          break;
        case '15-20':
          if (rate < 15 || rate > 20) return false;
          break;
        case '20+':
          if (rate < 20) return false;
          break;
        default:
          break;
      }
    }

    return true;
  });
};

// Test cases
const testCases = [
  {
    name: 'No filters',
    doctorNameFilter: '',
    commissionRateFilter: 'all',
    expectedCount: 5
  },
  {
    name: 'Doctor name filter - "John"',
    doctorNameFilter: 'John',
    commissionRateFilter: 'all',
    expectedCount: 2 // Dr. John Smith and Dr. John Wilson
  },
  {
    name: 'Doctor name filter - "sarah" (case insensitive)',
    doctorNameFilter: 'sarah',
    commissionRateFilter: 'all',
    expectedCount: 1 // Dr. Sarah Johnson
  },
  {
    name: 'Commission rate filter - "0-5%"',
    doctorNameFilter: '',
    commissionRateFilter: '0-5',
    expectedCount: 1 // Dr. John Smith (5%)
  },
  {
    name: 'Commission rate filter - "5-10%"',
    doctorNameFilter: '',
    commissionRateFilter: '5-10',
    expectedCount: 2 // Dr. John Smith (5%) and Dr. Emily Davis (8%)
  },
  {
    name: 'Commission rate filter - "10-15%"',
    doctorNameFilter: '',
    commissionRateFilter: '10-15',
    expectedCount: 1 // Dr. Sarah Johnson (12%)
  },
  {
    name: 'Commission rate filter - "15-20%"',
    doctorNameFilter: '',
    commissionRateFilter: '15-20',
    expectedCount: 1 // Dr. Michael Brown (18%)
  },
  {
    name: 'Commission rate filter - "20%+"',
    doctorNameFilter: '',
    commissionRateFilter: '20+',
    expectedCount: 1 // Dr. John Wilson (25%)
  },
  {
    name: 'Combined filters - "John" + "20%+"',
    doctorNameFilter: 'John',
    commissionRateFilter: '20+',
    expectedCount: 1 // Dr. John Wilson
  },
  {
    name: 'Combined filters - "Dr." + "5-10%"',
    doctorNameFilter: 'Dr.',
    commissionRateFilter: '5-10',
    expectedCount: 2 // All doctors have "Dr." in name, but only 2 in 5-10% range
  }
];

// Run tests
function runFilterTests() {
  console.log('🧪 Running Commission Filter Tests\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;

  testCases.forEach((testCase, index) => {
    const result = filterCommissionHistory(
      testCommissionData, 
      testCase.doctorNameFilter, 
      testCase.commissionRateFilter
    );
    
    const passed = result.length === testCase.expectedCount;
    const status = passed ? '✅' : '❌';
    
    console.log(`${status} Test ${index + 1}: ${testCase.name}`);
    console.log(`   Expected: ${testCase.expectedCount}, Got: ${result.length}`);
    
    if (!passed) {
      console.log('   Filtered results:', result.map(r => ({
        name: r.doctor.name,
        rate: r.commissionRate
      })));
    }
    
    console.log('');
    
    if (passed) passedTests++;
  });

  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Filter functionality is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the filter logic.');
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runFilterTests = runFilterTests;
  window.testCommissionData = testCommissionData;
  window.filterCommissionHistory = filterCommissionHistory;
  
  console.log('Commission filter test functions loaded!');
  console.log('Run runFilterTests() to test the filtering logic.');
}

// Run tests if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runFilterTests, testCommissionData, filterCommissionHistory };
  runFilterTests();
}
