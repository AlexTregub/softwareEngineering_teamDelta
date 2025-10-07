// Simple test harness compatible with other tests
const testSuite = { tests: [], passed: 0, failed: 0, test(name, fn) { this.tests.push({ name, fn }); },
  assertEqual(a,b,msg='') { if (a !== b) throw new Error(`Expected ${b}, got ${a}. ${msg}`); },
  run() { console.log('Running Button style tests...'); for (const t of this.tests) { try { t.fn(); console.log('✅', t.name); this.passed++; } catch (e) { console.log('❌', t.name); console.log('   ', e.message); this.failed++; } } console.log(`Results: ${this.passed} passed, ${this.failed} failed`); if (this.failed) process.exit(1); } };

// Provide a minimal CollisionBox2D stub used by Button constructor in tests
global.CollisionBox2D = class {
  constructor(x=0,y=0,w=100,h=30){ this.x = x; this.y = y; this.width = w; this.height = h; }
  contains(mx,my){ return mx >= this.x && my >= this.y && mx <= this.x + this.width && my <= this.y + this.height; }
  getCenter(){ return { x: this.x + this.width/2, y: this.y + this.height/2 }; }
};

const Button = require('../Classes/systems/Button');

testSuite.test('Button uses provided background/hover/text/border colors', () => {
  const b = new Button(0,0,100,30,'Test',{ backgroundColor: '#F44336', hoverColor: '#D32F2F', textColor: 'white', borderColor: '#B71C1C'});
  testSuite.assertEqual(b.backgroundColor, '#F44336');
  testSuite.assertEqual(b.hoverColor, '#D32F2F');
  testSuite.assertEqual(b.textColor, 'white');
  testSuite.assertEqual(b.borderColor, '#B71C1C');
});

// Register with global test runner and run conditionally
if (typeof globalThis !== 'undefined' && globalThis.registerTest) {
  globalThis.registerTest('Button Style Tests', () => {
    testSuite.run();
  });
}

// Auto-run if tests are enabled
if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests && globalThis.shouldRunTests()) {
  console.log('🧪 Running Button Style tests...');
  testSuite.run();
} else if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests) {
  console.log('🧪 Button Style tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
} else {
  // Fallback: run tests if no global test runner
  testSuite.run();
}
