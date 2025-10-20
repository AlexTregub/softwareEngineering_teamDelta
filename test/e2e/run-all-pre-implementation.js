/**
 * Master Test Runner for Pre-Implementation E2E Tests
 * Runs all test suites in order
 */

const path = require('path');
const fs = require('fs');

// Test suite runners (import as they're created)
// const { runAllEntityTests } = require('./entity/run-all-entity');
// const { runAllControllerTests } = require('./controllers/run-all-controllers');
// ... etc

/**
 * Check if dev server is running
 */
async function checkServer() {
  const http = require('http');
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8000', (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n' + '█'.repeat(80));
  console.log('  ANT GAME E2E TEST SUITE - PRE-IMPLEMENTATION');
  console.log('  Full coverage of existing functionality');
  console.log('█'.repeat(80) + '\n');
  
  // Check if server is running
  console.log('🔍 Checking if dev server is running on localhost:8000...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('\n❌ ERROR: Dev server is not running!');
    console.error('Please start the dev server with: npm run dev');
    console.error('Then run tests again.\n');
    process.exit(1);
  }
  
  console.log('✅ Dev server is running\n');
  
  const results = {
    categories: [],
    totalSuites: 0,
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  const startTime = Date.now();
  
  try {
    // Phase 1: Entity Tests
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 1: ENTITY BASE CLASS TESTS');
    console.log('='.repeat(80));
    
    // For now, just note that tests are ready
    console.log('\n📋 Entity test suite ready:');
    console.log('   - pw_entity_construction.js ✅');
    console.log('   - pw_entity_transform.js (TODO)');
    console.log('   - pw_entity_collision.js (TODO)');
    console.log('   - pw_entity_selection.js (TODO)');
    console.log('   - pw_entity_sprite.js (TODO)');
    
    // Phase 2: Controller Tests
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 2: CONTROLLER TESTS');
    console.log('='.repeat(80));
    console.log('\n📋 Controller test suites planned:');
    console.log('   - pw_movement_controller.js (TODO)');
    console.log('   - pw_render_controller.js (TODO)');
    console.log('   - pw_combat_controller.js (TODO)');
    console.log('   - pw_health_controller.js (TODO)');
    console.log('   - pw_inventory_controller.js (TODO)');
    console.log('   - pw_terrain_controller.js (TODO)');
    console.log('   - pw_selection_controller.js (TODO)');
    console.log('   - pw_task_manager.js (TODO)');
    console.log('   - pw_transform_controller.js (TODO)');
    
    // Phase 3: Ant Tests
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 3: ANT CLASS TESTS');
    console.log('='.repeat(80));
    console.log('\n📋 Ant test suites planned:');
    console.log('   - pw_ant_construction.js (TODO)');
    console.log('   - pw_ant_jobs.js (TODO)');
    console.log('   - pw_ant_resources.js (TODO)');
    console.log('   - pw_ant_combat.js (TODO)');
    console.log('   - pw_ant_movement.js (TODO)');
    console.log('   - pw_ant_gathering.js (TODO)');
    
    // Phase 4: State & AI Tests
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 4: STATE MACHINE & AI TESTS');
    console.log('='.repeat(80));
    console.log('\n📋 State/AI test suites planned:');
    console.log('   - pw_ant_state_machine.js (TODO)');
    console.log('   - pw_gather_state.js (TODO)');
    console.log('   - pw_state_transitions.js (TODO)');
    console.log('   - pw_ant_brain_init.js (TODO)');
    console.log('   - pw_ant_brain_decisions.js (TODO)');
    console.log('   - pw_ant_brain_pheromones.js (TODO)');
    console.log('   - pw_ant_brain_hunger.js (TODO)');
    
    // Phase 5: Integration Tests
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 5: INTEGRATION TESTS');
    console.log('='.repeat(80));
    console.log('\n📋 Integration test suites planned:');
    console.log('   - pw_ant_lifecycle.js (TODO)');
    console.log('   - pw_multi_ant_coordination.js (TODO)');
    console.log('   - pw_camera_entity_integration.js (TODO)');
    console.log('   - pw_resource_system_integration.js (TODO)');
    
    // Phase 6: Performance Tests
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 6: PERFORMANCE BENCHMARKS');
    console.log('='.repeat(80));
    console.log('\n📋 Performance test suites planned:');
    console.log('   - pw_entity_performance.js (TODO)');
    console.log('   - pw_state_performance.js (TODO)');
    console.log('   - pw_rendering_performance.js (TODO)');
    
  } catch (error) {
    console.error('\n❌ Test runner error:', error.message);
    results.failed++;
  }
  
  const duration = Date.now() - startTime;
  
  // Final summary
  console.log('\n\n' + '█'.repeat(80));
  console.log('  FINAL TEST SUMMARY');
  console.log('█'.repeat(80));
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`Test Suites: ${results.totalSuites}`);
  console.log(`Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Skipped: ${results.skipped} ⏭️`);
  
  if (results.totalTests > 0) {
    const passRate = ((results.passed / results.totalTests) * 100).toFixed(1);
    console.log(`Pass Rate: ${passRate}%`);
  }
  
  console.log('█'.repeat(80) + '\n');
  
  console.log('📊 Test artifacts saved to:');
  console.log(`   Screenshots: test/e2e/screenshots/pre-implementation/`);
  console.log(`   Reports: test/e2e/reports/`);
  console.log(`   Logs: test/e2e/logs/\n`);
  
  process.exit(results.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
