/**
 * @file AntModel.test.js
 * @description Unit tests for AntModel (Phase 3.1 - MVC Refactoring)
 * 
 * Test Coverage:
 * - Constructor and initialization
 * - Job system (assignJob, getJobStats, _applyJobStats)
 * - Health system (takeDamage, heal, isDead, die)
 * - Combat system (attack, setCombatTarget, enemy detection)
 * - Resource system (add, remove, drop, capacity)
 * - Movement system (moveTo, stopMovement, position)
 * - State machine integration (getCurrentState, setState, transitions)
 * - Behavior system (gathering, dropoff)
 * - Lifecycle (update, destroy)
 * - Serialization (toJSON, fromJSON)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment, loadMVCBaseClasses } = require('../../helpers/mvcTestHelpers');

// Setup test environment (JSDOM, p5.js, CollisionBox2D)
setupTestEnvironment();

describe('AntModel', function() {
  let BaseModel, AntModel;
  let JobComponent, AntStateMachine, ResourceManager, GatherState, StatsContainer;
  
  before(function() {
    // Load MVC base classes
    const mvcClasses = loadMVCBaseClasses();
    BaseModel = mvcClasses.BaseModel;
    
    // Load ant-specific components
    JobComponent = require('../../../Classes/ants/JobComponent');
    AntStateMachine = require('../../../Classes/ants/antStateMachine');
    // ResourceManager = require('../../../Classes/managers/ResourceManager');
    // GatherState = require('../../../Classes/ants/GatherState');
    StatsContainer = require('../../../Classes/containers/StatsContainer');
    
    // Load AntModel (will fail initially - TDD red phase)
    AntModel = require('../../../Classes/models/AntModel');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  // ========================================
  // Constructor Tests (10 tests)
  // ========================================
  
  describe('Constructor', function() {
    it('should extend BaseModel', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model).to.be.instanceOf(BaseModel);
    });
    
    it('should set antIndex property', function() {
      const model1 = new AntModel(100, 100, 32, 32, { antIndex: 1 });
      const model2 = new AntModel(200, 200, 32, 32, { antIndex: 2 });
      
      expect(model1.antIndex).to.equal(1);
      expect(model2.antIndex).to.equal(2);
    });
    
    it('should auto-increment antIndex if not provided', function() {
      const model1 = new AntModel(100, 100, 32, 32);
      const model2 = new AntModel(200, 200, 32, 32);
      
      expect(model2.antIndex).to.be.greaterThan(model1.antIndex);
    });
    
    it('should set jobName property with default Scout', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.jobName).to.equal('Scout');
    });
    
    it('should set custom jobName from options', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Warrior' });
      expect(model.jobName).to.equal('Warrior');
    });
    
    it('should set name property with default "Anty"', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.name).to.equal('Anty');
    });
    
    it('should set custom name from options', function() {
      const model = new AntModel(100, 100, 32, 32, { name: 'WorkerAnt' });
      expect(model.name).to.equal('WorkerAnt');
    });
    
    it('should set faction property with default neutral', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.faction).to.equal('neutral');
    });
    
    it('should set position and size', function() {
      const model = new AntModel(150, 250, 48, 48);
      
      expect(model.position).to.deep.equal({ x: 150, y: 250 });
      expect(model.size).to.deep.equal({ width: 48, height: 48 });
    });
    
    it('should initialize health system with default values', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      // Default job is Scout (80 health), not raw default (100)
      expect(model.health).to.equal(80);
      expect(model.maxHealth).to.equal(80);
      expect(model.damage).to.equal(10);
      expect(model.attackRange).to.equal(50);
    });
  });
  
  // ========================================
  // Job System Tests (10 tests)
  // ========================================
  
  describe('Job System', function() {
    it('should have JobComponent property', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.jobComponent).to.exist;
      expect(model.jobComponent).to.be.instanceOf(JobComponent);
    });
    
    it('should assign new job with assignJob()', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout' });
      
      model.assignJob('Warrior', 'warrior.png');
      
      expect(model.jobName).to.equal('Warrior');
    });
    
    it('should apply job stats when assigning job', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout' });
      const initialHealth = model.maxHealth;
      
      model.assignJob('Warrior', 'warrior.png');
      
      // Warrior has different stats than Scout
      expect(model.maxHealth).to.not.equal(initialHealth);
    });
    
    it('should notify listeners on job change', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout' });
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.assignJob('Farmer', 'farmer.png');
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('job');
    });
    
    it('should return job stats with getJobStats()', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Warrior' });
      
      const stats = model.getJobStats();
      
      expect(stats).to.be.an('object');
      expect(stats).to.have.property('strength');
      expect(stats).to.have.property('health');
      expect(stats).to.have.property('gatherSpeed');
    });
    
    it('should handle all job types', function() {
      const jobTypes = ['Scout', 'Farmer', 'Builder', 'Warrior', 'Spitter', 'Queen', 'DeLozier'];
      
      jobTypes.forEach(jobType => {
        const model = new AntModel(100, 100, 32, 32, { jobName: jobType });
        expect(model.jobName).to.equal(jobType);
      });
    });
    
    it('should update type to Queen when job is Queen', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Queen' });
      expect(model.type).to.equal('Queen');
    });
    
    it('should keep type as Ant for non-Queen jobs', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Warrior' });
      expect(model.type).to.equal('Ant');
    });
    
    it('should apply job stats on construction', function() {
      const scoutModel = new AntModel(100, 100, 32, 32, { jobName: 'Scout' });
      const warriorModel = new AntModel(100, 100, 32, 32, { jobName: 'Warrior' });
      
      // Different jobs should have different stats
      expect(scoutModel.movementSpeed).to.not.equal(warriorModel.movementSpeed);
    });
    
    it('should preserve health percentage when assigning job', function() {
      const model = new AntModel(100, 100, 32, 32, { jobName: 'Scout', health: 50 });
      
      // Scout: health=50 (50-100=-50 bonus), maxHealth=80 (Scout base)
      // health = 80 + (-50) = 30
      expect(model.health).to.equal(30);
      expect(model.maxHealth).to.equal(80);
      
      const healthPercentage = model.health / model.maxHealth; // 30/80 = 37.5%
      
      model.assignJob('Warrior', 'warrior.png');
      
      // Warrior: maxHealth=150, should preserve 37.5% → 150 * 0.375 = 56.25 health
      expect(model.maxHealth).to.equal(150);
      expect(model.health).to.be.closeTo(56.25, 0.1);
    });
  });
  
  // ========================================
  // Health System Tests (15 tests)
  // ========================================
  
  describe('Health System', function() {
    it('should have health property', function() {
      const model = new AntModel(100, 100, 32, 32);
      // Default Scout job has 80 health
      expect(model.health).to.equal(80);
    });
    
    it('should have maxHealth property', function() {
      const model = new AntModel(100, 100, 32, 32);
      // Default Scout job has 80 maxHealth
      expect(model.maxHealth).to.equal(80);
    });
    
    it('should accept custom health values as bonuses on top of job stats', function() {
      // Job stats (Scout): base maxHealth = 80
      // Custom maxHealth: 150 = +50 bonus on top of default 100
      // Result: 80 (Scout base) + 50 (bonus) = 130 maxHealth
      // Custom health: 75 = -25 relative to default 100
      // Result: 80 (Scout base) + (-25) = 55 current health
      const model = new AntModel(100, 100, 32, 32, { health: 75, maxHealth: 150 });
      
      expect(model.health).to.equal(55); // Scout base (80) + custom bonus (-25) = 55
      expect(model.maxHealth).to.equal(130); // Scout base (80) + custom bonus (+50) = 130
    });
    
    it('should reduce health when taking damage', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.takeDamage(30);
      
      // 80 (Scout health) - 30 = 50
      expect(model.health).to.equal(50);
    });
    
    it('should not go below 0 health', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.takeDamage(150);
      
      expect(model.health).to.equal(0);
    });
    
    it('should notify listeners on health change', function() {
      const model = new AntModel(100, 100, 32, 32);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.takeDamage(25);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('health');
      // 80 (Scout health) - 25 = 55
      expect(listener.firstCall.args[1]).to.equal(55);
    });
    
    it('should increase health when healing', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.takeDamage(40);
      
      model.heal(20);
      
      // 80 (Scout) - 40 + 20 = 60
      expect(model.health).to.equal(60);
    });
    
    it('should not exceed maxHealth when healing', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.takeDamage(10);
      
      model.heal(50);
      
      // Should cap at Scout maxHealth (80)
      expect(model.health).to.equal(80);
    });
    
    it('should notify listeners on heal', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.takeDamage(40);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.heal(20);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('health');
    });
    
    it('should have isDead getter', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      expect(model.isDead).to.be.false;
      
      model.takeDamage(100);
      
      expect(model.isDead).to.be.true;
    });
    
    it('should call die() when health reaches 0', function() {
      const model = new AntModel(100, 100, 32, 32);
      const dieSpy = sinon.spy(model, 'die');
      
      model.takeDamage(100);
      
      expect(dieSpy.calledOnce).to.be.true;
    });
    
    it('should notify listeners on death', function() {
      const model = new AntModel(100, 100, 32, 32);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.takeDamage(100);
      
      // Should have health change AND death notification
      expect(listener.callCount).to.be.at.least(1);
      const deathCall = listener.getCalls().find(call => call.args[0] === 'death');
      expect(deathCall).to.exist;
    });
    
    it('should set isActive to false on death', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.die();
      
      expect(model.isActive).to.be.false;
    });
    
    it('should clear combat target on death', function() {
      const model = new AntModel(100, 100, 32, 32);
      const target = new AntModel(200, 200, 32, 32);
      model.setCombatTarget(target);
      
      model.die();
      
      expect(model.combatTarget).to.be.null;
    });
    
    it('should handle die() being called multiple times', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.die();
      model.die();
      
      expect(model.isDead).to.be.true;
      expect(model.health).to.equal(0);
    });
  });
  
  // ========================================
  // Combat System Tests (12 tests)
  // ========================================
  
  describe('Combat System', function() {
    it('should have damage property', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.damage).to.equal(10);
    });
    
    it('should have attackRange property', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.attackRange).to.equal(50);
    });
    
    it('should accept custom combat values', function() {
      const model = new AntModel(100, 100, 32, 32, { damage: 25, attackRange: 75 });
      
      expect(model.damage).to.equal(25);
      expect(model.attackRange).to.equal(75);
    });
    
    it('should attack target with attack()', function() {
      const attacker = new AntModel(100, 100, 32, 32, { damage: 20 });
      const target = new AntModel(200, 200, 32, 32);
      
      attacker.attack(target);
      
      // Target Scout (80 health) - 20 damage = 60
      expect(target.health).to.equal(60);
    });
    
    it('should set combat target with setCombatTarget()', function() {
      const attacker = new AntModel(100, 100, 32, 32);
      const target = new AntModel(200, 200, 32, 32);
      
      attacker.setCombatTarget(target);
      
      expect(attacker.combatTarget).to.equal(target);
    });
    
    it('should get combat target with combatTarget getter', function() {
      const attacker = new AntModel(100, 100, 32, 32);
      const target = new AntModel(200, 200, 32, 32);
      
      attacker.setCombatTarget(target);
      
      expect(attacker.combatTarget).to.equal(target);
    });
    
    it('should clear combat target when set to null', function() {
      const attacker = new AntModel(100, 100, 32, 32);
      const target = new AntModel(200, 200, 32, 32);
      attacker.setCombatTarget(target);
      
      attacker.setCombatTarget(null);
      
      expect(attacker.combatTarget).to.be.null;
    });
    
    it('should notify listeners on combat target change', function() {
      const attacker = new AntModel(100, 100, 32, 32);
      const target = new AntModel(200, 200, 32, 32);
      const listener = sinon.spy();
      attacker.addChangeListener(listener);
      
      attacker.setCombatTarget(target);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('combatTarget');
    });
    
    it('should have enemies array', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.enemies).to.be.an('array');
      expect(model.enemies).to.have.lengthOf(0);
    });
    
    it('should add enemy with addEnemy()', function() {
      const model = new AntModel(100, 100, 32, 32, { faction: 'player' });
      const enemy = new AntModel(200, 200, 32, 32, { faction: 'enemy' });
      
      model.addEnemy(enemy);
      
      expect(model.enemies).to.include(enemy);
    });
    
    it('should remove enemy with removeEnemy()', function() {
      const model = new AntModel(100, 100, 32, 32, { faction: 'player' });
      const enemy = new AntModel(200, 200, 32, 32, { faction: 'enemy' });
      model.addEnemy(enemy);
      
      model.removeEnemy(enemy);
      
      expect(model.enemies).to.not.include(enemy);
    });
    
    it('should calculate distance to target', function() {
      const model1 = new AntModel(100, 100, 32, 32);
      const model2 = new AntModel(400, 100, 32, 32);
      
      const distance = model1.getDistanceTo(model2);
      
      expect(distance).to.equal(300);
    });
  });
  
  // ========================================
  // Resource System Tests (12 tests)
  // ========================================
  
  describe('Resource System', function() {
    it('should have resourceManager property', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.resourceManager).to.exist;
    });
    
    it('should add resource with addResource()', function() {
      const model = new AntModel(100, 100, 32, 32);
      const resource = { type: 'food', amount: 10 };
      
      const result = model.addResource(resource);
      
      expect(result).to.be.true;
      expect(model.getResourceCount()).to.be.greaterThan(0);
    });
    
    it('should return resource count with getResourceCount()', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      expect(model.getResourceCount()).to.equal(0);
      
      // addResource adds 1 resource object (not amount property)
      model.addResource({ type: 'food', amount: 5 });
      
      expect(model.getResourceCount()).to.equal(1);
    });
    
    it('should return max capacity with getMaxResources()', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      // AntModel uses ResourceManager with capacity of 2
      expect(model.getMaxResources()).to.equal(2);
    });
    
    it('should respect max capacity when adding resources', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.addResource({ type: 'food', amount: 30 });
      
      expect(model.getResourceCount()).to.be.at.most(25);
    });
    
    it('should remove resource with removeResource()', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 15 });
      model.addResource({ type: 'wood', amount: 10 });
      
      // Remove 1 resource (count, not amount)
      model.removeResource(1);
      
      expect(model.getResourceCount()).to.equal(1);
    });
    
    it('should not go below 0 when removing resources', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 10 });
      
      model.removeResource(20);
      
      expect(model.getResourceCount()).to.equal(0);
    });
    
    it('should drop all resources with dropAllResources()', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 15 });
      
      const dropped = model.dropAllResources();
      
      expect(dropped).to.be.an('array');
      expect(model.getResourceCount()).to.equal(0);
    });
    
    it('should notify listeners on resource add', function() {
      const model = new AntModel(100, 100, 32, 32);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.addResource({ type: 'food', amount: 10 });
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('resources');
    });
    
    it('should notify listeners on resource remove', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.addResource({ type: 'food', amount: 15 });
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.removeResource(5);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('resources');
    });
    
    it('should handle full inventory gracefully', function() {
      const model = new AntModel(100, 100, 32, 32);
      // Fill to capacity (2 resources)
      model.addResource({ type: 'food', amount: 25 });
      model.addResource({ type: 'wood', amount: 10 });
      
      // Try to add third resource
      const result = model.addResource({ type: 'stone', amount: 5 });
      
      expect(result).to.be.false;
      expect(model.getResourceCount()).to.equal(2);
    });
    
    it('should handle empty inventory gracefully', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      const dropped = model.dropAllResources();
      
      expect(dropped).to.be.an('array');
      expect(dropped).to.have.lengthOf(0);
    });
  });
  
  // ========================================
  // Movement System Tests (12 tests)
  // ========================================
  
  describe('Movement System', function() {
    it('should have position property', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.position).to.deep.equal({ x: 100, y: 100 });
    });
    
    it('should have rotation property', function() {
      const model = new AntModel(100, 100, 32, 32, { rotation: 45 });
      expect(model.rotation).to.equal(45);
    });
    
    it('should have movementSpeed property', function() {
      const model = new AntModel(100, 100, 32, 32, { movementSpeed: 80 });
      expect(model.movementSpeed).to.equal(80);
    });
    
    it('should set target position with moveTo()', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.moveTo(200, 300);
      
      expect(model.targetPosition).to.deep.equal({ x: 200, y: 300 });
    });
    
    it('should set isMoving flag when moveTo() called', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.moveTo(200, 300);
      
      expect(model.isMoving).to.be.true;
    });
    
    it('should stop movement with stopMovement()', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.moveTo(200, 300);
      
      model.stopMovement();
      
      expect(model.isMoving).to.be.false;
      expect(model.targetPosition).to.be.null;
    });
    
    it('should update position with setPosition()', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.setPosition(250, 350);
      
      expect(model.position).to.deep.equal({ x: 250, y: 350 });
    });
    
    it('should update rotation with setRotation()', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.setRotation(90);
      
      expect(model.rotation).to.equal(90);
    });
    
    it('should notify listeners on position change', function() {
      const model = new AntModel(100, 100, 32, 32);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.setPosition(300, 400);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('position');
    });
    
    it('should notify listeners on rotation change', function() {
      const model = new AntModel(100, 100, 32, 32);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.setRotation(180);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('rotation');
    });
    
    it('should notify listeners on movement start', function() {
      const model = new AntModel(100, 100, 32, 32);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.moveTo(200, 300);
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('movementStart');
    });
    
    it('should notify listeners on movement stop', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.moveTo(200, 300);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.stopMovement();
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('movementStop');
    });
  });
  
  // ========================================
  // State Machine Tests (10 tests)
  // ========================================
  
  describe('State Machine Integration', function() {
    it('should have stateMachine property', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.stateMachine).to.exist;
      expect(model.stateMachine).to.be.instanceOf(AntStateMachine);
    });
    
    it('should get current state with getCurrentState()', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      const state = model.getCurrentState();
      
      expect(state).to.be.a('string');
      expect(state).to.equal('IDLE');
    });
    
    it('should set primary state with setState()', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.setState('MOVING');
      
      expect(model.getCurrentState()).to.include('MOVING');
    });
    
    it('should handle state transitions', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.setState('MOVING');
      model.setState('GATHERING');
      
      expect(model.getCurrentState()).to.include('GATHERING');
    });
    
    it('should notify listeners on state change', function() {
      const model = new AntModel(100, 100, 32, 32);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.setState('MOVING');
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('state');
    });
    
    it('should handle GATHERING state', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.setState('GATHERING');
      
      expect(model.getCurrentState()).to.include('GATHERING');
    });
    
    it('should handle DROPPING_OFF state', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.setState('DROPPING_OFF');
      
      expect(model.getCurrentState()).to.include('DROPPING_OFF');
    });
    
    it('should trigger dropoff logic on DROPPING_OFF state', function() {
      const model = new AntModel(100, 100, 32, 32);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.setState('DROPPING_OFF');
      
      const dropoffCall = listener.getCalls().find(call => call.args[0] === 'dropoff-start');
      expect(dropoffCall).to.exist;
    });
    
    it.skip('should handle combat modifier states (Phase 3.5 - State Machine Refactor)', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.setState('IDLE', 'IN_COMBAT');
      
      expect(model.getCurrentState()).to.include('IN_COMBAT');
    });
    
    it.skip('should handle terrain modifier states (Phase 3.5 - State Machine Refactor)', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.setState('MOVING', 'OUT_OF_COMBAT', 'IN_WATER');
      
      expect(model.getCurrentState()).to.include('IN_WATER');
    });
  });
  
  // ========================================
  // Behavior System Tests (8 tests)
  // ========================================
  
  describe('Behavior System', function() {
    it.skip('should have gatherState property (Task 1.9 - GatherState Integration)', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.gatherState).to.exist;
    });
    
    it.skip('should start gathering with startGathering() (Task 1.9 - GatherState Integration)', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.startGathering();
      
      expect(model.isGathering()).to.be.true;
    });
    
    it('should stop gathering with stopGathering()', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.startGathering();
      
      model.stopGathering();
      
      expect(model.isGathering()).to.be.false;
    });
    
    it.skip('should check gathering status with isGathering() (Task 1.9 - GatherState Integration)', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      expect(model.isGathering()).to.be.false;
      
      model.startGathering();
      
      expect(model.isGathering()).to.be.true;
    });
    
    it('should set target dropoff location', function() {
      const model = new AntModel(100, 100, 32, 32);
      const dropoff = { x: 500, y: 500 };
      
      model.setTargetDropoff(dropoff);
      
      expect(model.targetDropoff).to.equal(dropoff);
    });
    
    it('should clear target dropoff', function() {
      const model = new AntModel(100, 100, 32, 32);
      const dropoff = { x: 500, y: 500 };
      model.setTargetDropoff(dropoff);
      
      model.setTargetDropoff(null);
      
      expect(model.targetDropoff).to.be.null;
    });
    
    it('should notify on gathering start', function() {
      const model = new AntModel(100, 100, 32, 32);
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.startGathering();
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('gatheringStart');
    });
    
    it('should notify on gathering stop', function() {
      const model = new AntModel(100, 100, 32, 32);
      model.startGathering();
      const listener = sinon.spy();
      model.addChangeListener(listener);
      
      model.stopGathering();
      
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal('gatheringStop');
    });
  });
  
  // ========================================
  // Lifecycle Tests (8 tests)
  // ========================================
  
  describe('Lifecycle', function() {
    it('should have update() method', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.update).to.be.a('function');
    });
    
    it('should update components in update()', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      // Should not throw
      expect(() => model.update(16)).to.not.throw();
    });
    
    it('should update state machine during update', function() {
      const model = new AntModel(100, 100, 32, 32);
      const updateSpy = sinon.spy(model.stateMachine, 'update');
      
      model.update(16);
      
      expect(updateSpy.calledOnce).to.be.true;
    });
    
    it('should mark inactive on death', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.die();
      
      expect(model.isActive).to.be.false;
    });
    
    it('should have destroy() method', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.destroy).to.be.a('function');
    });
    
    it('should cleanup resources on destroy()', function() {
      const model = new AntModel(100, 100, 32, 32);
      
      model.destroy();
      
      expect(model.isActive).to.be.false;
    });
    
    it('should clear combat target on destroy()', function() {
      const model = new AntModel(100, 100, 32, 32);
      const target = new AntModel(200, 200, 32, 32);
      model.setCombatTarget(target);
      
      model.destroy();
      
      expect(model.combatTarget).to.be.null;
    });
    
    it('should clear enemies on destroy()', function() {
      const model = new AntModel(100, 100, 32, 32, { faction: 'player' });
      const enemy = new AntModel(200, 200, 32, 32, { faction: 'enemy' });
      model.addEnemy(enemy);
      
      model.destroy();
      
      expect(model.enemies).to.have.lengthOf(0);
    });
  });
  
  // ========================================
  // Serialization Tests (5 tests)
  // ========================================
  
  describe('Serialization', function() {
    it('should have toJSON() method', function() {
      const model = new AntModel(100, 100, 32, 32);
      expect(model.toJSON).to.be.a('function');
    });
    
    it('should serialize all properties to JSON', function() {
      const model = new AntModel(100, 100, 32, 32, {
        jobName: 'Warrior',
        name: 'TestAnt',
        faction: 'player'
      });
      
      const json = model.toJSON();
      
      expect(json).to.be.an('object');
      expect(json).to.have.property('antIndex');
      expect(json).to.have.property('jobName', 'Warrior');
      expect(json).to.have.property('name', 'TestAnt');
      expect(json).to.have.property('faction', 'player');
      expect(json).to.have.property('position');
      expect(json).to.have.property('health');
    });
    
    it('should include position in JSON', function() {
      const model = new AntModel(150, 250, 32, 32);
      
      const json = model.toJSON();
      
      expect(json.position).to.deep.equal({ x: 150, y: 250 });
    });
    
    it('should have fromJSON() static method', function() {
      expect(AntModel.fromJSON).to.be.a('function');
    });
    
    it('should reconstruct model from JSON', function() {
      const original = new AntModel(100, 100, 32, 32, {
        jobName: 'Farmer',
        name: 'FarmerAnt',
        faction: 'player',
        health: 75
      });
      
      const json = original.toJSON();
      const reconstructed = AntModel.fromJSON(json);
      
      expect(reconstructed.jobName).to.equal('Farmer');
      expect(reconstructed.name).to.equal('FarmerAnt');
      expect(reconstructed.faction).to.equal('player');
      expect(reconstructed.health).to.equal(75);
      expect(reconstructed.position).to.deep.equal({ x: 100, y: 100 });
    });
  });
});
