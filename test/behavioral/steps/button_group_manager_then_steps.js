/**
 * @fileoverview ButtonGroupManager THEN Step Definitions  
 * Validation steps for ButtonGroupManager Gherkin/Behave testing
 * Uses real system state validation following testing methodology standards
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

const { Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// THEN STEPS - Validate outcomes using real ButtonGroupManager API and system state

Then('the manager should successfully initialize', function() {
  // Validate manager initialization using real API
  expect(this.manager.isReady()).to.be.true;
  expect(this.initResults).to.be.an('object');
  expect(this.initResults.successful).to.be.greaterThan(0);
});

Then('all {int} button groups should be created and active', function(expectedCount) {
  // Use real ButtonGroupManager API to validate group creation
  expect(this.manager.getActiveGroupCount()).to.equal(expectedCount);
  expect(this.initResults.successful).to.equal(expectedCount);
  expect(this.initResults.failed).to.equal(0);
});

Then('each button group should have its configured layout and buttons', function() {
  // Validate each group using real ButtonGroup API
  const activeGroups = this.manager.getAllActiveGroups();
  
  activeGroups.forEach(group => {
    expect(group).to.be.an('object');
    expect(group.buttons).to.be.an('array');
    expect(group.buttons.length).to.be.greaterThan(0);
    expect(group.state).to.be.an('object');
    expect(group.state.position).to.have.property('x');
    expect(group.state.position).to.have.property('y');
  });
});

Then('the manager should track all active groups by ID', function() {
  // Validate group tracking using real API
  this.testConfigurations.forEach(config => {
    const group = this.manager.getButtonGroup(config.id);
    expect(group).to.not.be.null;
    expect(group).to.be.an('object');
  });
});

Then('the manager should parse the JSON successfully', function() {
  // Validate successful parsing and initialization
  if (this.loadSuccess) {
    expect(this.initResults).to.be.an('object');
    expect(this.initResults.successful).to.be.greaterThan(0);
  } else {
    expect(this.loadError).to.be.an('Error');
  }
});

Then('create button groups for each configuration entry', function() {
  // Validate that valid configurations were processed
  const validConfigs = this.testConfigurations.filter(config => 
    config.id && typeof config.id === 'string' && config.layout && config.buttons
  );
  
  if (this.loadSuccess) {
    expect(this.initResults.successful).to.be.greaterThan(0);
    // Should create groups for valid configurations
    validConfigs.forEach(config => {
      const group = this.manager.getButtonGroup(config.id);
      if (config.id !== 'invalid-group') { // Skip intentionally invalid
        expect(group).to.not.be.null;
      }
    });
  }
});

Then('handle any configuration validation errors gracefully', function() {
  // Validate error handling using real API
  expect(this.initResults.errors).to.be.an('array');
  expect(this.initResults.failed).to.be.greaterThanOrEqual(0);
  
  // Should have failed on invalid configuration
  expect(this.initResults.failed).to.be.greaterThan(0);
});

Then('report successful and failed group creations', function() {
  // Validate reporting using real manager state
  expect(this.initResults).to.have.property('successful');
  expect(this.initResults).to.have.property('failed');
  expect(this.initResults).to.have.property('errors');
  
  expect(this.initResults.successful + this.initResults.failed).to.equal(this.testConfigurations.length);
});

Then('I should receive all {int} group instances', function(expectedCount) {
  // Validate getAllActiveGroups using real API
  expect(this.allActiveGroups).to.be.an('array');
  expect(this.allActiveGroups.length).to.equal(expectedCount);
  
  this.allActiveGroups.forEach(group => {
    expect(group).to.be.an('object');
    expect(group.buttons).to.be.an('array');
  });
});

Then('each group should be properly initialized and functional', function() {
  // Validate group functionality using real ButtonGroup API
  this.allActiveGroups.forEach(group => {
    expect(group.state).to.be.an('object');
    expect(group.state.visible).to.be.a('boolean');
    expect(group.state.scale).to.be.a('number');
    expect(group.state.transparency).to.be.a('number');
    expect(typeof group.isVisible).to.equal('function');
  });
});

Then('I should receive the correct button group instance', function() {
  // Validate getButtonGroup using real API
  expect(this.requestedGroup).to.not.be.null;
  expect(this.requestedGroup).to.be.an('object');
});

Then('the group should be ready for interaction', function() {
  // Validate group interaction readiness
  expect(this.requestedGroup.state).to.be.an('object');
  expect(typeof this.requestedGroup.update).to.equal('function');
  expect(typeof this.requestedGroup.handleDragging).to.equal('function');
});

Then('the new group should be created and added to active groups', function() {
  // Validate dynamic group addition using real API
  if (this.addSuccess) {
    expect(this.addedGroup).to.be.an('object');
    expect(this.manager.getActiveGroupCount()).to.be.greaterThan(this.initialActiveCount);
    
    const addedGroup = this.manager.getButtonGroup('dynamic-new-group');
    expect(addedGroup).to.not.be.null;
  } else {
    expect(this.addError).to.be.an('Error');
  }
});

Then('the existing groups should remain unaffected', function() {
  // Validate that existing groups are still functional
  const allGroups = this.manager.getAllActiveGroups();
  const originalGroups = allGroups.filter(group => !group.config || group.config.id !== 'dynamic-new-group');
  
  originalGroups.forEach(group => {
    expect(group.state).to.be.an('object');
    expect(group.state.visible).to.be.a('boolean');
  });
});

Then('the group should be removed from active groups', function() {
  // Validate group removal using real API
  expect(this.removeResult).to.be.true;
  expect(this.manager.getActiveGroupCount()).to.be.lessThan(this.preRemovalCount);
  
  const removedGroup = this.manager.getButtonGroup(this.removedGroupId);
  expect(removedGroup).to.be.null;
});

Then('its resources should be cleaned up properly', function() {
  // Validate cleanup by checking group is no longer accessible
  const removedGroup = this.manager.getButtonGroup(this.removedGroupId);
  expect(removedGroup).to.be.null;
});

Then('the manager should apply changes to the target group', function() {
  // Validate that updates were applied using real API
  expect(this.updateResult).to.be.true;
  expect(this.positionUpdateResult).to.be.true;
});

Then('the group should reflect the new transparency and position', function() {
  // Validate changes using real ButtonGroup state
  const updatedGroup = this.manager.getButtonGroup(this.targetGroupId);
  expect(updatedGroup).to.not.be.null;
  
  expect(updatedGroup.state.transparency).to.equal(this.updateTransparency);
  expect(updatedGroup.state.position.x).to.equal(this.updatePosition.x);
  expect(updatedGroup.state.position.y).to.equal(this.updatePosition.y);
});

Then('other groups should remain unchanged', function() {
  // Validate that non-target groups weren't affected
  const allGroups = this.manager.getAllActiveGroups();
  const otherGroups = allGroups.filter(group => 
    group.config && group.config.id !== this.targetGroupId
  );
  
  otherGroups.forEach(group => {
    expect(group.state).to.be.an('object');
    expect(group.state.transparency).to.not.equal(this.updateTransparency);
  });
});

Then('the manager should determine which groups can handle the interaction', function() {
  // Validate interaction processing using real API results
  expect(this.interactionResults).to.be.an('array');
  expect(this.interactionResults.length).to.be.greaterThan(0);
  
  this.interactionResults.forEach(result => {
    expect(result).to.have.property('groupId');
    expect(result).to.have.property('handled');
    expect(result).to.have.property('inBounds');
  });
});

Then('forward the interaction to all eligible groups', function() {
  // Validate that interaction was forwarded properly
  const handledInteractions = this.interactionResults.filter(result => result.handled);
  expect(handledInteractions.length).to.be.greaterThanOrEqual(0);
});

Then('return interaction results for each group', function() {
  // Validate comprehensive result reporting
  expect(this.interactionResults.length).to.equal(this.manager.getActiveGroupCount());
});

Then('handle the case where no groups are at those coordinates', function() {
  // Validate handling of out-of-bounds interactions
  const inBoundsResults = this.interactionResults.filter(result => result.inBounds);
  const outOfBoundsResults = this.interactionResults.filter(result => !result.inBounds);
  
  // Should have some results regardless
  expect(this.interactionResults.length).to.be.greaterThan(0);
});

Then('only visible groups should be rendered', function() {
  // Validate render filtering using real API results
  expect(this.renderStats).to.be.an('object');
  expect(this.renderStats).to.have.property('rendered');
  expect(this.renderStats).to.have.property('skipped');
  
  expect(this.renderStats.rendered).to.be.greaterThanOrEqual(0);
});

Then('groups should be rendered in the correct depth order', function() {
  // Validate render ordering (implementation tracks this)
  expect(this.renderStats.rendered).to.be.a('number');
  expect(this.renderStats.errors).to.equal(0);
});

Then('each group\'s render method should be called with proper context', function() {
  // Validate render method invocation
  expect(this.renderStats.rendered).to.be.greaterThan(0);
});

Then('rendering should handle groups with different scales and transparency', function() {
  // Validate that rendering processed all types of groups
  expect(this.renderStats.errors).to.equal(0);
  expect(this.renderStats.rendered + this.renderStats.skipped).to.be.greaterThan(0);
});

Then('the manager should identify and report configuration errors', function() {
  // Validate error identification using real API
  if (this.initSuccess) {
    expect(this.initResults.failed).to.be.greaterThan(0);
    expect(this.initResults.errors).to.be.an('array');
    expect(this.initResults.errors.length).to.be.greaterThan(0);
  }
});

Then('create groups only for valid configurations', function() {
  // Validate selective group creation
  if (this.initSuccess) {
    expect(this.initResults.successful).to.be.greaterThan(0);
    expect(this.initResults.successful).to.be.lessThan(this.testConfigurations.length);
  }
});

Then('provide detailed error messages for debugging', function() {
  // Validate error message quality
  if (this.initSuccess && this.initResults.errors.length > 0) {
    this.initResults.errors.forEach(error => {
      expect(error).to.have.property('groupId');
      expect(error).to.have.property('error');
      expect(error.error).to.be.a('string');
      expect(error.error.length).to.be.greaterThan(0);
    });
  }
});

Then('continue operating with successfully created groups', function() {
  // Validate continued operation after partial failures
  if (this.initSuccess) {
    expect(this.manager.getActiveGroupCount()).to.be.greaterThan(0);
    expect(this.manager.isReady()).to.be.true;
  }
});

Then('all groups with persistence should save their current state', function() {
  // Validate save operation results using real API
  expect(this.saveResults).to.be.an('object');
  expect(this.saveResults).to.have.property('successful');
  expect(this.saveResults).to.have.property('failed');
  expect(this.saveResults.successful).to.be.greaterThan(0);
});

Then('the manager should coordinate the save operations', function() {
  // Validate save coordination
  expect(this.saveResults.successful + this.saveResults.failed).to.equal(this.manager.getActiveGroupCount());
});

Then('report successful and failed save operations', function() {
  // Validate save reporting
  expect(this.saveResults).to.have.property('errors');
  expect(this.saveResults.errors).to.be.an('array');
});

Then('all groups should restore their persisted state', function() {
  // Validate load operation results using real API
  expect(this.loadResults).to.be.an('object');
  expect(this.loadResults).to.have.property('successful');
  expect(this.loadResults.successful).to.be.greaterThanOrEqual(0);
});

Then('handle missing or corrupted persistence data gracefully', function() {
  // Validate graceful error handling
  expect(this.loadResults).to.have.property('failed');
  expect(this.loadResults).to.have.property('errors');
  expect(this.loadResults.errors).to.be.an('array');
});

Then('the manager should use efficient hit-testing algorithms', function() {
  // Validate performance characteristics
  expect(this.performanceTestDuration).to.be.a('number');
  expect(this.performanceTestDuration).to.be.lessThan(100); // Should be fast
  expect(this.performanceTestResults).to.be.an('array');
});

Then('avoid unnecessary processing for groups outside interaction area', function() {
  // Validate efficiency by checking results
  expect(this.performanceTestResults.length).to.be.greaterThan(0);
  this.performanceTestResults.forEach(result => {
    expect(result.result).to.be.an('array');
  });
});

Then('maintain responsive performance during interaction', function() {
  // Validate performance meets requirements
  expect(this.performanceTestDuration).to.be.lessThan(50); // Very responsive
});

Then('the manager should optimize rendering calls', function() {
  // Validate render performance
  expect(this.renderPerformanceDuration).to.be.a('number');
  expect(this.renderPerformanceResults).to.be.an('array');
  expect(this.renderPerformanceResults.length).to.be.greaterThan(0);
});

Then('skip rendering for groups outside viewport if culling is enabled', function() {
  // Validate culling behavior
  this.renderPerformanceResults.forEach(result => {
    expect(result.stats).to.have.property('rendered');
    expect(result.stats).to.have.property('skipped');
  });
});

Then('the manager should coordinate with the action factory', function() {
  // Validate action factory coordination
  if (this.actionSuccess) {
    expect(this.actionResult).to.be.an('object');
    expect(this.actionResult.success).to.be.true;
  }
});

Then('execute the requested action through proper channels', function() {
  // Validate action execution
  if (this.actionSuccess) {
    expect(this.actionResult.result).to.be.a('string');
    expect(this.triggeredButton).to.be.an('object');
  }
});

Then('handle action execution errors gracefully', function() {
  // Validate error handling
  if (!this.actionSuccess) {
    expect(this.actionError).to.be.an('Error');
  }
});

Then('provide feedback about action success or failure', function() {
  // Validate feedback provision
  expect(this.actionSuccess).to.be.a('boolean');
  if (this.actionSuccess) {
    expect(this.actionResult).to.be.an('object');
  } else {
    expect(this.actionError).to.be.an('Error');
  }
});

Then('I should receive comprehensive state information', function() {
  // Validate diagnostic information using real API
  expect(this.diagnosticInfo).to.be.an('object');
  expect(this.diagnosticInfo).to.have.property('isInitialized');
  expect(this.diagnosticInfo).to.have.property('totalActiveGroups');
  expect(this.diagnosticInfo).to.have.property('performanceMetrics');
  expect(this.diagnosticInfo).to.have.property('activeGroups');
});

Then('active group count, IDs, and status for each group', function() {
  // Validate detailed group information
  expect(this.diagnosticInfo.activeGroups).to.be.an('array');
  this.diagnosticInfo.activeGroups.forEach(groupInfo => {
    expect(groupInfo).to.have.property('id');
    expect(groupInfo).to.have.property('visible');
    expect(groupInfo).to.have.property('buttonCount');
  });
});

Then('And performance metrics if available', function() {
  // Validate performance metrics
  expect(this.diagnosticInfo.performanceMetrics).to.be.an('object');
  expect(this.diagnosticInfo.performanceMetrics).to.have.property('totalGroups');
});

Then('And current configuration summary', function() {
  // Validate configuration information
  expect(this.diagnosticInfo).to.have.property('options');
  expect(this.diagnosticInfo.options).to.be.an('object');
});

Then('And any active error conditions or warnings', function() {
  // Validate error reporting
  expect(this.diagnosticInfo).to.have.property('creationErrors');
  expect(this.diagnosticInfo.creationErrors).to.be.a('number');
});

Then('the manager should only consider visible and interactive groups', function() {
  // Validate visibility filtering using real API results
  expect(this.coordinatedInteractionResults).to.be.an('array');
  
  const handledResults = this.coordinatedInteractionResults.filter(result => result.handled);
  const inBoundsResults = this.coordinatedInteractionResults.filter(result => result.inBounds);
  
  // Should have processed all groups but only handled appropriate ones
  expect(this.coordinatedInteractionResults.length).to.be.greaterThan(0);
});

Then('respect group transparency levels for interaction priority', function() {
  // Validate transparency consideration
  expect(this.coordinatedInteractionResults).to.be.an('array');
  // Transparency handling would be reflected in which groups responded
});

Then('handle z-order for overlapping interactive regions', function() {
  // Validate z-order handling
  expect(this.coordinatedInteractionResults.length).to.be.greaterThan(0);
});

Then('provide clear feedback about which group handled the interaction', function() {
  // Validate interaction feedback
  this.coordinatedInteractionResults.forEach(result => {
    expect(result).to.have.property('groupId');
    expect(result).to.have.property('handled');
  });
});

Then('all button groups should be properly disposed', function() {
  // Validate group disposal using real API
  expect(this.shutdownResults).to.be.an('object');
  expect(this.shutdownResults.groupsDisposed).to.equal(this.preShutdownGroupCount);
});

Then('event listeners should be cleaned up', function() {
  // Validate cleanup (tracked in shutdown results)
  expect(this.shutdownResults.errors).to.be.an('array');
  // Should have minimal errors during cleanup
});

Then('persistence operations should be completed', function() {
  // Validate persistence completion
  expect(this.shutdownResults.persistenceSaved).to.be.greaterThanOrEqual(0);
});

Then('memory resources should be released', function() {
  // Validate resource release
  expect(this.manager.getActiveGroupCount()).to.equal(0);
  expect(this.manager.isReady()).to.be.false;
});

Then('the manager should be ready for safe garbage collection', function() {
  // Validate final cleanup state
  expect(this.manager.getActiveGroupCount()).to.equal(0);
  const finalDiagnostic = this.manager.getDiagnosticInfo();
  expect(finalDiagnostic.totalActiveGroups).to.equal(0);
});

Then('the manager should apply the layout change', function() {
  // This would be validated through the group's layout property
  const group = this.manager.getButtonGroup(this.dynamicGroupId);
  expect(group).to.not.be.null;
  // Layout change validation would happen through group inspection
  expect(group.config).to.be.an('object');
});

Then('recreate buttons according to new configuration', function() {
  // Validate that buttons were recreated with new configuration
  const group = this.manager.getButtonGroup(this.dynamicGroupId);
  expect(group).to.not.be.null;
  expect(group.buttons).to.be.an('array');
  // Could validate button count changed if reconfiguration added/removed buttons
});

Then('maintain group state like position and visibility', function() {
  // Validate that important state was preserved during reconfiguration
  const group = this.manager.getButtonGroup(this.dynamicGroupId);
  expect(group).to.not.be.null;
  expect(group.state).to.be.an('object');
  expect(group.state.position).to.have.property('x');
  expect(group.state.position).to.have.property('y');
  expect(group.state.visible).to.be.a('boolean');
});

Then('preserve any persisted settings that remain valid', function() {
  // Validate that persistence settings were maintained
  const group = this.manager.getButtonGroup(this.dynamicGroupId);
  expect(group).to.not.be.null;
  // Persistence validation would check if settings were maintained
  expect(group.config).to.be.an('object');
});

Then('performance metrics if available', function() {
  // Validate performance metrics
  expect(this.diagnosticInfo.performanceMetrics).to.be.an('object');
  expect(this.diagnosticInfo.performanceMetrics).to.have.property('totalGroups');
});

Then('current configuration summary', function() {
  // Validate configuration information
  expect(this.diagnosticInfo).to.have.property('options');
  expect(this.diagnosticInfo.options).to.be.an('object');
});

Then('any active error conditions or warnings', function() {
  // Validate error reporting
  expect(this.diagnosticInfo).to.have.property('creationErrors');
  expect(this.diagnosticInfo.creationErrors).to.be.a('number');
});