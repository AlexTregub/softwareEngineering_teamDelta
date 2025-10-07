/**
 * Tests VerticalButtonList header sizing and headerTop calculation
 */

const testSuite = {
  tests: [], passed: 0, failed: 0,
  test(name, fn) { this.tests.push({ name, fn }); },
  assertEqual(a,b,msg='') { if (a !== b) throw new Error(`Expected ${b}, got ${a}. ${msg}`); },
  assertTrue(v,msg='') { if (!v) throw new Error(`Assertion false: ${msg}`); },
  run() { console.log('Running VerticalButtonList header tests...'); for (const t of this.tests) { try { t.fn(); console.log('✅', t.name); this.passed++; } catch (e) { console.log('❌', t.name); console.log('   ', e.message); this.failed++; } } console.log(`Results: ${this.passed} passed, ${this.failed} failed`); if (this.failed) process.exit(1); }
};

const { setupVerticalEnvironment } = require('./testHelpers');
// set up stubs before loading module
const env = setupVerticalEnvironment({ imgWidth: 400, imgHeight: 200 });
const VerticalButtonList = require('../Classes/systems/ui/verticalButtonList.js');

// create a fake image with width/height
const fakeImg = { width: 400, height: 200 };

testSuite.test('Header size respects headerMaxWidth and headerScale', () => {
  const vb = new VerticalButtonList(400, 200, { headerImg: fakeImg, headerScale: 0.5, headerMaxWidth: 150 });
  const layout = vb.buildFromConfigs([]);
  // header should be present
  testSuite.assertTrue(layout.header !== null, 'header should not be null');
  testSuite.assertEqual(layout.header.w, 150, 'header width should be capped by headerMaxWidth');
  // aspect ratio 200/400 = 0.5 => height should be 75
  testSuite.assertEqual(layout.header.h, 75);
});

testSuite.test('headerTop positions header above groups', () => {
  const configs = [ { x:0,y:0,w:100,h:50,text:'A' } ];
  const vb = new VerticalButtonList(400, 300, { headerImg: fakeImg, headerMaxWidth: 200 });
  const layout = vb.buildFromConfigs(configs);
  // headerTop should be a finite number
  testSuite.assertTrue(Number.isFinite(layout.headerTop));
});

// Register with global test runner and run conditionally
if (typeof globalThis !== 'undefined' && globalThis.registerTest) {
  globalThis.registerTest('VerticalButtonList Header Tests', () => {
    testSuite.run();
  });
}

// Auto-run if tests are enabled
if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests && globalThis.shouldRunTests()) {
  console.log('🧪 Running VerticalButtonList header tests...');
  testSuite.run();
} else if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests) {
  console.log('🧪 VerticalButtonList Header tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
} else {
  // Fallback: run tests if no global test runner
  testSuite.run();
}

// cleanup
env.teardown();
