/**
 * AntModel Unit Tests - COMPLETE Coverage
 * 
 * Tests ALL ant-specific data storage:
 * - Ant identity (antIndex, jobName)
 * - System references (brain, stateMachine, gatherState, resourceManager, stats)
 * - Combat data (enemies, health, damage, target)
 * - Dropoff system (target dropoff)
 * - Timing (idle timers, delta time)
 * - Job system (job component, stats)
 * - ALL getters/setters
 * - Event emission for all changes
 * - Validation
 * 
 * Reference: docs/ANT_MVC_REQUIREMENTS.md
 */

const { expect } = require('chai');
const sinon = require('sinon');
const EntityModel = require('../../../Classes/baseMVC/models/EntityModel');

// Load AntModel when implemented
let AntModel;
try {
  AntModel = require('../../../Classes/baseMVC/models/AntModel');
} catch (e) {
  // Will fail initially (TDD red phase)
}

describe('AntModel', function() {
  let antModel;
  let mockBrain, mockStateMachine, mockGatherState, mockResourceManager, mockStats, mockJob;

  beforeEach(function() {
    // Create mock objects for ant systems
    mockBrain = { update: sinon.stub() };
    mockStateMachine = { 
      getCurrentState: sinon.stub().returns('IDLE'),
      setState: sinon.stub(),
      setStateChangeCallback: sinon.stub()
    };
    mockGatherState = { isActive: sinon.stub().returns(false) };
    mockResourceManager = { 
      getCurrentLoad: sinon.stub().returns(0),
      getMaxCapacity: sinon.stub().returns(25)
    };
    mockStats = { 
      strength: { statValue: 10 },
      health: { statValue: 100 },
      gatherSpeed: { statValue: 10 },
      movementSpeed: { statValue: 60 }
    };
    mockJob = {
      stats: { strength: 10, health: 100, gatherSpeed: 10, movementSpeed: 60 }
    };

    // Create AntModel if available
    if (AntModel) {
      antModel = new AntModel(100, 200, 32, 32, {
        type: 'Ant',
        jobName: 'Scout',
        faction: 'player'
      });
    }
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Constructor', function() {
    it('should extend EntityModel', function() {
      expect(antModel).to.be.instanceOf(EntityModel);
    });

    it('should create with ant-specific type', function() {
      expect(antModel.getType()).to.equal('Ant');
    });

    it('should initialize with jobName from options', function() {
      expect(antModel.getJobName()).to.equal('Scout');
    });

    it('should generate unique antIndex', function() {
      const ant1 = new AntModel(0, 0, 32, 32);
      const ant2 = new AntModel(0, 0, 32, 32);
      expect(ant1.getAntIndex()).to.not.equal(ant2.getAntIndex());
    });

    it('should default jobName to Worker', function() {
      const ant = new AntModel(0, 0, 32, 32);
      expect(ant.getJobName()).to.equal('Worker');
    });

    it('should initialize combat properties', function() {
      expect(antModel.getHealth()).to.be.a('number');
      expect(antModel.getMaxHealth()).to.be.a('number');
      expect(antModel.getDamage()).to.be.a('number');
    });

    it('should initialize timing properties', function() {
      expect(antModel.getIdleTimer()).to.equal(0);
      expect(antModel.getIdleTimerTimeout()).to.be.a('number');
    });

    it('should initialize empty enemies array', function() {
      expect(antModel.getEnemies()).to.deep.equal([]);
    });
  });

  describe('Ant Identity', function() {
    it('should get antIndex', function() {
      const index = antModel.getAntIndex();
      expect(index).to.be.a('number');
      expect(index).to.be.at.least(0);
    });

    it('should get jobName', function() {
      expect(antModel.getJobName()).to.equal('Scout');
    });

    it('should set jobName', function() {
      antModel.setJobName('Warrior');
      expect(antModel.getJobName()).to.equal('Warrior');
    });

    it('should emit jobNameChanged event', function() {
      const callback = sinon.stub();
      antModel.on('jobNameChanged', callback);
      
      antModel.setJobName('Farmer');
      
      expect(callback.called).to.be.true;
      expect(callback.firstCall.args[0]).to.have.property('oldValue', 'Scout');
      expect(callback.firstCall.args[0]).to.have.property('newValue', 'Farmer');
    });

    it('should validate jobName as string', function() {
      expect(() => antModel.setJobName(123)).to.throw('Job name must be a string');
    });
  });

  describe('System References', function() {
    it('should set and get brain', function() {
      antModel.setBrain(mockBrain);
      expect(antModel.getBrain()).to.equal(mockBrain);
    });

    it('should set and get stateMachine', function() {
      antModel.setStateMachine(mockStateMachine);
      expect(antModel.getStateMachine()).to.equal(mockStateMachine);
    });

    it('should set and get gatherState', function() {
      antModel.setGatherState(mockGatherState);
      expect(antModel.getGatherState()).to.equal(mockGatherState);
    });

    it('should set and get resourceManager', function() {
      antModel.setResourceManager(mockResourceManager);
      expect(antModel.getResourceManager()).to.equal(mockResourceManager);
    });

    it('should set and get stats container', function() {
      antModel.setStatsContainer(mockStats);
      expect(antModel.getStatsContainer()).to.equal(mockStats);
    });

    it('should set and get job component', function() {
      antModel.setJobComponent(mockJob);
      expect(antModel.getJobComponent()).to.equal(mockJob);
    });

    it('should emit events when systems are set', function() {
      const callback = sinon.stub();
      antModel.on('brainChanged', callback);
      
      antModel.setBrain(mockBrain);
      
      expect(callback.called).to.be.true;
    });

    it('should allow null system references', function() {
      antModel.setBrain(null);
      expect(antModel.getBrain()).to.be.null;
    });

    it('should get health controller', function() {
      const healthController = antModel.getHealthController();
      expect(healthController).to.exist;
      expect(healthController).to.be.an('object');
    });

    it('should have health controller with render method', function() {
      const healthController = antModel.getHealthController();
      expect(healthController.render).to.be.a('function');
    });

    it('should have health controller with update method', function() {
      const healthController = antModel.getHealthController();
      expect(healthController.update).to.be.a('function');
    });
  });

  describe('Combat Properties', function() {
    it('should get health', function() {
      expect(antModel.getHealth()).to.be.a('number');
    });

    it('should set health', function() {
      antModel.setHealth(50);
      expect(antModel.getHealth()).to.equal(50);
    });

    it('should clamp health to 0-maxHealth', function() {
      antModel.setHealth(-10);
      expect(antModel.getHealth()).to.equal(0);
      
      antModel.setHealth(999999);
      expect(antModel.getHealth()).to.equal(antModel.getMaxHealth());
    });

    it('should emit healthChanged event', function() {
      const callback = sinon.stub();
      antModel.on('healthChanged', callback);
      
      antModel.setHealth(75);
      
      expect(callback.called).to.be.true;
      expect(callback.firstCall.args[0]).to.have.property('newValue', 75);
    });

    it('should get maxHealth', function() {
      expect(antModel.getMaxHealth()).to.be.a('number');
      expect(antModel.getMaxHealth()).to.be.greaterThan(0);
    });

    it('should set maxHealth', function() {
      antModel.setMaxHealth(150);
      expect(antModel.getMaxHealth()).to.equal(150);
    });

    it('should validate maxHealth as positive', function() {
      expect(() => antModel.setMaxHealth(-10)).to.throw();
    });

    it('should get damage', function() {
      expect(antModel.getDamage()).to.be.a('number');
    });

    it('should set damage', function() {
      antModel.setDamage(25);
      expect(antModel.getDamage()).to.equal(25);
    });

    it('should get attackRange', function() {
      expect(antModel.getAttackRange()).to.be.a('number');
    });

    it('should set attackRange', function() {
      antModel.setAttackRange(75);
      expect(antModel.getAttackRange()).to.equal(75);
    });
  });

  describe('Enemy Tracking', function() {
    it('should get enemies array', function() {
      const enemies = antModel.getEnemies();
      expect(enemies).to.be.an('array');
    });

    it('should add enemy', function() {
      const enemy = { id: 'enemy1' };
      antModel.addEnemy(enemy);
      
      expect(antModel.getEnemies()).to.include(enemy);
    });

    it('should remove enemy', function() {
      const enemy = { id: 'enemy1' };
      antModel.addEnemy(enemy);
      antModel.removeEnemy(enemy);
      
      expect(antModel.getEnemies()).to.not.include(enemy);
    });

    it('should clear all enemies', function() {
      antModel.addEnemy({ id: 'enemy1' });
      antModel.addEnemy({ id: 'enemy2' });
      antModel.clearEnemies();
      
      expect(antModel.getEnemies()).to.deep.equal([]);
    });

    it('should emit enemiesChanged event', function() {
      const callback = sinon.stub();
      antModel.on('enemiesChanged', callback);
      
      antModel.addEnemy({ id: 'enemy1' });
      
      expect(callback.called).to.be.true;
    });

    it('should get combat target', function() {
      expect(antModel.getCombatTarget()).to.be.null;
    });

    it('should set combat target', function() {
      const target = { id: 'target1' };
      antModel.setCombatTarget(target);
      
      expect(antModel.getCombatTarget()).to.equal(target);
    });

    it('should clear combat target', function() {
      antModel.setCombatTarget({ id: 'target1' });
      antModel.setCombatTarget(null);
      
      expect(antModel.getCombatTarget()).to.be.null;
    });

    it('should get lastEnemyCheck', function() {
      expect(antModel.getLastEnemyCheck()).to.be.a('number');
    });

    it('should set lastEnemyCheck', function() {
      antModel.setLastEnemyCheck(100);
      expect(antModel.getLastEnemyCheck()).to.equal(100);
    });

    it('should get enemyCheckInterval', function() {
      expect(antModel.getEnemyCheckInterval()).to.be.a('number');
    });

    it('should set enemyCheckInterval', function() {
      antModel.setEnemyCheckInterval(60);
      expect(antModel.getEnemyCheckInterval()).to.equal(60);
    });
  });

  describe('Dropoff System', function() {
    it('should get target dropoff (initially null)', function() {
      expect(antModel.getTargetDropoff()).to.be.null;
    });

    it('should set target dropoff', function() {
      const dropoff = { x: 5, y: 10, getCenterPx: sinon.stub() };
      antModel.setTargetDropoff(dropoff);
      
      expect(antModel.getTargetDropoff()).to.equal(dropoff);
    });

    it('should clear target dropoff', function() {
      antModel.setTargetDropoff({ x: 5, y: 10 });
      antModel.setTargetDropoff(null);
      
      expect(antModel.getTargetDropoff()).to.be.null;
    });

    it('should emit targetDropoffChanged event', function() {
      const callback = sinon.stub();
      antModel.on('targetDropoffChanged', callback);
      
      const dropoff = { x: 5, y: 10 };
      antModel.setTargetDropoff(dropoff);
      
      expect(callback.called).to.be.true;
      expect(callback.firstCall.args[0]).to.have.property('newValue', dropoff);
    });
  });

  describe('Timing Properties', function() {
    it('should get idle timer', function() {
      expect(antModel.getIdleTimer()).to.equal(0);
    });

    it('should set idle timer', function() {
      antModel.setIdleTimer(5.5);
      expect(antModel.getIdleTimer()).to.equal(5.5);
    });

    it('should get idle timer timeout', function() {
      expect(antModel.getIdleTimerTimeout()).to.be.a('number');
    });

    it('should set idle timer timeout', function() {
      antModel.setIdleTimerTimeout(3.0);
      expect(antModel.getIdleTimerTimeout()).to.equal(3.0);
    });

    it('should get last frame time', function() {
      expect(antModel.getLastFrameTime()).to.be.a('number');
    });

    it('should set last frame time', function() {
      antModel.setLastFrameTime(12345.67);
      expect(antModel.getLastFrameTime()).to.equal(12345.67);
    });

    it('should validate timing values as numbers', function() {
      expect(() => antModel.setIdleTimer('invalid')).to.throw();
    });
  });

  describe('Path Type', function() {
    it('should get path type (initially null)', function() {
      expect(antModel.getPathType()).to.be.null;
    });

    it('should set path type', function() {
      antModel.setPathType('avoidWater');
      expect(antModel.getPathType()).to.equal('avoidWater');
    });

    it('should clear path type', function() {
      antModel.setPathType('avoidWater');
      antModel.setPathType(null);
      expect(antModel.getPathType()).to.be.null;
    });
  });

  describe('Box Hover State', function() {
    it('should get box hover state (initially false)', function() {
      expect(antModel.isBoxHovered()).to.be.false;
    });

    it('should set box hover state', function() {
      antModel.setBoxHovered(true);
      expect(antModel.isBoxHovered()).to.be.true;
    });

    it('should emit boxHoverChanged event', function() {
      const callback = sinon.stub();
      antModel.on('boxHoverChanged', callback);
      
      antModel.setBoxHovered(true);
      
      expect(callback.called).to.be.true;
      expect(callback.firstCall.args[0]).to.have.property('newValue', true);
    });
  });

  describe('Job Stats Integration', function() {
    it('should store job stats', function() {
      const stats = { strength: 20, health: 150, gatherSpeed: 15, movementSpeed: 70 };
      antModel.setJobStats(stats);
      
      expect(antModel.getJobStats()).to.deep.equal(stats);
    });

    it('should emit jobStatsChanged event', function() {
      const callback = sinon.stub();
      antModel.on('jobStatsChanged', callback);
      
      const stats = { strength: 20, health: 150, gatherSpeed: 15, movementSpeed: 70 };
      antModel.setJobStats(stats);
      
      expect(callback.called).to.be.true;
    });

    it('should validate job stats structure', function() {
      expect(() => antModel.setJobStats('invalid')).to.throw();
    });

    it('should get default job stats if not set', function() {
      const stats = antModel.getJobStats();
      expect(stats).to.be.an('object');
      expect(stats).to.have.property('resourcesGathered');
      expect(stats).to.have.property('distanceTraveled');
      expect(stats).to.have.property('enemiesDefeated');
    });
  });

  describe('Data Immutability', function() {
    it('should return copy of enemies array', function() {
      const enemy = { id: 'enemy1' };
      antModel.addEnemy(enemy);
      
      const enemies1 = antModel.getEnemies();
      const enemies2 = antModel.getEnemies();
      
      expect(enemies1).to.not.equal(enemies2);
      expect(enemies1).to.deep.equal(enemies2);
    });

    it('should return copy of job stats', function() {
      const stats = { strength: 20, health: 150, gatherSpeed: 15, movementSpeed: 70 };
      antModel.setJobStats(stats);
      
      const stats1 = antModel.getJobStats();
      const stats2 = antModel.getJobStats();
      
      expect(stats1).to.not.equal(stats2);
      expect(stats1).to.deep.equal(stats2);
    });
  });

  describe('Event System Integration', function() {
    it('should inherit event system from EntityModel', function() {
      expect(antModel.on).to.be.a('function');
      expect(antModel.off).to.be.a('function');
      expect(antModel.emit).to.be.a('function');
    });

    it('should support multiple listeners on ant events', function() {
      const callback1 = sinon.stub();
      const callback2 = sinon.stub();
      
      antModel.on('healthChanged', callback1);
      antModel.on('healthChanged', callback2);
      
      antModel.setHealth(50);
      
      expect(callback1.called).to.be.true;
      expect(callback2.called).to.be.true;
    });

    it('should remove ant event listeners', function() {
      const callback = sinon.stub();
      antModel.on('jobNameChanged', callback);
      antModel.off('jobNameChanged', callback);
      
      antModel.setJobName('Warrior');
      
      expect(callback.called).to.be.false;
    });
  });

  describe('Validation', function() {
    it('should validate health as number', function() {
      expect(() => antModel.setHealth('invalid')).to.throw();
    });

    it('should validate maxHealth as positive number', function() {
      expect(() => antModel.setMaxHealth(-10)).to.throw();
      expect(() => antModel.setMaxHealth(0)).to.throw();
    });

    it('should validate damage as non-negative number', function() {
      expect(() => antModel.setDamage(-5)).to.throw();
    });

    it('should validate timing values as numbers', function() {
      expect(() => antModel.setIdleTimer(null)).to.throw();
      expect(() => antModel.setLastFrameTime('invalid')).to.throw();
    });

    it('should validate jobName as non-empty string', function() {
      expect(() => antModel.setJobName('')).to.throw('Job name cannot be empty');
      expect(() => antModel.setJobName(null)).to.throw('Job name must be a string');
    });
  });

  describe('Gathering State', function() {
    it('should initialize gathering state to false', function() {
      expect(antModel.isGathering()).to.equal(false);
    });

    it('should set gathering state to true', function() {
      antModel.setGathering(true);
      expect(antModel.isGathering()).to.equal(true);
    });

    it('should set gathering state to false', function() {
      antModel.setGathering(true);
      antModel.setGathering(false);
      expect(antModel.isGathering()).to.equal(false);
    });

    it('should emit gatheringChanged event when gathering state changes', function() {
      const callback = sinon.spy();
      antModel.on('gatheringChanged', callback);
      
      antModel.setGathering(true);
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.deep.equal({
        oldValue: false,
        newValue: true
      });
    });

    it('should throw error if gathering state is not boolean', function() {
      expect(() => antModel.setGathering('yes')).to.throw('Gathering state must be a boolean');
      expect(() => antModel.setGathering(1)).to.throw('Gathering state must be a boolean');
      expect(() => antModel.setGathering(null)).to.throw('Gathering state must be a boolean');
    });
  });

  describe('Complete Data Access', function() {
    it('should provide all ant-specific properties', function() {
      // Verify all required getters exist
      expect(antModel.getAntIndex).to.be.a('function');
      expect(antModel.getJobName).to.be.a('function');
      expect(antModel.getBrain).to.be.a('function');
      expect(antModel.getStateMachine).to.be.a('function');
      expect(antModel.getGatherState).to.be.a('function');
      expect(antModel.getResourceManager).to.be.a('function');
      expect(antModel.getStatsContainer).to.be.a('function');
      expect(antModel.getJobComponent).to.be.a('function');
      expect(antModel.getHealth).to.be.a('function');
      expect(antModel.getMaxHealth).to.be.a('function');
      expect(antModel.getDamage).to.be.a('function');
      expect(antModel.getAttackRange).to.be.a('function');
      expect(antModel.getEnemies).to.be.a('function');
      expect(antModel.getCombatTarget).to.be.a('function');
      expect(antModel.getTargetDropoff).to.be.a('function');
      expect(antModel.getIdleTimer).to.be.a('function');
      expect(antModel.getPathType).to.be.a('function');
      expect(antModel.isBoxHovered).to.be.a('function');
      expect(antModel.getJobStats).to.be.a('function');
      expect(antModel.isGathering).to.be.a('function');
    });

    it('should provide all ant-specific setters', function() {
      // Verify all required setters exist
      expect(antModel.setJobName).to.be.a('function');
      expect(antModel.setBrain).to.be.a('function');
      expect(antModel.setStateMachine).to.be.a('function');
      expect(antModel.setGatherState).to.be.a('function');
      expect(antModel.setResourceManager).to.be.a('function');
      expect(antModel.setStatsContainer).to.be.a('function');
      expect(antModel.setJobComponent).to.be.a('function');
      expect(antModel.setHealth).to.be.a('function');
      expect(antModel.setMaxHealth).to.be.a('function');
      expect(antModel.setDamage).to.be.a('function');
      expect(antModel.setAttackRange).to.be.a('function');
      expect(antModel.setCombatTarget).to.be.a('function');
      expect(antModel.setTargetDropoff).to.be.a('function');
      expect(antModel.setIdleTimer).to.be.a('function');
      expect(antModel.setPathType).to.be.a('function');
      expect(antModel.setBoxHovered).to.be.a('function');
      expect(antModel.setJobStats).to.be.a('function');
      expect(antModel.setGathering).to.be.a('function');
    });
  });
});
