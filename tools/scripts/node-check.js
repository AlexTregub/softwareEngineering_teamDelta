// Simple Node.js environment check
console.log('🔍 Checking Node.js environment...');

// Check if Node.js is available
try {
  const fs = require('fs');
  const path = require('path');
  
  console.log('✅ Node.js is available');
  console.log(`   Version: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  
  // Check if we can run the ant test
  const testPath = path.join(__dirname, 'test', 'ant.test.js');
  
  if (fs.existsSync(testPath)) {
    console.log('✅ Ant test file found');
    console.log('🧪 Attempting to run ant test...');
    
    try {
      // Run the test
      require(testPath);
    } catch (error) {
      console.log('❌ Error running ant test:', error.message);
      if (error.stack) {
        console.log('Stack trace:', error.stack);
      }
    }
  } else {
    console.log('❌ Ant test file not found at:', testPath);
  }
  
} catch (error) {
  console.log('❌ Node.js not available or error occurred:', error.message);
}