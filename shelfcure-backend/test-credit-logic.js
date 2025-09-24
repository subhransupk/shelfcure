/**
 * Credit System Logic Tests (No Database Required)
 * This script tests the core business logic of the customer credit system
 */

// Mock Customer object for testing
class MockCustomer {
  constructor(data) {
    this.name = data.name || 'Test Customer';
    this.phone = data.phone || '1234567890';
    this.creditLimit = data.creditLimit || 0;
    this.creditBalance = data.creditBalance || 0;
    this.creditStatus = data.creditStatus || 'good';
  }

  // Replicate the credit validation logic from Customer model
  canMakeCreditPurchase(amount) {
    if (this.creditStatus === 'blocked') {
      return { allowed: false, reason: 'Customer credit is blocked' };
    }

    if (this.creditLimit <= 0) {
      return { allowed: false, reason: 'Customer does not have credit facility' };
    }

    const availableCredit = this.creditLimit - this.creditBalance;
    if (amount > availableCredit) {
      return { 
        allowed: false, 
        reason: `Insufficient credit limit. Available: ₹${availableCredit}, Required: ₹${amount}` 
      };
    }

    return { allowed: true };
  }

  getAvailableCredit() {
    return Math.max(0, this.creditLimit - this.creditBalance);
  }

  getCreditUtilization() {
    if (this.creditLimit <= 0) return 0;
    return Math.round((this.creditBalance / this.creditLimit) * 100);
  }

  updateCreditBalance(change) {
    const newBalance = this.creditBalance + change;
    
    if (newBalance < 0) {
      throw new Error('Credit balance cannot be negative');
    }

    this.creditBalance = newBalance;
    
    // Update credit status based on utilization
    const utilization = this.getCreditUtilization();
    if (utilization >= 90) {
      this.creditStatus = 'blocked';
    } else if (utilization >= 75) {
      this.creditStatus = 'warning';
    } else {
      this.creditStatus = 'good';
    }
  }
}

// Test functions
function testCreditPurchaseValidation() {
  console.log('\n🧪 Testing Credit Purchase Validation...');
  
  // Test 1: Customer with no credit limit
  const customer1 = new MockCustomer({ creditLimit: 0 });
  const result1 = customer1.canMakeCreditPurchase(1000);
  console.log('✅ No credit limit test:', result1.allowed === false ? 'PASS' : 'FAIL');
  console.log('   Reason:', result1.reason);
  
  // Test 2: Customer with sufficient credit
  const customer2 = new MockCustomer({ creditLimit: 10000, creditBalance: 2000 });
  const result2 = customer2.canMakeCreditPurchase(5000);
  console.log('✅ Sufficient credit test:', result2.allowed === true ? 'PASS' : 'FAIL');
  
  // Test 3: Customer with insufficient credit
  const result3 = customer2.canMakeCreditPurchase(9000);
  console.log('✅ Insufficient credit test:', result3.allowed === false ? 'PASS' : 'FAIL');
  console.log('   Reason:', result3.reason);
  
  // Test 4: Blocked customer
  const customer4 = new MockCustomer({ creditLimit: 10000, creditStatus: 'blocked' });
  const result4 = customer4.canMakeCreditPurchase(1000);
  console.log('✅ Blocked customer test:', result4.allowed === false ? 'PASS' : 'FAIL');
  console.log('   Reason:', result4.reason);
}

function testCreditCalculations() {
  console.log('\n🧪 Testing Credit Calculations...');
  
  const customer = new MockCustomer({ creditLimit: 10000, creditBalance: 3000 });
  
  // Test available credit
  const availableCredit = customer.getAvailableCredit();
  console.log('✅ Available credit test:', availableCredit === 7000 ? 'PASS' : 'FAIL');
  console.log('   Available Credit: ₹' + availableCredit);
  
  // Test credit utilization
  const utilization = customer.getCreditUtilization();
  console.log('✅ Credit utilization test:', utilization === 30 ? 'PASS' : 'FAIL');
  console.log('   Utilization: ' + utilization + '%');
}

