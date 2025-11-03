/**
 * Isolated Test Runner for Dialogue System
 * 
 * Run this script independently to test DialogueEvent without interfering
 * with other test suites that may be running.
 * 
 * Usage:
 *   node test/unit/dialogue/run-dialogue-tests.js
 *   
 * Or with npm:
 *   npm run test:dialogue
 */

const Mocha = require('mocha');
const path = require('path');

// Create isolated Mocha instance
const mocha = new Mocha({
  timeout: 10000,
  reporter: 'spec',
  color: true,
  slow: 200
});

// Add only dialogue tests
mocha.addFile(path.join(__dirname, 'DialogueEvent.test.js'));

console.log('\n🎭 Running Dialogue System Tests (Isolated)\n');
console.log('═══════════════════════════════════════════\n');

// Run the tests
mocha.run((failures) => {
  if (failures) {
    console.error(`\n❌ ${failures} test(s) failed\n`);
    process.exit(1);
  } else {
    console.log('\n✅ All dialogue tests passed!\n');
    console.log('Next Steps:');
    console.log('  1. Review test output above');
    console.log('  2. Implement DialogueEvent class in Classes/events/DialogueEvent.js');
    console.log('  3. Run tests again to verify implementation');
    console.log('  4. Add integration tests with actual DraggablePanel\n');
    process.exit(0);
  }
});
