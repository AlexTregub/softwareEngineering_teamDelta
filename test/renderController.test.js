/**
 * RenderController Unit Tests
 * Tests the rendering controller system functionality
 */

// Mock p5.js functions for Node.js environment
global.push = () => {};
global.pop = () => {};
global.translate = () => {};
global.rotate = () => {};
global.fill = () => {};
global.noFill = () => {};
global.stroke = () => {};
global.noStroke = () => {};
global.strokeWeight = () => {};
global.ellipse = () => {};
global.rect = () => {};
global.triangle = () => {};
global.text = () => {};

// Load RenderController
const fs = require('fs');
const path = require('path');
const controllerPath = path.join(__dirname, '..', 'Classes', 'systems', 'RenderController.js');
const controllerCode = fs.readFileSync(controllerPath, 'utf8');

// Extract class definition and evaluate
const classMatch = controllerCode.match(/class RenderController[\s\S]*?^}/m);
if (classMatch) {
  eval(classMatch[0]);
} else {
  throw new Error('Could not find RenderController class definition');
}

console.log('🚀 Starting RenderController Test Suite');
console.log('\n==================================================');
console.log('🧪 Running RenderController Test Suite...');

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
    size: 20,
    rotation: 0,
    _sprite: {
      render: () => {}
    },
    _stateMachine: {
      primaryState: "IDLE",
      combatModifier: null,
      terrainModifier: null
    }
  };
}

// Test constructor
test('Constructor - Basic initialization', () => {
  const entity = createMockEntity();
  const controller = new RenderController(entity);
  
  if (!controller._entity) throw new Error('Entity not set');
  if (controller._highlightType !== null) throw new Error('Highlight type should be null initially');
  if (!Array.isArray(controller._effects)) throw new Error('Effects array not initialized');
});

// Test highlighting system
test('Highlighting - Set and clear highlight', () => {
  const entity = createMockEntity();
  const controller = new RenderController(entity);
  
  // Set highlight
  controller.setHighlight('SELECTED');
  if (controller._highlightType !== 'SELECTED') throw new Error('Highlight type not set');
  
  // Clear highlight
  controller.clearHighlight();
  if (controller._highlightType !== null) throw new Error('Highlight type not cleared');
});

// Test highlight types
test('Highlight types - Valid highlight types', () => {
  const entity = createMockEntity();
  const controller = new RenderController(entity);
  
  const validTypes = ['SELECTED', 'HOVER', 'COMBAT', 'TARGET'];
  
  for (const type of validTypes) {
    controller.setHighlight(type);
    if (controller._highlightType !== type) throw new Error(`Highlight type ${type} not set correctly`);
  }
});

// Test effects system
test('Effects - Add and manage effects', () => {
  const entity = createMockEntity();
  const controller = new RenderController(entity);
  
  const effect = {
    id: 'test-effect',
    type: 'glow',
    duration: 1000,
    intensity: 0.5
  };
  
  controller.addEffect(effect);
  if (controller._effects.length !== 1) throw new Error('Effect not added');
  if (controller._effects[0].id !== 'test-effect') throw new Error('Effect ID not preserved');
});

// Test effect expiration
test('Effects - Effect expiration', () => {
  const entity = createMockEntity();
  const controller = new RenderController(entity);
  
  const shortEffect = {
    id: 'short-effect',
    type: 'flash',
    duration: 10, // Very short duration
    intensity: 1.0
  };
  
  controller.addEffect(shortEffect);
  
  // Simulate time passing
  setTimeout(() => {
    // Effect should expire but we can't easily test this in sync environment
    // This is more of a placeholder for the concept
  }, 20);
});

// Test render method
test('Render - Basic rendering', () => {
  const entity = createMockEntity();
  const controller = new RenderController(entity);
  
  // Should execute without error
  controller.render();
  
  // With highlight
  controller.setHighlight('SELECTED');
  controller.render();
  
  // With effects
  controller.addEffect({ id: 'test', type: 'glow', duration: 1000, intensity: 0.5 });
  controller.render();
});

// Test state indicators
test('State indicators - State-based rendering', () => {
  const entity = createMockEntity();
  const controller = new RenderController(entity);
  
  // Test different states
  entity._stateMachine.primaryState = "MOVING";
  controller.render();
  
  entity._stateMachine.primaryState = "GATHERING";
  controller.render();
  
  entity._stateMachine.primaryState = "COMBAT";
  controller.render();
  
  // Should not throw errors
});

// Test debug rendering
test('Debug rendering - Debug mode', () => {
  const entity = createMockEntity();
  const controller = new RenderController(entity);
  
  controller.setDebugEnabled(true);
  if (!controller.getDebugEnabled()) throw new Error('Debug should be enabled');
  
  controller.render(); // Should include debug info
  
  controller.setDebugEnabled(false);
  if (controller.getDebugEnabled()) throw new Error('Debug should be disabled');
});

// Test multiple effects
test('Multiple effects - Effect stacking', () => {
  const entity = createMockEntity();
  const controller = new RenderController(entity);
  
  const effects = [
    { id: 'glow', type: 'glow', duration: 1000, intensity: 0.3 },
    { id: 'flash', type: 'flash', duration: 500, intensity: 0.8 },
    { id: 'pulse', type: 'pulse', duration: 2000, intensity: 0.5 }
  ];
  
  effects.forEach(effect => controller.addEffect(effect));
  
  if (controller._effects.length !== 3) throw new Error('Not all effects added');
  
  controller.render(); // Should handle multiple effects
});

// Test highlight priority
test('Highlight priority - Override behavior', () => {
  const entity = createMockEntity();
  const controller = new RenderController(entity);
  
  controller.setHighlight('SELECTED');
  controller.setHighlight('COMBAT'); // Should override
  
  if (controller._highlightType !== 'COMBAT') throw new Error('Highlight not overridden');
});

// Test render with missing sprite
test('Render robustness - Missing sprite handling', () => {
  const entity = createMockEntity();
  entity._sprite = null; // Remove sprite
  
  const controller = new RenderController(entity);
  
  // Should handle gracefully
  controller.render();
});

// Test animation support
test('Animation support - Frame-based rendering', () => {
  const entity = createMockEntity();
  const controller = new RenderController(entity);
  
  // Simulate multiple frames
  for (let i = 0; i < 10; i++) {
    controller.render();
  }
  
  // Should handle continuous rendering
});

console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsRun - testsPassed} failed`);

if (testsPassed === testsRun) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('💥 Some tests failed');
  process.exit(1);
}