/**
 * Utility script to convert custom test harness files to standard Mocha/Chai format
 * Run with: node test/unit/convert-to-mocha.js <test-file-path>
 */

const fs = require('fs');
const path = require('path');

function convertTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already using Mocha (has describe/it)
  if (content.includes('describe(') && content.includes('it(')) {
    console.log(`✓ ${path.basename(filePath)} already uses Mocha/Chai`);
    return false;
  }
  
  console.log(`Converting ${path.basename(filePath)}...`);
  
  let converted = content;
  
  // Add Chai import if not present
  if (!converted.includes("require('chai')")) {
    converted = `const { expect } = require('chai');\n` + converted;
  }
  
  // Remove custom test suite/runner patterns
  converted = converted.replace(/const\s+(testSuite|suite)\s*=\s*\{[\s\S]*?\};/g, '');
  converted = converted.replace(/class\s+TestSuite\s*\{[\s\S]*?\n\}/g, '');
  converted = converted.replace(/const\s+\w*TestSuite\s*=\s*\{[\s\S]*?\};/g, '');
  
  // Remove run() calls and process.exit
  converted = converted.replace(/\n\s*(const\s+)?success\s*=\s*\w+\.run\(\);?/g, '');
  converted = converted.replace(/\w+\.run\(\);?/g, '');
  converted = converted.replace(/process\.exit\([^\)]*\);?/g, '');
  
  // Remove global test runner registrations
  converted = converted.replace(/if\s*\(typeof\s+globalThis[\s\S]*?registerTest[\s\S]*?\}/g, '');
  converted = converted.replace(/if\s*\(typeof\s+globalThis[\s\S]*?shouldRunTests[\s\S]*?\}/g, '');
  
  // Clean up multiple consecutive blank lines
  converted = converted.replace(/\n\n\n+/g, '\n\n');
  
  return converted;
}

// If run directly with file argument
if (require.main === module && process.argv[2]) {
  const filePath = path.resolve(process.argv[2]);
  try {
    const result = convertTestFile(filePath);
    if (result) {
      console.log('\nManual conversion needed for test assertions.');
      console.log('Replace:');
      console.log('  testSuite.assertEqual(a, b) → expect(a).to.equal(b)');
      console.log('  testSuite.assertTrue(v) → expect(v).to.be.true');
      console.log('  testSuite.assertFalse(v) → expect(v).to.be.false');
      console.log('  testSuite.test("name", () => {...}) → it("name", function() {...})');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { convertTestFile };
