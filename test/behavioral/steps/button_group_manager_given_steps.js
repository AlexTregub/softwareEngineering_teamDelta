/**
 * @fileoverview ButtonGroupManager GIVEN Step Definitions
 * Setup steps for ButtonGroupManager Gherkin/Behave testing
 * Uses real ButtonGroupManager API, follows testing methodology standards
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

const { Given } = require('@cucumber/cucumber');
const ButtonGroupManager = require('../../../Classes/systems/ui/ButtonGroupManager.js');

// Helper function to create mock action factory (external interface)
function createActionFactory() {
  return {
    executeAction(handler) { 
      return { success: true, result: `Executed ${handler}` };
    }
  };
}

// Helper function to create test button group configuration
function createTestGroupConfig(id, name, buttonCount = 2) {
  const buttons = [];
  for (let i = 1; i <= buttonCount; i++) {
    buttons.push({
      id: `${id}-btn${i}`,
      text: `Button ${i}`,
      size: { width: 80, height: 35 },
      action: { type: 'function', handler: `${id}.action${i}` }
    });
  }

  return {
    id: id,
    name: name,
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
      draggable: true,
      resizable: false,
      snapToEdges: false
    },
    persistence: {
      savePosition: true,
      storageKey: `${id}-storage-key`
    },
    buttons: buttons
  };
}

// GIVEN STEPS - Set up initial state using real ButtonGroupManager API

Given('I have a button group manager system', function() {
  this.actionFactory = createActionFactory();
  this.managerOptions = {
    enableCulling: true,
    canvasWidth: 1200,
    canvasHeight: 800,
    debugMode: false
  };
});

Given('I have clean localStorage state', function() {
  // Use real localStorage API to clear state
  if (global.localStorage) {
    global.localStorage.clear();
  }
});

Given('I have a mock canvas environment', function() {
  // Set up canvas-like environment for testing
  this.canvasWidth = 1200;
  this.canvasHeight = 800;
  this.mockCanvas = {
    width: this.canvasWidth,
    height: this.canvasHeight
  };
});

Given('I have a JSON configuration with {int} button groups', function(groupCount) {
  this.testConfigurations = [];
  
  for (let i = 1; i <= groupCount; i++) {
    this.testConfigurations.push(
      createTestGroupConfig(`test-group-${i}`, `Test Group ${i}`, 2)
    );
  }
});

Given('I have a JSON configuration file {string} with multiple groups', function(filename) {
  // Simulate loading configuration file content
  this.configurationFile = filename;
  this.testConfigurations = [
    createTestGroupConfig('toolbar-main', 'Main Toolbar', 5),
    createTestGroupConfig('sidebar-tools', 'Tool Sidebar', 3),
    createTestGroupConfig('status-bar', 'Status Bar', 4),
    {
      id: 'invalid-group',
      // Missing required fields to test error handling
      name: 'Invalid Group Config'
      // buttons array missing, layout missing
    }
  ];
});

Given('I have a manager with {int} active button groups', function(groupCount) {
  // Create manager and initialize with test configurations
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  const configurations = [];
  for (let i = 1; i <= groupCount; i++) {
    configurations.push(
      createTestGroupConfig(`active-group-${i}`, `Active Group ${i}`, 2)
    );
  }
  
  this.initResults = this.manager.initialize(configurations);
});

Given('I have a manager with a button group {string}', function(groupId) {
  // Create manager with specific group
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  const config = createTestGroupConfig(groupId, `Managed Group ${groupId}`, 3);
  this.initResults = this.manager.initialize([config]);
  this.targetGroupId = groupId;
});

Given('I have a manager with {int} overlapping button groups', function(groupCount) {
  // Create manager with overlapping groups (same position)
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  const configurations = [];
  for (let i = 1; i <= groupCount; i++) {
    const config = createTestGroupConfig(`overlap-group-${i}`, `Overlap Group ${i}`, 2);
    // Set same position for overlap
    config.layout.position = { x: 250, y: 300 };
    configurations.push(config);
  }
  
  this.initResults = this.manager.initialize(configurations);
});

Given('I have a manager with {int} button groups of varying visibility', function(groupCount) {
  // Create manager with groups having different visibility states
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  const configurations = [];
  for (let i = 1; i <= groupCount; i++) {
    const config = createTestGroupConfig(`visibility-group-${i}`, `Visibility Group ${i}`, 2);
    // Alternate visibility
    config.appearance.visible = (i % 2 === 1);
    // Vary transparency
    config.appearance.transparency = i <= 2 ? 1.0 : 0.5;
    configurations.push(config);
  }
  
  this.initResults = this.manager.initialize(configurations);
});

Given('I have a JSON configuration with invalid group definitions', function() {
  // Create mix of valid and invalid configurations
  this.testConfigurations = [
    createTestGroupConfig('valid-group-1', 'Valid Group 1', 2), // Valid
    { 
      // Invalid - missing ID
      name: 'Invalid No ID',
      layout: { type: 'horizontal' },
      buttons: []
    },
    createTestGroupConfig('valid-group-2', 'Valid Group 2', 1), // Valid
    {
      id: 'invalid-no-layout',
      name: 'Invalid No Layout'
      // Missing layout and buttons
    },
    {
      id: null, // Invalid ID type
      name: 'Invalid Null ID',
      layout: { type: 'horizontal' },
      buttons: []
    }
  ];
});

Given('I have a manager with {int} groups that have persistence enabled', function(groupCount) {
  // Create manager with persistence-enabled groups
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  const configurations = [];
  for (let i = 1; i <= groupCount; i++) {
    const config = createTestGroupConfig(`persist-group-${i}`, `Persist Group ${i}`, 2);
    config.persistence.savePosition = true;
    config.persistence.storageKey = `persist-group-${i}-key`;
    configurations.push(config);
  }
  
  this.initResults = this.manager.initialize(configurations);
});

Given('I have a manager with {int} button groups', function(groupCount) {
  // Generic manager setup with specified group count
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  const configurations = [];
  for (let i = 1; i <= groupCount; i++) {
    configurations.push(
      createTestGroupConfig(`perf-group-${i}`, `Performance Group ${i}`, 3)
    );
  }
  
  this.initResults = this.manager.initialize(configurations);
});

Given('I have a manager with groups containing various button actions', function() {
  // Create manager with groups that have different action types
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  const toolbarConfig = createTestGroupConfig('main-toolbar', 'Main Toolbar', 4);
  // Modify buttons to have different action types
  toolbarConfig.buttons = [
    { id: 'save-btn', text: 'Save', size: { width: 60, height: 30 }, action: { type: 'function', handler: 'file.save' } },
    { id: 'load-btn', text: 'Load', size: { width: 60, height: 30 }, action: { type: 'function', handler: 'file.load' } },
    { id: 'exit-btn', text: 'Exit', size: { width: 60, height: 30 }, action: { type: 'function', handler: 'app.exit' } }
  ];
  
  this.initResults = this.manager.initialize([toolbarConfig]);
});

Given('I have a manager with a button group {string} for reconfiguration', function(groupId) {
  // Create manager with specific group for reconfiguration testing
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  const config = createTestGroupConfig(groupId, `Dynamic Group ${groupId}`, 3);
  config.layout.type = 'horizontal'; // Start with horizontal
  
  this.initResults = this.manager.initialize([config]);
  this.dynamicGroupId = groupId;
});

Given('I have a manager with multiple active groups', function() {
  // Generic setup for diagnostic testing
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  const configurations = [
    createTestGroupConfig('diag-group-1', 'Diagnostic Group 1', 2),
    createTestGroupConfig('diag-group-2', 'Diagnostic Group 2', 3),
    createTestGroupConfig('diag-group-3', 'Diagnostic Group 3', 1)
  ];
  
  this.initResults = this.manager.initialize(configurations);
});

Given('I have a manager with overlapping button groups', function() {
  // Setup for visibility/interaction coordination testing
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  const configurations = [
    createTestGroupConfig('overlay-1', 'Overlay Group 1', 2),
    createTestGroupConfig('overlay-2', 'Overlay Group 2', 2),
    createTestGroupConfig('overlay-3', 'Overlay Group 3', 2)
  ];
  
  // Set overlapping positions
  configurations[0].layout.position = { x: 200, y: 200 };
  configurations[1].layout.position = { x: 220, y: 220 };
  configurations[2].layout.position = { x: 240, y: 240 };
  
  // Set different visibility states
  configurations[1].appearance.visible = false; // Invisible
  configurations[2].appearance.transparency = 0.3; // Low transparency
  
  this.initResults = this.manager.initialize(configurations);
});

Given('some groups are invisible or have low transparency', function() {
  // This is handled by the previous step - groups already configured with different visibility
  // Verify the setup
  const groups = this.manager.getAllActiveGroups();
  let invisibleCount = 0;
  let lowTransparencyCount = 0;
  
  groups.forEach(group => {
    if (!group.isVisible()) {
      invisibleCount++;
    }
    if (group.state.transparency < 0.5) {
      lowTransparencyCount++;
    }
  });
  
  // Store for validation
  this.visibilityStats = { invisibleCount, lowTransparencyCount };
});

Given('I have a manager with {int} active button groups for cleanup testing', function(groupCount) {
  // Setup for cleanup testing
  this.manager = new ButtonGroupManager(this.actionFactory, this.managerOptions);
  
  const configurations = [];
  for (let i = 1; i <= groupCount; i++) {
    const config = createTestGroupConfig(`cleanup-group-${i}`, `Cleanup Group ${i}`, 2);
    config.persistence.savePosition = true; // Enable persistence for cleanup testing
    configurations.push(config);
  }
  
  this.initResults = this.manager.initialize(configurations);
  this.initialGroupCount = groupCount;
});

module.exports = { createTestGroupConfig, createActionFactory };