/**
 * Basic tests for VerticalButtonList layout and debug metadata.
 */

// Minimal test harness (same style used by other tests)
const testSuite = {
  tests: [], passed: 0, failed: 0,
  test(name, fn) { this.tests.push({ name, fn }); },
  assertEqual(a,b,msg='') { if (a !== b) throw new Error(`Expected ${b}, got ${a}. ${msg}`); },
  assertTrue(v,msg='') { if (!v) throw new Error(`Assertion false: ${msg}`); },
  run() { console.log('Running VerticalButtonList tests...'); for (const t of this.tests) { try { t.fn(); console.log('✅', t.name); this.passed++; } catch (e) { console.log('❌', t.name); console.log('   ', e.message); this.failed++; } } console.log(`Results: ${this.passed} passed, ${this.failed} failed`); if (this.failed) process.exit(1); }
};

const { setupVerticalEnvironment } = require('./testHelpers');
// set up stubs before loading the module
const env = setupVerticalEnvironment({ imgWidth: 64, imgHeight: 32 });
const VerticalButtonList = require('../../src/core/systems/ui/components/verticalButtonList.js');

testSuite.test('Groups configs by y and returns debug arrays', () => {
  const configs = [
    { x:0, y:-50, w:100, h:40, text: 'A' },
    { x:110, y:-50, w:100, h:40, text: 'B' },
    { x:0, y:10, w:200, h:50, text: 'C' }
  ];

  const vb = new VerticalButtonList(400, 300, { spacing: 8, maxWidth: 300, headerImg: null });
  const layout = vb.buildFromConfigs(configs);

  testSuite.assertTrue(Array.isArray(layout.buttons), 'buttons should be array');
  testSuite.assertEqual(layout.debugRects.length, 3, 'should have debug rect for each config');
  testSuite.assertEqual(layout.groupRects.length, 2, 'should have two group rects (two rows)');
  // centers should correspond to each button
  testSuite.assertEqual(layout.centers.length, 3);
  // ensure header is null in this test
  testSuite.assertEqual(layout.header, null);
});

// Register with global test runner and run conditionally
if (typeof globalThis !== 'undefined' && globalThis.registerTest) {
  globalThis.registerTest('VerticalButtonList Tests', () => {
    testSuite.run();
  });
}

// Auto-run if tests are enabled
if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests && globalThis.shouldRunTests()) {
  console.log('🧪 Running VerticalButtonList tests...');
  testSuite.run();
} else if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests) {
  console.log('🧪 VerticalButtonList tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
} else {
  // Fallback: run tests if no global test runner
  testSuite.run();
}

// cleanup
env.teardown();
