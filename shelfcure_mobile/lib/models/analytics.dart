class AnalyticsData {
  // Summary metrics
  final double totalRevenue;
  final double monthlyRevenue;
  final int totalSales;
  final int totalCustomers;
  final double averageOrderValue;
  final double? revenueGrowth;
  final double? salesGrowth;
  final double? dailyAverageSales;

  // Daily sales data
  final List<DailySalesData> dailySales;

  // Category and medicine data
  final List<CategorySalesData> categorySales;
  final List<TopMedicine>? topMedicines;

  // Customer data
  final List<CustomerSegment> customerSegments;
  final double growthRate;
  final int? newCustomers;
  final int? activeCustomers;
  final double? avgCustomerSpending;

  // Inventory data
  final InventoryData? inventory;

  // Customer analytics
  final CustomerAnalyticsData? customers;

  // Operations data
  final OperationsData? operations;

  // Legacy fields for backward compatibility
  final int? totalMedicines;
  final int? lowStockMedicines;
  final int? outOfStockMedicines;
  final int? stockHealth;
  final int? expiringMedicines;
  final int? expiredMedicines;

  // Peak sales day
  final PeakSalesDay? peakSalesDay;

  AnalyticsData({
    required this.totalRevenue,
    required this.monthlyRevenue,
    required this.totalSales,
    required this.totalCustomers,
    required this.averageOrderValue,
    required this.dailySales,
    required this.categorySales,
    required this.customerSegments,
    required this.growthRate,
    this.revenueGrowth,
    this.salesGrowth,
    this.dailyAverageSales,
    this.topMedicines,
    this.newCustomers,
    this.activeCustomers,
    this.avgCustomerSpending,
    this.inventory,
    this.customers,
    this.operations,
    this.totalMedicines,
    this.lowStockMedicines,
    this.outOfStockMedicines,
    this.stockHealth,
    this.expiringMedicines,
    this.expiredMedicines,
    this.peakSalesDay,
  });

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

  factory AnalyticsData.fromJson(Map<String, dynamic> json) {
    try {
      // Parse summary metrics
      final summary = json['summary'] as Map<String, dynamic>? ?? {};

      // Parse daily sales
      List<DailySalesData> dailySales = [];
      try {
        final dailySalesJson = json['dailySales'] as List?;
        if (dailySalesJson != null) {
          dailySales = dailySalesJson
              .map(
                (item) => DailySalesData.fromJson(item as Map<String, dynamic>),
              )
              .whereType<DailySalesData>()
              .toList();
        }
      } catch (e) {
        print('Error parsing daily sales: $e');
      }

      // Parse top medicines
      List<TopMedicine>? topMedicines;
      try {
        final topMedicinesJson = json['topMedicines'] as List?;
        if (topMedicinesJson != null) {
          topMedicines = topMedicinesJson
              .map((item) => TopMedicine.fromJson(item as Map<String, dynamic>))
              .whereType<TopMedicine>()
              .toList();
        }
      } catch (e) {
        print('Error parsing top medicines: $e');
      }

      return AnalyticsData(
        totalRevenue: _toDouble(
          summary['totalRevenue'] ?? json['totalRevenue'],
        ),
        monthlyRevenue: _toDouble(
          summary['monthlyRevenue'] ?? json['monthlyRevenue'],
        ),
        totalSales: _toInt(summary['totalSales'] ?? json['totalSales']),
        totalCustomers: _toInt(
          summary['totalCustomers'] ?? json['totalCustomers'],
        ),
        averageOrderValue: _toDouble(
          summary['averageOrderValue'] ?? json['averageOrderValue'],
        ),
        revenueGrowth: _toDouble(
          summary['revenueGrowth'] ?? json['revenueGrowth'],
        ),
        salesGrowth: _toDouble(summary['salesGrowth'] ?? json['salesGrowth']),
        dailyAverageSales: _toDouble(
          summary['dailyAverageSales'] ?? json['dailyAverageSales'],
        ),
        dailySales: dailySales,
        categorySales:
            (json['categorySales'] as List?)
                ?.map(
                  (item) =>
                      CategorySalesData.fromJson(item as Map<String, dynamic>),
                )
                .whereType<CategorySalesData>()
                .toList() ??
            [],
        customerSegments:
            (json['customerSegments'] as List?)
                ?.map(
                  (item) =>
                      CustomerSegment.fromJson(item as Map<String, dynamic>),
                )
                .whereType<CustomerSegment>()
                .toList() ??
            [],
        growthRate: _toDouble(json['growthRate']),
        topMedicines: topMedicines,
        newCustomers: _toInt(json['newCustomers']),
        activeCustomers: _toInt(json['activeCustomers']),
        avgCustomerSpending: _toDouble(json['avgCustomerSpending']),
        inventory: json['inventory'] != null
            ? InventoryData.fromJson(json['inventory'] as Map<String, dynamic>)
            : null,
        customers: json['customers'] != null
            ? CustomerAnalyticsData.fromJson(
                json['customers'] as Map<String, dynamic>,
              )
            : null,
        operations: json['operations'] != null
            ? OperationsData.fromJson(
                json['operations'] as Map<String, dynamic>,
              )
            : null,
        totalMedicines: _toInt(json['totalMedicines']),
        lowStockMedicines: _toInt(json['lowStockMedicines']),
        outOfStockMedicines: _toInt(json['outOfStockMedicines']),
        stockHealth: _toInt(json['stockHealth']),
        expiringMedicines: _toInt(json['expiringMedicines']),
        expiredMedicines: _toInt(json['expiredMedicines']),
        peakSalesDay: json['peakSalesDay'] != null
            ? PeakSalesDay.fromJson(
                json['peakSalesDay'] as Map<String, dynamic>,
              )
            : null,
      );
    } catch (e) {
      print('Error parsing analytics data: $e');
      rethrow;
    }
  }
}

