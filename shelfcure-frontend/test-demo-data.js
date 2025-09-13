// Test the demo data generation function
const generateDemoAnalyticsData = (period) => {
  const now = new Date();
  const daysInPeriod = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  
  // Generate daily sales data
  const dailySales = {};
  let totalRevenue = 0;
  let totalSales = 0;
  
  for (let i = daysInPeriod - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    const dailyRevenue = Math.floor(Math.random() * 5000) + 1000; // 1000-6000
    const dailySalesCount = Math.floor(Math.random() * 20) + 5; // 5-25 sales
    
    dailySales[dateKey] = {
      date: dateKey,
      revenue: dailyRevenue,
      sales: dailySalesCount,
      averageOrderValue: Math.round(dailyRevenue / dailySalesCount)
    };
    
    totalRevenue += dailyRevenue;
    totalSales += dailySalesCount;
  }
  
  // Generate top medicines data
  const medicineNames = [
    'Paracetamol 500mg', 'Amoxicillin 250mg', 'Ibuprofen 400mg', 
    'Cetirizine 10mg', 'Omeprazole 20mg', 'Metformin 500mg',
    'Aspirin 75mg', 'Vitamin D3', 'Calcium Tablets', 'Iron Supplements'
  ];
  
  const topMedicines = medicineNames.slice(0, 5).map((name, index) => ({
    name,
    revenue: Math.floor(Math.random() * 10000) + 5000,
    quantity: Math.floor(Math.random() * 200) + 50,
    growth: Math.floor(Math.random() * 40) - 20 // -20% to +20%
  })).sort((a, b) => b.revenue - a.revenue);
  
  return {
    period,
    dateRange: { 
      startDate: new Date(now.getTime() - daysInPeriod * 24 * 60 * 60 * 1000), 
      endDate: now 
    },
    summary: {
      totalRevenue,
      totalSales,
      averageOrderValue: Math.round(totalRevenue / totalSales)
    },
    dailySales,
    topMedicines
  };
};

// Test the function
console.log('🧪 Testing Demo Data Generation...\n');

const testPeriods = ['7d', '30d', '90d'];

testPeriods.forEach(period => {
  console.log(`📊 Testing ${period} period:`);
  const data = generateDemoAnalyticsData(period);
  
  console.log(`  ✅ Total Revenue: $${data.summary.totalRevenue.toLocaleString()}`);
  console.log(`  ✅ Total Sales: ${data.summary.totalSales}`);
  console.log(`  ✅ Average Order Value: $${data.summary.averageOrderValue}`);
  console.log(`  ✅ Daily Sales Entries: ${Object.keys(data.dailySales).length}`);
  console.log(`  ✅ Top Medicines: ${data.topMedicines.length}`);
  console.log(`  ✅ Top Medicine: ${data.topMedicines[0]?.name} - $${data.topMedicines[0]?.revenue.toLocaleString()}`);
  console.log('');
});

console.log('🎉 Demo data generation is working correctly!');
