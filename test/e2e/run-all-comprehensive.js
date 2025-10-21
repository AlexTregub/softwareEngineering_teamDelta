/**
 * Master Test Runner - Executes All 47 Test Suites
 * Generates comprehensive report with statistics and bug findings
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// All test suites organized by category
const testSuites = {
  entity: [
    { id: 1, name: 'Entity Construction', file: 'test/e2e/entity/pw_entity_construction.js', tests: 10 },
    { id: 2, name: 'Entity Transform', file: 'test/e2e/entity/pw_entity_transform.js', tests: 8 },
    { id: 3, name: 'Entity Collision', file: 'test/e2e/entity/pw_entity_collision.js', tests: 5 },
    { id: 4, name: 'Entity Selection', file: 'test/e2e/entity/pw_entity_selection.js', tests: 6 },
    { id: 5, name: 'Entity Sprite', file: 'test/e2e/entity/pw_entity_sprite.js', tests: 6 }
  ],
  controllers: [
    { id: 6, name: 'MovementController', file: 'test/e2e/controllers/pw_movement_controller.js', tests: 6 },
    { id: 7, name: 'RenderController', file: 'test/e2e/controllers/pw_render_controller.js', tests: 8 },
    { id: 8, name: 'CombatController', file: 'test/e2e/controllers/pw_combat_controller.js', tests: 10 },
    { id: 9, name: 'HealthController', file: 'test/e2e/controllers/pw_health_controller.js', tests: 10 },
    { id: 10, name: 'InventoryController', file: 'test/e2e/controllers/pw_inventory_controller.js', tests: 10 },
    { id: 11, name: 'TerrainController', file: 'test/e2e/controllers/pw_terrain_controller.js', tests: 8 },
    { id: 12, name: 'SelectionController', file: 'test/e2e/controllers/pw_selection_controller.js', tests: 8 },
    { id: 13, name: 'TaskManager', file: 'test/e2e/controllers/pw_task_manager.js', tests: 10 },
    { id: 14, name: 'TransformController', file: 'test/e2e/controllers/pw_transform_controller.js', tests: 8 }
  ],
  ants: [
    { id: 15, name: 'Ant Construction', file: 'test/e2e/ants/pw_ant_construction.js', tests: 10 },
    { id: 16, name: 'Ant Job System', file: 'test/e2e/ants/pw_ant_jobs.js', tests: 10 },
    { id: 17, name: 'Ant Resources', file: 'test/e2e/ants/pw_ant_resources.js', tests: 10 },
    { id: 18, name: 'Ant Combat', file: 'test/e2e/ants/pw_ant_combat.js', tests: 10 },
    { id: 19, name: 'Ant Movement', file: 'test/e2e/ants/pw_ant_movement.js', tests: 10 },
    { id: 20, name: 'Ant Gathering', file: 'test/e2e/ants/pw_ant_gathering.js', tests: 10 }
  ],
  queen: [
    { id: 21, name: 'Queen Construction', file: 'test/e2e/queen/pw_queen_construction.js', tests: 10 },
    { id: 22, name: 'Queen Abilities', file: 'test/e2e/queen/pw_queen_abilities.js', tests: 10 }
  ],
  state: [
    { id: 23, name: 'AntStateMachine', file: 'test/e2e/state/pw_ant_state_machine.js', tests: 12 },
    { id: 24, name: 'GatherState', file: 'test/e2e/state/pw_gather_state.js', tests: 12 },
    { id: 25, name: 'State Transitions', file: 'test/e2e/state/pw_state_transitions.js', tests: 10 }
  ],
  brain: [
    { id: 26, name: 'AntBrain Init', file: 'test/e2e/brain/pw_ant_brain_init.js', tests: 8 },
    { id: 27, name: 'AntBrain Decisions', file: 'test/e2e/brain/pw_ant_brain_decisions.js', tests: 10 },
    { id: 28, name: 'AntBrain Pheromones', file: 'test/e2e/brain/pw_ant_brain_pheromones.js', tests: 10 },
    { id: 29, name: 'AntBrain Hunger', file: 'test/e2e/brain/pw_ant_brain_hunger.js', tests: 10 }
  ],
  resources: [
    { id: 30, name: 'Resource Spawning', file: 'test/e2e/resources/pw_resource_spawning.js', tests: 10 },
    { id: 31, name: 'Resource Collection', file: 'test/e2e/resources/pw_resource_collection.js', tests: 10 },
    { id: 32, name: 'Resource Dropoff', file: 'test/e2e/resources/pw_resource_dropoff.js', tests: 10 }
  ],
  spatial: [
    { id: 33, name: 'Spatial Grid Registration', file: 'test/e2e/spatial/pw_spatial_grid_registration.js', tests: 10 },
    { id: 34, name: 'Spatial Grid Queries', file: 'test/e2e/spatial/pw_spatial_grid_queries.js', tests: 10 }
  ],
  camera: [
    { id: 35, name: 'Camera Movement', file: 'test/e2e/camera/pw_camera_movement.js', tests: 10 },
    { id: 36, name: 'Camera Zoom', file: 'test/e2e/camera/pw_camera_zoom.js', tests: 10 },
    { id: 37, name: 'Camera Transforms', file: 'test/e2e/camera/pw_camera_transforms.js', tests: 10 }
  ],
  ui: [
    { id: 38, name: 'Selection Box', file: 'test/e2e/ui/pw_selection_box.js', tests: 10 },
    { id: 39, name: 'Draggable Panels', file: 'test/e2e/ui/pw_draggable_panels.js', tests: 10 },
    { id: 40, name: 'UI Buttons', file: 'test/e2e/ui/pw_ui_buttons.js', tests: 10 }
  ],
  integration: [
    { id: 41, name: 'Ant Lifecycle', file: 'test/e2e/integration/pw_ant_lifecycle.js', tests: 10 },
    { id: 42, name: 'Multi-Ant Coordination', file: 'test/e2e/integration/pw_multi_ant_coordination.js', tests: 10 },
    { id: 43, name: 'Camera-Entity Integration', file: 'test/e2e/integration/pw_camera_entity_integration.js', tests: 10 },
    { id: 44, name: 'Resource System Integration', file: 'test/e2e/integration/pw_resource_system_integration.js', tests: 10 }
  ],
  performance: [
    { id: 45, name: 'Entity Performance', file: 'test/e2e/performance/pw_entity_performance.js', tests: 10 },
    { id: 46, name: 'State Performance', file: 'test/e2e/performance/pw_state_performance.js', tests: 10 },
    { id: 47, name: 'Rendering Performance', file: 'test/e2e/performance/pw_rendering_performance.js', tests: 10 }
  ]
};

const results = {
  categories: {},
  totalTests: 0,
  totalPassed: 0,
  totalFailed: 0,
  duration: 0,
  startTime: null,
  endTime: null
};

function runTestSuite(file) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const proc = spawn('node', [file], { shell: true });
    
    let output = '';
    let passed = 0;
    let failed = 0;
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    proc.stderr.on('data', (data) => {
      output += data.toString();
      process.stderr.write(data);
    });
    
    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      // Parse results from output
      const passMatch = output.match(/Passed:\s*(\d+)/);
      const failMatch = output.match(/Failed:\s*(\d+)/);
      
      if (passMatch) passed = parseInt(passMatch[1]);
      if (failMatch) failed = parseInt(failMatch[1]);
      
      resolve({
        exitCode: code,
        duration,
        passed,
        failed,
        output
      });
    });
  });
}

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('MASTER TEST RUNNER - ALL 47 TEST SUITES');
  console.log('='.repeat(80) + '\n');
  
  results.startTime = new Date();
  
  for (const [category, suites] of Object.entries(testSuites)) {
    console.log(`\n${'#'.repeat(80)}`);
    console.log(`CATEGORY: ${category.toUpperCase()}`);
    console.log(`${'#'.repeat(80)}\n`);
    
    results.categories[category] = {
      passed: 0,
      failed: 0,
      duration: 0,
      suites: []
    };
    
    for (const suite of suites) {
      console.log(`\nRunning Suite ${suite.id}: ${suite.name}...`);
      const result = await runTestSuite(suite.file);
      
      results.categories[category].passed += result.passed;
      results.categories[category].failed += result.failed;
      results.categories[category].duration += result.duration;
      results.categories[category].suites.push({
        id: suite.id,
        name: suite.name,
        passed: result.passed,
        failed: result.failed,
        duration: result.duration,
        exitCode: result.exitCode
      });
      
      results.totalPassed += result.passed;
      results.totalFailed += result.failed;
      results.totalTests += result.passed + result.failed;
      results.duration += result.duration;
      
      console.log(`Suite ${suite.id} completed: ${result.passed} passed, ${result.failed} failed`);
    }
  }
  
  results.endTime = new Date();
  generateReport();
}

function generateReport() {
  console.log('\n\n' + '='.repeat(80));
  console.log('COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(80) + '\n');
  
  console.log(`Start Time: ${results.startTime.toLocaleString()}`);
  console.log(`End Time: ${results.endTime.toLocaleString()}`);
  console.log(`Total Duration: ${(results.duration / 1000 / 60).toFixed(2)} minutes\n`);
  
  console.log('-'.repeat(80));
  console.log('OVERALL STATISTICS');
  console.log('-'.repeat(80));
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.totalPassed} ✅`);
  console.log(`Failed: ${results.totalFailed} ❌`);
  const passRate = results.totalTests > 0 ? ((results.totalPassed / results.totalTests) * 100).toFixed(1) : '0.0';
  console.log(`Pass Rate: ${passRate}%\n`);
  
  console.log('-'.repeat(80));
  console.log('CATEGORY BREAKDOWN');
  console.log('-'.repeat(80));
  
  for (const [category, data] of Object.entries(results.categories)) {
    const total = data.passed + data.failed;
    const rate = total > 0 ? ((data.passed / total) * 100).toFixed(1) : '0.0';
    console.log(`\n${category.toUpperCase()}: ${data.passed}/${total} (${rate}%)`);
    console.log(`  Duration: ${(data.duration / 1000).toFixed(1)}s`);
    
    data.suites.forEach(suite => {
      const suiteTotal = suite.passed + suite.failed;
      const suiteRate = suiteTotal > 0 ? ((suite.passed / suiteTotal) * 100).toFixed(1) : '0.0';
      const status = suite.exitCode === 0 ? '✅' : '❌';
      console.log(`  ${status} Suite ${suite.id}: ${suite.name} - ${suite.passed}/${suiteTotal} (${suiteRate}%)`);
    });
  }
  
  // Save detailed report to file
  const reportPath = path.join(__dirname, 'TEST_RESULTS_COMPREHENSIVE.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n\n📊 Detailed results saved to: ${reportPath}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST RUN COMPLETE');
  console.log('='.repeat(80) + '\n');
  
  process.exit(results.totalFailed > 0 ? 1 : 0);
}

// Run all tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
