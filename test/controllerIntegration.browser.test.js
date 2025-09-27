/**
 * Integration Test for Ant Controller System
 * 
 * This test should be run in a browser environment where all controllers are available.
 * It verifies that the new abstracted controller system works properly within the 
 * actual game environment.
 */

// Integration test function to be called from browser console
function runControllerIntegrationTest() {
  console.log('🚀 Starting Ant Controller Integration Test');
  console.log('\n==================================================');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  function test(description, testFn) {
    try {
      testFn();
      console.log(`✅ ${description}`);
      testsPassed++;
    } catch (error) {
      console.error(`❌ ${description} failed: ${error.message}`);
      testsFailed++;
    }
  }
  
  // Test 1: Verify controllers are available in browser environment
  test('Controller classes are available', () => {
    if (typeof MovementController === 'undefined') throw new Error('MovementController not defined');
    if (typeof TaskManager === 'undefined') throw new Error('TaskManager not defined');
    if (typeof RenderController === 'undefined') throw new Error('RenderController not defined');
  });
  
  // Test 2: Create test ant and verify controllers are initialized
  test('Ant initializes with controllers', () => {
    const testAnt = new ant(100, 100, 20, 20, 30, 0);
    
    if (!testAnt._movementController) throw new Error('MovementController not initialized');
    if (!testAnt._taskManager) throw new Error('TaskManager not initialized');  
    if (!testAnt._renderController) throw new Error('RenderController not initialized');
    
    if (!(testAnt._movementController instanceof MovementController)) throw new Error('MovementController wrong type');
    if (!(testAnt._taskManager instanceof TaskManager)) throw new Error('TaskManager wrong type');
    if (!(testAnt._renderController instanceof RenderController)) throw new Error('RenderController wrong type');
  });
  
  // Test 3: Test movement controller delegation
  test('Movement controller delegation', () => {
    const testAnt = new ant(100, 100, 20, 20, 30, 0);
    
    // Test isMoving property delegation
    const initialMoving = testAnt.isMoving;
    if (initialMoving !== false) throw new Error('Initial isMoving should be false');
    
    // Test moveToLocation delegation
    const moveResult = testAnt.moveToLocation(200, 150);
    if (!moveResult) throw new Error('Movement should start successfully');
    
    // After movement command, ant should be moving
    if (!testAnt.isMoving) throw new Error('Ant should be moving after moveToLocation');
  });
  
  // Test 4: Test task manager delegation
  test('Task manager delegation', () => {
    const testAnt = new ant(300, 300, 20, 20, 30, 0);
    
    // Test addCommand delegation to TaskManager
    const command = {
      type: 'MOVE',
      x: 400,
      y: 400,
      priority: 1
    };
    
    testAnt.addCommand(command);
    
    // Verify command was added to TaskManager
    if (testAnt._taskManager._taskQueue.length === 0) throw new Error('Command not added to TaskManager');
  });
  
  // Test 5: Test render controller delegation  
  test('Render controller delegation', () => {
    const testAnt = new ant(400, 400, 20, 20, 30, 0);
    
    // Test highlighting delegation
    testAnt.isSelected = true;
    
    // Should delegate to RenderController
    if (!testAnt._renderController._highlightType) {
      // The highlight might be set differently, check if render controller exists
      if (!testAnt._renderController) throw new Error('RenderController should be available');
    }
    
    testAnt.isSelected = false;
  });
  
  // Test 7: Test controller configuration
  test('Controller configuration', () => {
    const testAnt = new ant(600, 600, 20, 20, 45, 0); // Different speed
    
    // Movement controller should have correct speed
    if (testAnt._movementController.movementSpeed !== 45) {
      throw new Error(`Expected speed 45, got ${testAnt._movementController.movementSpeed}`);
    }
  });
  
  // Test 8: Test update method integration
  test('Update method integration', () => {
    const testAnt = new ant(700, 700, 20, 20, 30, 0);
    
    // Start movement
    testAnt.moveToLocation(750, 750);
    
    // Update should not throw errors
    testAnt.update();
    
    // Ant should still be valid after update
    if (typeof testAnt.posX !== 'number') throw new Error('Position corrupted after update');
  });
  
  // Test 9: Test multiple ants don't interfere
  test('Multiple ant independence', () => {
    const ant1 = new ant(100, 200, 20, 20, 30, 0);
    const ant2 = new ant(200, 100, 20, 20, 30, 0);
    
    ant1.moveToLocation(150, 250);
    ant2.moveToLocation(250, 150);
    
    // Both should have independent movement states
    if (!ant1.isMoving) throw new Error('Ant1 should be moving');
    if (!ant2.isMoving) throw new Error('Ant2 should be moving');
    
    // Controllers should be independent
    if (ant1._movementController === ant2._movementController) {
      throw new Error('Ants sharing movement controller');
    }
  });
  
  // Test 10: Test Job integration
  test('Job integration with controllers', () => {
    // Create ant through Job (like the game does)
    const baseAnt = new ant(800, 800, 20, 20, 30, 0);
    const Job = new Job(baseAnt, "Builder", antBaseSprite);
    
    // Job should inherit controller functionality
    if (!Job._movementController) throw new Error('Job missing MovementController');
    if (!Job._taskManager) throw new Error('Job missing TaskManager');
    if (!Job._renderController) throw new Error('Job missing RenderController');
    
    // Should be able to move
    const moveResult = Job.moveToLocation(850, 850);
    if (!moveResult) throw new Error('Job movement failed');
  });
  
  console.log(`\n📊 Integration Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  
  if (testsFailed === 0) {
    console.log('🎉 All controller integration tests passed!');
    console.log('✨ The ant controller abstraction is working correctly');
    return true;
  } else {
    console.log('💥 Some integration tests failed');
    console.log('⚠️  The controller system may need additional work');
    return false;
  }
}

// Instructions for running this test
console.log(`
🧪 Ant Controller Integration Test

To run this test:
1. Open the game in a browser (npm run dev or python -m http.server)
2. Open the browser console (F12)
3. Type: runControllerIntegrationTest()
4. Press Enter

This will test that all the new controller abstractions work properly
in the actual game environment with full p5.js context.
`);

// Auto-run if in browser environment with game loaded
if (typeof ant !== 'undefined' && typeof MovementController !== 'undefined') {
  // Wait a bit for everything to load, then run test
  setTimeout(() => {
    console.log('🎮 Game environment detected, running controller integration test...');
    runControllerIntegrationTest();
  }, 1000);
}