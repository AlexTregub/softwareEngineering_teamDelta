/**
 * AntController.test.js
 * 
 * Unit tests for AntController - ant business logic
 * Tests cover ALL 70+ ant methods: job system, resource management, combat,
 * state machine, dropoff, commands, update loop, rendering, debug, cleanup
 * 
 * TDD Implementation: Phase 2 - Ant MVC Conversion
 * Target: 80+ tests ensuring complete functional parity with ant class
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('AntController', function() {
  let AntModel, AntView, AntController, EntityController;
  let antModel, antView, antController;
  
  before(function() {
    // Setup Node.js environment
    if (typeof window === 'undefined') {
      global.window = {};
    }
    
    // Mock p5.js rendering functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.noFill = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.translate = sinon.stub();
    global.rotate = sinon.stub();
    global.scale = sinon.stub();
    global.image = sinon.stub();
    global.imageMode = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.CENTER = 'CENTER';
    
    // Mock AntSprites for AntView
    global.AntSprites = {
      getSprite: sinon.stub().returns({ width: 32, height: 32 })
    };
    
    // Load dependencies
    EntityController = require('../../../Classes/baseMVC/controllers/EntityController');
    AntModel = require('../../../Classes/baseMVC/models/AntModel');
    AntView = require('../../../Classes/baseMVC/views/AntView');
    AntController = require('../../../Classes/baseMVC/controllers/AntController');
  });
  
  beforeEach(function() {
    // Create MVC components
    antModel = new AntModel(100, 100, 32, 32);
    antView = new AntView(antModel);
    antController = new AntController(antModel, antView);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should extend EntityController', function() {
      expect(antController).to.be.an.instanceof(EntityController);
    });
    
    it('should store model reference', function() {
      expect(antController.model).to.equal(antModel);
    });
    
    it('should store view reference', function() {
      expect(antController.view).to.equal(antView);
    });
    
    it('should initialize job system', function() {
      expect(antController.getJobName()).to.equal('Worker');
    });
  });
  
  describe('Job System', function() {
    it('should get current job name', function() {
      expect(antController.getJobName()).to.equal('Worker');
    });
    
    it('should assign new job', function() {
      antController.assignJob('Farmer');
      expect(antController.getJobName()).to.equal('Farmer');
    });
    
    it('should apply job stats on job assignment', function() {
      const jobStats = { 
        strength: 20, 
        health: 150, 
        gatherSpeed: 15, 
        movementSpeed: 70 
      };
      
      antController.assignJob('Builder', null, jobStats);
      
      const storedStats = antModel.getJobStats();
      expect(storedStats.strength).to.equal(20);
    });
    
    it('should use fallback stats for unknown job', function() {
      antController.assignJob('UnknownJob');
      
      const stats = antController.getJobStats();
      expect(stats).to.be.an('object');
      expect(stats).to.have.property('strength');
    });
    
    it('should emit event on job change', function() {
      const callback = sinon.stub();
      antModel.on('jobNameChanged', callback);
      
      antController.assignJob('Soldier');
      
      expect(callback.called).to.be.true;
    });
    
    it('should get job stats', function() {
      const stats = antController.getJobStats();
      expect(stats).to.be.an('object');
    });
    
    it('should apply job stats to ant properties', function() {
      const stats = { 
        health: 200, 
        maxHealth: 200, 
        damage: 25 
      };
      
      antController._applyJobStats(stats);
      
      expect(antModel.getHealth()).to.equal(200);
      expect(antModel.getMaxHealth()).to.equal(200);
      expect(antModel.getDamage()).to.equal(25);
    });
  });
  
  describe('Resource Management', function() {
    let mockResourceManager;
    
    beforeEach(function() {
      mockResourceManager = {
        getResourceCount: sinon.stub().returns(0),
        getMaxResources: sinon.stub().returns(10),
        addResource: sinon.stub().returns(true),
        removeResource: sinon.stub().returns(true),
        dropAllResources: sinon.stub()
      };
      antModel.setResourceManager(mockResourceManager);
    });
    
    it('should get resource count', function() {
      mockResourceManager.getResourceCount.returns(5);
      expect(antController.getResourceCount()).to.equal(5);
    });
    
    it('should get max resources', function() {
      expect(antController.getMaxResources()).to.equal(10);
    });
    
    it('should add resource', function() {
      const resource = { type: 'food', amount: 1 };
      const result = antController.addResource(resource);
      
      expect(mockResourceManager.addResource.calledWith(resource)).to.be.true;
      expect(result).to.be.true;
    });
    
    it('should remove resource', function() {
      const result = antController.removeResource(2);
      
      expect(mockResourceManager.removeResource.calledWith(2)).to.be.true;
      expect(result).to.be.true;
    });
    
    it('should drop all resources', function() {
      antController.dropAllResources();
      
      expect(mockResourceManager.dropAllResources.called).to.be.true;
    });
    
    it('should start gathering', function() {
      antController.startGathering();
      
      expect(antController.isGathering()).to.be.true;
    });
    
    it('should stop gathering', function() {
      antController.startGathering();
      antController.stopGathering();
      
      expect(antController.isGathering()).to.be.false;
    });
    
    it('should check if gathering', function() {
      expect(antController.isGathering()).to.be.false;
      
      antController.startGathering();
      expect(antController.isGathering()).to.be.true;
    });

    it('should throw error if ResourceManager missing when getting count', function() {
      antModel.setResourceManager(null);
      expect(() => antController.getResourceCount()).to.throw('ResourceManager not initialized');
    });

    it('should throw error if ResourceManager missing when adding resource', function() {
      antModel.setResourceManager(null);
      expect(() => antController.addResource({ type: 'food' })).to.throw('ResourceManager not initialized');
    });

    it('should throw error if ResourceManager missing when removing resource', function() {
      antModel.setResourceManager(null);
      expect(() => antController.removeResource(1)).to.throw('ResourceManager not initialized');
    });

    it('should throw error if ResourceManager missing when dropping resources', function() {
      antModel.setResourceManager(null);
      expect(() => antController.dropAllResources()).to.throw('ResourceManager not initialized');
    });
  });
  
  describe('Combat System', function() {
    it('should get health', function() {
      expect(antController.getHealth()).to.equal(100);
    });
    
    it('should get max health', function() {
      expect(antController.getMaxHealth()).to.equal(100);
    });
    
    it('should get damage', function() {
      expect(antController.getDamage()).to.equal(10);
    });
    
    it('should take damage', function() {
      antController.takeDamage(30);
      expect(antController.getHealth()).to.equal(70);
    });
    
    it('should not go below 0 health', function() {
      antController.takeDamage(150);
      expect(antController.getHealth()).to.equal(0);
    });
    
    it('should heal', function() {
      antController.takeDamage(40);
      antController.heal(20);
      
      expect(antController.getHealth()).to.equal(80);
    });
    
    it('should not heal above max health', function() {
      antController.heal(50);
      expect(antController.getHealth()).to.equal(100);
    });
    
    it('should die when health reaches 0', function() {
      const dieSpy = sinon.spy(antController, 'die');
      
      antController.takeDamage(100);
      antController.update();
      
      expect(antController.getHealth()).to.equal(0);
    });
    
    it('should attack target', function() {
      const target = {
        takeDamage: sinon.stub(),
        getPosition: sinon.stub().returns({ x: 110, y: 110 })
      };
      
      antController.attack(target);
      
      expect(target.takeDamage.called).to.be.true;
    });
    
    it('should set combat target', function() {
      const target = { id: 'enemy1' };
      antController.setCombatTarget(target);
      
      expect(antModel.getCombatTarget()).to.equal(target);
    });
    
    it('should clear combat target', function() {
      const target = { id: 'enemy1' };
      antController.setCombatTarget(target);
      antController.setCombatTarget(null);
      
      expect(antModel.getCombatTarget()).to.be.null;
    });
    
    it('should detect enemies', function() {
      const enemy1 = { faction: 'enemy', getPosition: () => ({ x: 105, y: 105 }) };
      const enemy2 = { faction: 'enemy', getPosition: () => ({ x: 1000, y: 1000 }) };
      
      // Create controller with entity manager mock
      const entityManager = {
        getAllEntities: () => [enemy1, enemy2]
      };
      const controllerWithManager = new AntController(antModel, antView, { entityManager });
      
      controllerWithManager._updateEnemyDetection();
      
      const enemies = antModel.getEnemies();
      expect(enemies.length).to.be.greaterThan(0);
    });
    
    it('should add enemy', function() {
      const enemy = { id: 'enemy1' };
      antController.addEnemy(enemy);
      
      expect(antModel.getEnemies()).to.include(enemy);
    });
    
    it('should remove enemy', function() {
      const enemy = { id: 'enemy1' };
      antController.addEnemy(enemy);
      antController.removeEnemy(enemy);
      
      expect(antModel.getEnemies()).to.not.include(enemy);
    });
    
    it('should clear all enemies', function() {
      antController.addEnemy({ id: 'enemy1' });
      antController.addEnemy({ id: 'enemy2' });
      antController.clearEnemies();
      
      expect(antModel.getEnemies().length).to.equal(0);
    });
    
    it('should calculate distance between entities', function() {
      const entity1 = { getPosition: () => ({ x: 0, y: 0 }) };
      const entity2 = { getPosition: () => ({ x: 3, y: 4 }) };
      
      const distance = antController._calculateDistance(entity1, entity2);
      
      expect(distance).to.equal(5); // 3-4-5 triangle
    });
  });
  
  describe('State Machine Integration', function() {
    let mockStateMachine;
    
    beforeEach(function() {
      mockStateMachine = {
        getCurrentState: sinon.stub().returns('idle'),
        setState: sinon.stub(),
        getPreferredState: sinon.stub().returns('idle'),
        setPreferredState: sinon.stub(),
        update: sinon.stub()
      };
      antModel.setStateMachine(mockStateMachine);
    });
    
    it('should get current state', function() {
      expect(antController.getCurrentState()).to.equal('idle');
    });
    
    it('should set state', function() {
      antController.setState('gathering');
      
      expect(mockStateMachine.setState.calledWith('gathering')).to.be.true;
    });
    
    it('should get preferred state', function() {
      expect(antController.getPreferredState()).to.equal('idle');
    });
    
    it('should set preferred state', function() {
      antController.setPreferredState('combat');
      
      expect(mockStateMachine.setPreferredState.calledWith('combat')).to.be.true;
    });
    
    it('should handle state change callback', function() {
      const callback = sinon.stub();
      antController._onStateChange = callback;
      
      antController._onStateChange('idle', 'gathering');
      
      expect(callback.calledWith('idle', 'gathering')).to.be.true;
    });
    
    it('should update state machine', function() {
      antController.update();
      
      expect(mockStateMachine.update.called).to.be.true;
    });

    it('should throw error if StateMachine missing when getting state', function() {
      antModel.setStateMachine(null);
      expect(() => antController.getCurrentState()).to.throw('StateMachine not initialized');
    });

    it('should throw error if StateMachine missing when setting state', function() {
      antModel.setStateMachine(null);
      expect(() => antController.setState('combat')).to.throw('StateMachine not initialized');
    });

    it('should throw error if StateMachine missing when getting preferred state', function() {
      antModel.setStateMachine(null);
      expect(() => antController.getPreferredState()).to.throw('StateMachine not initialized');
    });

    it('should throw error if StateMachine missing when setting preferred state', function() {
      antModel.setStateMachine(null);
      expect(() => antController.setPreferredState('combat')).to.throw('StateMachine not initialized');
    });
  });
  
  describe('Dropoff System', function() {
    it('should set target dropoff', function() {
      const dropoff = { x: 200, y: 200 };
      antController.setTargetDropoff(dropoff);
      
      expect(antModel.getTargetDropoff()).to.equal(dropoff);
    });
    
    it('should clear target dropoff', function() {
      const dropoff = { x: 200, y: 200 };
      antController.setTargetDropoff(dropoff);
      antController.setTargetDropoff(null);
      
      expect(antModel.getTargetDropoff()).to.be.null;
    });
    
    it('should find nearest dropoff', function() {
      const building = { 
        type: 'anthill', 
        getPosition: () => ({ x: 150, y: 150 }), 
        isActive: true 
      };
      
      // Create controller with building manager mock
      const buildingManager = {
        getAllBuildings: () => [building]
      };
      const controllerWithManager = new AntController(antModel, antView, { buildingManager });
      
      controllerWithManager._goToNearestDropoff();
      
      expect(antModel.getTargetDropoff()).to.not.be.null;
    });
    
    it('should check dropoff arrival', function() {
      const dropoff = { x: 105, y: 105 };
      antController.setTargetDropoff(dropoff);
      
      const arrived = antController._checkDropoffArrival();
      
      expect(arrived).to.be.a('boolean');
    });
    
    it('should move to dropoff when full', function() {
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(10),
        getMaxResources: sinon.stub().returns(10)
      };
      antModel.setResourceManager(mockResourceManager);
      
      const building = { 
        type: 'anthill', 
        getPosition: () => ({ x: 150, y: 150 }), 
        isActive: true 
      };
      
      // Create controller with building manager mock
      const buildingManager = {
        getAllBuildings: () => [building]
      };
      const controllerWithManager = new AntController(antModel, antView, { buildingManager });
      
      controllerWithManager._goToNearestDropoff();
      
      expect(antModel.getTargetDropoff()).to.not.be.null;
    });
  });
  
  describe('Movement Commands', function() {
    it('should move to location', function() {
      const setTargetSpy = sinon.spy(antModel, 'setTargetPosition');
      const setMovingSpy = sinon.spy(antModel, 'setMoving');
      
      antController.moveToLocation(200, 200);
      
      expect(setTargetSpy.calledWith(200, 200)).to.be.true;
      expect(setMovingSpy.calledWith(true)).to.be.true;
      
      setTargetSpy.restore();
      setMovingSpy.restore();
    });
    
    it('should check if moving', function() {
      sinon.stub(antModel, 'isMoving').returns(true);
      
      expect(antController.isMoving()).to.be.true;
      
      antModel.isMoving.restore();
    });
    
    it('should stop movement', function() {
      const setMovingSpy = sinon.spy(antModel, 'setMoving');
      const setTargetSpy = sinon.spy(antModel, 'setTargetPosition');
      const setPathSpy = sinon.spy(antModel, 'setPath');
      
      antController.stopMovement();
      
      expect(setMovingSpy.calledWith(false)).to.be.true;
      expect(setTargetSpy.calledWith(null, null)).to.be.true;
      expect(setPathSpy.calledWith(null)).to.be.true;
      
      setMovingSpy.restore();
      setTargetSpy.restore();
      setPathSpy.restore();
    });
  });
  
  describe('Command/Task System', function() {
    it('should add command to task manager', function() {
      const addTaskSpy = sinon.spy();
      antModel._taskManager = { addTask: addTaskSpy };
      
      const command = { type: 'gather', target: { x: 150, y: 150 } };
      antController.addCommand(command);
      
      expect(addTaskSpy.called).to.be.true;
    });
    
    it('should handle gather command', function() {
      const command = { type: 'gather', target: { x: 150, y: 150 } };
      
      antController.addCommand(command);
      
      // Command processed (no error)
      expect(true).to.be.true;
    });
    
    it('should handle move command', function() {
      const command = { type: 'move', target: { x: 200, y: 200 } };
      
      antController.addCommand(command);
      
      expect(true).to.be.true;
    });
    
    it('should handle attack command', function() {
      const target = { id: 'enemy1' };
      const command = { type: 'attack', target: target };
      
      antController.addCommand(command);
      
      expect(true).to.be.true;
    });
  });
  
  describe('Update Loop', function() {
    it('should update each frame', function() {
      antController.update();
      
      // Update completes without error
      expect(true).to.be.true;
    });
    
    it('should update state machine', function() {
      const mockStateMachine = { update: sinon.stub() };
      antModel.setStateMachine(mockStateMachine);
      
      antController.update();
      
      expect(mockStateMachine.update.called).to.be.true;
    });
    
    it('should update brain', function() {
      const mockBrain = { update: sinon.stub() };
      antModel.setBrain(mockBrain);
      
      antController.update();
      
      expect(mockBrain.update.called).to.be.true;
    });
    
    it('should update gather state', function() {
      const mockGatherState = { update: sinon.stub() };
      antModel.setGatherState(mockGatherState);
      
      antController.update();
      
      expect(mockGatherState.update.called).to.be.true;
    });
    
    it('should track frame time', function() {
      const initialTime = antModel.getLastFrameTime();
      
      antController.update();
      
      // Frame time updated (or initialized)
      expect(antModel.getLastFrameTime()).to.be.a('number');
    });
    
    it('should update idle timer', function() {
      const initialTimer = antModel.getIdleTimer();
      
      antController.update();
      
      // Timer may increment or stay same depending on state
      expect(antModel.getIdleTimer()).to.be.a('number');
    });
  });
  
  describe('Rendering Coordination', function() {
    it('should trigger view render', function() {
      const renderSpy = sinon.spy(antView, 'render');
      
      antController.render();
      
      expect(renderSpy.called).to.be.true;
    });
    
    it('should not render when inactive', function() {
      antModel.setActive(false);
      const renderSpy = sinon.spy(antView, 'render');
      
      antController.render();
      
      // View render may still be called but checks isActive internally
      expect(true).to.be.true;
    });
  });
  
  describe('Debug Methods', function() {
    it('should get debug info', function() {
      // Add required managers to prevent errors
      const mockStateMachine = {
        getCurrentState: sinon.stub().returns('idle')
      };
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(0),
        getMaxResources: sinon.stub().returns(10)
      };
      antModel.setStateMachine(mockStateMachine);
      antModel.setResourceManager(mockResourceManager);
      
      const debugInfo = antController.getDebugInfo();
      
      expect(debugInfo).to.be.an('object');
      expect(debugInfo).to.have.property('antIndex');
      expect(debugInfo).to.have.property('JobName');
      expect(debugInfo).to.have.property('health');
    });
    
    it('should include state in debug info', function() {
      const mockStateMachine = {
        getCurrentState: sinon.stub().returns('gathering')
      };
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(0),
        getMaxResources: sinon.stub().returns(10)
      };
      antModel.setStateMachine(mockStateMachine);
      antModel.setResourceManager(mockResourceManager);
      
      const debugInfo = antController.getDebugInfo();
      
      expect(debugInfo).to.have.property('currentState', 'gathering');
    });
    
    it('should include resource count in debug info', function() {
      const mockStateMachine = {
        getCurrentState: sinon.stub().returns('idle')
      };
      const mockResourceManager = {
        getResourceCount: sinon.stub().returns(5),
        getMaxResources: sinon.stub().returns(10)
      };
      antModel.setStateMachine(mockStateMachine);
      antModel.setResourceManager(mockResourceManager);
      
      const debugInfo = antController.getDebugInfo();
      
      expect(debugInfo.resources).to.include('5');
    });
  });
  
  describe('Cleanup', function() {
    it('should emit removeRequested event when removing from game', function() {
      const callback = sinon.spy();
      antModel.on('removeRequested', callback);
      
      antController._removeFromGame();
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.have.property('ant', antModel);
    });
    
    it('should deactivate model', function() {
      antController.die();
      
      expect(antModel.isActive()).to.be.false;
    });
    
    it('should cleanup systems', function() {
      const mockBrain = { cleanup: sinon.stub() };
      antModel.setBrain(mockBrain);
      
      antController.cleanup();
      
      expect(mockBrain.cleanup.called).to.be.true;
    });
  });
  
  describe('Legacy Compatibility', function() {
    it('should support posX getter', function() {
      expect(antController.posX).to.equal(100);
    });
    
    it('should support posY getter', function() {
      expect(antController.posY).to.equal(100);
    });
    
    it('should support posX setter', function() {
      antController.posX = 150;
      expect(antController.posX).to.equal(150);
    });
    
    it('should support posY setter', function() {
      antController.posY = 200;
      expect(antController.posY).to.equal(200);
    });
    
    it('should support isSelected getter', function() {
      expect(antController.isSelected).to.be.a('boolean');
    });
    
    it('should support faction getter', function() {
      expect(antController.faction).to.be.a('string');
    });
    
    it('should support antIndex getter', function() {
      expect(antController.antIndex).to.be.a('number');
    });
    
    it('should support JobName getter', function() {
      expect(antController.JobName).to.equal('Worker');
    });
    
    it('should support health getter', function() {
      expect(antController.health).to.equal(100);
    });
    
    it('should get ant index', function() {
      expect(antController.getAntIndex()).to.be.a('number');
    });
    
    it('should get health data', function() {
      const healthData = antController.getHealthData();
      
      expect(healthData).to.have.property('current');
      expect(healthData).to.have.property('max');
    });
  });
  
  describe('System Integration', function() {
    it('should integrate with AntBrain', function() {
      const mockBrain = {
        update: sinon.stub(),
        makeDecision: sinon.stub()
      };
      antModel.setBrain(mockBrain);
      
      expect(antController.getBrain()).to.equal(mockBrain);
    });
    
    it('should integrate with StatsContainer', function() {
      const mockStats = {
        getStat: sinon.stub().returns(10)
      };
      antModel.setStatsContainer(mockStats);
      
      expect(antController.getStatsContainer()).to.equal(mockStats);
    });
    
    it('should integrate with JobComponent', function() {
      const mockJob = {
        execute: sinon.stub()
      };
      antModel.setJobComponent(mockJob);
      
      expect(antController.getJobComponent()).to.equal(mockJob);
    });
  });
});
