const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const MasterMedicine = require('../models/MasterMedicine');

// Configure multer for CSV file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/csv';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `medicines-${Date.now()}-${Math.round(Math.random() * 1E9)}.csv`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Helper function to parse CSV content with basic support for quoted fields
const parseCSV = (csvContent) => {
  console.log('=== PARSING CSV ===');

  // Normalize line endings and strip BOM if present
  const normalized = csvContent.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n').filter(line => line.trim().length > 0);
  console.log('Total lines after filtering:', lines.length);

  if (lines.length < 2) {
    console.log('ERROR: Not enough lines in CSV');
    throw new Error('CSV file must contain at least a header row and one data row');
  }

  const splitCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        // If next char is also a quote, it's an escaped quote
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    // Remove wrapping quotes
    return result.map(field => {
      const trimmed = field.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed.slice(1, -1);
      }
      return trimmed;
    });
  };

  const headers = splitCSVLine(lines[0]).map(h => h.replace(/^\"|\"$/g, '').trim());
  console.log('Headers found:', headers);
  console.log('Headers count:', headers.length);

  const medicines = [];
  console.log('Processing data rows...');

  for (let i = 1; i < lines.length; i++) {
    console.log(`Processing row ${i}: "${lines[i]}"`);
    let values = splitCSVLine(lines[i]);
    console.log(`Values found: [${values.join(', ')}]`);
    console.log(`Values count: ${values.length}, Headers count: ${headers.length}`);

    if (values.length !== headers.length) {
      console.log(`Row ${i}: Column count mismatch (values=${values.length}, headers=${headers.length}). Attempting to normalize.`);
      if (values.length < headers.length) {
        // Pad missing columns with empty strings
        while (values.length < headers.length) values.push('');
      } else if (values.length > headers.length) {
        // Merge extras into the last column to avoid data loss
        const merged = values.slice(headers.length - 1).join(',');
        values = values.slice(0, headers.length - 1).concat([merged]);
      }
    }

    const medicine = {};
    headers.forEach((header, index) => {
      const valueRaw = values[index] || '';
      const value = valueRaw.replace(/^\"|\"$/g, '').trim();
      console.log(`Mapping header "${header}" -> value "${value}"`);

      // Map CSV headers to medicine schema fields
      switch (header.toLowerCase()) {
        case 'name':
        case 'medicine name':
          medicine.name = value;
          break;
        case 'generic name':
        case 'genericname':
          medicine.genericName = value;
          break;
        case 'composition':
          medicine.composition = value;
          break;
        case 'manufacturer':
          medicine.manufacturer = value;
          break;
        case 'category':
        case 'categories':
          // Map common category names to valid enum values
          const categoryMapping = {
            'pain relief': 'Other',
            'painrelief': 'Other',
            'antibiotic': 'Other',
            'antibiotics': 'Other',
            'anti-allergic': 'Other',
            'antiallergic': 'Other',
            'allergy relief': 'Other',
            'diabetes care': 'Other',
            'diabetescare': 'Other',
            'antacid': 'Other',
            'acid reflux': 'Other',
            'heartburn': 'Other',
            'tablet': 'Tablet',
            'capsule': 'Capsule',
            'syrup': 'Syrup',
            'injection': 'Injection',
            'drops': 'Drops',
            'cream': 'Cream',
            'ointment': 'Ointment',
            'powder': 'Powder',
            'inhaler': 'Inhaler',
            'spray': 'Spray',
            'gel': 'Gel',
            'lotion': 'Lotion',
            'solution': 'Solution',
            'suspension': 'Suspension',
            'patch': 'Patch',
            'suppository': 'Suppository'
          };

          const normalizedCategory = value.toLowerCase().trim();
          medicine.category = categoryMapping[normalizedCategory] || 'Other';
          break;
        case 'strength':
          medicine.dosage = { ...medicine.dosage, strength: value };
          break;
        case 'form':
          medicine.dosage = { ...medicine.dosage, form: value };
          break;
        case 'frequency':
          medicine.dosage = { ...medicine.dosage, frequency: value };
          break;
        case 'requires prescription':
        case 'requiresprescription':
        case 'prescription required':
          medicine.requiresPrescription = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
          break;
        case 'has strips':
        case 'hasstrips':
          if (!medicine.unitTypes) medicine.unitTypes = {};
          medicine.unitTypes.hasStrips = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
          break;
        case 'has individual':
        case 'hasindividual':
          if (!medicine.unitTypes) medicine.unitTypes = {};
          medicine.unitTypes.hasIndividual = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
          break;
        case 'units per strip':
        case 'unitsperstrip':
          if (!medicine.unitTypes) medicine.unitTypes = {};
          medicine.unitTypes.unitsPerStrip = parseInt(value) || 10;
          break;
        case 'barcode': {
          const b = (value || '').trim();
          if (b) {
            medicine.barcode = b;
          } else {
            // Ensure empty barcode is treated as missing to avoid unique index conflicts
            delete medicine.barcode;
          }
          break;
        }
        case 'tags':
          medicine.tags = value ? value.split(';').map(tag => tag.trim()).filter(Boolean) : [];
          break;
        case 'side effects':
        case 'sideeffects':
          medicine.sideEffects = value ? value.split(';').map(effect => effect.trim()).filter(Boolean) : [];
          break;
        case 'contraindications':
          medicine.contraindications = value ? value.split(';').map(contra => contra.trim()).filter(Boolean) : [];
          break;
        case 'interactions':
          medicine.interactions = value ? value.split(';').map(interaction => interaction.trim()).filter(Boolean) : [];
          break;
        case 'notes':
          medicine.notes = value;
          break;
        case 'is active':
        case 'isactive':
        case 'active':
          medicine.isActive = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
          break;
        default:
          // Handle additional fields that might be in CSV
          break;
      }
    });

    // Set default values for required fields if not provided
    console.log(`Medicine before validation:`, {
      name: medicine.name,
      composition: medicine.composition,
      manufacturer: medicine.manufacturer,
      category: medicine.category
    });

    if (!medicine.name) {
      console.log(`SKIPPING medicine: No name found`);
      continue; // Skip if no name
    }

    if (!medicine.composition) medicine.composition = 'Not specified';
    if (!medicine.manufacturer) medicine.manufacturer = 'Not specified';
    if (!medicine.category) medicine.category = 'Other';
    if (!medicine.dosage) medicine.dosage = {};
    if (!medicine.dosage.strength) medicine.dosage.strength = 'Not specified';
    if (!medicine.dosage.form) medicine.dosage.form = 'Other';

    // Set up dual unit system defaults for master medicine template
    if (!medicine.unitTypes) medicine.unitTypes = {};
    if (medicine.unitTypes.hasStrips === undefined) medicine.unitTypes.hasStrips = true;
    if (medicine.unitTypes.hasIndividual === undefined) medicine.unitTypes.hasIndividual = true;
    if (!medicine.unitTypes.unitsPerStrip) medicine.unitTypes.unitsPerStrip = 10;

    // Master medicines don't have pricing - that's handled at store level

    if (medicine.requiresPrescription === undefined) medicine.requiresPrescription = false;
    if (medicine.isActive === undefined) medicine.isActive = true;

    console.log(`ADDING medicine: ${medicine.name}`);
    medicines.push(medicine);
  }

  console.log(`=== PARSING COMPLETE ===`);
  console.log(`Total medicines created: ${medicines.length}`);
  console.log(`========================`);
  return medicines;
};

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

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const medicines = await MasterMedicine.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MasterMedicine.countDocuments(query);

    // Get statistics for master medicines (no stock info since they're templates)
    const stats = await MasterMedicine.aggregate([
      {
        $group: {
          _id: null,
          totalMedicines: { $sum: 1 },
          activeMedicines: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          categoriesCount: { $addToSet: '$category' }
        }
      }
    ]);

    // Get category distribution
    const categoryStats = await MasterMedicine.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: medicines,
      stats: {
        totalMedicines: stats[0]?.totalMedicines || 0,
        activeMedicines: stats[0]?.activeMedicines || 0,
        inactiveMedicines: (stats[0]?.totalMedicines || 0) - (stats[0]?.activeMedicines || 0),
        totalCategories: stats[0]?.categoriesCount?.length || 0,
        categoryDistribution: categoryStats
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

// @desc    Download CSV template for medicine import (Admin only)
// @route   GET /api/medicines/admin/master/csv-template
// @access  Private/Admin
router.get('/admin/master/csv-template', protect, authorize('superadmin', 'admin'), (req, res) => {
  try {
    const csvHeaders = [
      'Name',
      'Generic Name',
      'Composition',
      'Manufacturer',
      'Category',
      'Strength',
      'Form',
      'Frequency',
      'Requires Prescription',
      'Has Strips',
      'Has Individual',
      'Units Per Strip',
      'Barcode',
      'Tags',
      'Side Effects',
      'Contraindications',
      'Interactions',
      'Notes',
      'Is Active'
    ];

    const sampleData = [
      'Paracetamol 500mg',
      'Acetaminophen',
      'Paracetamol 500mg',
      'Cipla Ltd',
      'Tablet',
      '500mg',
      'Tablet',
      '3 times daily',
      'false',
      'true',
      'true',
      '10',
      '1234567890123',
      'pain relief;fever;headache',
      'nausea;skin rash',
      'liver disease;alcohol dependency',
      'warfarin;alcohol',
      'Common pain reliever',
      'true'
    ];

    const csvContent = [csvHeaders, sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="medicine-import-template.csv"');
    res.send(csvContent);

  } catch (error) {
    console.error('CSV template download error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating CSV template',
      error: error.message
    });
  }
});

// @desc    Get single master medicine (Admin only)
// @route   GET /api/medicines/admin/master/:id
// @access  Private/Admin
router.get('/admin/master/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const medicine = await MasterMedicine.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Master medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    console.error('Get master medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching master medicine',
      error: error.message
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
      createdBy: req.user.id
      // No store field for master medicines - they are global templates
    };

    const medicine = await MasterMedicine.create(medicineData);
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

// @desc    Bulk import master medicines from CSV (Admin only)
// @route   POST /api/medicines/admin/master/import
// @access  Private/Admin
router.post('/admin/master/import', protect, authorize('superadmin', 'admin'), upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }

    // Read the uploaded CSV file
    const csvContent = fs.readFileSync(req.file.path, 'utf8');

    // Compute total data rows (for summary) based on raw CSV, regardless of parsing skips
    const normalizedForCount = csvContent.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const dataRowsCount = normalizedForCount.split('\n').filter((line, idx) => idx !== 0 && line.trim().length > 0).length;

    console.log('=== CSV UPLOAD DEBUG ===');
    console.log('File name:', req.file.originalname);
    console.log('File size:', req.file.size);
    console.log('CSV content (first 500 chars):');
    console.log(csvContent.substring(0, 500));
    console.log('CSV lines:');
    const debugLines = normalizedForCount.split('\n');
    debugLines.forEach((line, index) => {
      if (index < 5) { // Show first 5 lines
        console.log(`Line ${index + 1}: "${line}"`);
      }
    });
    console.log('========================');

    // Parse CSV content
    let medicines;
    try {
      medicines = parseCSV(csvContent);
      console.log('Successfully parsed medicines:', medicines.length);
    } catch (parseError) {
      console.log('CSV parsing failed:', parseError.message);
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: `CSV parsing error: ${parseError.message}`
      });
    }

    if (medicines.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'No valid medicine records found in CSV file'
      });
    }

    // Process medicines in batches to avoid overwhelming the database
    const batchSize = 50;
    const results = {
      successful: [],
      failed: [],
      duplicates: []
    };

    for (let i = 0; i < medicines.length; i += batchSize) {
      const batch = medicines.slice(i, i + batchSize);

      for (const medicineData of batch) {
        try {
          // Add metadata for master medicine (no store field)
          const processedMedicine = {
            ...medicineData,
            createdBy: req.user.id
            // No store field - master medicines are global templates
          };

          // If barcode is empty string, treat as missing to avoid unique index conflicts
          if (processedMedicine.barcode !== undefined) {
            const b = (processedMedicine.barcode || '').trim();
            if (!b) delete processedMedicine.barcode; else processedMedicine.barcode = b;
          }

          // Check for duplicates by barcode if provided
          if (processedMedicine.barcode) {
            const existingByBarcode = await MasterMedicine.findOne({ barcode: processedMedicine.barcode });
            if (existingByBarcode) {
              results.duplicates.push({
                name: processedMedicine.name,
                manufacturer: processedMedicine.manufacturer,
                reason: 'Duplicate barcode (already exists)'
              });
              continue;
            }
          }

          // Check for duplicates by name and manufacturer (common in master database)
          const existingMedicine = await MasterMedicine.findOne({
            name: processedMedicine.name,
            manufacturer: processedMedicine.manufacturer
          });

          if (existingMedicine) {
            results.duplicates.push({
              name: processedMedicine.name,
              manufacturer: processedMedicine.manufacturer,
              reason: 'Medicine with the same name and manufacturer already exists'
            });
            continue;
          }

          // Create the master medicine
          const medicine = await MasterMedicine.create(processedMedicine);
          await medicine.populate('createdBy', 'name');

          results.successful.push({
            id: medicine._id,
            name: medicine.name,
            manufacturer: medicine.manufacturer
          });

        } catch (error) {
          let reason = 'Could not import this item';
          const msg = (error && error.message) ? String(error.message) : '';
          if (msg.includes('E11000') && msg.includes('barcode')) {
            reason = 'Duplicate barcode (already exists)';
          } else if (msg.includes('E11000')) {
            reason = 'Duplicate record';
          } else if (msg.toLowerCase().includes('validation')) {
            reason = 'Missing or invalid required fields';
          }

          results.failed.push({
            name: medicineData.name || 'Unknown',
            manufacturer: medicineData.manufacturer || 'Unknown',
            reason
          });
        }
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: `Import completed. ${results.successful.length} medicines imported successfully.`,
      data: {
        summary: {
          total: dataRowsCount, // show total data lines in the CSV
          successful: results.successful.length,
          failed: results.failed.length,
          duplicates: results.duplicates.length
        },
        results: results
      }
    });

  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('CSV import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during CSV import',
      error: error.message
    });
  }
});

// @desc    Update master medicine (Admin only)
// @route   PUT /api/medicines/admin/master/:id
// @access  Private/Admin
router.put('/admin/master/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const medicine = await MasterMedicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Master medicine not found'
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

    await medicine.populate('createdBy', 'name');
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
    const medicine = await MasterMedicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Master medicine not found'
      });
    }

    await MasterMedicine.findByIdAndDelete(req.params.id);

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
