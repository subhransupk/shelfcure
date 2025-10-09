const Doctor = require('../models/Doctor');
const Store = require('../models/Store');
const Commission = require('../models/Commission');
const DoctorStatsService = require('../services/doctorStatsService');
const CommissionPaymentService = require('../services/commissionPaymentService');
const asyncHandler = require('express-async-handler');

// Note: Commission payment tracking is now handled through real database records
// instead of in-memory storage

// @desc    Get all doctors for a store
// @route   GET /api/store-manager/doctors
// @access  Private (Store Manager only)
const getDoctors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, specialization, status } = req.query;
  const store = req.store; // Store is available from middleware
  const storeId = store._id;



  try {
    let query = { store: storeId };

    // Add status filter (show all by default)
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      console.log('Search term:', search);
      console.log('Search regex:', searchRegex);
      query.$or = [
        { name: searchRegex },
        { specialization: searchRegex },
        { 'hospital.name': searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ];
    }

    // Add specialization filter
    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }

    // Get total count for pagination
    const total = await Doctor.countDocuments(query);
    console.log('Total doctors found:', total);
    console.log('Query used:', JSON.stringify(query));

    // Get doctors with pagination
    const doctors = await Doctor.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);



    // Calculate current month prescription counts for each doctor
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const doctorsWithCurrentStats = await Promise.all(
      doctors.map(async (doctor) => {
        const doctorObj = doctor.toObject();

        // Get current month prescription count
        const Sale = require('../models/Sale');
        const currentMonthSales = await Sale.countDocuments({
          store: storeId,
          'prescription.doctor': doctor._id,
          status: 'completed',
          saleDate: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Add current month prescription count
        doctorObj.prescriptionCount = currentMonthSales;

        return doctorObj;
      })
    );

    res.status(200).json({
      success: true,
      count: doctors.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: doctorsWithCurrentStats
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctors'
    });
  }
});

// @desc    Get single doctor
// @route   GET /api/store-manager/doctors/:id
// @access  Private (Store Manager only)
const getDoctor = asyncHandler(async (req, res) => {
  const storeId = req.store._id;

  try {
    const doctor = await Doctor.findOne({
      _id: req.params.id,
      store: storeId
    })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });

  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctor'
    });
  }
});

// @desc    Create new doctor
// @route   POST /api/store-manager/doctors
// @access  Private (Store Manager only)
const createDoctor = asyncHandler(async (req, res) => {
  const store = req.store; // Store is available from middleware
  const storeId = store._id;

  try {
    // Check if doctor with same phone already exists in this store
    const existingDoctor = await Doctor.findOne({
      store: storeId,
      phone: req.body.phone
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this phone number already exists in your store'
      });
    }

    // Create doctor
    const doctorData = {
      ...req.body,
      store: storeId,
      createdBy: req.user._id
    };

    const doctor = await Doctor.create(doctorData);

    // Populate the created doctor
    await doctor.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor
    });

  } catch (error) {
    console.error('Create doctor error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating doctor'
    });
  }
});

// @desc    Update doctor
// @route   PUT /api/store-manager/doctors/:id
// @access  Private (Store Manager only)
const updateDoctor = asyncHandler(async (req, res) => {
  const storeId = req.store._id;

  try {
    // Find doctor in the store
    let doctor = await Doctor.findOne({
      _id: req.params.id,
      store: storeId
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if phone number is being changed and if it conflicts
    if (req.body.phone && req.body.phone !== doctor.phone) {
      const existingDoctor = await Doctor.findOne({
        store: storeId,
        phone: req.body.phone,
        _id: { $ne: req.params.id }
      });

      if (existingDoctor) {
        return res.status(400).json({
          success: false,
          message: 'Doctor with this phone number already exists in your store'
        });
      }
    }

    // Update doctor
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('updatedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctor
    });

  } catch (error) {
    console.error('Update doctor error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating doctor'
    });
  }
});

// @desc    Delete doctor
// @route   DELETE /api/store-manager/doctors/:id
// @access  Private (Store Manager only)
const deleteDoctor = asyncHandler(async (req, res) => {
  const storeId = req.store._id;

  try {
    const doctor = await Doctor.findOne({
      _id: req.params.id,
      store: storeId
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Instead of hard delete, we'll soft delete by setting status to inactive
    doctor.status = 'inactive';
    doctor.updatedBy = req.user._id;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Doctor deactivated successfully'
    });

  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting doctor'
    });
  }
});

// @desc    Toggle doctor status (activate/deactivate)
// @route   PUT /api/store-manager/doctors/:id/toggle-status
// @access  Private/Store Manager
const toggleDoctorStatus = asyncHandler(async (req, res) => {
  const store = req.store;
  const storeId = store._id;
  const { status } = req.body;

  try {
    // Validate status
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "inactive"'
      });
    }

    const doctor = await Doctor.findOne({ _id: req.params.id, store: storeId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Update doctor status
    doctor.status = status;
    doctor.updatedBy = req.user._id;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Doctor ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: {
        doctorId: doctor._id,
        status: doctor.status
      }
    });
  } catch (error) {
    console.error('Toggle doctor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling doctor status',
      error: error.message
    });
  }
});

// @desc    Get doctor statistics
// @route   GET /api/store-manager/doctors/stats
// @access  Private (Store Manager only)
const getDoctorStats = asyncHandler(async (req, res) => {
  const storeId = req.store._id;
  const { dateRange = 'thisMonth', status } = req.query;

  try {
    // Use the DoctorStatsService to get real statistics
    const stats = await DoctorStatsService.getStoreStats(storeId, { dateRange, status });

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get doctor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctor statistics'
    });
  }
});

