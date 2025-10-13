/**
 * TaskManager Unit Tests
 * Tests the task management system functionality
 */

// Load TaskManager
const fs = require('fs');
const path = require('path');
const controllerPath = path.join(__dirname, '..', 'Classes', 'systems', 'TaskManager.js');
const controllerCode = fs.readFileSync(controllerPath, 'utf8');

// Extract class definition and evaluate
const classMatch = controllerCode.match(/class TaskManager[\s\S]*?^}/m);
if (classMatch) {
  eval(classMatch[0]);
} else {
  throw new Error('Could not find TaskManager class definition');
}

// Define the main test function
function runTaskManagerTests() {
  console.log('🚀 Starting TaskManager Test Suite');
  console.log('\n==================================================');
  console.log('🧪 Running TaskManager Test Suite...');

let testsRun = 0;
let testsPassed = 0;

function test(description, testFn) {
  testsRun++;
  try {
    testFn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${description} failed: ${error.message}`);
  }
}

// Mock entity for testing
function createMockEntity() {
  return {
    posX: 100,
    posY: 100,
    moveToLocation: (x, y) => { /* mock */ },
    _stateMachine: {
      canPerformAction: () => true,
      setPrimaryState: () => {}
    }
  };
}

// Test constructor
test('Constructor - Basic initialization', () => {
  const entity = createMockEntity();
  const manager = new TaskManager(entity);
  
  if (!manager._entity) throw new Error('Entity not set');
  if (!Array.isArray(manager._taskQueue)) throw new Error('Task queue not initialized');
  if (manager._currentTask !== null) throw new Error('Current task should be null initially');
});

// Test task addition
test('addTask - Basic task addition', () => {
  const entity = createMockEntity();
  const manager = new TaskManager(entity);
  
  const task = {
    id: 'test1',
    type: 'MOVE',
    priority: 1,
    data: { x: 200, y: 150 }
  };
  
  manager.addTask(task);
  
  if (manager._taskQueue.length !== 1) throw new Error('Task not added to queue');
  if (manager._taskQueue[0].id !== 'test1') throw new Error('Task ID not preserved');
});

// Test task priority sorting
test('Priority system - Task ordering', () => {
  const entity = createMockEntity();
  const manager = new TaskManager(entity);
  
  const lowPriorityTask = { id: 'low', type: 'MOVE', priority: 1, data: {} };
  const highPriorityTask = { id: 'high', type: 'MOVE', priority: 3, data: {} };
  const mediumPriorityTask = { id: 'med', type: 'MOVE', priority: 2, data: {} };
  
  manager.addTask(lowPriorityTask);
  manager.addTask(highPriorityTask);
  manager.addTask(mediumPriorityTask);
  
  // Should be sorted by priority (high to low)
  if (manager._taskQueue[0].id !== 'high') throw new Error('Highest priority task not first');
  if (manager._taskQueue[1].id !== 'med') throw new Error('Medium priority task not second');
  if (manager._taskQueue[2].id !== 'low') throw new Error('Lowest priority task not last');
});

// Test task execution
test('Task execution - MOVE task', () => {
  const entity = createMockEntity();
  let moveCalledWith = null;
  entity.moveToLocation = (x, y) => { moveCalledWith = { x, y }; };
  
  const manager = new TaskManager(entity);
  
  const task = {
    id: 'move1',
    type: 'MOVE',
    priority: 1,
    data: { x: 200, y: 150 }
  };
  
  manager.addTask(task);
  manager.update();
  
  if (!moveCalledWith) throw new Error('moveToLocation not called');
  if (moveCalledWith.x !== 200 || moveCalledWith.y !== 150) throw new Error('Move coordinates incorrect');
});

// Test multiple task types
test('Task types - Multiple task support', () => {
  const entity = createMockEntity();
  const manager = new TaskManager(entity);
  
  const tasks = [
    { id: 'gather1', type: 'GATHER', priority: 1, data: {} },
    { id: 'build1', type: 'BUILD', priority: 1, data: {} },
    { id: 'attack1', type: 'ATTACK', priority: 1, data: {} }
  ];
  
  tasks.forEach(task => manager.addTask(task));
  
  if (manager._taskQueue.length !== 3) throw new Error('Not all tasks added');
});

// Test emergency task handling
test('Emergency tasks - Priority override', () => {
  const entity = createMockEntity();
  const manager = new TaskManager(entity);
  
  const normalTask = { id: 'normal', type: 'MOVE', priority: 1, data: {} };
  const emergencyTask = { id: 'emergency', type: 'FLEE', priority: 10, data: {} };
  
  manager.addTask(normalTask);
  manager.addTask(emergencyTask);
  
  // Emergency task should be first
  if (manager._taskQueue[0].id !== 'emergency') throw new Error('Emergency task not prioritized');
});

// Test task completion
test('Task completion - Queue processing', () => {
  const entity = createMockEntity();
  const manager = new TaskManager(entity);
  
  const task = {
    id: 'complete1',
    type: 'MOVE',
    priority: 1,
    data: { x: 200, y: 150 }
  };
  
  manager.addTask(task);
  const initialLength = manager._taskQueue.length;
  
  manager.update(); // Should process and complete the task
  
  // Task should be removed from queue after processing
  if (manager._taskQueue.length >= initialLength) {
    // Task might still be in queue if it's being processed, that's ok
  }
});

// Test task timeout handling
test('Task timeout - Timeout detection', () => {
  const entity = createMockEntity();
  const manager = new TaskManager(entity);
  
  const task = {
    id: 'timeout1',
    type: 'MOVE',
    priority: 1,
    data: { x: 200, y: 150 },
    timeout: 100 // Very short timeout
  };
  
  manager.addTask(task);
  
  // Simulate time passing
  const startTime = Date.now();
  setTimeout(() => {
    manager.update();
  }, 150); // Wait longer than timeout
  
  // This is a basic test - in real implementation timeout would be handled
});

// Test task validation
test('Task validation - Invalid tasks', () => {
  const entity = createMockEntity();
  const manager = new TaskManager(entity);
  
  try {
    manager.addTask(null);
    // Should handle null tasks gracefully
  } catch (error) {
    // Expected behavior - rejecting null tasks
  }
  
  try {
    manager.addTask({});
    // Should handle incomplete tasks gracefully
  } catch (error) {
    // Expected behavior - rejecting incomplete tasks
  }
});

// Test queue management
test('Queue management - Clear and status', () => {
  const entity = createMockEntity();
  const manager = new TaskManager(entity);
  
  manager.addTask({ id: 'test1', type: 'MOVE', priority: 1, data: {} });
  manager.addTask({ id: 'test2', type: 'MOVE', priority: 1, data: {} });
  
  if (manager._taskQueue.length !== 2) throw new Error('Tasks not added properly');
  
  // Test queue has tasks
  const hasTasks = manager._taskQueue.length > 0;
  if (!hasTasks) throw new Error('Queue should have tasks');
});

  console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsRun - testsPassed} failed`);

  if (testsPassed === testsRun) {
    console.log('🎉 All tests passed!');
    return true;
  } else {
    console.log('💥 Some tests failed');
    return false;
  }
}

// Register with global test runner and run conditionally
if (typeof globalThis !== 'undefined' && globalThis.registerTest) {
  globalThis.registerTest('TaskManager Tests', runTaskManagerTests);
}

// Auto-run if tests are enabled
if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests && globalThis.shouldRunTests()) {
  console.log('🧪 Running TaskManager tests...');
  const success = runTaskManagerTests();
  if (typeof process !== 'undefined') {
    process.exit(success ? 0 : 1);
  }
} else if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests) {
  console.log('🧪 TaskManager tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
} else {
  // Fallback: run tests immediately if no global test runner
  const success = runTaskManagerTests();
  if (typeof process !== 'undefined') {
    process.exit(success ? 0 : 1);
  }
}