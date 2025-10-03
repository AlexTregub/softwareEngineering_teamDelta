/**
 * @fileoverview World Configuration for Gherkin/Behave Testing
 * Sets up shared context and state management between test steps
 * Follows testing methodology: real system integration, authentic validation
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

const { setWorldConstructor, Before, After } = require('@cucumber/cucumber');

/**
 * World Constructor - Shared context for all test scenarios
 * Provides clean state and helper methods for test steps
 */
function CustomWorld() {
  // Test state management
  this.config = null;
  this.buttonGroup = null;
  this.actionFactory = null;
  
  // Interaction tracking
  this.dragStartPosition = null;
  this.targetPosition = null;
  this.initialPosition = null;
  this.exactDragPosition = null;
  this.dragReleasePosition = null;
  
  // Test validation data
  this.expectedState = null;
  this.calculatedBounds = null;
  this.interactionTests = [];
  
  // Render testing state
  this.renderCalled = false;
  this.backgroundRendered = false;
  this.buttonsRendered = 0;
  this.buttonUpdateCallCount = 0;
}

// Set up the world constructor
setWorldConstructor(CustomWorld);

/**
 * Before each scenario - Clean setup
 * Ensures each test starts with clean state
 */
Before(function() {
  // Clear localStorage to prevent test interference
  if (global.localStorage) {
    global.localStorage.clear();
  }
  
  // Reset all world state properties
  this.config = null;
  this.buttonGroup = null;
  this.actionFactory = null;
  this.dragStartPosition = null;
  this.targetPosition = null;
  this.initialPosition = null;
  this.exactDragPosition = null;
  this.dragReleasePosition = null;
  this.expectedState = null;
  this.calculatedBounds = null;
  this.interactionTests = [];
  this.renderCalled = false;
  this.backgroundRendered = false;
  this.buttonsRendered = 0;
  this.buttonUpdateCallCount = 0;
});

/**
 * After each scenario - Cleanup
 * Ensures no test state leaks between scenarios
 */
After(function() {
  // Clean up any test artifacts
  if (global.localStorage) {
    global.localStorage.clear();
  }
  
  // Clear any lingering references
  this.buttonGroup = null;
  this.actionFactory = null;
});

module.exports = { CustomWorld };