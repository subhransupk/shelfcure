const aiService = require('./services/geminiAIService');

async function testAICapabilities() {
  console.log('🧪 COMPREHENSIVE AI STORE ASSISTANT CAPABILITY TEST');
  console.log('=' .repeat(60));
  const mockContext = {
    store: { _id: '507f1f77bcf86cd799439011', name: 'Test Store' },
    user: { _id: '507f1f77bcf86cd799439012', name: 'Test User' }
  };

  let totalTests = 0;
  let passedTests = 0;

  // Test 1: Medicine Data Extraction
  console.log('\n📋 TEST 1: Medicine Data Extraction');
  totalTests++;
  try {
    const medicineData = aiService.extractMedicineData("Add medicine 'Paracetamol' with manufacturer 'ABC Pharma' category 'Tablet' composition 'Paracetamol 500mg'");
    
    if (medicineData && 
        medicineData.name === 'Paracetamol' && 
        medicineData.category === 'Tablet' &&
        medicineData.composition === 'Paracetamol 500mg' &&
        medicineData.manufacturer === 'ABC Pharma') {
      console.log('✅ Medicine data extraction: PASSED');
      passedTests++;
    } else {
      console.log('❌ Medicine data extraction: FAILED');
      console.log('Expected valid medicine data, got:', medicineData);
    }
  } catch (error) {
    console.log('❌ Medicine data extraction: ERROR -', error.message);
  }

  // Test 2: Customer Data Extraction
  console.log('\n👥 TEST 2: Customer Data Extraction');
  totalTests++;
  try {
    const customerData = aiService.extractCustomerData("Add customer 'John Doe' with phone number 9876543210 and email john@example.com gender male");
    
    if (customerData && 
        customerData.name === 'John Doe' && 
        customerData.phone === '9876543210' &&
        customerData.email === 'john@example.com' &&
        customerData.gender === 'male') {
      console.log('✅ Customer data extraction: PASSED');
      passedTests++;
    } else {
      console.log('❌ Customer data extraction: FAILED');
      console.log('Expected valid customer data, got:', customerData);
    }
  } catch (error) {
    console.log('❌ Customer data extraction: ERROR -', error.message);
  }

  // Test 3: Doctor Data Extraction
  console.log('\n👨‍⚕️ TEST 3: Doctor Data Extraction');
  totalTests++;
  try {
    const doctorData = aiService.extractDoctorData("Add doctor 'Dr. Smith' with phone number 9876543210 specialization 'Cardiology' email dr.smith@hospital.com");
    
    if (doctorData && 
        doctorData.name === 'Dr. Smith' && 
        doctorData.phone === '9876543210' &&
        doctorData.specialization === 'Cardiology') {
      console.log('✅ Doctor data extraction: PASSED');
      passedTests++;
    } else {
      console.log('❌ Doctor data extraction: FAILED');
      console.log('Expected valid doctor data, got:', doctorData);
    }
  } catch (error) {
    console.log('❌ Doctor data extraction: ERROR -', error.message);
  }

  // Test 4: Staff Data Extraction
  console.log('\n👩‍💼 TEST 4: Staff Data Extraction');
  totalTests++;
  try {
    const staffData = aiService.extractStaffData("Add staff member 'Jane Doe' with phone number 9876543210 role 'pharmacist' email jane@store.com");
    
    if (staffData && 
        staffData.name === 'Jane Doe' && 
        staffData.phone === '9876543210' &&
        staffData.role === 'pharmacist') {
      console.log('✅ Staff data extraction: PASSED');
      passedTests++;
    } else {
      console.log('❌ Staff data extraction: FAILED');
      console.log('Expected valid staff data, got:', staffData);
    }
  } catch (error) {
    console.log('❌ Staff data extraction: ERROR -', error.message);
  }

  // Test 5: Method Availability Check
  console.log('\n🔧 TEST 5: Method Availability Check');
  totalTests++;
  try {
    const hasInventoryHandler = typeof aiService.handleInventoryActions === 'function';
    const hasCustomerHandler = typeof aiService.handleCustomerActions === 'function';
    const hasDoctorHandler = typeof aiService.handleDoctorActions === 'function';
    const hasStaffHandler = typeof aiService.handleStaffActions === 'function';
    const hasReturnHandler = typeof aiService.handleReturnActions === 'function';

    if (hasInventoryHandler && hasCustomerHandler && hasDoctorHandler && hasStaffHandler && hasReturnHandler) {
      console.log('✅ Method availability: PASSED');
      passedTests++;
    } else {
      console.log('❌ Method availability: FAILED');
      console.log(`Inventory: ${hasInventoryHandler}, Customer: ${hasCustomerHandler}, Doctor: ${hasDoctorHandler}, Staff: ${hasStaffHandler}, Return: ${hasReturnHandler}`);
    }
  } catch (error) {
    console.log('❌ Method availability: ERROR -', error.message);
  }

  // Test 6: Data Extraction Methods
  console.log('\n📊 TEST 6: Data Extraction Methods');
  totalTests++;
  try {
    const hasMedicineExtractor = typeof aiService.extractMedicineData === 'function';
    const hasCustomerExtractor = typeof aiService.extractCustomerData === 'function';
    const hasDoctorExtractor = typeof aiService.extractDoctorData === 'function';
    const hasStaffExtractor = typeof aiService.extractStaffData === 'function';
    const hasReturnExtractor = typeof aiService.extractReturnData === 'function';

    if (hasMedicineExtractor && hasCustomerExtractor && hasDoctorExtractor && hasStaffExtractor && hasReturnExtractor) {
      console.log('✅ Data extraction methods: PASSED');
      passedTests++;
    } else {
      console.log('❌ Data extraction methods: FAILED');
      console.log(`Medicine: ${hasMedicineExtractor}, Customer: ${hasCustomerExtractor}, Doctor: ${hasDoctorExtractor}, Staff: ${hasStaffExtractor}, Return: ${hasReturnExtractor}`);
    }
  } catch (error) {
    console.log('❌ Data extraction methods: ERROR -', error.message);
  }

  // Test 7: Category Validation
  console.log('\n📋 TEST 7: Category Validation');
  totalTests++;
  try {
    const medicineData1 = aiService.extractMedicineData("Add medicine 'Test' category 'tablet'");
    const medicineData2 = aiService.extractMedicineData("Add medicine 'Test' category 'invalid_category'");

    if (medicineData1 && medicineData1.category === 'Tablet' &&
        medicineData2 && medicineData2.category === 'Other') {
      console.log('✅ Category validation: PASSED');
      passedTests++;
    } else {
      console.log('❌ Category validation: FAILED');
      console.log('Expected Tablet and Other, got:', medicineData1?.category, medicineData2?.category);
    }
  } catch (error) {
    console.log('❌ Category validation: ERROR -', error.message);
  }

  // Test 8: Gender Validation
  console.log('\n👤 TEST 8: Gender Validation');
  totalTests++;
  try {
    const customerData1 = aiService.extractCustomerData("Add customer 'Test' with phone number 9876543210 gender male");
    const customerData2 = aiService.extractCustomerData("Add customer 'Test' with phone number 9876543210 gender invalid");

    if (customerData1 && customerData1.gender === 'male' &&
        customerData2 && customerData2.gender === undefined) {
      console.log('✅ Gender validation: PASSED');
      passedTests++;
    } else {
      console.log('❌ Gender validation: FAILED');
      console.log('Expected male and undefined, got:', customerData1?.gender, customerData2?.gender);
    }
  } catch (error) {
    console.log('❌ Gender validation: ERROR -', error.message);
  }

  // Test 9: Database Schema Compliance
  console.log('\n🗄️ TEST 9: Database Schema Compliance');
  totalTests++;
  try {
    const medicineData = aiService.extractMedicineData("Add medicine 'Aspirin' category 'tablet' manufacturer 'XYZ Pharma'");

    if (medicineData &&
        medicineData.category === 'Tablet' && // Should be capitalized
        medicineData.composition && // Should be present
        medicineData.stripInfo && // Should have dual unit structure
        medicineData.individualInfo) {
      console.log('✅ Database schema compliance: PASSED');
      passedTests++;
    } else {
      console.log('❌ Database schema compliance: FAILED');
      console.log('Expected schema-compliant data, got:', medicineData);
    }
  } catch (error) {
    console.log('❌ Database schema compliance: ERROR -', error.message);
  }

  // Test 10: Staff Role Validation
  console.log('\n👔 TEST 10: Staff Role Validation');
  totalTests++;
  try {
    const staffData1 = aiService.extractStaffData("Add staff member 'Test' role 'pharmacist'");
    const staffData2 = aiService.extractStaffData("Add staff member 'Test' role 'invalid role'");

    if (staffData1 && staffData1.role === 'pharmacist' &&
        staffData2 && staffData2.role === 'assistant') {
      console.log('✅ Staff role validation: PASSED');
      passedTests++;
    } else {
      console.log('❌ Staff role validation: FAILED');
      console.log('Expected pharmacist and assistant, got:', staffData1?.role, staffData2?.role);
    }
  } catch (error) {
    console.log('❌ Staff role validation: ERROR -', error.message);
  }

  // Final Results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! AI Store Assistant is fully functional.');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('\n✅ MOSTLY FUNCTIONAL! AI Store Assistant has good capabilities with minor issues.');
  } else if (passedTests >= totalTests * 0.6) {
    console.log('\n⚠️ PARTIALLY FUNCTIONAL! AI Store Assistant needs improvements.');
  } else {
    console.log('\n❌ MAJOR ISSUES! AI Store Assistant requires significant fixes.');
  }
}

// Run the test
testAICapabilities().catch(console.error);
