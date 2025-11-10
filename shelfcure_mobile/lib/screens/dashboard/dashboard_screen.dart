import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/dashboard_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().fetchDashboardData();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: _buildModernAppBar(),
      body: Consumer<DashboardProvider>(
        builder: (context, dashboardProvider, _) {
          if (dashboardProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2E7D32)),
              ),
            );
          }

          if (dashboardProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    dashboardProvider.error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton.icon(
                        onPressed: () {
                          dashboardProvider.fetchDashboardData();
                        },
                        icon: const Icon(Icons.refresh),
                        label: const Text('Retry'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2E7D32),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 32,
                            vertical: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton.icon(
                        onPressed: () {
                          dashboardProvider.retryFetchDashboardData(
                            maxRetries: 3,
                          );
                        },
                        icon: const Icon(Icons.repeat),
                        label: const Text('Retry (3x)'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E40AF),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }

          final data = dashboardProvider.dashboardData;
          if (data == null) {
            return const Center(
              child: Text(
                'No data available',
                style: TextStyle(fontSize: 16, color: Color(0xFF6B7280)),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => dashboardProvider.refreshDashboardData(),
            color: const Color(0xFF2E7D32),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Alerts Section
                  if (data.lowStockAlert ||
                      data.expiringAlert ||
                      data.criticalExpiryAlert ||
                      data.outOfStockAlert)
                    _buildAlertsSection(data),

                  // Section Header
                  _buildSectionHeader('Financial Metrics'),
                  const SizedBox(height: 16),

                  // Financial Metrics - 3x2 Grid (6 cards)
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.1,
                    children: [
                      DashboardCard(
                        title: "Today's Sales",
                        value: '₹${data.todayRevenue.toStringAsFixed(0)}',
                        subtitle: '${data.todaySalesCount} transactions',
                        icon: Icons.trending_up,
                        color: const Color(0xFF22C55E),
                      ),
                      DashboardCard(
                        title: 'Month Sales',
                        value: '₹${data.monthRevenue.toStringAsFixed(0)}',
                        subtitle: '${data.monthSalesCount} transactions',
                        icon: Icons.calendar_today,
                        color: const Color(0xFF3B82F6),
                      ),
                      DashboardCard(
                        title: 'Total Profit',
                        value: '₹${data.totalProfit.toStringAsFixed(0)}',
                        subtitle: data.todayProfit > 0
                            ? 'Profitable'
                            : 'No profit today',
                        icon: Icons.trending_up,
                        color: data.todayProfit > 0
                            ? const Color(0xFF22C55E)
                            : const Color(0xFFF59E0B),
                      ),
                      DashboardCard(
                        title: 'Today Profit',
                        value: '₹${data.todayProfit.toStringAsFixed(0)}',
                        subtitle: data.todayProfit > 0
                            ? 'Profitable day'
                            : 'No profit today',
                        icon: Icons.trending_up,
                        color: data.todayProfit > 0
                            ? const Color(0xFF10B981)
                            : const Color(0xFF6B7280),
                      ),
                      DashboardCard(
                        title: 'Pending Credit',
                        value: '₹${data.pendingCredit.toStringAsFixed(0)}',
                        subtitle: '${data.creditCustomers} customers',
                        icon: Icons.credit_card,
                        color: const Color(0xFFF59E0B),
                      ),
                      DashboardCard(
                        title: 'Today Credit',
                        value: '₹${data.todayCredit.toStringAsFixed(0)}',
                        subtitle: data.todayCredit > 0
                            ? 'Credit given today'
                            : 'No credit given',
                        icon: Icons.schedule,
                        color: data.todayCredit > 0
                            ? const Color(0xFFD97706)
                            : const Color(0xFF6B7280),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Inventory Metrics
                  _buildSectionHeader('Inventory Metrics'),
                  const SizedBox(height: 16),
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.2,
                    children: [
                      DashboardCard(
                        title: 'Total Medicines',
                        value: '${data.totalMedicines}',
                        subtitle: '${data.inStockMedicines} in stock',
                        icon: Icons.local_pharmacy,
                        color: const Color(0xFFA855F7),
                      ),
                      DashboardCard(
                        title: 'Stock Value',
                        value: '₹${data.stockValue.toStringAsFixed(0)}',
                        subtitle:
                            '${(data.totalStrips + data.totalIndividualUnits).toString()} items',
                        icon: Icons.inventory,
                        color: const Color(0xFF6366F1),
                      ),
                      DashboardCard(
                        title: 'Low Stock',
                        value: '${data.lowStockMedicines}',
                        subtitle: 'Need restocking',
                        icon: Icons.warning,
                        color: const Color(0xFFF59E0B),
                      ),
                      DashboardCard(
                        title: 'Out of Stock',
                        value: '${data.outOfStock}',
                        subtitle: '${data.expiredMedicines} expired',
                        icon: Icons.block,
                        color: const Color(0xFFEF4444),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Customer Metrics
                  _buildSectionHeader('Customer Metrics'),
                  const SizedBox(height: 16),
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.2,
                    children: [
                      DashboardCard(
                        title: 'Total Customers',
                        value: '${data.totalCustomers}',
                        subtitle:
                            '${data.newCustomersThisMonth} new this month',
                        icon: Icons.people,
                        color: const Color(0xFF14B8A6),
                      ),
                      DashboardCard(
                        title: 'Today Returns',
                        value: '₹${data.todayReturns.toStringAsFixed(0)}',
                        subtitle: '${data.todayReturnsCount} returns',
                        icon: Icons.undo,
                        color: const Color(0xFFFBBF24),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Expiry Tracking
                  _buildSectionHeader('Expiry Tracking'),
                  const SizedBox(height: 16),
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.2,
                    children: [
                      DashboardCard(
                        title: 'Expiring Soon',
                        value: '${data.expiring30Days}',
                        subtitle: 'Within 30 days',
                        icon: Icons.schedule,
                        color: const Color(0xFFFF7F50),
                      ),
                      DashboardCard(
                        title: 'Critical (7 Days)',
                        value: '${data.critical7Days}',
                        subtitle: 'Urgent action needed',
                        icon: Icons.error,
                        color: const Color(0xFFEF4444),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Expiring Medicines List
                  _buildSectionHeader('Expiring Medicines'),
                  const SizedBox(height: 16),
                  if (data.expiringMedicines.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: const Color(0xFFE5E7EB),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            Icons.check_circle_outline,
                            size: 48,
                            color: Colors.grey.withValues(alpha: 0.3),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'No medicines expiring soon',
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFF6B7280),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: data.expiringMedicines.length > 5
                          ? 5
                          : data.expiringMedicines.length,
                      itemBuilder: (context, index) {
                        final medicine = data.expiringMedicines[index];
                        final daysUntilExpiry = medicine.expiryDate
                            .difference(DateTime.now())
                            .inDays;
                        final isUrgent = daysUntilExpiry <= 7;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isUrgent
                                ? const Color(0xFFFFEBEE)
                                : const Color(0xFFFFF3E0),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isUrgent
                                  ? const Color(0xFFEF5350)
                                  : const Color(0xFFFFB74D),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color:
                                      (isUrgent
                                              ? const Color(0xFFEF4444)
                                              : const Color(0xFFFF7F50))
                                          .withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  isUrgent
                                      ? Icons.warning_amber
                                      : Icons.schedule,
                                  color: isUrgent
                                      ? const Color(0xFFEF4444)
                                      : const Color(0xFFFF7F50),
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      medicine.name,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF111827),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Batch: ${medicine.batchNumber}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF6B7280),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    medicine.expiryDate
                                        .toLocal()
                                        .toString()
                                        .split(' ')[0],
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: isUrgent
                                          ? const Color(0xFFEF4444)
                                          : const Color(0xFFFF7F50),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    daysUntilExpiry > 0
                                        ? '$daysUntilExpiry days'
                                        : 'Expired',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isUrgent
                                          ? const Color(0xFFEF4444)
                                          : const Color(0xFF6B7280),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  const SizedBox(height: 28),

                  // Waste Management
                  _buildSectionHeader('Waste Management'),
                  const SizedBox(height: 16),
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.2,
                    children: [
                      DashboardCard(
                        title: 'Waste Impact',
                        value: '₹${data.wasteImpact.toStringAsFixed(0)}',
                        subtitle: '${data.wasteIncidents} incidents',
                        icon: Icons.warning_amber,
                        color: const Color(0xFFEF4444),
                      ),
                      DashboardCard(
                        title: 'Preventable Waste',
                        value: '₹${data.preventableWaste.toStringAsFixed(0)}',
                        subtitle:
                            '${data.wastePercentage.toStringAsFixed(1)}% of total',
                        icon: Icons.shield,
                        color: const Color(0xFFEAB308),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Recent Sales
                  _buildSectionHeader('Recent Sales'),
                  const SizedBox(height: 16),
                  if (data.recentSales.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: const Color(0xFFE5E7EB),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            Icons.shopping_cart_outlined,
                            size: 48,
                            color: Colors.grey.withValues(alpha: 0.3),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'No recent sales',
                            style: TextStyle(
                              fontSize: 16,
                              color: Color(0xFF6B7280),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: data.recentSales.length,
                      itemBuilder: (context, index) {
                        final sale = data.recentSales[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: const Color(0xFFE5E7EB),
                              width: 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.03),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: const Color(
                                    0xFF2E7D32,
                                  ).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.receipt_long,
                                  color: Color(0xFF2E7D32),
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      sale.invoiceNumber,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF111827),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      sale.customerName ?? 'Walk-in Customer',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF6B7280),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                '₹${sale.amount.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: Color(0xFF2E7D32),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  const SizedBox(height: 28),

                  // Doctor Commissions
                  _buildSectionHeader('Doctor Commissions'),
                  const SizedBox(height: 16),
                  DashboardCard(
                    title: 'Total Commissions',
                    value: '₹${data.totalDoctorCommissions.toStringAsFixed(0)}',
                    subtitle: 'Earned from doctor prescriptions',
                    icon: Icons.medical_services,
                    color: const Color(0xFF22C55E),
                  ),
                  const SizedBox(height: 24),
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
        'Dashboard',
        style: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      backgroundColor: const Color(0xFF2E7D32),
      elevation: 0,
      actions: [
        IconButton(
          icon: const Icon(Icons.logout, color: Colors.white),
          onPressed: () {
            context.read<AuthProvider>().logout();
            Navigator.of(context).pushReplacementNamed('/login');
          },
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Color(0xFF111827),
        letterSpacing: -0.3,
      ),
    );
  }

  Widget _buildAlertsSection(dynamic data) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFECACA), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.red.withValues(alpha: 0.1),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFDC2626),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.warning_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Active Alerts',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF7F1D1D),
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (data.lowStockAlert)
            _buildAlertItem(
              '${data.lowStockMedicines} medicines have low stock',
              const Color(0xFFF59E0B),
            ),
          if (data.expiringAlert)
            _buildAlertItem(
              '${data.expiring30Days} medicines expiring soon',
              const Color(0xFFFF7F50),
            ),
          if (data.criticalExpiryAlert)
            _buildAlertItem(
              '${data.critical7Days} medicines critical (7 days)',
              const Color(0xFFDC2626),
            ),
          if (data.outOfStockAlert)
            _buildAlertItem(
              '${data.outOfStock} medicines out of stock',
              const Color(0xFFDC2626),
            ),
        ],
      ),
    );
  }

  Widget _buildAlertItem(String text, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 4,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF7F1D1D),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
