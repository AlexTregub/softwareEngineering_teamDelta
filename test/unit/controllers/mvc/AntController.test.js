/**
 * AntController Unit Tests
 * 
 * Tests for the AntController class (Phase 3.3)
 * Follows TDD approach: Write tests first, then implement
 * 
 * Test coverage:
 * - Constructor and initialization
 * - Movement API
 * - Combat API
 * - Resource API
 * - Job API
 * - Health API
 * - State API
 * - Selection
 * - Input handling
 * - Lifecycle
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { 
  setupTestEnvironment, 
  cleanupTestEnvironment 
} = require('../../../helpers/mvcTestHelpers');

// Setup test environment with rendering and sprite support
setupTestEnvironment({ rendering: true, sprite: true });

describe('AntController', function() {
  let AntModel, AntView, AntController, BaseController;
  let controller;
  
  before(function() {
    // Load dependencies
    BaseController = require('../../../../Classes/controllers/mvc/BaseController');
    AntModel = require('../../../../Classes/models/AntModel');
    AntView = require('../../../../Classes/views/AntView');
    AntController = require('../../../../Classes/controllers/mvc/AntController');
  });
  
  afterEach(function() {
    if (controller && typeof controller.destroy === 'function') {
      controller.destroy();
    }
    cleanupTestEnvironment();
  });
  
  // ==================== Constructor Tests ====================
  describe('Constructor', function() {
    it('should extend BaseController', function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      expect(controller).to.be.instanceOf(BaseController);
    });
    
    it('should create AntModel', function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      expect(controller.model).to.be.instanceOf(AntModel);
    });
    
    it('should create AntView', function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      expect(controller.view).to.be.instanceOf(AntView);
    });
    
    it('should bind model and view', function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
      expect(controller.view.model).to.equal(controller.model);
    });
    
    it('should initialize with options', function() {
      controller = new AntController(5, 200, 300, 32, 32, {
        jobName: 'Scout',
        imagePath: 'Images/Ants/scout.png',
        health: 50
      });
      
      expect(controller.antIndex).to.equal(5);
      expect(controller.position).to.deep.equal({ x: 200, y: 300 });
      expect(controller.jobName).to.equal('Scout');
    });
  });
  
  // ==================== Movement API Tests ====================
  describe('Movement API', function() {
    beforeEach(function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
    });
    
    it('should delegate moveTo to model', function() {
      const moveToSpy = sinon.spy(controller.model, 'moveTo');
      
      controller.moveTo(200, 300);
      
      expect(moveToSpy.calledOnce).to.be.true;
      expect(moveToSpy.firstCall.args).to.deep.equal([200, 300]);
    });
    
    it('should delegate stopMovement to model', function() {
      const stopSpy = sinon.spy(controller.model, 'stopMovement');
      
      controller.stopMovement();
      
      expect(stopSpy.calledOnce).to.be.true;
    });
    
    it('should expose position getter', function() {
      const position = controller.position;
      
      expect(position).to.deep.equal({ x: 100, y: 100 });
    });
    
    it('should expose isMoving getter', function() {
      expect(controller.isMoving).to.be.a('boolean');
      
      controller.moveTo(200, 300);
      expect(controller.isMoving).to.be.true;
    });
    
    it('should handle movement state changes', function() {
      controller.moveTo(200, 300);
      expect(controller.isMoving).to.be.true;
      
      controller.stopMovement();
      expect(controller.isMoving).to.be.false;
    });
    
    it('should update view when moving', function() {
      controller.moveTo(200, 300);
      
      // View sprite should reflect model position
      expect(controller.view._sprite.position).to.deep.equal(controller.model.position);
    });
  });
  
  // ==================== Combat API Tests ====================
  describe('Combat API', function() {
    beforeEach(function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Warrior',
        imagePath: 'Images/Ants/warrior.png'
      });
    });
    
    it('should delegate attack to model', function() {
      const attackSpy = sinon.spy(controller.model, 'attack');
      const mockTarget = { 
        position: { x: 150, y: 150 },
        takeDamage: sinon.stub()
      };
      
      controller.attack(mockTarget);
      
      expect(attackSpy.calledOnce).to.be.true;
      expect(attackSpy.firstCall.args[0]).to.equal(mockTarget);
    });
    
    it('should delegate setCombatTarget to model', function() {
      const setTargetSpy = sinon.spy(controller.model, 'setCombatTarget');
      const mockTarget = { position: { x: 150, y: 150 } };
      
      controller.setCombatTarget(mockTarget);
      
      expect(setTargetSpy.calledOnce).to.be.true;
      expect(setTargetSpy.firstCall.args[0]).to.equal(mockTarget);
    });
    
    it('should expose combat getters', function() {
      expect(controller.health).to.be.a('number');
      expect(controller.maxHealth).to.be.a('number');
      expect(controller.health).to.be.at.most(controller.maxHealth);
    });
    
    it('should handle combat state changes', function() {
      const mockTarget = { position: { x: 150, y: 150 } };
      
      controller.setCombatTarget(mockTarget);
      expect(controller.model.combatTarget).to.equal(mockTarget);
    });
    
    it('should trigger view updates on damage', function() {
      const initialFlashTimer = controller.view._damageFlashTimer;
      
      controller.takeDamage(25);
      
      // View should show damage flash
      expect(controller.view._damageFlashTimer).to.be.greaterThan(initialFlashTimer);
    });
    
    it('should handle death', function() {
      const initialHealth = controller.health;
      
      controller.takeDamage(initialHealth + 10);
      
      // Ant should be dead
      expect(controller.health).to.equal(0);
    });
  });
  
  // ==================== Resource API Tests ====================
  describe('Resource API', function() {
    beforeEach(function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
    });
    
    it('should delegate addResource to model', function() {
      const addResourceSpy = sinon.spy(controller.model, 'addResource');
      const mockResource = { type: 'food', amount: 10 };
      
      controller.addResource(mockResource);
      
      expect(addResourceSpy.calledOnce).to.be.true;
      expect(addResourceSpy.firstCall.args[0]).to.equal(mockResource);
    });
    
    it('should delegate removeResource to model', function() {
      const removeResourceSpy = sinon.spy(controller.model, 'removeResource');
      const resource = { type: 'food', amount: 10 };
      controller.addResource(resource);
      
      const removed = controller.removeResource(1);
      
      expect(removeResourceSpy.calledOnce).to.be.true;
      expect(removed).to.be.an('array');
    });
    
    it('should delegate dropAllResources to model', function() {
      const dropSpy = sinon.spy(controller.model, 'dropAllResources');
      const resource = { type: 'food', amount: 10 };
      controller.addResource(resource);
      
      const dropped = controller.dropAllResources();
      
      expect(dropSpy.calledOnce).to.be.true;
      expect(dropped).to.be.an('array');
    });
    
    it('should expose resourceCount getter', function() {
      expect(controller.resourceCount).to.equal(0);
      
      controller.addResource({ type: 'food', amount: 10 });
      expect(controller.resourceCount).to.equal(1);
    });
    
    it('should handle full inventory', function() {
      const resource1 = { type: 'food', amount: 10 };
      const resource2 = { type: 'food', amount: 10 };
      const resource3 = { type: 'food', amount: 10 };
      
      controller.addResource(resource1);
      controller.addResource(resource2);
      const result = controller.addResource(resource3);
      
      // Should reject third resource (capacity: 2)
      expect(controller.resourceCount).to.equal(2);
    });
    
    it('should trigger view updates on resource changes', function() {
      const resource = { type: 'food', amount: 10 };
      
      controller.addResource(resource);
      
      global.text.resetHistory();
      controller.render();
      
      // Resource indicator should render
      expect(global.text.callCount).to.be.greaterThan(0);
    });
    
    it('should return dropped resources', function() {
      const resource = { type: 'food', amount: 10 };
      controller.addResource(resource);
      
      const dropped = controller.dropAllResources();
      
      expect(dropped).to.have.lengthOf(1);
      expect(dropped[0].type).to.equal('food');
    });
    
    it('should handle empty inventory gracefully', function() {
      const dropped = controller.dropAllResources();
      
      expect(dropped).to.be.an('array');
      expect(dropped).to.have.lengthOf(0);
    });
  });
  
  // ==================== Job API Tests ====================
  describe('Job API', function() {
    beforeEach(function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
    });
    
    it('should delegate assignJob to model', function() {
      const assignJobSpy = sinon.spy(controller.model, 'assignJob');
      
      controller.assignJob('Warrior', 'Images/Ants/warrior.png');
      
      expect(assignJobSpy.calledOnce).to.be.true;
      expect(assignJobSpy.firstCall.args).to.deep.equal(['Warrior', 'Images/Ants/warrior.png']);
    });
    
    it('should expose jobName getter', function() {
      expect(controller.jobName).to.equal('Worker');
      
      controller.assignJob('Scout', 'Images/Ants/scout.png');
      expect(controller.jobName).to.equal('Scout');
    });
    
    it('should update view on job change', function() {
      controller.assignJob('Scout', 'Images/Ants/scout.png');
      
      // View should update sprite image
      expect(controller.view._currentImagePath).to.equal('Images/Ants/scout.png');
    });
    
    it('should preserve health percentage on job change', function() {
      const initialHealth = controller.health;
      const initialMaxHealth = controller.maxHealth;
      const initialPercentage = initialHealth / initialMaxHealth;
      
      controller.assignJob('Warrior', 'Images/Ants/warrior.png');
      
      const newPercentage = controller.health / controller.maxHealth;
      expect(newPercentage).to.be.closeTo(initialPercentage, 0.01);
    });
  });
  
  // ==================== Health API Tests ====================
  describe('Health API', function() {
    beforeEach(function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
    });
    
    it('should delegate takeDamage to model', function() {
      const takeDamageSpy = sinon.spy(controller.model, 'takeDamage');
      
      controller.takeDamage(25);
      
      expect(takeDamageSpy.calledOnce).to.be.true;
      expect(takeDamageSpy.firstCall.args[0]).to.equal(25);
    });
    
    it('should delegate heal to model', function() {
      controller.takeDamage(30);
      const healSpy = sinon.spy(controller.model, 'heal');
      
      controller.heal(15);
      
      expect(healSpy.calledOnce).to.be.true;
      expect(healSpy.firstCall.args[0]).to.equal(15);
    });
    
    it('should expose health getters', function() {
      const health = controller.health;
      const maxHealth = controller.maxHealth;
      
      expect(health).to.be.a('number');
      expect(maxHealth).to.be.a('number');
      expect(health).to.be.at.most(maxHealth);
    });
    
    it('should trigger damage flash in view', function() {
      expect(controller.view._damageFlashTimer).to.equal(0);
      
      controller.takeDamage(20);
      
      expect(controller.view._damageFlashTimer).to.be.greaterThan(0);
    });
    
    it('should handle death', function() {
      const initialHealth = controller.health;
      
      controller.takeDamage(initialHealth + 100);
      
      expect(controller.health).to.equal(0);
      expect(controller.isAlive).to.be.false;
    });
    
    it('should not heal beyond maxHealth', function() {
      const maxHealth = controller.maxHealth;
      
      controller.heal(1000);
      
      expect(controller.health).to.equal(maxHealth);
    });
  });
  
  // ==================== State API Tests ====================
  describe('State API', function() {
    beforeEach(function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
    });
    
    it('should delegate setState to model', function() {
      const setStateSpy = sinon.spy(controller.model, 'setState');
      
      controller.setState('GATHERING', null, null);
      
      expect(setStateSpy.calledOnce).to.be.true;
      expect(setStateSpy.firstCall.args).to.deep.equal(['GATHERING', null, null]);
    });
    
    it('should expose state getters', function() {
      const currentState = controller.getCurrentState();
      
      expect(currentState).to.be.an('object');
      expect(currentState).to.have.property('primary');
    });
    
    it('should handle state transitions', function() {
      controller.setState('MOVING', null, null);
      let state = controller.getCurrentState();
      expect(state.primary).to.equal('MOVING');
      
      controller.setState('GATHERING', null, null);
      state = controller.getCurrentState();
      expect(state.primary).to.equal('GATHERING');
    });
    
    it('should trigger view updates on state changes', function() {
      // State changes should not crash view rendering
      controller.setState('GATHERING', null, null);
      
      expect(() => controller.render()).to.not.throw();
    });
  });
  
  // ==================== Selection Tests ====================
  describe('Selection', function() {
    beforeEach(function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
    });
    
    it('should set selection highlight in view', function() {
      expect(controller.view._selectionHighlight).to.be.false;
      
      controller.setSelected(true);
      
      expect(controller.view._selectionHighlight).to.be.true;
    });
    
    it('should handle selection toggle', function() {
      controller.setSelected(true);
      expect(controller.view._selectionHighlight).to.be.true;
      
      controller.setSelected(false);
      expect(controller.view._selectionHighlight).to.be.false;
    });
    
    it('should render selection highlight when selected', function() {
      controller.setSelected(true);
      
      global.ellipse.resetHistory();
      controller.render();
      
      // Selection highlight should render
      expect(global.ellipse.callCount).to.be.greaterThan(0);
    });
  });
  
  // ==================== Input Handling Tests ====================
  describe('Input Handling', function() {
    beforeEach(function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
    });
    
    it('should handle click events', function() {
      const clickData = { x: 100, y: 100, button: 0 };
      
      expect(() => controller.handleInput('click', clickData)).to.not.throw();
    });
    
    it('should handle hover events', function() {
      const hoverData = { x: 100, y: 100 };
      
      expect(() => controller.handleInput('hover', hoverData)).to.not.throw();
    });
    
    it('should delegate input to appropriate systems', function() {
      const clickData = { x: 100, y: 100, button: 0 };
      
      // handleInput should process input (implementation-specific behavior)
      controller.handleInput('click', clickData);
      
      // Should not crash
      expect(controller).to.exist;
    });
    
    it('should handle invalid input gracefully', function() {
      expect(() => controller.handleInput('invalid', null)).to.not.throw();
      expect(() => controller.handleInput(null, {})).to.not.throw();
    });
  });
  
  // ==================== Lifecycle Tests ====================
  describe('Lifecycle', function() {
    beforeEach(function() {
      controller = new AntController(0, 100, 100, 32, 32, {
        jobName: 'Worker',
        imagePath: 'Images/Ants/worker.png'
      });
    });
    
    it('should update model on update()', function() {
      const updateSpy = sinon.spy(controller.model, 'update');
      const deltaTime = 0.016;
      
      controller.update(deltaTime);
      
      expect(updateSpy.calledOnce).to.be.true;
      expect(updateSpy.firstCall.args[0]).to.equal(deltaTime);
    });
    
    it('should render view on render()', function() {
      const renderSpy = sinon.spy(controller.view, 'render');
      
      controller.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });
    
    it('should destroy model and view on destroy()', function() {
      const modelDestroySpy = sinon.spy(controller.model, 'destroy');
      const viewDestroySpy = sinon.spy(controller.view, 'destroy');
      
      controller.destroy();
      
      expect(modelDestroySpy.calledOnce).to.be.true;
      expect(viewDestroySpy.calledOnce).to.be.true;
    });
    
    it('should clean up listeners on destroy', function() {
      const model = controller.model;
      const initialListeners = model._changeListeners.length;
      
      controller.destroy();
      
      // Listeners should be cleaned up (view unsubscribed)
      expect(model._changeListeners.length).to.be.lessThan(initialListeners);
    });
  });
  
  // ==================== Additional Getters Tests ====================
  describe('Additional Getters', function() {
    beforeEach(function() {
      controller = new AntController(5, 200, 300, 32, 32, {
        jobName: 'Scout',
        imagePath: 'Images/Ants/scout.png'
      });
    });
    
    it('should expose antIndex getter', function() {
      expect(controller.antIndex).to.equal(5);
    });
    
    it('should expose isAlive getter', function() {
      expect(controller.isAlive).to.be.true;
      
      controller.takeDamage(controller.maxHealth + 10);
      expect(controller.isAlive).to.be.false;
    });
  });
});
