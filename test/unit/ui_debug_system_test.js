/**
 * UIDebugManager Test & Demo
 * 
 * Simple test file to validate the Universal UI Debug System
 * Run this in a browser with p5.js loaded to test the functionality
 */

// Test variables
let testUIElements = [];
let testDebugManager;

function setup() {
  createCanvas(800, 600);
  
  // Initialize the debug manager
  testDebugManager = new UIDebugManager();
  testDebugManager.enable(); // Start with debug mode enabled for testing
  
  // Create some test UI elements
  testUIElements = [
    {
      id: 'test_button_1',
      position: { x: 100, y: 100 },
      size: { width: 120, height: 40 },
      label: 'Test Button 1',
      color: [100, 150, 255]
    },
    {
      id: 'test_panel_1', 
      position: { x: 300, y: 50 },
      size: { width: 200, height: 150 },
      label: 'Test Panel',
      color: [255, 150, 100]
    },
    {
      id: 'test_hud',
      position: { x: 50, y: 250 },
      size: { width: 180, height: 80 },
      label: 'HUD Element',
      color: [150, 255, 100]
    }
  ];
  
  // Register all test elements with the debug system
  testUIElements.forEach(element => {
    testDebugManager.registerElement(
      element.id,
      {
        x: element.position.x,
        y: element.position.y,
        width: element.size.width,
        height: element.size.height
      },
      (newX, newY) => {
        // Update callback - called when element is moved
        element.position.x = newX;
        element.position.y = newY;
        console.log(`Moved ${element.id} to (${newX}, ${newY})`);
      },
      {
        label: element.label,
        persistKey: `test_${element.id}`,
        constraints: element.id === 'test_hud' ? {
          minX: 0,
          maxX: width - element.size.width,
          minY: 200, // Keep HUD in bottom area
          maxY: height - element.size.height
        } : null
      }
    );
  });
  
  console.log('UIDebugManager Test initialized');
  console.log('Press ~ to toggle debug mode');
  console.log('Drag yellow handles to move elements');
}

function draw() {
  background(40, 40, 60);
  
  // Draw test UI elements
  testUIElements.forEach(element => {
    push();
    
    // Element background
    fill(...element.color, 180);
    stroke(255);
    strokeWeight(1);
    rect(element.position.x, element.position.y, element.size.width, element.size.height, 5);
    
    // Element label
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(14);
    text(element.label, 
         element.position.x + element.size.width / 2,
         element.position.y + element.size.height / 2 - 5);
    
    // Element coordinates (for debugging)
    textAlign(LEFT, TOP);
    textSize(10);
    fill(255, 255, 255, 150);
    text(`(${element.position.x}, ${element.position.y})`,
         element.position.x + 5,
         element.position.y + element.size.height - 15);
    
    pop();
  });
  
  // Draw instructions
  push();
  fill(255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(12);
  text("UI Debug System Test", 10, 10);
  text("Press '~' to toggle debug mode", 10, 30);
  text("Drag yellow handles to move elements", 10, 50);
  text("Press 'G' to toggle grid snapping", 10, 70);
  text(`Debug mode: ${testDebugManager.enabled ? 'ENABLED' : 'DISABLED'}`, 10, height - 40);
  text(`Registered elements: ${testDebugManager.registeredElements.size}`, 10, height - 20);
  pop();
  
  // Render the debug system (this will show bounding boxes and handles when enabled)
  testDebugManager.render();
}

// Test functions that can be called from browser console
function testMoveElement() {
  testDebugManager.moveElement('test_button_1', 200, 200);
  console.log('Moved test_button_1 to (200, 200)');
}

function testResetPositions() {
  testDebugManager.resetAllPositions();
  console.log('Reset all elements to original positions');
}

function testToggleGridSnap() {
  testDebugManager.config.snapToGrid = !testDebugManager.config.snapToGrid;
  console.log('Grid snap:', testDebugManager.config.snapToGrid ? 'ENABLED' : 'DISABLED');
}

function testAddElement() {
  const newElement = {
    id: 'dynamic_test',
    position: { x: 400, y: 400 },
    size: { width: 100, height: 60 },
    label: 'Dynamic Element',
    color: [255, 255, 100]
  };
  
  testUIElements.push(newElement);
  
  testDebugManager.registerElement(
    newElement.id,
    {
      x: newElement.position.x,
      y: newElement.position.y,
      width: newElement.size.width,
      height: newElement.size.height
    },
    (newX, newY) => {
      newElement.position.x = newX;
      newElement.position.y = newY;
    },
    {
      label: newElement.label,
      persistKey: `test_${newElement.id}`
    }
  );
  
  console.log('Added dynamic element');
}

// Make test functions available globally for console testing
if (typeof window !== 'undefined') {
  window.testMoveElement = testMoveElement;
  window.testResetPositions = testResetPositions;
  window.testToggleGridSnap = testToggleGridSnap;
  window.testAddElement = testAddElement;
}