/**
 * AI Data Service - Provides real data access for AI Assistant
 * This service fetches actual data from the ShelfCure database
 */

const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Staff = require('../models/Staff');
const Store = require('../models/Store');
const mongoose = require('mongoose');

class AIDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.dbTimeout = 8000; // 8 second timeout for database operations
  }

  /**
   * Execute database operation with timeout protection
   */
  async withTimeout(operation, operationName = 'database operation') {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${this.dbTimeout}ms`));
      }, this.dbTimeout);

      try {
        const result = await operation();
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Validate and convert store ID to ObjectId
   */
  validateStoreId(storeId) {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    // If it's already an ObjectId, return it
    if (mongoose.Types.ObjectId.isValid(storeId)) {
      return new mongoose.Types.ObjectId(storeId);
    }

    throw new Error(`Invalid store ID format: ${storeId}`);
  }

  /**
   * Get cached data or fetch fresh data
   */
  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const data = await fetchFunction();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching data for key ${key}:`, error);
      // Return cached data if available, even if expired
      if (cached) {
        console.log(`Using expired cache for key ${key}`);
        return cached.data;
      }
      // Return empty data structure to prevent crashes
      return this.getEmptyDataStructure(key);
    }
  }

  /**
   * Get empty data structure for fallback
   */
  getEmptyDataStructure(key) {
    if (key.includes('sales')) return { totalAmount: 0, count: 0, sales: [] };
    if (key.includes('medicines')) return [];
    if (key.includes('customers')) return [];
    if (key.includes('suppliers')) return [];
    if (key.includes('analytics')) return {
      todaysSales: { totalAmount: 0, count: 0 },
      monthlySales: { totalAmount: 0, count: 0 },
      lowStockCount: 0,
      expiringCount: 0,
      topCustomers: []
    };
    return {};
  }

  /**
   * Get today's sales data with enhanced metrics
   */
  async getTodaysSales(storeId) {
    const cacheKey = `today_sales_${storeId}`;
    return await this.getCachedData(cacheKey, async () => {
      const validStoreId = this.validateStoreId(storeId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sales = await Sale.find({
        store: validStoreId,
        createdAt: { $gte: today, $lt: tomorrow }
      }).populate('customer', 'name phone').populate('items.medicine', 'name genericName');

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalTransactions = sales.length;
      const totalItemsSold = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
      const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Calculate hourly breakdown
      const hourlyBreakdown = {};
      sales.forEach(sale => {
        const hour = sale.createdAt.getHours();
        if (!hourlyBreakdown[hour]) {
          hourlyBreakdown[hour] = { revenue: 0, transactions: 0 };
        }
        hourlyBreakdown[hour].revenue += sale.totalAmount;
        hourlyBreakdown[hour].transactions += 1;
      });

      // Get top selling medicines today
      const medicinesSold = {};
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const medicineName = item.medicine?.name || 'Unknown Medicine';
          if (!medicinesSold[medicineName]) {
            medicinesSold[medicineName] = { quantity: 0, revenue: 0 };
          }
          medicinesSold[medicineName].quantity += item.quantity;
          medicinesSold[medicineName].revenue += item.totalPrice;
        });
      });

      const topMedicines = Object.entries(medicinesSold)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      return {
        totalRevenue,
        totalTransactions,
        totalItemsSold,
        averageTransaction,
        hourlyBreakdown,
        topMedicines,
        recentSales: sales.slice(0, 10).map(sale => ({
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customer?.name || 'Walk-in Customer',
          totalAmount: sale.totalAmount,
          itemCount: sale.items.length,
          createdAt: sale.createdAt
        }))
      };
    });
  }

  /**
   * Get monthly sales data
   */
  async getMonthlySales(storeId, year = null, month = null) {
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month !== null ? month : currentDate.getMonth();

    const cacheKey = `monthly_sales_${storeId}_${targetYear}_${targetMonth}`;
    return await this.getCachedData(cacheKey, async () => {
      const validStoreId = this.validateStoreId(storeId);
      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 1);

      const sales = await Sale.find({
        store: validStoreId,
        createdAt: { $gte: startDate, $lt: endDate }
      }).populate('customer', 'name phone');

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalTransactions = sales.length;
      const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Group by day for daily breakdown
      const dailyBreakdown = {};
      sales.forEach(sale => {
        const day = sale.createdAt.getDate();
        if (!dailyBreakdown[day]) {
          dailyBreakdown[day] = { revenue: 0, transactions: 0 };
        }
        dailyBreakdown[day].revenue += sale.totalAmount;
        dailyBreakdown[day].transactions += 1;
      });

      return {
        totalRevenue,
        totalTransactions,
        averageTransaction,
        dailyBreakdown,
        monthName: startDate.toLocaleString('default', { month: 'long', year: 'numeric' })
      };
    });
  }

  /**
   * Get low stock medicines with enhanced analysis
   */
  async getLowStockMedicines(storeId, threshold = 10) {
    const cacheKey = `low_stock_${storeId}_${threshold}`;
    return await this.getCachedData(cacheKey, async () => {
      const validStoreId = this.validateStoreId(storeId);
      const medicines = await Medicine.find({
        store: validStoreId,
        $or: [
          { 'inventory.strips': { $lte: threshold } },
          { 'inventory.units': { $lte: threshold } }
        ]
      }).select('name genericName manufacturer inventory pricing category location reorderLevel');

      return medicines.map(med => {
        const totalUnits = (med.inventory.strips * (med.inventory.unitsPerStrip || 1)) + med.inventory.units;
        const reorderLevel = med.reorderLevel || threshold;
        const urgencyLevel = totalUnits <= reorderLevel * 0.3 ? 'Critical' :
                           totalUnits <= reorderLevel * 0.6 ? 'High' : 'Medium';

        return {
          name: med.name,
          genericName: med.genericName,
          manufacturer: med.manufacturer,
          category: med.category,
          location: med.location,
          stripsInStock: med.inventory.strips,
          unitsInStock: med.inventory.units,
          totalUnits,
          reorderLevel,
          urgencyLevel,
          stripPrice: med.pricing.stripPrice,
          unitPrice: med.pricing.unitPrice,
          currentStock: `${med.inventory.strips} strips, ${med.inventory.units} units`,
          unit: med.inventory.strips > 0 ? 'strips' : 'units'
        };
      }).sort((a, b) => {
        // Sort by urgency: Critical > High > Medium
        const urgencyOrder = { 'Critical': 3, 'High': 2, 'Medium': 1 };
        return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
      });
    });
  }

  /**
   * Get expiring medicines
   */
  async getExpiringMedicines(storeId, daysAhead = 30) {
    const cacheKey = `expiring_${storeId}_${daysAhead}`;
    return await this.getCachedData(cacheKey, async () => {
      const validStoreId = this.validateStoreId(storeId);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const medicines = await Medicine.find({
        store: validStoreId,
        'batches.expiryDate': { $lte: futureDate }
      }).select('name genericName manufacturer batches');

      const expiringMedicines = [];
      medicines.forEach(med => {
        med.batches.forEach(batch => {
          if (batch.expiryDate <= futureDate) {
            expiringMedicines.push({
              name: med.name,
              genericName: med.genericName,
              manufacturer: med.manufacturer,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
              quantity: batch.quantity,
              daysUntilExpiry: Math.ceil((batch.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
            });
          }
        });
      });

      return expiringMedicines.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    });
  }

  /**
   * Get customer information
   */
  async getCustomerInfo(storeId, searchTerm) {
    const validStoreId = this.validateStoreId(storeId);
    const customers = await Customer.find({
      store: validStoreId,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    }).limit(10);

    return customers.map(customer => ({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      totalPurchases: customer.totalPurchases || 0,
      lastVisit: customer.lastVisit
    }));
  }

  /**
   * Get top customers
   */
  async getTopCustomers(storeId, limit = 10) {
    const cacheKey = `top_customers_${storeId}_${limit}`;
    return await this.getCachedData(cacheKey, async () => {
      const validStoreId = this.validateStoreId(storeId);
      const customers = await Customer.find({ store: validStoreId })
        .sort({ totalPurchases: -1 })
        .limit(limit)
        .select('name phone email totalPurchases lastVisit');

      return customers.map(customer => ({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalPurchases: customer.totalPurchases || 0,
        lastVisit: customer.lastVisit
      }));
    });
  }

  /**
   * Get supplier information
   */
  async getSuppliers(storeId) {
    const cacheKey = `suppliers_${storeId}`;
    return await this.getCachedData(cacheKey, async () => {
      const validStoreId = this.validateStoreId(storeId);
      const suppliers = await Supplier.find({ store: validStoreId })
        .select('name contactPerson phone email address');

      return suppliers.map(supplier => ({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address
      }));
    });
  }

  /**
   * Get pending purchases
   */
  async getPendingPurchases(storeId) {
    const cacheKey = `pending_purchases_${storeId}`;
    return await this.getCachedData(cacheKey, async () => {
      const validStoreId = this.validateStoreId(storeId);
      const purchases = await Purchase.find({
        store: validStoreId,
        status: { $in: ['pending', 'ordered'] }
      }).populate('supplier', 'name').select('purchaseNumber supplier totalAmount status createdAt');

      return purchases.map(purchase => ({
        purchaseNumber: purchase.purchaseNumber,
        supplierName: purchase.supplier?.name || 'Unknown',
        totalAmount: purchase.totalAmount,
        status: purchase.status,
        purchaseDate: purchase.createdAt
      }));
    });
  }

  /**
   * Get store analytics summary
   */
  async getStoreAnalytics(storeId) {
    const cacheKey = `analytics_${storeId}`;
    return await this.getCachedData(cacheKey, async () => {
      const [todaysSales, monthlySales, lowStock, expiring, topCustomers] = await Promise.all([
        this.getTodaysSales(storeId),
        this.getMonthlySales(storeId),
        this.getLowStockMedicines(storeId),
        this.getExpiringMedicines(storeId),
        this.getTopCustomers(storeId, 5)
      ]);

      return {
        todaysSales,
        monthlySales,
        lowStockCount: lowStock.length,
        expiringCount: expiring.length,
        topCustomers
      };
    });
  }

  /**
   * Clear cache for a specific store
   */
  clearStoreCache(storeId) {
    for (const key of this.cache.keys()) {
      if (key.includes(storeId)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Get medicine search results
   */
  async searchMedicines(storeId, searchTerm, limit = 20) {
    const validStoreId = this.validateStoreId(storeId);
    const medicines = await Medicine.find({
      store: validStoreId,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { genericName: { $regex: searchTerm, $options: 'i' } },
        { manufacturer: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } }
      ]
    }).limit(limit).select('name genericName manufacturer category inventory pricing location');

    return medicines.map(med => ({
      name: med.name,
      genericName: med.genericName,
      manufacturer: med.manufacturer,
      category: med.category,
      location: med.location,
      stripsInStock: med.inventory.strips,
      unitsInStock: med.inventory.units,
      stripPrice: med.pricing.stripPrice,
      unitPrice: med.pricing.unitPrice,
      available: (med.inventory.strips > 0 || med.inventory.units > 0)
    }));
  }

  /**
   * Get sales comparison data
   */
  async getSalesComparison(storeId, period = 'month') {
    const cacheKey = `sales_comparison_${storeId}_${period}`;
    return await this.getCachedData(cacheKey, async () => {
      const now = new Date();
      let currentStart, currentEnd, previousStart, previousEnd;

      if (period === 'month') {
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (period === 'week') {
        const dayOfWeek = now.getDay();
        currentStart = new Date(now);
        currentStart.setDate(now.getDate() - dayOfWeek);
        currentStart.setHours(0, 0, 0, 0);
        currentEnd = new Date(currentStart);
        currentEnd.setDate(currentStart.getDate() + 7);
        previousStart = new Date(currentStart);
        previousStart.setDate(currentStart.getDate() - 7);
        previousEnd = new Date(currentStart);
      }

      const validStoreId = this.validateStoreId(storeId);
      const [currentSales, previousSales] = await Promise.all([
        Sale.find({ store: validStoreId, createdAt: { $gte: currentStart, $lt: currentEnd } }),
        Sale.find({ store: validStoreId, createdAt: { $gte: previousStart, $lt: previousEnd } })
      ]);

      const currentRevenue = currentSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const previousRevenue = previousSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const currentTransactions = currentSales.length;
      const previousTransactions = previousSales.length;
      const transactionChange = previousTransactions > 0 ? ((currentTransactions - previousTransactions) / previousTransactions) * 100 : 0;

      return {
        period,
        current: {
          revenue: currentRevenue,
          transactions: currentTransactions,
          averageTransaction: currentTransactions > 0 ? currentRevenue / currentTransactions : 0
        },
        previous: {
          revenue: previousRevenue,
          transactions: previousTransactions,
          averageTransaction: previousTransactions > 0 ? previousRevenue / previousTransactions : 0
        },
        changes: {
          revenue: revenueChange,
          transactions: transactionChange,
          revenueDirection: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'same',
          transactionDirection: transactionChange > 0 ? 'up' : transactionChange < 0 ? 'down' : 'same'
        }
      };
    });
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary(storeId) {
    const cacheKey = `inventory_summary_${storeId}`;
    return await this.getCachedData(cacheKey, async () => {
      const validStoreId = this.validateStoreId(storeId);
      const medicines = await Medicine.find({ store: validStoreId })
        .select('name inventory category pricing');

      const totalMedicines = medicines.length;
      const totalValue = medicines.reduce((sum, med) => {
        const stripValue = (med.inventory.strips || 0) * (med.pricing.stripPrice || 0);
        const unitValue = (med.inventory.units || 0) * (med.pricing.unitPrice || 0);
        return sum + stripValue + unitValue;
      }, 0);

      const outOfStock = medicines.filter(med =>
        (med.inventory.strips || 0) === 0 && (med.inventory.units || 0) === 0
      ).length;

      const lowStock = medicines.filter(med =>
        (med.inventory.strips || 0) <= 5 || (med.inventory.units || 0) <= 10
      ).length;

      // Category breakdown
      const categoryBreakdown = {};
      medicines.forEach(med => {
        const category = med.category || 'Uncategorized';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { count: 0, value: 0 };
        }
        categoryBreakdown[category].count += 1;
        const stripValue = (med.inventory.strips || 0) * (med.pricing.stripPrice || 0);
        const unitValue = (med.inventory.units || 0) * (med.pricing.unitPrice || 0);
        categoryBreakdown[category].value += stripValue + unitValue;
      });

      return {
        totalMedicines,
        totalValue,
        outOfStock,
        lowStock,
        inStock: totalMedicines - outOfStock,
        categoryBreakdown: Object.entries(categoryBreakdown)
          .map(([category, data]) => ({ category, ...data }))
          .sort((a, b) => b.value - a.value)
      };
    });
  }

  // ==========================================
  // COMPREHENSIVE STORE OPERATIONS METHODS
  // ==========================================

  /**
   * Create a new medicine with complete details and timeout protection
   */
  async createMedicine(storeId, medicineData) {
    const validStoreId = this.validateStoreId(storeId);

    return await this.withTimeout(async () => {
      const medicine = new Medicine({
        store: validStoreId,
        name: medicineData.name,
        composition: medicineData.composition || medicineData.name,
        manufacturer: medicineData.manufacturer || 'Unknown',
        category: medicineData.category || 'Other',
        description: medicineData.description || '',
        unitTypes: medicineData.unitTypes || {
          hasStrips: true,
          hasIndividual: true,
          unitsPerStrip: 10
        },
        stripInfo: medicineData.stripInfo || {
          purchasePrice: 0,
          sellingPrice: 0,
          mrp: 0,
          stock: 0,
          minStock: 5,
          reorderLevel: 10
        },
        individualInfo: medicineData.individualInfo || {
          purchasePrice: 0,
          sellingPrice: 0,
          mrp: 0,
          stock: 0,
          minStock: 50,
          reorderLevel: 100
        },
        location: medicineData.location || {},
        requiresPrescription: medicineData.requiresPrescription || false,
        isActive: true,
        createdBy: medicineData.createdBy
      });

      await medicine.save();
      this.clearStoreCache(storeId);
      return medicine;
    }, 'create medicine');
  }

  /**
   * Update medicine details
   */
  async updateMedicine(storeId, medicineId, updateData) {
    const validStoreId = this.validateStoreId(storeId);
    const validMedicineId = new mongoose.Types.ObjectId(medicineId);

    const medicine = await Medicine.findOneAndUpdate(
      { _id: validMedicineId, store: validStoreId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      throw new Error('Medicine not found');
    }

    this.clearStoreCache(storeId);
    return medicine;
  }

  /**
   * Update medicine stock levels
   */
  async updateMedicineStock(storeId, medicineId, stockUpdate) {
    const validStoreId = this.validateStoreId(storeId);
    const validMedicineId = new mongoose.Types.ObjectId(medicineId);

    const medicine = await Medicine.findOneAndUpdate(
      { _id: validMedicineId, store: validStoreId },
      {
        $set: {
          'inventory.strips': stockUpdate.strips,
          'inventory.units': stockUpdate.units,
          'inventory.unitsPerStrip': stockUpdate.unitsPerStrip || 10
        }
      },
      { new: true }
    );

    if (!medicine) {
      throw new Error('Medicine not found');
    }

    this.clearStoreCache(storeId);
    return medicine;
  }

  /**
   * Create a new customer with timeout protection
   */
  async createCustomer(storeId, customerData) {
    const validStoreId = this.validateStoreId(storeId);

    return await this.withTimeout(async () => {
      const customer = new Customer({
        store: validStoreId,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || '',
        address: customerData.address || '',
        dateOfBirth: customerData.dateOfBirth || null,
        gender: customerData.gender, // Only set if provided and valid
        customerType: customerData.customerType || 'regular',
        status: customerData.status || 'active',
        totalPurchases: customerData.totalPurchases || 0,
        totalSpent: customerData.totalSpent || 0,
        loyaltyPoints: customerData.loyaltyPoints || 0,
        creditLimit: customerData.creditLimit || 0,
        creditBalance: customerData.creditBalance || 0,
        creditStatus: customerData.creditStatus || 'good',
        preferredPaymentMethod: customerData.preferredPaymentMethod || 'cash',
        communicationPreferences: customerData.communicationPreferences || {
          sms: true,
          email: false,
          whatsapp: false
        },
        discountEligible: customerData.discountEligible || false,
        discountPercentage: customerData.discountPercentage || 0,
        visitCount: customerData.visitCount || 0,
        isActive: true,
        createdBy: customerData.createdBy
      });

      await customer.save();
      this.clearStoreCache(storeId);
      return customer;
    }, 'create customer');
  }

  /**
   * Update customer details
   */
  async updateCustomer(storeId, customerId, updateData) {
    const validStoreId = this.validateStoreId(storeId);
    const validCustomerId = new mongoose.Types.ObjectId(customerId);

    const customer = await Customer.findOneAndUpdate(
      { _id: validCustomerId, store: validStoreId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!customer) {
      throw new Error('Customer not found');
    }

    this.clearStoreCache(storeId);
    return customer;
  }

  /**
   * Delete customer
   */
  async deleteCustomer(storeId, customerId) {
    const validStoreId = this.validateStoreId(storeId);
    const validCustomerId = new mongoose.Types.ObjectId(customerId);

    const customer = await Customer.findOneAndDelete({
      _id: validCustomerId,
      store: validStoreId
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    this.clearStoreCache(storeId);
    return customer;
  }

  /**
   * Create a new sale transaction
   */
  async createSale(storeId, saleData) {
    const validStoreId = this.validateStoreId(storeId);

    const sale = new Sale({
      store: validStoreId,
      customer: saleData.customerId ? new mongoose.Types.ObjectId(saleData.customerId) : null,
      items: saleData.items.map(item => ({
        medicine: new mongoose.Types.ObjectId(item.medicineId),
        quantity: item.quantity,
        unitType: item.unitType || 'strip',
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: item.discount || 0
      })),
      subtotal: saleData.subtotal,
      discount: saleData.discount || 0,
      tax: saleData.tax || 0,
      totalAmount: saleData.totalAmount,
      paymentMethod: saleData.paymentMethod || 'cash',
      paymentStatus: saleData.paymentStatus || 'paid',
      invoiceNumber: saleData.invoiceNumber,
      notes: saleData.notes || '',
      createdBy: saleData.createdBy
    });

    await sale.save();
    this.clearStoreCache(storeId);
    return sale;
  }

  /**
   * Create a new supplier
   */
  async createSupplier(storeId, supplierData) {
    const validStoreId = this.validateStoreId(storeId);

    const supplier = new Supplier({
      store: validStoreId,
      name: supplierData.name,
      contactPerson: supplierData.contactPerson || 'Not Specified', // Provide default for required field
      phone: supplierData.phone,
      email: supplierData.email || '',
      address: supplierData.address || '',
      gstNumber: supplierData.gstNumber || '',
      paymentTerms: supplierData.paymentTerms || '30 days', // Use valid enum value
      isActive: true,
      addedBy: supplierData.createdBy || supplierData.addedBy // Fix field name
    });

    await supplier.save();
    this.clearStoreCache(storeId);
    return supplier;
  }

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(storeId, purchaseData) {
    const validStoreId = this.validateStoreId(storeId);

    const purchase = new Purchase({
      store: validStoreId,
      supplier: new mongoose.Types.ObjectId(purchaseData.supplierId),
      purchaseOrderNumber: purchaseData.purchaseOrderNumber,
      items: purchaseData.items.map(item => ({
        medicine: new mongoose.Types.ObjectId(item.medicineId),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      subtotal: purchaseData.subtotal,
      tax: purchaseData.tax || 0,
      totalAmount: purchaseData.totalAmount,
      status: 'pending',
      expectedDeliveryDate: purchaseData.expectedDeliveryDate || null,
      notes: purchaseData.notes || '',
      createdBy: purchaseData.createdBy
    });

    await purchase.save();
    this.clearStoreCache(storeId);
    return purchase;
  }

  /**
   * Get comprehensive store analytics
   */
  async getStoreAnalytics(storeId) {
    const validStoreId = this.validateStoreId(storeId);

    return this.getCachedData(`analytics_${storeId}`, async () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      // Sales analytics
      const todaysSales = await Sale.aggregate([
        {
          $match: {
            store: validStoreId,
            createdAt: {
              $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 },
            totalItems: { $sum: { $size: '$items' } }
          }
        }
      ]);

      const weeklySales = await Sale.aggregate([
        {
          $match: {
            store: validStoreId,
            createdAt: { $gte: startOfWeek }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]);

      const monthlySales = await Sale.aggregate([
        {
          $match: {
            store: validStoreId,
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 }
          }
        }
      ]);

      // Inventory analytics
      const inventoryStats = await Medicine.aggregate([
        { $match: { store: validStoreId } },
        {
          $group: {
            _id: null,
            totalMedicines: { $sum: 1 },
            totalValue: {
              $sum: {
                $add: [
                  { $multiply: ['$inventory.strips', '$pricing.stripPrice'] },
                  { $multiply: ['$inventory.units', '$pricing.unitPrice'] }
                ]
              }
            },
            lowStock: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $lte: ['$inventory.strips', 5] },
                      { $lte: ['$inventory.units', 10] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      // Customer analytics
      const customerStats = await Customer.aggregate([
        { $match: { store: validStoreId } },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            activeCustomers: {
              $sum: {
                $cond: [{ $eq: ['$isActive', true] }, 1, 0]
              }
            }
          }
        }
      ]);

      return {
        sales: {
          today: todaysSales[0] || { totalRevenue: 0, totalTransactions: 0, totalItems: 0 },
          week: weeklySales[0] || { totalRevenue: 0, totalTransactions: 0 },
          month: monthlySales[0] || { totalRevenue: 0, totalTransactions: 0 }
        },
        inventory: inventoryStats[0] || { totalMedicines: 0, totalValue: 0, lowStock: 0 },
        customers: customerStats[0] || { totalCustomers: 0, activeCustomers: 0 },
        generatedAt: new Date()
      };
    });
  }

  /**
   * Get staff information
   */
  async getStaffInfo(storeId) {
    const validStoreId = this.validateStoreId(storeId);

    return this.getCachedData(`staff_${storeId}`, async () => {
      const Staff = require('../models/Staff');

      const staff = await Staff.find({ store: validStoreId })
        .select('name role phone email isActive createdAt')
        .sort({ createdAt: -1 });

      return staff.map(member => ({
        id: member._id,
        name: member.name,
        role: member.role,
        phone: member.phone,
        email: member.email,
        isActive: member.isActive,
        joinedDate: member.createdAt
      }));
    });
  }

  /**
   * Get store settings
   */
  async getStoreSettings(storeId) {
    const validStoreId = this.validateStoreId(storeId);

    return this.getCachedData(`settings_${storeId}`, async () => {
      const Store = require('../models/Store');

      const store = await Store.findById(validStoreId)
        .select('settings name address phone email gstNumber');

      if (!store) {
        throw new Error('Store not found');
      }

      return {
        storeName: store.name,
        address: store.address,
        phone: store.phone,
        email: store.email,
        gstNumber: store.gstNumber,
        settings: store.settings || {
          gstRate: 18,
          discountRules: [],
          lowStockThreshold: 10,
          autoReorderEnabled: false,
          printInvoiceAfterSale: true,
          requirePrescriptionForScheduledDrugs: true
        }
      };
    });
  }

  /**
   * Update store settings
   */
  async updateStoreSettings(storeId, settingsUpdate) {
    const validStoreId = this.validateStoreId(storeId);
    const Store = require('../models/Store');

    const store = await Store.findByIdAndUpdate(
      validStoreId,
      { $set: { settings: settingsUpdate } },
      { new: true, runValidators: true }
    );

    if (!store) {
      throw new Error('Store not found');
    }

    this.clearStoreCache(storeId);
    return store.settings;
  }

  /**
   * Create a new doctor
   */
  async createDoctor(storeId, doctorData) {
    const validStoreId = this.validateStoreId(storeId);
    const Doctor = require('../models/Doctor');

    const doctor = new Doctor({
      store: validStoreId,
      name: doctorData.name,
      phone: doctorData.phone,
      email: doctorData.email || '',
      specialization: doctorData.specialization,
      qualification: doctorData.qualification || '',
      experience: doctorData.experience || 0,
      registrationNumber: doctorData.registrationNumber || '',
      address: doctorData.address || {},
      hospital: doctorData.hospital || {},
      commissionRate: doctorData.commissionRate || 0,
      commissionType: doctorData.commissionType || 'percentage',
      fixedCommissionAmount: doctorData.fixedCommissionAmount || 0,
      status: 'active',
      isVerified: false,
      communicationPreferences: {
        sms: true,
        email: false,
        whatsapp: false
      },
      notes: doctorData.notes || '',
      createdBy: doctorData.createdBy
    });

    await doctor.save();
    this.clearStoreCache(storeId);
    return doctor;
  }

  /**
   * Update doctor details
   */
  async updateDoctor(storeId, doctorId, updateData) {
    const validStoreId = this.validateStoreId(storeId);
    const validDoctorId = new mongoose.Types.ObjectId(doctorId);
    const Doctor = require('../models/Doctor');

    const doctor = await Doctor.findOneAndUpdate(
      { _id: validDoctorId, store: validStoreId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    this.clearStoreCache(storeId);
    return doctor;
  }

  /**
   * Delete doctor
   */
  async deleteDoctor(storeId, doctorId) {
    const validStoreId = this.validateStoreId(storeId);
    const validDoctorId = new mongoose.Types.ObjectId(doctorId);
    const Doctor = require('../models/Doctor');

    const doctor = await Doctor.findOneAndDelete({
      _id: validDoctorId,
      store: validStoreId
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    this.clearStoreCache(storeId);
    return doctor;
  }

  /**
   * Create a new staff member
   */
  async createStaff(storeId, staffData) {
    const validStoreId = this.validateStoreId(storeId);
    const Staff = require('../models/Staff');

    const staff = new Staff({
      store: validStoreId,
      name: staffData.name,
      email: staffData.email,
      phone: staffData.phone,
      role: staffData.role,
      department: staffData.department || 'pharmacy',
      dateOfJoining: staffData.dateOfJoining || new Date(),
      salary: staffData.salary || 0,
      workingHours: staffData.workingHours || 'full_time',
      address: staffData.address || {},
      dateOfBirth: staffData.dateOfBirth || null,
      emergencyContact: staffData.emergencyContact || {},
      qualifications: staffData.qualifications || [],
      certifications: staffData.certifications || [],
      performanceRating: 3,
      totalLeaves: 0,
      attendancePercentage: 100,
      status: 'active',
      hasSystemAccess: false,
      permissions: staffData.permissions || [],
      createdBy: staffData.createdBy
    });

    await staff.save();
    this.clearStoreCache(storeId);
    return staff;
  }

  /**
   * Update staff details
   */
  async updateStaff(storeId, staffId, updateData) {
    const validStoreId = this.validateStoreId(storeId);
    const validStaffId = new mongoose.Types.ObjectId(staffId);
    const Staff = require('../models/Staff');

    const staff = await Staff.findOneAndUpdate(
      { _id: validStaffId, store: validStoreId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!staff) {
      throw new Error('Staff member not found');
    }

    this.clearStoreCache(storeId);
    return staff;
  }

  /**
   * Delete staff member
   */
  async deleteStaff(storeId, staffId) {
    const validStoreId = this.validateStoreId(storeId);
    const validStaffId = new mongoose.Types.ObjectId(staffId);
    const Staff = require('../models/Staff');

    const staff = await Staff.findOneAndUpdate(
      { _id: validStaffId, store: validStoreId },
      { status: 'terminated' },
      { new: true }
    );

    if (!staff) {
      throw new Error('Staff member not found');
    }

    this.clearStoreCache(storeId);
    return staff;
  }

  /**
   * Process a return
   */
  async processReturn(storeId, returnData) {
    const validStoreId = this.validateStoreId(storeId);
    const Return = require('../models/Return');

    const returnRecord = new Return({
      store: validStoreId,
      originalSale: returnData.originalSaleId ? new mongoose.Types.ObjectId(returnData.originalSaleId) : null,
      customer: returnData.customerId ? new mongoose.Types.ObjectId(returnData.customerId) : null,
      items: returnData.items.map(item => ({
        medicine: new mongoose.Types.ObjectId(item.medicineId),
        quantity: item.quantity,
        unitType: item.unitType || 'strip',
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        reason: item.reason || 'other'
      })),
      totalAmount: returnData.totalAmount,
      refundAmount: returnData.refundAmount || returnData.totalAmount,
      reason: returnData.reason || 'other',
      status: 'pending',
      refundMethod: returnData.refundMethod || 'cash',
      refundStatus: 'pending',
      restoreInventory: returnData.restoreInventory !== false,
      inventoryRestorationStatus: 'pending',
      processedBy: returnData.processedBy,
      notes: returnData.notes || ''
    });

    await returnRecord.save();
    this.clearStoreCache(storeId);
    return returnRecord;
  }
}

module.exports = AIDataService;
