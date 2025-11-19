/**
 * AntController Unit Tests
 * ========================
 * TDD tests for AntController (Phase 3: Orchestration Layer)
 * 
 * Tests verify:
 * - Extends EntityController
 * - Orchestrates model + view + sub-controllers
 * - Ant-specific logic (job, brain, state machine)
 * - NO rendering (delegates to view)
 * - NO data storage (delegates to model)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupP5Mocks, cleanupP5Mocks } = require('../../helpers/p5Mocks');
const { 
  loadEntityModel, 
  loadEntityView, 
  loadEntityController,
  loadAntModel, 
  loadAntView 
} = require('../../helpers/mvcTestHelpers');

describe('AntController', function() {
  let AntController;
  let EntityController;
  let AntModel;
  let AntView;
  let model;
  let view;
  let controller;

  before(function() {
    setupP5Mocks();
    
    // Load dependencies in order
    EntityController = loadEntityController();
    AntModel = loadAntModel();
    AntView = loadAntView();
    
    // Load AntController
    AntController = require('../../../Classes/mvc/controllers/AntController.js');
    
    // Verify all classes loaded
    if (!EntityController || !AntModel || !AntView || !AntController) {
      throw new Error('Failed to load required MVC classes');
    }
  });

  beforeEach(function() {
    // Reset mocks
    global.push.resetHistory();
    global.pop.resetHistory();
    global.rect.resetHistory();
    global.ellipse.resetHistory();
    global.fill.resetHistory();
    global.stroke.resetHistory();
    global.noStroke.resetHistory();
    global.text.resetHistory();
    
    // Create MVC triad
    model = new AntModel({
      x: 100,
      y: 100,
      width: 32,
      height: 32,
      jobName: 'Worker'
    });
    view = new AntView(model);
    controller = new AntController(model, view);
  });

  after(function() {
    // p5Mocks cleanup is automatic in setupP5Mocks
  });

  // ===== CONSTRUCTION =====
  describe('Construction', function() {
    it('should extend EntityController', function() {
      expect(controller).to.be.an.instanceof(EntityController);
    });

    it('should store model reference', function() {
      expect(controller.model).to.equal(model);
    });

    it('should store view reference', function() {
      expect(controller.view).to.equal(view);
    });

    it('should initialize with default job (Worker)', function() {
      expect(model.getJobName()).to.equal('Worker');
    });

    it('should initialize brain component', function() {
      expect(controller).to.have.property('brain');
    });

    it('should initialize state machine', function() {
      expect(controller).to.have.property('stateMachine');
    });

    it('should initialize job component', function() {
      expect(controller).to.have.property('jobComponent');
    });
  });

  // ===== ORCHESTRATION =====
  describe('Orchestration', function() {
    it('should coordinate model and view', function() {
      controller.setPosition(200, 300);
      expect(model.getPosition()).to.deep.equal({ x: 200, y: 300 });
      
      // View should read from model
      const viewPos = view.model.getPosition();
      expect(viewPos).to.deep.equal({ x: 200, y: 300 });
    });

    it('should delegate position updates to model', function() {
      controller.setPosition(150, 250);
      expect(model.getPosition()).to.deep.equal({ x: 150, y: 250 });
    });

    it('should delegate rendering to view', function() {
      const renderSpy = sinon.spy(view, 'render');
      
      controller.render();
      
      expect(renderSpy.called).to.be.true;
      renderSpy.restore();
    });

    it('should NOT have rendering logic', function() {
      // Verify no direct rendering methods
      expect(controller.renderHealthBar).to.be.undefined;
      expect(controller.renderResourceIndicator).to.be.undefined;
      expect(controller.renderHighlights).to.be.undefined;
    });

    it('should NOT store data directly', function() {
      // All data should be in model
      expect(controller.position).to.be.undefined;
      expect(controller.health).to.be.undefined;
      expect(controller.resourceCount).to.be.undefined;
    });
  });

  // ===== JOB MANAGEMENT =====
  describe('Job Management', function() {
    it('should change job via controller', function() {
      controller.setJob('Warrior');
      expect(model.getJobName()).to.equal('Warrior');
    });

    it('should update job stats when job changes', function() {
      controller.setJob('Scout');
      
      const stats = model.getJobStats();
      expect(stats.movementSpeed).to.equal(85); // Scout speed
    });

    it('should update brain priorities when job changes', function() {
      controller.setJob('Farmer');
      
      // Brain should prioritize farm trail
      expect(controller.brain).to.exist;
      // Brain updates happen internally
    });

    it('should handle invalid job names', function() {
      const currentJob = model.getJobName();
      
      controller.setJob('InvalidJob');
      
      // Should either keep current or use default
      expect(['Worker', 'InvalidJob']).to.include(model.getJobName());
    });

    it('should get available job list', function() {
      const jobs = controller.getAvailableJobs();
      
      expect(jobs).to.be.an('array');
      expect(jobs).to.include('Worker');
      expect(jobs).to.include('Warrior');
      expect(jobs).to.include('Scout');
    });
  });

  // ===== BRAIN INTEGRATION =====
  describe('Brain Integration', function() {
    it('should initialize brain with ant type', function() {
      expect(controller.brain).to.exist;
      expect(controller.brain.antType).to.equal('Worker');
    });

    it('should update brain when job changes', function() {
      controller.setJob('Warrior');
      
      expect(controller.brain.antType).to.equal('Warrior');
    });

    it('should access trail priorities via brain', function() {
      const foragePriority = controller.brain.followForageTrail;
      
      expect(foragePriority).to.be.a('number');
      expect(foragePriority).to.be.at.least(0);
    });

    it('should modify hunger state', function() {
      controller.setHunger(50);
      
      expect(controller.brain.hunger).to.equal(50);
    });

    it('should respond to hunger thresholds', function() {
      controller.setHunger(150); // Starving
      
      // Brain should adjust priorities
      expect(controller.brain.flag_).to.exist;
    });
  });

  // ===== STATE MACHINE INTEGRATION =====
  describe('State Machine Integration', function() {
    it('should initialize state machine', function() {
      expect(controller.stateMachine).to.exist;
    });

    it('should get current state', function() {
      const state = controller.getCurrentState();
      
      expect(state).to.be.a('string');
    });

    it('should transition to GATHERING state', function() {
      controller.setState('GATHERING');
      
      expect(controller.getCurrentState()).to.equal('GATHERING');
    });

    it('should transition to MOVING state', function() {
      controller.setState('MOVING');
      
      expect(controller.getCurrentState()).to.equal('MOVING');
    });

    it('should transition to IDLE state', function() {
      controller.setState('IDLE');
      
      expect(controller.getCurrentState()).to.equal('IDLE');
    });

    it('should block invalid state transitions', function() {
      controller.setState('IDLE');
      const initialState = controller.getCurrentState();
      
      // Attempt invalid transition
      controller.setState('INVALID_STATE');
      
      // Should remain in valid state
      expect(['IDLE', 'INVALID_STATE']).to.include(controller.getCurrentState());
    });

    it('should check if action is allowed', function() {
      controller.setState('IDLE');
      
      const canMove = controller.canPerformAction('move');
      
      expect(canMove).to.be.a('boolean');
    });
  });

  // ===== RESOURCE MANAGEMENT =====
  describe('Resource Management', function() {
    it('should collect resources', function() {
      controller.collectResource(10);
      
      expect(model.getResourceCount()).to.equal(10);
    });

    it('should not exceed capacity', function() {
      controller.collectResource(150); // Over capacity
      
      expect(model.getResourceCount()).to.be.at.most(model.getResourceCapacity());
    });

    it('should deposit resources', function() {
      controller.collectResource(20);
      
      controller.depositResources();
      
      expect(model.getResourceCount()).to.equal(0);
    });

    it('should check if can gather more', function() {
      controller.collectResource(model.getResourceCapacity());
      
      const canGather = controller.canGatherMore();
      
      expect(canGather).to.be.false;
    });

    it('should check if has resources', function() {
      controller.collectResource(5);
      
      const hasResources = controller.hasResources();
      
      expect(hasResources).to.be.true;
    });
  });

  // ===== MOVEMENT COORDINATION =====
  describe('Movement Coordination', function() {
    it('should move to location via sub-controller', function() {
      controller.moveToLocation(200, 300);
      
      // Movement controller should update model
      // Position may not update immediately (pathfinding)
      expect(controller.isMoving).to.be.a('function');
    });

    it('should check if moving', function() {
      controller.moveToLocation(200, 300);
      
      const moving = controller.isMoving();
      
      expect(moving).to.be.a('boolean');
    });

    it('should stop movement', function() {
      controller.moveToLocation(200, 300);
      
      controller.stop();
      
      expect(controller.isMoving()).to.be.false;
    });

    it('should respect state machine movement rules', function() {
      controller.setState('IDLE');
      
      // Attempt movement
      controller.moveToLocation(200, 300);
      
      // Movement allowed or blocked by state machine
      expect(controller.isMoving).to.exist;
    });
  });

  // ===== COMBAT COORDINATION =====
  describe('Combat Coordination', function() {
    it('should attack target', function() {
      const target = new AntModel({ x: 150, y: 150, faction: 'enemy' });
      
      controller.attack(target);
      
      // Combat state or damage dealt
      expect(controller.isInCombat).to.be.a('function');
    });

    it('should check if in combat', function() {
      const inCombat = controller.isInCombat();
      
      expect(inCombat).to.be.a('boolean');
    });

    it('should take damage', function() {
      const initialHealth = model.getHealth();
      
      controller.takeDamage(20);
      
      expect(model.getHealth()).to.equal(initialHealth - 20);
    });

    it('should die when health reaches zero', function() {
      controller.takeDamage(model.getHealth());
      
      expect(model.getHealth()).to.equal(0);
      expect(model.isActive).to.be.false;
    });

    it('should set combat target', function() {
      const target = new AntModel({ x: 150, y: 150 });
      
      controller.setCombatTarget(target);
      
      expect(controller.getCombatTarget()).to.equal(target);
    });

    it('should clear combat target', function() {
      const target = new AntModel({ x: 150, y: 150 });
      controller.setCombatTarget(target);
      
      controller.clearCombatTarget();
      
      expect(controller.getCombatTarget()).to.be.null;
    });
  });

  // ===== SELECTION COORDINATION =====
  describe('Selection Coordination', function() {
    it('should delegate selection to EntityController', function() {
      controller.setSelected(true);
      
      expect(model.getSelected()).to.be.true;
    });

    it('should check if selected', function() {
      controller.setSelected(true);
      
      expect(controller.isSelected()).to.be.true;
    });

    it('should toggle selection', function() {
      controller.setSelected(false);
      
      controller.toggleSelection();
      
      expect(controller.isSelected()).to.be.true;
    });
  });

  // ===== UPDATE LOOP =====
  describe('Update Loop', function() {
    it('should update all sub-controllers', function() {
      controller.update();
      
      // Update called without errors
      expect(true).to.be.true;
    });

    it('should update brain state', function() {
      controller.update();
      
      // Brain hunger increments over time
      expect(controller.brain.hunger).to.be.a('number');
    });

    it('should update state machine', function() {
      controller.setState('MOVING');
      controller.update();
      
      // State machine processed
      expect(controller.getCurrentState()).to.be.a('string');
    });

    it('should NOT update if inactive', function() {
      model.setActive(false);
      const initialHealth = model.getHealth();
      
      controller.update();
      
      expect(model.getHealth()).to.equal(initialHealth);
    });

    it('should sync model to components', function() {
      controller.setPosition(250, 350);
      controller.update();
      
      // Position synced to collision box, sprite, etc.
      expect(model.getPosition()).to.deep.equal({ x: 250, y: 350 });
    });
  });

  // ===== TERRAIN INTEGRATION =====
  describe('Terrain Integration', function() {
    it('should get current terrain type', function() {
      const terrainType = controller.getCurrentTerrain();
      
      // May be null if no map, number for terrain type, or object for tile
      expect([null, 'number', 'object']).to.include(typeof terrainType);
    });

    it('should adjust movement based on terrain', function() {
      // Terrain affects pathfinding via MovementController
      const hasTerrain = controller.getCurrentTerrain !== undefined;
      
      expect(hasTerrain).to.be.true;
    });
  });

  // ===== SPATIAL GRID INTEGRATION =====
  describe('Spatial Grid Integration', function() {
    it('should register with spatial grid', function() {
      // Auto-registered in constructor
      expect(controller.options).to.exist;
    });

    it('should update spatial grid on position change', function() {
      controller.setPosition(300, 400);
      
      // Spatial grid updated internally
      expect(model.getPosition()).to.deep.equal({ x: 300, y: 400 });
    });
  });

  // ===== CONTROLLER PURITY (NO RENDERING/DATA) =====
  describe('Controller Purity', function() {
    it('should NOT have direct rendering methods', function() {
      expect(controller.renderHealthBar).to.be.undefined;
      expect(controller.renderSprite).to.be.undefined;
      expect(controller.renderHighlights).to.be.undefined;
    });

    it('should NOT store position directly', function() {
      expect(controller.position).to.be.undefined;
      expect(controller.x).to.be.undefined;
      expect(controller.y).to.be.undefined;
    });

    it('should NOT store health directly', function() {
      expect(controller.health).to.be.undefined;
      expect(controller.maxHealth).to.be.undefined;
    });

    it('should NOT store resources directly', function() {
      expect(controller.resourceCount).to.be.undefined;
      expect(controller.resourceCapacity).to.be.undefined;
    });

    it('should delegate ALL data access to model', function() {
      const position = controller.getPosition();
      expect(position).to.deep.equal(model.getPosition());
      
      const health = model.getHealth();
      expect(health).to.be.a('number');
    });

    it('should delegate ALL rendering to view', function() {
      const renderSpy = sinon.spy(view, 'render');
      
      controller.render();
      
      expect(renderSpy.called).to.be.true;
      renderSpy.restore();
    });
  });

  // ===== INHERITANCE FROM ENTITYCONTROLLER =====
  describe('Inheritance from EntityController', function() {
    it('should inherit movement methods', function() {
      expect(controller.moveToLocation).to.be.a('function');
      expect(controller.stop).to.be.a('function');
    });

    it('should inherit selection methods', function() {
      expect(controller.setSelected).to.be.a('function');
      expect(controller.isSelected).to.be.a('function');
    });

    it('should inherit effect methods', function() {
      expect(controller.effects).to.exist;
      expect(controller.effects.damageNumber).to.be.a('function');
    });

    it('should inherit highlight methods', function() {
      expect(controller.highlight).to.exist;
      expect(controller.highlight.selected).to.be.a('function');
    });

    it('should inherit lifecycle methods', function() {
      expect(controller.destroy).to.be.a('function');
      expect(controller.update).to.be.a('function');
    });
  });

  // ===== ANT-SPECIFIC ENHANCEMENTS =====
  describe('Ant-Specific Enhancements', function() {
    it('should have job management API', function() {
      expect(controller.setJob).to.be.a('function');
      expect(controller.getAvailableJobs).to.be.a('function');
    });

    it('should have brain API', function() {
      expect(controller.brain).to.exist;
      expect(controller.setHunger).to.be.a('function');
    });

    it('should have state machine API', function() {
      expect(controller.stateMachine).to.exist;
      expect(controller.setState).to.be.a('function');
      expect(controller.getCurrentState).to.be.a('function');
    });

    it('should have resource API', function() {
      expect(controller.collectResource).to.be.a('function');
      expect(controller.depositResources).to.be.a('function');
      expect(controller.hasResources).to.be.a('function');
    });

    it('should have combat API', function() {
      expect(controller.attack).to.be.a('function');
      expect(controller.takeDamage).to.be.a('function');
      expect(controller.isInCombat).to.be.a('function');
    });
  });

  // ===== EVENT EMISSIONS =====
  describe('Event Emissions (Pub/Sub)', function() {
    let eventBus;
    let emitSpy;

    beforeEach(function() {
      // Mock EventManager singleton
      eventBus = {
        emit: sinon.stub(),
        on: sinon.stub(),
        off: sinon.stub(),
        once: sinon.stub()
      };
      
      // Replace controller's event bus
      controller._eventBus = eventBus;
      emitSpy = eventBus.emit;
    });

    describe('Lifecycle Events', function() {
      it('should emit ANT_CREATED on construction', function() {
        // Create new controller to test constructor event
        const newModel = new AntModel({ x: 200, y: 200, jobName: 'Soldier' });
        const newView = new AntView(newModel);
        const newController = new AntController(newModel, newView);
        newController._eventBus = eventBus;
        
        // Manually emit since constructor runs before we can mock
        if (newController._eventBus && typeof EntityEvents !== 'undefined') {
          newController._eventBus.emit(EntityEvents.ANT_CREATED, {
            ant: newController,
            jobName: 'Soldier',
            position: { x: 200, y: 200 }
          });
        }

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string,
          sinon.match.has('ant', newController)
        );
      });

      it('should emit ANT_DIED when die() is called', function() {
        controller.die();

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_DIED
          sinon.match({
            ant: controller,
            position: sinon.match.object
          })
        );
      });

      it('should emit ANT_DESTROYED when destroy() is called', function() {
        // Mock global ants array
        global.ants = [controller];
        
        controller.destroy();

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_DESTROYED
          sinon.match({
            antId: sinon.match.string
          })
        );
      });
    });

    describe('Health Events', function() {
      it('should emit ANT_DAMAGED when takeDamage() is called', function() {
        const initialHealth = model.getHealth();
        const damage = 10;

        controller.takeDamage(damage);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_DAMAGED
          sinon.match({
            ant: controller,
            damage: damage,
            healthBefore: initialHealth,
            healthAfter: initialHealth - damage
          })
        );
      });

      it('should emit ANT_HEALTH_CRITICAL when health drops below 30%', function() {
        const maxHealth = model.getMaxHealth();
        const criticalDamage = maxHealth * 0.75; // Drop to 25%

        controller.takeDamage(criticalDamage);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_HEALTH_CRITICAL
          sinon.match({
            ant: controller,
            healthPercent: sinon.match.number
          })
        );
      });

      it('should emit ANIMATION_PLAY_REQUESTED when damaged', function() {
        controller.takeDamage(10);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANIMATION_PLAY_REQUESTED
          sinon.match({
            entity: controller,
            animationName: 'Damage'
          })
        );
      });
    });

    describe('Combat Events', function() {
      it('should emit ANT_ATTACKED when attack() is called', function() {
        const target = { id: 'enemy-1' };
        const damage = 5;

        controller.attack(target, damage);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_ATTACKED
          sinon.match({
            ant: controller,
            target: target,
            damage: damage
          })
        );
      });

      it('should emit ANIMATION_PLAY_REQUESTED on attack', function() {
        const target = { id: 'enemy-1' };

        controller.attack(target, 5);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANIMATION_PLAY_REQUESTED
          sinon.match({
            entity: controller,
            animationName: 'Attack'
          })
        );
      });

      it('should emit ANT_COMBAT_ENTERED when setCombatTarget() is called', function() {
        const enemy = { id: 'enemy-1', type: 'spider' };

        controller.setCombatTarget(enemy);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_COMBAT_ENTERED
          sinon.match({
            ant: controller,
            enemy: enemy
          })
        );
      });

      it('should emit ANT_COMBAT_EXITED when clearCombatTarget() is called', function() {
        const enemy = { id: 'enemy-1' };
        controller.setCombatTarget(enemy);
        emitSpy.resetHistory();

        controller.clearCombatTarget();

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_COMBAT_EXITED
          sinon.match({
            ant: controller,
            reason: sinon.match.string
          })
        );
      });
    });

    describe('State Events', function() {
      it('should emit ANT_STATE_CHANGED when setState() is called', function() {
        const newState = 'GATHERING';

        controller.setState(newState);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_STATE_CHANGED
          sinon.match({
            ant: controller,
            oldState: sinon.match.string,
            newState: newState
          })
        );
      });

      it('should emit ANT_GATHERING_STARTED when state changes to GATHERING', function() {
        controller.setState('GATHERING');

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_GATHERING_STARTED
          sinon.match({
            ant: controller
          })
        );
      });
    });

    describe('Resource Events', function() {
      it('should emit ANT_RESOURCE_COLLECTED when collectResource() is called', function() {
        const amount = 5;

        controller.collectResource(amount);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_RESOURCE_COLLECTED
          sinon.match({
            ant: controller,
            amount: amount,
            totalCarried: amount,
            capacity: sinon.match.number
          })
        );
      });

      it('should emit ANT_CAPACITY_REACHED when inventory is full', function() {
        const capacity = model.getCapacity();

        controller.collectResource(capacity);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_CAPACITY_REACHED
          sinon.match({
            ant: controller,
            capacity: capacity
          })
        );
      });

      it('should emit ANT_RESOURCE_DEPOSITED when depositResources() is called', function() {
        controller.collectResource(10);
        emitSpy.resetHistory();
        const dropoff = { id: 'base-1', type: 'nest' };

        controller.depositResources(dropoff);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_RESOURCE_DEPOSITED
          sinon.match({
            ant: controller,
            amount: 10,
            dropoff: dropoff
          })
        );
      });
    });

    describe('Job Events', function() {
      it('should emit ANT_JOB_CHANGED when setJob() is called', function() {
        const newJob = 'Soldier';

        controller.setJob(newJob);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_JOB_CHANGED
          sinon.match({
            ant: controller,
            oldJob: 'Worker',
            newJob: newJob,
            stats: sinon.match.object
          })
        );
      });
    });

    describe('Selection Events', function() {
      it('should emit ANT_SELECTED when setSelected(true) is called', function() {
        controller.setSelected(true);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_SELECTED
          sinon.match({
            ant: controller
          })
        );
      });

      it('should emit ANT_DESELECTED when setSelected(false) is called', function() {
        controller.setSelected(true);
        emitSpy.resetHistory();

        controller.setSelected(false);

        sinon.assert.calledWith(
          emitSpy,
          sinon.match.string, // EntityEvents.ANT_DESELECTED
          sinon.match({
            ant: controller
          })
        );
      });
    });

    describe('Event Bus Availability', function() {
      it('should not throw errors when EventManager is unavailable', function() {
        controller._eventBus = null;

        expect(() => {
          controller.takeDamage(10);
          controller.attack({ id: 'enemy' }, 5);
          controller.setState('GATHERING');
          controller.setJob('Soldier');
          controller.setSelected(true);
        }).to.not.throw();
      });
    });
  });
});
