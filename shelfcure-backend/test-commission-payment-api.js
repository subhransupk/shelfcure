const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:5000',
  testEmail: 'manager@some-pharmacy.com',
  testPassword: 'manager123'
};

async function testCommissionPaymentAPI() {
  console.log('🧪 Testing Commission Payment API...\n');

  try {
    // Step 1: Login as store manager
    console.log('1️⃣ Logging in as store manager...');
    const loginResponse = await axios.post(`${TEST_CONFIG.baseURL}/api/auth/login`, {
      email: TEST_CONFIG.testEmail,
      password: TEST_CONFIG.testPassword
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Get doctors list to find a doctor
    console.log('\n2️⃣ Fetching doctors list...');
    const doctorsResponse = await axios.get(`${TEST_CONFIG.baseURL}/api/store-manager/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!doctorsResponse.data.success || !doctorsResponse.data.data.length) {
      console.log('⚠️ No doctors found. Please add a doctor first.');
      return;
    }

    const testDoctor = doctorsResponse.data.data[0];
    console.log(`✅ Found doctor: Dr. ${testDoctor.name}`);

    // Step 3: Test the new commission history API
    console.log('\n3️⃣ Testing commission history API...');
    try {
      const commissionHistoryResponse = await axios.get(
        `${TEST_CONFIG.baseURL}/api/store-manager/doctors/${testDoctor._id}/commission-history`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (commissionHistoryResponse.data.success) {
        console.log('✅ Commission history API working');
        const data = commissionHistoryResponse.data.data;
        
        console.log('\n📊 Commission Summary:');
        console.log(`   Doctor: Dr. ${data.doctor?.name}`);
        console.log(`   Total Earned: ₹${data.summary?.totalCommissionEarned?.toLocaleString() || 0}`);
        console.log(`   Total Paid: ₹${data.summary?.totalCommissionPaid?.toLocaleString() || 0}`);
        console.log(`   Pending: ₹${data.summary?.pendingCommissionAmount?.toLocaleString() || 0}`);
        console.log(`   Payment Status: ${data.summary?.paymentStatus || 'Unknown'}`);
        console.log(`   Commission Records: ${data.commissions?.length || 0}`);
        console.log(`   Payment History: ${data.paymentHistory?.length || 0} payments`);

        // Step 4: Test commission payment recording (if there are pending commissions)
        if (data.commissions && data.commissions.length > 0) {
          const pendingCommission = data.commissions.find(c => c.status === 'pending' && c.remainingBalance > 0);
          
          if (pendingCommission) {
            console.log('\n4️⃣ Testing commission payment recording...');
            
            const paymentData = {
              amount: Math.min(100, pendingCommission.remainingBalance), // Pay ₹100 or remaining balance
              paymentMethod: 'upi',
              paymentReference: 'TEST_UPI_' + Date.now(),
              notes: 'Test payment via API'
            };

            try {
              const paymentResponse = await axios.post(
                `${TEST_CONFIG.baseURL}/api/store-manager/doctors/commissions/${pendingCommission._id}/record-payment`,
                paymentData,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );

              if (paymentResponse.data.success) {
                console.log('✅ Payment recording API working');
                console.log(`   Payment Amount: ₹${paymentData.amount}`);
                console.log(`   Payment Method: ${paymentData.paymentMethod}`);
                console.log(`   New Balance: ₹${paymentResponse.data.data.paymentRecorded?.newBalance?.toLocaleString() || 0}`);
                console.log(`   Payment Status: ${paymentResponse.data.data.paymentRecorded?.paymentStatus}`);
              } else {
                console.log('❌ Payment recording failed:', paymentResponse.data.message);
              }
            } catch (paymentError) {
              console.log('❌ Payment recording API error:', paymentError.response?.data?.message || paymentError.message);
            }
          } else {
            console.log('⚠️ No pending commissions found to test payment recording');
          }
        }

      } else {
        console.log('❌ Commission history API failed:', commissionHistoryResponse.data.message);
      }
    } catch (historyError) {
      console.log('❌ Commission history API error:', historyError.response?.data?.message || historyError.message);
    }

    console.log('\n🎉 Commission Payment API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testCommissionPaymentAPI();
