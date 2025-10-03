/**
 * @fileoverview Button Group Step Definitions for Gherkin/Behave Testing
 * Implements authentic system validation following testing methodology standards
 * Uses real ButtonGroup API, not test logic or manual implementations
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// Real system dependencies - no mocks for core functionality
global.CollisionBox2D = require('../../../Classes/systems/CollisionBox2D.js');
global.Button = require('../../../Classes/systems/Button.js');
const ButtonGroup = require('../../../Classes/systems/ui/ButtonGroup.js');

// Mock only external interfaces (localStorage, ButtonStyles)
global.localStorage = {
  storage: {},
  getItem(key) { return this.storage[key] || null; },
  setItem(key, value) { this.storage[key] = value; },
  removeItem(key) { delete this.storage[key]; },
  clear() { this.storage = {}; }
};

global.ButtonStyles = {
  DYNAMIC: {
    backgroundColor: '#4CAF50',
    hoverColor: '#45a049',
    textColor: 'white'
  }
};

// Helper function to create realistic button configurations
function createButtonConfig(id, text, width = 80, height = 35) {
  return {
    id: id,
    text: text,
    size: { width: width, height: height },
    action: { type: 'function', handler: `test.${id}Action` }
  };
}

// Helper function to create action factory (mock external interface only)
function createActionFactory() {
  return {
    executeAction(handler) { 
      return true; // Simulate successful action execution
    }
  };
}

// GIVEN STEPS - Set up initial state using real system APIs

Given('I have a button group configuration system', function() {
  this.actionFactory = createActionFactory();
  this.configs = {}; // Store different configuration types
});

Given('I have an action factory for button behaviors', function() {
  // Ensure action factory is available
  if (!this.actionFactory) {
    this.actionFactory = createActionFactory();
  }
});

Given('I have a clean localStorage state', function() {
  // Use real localStorage API to clear state
  global.localStorage.clear();
});

Given('I have a horizontal layout configuration with {int} buttons', function(buttonCount) {
  const buttons = [];
  for (let i = 1; i <= buttonCount; i++) {
    buttons.push(createButtonConfig(`btn${i}`, `Button ${i}`));
  }
  
  this.config = {
    id: 'horizontal-test-group',
    name: 'Horizontal Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 10, right: 15, bottom: 10, left: 15 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: {
      draggable: false,
      resizable: false,
      snapToEdges: false
    },
    persistence: {
      savePosition: false,
      storageKey: 'horizontal-test-key'
    },
    buttons: buttons
  };
});

Given('I have a vertical layout configuration with {int} buttons', function(buttonCount) {
  const buttons = [];
  for (let i = 1; i <= buttonCount; i++) {
    buttons.push(createButtonConfig(`vbtn${i}`, `V-Button ${i}`, 70, 30));
  }
  
  this.config = {
    id: 'vertical-test-group',
    name: 'Vertical Test Group',
    layout: {
      type: 'vertical',
      position: { x: 'left', y: 'top' },
      spacing: 8,
      padding: { top: 12, right: 10, bottom: 12, left: 10 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [80, 80, 80, 180], cornerRadius: 3 }
    },
    behavior: {
      draggable: false,
      resizable: false,
      snapToEdges: false
    },
    persistence: {
      savePosition: false,
      storageKey: 'vertical-test-key'
    },
    buttons: buttons
  };
});

Given('I set the position to top-left with padding', function() {
  // Modify existing configuration - tests real configuration system
  this.config.layout.position = { x: 'left', y: 'top' };
  this.config.layout.padding = { top: 20, right: 15, bottom: 20, left: 15 };
});

Given('I have a grid layout configuration with {int} buttons in {int} columns', function(buttonCount, columnCount) {
  const buttons = [];
  for (let i = 1; i <= buttonCount; i++) {
    buttons.push(createButtonConfig(`grid${i}`, `G${i}`, 60, 40));
  }
  
  this.config = {
    id: 'grid-test-group',
    name: 'Grid Test Group',
    layout: {
      type: 'grid',
      position: { x: 'right', y: 'bottom' },
      gridColumns: columnCount,
      spacing: 5,
      padding: { top: 8, right: 12, bottom: 8, left: 12 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [40, 40, 40, 220], cornerRadius: 8 }
    },
    behavior: {
      draggable: false,
      resizable: false,
      snapToEdges: false
    },
    persistence: {
      savePosition: false,
      storageKey: 'grid-test-key'
    },
    buttons: buttons
  };
});

Given('I have a button group with default visibility and transparency', function() {
  // Create simple test configuration
  this.config = {
    id: 'state-test-group',
    name: 'State Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 10, right: 10, bottom: 10, left: 10 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: { draggable: false, resizable: false, snapToEdges: false },
    persistence: { savePosition: false, storageKey: 'state-test-key' },
    buttons: [
      createButtonConfig('state1', 'State Button 1'),
      createButtonConfig('state2', 'State Button 2')
    ]
  };
  
  // Create the button group using real API
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

Given('I have a visible button group', function() {
  this.config = {
    id: 'visibility-test-group',
    name: 'Visibility Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 10, right: 10, bottom: 10, left: 10 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: { draggable: false, resizable: false, snapToEdges: false },
    persistence: { savePosition: false, storageKey: 'visibility-test-key' },
    buttons: [createButtonConfig('vis1', 'Visible Button')]
  };
  
  // Create the button group using real API
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

Given('I have a draggable button group with persistence enabled', function() {
  this.config = {
    id: 'persist-test-group',
    name: 'Persistence Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 10, right: 10, bottom: 10, left: 10 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: {
      draggable: true,
      resizable: false,
      snapToEdges: false
    },
    persistence: {
      savePosition: true,
      storageKey: 'persist-test-key'
    },
    buttons: [createButtonConfig('persist1', 'Persist Button')]
  };
  
  // Create the button group using real API
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

Given('the storage key is {string}', function(storageKey) {
  // Update configuration with real storage key
  this.config.persistence.storageKey = storageKey;
});

Given('I have saved button group state in localStorage', function() {
  // Create realistic saved state data
  const savedState = {
    position: { x: 100, y: 150 },
    scale: 0.8,
    transparency: 0.7,
    visible: true
  };
  
  // Use real localStorage API to save data
  global.localStorage.setItem('load-test-key', JSON.stringify(savedState));
  
  this.expectedState = savedState;
});

Given('the saved state contains position \\({int}, {int}), scale {float}, and transparency {float}', function(x, y, scale, transparency) {
  // Verify the expected state values for validation
  expect(this.expectedState.position.x).to.equal(x);
  expect(this.expectedState.position.y).to.equal(y);
  expect(this.expectedState.scale).to.equal(scale);
  expect(this.expectedState.transparency).to.equal(transparency);
});

Given('I have corrupted data in localStorage for a button group', function() {
  // Insert invalid JSON data to test error handling
  global.localStorage.setItem('corrupt-test-key', 'invalid-json-data');
  
  this.config = {
    id: 'corrupt-test-group',
    name: 'Corrupt Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 10, right: 10, bottom: 10, left: 10 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: { draggable: false, resizable: false, snapToEdges: false },
    persistence: { savePosition: true, storageKey: 'corrupt-test-key' },
    buttons: [createButtonConfig('corrupt1', 'Corrupt Button')]
  };
});

Given('I have a draggable button group at position \\({int}, {int})', function(x, y) {
  this.config = {
    id: 'drag-test-group',
    name: 'Drag Test Group',
    layout: {
      type: 'horizontal',
      position: { x: x, y: y }, // Use specific coordinates
      spacing: 10,
      padding: { top: 10, right: 15, bottom: 10, left: 15 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: {
      draggable: true,
      resizable: false,
      snapToEdges: false
    },
    persistence: { savePosition: false, storageKey: 'drag-test-key' },
    buttons: [
      createButtonConfig('drag1', 'Drag 1', 60, 40),
      createButtonConfig('drag2', 'Drag 2', 80, 35)
    ]
  };
  
  // Create the button group using real API
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

Given('I have a draggable button group with snap-to-edges enabled', function() {
  this.config = {
    id: 'snap-test-group',
    name: 'Snap Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 10, right: 10, bottom: 10, left: 10 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: {
      draggable: true,
      resizable: false,
      snapToEdges: true // Enable snap-to-edges
    },
    persistence: { savePosition: true, storageKey: 'snap-test-key' },
    buttons: [createButtonConfig('snap1', 'Snap Button')]
  };
  
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

Given('I have a draggable button group with snap-to-edges disabled', function() {
  this.config = {
    id: 'no-snap-test-group',
    name: 'No Snap Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 10, right: 10, bottom: 10, left: 10 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: {
      draggable: true,
      resizable: false,
      snapToEdges: false // Disable snap-to-edges
    },
    persistence: { savePosition: false, storageKey: 'no-snap-test-key' },
    buttons: [createButtonConfig('nosnap1', 'No Snap Button')]
  };
  
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

Given('I have a draggable button group', function() {
  // Generic draggable button group configuration
  this.config = {
    id: 'generic-drag-group',
    name: 'Generic Drag Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 10, right: 10, bottom: 10, left: 10 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: {
      draggable: true,
      resizable: false,
      snapToEdges: false
    },
    persistence: { savePosition: false, storageKey: 'generic-drag-key' },
    buttons: [createButtonConfig('generic1', 'Generic Button')]
  };
  
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

Given('I have a button group configuration with no buttons', function() {
  this.config = {
    id: 'empty-test-group',
    name: 'Empty Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 10, right: 10, bottom: 10, left: 10 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: { draggable: false, resizable: false, snapToEdges: false },
    persistence: { savePosition: false, storageKey: 'empty-test-key' },
    buttons: [] // Empty buttons array
  };
});

Given('I have a button group with multiple buttons', function() {
  this.config = {
    id: 'update-test-group',
    name: 'Update Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 10,
      padding: { top: 10, right: 10, bottom: 10, left: 10 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: { draggable: true, resizable: false, snapToEdges: false },
    persistence: { savePosition: false, storageKey: 'update-test-key' },
    buttons: [
      createButtonConfig('update1', 'Update 1'),
      createButtonConfig('update2', 'Update 2'),
      createButtonConfig('update3', 'Update 3')
    ]
  };
  
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

Given('I have a visible button group with styled buttons', function() {
  this.config = {
    id: 'render-test-group',
    name: 'Render Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 12,
      padding: { top: 15, right: 20, bottom: 15, left: 20 }
    },
    appearance: {
      scale: 1.2,
      transparency: 0.9,
      visible: true,
      background: { color: [50, 100, 150, 180], cornerRadius: 10 }
    },
    behavior: { draggable: false, resizable: false, snapToEdges: false },
    persistence: { savePosition: false, storageKey: 'render-test-key' },
    buttons: [
      createButtonConfig('render1', 'Styled 1', 90, 45),
      createButtonConfig('render2', 'Styled 2', 100, 40)
    ]
  };
  
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

Given('I have a button group with varied button sizes and padding', function() {
  this.config = {
    id: 'bounds-test-group',
    name: 'Bounds Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 'center', y: 'center' },
      spacing: 15,
      padding: { top: 20, right: 25, bottom: 20, left: 25 }
    },
    appearance: {
      scale: 1.5,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: { draggable: false, resizable: false, snapToEdges: false },
    persistence: { savePosition: false, storageKey: 'bounds-test-key' },
    buttons: [
      createButtonConfig('bounds1', 'Small', 50, 30),
      createButtonConfig('bounds2', 'Medium', 80, 40),
      createButtonConfig('bounds3', 'Large', 120, 50)
    ]
  };
  
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

Given('I have a button group with specific bounds', function() {
  this.config = {
    id: 'interaction-test-group',
    name: 'Interaction Test Group',
    layout: {
      type: 'horizontal',
      position: { x: 200, y: 300 }, // Specific position for predictable bounds
      spacing: 10,
      padding: { top: 10, right: 15, bottom: 10, left: 15 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [60, 60, 60, 200], cornerRadius: 5 }
    },
    behavior: { draggable: false, resizable: false, snapToEdges: false },
    persistence: { savePosition: false, storageKey: 'interaction-test-key' },
    buttons: [
      createButtonConfig('interact1', 'Test 1', 80, 40),
      createButtonConfig('interact2', 'Test 2', 90, 35)
    ]
  };
  
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

module.exports = { createButtonConfig, createActionFactory };