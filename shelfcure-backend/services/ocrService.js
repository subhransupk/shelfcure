const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const vision = require('@google-cloud/vision');

class OCRService {
  constructor() {
    // Initialize Google Cloud Vision client
    this.visionClient = new vision.ImageAnnotatorClient({
      // Use API key authentication
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Optional: if using service account file
      credentials: process.env.GOOGLE_CLOUD_CREDENTIALS ? JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS) : undefined,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });

    // Set API key directly if provided
    this.googleApiKey = process.env.GOOGLE_CLOUD_API_KEY || 'AIzaSyCOPucbAlChSW6tZmu7as6s1nTNI2r0b30';

    // Fallback Tesseract options
    this.tesseractOptions = {
      logger: m => console.log('OCR Progress:', m),
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,()-/:% ',
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: '1'
    };

    // OCR method preference: 'google' or 'tesseract'
    this.preferredOCR = 'google';

    // Test Google Vision API on startup
    this.testGoogleVisionAPI();
  }

  /**
   * Test Google Vision API availability
   */
  async testGoogleVisionAPI() {
    try {
      // Create a minimal valid 1x1 pixel PNG image for testing
      const minimalPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

      const testResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.googleApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: minimalPNG }, // Valid 1x1 PNG
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
          }]
        })
      });

      if (testResponse.ok) {
        const data = await testResponse.json();
        // Check if the response is valid (even if no text is detected, it should be a valid response)
        if (data.responses && Array.isArray(data.responses)) {
          console.log('✅ Google Cloud Vision API is available and working');
        } else {
          console.log('⚠️ Google Cloud Vision API returned unexpected response format');
          this.preferredOCR = 'tesseract';
        }
      } else {
        const errorData = await testResponse.json();
        console.log('❌ Google Cloud Vision API test failed:', {
          status: testResponse.status,
          statusText: testResponse.statusText,
          error: errorData.error
        });

        if (errorData.error?.code === 403 ||
            errorData.error?.message?.includes('blocked') ||
            errorData.error?.message?.includes('PERMISSION_DENIED') ||
            errorData.error?.message?.includes('API key not valid') ||
            errorData.error?.message?.includes('quota')) {
          console.log('⚠️ Google Cloud Vision API access issue - falling back to Tesseract');
          console.log('🔄 Falling back to Tesseract OCR for all requests');
          this.preferredOCR = 'tesseract';
        } else {
          console.log('⚠️ Google Cloud Vision API test failed:', errorData.error?.message);
          this.preferredOCR = 'tesseract';
        }
      }
    } catch (error) {
      console.log('⚠️ Could not test Google Cloud Vision API:', error.message);
      console.log('🔄 Using Tesseract OCR as primary method');
      this.preferredOCR = 'tesseract';
    }
  }

  /**
   * Validate file before processing
   * @param {string} filePath - Path to the uploaded file
   * @param {string} mimeType - MIME type of the file
   * @returns {Object} Validation result
   */
  validateFile(filePath, mimeType) {
    const errors = [];

    // Check file type
    const supportedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!supportedTypes.includes(mimeType)) {
      errors.push('Unsupported file type. Please upload JPG, PNG, or PDF files only.');
    }

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      errors.push('File not found or corrupted during upload.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Process document and extract text using OCR
   * @param {string} filePath - Path to the uploaded file
   * @param {string} mimeType - MIME type of the file
   * @returns {Object} Extracted text and metadata
   */
  async processDocument(filePath, mimeType) {
    try {
      console.log('🔍 Starting OCR processing for:', filePath, 'Type:', mimeType);

      // Validate file first
      const validation = this.validateFile(filePath, mimeType);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      let extractedText = '';
      let confidence = 0;
      let processingMethod = '';

      if (mimeType === 'application/pdf') {
        // Process PDF
        const result = await this.processPDF(filePath);
        extractedText = result.text;
        confidence = result.confidence;
        processingMethod = result.method || 'PDF text extraction';
      } else if (mimeType.startsWith('image/')) {
        // Process Image
        const result = await this.processImage(filePath);
        extractedText = result.text;
        confidence = result.confidence;
        processingMethod = result.method || 'OCR Processing';
      } else {
        throw new Error('Unsupported file type for OCR processing');
      }

      // Validate extracted text
      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('Unable to extract meaningful text from the document. Please ensure the document is clear and readable.');
      }

      console.log('✅ OCR processing completed. Confidence:', confidence);
      console.log('📄 Extracted text length:', extractedText.length);
      console.log('🔧 Processing method:', processingMethod);

      return {
        success: true,
        text: extractedText,
        confidence,
        processedAt: new Date(),
        fileType: mimeType,
        processingMethod,
        textLength: extractedText.length
      };

    } catch (error) {
      console.error('❌ OCR processing error:', error);

      // Provide more specific error messages
      let userFriendlyMessage = error.message;

      if (error.message.includes('ENOENT')) {
        userFriendlyMessage = 'File not found. Please try uploading the document again.';
      } else if (error.message.includes('timeout')) {
        userFriendlyMessage = 'OCR processing timed out. Please try with a smaller or clearer document.';
      } else if (error.message.includes('memory')) {
        userFriendlyMessage = 'Document too large to process. Please try with a smaller file.';
      }

      throw new Error(userFriendlyMessage);
    }
  }

  /**
   * Process PDF file and extract text
   * @param {string} filePath - Path to PDF file
   * @returns {Object} Extracted text and confidence
   */
  async processPDF(filePath) {
    try {
      console.log('📄 Processing PDF file:', filePath);

      const dataBuffer = await fs.readFile(filePath);

      // Validate PDF file
      if (dataBuffer.length === 0) {
        throw new Error('PDF file is empty or corrupted');
      }

      // Check if it's a valid PDF
      const pdfHeader = dataBuffer.slice(0, 4).toString();
      if (pdfHeader !== '%PDF') {
        throw new Error('Invalid PDF file format');
      }

      const pdfData = await pdfParse(dataBuffer, {
        max: 50, // Limit to first 50 pages for performance
        version: 'v1.10.100' // Use specific version for stability
      });

      console.log('📊 PDF info:', {
        pages: pdfData.numpages,
        textLength: pdfData.text?.length || 0,
        info: pdfData.info
      });

      // If PDF has extractable text, use it directly
      if (pdfData.text && pdfData.text.trim().length > 50) {
        console.log('📄 Using direct PDF text extraction');
        return {
          text: pdfData.text.trim(),
          confidence: 95, // High confidence for direct text extraction
          method: 'Direct PDF text extraction',
          pages: pdfData.numpages
        };
      }

      // If PDF doesn't have extractable text, it might be scanned
      console.log('🖼️ PDF has no extractable text, likely a scanned document');

      // Return what we have with lower confidence and suggest image OCR
      if (pdfData.text && pdfData.text.trim().length > 0) {
        return {
          text: pdfData.text.trim(),
          confidence: 40,
          method: 'Limited PDF text extraction',
          pages: pdfData.numpages,
          warning: 'This appears to be a scanned PDF. For better results, try uploading as an image.'
        };
      }

      throw new Error('No text could be extracted from this PDF. Please try uploading it as an image (JPG/PNG) for OCR processing.');

    } catch (error) {
      console.error('PDF processing error:', error);

      // Provide specific error messages for common PDF issues
      if (error.message.includes('Invalid PDF')) {
        throw new Error('The uploaded file is not a valid PDF document.');
      } else if (error.message.includes('encrypted')) {
        throw new Error('This PDF is password-protected. Please upload an unprotected version.');
      } else if (error.message.includes('corrupted')) {
        throw new Error('The PDF file appears to be corrupted. Please try uploading again.');
      }

      throw error;
    }
  }

  /**
   * Process image file using Tesseract OCR
   * @param {string} filePath - Path to image file
   * @returns {Object} Extracted text and confidence
   */
  async processImage(filePath) {
    try {
      console.log('🖼️ Processing image file:', filePath);

      // Try Google Cloud Vision API first
      if (this.preferredOCR === 'google') {
        try {
          const result = await this.processImageWithGoogleVision(filePath);
          if (result.text && result.text.length > 10) { // Only use if we got substantial text
            console.log('✅ Google Cloud Vision OCR successful');
            return result;
          } else {
            console.log('⚠️ Google Vision returned minimal text, falling back to Tesseract');
          }
        } catch (googleError) {
          console.log('⚠️ Google Cloud Vision failed, falling back to Tesseract:', googleError.message);

          // If it's a permission/billing issue, disable Google Vision for this session
          if (googleError.message.includes('blocked') ||
              googleError.message.includes('PERMISSION_DENIED') ||
              googleError.message.includes('quota') ||
              googleError.message.includes('billing')) {
            console.log('🔄 Disabling Google Vision for this session due to API restrictions');
            this.preferredOCR = 'tesseract';
          }
        }
      }

      // Fallback to Tesseract OCR
      return await this.processImageWithTesseract(filePath);

    } catch (error) {
      console.error('❌ Image OCR processing failed:', error.message);
      throw new Error('Failed to extract text from image. Please ensure the image is clear and contains readable text.');
    }
  }

  /**
   * Validate Base64 image content
   * @param {string} base64Content - Base64 encoded image
   * @returns {boolean} True if valid
   */
  validateBase64Image(base64Content) {
    try {
      // Check if it's valid Base64
      const buffer = Buffer.from(base64Content, 'base64');

      // Check minimum size (should be at least a few bytes)
      if (buffer.length < 10) {
        return false;
      }

      // Check for common image file signatures
      const signature = buffer.toString('hex', 0, 8).toUpperCase();
      const validSignatures = [
        '89504E47', // PNG
        'FFD8FFE0', // JPEG
        'FFD8FFE1', // JPEG
        'FFD8FFDB', // JPEG
        '47494638', // GIF
        '424D',     // BMP (first 2 bytes)
        '52494646'  // WEBP (RIFF)
      ];

      return validSignatures.some(sig => signature.startsWith(sig));
    } catch (error) {
      return false;
    }
  }

  /**
   * Process image using Google Cloud Vision API
   * @param {string} filePath - Path to image file
   * @returns {Object} Extracted text and confidence
   */
  async processImageWithGoogleVision(filePath) {
    try {
      console.log('🔍 Running Google Cloud Vision OCR on:', filePath);

      // Read the image file
      const imageBuffer = await fs.readFile(filePath);
      const base64Content = imageBuffer.toString('base64');

      // Validate the Base64 content
      if (!this.validateBase64Image(base64Content)) {
        throw new Error('Invalid image format or corrupted image file');
      }

      // Create the request
      const request = {
        image: {
          content: base64Content
        },
        features: [
          {
            type: 'TEXT_DETECTION',
            maxResults: 1
          }
        ],
        imageContext: {
          languageHints: ['en', 'hi'] // English and Hindi support
        }
      };

      // Make API call with API key
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [request]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Vision API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const annotations = data.responses[0]?.textAnnotations;

      if (!annotations || annotations.length === 0) {
        throw new Error('No text detected in image');
      }

      const extractedText = annotations[0].description || '';
      const confidence = 95; // Google Vision typically has high confidence

      console.log(`✅ Google Vision OCR completed with confidence: ${confidence}%`);
      console.log(`📄 Extracted text length: ${extractedText.length} characters`);

      return {
        text: extractedText,
        confidence: confidence,
        method: 'Google Cloud Vision API'
      };

    } catch (error) {
      console.error('❌ Google Cloud Vision OCR failed:', error.message);
      throw error;
    }
  }

  /**
   * Process image using Tesseract OCR (fallback method)
   * @param {string} filePath - Path to image file
   * @returns {Object} Extracted text and confidence
   */
  async processImageWithTesseract(filePath) {
    let preprocessedPath = null;

    try {
      console.log('🔍 Running Tesseract OCR (fallback) on:', filePath);

      // Validate image file
      const imageInfo = await sharp(filePath).metadata();

      console.log('📊 Image info:', {
        format: imageInfo.format,
        width: imageInfo.width,
        height: imageInfo.height,
        size: `${(imageInfo.size / 1024).toFixed(2)} KB`
      });

      // Check image dimensions
      if (imageInfo.width < 100 || imageInfo.height < 100) {
        throw new Error('Image is too small for reliable OCR processing. Minimum size is 100x100 pixels.');
      }

      if (imageInfo.width > 5000 || imageInfo.height > 5000) {
        console.log('⚠️ Large image detected, this may take longer to process');
      }

      // Preprocess image for better OCR results
      preprocessedPath = await this.preprocessImage(filePath);

      // Set timeout for OCR processing
      const ocrPromise = Tesseract.recognize(
        preprocessedPath,
        'eng',
        {
          ...this.tesseractOptions,
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OCR processing timed out after 60 seconds')), 60000);
      });

      const { data: { text, confidence } } = await Promise.race([ocrPromise, timeoutPromise]);

      // Validate OCR results
      if (confidence < 30) {
        console.warn('⚠️ Low OCR confidence:', confidence);
      }

      if (!text || text.trim().length < 5) {
        throw new Error('Unable to extract readable text from the image. Please ensure the image is clear and contains text.');
      }

      console.log('✅ Tesseract OCR completed with confidence:', Math.round(confidence));

      return {
        text: text.trim(),
        confidence: Math.round(confidence),
        method: 'Tesseract OCR'
      };

    } catch (error) {
      console.error('❌ Tesseract OCR processing failed:', error.message);

      if (error.message.includes('timeout')) {
        throw new Error('OCR processing took too long. Please try with a smaller or clearer image.');
      } else if (error.message.includes('too small')) {
        throw error;
      } else {
        throw new Error('Failed to extract text from image using Tesseract. Please ensure the image is clear and contains readable text.');
      }
    } finally {
      // Clean up preprocessed image
      if (preprocessedPath && preprocessedPath !== filePath) {
        try {
          await fs.unlink(preprocessedPath);
          console.log('🧹 Cleaned up preprocessed image');
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up preprocessed image:', cleanupError.message);
        }
      }
    }
  }

  /**
   * Preprocess image for better OCR results
   * @param {string} filePath - Original image path
   * @returns {string} Path to preprocessed image
   */
  async preprocessImage(filePath) {
    try {
      console.log('🔧 Preprocessing image for better OCR results');

      const ext = path.extname(filePath);
      const preprocessedPath = filePath.replace(ext, `_processed.png`);

      const sharp = require('sharp');
      const image = sharp(filePath);
      const metadata = await image.metadata();

      // Apply preprocessing based on image characteristics
      let pipeline = image;

      // Resize if too large (for performance) or too small (for quality)
      if (metadata.width > 3000 || metadata.height > 3000) {
        console.log('📏 Resizing large image for better performance');
        pipeline = pipeline.resize(3000, 3000, {
          fit: 'inside',
          withoutEnlargement: true
        });
      } else if (metadata.width < 800 && metadata.height < 800) {
        console.log('📏 Upscaling small image for better OCR');
        pipeline = pipeline.resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: false
        });
      }

      // Apply image enhancements
      pipeline = pipeline
        .normalize() // Normalize contrast
        .sharpen({ sigma: 1, m1: 1, m2: 2 }) // Sharpen text
        .greyscale() // Convert to grayscale for better OCR
        .png({
          quality: 100,
          compressionLevel: 0 // No compression for best quality
        });

      await pipeline.toFile(preprocessedPath);

      console.log('✅ Image preprocessed successfully:', preprocessedPath);
      return preprocessedPath;

    } catch (error) {
      console.warn('⚠️ Image preprocessing failed, using original:', error.message);

      // If preprocessing fails, we can still try OCR with the original
      // This ensures the process doesn't fail completely
      return filePath;
    }
  }

  /**
   * Parse purchase bill text and extract structured data
   * @param {string} text - Raw OCR text
   * @returns {Object} Structured purchase bill data
   */
  parsePurchaseBill(text) {
    try {
      console.log('📋 Parsing purchase bill from OCR text');

      // Validate input text
      if (!text || typeof text !== 'string' || text.trim().length < 20) {
        throw new Error('Insufficient text content for bill parsing. Please ensure the document is clear and readable.');
      }

      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length < 5) {
        throw new Error('Document appears to have too few lines of text. Please ensure the entire bill is visible and clear.');
      }

      const billData = {
        supplier: this.extractSupplierInfo(lines),
        billNumber: this.extractBillNumber(lines),
        billDate: this.extractBillDate(lines),
        medicines: this.extractMedicines(lines),
        totals: this.extractTotals(lines),
        gst: this.extractGSTInfo(lines)
      };

      // Validate extracted data
      const validationErrors = [];

      if (!billData.supplier.name) {
        validationErrors.push('Could not identify supplier name');
      }

      if (billData.medicines.length === 0) {
        validationErrors.push('No medicines found in the bill');
      }

      if (billData.totals.totalAmount === 0) {
        validationErrors.push('Could not extract total amount');
      }

      if (validationErrors.length > 0) {
        console.warn('⚠️ Bill parsing validation warnings:', validationErrors);
        billData.warnings = validationErrors;
      }

      console.log('✅ Purchase bill parsing completed');
      console.log('📊 Extracted data summary:', {
        supplier: billData.supplier.name || 'Unknown',
        medicines: billData.medicines.length,
        totalAmount: billData.totals.totalAmount,
        warnings: validationErrors.length
      });

      return billData;

    } catch (error) {
      console.error('Purchase bill parsing error:', error);
      throw new Error(`Failed to parse purchase bill: ${error.message}`);
    }
  }

  /**
   * Parse prescription text and extract medicine information
   * @param {string} text - Raw OCR text
   * @returns {Object} Structured prescription data
   */
  parsePrescription(text) {
    try {
      console.log('💊 Parsing prescription from OCR text');

      // Validate input text
      if (!text || typeof text !== 'string' || text.trim().length < 10) {
        throw new Error('Insufficient text content for prescription parsing. Please ensure the prescription is clear and readable.');
      }

      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length < 3) {
        throw new Error('Prescription appears to have too few lines of text. Please ensure the entire prescription is visible and clear.');
      }

      const prescriptionData = {
        doctor: this.extractDoctorInfo(lines),
        patient: this.extractPatientInfo(lines),
        medicines: this.extractPrescriptionMedicines(lines),
        date: this.extractPrescriptionDate(lines)
      };

      // Validate extracted data
      const validationErrors = [];

      if (prescriptionData.medicines.length === 0) {
        validationErrors.push('No medicines found in the prescription');
      }

      // Check for common prescription indicators
      const prescriptionIndicators = ['rx', 'prescription', 'medicine', 'tablet', 'capsule', 'syrup', 'mg', 'ml'];
      const hasIndicators = prescriptionIndicators.some(indicator =>
        text.toLowerCase().includes(indicator)
      );

      if (!hasIndicators) {
        validationErrors.push('Document may not be a medical prescription');
      }

      if (validationErrors.length > 0) {
        console.warn('⚠️ Prescription parsing validation warnings:', validationErrors);
        prescriptionData.warnings = validationErrors;
      }

      console.log('✅ Prescription parsing completed');
      console.log('💊 Extracted data summary:', {
        doctor: prescriptionData.doctor || 'Not found',
        patient: prescriptionData.patient || 'Not found',
        medicines: prescriptionData.medicines.length,
        warnings: validationErrors.length
      });

      return prescriptionData;

    } catch (error) {
      console.error('Prescription parsing error:', error);
      throw new Error(`Failed to parse prescription: ${error.message}`);
    }
  }

  /**
   * Extract supplier information from bill text with improved logic
   */
  extractSupplierInfo(lines) {
    const supplierInfo = {
      name: '',
      address: '',
      phone: '',
      gstNumber: ''
    };

    console.log('🏢 Extracting supplier info from', lines.length, 'lines');

    // Skip patterns for headers/footers
    const skipPatterns = [
      /^(tax invoice|invoice|bill|receipt|purchase|order)/i,
      /^(date|time|no\.?|sr\.?)/i,
      /^[\-\=\*\+\s]*$/,
      /^(to|from|address)/i
    ];

    // Look for supplier name in first few lines
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i].trim();
      if (!line || line.length < 3) continue;

      // Skip header patterns
      if (skipPatterns.some(pattern => pattern.test(line))) {
        continue;
      }

      // Look for company indicators
      const companyIndicators = [
        'pharma', 'pharmaceutical', 'medical', 'healthcare', 'drugs',
        'pvt', 'ltd', 'limited', 'company', 'corp', 'enterprises',
        'distributors', 'suppliers', 'traders'
      ];

      const lowerLine = line.toLowerCase();
      const hasCompanyIndicator = companyIndicators.some(indicator =>
        lowerLine.includes(indicator)
      );

      // First substantial line with company indicators, or first line if none found
      if ((hasCompanyIndicator || (!supplierInfo.name && line.length > 5)) &&
          !line.match(/^\d+/) && // Not starting with numbers
          !line.includes('@') && // Not email
          !line.match(/^\d{10}/) // Not phone
      ) {
        supplierInfo.name = line.trim();
        console.log('🏢 Found supplier name:', supplierInfo.name);
        break;
      }
    }

    // Extract address (lines after supplier name, before medicine items)
    let addressLines = [];
    let foundName = false;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].trim();

      if (foundName && addressLines.length < 3) {
        // Stop if we hit medicine-like content
        if (this.isMedicineName(line, ['tab', 'cap', 'mg', 'ml']) ||
            line.match(/^\d+\s+\d+\.?\d*\s+\d+\.?\d*$/)) {
          break;
        }

        // Add to address if it looks like address content
        if (line.length > 5 &&
            !line.match(/^(phone|tel|mobile|email|gst)/i) &&
            !line.match(/^\d{10}/) &&
            !line.includes('@')) {
          addressLines.push(line);
        }
      }

      if (line === supplierInfo.name) {
        foundName = true;
      }
    }

    supplierInfo.address = addressLines.join(', ');
    if (supplierInfo.address) {
      console.log('📍 Found address:', supplierInfo.address);
    }

    // Extract phone number (improved patterns)
    const phonePatterns = [
      /(?:phone|tel|mobile|mob|ph)[:\s]*(\d{10,12})/i,
      /(\d{10,12})/,
      /(\+91[\s\-]?\d{10})/
    ];

    for (const line of lines) {
      for (const pattern of phonePatterns) {
        const phoneMatch = line.match(pattern);
        if (phoneMatch) {
          supplierInfo.phone = phoneMatch[1].replace(/\D/g, ''); // Remove non-digits
          console.log('📞 Found phone:', supplierInfo.phone);
          break;
        }
      }
      if (supplierInfo.phone) break;
    }

    // Extract GST number (improved patterns)
    const gstPatterns = [
      /GST[IN]*[:\s]*([A-Z0-9]{15})/i,
      /GSTIN[:\s]*([A-Z0-9]{15})/i,
      /([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/
    ];

    for (const line of lines) {
      for (const pattern of gstPatterns) {
        const gstMatch = line.match(pattern);
        if (gstMatch) {
          supplierInfo.gstNumber = gstMatch[1];
          console.log('🏛️ Found GST:', supplierInfo.gstNumber);
          break;
        }
      }
      if (supplierInfo.gstNumber) break;
    }

    console.log('🏢 Final supplier info:', supplierInfo);
    return supplierInfo;
  }

  /**
   * Extract bill number from text
   */
  extractBillNumber(lines) {
    const billRegex = /(?:bill|invoice|receipt)[\s#:]*([A-Z0-9\-\/]+)/i;
    
    for (const line of lines) {
      const match = line.match(billRegex);
      if (match) {
        return match[1];
      }
    }
    
    return '';
  }

  /**
   * Extract bill date from text
   */
  extractBillDate(lines) {
    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    
    for (const line of lines) {
      const match = line.match(dateRegex);
      if (match) {
        return match[1];
      }
    }
    
    return '';
  }

  /**
   * Extract medicines from purchase bill with improved Indian medical bill parsing
   */
  extractMedicines(lines) {
    const medicines = [];
    console.log('🔍 Extracting medicines from', lines.length, 'lines');

    // Common medicine name patterns in India
    const medicineIndicators = [
      'tab', 'tablet', 'cap', 'capsule', 'syrup', 'injection', 'inj',
      'mg', 'ml', 'gm', 'mcg', 'iu', 'drops', 'ointment', 'cream',
      'paracetamol', 'amoxicillin', 'azithromycin', 'crocin', 'dolo',
      'combiflam', 'calpol', 'augmentin', 'cipla', 'ranbaxy', 'sun pharma'
    ];

    // Skip patterns (headers, footers, etc.)
    const skipPatterns = [
      /^(item|description|medicine|product|name|qty|quantity|rate|price|amount|total|subtotal|gst|tax|bill|invoice|date|no\.?|sr\.?)/i,
      /^(thank you|thanks|visit again|address|phone|email|website|gstin?|pan|cin)/i,
      /^[\-\=\*\+\s]*$/,
      /^page \d+/i,
      /^continued/i
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.length < 3) continue;

      // Skip header/footer patterns
      if (skipPatterns.some(pattern => pattern.test(line))) {
        continue;
      }

      // Try multiple parsing patterns for Indian medical bills
      let medicine = this.parseMedicineLine(line, medicineIndicators);

      if (medicine) {
        console.log('✅ Found medicine:', medicine.name);
        medicines.push(medicine);
      }
    }

    console.log('📊 Total medicines extracted:', medicines.length);
    return medicines;
  }

  /**
   * Parse individual medicine line with multiple patterns
   */
  parseMedicineLine(line, medicineIndicators) {
    // Pattern 1: Name Qty Rate Amount (most common)
    // Example: "Paracetamol 500mg Tab 10 12.50 125.00"
    let pattern1 = /^(.+?)\s+(\d+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)$/;
    let match = line.match(pattern1);

    if (match && this.isMedicineName(match[1], medicineIndicators)) {
      return {
        name: this.cleanMedicineName(match[1]),
        quantity: parseInt(match[2]),
        unitPrice: parseFloat(match[3]),
        totalPrice: parseFloat(match[4]),
        price: parseFloat(match[3]), // Add price field for frontend compatibility
        unitType: this.detectUnitType(match[1]),
        batchNumber: '',
        expiryDate: '',
        rawLine: line
      };
    }

    // Pattern 2: Name Batch Exp Qty Rate Amount
    // Example: "Crocin Advance B123 12/25 20 8.50 170.00"
    pattern1 = /^(.+?)\s+([A-Z0-9]+)\s+(\d{1,2}\/\d{2,4})\s+(\d+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)$/;
    match = line.match(pattern1);

    if (match && this.isMedicineName(match[1], medicineIndicators)) {
      return {
        name: this.cleanMedicineName(match[1]),
        quantity: parseInt(match[4]),
        unitPrice: parseFloat(match[5]),
        totalPrice: parseFloat(match[6]),
        price: parseFloat(match[5]), // Add price field for frontend compatibility
        unitType: this.detectUnitType(match[1]),
        batchNumber: match[2],
        expiryDate: match[3],
        rawLine: line
      };
    }

    // Pattern 3: Just name and numbers (flexible)
    // Example: "Amoxicillin 250mg 5 25.00"
    pattern1 = /^(.+?)\s+(\d+)\s+(\d+\.?\d*)$/;
    match = line.match(pattern1);

    if (match && this.isMedicineName(match[1], medicineIndicators)) {
      return {
        name: this.cleanMedicineName(match[1]),
        quantity: parseInt(match[2]),
        unitPrice: parseFloat(match[3]),
        totalPrice: parseInt(match[2]) * parseFloat(match[3]),
        price: parseFloat(match[3]), // Add price field for frontend compatibility
        unitType: this.detectUnitType(match[1]),
        batchNumber: '',
        expiryDate: '',
        rawLine: line
      };
    }

    // Pattern 4: Medicine name with dosage only
    // Example: "Paracetamol 500mg Tablet"
    if (this.isMedicineName(line, medicineIndicators)) {
      return {
        name: this.cleanMedicineName(line),
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        price: 0, // Add price field for frontend compatibility
        unitType: this.detectUnitType(line),
        batchNumber: '',
        expiryDate: '',
        rawLine: line
      };
    }

    return null;
  }

  /**
   * Check if a string looks like a medicine name
   */
  isMedicineName(text, medicineIndicators) {
    if (!text || text.length < 3) return false;

    const lowerText = text.toLowerCase();

    // Check for medicine indicators
    const hasIndicator = medicineIndicators.some(indicator =>
      lowerText.includes(indicator.toLowerCase())
    );

    if (hasIndicator) return true;

    // Check for common medicine name patterns
    const medicinePatterns = [
      /\d+\s*mg/i,           // Contains dosage like "500mg"
      /\d+\s*ml/i,           // Contains volume like "100ml"
      /\d+\s*mcg/i,          // Contains micrograms
      /\d+\s*iu/i,           // Contains international units
      /tab|cap|syr/i,        // Common abbreviations
      /^[A-Z][a-z]+[A-Z]/,   // CamelCase (brand names)
      /forte|plus|advance|ds/i // Common medicine suffixes
    ];

    return medicinePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Clean and standardize medicine name
   */
  cleanMedicineName(name) {
    return name
      .trim()
      .replace(/\s+/g, ' ')           // Multiple spaces to single
      .replace(/[^\w\s\.\-\+]/g, '')  // Remove special chars except . - +
      .replace(/\b(tab|tablet|cap|capsule|syr|syrup|inj|injection)\b/gi, '') // Remove common suffixes
      .trim();
  }

  /**
   * Detect unit type from medicine name
   */
  detectUnitType(name) {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('syrup') || lowerName.includes('syr') || lowerName.includes('ml')) {
      return 'bottle';
    } else if (lowerName.includes('injection') || lowerName.includes('inj') || lowerName.includes('vial')) {
      return 'vial';
    } else if (lowerName.includes('ointment') || lowerName.includes('cream') || lowerName.includes('gel')) {
      return 'tube';
    } else if (lowerName.includes('drops')) {
      return 'bottle';
    } else {
      return 'strip'; // Default for tablets/capsules
    }
  }

  /**
   * Extract total amounts from bill with improved parsing
   */
  extractTotals(lines) {
    const totals = {
      subtotal: 0,
      gstAmount: 0,
      totalAmount: 0
    };

    console.log('💰 Extracting totals from bill');

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Look for subtotal patterns
      if (lowerLine.includes('subtotal') || lowerLine.includes('sub total') || lowerLine.includes('sub-total')) {
        const amountMatch = line.match(/(\d+\.?\d*)$/);
        if (amountMatch) {
          totals.subtotal = parseFloat(amountMatch[1]);
          console.log('📊 Found subtotal:', totals.subtotal);
        }
      }

      // Look for GST amount
      else if (lowerLine.includes('gst') || lowerLine.includes('tax')) {
        const amountMatch = line.match(/(\d+\.?\d*)$/);
        if (amountMatch) {
          totals.gstAmount = parseFloat(amountMatch[1]);
          console.log('📊 Found GST amount:', totals.gstAmount);
        }
      }

      // Look for total amount (various patterns)
      else if (lowerLine.includes('total') || lowerLine.includes('grand total') || lowerLine.includes('net amount')) {
        // Try to find the last number in the line (usually the amount)
        const amountMatches = line.match(/(\d+\.?\d*)/g);
        if (amountMatches && amountMatches.length > 0) {
          const amount = parseFloat(amountMatches[amountMatches.length - 1]);
          if (amount > totals.totalAmount) { // Take the largest total found
            totals.totalAmount = amount;
            console.log('📊 Found total amount:', totals.totalAmount);
          }
        }
      }

      // Look for amount patterns at end of lines (could be totals)
      else if (/^\s*(?:rs\.?|₹)?\s*(\d+\.?\d*)\s*$/.test(line)) {
        const amount = parseFloat(line.match(/(\d+\.?\d*)/)[1]);
        if (amount > 100 && amount > totals.totalAmount) { // Likely a total if > 100
          totals.totalAmount = amount;
          console.log('📊 Found potential total:', totals.totalAmount);
        }
      }
    }

    // If no subtotal found, calculate from total and GST
    if (totals.subtotal === 0 && totals.totalAmount > 0 && totals.gstAmount > 0) {
      totals.subtotal = totals.totalAmount - totals.gstAmount;
    }

    console.log('💰 Final totals:', totals);
    return totals;
  }

  /**
   * Extract GST information
   */
  extractGSTInfo(lines) {
    const gstInfo = {
      rate: 0,
      amount: 0
    };

    for (const line of lines) {
      const gstMatch = line.match(/GST[\s@]*(\d+)%/i);
      if (gstMatch) {
        gstInfo.rate = parseInt(gstMatch[1]);
      }
    }

    return gstInfo;
  }

  /**
   * Extract doctor information from prescription
   */
  extractDoctorInfo(lines) {
    // Look for "Dr." prefix
    for (const line of lines) {
      if (line.toLowerCase().startsWith('dr.') || line.toLowerCase().includes('doctor')) {
        return line.replace(/^dr\.?\s*/i, '').trim();
      }
    }
    return '';
  }

  /**
   * Extract patient information from prescription
   */
  extractPatientInfo(lines) {
    // Look for patient name patterns
    for (const line of lines) {
      if (line.toLowerCase().includes('patient') || line.toLowerCase().includes('name')) {
        return line.replace(/patient|name/gi, '').replace(/[:]/g, '').trim();
      }
    }
    return '';
  }

  /**
   * Extract medicines from prescription with improved parsing
   */
  extractPrescriptionMedicines(lines) {
    const medicines = [];
    console.log('💊 Extracting prescription medicines from', lines.length, 'lines');

    // Common prescription patterns
    const prescriptionIndicators = [
      'rx', 'r/', 'take', 'tablet', 'capsule', 'syrup', 'drops',
      'mg', 'ml', 'gm', 'mcg', 'twice', 'thrice', 'daily', 'morning', 'evening'
    ];

    // Skip patterns for prescription headers/footers
    const skipPatterns = [
      /^(dr\.?|doctor|patient|age|date|prescription|rx)/i,
      /^(name|address|phone|email)/i,
      /^[\-\=\*\+\s]*$/,
      /^(signature|seal|stamp)/i
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.length < 3) continue;

      // Skip header/footer patterns
      if (skipPatterns.some(pattern => pattern.test(line))) {
        continue;
      }

      // Try multiple prescription medicine patterns
      let medicine = this.parsePrescriptionLine(line, prescriptionIndicators);

      if (medicine) {
        console.log('💊 Found prescription medicine:', medicine.name);
        medicines.push(medicine);
      }
    }

    console.log('💊 Total prescription medicines extracted:', medicines.length);
    return medicines;
  }

  /**
   * Parse individual prescription line
   */
  parsePrescriptionLine(line, indicators) {
    // Pattern 1: "1. Paracetamol 500mg - Take twice daily"
    let pattern = /^(\d+\.?\s*)?(.+?)\s+(\d+\s*(?:mg|ml|gm|mcg|iu))\s*[-–]?\s*(.*)$/i;
    let match = line.match(pattern);

    if (match && this.isPrescriptionMedicine(match[2], indicators)) {
      return {
        name: this.cleanMedicineName(match[2]),
        dosage: match[3].trim(),
        instructions: match[4] || '',
        quantity: this.extractQuantityFromInstructions(match[4] || ''),
        rawLine: line
      };
    }

    // Pattern 2: "Paracetamol 500mg"
    pattern = /^(.+?)\s+(\d+\s*(?:mg|ml|gm|mcg|iu))$/i;
    match = line.match(pattern);

    if (match && this.isPrescriptionMedicine(match[1], indicators)) {
      return {
        name: this.cleanMedicineName(match[1]),
        dosage: match[2].trim(),
        instructions: '',
        quantity: 1,
        rawLine: line
      };
    }

    // Pattern 3: Just medicine name with common indicators
    if (this.isPrescriptionMedicine(line, indicators)) {
      return {
        name: this.cleanMedicineName(line),
        dosage: '',
        instructions: '',
        quantity: 1,
        rawLine: line
      };
    }

    return null;
  }

  /**
   * Check if text looks like a prescription medicine
   */
  isPrescriptionMedicine(text, indicators) {
    if (!text || text.length < 3) return false;

    const lowerText = text.toLowerCase();

    // Check for prescription indicators
    return indicators.some(indicator =>
      lowerText.includes(indicator.toLowerCase())
    ) || this.isMedicineName(text, indicators);
  }

  /**
   * Extract quantity from prescription instructions
   */
  extractQuantityFromInstructions(instructions) {
    if (!instructions) return 1;

    const lowerInstructions = instructions.toLowerCase();

    // Look for quantity patterns
    if (lowerInstructions.includes('twice') || lowerInstructions.includes('2 times')) {
      return 2;
    } else if (lowerInstructions.includes('thrice') || lowerInstructions.includes('3 times')) {
      return 3;
    } else if (lowerInstructions.includes('four times') || lowerInstructions.includes('4 times')) {
      return 4;
    }

    // Look for explicit numbers
    const numberMatch = instructions.match(/(\d+)\s*(?:tablet|capsule|drop|ml)/i);
    if (numberMatch) {
      return parseInt(numberMatch[1]);
    }

    return 1; // Default
  }

  /**
   * Extract prescription date
   */
  extractPrescriptionDate(lines) {
    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    
    for (const line of lines) {
      const match = line.match(dateRegex);
      if (match) {
        return match[1];
      }
    }
    
    return '';
  }
}

module.exports = new OCRService();