class DailySalesData {
  final String date;
  final double amount;
  final int transactions;

  DailySalesData({
    required this.date,
    required this.amount,
    required this.transactions,
  });

  factory DailySalesData.fromJson(Map<String, dynamic> json) {
    return DailySalesData(
      date: json['date'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      transactions: json['transactions'] ?? 0,
    );
  }
}

class CategorySalesData {
  final String category;
  final double amount;
  final int percentage;

  CategorySalesData({
    required this.category,
    required this.amount,
    required this.percentage,
  });

  factory CategorySalesData.fromJson(Map<String, dynamic> json) {
    return CategorySalesData(
      category: json['category'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      percentage: json['percentage'] ?? 0,
    );
  }
}

class CustomerSegment {
  final String segment;
  final int count;
  final double totalSpending;

  CustomerSegment({
    required this.segment,
    required this.count,
    required this.totalSpending,
  });

  factory CustomerSegment.fromJson(Map<String, dynamic> json) {
    return CustomerSegment(
      segment: json['segment'] ?? '',
      count: json['count'] ?? 0,
      totalSpending: (json['totalSpending'] ?? 0).toDouble(),
    );
  }
}

class TopMedicine {
  final String name;
  final int quantity;
  final double revenue;
  final String? category;
  final double? growth;

  TopMedicine({
    required this.name,
    required this.quantity,
    required this.revenue,
    this.category,
    this.growth,
  });

  factory TopMedicine.fromJson(Map<String, dynamic> json) {
    return TopMedicine(
      name: json['name'] ?? '',
      quantity: AnalyticsData._toInt(json['quantity']),
      revenue: AnalyticsData._toDouble(json['revenue']),
      category: json['category'] as String?,
      growth: AnalyticsData._toDouble(json['growth']),
    );
  }
}

class InventoryData {
  final int totalMedicines;
  final int lowStockMedicines;
  final int outOfStockMedicines;
  final int expiringMedicines;
  final int expiredMedicines;
  final double totalValue;
  final int stockHealthPercentage;
  final List<LowStockMedicine> lowStockMedicinesData;
  final List<CategoryDistribution> categories;

  InventoryData({
    required this.totalMedicines,
    required this.lowStockMedicines,
    required this.outOfStockMedicines,
    required this.expiringMedicines,
    required this.expiredMedicines,
    required this.totalValue,
    required this.stockHealthPercentage,
    required this.lowStockMedicinesData,
    required this.categories,
  });

