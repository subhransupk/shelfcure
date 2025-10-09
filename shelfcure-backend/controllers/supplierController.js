const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const { validationResult } = require('express-validator');

// @desc    Get all suppliers for a store
// @route   GET /api/store-manager/suppliers
// @access  Private (Store Manager only)
const getSuppliers = async (req, res) => {
  try {
    const store = req.store;
    const storeManager = req.user;
    const { search, status, page = 1, limit = 20, sort = 'name' } = req.query;

    const options = {
      search,
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
      sort: sort === 'recent' ? { createdAt: -1 } :
            sort === 'purchases' ? { totalPurchases: -1 } :
            sort === 'amount' ? { totalPurchaseAmount: -1 } : { name: 1 }
    };

    const suppliers = await Supplier.getStoreSuppliers(store._id, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Update supplier statistics for all suppliers if they haven't been updated recently
    for (const supplier of suppliers) {
      // Check if stats need updating (if totalPurchaseAmount is 0 or last update was more than 1 hour ago)
      const needsUpdate = supplier.totalPurchaseAmount === 0 ||
                         !supplier.updatedAt ||
                         (new Date() - supplier.updatedAt) > (60 * 60 * 1000); // 1 hour

      if (needsUpdate) {
        try {
          await supplier.updatePurchaseStats();
        } catch (updateError) {
          console.error(`Error updating stats for supplier ${supplier._id}:`, updateError);
        }
      }
    }

    const total = await Supplier.countDocuments({
      store: store._id,
      ...(options.isActive !== undefined && { isActive: options.isActive }),
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { contactPerson: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { 'address.city': { $regex: search, $options: 'i' } }
        ]
      })
    });

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suppliers'
    });
  }
};

// @desc    Get single supplier by ID
// @route   GET /api/store-manager/suppliers/:id
// @access  Private (Store Manager only)
const getSupplier = async (req, res) => {
  try {
    const store = req.store;
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      store: store._id
    }).populate('store', 'name').populate('addedBy', 'name email');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching supplier'
    });
  }
};

// @desc    Create new supplier
// @route   POST /api/store-manager/suppliers
// @access  Private (Store Manager only)
const createSupplier = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const store = req.store;
    const storeManager = req.user;
    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      gstNumber,
      panNumber,
      licenseNumber,
      paymentTerms,
      creditLimit,
      notes,
      isActive
    } = req.body;

    // Check if supplier with same name already exists for this store
    const existingSupplier = await Supplier.findOne({
      store: store._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this name already exists for your store'
      });
    }

    const supplierData = {
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      address: {
        street: address?.street?.trim() || '',
        city: address?.city?.trim() || '',
        state: address?.state?.trim() || '',
        pincode: address?.pincode?.trim() || '',
        country: address?.country?.trim() || 'India'
      },
      gstNumber: gstNumber?.trim() || '',
      panNumber: panNumber?.trim() || '',
      licenseNumber: licenseNumber?.trim() || '',
      paymentTerms: paymentTerms || '30 days',
      creditLimit: creditLimit || 0,
      notes: notes?.trim() || '',
      isActive: isActive !== undefined ? isActive : true,
      store: store._id,
      addedBy: storeManager._id
    };

    const supplier = await Supplier.create(supplierData);
    await supplier.populate('store', 'name');
    await supplier.populate('addedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this name already exists for your store'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating supplier'
    });
  }
};

// @desc    Update supplier
// @route   PUT /api/store-manager/suppliers/:id
// @access  Private (Store Manager only)
const updateSupplier = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const store = req.store;
    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      gstNumber,
      panNumber,
      licenseNumber,
      paymentTerms,
      creditLimit,
      notes,
      isActive,
      rating
    } = req.body;

    const supplier = await Supplier.findOne({
      _id: req.params.id,
      store: store._id
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if another supplier with same name exists (excluding current supplier)
    if (name && name !== supplier.name) {
      const existingSupplier = await Supplier.findOne({
        _id: { $ne: req.params.id },
        store: store._id,
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });

      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: 'Another supplier with this name already exists for your store'
        });
      }
    }

    // Update fields
    if (name) supplier.name = name.trim();
    if (contactPerson) supplier.contactPerson = contactPerson.trim();
    if (phone) supplier.phone = phone.trim();
    if (email !== undefined) supplier.email = email.trim();
    
    if (address) {
      supplier.address = {
        street: address.street?.trim() || supplier.address.street,
        city: address.city?.trim() || supplier.address.city,
        state: address.state?.trim() || supplier.address.state,
        pincode: address.pincode?.trim() || supplier.address.pincode,
        country: address.country?.trim() || supplier.address.country
      };
    }
    
    if (gstNumber !== undefined) supplier.gstNumber = gstNumber.trim();
    if (panNumber !== undefined) supplier.panNumber = panNumber.trim();
    if (licenseNumber !== undefined) supplier.licenseNumber = licenseNumber.trim();
    if (paymentTerms) supplier.paymentTerms = paymentTerms;
    if (creditLimit !== undefined) supplier.creditLimit = creditLimit;
    if (notes !== undefined) supplier.notes = notes.trim();
    if (isActive !== undefined) supplier.isActive = isActive;
    if (rating !== undefined) supplier.rating = rating;

    await supplier.save();
    await supplier.populate('store', 'name');
    await supplier.populate('addedBy', 'name email');

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this name already exists for your store'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating supplier'
    });
  }
};

