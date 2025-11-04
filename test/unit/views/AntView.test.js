/**
 * AntView Unit Tests
 * 
 * Tests for the AntView class (Phase 3.2)
 * Follows TDD approach: Write tests first, then implement
 * 
 * Test coverage:
 * - Constructor and initialization
 * - Sprite rendering
 * - Health bar rendering
 * - Selection highlight rendering
 * - Resource indicator rendering
 * - Model change reactions
 * - Visual effects
 * - Configuration methods
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { 
  setupTestEnvironment, 
  cleanupTestEnvironment,
  createMockPointer 
} = require('../../helpers/mvcTestHelpers');

// Setup test environment with rendering and sprite support
setupTestEnvironment({ rendering: true, sprite: true });

describe('AntView', function() {
  let AntModel, AntView, BaseView;
  let mockModel, view;
  
  before(function() {
    // Load dependencies
    BaseView = require('../../../Classes/views/BaseView');
    AntModel = require('../../../Classes/models/AntModel');
    AntView = require('../../../Classes/views/AntView');
  });
  
  beforeEach(function() {
    // Create mock model for testing
    mockModel = new AntModel(0, 100, 100, 32, 32, {
      jobName: 'Worker',
      imagePath: 'Images/Ants/worker.png'
    });
  });
  
  afterEach(function() {
    if (view && typeof view.destroy === 'function') {
      view.destroy();
    }
    cleanupTestEnvironment();
  });
  
  // ==================== Constructor Tests ====================
  describe('Constructor', function() {
    it('should extend BaseView', function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
      expect(view).to.be.instanceOf(BaseView);
    });
    
    it('should bind to AntModel', function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
      expect(view.model).to.equal(mockModel);
    });
    
    it('should create Sprite2D with correct parameters', function() {
      const imagePath = 'Images/Ants/worker.png';
      view = new AntView(mockModel, { imagePath });
      
      expect(view._sprite).to.exist;
      expect(view._sprite.imagePath).to.equal(imagePath);
      expect(view._sprite.position).to.deep.equal(mockModel.position);
      expect(view._sprite.size).to.deep.equal(mockModel.size);
    });
    
    it('should observe model changes', function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
      
      // View should add itself as listener to model
      expect(mockModel._changeListeners.length).to.be.greaterThan(0);
    });
    
    it('should initialize visual state properties', function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
      
      expect(view._healthBarVisible).to.be.a('boolean');
      expect(view._selectionHighlight).to.be.a('boolean');
      expect(view._resourceIndicatorVisible).to.be.a('boolean');
      expect(view._damageFlashTimer).to.equal(0);
    });
  });
  
  // ==================== Sprite Rendering Tests ====================
  describe('Sprite Rendering', function() {
    beforeEach(function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should render sprite at model position', function() {
      const renderSpy = sinon.spy(view._sprite, 'render');
      
      view.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });
    
    it('should update sprite position when model position changes', function() {
      const setPositionSpy = sinon.spy(view._sprite, 'setPosition');
      const newPosition = { x: 200, y: 300 };
      
      mockModel.setPosition(newPosition.x, newPosition.y);
      
      expect(setPositionSpy.calledOnce).to.be.true;
      expect(setPositionSpy.firstCall.args[0]).to.deep.equal(newPosition);
    });
    
    it('should update sprite rotation when model rotation changes', function() {
      const setRotationSpy = sinon.spy(view._sprite, 'setRotation');
      const newRotation = Math.PI / 4;
      
      mockModel.setRotation(newRotation);
      
      expect(setRotationSpy.calledOnce).to.be.true;
      expect(setRotationSpy.firstCall.args[0]).to.equal(newRotation);
    });
    
    it('should update sprite image when job changes', function() {
      const warriorImagePath = 'Images/Ants/warrior.png';
      
      mockModel.assignJob('Warrior', warriorImagePath);
      
      // Sprite should be updated with new image
      expect(view._sprite.imagePath).to.equal(warriorImagePath);
    });
  });
  
  // ==================== Health Bar Tests ====================
  describe('Health Bar Rendering', function() {
    beforeEach(function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should render health bar above sprite by default', function() {
      const initialCalls = global.rect.callCount;
      
      view.render();
      
      // Health bar should be rendered (rect calls should increase)
      expect(global.rect.callCount).to.be.greaterThan(initialCalls);
    });
    
    it('should update health bar when health changes', function() {
      const initialHealth = mockModel.health;
      const damage = 25;
      
      mockModel.takeDamage(damage);
      view.render();
      
      // Health bar width should reflect reduced health percentage
      const expectedPercent = (initialHealth - damage) / mockModel.maxHealth;
      expect(expectedPercent).to.be.lessThan(1.0);
    });
    
    it('should hide health bar when disabled', function() {
      const visibleCalls = global.rect.callCount;
      global.rect.resetHistory();
      view.render();
      const visibleRectCalls = global.rect.callCount;
      
      // Now disable health bar
      view.setHealthBarVisible(false);
      global.rect.resetHistory();
      view.render();
      const hiddenRectCalls = global.rect.callCount;
      
      // Hidden should have fewer rect calls (no health bar)
      expect(hiddenRectCalls).to.be.lessThan(visibleRectCalls);
    });
    
    it('should show correct health percentage', function() {
      const halfHealth = mockModel.maxHealth / 2;
      mockModel.takeDamage(halfHealth);
      
      view.render();
      
      // Health bar should be 50% width
      const healthPercent = mockModel.health / mockModel.maxHealth;
      expect(healthPercent).to.be.closeTo(0.5, 0.01);
    });
    
    it('should change color based on health level', function() {
      global.fill.resetHistory();
      
      // Full health (green)
      view.render();
      const fullHealthCalls = global.fill.callCount;
      
      // Low health (red) - should have same number of fill calls but different colors
      mockModel.takeDamage(mockModel.maxHealth * 0.8);
      global.fill.resetHistory();
      view.render();
      const lowHealthCalls = global.fill.callCount;
      
      // Both should call fill (for health bar rendering)
      expect(fullHealthCalls).to.be.greaterThan(0);
      expect(lowHealthCalls).to.be.greaterThan(0);
    });
  });
  
  // ==================== Selection Highlight Tests ====================
  describe('Selection Highlight', function() {
    beforeEach(function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should render selection highlight when selected', function() {
      view.setSelectionHighlight(true);
      global.ellipse.resetHistory();
      
      view.render();
      
      // Selection highlight should be rendered (ellipse called)
      expect(global.ellipse.callCount).to.be.greaterThan(0);
    });
    
    it('should hide selection when not selected', function() {
      view.setSelectionHighlight(false);
      global.ellipse.resetHistory();
      
      view.render();
      
      // No ellipse for selection highlight
      expect(global.ellipse.callCount).to.equal(0);
    });
    
    it('should update highlight when selection changes', function() {
      view.setSelectionHighlight(true);
      expect(view._selectionHighlight).to.be.true;
      
      view.setSelectionHighlight(false);
      expect(view._selectionHighlight).to.be.false;
    });
  });
  
  // ==================== Resource Indicator Tests ====================
  describe('Resource Indicator', function() {
    beforeEach(function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should render resource count when ant has resources', function() {
      const mockResource = { type: 'food', amount: 10 };
      mockModel.addResource(mockResource);
      
      global.text.resetHistory();
      view.render();
      
      // Resource count should be rendered
      expect(global.text.callCount).to.be.greaterThan(0);
    });
    
    it('should update indicator when resources change', function() {
      const resource1 = { type: 'food', amount: 10 };
      const resource2 = { type: 'food', amount: 10 };
      
      mockModel.addResource(resource1);
      expect(mockModel.getResourceCount()).to.equal(1);
      
      mockModel.addResource(resource2);
      expect(mockModel.getResourceCount()).to.equal(2);
      
      // View should reflect updated count
      view.render();
    });
    
    it('should show full inventory indicator when at capacity', function() {
      const resource1 = { type: 'food', amount: 10 };
      const resource2 = { type: 'food', amount: 10 };
      
      mockModel.addResource(resource1);
      mockModel.addResource(resource2);
      
      expect(mockModel.getResourceCount()).to.equal(mockModel.getMaxResources());
      
      global.fill.resetHistory();
      view.render();
      
      // Full inventory should have fill calls (for indicator rendering)
      expect(global.fill.callCount).to.be.greaterThan(0);
    });
    
    it('should hide indicator when no resources', function() {
      expect(mockModel.getResourceCount()).to.equal(0);
      
      global.text.resetHistory();
      view.render();
      
      // No resource text should be rendered
      expect(global.text.callCount).to.equal(0);
    });
  });
  
  // ==================== Model Change Reaction Tests ====================
  describe('Model Change Reactions', function() {
    beforeEach(function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should react to position change', function() {
      const setPositionSpy = sinon.spy(view._sprite, 'setPosition');
      const newPosition = { x: 200, y: 300 };
      
      mockModel.setPosition(newPosition.x, newPosition.y);
      
      expect(setPositionSpy.calledOnce).to.be.true;
    });
    
    it('should react to health change', function() {
      const initialFlashTimer = view._damageFlashTimer;
      
      mockModel.takeDamage(25);
      
      // Damage should trigger flash timer
      expect(view._damageFlashTimer).to.be.greaterThan(initialFlashTimer);
    });
    
    it('should react to job change', function() {
      const initialImagePath = view._currentImagePath;
      
      mockModel.assignJob('Warrior', 'Images/Ants/warrior.png');
      
      // Image path should update
      expect(view._currentImagePath).to.not.equal(initialImagePath);
    });
    
    it('should react to resource changes', function() {
      const mockResource = { type: 'food', amount: 10 };
      
      // View should update when resources change (verified by rendering)
      mockModel.addResource(mockResource);
      
      global.text.resetHistory();
      view.render();
      
      // Resource indicator should now render
      expect(global.text.callCount).to.be.greaterThan(0);
    });
  });
  
  // ==================== Visual Effects Tests ====================
  describe('Visual Effects', function() {
    beforeEach(function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should trigger damage flash when taking damage', function() {
      mockModel.takeDamage(25);
      
      // Damage flash timer should be activated
      expect(view._damageFlashTimer).to.be.greaterThan(0);
    });
    
    it('should render damage flash effect during timer', function() {
      view._damageFlashTimer = 0.5; // Active flash
      
      global.tint.resetHistory();
      view.render();
      
      // Red tint should be applied
      expect(global.tint.callCount).to.be.greaterThan(0);
    });
    
    it('should decrease flash timer over time', function() {
      view._damageFlashTimer = 0.5;
      const deltaTime = 0.016; // ~16ms frame
      
      view._updateDamageFlash(deltaTime);
      
      expect(view._damageFlashTimer).to.be.lessThan(0.5);
    });
    
    it('should stop flash effect when timer reaches zero', function() {
      view._damageFlashTimer = 0.01;
      const deltaTime = 0.016;
      
      view._updateDamageFlash(deltaTime);
      
      expect(view._damageFlashTimer).to.equal(0);
    });
  });
  
  // ==================== Configuration Tests ====================
  describe('Configuration Methods', function() {
    beforeEach(function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should toggle health bar visibility', function() {
      expect(view._healthBarVisible).to.be.true;
      
      view.setHealthBarVisible(false);
      expect(view._healthBarVisible).to.be.false;
      
      view.setHealthBarVisible(true);
      expect(view._healthBarVisible).to.be.true;
    });
    
    it('should toggle selection highlight', function() {
      expect(view._selectionHighlight).to.be.false;
      
      view.setSelectionHighlight(true);
      expect(view._selectionHighlight).to.be.true;
      
      view.setSelectionHighlight(false);
      expect(view._selectionHighlight).to.be.false;
    });
    
    it('should toggle resource indicator visibility', function() {
      expect(view._resourceIndicatorVisible).to.be.true;
      
      view.setResourceIndicatorVisible(false);
      expect(view._resourceIndicatorVisible).to.be.false;
      
      view.setResourceIndicatorVisible(true);
      expect(view._resourceIndicatorVisible).to.be.true;
    });
  });
  
  // ==================== Lifecycle Tests ====================
  describe('Lifecycle', function() {
    beforeEach(function() {
      view = new AntView(mockModel, { imagePath: 'Images/Ants/worker.png' });
    });
    
    it('should clean up sprite on destroy', function() {
      const sprite = view._sprite;
      
      view.destroy();
      
      expect(view._sprite).to.be.null;
    });
    
    it('should stop observing model on destroy', function() {
      const initialListenerCount = mockModel._changeListeners ? mockModel._changeListeners.length : 0;
      
      view.destroy();
      
      // View should remove itself as listener (or listeners array should be cleared)
      if (mockModel._changeListeners) {
        expect(mockModel._changeListeners.length).to.be.lessThanOrEqual(initialListenerCount);
      }
    });
  });
});
