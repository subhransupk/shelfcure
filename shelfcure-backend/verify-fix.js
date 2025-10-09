/**
 * Verify that the "medicine is not defined" fix has been applied
 */

const fs = require('fs');
const path = require('path');

function verifyFix() {
  console.log('🔍 Verifying "medicine is not defined" fix...\n');
  
  const filePath = path.join(__dirname, 'controllers', 'purchaseReturnController.js');
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');
    
    console.log('📁 File:', filePath);
    console.log('📊 Total lines:', lines.length);
    
    // Check specific lines where the fix should be applied
    const line617 = lines[616]; // Line 617 (0-based index)
    const line620 = lines[619]; // Line 620
    const line621 = lines[620]; // Line 621
    const line623 = lines[622]; // Line 623
    const line624 = lines[623]; // Line 624
    
    console.log('\n🔍 Checking fixed lines:');
    console.log('Line 617:', line617?.trim() || 'NOT FOUND');
    console.log('Line 620:', line620?.trim() || 'NOT FOUND');
    console.log('Line 621:', line621?.trim() || 'NOT FOUND');
    console.log('Line 623:', line623?.trim() || 'NOT FOUND');
    console.log('Line 624:', line624?.trim() || 'NOT FOUND');
    
    // Check if the fix is applied
    const hasMedicineToUpdate617 = line617?.includes('medicineToUpdate.name');
    const hasMedicineToUpdate620 = line620?.includes('medicineToUpdate.unitTypes');
    const hasMedicineToUpdate621 = line621?.includes('medicineToUpdate.unitTypes');
    const hasMedicineToUpdate623 = line623?.includes('medicineToUpdate.stripInfo');
    const hasMedicineToUpdate624 = line624?.includes('medicineToUpdate.individualInfo');
    
    console.log('\n✅ Fix verification:');
    console.log('Line 617 fixed:', hasMedicineToUpdate617 ? '✅' : '❌');
    console.log('Line 620 fixed:', hasMedicineToUpdate620 ? '✅' : '❌');
    console.log('Line 621 fixed:', hasMedicineToUpdate621 ? '✅' : '❌');
    console.log('Line 623 fixed:', hasMedicineToUpdate623 ? '✅' : '❌');
    console.log('Line 624 fixed:', hasMedicineToUpdate624 ? '✅' : '❌');
    
    const allFixed = hasMedicineToUpdate617 && hasMedicineToUpdate620 && hasMedicineToUpdate621 && hasMedicineToUpdate623 && hasMedicineToUpdate624;
    
    if (allFixed) {
      console.log('\n🎉 All fixes have been applied correctly!');
      console.log('📋 The issue is that the backend server needs to be restarted.');
      console.log('\n🔧 To fix the error:');
      console.log('1. Stop the backend server (Ctrl+C)');
      console.log('2. Restart the server: npm start or node server.js');
      console.log('3. Try the "Mark as Completed" functionality again');
    } else {
      console.log('\n❌ Some fixes are missing. Let me show you what needs to be fixed:');
      
      if (!hasMedicineToUpdate617) {
        console.log('❌ Line 617 still has "medicine.name" instead of "medicineToUpdate.name"');
      }
      if (!hasMedicineToUpdate620) {
        console.log('❌ Line 620 still has "medicine.unitTypes" instead of "medicineToUpdate.unitTypes"');
      }
      if (!hasMedicineToUpdate621) {
        console.log('❌ Line 621 still has "medicine.unitTypes" instead of "medicineToUpdate.unitTypes"');
      }
      if (!hasMedicineToUpdate623) {
        console.log('❌ Line 623 still has "medicine.stripInfo" instead of "medicineToUpdate.stripInfo"');
      }
      if (!hasMedicineToUpdate624) {
        console.log('❌ Line 624 still has "medicine.individualInfo" instead of "medicineToUpdate.individualInfo"');
      }
    }
    
    // Check for any remaining "medicine." references that should be "medicineToUpdate."
    console.log('\n🔍 Checking for remaining undefined "medicine" references...');
    let foundIssues = false;
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      // Look for "medicine." but not "medicineToUpdate." or "Medicine." (model) or "item.medicine"
      if (line.includes('medicine.') && !line.includes('medicineToUpdate.') && !line.includes('Medicine.') && !line.includes('item.medicine') && !line.includes('originalItem.medicine') && !line.includes('foundMedicine.') && !line.includes('savedMedicine.')) {
        console.log(`❌ Line ${lineNumber}: ${line.trim()}`);
        foundIssues = true;
      }
    });
    
    if (!foundIssues) {
      console.log('✅ No remaining undefined "medicine" references found.');
    }
    
    console.log('\n📋 Summary:');
    if (allFixed && !foundIssues) {
      console.log('✅ Code fix is complete and correct');
      console.log('🔄 Backend server restart required');
      console.log('🧪 Test after restart should work');
    } else {
      console.log('❌ Code fix needs attention');
      console.log('🔧 Manual correction may be needed');
    }
    
  } catch (error) {
    console.error('❌ Error reading file:', error.message);
    console.log('\n🔧 Manual check required:');
    console.log('1. Open shelfcure-backend/controllers/purchaseReturnController.js');
    console.log('2. Go to lines 617, 620-624');
    console.log('3. Replace "medicine." with "medicineToUpdate."');
    console.log('4. Restart the backend server');
  }
}

verifyFix();
