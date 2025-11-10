import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/analytics_provider.dart';
import '../../widgets/analytics_chart.dart';
import '../../models/analytics.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({Key? key}) : super(key: key);

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  String _selectedPeriod = '30d';
  String _activeTab = 'overview';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AnalyticsProvider>().fetchAnalytics(period: _selectedPeriod);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildModernAppBar(),
      backgroundColor: const Color(0xFFF9FAFB),
      body: Consumer<AnalyticsProvider>(
        builder: (context, analyticsProvider, _) {
          if (analyticsProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFF2E7D32)),
            );
          }

          if (analyticsProvider.error != null &&
              analyticsProvider.analyticsData == null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 48,
                    color: Color(0xFFDC2626),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    analyticsProvider.error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Color(0xFF6B7280)),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton(
                        onPressed: () {
                          analyticsProvider.fetchAnalytics(
                            period: _selectedPeriod,
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2E7D32),
                        ),
                        child: const Text('Retry'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: () {
                          analyticsProvider.retryFetchAnalytics(maxRetries: 3);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1F5A2E),
                        ),
                        child: const Text('Retry (3x)'),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }

          final data = analyticsProvider.analyticsData;
          if (data == null) {
            return const Center(child: Text('No data available'));
          }

          return RefreshIndicator(
            onRefresh: () => analyticsProvider.fetchAnalytics(),
            color: const Color(0xFF2E7D32),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Period Filter
                  _buildPeriodFilter(),
                  const SizedBox(height: 20),
                  // Tab Navigation
                  _buildTabNavigation(),
                  const SizedBox(height: 20),
                  // Tab Content
                  if (_activeTab == 'overview') _buildOverviewTab(data),
                  if (_activeTab == 'sales') _buildSalesTab(data),
                  if (_activeTab == 'inventory') _buildInventoryTab(data),
                  if (_activeTab == 'customers') _buildCustomersTabSafe(data),
                  if (_activeTab == 'operations') _buildOperationsTab(data),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  PreferredSizeWidget _buildModernAppBar() {
    return AppBar(
      title: const Text(
        'Analytics',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      backgroundColor: const Color(0xFF2E7D32),
      elevation: 0,
      centerTitle: false,
    );
  }

  Widget _buildPeriodFilter() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
      ),
      child: Row(
        children: [
          const Icon(Icons.calendar_today, size: 18, color: Color(0xFF6B7280)),
          const SizedBox(width: 12),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildPeriodButton('7d', 'Last 7 Days'),
                  const SizedBox(width: 8),
                  _buildPeriodButton('30d', 'Last 30 Days'),
                  const SizedBox(width: 8),
                  _buildPeriodButton('90d', 'Last 90 Days'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodButton(String value, String label) {
    final isSelected = _selectedPeriod == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedPeriod = value;
        });
        // Fetch analytics for the selected period
        context.read<AnalyticsProvider>().fetchAnalytics(period: value);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2E7D32) : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF2E7D32)
                : const Color(0xFFE5E7EB),
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF6B7280),
          ),
        ),
      ),
    );
  }

  Widget _buildTabNavigation() {
    final tabs = [
      ('overview', 'Overview', Icons.bar_chart),
      ('sales', 'Sales', Icons.shopping_cart),
      ('inventory', 'Inventory', Icons.inventory_2),
      ('customers', 'Customers', Icons.people),
      ('operations', 'Operations', Icons.settings),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: tabs.map((tab) {
          final isActive = _activeTab == tab.$1;
          return GestureDetector(
            onTap: () {
              setState(() {
                _activeTab = tab.$1;
              });
            },
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isActive ? const Color(0xFF2E7D32) : Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isActive
                      ? const Color(0xFF2E7D32)
                      : const Color(0xFFE5E7EB),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    tab.$3,
                    size: 16,
                    color: isActive ? Colors.white : const Color(0xFF6B7280),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    tab.$2,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isActive ? Colors.white : const Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildOverviewTab(dynamic data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Key Metrics
        _buildSectionHeader('Key Metrics'),
        const SizedBox(height: 12),
        _buildMetricsGrid([
          (
            'Total Revenue',
            '₹${data.totalRevenue.toStringAsFixed(0)}',
            Icons.attach_money,
            Color(0xFF2E7D32),
          ),
          (
            'Total Sales',
            '${data.totalSales}',
            Icons.shopping_cart,
            Color(0xFF3B82F6),
          ),
          (
            'Avg Order Value',
            '₹${data.averageOrderValue.toStringAsFixed(0)}',
            Icons.trending_up,
            Color(0xFFA855F7),
          ),
          (
            'Top Medicine',
            '${data.topMedicines?.isNotEmpty == true ? data.topMedicines[0].name : 'N/A'}',
            Icons.local_pharmacy,
            Color(0xFFF59E0B),
          ),
        ]),
        const SizedBox(height: 28),
        // Charts
        _buildSectionHeader('Sales Trend'),
        const SizedBox(height: 12),
        _buildChartCard('Daily Sales', data.dailySales),
        const SizedBox(height: 28),
        _buildSectionHeader('Top Medicines'),
        const SizedBox(height: 12),
        _buildTopMedicinesCard(data),
      ],
    );
  }

  Widget _buildSalesTab(dynamic data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Sales Performance'),
        const SizedBox(height: 12),
        _buildMetricsGrid([
          (
            'Daily Avg Sales',
            '₹${(data.totalRevenue / 30).toStringAsFixed(0)}',
            Icons.trending_up,
            Color(0xFF2E7D32),
          ),
          ('Peak Sales Day', 'Monday', Icons.calendar_today, Color(0xFF3B82F6)),
          ('Sales Growth', '+12%', Icons.arrow_upward, Color(0xFFA855F7)),
        ]),
        const SizedBox(height: 28),
        _buildSectionHeader('Sales Chart'),
        const SizedBox(height: 12),
        _buildChartCard('Revenue Trend', data.dailySales),
        const SizedBox(height: 28),
        _buildSectionHeader('Top Performing Medicines'),
        const SizedBox(height: 12),
        _buildTopMedicinesCard(data),
      ],
    );
  }

  Widget _buildInventoryTab(dynamic data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Inventory Metrics'),
        const SizedBox(height: 12),
        _buildMetricsGrid([
          (
            'Total Medicines',
            '${data.totalMedicines ?? 0}',
            Icons.inventory_2,
            Color(0xFF3B82F6),
          ),
          (
            'Low Stock',
            '${data.lowStockMedicines ?? 0}',
            Icons.warning,
            Color(0xFFF59E0B),
          ),
          (
            'Out of Stock',
            '${data.outOfStockMedicines ?? 0}',
            Icons.block,
            Color(0xFFDC2626),
          ),
          (
            'Stock Health',
            '${data.stockHealth ?? 0}%',
            Icons.health_and_safety,
            Color(0xFF2E7D32),
          ),
        ]),
        const SizedBox(height: 28),
        _buildSectionHeader('Expiry Alerts'),
        const SizedBox(height: 12),
        _buildMetricsGrid([
          (
            'Expiring Soon',
            '${data.expiringMedicines ?? 0}',
            Icons.schedule,
            Color(0xFFF59E0B),
          ),
          (
            'Expired Items',
            '${data.expiredMedicines ?? 0}',
            Icons.error,
            Color(0xFFDC2626),
          ),
        ]),
      ],
    );
  }

  Widget _buildCustomersTabSafe(dynamic data) {
    try {
      return _buildCustomersTab(data);
    } catch (e) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
        ),
        child: const Center(
          child: Text('Unable to load customer analytics data'),
        ),
      );
    }
  }

  Widget _buildCustomersTab(dynamic data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Customer Analytics'),
        const SizedBox(height: 12),
        _buildMetricsGrid([
          (
            'Total Customers',
            '${data.totalCustomers ?? 0}',
            Icons.people,
            Color(0xFF3B82F6),
          ),
          (
            'New Customers',
            '${data.newCustomers ?? 0}',
            Icons.person_add,
            Color(0xFF2E7D32),
          ),
          (
            'Active Customers',
            '${data.activeCustomers ?? 0}',
            Icons.verified_user,
            Color(0xFFA855F7),
          ),
          (
            'Avg Spending',
            '₹${data.avgCustomerSpending?.toStringAsFixed(0) ?? 0}',
            Icons.attach_money,
            Color(0xFFF59E0B),
          ),
        ]),
        const SizedBox(height: 28),
        _buildSectionHeader('Customer Acquisition'),
        const SizedBox(height: 12),
        _buildCustomerAcquisitionChart(data),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: Color(0xFF111827),
        letterSpacing: -0.3,
      ),
    );
  }

  Widget _buildMetricsGrid(List<(String, String, IconData, Color)> metrics) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.1,
      ),
      itemCount: metrics.length,
      itemBuilder: (context, index) {
        final (title, value, icon, color) = metrics[index];
        return _buildMetricCard(title, value, icon, color);
      },
    );
  }

  Widget _buildMetricCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(color: color, width: 4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                title,
                style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChartCard(String title, dynamic data) {
    // Convert data to List<DailySalesData>
    List<DailySalesData> chartData = [];

    try {
      if (data is List && data.isNotEmpty) {
        // Convert each item to DailySalesData
        for (var item in data) {
          if (item is DailySalesData) {
            chartData.add(item);
          } else if (item is Map<String, dynamic>) {
            try {
              chartData.add(DailySalesData.fromJson(item));
            } catch (e) {
              // Skip items that can't be converted
            }
          }
        }
      }
    } catch (e) {
      // Error converting data, use empty list
      chartData = [];
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(height: 200, child: AnalyticsChart(data: chartData)),
        ],
      ),
    );
  }

  Widget _buildTopMedicinesCard(dynamic data) {
    final medicines = data.topMedicines ?? [];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (medicines.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No medicine data available',
                  style: TextStyle(color: Color(0xFF9CA3AF)),
                ),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: medicines.length,
              itemBuilder: (context, index) {
                final medicine = medicines[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    border: Border(
                      left: BorderSide(
                        color: const Color(0xFF2E7D32),
                        width: 4,
                      ),
                    ),
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              medicine.name ?? 'Unknown',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF111827),
                              ),
                            ),
                            Text(
                              'Qty: ${medicine.quantity ?? 0}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '₹${medicine.revenue?.toStringAsFixed(0) ?? 0}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2E7D32),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildCustomerAcquisitionChart(dynamic data) {
    // Placeholder for customer acquisition chart
    // The chart functionality will be implemented in a future update
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'New Customers Trend',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Center(
              child: Text(
                'Chart data loading...',
                style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOperationsTab(dynamic data) {
    final operations = data.operations;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader('Operations Metrics'),
        const SizedBox(height: 12),
        _buildMetricsGrid([
          (
            'Daily Transactions',
            '${operations?.dailyTransactions ?? 0}',
            Icons.receipt,
            Color(0xFF3B82F6),
          ),
          (
            'Peak Hours',
            '${operations?.peakHours ?? "N/A"}',
            Icons.schedule,
            Color(0xFF2E7D32),
          ),
          (
            'Staff Efficiency',
            '${operations?.staffEfficiency ?? 0}%',
            Icons.trending_up,
            Color(0xFFA855F7),
          ),
          (
            'System Uptime',
            '${operations?.systemUptime ?? 0}%',
            Icons.cloud_done,
            Color(0xFFF59E0B),
          ),
          (
            'Avg Transaction Time',
            '${operations?.averageTransactionTime ?? 0} min',
            Icons.timer,
            Color(0xFFDC2626),
          ),
          (
            'Total Transactions',
            '${operations?.totalTransactions ?? 0}',
            Icons.shopping_cart,
            Color(0xFF06B6D4),
          ),
        ]),
        const SizedBox(height: 28),
        _buildSectionHeader('Hourly Transaction Pattern'),
        const SizedBox(height: 12),
        _buildHourlyPatternCard(
          operations?.hourlyPattern ?? List.filled(24, 0),
        ),
        const SizedBox(height: 28),
        _buildSectionHeader('Weekly Performance'),
        const SizedBox(height: 12),
        _buildWeeklyPerformanceCard(operations?.weeklyPerformance),
        const SizedBox(height: 28),
        _buildSectionHeader('Sales by Category'),
        const SizedBox(height: 12),
        _buildCategoryDistributionCard(operations?.categoryDistribution ?? []),
      ],
    );
  }

  Widget _buildHourlyPatternCard(List<int> hourlyPattern) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Transactions by Hour',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 200,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(hourlyPattern.length, (index) {
                  final maxValue = hourlyPattern
                      .reduce((a, b) => a > b ? a : b)
                      .toDouble();
                  final value = hourlyPattern[index].toDouble();
                  final height = maxValue > 0 ? (value / maxValue) * 150 : 0.0;

                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          '${hourlyPattern[index]}',
                          style: const TextStyle(
                            fontSize: 10,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          width: 20,
                          height: height,
                          decoration: BoxDecoration(
                            color: const Color(0xFF2E7D32),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${index}h',
                          style: const TextStyle(
                            fontSize: 9,
                            color: Color(0xFF9CA3AF),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWeeklyPerformanceCard(dynamic weeklyPerformance) {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final sales =
        (weeklyPerformance?.sales as List?)?.cast<int>() ?? List.filled(7, 0);
    final transactions =
        (weeklyPerformance?.transactions as List?)?.cast<int>() ??
        List.filled(7, 0);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Weekly Performance',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: days.length,
            itemBuilder: (context, index) {
              final maxSales = sales.reduce((a, b) => a > b ? a : b);
              final width = maxSales > 0
                  ? (sales[index] / maxSales) * 200
                  : 0.0;

              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          days[index],
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF111827),
                          ),
                        ),
                        Text(
                          '₹${sales[index]} | ${transactions[index]} txns',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      height: 8,
                      width: width,
                      decoration: BoxDecoration(
                        color: const Color(0xFF2E7D32),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryDistributionCard(List<dynamic> categoryDistribution) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Category Distribution',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          if (categoryDistribution.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No category data available',
                  style: TextStyle(color: Color(0xFF9CA3AF)),
                ),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: categoryDistribution.length,
              itemBuilder: (context, index) {
                final category = categoryDistribution[index];
                final revenue = category.revenue ?? 0.0;
                final maxRevenue = categoryDistribution
                    .map((c) => c.revenue ?? 0.0)
                    .reduce((a, b) => a > b ? a : b);
                final width = maxRevenue > 0
                    ? (revenue / maxRevenue) * 200
                    : 0.0;

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            category.category ?? 'Unknown',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF111827),
                            ),
                          ),
                          Text(
                            '₹${revenue.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFF2E7D32),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Container(
                        height: 8,
                        width: width,
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
