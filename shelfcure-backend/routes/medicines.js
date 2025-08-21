const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Medicine = require('../models/Medicine');

// @desc    Get all master medicines (Admin only)
// @route   GET /api/medicines/admin/master
// @access  Private/Admin
router.get('/admin/master', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for master medicines, using mock data');

      const mockMedicines = [
        {
          _id: '1',
          name: 'Paracetamol 500mg',
          genericName: 'Paracetamol',
          composition: 'Paracetamol 500mg',
          manufacturer: 'ABC Pharma',
          category: 'Analgesic',
          type: 'Tablet',
          isActive: true,
          store: { name: 'Master Database', code: 'MASTER' },
          createdBy: { name: 'System Admin' },
          createdAt: '2024-01-01'
        },
        {
          _id: '2',
          name: 'Amoxicillin 250mg',
          genericName: 'Amoxicillin',
          composition: 'Amoxicillin 250mg',
          manufacturer: 'XYZ Pharma',
          category: 'Antibiotic',
          type: 'Capsule',
          isActive: true,
          store: { name: 'Master Database', code: 'MASTER' },
          createdBy: { name: 'System Admin' },
          createdAt: '2024-01-02'
        },
        {
          _id: '3',
          name: 'Cetirizine 10mg',
          genericName: 'Cetirizine',
          composition: 'Cetirizine Hydrochloride 10mg',
          manufacturer: 'DEF Pharma',
          category: 'Antihistamine',
          type: 'Tablet',
          isActive: true,
          store: { name: 'Master Database', code: 'MASTER' },
          createdBy: { name: 'System Admin' },
          createdAt: '2024-01-03'
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockMedicines,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: mockMedicines.length,
          itemsPerPage: 10
        },
        stats: {
          totalMedicines: mockMedicines.length,
          activeMedicines: mockMedicines.filter(m => m.isActive).length,
          inactiveMedicines: mockMedicines.filter(m => !m.isActive).length,
          categories: ['Analgesic', 'Antibiotic', 'Antihistamine']
        }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { genericName: searchRegex },
        { composition: searchRegex },
        { manufacturer: searchRegex }
      ];
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const medicines = await Medicine.find(query)
      .populate('store', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Medicine.countDocuments(query);

    // Get statistics
    const stats = await Medicine.aggregate([
      {
        $group: {
          _id: null,
          totalMedicines: { $sum: 1 },
          activeMedicines: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalStripStock: { $sum: '$stripInfo.stock' },
          totalIndividualStock: { $sum: '$individualInfo.stock' },
          lowStockCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $lt: ['$stripInfo.stock', '$stripInfo.minStock'] },
                    { $lt: ['$individualInfo.stock', '$individualInfo.minStock'] }
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

    res.status(200).json({
      success: true,
      data: medicines,
      stats: stats[0] || {
        totalMedicines: 0,
        activeMedicines: 0,
        totalStripStock: 0,
        totalIndividualStock: 0,
        lowStockCount: 0
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get master medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching master medicines',
      error: error.message
    });
  }
});

// @desc    Get single master medicine (Admin only)
// @route   GET /api/medicines/admin/master/:id
// @access  Private/Admin
router.get('/admin/master/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id)
      .populate('store', 'name code')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create master medicine (Admin only)
// @route   POST /api/medicines/admin/master
// @access  Private/Admin
router.post('/admin/master', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const medicineData = {
      ...req.body,
      createdBy: req.user.id,
      store: req.body.store || req.user.currentStore // Use provided store or admin's current store
    };

    const medicine = await Medicine.create(medicineData);
    await medicine.populate('store', 'name code');
    await medicine.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Master medicine created successfully',
      data: medicine
    });
  } catch (error) {
    console.error('Create master medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating master medicine',
      error: error.message
    });
  }
});

// @desc    Update master medicine (Admin only)
// @route   PUT /api/medicines/admin/master/:id
// @access  Private/Admin
router.put('/admin/master/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        medicine[key] = req.body[key];
      }
    });

    medicine.updatedBy = req.user.id;
    await medicine.save();

    await medicine.populate('store', 'name code');
    await medicine.populate('updatedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Master medicine updated successfully',
      data: medicine
    });
  } catch (error) {
    console.error('Update master medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating master medicine',
      error: error.message
    });
  }
});

// @desc    Delete master medicine (Admin only)
// @route   DELETE /api/medicines/admin/master/:id
// @access  Private/Admin
router.delete('/admin/master/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    await Medicine.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Master medicine deleted successfully'
    });
  } catch (error) {
    console.error('Delete master medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting master medicine',
      error: error.message
    });
  }
});

module.exports = router;
