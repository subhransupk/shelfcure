class DashboardData {
  // Financial Metrics
  final double todayRevenue;
  final double weekRevenue;
  final double monthRevenue;
  final double totalProfit;
  final double todayProfit;
  final double todayLoss;
  final double todayCredit;
  final int todaySalesCount;
  final int weekSalesCount;
  final int monthSalesCount;

  // Inventory Metrics
  final int totalMedicines;
  final int inStockMedicines;
  final int lowStockMedicines;
  final int outOfStock;
  final double stockValue;
  final int totalStrips;
  final int totalIndividualUnits;

  // Customer & Credit Metrics
  final int totalCustomers;
  final int newCustomersThisMonth;
  final double pendingCredit;
  final int creditCustomers;

  // Returns & Waste Metrics
  final double todayReturns;
  final int todayReturnsCount;
  final int completedReturnsToday;
  final int pendingReturns;
  final double wasteImpact;
  final double preventableWaste;
  final double wastePercentage;
  final int wasteIncidents;

  // Expiry Tracking
  final int expiredMedicines;
  final double expiredValue;
  final int expiring30Days;
  final double expiring30DaysValue;
  final int critical7Days;

  // Doctor Commissions
  final double totalDoctorCommissions;

  // Legacy fields for compatibility
  final List<SalesChartData> salesTrend;
  final List<TopProduct> topProducts;
  final List<RecentSale> recentSales;
  final List<ExpiringMedicine> expiringMedicines;

  // Alerts
  final bool lowStockAlert;
  final bool expiringAlert;
  final bool criticalExpiryAlert;
  final bool outOfStockAlert;

  DashboardData({
    required this.todayRevenue,
    required this.weekRevenue,
    required this.monthRevenue,
    required this.totalProfit,
    required this.todayProfit,
    required this.todayLoss,
    required this.todayCredit,
    required this.todaySalesCount,
    required this.weekSalesCount,
    required this.monthSalesCount,
    required this.totalMedicines,
    required this.inStockMedicines,
    required this.lowStockMedicines,
    required this.outOfStock,
    required this.stockValue,
    required this.totalStrips,
    required this.totalIndividualUnits,
    required this.totalCustomers,
    required this.newCustomersThisMonth,
    required this.pendingCredit,
    required this.creditCustomers,
    required this.todayReturns,
    required this.todayReturnsCount,
    required this.completedReturnsToday,
    required this.pendingReturns,
    required this.wasteImpact,
    required this.preventableWaste,
    required this.wastePercentage,
    required this.wasteIncidents,
    required this.expiredMedicines,
    required this.expiredValue,
    required this.expiring30Days,
    required this.expiring30DaysValue,
    required this.critical7Days,
    required this.totalDoctorCommissions,
    required this.salesTrend,
    required this.topProducts,
    required this.recentSales,
    required this.expiringMedicines,
    required this.lowStockAlert,
    required this.expiringAlert,
    required this.criticalExpiryAlert,
    required this.outOfStockAlert,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    final metrics = json['metrics'] ?? {};
    final alerts = json['alerts'] ?? {};
    final recentSalesData = json['recentSales'] as List? ?? [];
    final expiringMedicinesData = json['expiringMedicines'] as List? ?? [];

    // Parse recent sales
    final recentSalesList = recentSalesData
        .map((item) {
          try {
            return RecentSale.fromJson(item);
          } catch (e) {
            return null;
          }
        })
        .whereType<RecentSale>()
        .toList();

    // Parse expiring medicines
    final expiringMedicinesList = expiringMedicinesData
        .map((item) {
          try {
            return ExpiringMedicine.fromJson(item);
          } catch (e) {
            return null;
          }
        })
        .whereType<ExpiringMedicine>()
        .toList();

    return DashboardData(
      // Financial Metrics
      todayRevenue: _toDouble(metrics['todayRevenue']),
      weekRevenue: _toDouble(metrics['weekRevenue']),
      monthRevenue: _toDouble(metrics['monthRevenue']),
      totalProfit: _toDouble(metrics['totalProfit']),
      todayProfit: _toDouble(metrics['todayProfit']),
      todayLoss: _toDouble(metrics['todayLoss']),
      todayCredit: _toDouble(metrics['todayCredit']),
      todaySalesCount: _toInt(metrics['todaySalesCount']),
      weekSalesCount: _toInt(metrics['weekSalesCount']),
      monthSalesCount: _toInt(metrics['monthSalesCount']),

      // Inventory Metrics
      totalMedicines: _toInt(metrics['totalMedicines']),
      inStockMedicines: _toInt(metrics['inStockMedicines']),
      lowStockMedicines: _toInt(metrics['lowStockMedicines']),
      outOfStock: _toInt(metrics['outOfStock']),
      stockValue: _toDouble(metrics['stockValue']),
      totalStrips: _toInt(metrics['totalStrips']),
      totalIndividualUnits: _toInt(metrics['totalIndividualUnits']),

      // Customer & Credit Metrics
      totalCustomers: _toInt(metrics['totalCustomers']),
      newCustomersThisMonth: _toInt(metrics['newCustomersThisMonth']),
      pendingCredit: _toDouble(metrics['pendingCredit']),
      creditCustomers: _toInt(metrics['creditCustomers']),

      // Returns & Waste Metrics
      todayReturns: _toDouble(metrics['todayReturns']),
      todayReturnsCount: _toInt(metrics['todayReturnsCount']),
      completedReturnsToday: _toInt(metrics['completedReturnsToday']),
      pendingReturns: _toInt(metrics['pendingReturns']),
      wasteImpact: _toDouble(metrics['wasteImpact']),
      preventableWaste: _toDouble(metrics['preventableWaste']),
      wastePercentage: _toDouble(metrics['wastePercentage']),
      wasteIncidents: _toInt(metrics['wasteIncidents']),

      // Expiry Tracking
      expiredMedicines: _toInt(metrics['expiredMedicines']),
      expiredValue: _toDouble(metrics['expiredValue']),
      expiring30Days: _toInt(metrics['expiring30Days']),
      expiring30DaysValue: _toDouble(metrics['expiring30DaysValue']),
      critical7Days: _toInt(metrics['critical7Days']),

      // Doctor Commissions
      totalDoctorCommissions: _toDouble(metrics['totalDoctorCommissions']),

      // Legacy fields
      salesTrend: [],
      topProducts: [],
      recentSales: recentSalesList,
      expiringMedicines: expiringMedicinesList,

      // Alerts
      lowStockAlert: alerts['lowStock'] ?? false,
      expiringAlert: alerts['expiringSoon'] ?? false,
      criticalExpiryAlert: alerts['criticalExpiry'] ?? false,
      outOfStockAlert: alerts['outOfStock'] ?? false,
    );
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }
}

class SalesChartData {
  final String date;
  final double amount;

  SalesChartData({required this.date, required this.amount});

  factory SalesChartData.fromJson(Map<String, dynamic> json) {
    return SalesChartData(
      date: json['date'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
    );
  }
}

class TopProduct {
  final String name;
  final int quantity;
  final double revenue;

  TopProduct({
    required this.name,
    required this.quantity,
    required this.revenue,
  });

  factory TopProduct.fromJson(Map<String, dynamic> json) {
    return TopProduct(
      name: json['name'] ?? '',
      quantity: json['quantity'] ?? 0,
      revenue: (json['revenue'] ?? 0).toDouble(),
    );
  }
}

class RecentSale {
  final String id;
  final String invoiceNumber;
  final double amount;
  final DateTime date;
  final String? customerName;

  RecentSale({
    required this.id,
    required this.invoiceNumber,
    required this.amount,
    required this.date,
    this.customerName,
  });

  factory RecentSale.fromJson(Map<String, dynamic> json) {
    // Handle both backend response formats
    final customerId = json['customer'];
    String? customerName;

    if (customerId is Map<String, dynamic>) {
      // Customer is populated object
      customerName = customerId['name'];
    } else if (customerId is String) {
      // Customer is just ID
      customerName = null;
    }

    return RecentSale(
      id: json['_id'] ?? json['id'] ?? '',
      invoiceNumber: json['invoiceNumber'] ?? '',
      amount: (json['totalAmount'] ?? json['amount'] ?? 0).toDouble(),
      date: _parseDate(json['createdAt'] ?? json['date']),
      customerName: customerName,
    );
  }

  static DateTime _parseDate(dynamic dateValue) {
    if (dateValue == null) return DateTime.now();
    if (dateValue is DateTime) return dateValue;
    if (dateValue is String) {
      try {
        return DateTime.parse(dateValue);
      } catch (e) {
        return DateTime.now();
      }
    }
    return DateTime.now();
  }
}

class ExpiringMedicine {
  final String id;
  final String name;
  final String batchNumber;
  final DateTime expiryDate;
  final int quantity;
  final double price;

  ExpiringMedicine({
    required this.id,
    required this.name,
    required this.batchNumber,
    required this.expiryDate,
    required this.quantity,
    required this.price,
  });

  factory ExpiringMedicine.fromJson(Map<String, dynamic> json) {
    // Extract batch number from stripInfo or individualInfo if available
    String batchNumber = json['batchNumber'] ?? '';

    // Try to get batch from stripInfo
    if (batchNumber.isEmpty && json['stripInfo'] is Map) {
      batchNumber = json['stripInfo']['batchNumber'] ?? '';
    }

    // Try to get batch from individualInfo
    if (batchNumber.isEmpty && json['individualInfo'] is Map) {
      batchNumber = json['individualInfo']['batchNumber'] ?? '';
    }

    // Extract quantity from stripInfo or individualInfo
    int quantity = json['quantity'] ?? 0;
    if (quantity == 0 && json['stripInfo'] is Map) {
      quantity = (json['stripInfo']['stock'] ?? 0) as int;
    }
    if (quantity == 0 && json['individualInfo'] is Map) {
      quantity = (json['individualInfo']['stock'] ?? 0) as int;
    }

    return ExpiringMedicine(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      batchNumber: batchNumber,
      expiryDate: _parseExpiryDate(json['expiryDate']),
      quantity: quantity,
      price: (json['price'] ?? 0).toDouble(),
    );
  }

  static DateTime _parseExpiryDate(dynamic dateValue) {
    if (dateValue == null) return DateTime.now();
    if (dateValue is DateTime) return dateValue;
    if (dateValue is String) {
      try {
        return DateTime.parse(dateValue);
      } catch (e) {
        return DateTime.now();
      }
    }
    return DateTime.now();
  }
}