  factory InventoryData.fromJson(Map<String, dynamic> json) {
    return InventoryData(
      totalMedicines: AnalyticsData._toInt(json['totalMedicines']),
      lowStockMedicines: AnalyticsData._toInt(json['lowStockMedicines']),
      outOfStockMedicines: AnalyticsData._toInt(json['outOfStockMedicines']),
      expiringMedicines: AnalyticsData._toInt(json['expiringMedicines']),
      expiredMedicines: AnalyticsData._toInt(json['expiredMedicines']),
      totalValue: AnalyticsData._toDouble(json['totalValue']),
      stockHealthPercentage: AnalyticsData._toInt(
        json['stockHealthPercentage'],
      ),
      lowStockMedicinesData:
          (json['lowStockMedicinesData'] as List?)
              ?.map(
                (item) =>
                    LowStockMedicine.fromJson(item as Map<String, dynamic>),
              )
              .whereType<LowStockMedicine>()
              .toList() ??
          [],
      categories:
          (json['categories'] as List?)
              ?.map(
                (item) =>
                    CategoryDistribution.fromJson(item as Map<String, dynamic>),
              )
              .whereType<CategoryDistribution>()
              .toList() ??
          [],
    );
  }
}

class LowStockMedicine {
  final String name;
  final int stock;
  final int minStock;
  final String category;

  LowStockMedicine({
    required this.name,
    required this.stock,
    required this.minStock,
    required this.category,
  });

  factory LowStockMedicine.fromJson(Map<String, dynamic> json) {
    return LowStockMedicine(
      name: json['name'] ?? '',
      stock: AnalyticsData._toInt(json['stock']),
      minStock: AnalyticsData._toInt(json['minStock']),
      category: json['category'] ?? '',
    );
  }
}

class CategoryDistribution {
  final String name;
  final int count;
  final double value;

  CategoryDistribution({
    required this.name,
    required this.count,
    required this.value,
  });

  factory CategoryDistribution.fromJson(Map<String, dynamic> json) {
    return CategoryDistribution(
      name: json['name'] ?? '',
      count: AnalyticsData._toInt(json['count']),
      value: AnalyticsData._toDouble(json['value']),
    );
  }
}

class CustomerAnalyticsData {
  final int totalCustomers;
  final int newCustomers;
  final int activeCustomers;
  final double customerGrowth;
  final double averageSpending;
  final double averageOrderValue;
  final double totalCustomerRevenue;
  final List<AcquisitionData> acquisitionData;
  final int lowSpenders;
  final int mediumSpenders;
  final int highSpenders;
  final List<TopCustomer> topCustomers;

  CustomerAnalyticsData({
    required this.totalCustomers,
    required this.newCustomers,
    required this.activeCustomers,
    required this.customerGrowth,
    required this.averageSpending,
    required this.averageOrderValue,
    required this.totalCustomerRevenue,
    required this.acquisitionData,
    required this.lowSpenders,
    required this.mediumSpenders,
    required this.highSpenders,
    required this.topCustomers,
  });

  factory CustomerAnalyticsData.fromJson(Map<String, dynamic> json) {
    return CustomerAnalyticsData(
      totalCustomers: AnalyticsData._toInt(json['totalCustomers']),
      newCustomers: AnalyticsData._toInt(json['newCustomers']),
      activeCustomers: AnalyticsData._toInt(json['activeCustomers']),
      customerGrowth: AnalyticsData._toDouble(json['customerGrowth']),
      averageSpending: AnalyticsData._toDouble(json['averageSpending']),
      averageOrderValue: AnalyticsData._toDouble(json['averageOrderValue']),
      totalCustomerRevenue: AnalyticsData._toDouble(
        json['totalCustomerRevenue'],
      ),
      acquisitionData:
          (json['acquisitionData'] as List?)
              ?.map(
                (item) =>
                    AcquisitionData.fromJson(item as Map<String, dynamic>),
              )
              .whereType<AcquisitionData>()
              .toList() ??
          [],
      lowSpenders: AnalyticsData._toInt(json['lowSpenders']),
      mediumSpenders: AnalyticsData._toInt(json['mediumSpenders']),
      highSpenders: AnalyticsData._toInt(json['highSpenders']),
      topCustomers:
          (json['topCustomers'] as List?)
              ?.map(
                (item) => TopCustomer.fromJson(item as Map<String, dynamic>),
              )
              .whereType<TopCustomer>()
              .toList() ??
          [],
    );
  }
}

class AcquisitionData {
  final String date;
  final int count;

  AcquisitionData({required this.date, required this.count});

