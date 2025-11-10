import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/sales_provider.dart';
import '../../providers/medicine_provider.dart';
import '../../providers/customer_provider.dart';
import '../../providers/doctor_provider.dart';
import 'sale_detail_screen.dart';

class SalesScreen extends StatefulWidget {
  const SalesScreen({Key? key}) : super(key: key);

  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();

  // Customer and Doctor modal states
  bool _showCustomerModal = false;
  bool _showDoctorModal = false;
  late TextEditingController _customerSearchController;
  late TextEditingController _doctorSearchController;
  final TextEditingController _newCustomerNameController =
      TextEditingController();
  final TextEditingController _newCustomerPhoneController =
      TextEditingController();
  final TextEditingController _newCustomerEmailController =
      TextEditingController();
  final TextEditingController _newCustomerAddressController =
      TextEditingController();
  final TextEditingController _newDoctorNameController =
      TextEditingController();
  final TextEditingController _newDoctorPhoneController =
      TextEditingController();
  final TextEditingController _newDoctorSpecializationController =
      TextEditingController();
  final TextEditingController _newDoctorEmailController =
      TextEditingController();
  final TextEditingController _newDoctorCommissionController =
      TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _customerSearchController = TextEditingController();
    _doctorSearchController = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SalesProvider>().fetchSales();
      context.read<CustomerProvider>().fetchCustomers();
      context.read<DoctorProvider>().fetchDoctors();
    });
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      context.read<SalesProvider>().loadMore();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    _customerSearchController.dispose();
    _doctorSearchController.dispose();
    _newCustomerNameController.dispose();
    _newCustomerPhoneController.dispose();
    _newCustomerEmailController.dispose();
    _newCustomerAddressController.dispose();
    _newDoctorNameController.dispose();
    _newDoctorPhoneController.dispose();
    _newDoctorSpecializationController.dispose();
    _newDoctorEmailController.dispose();
    _newDoctorCommissionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildModernAppBar(),
      backgroundColor: const Color(0xFFF9FAFB),
      body: Column(
        children: [
          _buildTabBar(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [_buildPOSTab(context), _buildHistoryTab(context)],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: Colors.white,
      child: TabBar(
        controller: _tabController,
        labelColor: const Color(0xFF2E7D32),
        unselectedLabelColor: const Color(0xFF9CA3AF),
        indicatorColor: const Color(0xFF2E7D32),
        indicatorWeight: 3,
        labelStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        unselectedLabelStyle: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
        tabs: const [
          Tab(text: 'POS'),
          Tab(text: 'History'),
        ],
      ),
    );
  }

  Widget _buildPOSTab(BuildContext context) {
    return Consumer3<MedicineProvider, CustomerProvider, DoctorProvider>(
      builder:
          (context, medicineProvider, customerProvider, doctorProvider, _) {
            return SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Customer Selection Section
                    _buildCustomerSelectionSection(context, customerProvider),
                    const SizedBox(height: 20),

                    // Doctor Selection Section
                    _buildDoctorSelectionSection(context, doctorProvider),
                    const SizedBox(height: 20),

                    // Search Section
                    _buildSearchSection(context, medicineProvider),
                    const SizedBox(height: 20),

                    // Search Results Section
                    if (medicineProvider.searchQuery.isNotEmpty)
                      _buildSearchResultsSection(context, medicineProvider),

                    // Shopping Cart Section
                    _buildCartSection(context, medicineProvider),
                    const SizedBox(height: 20),

                    // Order Summary Section
                    _buildOrderSummarySection(
                      context,
                      medicineProvider,
                      customerProvider,
                      doctorProvider,
                    ),
                  ],
                ),
              ),
            );
          },
    );
  }

  Widget _buildCustomerSelectionSection(
    BuildContext context,
    CustomerProvider customerProvider,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Select Customer',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF111827),
                  ),
                ),
                if (customerProvider.selectedCustomer != null)
                  GestureDetector(
                    onTap: () {
                      customerProvider.clearCustomer();
                      _customerSearchController.clear();
                    },
                    child: const Text(
                      'Clear',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF2E7D32),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (customerProvider.isLoading)
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F9FF),
                  border: Border.all(color: const Color(0xFF0EA5E9)),
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.all(12),
                child: const Row(
                  children: [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Color(0xFF2E7D32),
                        ),
                      ),
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Loading customers...',
                      style: TextStyle(fontSize: 12, color: Color(0xFF0EA5E9)),
                    ),
                  ],
                ),
              ),
            if (customerProvider.isLoading) const SizedBox(height: 8),
            if (!customerProvider.isLoading &&
                customerProvider.customers.isNotEmpty)
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  border: Border.all(color: const Color(0xFF86EFAC)),
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.all(12),
                child: Text(
                  'Customers loaded: ${customerProvider.customers.length}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF16A34A),
                  ),
                ),
              ),
            if (!customerProvider.isLoading &&
                customerProvider.customers.isNotEmpty)
              const SizedBox(height: 8),
            if (customerProvider.selectedCustomer == null)
              Column(
                children: [
                  TextField(
                    controller: _customerSearchController,
                    onChanged: (value) =>
                        customerProvider.searchCustomers(value),
                    decoration: InputDecoration(
                      hintText: 'Search customer by name or phone number...',
                      hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
                      prefixIcon: const Icon(
                        Icons.search,
                        color: Color(0xFF2E7D32),
                      ),
                      suffixIcon: _customerSearchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(
                                Icons.clear,
                                color: Color(0xFF6B7280),
                              ),
                              onPressed: () {
                                _customerSearchController.clear();
                                customerProvider.searchCustomers('');
                              },
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(
                          color: Color(0xFF2E7D32),
                          width: 2,
                        ),
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF9FAFB),
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (customerProvider.error != null)
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEE2E2),
                        border: Border.all(color: const Color(0xFFFCA5A5)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        customerProvider.error!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFFDC2626),
                        ),
                      ),
                    ),
                  if (customerProvider.error != null) const SizedBox(height: 8),
                  if (customerProvider.searchResults.isNotEmpty)
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: customerProvider.searchResults.length,
                        itemBuilder: (context, index) {
                          final customer =
                              customerProvider.searchResults[index];
                          return Material(
                            child: InkWell(
                              onTap: () {
                                customerProvider.selectCustomer(customer);
                                _customerSearchController.text =
                                    '${customer.name} - ${customer.phone}';
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  border:
                                      index <
                                          customerProvider
                                                  .searchResults
                                                  .length -
                                              1
                                      ? Border(
                                          bottom: BorderSide(
                                            color: const Color(0xFFE5E7EB),
                                          ),
                                        )
                                      : null,
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      customer.name,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF111827),
                                      ),
                                    ),
                                    Text(
                                      customer.phone,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF6B7280),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  if (_customerSearchController.text.isNotEmpty &&
                      customerProvider.searchResults.isEmpty)
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.all(12),
                      child: const Text(
                        'No customers found. Try searching by name or phone number.',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          setState(() => _showCustomerModal = true),
                      icon: const Icon(Icons.add),
                      label: const Text('Add New Customer'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF2E7D32),
                        side: const BorderSide(color: Color(0xFF2E7D32)),
                      ),
                    ),
                  ),
                ],
              )
            else
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  border: Border.all(color: const Color(0xFF2E7D32)),
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Color(0xFF2E7D32)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            customerProvider.selectedCustomer!.name,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF111827),
                            ),
                          ),
                          Text(
                            customerProvider.selectedCustomer!.phone,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (_showCustomerModal)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      TextField(
                        controller: _newCustomerNameController,
                        decoration: InputDecoration(
                          hintText: 'Customer name',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _newCustomerPhoneController,
                        decoration: InputDecoration(
                          hintText: 'Phone (10 digits)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _newCustomerEmailController,
                        decoration: InputDecoration(
                          hintText: 'Email (optional)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _newCustomerAddressController,
                        decoration: InputDecoration(
                          hintText: 'Address (optional)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() => _showCustomerModal = false);
                                _newCustomerNameController.clear();
                                _newCustomerPhoneController.clear();
                                _newCustomerEmailController.clear();
                                _newCustomerAddressController.clear();
                              },
                              child: const Text('Cancel'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () async {
                                final success = await customerProvider
                                    .createCustomer(
                                      name: _newCustomerNameController.text,
                                      phone: _newCustomerPhoneController.text,
                                      email: _newCustomerEmailController.text,
                                      address:
                                          _newCustomerAddressController.text,
                                    );
                                if (!mounted) return;
                                if (success) {
                                  setState(() => _showCustomerModal = false);
                                  _newCustomerNameController.clear();
                                  _newCustomerPhoneController.clear();
                                  _newCustomerEmailController.clear();
                                  _newCustomerAddressController.clear();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Customer added successfully!',
                                      ),
                                    ),
                                  );
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        customerProvider.error ??
                                            'Failed to add customer',
                                      ),
                                    ),
                                  );
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF2E7D32),
                              ),
                              child: const Text('Add Customer'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDoctorSelectionSection(
    BuildContext context,
    DoctorProvider doctorProvider,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Select Doctor (Optional)',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF111827),
                  ),
                ),
                if (doctorProvider.selectedDoctor != null)
                  GestureDetector(
                    onTap: () => doctorProvider.clearDoctor(),
                    child: const Text(
                      'Clear',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF2E7D32),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (doctorProvider.selectedDoctor == null)
              Column(
                children: [
                  TextField(
                    onChanged: (value) => doctorProvider.searchDoctors(value),
                    decoration: InputDecoration(
                      hintText: 'Search by name or phone...',
                      hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
                      prefixIcon: const Icon(
                        Icons.search,
                        color: Color(0xFF2E7D32),
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(
                          color: Color(0xFF2E7D32),
                          width: 2,
                        ),
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF9FAFB),
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (doctorProvider.searchResults.isNotEmpty)
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: doctorProvider.searchResults.length,
                        itemBuilder: (context, index) {
                          final doctor = doctorProvider.searchResults[index];
                          return ListTile(
                            title: Text('Dr. ${doctor.name}'),
                            subtitle: Text(doctor.specialization ?? 'N/A'),
                            onTap: () => doctorProvider.selectDoctor(doctor),
                          );
                        },
                      ),
                    ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => setState(() => _showDoctorModal = true),
                      icon: const Icon(Icons.add),
                      label: const Text('Add New Doctor'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF2E7D32),
                        side: const BorderSide(color: Color(0xFF2E7D32)),
                      ),
                    ),
                  ),
                ],
              )
            else
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  border: Border.all(color: const Color(0xFF2E7D32)),
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Color(0xFF2E7D32)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dr. ${doctorProvider.selectedDoctor!.name}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF111827),
                            ),
                          ),
                          Text(
                            doctorProvider.selectedDoctor!.specialization ??
                                'N/A',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (_showDoctorModal)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      TextField(
                        controller: _newDoctorNameController,
                        decoration: InputDecoration(
                          hintText: 'Doctor name',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _newDoctorPhoneController,
                        decoration: InputDecoration(
                          hintText: 'Phone (10 digits)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _newDoctorSpecializationController,
                        decoration: InputDecoration(
                          hintText: 'Specialization',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _newDoctorEmailController,
                        decoration: InputDecoration(
                          hintText: 'Email (optional)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _newDoctorCommissionController,
                        decoration: InputDecoration(
                          hintText: 'Commission % (optional)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() => _showDoctorModal = false);
                                _newDoctorNameController.clear();
                                _newDoctorPhoneController.clear();
                                _newDoctorSpecializationController.clear();
                                _newDoctorEmailController.clear();
                                _newDoctorCommissionController.clear();
                              },
                              child: const Text('Cancel'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () async {
                                final success = await doctorProvider
                                    .createDoctor(
                                      name: _newDoctorNameController.text,
                                      phone: _newDoctorPhoneController.text,
                                      specialization:
                                          _newDoctorSpecializationController
                                              .text,
                                      email: _newDoctorEmailController.text,
                                      commissionRate:
                                          double.tryParse(
                                            _newDoctorCommissionController.text,
                                          ) ??
                                          0,
                                    );
                                if (!mounted) return;
                                if (success) {
                                  setState(() => _showDoctorModal = false);
                                  _newDoctorNameController.clear();
                                  _newDoctorPhoneController.clear();
                                  _newDoctorSpecializationController.clear();
                                  _newDoctorEmailController.clear();
                                  _newDoctorCommissionController.clear();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Doctor added successfully!',
                                      ),
                                    ),
                                  );
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        doctorProvider.error ??
                                            'Failed to add doctor',
                                      ),
                                    ),
                                  );
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF2E7D32),
                              ),
                              child: const Text('Add Doctor'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchSection(
    BuildContext context,
    MedicineProvider medicineProvider,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Search Medicines',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              onChanged: (value) {
                medicineProvider.searchMedicines(value);
              },
              decoration: InputDecoration(
                hintText: 'Search by name, generic name, or manufacturer...',
                hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
                prefixIcon: const Icon(Icons.search, color: Color(0xFF2E7D32)),
                suffixIcon: medicineProvider.searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Color(0xFF6B7280)),
                        onPressed: () {
                          medicineProvider.clearSearch();
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(
                    color: Color(0xFF2E7D32),
                    width: 2,
                  ),
                ),
                filled: true,
                fillColor: const Color(0xFFF9FAFB),
              ),
            ),
            if (medicineProvider.error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  medicineProvider.error!,
                  style: const TextStyle(
                    color: Color(0xFFDC2626),
                    fontSize: 12,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResultsSection(
    BuildContext context,
    MedicineProvider medicineProvider,
  ) {
    if (medicineProvider.isLoading) {
      return Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2E7D32)),
          ),
        ),
      );
    }

    if (medicineProvider.searchResults.isEmpty) {
      return Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            children: [
              Icon(
                Icons.search_off,
                size: 48,
                color: const Color(0xFF2E7D32).withValues(alpha: 0.3),
              ),
              const SizedBox(height: 12),
              const Text(
                'No medicines found',
                style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Search Results (${medicineProvider.searchResults.length})',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 12),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: medicineProvider.searchResults.length,
              itemBuilder: (context, index) {
                final medicine = medicineProvider.searchResults[index];
                return _buildMedicineCard(context, medicine, medicineProvider);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMedicineCard(
    BuildContext context,
    dynamic medicine,
    MedicineProvider medicineProvider,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      medicine.name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF111827),
                      ),
                    ),
                    if (medicine.genericName != null)
                      Text(
                        medicine.genericName!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    Text(
                      medicine.manufacturer,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              if (medicine.isExpiredMedicine)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDC2626).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Expired',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFDC2626),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (medicine.stripInfo != null &&
                        medicine.stripInfo!.stock > 0)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Strip: ₹${medicine.stripInfo!.sellingPrice.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF2E7D32),
                              ),
                            ),
                            Text(
                              'Stock: ${medicine.stripInfo!.stock.toInt()}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (medicine.individualInfo != null &&
                        medicine.individualInfo!.stock > 0)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Unit: ₹${medicine.individualInfo!.sellingPrice.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF2E7D32),
                            ),
                          ),
                          Text(
                            'Stock: ${medicine.individualInfo!.stock.toInt()}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (medicine.stripInfo != null && medicine.stripInfo!.stock > 0)
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      _showAddToCartDialog(
                        context,
                        medicine,
                        'strip',
                        medicineProvider,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2E7D32),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    child: const Text(
                      'Add Strip',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                ),
              if (medicine.stripInfo != null &&
                  medicine.stripInfo!.stock > 0 &&
                  medicine.individualInfo != null &&
                  medicine.individualInfo!.stock > 0)
                const SizedBox(width: 8),
              if (medicine.individualInfo != null &&
                  medicine.individualInfo!.stock > 0)
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      _showAddToCartDialog(
                        context,
                        medicine,
                        'individual',
                        medicineProvider,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2E7D32),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    child: const Text(
                      'Add Unit',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  void _showAddToCartDialog(
    BuildContext context,
    dynamic medicine,
    String unitType,
    MedicineProvider medicineProvider,
  ) {
    double quantity = 1;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text('Add ${medicine.name} to Cart'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Unit Type: ${unitType == 'strip' ? 'Strip' : 'Individual'}',
                style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    onPressed: () {
                      if (quantity > 1) {
                        setState(() => quantity--);
                      }
                    },
                    icon: const Icon(Icons.remove),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      quantity.toInt().toString(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      setState(() => quantity++);
                    },
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                medicineProvider.addToCart(medicine, quantity, unitType);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D32),
                foregroundColor: Colors.white,
              ),
              child: const Text('Add to Cart'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartSection(
    BuildContext context,
    MedicineProvider medicineProvider,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Shopping Cart (${medicineProvider.cartItemCount})',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF111827),
                  ),
                ),
                if (!medicineProvider.isCartEmpty)
                  TextButton(
                    onPressed: () {
                      medicineProvider.clearCart();
                    },
                    child: const Text(
                      'Clear',
                      style: TextStyle(color: Color(0xFFDC2626), fontSize: 12),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (medicineProvider.isCartEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Column(
                    children: [
                      Icon(
                        Icons.shopping_cart_outlined,
                        size: 48,
                        color: const Color(0xFF2E7D32).withValues(alpha: 0.3),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Cart is empty',
                        style: TextStyle(
                          fontSize: 14,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: medicineProvider.cartItems.length,
                itemBuilder: (context, index) {
                  final item = medicineProvider.cartItems[index];
                  return _buildCartItemCard(context, item, medicineProvider);
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartItemCard(
    BuildContext context,
    dynamic cartItem,
    MedicineProvider medicineProvider,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      cartItem.medicine.name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF111827),
                      ),
                    ),
                    Text(
                      '${cartItem.unitType == 'strip' ? 'Strip' : 'Individual'} - ₹${cartItem.unitPrice.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () {
                  medicineProvider.removeFromCart(
                    cartItem.medicine.id,
                    cartItem.unitType,
                  );
                },
                icon: const Icon(
                  Icons.delete_outline,
                  color: Color(0xFFDC2626),
                ),
                iconSize: 20,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () {
                      if (cartItem.quantity > 1) {
                        medicineProvider.updateCartQuantity(
                          cartItem.medicine.id,
                          cartItem.unitType,
                          cartItem.quantity - 1,
                        );
                      }
                    },
                    icon: const Icon(Icons.remove_circle_outline),
                    iconSize: 20,
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      cartItem.quantity.toInt().toString(),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      medicineProvider.updateCartQuantity(
                        cartItem.medicine.id,
                        cartItem.unitType,
                        cartItem.quantity + 1,
                      );
                    },
                    icon: const Icon(Icons.add_circle_outline),
                    iconSize: 20,
                  ),
                ],
              ),
              Text(
                '₹${cartItem.totalPrice.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E7D32),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOrderSummarySection(
    BuildContext context,
    MedicineProvider medicineProvider,
    CustomerProvider customerProvider,
    DoctorProvider doctorProvider,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Order Summary',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 12),
            // Customer Info
            if (customerProvider.selectedCustomer != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const Icon(
                      Icons.person,
                      size: 16,
                      color: Color(0xFF2E7D32),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Customer: ${customerProvider.selectedCustomer!.name}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF111827),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            // Doctor Info
            if (doctorProvider.selectedDoctor != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    const Icon(
                      Icons.medical_services,
                      size: 16,
                      color: Color(0xFF2E7D32),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Doctor: Dr. ${doctorProvider.selectedDoctor!.name}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF111827),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 12),
            _buildSummaryRow(
              'Subtotal',
              '₹${medicineProvider.subtotal.toStringAsFixed(2)}',
            ),
            const SizedBox(height: 8),
            _buildSummaryRow(
              'Discount (0%)',
              '-₹${medicineProvider.discountAmount.toStringAsFixed(2)}',
              isDiscount: true,
            ),
            const SizedBox(height: 8),
            _buildSummaryRow(
              'Tax (${medicineProvider.taxPercentage.toStringAsFixed(0)}%)',
              '₹${medicineProvider.taxAmount.toStringAsFixed(2)}',
              isTax: true,
            ),
            const Divider(height: 24),
            _buildSummaryRow(
              'Total',
              '₹${medicineProvider.total.toStringAsFixed(2)}',
              isTotal: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(
    String label,
    String value, {
    bool isDiscount = false,
    bool isTax = false,
    bool isTotal = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.w600 : FontWeight.w500,
            color: isTotal ? const Color(0xFF111827) : const Color(0xFF6B7280),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.w600 : FontWeight.w500,
            color: isDiscount
                ? const Color(0xFF059669)
                : isTotal
                ? const Color(0xFF2E7D32)
                : const Color(0xFF111827),
          ),
        ),
      ],
    );
  }

  Widget _buildHistoryTab(BuildContext context) {
    return Consumer<SalesProvider>(
      builder: (context, salesProvider, _) {
        // Show loading state only when initially loading
        if (salesProvider.isLoading && salesProvider.sales.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    Color(0xFF2E7D32),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Loading sales...',
                  style: TextStyle(color: Color(0xFF6B7280), fontSize: 14),
                ),
              ],
            ),
          );
        }

        // Show error state if there's an error and no sales
        if (salesProvider.error != null && salesProvider.sales.isEmpty) {
          return _buildErrorState(context, salesProvider);
        }

        // Show empty state only if no sales and not loading
        if (salesProvider.sales.isEmpty && !salesProvider.isLoading) {
          return Column(
            children: [
              _buildDateFilterSection(context, salesProvider),
              Expanded(child: _buildEmptyState()),
            ],
          );
        }

        return Column(
          children: [
            // Date Filter Section
            _buildDateFilterSection(context, salesProvider),

            // Sales List
            Expanded(
              child: RefreshIndicator(
                onRefresh: () => salesProvider.fetchSales(refresh: true),
                color: const Color(0xFF2E7D32),
                child: ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: salesProvider.sales.length,
                  itemBuilder: (context, index) {
                    final sale = salesProvider.sales[index];
                    return _buildSaleCard(context, sale);
                  },
                ),
              ),
            ),

            // Pagination Section
            _buildPaginationSection(context, salesProvider),
          ],
        );
      },
    );
  }

  Widget _buildDateFilterButton(
    String label,
    String value,
    String selectedValue,
    VoidCallback onTap,
  ) {
    final isSelected = value == selectedValue;
    return ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: isSelected ? const Color(0xFF2E7D32) : Colors.white,
        foregroundColor: isSelected ? Colors.white : const Color(0xFF111827),
        side: BorderSide(
          color: isSelected ? const Color(0xFF2E7D32) : const Color(0xFFE5E7EB),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      ),
    );
  }

  Widget _buildDateFilterSection(
    BuildContext context,
    SalesProvider salesProvider,
  ) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Preset Filter Buttons
          const Text(
            'Filter by Date',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildDateFilterButton(
                  'All',
                  'all',
                  salesProvider.selectedPreset,
                  () => salesProvider.filterByPreset('all'),
                ),
                const SizedBox(width: 8),
                _buildDateFilterButton(
                  'Today',
                  'today',
                  salesProvider.selectedPreset,
                  () => salesProvider.filterByPreset('today'),
                ),
                const SizedBox(width: 8),
                _buildDateFilterButton(
                  'Yesterday',
                  'yesterday',
                  salesProvider.selectedPreset,
                  () => salesProvider.filterByPreset('yesterday'),
                ),
                const SizedBox(width: 8),
                _buildDateFilterButton(
                  'Last 7 Days',
                  'last7days',
                  salesProvider.selectedPreset,
                  () => salesProvider.filterByPreset('last7days'),
                ),
                const SizedBox(width: 8),
                _buildDateFilterButton(
                  'Last 30 Days',
                  'last30days',
                  salesProvider.selectedPreset,
                  () => salesProvider.filterByPreset('last30days'),
                ),
                const SizedBox(width: 8),
                _buildDateFilterButton(
                  'This Month',
                  'thisMonth',
                  salesProvider.selectedPreset,
                  () => salesProvider.filterByPreset('thisMonth'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Custom Date Range
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: salesProvider.startDate ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now(),
                    );
                    if (picked != null && mounted) {
                      final endDate = salesProvider.endDate ?? DateTime.now();
                      salesProvider.filterByDateRange(picked, endDate);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.calendar_today,
                          size: 18,
                          color: Color(0xFF6B7280),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            salesProvider.startDate != null
                                ? 'From: ${salesProvider.startDate!.toString().split(' ')[0]}'
                                : 'From Date',
                            style: TextStyle(
                              fontSize: 13,
                              color: salesProvider.startDate != null
                                  ? const Color(0xFF111827)
                                  : const Color(0xFF9CA3AF),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: salesProvider.endDate ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now(),
                    );
                    if (picked != null && mounted) {
                      final startDate =
                          salesProvider.startDate ?? DateTime.now();
                      salesProvider.filterByDateRange(startDate, picked);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.calendar_today,
                          size: 18,
                          color: Color(0xFF6B7280),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            salesProvider.endDate != null
                                ? 'To: ${salesProvider.endDate!.toString().split(' ')[0]}'
                                : 'To Date',
                            style: TextStyle(
                              fontSize: 13,
                              color: salesProvider.endDate != null
                                  ? const Color(0xFF111827)
                                  : const Color(0xFF9CA3AF),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaginationSection(
    BuildContext context,
    SalesProvider salesProvider,
  ) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Sales Count and Page Info
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total Sales: ${salesProvider.totalSales}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF6B7280),
                ),
              ),
              Text(
                'Page ${salesProvider.currentPage} of ${salesProvider.totalPages}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF6B7280),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Pagination Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton.icon(
                onPressed: salesProvider.currentPage > 1
                    ? () => salesProvider.changePage(
                        salesProvider.currentPage - 1,
                      )
                    : null,
                icon: const Icon(Icons.chevron_left),
                label: const Text('Previous'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E7D32),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color(0xFFE5E7EB),
                  disabledForegroundColor: const Color(0xFF9CA3AF),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Page Numbers
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(salesProvider.totalPages, (index) {
                      final pageNum = index + 1;
                      final isCurrentPage =
                          pageNum == salesProvider.currentPage;
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: GestureDetector(
                          onTap: () => salesProvider.changePage(pageNum),
                          child: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: isCurrentPage
                                  ? const Color(0xFF2E7D32)
                                  : const Color(0xFFF3F4F6),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Center(
                              child: Text(
                                pageNum.toString(),
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: isCurrentPage
                                      ? Colors.white
                                      : const Color(0xFF6B7280),
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: salesProvider.currentPage < salesProvider.totalPages
                    ? () => salesProvider.changePage(
                        salesProvider.currentPage + 1,
                      )
                    : null,
                icon: const Icon(Icons.chevron_right),
                label: const Text('Next'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2E7D32),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color(0xFFE5E7EB),
                  disabledForegroundColor: const Color(0xFF9CA3AF),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildModernAppBar() {
    return AppBar(
      title: const Text(
        'Sales & POS',
        style: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      backgroundColor: const Color(0xFF2E7D32),
      elevation: 0,
    );
  }

  Widget _buildErrorState(BuildContext context, SalesProvider salesProvider) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFEE2E2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.error_outline,
              color: Color(0xFFDC2626),
              size: 48,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Error Loading Sales',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              salesProvider.error ?? 'An error occurred',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              salesProvider.fetchSales(refresh: true);
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2E7D32),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF2E7D32).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.shopping_cart_outlined,
              color: Color(0xFF2E7D32),
              size: 56,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No Sales Yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Create your first sale to get started',
            style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }

  Widget _buildSaleCard(BuildContext context, dynamic sale) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => SaleDetailScreen(sale: sale)),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF2E7D32).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.receipt_long,
                  color: Color(0xFF2E7D32),
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      sale.invoiceNumber,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      sale.customerName ?? 'Walk-in Customer',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${sale.date.day}/${sale.date.month}/${sale.date.year}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '₹${sale.finalAmount.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: Color(0xFF2E7D32),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: const Color(0xFF86EFAC),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      sale.status.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF166534),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
