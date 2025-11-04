/**
 * AntView Integration Tests
 * 
 * Tests for AntView + AntModel integration (Phase 3.2)
 * Verifies complete model-view workflow with real components
 * 
 * Test coverage:
 * - Model-View integration
 * - Real-time model change reactions
 * - Complete rendering pipeline
 * - Observable pattern workflow
 * - Resource system integration
 * - Visual state synchronization
 */

const { expect } = require('chai');
const { 
  setupTestEnvironment, 
  cleanupTestEnvironment 
} = require('../../helpers/mvcTestHelpers');

// Setup test environment with rendering and sprite support
setupTestEnvironment({ rendering: true, sprite: true });

describe('AntView Integration Tests', function() {
  let AntModel, AntView;
  let model, view;
  
  before(function() {
    // Load real classes
    AntModel = require('../../../Classes/models/AntModel');
    AntView = require('../../../Classes/views/AntView');
  });
  
  afterEach(function() {
    if (view && typeof view.destroy === 'function') {
      view.destroy();
    }
    cleanupTestEnvironment();
  });
  
  // ==================== Model-View Integration ====================
  describe('Model-View Integration', function() {
    it('should create view from model with synchronized state', function() {
      model = new AntModel(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      view = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
      
      // View should reflect model state
      expect(view.model).to.equal(model);
      expect(view._sprite.position).to.deep.equal(model.position);
      expect(view._sprite.size).to.deep.equal(model.size);
    });
    
    it('should maintain view state when model is updated', function() {
      model = new AntModel(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      view = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
      
      // Update model
      model.setPosition(200, 300);
      model.takeDamage(25);
      model.setRotation(Math.PI / 2);
      
      // View should reflect all changes
      expect(view._sprite.position).to.deep.equal({ x: 200, y: 300 });
      expect(view._sprite.rotation).to.equal(Math.PI / 2);
      expect(view._damageFlashTimer).to.be.greaterThan(0);
    });
    
    it('should handle multiple model updates in sequence', function() {
      model = new AntModel(0, 100, 100, 32, 32, {
        jobName: 'Scout',
        imagePath: 'Images/Ants/scout.png'
      });
      view = new AntView(model, { imagePath: 'Images/Ants/scout.png' });
      
      // Rapid updates
      for (let i = 0; i < 10; i++) {
        model.setPosition(100 + i * 10, 100 + i * 10);
      }
      
      // View should reflect final position
      expect(view._sprite.position).to.deep.equal({ x: 190, y: 190 });
    });
    
    it('should handle job change with complete state sync', function() {
      model = new AntModel(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      view = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
      
      const initialMaxHealth = model.maxHealth;
      
      // Change job
      model.assignJob('Warrior', 'Images/Ants/warrior.png');
      
      // View should update sprite
      expect(view._currentImagePath).to.equal('Images/Ants/warrior.png');
      expect(view._sprite.imagePath).to.equal('Images/Ants/warrior.png');
      
      // Model health should change (Warrior has different stats)
      expect(model.maxHealth).to.not.equal(initialMaxHealth);
    });
  });
  
  // ==================== Real-Time Model Change Reactions ====================
  describe('Real-Time Model Change Reactions', function() {
    beforeEach(function() {
      model = new AntModel(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      view = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should immediately update sprite position when model moves', function() {
      const newPos = { x: 250, y: 350 };
      
      model.setPosition(newPos.x, newPos.y);
      
      // Sprite should update immediately (synchronous)
      expect(view._sprite.position).to.deep.equal(newPos);
    });
    
    it('should immediately trigger damage flash when model takes damage', function() {
      expect(view._damageFlashTimer).to.equal(0);
      
      model.takeDamage(30);
      
      // Flash should activate immediately
      expect(view._damageFlashTimer).to.be.greaterThan(0);
    });
    
    it('should update sprite rotation in real-time', function() {
      const newRotation = Math.PI;
      
      model.setRotation(newRotation);
      
      // Rotation should update immediately
      expect(view._sprite.rotation).to.equal(newRotation);
    });
    
    it('should handle rapid model changes without lag', function() {
      const startTime = Date.now();
      
      // Simulate rapid gameplay updates
      for (let i = 0; i < 100; i++) {
        model.setPosition(100 + i, 100 + i);
        model.setRotation(i * 0.1);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete rapidly (< 100ms for 100 updates)
      expect(duration).to.be.lessThan(100);
      
      // View should reflect final state
      expect(view._sprite.position.x).to.equal(199);
      expect(view._sprite.rotation).to.be.closeTo(9.9, 0.01);
    });
  });
  
  // ==================== Complete Rendering Pipeline ====================
  describe('Complete Rendering Pipeline', function() {
    beforeEach(function() {
      model = new AntModel(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      view = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should render all components in correct order', function() {
      global.push.resetHistory();
      global.pop.resetHistory();
      
      view.render();
      
      // push/pop should be called (for transform stack)
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });
    
    it('should render health bar based on current model health', function() {
      const halfDamage = model.maxHealth / 2;
      model.takeDamage(halfDamage);
      
      global.rect.resetHistory();
      view.render();
      
      // Health bar should render (rect calls)
      expect(global.rect.callCount).to.be.greaterThan(0);
    });
    
    it('should render selection highlight when model is conceptually selected', function() {
      view.setSelectionHighlight(true);
      
      global.ellipse.resetHistory();
      view.render();
      
      // Selection highlight should render
      expect(global.ellipse.callCount).to.be.greaterThan(0);
    });
    
    it('should render resource indicator when model has resources', function() {
      const resource = { type: 'food', amount: 10 };
      model.addResource(resource);
      
      global.text.resetHistory();
      view.render();
      
      // Resource count should render
      expect(global.text.callCount).to.be.greaterThan(0);
    });
    
    it('should apply damage flash tint during flash period', function() {
      model.takeDamage(25); // Trigger flash
      
      global.tint.resetHistory();
      view.render();
      
      // Red tint should be applied
      expect(global.tint.callCount).to.be.greaterThan(0);
    });
  });
  
  // ==================== Observable Pattern Workflow ====================
  describe('Observable Pattern Workflow', function() {
    beforeEach(function() {
      model = new AntModel(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      view = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should receive notification when model position changes', function() {
      const initialPosition = { ...view._sprite.position };
      
      model.setPosition(150, 250);
      
      // View should update sprite position (notification received and processed)
      expect(view._sprite.position).to.not.deep.equal(initialPosition);
      expect(view._sprite.position).to.deep.equal({ x: 150, y: 250 });
    });
    
    it('should receive notification when model health changes', function() {
      expect(view._damageFlashTimer).to.equal(0);
      
      model.takeDamage(20);
      
      // View should activate damage flash (notification received and processed)
      expect(view._damageFlashTimer).to.be.greaterThan(0);
    });
    
    it('should receive notification when model job changes', function() {
      const initialImagePath = view._currentImagePath;
      
      model.assignJob('Scout', 'Images/Ants/scout.png');
      
      // View should update sprite image (notification received and processed)
      expect(view._currentImagePath).to.not.equal(initialImagePath);
      expect(view._currentImagePath).to.equal('Images/Ants/scout.png');
    });
    
    it('should stop receiving notifications after destroy', function() {
      const initialListenerCount = model._changeListeners.length;
      
      view.destroy();
      
      // Listener should be removed
      expect(model._changeListeners.length).to.be.lessThan(initialListenerCount);
      
      // Further changes should not affect destroyed view
      model.setPosition(999, 999);
      
      // Sprite should be null (destroyed)
      expect(view._sprite).to.be.null;
    });
  });
  
  // ==================== Resource System Integration ====================
  describe('Resource System Integration', function() {
    beforeEach(function() {
      model = new AntModel(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      view = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should show resource indicator when ant collects resource', function() {
      expect(model.getResourceCount()).to.equal(0);
      
      const resource = { type: 'food', amount: 10 };
      model.addResource(resource);
      
      global.text.resetHistory();
      view.render();
      
      // Resource indicator should render
      expect(global.text.callCount).to.be.greaterThan(0);
      expect(model.getResourceCount()).to.equal(1);
    });
    
    it('should update indicator when resources are added/removed', function() {
      const resource1 = { type: 'food', amount: 10 };
      const resource2 = { type: 'food', amount: 10 };
      
      // Add resources
      model.addResource(resource1);
      model.addResource(resource2);
      expect(model.getResourceCount()).to.equal(2);
      
      // Remove one
      model.removeResource(1);
      expect(model.getResourceCount()).to.equal(1);
      
      global.text.resetHistory();
      view.render();
      
      // Indicator should show updated count
      expect(global.text.callCount).to.be.greaterThan(0);
    });
    
    it('should show full inventory indicator when at capacity', function() {
      const resource1 = { type: 'food', amount: 10 };
      const resource2 = { type: 'food', amount: 10 };
      
      model.addResource(resource1);
      model.addResource(resource2);
      
      expect(model.getResourceCount()).to.equal(model.getMaxResources());
      
      global.fill.resetHistory();
      view.render();
      
      // Full indicator should use different color (fill calls)
      expect(global.fill.callCount).to.be.greaterThan(0);
    });
    
    it('should hide indicator after dropping all resources', function() {
      const resource = { type: 'food', amount: 10 };
      model.addResource(resource);
      
      global.text.resetHistory();
      view.render();
      const withResourcesCalls = global.text.callCount;
      
      // Drop all resources
      model.dropAllResources();
      
      global.text.resetHistory();
      view.render();
      const withoutResourcesCalls = global.text.callCount;
      
      // Indicator should not render when no resources
      expect(withoutResourcesCalls).to.be.lessThan(withResourcesCalls);
    });
  });
  
  // ==================== Visual State Synchronization ====================
  describe('Visual State Synchronization', function() {
    beforeEach(function() {
      model = new AntModel(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      view = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should keep sprite position synchronized with model', function() {
      const positions = [
        { x: 100, y: 100 },
        { x: 150, y: 150 },
        { x: 200, y: 200 },
        { x: 250, y: 250 }
      ];
      
      positions.forEach(pos => {
        model.setPosition(pos.x, pos.y);
        expect(view._sprite.position).to.deep.equal(pos);
      });
    });
    
    it('should keep damage flash synchronized with health changes', function() {
      // No flash initially
      expect(view._damageFlashTimer).to.equal(0);
      
      // Take damage
      model.takeDamage(10);
      expect(view._damageFlashTimer).to.be.greaterThan(0);
      
      // Flash decreases over time
      const initialTimer = view._damageFlashTimer;
      view._updateDamageFlash(0.1);
      expect(view._damageFlashTimer).to.be.lessThan(initialTimer);
      
      // Flash stops
      view._updateDamageFlash(1.0);
      expect(view._damageFlashTimer).to.equal(0);
    });
    
    it('should synchronize sprite image with job changes', function() {
      const jobs = [
        { name: 'Worker', image: 'Images/Ants/worker.png' },
        { name: 'Scout', image: 'Images/Ants/scout.png' },
        { name: 'Warrior', image: 'Images/Ants/warrior.png' }
      ];
      
      jobs.forEach(job => {
        model.assignJob(job.name, job.image);
        expect(view._currentImagePath).to.equal(job.image);
        expect(view._sprite.imagePath).to.equal(job.image);
      });
    });
    
    it('should maintain view state consistency during complex model updates', function() {
      // Simulate complex gameplay scenario
      model.setPosition(150, 150);
      model.takeDamage(30);
      model.addResource({ type: 'food', amount: 10 });
      model.assignJob('Scout', 'Images/Ants/scout.png'); // Job change creates new sprite
      model.setRotation(Math.PI / 4); // Set rotation AFTER job change
      model.takeDamage(20);
      model.addResource({ type: 'food', amount: 10 });
      
      // View should reflect all changes
      expect(view._sprite.position).to.deep.equal({ x: 150, y: 150 });
      expect(view._sprite.rotation).to.equal(Math.PI / 4);
      expect(view._currentImagePath).to.equal('Images/Ants/scout.png');
      expect(view._damageFlashTimer).to.be.greaterThan(0);
      expect(model.getResourceCount()).to.equal(2);
      
      // Render should work without errors
      expect(() => view.render()).to.not.throw();
    });
  });
  
  // ==================== Performance & Edge Cases ====================
  describe('Performance & Edge Cases', function() {
    it('should handle rapid model updates efficiently', function() {
      model = new AntModel(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      view = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
      
      const startTime = Date.now();
      
      // 1000 rapid updates
      for (let i = 0; i < 1000; i++) {
        model.setPosition(100 + i, 100 + i);
      }
      
      const duration = Date.now() - startTime;
      
      // Should complete in reasonable time (< 500ms)
      expect(duration).to.be.lessThan(500);
    });
    
    it('should handle null/undefined model properties gracefully', function() {
      model = new AntModel(0, 0, 0, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      view = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
      
      // Render should not throw with edge case values
      expect(() => view.render()).to.not.throw();
    });
    
    it('should handle multiple views observing same model', function() {
      model = new AntModel(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      
      const view1 = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
      const view2 = new AntView(model, { imagePath: 'Images/Ants/worker.png' });
      
      // Both views should observe model
      expect(model._changeListeners.length).to.equal(2);
      
      // Update model
      model.setPosition(200, 300);
      
      // Both views should reflect change
      expect(view1._sprite.position).to.deep.equal({ x: 200, y: 300 });
      expect(view2._sprite.position).to.deep.equal({ x: 200, y: 300 });
      
      // Cleanup
      view1.destroy();
      view2.destroy();
    });
  });
});
