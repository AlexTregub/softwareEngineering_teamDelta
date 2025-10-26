const { expect } = require('chai');

// Mock global logVerbose used by AntBrain
global.logVerbose = global.logVerbose || function() {};

// Load AntBrain (inline definition since it's not exported as a module)
const fs = require('fs');
const path = require('path');
const antBrainPath = path.join(__dirname, '..', '..', '..', 'Classes', 'ants', 'antBrain.js');
const antBrainCode = fs.readFileSync(antBrainPath, 'utf8');

// Extract the constants
const HUNGRY = 100;
const STARVING = 160;
const DEATH = 200;

// Load the class using Function constructor approach (same as queen.test.js)
const fn = new Function(antBrainCode + '\nreturn AntBrain;');
const AntBrain = fn();

describe('AntBrain', function() {
  let antMock;
  let brain;

  beforeEach(function() {
    antMock = {
      takeDamage: function(dmg) { this.damaged = dmg; }
    };
  });

  describe('Constructor', function() {
    it('should initialize with correct defaults', function() {
      brain = new AntBrain(antMock, 'Scout');
      expect(brain.ant).to.equal(antMock);
      expect(brain.antType).to.equal('Scout');
      expect(brain.hunger).to.equal(0);
      expect(brain.flag_).to.equal('');
      expect(brain.penalizedTrails).to.be.an('array').that.is.empty;
    });

    it('should call setPriority during construction', function() {
      brain = new AntBrain(antMock, 'Builder');
      // Builder should have high build trail priority
      expect(brain.followBuildTrail).to.be.greaterThan(0.5);
    });

    it('should handle different ant types', function() {
      const types = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
      types.forEach(type => {
        const b = new AntBrain(antMock, type);
        expect(b.antType).to.equal(type);
      });
    });
  });

  describe('setPriority', function() {
    beforeEach(function() {
      brain = new AntBrain(antMock, 'Scout');
    });

    it('should set Builder priorities correctly', function() {
      brain.setPriority('Builder', 1);
      expect(brain.followBuildTrail).to.equal(0.9);
      expect(brain.followForageTrail).to.equal(0.05);
      expect(brain.followBossTrail).to.equal(100);
    });

    it('should set Scout priorities correctly (balanced)', function() {
      brain.setPriority('Scout', 1);
      expect(brain.followBuildTrail).to.equal(0.25);
      expect(brain.followForageTrail).to.equal(0.25);
      expect(brain.followFarmTrail).to.equal(0.25);
      expect(brain.followEnemyTrail).to.equal(0.25);
    });

    it('should set Farmer priorities correctly', function() {
      brain.setPriority('Farmer', 1);
      expect(brain.followFarmTrail).to.equal(0.85);
      expect(brain.followBuildTrail).to.equal(0);
    });

    it('should set Warrior priorities correctly', function() {
      brain.setPriority('Warrior', 1);
      expect(brain.followEnemyTrail).to.equal(1);
      expect(brain.followBuildTrail).to.equal(0);
      expect(brain.followFarmTrail).to.equal(0);
    });

    it('should set Spitter priorities correctly', function() {
      brain.setPriority('Spitter', 1);
      expect(brain.followEnemyTrail).to.equal(1);
      expect(brain.followForageTrail).to.equal(0.2);
    });

    it('should set DeLozier priorities correctly', function() {
      brain.setPriority('DeLozier', 1);
      expect(brain.followBuildTrail).to.equal(0);
      expect(brain.followForageTrail).to.equal(0);
      expect(brain.followFarmTrail).to.equal(0);
      expect(brain.followEnemyTrail).to.equal(0);
      expect(brain.followBossTrail).to.equal(100);
    });

    it('should use default priorities for unknown types', function() {
      brain.setPriority('Unknown', 1);
      expect(brain.followForageTrail).to.equal(0.75);
      expect(brain.followEnemyTrail).to.equal(0.25);
    });

    it('should apply multiplier correctly', function() {
      brain.setPriority('Builder', 2);
      expect(brain.followBuildTrail).to.equal(1.8);
      expect(brain.followForageTrail).to.equal(0.1);
    });

    it('should handle zero multiplier', function() {
      brain.setPriority('Scout', 0);
      expect(brain.followBuildTrail).to.equal(0);
      expect(brain.followForageTrail).to.equal(0);
      expect(brain.followBossTrail).to.equal(0);
    });
  });

  describe('checkTrail', function() {
    beforeEach(function() {
      brain = new AntBrain(antMock, 'Builder');
      // Reset random for predictable tests
      global.Math.random = () => 0.5;
    });

    afterEach(function() {
      // Restore Math.random
      delete global.Math.random;
    });

    it('should return true when random check passes', function() {
      const pheromone = { name: 'Build', strength: 100, initial: 100 };
      global.Math.random = () => 0.1; // Low random = likely to follow
      const result = brain.checkTrail(pheromone);
      expect(result).to.be.true;
    });

    it('should return false when random check fails', function() {
      const pheromone = { name: 'Build', strength: 10, initial: 100 };
      global.Math.random = () => 0.9; // High random = unlikely to follow
      const result = brain.checkTrail(pheromone);
      expect(result).to.be.false;
    });

    it('should add penalty when trail is not followed', function() {
      const pheromone = { name: 'Build', strength: 10, initial: 100 };
      global.Math.random = () => 0.9;
      brain.checkTrail(pheromone);
      expect(brain.penalizedTrails.length).to.equal(1);
      expect(brain.penalizedTrails[0].name).to.equal('Build');
      expect(brain.penalizedTrails[0].penalty).to.equal(0.5);
    });

    it('should use trail priority in calculation', function() {
      // Builder has high build trail priority (0.9)
      const buildPheromone = { name: 'Build', strength: 100, initial: 100 };
      global.Math.random = () => 0.85; // Just under builder priority
      const result = brain.checkTrail(buildPheromone);
      expect(result).to.be.true;
    });
  });

  describe('addPenalty and getPenalty', function() {
    beforeEach(function() {
      brain = new AntBrain(antMock, 'Scout');
    });

    it('should add penalty to penalizedTrails array', function() {
      brain.addPenalty('Build', 0.3);
      expect(brain.penalizedTrails).to.have.lengthOf(1);
      expect(brain.penalizedTrails[0]).to.deep.equal({ name: 'Build', penalty: 0.3 });
    });

    it('should allow multiple penalties', function() {
      brain.addPenalty('Build', 0.3);
      brain.addPenalty('Forage', 0.7);
      expect(brain.penalizedTrails).to.have.lengthOf(2);
    });

    it('should use default penalty value when not specified', function() {
      brain.addPenalty('Farm');
      expect(brain.penalizedTrails[0].penalty).to.equal(0.5);
    });

    it('should return penalty for existing trail', function() {
      brain.addPenalty('Build', 0.3);
      const penalty = brain.getPenalty('Build');
      expect(penalty).to.equal(0.3);
    });

    it('should return 1 (default) for non-existent trail', function() {
      const penalty = brain.getPenalty('Nonexistent');
      expect(penalty).to.equal(1);
    });

    it('should handle multiple penalties for same trail (returns first)', function() {
      brain.addPenalty('Build', 0.3);
      brain.addPenalty('Build', 0.7);
      const penalty = brain.getPenalty('Build');
      expect(penalty).to.equal(0.3); // Returns first match
    });
  });

  describe('getTrailPriority', function() {
    beforeEach(function() {
      brain = new AntBrain(antMock, 'Warrior');
    });

    it('should return Build priority', function() {
      const priority = brain.getTrailPriority('Build');
      expect(priority).to.equal(brain.followBuildTrail);
    });

    it('should return Forage priority', function() {
      const priority = brain.getTrailPriority('Forage');
      expect(priority).to.equal(brain.followForageTrail);
    });

    it('should return Farm priority', function() {
      const priority = brain.getTrailPriority('Farm');
      expect(priority).to.equal(brain.followFarmTrail);
    });

    it('should return Enemy priority', function() {
      const priority = brain.getTrailPriority('Enemy');
      expect(priority).to.equal(brain.followEnemyTrail);
    });

    it('should return Boss priority', function() {
      const priority = brain.getTrailPriority('Boss');
      expect(priority).to.equal(brain.followBossTrail);
    });

    it('should return undefined for unknown trail type', function() {
      const priority = brain.getTrailPriority('Unknown');
      expect(priority).to.be.undefined;
    });
  });

  describe('modifyPriorityTrails', function() {
    beforeEach(function() {
      brain = new AntBrain(antMock, 'Builder');
    });

    it('should reset priorities when flag is "reset"', function() {
      brain.flag_ = 'reset';
      brain.followBuildTrail = 0; // Modify from default
      brain.modifyPriorityTrails();
      expect(brain.followBuildTrail).to.equal(0.9); // Back to Builder default
    });

    it('should modify priorities when hungry', function() {
      brain.flag_ = 'hungry';
      const originalBuild = brain.followBuildTrail;
      brain.modifyPriorityTrails();
      expect(brain.followForageTrail).to.equal(1);
      expect(brain.followBuildTrail).to.equal(originalBuild * 0.5);
    });

    it('should prioritize foraging when starving', function() {
      brain.flag_ = 'starving';
      brain.modifyPriorityTrails();
      expect(brain.followForageTrail).to.equal(2);
      expect(brain.followBuildTrail).to.equal(0);
      expect(brain.followFarmTrail).to.equal(0);
    });

    it('should zero all priorities when death flag', function() {
      brain.flag_ = 'death';
      brain.modifyPriorityTrails();
      expect(brain.followBuildTrail).to.equal(0);
      expect(brain.followForageTrail).to.equal(0);
      expect(brain.followFarmTrail).to.equal(0);
      expect(brain.followEnemyTrail).to.equal(0);
    });
  });

  describe('checkHunger', function() {
    beforeEach(function() {
      brain = new AntBrain(antMock, 'Scout');
      brain.decideState = function() {}; // Mock decideState
      brain.runFlagState = function() {}; // Mock runFlagState
    });

    it('should increment hunger', function() {
      brain.hunger = 0;
      brain.checkHunger();
      expect(brain.hunger).to.equal(1);
    });

    it('should set hungry flag at HUNGRY threshold', function() {
      brain.hunger = HUNGRY - 1;
      brain.checkHunger();
      expect(brain.flag_).to.equal('hungry');
    });

    it('should set starving flag at STARVING threshold', function() {
      brain.hunger = STARVING - 1;
      brain.checkHunger();
      expect(brain.flag_).to.equal('starving');
    });

    it('should set death flag and kill ant at DEATH threshold', function() {
      brain.hunger = DEATH - 1;
      brain.checkHunger();
      expect(brain.flag_).to.equal('death');
      expect(antMock.damaged).to.equal(999999); // takeDamage was called
    });

    it('should not kill Queen ant on death', function() {
      brain.antType = 'Queen';
      brain.hunger = DEATH - 1;
      brain.checkHunger();
      expect(antMock.damaged).to.be.undefined; // takeDamage not called for Queen
    });
  });

  describe('resetHunger', function() {
    beforeEach(function() {
      brain = new AntBrain(antMock, 'Scout');
      brain.runFlagState = function() {}; // Mock
    });

    it('should reset hunger to 0', function() {
      brain.hunger = 50;
      brain.resetHunger();
      expect(brain.hunger).to.equal(0);
    });

    it('should set reset flag', function() {
      brain.flag_ = 'hungry';
      brain.resetHunger();
      expect(brain.flag_).to.equal('reset');
    });

    it('should call runFlagState', function() {
      let called = false;
      brain.runFlagState = function() { called = true; };
      brain.resetHunger();
      expect(called).to.be.true;
    });
  });

  describe('runFlagState', function() {
    beforeEach(function() {
      brain = new AntBrain(antMock, 'Builder');
      brain.modifyPriorityTrails = function() { this.modifyCalled = true; };
    });

    it('should modify trails when hungry', function() {
      brain.flag_ = 'hungry';
      brain.runFlagState();
      expect(brain.modifyCalled).to.be.true;
    });

    it('should modify trails when starving', function() {
      brain.flag_ = 'starving';
      brain.runFlagState();
      expect(brain.modifyCalled).to.be.true;
    });

    it('should modify trails and clear flag on reset', function() {
      brain.flag_ = 'reset';
      brain.runFlagState();
      expect(brain.modifyCalled).to.be.true;
      expect(brain.flag_).to.equal('');
    });

    it('should handle death flag (no crash)', function() {
      brain.flag_ = 'death';
      expect(() => brain.runFlagState()).to.not.throw();
    });
  });

  describe('update and internalTimer', function() {
    beforeEach(function() {
      brain = new AntBrain(antMock, 'Scout');
      brain.checkHunger = function() { this.hungerChecked = true; };
    });

    it('should call internalTimer with deltaTime', function() {
      let timerCalled = false;
      brain.internalTimer = function(dt) { 
        timerCalled = true;
        expect(dt).to.be.a('number');
      };
      brain.update(0.016);
      expect(timerCalled).to.be.true;
    });

    it('should check hunger every second (accumulator >= 1)', function() {
      brain._accumulator = 0;
      brain.update(0.5); // Half second
      expect(brain.hungerChecked).to.be.undefined;
      
      brain.update(0.5); // Another half = 1 second total
      expect(brain.hungerChecked).to.be.true;
    });

    it('should reset accumulator after checking hunger', function() {
      brain._accumulator = 0;
      brain.update(1.5); // More than 1 second
      expect(brain._accumulator).to.be.lessThan(1);
    });

    it('should handle multiple seconds in one update', function() {
      brain._accumulator = 0;
      brain.hungerChecked = false;
      brain.checkHunger = function() { this.hungerChecked = true; };
      brain.update(2.5); // 2.5 seconds
      expect(brain.hungerChecked).to.be.true;
    });
  });

  describe('Edge Cases', function() {
    it('should handle null ant instance', function() {
      expect(() => new AntBrain(null, 'Scout')).to.not.throw();
    });

    it('should handle empty string ant type', function() {
      brain = new AntBrain(antMock, '');
      expect(brain.antType).to.equal('');
    });

    it('should handle very large deltaTime', function() {
      brain = new AntBrain(antMock, 'Scout');
      brain.checkHunger = function() {};
      expect(() => brain.update(100000)).to.not.throw();
    });

    it('should handle negative deltaTime', function() {
      brain = new AntBrain(antMock, 'Scout');
      brain._accumulator = 0;
      brain.update(-1);
      expect(brain._accumulator).to.equal(-1); // Accumulator can go negative
    });

    it('should handle zero multiplier in setPriority', function() {
      brain = new AntBrain(antMock, 'Scout');
      brain.setPriority('Builder', 0);
      expect(brain.followBuildTrail).to.equal(0);
      expect(brain.followBossTrail).to.equal(0);
    });
  });
});
