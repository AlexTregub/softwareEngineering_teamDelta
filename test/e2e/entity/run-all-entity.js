/**
 * Entity Test Suite Runner
 * Runs all entity-related E2E tests
 */

const { runTestSuite: runConstruction } = require('./pw_entity_construction');
// Add more test suite imports here when created:
// const { runTestSuite: runTransform } = require('./pw_entity_transform');
// const { runTestSuite: runCollision } = require('./pw_entity_collision');
// const { runTestSuite: runSelection } = require('./pw_entity_selection');
// const { runTestSuite: runSprite } = require('./pw_entity_sprite');

async function runAllEntityTests() {
  console.log('\n' + '█'.repeat(70));
  console.log('  ENTITY TEST SUITE - ALL TESTS');
  console.log('█'.repeat(70) + '\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    suites: []
  };
  
  try {
    // Test Suite 1: Construction
    console.log('\n📦 Running Test Suite 1: Construction...\n');
    await runConstruction();
    results.suites.push({ name: 'Construction', passed: true });
    results.passed++;
    
    // Add more test suites here when created:
    // Test Suite 2: Transform
    // console.log('\n🔄 Running Test Suite 2: Transform...\n');
    // await runTransform();
    // results.suites.push({ name: 'Transform', passed: true });
    // results.passed++;
    
    // ... etc
    
  } catch (error) {
    console.error('Suite failed:', error.message);
    results.failed++;
  }
  
  results.total = results.passed + results.failed;
  
  // Print overall summary
  console.log('\n' + '█'.repeat(70));
  console.log('  OVERALL ENTITY TEST SUMMARY');
  console.log('█'.repeat(70));
  console.log(`Test Suites: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log('█'.repeat(70) + '\n');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  runAllEntityTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runAllEntityTests };
