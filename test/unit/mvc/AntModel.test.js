/**
 * @fileoverview AntModel Unit Tests (TDD - Phase 1)
 * Tests pure data storage for ant entities - NO logic, NO rendering
 * 
 * Test Coverage:
 * - Identity properties (_antIndex, _JobName, type, jobName, faction, enemies)
 * - Health properties (_health, _maxHealth)
 * - Combat properties (_damage, _attackRange, _combatTarget)
 * - Resource properties (capacity, resourceCount)
 * - Stats properties (strength, health, gatherSpeed, movementSpeed)
 * - State properties (primary, combat, terrain)
 * - Job properties (job reference, job stats)
 * - Timer properties (_idleTimer, _idleTimerTimeout)
 * - Flag properties (isBoxHovered)
 * - Image properties (sprite image, job image)
 * - Component references (brain, stateMachine, gatherState, resourceManager)
 * - Getters return copies (prevent external mutation)
 * - NO update/render methods (purity test)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupMVCTest, loadMVCClasses, loadAntModel } = require('../../helpers/mvcTestHelpers');

// Setup all MVC test mocks
setupMVCTest();

describe('AntModel', function() {
  let EntityModel, AntModel;

  before(function() {
    // Load EntityModel for instanceof checks
    loadMVCClasses();
    EntityModel = global.EntityModel;
    
    // Load AntModel (will be created)
    try {
      AntModel = loadAntModel();
    } catch (error) {
      // File doesn't exist yet (TDD)
      AntModel = null;
    }
  });

  describe('Constructor', function() {
    it('should create AntModel with default values', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      
      expect(model).to.be.instanceOf(EntityModel);
      expect(model).to.be.instanceOf(AntModel);
    });

    it('should accept identity options (_antIndex, _JobName, type, faction)', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({
        antIndex: 42,
        jobName: 'Warrior',
        type: 'Ant',
        faction: 'friendly'
      });
      
      expect(model.getAntIndex()).to.equal(42);
      expect(model.getJobName()).to.equal('Warrior');
      expect(model.getType()).to.equal('Ant');
      expect(model.getFaction()).to.equal('friendly');
    });

    it('should accept health options (_health, _maxHealth)', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({
        health: 150,
        maxHealth: 300
      });
      
      expect(model.getHealth()).to.equal(150);
      expect(model.getMaxHealth()).to.equal(300);
    });

    it('should accept combat options (_damage, _attackRange)', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({
        damage: 45,
        attackRange: 50
      });
      
      expect(model.getDamage()).to.equal(45);
      expect(model.getAttackRange()).to.equal(50);
    });

    it('should accept resource options (capacity)', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({
        capacity: 10
      });
      
      expect(model.getCapacity()).to.equal(10);
    });

    it('should initialize enemy array', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({
        enemies: ['spider', 'enemy_ant']
      });
      
      const enemies = model.getEnemies();
      expect(enemies).to.be.an('array');
      expect(enemies).to.deep.equal(['spider', 'enemy_ant']);
    });
  });

  describe('Identity Properties', function() {
    it('should get/set antIndex', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setAntIndex(99);
      expect(model.getAntIndex()).to.equal(99);
    });

    it('should get/set jobName', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setJobName('Scout');
      expect(model.getJobName()).to.equal('Scout');
    });

    it('should get/set type', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setType('Queen');
      expect(model.getType()).to.equal('Queen');
    });

    it('should get/set faction', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setFaction('enemy');
      expect(model.getFaction()).to.equal('enemy');
    });

    it('should get/set enemies array', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setEnemies(['faction1', 'faction2']);
      
      const enemies = model.getEnemies();
      expect(enemies).to.deep.equal(['faction1', 'faction2']);
    });

    it('should return copy of enemies array (prevent external mutation)', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({ enemies: ['spider'] });
      const enemies1 = model.getEnemies();
      const enemies2 = model.getEnemies();
      
      enemies1.push('new_enemy');
      expect(enemies2).to.deep.equal(['spider']); // Not mutated
      expect(model.getEnemies()).to.deep.equal(['spider']); // Original not mutated
    });
  });

  describe('Health Properties', function() {
    it('should get/set health', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setHealth(200);
      expect(model.getHealth()).to.equal(200);
    });

    it('should get/set maxHealth', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setMaxHealth(500);
      expect(model.getMaxHealth()).to.equal(500);
    });

    it('should calculate health percentage', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({ health: 50, maxHealth: 100 });
      expect(model.getHealthPercentage()).to.equal(0.5);
    });

    it('should return 0 health percentage when maxHealth is 0', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({ health: 50, maxHealth: 0 });
      expect(model.getHealthPercentage()).to.equal(0);
    });

    it('should check if alive (health > 0)', function() {
      if (!AntModel) this.skip();
      
      const model1 = new AntModel({ health: 10 });
      expect(model1.isAlive()).to.be.true;
      
      const model2 = new AntModel({ health: 0 });
      expect(model2.isAlive()).to.be.false;
    });
  });

  describe('Combat Properties', function() {
    it('should get/set damage', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setDamage(35);
      expect(model.getDamage()).to.equal(35);
    });

    it('should get/set attackRange', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setAttackRange(75);
      expect(model.getAttackRange()).to.equal(75);
    });

    it('should get/set combatTarget', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      const target = { id: 'enemy_123' };
      model.setCombatTarget(target);
      expect(model.getCombatTarget()).to.equal(target);
    });

    it('should check if has combat target', function() {
      if (!AntModel) this.skip();
      
      const model1 = new AntModel({ combatTarget: { id: 'enemy' } });
      expect(model1.hasCombatTarget()).to.be.true;
      
      const model2 = new AntModel({ combatTarget: null });
      expect(model2.hasCombatTarget()).to.be.false;
    });

    it('should clear combat target', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({ combatTarget: { id: 'enemy' } });
      model.clearCombatTarget();
      expect(model.getCombatTarget()).to.be.null;
      expect(model.hasCombatTarget()).to.be.false;
    });

    it('should get/set attackCooldown', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setAttackCooldown(30);
      expect(model.getAttackCooldown()).to.equal(30);
    });

    it('should check if attack ready (cooldown <= 0)', function() {
      if (!AntModel) this.skip();
      
      const model1 = new AntModel({ attackCooldown: 0 });
      expect(model1.isAttackReady()).to.be.true;
      
      const model2 = new AntModel({ attackCooldown: 10 });
      expect(model2.isAttackReady()).to.be.false;
    });

    it('should get/set lastEnemyCheck', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      const timestamp = Date.now();
      model.setLastEnemyCheck(timestamp);
      expect(model.getLastEnemyCheck()).to.equal(timestamp);
    });
  });

  describe('Resource Properties', function() {
    it('should get/set capacity', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setCapacity(15);
      expect(model.getCapacity()).to.equal(15);
    });

    it('should get/set resourceCount', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setResourceCount(8);
      expect(model.getResourceCount()).to.equal(8);
    });

    it('should check if at max capacity', function() {
      if (!AntModel) this.skip();
      
      const model1 = new AntModel({ capacity: 10, resourceCount: 10 });
      expect(model1.isAtMaxCapacity()).to.be.true;
      
      const model2 = new AntModel({ capacity: 10, resourceCount: 5 });
      expect(model2.isAtMaxCapacity()).to.be.false;
    });

    it('should get remaining capacity', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({ capacity: 10, resourceCount: 3 });
      expect(model.getRemainingCapacity()).to.equal(7);
    });
  });

  describe('Stats Properties', function() {
    it('should get/set strength', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setStrength(25);
      expect(model.getStrength()).to.equal(25);
    });

    it('should get/set gatherSpeed', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setGatherSpeed(35);
      expect(model.getGatherSpeed()).to.equal(35);
    });

    it('should get/set movementSpeed', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setMovementSpeed(85);
      expect(model.getMovementSpeed()).to.equal(85);
    });

    it('should get all stats as object', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({
        strength: 20,
        gatherSpeed: 15,
        movementSpeed: 55
      });
      
      const stats = model.getStats();
      expect(stats).to.deep.equal({
        strength: 20,
        gatherSpeed: 15,
        movementSpeed: 55
      });
    });

    it('should return copy of stats object (prevent external mutation)', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({ strength: 20 });
      const stats1 = model.getStats();
      const stats2 = model.getStats();
      
      stats1.strength = 999;
      expect(stats2.strength).to.equal(20); // Not mutated
      expect(model.getStrength()).to.equal(20); // Original not mutated
    });
  });

  describe('State Properties', function() {
    it('should get/set primary state', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setPrimaryState('GATHERING');
      expect(model.getPrimaryState()).to.equal('GATHERING');
    });

    it('should get/set combat modifier', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setCombatModifier('IN_COMBAT');
      expect(model.getCombatModifier()).to.equal('IN_COMBAT');
    });

    it('should get/set terrain modifier', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setTerrainModifier('IN_WATER');
      expect(model.getTerrainModifier()).to.equal('IN_WATER');
    });

    it('should get/set preferred state', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setPreferredState('PATROL');
      expect(model.getPreferredState()).to.equal('PATROL');
    });
  });

  describe('Job Properties', function() {
    it('should get/set job reference', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      const job = { name: 'Warrior', stats: { strength: 45 } };
      model.setJob(job);
      expect(model.getJob()).to.equal(job);
    });

    it('should get job image path', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({ jobImagePath: 'Images/Ants/warrior.png' });
      expect(model.getJobImagePath()).to.equal('Images/Ants/warrior.png');
    });

    it('should set job image path', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setJobImagePath('Images/Ants/scout.png');
      expect(model.getJobImagePath()).to.equal('Images/Ants/scout.png');
    });
  });

  describe('Timer Properties', function() {
    it('should get/set idle timer', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setIdleTimer(120);
      expect(model.getIdleTimer()).to.equal(120);
    });

    it('should get/set idle timer timeout', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setIdleTimerTimeout(300);
      expect(model.getIdleTimerTimeout()).to.equal(300);
    });

    it('should check if idle timeout exceeded', function() {
      if (!AntModel) this.skip();
      
      const model1 = new AntModel({ idleTimer: 350, idleTimerTimeout: 300 });
      expect(model1.isIdleTimeoutExceeded()).to.be.true;
      
      const model2 = new AntModel({ idleTimer: 250, idleTimerTimeout: 300 });
      expect(model2.isIdleTimeoutExceeded()).to.be.false;
    });

    it('should reset idle timer', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({ idleTimer: 250 });
      model.resetIdleTimer();
      expect(model.getIdleTimer()).to.equal(0);
    });
  });

  describe('Flag Properties', function() {
    it('should get/set isBoxHovered', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      model.setBoxHovered(true);
      expect(model.isBoxHovered()).to.be.true;
      
      model.setBoxHovered(false);
      expect(model.isBoxHovered()).to.be.false;
    });
  });

  describe('Component References', function() {
    it('should get/set brain reference', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      const brain = { hunger: 50 };
      model.setBrain(brain);
      expect(model.getBrain()).to.equal(brain);
    });

    it('should get/set stateMachine reference', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      const stateMachine = { primaryState: 'IDLE' };
      model.setStateMachine(stateMachine);
      expect(model.getStateMachine()).to.equal(stateMachine);
    });

    it('should get/set gatherState reference', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      const gatherState = { isActive: true };
      model.setGatherState(gatherState);
      expect(model.getGatherState()).to.equal(gatherState);
    });

    it('should get/set resourceManager reference', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      const resourceManager = { resources: [] };
      model.setResourceManager(resourceManager);
      expect(model.getResourceManager()).to.equal(resourceManager);
    });
  });

  describe('Purity Tests (NO logic/rendering)', function() {
    it('should NOT have update() method', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      expect(model.update).to.be.undefined;
    });

    it('should NOT have render() method', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      expect(model.render).to.be.undefined;
    });

    it('should NOT have brain update logic', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      expect(model.updateBrain).to.be.undefined;
      expect(model.checkHunger).to.be.undefined;
    });

    it('should NOT have combat logic', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      expect(model.attack).to.be.undefined;
      expect(model.takeDamage).to.be.undefined;
      expect(model.performCombatAttack).to.be.undefined;
    });

    it('should NOT have gathering logic', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      expect(model.startGathering).to.be.undefined;
      expect(model.stopGathering).to.be.undefined;
      expect(model.searchForResources).to.be.undefined;
    });

    it('should NOT have movement logic', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      expect(model.moveToLocation).to.be.undefined;
      expect(model.moveToResource).to.be.undefined;
    });
  });

  describe('Data Integrity', function() {
    it('should maintain data consistency across multiple getters', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({ health: 100, maxHealth: 200 });
      
      expect(model.getHealth()).to.equal(100);
      expect(model.getHealth()).to.equal(100); // Same value
      expect(model.getMaxHealth()).to.equal(200);
      expect(model.getMaxHealth()).to.equal(200); // Same value
    });

    it('should accept null values for optional properties', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel({
        combatTarget: null,
        job: null,
        brain: null
      });
      
      expect(model.getCombatTarget()).to.be.null;
      expect(model.getJob()).to.be.null;
      expect(model.getBrain()).to.be.null;
    });

    it('should handle undefined properties with defaults', function() {
      if (!AntModel) this.skip();
      
      const model = new AntModel();
      
      // Should have sensible defaults
      expect(model.getHealth()).to.be.a('number');
      expect(model.getMaxHealth()).to.be.a('number');
      expect(model.getCapacity()).to.be.a('number');
    });
  });
});