// @desc    Get commission history
// @route   GET /api/store-manager/doctors/commissions
// @access  Private (Store Manager only)
const getCommissions = asyncHandler(async (req, res) => {
  const storeId = req.store._id;
  const { dateRange = 'thisMonth', status } = req.query;

  try {
    // Use the DoctorStatsService to get real commission data
    const commissions = await DoctorStatsService.getCommissionHistory(storeId, { dateRange, status });

    // Filter by status if specified
    const filteredCommissions = status && status !== 'all'
      ? commissions.filter(c => c.status === status)
      : commissions;

    console.log(`Returning ${filteredCommissions.length} commission records for store ${storeId}`);

    res.status(200).json({
      success: true,
      count: filteredCommissions.length,
      data: filteredCommissions
    });

  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching commissions'
    });
  }
});

// @desc    Mark commission as paid
// @route   PUT /api/store-manager/doctors/commissions/:id/pay
// @access  Private (Store Manager only)
const markCommissionPaid = asyncHandler(async (req, res) => {
  const storeId = req.store._id;
  const commissionId = req.params.id;
  const userId = req.user._id;

  try {
    let commission;

    // Check if this is an existing commission record or a calculated one
    if (commissionId.startsWith('comm_')) {
      // This is a calculated commission, need to create a new record
      const doctorId = commissionId.replace('comm_', '');

      // Verify the doctor belongs to this store
      const doctor = await Doctor.findOne({ _id: doctorId, store: storeId });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found or does not belong to this store'
        });
      }

      // Get current commission data from the service
      const commissionHistory = await DoctorStatsService.getCommissionHistory(storeId, { status: 'all' });
      const currentCommission = commissionHistory.find(c => c._id === commissionId);

      if (!currentCommission) {
        return res.status(404).json({
          success: false,
          message: 'Commission record not found'
        });
      }

      // Create a new commission record
      const currentDate = new Date();
      commission = new Commission({
        store: storeId,
        doctor: doctorId,
        period: {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear()
        },
        prescriptionCount: currentCommission.prescriptionCount,
        salesValue: currentCommission.salesValue,
        commissionRate: currentCommission.commissionRate,
        commissionAmount: currentCommission.commissionAmount,
        status: 'paid',
        paymentDate: new Date(),
        paidBy: userId
      });

      await commission.save();

      // Populate the doctor information for the response
      await commission.populate('doctor');

    } else {
      // This is an existing commission record
      commission = await Commission.findById(commissionId).populate('doctor');

      if (!commission || commission.store.toString() !== storeId.toString()) {
        return res.status(404).json({
          success: false,
          message: 'Commission record not found'
        });
      }

      // Update the commission status
      commission.status = 'paid';
      commission.paymentDate = new Date();
      commission.paidBy = userId;
      commission.lastUpdated = new Date();

      await commission.save();
    }

    console.log(`Commission ${commissionId} marked as paid for doctor ${commission.doctor?.name || 'Unknown'}`);

    res.status(200).json({
      success: true,
      message: 'Commission marked as paid successfully',
      data: {
        commissionId: commission._id,
        status: commission.status,
        paymentDate: commission.paymentDate
      }
    });

  } catch (error) {
    console.error('Mark commission paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking commission as paid'
    });
  }
});

// @desc    Get commission payment history for a specific doctor
// @route   GET /api/store-manager/doctors/:id/commission-history
// @access  Private (Store Manager only)
const getDoctorCommissionHistory = asyncHandler(async (req, res) => {
  const storeId = req.store._id;
  const doctorId = req.params.id;
  const { page = 1, limit = 20 } = req.query;

  try {
    // Get commission summary
    const summary = await CommissionPaymentService.getDoctorCommissionSummary(doctorId, storeId);

    // Get payment history
    const paymentHistory = await CommissionPaymentService.getDoctorPaymentHistory(doctorId, storeId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    console.log(`Retrieved commission history for doctor ${doctorId} in store ${storeId}`);

    res.status(200).json({
      success: true,
      data: {
        summary: summary.summary,
        doctor: summary.doctor,
        commissions: summary.commissions,
        paymentHistory: paymentHistory.paymentHistory,
        pagination: paymentHistory.pagination
      }
    });

  } catch (error) {
    console.error('Get doctor commission history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching commission history'
    });
  }
});

// @desc    Record commission payment for a doctor
// @route   POST /api/store-manager/doctors/commissions/:id/record-payment
// @access  Private (Store Manager only)
const recordCommissionPayment = asyncHandler(async (req, res) => {
  const storeId = req.store._id;
  const commissionId = req.params.id;
  const userId = req.user._id;
  const { amount, paymentMethod, paymentReference, notes } = req.body;

  try {
    // Validate required fields
    if (!amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount and method are required'
      });
    }

    // Record the payment
    const result = await CommissionPaymentService.recordCommissionPayment(commissionId, {
      amount: parseFloat(amount),
      paymentMethod,
      paymentReference,
      notes,
      processedBy: userId
    }, storeId);

    console.log(`Commission payment recorded: ₹${amount} for commission ${commissionId}`);

    res.status(200).json({
      success: true,
      message: 'Commission payment recorded successfully',
      data: result
    });

  } catch (error) {
    console.error('Record commission payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server error while recording payment'
    });
  }
});

module.exports = {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  toggleDoctorStatus,
  getDoctorStats,
  getCommissions,
  markCommissionPaid,
  getDoctorCommissionHistory,
  recordCommissionPayment
};
