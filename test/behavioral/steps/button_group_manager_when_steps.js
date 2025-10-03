/**
 * @fileoverview ButtonGroupManager WHEN Step Definitions
 * Action steps for ButtonGroupManager Gherkin/Behave testing
 * Executes real ButtonGroupManager API methods following testing methodology
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

const { When } = require('@cucumber/cucumber');
const ButtonGroupManager = require('../../../Classes/systems/ui/ButtonGroupManager.js');

// WHEN STEPS - Execute actions using real ButtonGroupManager API

When('I create a button group manager with the configuration', function() {
  // Use real ButtonGroupManager constructor
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  // Initialize with real API method
  this.initResults = this.manager.initialize(this.testConfigurations);
});

When('I load the configuration file into the manager', function() {
  // Create manager and load configuration using real API
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  try {
    // Simulate file loading and initialization
    this.initResults = this.manager.initialize(this.testConfigurations);
    this.loadSuccess = true;
  } catch (error) {
    this.loadError = error;
    this.loadSuccess = false;
  }
});

When('I request all active groups', function() {
  // Use real ButtonGroupManager API to get all groups
  this.allActiveGroups = this.manager.getAllActiveGroups();
});

When('I request a specific group by ID {string}', function(groupId) {
  // Use real ButtonGroupManager API to get specific group
  this.requestedGroup = this.manager.getButtonGroup(groupId);
  this.requestedGroupId = groupId;
});

When('I add a new button group configuration dynamically', function() {
  // Create new configuration
  const newConfig = {
    id: 'dynamic-new-group',
    name: 'Dynamically Added Group',
    layout: {
      type: 'vertical',
      position: { x: 100, y: 100 },
      spacing: 8,
      padding: { top: 5, right: 5, bottom: 5, left: 5 }
    },
    appearance: {
      scale: 1.0,
      transparency: 1.0,
      visible: true,
      background: { color: [40, 80, 40, 200], cornerRadius: 3 }
    },
    behavior: { draggable: false, resizable: false, snapToEdges: false },
    persistence: { savePosition: false, storageKey: 'dynamic-key' },
    buttons: [
      { id: 'dyn1', text: 'Dynamic 1', size: { width: 70, height: 30 }, action: { type: 'function', handler: 'dynamic.action1' } }
    ]
  };
  
  // Store initial count
  this.initialActiveCount = this.manager.getActiveGroupCount();
  
  // Use real ButtonGroupManager API to add group
  try {
    this.addedGroup = this.manager.addButtonGroup(newConfig);
    this.addSuccess = true;
  } catch (error) {
    this.addError = error;
    this.addSuccess = false;
  }
});

When('I remove a button group by ID {string}', function(groupId) {
  // Store initial count
  this.preRemovalCount = this.manager.getActiveGroupCount();
  
  // Use real ButtonGroupManager API to remove group
  this.removeResult = this.manager.removeButtonGroup(groupId);
  this.removedGroupId = groupId;
});

When('I update the group\'s transparency to {float}', function(transparency) {
  // Store the update value
  this.updateTransparency = transparency;
  
  // Use real ButtonGroupManager API to update group
  this.updateResult = this.manager.updateButtonGroup(this.targetGroupId, {
    transparency: transparency
  });
});

When('I update the group\'s position to \\({int}, {int})', function(x, y) {
  // Store the update values
  this.updatePosition = { x: x, y: y };
  
  // Use real ButtonGroupManager API to update group position
  this.positionUpdateResult = this.manager.updateButtonGroup(this.targetGroupId, {
    position: { x: x, y: y }
  });
});

When('I provide mouse coordinates \\({int}, {int}) with click state {word}', function(x, y, clickStateStr) {
  // Convert click state string to boolean
  const isClicked = clickStateStr === 'true';
  
  // Store interaction parameters
  this.mouseX = x;
  this.mouseY = y;
  this.isClicked = isClicked;
  
  // Use real ButtonGroupManager API for mouse interaction
  this.interactionResults = this.manager.handleMouseInteraction(x, y, isClicked);
});

When('I request the manager to render all groups', function() {
  // Use real ButtonGroupManager API to render all groups
  this.renderStats = this.manager.renderAllGroups();
  this.renderTimestamp = Date.now();
});

When('I attempt to create a manager with the invalid configuration', function() {
  // Use real ButtonGroupManager constructor
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  try {
    // Attempt initialization with invalid configurations
    this.initResults = this.manager.initialize(this.testConfigurations);
    this.initSuccess = true;
  } catch (error) {
    this.initError = error;
    this.initSuccess = false;
  }
});

When('I trigger a global save operation', function() {
  // Use real ButtonGroupManager API for global save
  this.saveResults = this.manager.saveAllGroups();
  this.saveTimestamp = Date.now();
});

When('I trigger a global load operation', function() {
  // Use real ButtonGroupManager API for global load
  this.loadResults = this.manager.loadAllGroups();
  this.loadTimestamp = Date.now();
});

When('I perform mouse interaction testing', function() {
  // Perform multiple mouse interactions to test performance
  this.performanceTestResults = [];
  const testPositions = [
    { x: 100, y: 100 },
    { x: 300, y: 200 },
    { x: 500, y: 400 },
    { x: 800, y: 600 },
    { x: 1000, y: 700 }
  ];
  
  const startTime = Date.now();
  
  for (const pos of testPositions) {
    const result = this.manager.handleMouseInteraction(pos.x, pos.y, false);
    this.performanceTestResults.push({
      position: pos,
      result: result,
      timestamp: Date.now()
    });
  }
  
  this.performanceTestDuration = Date.now() - startTime;
});

When('I perform rendering operations', function() {
  // Perform multiple render operations to test performance
  this.renderPerformanceResults = [];
  const renderStartTime = Date.now();
  
  // Perform multiple render calls
  for (let i = 0; i < 5; i++) {
    const renderStart = Date.now();
    const stats = this.manager.renderAllGroups();
    const renderEnd = Date.now();
    
    this.renderPerformanceResults.push({
      iteration: i + 1,
      stats: stats,
      duration: renderEnd - renderStart
    });
  }
  
  this.renderPerformanceDuration = Date.now() - renderStartTime;
});

When('a button action is triggered in group {string}', function(groupId) {
  // Get the target group
  const targetGroup = this.manager.getButtonGroup(groupId);
  this.actionTargetGroup = targetGroup;
  this.actionTargetGroupId = groupId;
  
  if (targetGroup && targetGroup.buttons && targetGroup.buttons.length > 0) {
    // Simulate triggering the first button's action
    const firstButton = targetGroup.buttons[0];
    this.triggeredButton = firstButton;
    
    // Use the action factory to execute action (real API)
    try {
      this.actionResult = this.actionFactory.executeAction(firstButton.action?.handler || 'test.action');
      this.actionSuccess = true;
    } catch (error) {
      this.actionError = error;
      this.actionSuccess = false;
    }
  } else {
    this.actionSuccess = false;
    this.actionError = new Error('No buttons available in target group');
  }
});

When('I reconfigure the group to change from horizontal to vertical layout', function() {
  // Store the change parameters
  this.layoutChange = { from: 'horizontal', to: 'vertical' };
  
  // Use real ButtonGroupManager API to update layout
  this.layoutUpdateResult = this.manager.updateButtonGroup(this.dynamicGroupId, {
    // Note: This would require extending updateButtonGroup to handle layout changes
    // For now, we'll simulate the reconfiguration intent
    layoutType: 'vertical'
  });
});

When('I modify the button configurations within the group', function() {
  // Simulate button configuration modification
  this.buttonModifications = [
    { id: 'modified-btn1', text: 'Modified Button 1', size: { width: 90, height: 40 } },
    { id: 'modified-btn2', text: 'Modified Button 2', size: { width: 85, height: 35 } }
  ];
  
  // This would require extending the manager API for button reconfiguration
  // For now, we'll track the modification intent
  this.buttonModificationAttempted = true;
});

When('I request manager diagnostic information', function() {
  // Use real ButtonGroupManager API to get diagnostic info
  this.diagnosticInfo = this.manager.getDiagnosticInfo();
});

When('modify the button configurations within the group', function() {
  // Modify button configurations for reconfiguration testing
  this.newButtonConfigs = [
    { id: 'modified-btn-1', text: 'Modified 1', size: { width: 80, height: 35 } },
    { id: 'modified-btn-2', text: 'Modified 2', size: { width: 80, height: 35 } },
    { id: 'modified-btn-3', text: 'Modified 3', size: { width: 80, height: 35 } },
    { id: 'new-btn-4', text: 'New Button', size: { width: 80, height: 35 } }
  ];
});

When('I request interaction handling for mouse position \\({int}, {int})', function(x, y) {
  // Use real ButtonGroupManager API for interaction handling
  this.coordinatedInteractionResults = this.manager.handleMouseInteraction(x, y, true);
  this.coordinatedMousePosition = { x: x, y: y };
});

When('I request complete manager shutdown', function() {
  // Store pre-shutdown state for validation
  this.preShutdownGroupCount = this.manager.getActiveGroupCount();
  this.preShutdownState = this.manager.getDiagnosticInfo();
  
  // Use real ButtonGroupManager API for shutdown
  this.shutdownResults = this.manager.shutdown();
  this.shutdownTimestamp = Date.now();
});