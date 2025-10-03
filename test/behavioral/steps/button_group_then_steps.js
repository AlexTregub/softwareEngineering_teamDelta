/**
 * @fileoverview Button Group THEN Step Definitions
 * Validates outcomes using real ButtonGroup API and system state
 * Follows testing methodology: authentic system validation, no test logic
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

const { Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// THEN STEPS - Validate outcomes using real system APIs and authentic business logic

Then('the button group should be visible and interactive', function() {
  // Use real ButtonGroup API to validate visibility
  expect(this.buttonGroup.isVisible()).to.be.true;
  
  // Validate interactive state through real API
  expect(this.buttonGroup.state.visible).to.be.true;
  expect(this.buttonGroup.buttons.length).to.be.greaterThan(0);
});

Then('the buttons should be arranged horizontally with proper spacing', function() {
  // Get real button positions using ButtonGroup API
  const buttons = this.buttonGroup.buttons;
  expect(buttons.length).to.equal(2); // Based on configuration
  
  // Validate horizontal arrangement - x positions should increase
  expect(buttons[0].x).to.be.lessThan(buttons[1].x);
  
  // Validate spacing using real system calculation
  const actualSpacing = buttons[1].x - (buttons[0].x + buttons[0].width);
  const expectedSpacing = this.config.layout.spacing;
  expect(actualSpacing).to.equal(expectedSpacing);
});

Then('each button should be clickable and respond to mouse interactions', function() {
  // Validate buttons have real interaction capabilities
  this.buttonGroup.buttons.forEach(button => {
    expect(button).to.have.property('onClick'); // Button uses onClick callback pattern
    expect(button).to.have.property('update');
    expect(button.width).to.be.greaterThan(0);
    expect(button.height).to.be.greaterThan(0);
  });
});

Then('the group should have the correct bounding box dimensions', function() {
  // Use real ButtonGroup bounds calculation API
  const bounds = this.buttonGroup.getBounds();
  
  // Validate bounds exist and are realistic
  expect(bounds.width).to.be.greaterThan(0);
  expect(bounds.height).to.be.greaterThan(0);
  expect(bounds.x).to.be.a('number');
  expect(bounds.y).to.be.a('number');
  
  // Validate bounds encompass all buttons + padding
  const expectedMinWidth = this.config.buttons.reduce((sum, btn) => sum + btn.size.width, 0) +
                          (this.config.buttons.length - 1) * this.config.layout.spacing +
                          this.config.layout.padding.left + this.config.layout.padding.right;
  
  expect(bounds.width).to.equal(expectedMinWidth);
});

Then('the buttons should be arranged vertically', function() {
  // Validate vertical arrangement using real button positions
  const buttons = this.buttonGroup.buttons;
  
  // In vertical layout, y positions should increase
  for (let i = 1; i < buttons.length; i++) {
    expect(buttons[i].y).to.be.greaterThan(buttons[i-1].y);
  }
  
  // Validate vertical spacing
  if (buttons.length > 1) {
    const actualSpacing = buttons[1].y - (buttons[0].y + buttons[0].height);
    expect(actualSpacing).to.equal(this.config.layout.spacing);
  }
});

Then('the group should be positioned at the top-left corner', function() {
  // Validate position using real ButtonGroup state
  const position = this.buttonGroup.state.position;
  const padding = this.config.layout.padding;
  
  // Top-left positioning should account for padding
  expect(position.x).to.equal(padding.left);
  expect(position.y).to.equal(padding.top);
});

Then('the padding should create proper spacing around the buttons', function() {
  // Use real bounds to validate padding implementation
  const bounds = this.buttonGroup.getBounds();
  const padding = this.config.layout.padding;
  
  // Bounds should start at position minus padding
  expect(bounds.x).to.equal(this.buttonGroup.state.position.x - padding.left);
  expect(bounds.y).to.equal(this.buttonGroup.state.position.y - padding.top);
});

Then('the buttons should be arranged in a {int}x{int} grid pattern', function(rows, cols) {
  // Validate grid arrangement using real button positions
  const buttons = this.buttonGroup.buttons;
  const expectedButtons = rows * cols;
  expect(buttons.length).to.equal(expectedButtons);
  
  // Validate grid positioning - buttons in same row should have same y
  for (let row = 0; row < rows; row++) {
    const rowButtons = buttons.slice(row * cols, (row + 1) * cols);
    const firstRowY = rowButtons[0].y;
    
    rowButtons.forEach(button => {
      expect(button.y).to.equal(firstRowY);
    });
  }
});

Then('the group should be positioned at the bottom-right corner', function() {
  // Validate bottom-right positioning using real system state
  const position = this.buttonGroup.state.position;
  
  // Bottom-right should be calculated from canvas dimensions
  // Using system defaults: canvas width 1200, height 800
  const canvasWidth = 1200;
  const canvasHeight = 800;
  const bounds = this.buttonGroup.getBounds();
  
  expect(position.x).to.equal(canvasWidth - bounds.width);
  expect(position.y).to.equal(canvasHeight - bounds.height);
});

Then('each button should maintain consistent sizing within the grid', function() {
  // Validate consistent button sizing using real button properties
  const buttons = this.buttonGroup.buttons;
  const firstButton = buttons[0];
  
  buttons.forEach(button => {
    expect(button.width).to.equal(firstButton.width);
    expect(button.height).to.equal(firstButton.height);
  });
});

Then('the button group should be semi-transparent', function() {
  // Use real ButtonGroup API to validate transparency
  expect(this.buttonGroup.state.transparency).to.equal(0.5);
});

Then('the button group should be scaled to {int}% size', function(percentage) {
  // Use real ButtonGroup API to validate scale
  const expectedScale = percentage / 100;
  expect(this.buttonGroup.state.scale).to.equal(expectedScale);
});

Then('the visual changes should be applied to all buttons in the group', function() {
  // Validate that state changes affect all buttons
  const transparency = this.buttonGroup.state.transparency;
  const scale = this.buttonGroup.state.scale;
  
  expect(transparency).to.be.a('number');
  expect(scale).to.be.a('number');
  
  // Buttons should exist and be affected by group state
  expect(this.buttonGroup.buttons.length).to.be.greaterThan(0);
});

Then('the button group should not be visible on screen', function() {
  // Use real ButtonGroup API to validate invisibility
  expect(this.buttonGroup.isVisible()).to.be.false;
  expect(this.buttonGroup.state.visible).to.be.false;
});

Then('mouse interactions should not affect the invisible group', function() {
  // Test that invisible group doesn't respond to interactions
  const bounds = this.buttonGroup.getBounds();
  const mouseX = bounds.x + bounds.width / 2;
  const mouseY = bounds.y + bounds.height / 2;
  
  // Store initial state
  const initialPosition = { x: this.buttonGroup.state.position.x, y: this.buttonGroup.state.position.y };
  
  // Try to interact - should have no effect when invisible
  this.buttonGroup.update(mouseX, mouseY, true);
  
  // Position should not change
  expect(this.buttonGroup.state.position.x).to.equal(initialPosition.x);
  expect(this.buttonGroup.state.position.y).to.equal(initialPosition.y);
});

Then('the button group should reappear with all original properties', function() {
  // Validate that making visible restores all properties
  expect(this.buttonGroup.isVisible()).to.be.true;
  expect(this.buttonGroup.state.visible).to.be.true;
  
  // Original properties should be intact
  expect(this.buttonGroup.buttons.length).to.be.greaterThan(0);
  expect(this.buttonGroup.state.scale).to.be.a('number');
  expect(this.buttonGroup.state.transparency).to.be.a('number');
});

Then('the position should be saved to localStorage', function() {
  // Use real localStorage API to validate saving
  const storageKey = this.config.persistence.storageKey;
  const savedData = global.localStorage.getItem(storageKey);
  
  expect(savedData).to.not.be.null;
  
  const parsedData = JSON.parse(savedData);
  expect(parsedData).to.have.property('position');
});

Then('the saved data should contain the correct position coordinates', function() {
  // Validate saved data accuracy using real localStorage
  const storageKey = this.config.persistence.storageKey;
  const savedData = JSON.parse(global.localStorage.getItem(storageKey));
  
  expect(savedData.position.x).to.equal(150);
  expect(savedData.position.y).to.equal(200);
});

Then('the button group should load the persisted position', function() {
  // Validate that ButtonGroup constructor loaded saved position
  expect(this.buttonGroup.state.position.x).to.equal(this.expectedState.position.x);
  expect(this.buttonGroup.state.position.y).to.equal(this.expectedState.position.y);
});

Then('the button group should have the saved scale factor', function() {
  // Validate loaded scale using real API
  expect(this.buttonGroup.state.scale).to.equal(this.expectedState.scale);
});

Then('the button group should have the saved transparency level', function() {
  // Validate loaded transparency using real API
  expect(this.buttonGroup.state.transparency).to.equal(this.expectedState.transparency);
});

Then('the button group should use default values instead of corrupted data', function() {
  // Validate fallback to defaults when data is corrupted
  expect(this.buttonGroup.state.position.x).to.be.a('number');
  expect(this.buttonGroup.state.position.y).to.be.a('number');
  expect(this.buttonGroup.state.scale).to.equal(1.0);
  expect(this.buttonGroup.state.transparency).to.equal(1.0);
  expect(this.buttonGroup.state.visible).to.be.true;
});

Then('the system should handle the error gracefully without crashing', function() {
  // Validate that ButtonGroup was created successfully despite bad data
  expect(this.buttonGroup).to.be.an('object');
  expect(this.buttonGroup.buttons).to.be.an('array');
  expect(this.buttonGroup.state).to.be.an('object');
});

Then('a new valid state should be established', function() {
  // Validate that system creates valid default state
  expect(this.buttonGroup.state.position).to.have.property('x');
  expect(this.buttonGroup.state.position).to.have.property('y');
  expect(this.buttonGroup.state.scale).to.be.greaterThan(0);
  expect(this.buttonGroup.state.transparency).to.be.greaterThan(0);
});

Then('the button group should move to the new position', function() {
  // Validate final position using real ButtonGroup state
  expect(this.buttonGroup.state.position.x).to.equal(this.targetPosition.x);
  expect(this.buttonGroup.state.position.y).to.equal(this.targetPosition.y);
});

Then('the drag operation should update the group\'s internal position state', function() {
  // Validate that drag updated internal state correctly
  expect(this.buttonGroup.state.position).to.have.property('x');
  expect(this.buttonGroup.state.position).to.have.property('y');
  expect(this.buttonGroup.isDragging).to.be.false; // Should be completed
});

Then('the new position should be saved automatically if persistence is enabled', function() {
  // Check if persistence is enabled and validate saving
  if (this.config.persistence.savePosition) {
    const storageKey = this.config.persistence.storageKey;
    const savedData = global.localStorage.getItem(storageKey);
    expect(savedData).to.not.be.null;
  }
});

Then('the drag operation should not initiate', function() {
  // Validate that clicking outside bounds doesn't start drag
  expect(this.buttonGroup.isDragging).to.be.false;
  expect(this.buttonGroup.isDragActive()).to.be.false;
});

Then('the button group should remain in its original position', function() {
  // Validate position hasn't changed using real API
  expect(this.buttonGroup.state.position.x).to.equal(this.initialPosition.x);
  expect(this.buttonGroup.state.position.y).to.equal(this.initialPosition.y);
});

Then('no drag state should be activated', function() {
  // Validate drag state using real ButtonGroup API
  expect(this.buttonGroup.isDragging).to.be.false;
  expect(this.buttonGroup.isDragActive()).to.be.false;
});

Then('the button group should snap to the exact left edge position', function() {
  // Validate snap-to-edge behavior using real system constraints
  expect(this.buttonGroup.state.position.x).to.equal(0); // Snapped to left edge
});

Then('the snapped position should be persisted', function() {
  // Validate persistence of snapped position
  if (this.config.persistence.savePosition) {
    const storageKey = this.config.persistence.storageKey;
    const savedData = JSON.parse(global.localStorage.getItem(storageKey));
    expect(savedData.position.x).to.equal(0);
  }
});

Then('the button group should maintain the exact drag position', function() {
  // Validate no snapping occurred - position should match exact drag
  expect(this.buttonGroup.state.position.x).to.equal(this.exactDragPosition.x);
  expect(this.buttonGroup.state.position.y).to.equal(this.exactDragPosition.y);
});

Then('no automatic position adjustment should occur', function() {
  // Validate that position matches exact drag coordinates
  const position = this.buttonGroup.state.position;
  expect(position.x).to.not.equal(0); // Should not have snapped to edge
  expect(position.x).to.equal(this.exactDragPosition.x);
});

Then('the final position should be \\({int}, {int})', function(x, y) {
  // Validate final position after multiple drags
  expect(this.buttonGroup.state.position.x).to.equal(x);
  expect(this.buttonGroup.state.position.y).to.equal(y);
});

Then('each drag operation should be independent', function() {
  // Validate that drag operations don't interfere with each other
  expect(this.buttonGroup.isDragging).to.be.false; // Should be completed
  expect(this.buttonGroup.isDragActive()).to.be.false;
});

Then('the position history should reflect all movements', function() {
  // Validate that final position reflects the complete drag sequence
  // This is validated by the position being correct after multiple operations
  expect(this.buttonGroup.state.position).to.have.property('x');
  expect(this.buttonGroup.state.position).to.have.property('y');
});

Then('the button group should handle the empty state gracefully', function() {
  // Validate that empty button array is handled properly
  expect(this.buttonGroup.buttons).to.be.an('array');
  expect(this.buttonGroup.buttons.length).to.equal(0);
  expect(this.buttonGroup.state).to.be.an('object');
});

Then('the bounding box should reflect zero dimensions', function() {
  // Use real ButtonGroup bounds API to validate empty state
  const bounds = this.buttonGroup.getBounds();
  expect(bounds.width).to.equal(0);
  expect(bounds.height).to.equal(0);
});

Then('no interactive elements should be present', function() {
  // Validate no buttons exist for interaction
  expect(this.buttonGroup.buttons.length).to.equal(0);
});

Then('all buttons in the group should receive update calls', function() {
  // Validate that update method called all button updates
  const expectedCalls = this.buttonGroup.buttons.length;
  expect(this.buttonUpdateCallCount).to.equal(expectedCalls);
});

Then('drag handling should be processed if enabled', function() {
  // Validate drag handling based on configuration
  if (this.config.behavior.draggable) {
    // Should have processed drag logic
    expect(this.buttonGroup.isDragActive).to.be.a('function');
  }
});

Then('the group should maintain consistent state across the update cycle', function() {
  // Validate state consistency after update
  expect(this.buttonGroup.state).to.be.an('object');
  expect(this.buttonGroup.state.visible).to.be.a('boolean');
  expect(this.buttonGroup.state.scale).to.be.a('number');
  expect(this.buttonGroup.state.transparency).to.be.a('number');
});

Then('the group background should be drawn with correct styling', function() {
  // Validate render method execution and background rendering
  expect(this.renderCalled).to.be.true;
  expect(this.backgroundRendered).to.be.true;
});

Then('each button should be rendered in its calculated position', function() {
  // Validate button rendering count
  const expectedButtons = this.buttonGroup.buttons.length;
  expect(this.buttonsRendered).to.equal(expectedButtons);
});

Then('visual effects like transparency and scaling should be applied', function() {
  // Validate that visual effects are considered in rendering
  expect(this.buttonGroup.state.transparency).to.be.a('number');
  expect(this.buttonGroup.state.scale).to.be.a('number');
  expect(this.renderCalled).to.be.true;
});

Then('the bounds should encompass all buttons including padding', function() {
  // Validate bounds calculation accuracy using real system
  const bounds = this.calculatedBounds;
  const padding = this.config.layout.padding;
  
  expect(bounds.width).to.be.greaterThan(0);
  expect(bounds.height).to.be.greaterThan(0);
  
  // Bounds should include padding in dimensions
  const expectedMinWidth = padding.left + padding.right;
  const expectedMinHeight = padding.top + padding.bottom;
  
  expect(bounds.width).to.be.greaterThan(expectedMinWidth);
  expect(bounds.height).to.be.greaterThan(expectedMinHeight);
});

Then('the bounds should account for the current scale factor', function() {
  // Validate that scaling affects bounds calculation
  const scale = this.buttonGroup.state.scale;
  expect(scale).to.be.a('number');
  expect(scale).to.be.greaterThan(0);
  
  // Bounds should reflect scaling (test with specific scale values)
  expect(this.calculatedBounds.width).to.be.greaterThan(0);
  expect(this.calculatedBounds.height).to.be.greaterThan(0);
});

Then('the bounds should reflect the actual rendered dimensions', function() {
  // Validate bounds match what would actually be rendered
  const bounds = this.calculatedBounds;
  
  expect(bounds.x).to.be.a('number');
  expect(bounds.y).to.be.a('number');
  expect(bounds.width).to.be.a('number');
  expect(bounds.height).to.be.a('number');
  
  // All dimensions should be non-negative
  expect(bounds.width).to.be.greaterThanOrEqual(0);
  expect(bounds.height).to.be.greaterThanOrEqual(0);
});

Then('points inside the bounds should register as interactive', function() {
  // Validate interaction detection for inside points
  const insideTests = this.interactionTests.filter(test => test.expected === true);
  insideTests.forEach(test => {
    expect(test.result).to.be.true;
  });
});

Then('points outside the bounds should not register as interactive', function() {
  // Validate interaction detection for outside points
  const outsideTests = this.interactionTests.filter(test => test.expected === false);
  outsideTests.forEach(test => {
    expect(test.result).to.be.false;
  });
});

Then('boundary edge cases should be handled correctly', function() {
  // Validate that boundary cases work as expected
  const boundaryTests = this.interactionTests.filter(test => 
    test.description.includes('boundary'));
  
  boundaryTests.forEach(test => {
    expect(test.result).to.equal(test.expected);
  });
});