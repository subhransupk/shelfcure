const ocrService = require('./services/ocrService');
const fs = require('fs');
const path = require('path');

// Test Google Cloud Vision API integration
async function testGoogleVisionAPI() {
  console.log('🧪 Testing Google Cloud Vision API Integration');
  console.log('==============================================');
  
  try {
    // Create a simple test image with text (base64 encoded)
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Check if we have the Google API key
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY || 'AIzaSyCOPucbAlChSW6tZmu7as6s1nTNI2r0b30';
    console.log('🔑 API Key configured:', apiKey ? 'Yes' : 'No');
    console.log('🔑 API Key (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'Not found');
    
    // Test the API directly
    console.log('\n🔍 Testing Google Vision API directly...');
    
    // Create a simple test request with valid minimal PNG
    const testRequest = {
      requests: [{
        image: {
          content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' // Valid 1x1 PNG
        },
        features: [{
          type: 'TEXT_DETECTION',
          maxResults: 1
        }]
      }]
    };

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response OK:', response.ok);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Response received successfully');
    console.log('📄 Response data:', JSON.stringify(data, null, 2));

    // Test OCR service configuration
    console.log('\n🔧 Testing OCR Service Configuration...');
    console.log('Preferred OCR method:', ocrService.preferredOCR);
    console.log('Google API Key configured:', ocrService.googleApiKey ? 'Yes' : 'No');

    // Test with a real image if available
    const uploadsDir = path.join(__dirname, 'uploads', 'ocr');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const imageFiles = files.filter(file => 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.jpeg') || 
        file.toLowerCase().endsWith('.png')
      );

      if (imageFiles.length > 0) {
        const testImagePath = path.join(uploadsDir, imageFiles[0]);
        console.log('\n🖼️ Testing with real image:', imageFiles[0]);
        
        try {
          const result = await ocrService.processImageWithGoogleVision(testImagePath);
          console.log('✅ Google Vision OCR Result:');
          console.log('📄 Text length:', result.text.length);
          console.log('🎯 Confidence:', result.confidence);
          console.log('🔧 Method:', result.method);
          console.log('📝 First 200 characters:', result.text.substring(0, 200));
        } catch (imageError) {
          console.error('❌ Image processing error:', imageError.message);
        }
      } else {
        console.log('⚠️ No test images found in uploads/ocr directory');
      }
    } else {
      console.log('⚠️ Uploads directory not found');
    }

    console.log('\n✅ Google Cloud Vision API Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testGoogleVisionAPI();