  factory AcquisitionData.fromJson(Map<String, dynamic> json) {
    return AcquisitionData(
      date: json['date'] ?? '',
      count: AnalyticsData._toInt(json['count']),
    );
  }
}

class TopCustomer {
  final String name;
  final String? phone;
  final int visitCount;
  final double totalSpent;
  final String? lastVisit;

  TopCustomer({
    required this.name,
    this.phone,
    required this.visitCount,
    required this.totalSpent,
    this.lastVisit,
  });

  factory TopCustomer.fromJson(Map<String, dynamic> json) {
    return TopCustomer(
      name: json['name'] ?? '',
      phone: json['phone'] as String?,
      visitCount: AnalyticsData._toInt(json['visitCount']),
      totalSpent: AnalyticsData._toDouble(json['totalSpent']),
      lastVisit: json['lastVisit'] as String?,
    );
  }
}

class OperationsData {
  final int dailyTransactions;
  final String peakHours;
  final int staffEfficiency;
  final double systemUptime;
  final double averageTransactionTime;
  final int totalTransactions;
  final List<int> hourlyPattern;
  final WeeklyPerformance weeklyPerformance;
  final List<CategorySalesDistribution> categoryDistribution;

  OperationsData({
    required this.dailyTransactions,
    required this.peakHours,
    required this.staffEfficiency,
    required this.systemUptime,
    required this.averageTransactionTime,
    required this.totalTransactions,
    required this.hourlyPattern,
    required this.weeklyPerformance,
    required this.categoryDistribution,
  });

  factory OperationsData.fromJson(Map<String, dynamic> json) {
    return OperationsData(
      dailyTransactions: AnalyticsData._toInt(json['dailyTransactions']),
      peakHours: json['peakHours'] ?? 'N/A',
      staffEfficiency: AnalyticsData._toInt(json['staffEfficiency']),
      systemUptime: AnalyticsData._toDouble(json['systemUptime']),
      averageTransactionTime: AnalyticsData._toDouble(
        json['averageTransactionTime'],
      ),
      totalTransactions: AnalyticsData._toInt(json['totalTransactions']),
      hourlyPattern:
          (json['hourlyPattern'] as List?)
              ?.map((item) => AnalyticsData._toInt(item))
              .toList() ??
          List.filled(24, 0),
      weeklyPerformance: json['weeklyPerformance'] != null
          ? WeeklyPerformance.fromJson(
              json['weeklyPerformance'] as Map<String, dynamic>,
            )
          : WeeklyPerformance.empty(),
      categoryDistribution:
          (json['categoryDistribution'] as List?)
              ?.map(
                (item) => CategorySalesDistribution.fromJson(
                  item as Map<String, dynamic>,
                ),
              )
              .whereType<CategorySalesDistribution>()
              .toList() ??
          [],
    );
  }
}

class WeeklyPerformance {
  final List<int> sales;
  final List<int> transactions;

  WeeklyPerformance({required this.sales, required this.transactions});

  factory WeeklyPerformance.fromJson(Map<String, dynamic> json) {
    return WeeklyPerformance(
      sales:
          (json['sales'] as List?)
              ?.map((item) => AnalyticsData._toInt(item))
              .toList() ??
          List.filled(7, 0),
      transactions:
          (json['transactions'] as List?)
              ?.map((item) => AnalyticsData._toInt(item))
              .toList() ??
          List.filled(7, 0),
    );
  }

  factory WeeklyPerformance.empty() {
    return WeeklyPerformance(
      sales: List.filled(7, 0),
      transactions: List.filled(7, 0),
    );
  }
}

class CategorySalesDistribution {
  final String category;
  final double revenue;

  CategorySalesDistribution({required this.category, required this.revenue});

  factory CategorySalesDistribution.fromJson(Map<String, dynamic> json) {
    return CategorySalesDistribution(
      category: json['category'] ?? '',
      revenue: AnalyticsData._toDouble(json['revenue']),
    );
  }
}

class PeakSalesDay {
  final String day;
  final double amount;

  PeakSalesDay({required this.day, required this.amount});

  factory PeakSalesDay.fromJson(Map<String, dynamic> json) {
    return PeakSalesDay(
      day: json['day'] ?? 'N/A',
      amount: AnalyticsData._toDouble(json['amount']),
    );
  }
}
