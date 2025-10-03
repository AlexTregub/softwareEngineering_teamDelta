/**
 * @fileoverview Button Group WHEN Step Definitions
 * Executes user actions using real ButtonGroup API methods
 * Follows testing methodology: real API usage, no manual implementations
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

const { When } = require('@cucumber/cucumber');
const ButtonGroup = require('../../../Classes/systems/ui/ButtonGroup.js');

// WHEN STEPS - Execute actions using real system APIs

When('I create a button group at center screen position', function() {
  // Use real ButtonGroup constructor with authentic configuration
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

When('I create the button group', function() {
  // Generic button group creation using real API
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

When('I create a button group at bottom-right position', function() {
  // Create button group using real API - position already set in config
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

When('I create the button group at bottom-right position', function() {
  // Alternative phrasing for same action
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

When('I set the transparency to {float}', function(transparencyValue) {
  // Use real ButtonGroup API to set transparency
  this.buttonGroup.setTransparency(transparencyValue);
});

When('I set the scale to {float}', function(scaleValue) {
  // Use real ButtonGroup API to set scale
  this.buttonGroup.setScale(scaleValue);
});

When('I set the group to invisible', function() {
  // Use real ButtonGroup API to control visibility
  this.buttonGroup.setVisible(false);
});

When('I set the group back to visible', function() {
  // Use real ButtonGroup API to restore visibility
  this.buttonGroup.setVisible(true);
});

When('I move the button group to position \\({int}, {int})', function(x, y) {
  // Use real ButtonGroup API to set position
  this.buttonGroup.setPosition(x, y);
});

When('I trigger state saving', function() {
  // Use real ButtonGroup API to save state
  this.buttonGroup.saveState();
});

When('I create a new button group with the same storage key', function() {
  // Create configuration with the storage key that has saved data
  this.config = {
    id: 'load-test-group',
    name: 'Load Test Group',
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
    persistence: { 
      savePosition: true, 
      storageKey: 'load-test-key' // Same key as saved data
    },
    buttons: [{ id: 'load1', text: 'Load Button', size: { width: 80, height: 35 }, action: { type: 'function', handler: 'test.load1' } }]
  };
  
  // Create button group - should automatically load persisted state
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

When('I create a button group that tries to load the corrupted state', function() {
  // Use real ButtonGroup constructor - should handle corrupted data gracefully
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

When('I click and hold on the button group', function() {
  // Get real button group bounds for authentic interaction
  const bounds = this.buttonGroup.getBounds();
  const mouseX = bounds.x + bounds.width / 2;
  const mouseY = bounds.y + bounds.height / 2;
  
  // Store drag start position for validation
  this.dragStartPosition = { x: this.buttonGroup.state.position.x, y: this.buttonGroup.state.position.y };
  
  // Use real ButtonGroup API to initiate drag
  this.buttonGroup.handleDragging(mouseX, mouseY, true);
});

When('I move the mouse to position \\({int}, {int})', function(x, y) {
  // Store target position for validation
  this.targetPosition = { x: x, y: y };
  
  // Use real ButtonGroup API to process mouse movement during drag
  this.buttonGroup.handleDragging(x, y, true);
});

When('I release the mouse button', function() {
  // Use real ButtonGroup API to complete drag operation
  const targetX = this.targetPosition ? this.targetPosition.x : this.buttonGroup.state.position.x;
  const targetY = this.targetPosition ? this.targetPosition.y : this.buttonGroup.state.position.y;
  
  this.buttonGroup.handleDragging(targetX, targetY, false);
});

When('I click outside the button group boundaries', function() {
  // Get real bounds and click outside them
  const bounds = this.buttonGroup.getBounds();
  const outsideX = bounds.x - 50;
  const outsideY = bounds.y - 50;
  
  // Store initial position to verify no change
  this.initialPosition = { x: this.buttonGroup.state.position.x, y: this.buttonGroup.state.position.y };
  
  // Use real ButtonGroup API - should not initiate drag
  this.buttonGroup.handleDragging(outsideX, outsideY, true);
});

When('I drag the button group close to the left screen edge', function() {
  // Get current bounds for realistic drag calculation
  const bounds = this.buttonGroup.getBounds();
  const startX = bounds.x + bounds.width / 2;
  const startY = bounds.y + bounds.height / 2;
  
  // Start drag from center of button group
  this.buttonGroup.handleDragging(startX, startY, true);
  
  // Move to position that should trigger snap (within 20px of left edge)
  const nearLeftEdgeX = 15; // Within snap threshold
  const nearLeftEdgeY = startY;
  
  this.buttonGroup.handleDragging(nearLeftEdgeX, nearLeftEdgeY, true);
  this.dragReleasePosition = { x: nearLeftEdgeX, y: nearLeftEdgeY };
});

When('I drag the button group near screen edges', function() {
  // Get current bounds for realistic drag
  const bounds = this.buttonGroup.getBounds();
  const startX = bounds.x + bounds.width / 2;
  const startY = bounds.y + bounds.height / 2;
  
  // Start drag
  this.buttonGroup.handleDragging(startX, startY, true);
  
  // Move to position near edge that would snap if enabled
  const nearEdgeX = 15;
  const nearEdgeY = startY;
  
  this.buttonGroup.handleDragging(nearEdgeX, nearEdgeY, true);
  this.exactDragPosition = { x: nearEdgeX, y: nearEdgeY };
});

When('I drag it to position \\({int}, {int})', function(x, y) {
  // Get bounds for realistic drag initiation
  const bounds = this.buttonGroup.getBounds();
  const startX = bounds.x + bounds.width / 2;
  const startY = bounds.y + bounds.height / 2;
  
  // Start drag from center of button group
  this.buttonGroup.handleDragging(startX, startY, true);
  
  // Move to target position
  this.buttonGroup.handleDragging(x, y, true);
  
  // Complete drag
  this.buttonGroup.handleDragging(x, y, false);
});

When('I drag it again to position \\({int}, {int})', function(x, y) {
  // Perform another complete drag operation
  const bounds = this.buttonGroup.getBounds();
  const startX = bounds.x + bounds.width / 2;
  const startY = bounds.y + bounds.height / 2;
  
  // Start new drag from current center
  this.buttonGroup.handleDragging(startX, startY, true);
  
  // Move to new target position
  this.buttonGroup.handleDragging(x, y, true);
  
  // Complete drag
  this.buttonGroup.handleDragging(x, y, false);
});

When('I attempt to create the button group', function() {
  // Use real ButtonGroup constructor with empty buttons array
  this.buttonGroup = new ButtonGroup(this.config, this.actionFactory);
});

When('I call the update method with mouse coordinates and click state', function() {
  // Mock button update methods to verify they're called
  this.buttonUpdateCallCount = 0;
  this.buttonGroup.buttons.forEach(button => {
    const originalUpdate = button.update;
    button.update = (...args) => {
      this.buttonUpdateCallCount++;
      // Call original if it exists
      if (originalUpdate && typeof originalUpdate === 'function') {
        return originalUpdate.apply(button, args);
      }
    };
  });
  
  // Get realistic mouse coordinates within button group bounds
  const bounds = this.buttonGroup.getBounds();
  const mouseX = bounds.x + bounds.width / 2;
  const mouseY = bounds.y + bounds.height / 2;
  const isClicked = false;
  
  // Use real ButtonGroup update method
  this.buttonGroup.update(mouseX, mouseY, isClicked);
});

When('the render method is called', function() {
  // Mock render method to track if it's called properly
  this.renderCalled = false;
  this.backgroundRendered = false;
  this.buttonsRendered = 0;
  
  // Override render method to track rendering behavior
  const originalRender = this.buttonGroup.render;
  this.buttonGroup.render = function(...args) {
    this.renderCalled = true;
    
    // Check if background rendering would occur (visible check)
    if (this.state.visible) {
      this.backgroundRendered = true;
    }
    
    // Count buttons that would be rendered
    this.buttons.forEach(button => {
      if (this.state.visible) {
        this.buttonsRendered++;
      }
    });
    
    // Call original render if needed for real behavior
    if (originalRender && typeof originalRender === 'function') {
      return originalRender.apply(this, args);
    }
  }.bind(this.buttonGroup);
  
  // Call the render method
  this.buttonGroup.render();
});

When('I request the group\'s bounding rectangle', function() {
  // Use real ButtonGroup API to get bounds
  this.calculatedBounds = this.buttonGroup.getBounds();
});

When('I test various mouse positions for interaction', function() {
  // Get real bounds for testing
  const bounds = this.buttonGroup.getBounds();
  
  this.interactionTests = [];
  
  // Test center point (should be inside)
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  this.interactionTests.push({
    x: centerX,
    y: centerY,
    expected: true,
    description: 'center point',
    result: this.buttonGroup.isPointInBounds(centerX, centerY)
  });
  
  // Test outside left (should be outside)
  this.interactionTests.push({
    x: bounds.x - 10,
    y: centerY,
    expected: false,
    description: 'outside left',
    result: this.buttonGroup.isPointInBounds(bounds.x - 10, centerY)
  });
  
  // Test outside right (should be outside)
  this.interactionTests.push({
    x: bounds.x + bounds.width + 10,
    y: centerY,
    expected: false,
    description: 'outside right',
    result: this.buttonGroup.isPointInBounds(bounds.x + bounds.width + 10, centerY)
  });
  
  // Test outside top (should be outside)
  this.interactionTests.push({
    x: centerX,
    y: bounds.y - 10,
    expected: false,
    description: 'outside top',
    result: this.buttonGroup.isPointInBounds(centerX, bounds.y - 10)
  });
  
  // Test outside bottom (should be outside)
  this.interactionTests.push({
    x: centerX,
    y: bounds.y + bounds.height + 10,
    expected: false,
    description: 'outside bottom',
    result: this.buttonGroup.isPointInBounds(centerX, bounds.y + bounds.height + 10)
  });
  
  // Test exact boundary (should be inside - inclusive bounds)
  this.interactionTests.push({
    x: bounds.x,
    y: bounds.y,
    expected: true,
    description: 'top-left boundary',
    result: this.buttonGroup.isPointInBounds(bounds.x, bounds.y)
  });
  
  this.interactionTests.push({
    x: bounds.x + bounds.width,
    y: bounds.y + bounds.height,
    expected: true,
    description: 'bottom-right boundary',
    result: this.buttonGroup.isPointInBounds(bounds.x + bounds.width, bounds.y + bounds.height)
  });
});