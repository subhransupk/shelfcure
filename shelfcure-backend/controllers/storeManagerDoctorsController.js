const Doctor = require('../models/Doctor');
const Store = require('../models/Store');
const asyncHandler = require('express-async-handler');

// In-memory store for tracking paid commissions (for demo purposes)
// In a real app, this would be stored in a database
const paidCommissions = new Set();

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
      .skip((page - 1) * limit)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    console.log('Doctors returned:', doctors.length);
    console.log('Doctor details:', doctors.map(d => ({
      name: d.name,
      status: d.status,
      specialization: d.specialization,
      phone: d.phone,
      email: d.email,
      hospital: d.hospital?.name
    })));

    // Add mock prescription data for demonstration if not present
    const doctorsWithMockData = doctors.map(doctor => {
      const doctorObj = doctor.toObject();

      // Add mock prescription data if not present
      if (!doctorObj.totalPrescriptions || doctorObj.totalPrescriptions === 0) {
        doctorObj.totalPrescriptions = Math.floor(Math.random() * 50 + 10); // 10-60 prescriptions
      }

      // Add mock commission data if not present
      if (!doctorObj.totalCommissionEarned || doctorObj.totalCommissionEarned === 0) {
        doctorObj.totalCommissionEarned = Math.floor(Math.random() * 3000 + 1000); // 1000-4000
      }

      return doctorObj;
    });

    res.status(200).json({
      success: true,
      count: doctors.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: doctorsWithMockData
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

// @desc    Get doctor statistics
// @route   GET /api/store-manager/doctors/stats
// @access  Private (Store Manager only)
const getDoctorStats = asyncHandler(async (req, res) => {
  const storeId = req.store._id;
  const { dateRange = 'thisMonth', status } = req.query;

  try {
    // Calculate date range for filtering
    let startDate, endDate;
    const now = new Date();

    switch (dateRange) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const stats = await Doctor.aggregate([
      { $match: { store: storeId } },
      {
        $group: {
          _id: null,
          totalDoctors: { $sum: 1 },
          activeDoctors: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          averageCommissionRate: { $avg: '$commissionRate' }
        }
      }
    ]);

    const result = stats[0] || {
      totalDoctors: 0,
      activeDoctors: 0,
      averageCommissionRate: 0
    };

    // Generate mock commission data for the selected period
    const doctors = await Doctor.find({ store: storeId, status: 'active' });

    let totalCommissions = 0;
    let pendingCommissions = 0;
    let totalPrescriptions = 0;

    doctors.forEach((doctor, index) => {
      const seed = parseInt(doctor._id.toString().slice(-6), 16);
      const prescriptionCount = (seed % 40) + 10;
      const salesValue = prescriptionCount * ((seed % 800) + 400);
      const commissionAmount = (salesValue * (doctor.commissionRate || 5)) / 100;
      const commissionId = `comm_${doctor._id}`;
      const isPaid = paidCommissions.has(commissionId) || (seed % 3) === 0;

      totalPrescriptions += prescriptionCount;
      totalCommissions += Math.round(commissionAmount);

      if (!isPaid && (!status || status === 'all' || status === 'pending')) {
        pendingCommissions += Math.round(commissionAmount);
      }
    });

    // Apply status filter to totals
    if (status === 'paid') {
      result.thisMonthCommissions = totalCommissions - pendingCommissions;
      result.pendingCommissions = 0;
    } else if (status === 'pending') {
      result.thisMonthCommissions = pendingCommissions;
      result.pendingCommissions = pendingCommissions;
    } else {
      result.thisMonthCommissions = totalCommissions;
      result.pendingCommissions = pendingCommissions;
    }

    result.totalPrescriptions = totalPrescriptions;

    res.status(200).json({
      success: true,
      data: result
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
    // Calculate date range
    let startDate, endDate;
    const now = new Date();

    switch (dateRange) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Build aggregation pipeline
    const matchStage = {
      store: storeId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (status && status !== 'all') {
      matchStage.status = status;
    }

    // For now, we'll create mock commission data based on doctors
    // In a real app, this would come from sales/prescription data
    const doctors = await Doctor.find({ store: storeId, status: 'active' });
    console.log(`Found ${doctors.length} active doctors for store ${storeId}`);

    const commissions = doctors.map((doctor, index) => {
      // Use doctor ID as seed for consistent data
      const seed = parseInt(doctor._id.toString().slice(-6), 16);
      const prescriptionCount = (seed % 40) + 10; // 10-50 prescriptions
      const salesValue = prescriptionCount * ((seed % 800) + 400); // 400-1200 per prescription
      const commissionAmount = (salesValue * (doctor.commissionRate || 5)) / 100;

      // Create date within the selected range
      const randomDays = Math.floor((seed % 30)); // 0-29 days from start
      const commissionDate = new Date(startDate.getTime() + (randomDays * 24 * 60 * 60 * 1000));

      return {
        _id: `comm_${doctor._id}`,
        doctor: {
          _id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization
        },
        prescriptionCount,
        salesValue,
        commissionRate: doctor.commissionRate || 5,
        commissionAmount: Math.round(commissionAmount),
        status: paidCommissions.has(`comm_${doctor._id}`) ? 'paid' : ((seed % 3) === 0 ? 'paid' : 'pending'),
        createdAt: commissionDate,
        updatedAt: commissionDate
      };
    });

    // Filter by status if specified
    const filteredCommissions = status && status !== 'all'
      ? commissions.filter(c => c.status === status)
      : commissions;

    console.log(`Returning ${filteredCommissions.length} commission records`);
    console.log('Sample commission:', filteredCommissions[0]);

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

  try {
    // Extract doctor ID from commission ID (format: comm_doctorId)
    const doctorId = commissionId.replace('comm_', '');

    // Verify the doctor belongs to this store
    const doctor = await Doctor.findOne({ _id: doctorId, store: storeId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Commission record not found'
      });
    }

    // Mark commission as paid in our in-memory store
    paidCommissions.add(commissionId);
    console.log(`Commission ${commissionId} marked as paid for doctor ${doctor.name}`);

    res.status(200).json({
      success: true,
      message: 'Commission marked as paid successfully'
    });

  } catch (error) {
    console.error('Mark commission paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking commission as paid'
    });
  }
});

module.exports = {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorStats,
  getCommissions,
  markCommissionPaid
};
