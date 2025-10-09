const mongoose = require('mongoose');
require('dotenv').config();

async function checkPaymentData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Sale = require('../models/Sale');
    const Store = require('../models/Store');
    
    console.log('=== CHECKING PAYMENT DATA IN DEMO STORE ===');
    
    const demoStore = await Store.findOne({ code: 'ST9508' });
    if (!demoStore) {
      console.log('Demo store not found');
      return;
    }
    
    const sales = await Sale.find({ store: demoStore._id })
      .select('receiptNumber paymentStatus paymentMethod totalAmount')
      .sort({ createdAt: -1 });
    
    console.log('Sales payment data:');
    sales.forEach(sale => {
      console.log(`Receipt: ${sale.receiptNumber}, Status: ${sale.paymentStatus}, Method: ${sale.paymentMethod}, Amount: ${sale.totalAmount}`);
    });
    
    console.log('\n=== PAYMENT STATUS SUMMARY ===');
    const statusCounts = {};
    const methodCounts = {};
    
    sales.forEach(sale => {
      statusCounts[sale.paymentStatus] = (statusCounts[sale.paymentStatus] || 0) + 1;
      methodCounts[sale.paymentMethod] = (methodCounts[sale.paymentMethod] || 0) + 1;
    });
    
    console.log('Payment Status counts:', statusCounts);
    console.log('Payment Method counts:', methodCounts);
    
    console.log('\n=== TESTING CREDIT FILTER ===');
    const creditSales = await Sale.find({
      store: demoStore._id,
      $or: [
        { paymentStatus: 'pending' },
        { paymentStatus: 'partial' }
      ]
    }).select('receiptNumber paymentStatus paymentMethod');
    
    console.log('Sales matching credit filter (pending/partial):');
    creditSales.forEach(sale => {
      console.log(`Receipt: ${sale.receiptNumber}, Status: ${sale.paymentStatus}, Method: ${sale.paymentMethod}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaymentData();