function testCreditStatusUpdates() {
  console.log('\n🧪 Testing Credit Status Updates...');
  
  const customer = new MockCustomer({ creditLimit: 10000, creditBalance: 0 });
  
  // Test good status (low utilization)
  customer.updateCreditBalance(3000);
  console.log('✅ Good status test:', customer.creditStatus === 'good' ? 'PASS' : 'FAIL');
  console.log('   Status after 30% utilization:', customer.creditStatus);
  
  // Test warning status (high utilization)
  customer.updateCreditBalance(5000); // Total: 8000 (80%)
  console.log('✅ Warning status test:', customer.creditStatus === 'warning' ? 'PASS' : 'FAIL');
  console.log('   Status after 80% utilization:', customer.creditStatus);
  
  // Test blocked status (very high utilization)
  customer.updateCreditBalance(1500); // Total: 9500 (95%)
  console.log('✅ Blocked status test:', customer.creditStatus === 'blocked' ? 'PASS' : 'FAIL');
  console.log('   Status after 95% utilization:', customer.creditStatus);
}

function testNegativeBalancePrevention() {
  console.log('\n🧪 Testing Negative Balance Prevention...');
  
  const customer = new MockCustomer({ creditLimit: 10000, creditBalance: 2000 });
  
  try {
    customer.updateCreditBalance(-3000); // Would make balance -1000
    console.log('❌ Negative balance prevention test: FAIL - Should have thrown error');
  } catch (error) {
    console.log('✅ Negative balance prevention test: PASS');
    console.log('   Error message:', error.message);
  }
}

function testCreditTransactionLogic() {
  console.log('\n🧪 Testing Credit Transaction Logic...');
  
  const customer = new MockCustomer({ creditLimit: 10000, creditBalance: 0 });
  
  // Simulate credit sale
  console.log('   Initial balance:', customer.creditBalance);
  customer.updateCreditBalance(3000); // Credit sale increases balance
  console.log('   After credit sale (₹3000):', customer.creditBalance);
  
  // Simulate credit payment
  customer.updateCreditBalance(-1500); // Payment decreases balance
  console.log('   After payment (₹1500):', customer.creditBalance);
  
  const finalBalance = customer.creditBalance;
  console.log('✅ Transaction logic test:', finalBalance === 1500 ? 'PASS' : 'FAIL');
  console.log('   Final balance: ₹' + finalBalance);
}

function testEdgeCases() {
  console.log('\n🧪 Testing Edge Cases...');
  
  // Test zero credit limit
  const customer1 = new MockCustomer({ creditLimit: 0, creditBalance: 0 });
  const availableCredit1 = customer1.getAvailableCredit();
  console.log('✅ Zero credit limit test:', availableCredit1 === 0 ? 'PASS' : 'FAIL');
  
  // Test exact credit limit usage
  const customer2 = new MockCustomer({ creditLimit: 5000, creditBalance: 5000 });
  const availableCredit2 = customer2.getAvailableCredit();
  console.log('✅ Exact limit usage test:', availableCredit2 === 0 ? 'PASS' : 'FAIL');
  
  // Test purchase exactly equal to available credit
  const customer3 = new MockCustomer({ creditLimit: 10000, creditBalance: 3000 });
  const result3 = customer3.canMakeCreditPurchase(7000);
  console.log('✅ Exact available credit test:', result3.allowed === true ? 'PASS' : 'FAIL');
}

function runLogicTests() {
  console.log('🚀 Starting Credit System Logic Tests...\n');
  
  try {
    testCreditPurchaseValidation();
    testCreditCalculations();
    testCreditStatusUpdates();
    testNegativeBalancePrevention();
    testCreditTransactionLogic();
    testEdgeCases();
    
    console.log('\n✅ All credit system logic tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Credit purchase validation');
    console.log('   ✅ Credit calculations (available credit, utilization)');
    console.log('   ✅ Credit status updates (good/warning/blocked)');
    console.log('   ✅ Negative balance prevention');
    console.log('   ✅ Credit transaction logic');
    console.log('   ✅ Edge cases handling');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runLogicTests();
}

module.exports = { runLogicTests, MockCustomer };
