const StaffSalary = require('../models/StaffSalary');
const StaffSalaryConfig = require('../models/StaffSalaryConfig');
const StaffAttendance = require('../models/StaffAttendance');
const Staff = require('../models/Staff');
const asyncHandler = require('express-async-handler');

// @desc    Get payroll records for a specific month
// @route   GET /api/store-manager/payroll
// @access  Private (Store Manager only)
const getPayroll = asyncHandler(async (req, res) => {
  const { month } = req.query;
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`🔍 Fetching payroll for store: ${store.name} (${storeId})`);

    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month ? month.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];

    console.log(`📅 Payroll period: ${monthNum}/${year}`);

    // Get payroll records with staff details
    const payrollRecords = await StaffSalary.find({
      store: storeId,
      month: monthNum,
      year: year
    })
    .populate({
      path: 'staff',
      select: 'name email phone employeeId role department'
    })
    .sort({ 'staff.name': 1 })
    .lean();

    console.log(`✅ Found ${payrollRecords.length} payroll records`);

    if (payrollRecords.length > 0) {
      console.log('📋 Sample payroll record:', {
        staff: payrollRecords[0].staff?.name,
        netSalary: payrollRecords[0].netSalary,
        paymentStatus: payrollRecords[0].paymentStatus
      });
    }

    res.status(200).json({
      success: true,
      count: payrollRecords.length,
      month: monthNum,
      year: year,
      data: payrollRecords
    });

  } catch (error) {
    console.error('❌ Get payroll error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payroll records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get payroll statistics for a specific month
// @route   GET /api/store-manager/payroll/stats
// @access  Private (Store Manager only)
const getPayrollStats = asyncHandler(async (req, res) => {
  const { month } = req.query;
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`📊 Getting payroll stats for store: ${store.name} (${storeId})`);

    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month ? month.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];

    console.log(`📅 Payroll stats period: ${monthNum}/${year}`);

    // Get all active staff in the store
    const totalStaff = await Staff.countDocuments({
      store: storeId,
      status: 'active'
    });

    console.log(`👥 Total active staff: ${totalStaff}`);

    // Check if any payroll records exist for this store and month
    const payrollCount = await StaffSalary.countDocuments({
      store: storeId,
      month: monthNum,
      year: year
    });

    console.log(`📋 Payroll records found: ${payrollCount}`);

    // Get payroll statistics
    const stats = await StaffSalary.aggregate([
      {
        $match: {
          store: storeId,
          month: monthNum,
          year: year
        }
      },
      {
        $group: {
          _id: null,
          totalPayroll: { $sum: '$netSalary' },
          totalGross: { $sum: '$grossSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          processedCount: { $sum: 1 },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
            }
          },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0]
            }
          },
          avgSalary: { $avg: '$netSalary' }
        }
      }
    ]);

    let payrollStats = stats.length > 0 ? stats[0] : {
      totalPayroll: 0,
      totalGross: 0,
      totalDeductions: 0,
      processedCount: 0,
      paidCount: 0,
      pendingCount: 0,
      avgSalary: 0
    };

    // Calculate not processed count
    payrollStats.notProcessed = totalStaff - payrollStats.processedCount;
    payrollStats.totalStaff = totalStaff;

    // ✅ NEW: If no payroll processed, calculate expected payroll from salary configs
    if (payrollStats.processedCount === 0 && totalStaff > 0) {
      console.log('💡 No processed payroll found. Calculating expected payroll from salary configs...');

      // Get all active salary configurations for this store
      const salaryConfigs = await StaffSalaryConfig.find({
        store: storeId,
        status: 'active'
      }).populate('staff', 'name status');

      console.log(`📋 Found ${salaryConfigs.length} active salary configurations`);

      let expectedTotalPayroll = 0;
      let configCount = 0;

      for (const config of salaryConfigs) {
        // Only count active staff members
        if (config.staff && config.staff.status === 'active') {
          // Calculate expected gross salary
          let grossSalary = config.baseSalary || 0;

          // Add allowances
          if (config.allowances) {
            if (config.allowances.hra?.enabled) {
              grossSalary += config.allowances.hra.type === 'percentage'
                ? (config.baseSalary * (config.allowances.hra.value || 0)) / 100
                : (config.allowances.hra.value || 0);
            }
            if (config.allowances.da?.enabled) {
              grossSalary += config.allowances.da.type === 'percentage'
                ? (config.baseSalary * (config.allowances.da.value || 0)) / 100
                : (config.allowances.da.value || 0);
            }
            if (config.allowances.medical?.enabled) {
              grossSalary += config.allowances.medical.value || 0;
            }
            if (config.allowances.transport?.enabled) {
              grossSalary += config.allowances.transport.value || 0;
            }
            if (config.allowances.other?.enabled) {
              grossSalary += config.allowances.other.value || 0;
            }
          }

          // Calculate deductions
          let totalDeductions = 0;
          if (config.deductions) {
            if (config.deductions.pf?.enabled) {
              totalDeductions += config.deductions.pf.type === 'percentage'
                ? (grossSalary * (config.deductions.pf.value || 0)) / 100
                : (config.deductions.pf.value || 0);
            }
            if (config.deductions.esi?.enabled) {
              totalDeductions += config.deductions.esi.type === 'percentage'
                ? (grossSalary * (config.deductions.esi.value || 0)) / 100
                : (config.deductions.esi.value || 0);
            }
            if (config.deductions.tds?.enabled) {
              totalDeductions += config.deductions.tds.type === 'percentage'
                ? (grossSalary * (config.deductions.tds.value || 0)) / 100
                : (config.deductions.tds.value || 0);
            }
            if (config.deductions.other?.enabled) {
              totalDeductions += config.deductions.other.value || 0;
            }
          }

          const netSalary = grossSalary - totalDeductions;
          expectedTotalPayroll += netSalary;
          configCount++;

          console.log(`  💰 ${config.staff.name}: Base ₹${config.baseSalary} → Net ₹${Math.round(netSalary)}`);
        }
      }

      // Update stats with expected values
      payrollStats.expectedTotalPayroll = Math.round(expectedTotalPayroll);
      payrollStats.expectedAvgSalary = configCount > 0 ? Math.round(expectedTotalPayroll / configCount) : 0;
      payrollStats.staffWithConfigs = configCount;
      payrollStats.isExpected = true; // Flag to indicate these are expected values

      console.log(`💡 Expected payroll calculated: ₹${payrollStats.expectedTotalPayroll} for ${configCount} staff`);
    }

    console.log('📊 Payroll stats calculated:', {
      totalPayroll: payrollStats.totalPayroll,
      expectedTotalPayroll: payrollStats.expectedTotalPayroll,
      paidCount: payrollStats.paidCount,
      pendingCount: payrollStats.pendingCount,
      avgSalary: payrollStats.avgSalary,
      expectedAvgSalary: payrollStats.expectedAvgSalary,
      totalStaff: payrollStats.totalStaff,
      processedCount: payrollStats.processedCount,
      notProcessed: payrollStats.notProcessed,
      isExpected: payrollStats.isExpected
    });

    res.status(200).json({
      success: true,
      month: monthNum,
      year: year,
      data: payrollStats
    });

  } catch (error) {
    console.error('❌ Get payroll stats error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payroll statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Process payroll for a specific month
// @route   POST /api/store-manager/payroll/process
// @access  Private (Store Manager only)
const processPayroll = asyncHandler(async (req, res) => {
  const { month, staffIds } = req.body; // staffIds is optional - if not provided, process all staff
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`💰 Processing payroll for store: ${store.name}`);

    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);

    // ✅ FIX #8: Validate that attendance data exists for the month
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    const attendanceCount = await StaffAttendance.countDocuments({
      store: storeId,
      date: { $gte: startDate, $lte: endDate }
    });

    if (attendanceCount === 0) {
      return res.status(400).json({
        success: false,
        message: `No attendance records found for ${new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Please mark attendance before processing payroll.`
      });
    }

    console.log(`📊 Found ${attendanceCount} attendance records for the month`);

    // Get staff to process
    let staffQuery = { store: storeId, status: 'active' };
    if (staffIds && staffIds.length > 0) {
      staffQuery._id = { $in: staffIds };
    }

    const staffMembers = await Staff.find(staffQuery);
    console.log(`👥 Processing payroll for ${staffMembers.length} staff members`);

    const results = [];
    const errors = [];

    for (const staffMember of staffMembers) {
      try {
        // Check if payroll already exists
        const existingPayroll = await StaffSalary.findOne({
          staff: staffMember._id,
          month: monthNum,
          year: year
        });

        if (existingPayroll) {
          errors.push({
            staffId: staffMember._id,
            staffName: staffMember.name,
            error: 'Payroll already processed for this month'
          });
          continue;
        }

        // Get staff salary configuration
        const salaryConfig = await StaffSalaryConfig.findOne({ 
          staff: staffMember._id,
          status: 'active'
        });

        if (!salaryConfig) {
          errors.push({
            staffId: staffMember._id,
            staffName: staffMember.name,
            error: 'Salary configuration not found'
          });
          continue;
        }

        // Calculate attendance-based salary
        const payrollData = await calculatePayrollForStaff(staffMember, salaryConfig, monthNum, year, storeId);
        
        // Create payroll record
        const payroll = await StaffSalary.create({
          ...payrollData,
          createdBy: req.user._id
        });

        results.push({
          staffId: staffMember._id,
          staffName: staffMember.name,
          payrollId: payroll._id,
          netSalary: payroll.netSalary
        });

        console.log(`✅ Processed payroll for ${staffMember.name}: ₹${payroll.netSalary}`);

      } catch (error) {
        console.error(`❌ Error processing payroll for ${staffMember.name}:`, error);
        errors.push({
          staffId: staffMember._id,
          staffName: staffMember.name,
          error: error.message
        });
      }
    }

    console.log(`✅ Payroll processing complete: ${results.length} successful, ${errors.length} errors`);

    res.status(200).json({
      success: true,
      message: `Payroll processed: ${results.length} successful, ${errors.length} errors`,
      data: {
        successful: results,
        errors: errors,
        month: monthNum,
        year: year
      }
    });

  } catch (error) {
    console.error('❌ Process payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing payroll',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to calculate payroll for a staff member
const calculatePayrollForStaff = async (staffMember, salaryConfig, month, year, storeId) => {
  // Get attendance data for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of the month

  const attendanceRecords = await StaffAttendance.find({
    staff: staffMember._id,
    store: storeId,
    date: { $gte: startDate, $lte: endDate }
  });

  // Calculate working days and hours
  const totalDaysInMonth = endDate.getDate();
  const workingDays = attendanceRecords.filter(record => 
    ['present', 'late', 'half_day'].includes(record.status)
  ).length;
  
  const absentDays = attendanceRecords.filter(record => 
    record.status === 'absent'
  ).length;

  const halfDays = attendanceRecords.filter(record => 
    record.status === 'half_day'
  ).length;

  // Calculate total working hours
  let totalWorkingHours = 0;
  let overtimeHours = 0;

  attendanceRecords.forEach(record => {
    if (record.workingHours && record.workingHours.actual) {
      totalWorkingHours += record.workingHours.actual;
      if (record.workingHours.overtime) {
        overtimeHours += record.workingHours.overtime;
      }
    }
  });

  // ✅ FIX #2: Improved salary calculation with proper pro-rating
  const standardWorkingDays = 26; // Assuming 26 working days in a month
  const actualWorkingDays = workingDays - (halfDays * 0.5);

  // Calculate base salary (use full base salary, deductions will handle absences)
  const baseSalaryForMonth = salaryConfig.baseSalary;

  // ✅ FIX #3: Calculate allowances based on FULL base salary
  const allowancesCalc = salaryConfig.calculateAllowances();

  // ✅ FIX #4: Calculate overtime pay properly
  const hourlyRate = salaryConfig.hourlyRate || (salaryConfig.baseSalary / (standardWorkingDays * 8));
  const overtimeRate = salaryConfig.overtimeConfig?.rate || 1.5;
  const overtimePay = overtimeHours * hourlyRate * overtimeRate;

  // ✅ FIX #5: Calculate deductions based on base salary
  const deductionsCalc = salaryConfig.calculateDeductions(baseSalaryForMonth);

  // ✅ FIX #6: Calculate absent deduction correctly
  const perDayRate = salaryConfig.baseSalary / standardWorkingDays;
  const absentDeduction = perDayRate * absentDays;

  // Build allowances object with overtime
  const allowancesObj = {
    ...allowancesCalc.breakdown,
    overtime: {
      hours: overtimeHours,
      rate: hourlyRate * overtimeRate,
      amount: overtimePay
    }
  };

  // Build deductions object with absent deduction
  const deductionsObj = {
    ...deductionsCalc.breakdown,
    absentDeduction: {
      days: absentDays,
      perDayRate: perDayRate,
      amount: absentDeduction
    }
  };

  // ✅ FIX #7: Let pre-save middleware calculate totals
  // Don't calculate grossSalary and netSalary here - the model will do it
  return {
    staff: staffMember._id,
    user: staffMember.user,
    store: storeId,
    month: month,
    year: year,
    baseSalary: baseSalaryForMonth,
    allowances: allowancesObj,
    deductions: deductionsObj,
    // Don't set grossSalary and netSalary - let pre-save middleware calculate them
    attendanceData: {
      totalWorkingDays: totalDaysInMonth,
      daysWorked: actualWorkingDays,
      daysAbsent: absentDays,
      halfDays: halfDays,
      overtimeHours: overtimeHours,
      lateMarks: 0
    },
    paymentStatus: 'pending',
    approvalStatus: 'draft'
  };
};

// @desc    Get staff salary configurations
// @route   GET /api/store-manager/payroll/salary-configs
// @access  Private (Store Manager only)
const getSalaryConfigs = asyncHandler(async (req, res) => {
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`⚙️ Getting salary configs for store: ${store.name}`);

    // Get all staff with their salary configurations
    const staffWithConfigs = await Staff.aggregate([
      { $match: { store: storeId, status: 'active' } },
      {
        $lookup: {
          from: 'staffsalaryconfigs',
          localField: '_id',
          foreignField: 'staff',
          as: 'salaryConfig'
        }
      },
      {
        $addFields: {
          salaryConfig: { $arrayElemAt: ['$salaryConfig', 0] },
          hasConfig: { $gt: [{ $size: '$salaryConfig' }, 0] }
        }
      },
      { $sort: { name: 1 } }
    ]);

    console.log(`✅ Found ${staffWithConfigs.length} staff members`);

    res.status(200).json({
      success: true,
      count: staffWithConfigs.length,
      data: staffWithConfigs
    });

  } catch (error) {
    console.error('❌ Get salary configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching salary configurations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Create or update staff salary configuration
// @route   POST /api/store-manager/payroll/salary-config
// @access  Private (Store Manager only)
const createOrUpdateSalaryConfig = asyncHandler(async (req, res) => {
  const { staffId, salaryConfig } = req.body;
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`💰 Creating/updating salary config for staff: ${staffId}`);

    // Validate staff belongs to this store
    const staff = await Staff.findOne({ _id: staffId, store: storeId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in this store'
      });
    }

    // Check if config already exists
    let config = await StaffSalaryConfig.findOne({ staff: staffId });

    const configData = {
      staff: staffId,
      store: storeId,
      ...salaryConfig,
      updatedBy: req.user._id
    };

    if (config) {
      // Update existing config
      config = await StaffSalaryConfig.findByIdAndUpdate(
        config._id,
        configData,
        { new: true, runValidators: true }
      ).populate('staff', 'name email role');

      console.log(`✅ Updated salary config for ${staff.name}`);
    } else {
      // Create new config
      configData.createdBy = req.user._id;
      config = await StaffSalaryConfig.create(configData);

      config = await StaffSalaryConfig.findById(config._id).populate('staff', 'name email role');

      console.log(`✅ Created new salary config for ${staff.name}`);
    }

    res.status(200).json({
      success: true,
      message: `Salary configuration ${config.isNew ? 'created' : 'updated'} for ${staff.name}`,
      data: config
    });

  } catch (error) {
    console.error('❌ Create/update salary config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while managing salary configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update payroll status (approve/reject/pay)
// @route   PUT /api/store-manager/payroll/:id/status
// @access  Private (Store Manager only)
const updatePayrollStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, paymentMethod, paymentReference, notes } = req.body;
  const store = req.store;

  try {
    console.log(`📝 Updating payroll status: ${id} -> ${status}`);

    // Find payroll record
    const payroll = await StaffSalary.findOne({
      _id: id,
      store: store._id
    }).populate('staff', 'name email');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    const updateData = {
      updatedBy: req.user._id
    };

    if (status === 'approved') {
      updateData.approvalStatus = 'approved';
      updateData.approvedBy = req.user._id;
      updateData.approvedAt = new Date();
    } else if (status === 'rejected') {
      updateData.approvalStatus = 'rejected';
      updateData.rejectionReason = notes;
    } else if (status === 'paid') {
      updateData.paymentStatus = 'paid';
      updateData.paymentDate = new Date();
      updateData.paymentMethod = paymentMethod;
      updateData.paymentReference = paymentReference;
      updateData.approvalStatus = 'approved'; // Auto-approve when paid
      updateData.approvedBy = req.user._id;
      updateData.approvedAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    const updatedPayroll = await StaffSalary.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('staff', 'name email');

    console.log(`✅ Updated payroll status for ${payroll.staff.name}: ${status}`);

    res.status(200).json({
      success: true,
      message: `Payroll ${status} for ${payroll.staff.name}`,
      data: updatedPayroll
    });

  } catch (error) {
    console.error('❌ Update payroll status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payroll status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Generate payslip for a staff member
// @route   GET /api/store-manager/payroll/:id/payslip
// @access  Private (Store Manager only)
const generatePayslip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const store = req.store;

  try {
    console.log(`📄 Generating payslip for payroll: ${id}`);

    // Find payroll record with all details
    const payroll = await StaffSalary.findOne({
      _id: id,
      store: store._id
    })
    .populate('staff', 'name email phone employeeId role department')
    .populate('store', 'name address phone email')
    .lean();

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Generate payslip data
    const payslipData = {
      payrollId: payroll._id,
      staff: payroll.staff,
      store: payroll.store,
      salaryPeriod: `${getMonthName(payroll.month)} ${payroll.year}`,
      month: payroll.month,
      year: payroll.year,
      generatedDate: new Date(),

      // Salary breakdown
      baseSalary: payroll.baseSalary,
      actualBaseSalary: payroll.actualBaseSalary,
      allowances: payroll.allowances,
      totalAllowances: payroll.totalAllowances,
      grossSalary: payroll.grossSalary,

      // Deductions
      deductions: payroll.deductions,
      totalDeductions: payroll.totalDeductions,

      // Net salary
      netSalary: payroll.netSalary,

      // Working details
      workingDays: payroll.workingDays,
      workingHours: payroll.workingHours,

      // Payment details
      paymentStatus: payroll.paymentStatus,
      paymentDate: payroll.paymentDate,
      paymentMethod: payroll.paymentMethod,
      paymentReference: payroll.paymentReference
    };

    // Mark payslip as generated
    await StaffSalary.findByIdAndUpdate(id, {
      payslipGenerated: true,
      updatedBy: req.user._id
    });

    console.log(`✅ Generated payslip for ${payroll.staff.name}`);

    res.status(200).json({
      success: true,
      message: `Payslip generated for ${payroll.staff.name}`,
      data: payslipData
    });

  } catch (error) {
    console.error('❌ Generate payslip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating payslip',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to get month name
const getMonthName = (monthNum) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNum - 1];
};

// @desc    Initialize salary configurations for staff without configs
// @route   POST /api/store-manager/payroll/init-salary-configs
// @access  Private (Store Manager only)
const initializeSalaryConfigs = asyncHandler(async (req, res) => {
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`🔧 Initializing salary configs for store: ${store.name}`);

    // Get all active staff without salary configurations
    const staffWithoutConfigs = await Staff.aggregate([
      { $match: { store: storeId, status: 'active' } },
      {
        $lookup: {
          from: 'staffsalaryconfigs',
          localField: '_id',
          foreignField: 'staff',
          as: 'salaryConfig'
        }
      },
      {
        $match: { 'salaryConfig': { $size: 0 } }
      }
    ]);

    console.log(`👥 Found ${staffWithoutConfigs.length} staff members without salary configs`);

    const results = [];
    const errors = [];

    for (const staffMember of staffWithoutConfigs) {
      try {
        // Get default config for the staff role
        const defaultConfig = StaffSalaryConfig.getDefaultConfigForRole(staffMember.role);

        const configData = {
          staff: staffMember._id,
          store: storeId,
          ...defaultConfig,
          createdBy: req.user._id
        };

        const config = await StaffSalaryConfig.create(configData);

        results.push({
          staffId: staffMember._id,
          staffName: staffMember.name,
          role: staffMember.role,
          baseSalary: defaultConfig.baseSalary,
          configId: config._id
        });

        console.log(`✅ Created salary config for ${staffMember.name}: ₹${defaultConfig.baseSalary}`);

      } catch (error) {
        console.error(`❌ Error creating config for ${staffMember.name}:`, error);
        errors.push({
          staffId: staffMember._id,
          staffName: staffMember.name,
          error: error.message
        });
      }
    }

    console.log(`✅ Salary config initialization complete: ${results.length} successful, ${errors.length} errors`);

    res.status(200).json({
      success: true,
      message: `Salary configurations initialized: ${results.length} successful, ${errors.length} errors`,
      data: {
        successful: results,
        errors: errors
      }
    });

  } catch (error) {
    console.error('❌ Initialize salary configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while initializing salary configurations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  getPayroll,
  getPayrollStats,
  processPayroll,
  getSalaryConfigs,
  createOrUpdateSalaryConfig,
  updatePayrollStatus,
  generatePayslip,
  initializeSalaryConfigs
};
