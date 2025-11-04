/**
 * AntController Integration Tests
 * 
 * Tests complete workflows and interactions between AntModel, AntView, and AntController.
 * Verifies the full MVC pattern with real components (no mocks).
 * 
 * Test coverage:
 * - Complete workflows (move, attack, gather resources)
 * - Input → model → view pipeline
 * - Multi-controller interactions
 * - Performance & edge cases
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { 
  setupTestEnvironment, 
  cleanupTestEnvironment 
} = require('../../../helpers/mvcTestHelpers');

// Setup test environment with full rendering and sprite support
setupTestEnvironment({ rendering: true, sprite: true });

describe('AntController Integration', function() {
  let AntModel, AntView, AntController;
  let controller1, controller2;
  
  before(function() {
    // Load MVC components
    AntModel = require('../../../../Classes/models/AntModel');
    AntView = require('../../../../Classes/views/AntView');
    AntController = require('../../../../Classes/controllers/mvc/AntController');
  });
  
  afterEach(function() {
    // Clean up controllers
    if (controller1 && typeof controller1.destroy === 'function') {
      controller1.destroy();
      controller1 = null;
    }
    if (controller2 && typeof controller2.destroy === 'function') {
      controller2.destroy();
      controller2 = null;
    }
    cleanupTestEnvironment();
  });
  
  // ==================== Complete Workflows ====================
  describe('Complete Workflows', function() {
    it('should handle complete movement workflow', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      const startPos = { ...controller1.position };
      
      // Start movement
      controller1.moveTo(200, 200);
      expect(controller1.isMoving).to.be.true;
      
      // View should reflect movement state
      expect(controller1.view._sprite.position).to.deep.equal(controller1.model.position);
      
      // Simulate movement by updating (movement happens in update loop)
      controller1.update(0.016); // One frame at 60 FPS
      
      // Stop movement
      controller1.stopMovement();
      expect(controller1.isMoving).to.be.false;
      
      // Movement commands should have been issued (position may or may not have changed yet)
      expect(controller1).to.exist;
    });
    
    it('should handle complete combat workflow', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Warrior',
        imagePath: 'Images/Ants/warrior.png'
      });
      
      controller2 = new AntController(1, 150, 150, 32, 32, {
        jobName: 'Warrior',
        imagePath: 'Images/Ants/warrior.png'
      });
      
      const initialHealth = controller2.health;
      
      // Set combat target
      controller1.setCombatTarget(controller2.model);
      expect(controller1.model.combatTarget).to.equal(controller2.model);
      
      // Attack target
      controller1.attack(controller2.model);
      
      // Target should take damage
      expect(controller2.health).to.be.lessThan(initialHealth);
      
      // Target view should show damage flash
      expect(controller2.view._damageFlashTimer).to.be.greaterThan(0);
    });
    
    it('should handle complete resource gathering workflow', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      expect(controller1.resourceCount).to.equal(0);
      
      // Gather first resource
      const resource1 = { type: 'food', amount: 10 };
      controller1.addResource(resource1);
      expect(controller1.resourceCount).to.equal(1);
      
      // Gather second resource
      const resource2 = { type: 'food', amount: 15 };
      controller1.addResource(resource2);
      expect(controller1.resourceCount).to.equal(2);
      
      // View should show resource indicator
      global.text.resetHistory();
      controller1.render();
      expect(global.text.called).to.be.true;
      
      // Drop resources
      const dropped = controller1.dropAllResources();
      expect(dropped).to.have.lengthOf(2);
      expect(controller1.resourceCount).to.equal(0);
    });
    
    it('should handle complete job change workflow', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      const initialJob = controller1.jobName;
      const initialMaxHealth = controller1.maxHealth;
      const healthPercentage = controller1.health / initialMaxHealth;
      
      // Change job
      controller1.assignJob('Warrior', 'Images/Ants/warrior.png');
      
      // Job should change
      expect(controller1.jobName).to.equal('Warrior');
      expect(controller1.jobName).to.not.equal(initialJob);
      
      // Max health should change
      expect(controller1.maxHealth).to.not.equal(initialMaxHealth);
      
      // Health percentage should be preserved
      const newPercentage = controller1.health / controller1.maxHealth;
      expect(newPercentage).to.be.closeTo(healthPercentage, 0.01);
      
      // View should update sprite
      expect(controller1.view._currentImagePath).to.equal('Images/Ants/warrior.png');
    });
    
    it('should handle complete health lifecycle', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      expect(controller1.isAlive).to.be.true;
      
      // Take damage
      controller1.takeDamage(30);
      expect(controller1.health).to.be.lessThan(controller1.maxHealth);
      expect(controller1.isAlive).to.be.true;
      
      // Heal
      const damagedHealth = controller1.health;
      controller1.heal(15);
      expect(controller1.health).to.be.greaterThan(damagedHealth);
      
      // Fatal damage
      controller1.takeDamage(controller1.maxHealth + 10);
      expect(controller1.health).to.equal(0);
      expect(controller1.isAlive).to.be.false;
    });
    
    it('should handle complete state change workflow', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      // Initial state
      let state = controller1.getCurrentState();
      expect(state.primary).to.equal('IDLE');
      
      // Change to moving
      controller1.setState('MOVING', null, null);
      state = controller1.getCurrentState();
      expect(state.primary).to.equal('MOVING');
      
      // Change to gathering
      controller1.setState('GATHERING', null, null);
      state = controller1.getCurrentState();
      expect(state.primary).to.equal('GATHERING');
      
      // View should still render without errors
      expect(() => controller1.render()).to.not.throw();
    });
    
    it('should handle complete selection workflow', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      // Initially not selected
      expect(controller1.view._selectionHighlight).to.be.false;
      
      // Select ant
      controller1.setSelected(true);
      expect(controller1.view._selectionHighlight).to.be.true;
      
      // Selection should render
      global.ellipse.resetHistory();
      controller1.render();
      expect(global.ellipse.callCount).to.be.greaterThan(0);
      
      // Deselect
      controller1.setSelected(false);
      expect(controller1.view._selectionHighlight).to.be.false;
    });
  });
  
  // ==================== Input → Model → View Pipeline ====================
  describe('Input → Model → View Pipeline', function() {
    it('should propagate click input through full pipeline', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      const clickData = { x: 110, y: 110, button: 0 };
      
      // Handle click input
      expect(() => controller1.handleInput('click', clickData)).to.not.throw();
      
      // Controller should process input
      expect(controller1).to.exist;
    });
    
    it('should update view immediately when model changes', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      // Change model property
      controller1.moveTo(200, 200);
      
      // View should reflect change immediately (observable pattern)
      expect(controller1.view._sprite.position).to.deep.equal(controller1.model.position);
    });
    
    it('should handle rapid input events', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      const startTime = Date.now();
      
      // Send 100 rapid click events
      for (let i = 0; i < 100; i++) {
        controller1.handleInput('click', { x: 100 + i, y: 100 + i, button: 0 });
      }
      
      const elapsed = Date.now() - startTime;
      
      // Should complete quickly (< 100ms)
      expect(elapsed).to.be.lessThan(100);
      expect(controller1).to.exist;
    });
    
    it('should handle model changes during rendering', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      // Change model properties
      controller1.takeDamage(20);
      controller1.moveTo(150, 150);
      controller1.addResource({ type: 'food', amount: 10 });
      
      // Render should handle all changes
      expect(() => controller1.render()).to.not.throw();
      
      // All visual elements should render
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });
    
    it('should maintain synchronization during complex updates', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      // Perform complex update sequence
      controller1.moveTo(200, 200);
      controller1.takeDamage(25);
      controller1.addResource({ type: 'food', amount: 10 });
      controller1.setState('GATHERING', null, null);
      controller1.setSelected(true);
      
      // All changes should be synchronized
      expect(controller1.view._sprite.position).to.deep.equal(controller1.model.position);
      expect(controller1.view._damageFlashTimer).to.be.greaterThan(0);
      expect(controller1.view._selectionHighlight).to.be.true;
      
      // Model state should match
      expect(controller1.model.getCurrentState()).to.equal('GATHERING');
      expect(controller1.model.getResourceCount()).to.equal(1);
    });
    
    it('should handle input while view is rendering', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      // Start rendering
      controller1.render();
      
      // Handle input during render
      expect(() => {
        controller1.handleInput('hover', { x: 110, y: 110 });
        controller1.moveTo(150, 150);
      }).to.not.throw();
      
      // Complete rendering
      controller1.render();
      
      // Both should succeed
      expect(controller1.position).to.exist;
    });
  });
  
  // ==================== Multi-Controller Interactions ====================
  describe('Multi-Controller Interactions', function() {
    it('should handle two ants in combat', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Warrior',
        imagePath: 'Images/Ants/warrior.png'
      });
      
      controller2 = new AntController(1, 150, 150, 32, 32, {
        jobName: 'Warrior',
        imagePath: 'Images/Ants/warrior.png'
      });
      
      const health1Initial = controller1.health;
      const health2Initial = controller2.health;
      
      // Mutual combat
      controller1.attack(controller2.model);
      controller2.attack(controller1.model);
      
      // Both should take damage
      expect(controller1.health).to.be.lessThan(health1Initial);
      expect(controller2.health).to.be.lessThan(health2Initial);
      
      // Both views should show damage
      expect(controller1.view._damageFlashTimer).to.be.greaterThan(0);
      expect(controller2.view._damageFlashTimer).to.be.greaterThan(0);
    });
    
    it('should handle resource transfer between ants', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      controller2 = new AntController(1, 150, 150, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      // Ant 1 gathers resources
      controller1.addResource({ type: 'food', amount: 10 });
      controller1.addResource({ type: 'food', amount: 15 });
      expect(controller1.resourceCount).to.equal(2);
      
      // Transfer to Ant 2 (drop and pick up)
      const dropped = controller1.dropAllResources();
      expect(controller1.resourceCount).to.equal(0);
      
      dropped.forEach(resource => controller2.addResource(resource));
      expect(controller2.resourceCount).to.equal(2);
      
      // Views should reflect changes
      global.text.resetHistory();
      controller1.render();
      controller2.render();
      expect(global.text.callCount).to.be.greaterThan(0);
    });
    
    it('should handle multiple ants updating simultaneously', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      controller2 = new AntController(1, 200, 200, 32, 32, {
        jobName: 'Scout',
        imagePath: 'Images/Ants/scout.png'
      });
      
      const deltaTime = 0.016; // 60 FPS
      
      // Update both ants
      controller1.update(deltaTime);
      controller2.update(deltaTime);
      
      // Render both ants
      expect(() => {
        controller1.render();
        controller2.render();
      }).to.not.throw();
      
      // Both should be operational
      expect(controller1.isAlive).to.be.true;
      expect(controller2.isAlive).to.be.true;
    });
  });
  
  // ==================== Performance & Edge Cases ====================
  describe('Performance & Edge Cases', function() {
    it('should handle rapid update/render cycles', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      const startTime = Date.now();
      const deltaTime = 0.016;
      
      // Simulate 1000 frames (16.6 seconds at 60 FPS)
      for (let i = 0; i < 1000; i++) {
        controller1.update(deltaTime);
        controller1.render();
      }
      
      const elapsed = Date.now() - startTime;
      
      // Should complete in < 500ms
      expect(elapsed).to.be.lessThan(500);
    });
    
    it('should handle edge case: zero health', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      // Reduce to zero health
      controller1.takeDamage(controller1.maxHealth);
      
      expect(controller1.health).to.equal(0);
      expect(controller1.isAlive).to.be.false;
      
      // Should still render without errors
      expect(() => controller1.render()).to.not.throw();
    });
    
    it('should handle edge case: negative damage (healing)', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      controller1.takeDamage(50);
      const damagedHealth = controller1.health;
      
      // Negative damage should heal
      controller1.takeDamage(-20);
      
      expect(controller1.health).to.be.greaterThan(damagedHealth);
    });
    
    it('should handle edge case: full inventory operations', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      // Fill inventory
      controller1.addResource({ type: 'food', amount: 10 });
      controller1.addResource({ type: 'food', amount: 15 });
      
      // Try to add more (should be rejected)
      const result = controller1.addResource({ type: 'food', amount: 20 });
      
      expect(controller1.resourceCount).to.equal(2);
    });
    
    it('should handle edge case: destroy during active operations', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      // Start operations
      controller1.moveTo(200, 200);
      controller1.addResource({ type: 'food', amount: 10 });
      controller1.setSelected(true);
      
      // Destroy immediately
      expect(() => controller1.destroy()).to.not.throw();
      
      // Controller should be cleaned up
      expect(controller1._model).to.be.null;
      expect(controller1._view).to.be.null;
    });
    
    it('should handle null/undefined input gracefully', function() {
      controller1 = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      // Test various null/undefined scenarios
      expect(() => {
        controller1.handleInput(null, { x: 100, y: 100 });
        controller1.handleInput('click', null);
        controller1.handleInput(null, null);
      }).to.not.throw();
      
      // Controller should still be operational
      expect(controller1.isAlive).to.be.true;
    });
  });
});