// @desc    Delete supplier
// @route   DELETE /api/store-manager/suppliers/:id
// @access  Private (Store Manager only)
const deleteSupplier = async (req, res) => {
  try {
    const store = req.store;
    
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      store: store._id
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if supplier has any purchases
    const purchaseCount = await Purchase.countDocuments({
      supplier: supplier._id
    });

    if (purchaseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier. They have ${purchaseCount} purchase record(s). You can deactivate the supplier instead.`
      });
    }

    await Supplier.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting supplier'
    });
  }
};

// @desc    Get supplier purchase history
// @route   GET /api/store-manager/suppliers/:id/purchases
// @access  Private (Store Manager only)
const getSupplierPurchases = async (req, res) => {
  try {
    const store = req.store;
    const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;

    const supplier = await Supplier.findOne({
      _id: req.params.id,
      store: store._id
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const options = {
      supplier: supplier._id,
      status,
      dateFrom,
      dateTo,
      sort: { purchaseDate: -1 }
    };

    const purchases = await Purchase.getStorePurchases(store._id, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Purchase.countDocuments({
      store: store._id,
      supplier: supplier._id,
      ...(status && { status }),
      ...(dateFrom || dateTo) && {
        purchaseDate: {
          ...(dateFrom && { $gte: new Date(dateFrom) }),
          ...(dateTo && { $lte: new Date(dateTo) })
        }
      }
    });

    res.json({
      success: true,
      data: {
        supplier,
        purchases,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get supplier purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching supplier purchases'
    });
  }
};

// @desc    Get suppliers summary/analytics
// @route   GET /api/store-manager/suppliers/analytics
// @access  Private (Store Manager only)
const getSuppliersAnalytics = async (req, res) => {
  try {
    const store = req.store;
    const { dateFrom, dateTo } = req.query;

    // Get supplier purchase summary
    const purchaseSummary = await Purchase.getSupplierPurchaseSummary(
      store._id, 
      null, 
      { dateFrom, dateTo }
    );

    // Get overall supplier stats
    const totalSuppliers = await Supplier.countDocuments({ store: store._id });
    const activeSuppliers = await Supplier.countDocuments({ 
      store: store._id, 
      isActive: true 
    });

    // Get top suppliers by purchase amount
    const topSuppliers = purchaseSummary.slice(0, 5);

    res.json({
      success: true,
      data: {
        summary: {
          totalSuppliers,
          activeSuppliers,
          inactiveSuppliers: totalSuppliers - activeSuppliers
        },
        purchaseSummary,
        topSuppliers
      }
    });
  } catch (error) {
    console.error('Get suppliers analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suppliers analytics'
    });
  }
};

// @desc    Refresh supplier statistics
// @route   POST /api/store-manager/suppliers/refresh-stats
// @access  Private (Store Manager only)
const refreshSupplierStats = async (req, res) => {
  try {
    const store = req.store;
    const { supplierId } = req.body;

    if (supplierId) {
      // Refresh stats for specific supplier
      const supplier = await Supplier.findOne({
        _id: supplierId,
        store: store._id
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }

      await supplier.updatePurchaseStats();

      res.json({
        success: true,
        message: 'Supplier statistics updated successfully',
        data: {
          supplierId: supplier._id,
          totalPurchases: supplier.totalPurchases,
          totalPurchaseAmount: supplier.totalPurchaseAmount,
          outstandingBalance: supplier.outstandingBalance
        }
      });
    } else {
      // Refresh stats for all suppliers in the store
      const suppliers = await Supplier.find({ store: store._id });
      let updatedCount = 0;

      for (const supplier of suppliers) {
        try {
          await supplier.updatePurchaseStats();
          updatedCount++;
        } catch (error) {
          console.error(`Error updating stats for supplier ${supplier._id}:`, error);
        }
      }

      res.json({
        success: true,
        message: `Updated statistics for ${updatedCount} suppliers`,
        data: { updatedCount, totalSuppliers: suppliers.length }
      });
    }
  } catch (error) {
    console.error('Refresh supplier stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while refreshing supplier statistics'
    });
  }
};

// @desc    Search suppliers for autocomplete
// @route   GET /api/store-manager/suppliers/search
// @access  Private (Store Manager only)
const searchSuppliers = async (req, res) => {
  try {
    const store = req.store;
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suppliers = await Supplier.find({
      store: store._id,
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { contactPerson: { $regex: q, $options: 'i' } },
        { 'address.city': { $regex: q, $options: 'i' } }
      ]
    })
    .select('name contactPerson phone address')
    .limit(parseInt(limit))
    .sort({ name: 1 });

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Search suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching suppliers'
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierPurchases,
  getSuppliersAnalytics,
  searchSuppliers,
  refreshSupplierStats
};
