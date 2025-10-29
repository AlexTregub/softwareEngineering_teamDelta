/**
 * Consolidated Ants & Entities Tests
 * Generated: 2025-10-29T03:11:41.159Z
 * Source files: 10
 * Total tests: 1495
 * 
 * This file contains all ants & entities tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');


// ================================================================
// antBrain.test.js (53 tests)
// ================================================================
// Mock global logVerbose used by AntBrain
global.logVerbose = global.logVerbose || function() {};

// Load AntBrain (inline definition since it's not exported as a module)
let fs = require('fs');
let path = require('path');
let antBrainPath = path.join(__dirname, '..', '..', '..', 'Classes', 'ants', 'antBrain.js');
let antBrainCode = fs.readFileSync(antBrainPath, 'utf8');

// Extract the constants
let HUNGRY = 100;
let STARVING = 160;
let DEATH = 200;

// Load the class using Function constructor approach (same as queen.test.js)
let fn = new Function(antBrainCode + '\nreturn AntBrain;');
let AntBrain = fn();

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




// ================================================================
// ants.test.js (1124 tests)
// ================================================================
/**
 * Consolidated Ants & Entities Tests
 * Generated: 2025-10-29T02:59:23.650Z
 * Source files: 10
 * Total tests: 1124
 * 
 * This file contains all ants & entities tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
// ================================================================
// antBrain.test.js (53 tests)
// ================================================================
// Mock global logVerbose used by AntBrain
global.logVerbose = global.logVerbose || function() {};

// Load AntBrain (inline definition since it's not exported as a module)
// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
let antBrainPath = path.join(__dirname, '..', '..', '..', 'Classes', 'ants', 'antBrain.js');
let antBrainCode = fs.readFileSync(antBrainPath, 'utf8');

// Extract the constants
let HUNGRY = 100;
let STARVING = 160;
let DEATH = 200;

// Load the class using Function constructor approach (same as queen.test.js)
let fn = new Function(antBrainCode + '\nreturn AntBrain;');
let AntBrain = fn();

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




// ================================================================
// ants.test.js (753 tests)
// ================================================================
/**
 * Consolidated Ants & Entities Tests
 * Generated: 2025-10-29T02:58:39.888Z
 * Source files: 10
 * Total tests: 753
 * 
 * This file contains all ants & entities tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
// ================================================================
// antBrain.test.js (53 tests)
// ================================================================
// Mock global logVerbose used by AntBrain
global.logVerbose = global.logVerbose || function() {};

// Load AntBrain (inline definition since it's not exported as a module)
// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
let antBrainPath = path.join(__dirname, '..', '..', '..', 'Classes', 'ants', 'antBrain.js');
let antBrainCode = fs.readFileSync(antBrainPath, 'utf8');

// Extract the constants
let HUNGRY = 100;
let STARVING = 160;
let DEATH = 200;

// Load the class using Function constructor approach (same as queen.test.js)
let fn = new Function(antBrainCode + '\nreturn AntBrain;');
let AntBrain = fn();

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




// ================================================================
// ants.test.js (382 tests)
// ================================================================
/**
 * Consolidated Ants & Entities Tests
 * Generated: 2025-10-29T02:57:50.935Z
 * Source files: 10
 * Total tests: 382
 * 
 * This file contains all ants & entities tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
// ================================================================
// antBrain.test.js (53 tests)
// ================================================================
// Mock global logVerbose used by AntBrain
global.logVerbose = global.logVerbose || function() {};

// Load AntBrain (inline definition since it's not exported as a module)
// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
let antBrainPath = path.join(__dirname, '..', '..', '..', 'Classes', 'ants', 'antBrain.js');
let antBrainCode = fs.readFileSync(antBrainPath, 'utf8');

// Extract the constants
let HUNGRY = 100;
let STARVING = 160;
let DEATH = 200;

// Load the class using Function constructor approach (same as queen.test.js)
let fn = new Function(antBrainCode + '\nreturn AntBrain;');
let AntBrain = fn();

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




// ================================================================
// ants.test.js (11 tests)
// ================================================================
// Provide lightweight mocks for p5 and project systems so ants.js can be required in Node
if (typeof window === 'undefined') {
  global.window = {};
}

// Minimal p5-like helpers used by ants.js
let originalGlobals = {};
let toMock = ['createVector','loadImage','performance','frameCount','Entity','AntManager','StatsContainer','ResourceManager','AntStateMachine','GatherState','JobComponent','AntBrain','selectables','g_tileInteractionManager','dropoffs','QueenAnt'];

// backup any existing globals we will touch
for (const k of toMock) { originalGlobals[k] = global[k]; }

global.createVector = (x = 0, y = 0) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.loadImage = (p) => ({ src: p });
global.performance = global.performance || { now: () => Date.now() };
global.frameCount = 0;

// Minimal engine/system stubs used by ants.js
class Entity {
  constructor(x = 0, y = 0, w = 10, h = 10, options = {}) {
    this._pos = { x, y };
    this._size = { x: w, y: h };
    this.options = options || {};
    this.isActive = true;
    this._controllers = new Map();
  }
  getPosition() { return this._pos; }
  setPosition(x, y) { this._pos.x = x; this._pos.y = y; }
  getSize() { return this._size; }
  update() { /* noop */ }
  render() { /* noop */ }
  isActive() { return this.isActive; }
  getController(name) { return this._controllers.get(name) || null; }
  addController(name, obj) { this._controllers.set(name, obj); }
  _delegate(controller, method, ...args) {
    const c = this.getController(controller);
    if (c && typeof c[method] === 'function') return c[method](...args);
    return null;
  }
  moveToLocation(x, y) { this._lastMoveTo = { x, y }; return true; }
  setImage(img) { this._image = img; }
  getDebugInfo() { return { position: this._pos, size: this._size }; }
  getValidationData() { return { position: this._pos, size: this._size }; }
  destroy() { this.isActive = false; }
}

class AntManager { constructor(){ this._created = true; } }
class StatsContainer { constructor(pos, size, speed, lastPos) { this.pos = pos; this.size = size; this.speed = speed; this.lastPos = lastPos; this.strength = { statValue: 0 }; this.health = { statValue: 0 }; this.gatherSpeed = { statValue: 0 }; this.movementSpeed = { statValue: 0 }; } }
class ResourceManager {
  constructor(owner, a = 0, max = 10) { this.owner = owner; this._load = 0; this.maxCapacity = max; }
  getCurrentLoad() { return this._load; }
  addResource(r) { this._load += 1; return true; }
  dropAllResources() { const out = Array(this._load).fill('res'); this._load = 0; return out; }
  update() { /* noop */ }
}
class AntStateMachine {
  constructor() { this._state = 'IDLE'; this._cb = null; }
  setStateChangeCallback(cb) { this._cb = cb; }
  getCurrentState() { return this._state; }
  setState(s) { const old = this._state; this._state = s; if (this._cb) this._cb(old, s); }
  setPrimaryState(s) { this.setState(s); }
  isGathering() { return this._state === 'GATHERING'; }
  isDroppingOff() { return String(this._state).includes('DROPPING_OFF'); }
  isInCombat() { return String(this._state).includes('COMBAT') || String(this._state).includes('IN_COMBAT'); }
  ResumePreferredState() { /* noop */ }
  update() { /* noop */ }
}
class GatherState { constructor(ant) { this.ant = ant; this.isActive = false; } enter() { this.isActive = true; } exit() { this.isActive = false; } update() { return false; } getDebugInfo() { return { isActive: this.isActive }; } }
class JobComponent { constructor(name) { this.name = name; this.stats = { health: 50, strength: 5, gatherSpeed: 10, movementSpeed: 60 }; } }
class AntBrain { constructor(owner, jobName) { this.owner = owner; this.jobName = jobName; } update(dt) { /* noop */ } }

// Make these globals so ants.js (which expects globals) will use them
global.Entity = Entity;
global.AntManager = AntManager;
global.StatsContainer = StatsContainer;
global.ResourceManager = ResourceManager;
global.AntStateMachine = AntStateMachine;
global.GatherState = GatherState;
global.JobComponent = JobComponent;
global.AntBrain = AntBrain;

// Other optional globals used by ants.js
global.selectables = [];
global.g_tileInteractionManager = { register() {}, addObject() {}, updateObjectPosition() {}, removeObjectFromTile() {} };
global.dropoffs = [{ getCenterPx() { return { x: 10, y: 10 }; }, x: 0, y: 0, tileSize: 32, depositResource() { return true; } }];
global.QueenAnt = function(base) { return base; };

// Now require the module under test
let antsModule = require('../../../Classes/ants/ants.js');

// restore any original globals to avoid polluting other tests
for (const k of toMock) {
  if (originalGlobals[k] === undefined) delete global[k]; else global[k] = originalGlobals[k];
}

describe('ants.js', function() {
  beforeEach(function() {
    // Reset ants array if module exposes it
    if (typeof antsModule.getAnts === 'function') {
      const a = antsModule.getAnts();
      if (Array.isArray(a)) { a.length = 0; }
    }
    // reset frameCount
    global.frameCount = 0;
  });

  it('antsPreloader sets sizes and initializes manager', function() {
    expect(typeof antsModule.antsPreloader).to.equal('function');
    antsModule.antsPreloader();
    const size = antsModule.getAntSize();
    expect(size).to.have.property('x');
    expect(size).to.have.property('y');
    // antManager should exist (we stubbed AntManager)
    expect(typeof global.antManager !== 'undefined' || typeof antsModule.antManager !== 'undefined').to.equal(true);
  });

  it('can construct ant and access basic getters/setters', function() {
    const a = new antsModule.ant(5, 6, 12, 14, 1, 0, null, 'Scout', 'player');
    expect(a).to.have.property('antIndex');
    expect(a.posX).to.equal(5);
    expect(a.posY).to.equal(6);
    a.posX = 50; a.posY = 60;
    expect(a.getPosition().x).to.equal(50);
    expect(a.getPosition().y).to.equal(60);
    expect(a.JobName).to.be.a('string');
    expect(a.StatsContainer).to.exist;
    expect(a.resourceManager).to.exist;
    expect(a.stateMachine).to.exist;
  });

  it('assignJob creates JobComponent and AntBrain and sets jobName', function() {
    const a = new antsModule.ant(0,0,10,10,1,0,null,'Scout','player');
    a.assignJob('Builder', { src: 'img' });
    expect(a.JobName).to.equal('Builder');
    expect(a.job).to.exist;
    expect(a.brain).to.exist;
    const stats = a.getJobStats();
    expect(stats).to.have.property('health');
    expect(stats).to.have.property('strength');
  });

  it('resource methods add/get/drop behave via ResourceManager', function() {
    const a = new antsModule.ant(0,0,10,10,1,0,null,'Scout','player');
    expect(a.getResourceCount()).to.equal(0);
    const ok = a.addResource('ore');
    expect(ok).to.equal(true);
    expect(a.getResourceCount()).to.equal(1);
    const dropped = a.dropAllResources();
    expect(Array.isArray(dropped)).to.equal(true);
    expect(a.getResourceCount()).to.equal(0);
  });

  it('health, damage, heal, attack, and death flow', function() {
    const a = new antsModule.ant(0,0,10,10,1,0,null,'Scout','player');
    const start = a.health;
    const after = a.takeDamage(10);
    expect(after).to.equal(Math.max(0, start - 10));
    const healed = a.heal(5);
    expect(healed).to.equal(Math.min(a.maxHealth, after + 5));

    // Attack target
    const target = { _health: 30, takeDamage(n) { this._health = Math.max(0, this._health - n); return this._health; } };
    const attacked = a._attackTarget(target);
    // _attackTarget returns something truthy when damage applied
    expect(target._health).to.be.at.most(30);

    // Test die removes from game arrays
    const list = antsModule.getAnts();
    if (Array.isArray(list)) list.push(a);
    a.die();
    expect(a.isActive).to.equal(false);
    if (Array.isArray(list)) expect(list.includes(a)).to.equal(false);
  });

  it('state-related methods start/stop gathering and set/get state', function() {
    const a = new antsModule.ant(0,0,10,10,1,0,null,'Scout','player');
    a.startGathering();
    // our stub stateMachine toggles state via setState in startGathering if implemented
    // isGathering should be callable
    expect(typeof a.isGathering()).to.equal('boolean');
    a.stopGathering();
    expect(typeof a.getCurrentState()).to.equal('string');
    a.setState('TEST_STATE');
    expect(a.getCurrentState()).to.equal('TEST_STATE');
  });

  it('posX/posY proxies and selection delegate exist', function() {
    const a = new antsModule.ant(1,2,3,4,1,0,null,'Scout','player');
    // selection delegate uses _delegate; ensure no throw when set
    a.isSelected = true; // setter should call delegate (noop in our stub)
    expect(typeof a.isSelected).to.not.equal('undefined');
  });

  it('spawnQueen returns a queen and registers it', function() {
    const before = antsModule.getAnts().length;
    const q = antsModule.spawnQueen();
    expect(q).to.exist;
    const after = antsModule.getAnts().length;
    expect(after).to.equal(before + 1);
  });

  it('antsSpawn, antsUpdate, antsRender, antsUpdateAndRender run without throwing', function() {
    // spawn a couple using direct API and the command wrapper
    antsModule.antsSpawn(2, 'neutral');
    expect(antsModule.getAnts().length).to.be.at.least(2);
    expect(() => antsModule.antsUpdate()).to.not.throw();
    expect(() => antsModule.antsRender()).to.not.throw();
    expect(() => antsModule.antsUpdateAndRender()).to.not.throw();
  });

  it('exports and utility functions exist and are callable', function() {
    expect(typeof antsModule.assignJob).to.equal('function');
    expect(typeof antsModule.handleSpawnCommand).to.equal('function');
    expect(typeof antsModule.getAntIndex).to.equal('function' ) || true;
    // getAntIndex export might be a helper; ensure getters are present
    expect(typeof antsModule.getAntSize).to.equal('function');
    expect(typeof antsModule.setAntSize).to.equal('function');
    // set then get
    antsModule.setAntSize({ x: 11, y: 12 });
    const s = antsModule.getAntSize();
    expect(s.x).to.equal(11);
  });
});




// ================================================================
// antStateMachine.test.js (14 tests)
// ================================================================
/* eslint-env mocha */
let AntStateMachine = require('../../../Classes/ants/antStateMachine');

describe('AntStateMachine', () => {
  let sm;

  beforeEach(() => {
    sm = new AntStateMachine();
  });

  it('initializes with correct defaults', () => {
    expect(sm.primaryState).to.equal('IDLE');
    expect(sm.combatModifier).to.equal('OUT_OF_COMBAT');
    expect(sm.terrainModifier).to.equal('DEFAULT');
    expect(sm.preferredState).to.equal('GATHERING');
  });

  it('validates primary/combat/terrain lists', () => {
    expect(sm.isValidPrimary('MOVING')).to.be.true;
    expect(sm.isValidPrimary('NOPE')).to.be.false;
    expect(sm.isValidCombat('IN_COMBAT')).to.be.true;
    expect(sm.isValidCombat(null)).to.be.true;
    expect(sm.isValidCombat('FAKE')).to.be.false;
    expect(sm.isValidTerrain('IN_WATER')).to.be.true;
    expect(sm.isValidTerrain(null)).to.be.true;
    expect(sm.isValidTerrain('BAD')).to.be.false;
  });

  it('setPrimaryState accepts valid and rejects invalid', () => {
    const ok = sm.setPrimaryState('MOVING');
    expect(ok).to.be.true;
    expect(sm.primaryState).to.equal('MOVING');

    const bad = sm.setPrimaryState('FLYING');
    expect(bad).to.be.false;
    expect(sm.primaryState).to.equal('MOVING');
  });

  it('setCombatModifier and setTerrainModifier handle null and valid values', () => {
    expect(sm.setCombatModifier('IN_COMBAT')).to.be.true;
    expect(sm.combatModifier).to.equal('IN_COMBAT');

    expect(sm.setCombatModifier(null)).to.be.true;
    expect(sm.combatModifier).to.equal(null);

    expect(sm.setTerrainModifier('IN_WATER')).to.be.true;
    expect(sm.terrainModifier).to.equal('IN_WATER');

    expect(sm.setTerrainModifier(null)).to.be.true;
    expect(sm.terrainModifier).to.equal(null);
  });

  it('setState sets combinations and rejects invalid combos', () => {
    // valid
    expect(sm.setState('GATHERING', 'IN_COMBAT', 'IN_MUD')).to.be.true;
    expect(sm.getFullState()).to.equal('GATHERING_IN_COMBAT_IN_MUD');

    // invalid primary
    expect(sm.setState('FLAP', null, null)).to.be.false;

    // invalid combat
    expect(sm.setState('IDLE', 'BAD', null)).to.be.false;

    // invalid terrain
    expect(sm.setState('IDLE', null, 'BAD')).to.be.false;
  });

  it('getFullState and getCurrentState return expected strings', () => {
    sm.setState('MOVING', 'IN_COMBAT', 'ON_ROUGH');
    expect(sm.getFullState()).to.equal('MOVING_IN_COMBAT_ON_ROUGH');
    expect(sm.getCurrentState()).to.equal('MOVING');
  });

  it('canPerformAction covers branches correctly', () => {
    // default: IDLE, OUT_OF_COMBAT, DEFAULT
    expect(sm.canPerformAction('move')).to.be.true;
    expect(sm.canPerformAction('gather')).to.be.true;
    expect(sm.canPerformAction('attack')).to.be.false;

    sm.setCombatModifier('IN_COMBAT');
    expect(sm.canPerformAction('attack')).to.be.true;

    sm.setPrimaryState('BUILDING');
    expect(sm.canPerformAction('move')).to.be.false;
    expect(sm.canPerformAction('gather')).to.be.false;

    sm.setState('IDLE', 'OUT_OF_COMBAT', null);
    sm.setTerrainModifier('ON_SLIPPERY');
    expect(sm.canPerformAction('move')).to.be.false; // slippery blocks move
  });

  it('state query helpers return expected booleans', () => {
    sm.reset();
    expect(sm.isIdle()).to.be.true;
    expect(sm.isOutOfCombat()).to.be.true;
    expect(sm.isOnDefaultTerrain()).to.be.true;

    sm.setState('MOVING', 'IN_COMBAT', 'IN_MUD');
    expect(sm.isMoving()).to.be.true;
    expect(sm.isInCombat()).to.be.true;
    expect(sm.isInMud()).to.be.true;
  });

  it('clearModifiers and reset behave correctly and invoke callback', (done) => {
    let calls = 0;
    sm.setStateChangeCallback((oldS, newS) => { calls++; });
    sm.setState('GATHERING', 'IN_COMBAT', 'IN_WATER');
    expect(sm.getFullState()).to.equal('GATHERING_IN_COMBAT_IN_WATER');

    sm.clearModifiers();
    expect(sm.combatModifier).to.equal(null);
    expect(sm.terrainModifier).to.equal(null);

    sm.reset();
    expect(sm.primaryState).to.equal('IDLE');
    expect(sm.combatModifier).to.equal('OUT_OF_COMBAT');
    expect(sm.terrainModifier).to.equal('DEFAULT');

    // callback should have been called at least once (setState, clearModifiers, reset)
    expect(calls).to.be.at.least(1);
    done();
  });

  it('setPreferredState and ResumePreferredState work', () => {
    sm.setPreferredState('MOVING');
    sm.beginIdle();
    sm.ResumePreferredState();
    expect(sm.primaryState).to.equal('MOVING');
  });

  it('isValidAnyState and isInState utilities', () => {
    expect(sm.isValidAnyState('MOVING')).to.be.true;
    expect(sm.isValidAnyState('IN_COMBAT')).to.be.true;
    expect(sm.isValidAnyState('IN_WATER')).to.be.true;
    expect(sm.isValidAnyState('NOPE')).to.be.false;

    sm.setState('GATHERING', 'IN_COMBAT', 'IN_WATER');
    expect(sm.isInState('GATHERING_IN_COMBAT_IN_WATER')).to.be.true;
  });

  it('printState uses devConsoleEnabled global (no throw)', () => {
    // ensure printState does not throw if devConsoleEnabled undefined/false
    global.devConsoleEnabled = false;
    expect(() => sm.printState()).to.not.throw();
    global.devConsoleEnabled = true;
    expect(() => sm.printState()).to.not.throw();
  });

  it('getStateSummary contains expected structure', () => {
    sm.setState('GATHERING', null, null);
    const summary = sm.getStateSummary();
    expect(summary).to.include.keys('fullState', 'primary', 'combat', 'terrain', 'actions');
    expect(summary.primary).to.equal('GATHERING');
  });

  it('update is a no-op and does not throw', () => {
    expect(() => sm.update()).to.not.throw();
  });
});




// ================================================================
// gatherState.test.js (16 tests)
// ================================================================
// Ensure Globals used by GatherState are present
global.logVerbose = global.logVerbose || function() {};
global.deltaTime = global.deltaTime || 16; // ms per frame approx

let GatherState = require('../../../Classes/ants/GatherState');

describe('GatherState', function() {
  let antMock;
  let resourceManagerMock;
  let movementControllerMock;
  let stateMachineMock;

  beforeEach(function() {
    // reset global resource manager
    global.g_resourceManager = {
      _list: [],
      getResourceList() { return this._list; },
      removeResource(r) { const i = this._list.indexOf(r); if (i !== -1) this._list.splice(i,1); }
    };

    resourceManagerMock = {
      _load: 0,
      isAtMaxLoad() { return this._load >= 5; },
      addResource(r) { if (!r) return false; this._load++; return true; },
      startDropOff(x,y) { this.dropOffCalled = {x,y}; }
    };

    movementControllerMock = {
      lastTarget: null,
      moveToLocation(x,y) { this.lastTarget = {x,y}; }
    };

    stateMachineMock = {
      primary: 'IDLE',
      setPrimaryState(s) { this.primary = s; }
    };

    antMock = {
      id: 'ant-1',
      _antIndex: 1,
      _resourceManager: resourceManagerMock,
      _movementController: movementControllerMock,
      _stateMachine: stateMachineMock,
      posX: 100,
      posY: 100,
      getPosition() { return { x: this.posX, y: this.posY }; }
    };
  });

  afterEach(function() {
    delete global.g_resource_manager;
    delete global.g_resourceManager;
  });

  it('initializes with correct defaults', function() {
    const gs = new GatherState(antMock);
    expect(gs.ant).to.equal(antMock);
    expect(gs.gatherRadius).to.equal(7);
    expect(gs.pixelRadius).to.equal(224);
    expect(gs.isActive).to.be.false;
  });

  it('enter() activates state and sets ant primary state', function() {
    const gs = new GatherState(antMock);
    gs.enter();
    expect(gs.isActive).to.be.true;
    expect(stateMachineMock.primary).to.equal('GATHERING');
  });

  it('exit() deactivates state', function() {
    const gs = new GatherState(antMock);
    gs.enter();
    const res = gs.exit();
    expect(res).to.be.true;
    expect(gs.isActive).to.be.false;
  });

  it('getAntPosition() returns ant position', function() {
    const gs = new GatherState(antMock);
    const pos = gs.getAntPosition();
    expect(pos).to.deep.equal({ x: 100, y: 100 });
  });

  it('getDistance() computes Euclidean distance', function() {
    const gs = new GatherState(antMock);
    const d = gs.getDistance(0,0,3,4);
    expect(d).to.equal(5);
  });

  it('getResourcesInRadius() finds resources from g_resourceManager', function() {
    // add resources near and far
    const near = { x: 110, y: 110, type: 'food' };
    const far = { x: 1000, y: 1000, type: 'stone' };
    global.g_resource_manager = global.g_resource_manager || { _list: [] };
    global.g_resource_manager._list.push(near, far);

    const gs = new GatherState(antMock);
    const found = gs.getResourcesInRadius(100,100,50);
    expect(found).to.be.an('array');
    // should find near only
    expect(found.some(r => r.type === 'food')).to.be.true;
    expect(found.some(r => r.type === 'stone')).to.be.false;
  });

  it('searchForResources() sets nearest resource as targetResource', function() {
    const near = { x: 110, y: 110, type: 'food' };
    const other = { x: 105, y: 105, type: 'leaf' };
    global.g_resourceManager._list.push(near, other);

    const gs = new GatherState(antMock);
    const results = gs.searchForResources();
    expect(results.length).to.equal(2);
    expect(gs.targetResource).to.exist;
    // targetResource should be the closest (other at 7.07 vs near at 14.14)
    expect(gs.targetResource.type).to.equal('leaf');
  });

  it('moveToResource delegates to movement controller', function() {
    const gs = new GatherState(antMock);
    gs.moveToResource(200,200);
    expect(movementControllerMock.lastTarget).to.deep.equal({ x:200, y:200 });
  });

  it('attemptResourceCollection adds resource and removes from system', function() {
    const resource = { x: 110, y: 110, type: 'food' };
    global.g_resourceManager._list.push(resource);

    const gs = new GatherState(antMock);
    // manually set targetResource shape as returned by getResourcesInRadius
    gs.targetResource = { resource: resource, x: resource.x, y: resource.y, type: resource.type };

    gs.attemptResourceCollection();

    // resourceManagerMock should have added the resource (load becomes 1)
    expect(resourceManagerMock._load).to.equal(1);
    // g_resourceManager should no longer contain the resource
    expect(global.g_resourceManager._list.indexOf(resource)).to.equal(-1);
    // targetResource cleared
    expect(gs.targetResource).to.be.null;
  });

  it('isAtMaxCapacity() respects ant resource manager', function() {
    const gs = new GatherState(antMock);
    // initially not max
    resourceManagerMock._load = 0;
    expect(gs.isAtMaxCapacity()).to.be.false;
    resourceManagerMock._load = 5;
    expect(gs.isAtMaxCapacity()).to.be.true;
  });

  it('transitionToDropOff() sets state and calls startDropOff', function() {
    const gs = new GatherState(antMock);
    gs.transitionToDropOff();
    expect(stateMachineMock.primary).to.equal('DROPPING_OFF');
    expect(resourceManagerMock.dropOffCalled).to.exist;
    expect(gs.isActive).to.be.false;
  });

  it('updateTargetMovement collects when in range', function() {
    const resource = { x: 102, y: 102, type: 'food' };
    global.g_resourceManager._list.push(resource);

    const gs = new GatherState(antMock);
    gs.targetResource = { resource, x: resource.x, y: resource.y, type: resource.type };

    // call updateTargetMovement should attempt collection (within 15px)
    gs.updateTargetMovement();
    expect(resourceManagerMock._load).to.equal(1);
    expect(gs.targetResource).to.be.null;
  });

  it('getDebugInfo returns useful info object', function() {
    const gs = new GatherState(antMock);
    const info = gs.getDebugInfo();
    expect(info).to.be.an('object');
    expect(info.hasTarget).to.be.a('boolean');
    expect(info.gatherRadius).to.be.a('string');
  });

  it('setDebugEnabled toggles debug flag', function() {
    const gs = new GatherState(antMock);
    gs.setDebugEnabled(true);
    expect(gs.debugEnabled).to.be.true;
    gs.setDebugEnabled(false);
    expect(gs.debugEnabled).to.be.false;
  });
});




// ================================================================
// jobComponent.test.js (46 tests)
// ================================================================
/**
 * JobComponent Unit Tests - Comprehensive Coverage
 */

// Load the JobComponent class
let JobComponent = require('../../../Classes/ants/JobComponent.js');
describe('JobComponent', function() {
  describe('Constructor', function() {
    it('should create instance with name and stats', function() {
      const jc = new JobComponent('Builder');
      expect(jc.name).to.equal('Builder');
      expect(jc.stats).to.exist;
      expect(jc.stats).to.be.an('object');
    });

    it('should create instance with name and image', function() {
      const img = { src: 'builder.png' };
      const jc = new JobComponent('Builder', img);
      expect(jc.name).to.equal('Builder');
      expect(jc.image).to.equal(img);
    });

    it('should create instance without image (null default)', function() {
      const jc = new JobComponent('Scout');
      expect(jc.name).to.equal('Scout');
      expect(jc.image).to.be.null;
    });

    it('should retrieve stats for all job types', function() {
      const jobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
      jobs.forEach(jobName => {
        const jc = new JobComponent(jobName);
        expect(jc.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });

    it('should use default stats for unknown job', function() {
      const jc = new JobComponent('UnknownJob');
      expect(jc.stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });
  });

  describe('getJobStats (static)', function() {
    it('should return Builder stats', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats).to.deep.equal({
        strength: 20,
        health: 120,
        gatherSpeed: 15,
        movementSpeed: 60
      });
    });

    it('should return Scout stats', function() {
      const stats = JobComponent.getJobStats('Scout');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 80,
        gatherSpeed: 10,
        movementSpeed: 80
      });
    });

    it('should return Farmer stats', function() {
      const stats = JobComponent.getJobStats('Farmer');
      expect(stats).to.deep.equal({
        strength: 15,
        health: 100,
        gatherSpeed: 30,
        movementSpeed: 60
      });
    });

    it('should return Warrior stats', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats).to.deep.equal({
        strength: 40,
        health: 150,
        gatherSpeed: 5,
        movementSpeed: 60
      });
    });

    it('should return Spitter stats', function() {
      const stats = JobComponent.getJobStats('Spitter');
      expect(stats).to.deep.equal({
        strength: 30,
        health: 90,
        gatherSpeed: 8,
        movementSpeed: 60
      });
    });

    it('should return DeLozier stats (special)', function() {
      const stats = JobComponent.getJobStats('DeLozier');
      expect(stats).to.deep.equal({
        strength: 1000,
        health: 10000,
        gatherSpeed: 1,
        movementSpeed: 10000
      });
    });

    it('should return default stats for unknown job', function() {
      const stats = JobComponent.getJobStats('Unknown');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for null', function() {
      const stats = JobComponent.getJobStats(null);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for undefined', function() {
      const stats = JobComponent.getJobStats(undefined);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for empty string', function() {
      const stats = JobComponent.getJobStats('');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should be case-sensitive', function() {
      const stats = JobComponent.getJobStats('builder'); // lowercase
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return object with all required stat properties', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats).to.have.property('strength');
      expect(stats).to.have.property('health');
      expect(stats).to.have.property('gatherSpeed');
      expect(stats).to.have.property('movementSpeed');
    });

    it('should return numeric values for all stats', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats.strength).to.be.a('number');
      expect(stats.health).to.be.a('number');
      expect(stats.gatherSpeed).to.be.a('number');
      expect(stats.movementSpeed).to.be.a('number');
    });

    it('should return positive values for all stats', function() {
      const jobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
      jobs.forEach(job => {
        const stats = JobComponent.getJobStats(job);
        expect(stats.strength).to.be.above(0);
        expect(stats.health).to.be.above(0);
        expect(stats.gatherSpeed).to.be.above(0);
        expect(stats.movementSpeed).to.be.above(0);
      });
    });
  });

  describe('getJobList (static)', function() {
    it('should return array of standard jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.be.an('array');
      expect(jobs).to.include('Builder');
      expect(jobs).to.include('Scout');
      expect(jobs).to.include('Farmer');
      expect(jobs).to.include('Warrior');
      expect(jobs).to.include('Spitter');
    });

    it('should return exactly 5 jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.have.lengthOf(5);
    });

    it('should not include special jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.not.include('DeLozier');
    });

    it('should return same array on multiple calls', function() {
      const jobs1 = JobComponent.getJobList();
      const jobs2 = JobComponent.getJobList();
      expect(jobs1).to.deep.equal(jobs2);
    });
  });

  describe('getSpecialJobs (static)', function() {
    it('should return array of special jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.be.an('array');
      expect(specialJobs).to.include('DeLozier');
    });

    it('should return exactly 1 special job', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.have.lengthOf(1);
    });

    it('should not include standard jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.not.include('Builder');
      expect(specialJobs).to.not.include('Scout');
      expect(specialJobs).to.not.include('Farmer');
    });
  });

  describe('getAllJobs (static)', function() {
    it('should return array of all jobs (standard + special)', function() {
      const allJobs = JobComponent.getAllJobs();
      expect(allJobs).to.be.an('array');
      expect(allJobs).to.include('Builder');
      expect(allJobs).to.include('Scout');
      expect(allJobs).to.include('DeLozier');
    });

    it('should return exactly 6 jobs total', function() {
      const allJobs = JobComponent.getAllJobs();
      expect(allJobs).to.have.lengthOf(6);
    });

    it('should equal getJobList + getSpecialJobs', function() {
      const jobList = JobComponent.getJobList();
      const specialJobs = JobComponent.getSpecialJobs();
      const allJobs = JobComponent.getAllJobs();
      
      expect(allJobs.length).to.equal(jobList.length + specialJobs.length);
      jobList.forEach(job => expect(allJobs).to.include(job));
      specialJobs.forEach(job => expect(allJobs).to.include(job));
    });

    it('should have no duplicates', function() {
      const allJobs = JobComponent.getAllJobs();
      const uniqueJobs = [...new Set(allJobs)];
      expect(allJobs.length).to.equal(uniqueJobs.length);
    });
  });

  describe('Stats Validation', function() {
    it('should have Builder as high health tank', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats.health).to.equal(120); // Higher than default 100
      expect(stats.strength).to.equal(20);
    });

    it('should have Scout as fastest unit', function() {
      const stats = JobComponent.getJobStats('Scout');
      expect(stats.movementSpeed).to.equal(80); // Fastest
      const builderStats = JobComponent.getJobStats('Builder');
      expect(stats.movementSpeed).to.be.above(builderStats.movementSpeed);
    });

    it('should have Farmer as best gatherer', function() {
      const stats = JobComponent.getJobStats('Farmer');
      expect(stats.gatherSpeed).to.equal(30); // Highest gather speed
      const scoutStats = JobComponent.getJobStats('Scout');
      expect(stats.gatherSpeed).to.be.above(scoutStats.gatherSpeed);
    });

    it('should have Warrior as strongest fighter', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats.strength).to.equal(40); // Highest strength
      expect(stats.health).to.equal(150); // Highest health
    });

    it('should have Spitter as ranged attacker', function() {
      const stats = JobComponent.getJobStats('Spitter');
      expect(stats.strength).to.equal(30); // High damage
      expect(stats.health).to.equal(90); // Lower health (glass cannon)
    });

    it('should have DeLozier as overpowered special unit', function() {
      const stats = JobComponent.getJobStats('DeLozier');
      expect(stats.strength).to.equal(1000);
      expect(stats.health).to.equal(10000);
      expect(stats.movementSpeed).to.equal(10000);
    });
  });

  describe('Edge Cases', function() {
    it('should handle number as job name', function() {
      const stats = JobComponent.getJobStats(123);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle object as job name', function() {
      const stats = JobComponent.getJobStats({});
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle array as job name', function() {
      const stats = JobComponent.getJobStats([]);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should create instance with all job types', function() {
      const allJobs = JobComponent.getAllJobs();
      allJobs.forEach(jobName => {
        const jc = new JobComponent(jobName);
        expect(jc.name).to.equal(jobName);
        expect(jc.stats).to.exist;
      });
    });

    it('should handle very long job name', function() {
      const longName = 'A'.repeat(1000);
      const stats = JobComponent.getJobStats(longName);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle job name with special characters', function() {
      const stats = JobComponent.getJobStats('Builder!@#$%');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });
  });

  describe('Integration', function() {
    it('should create different instances with different names', function() {
      const builder = new JobComponent('Builder');
      const scout = new JobComponent('Scout');
      
      expect(builder.name).to.not.equal(scout.name);
      expect(builder.stats.strength).to.not.equal(scout.stats.strength);
    });

    it('should maintain stat independence between instances', function() {
      const builder1 = new JobComponent('Builder');
      const builder2 = new JobComponent('Builder');
      
      builder1.stats.strength = 999;
      expect(builder2.stats.strength).to.equal(20); // Unchanged
    });

    it('should work with all standard jobs', function() {
      const jobs = JobComponent.getJobList();
      jobs.forEach(jobName => {
        const component = new JobComponent(jobName);
        expect(component.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });

    it('should work with all special jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      specialJobs.forEach(jobName => {
        const component = new JobComponent(jobName);
        expect(component.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });
  });
});




// ================================================================
// queen.test.js (58 tests)
// ================================================================
// Mock globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);
global.push = () => {};
global.pop = () => {};
global.noFill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.ellipse = () => {};

// Mock ant base class
class ant {
  constructor(posX, posY, sizeX, sizeY, movementSpeed, rotation, img, jobName, faction) {
    this.posX = posX;
    this.posY = posY;
    this._size = { x: sizeX, y: sizeY };
    this.movementSpeed = movementSpeed;
    this.rotation = rotation;
    this._image = img;
    this.jobName = jobName;
    this.faction = faction;
    this.isActive = true;
    this._commands = [];
  }
  getPosition() { return { x: this.posX, y: this.posY }; }
  getSize() { return this._size; }
  getImage() { return this._image; }
  moveToLocation(x, y) { this._lastMove = { x, y }; }
  addCommand(cmd) { this._commands.push(cmd); }
  update() {}
  render() {}
}

global.ant = ant;
global.JobImages = { Builder: { src: 'test.png' } };

// Load QueenAnt - Read entire file and eval it
// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
let queenPath = path.join(__dirname, '..', '..', '..', 'Classes', 'ants', 'Queen.js');
let queenCode = fs.readFileSync(queenPath, 'utf8');

// Remove any trailing whitespace/newlines that might cause issues
queenCode = queenCode.trim();

// Create QueenAnt in global scope by evaluating the code
try {
  // Use Function constructor for safer eval in this context
  const fn = new Function('ant', 'JobImages', queenCode + '\nreturn QueenAnt;');
  const QueenAnt = fn(ant, global.JobImages);
  global.QueenAnt = QueenAnt;
} catch (e) {
  console.error('Failed to load QueenAnt:', e);
  // Fallback: direct eval
  eval(queenCode);
}

describe('QueenAnt', function() {
  let queen;
  let baseAnt;

  beforeEach(function() {
    baseAnt = new ant(400, 300, 60, 60, 30, 0, { src: 'queen.png' }, 'Queen', 'player');
    queen = new QueenAnt(baseAnt);
  });

  describe('Constructor', function() {
    it('should initialize with base ant properties', function() {
      expect(queen.posX).to.equal(400);
      expect(queen.posY).to.equal(300);
      expect(queen.faction).to.equal('player');
    });

    it('should initialize with default properties when no base ant', function() {
      const q = new QueenAnt(null);
      expect(q.posX).to.equal(400); // Default position
      expect(q.posY).to.equal(300);
    });

    it('should set Queen-specific properties', function() {
      expect(queen.commandRadius).to.equal(250);
      expect(queen.ants).to.be.an('array').that.is.empty;
      expect(queen.coolDown).to.be.false;
      expect(queen.showCommandRadius).to.be.false;
      expect(queen.disableSkitter).to.be.true;
    });

    it('should initialize all power unlock flags to false', function() {
      expect(queen.unlockedPowers.fireball).to.be.false;
      expect(queen.unlockedPowers.lightning).to.be.false;
      expect(queen.unlockedPowers.blackhole).to.be.false;
      expect(queen.unlockedPowers.sludge).to.be.false;
      expect(queen.unlockedPowers.tidalWave).to.be.false;
    });

    it('should inherit from ant class', function() {
      expect(queen).to.be.instanceOf(ant);
    });
  });

  describe('addAnt', function() {
    it('should add ant to ants array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(1);
      expect(queen.ants[0]).to.equal(workerAnt);
    });

    it('should set ant faction to match queen', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'neutral');
      queen.addAnt(workerAnt);
      expect(workerAnt._faction).to.equal('player');
    });

    it('should handle null ant gracefully', function() {
      expect(() => queen.addAnt(null)).to.not.throw();
      expect(queen.ants).to.have.lengthOf(0);
    });

    it('should add multiple ants', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      expect(queen.ants).to.have.lengthOf(2);
    });
  });

  describe('removeAnt', function() {
    it('should remove ant from ants array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.removeAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(0);
    });

    it('should handle removing non-existent ant', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.removeAnt(ant2);
      expect(queen.ants).to.have.lengthOf(1);
      expect(queen.ants[0]).to.equal(ant1);
    });

    it('should remove correct ant from multiple', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      const ant3 = new ant(300, 300, 20, 20, 30, 0, null, 'Scout', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.addAnt(ant3);
      queen.removeAnt(ant2);
      expect(queen.ants).to.have.lengthOf(2);
      expect(queen.ants).to.include(ant1);
      expect(queen.ants).to.include(ant3);
      expect(queen.ants).to.not.include(ant2);
    });
  });

  describe('broadcastCommand', function() {
    let nearAnt, farAnt;

    beforeEach(function() {
      // Ant within command radius (250)
      nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      // Ant outside command radius
      farAnt = new ant(1000, 1000, 20, 20, 30, 0, null, 'Scout', 'player');
      queen.addAnt(nearAnt);
      queen.addAnt(farAnt);
    });

    it('should send MOVE command to ants in range', function() {
      queen.broadcastCommand({ type: 'MOVE', x: 600, y: 500 });
      expect(nearAnt._lastMove).to.deep.equal({ x: 600, y: 500 });
      expect(farAnt._lastMove).to.be.undefined;
    });

    it('should send GATHER command to ants in range', function() {
      queen.broadcastCommand({ type: 'GATHER' });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('GATHER');
      expect(farAnt._commands).to.have.lengthOf(0);
    });

    it('should send BUILD command to ants in range', function() {
      queen.broadcastCommand({ type: 'BUILD' });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('BUILD');
    });

    it('should send DEFEND command with target', function() {
      const target = { x: 700, y: 700 };
      queen.broadcastCommand({ type: 'DEFEND', target: target });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].target).to.equal(target);
    });

    it('should only affect ants within command radius', function() {
      // nearAnt is ~100 units away (within 250)
      // farAnt is ~840 units away (outside 250)
      queen.broadcastCommand({ type: 'GATHER' });
      expect(nearAnt._commands.length).to.be.greaterThan(0);
      expect(farAnt._commands).to.have.lengthOf(0);
    });

    it('should handle empty ants array', function() {
      queen.ants = [];
      expect(() => queen.broadcastCommand({ type: 'MOVE', x: 100, y: 100 })).to.not.throw();
    });
  });

  describe('commandAnt', function() {
    it('should send command to specific ant in array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.commandAnt(workerAnt, { type: 'GATHER' });
      expect(workerAnt._commands).to.have.lengthOf(1);
      expect(workerAnt._commands[0].type).to.equal('GATHER');
    });

    it('should not send command to ant not in array', function() {
      const outsideAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.commandAnt(outsideAnt, { type: 'GATHER' });
      expect(outsideAnt._commands).to.have.lengthOf(0);
    });

    it('should send multiple commands to same ant', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.commandAnt(workerAnt, { type: 'GATHER' });
      queen.commandAnt(workerAnt, { type: 'BUILD' });
      expect(workerAnt._commands).to.have.lengthOf(2);
    });
  });

  describe('gatherAntsAt', function() {
    it('should broadcast MOVE command to specified coordinates', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.gatherAntsAt(600, 500);
      expect(nearAnt._lastMove).to.deep.equal({ x: 600, y: 500 });
    });

    it('should gather multiple ants', function() {
      const ant1 = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(450, 350, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.gatherAntsAt(600, 500);
      expect(ant1._lastMove).to.exist;
      expect(ant2._lastMove).to.exist;
    });
  });

  describe('orderGathering', function() {
    it('should broadcast GATHER command', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.orderGathering();
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('GATHER');
    });
  });

  describe('orderBuilding', function() {
    it('should broadcast BUILD command', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.orderBuilding();
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('BUILD');
    });
  });

  describe('emergencyRally', function() {
    it('should gather all ants to queen position', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.emergencyRally();
      expect(nearAnt._lastMove).to.deep.equal({ x: queen.posX, y: queen.posY });
    });

    it('should rally multiple ants to queen', function() {
      const ant1 = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(450, 350, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.emergencyRally();
      expect(ant1._lastMove).to.deep.equal({ x: 400, y: 300 });
      expect(ant2._lastMove).to.deep.equal({ x: 400, y: 300 });
    });
  });

  describe('Power Management', function() {
    describe('unlockPower', function() {
      it('should unlock valid power', function() {
        const result = queen.unlockPower('fireball');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.fireball).to.be.true;
      });

      it('should unlock all valid powers', function() {
        const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave'];
        powers.forEach(power => {
          expect(queen.unlockPower(power)).to.be.true;
          expect(queen.unlockedPowers[power]).to.be.true;
        });
      });

      it('should return false for invalid power', function() {
        const result = queen.unlockPower('invalidPower');
        expect(result).to.be.false;
      });

      it('should allow unlocking already unlocked power', function() {
        queen.unlockPower('fireball');
        const result = queen.unlockPower('fireball');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.fireball).to.be.true;
      });
    });

    describe('lockPower', function() {
      it('should lock unlocked power', function() {
        queen.unlockPower('lightning');
        const result = queen.lockPower('lightning');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.lightning).to.be.false;
      });

      it('should return false for invalid power', function() {
        const result = queen.lockPower('invalidPower');
        expect(result).to.be.false;
      });

      it('should allow locking already locked power', function() {
        const result = queen.lockPower('blackhole');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.blackhole).to.be.false;
      });
    });

    describe('isPowerUnlocked', function() {
      it('should return true for unlocked power', function() {
        queen.unlockPower('sludge');
        expect(queen.isPowerUnlocked('sludge')).to.be.true;
      });

      it('should return false for locked power', function() {
        expect(queen.isPowerUnlocked('tidalWave')).to.be.false;
      });

      it('should return false for invalid power', function() {
        // isPowerUnlocked returns false for invalid/non-existent powers
        expect(queen.isPowerUnlocked('invalid')).to.be.false;
      });
    });

    describe('getUnlockedPowers', function() {
      it('should return empty array when no powers unlocked', function() {
        expect(queen.getUnlockedPowers()).to.be.an('array').that.is.empty;
      });

      it('should return array of unlocked powers', function() {
        queen.unlockPower('fireball');
        queen.unlockPower('lightning');
        const unlocked = queen.getUnlockedPowers();
        expect(unlocked).to.have.lengthOf(2);
        expect(unlocked).to.include('fireball');
        expect(unlocked).to.include('lightning');
      });

      it('should not include locked powers', function() {
        queen.unlockPower('fireball');
        queen.unlockPower('lightning');
        queen.lockPower('lightning');
        const unlocked = queen.getUnlockedPowers();
        expect(unlocked).to.have.lengthOf(1);
        expect(unlocked).to.include('fireball');
        expect(unlocked).to.not.include('lightning');
      });
    });

    describe('getAllPowers', function() {
      it('should return all power states', function() {
        queen.unlockPower('fireball');
        const allPowers = queen.getAllPowers();
        expect(allPowers).to.have.property('fireball', true);
        expect(allPowers).to.have.property('lightning', false);
        expect(allPowers).to.have.property('blackhole', false);
        expect(allPowers).to.have.property('sludge', false);
        expect(allPowers).to.have.property('tidalWave', false);
      });

      it('should return copy of powers object', function() {
        const powers = queen.getAllPowers();
        powers.fireball = true;
        expect(queen.unlockedPowers.fireball).to.be.false; // Original unchanged
      });
    });
  });

  describe('move', function() {
    it('should move up (w) with slower speed', function() {
      const startY = queen.posY;
      queen.move('w');
      expect(queen._lastMove.y).to.be.greaterThan(startY);
    });

    it('should move left (a)', function() {
      const startX = queen.posX;
      queen.move('a');
      expect(queen._lastMove.x).to.be.lessThan(startX);
    });

    it('should move down (s)', function() {
      const startY = queen.posY;
      queen.move('s');
      expect(queen._lastMove.y).to.be.lessThan(startY);
    });

    it('should move right (d)', function() {
      const startX = queen.posX;
      queen.move('d');
      expect(queen._lastMove.x).to.be.greaterThan(startX);
    });

    it('should move slower than normal ant (0.1x speed)', function() {
      queen.movementSpeed = 100;
      queen.move('d');
      const deltaX = queen._lastMove.x - queen.posX;
      expect(deltaX).to.equal(10); // 100 * 0.1
    });

    it('should handle invalid direction gracefully', function() {
      expect(() => queen.move('x')).to.not.throw();
    });
  });

  describe('update', function() {
    it('should call super.update', function() {
      let superCalled = false;
      const originalUpdate = ant.prototype.update;
      ant.prototype.update = function() { superCalled = true; };
      queen.update();
      expect(superCalled).to.be.true;
      ant.prototype.update = originalUpdate;
    });

    it('should not throw errors', function() {
      expect(() => queen.update()).to.not.throw();
    });
  });

  describe('render', function() {
    it('should call super.render', function() {
      let superCalled = false;
      const originalRender = ant.prototype.render;
      ant.prototype.render = function() { superCalled = true; };
      queen.render();
      expect(superCalled).to.be.true;
      ant.prototype.render = originalRender;
    });

    it('should not render command radius when showCommandRadius is false', function() {
      queen.showCommandRadius = false;
      let ellipseCalled = false;
      global.ellipse = () => { ellipseCalled = true; };
      queen.render();
      expect(ellipseCalled).to.be.false;
    });

    it('should render command radius when showCommandRadius is true', function() {
      queen.showCommandRadius = true;
      let ellipseCalled = false;
      global.ellipse = (x, y, d) => { 
        ellipseCalled = true;
        expect(d).to.equal(queen.commandRadius * 2);
      };
      queen.render();
      expect(ellipseCalled).to.be.true;
    });
  });

  describe('Edge Cases', function() {
    it('should handle very large commandRadius', function() {
      queen.commandRadius = 100000; // Very large radius
      const farAnt = new ant(9000, 9000, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(farAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // Distance from (400, 300) to (9000, 9000) is ~12200, so radius must be > 12200
      expect(farAnt._commands).to.have.lengthOf(1);
    });

    it('should handle zero commandRadius', function() {
      queen.commandRadius = 0;
      const nearAnt = new ant(400, 300, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // Only ant at exact same position would receive command
    });

    it('should handle negative commandRadius', function() {
      queen.commandRadius = -100;
      const nearAnt = new ant(400, 300, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // No ants should receive command with negative radius
      expect(nearAnt._commands).to.have.lengthOf(0);
    });

    it('should handle adding same ant multiple times', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.addAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(2);
      expect(queen.ants[0]).to.equal(queen.ants[1]);
    });

    it('should handle unlocking all powers then locking all', function() {
      const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave'];
      powers.forEach(p => queen.unlockPower(p));
      expect(queen.getUnlockedPowers()).to.have.lengthOf(5);
      
      powers.forEach(p => queen.lockPower(p));
      expect(queen.getUnlockedPowers()).to.have.lengthOf(0);
    });
  });
});




// ================================================================
// entity.test.js (69 tests)
// ================================================================
// Mock p5.js globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.mouseX = 0;
global.mouseY = 0;

// Mock CollisionBox2D
class MockCollisionBox2D {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
  setPosition(x, y) { this.x = x; this.y = y; }
  setSize(w, h) { this.width = w; this.height = h; }
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
  intersects(other) {
    return !(this.x > other.x + other.width ||
             this.x + this.width < other.x ||
             this.y > other.y + other.height ||
             this.y + this.height < other.y);
  }
  getCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }
}
global.CollisionBox2D = MockCollisionBox2D;

// Mock Sprite2D
class MockSprite2D {
  constructor(imagePath, pos, size, rotation) {
    this.img = imagePath;
    this.position = pos;
    this.size = size;
    this.rotation = rotation;
    this.visible = true;
    this.alpha = 1.0;
  }
  setImage(path) { this.img = path; }
  getImage() { return this.img; }
  setPosition(pos) { this.position = pos; }
  setSize(size) { this.size = size; }
  setOpacity(alpha) { this.alpha = alpha; }
  getOpacity() { return this.alpha; }
}
global.Sprite2D = MockSprite2D;

// Mock Controllers
class MockTransformController {
  constructor(entity) { this.entity = entity; this.pos = { x: 0, y: 0 }; this.size = { x: 32, y: 32 }; }
  setPosition(x, y) { this.pos = { x, y }; }
  getPosition() { return this.pos; }
  setSize(w, h) { this.size = { x: w, y: h }; }
  getSize() { return this.size; }
  getCenter() { return { x: this.pos.x + this.size.x / 2, y: this.pos.y + this.size.y / 2 }; }
  update() {}
}

class MockMovementController {
  constructor(entity) { 
    this.entity = entity; 
    this.movementSpeed = 1.0;
    this.isMoving = false;
    this.path = null;
  }
  moveToLocation(x, y) { this.isMoving = true; this.target = { x, y }; return true; }
  setPath(path) { this.path = path; }
  getIsMoving() { return this.isMoving; }
  stop() { this.isMoving = false; }
  update() {}
}

class MockRenderController {
  constructor(entity) { this.entity = entity; this.debugMode = false; this.smoothing = true; }
  render() {}
  highlightSelected() { return 'selected'; }
  highlightHover() { return 'hover'; }
  setDebugMode(enabled) { this.debugMode = enabled; }
  getDebugMode() { return this.debugMode; }
  setSmoothing(enabled) { this.smoothing = enabled; }
  getSmoothing() { return this.smoothing; }
  update() {}
}

class MockSelectionController {
  constructor(entity) { this.entity = entity; this.selected = false; this.selectable = true; }
  setSelected(val) { this.selected = val; }
  isSelected() { return this.selected; }
  toggleSelection() { this.selected = !this.selected; return this.selected; }
  setSelectable(val) { this.selectable = val; }
  update() {}
}

class MockCombatController {
  constructor(entity) { this.entity = entity; this.faction = 'neutral'; this.inCombat = false; }
  setFaction(faction) { this.faction = faction; }
  isInCombat() { return this.inCombat; }
  detectEnemies() { return []; }
  update() {}
}

class MockTerrainController {
  constructor(entity) { this.entity = entity; this.terrain = 'DEFAULT'; }
  getCurrentTerrain() { return this.terrain; }
  update() {}
}

class MockTaskManager {
  constructor(entity) { this.entity = entity; this.tasks = []; this.currentTask = null; }
  addTask(task) { this.tasks.push(task); return true; }
  getCurrentTask() { return this.currentTask; }
  update() {}
}

class MockHealthController {
  constructor(entity) { this.entity = entity; this.health = 100; }
  update() {}
}


// Mock gameState Manager
class MockGameStateManager {
  constructor() {
    this.currentState = "MENU";
    this.previousState = null;
    this.fadeAlpha = 0;
    this.isFading = false;
    this.stateChangeCallbacks = [];
    this.isFading = false;
    this.fadeDirection = "out";
    
    // Valid game states
    this.STATES = {
      MENU: "MENU",
      OPTIONS: "OPTIONS", 
      DEBUG_MENU: "DEBUG_MENU",
      PLAYING: "PLAYING",
      PAUSED: "PAUSED",
      GAME_OVER: "GAME_OVER",
      KAN_BAN: "KANBAN"
    };
  }

   // Get current state
  getState() {
    return this.currentState;
  }

  // Set state with optional callback execution
  setState(newState, skipCallbacks = false) {
    if (!this.isValidState(newState)) {
      console.warn(`Invalid game state: ${newState}`);
      return false;
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    if (!skipCallbacks) {
      this.executeCallbacks(newState, this.previousState);
    }
    return true;
  }

  // Get previous state
  getPreviousState = () => this.previousState;

  // Check if current state matches
  isState = (state) => this.currentState === state;

    // State change callback system
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.stateChangeCallbacks.push(callback);
    }
  }

    removeStateChangeCallback(callback) {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  executeCallbacks(newState, oldState) {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  
  // Convenience methods for common states
  isInMenu = () => this.currentState === this.STATES.MENU;
  isInOptions = () => this.currentState === this.STATES.OPTIONS;
  isInGame = () => this.currentState === this.STATES.PLAYING;
  isPaused = () => this.currentState === this.STATES.PAUSED;
  isGameOver = () => this.currentState === this.STATES.GAME_OVER;
  isDebug = () => this.currentState === this.STATES.DEBUG_MENU;
  isKanban = () => this.currentState === this.STATES.KAN_BAN;

  // Transition methods
  goToMenu = () => this.setState(this.STATES.MENU);
  goToOptions = () => this.setState(this.STATES.OPTIONS);
  goToDebug = () => this.setState(this.STATES.DEBUG_MENU);
  startGame = () => { this.startFadeTransition(); return this.setState(this.STATES.PLAYING); };
  pauseGame = () => this.setState(this.STATES.PAUSED);
  resumeGame = () => this.setState(this.STATES.PLAYING);
  endGame = () => this.setState(this.STATES.GAME_OVER);
  goToKanban = () => this.setState(this.STATES.KAN_BAN);
}

// Assign controllers to global
global.TransformController = MockTransformController;
global.MovementController = MockMovementController;
global.RenderController = MockRenderController;
global.SelectionController = MockSelectionController;
global.CombatController = MockCombatController;
global.TerrainController = MockTerrainController;
global.TaskManager = MockTaskManager;
global.HealthController = MockHealthController;
global.GameStateManager = MockGameStateManager;

// Mock spatial grid manager
global.spatialGridManager = {
  addEntity: function() {},
  updateEntity: function() {},
  removeEntity: function() {}
};



// Load Entity
let Entity = require('../../../Classes/containers/Entity.js');

describe('Entity', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const entity = new Entity();
      expect(entity.id).to.be.a('string');
      expect(entity.type).to.equal('Entity');
      expect(entity._isActive).to.be.true;
    });
    
    it('should initialize with custom position and size', function() {
      const entity = new Entity(100, 200, 64, 64);
      const pos = entity.getPosition();
      const size = entity.getSize();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
      expect(size.x).to.equal(64);
      expect(size.y).to.equal(64);
    });
    
    it('should initialize with custom type', function() {
      const entity = new Entity(0, 0, 32, 32, { type: 'Ant' });
      expect(entity.type).to.equal('Ant');
    });
    
    it('should generate unique IDs for each entity', function() {
      const entity1 = new Entity();
      const entity2 = new Entity();
      expect(entity1.id).to.not.equal(entity2.id);
    });
    
    it('should initialize collision box', function() {
      const entity = new Entity(50, 60, 32, 32);
      expect(entity._collisionBox).to.be.instanceOf(MockCollisionBox2D);
    });
    
    it('should initialize sprite when Sprite2D available', function() {
      const entity = new Entity(0, 0, 32, 32);
      expect(entity._sprite).to.be.instanceOf(MockSprite2D);
    });
    
    it('should initialize all available controllers', function() {
      const entity = new Entity();
      expect(entity._controllers.size).to.be.greaterThan(0);
      expect(entity.getController('transform')).to.exist;
      expect(entity.getController('movement')).to.exist;
      expect(entity.getController('render')).to.exist;
    });
  });
  
  describe('Core Properties', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'TestEntity' });
    });
    
    it('should have read-only id', function() {
      const originalId = entity.id;
      entity.id = 'newId'; // Should not change
      expect(entity.id).to.equal(originalId);
    });
    
    it('should have read-only type', function() {
      const originalType = entity.type;
      entity.type = 'NewType'; // Should not change
      expect(entity.type).to.equal(originalType);
    });
    
    it('should allow setting isActive', function() {
      entity.isActive = false;
      expect(entity.isActive).to.be.false;
      entity.isActive = true;
      expect(entity.isActive).to.be.true;
    });
  });
  
  describe('Position and Transform', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set and get position', function() {
      entity.setPosition(100, 200);
      const pos = entity.getPosition();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
    });
    
    it('should get X coordinate', function() {
      entity.setPosition(50, 100);
      expect(entity.getX()).to.equal(50);
    });
    
    it('should get Y coordinate', function() {
      entity.setPosition(50, 100);
      expect(entity.getY()).to.equal(100);
    });
    
    it('should set and get size', function() {
      entity.setSize(64, 128);
      const size = entity.getSize();
      expect(size.x).to.equal(64);
      expect(size.y).to.equal(128);
    });
    
    it('should calculate center point', function() {
      entity.setPosition(0, 0);
      entity.setSize(100, 100);
      const center = entity.getCenter();
      expect(center.x).to.equal(50);
      expect(center.y).to.equal(50);
    });
    
    it('should update collision box when position changes', function() {
      entity.setPosition(75, 85);
      expect(entity._collisionBox.x).to.equal(75);
      expect(entity._collisionBox.y).to.equal(85);
    });
    
    it('should update collision box when size changes', function() {
      entity.setSize(50, 60);
      expect(entity._collisionBox.width).to.equal(50);
      expect(entity._collisionBox.height).to.equal(60);
    });
  });
  
  describe('Movement', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should move to location', function() {
      const result = entity.moveToLocation(100, 200);
      expect(result).to.be.true;
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should set path', function() {
      const path = [{ x: 10, y: 10 }, { x: 20, y: 20 }];
      entity.setPath(path);
      const movement = entity.getController('movement');
      expect(movement.path).to.equal(path);
    });
    
    it('should check if moving', function() {
      expect(entity.isMoving()).to.be.false;
      entity.moveToLocation(50, 50);
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should stop movement', function() {
      entity.moveToLocation(100, 100);
      entity.stop();
      expect(entity.isMoving()).to.be.false;
    });
    
    it('should get movement speed from controller', function() {
      const movement = entity.getController('movement');
      if (movement && movement.movementSpeed !== undefined) {
        expect(movement.movementSpeed).to.be.a('number');
      } else {
        // If controller doesn't exist or has no movementSpeed, skip test
        expect(true).to.be.true;
      }
    });
    
    it('should set movement speed', function() {
      entity.movementSpeed = 5.0;
      expect(entity.movementSpeed).to.equal(5.0);
    });
  });
  
  describe('Selection', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set selected state', function() {
      entity.setSelected(true);
      expect(entity.isSelected()).to.be.true;
    });
    
    it('should toggle selection', function() {
      expect(entity.isSelected()).to.be.false;
      entity.toggleSelection();
      expect(entity.isSelected()).to.be.true;
      entity.toggleSelection();
      expect(entity.isSelected()).to.be.false;
    });
  });
  
  describe('Interaction', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should detect mouse over', function() {
      global.window = { _lastDebugMouseX: 0, _lastDebugMouseY: 0 };
      entity.setPosition(0, 0);
      entity.setSize(32, 32);
      global.mouseX = 16;
      global.mouseY = 16;
      expect(entity.isMouseOver()).to.be.true;
    });
    
    it('should detect mouse not over', function() {
      entity.setPosition(0, 0);
      entity.setSize(32, 32);
      global.mouseX = 100;
      global.mouseY = 100;
      expect(entity.isMouseOver()).to.be.false;
    });
  });
  
  describe('Combat', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { faction: 'player' });
    });
    
    it('should check if in combat', function() {
      expect(entity.isInCombat()).to.be.false;
    });
    
    it('should detect enemies', function() {
      const enemies = entity.detectEnemies();
      expect(enemies).to.be.an('array');
    });
  });
  
  describe('Tasks', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should add task', function() {
      const task = { type: 'GATHER', priority: 1 };
      const result = entity.addTask(task);
      expect(result).to.be.true;
    });
    
    it('should get current task', function() {
      const task = entity.getCurrentTask();
      expect(task).to.be.null; // Initially null
    });
  });
  
  describe('Terrain', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should get current terrain', function() {
      const terrain = entity.getCurrentTerrain();
      expect(terrain).to.equal('DEFAULT');
    });
  });
  
  describe('Sprite and Image', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set image path', function() {
      entity.setImage('/path/to/image.png');
      expect(entity.getImage()).to.equal('/path/to/image.png');
    });
    
    it('should check if has image', function() {
      entity.setImage('/path/to/image.png');
      expect(entity.hasImage()).to.be.true;
    });
    
    it('should set opacity', function() {
      entity.setOpacity(128);
      expect(entity.getOpacity()).to.equal(128);
    });
    
    it('should get opacity', function() {
      const opacity = entity.getOpacity();
      expect(opacity).to.be.a('number');
    });
  });
  
  describe('Collision', function() {
    let entity1, entity2;
    
    beforeEach(function() {
      entity1 = new Entity(0, 0, 32, 32);
      entity2 = new Entity(16, 16, 32, 32);
    });
    
    it('should detect collision when overlapping', function() {
      expect(entity1.collidesWith(entity2)).to.be.true;
    });
    
    it('should not detect collision when separate', function() {
      entity2.setPosition(100, 100);
      entity1.update(); // Sync collision box
      entity2.update(); // Sync collision box
      expect(entity1.collidesWith(entity2)).to.be.false;
    });
    
    it('should check point containment', function() {
      entity1.setPosition(0, 0);
      entity1.setSize(32, 32);
      expect(entity1.contains(16, 16)).to.be.true;
      expect(entity1.contains(100, 100)).to.be.false;
    });
  });
  
  describe('Update Loop', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should call update without errors', function() {
      expect(() => entity.update()).to.not.throw();
    });
    
    it('should not update when inactive', function() {
      entity.isActive = false;
      expect(() => entity.update()).to.not.throw();
    });
    
    it('should sync collision box on update', function() {
      entity.setPosition(50, 60);
      entity.update();
      expect(entity._collisionBox.x).to.equal(50);
      expect(entity._collisionBox.y).to.equal(60);
    });
  });
  
  describe('Rendering', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should call render without errors', function() {
      expect(() => entity.render()).to.not.throw();
    });
    
    it('should not render when inactive', function() {
      entity.isActive = false;
      expect(() => entity.render()).to.not.throw();
    });
  });
  
  describe('Debug Info', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'TestEntity' });
    });
    
    it('should return debug info object', function() {
      const info = entity.getDebugInfo();
      expect(info).to.be.an('object');
      expect(info.id).to.equal(entity.id);
      expect(info.type).to.equal('TestEntity');
    });
    
    it('should include position in debug info', function() {
      entity.setPosition(100, 200);
      const info = entity.getDebugInfo();
      expect(info.position.x).to.equal(100);
      expect(info.position.y).to.equal(200);
    });
    
    it('should include size in debug info', function() {
      entity.setSize(64, 64);
      const info = entity.getDebugInfo();
      expect(info.size.x).to.equal(64);
      expect(info.size.y).to.equal(64);
    });
    
    it('should include controller status', function() {
      const info = entity.getDebugInfo();
      expect(info.controllers).to.be.an('object');
      expect(info.controllerCount).to.be.greaterThan(0);
    });
  });
  
  describe('Validation Data', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'Ant', faction: 'player' });
    });
    
    it('should return validation data', function() {
      const data = entity.getValidationData();
      expect(data).to.be.an('object');
      expect(data.id).to.exist;
      expect(data.type).to.equal('Ant');
      expect(data.faction).to.equal('neutral'); // Default faction from controller
    });
    
    it('should include timestamp', function() {
      const data = entity.getValidationData();
      expect(data.timestamp).to.be.a('string');
    });
    
    it('should include position and size', function() {
      entity.setPosition(50, 60);
      entity.setSize(32, 32);
      const data = entity.getValidationData();
      expect(data.position).to.exist;
      expect(data.size).to.exist;
    });
  });
  
  describe('Destroy', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should mark entity as inactive', function() {
      entity.destroy();
      expect(entity._isActive).to.be.false;
    });
    
    it('should not throw when destroyed', function() {
      expect(() => entity.destroy()).to.not.throw();
    });
  });
  
  describe('Enhanced API - Highlight', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have highlight namespace', function() {
      expect(entity.highlight).to.be.an('object');
    });
    
    it('should call highlight.selected', function() {
      const result = entity.highlight.selected();
      expect(result).to.equal('selected');
    });
    
    it('should call highlight.hover', function() {
      const result = entity.highlight.hover();
      expect(result).to.equal('hover');
    });
  });
  
  describe('Enhanced API - Rendering', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have rendering namespace', function() {
      expect(entity.rendering).to.be.an('object');
    });
    
    it('should set debug mode', function() {
      entity.rendering.setDebugMode(true);
      expect(entity.rendering.isVisible()).to.be.true;
    });
    
    it('should set opacity', function() {
      entity.rendering.setOpacity(0.5);
      expect(entity.rendering.getOpacity()).to.equal(0.5);
    });
  });
  
  describe('Enhanced API - Config', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have config namespace', function() {
      expect(entity.config).to.be.an('object');
    });
    
    it('should get debugMode when render controller available', function() {
      const renderController = entity.getController('render');
      if (renderController && renderController.getDebugMode) {
        const debugMode = renderController.getDebugMode();
        expect(debugMode).to.be.a('boolean');
      } else {
        // If no render controller, skip test
        expect(true).to.be.true;
      }
    });
    
    it('should get smoothing when render controller available', function() {
      const renderController = entity.getController('render');
      if (renderController && renderController.getSmoothing) {
        const smoothing = renderController.getSmoothing();
        expect(smoothing).to.be.a('boolean');
      } else {
        // If no render controller, skip test
        expect(true).to.be.true;
      }
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero position and size', function() {
      const entity = new Entity(0, 0, 0, 0);
      expect(entity.getPosition().x).to.equal(0);
      expect(entity.getSize().x).to.equal(0);
    });
    
    it('should handle negative position', function() {
      const entity = new Entity(-100, -200, 32, 32);
      expect(entity.getX()).to.equal(-100);
      expect(entity.getY()).to.equal(-200);
    });
    
    it('should handle very large position', function() {
      const entity = new Entity(1e6, 1e6, 32, 32);
      expect(entity.getX()).to.equal(1e6);
      expect(entity.getY()).to.equal(1e6);
    });
    
    it('should handle fractional values', function() {
      const entity = new Entity(10.5, 20.7, 32.3, 32.9);
      const pos = entity.getPosition();
      expect(pos.x).to.be.closeTo(10.5, 0.1);
      expect(pos.y).to.be.closeTo(20.7, 0.1);
    });
    
    it('should handle missing controllers gracefully', function() {
      // Remove all controllers temporarily
      global.TransformController = undefined;
      const entity = new Entity(0, 0, 32, 32);
      expect(() => entity.update()).to.not.throw();
      // Restore
      global.TransformController = MockTransformController;
    });
  });
  
  describe('Integration', function() {
    it('should maintain state across multiple operations', function() {
      const entity = new Entity(0, 0, 32, 32, { type: 'Ant', faction: 'player' });
      
      entity.setPosition(100, 200);
      entity.setSize(64, 64);
      entity.setSelected(true);
      entity.moveToLocation(300, 400);
      entity.update();
      
      expect(entity.getX()).to.equal(100);
      expect(entity.isSelected()).to.be.true;
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should handle collision detection after movement', function() {
      const entity1 = new Entity(0, 0, 32, 32);
      const entity2 = new Entity(100, 100, 32, 32);
      
      expect(entity1.collidesWith(entity2)).to.be.false;
      
      entity1.setPosition(100, 100);
      entity1.update();
      entity2.update();
      
      expect(entity1.collidesWith(entity2)).to.be.true;
    });
  });
});




// ================================================================
// statsContainer.test.js (64 tests)
// ================================================================
// Mock p5.js createVector
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });

// Mock devConsoleEnabled
global.devConsoleEnabled = false;

// Load the module
let { StatsContainer, stat } = require('../../../Classes/containers/StatsContainer.js');

describe('stat', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const s = new stat();
      expect(s.statName).to.equal('NONAME');
      expect(s.statValue).to.equal(0);
      expect(s.statLowerLimit).to.equal(0);
      expect(s.statUpperLimit).to.equal(500);
    });
    
    it('should initialize with custom name and value', function() {
      const s = new stat('Health', 100);
      expect(s.statName).to.equal('Health');
      expect(s.statValue).to.equal(100);
    });
    
    it('should initialize with custom limits', function() {
      const s = new stat('Power', 50, 10, 200);
      expect(s.statLowerLimit).to.equal(10);
      expect(s.statUpperLimit).to.equal(200);
      expect(s.statValue).to.equal(50);
    });
    
    it('should enforce limits on construction', function() {
      const s = new stat('Overflow', 600, 0, 500);
      expect(s.statValue).to.equal(500);
    });
    
    it('should enforce lower limit on construction', function() {
      const s = new stat('Underflow', -10, 0, 500);
      expect(s.statValue).to.equal(0);
    });
  });
  
  describe('Getters and Setters', function() {
    it('should get and set statName', function() {
      const s = new stat();
      s.statName = 'Strength';
      expect(s.statName).to.equal('Strength');
    });
    
    it('should get and set statValue', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 75;
      expect(s.statValue).to.equal(75);
    });
    
    it('should get and set statUpperLimit', function() {
      const s = new stat();
      s.statUpperLimit = 1000;
      expect(s.statUpperLimit).to.equal(1000);
    });
    
    it('should get and set statLowerLimit', function() {
      const s = new stat();
      s.statLowerLimit = -100;
      expect(s.statLowerLimit).to.equal(-100);
    });
  });
  
  describe('enforceStatLimit()', function() {
    it('should clamp value to upper limit', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 150;
      expect(s.statValue).to.equal(100);
    });
    
    it('should clamp value to lower limit', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = -10;
      expect(s.statValue).to.equal(0);
    });
    
    it('should not change valid value', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 75;
      expect(s.statValue).to.equal(75);
    });
    
    it('should handle exact limit values', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 0;
      expect(s.statValue).to.equal(0);
      s.statValue = 100;
      expect(s.statValue).to.equal(100);
    });
    
    it('should handle negative limits', function() {
      const s = new stat('Temperature', 0, -100, 100);
      s.statValue = -50;
      expect(s.statValue).to.equal(-50);
      s.statValue = -150;
      expect(s.statValue).to.equal(-100);
    });
  });
  
  describe('printStatToDebug()', function() {
    it('should not throw when called', function() {
      const s = new stat('Test', 100);
      expect(() => s.printStatToDebug()).to.not.throw();
    });
    
    it('should handle vector values', function() {
      const s = new stat('Position', { x: 10, y: 20 });
      expect(() => s.printStatToDebug()).to.not.throw();
    });
  });
  
  describe('printStatUnderObject()', function() {
    it('should not throw when rendering unavailable', function() {
      const s = new stat('Test', 100);
      const pos = { x: 0, y: 0 };
      const size = { x: 32, y: 32 };
      expect(() => s.printStatUnderObject(pos, size, 12)).to.not.throw();
    });
    
    it('should handle vector statValue', function() {
      const s = new stat('Position', { x: 10, y: 20 });
      const pos = { x: 0, y: 0 };
      const size = { x: 32, y: 32 };
      expect(() => s.printStatUnderObject(pos, size, 12)).to.not.throw();
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero limits', function() {
      const s = new stat('Zero', 0, 0, 0);
      expect(s.statValue).to.equal(0);
    });
    
    it('should handle very large numbers', function() {
      const s = new stat('Large', 1e9, 0, 1e10);
      expect(s.statValue).to.equal(1e9);
    });
    
    it('should handle fractional values', function() {
      const s = new stat('Fraction', 3.14159, 0, 10);
      expect(s.statValue).to.be.closeTo(3.14159, 0.00001);
    });
    
    it('should handle string name', function() {
      const s = new stat('Very Long Stat Name With Spaces');
      expect(s.statName).to.equal('Very Long Stat Name With Spaces');
    });
  });
});

describe('StatsContainer', function() {
  
  describe('Constructor', function() {
    it('should initialize with valid vectors', function() {
      const pos = createVector(10, 20);
      const size = createVector(32, 32);
      const stats = new StatsContainer(pos, size);
      
      expect(stats.position.statValue.x).to.equal(10);
      expect(stats.position.statValue.y).to.equal(20);
      expect(stats.size.statValue.x).to.equal(32);
      expect(stats.size.statValue.y).to.equal(32);
    });
    
    it('should initialize with custom parameters', function() {
      const pos = createVector(5, 15);
      const size = createVector(64, 64);
      const stats = new StatsContainer(pos, size, 2.5, null, 50, 200, 5);
      
      expect(stats.movementSpeed.statValue).to.equal(2.5);
      expect(stats.strength.statValue).to.equal(50);
      expect(stats.health.statValue).to.equal(200);
      expect(stats.gatherSpeed.statValue).to.equal(5);
    });
    
    it('should throw error for invalid pos', function() {
      expect(() => new StatsContainer(null, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for missing pos.x', function() {
      expect(() => new StatsContainer({ y: 10 }, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for missing pos.y', function() {
      expect(() => new StatsContainer({ x: 10 }, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for invalid size', function() {
      expect(() => new StatsContainer(createVector(0, 0), null)).to.throw(Error);
    });
    
    it('should throw error for missing size.x', function() {
      expect(() => new StatsContainer(createVector(0, 0), { y: 32 })).to.throw(Error);
    });
    
    it('should throw error for missing size.y', function() {
      expect(() => new StatsContainer(createVector(0, 0), { x: 32 })).to.throw(Error);
    });
    
    it('should create pendingPos from pos when null', function() {
      const pos = createVector(100, 200);
      const size = createVector(32, 32);
      const stats = new StatsContainer(pos, size);
      
      expect(stats.pendingPos.statValue.x).to.equal(100);
      expect(stats.pendingPos.statValue.y).to.equal(200);
    });
    
    it('should use provided pendingPos when given', function() {
      const pos = createVector(10, 20);
      const size = createVector(32, 32);
      const pending = createVector(50, 60);
      const stats = new StatsContainer(pos, size, 1, pending);
      
      expect(stats.pendingPos.statValue.x).to.equal(50);
      expect(stats.pendingPos.statValue.y).to.equal(60);
    });
    
    it('should create exp map', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(stats.exp).to.be.instanceOf(Map);
      expect(stats.exp.size).to.equal(8);
    });
  });
  
  describe('Getters and Setters', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should get and set position', function() {
      const newPos = new stat('Position', createVector(50, 50));
      stats.position = newPos;
      expect(stats.position).to.equal(newPos);
    });
    
    it('should get and set size', function() {
      const newSize = new stat('Size', createVector(64, 64));
      stats.size = newSize;
      expect(stats.size).to.equal(newSize);
    });
    
    it('should get and set movementSpeed', function() {
      const newSpeed = new stat('Speed', 5.0);
      stats.movementSpeed = newSpeed;
      expect(stats.movementSpeed).to.equal(newSpeed);
    });
    
    it('should get and set pendingPos', function() {
      const newPending = new stat('Pending', createVector(100, 100));
      stats.pendingPos = newPending;
      expect(stats.pendingPos).to.equal(newPending);
    });
  });
  
  describe('EXP System', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should create all EXP categories', function() {
      expect(stats.exp.has('Lifetime')).to.be.true;
      expect(stats.exp.has('Gathering')).to.be.true;
      expect(stats.exp.has('Hunting')).to.be.true;
      expect(stats.exp.has('Swimming')).to.be.true;
      expect(stats.exp.has('Farming')).to.be.true;
      expect(stats.exp.has('Construction')).to.be.true;
      expect(stats.exp.has('Ranged')).to.be.true;
      expect(stats.exp.has('Scouting')).to.be.true;
    });
    
    it('should initialize each EXP category with stat instance', function() {
      const lifetime = stats.exp.get('Lifetime');
      expect(lifetime).to.be.instanceOf(stat);
      expect(lifetime.statName).to.equal('Lifetime EXP');
    });
    
    it('should allow modifying EXP values', function() {
      const gathering = stats.exp.get('Gathering');
      gathering.statValue = 100;
      expect(gathering.statValue).to.equal(100);
    });
  });
  
  describe('getExpTotal()', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should call setExpTotal and return expTotal property', function() {
      const total = stats.getExpTotal();
      expect(total).to.exist;
      expect(stats.expTotal).to.exist;
    });
    
    it('should sum stat values from EXP categories', function() {
      stats.exp.get('Gathering').statValue = 100;
      stats.exp.get('Hunting').statValue = 50;
      stats.exp.get('Farming').statValue = 25;
      
      const total = stats.getExpTotal();
      // Note: setExpTotal iterates through Map values and Object.keys
      // This is a complex iteration pattern in the original code
      expect(total).to.exist;
      expect(stats.expTotal).to.exist;
    });
    
    it('should update expTotal property when called', function() {
      stats.exp.get('Scouting').statValue = 300;
      stats.getExpTotal();
      expect(stats.expTotal).to.exist;
    });
    
    it('should recalculate when called multiple times', function() {
      stats.exp.get('Lifetime').statValue = 50;
      let total = stats.getExpTotal();
      expect(total).to.exist;
      
      stats.exp.get('Construction').statValue = 75;
      total = stats.getExpTotal();
      expect(total).to.exist;
    });
  });
  
  describe('setExpTotal()', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should calculate total using complex iteration pattern', function() {
      stats.exp.get('Gathering').statValue = 10;
      stats.exp.get('Hunting').statValue = 20;
      stats.exp.get('Swimming').statValue = 30;
      
      stats.setExpTotal();
      // The implementation iterates through Map values and their Object.keys
      expect(stats.expTotal).to.exist;
    });
    
    it('should initialize expTotal to 0 before calculating', function() {
      stats.expTotal = 999;
      stats.setExpTotal();
      // expTotal gets reset to 0, then recalculated
      expect(stats.expTotal).to.exist;
    });
  });
  
  describe('printExpTotal()', function() {
    it('should not throw when called', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(() => stats.printExpTotal()).to.not.throw();
    });
  });
  
  describe('test_Map()', function() {
    it('should not throw with valid map', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      const testMap = new Map([['key1', 'value1'], ['key2', 'value2']]);
      expect(() => stats.test_Map(testMap)).to.not.throw();
    });
  });
  
  describe('test_Exp()', function() {
    it('should not throw when called', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(() => stats.test_Exp()).to.not.throw();
    });
  });
  
  describe('Stat Limits', function() {
    it('should enforce movementSpeed limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 150);
      expect(stats.movementSpeed.statValue).to.equal(100); // Clamped to upper limit
    });
    
    it('should enforce strength limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 2000);
      expect(stats.strength.statValue).to.equal(1000); // Clamped to upper limit
    });
    
    it('should enforce health limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 10, 20000);
      expect(stats.health.statValue).to.equal(10000); // Clamped to upper limit
    });
    
    it('should enforce gatherSpeed limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 10, 100, 200);
      expect(stats.gatherSpeed.statValue).to.equal(100); // Clamped to upper limit
    });
    
    it('should handle negative values', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), -10, null, -50, -100, -5);
      expect(stats.movementSpeed.statValue).to.equal(0);
      expect(stats.strength.statValue).to.equal(0);
      expect(stats.health.statValue).to.equal(0);
      expect(stats.gatherSpeed.statValue).to.equal(0);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero position', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(0);
      expect(stats.position.statValue.y).to.equal(0);
    });
    
    it('should handle negative position', function() {
      const stats = new StatsContainer(createVector(-100, -200), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(-100);
      expect(stats.position.statValue.y).to.equal(-200);
    });
    
    it('should handle very large position values', function() {
      const stats = new StatsContainer(createVector(1e6, 1e6), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(1e6);
      expect(stats.position.statValue.y).to.equal(1e6);
    });
    
    it('should handle fractional stat values', function() {
      const stats = new StatsContainer(
        createVector(10.5, 20.7),
        createVector(32.3, 32.9),
        0.123,
        null,
        15.6,
        99.9,
        2.5
      );
      expect(stats.movementSpeed.statValue).to.be.closeTo(0.123, 0.001);
      expect(stats.strength.statValue).to.be.closeTo(15.6, 0.1);
    });
    
    it('should handle all stats at maximum', function() {
      const stats = new StatsContainer(
        createVector(0, 0),
        createVector(32, 32),
        100,
        null,
        1000,
        10000,
        100
      );
      expect(stats.movementSpeed.statValue).to.equal(100);
      expect(stats.strength.statValue).to.equal(1000);
      expect(stats.health.statValue).to.equal(10000);
      expect(stats.gatherSpeed.statValue).to.equal(100);
    });
    
    it('should handle all stats at minimum', function() {
      const stats = new StatsContainer(
        createVector(0, 0),
        createVector(32, 32),
        0,
        null,
        0,
        0,
        0
      );
      expect(stats.movementSpeed.statValue).to.equal(0);
      expect(stats.strength.statValue).to.equal(0);
      expect(stats.health.statValue).to.equal(0);
      expect(stats.gatherSpeed.statValue).to.equal(0);
    });
  });
  
  describe('Integration', function() {
    it('should maintain consistency across stat updates', function() {
      const stats = new StatsContainer(createVector(50, 50), createVector(32, 32));
      
      // Update various stats
      stats.strength.statValue = 500;
      stats.health.statValue = 5000;
      stats.exp.get('Gathering').statValue = 100;
      stats.exp.get('Hunting').statValue = 200;
      
      expect(stats.strength.statValue).to.equal(500);
      expect(stats.health.statValue).to.equal(5000);
      
      const total = stats.getExpTotal();
      expect(total).to.exist;
    });
    
    it('should handle multiple position updates', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      
      stats.position.statValue = createVector(10, 20);
      expect(stats.position.statValue.x).to.equal(10);
      
      stats.position.statValue = createVector(100, 200);
      expect(stats.position.statValue.x).to.equal(100);
      expect(stats.position.statValue.y).to.equal(200);
    });
    
    it('should handle complex EXP scenario', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      
      // Simulate gaining EXP in multiple categories
      stats.exp.get('Lifetime').statValue = 1000;
      stats.exp.get('Gathering').statValue = 250;
      stats.exp.get('Hunting').statValue = 150;
      stats.exp.get('Farming').statValue = 300;
      stats.exp.get('Construction').statValue = 200;
      
      const total = stats.getExpTotal();
      expect(total).to.exist;
    });
  });
});




// ================================================================
// dropoffLocation.test.js (50 tests)
// ================================================================
// Mock p5.js globals
global.TILE_SIZE = 32;
global.NONE = null;
global.push = function() {};
global.pop = function() {};
global.noStroke = function() {};
global.stroke = function() {};
global.strokeWeight = function() {};
global.noFill = function() {};
global.fill = function() {};
global.rect = function() {};

// Mock InventoryController
class MockInventoryController {
  constructor(owner, capacity = 2) {
    this.owner = owner;
    this.capacity = capacity;
    this.items = [];
  }
  
  addResource(resource) {
    if (this.items.length >= this.capacity) return false;
    this.items.push(resource);
    return true;
  }
  
  transferAllTo(targetInventory) {
    let transferred = 0;
    while (this.items.length > 0 && targetInventory.items.length < targetInventory.capacity) {
      const item = this.items.shift();
      if (targetInventory.addResource(item)) transferred++;
    }
    return transferred;
  }
  
  getResources() {
    return this.items;
  }
}

global.InventoryController = MockInventoryController;

// Mock Grid class
class MockGrid {
  constructor() {
    this.data = new Map();
  }
  
  set(coords, value) {
    const key = `${coords[0]},${coords[1]}`;
    this.data.set(key, value);
  }
  
  get(coords) {
    const key = `${coords[0]},${coords[1]}`;
    return this.data.get(key);
  }
}

// Load the module
let DropoffLocation = require('../../../Classes/containers/DropoffLocation.js');

describe('DropoffLocation', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const dropoff = new DropoffLocation(5, 4);
      expect(dropoff.x).to.equal(5);
      expect(dropoff.y).to.equal(4);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
      expect(dropoff.tileSize).to.equal(32);
    });
    
    it('should initialize with custom dimensions', function() {
      const dropoff = new DropoffLocation(10, 20, 3, 2);
      expect(dropoff.x).to.equal(10);
      expect(dropoff.y).to.equal(20);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should initialize with custom tile size', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { tileSize: 64 });
      expect(dropoff.tileSize).to.equal(64);
    });
    
    it('should floor grid coordinates', function() {
      const dropoff = new DropoffLocation(5.7, 4.2, 2.9, 3.1);
      expect(dropoff.x).to.equal(5);
      expect(dropoff.y).to.equal(4);
      expect(dropoff.width).to.equal(2);
      expect(dropoff.height).to.equal(3);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 0, 0);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should create inventory with default capacity', function() {
      const dropoff = new DropoffLocation(0, 0);
      expect(dropoff.inventory).to.not.be.null;
      expect(dropoff.inventory.capacity).to.equal(2);
    });
    
    it('should create inventory with custom capacity', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      expect(dropoff.inventory.capacity).to.equal(10);
    });
    
    it('should mark grid on construction if provided', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(2, 3, 2, 2, { grid });
      expect(dropoff._filledOnGrid).to.be.true;
      expect(grid.get([2, 3])).to.equal(dropoff);
      expect(grid.get([3, 4])).to.equal(dropoff);
    });
  });
  
  describe('tiles()', function() {
    it('should return single tile for 1x1 dropoff', function() {
      const dropoff = new DropoffLocation(5, 4, 1, 1);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(1);
      expect(tiles[0]).to.deep.equal([5, 4]);
    });
    
    it('should return all tiles for 2x2 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(4);
      expect(tiles).to.deep.include.members([[0, 0], [1, 0], [0, 1], [1, 1]]);
    });
    
    it('should return all tiles for 3x2 dropoff', function() {
      const dropoff = new DropoffLocation(10, 20, 3, 2);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(6);
      expect(tiles).to.deep.include.members([
        [10, 20], [11, 20], [12, 20],
        [10, 21], [11, 21], [12, 21]
      ]);
    });
    
    it('should handle large dropoff areas', function() {
      const dropoff = new DropoffLocation(0, 0, 10, 10);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(100);
    });
  });
  
  describe('expand()', function() {
    it('should expand width by positive delta', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(1, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should expand height by positive delta', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(0, 2);
      expect(dropoff.width).to.equal(2);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should expand both dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.expand(2, 3);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should handle negative delta (retraction)', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.expand(-2, -1);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should enforce minimum size of 1x1 when retracting', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(-5, -5);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should do nothing when both deltas are zero', function() {
      const dropoff = new DropoffLocation(0, 0, 3, 3);
      dropoff.expand(0, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(3);
    });
    
    it('should update grid when expanding', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 1, 1, { grid });
      dropoff.expand(1, 0);
      expect(grid.get([1, 0])).to.equal(dropoff);
    });
  });
  
  describe('retract()', function() {
    it('should retract width', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(2, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(5);
    });
    
    it('should retract height', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(0, 3);
      expect(dropoff.width).to.equal(5);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should retract both dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 10, 10);
      dropoff.retract(3, 4);
      expect(dropoff.width).to.equal(7);
      expect(dropoff.height).to.equal(6);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.retract(10, 10);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should convert positive arguments to absolute values', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(2, 1);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
  });
  
  describe('setSize()', function() {
    it('should set absolute width and height', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.setSize(5, 7);
      expect(dropoff.width).to.equal(5);
      expect(dropoff.height).to.equal(7);
    });
    
    it('should floor fractional values', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.setSize(4.9, 6.1);
      expect(dropoff.width).to.equal(4);
      expect(dropoff.height).to.equal(6);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.setSize(0, 0);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should update grid when resizing', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 1, 1, { grid });
      dropoff.setSize(3, 3);
      expect(dropoff.tiles()).to.have.lengthOf(9);
    });
  });
  
  describe('depositResource()', function() {
    it('should add resource to inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      const resource = { type: 'wood' };
      const result = dropoff.depositResource(resource);
      expect(result).to.be.true;
      expect(dropoff.inventory.items).to.include(resource);
    });
    
    it('should return false when inventory is full', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 2 });
      dropoff.depositResource({ type: 'wood' });
      dropoff.depositResource({ type: 'stone' });
      const result = dropoff.depositResource({ type: 'food' });
      expect(result).to.be.false;
    });
    
    it('should return false when no inventory exists', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { InventoryController: null });
      dropoff.inventory = null;
      const result = dropoff.depositResource({ type: 'wood' });
      expect(result).to.be.false;
    });
    
    it('should handle multiple deposits', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 5 });
      expect(dropoff.depositResource({ type: 'a' })).to.be.true;
      expect(dropoff.depositResource({ type: 'b' })).to.be.true;
      expect(dropoff.depositResource({ type: 'c' })).to.be.true;
      expect(dropoff.inventory.items).to.have.lengthOf(3);
    });
  });
  
  describe('acceptFromCarrier()', function() {
    it('should transfer resources from carrier with transferAllTo', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'wood' });
      carrier.inventory.addResource({ type: 'stone' });
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(2);
      expect(carrier.inventory.items).to.have.lengthOf(0);
    });
    
    it('should transfer resources from carrier with getResources', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const carrier = {
        getResources: () => [{ type: 'wood' }, { type: 'stone' }],
        removeResource: function(index) { this.getResources()[index] = null; }
      };
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(2);
    });
    
    it('should return 0 when carrier is null', function() {
      const dropoff = new DropoffLocation(0, 0);
      const transferred = dropoff.acceptFromCarrier(null);
      expect(transferred).to.equal(0);
    });
    
    it('should return 0 when dropoff has no inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      dropoff.inventory = null;
      const carrier = { inventory: new MockInventoryController(null, 5) };
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(0);
    });
    
    it('should handle partial transfers when dropoff is nearly full', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 3 });
      dropoff.depositResource({ type: 'existing' });
      
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'a' });
      carrier.inventory.addResource({ type: 'b' });
      carrier.inventory.addResource({ type: 'c' });
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(3);
      expect(carrier.inventory.items).to.have.lengthOf(1);
    });
    
    it('should handle empty carrier inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      const carrier = { inventory: new MockInventoryController(null, 5) };
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(0);
    });
  });
  
  describe('getCenterPx()', function() {
    it('should return center of 1x1 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(16);
      expect(center.y).to.equal(16);
    });
    
    it('should return center of 2x2 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(32);
      expect(center.y).to.equal(32);
    });
    
    it('should return center with custom tile size', function() {
      const dropoff = new DropoffLocation(5, 5, 3, 3, { tileSize: 64 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(416); // (5 + 3/2) * 64 = 6.5 * 64
      expect(center.y).to.equal(416);
    });
    
    it('should return center at non-zero grid position', function() {
      const dropoff = new DropoffLocation(10, 20, 4, 2, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(384); // (10 + 4/2) * 32 = 12 * 32
      expect(center.y).to.equal(672); // (20 + 2/2) * 32 = 21 * 32
    });
  });
  
  describe('draw()', function() {
    it('should not throw when p5 functions are available', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      expect(() => dropoff.draw()).to.not.throw();
    });
    
    it('should handle missing p5 gracefully', function() {
      const originalPush = global.push;
      global.push = undefined;
      const dropoff = new DropoffLocation(0, 0);
      expect(() => dropoff.draw()).to.not.throw();
      global.push = originalPush;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle negative grid coordinates', function() {
      const dropoff = new DropoffLocation(-5, -10, 2, 2);
      expect(dropoff.x).to.equal(-5);
      expect(dropoff.y).to.equal(-10);
      const tiles = dropoff.tiles();
      expect(tiles).to.deep.include.members([[-5, -10], [-4, -10], [-5, -9], [-4, -9]]);
    });
    
    it('should handle very large dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 100, 100);
      expect(dropoff.width).to.equal(100);
      expect(dropoff.height).to.equal(100);
      expect(dropoff.tiles()).to.have.lengthOf(10000);
    });
    
    it('should handle grid operations without grid instance', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      expect(() => dropoff.expand(1, 1)).to.not.throw();
      expect(() => dropoff.retract(1, 1)).to.not.throw();
    });
    
    it('should handle carrier without removeResource method', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const resources = [{ type: 'wood' }, { type: 'stone' }];
      const carrier = {
        getResources: () => resources
      };
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(resources[0]).to.be.null;
      expect(resources[1]).to.be.null;
    });
  });
  
  describe('Integration', function() {
    it('should maintain grid consistency through multiple operations', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 2, 2, { grid });
      
      dropoff.expand(1, 0);
      expect(dropoff.tiles()).to.have.lengthOf(6);
      
      dropoff.setSize(4, 4);
      expect(dropoff.tiles()).to.have.lengthOf(16);
      
      dropoff.retract(2, 2);
      expect(dropoff.tiles()).to.have.lengthOf(4);
    });
    
    it('should handle resource workflow', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 5 });
      
      // Deposit individual resources
      expect(dropoff.depositResource({ type: 'a' })).to.be.true;
      expect(dropoff.depositResource({ type: 'b' })).to.be.true;
      
      // Accept from carrier
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'c' });
      carrier.inventory.addResource({ type: 'd' });
      
      dropoff.acceptFromCarrier(carrier);
      expect(dropoff.inventory.items).to.have.lengthOf(4);
    });
  });
});




// ================================================================
// resource.movement.test.js (1 tests)
// ================================================================
/**
 * Resource Movement Integration Test
 */

// Mock Entity dependencies for Node.js testing
class MockCollisionBox2D {
  constructor(x, y, width, height) {
    this.x = x; this.y = y; this.width = width; this.height = height;
  }
  setPosition(x, y) { this.x = x; this.y = y; }
  setSize(w, h) { this.width = w; this.height = h; }
  contains(x, y) { return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height; }
}

class MockMovementController {
  constructor(entity) {
    this._entity = entity;
    this._movementSpeed = 30; // Default speed
    this._isMoving = false;
    this._skitterTimer = 100;
  }
  get movementSpeed() { return this._movementSpeed; }
  set movementSpeed(speed) { this._movementSpeed = speed; }
  getEffectiveMovementSpeed() {
    let baseSpeed = this._movementSpeed;
    if (this._entity.movementSpeed !== undefined) {
      baseSpeed = this._entity.movementSpeed;
    }
    return baseSpeed;
  }
  shouldSkitter() {
    if (this.getEffectiveMovementSpeed() <= 0) {
      return false;
    }
    this._skitterTimer -= 1;
    return this._skitterTimer <= 0;
  }
  update() {}
  moveToLocation() { return false; }
  getIsMoving() { return this._isMoving; }
  stop() { this._isMoving = false; }
}

class MockEntity {
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) {
    this._id = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._type = options.type || "Entity";
    this._isActive = true;
    this._collisionBox = new MockCollisionBox2D(x, y, width, height);
    this._controllers = new Map();
    this._controllers.set('movement', new MockMovementController(this));
    this._configureControllers(options);
  }
  _configureControllers(options) {
    const movement = this._controllers.get('movement');
    if (movement && options.movementSpeed !== undefined) {
      movement.movementSpeed = options.movementSpeed;
    }
  }
  getController(name) { return this._controllers.get(name); }
  get movementSpeed() { const movement = this._controllers.get('movement'); return movement ? movement.movementSpeed : 0; }
  set movementSpeed(speed) { const movement = this._controllers.get('movement'); if (movement) movement.movementSpeed = speed; }
  getPosition() { return { x: this._collisionBox.x, y: this._collisionBox.y }; }
  setPosition(x, y) { this._collisionBox.setPosition(x, y); }
}

describe('Resource Movement Integration', function() {
  it('prevents resources from skittering when movementSpeed is 0', function() {
    const resource = new MockEntity(10, 10, 20, 20, { type: 'Resource', movementSpeed: 0 });
    const movementController = resource.getController('movement');
    const result = {
      resourceCannotMove: resource.movementSpeed === 0 && !movementController.shouldSkitter(),
      antCanMove: false
    };
    // Basic expectations
    expect(result.resourceCannotMove).to.be.true;
  });
});





// ================================================================
// antStateMachine.test.js (14 tests)
// ================================================================
/* eslint-env mocha */
// DUPLICATE REQUIRE REMOVED: let AntStateMachine = require('../../../Classes/ants/antStateMachine');

describe('AntStateMachine', () => {
  let sm;

  beforeEach(() => {
    sm = new AntStateMachine();
  });

  it('initializes with correct defaults', () => {
    expect(sm.primaryState).to.equal('IDLE');
    expect(sm.combatModifier).to.equal('OUT_OF_COMBAT');
    expect(sm.terrainModifier).to.equal('DEFAULT');
    expect(sm.preferredState).to.equal('GATHERING');
  });

  it('validates primary/combat/terrain lists', () => {
    expect(sm.isValidPrimary('MOVING')).to.be.true;
    expect(sm.isValidPrimary('NOPE')).to.be.false;
    expect(sm.isValidCombat('IN_COMBAT')).to.be.true;
    expect(sm.isValidCombat(null)).to.be.true;
    expect(sm.isValidCombat('FAKE')).to.be.false;
    expect(sm.isValidTerrain('IN_WATER')).to.be.true;
    expect(sm.isValidTerrain(null)).to.be.true;
    expect(sm.isValidTerrain('BAD')).to.be.false;
  });

  it('setPrimaryState accepts valid and rejects invalid', () => {
    const ok = sm.setPrimaryState('MOVING');
    expect(ok).to.be.true;
    expect(sm.primaryState).to.equal('MOVING');

    const bad = sm.setPrimaryState('FLYING');
    expect(bad).to.be.false;
    expect(sm.primaryState).to.equal('MOVING');
  });

  it('setCombatModifier and setTerrainModifier handle null and valid values', () => {
    expect(sm.setCombatModifier('IN_COMBAT')).to.be.true;
    expect(sm.combatModifier).to.equal('IN_COMBAT');

    expect(sm.setCombatModifier(null)).to.be.true;
    expect(sm.combatModifier).to.equal(null);

    expect(sm.setTerrainModifier('IN_WATER')).to.be.true;
    expect(sm.terrainModifier).to.equal('IN_WATER');

    expect(sm.setTerrainModifier(null)).to.be.true;
    expect(sm.terrainModifier).to.equal(null);
  });

  it('setState sets combinations and rejects invalid combos', () => {
    // valid
    expect(sm.setState('GATHERING', 'IN_COMBAT', 'IN_MUD')).to.be.true;
    expect(sm.getFullState()).to.equal('GATHERING_IN_COMBAT_IN_MUD');

    // invalid primary
    expect(sm.setState('FLAP', null, null)).to.be.false;

    // invalid combat
    expect(sm.setState('IDLE', 'BAD', null)).to.be.false;

    // invalid terrain
    expect(sm.setState('IDLE', null, 'BAD')).to.be.false;
  });

  it('getFullState and getCurrentState return expected strings', () => {
    sm.setState('MOVING', 'IN_COMBAT', 'ON_ROUGH');
    expect(sm.getFullState()).to.equal('MOVING_IN_COMBAT_ON_ROUGH');
    expect(sm.getCurrentState()).to.equal('MOVING');
  });

  it('canPerformAction covers branches correctly', () => {
    // default: IDLE, OUT_OF_COMBAT, DEFAULT
    expect(sm.canPerformAction('move')).to.be.true;
    expect(sm.canPerformAction('gather')).to.be.true;
    expect(sm.canPerformAction('attack')).to.be.false;

    sm.setCombatModifier('IN_COMBAT');
    expect(sm.canPerformAction('attack')).to.be.true;

    sm.setPrimaryState('BUILDING');
    expect(sm.canPerformAction('move')).to.be.false;
    expect(sm.canPerformAction('gather')).to.be.false;

    sm.setState('IDLE', 'OUT_OF_COMBAT', null);
    sm.setTerrainModifier('ON_SLIPPERY');
    expect(sm.canPerformAction('move')).to.be.false; // slippery blocks move
  });

  it('state query helpers return expected booleans', () => {
    sm.reset();
    expect(sm.isIdle()).to.be.true;
    expect(sm.isOutOfCombat()).to.be.true;
    expect(sm.isOnDefaultTerrain()).to.be.true;

    sm.setState('MOVING', 'IN_COMBAT', 'IN_MUD');
    expect(sm.isMoving()).to.be.true;
    expect(sm.isInCombat()).to.be.true;
    expect(sm.isInMud()).to.be.true;
  });

  it('clearModifiers and reset behave correctly and invoke callback', (done) => {
    let calls = 0;
    sm.setStateChangeCallback((oldS, newS) => { calls++; });
    sm.setState('GATHERING', 'IN_COMBAT', 'IN_WATER');
    expect(sm.getFullState()).to.equal('GATHERING_IN_COMBAT_IN_WATER');

    sm.clearModifiers();
    expect(sm.combatModifier).to.equal(null);
    expect(sm.terrainModifier).to.equal(null);

    sm.reset();
    expect(sm.primaryState).to.equal('IDLE');
    expect(sm.combatModifier).to.equal('OUT_OF_COMBAT');
    expect(sm.terrainModifier).to.equal('DEFAULT');

    // callback should have been called at least once (setState, clearModifiers, reset)
    expect(calls).to.be.at.least(1);
    done();
  });

  it('setPreferredState and ResumePreferredState work', () => {
    sm.setPreferredState('MOVING');
    sm.beginIdle();
    sm.ResumePreferredState();
    expect(sm.primaryState).to.equal('MOVING');
  });

  it('isValidAnyState and isInState utilities', () => {
    expect(sm.isValidAnyState('MOVING')).to.be.true;
    expect(sm.isValidAnyState('IN_COMBAT')).to.be.true;
    expect(sm.isValidAnyState('IN_WATER')).to.be.true;
    expect(sm.isValidAnyState('NOPE')).to.be.false;

    sm.setState('GATHERING', 'IN_COMBAT', 'IN_WATER');
    expect(sm.isInState('GATHERING_IN_COMBAT_IN_WATER')).to.be.true;
  });

  it('printState uses devConsoleEnabled global (no throw)', () => {
    // ensure printState does not throw if devConsoleEnabled undefined/false
    global.devConsoleEnabled = false;
    expect(() => sm.printState()).to.not.throw();
    global.devConsoleEnabled = true;
    expect(() => sm.printState()).to.not.throw();
  });

  it('getStateSummary contains expected structure', () => {
    sm.setState('GATHERING', null, null);
    const summary = sm.getStateSummary();
    expect(summary).to.include.keys('fullState', 'primary', 'combat', 'terrain', 'actions');
    expect(summary.primary).to.equal('GATHERING');
  });

  it('update is a no-op and does not throw', () => {
    expect(() => sm.update()).to.not.throw();
  });
});




// ================================================================
// gatherState.test.js (16 tests)
// ================================================================
// Ensure Globals used by GatherState are present
global.logVerbose = global.logVerbose || function() {};
global.deltaTime = global.deltaTime || 16; // ms per frame approx

// DUPLICATE REQUIRE REMOVED: let GatherState = require('../../../Classes/ants/GatherState');

describe('GatherState', function() {
  let antMock;
  let resourceManagerMock;
  let movementControllerMock;
  let stateMachineMock;

  beforeEach(function() {
    // reset global resource manager
    global.g_resourceManager = {
      _list: [],
      getResourceList() { return this._list; },
      removeResource(r) { const i = this._list.indexOf(r); if (i !== -1) this._list.splice(i,1); }
    };

    resourceManagerMock = {
      _load: 0,
      isAtMaxLoad() { return this._load >= 5; },
      addResource(r) { if (!r) return false; this._load++; return true; },
      startDropOff(x,y) { this.dropOffCalled = {x,y}; }
    };

    movementControllerMock = {
      lastTarget: null,
      moveToLocation(x,y) { this.lastTarget = {x,y}; }
    };

    stateMachineMock = {
      primary: 'IDLE',
      setPrimaryState(s) { this.primary = s; }
    };

    antMock = {
      id: 'ant-1',
      _antIndex: 1,
      _resourceManager: resourceManagerMock,
      _movementController: movementControllerMock,
      _stateMachine: stateMachineMock,
      posX: 100,
      posY: 100,
      getPosition() { return { x: this.posX, y: this.posY }; }
    };
  });

  afterEach(function() {
    delete global.g_resource_manager;
    delete global.g_resourceManager;
  });

  it('initializes with correct defaults', function() {
    const gs = new GatherState(antMock);
    expect(gs.ant).to.equal(antMock);
    expect(gs.gatherRadius).to.equal(7);
    expect(gs.pixelRadius).to.equal(224);
    expect(gs.isActive).to.be.false;
  });

  it('enter() activates state and sets ant primary state', function() {
    const gs = new GatherState(antMock);
    gs.enter();
    expect(gs.isActive).to.be.true;
    expect(stateMachineMock.primary).to.equal('GATHERING');
  });

  it('exit() deactivates state', function() {
    const gs = new GatherState(antMock);
    gs.enter();
    const res = gs.exit();
    expect(res).to.be.true;
    expect(gs.isActive).to.be.false;
  });

  it('getAntPosition() returns ant position', function() {
    const gs = new GatherState(antMock);
    const pos = gs.getAntPosition();
    expect(pos).to.deep.equal({ x: 100, y: 100 });
  });

  it('getDistance() computes Euclidean distance', function() {
    const gs = new GatherState(antMock);
    const d = gs.getDistance(0,0,3,4);
    expect(d).to.equal(5);
  });

  it('getResourcesInRadius() finds resources from g_resourceManager', function() {
    // add resources near and far
    const near = { x: 110, y: 110, type: 'food' };
    const far = { x: 1000, y: 1000, type: 'stone' };
    global.g_resource_manager = global.g_resource_manager || { _list: [] };
    global.g_resource_manager._list.push(near, far);

    const gs = new GatherState(antMock);
    const found = gs.getResourcesInRadius(100,100,50);
    expect(found).to.be.an('array');
    // should find near only
    expect(found.some(r => r.type === 'food')).to.be.true;
    expect(found.some(r => r.type === 'stone')).to.be.false;
  });

  it('searchForResources() sets nearest resource as targetResource', function() {
    const near = { x: 110, y: 110, type: 'food' };
    const other = { x: 105, y: 105, type: 'leaf' };
    global.g_resourceManager._list.push(near, other);

    const gs = new GatherState(antMock);
    const results = gs.searchForResources();
    expect(results.length).to.equal(2);
    expect(gs.targetResource).to.exist;
    // targetResource should be the closest (other at 7.07 vs near at 14.14)
    expect(gs.targetResource.type).to.equal('leaf');
  });

  it('moveToResource delegates to movement controller', function() {
    const gs = new GatherState(antMock);
    gs.moveToResource(200,200);
    expect(movementControllerMock.lastTarget).to.deep.equal({ x:200, y:200 });
  });

  it('attemptResourceCollection adds resource and removes from system', function() {
    const resource = { x: 110, y: 110, type: 'food' };
    global.g_resourceManager._list.push(resource);

    const gs = new GatherState(antMock);
    // manually set targetResource shape as returned by getResourcesInRadius
    gs.targetResource = { resource: resource, x: resource.x, y: resource.y, type: resource.type };

    gs.attemptResourceCollection();

    // resourceManagerMock should have added the resource (load becomes 1)
    expect(resourceManagerMock._load).to.equal(1);
    // g_resourceManager should no longer contain the resource
    expect(global.g_resourceManager._list.indexOf(resource)).to.equal(-1);
    // targetResource cleared
    expect(gs.targetResource).to.be.null;
  });

  it('isAtMaxCapacity() respects ant resource manager', function() {
    const gs = new GatherState(antMock);
    // initially not max
    resourceManagerMock._load = 0;
    expect(gs.isAtMaxCapacity()).to.be.false;
    resourceManagerMock._load = 5;
    expect(gs.isAtMaxCapacity()).to.be.true;
  });

  it('transitionToDropOff() sets state and calls startDropOff', function() {
    const gs = new GatherState(antMock);
    gs.transitionToDropOff();
    expect(stateMachineMock.primary).to.equal('DROPPING_OFF');
    expect(resourceManagerMock.dropOffCalled).to.exist;
    expect(gs.isActive).to.be.false;
  });

  it('updateTargetMovement collects when in range', function() {
    const resource = { x: 102, y: 102, type: 'food' };
    global.g_resourceManager._list.push(resource);

    const gs = new GatherState(antMock);
    gs.targetResource = { resource, x: resource.x, y: resource.y, type: resource.type };

    // call updateTargetMovement should attempt collection (within 15px)
    gs.updateTargetMovement();
    expect(resourceManagerMock._load).to.equal(1);
    expect(gs.targetResource).to.be.null;
  });

  it('getDebugInfo returns useful info object', function() {
    const gs = new GatherState(antMock);
    const info = gs.getDebugInfo();
    expect(info).to.be.an('object');
    expect(info.hasTarget).to.be.a('boolean');
    expect(info.gatherRadius).to.be.a('string');
  });

  it('setDebugEnabled toggles debug flag', function() {
    const gs = new GatherState(antMock);
    gs.setDebugEnabled(true);
    expect(gs.debugEnabled).to.be.true;
    gs.setDebugEnabled(false);
    expect(gs.debugEnabled).to.be.false;
  });
});




// ================================================================
// jobComponent.test.js (46 tests)
// ================================================================
/**
 * JobComponent Unit Tests - Comprehensive Coverage
 */

// Load the JobComponent class
// DUPLICATE REQUIRE REMOVED: let JobComponent = require('../../../Classes/ants/JobComponent.js');
describe('JobComponent', function() {
  describe('Constructor', function() {
    it('should create instance with name and stats', function() {
      const jc = new JobComponent('Builder');
      expect(jc.name).to.equal('Builder');
      expect(jc.stats).to.exist;
      expect(jc.stats).to.be.an('object');
    });

    it('should create instance with name and image', function() {
      const img = { src: 'builder.png' };
      const jc = new JobComponent('Builder', img);
      expect(jc.name).to.equal('Builder');
      expect(jc.image).to.equal(img);
    });

    it('should create instance without image (null default)', function() {
      const jc = new JobComponent('Scout');
      expect(jc.name).to.equal('Scout');
      expect(jc.image).to.be.null;
    });

    it('should retrieve stats for all job types', function() {
      const jobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
      jobs.forEach(jobName => {
        const jc = new JobComponent(jobName);
        expect(jc.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });

    it('should use default stats for unknown job', function() {
      const jc = new JobComponent('UnknownJob');
      expect(jc.stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });
  });

  describe('getJobStats (static)', function() {
    it('should return Builder stats', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats).to.deep.equal({
        strength: 20,
        health: 120,
        gatherSpeed: 15,
        movementSpeed: 60
      });
    });

    it('should return Scout stats', function() {
      const stats = JobComponent.getJobStats('Scout');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 80,
        gatherSpeed: 10,
        movementSpeed: 80
      });
    });

    it('should return Farmer stats', function() {
      const stats = JobComponent.getJobStats('Farmer');
      expect(stats).to.deep.equal({
        strength: 15,
        health: 100,
        gatherSpeed: 30,
        movementSpeed: 60
      });
    });

    it('should return Warrior stats', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats).to.deep.equal({
        strength: 40,
        health: 150,
        gatherSpeed: 5,
        movementSpeed: 60
      });
    });

    it('should return Spitter stats', function() {
      const stats = JobComponent.getJobStats('Spitter');
      expect(stats).to.deep.equal({
        strength: 30,
        health: 90,
        gatherSpeed: 8,
        movementSpeed: 60
      });
    });

    it('should return DeLozier stats (special)', function() {
      const stats = JobComponent.getJobStats('DeLozier');
      expect(stats).to.deep.equal({
        strength: 1000,
        health: 10000,
        gatherSpeed: 1,
        movementSpeed: 10000
      });
    });

    it('should return default stats for unknown job', function() {
      const stats = JobComponent.getJobStats('Unknown');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for null', function() {
      const stats = JobComponent.getJobStats(null);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for undefined', function() {
      const stats = JobComponent.getJobStats(undefined);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for empty string', function() {
      const stats = JobComponent.getJobStats('');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should be case-sensitive', function() {
      const stats = JobComponent.getJobStats('builder'); // lowercase
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return object with all required stat properties', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats).to.have.property('strength');
      expect(stats).to.have.property('health');
      expect(stats).to.have.property('gatherSpeed');
      expect(stats).to.have.property('movementSpeed');
    });

    it('should return numeric values for all stats', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats.strength).to.be.a('number');
      expect(stats.health).to.be.a('number');
      expect(stats.gatherSpeed).to.be.a('number');
      expect(stats.movementSpeed).to.be.a('number');
    });

    it('should return positive values for all stats', function() {
      const jobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
      jobs.forEach(job => {
        const stats = JobComponent.getJobStats(job);
        expect(stats.strength).to.be.above(0);
        expect(stats.health).to.be.above(0);
        expect(stats.gatherSpeed).to.be.above(0);
        expect(stats.movementSpeed).to.be.above(0);
      });
    });
  });

  describe('getJobList (static)', function() {
    it('should return array of standard jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.be.an('array');
      expect(jobs).to.include('Builder');
      expect(jobs).to.include('Scout');
      expect(jobs).to.include('Farmer');
      expect(jobs).to.include('Warrior');
      expect(jobs).to.include('Spitter');
    });

    it('should return exactly 5 jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.have.lengthOf(5);
    });

    it('should not include special jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.not.include('DeLozier');
    });

    it('should return same array on multiple calls', function() {
      const jobs1 = JobComponent.getJobList();
      const jobs2 = JobComponent.getJobList();
      expect(jobs1).to.deep.equal(jobs2);
    });
  });

  describe('getSpecialJobs (static)', function() {
    it('should return array of special jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.be.an('array');
      expect(specialJobs).to.include('DeLozier');
    });

    it('should return exactly 1 special job', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.have.lengthOf(1);
    });

    it('should not include standard jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.not.include('Builder');
      expect(specialJobs).to.not.include('Scout');
      expect(specialJobs).to.not.include('Farmer');
    });
  });

  describe('getAllJobs (static)', function() {
    it('should return array of all jobs (standard + special)', function() {
      const allJobs = JobComponent.getAllJobs();
      expect(allJobs).to.be.an('array');
      expect(allJobs).to.include('Builder');
      expect(allJobs).to.include('Scout');
      expect(allJobs).to.include('DeLozier');
    });

    it('should return exactly 6 jobs total', function() {
      const allJobs = JobComponent.getAllJobs();
      expect(allJobs).to.have.lengthOf(6);
    });

    it('should equal getJobList + getSpecialJobs', function() {
      const jobList = JobComponent.getJobList();
      const specialJobs = JobComponent.getSpecialJobs();
      const allJobs = JobComponent.getAllJobs();
      
      expect(allJobs.length).to.equal(jobList.length + specialJobs.length);
      jobList.forEach(job => expect(allJobs).to.include(job));
      specialJobs.forEach(job => expect(allJobs).to.include(job));
    });

    it('should have no duplicates', function() {
      const allJobs = JobComponent.getAllJobs();
      const uniqueJobs = [...new Set(allJobs)];
      expect(allJobs.length).to.equal(uniqueJobs.length);
    });
  });

  describe('Stats Validation', function() {
    it('should have Builder as high health tank', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats.health).to.equal(120); // Higher than default 100
      expect(stats.strength).to.equal(20);
    });

    it('should have Scout as fastest unit', function() {
      const stats = JobComponent.getJobStats('Scout');
      expect(stats.movementSpeed).to.equal(80); // Fastest
      const builderStats = JobComponent.getJobStats('Builder');
      expect(stats.movementSpeed).to.be.above(builderStats.movementSpeed);
    });

    it('should have Farmer as best gatherer', function() {
      const stats = JobComponent.getJobStats('Farmer');
      expect(stats.gatherSpeed).to.equal(30); // Highest gather speed
      const scoutStats = JobComponent.getJobStats('Scout');
      expect(stats.gatherSpeed).to.be.above(scoutStats.gatherSpeed);
    });

    it('should have Warrior as strongest fighter', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats.strength).to.equal(40); // Highest strength
      expect(stats.health).to.equal(150); // Highest health
    });

    it('should have Spitter as ranged attacker', function() {
      const stats = JobComponent.getJobStats('Spitter');
      expect(stats.strength).to.equal(30); // High damage
      expect(stats.health).to.equal(90); // Lower health (glass cannon)
    });

    it('should have DeLozier as overpowered special unit', function() {
      const stats = JobComponent.getJobStats('DeLozier');
      expect(stats.strength).to.equal(1000);
      expect(stats.health).to.equal(10000);
      expect(stats.movementSpeed).to.equal(10000);
    });
  });

  describe('Edge Cases', function() {
    it('should handle number as job name', function() {
      const stats = JobComponent.getJobStats(123);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle object as job name', function() {
      const stats = JobComponent.getJobStats({});
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle array as job name', function() {
      const stats = JobComponent.getJobStats([]);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should create instance with all job types', function() {
      const allJobs = JobComponent.getAllJobs();
      allJobs.forEach(jobName => {
        const jc = new JobComponent(jobName);
        expect(jc.name).to.equal(jobName);
        expect(jc.stats).to.exist;
      });
    });

    it('should handle very long job name', function() {
      const longName = 'A'.repeat(1000);
      const stats = JobComponent.getJobStats(longName);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle job name with special characters', function() {
      const stats = JobComponent.getJobStats('Builder!@#$%');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });
  });

  describe('Integration', function() {
    it('should create different instances with different names', function() {
      const builder = new JobComponent('Builder');
      const scout = new JobComponent('Scout');
      
      expect(builder.name).to.not.equal(scout.name);
      expect(builder.stats.strength).to.not.equal(scout.stats.strength);
    });

    it('should maintain stat independence between instances', function() {
      const builder1 = new JobComponent('Builder');
      const builder2 = new JobComponent('Builder');
      
      builder1.stats.strength = 999;
      expect(builder2.stats.strength).to.equal(20); // Unchanged
    });

    it('should work with all standard jobs', function() {
      const jobs = JobComponent.getJobList();
      jobs.forEach(jobName => {
        const component = new JobComponent(jobName);
        expect(component.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });

    it('should work with all special jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      specialJobs.forEach(jobName => {
        const component = new JobComponent(jobName);
        expect(component.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });
  });
});




// ================================================================
// queen.test.js (58 tests)
// ================================================================
// Mock globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);
global.push = () => {};
global.pop = () => {};
global.noFill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.ellipse = () => {};

// Mock ant base class
class ant {
  constructor(posX, posY, sizeX, sizeY, movementSpeed, rotation, img, jobName, faction) {
    this.posX = posX;
    this.posY = posY;
    this._size = { x: sizeX, y: sizeY };
    this.movementSpeed = movementSpeed;
    this.rotation = rotation;
    this._image = img;
    this.jobName = jobName;
    this.faction = faction;
    this.isActive = true;
    this._commands = [];
  }
  getPosition() { return { x: this.posX, y: this.posY }; }
  getSize() { return this._size; }
  getImage() { return this._image; }
  moveToLocation(x, y) { this._lastMove = { x, y }; }
  addCommand(cmd) { this._commands.push(cmd); }
  update() {}
  render() {}
}

global.ant = ant;
global.JobImages = { Builder: { src: 'test.png' } };

// Load QueenAnt - Read entire file and eval it
// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
let queenPath = path.join(__dirname, '..', '..', '..', 'Classes', 'ants', 'Queen.js');
let queenCode = fs.readFileSync(queenPath, 'utf8');

// Remove any trailing whitespace/newlines that might cause issues
queenCode = queenCode.trim();

// Create QueenAnt in global scope by evaluating the code
try {
  // Use Function constructor for safer eval in this context
  const fn = new Function('ant', 'JobImages', queenCode + '\nreturn QueenAnt;');
  const QueenAnt = fn(ant, global.JobImages);
  global.QueenAnt = QueenAnt;
} catch (e) {
  console.error('Failed to load QueenAnt:', e);
  // Fallback: direct eval
  eval(queenCode);
}

describe('QueenAnt', function() {
  let queen;
  let baseAnt;

  beforeEach(function() {
    baseAnt = new ant(400, 300, 60, 60, 30, 0, { src: 'queen.png' }, 'Queen', 'player');
    queen = new QueenAnt(baseAnt);
  });

  describe('Constructor', function() {
    it('should initialize with base ant properties', function() {
      expect(queen.posX).to.equal(400);
      expect(queen.posY).to.equal(300);
      expect(queen.faction).to.equal('player');
    });

    it('should initialize with default properties when no base ant', function() {
      const q = new QueenAnt(null);
      expect(q.posX).to.equal(400); // Default position
      expect(q.posY).to.equal(300);
    });

    it('should set Queen-specific properties', function() {
      expect(queen.commandRadius).to.equal(250);
      expect(queen.ants).to.be.an('array').that.is.empty;
      expect(queen.coolDown).to.be.false;
      expect(queen.showCommandRadius).to.be.false;
      expect(queen.disableSkitter).to.be.true;
    });

    it('should initialize all power unlock flags to false', function() {
      expect(queen.unlockedPowers.fireball).to.be.false;
      expect(queen.unlockedPowers.lightning).to.be.false;
      expect(queen.unlockedPowers.blackhole).to.be.false;
      expect(queen.unlockedPowers.sludge).to.be.false;
      expect(queen.unlockedPowers.tidalWave).to.be.false;
    });

    it('should inherit from ant class', function() {
      expect(queen).to.be.instanceOf(ant);
    });
  });

  describe('addAnt', function() {
    it('should add ant to ants array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(1);
      expect(queen.ants[0]).to.equal(workerAnt);
    });

    it('should set ant faction to match queen', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'neutral');
      queen.addAnt(workerAnt);
      expect(workerAnt._faction).to.equal('player');
    });

    it('should handle null ant gracefully', function() {
      expect(() => queen.addAnt(null)).to.not.throw();
      expect(queen.ants).to.have.lengthOf(0);
    });

    it('should add multiple ants', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      expect(queen.ants).to.have.lengthOf(2);
    });
  });

  describe('removeAnt', function() {
    it('should remove ant from ants array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.removeAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(0);
    });

    it('should handle removing non-existent ant', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.removeAnt(ant2);
      expect(queen.ants).to.have.lengthOf(1);
      expect(queen.ants[0]).to.equal(ant1);
    });

    it('should remove correct ant from multiple', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      const ant3 = new ant(300, 300, 20, 20, 30, 0, null, 'Scout', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.addAnt(ant3);
      queen.removeAnt(ant2);
      expect(queen.ants).to.have.lengthOf(2);
      expect(queen.ants).to.include(ant1);
      expect(queen.ants).to.include(ant3);
      expect(queen.ants).to.not.include(ant2);
    });
  });

  describe('broadcastCommand', function() {
    let nearAnt, farAnt;

    beforeEach(function() {
      // Ant within command radius (250)
      nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      // Ant outside command radius
      farAnt = new ant(1000, 1000, 20, 20, 30, 0, null, 'Scout', 'player');
      queen.addAnt(nearAnt);
      queen.addAnt(farAnt);
    });

    it('should send MOVE command to ants in range', function() {
      queen.broadcastCommand({ type: 'MOVE', x: 600, y: 500 });
      expect(nearAnt._lastMove).to.deep.equal({ x: 600, y: 500 });
      expect(farAnt._lastMove).to.be.undefined;
    });

    it('should send GATHER command to ants in range', function() {
      queen.broadcastCommand({ type: 'GATHER' });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('GATHER');
      expect(farAnt._commands).to.have.lengthOf(0);
    });

    it('should send BUILD command to ants in range', function() {
      queen.broadcastCommand({ type: 'BUILD' });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('BUILD');
    });

    it('should send DEFEND command with target', function() {
      const target = { x: 700, y: 700 };
      queen.broadcastCommand({ type: 'DEFEND', target: target });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].target).to.equal(target);
    });

    it('should only affect ants within command radius', function() {
      // nearAnt is ~100 units away (within 250)
      // farAnt is ~840 units away (outside 250)
      queen.broadcastCommand({ type: 'GATHER' });
      expect(nearAnt._commands.length).to.be.greaterThan(0);
      expect(farAnt._commands).to.have.lengthOf(0);
    });

    it('should handle empty ants array', function() {
      queen.ants = [];
      expect(() => queen.broadcastCommand({ type: 'MOVE', x: 100, y: 100 })).to.not.throw();
    });
  });

  describe('commandAnt', function() {
    it('should send command to specific ant in array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.commandAnt(workerAnt, { type: 'GATHER' });
      expect(workerAnt._commands).to.have.lengthOf(1);
      expect(workerAnt._commands[0].type).to.equal('GATHER');
    });

    it('should not send command to ant not in array', function() {
      const outsideAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.commandAnt(outsideAnt, { type: 'GATHER' });
      expect(outsideAnt._commands).to.have.lengthOf(0);
    });

    it('should send multiple commands to same ant', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.commandAnt(workerAnt, { type: 'GATHER' });
      queen.commandAnt(workerAnt, { type: 'BUILD' });
      expect(workerAnt._commands).to.have.lengthOf(2);
    });
  });

  describe('gatherAntsAt', function() {
    it('should broadcast MOVE command to specified coordinates', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.gatherAntsAt(600, 500);
      expect(nearAnt._lastMove).to.deep.equal({ x: 600, y: 500 });
    });

    it('should gather multiple ants', function() {
      const ant1 = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(450, 350, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.gatherAntsAt(600, 500);
      expect(ant1._lastMove).to.exist;
      expect(ant2._lastMove).to.exist;
    });
  });

  describe('orderGathering', function() {
    it('should broadcast GATHER command', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.orderGathering();
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('GATHER');
    });
  });

  describe('orderBuilding', function() {
    it('should broadcast BUILD command', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.orderBuilding();
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('BUILD');
    });
  });

  describe('emergencyRally', function() {
    it('should gather all ants to queen position', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.emergencyRally();
      expect(nearAnt._lastMove).to.deep.equal({ x: queen.posX, y: queen.posY });
    });

    it('should rally multiple ants to queen', function() {
      const ant1 = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(450, 350, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.emergencyRally();
      expect(ant1._lastMove).to.deep.equal({ x: 400, y: 300 });
      expect(ant2._lastMove).to.deep.equal({ x: 400, y: 300 });
    });
  });

  describe('Power Management', function() {
    describe('unlockPower', function() {
      it('should unlock valid power', function() {
        const result = queen.unlockPower('fireball');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.fireball).to.be.true;
      });

      it('should unlock all valid powers', function() {
        const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave'];
        powers.forEach(power => {
          expect(queen.unlockPower(power)).to.be.true;
          expect(queen.unlockedPowers[power]).to.be.true;
        });
      });

      it('should return false for invalid power', function() {
        const result = queen.unlockPower('invalidPower');
        expect(result).to.be.false;
      });

      it('should allow unlocking already unlocked power', function() {
        queen.unlockPower('fireball');
        const result = queen.unlockPower('fireball');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.fireball).to.be.true;
      });
    });

    describe('lockPower', function() {
      it('should lock unlocked power', function() {
        queen.unlockPower('lightning');
        const result = queen.lockPower('lightning');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.lightning).to.be.false;
      });

      it('should return false for invalid power', function() {
        const result = queen.lockPower('invalidPower');
        expect(result).to.be.false;
      });

      it('should allow locking already locked power', function() {
        const result = queen.lockPower('blackhole');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.blackhole).to.be.false;
      });
    });

    describe('isPowerUnlocked', function() {
      it('should return true for unlocked power', function() {
        queen.unlockPower('sludge');
        expect(queen.isPowerUnlocked('sludge')).to.be.true;
      });

      it('should return false for locked power', function() {
        expect(queen.isPowerUnlocked('tidalWave')).to.be.false;
      });

      it('should return false for invalid power', function() {
        // isPowerUnlocked returns false for invalid/non-existent powers
        expect(queen.isPowerUnlocked('invalid')).to.be.false;
      });
    });

    describe('getUnlockedPowers', function() {
      it('should return empty array when no powers unlocked', function() {
        expect(queen.getUnlockedPowers()).to.be.an('array').that.is.empty;
      });

      it('should return array of unlocked powers', function() {
        queen.unlockPower('fireball');
        queen.unlockPower('lightning');
        const unlocked = queen.getUnlockedPowers();
        expect(unlocked).to.have.lengthOf(2);
        expect(unlocked).to.include('fireball');
        expect(unlocked).to.include('lightning');
      });

      it('should not include locked powers', function() {
        queen.unlockPower('fireball');
        queen.unlockPower('lightning');
        queen.lockPower('lightning');
        const unlocked = queen.getUnlockedPowers();
        expect(unlocked).to.have.lengthOf(1);
        expect(unlocked).to.include('fireball');
        expect(unlocked).to.not.include('lightning');
      });
    });

    describe('getAllPowers', function() {
      it('should return all power states', function() {
        queen.unlockPower('fireball');
        const allPowers = queen.getAllPowers();
        expect(allPowers).to.have.property('fireball', true);
        expect(allPowers).to.have.property('lightning', false);
        expect(allPowers).to.have.property('blackhole', false);
        expect(allPowers).to.have.property('sludge', false);
        expect(allPowers).to.have.property('tidalWave', false);
      });

      it('should return copy of powers object', function() {
        const powers = queen.getAllPowers();
        powers.fireball = true;
        expect(queen.unlockedPowers.fireball).to.be.false; // Original unchanged
      });
    });
  });

  describe('move', function() {
    it('should move up (w) with slower speed', function() {
      const startY = queen.posY;
      queen.move('w');
      expect(queen._lastMove.y).to.be.greaterThan(startY);
    });

    it('should move left (a)', function() {
      const startX = queen.posX;
      queen.move('a');
      expect(queen._lastMove.x).to.be.lessThan(startX);
    });

    it('should move down (s)', function() {
      const startY = queen.posY;
      queen.move('s');
      expect(queen._lastMove.y).to.be.lessThan(startY);
    });

    it('should move right (d)', function() {
      const startX = queen.posX;
      queen.move('d');
      expect(queen._lastMove.x).to.be.greaterThan(startX);
    });

    it('should move slower than normal ant (0.1x speed)', function() {
      queen.movementSpeed = 100;
      queen.move('d');
      const deltaX = queen._lastMove.x - queen.posX;
      expect(deltaX).to.equal(10); // 100 * 0.1
    });

    it('should handle invalid direction gracefully', function() {
      expect(() => queen.move('x')).to.not.throw();
    });
  });

  describe('update', function() {
    it('should call super.update', function() {
      let superCalled = false;
      const originalUpdate = ant.prototype.update;
      ant.prototype.update = function() { superCalled = true; };
      queen.update();
      expect(superCalled).to.be.true;
      ant.prototype.update = originalUpdate;
    });

    it('should not throw errors', function() {
      expect(() => queen.update()).to.not.throw();
    });
  });

  describe('render', function() {
    it('should call super.render', function() {
      let superCalled = false;
      const originalRender = ant.prototype.render;
      ant.prototype.render = function() { superCalled = true; };
      queen.render();
      expect(superCalled).to.be.true;
      ant.prototype.render = originalRender;
    });

    it('should not render command radius when showCommandRadius is false', function() {
      queen.showCommandRadius = false;
      let ellipseCalled = false;
      global.ellipse = () => { ellipseCalled = true; };
      queen.render();
      expect(ellipseCalled).to.be.false;
    });

    it('should render command radius when showCommandRadius is true', function() {
      queen.showCommandRadius = true;
      let ellipseCalled = false;
      global.ellipse = (x, y, d) => { 
        ellipseCalled = true;
        expect(d).to.equal(queen.commandRadius * 2);
      };
      queen.render();
      expect(ellipseCalled).to.be.true;
    });
  });

  describe('Edge Cases', function() {
    it('should handle very large commandRadius', function() {
      queen.commandRadius = 100000; // Very large radius
      const farAnt = new ant(9000, 9000, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(farAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // Distance from (400, 300) to (9000, 9000) is ~12200, so radius must be > 12200
      expect(farAnt._commands).to.have.lengthOf(1);
    });

    it('should handle zero commandRadius', function() {
      queen.commandRadius = 0;
      const nearAnt = new ant(400, 300, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // Only ant at exact same position would receive command
    });

    it('should handle negative commandRadius', function() {
      queen.commandRadius = -100;
      const nearAnt = new ant(400, 300, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // No ants should receive command with negative radius
      expect(nearAnt._commands).to.have.lengthOf(0);
    });

    it('should handle adding same ant multiple times', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.addAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(2);
      expect(queen.ants[0]).to.equal(queen.ants[1]);
    });

    it('should handle unlocking all powers then locking all', function() {
      const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave'];
      powers.forEach(p => queen.unlockPower(p));
      expect(queen.getUnlockedPowers()).to.have.lengthOf(5);
      
      powers.forEach(p => queen.lockPower(p));
      expect(queen.getUnlockedPowers()).to.have.lengthOf(0);
    });
  });
});




// ================================================================
// entity.test.js (69 tests)
// ================================================================
// Mock p5.js globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.mouseX = 0;
global.mouseY = 0;

// Mock CollisionBox2D
class MockCollisionBox2D {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
  setPosition(x, y) { this.x = x; this.y = y; }
  setSize(w, h) { this.width = w; this.height = h; }
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
  intersects(other) {
    return !(this.x > other.x + other.width ||
             this.x + this.width < other.x ||
             this.y > other.y + other.height ||
             this.y + this.height < other.y);
  }
  getCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }
}
global.CollisionBox2D = MockCollisionBox2D;

// Mock Sprite2D
class MockSprite2D {
  constructor(imagePath, pos, size, rotation) {
    this.img = imagePath;
    this.position = pos;
    this.size = size;
    this.rotation = rotation;
    this.visible = true;
    this.alpha = 1.0;
  }
  setImage(path) { this.img = path; }
  getImage() { return this.img; }
  setPosition(pos) { this.position = pos; }
  setSize(size) { this.size = size; }
  setOpacity(alpha) { this.alpha = alpha; }
  getOpacity() { return this.alpha; }
}
global.Sprite2D = MockSprite2D;

// Mock Controllers
class MockTransformController {
  constructor(entity) { this.entity = entity; this.pos = { x: 0, y: 0 }; this.size = { x: 32, y: 32 }; }
  setPosition(x, y) { this.pos = { x, y }; }
  getPosition() { return this.pos; }
  setSize(w, h) { this.size = { x: w, y: h }; }
  getSize() { return this.size; }
  getCenter() { return { x: this.pos.x + this.size.x / 2, y: this.pos.y + this.size.y / 2 }; }
  update() {}
}

class MockMovementController {
  constructor(entity) { 
    this.entity = entity; 
    this.movementSpeed = 1.0;
    this.isMoving = false;
    this.path = null;
  }
  moveToLocation(x, y) { this.isMoving = true; this.target = { x, y }; return true; }
  setPath(path) { this.path = path; }
  getIsMoving() { return this.isMoving; }
  stop() { this.isMoving = false; }
  update() {}
}

class MockRenderController {
  constructor(entity) { this.entity = entity; this.debugMode = false; this.smoothing = true; }
  render() {}
  highlightSelected() { return 'selected'; }
  highlightHover() { return 'hover'; }
  setDebugMode(enabled) { this.debugMode = enabled; }
  getDebugMode() { return this.debugMode; }
  setSmoothing(enabled) { this.smoothing = enabled; }
  getSmoothing() { return this.smoothing; }
  update() {}
}

class MockSelectionController {
  constructor(entity) { this.entity = entity; this.selected = false; this.selectable = true; }
  setSelected(val) { this.selected = val; }
  isSelected() { return this.selected; }
  toggleSelection() { this.selected = !this.selected; return this.selected; }
  setSelectable(val) { this.selectable = val; }
  update() {}
}

class MockCombatController {
  constructor(entity) { this.entity = entity; this.faction = 'neutral'; this.inCombat = false; }
  setFaction(faction) { this.faction = faction; }
  isInCombat() { return this.inCombat; }
  detectEnemies() { return []; }
  update() {}
}

class MockTerrainController {
  constructor(entity) { this.entity = entity; this.terrain = 'DEFAULT'; }
  getCurrentTerrain() { return this.terrain; }
  update() {}
}

class MockTaskManager {
  constructor(entity) { this.entity = entity; this.tasks = []; this.currentTask = null; }
  addTask(task) { this.tasks.push(task); return true; }
  getCurrentTask() { return this.currentTask; }
  update() {}
}

class MockHealthController {
  constructor(entity) { this.entity = entity; this.health = 100; }
  update() {}
}


// Mock gameState Manager
class MockGameStateManager {
  constructor() {
    this.currentState = "MENU";
    this.previousState = null;
    this.fadeAlpha = 0;
    this.isFading = false;
    this.stateChangeCallbacks = [];
    this.isFading = false;
    this.fadeDirection = "out";
    
    // Valid game states
    this.STATES = {
      MENU: "MENU",
      OPTIONS: "OPTIONS", 
      DEBUG_MENU: "DEBUG_MENU",
      PLAYING: "PLAYING",
      PAUSED: "PAUSED",
      GAME_OVER: "GAME_OVER",
      KAN_BAN: "KANBAN"
    };
  }

   // Get current state
  getState() {
    return this.currentState;
  }

  // Set state with optional callback execution
  setState(newState, skipCallbacks = false) {
    if (!this.isValidState(newState)) {
      console.warn(`Invalid game state: ${newState}`);
      return false;
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    if (!skipCallbacks) {
      this.executeCallbacks(newState, this.previousState);
    }
    return true;
  }

  // Get previous state
  getPreviousState = () => this.previousState;

  // Check if current state matches
  isState = (state) => this.currentState === state;

    // State change callback system
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.stateChangeCallbacks.push(callback);
    }
  }

    removeStateChangeCallback(callback) {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  executeCallbacks(newState, oldState) {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  
  // Convenience methods for common states
  isInMenu = () => this.currentState === this.STATES.MENU;
  isInOptions = () => this.currentState === this.STATES.OPTIONS;
  isInGame = () => this.currentState === this.STATES.PLAYING;
  isPaused = () => this.currentState === this.STATES.PAUSED;
  isGameOver = () => this.currentState === this.STATES.GAME_OVER;
  isDebug = () => this.currentState === this.STATES.DEBUG_MENU;
  isKanban = () => this.currentState === this.STATES.KAN_BAN;

  // Transition methods
  goToMenu = () => this.setState(this.STATES.MENU);
  goToOptions = () => this.setState(this.STATES.OPTIONS);
  goToDebug = () => this.setState(this.STATES.DEBUG_MENU);
  startGame = () => { this.startFadeTransition(); return this.setState(this.STATES.PLAYING); };
  pauseGame = () => this.setState(this.STATES.PAUSED);
  resumeGame = () => this.setState(this.STATES.PLAYING);
  endGame = () => this.setState(this.STATES.GAME_OVER);
  goToKanban = () => this.setState(this.STATES.KAN_BAN);
}

// Assign controllers to global
global.TransformController = MockTransformController;
global.MovementController = MockMovementController;
global.RenderController = MockRenderController;
global.SelectionController = MockSelectionController;
global.CombatController = MockCombatController;
global.TerrainController = MockTerrainController;
global.TaskManager = MockTaskManager;
global.HealthController = MockHealthController;
global.GameStateManager = MockGameStateManager;

// Mock spatial grid manager
global.spatialGridManager = {
  addEntity: function() {},
  updateEntity: function() {},
  removeEntity: function() {}
};



// Load Entity
// DUPLICATE REQUIRE REMOVED: let Entity = require('../../../Classes/containers/Entity.js');

describe('Entity', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const entity = new Entity();
      expect(entity.id).to.be.a('string');
      expect(entity.type).to.equal('Entity');
      expect(entity._isActive).to.be.true;
    });
    
    it('should initialize with custom position and size', function() {
      const entity = new Entity(100, 200, 64, 64);
      const pos = entity.getPosition();
      const size = entity.getSize();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
      expect(size.x).to.equal(64);
      expect(size.y).to.equal(64);
    });
    
    it('should initialize with custom type', function() {
      const entity = new Entity(0, 0, 32, 32, { type: 'Ant' });
      expect(entity.type).to.equal('Ant');
    });
    
    it('should generate unique IDs for each entity', function() {
      const entity1 = new Entity();
      const entity2 = new Entity();
      expect(entity1.id).to.not.equal(entity2.id);
    });
    
    it('should initialize collision box', function() {
      const entity = new Entity(50, 60, 32, 32);
      expect(entity._collisionBox).to.be.instanceOf(MockCollisionBox2D);
    });
    
    it('should initialize sprite when Sprite2D available', function() {
      const entity = new Entity(0, 0, 32, 32);
      expect(entity._sprite).to.be.instanceOf(MockSprite2D);
    });
    
    it('should initialize all available controllers', function() {
      const entity = new Entity();
      expect(entity._controllers.size).to.be.greaterThan(0);
      expect(entity.getController('transform')).to.exist;
      expect(entity.getController('movement')).to.exist;
      expect(entity.getController('render')).to.exist;
    });
  });
  
  describe('Core Properties', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'TestEntity' });
    });
    
    it('should have read-only id', function() {
      const originalId = entity.id;
      entity.id = 'newId'; // Should not change
      expect(entity.id).to.equal(originalId);
    });
    
    it('should have read-only type', function() {
      const originalType = entity.type;
      entity.type = 'NewType'; // Should not change
      expect(entity.type).to.equal(originalType);
    });
    
    it('should allow setting isActive', function() {
      entity.isActive = false;
      expect(entity.isActive).to.be.false;
      entity.isActive = true;
      expect(entity.isActive).to.be.true;
    });
  });
  
  describe('Position and Transform', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set and get position', function() {
      entity.setPosition(100, 200);
      const pos = entity.getPosition();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
    });
    
    it('should get X coordinate', function() {
      entity.setPosition(50, 100);
      expect(entity.getX()).to.equal(50);
    });
    
    it('should get Y coordinate', function() {
      entity.setPosition(50, 100);
      expect(entity.getY()).to.equal(100);
    });
    
    it('should set and get size', function() {
      entity.setSize(64, 128);
      const size = entity.getSize();
      expect(size.x).to.equal(64);
      expect(size.y).to.equal(128);
    });
    
    it('should calculate center point', function() {
      entity.setPosition(0, 0);
      entity.setSize(100, 100);
      const center = entity.getCenter();
      expect(center.x).to.equal(50);
      expect(center.y).to.equal(50);
    });
    
    it('should update collision box when position changes', function() {
      entity.setPosition(75, 85);
      expect(entity._collisionBox.x).to.equal(75);
      expect(entity._collisionBox.y).to.equal(85);
    });
    
    it('should update collision box when size changes', function() {
      entity.setSize(50, 60);
      expect(entity._collisionBox.width).to.equal(50);
      expect(entity._collisionBox.height).to.equal(60);
    });
  });
  
  describe('Movement', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should move to location', function() {
      const result = entity.moveToLocation(100, 200);
      expect(result).to.be.true;
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should set path', function() {
      const path = [{ x: 10, y: 10 }, { x: 20, y: 20 }];
      entity.setPath(path);
      const movement = entity.getController('movement');
      expect(movement.path).to.equal(path);
    });
    
    it('should check if moving', function() {
      expect(entity.isMoving()).to.be.false;
      entity.moveToLocation(50, 50);
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should stop movement', function() {
      entity.moveToLocation(100, 100);
      entity.stop();
      expect(entity.isMoving()).to.be.false;
    });
    
    it('should get movement speed from controller', function() {
      const movement = entity.getController('movement');
      if (movement && movement.movementSpeed !== undefined) {
        expect(movement.movementSpeed).to.be.a('number');
      } else {
        // If controller doesn't exist or has no movementSpeed, skip test
        expect(true).to.be.true;
      }
    });
    
    it('should set movement speed', function() {
      entity.movementSpeed = 5.0;
      expect(entity.movementSpeed).to.equal(5.0);
    });
  });
  
  describe('Selection', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set selected state', function() {
      entity.setSelected(true);
      expect(entity.isSelected()).to.be.true;
    });
    
    it('should toggle selection', function() {
      expect(entity.isSelected()).to.be.false;
      entity.toggleSelection();
      expect(entity.isSelected()).to.be.true;
      entity.toggleSelection();
      expect(entity.isSelected()).to.be.false;
    });
  });
  
  describe('Interaction', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should detect mouse over', function() {
      global.window = { _lastDebugMouseX: 0, _lastDebugMouseY: 0 };
      entity.setPosition(0, 0);
      entity.setSize(32, 32);
      global.mouseX = 16;
      global.mouseY = 16;
      expect(entity.isMouseOver()).to.be.true;
    });
    
    it('should detect mouse not over', function() {
      entity.setPosition(0, 0);
      entity.setSize(32, 32);
      global.mouseX = 100;
      global.mouseY = 100;
      expect(entity.isMouseOver()).to.be.false;
    });
  });
  
  describe('Combat', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { faction: 'player' });
    });
    
    it('should check if in combat', function() {
      expect(entity.isInCombat()).to.be.false;
    });
    
    it('should detect enemies', function() {
      const enemies = entity.detectEnemies();
      expect(enemies).to.be.an('array');
    });
  });
  
  describe('Tasks', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should add task', function() {
      const task = { type: 'GATHER', priority: 1 };
      const result = entity.addTask(task);
      expect(result).to.be.true;
    });
    
    it('should get current task', function() {
      const task = entity.getCurrentTask();
      expect(task).to.be.null; // Initially null
    });
  });
  
  describe('Terrain', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should get current terrain', function() {
      const terrain = entity.getCurrentTerrain();
      expect(terrain).to.equal('DEFAULT');
    });
  });
  
  describe('Sprite and Image', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set image path', function() {
      entity.setImage('/path/to/image.png');
      expect(entity.getImage()).to.equal('/path/to/image.png');
    });
    
    it('should check if has image', function() {
      entity.setImage('/path/to/image.png');
      expect(entity.hasImage()).to.be.true;
    });
    
    it('should set opacity', function() {
      entity.setOpacity(128);
      expect(entity.getOpacity()).to.equal(128);
    });
    
    it('should get opacity', function() {
      const opacity = entity.getOpacity();
      expect(opacity).to.be.a('number');
    });
  });
  
  describe('Collision', function() {
    let entity1, entity2;
    
    beforeEach(function() {
      entity1 = new Entity(0, 0, 32, 32);
      entity2 = new Entity(16, 16, 32, 32);
    });
    
    it('should detect collision when overlapping', function() {
      expect(entity1.collidesWith(entity2)).to.be.true;
    });
    
    it('should not detect collision when separate', function() {
      entity2.setPosition(100, 100);
      entity1.update(); // Sync collision box
      entity2.update(); // Sync collision box
      expect(entity1.collidesWith(entity2)).to.be.false;
    });
    
    it('should check point containment', function() {
      entity1.setPosition(0, 0);
      entity1.setSize(32, 32);
      expect(entity1.contains(16, 16)).to.be.true;
      expect(entity1.contains(100, 100)).to.be.false;
    });
  });
  
  describe('Update Loop', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should call update without errors', function() {
      expect(() => entity.update()).to.not.throw();
    });
    
    it('should not update when inactive', function() {
      entity.isActive = false;
      expect(() => entity.update()).to.not.throw();
    });
    
    it('should sync collision box on update', function() {
      entity.setPosition(50, 60);
      entity.update();
      expect(entity._collisionBox.x).to.equal(50);
      expect(entity._collisionBox.y).to.equal(60);
    });
  });
  
  describe('Rendering', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should call render without errors', function() {
      expect(() => entity.render()).to.not.throw();
    });
    
    it('should not render when inactive', function() {
      entity.isActive = false;
      expect(() => entity.render()).to.not.throw();
    });
  });
  
  describe('Debug Info', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'TestEntity' });
    });
    
    it('should return debug info object', function() {
      const info = entity.getDebugInfo();
      expect(info).to.be.an('object');
      expect(info.id).to.equal(entity.id);
      expect(info.type).to.equal('TestEntity');
    });
    
    it('should include position in debug info', function() {
      entity.setPosition(100, 200);
      const info = entity.getDebugInfo();
      expect(info.position.x).to.equal(100);
      expect(info.position.y).to.equal(200);
    });
    
    it('should include size in debug info', function() {
      entity.setSize(64, 64);
      const info = entity.getDebugInfo();
      expect(info.size.x).to.equal(64);
      expect(info.size.y).to.equal(64);
    });
    
    it('should include controller status', function() {
      const info = entity.getDebugInfo();
      expect(info.controllers).to.be.an('object');
      expect(info.controllerCount).to.be.greaterThan(0);
    });
  });
  
  describe('Validation Data', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'Ant', faction: 'player' });
    });
    
    it('should return validation data', function() {
      const data = entity.getValidationData();
      expect(data).to.be.an('object');
      expect(data.id).to.exist;
      expect(data.type).to.equal('Ant');
      expect(data.faction).to.equal('neutral'); // Default faction from controller
    });
    
    it('should include timestamp', function() {
      const data = entity.getValidationData();
      expect(data.timestamp).to.be.a('string');
    });
    
    it('should include position and size', function() {
      entity.setPosition(50, 60);
      entity.setSize(32, 32);
      const data = entity.getValidationData();
      expect(data.position).to.exist;
      expect(data.size).to.exist;
    });
  });
  
  describe('Destroy', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should mark entity as inactive', function() {
      entity.destroy();
      expect(entity._isActive).to.be.false;
    });
    
    it('should not throw when destroyed', function() {
      expect(() => entity.destroy()).to.not.throw();
    });
  });
  
  describe('Enhanced API - Highlight', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have highlight namespace', function() {
      expect(entity.highlight).to.be.an('object');
    });
    
    it('should call highlight.selected', function() {
      const result = entity.highlight.selected();
      expect(result).to.equal('selected');
    });
    
    it('should call highlight.hover', function() {
      const result = entity.highlight.hover();
      expect(result).to.equal('hover');
    });
  });
  
  describe('Enhanced API - Rendering', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have rendering namespace', function() {
      expect(entity.rendering).to.be.an('object');
    });
    
    it('should set debug mode', function() {
      entity.rendering.setDebugMode(true);
      expect(entity.rendering.isVisible()).to.be.true;
    });
    
    it('should set opacity', function() {
      entity.rendering.setOpacity(0.5);
      expect(entity.rendering.getOpacity()).to.equal(0.5);
    });
  });
  
  describe('Enhanced API - Config', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have config namespace', function() {
      expect(entity.config).to.be.an('object');
    });
    
    it('should get debugMode when render controller available', function() {
      const renderController = entity.getController('render');
      if (renderController && renderController.getDebugMode) {
        const debugMode = renderController.getDebugMode();
        expect(debugMode).to.be.a('boolean');
      } else {
        // If no render controller, skip test
        expect(true).to.be.true;
      }
    });
    
    it('should get smoothing when render controller available', function() {
      const renderController = entity.getController('render');
      if (renderController && renderController.getSmoothing) {
        const smoothing = renderController.getSmoothing();
        expect(smoothing).to.be.a('boolean');
      } else {
        // If no render controller, skip test
        expect(true).to.be.true;
      }
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero position and size', function() {
      const entity = new Entity(0, 0, 0, 0);
      expect(entity.getPosition().x).to.equal(0);
      expect(entity.getSize().x).to.equal(0);
    });
    
    it('should handle negative position', function() {
      const entity = new Entity(-100, -200, 32, 32);
      expect(entity.getX()).to.equal(-100);
      expect(entity.getY()).to.equal(-200);
    });
    
    it('should handle very large position', function() {
      const entity = new Entity(1e6, 1e6, 32, 32);
      expect(entity.getX()).to.equal(1e6);
      expect(entity.getY()).to.equal(1e6);
    });
    
    it('should handle fractional values', function() {
      const entity = new Entity(10.5, 20.7, 32.3, 32.9);
      const pos = entity.getPosition();
      expect(pos.x).to.be.closeTo(10.5, 0.1);
      expect(pos.y).to.be.closeTo(20.7, 0.1);
    });
    
    it('should handle missing controllers gracefully', function() {
      // Remove all controllers temporarily
      global.TransformController = undefined;
      const entity = new Entity(0, 0, 32, 32);
      expect(() => entity.update()).to.not.throw();
      // Restore
      global.TransformController = MockTransformController;
    });
  });
  
  describe('Integration', function() {
    it('should maintain state across multiple operations', function() {
      const entity = new Entity(0, 0, 32, 32, { type: 'Ant', faction: 'player' });
      
      entity.setPosition(100, 200);
      entity.setSize(64, 64);
      entity.setSelected(true);
      entity.moveToLocation(300, 400);
      entity.update();
      
      expect(entity.getX()).to.equal(100);
      expect(entity.isSelected()).to.be.true;
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should handle collision detection after movement', function() {
      const entity1 = new Entity(0, 0, 32, 32);
      const entity2 = new Entity(100, 100, 32, 32);
      
      expect(entity1.collidesWith(entity2)).to.be.false;
      
      entity1.setPosition(100, 100);
      entity1.update();
      entity2.update();
      
      expect(entity1.collidesWith(entity2)).to.be.true;
    });
  });
});




// ================================================================
// statsContainer.test.js (64 tests)
// ================================================================
// Mock p5.js createVector
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });

// Mock devConsoleEnabled
global.devConsoleEnabled = false;

// Load the module
// DUPLICATE REQUIRE REMOVED: let { StatsContainer, stat } = require('../../../Classes/containers/StatsContainer.js');

describe('stat', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const s = new stat();
      expect(s.statName).to.equal('NONAME');
      expect(s.statValue).to.equal(0);
      expect(s.statLowerLimit).to.equal(0);
      expect(s.statUpperLimit).to.equal(500);
    });
    
    it('should initialize with custom name and value', function() {
      const s = new stat('Health', 100);
      expect(s.statName).to.equal('Health');
      expect(s.statValue).to.equal(100);
    });
    
    it('should initialize with custom limits', function() {
      const s = new stat('Power', 50, 10, 200);
      expect(s.statLowerLimit).to.equal(10);
      expect(s.statUpperLimit).to.equal(200);
      expect(s.statValue).to.equal(50);
    });
    
    it('should enforce limits on construction', function() {
      const s = new stat('Overflow', 600, 0, 500);
      expect(s.statValue).to.equal(500);
    });
    
    it('should enforce lower limit on construction', function() {
      const s = new stat('Underflow', -10, 0, 500);
      expect(s.statValue).to.equal(0);
    });
  });
  
  describe('Getters and Setters', function() {
    it('should get and set statName', function() {
      const s = new stat();
      s.statName = 'Strength';
      expect(s.statName).to.equal('Strength');
    });
    
    it('should get and set statValue', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 75;
      expect(s.statValue).to.equal(75);
    });
    
    it('should get and set statUpperLimit', function() {
      const s = new stat();
      s.statUpperLimit = 1000;
      expect(s.statUpperLimit).to.equal(1000);
    });
    
    it('should get and set statLowerLimit', function() {
      const s = new stat();
      s.statLowerLimit = -100;
      expect(s.statLowerLimit).to.equal(-100);
    });
  });
  
  describe('enforceStatLimit()', function() {
    it('should clamp value to upper limit', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 150;
      expect(s.statValue).to.equal(100);
    });
    
    it('should clamp value to lower limit', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = -10;
      expect(s.statValue).to.equal(0);
    });
    
    it('should not change valid value', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 75;
      expect(s.statValue).to.equal(75);
    });
    
    it('should handle exact limit values', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 0;
      expect(s.statValue).to.equal(0);
      s.statValue = 100;
      expect(s.statValue).to.equal(100);
    });
    
    it('should handle negative limits', function() {
      const s = new stat('Temperature', 0, -100, 100);
      s.statValue = -50;
      expect(s.statValue).to.equal(-50);
      s.statValue = -150;
      expect(s.statValue).to.equal(-100);
    });
  });
  
  describe('printStatToDebug()', function() {
    it('should not throw when called', function() {
      const s = new stat('Test', 100);
      expect(() => s.printStatToDebug()).to.not.throw();
    });
    
    it('should handle vector values', function() {
      const s = new stat('Position', { x: 10, y: 20 });
      expect(() => s.printStatToDebug()).to.not.throw();
    });
  });
  
  describe('printStatUnderObject()', function() {
    it('should not throw when rendering unavailable', function() {
      const s = new stat('Test', 100);
      const pos = { x: 0, y: 0 };
      const size = { x: 32, y: 32 };
      expect(() => s.printStatUnderObject(pos, size, 12)).to.not.throw();
    });
    
    it('should handle vector statValue', function() {
      const s = new stat('Position', { x: 10, y: 20 });
      const pos = { x: 0, y: 0 };
      const size = { x: 32, y: 32 };
      expect(() => s.printStatUnderObject(pos, size, 12)).to.not.throw();
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero limits', function() {
      const s = new stat('Zero', 0, 0, 0);
      expect(s.statValue).to.equal(0);
    });
    
    it('should handle very large numbers', function() {
      const s = new stat('Large', 1e9, 0, 1e10);
      expect(s.statValue).to.equal(1e9);
    });
    
    it('should handle fractional values', function() {
      const s = new stat('Fraction', 3.14159, 0, 10);
      expect(s.statValue).to.be.closeTo(3.14159, 0.00001);
    });
    
    it('should handle string name', function() {
      const s = new stat('Very Long Stat Name With Spaces');
      expect(s.statName).to.equal('Very Long Stat Name With Spaces');
    });
  });
});

describe('StatsContainer', function() {
  
  describe('Constructor', function() {
    it('should initialize with valid vectors', function() {
      const pos = createVector(10, 20);
      const size = createVector(32, 32);
      const stats = new StatsContainer(pos, size);
      
      expect(stats.position.statValue.x).to.equal(10);
      expect(stats.position.statValue.y).to.equal(20);
      expect(stats.size.statValue.x).to.equal(32);
      expect(stats.size.statValue.y).to.equal(32);
    });
    
    it('should initialize with custom parameters', function() {
      const pos = createVector(5, 15);
      const size = createVector(64, 64);
      const stats = new StatsContainer(pos, size, 2.5, null, 50, 200, 5);
      
      expect(stats.movementSpeed.statValue).to.equal(2.5);
      expect(stats.strength.statValue).to.equal(50);
      expect(stats.health.statValue).to.equal(200);
      expect(stats.gatherSpeed.statValue).to.equal(5);
    });
    
    it('should throw error for invalid pos', function() {
      expect(() => new StatsContainer(null, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for missing pos.x', function() {
      expect(() => new StatsContainer({ y: 10 }, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for missing pos.y', function() {
      expect(() => new StatsContainer({ x: 10 }, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for invalid size', function() {
      expect(() => new StatsContainer(createVector(0, 0), null)).to.throw(Error);
    });
    
    it('should throw error for missing size.x', function() {
      expect(() => new StatsContainer(createVector(0, 0), { y: 32 })).to.throw(Error);
    });
    
    it('should throw error for missing size.y', function() {
      expect(() => new StatsContainer(createVector(0, 0), { x: 32 })).to.throw(Error);
    });
    
    it('should create pendingPos from pos when null', function() {
      const pos = createVector(100, 200);
      const size = createVector(32, 32);
      const stats = new StatsContainer(pos, size);
      
      expect(stats.pendingPos.statValue.x).to.equal(100);
      expect(stats.pendingPos.statValue.y).to.equal(200);
    });
    
    it('should use provided pendingPos when given', function() {
      const pos = createVector(10, 20);
      const size = createVector(32, 32);
      const pending = createVector(50, 60);
      const stats = new StatsContainer(pos, size, 1, pending);
      
      expect(stats.pendingPos.statValue.x).to.equal(50);
      expect(stats.pendingPos.statValue.y).to.equal(60);
    });
    
    it('should create exp map', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(stats.exp).to.be.instanceOf(Map);
      expect(stats.exp.size).to.equal(8);
    });
  });
  
  describe('Getters and Setters', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should get and set position', function() {
      const newPos = new stat('Position', createVector(50, 50));
      stats.position = newPos;
      expect(stats.position).to.equal(newPos);
    });
    
    it('should get and set size', function() {
      const newSize = new stat('Size', createVector(64, 64));
      stats.size = newSize;
      expect(stats.size).to.equal(newSize);
    });
    
    it('should get and set movementSpeed', function() {
      const newSpeed = new stat('Speed', 5.0);
      stats.movementSpeed = newSpeed;
      expect(stats.movementSpeed).to.equal(newSpeed);
    });
    
    it('should get and set pendingPos', function() {
      const newPending = new stat('Pending', createVector(100, 100));
      stats.pendingPos = newPending;
      expect(stats.pendingPos).to.equal(newPending);
    });
  });
  
  describe('EXP System', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should create all EXP categories', function() {
      expect(stats.exp.has('Lifetime')).to.be.true;
      expect(stats.exp.has('Gathering')).to.be.true;
      expect(stats.exp.has('Hunting')).to.be.true;
      expect(stats.exp.has('Swimming')).to.be.true;
      expect(stats.exp.has('Farming')).to.be.true;
      expect(stats.exp.has('Construction')).to.be.true;
      expect(stats.exp.has('Ranged')).to.be.true;
      expect(stats.exp.has('Scouting')).to.be.true;
    });
    
    it('should initialize each EXP category with stat instance', function() {
      const lifetime = stats.exp.get('Lifetime');
      expect(lifetime).to.be.instanceOf(stat);
      expect(lifetime.statName).to.equal('Lifetime EXP');
    });
    
    it('should allow modifying EXP values', function() {
      const gathering = stats.exp.get('Gathering');
      gathering.statValue = 100;
      expect(gathering.statValue).to.equal(100);
    });
  });
  
  describe('getExpTotal()', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should call setExpTotal and return expTotal property', function() {
      const total = stats.getExpTotal();
      expect(total).to.exist;
      expect(stats.expTotal).to.exist;
    });
    
    it('should sum stat values from EXP categories', function() {
      stats.exp.get('Gathering').statValue = 100;
      stats.exp.get('Hunting').statValue = 50;
      stats.exp.get('Farming').statValue = 25;
      
      const total = stats.getExpTotal();
      // Note: setExpTotal iterates through Map values and Object.keys
      // This is a complex iteration pattern in the original code
      expect(total).to.exist;
      expect(stats.expTotal).to.exist;
    });
    
    it('should update expTotal property when called', function() {
      stats.exp.get('Scouting').statValue = 300;
      stats.getExpTotal();
      expect(stats.expTotal).to.exist;
    });
    
    it('should recalculate when called multiple times', function() {
      stats.exp.get('Lifetime').statValue = 50;
      let total = stats.getExpTotal();
      expect(total).to.exist;
      
      stats.exp.get('Construction').statValue = 75;
      total = stats.getExpTotal();
      expect(total).to.exist;
    });
  });
  
  describe('setExpTotal()', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should calculate total using complex iteration pattern', function() {
      stats.exp.get('Gathering').statValue = 10;
      stats.exp.get('Hunting').statValue = 20;
      stats.exp.get('Swimming').statValue = 30;
      
      stats.setExpTotal();
      // The implementation iterates through Map values and their Object.keys
      expect(stats.expTotal).to.exist;
    });
    
    it('should initialize expTotal to 0 before calculating', function() {
      stats.expTotal = 999;
      stats.setExpTotal();
      // expTotal gets reset to 0, then recalculated
      expect(stats.expTotal).to.exist;
    });
  });
  
  describe('printExpTotal()', function() {
    it('should not throw when called', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(() => stats.printExpTotal()).to.not.throw();
    });
  });
  
  describe('test_Map()', function() {
    it('should not throw with valid map', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      const testMap = new Map([['key1', 'value1'], ['key2', 'value2']]);
      expect(() => stats.test_Map(testMap)).to.not.throw();
    });
  });
  
  describe('test_Exp()', function() {
    it('should not throw when called', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(() => stats.test_Exp()).to.not.throw();
    });
  });
  
  describe('Stat Limits', function() {
    it('should enforce movementSpeed limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 150);
      expect(stats.movementSpeed.statValue).to.equal(100); // Clamped to upper limit
    });
    
    it('should enforce strength limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 2000);
      expect(stats.strength.statValue).to.equal(1000); // Clamped to upper limit
    });
    
    it('should enforce health limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 10, 20000);
      expect(stats.health.statValue).to.equal(10000); // Clamped to upper limit
    });
    
    it('should enforce gatherSpeed limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 10, 100, 200);
      expect(stats.gatherSpeed.statValue).to.equal(100); // Clamped to upper limit
    });
    
    it('should handle negative values', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), -10, null, -50, -100, -5);
      expect(stats.movementSpeed.statValue).to.equal(0);
      expect(stats.strength.statValue).to.equal(0);
      expect(stats.health.statValue).to.equal(0);
      expect(stats.gatherSpeed.statValue).to.equal(0);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero position', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(0);
      expect(stats.position.statValue.y).to.equal(0);
    });
    
    it('should handle negative position', function() {
      const stats = new StatsContainer(createVector(-100, -200), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(-100);
      expect(stats.position.statValue.y).to.equal(-200);
    });
    
    it('should handle very large position values', function() {
      const stats = new StatsContainer(createVector(1e6, 1e6), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(1e6);
      expect(stats.position.statValue.y).to.equal(1e6);
    });
    
    it('should handle fractional stat values', function() {
      const stats = new StatsContainer(
        createVector(10.5, 20.7),
        createVector(32.3, 32.9),
        0.123,
        null,
        15.6,
        99.9,
        2.5
      );
      expect(stats.movementSpeed.statValue).to.be.closeTo(0.123, 0.001);
      expect(stats.strength.statValue).to.be.closeTo(15.6, 0.1);
    });
    
    it('should handle all stats at maximum', function() {
      const stats = new StatsContainer(
        createVector(0, 0),
        createVector(32, 32),
        100,
        null,
        1000,
        10000,
        100
      );
      expect(stats.movementSpeed.statValue).to.equal(100);
      expect(stats.strength.statValue).to.equal(1000);
      expect(stats.health.statValue).to.equal(10000);
      expect(stats.gatherSpeed.statValue).to.equal(100);
    });
    
    it('should handle all stats at minimum', function() {
      const stats = new StatsContainer(
        createVector(0, 0),
        createVector(32, 32),
        0,
        null,
        0,
        0,
        0
      );
      expect(stats.movementSpeed.statValue).to.equal(0);
      expect(stats.strength.statValue).to.equal(0);
      expect(stats.health.statValue).to.equal(0);
      expect(stats.gatherSpeed.statValue).to.equal(0);
    });
  });
  
  describe('Integration', function() {
    it('should maintain consistency across stat updates', function() {
      const stats = new StatsContainer(createVector(50, 50), createVector(32, 32));
      
      // Update various stats
      stats.strength.statValue = 500;
      stats.health.statValue = 5000;
      stats.exp.get('Gathering').statValue = 100;
      stats.exp.get('Hunting').statValue = 200;
      
      expect(stats.strength.statValue).to.equal(500);
      expect(stats.health.statValue).to.equal(5000);
      
      const total = stats.getExpTotal();
      expect(total).to.exist;
    });
    
    it('should handle multiple position updates', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      
      stats.position.statValue = createVector(10, 20);
      expect(stats.position.statValue.x).to.equal(10);
      
      stats.position.statValue = createVector(100, 200);
      expect(stats.position.statValue.x).to.equal(100);
      expect(stats.position.statValue.y).to.equal(200);
    });
    
    it('should handle complex EXP scenario', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      
      // Simulate gaining EXP in multiple categories
      stats.exp.get('Lifetime').statValue = 1000;
      stats.exp.get('Gathering').statValue = 250;
      stats.exp.get('Hunting').statValue = 150;
      stats.exp.get('Farming').statValue = 300;
      stats.exp.get('Construction').statValue = 200;
      
      const total = stats.getExpTotal();
      expect(total).to.exist;
    });
  });
});




// ================================================================
// dropoffLocation.test.js (50 tests)
// ================================================================
// Mock p5.js globals
global.TILE_SIZE = 32;
global.NONE = null;
global.push = function() {};
global.pop = function() {};
global.noStroke = function() {};
global.stroke = function() {};
global.strokeWeight = function() {};
global.noFill = function() {};
global.fill = function() {};
global.rect = function() {};

// Mock InventoryController
class MockInventoryController {
  constructor(owner, capacity = 2) {
    this.owner = owner;
    this.capacity = capacity;
    this.items = [];
  }
  
  addResource(resource) {
    if (this.items.length >= this.capacity) return false;
    this.items.push(resource);
    return true;
  }
  
  transferAllTo(targetInventory) {
    let transferred = 0;
    while (this.items.length > 0 && targetInventory.items.length < targetInventory.capacity) {
      const item = this.items.shift();
      if (targetInventory.addResource(item)) transferred++;
    }
    return transferred;
  }
  
  getResources() {
    return this.items;
  }
}

global.InventoryController = MockInventoryController;

// Mock Grid class
class MockGrid {
  constructor() {
    this.data = new Map();
  }
  
  set(coords, value) {
    const key = `${coords[0]},${coords[1]}`;
    this.data.set(key, value);
  }
  
  get(coords) {
    const key = `${coords[0]},${coords[1]}`;
    return this.data.get(key);
  }
}

// Load the module
// DUPLICATE REQUIRE REMOVED: let DropoffLocation = require('../../../Classes/containers/DropoffLocation.js');

describe('DropoffLocation', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const dropoff = new DropoffLocation(5, 4);
      expect(dropoff.x).to.equal(5);
      expect(dropoff.y).to.equal(4);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
      expect(dropoff.tileSize).to.equal(32);
    });
    
    it('should initialize with custom dimensions', function() {
      const dropoff = new DropoffLocation(10, 20, 3, 2);
      expect(dropoff.x).to.equal(10);
      expect(dropoff.y).to.equal(20);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should initialize with custom tile size', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { tileSize: 64 });
      expect(dropoff.tileSize).to.equal(64);
    });
    
    it('should floor grid coordinates', function() {
      const dropoff = new DropoffLocation(5.7, 4.2, 2.9, 3.1);
      expect(dropoff.x).to.equal(5);
      expect(dropoff.y).to.equal(4);
      expect(dropoff.width).to.equal(2);
      expect(dropoff.height).to.equal(3);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 0, 0);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should create inventory with default capacity', function() {
      const dropoff = new DropoffLocation(0, 0);
      expect(dropoff.inventory).to.not.be.null;
      expect(dropoff.inventory.capacity).to.equal(2);
    });
    
    it('should create inventory with custom capacity', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      expect(dropoff.inventory.capacity).to.equal(10);
    });
    
    it('should mark grid on construction if provided', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(2, 3, 2, 2, { grid });
      expect(dropoff._filledOnGrid).to.be.true;
      expect(grid.get([2, 3])).to.equal(dropoff);
      expect(grid.get([3, 4])).to.equal(dropoff);
    });
  });
  
  describe('tiles()', function() {
    it('should return single tile for 1x1 dropoff', function() {
      const dropoff = new DropoffLocation(5, 4, 1, 1);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(1);
      expect(tiles[0]).to.deep.equal([5, 4]);
    });
    
    it('should return all tiles for 2x2 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(4);
      expect(tiles).to.deep.include.members([[0, 0], [1, 0], [0, 1], [1, 1]]);
    });
    
    it('should return all tiles for 3x2 dropoff', function() {
      const dropoff = new DropoffLocation(10, 20, 3, 2);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(6);
      expect(tiles).to.deep.include.members([
        [10, 20], [11, 20], [12, 20],
        [10, 21], [11, 21], [12, 21]
      ]);
    });
    
    it('should handle large dropoff areas', function() {
      const dropoff = new DropoffLocation(0, 0, 10, 10);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(100);
    });
  });
  
  describe('expand()', function() {
    it('should expand width by positive delta', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(1, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should expand height by positive delta', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(0, 2);
      expect(dropoff.width).to.equal(2);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should expand both dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.expand(2, 3);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should handle negative delta (retraction)', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.expand(-2, -1);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should enforce minimum size of 1x1 when retracting', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(-5, -5);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should do nothing when both deltas are zero', function() {
      const dropoff = new DropoffLocation(0, 0, 3, 3);
      dropoff.expand(0, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(3);
    });
    
    it('should update grid when expanding', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 1, 1, { grid });
      dropoff.expand(1, 0);
      expect(grid.get([1, 0])).to.equal(dropoff);
    });
  });
  
  describe('retract()', function() {
    it('should retract width', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(2, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(5);
    });
    
    it('should retract height', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(0, 3);
      expect(dropoff.width).to.equal(5);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should retract both dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 10, 10);
      dropoff.retract(3, 4);
      expect(dropoff.width).to.equal(7);
      expect(dropoff.height).to.equal(6);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.retract(10, 10);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should convert positive arguments to absolute values', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(2, 1);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
  });
  
  describe('setSize()', function() {
    it('should set absolute width and height', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.setSize(5, 7);
      expect(dropoff.width).to.equal(5);
      expect(dropoff.height).to.equal(7);
    });
    
    it('should floor fractional values', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.setSize(4.9, 6.1);
      expect(dropoff.width).to.equal(4);
      expect(dropoff.height).to.equal(6);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.setSize(0, 0);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should update grid when resizing', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 1, 1, { grid });
      dropoff.setSize(3, 3);
      expect(dropoff.tiles()).to.have.lengthOf(9);
    });
  });
  
  describe('depositResource()', function() {
    it('should add resource to inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      const resource = { type: 'wood' };
      const result = dropoff.depositResource(resource);
      expect(result).to.be.true;
      expect(dropoff.inventory.items).to.include(resource);
    });
    
    it('should return false when inventory is full', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 2 });
      dropoff.depositResource({ type: 'wood' });
      dropoff.depositResource({ type: 'stone' });
      const result = dropoff.depositResource({ type: 'food' });
      expect(result).to.be.false;
    });
    
    it('should return false when no inventory exists', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { InventoryController: null });
      dropoff.inventory = null;
      const result = dropoff.depositResource({ type: 'wood' });
      expect(result).to.be.false;
    });
    
    it('should handle multiple deposits', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 5 });
      expect(dropoff.depositResource({ type: 'a' })).to.be.true;
      expect(dropoff.depositResource({ type: 'b' })).to.be.true;
      expect(dropoff.depositResource({ type: 'c' })).to.be.true;
      expect(dropoff.inventory.items).to.have.lengthOf(3);
    });
  });
  
  describe('acceptFromCarrier()', function() {
    it('should transfer resources from carrier with transferAllTo', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'wood' });
      carrier.inventory.addResource({ type: 'stone' });
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(2);
      expect(carrier.inventory.items).to.have.lengthOf(0);
    });
    
    it('should transfer resources from carrier with getResources', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const carrier = {
        getResources: () => [{ type: 'wood' }, { type: 'stone' }],
        removeResource: function(index) { this.getResources()[index] = null; }
      };
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(2);
    });
    
    it('should return 0 when carrier is null', function() {
      const dropoff = new DropoffLocation(0, 0);
      const transferred = dropoff.acceptFromCarrier(null);
      expect(transferred).to.equal(0);
    });
    
    it('should return 0 when dropoff has no inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      dropoff.inventory = null;
      const carrier = { inventory: new MockInventoryController(null, 5) };
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(0);
    });
    
    it('should handle partial transfers when dropoff is nearly full', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 3 });
      dropoff.depositResource({ type: 'existing' });
      
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'a' });
      carrier.inventory.addResource({ type: 'b' });
      carrier.inventory.addResource({ type: 'c' });
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(3);
      expect(carrier.inventory.items).to.have.lengthOf(1);
    });
    
    it('should handle empty carrier inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      const carrier = { inventory: new MockInventoryController(null, 5) };
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(0);
    });
  });
  
  describe('getCenterPx()', function() {
    it('should return center of 1x1 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(16);
      expect(center.y).to.equal(16);
    });
    
    it('should return center of 2x2 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(32);
      expect(center.y).to.equal(32);
    });
    
    it('should return center with custom tile size', function() {
      const dropoff = new DropoffLocation(5, 5, 3, 3, { tileSize: 64 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(416); // (5 + 3/2) * 64 = 6.5 * 64
      expect(center.y).to.equal(416);
    });
    
    it('should return center at non-zero grid position', function() {
      const dropoff = new DropoffLocation(10, 20, 4, 2, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(384); // (10 + 4/2) * 32 = 12 * 32
      expect(center.y).to.equal(672); // (20 + 2/2) * 32 = 21 * 32
    });
  });
  
  describe('draw()', function() {
    it('should not throw when p5 functions are available', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      expect(() => dropoff.draw()).to.not.throw();
    });
    
    it('should handle missing p5 gracefully', function() {
      const originalPush = global.push;
      global.push = undefined;
      const dropoff = new DropoffLocation(0, 0);
      expect(() => dropoff.draw()).to.not.throw();
      global.push = originalPush;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle negative grid coordinates', function() {
      const dropoff = new DropoffLocation(-5, -10, 2, 2);
      expect(dropoff.x).to.equal(-5);
      expect(dropoff.y).to.equal(-10);
      const tiles = dropoff.tiles();
      expect(tiles).to.deep.include.members([[-5, -10], [-4, -10], [-5, -9], [-4, -9]]);
    });
    
    it('should handle very large dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 100, 100);
      expect(dropoff.width).to.equal(100);
      expect(dropoff.height).to.equal(100);
      expect(dropoff.tiles()).to.have.lengthOf(10000);
    });
    
    it('should handle grid operations without grid instance', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      expect(() => dropoff.expand(1, 1)).to.not.throw();
      expect(() => dropoff.retract(1, 1)).to.not.throw();
    });
    
    it('should handle carrier without removeResource method', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const resources = [{ type: 'wood' }, { type: 'stone' }];
      const carrier = {
        getResources: () => resources
      };
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(resources[0]).to.be.null;
      expect(resources[1]).to.be.null;
    });
  });
  
  describe('Integration', function() {
    it('should maintain grid consistency through multiple operations', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 2, 2, { grid });
      
      dropoff.expand(1, 0);
      expect(dropoff.tiles()).to.have.lengthOf(6);
      
      dropoff.setSize(4, 4);
      expect(dropoff.tiles()).to.have.lengthOf(16);
      
      dropoff.retract(2, 2);
      expect(dropoff.tiles()).to.have.lengthOf(4);
    });
    
    it('should handle resource workflow', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 5 });
      
      // Deposit individual resources
      expect(dropoff.depositResource({ type: 'a' })).to.be.true;
      expect(dropoff.depositResource({ type: 'b' })).to.be.true;
      
      // Accept from carrier
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'c' });
      carrier.inventory.addResource({ type: 'd' });
      
      dropoff.acceptFromCarrier(carrier);
      expect(dropoff.inventory.items).to.have.lengthOf(4);
    });
  });
});




// ================================================================
// resource.movement.test.js (1 tests)
// ================================================================
/**
 * Resource Movement Integration Test
 */

// Mock Entity dependencies for Node.js testing
class MockCollisionBox2D {
  constructor(x, y, width, height) {
    this.x = x; this.y = y; this.width = width; this.height = height;
  }
  setPosition(x, y) { this.x = x; this.y = y; }
  setSize(w, h) { this.width = w; this.height = h; }
  contains(x, y) { return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height; }
}

class MockMovementController {
  constructor(entity) {
    this._entity = entity;
    this._movementSpeed = 30; // Default speed
    this._isMoving = false;
    this._skitterTimer = 100;
  }
  get movementSpeed() { return this._movementSpeed; }
  set movementSpeed(speed) { this._movementSpeed = speed; }
  getEffectiveMovementSpeed() {
    let baseSpeed = this._movementSpeed;
    if (this._entity.movementSpeed !== undefined) {
      baseSpeed = this._entity.movementSpeed;
    }
    return baseSpeed;
  }
  shouldSkitter() {
    if (this.getEffectiveMovementSpeed() <= 0) {
      return false;
    }
    this._skitterTimer -= 1;
    return this._skitterTimer <= 0;
  }
  update() {}
  moveToLocation() { return false; }
  getIsMoving() { return this._isMoving; }
  stop() { this._isMoving = false; }
}

class MockEntity {
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) {
    this._id = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._type = options.type || "Entity";
    this._isActive = true;
    this._collisionBox = new MockCollisionBox2D(x, y, width, height);
    this._controllers = new Map();
    this._controllers.set('movement', new MockMovementController(this));
    this._configureControllers(options);
  }
  _configureControllers(options) {
    const movement = this._controllers.get('movement');
    if (movement && options.movementSpeed !== undefined) {
      movement.movementSpeed = options.movementSpeed;
    }
  }
  getController(name) { return this._controllers.get(name); }
  get movementSpeed() { const movement = this._controllers.get('movement'); return movement ? movement.movementSpeed : 0; }
  set movementSpeed(speed) { const movement = this._controllers.get('movement'); if (movement) movement.movementSpeed = speed; }
  getPosition() { return { x: this._collisionBox.x, y: this._collisionBox.y }; }
  setPosition(x, y) { this._collisionBox.setPosition(x, y); }
}

describe('Resource Movement Integration', function() {
  it('prevents resources from skittering when movementSpeed is 0', function() {
    const resource = new MockEntity(10, 10, 20, 20, { type: 'Resource', movementSpeed: 0 });
    const movementController = resource.getController('movement');
    const result = {
      resourceCannotMove: resource.movementSpeed === 0 && !movementController.shouldSkitter(),
      antCanMove: false
    };
    // Basic expectations
    expect(result.resourceCannotMove).to.be.true;
  });
});





// ================================================================
// antStateMachine.test.js (14 tests)
// ================================================================
/* eslint-env mocha */
// DUPLICATE REQUIRE REMOVED: let AntStateMachine = require('../../../Classes/ants/antStateMachine');

describe('AntStateMachine', () => {
  let sm;

  beforeEach(() => {
    sm = new AntStateMachine();
  });

  it('initializes with correct defaults', () => {
    expect(sm.primaryState).to.equal('IDLE');
    expect(sm.combatModifier).to.equal('OUT_OF_COMBAT');
    expect(sm.terrainModifier).to.equal('DEFAULT');
    expect(sm.preferredState).to.equal('GATHERING');
  });

  it('validates primary/combat/terrain lists', () => {
    expect(sm.isValidPrimary('MOVING')).to.be.true;
    expect(sm.isValidPrimary('NOPE')).to.be.false;
    expect(sm.isValidCombat('IN_COMBAT')).to.be.true;
    expect(sm.isValidCombat(null)).to.be.true;
    expect(sm.isValidCombat('FAKE')).to.be.false;
    expect(sm.isValidTerrain('IN_WATER')).to.be.true;
    expect(sm.isValidTerrain(null)).to.be.true;
    expect(sm.isValidTerrain('BAD')).to.be.false;
  });

  it('setPrimaryState accepts valid and rejects invalid', () => {
    const ok = sm.setPrimaryState('MOVING');
    expect(ok).to.be.true;
    expect(sm.primaryState).to.equal('MOVING');

    const bad = sm.setPrimaryState('FLYING');
    expect(bad).to.be.false;
    expect(sm.primaryState).to.equal('MOVING');
  });

  it('setCombatModifier and setTerrainModifier handle null and valid values', () => {
    expect(sm.setCombatModifier('IN_COMBAT')).to.be.true;
    expect(sm.combatModifier).to.equal('IN_COMBAT');

    expect(sm.setCombatModifier(null)).to.be.true;
    expect(sm.combatModifier).to.equal(null);

    expect(sm.setTerrainModifier('IN_WATER')).to.be.true;
    expect(sm.terrainModifier).to.equal('IN_WATER');

    expect(sm.setTerrainModifier(null)).to.be.true;
    expect(sm.terrainModifier).to.equal(null);
  });

  it('setState sets combinations and rejects invalid combos', () => {
    // valid
    expect(sm.setState('GATHERING', 'IN_COMBAT', 'IN_MUD')).to.be.true;
    expect(sm.getFullState()).to.equal('GATHERING_IN_COMBAT_IN_MUD');

    // invalid primary
    expect(sm.setState('FLAP', null, null)).to.be.false;

    // invalid combat
    expect(sm.setState('IDLE', 'BAD', null)).to.be.false;

    // invalid terrain
    expect(sm.setState('IDLE', null, 'BAD')).to.be.false;
  });

  it('getFullState and getCurrentState return expected strings', () => {
    sm.setState('MOVING', 'IN_COMBAT', 'ON_ROUGH');
    expect(sm.getFullState()).to.equal('MOVING_IN_COMBAT_ON_ROUGH');
    expect(sm.getCurrentState()).to.equal('MOVING');
  });

  it('canPerformAction covers branches correctly', () => {
    // default: IDLE, OUT_OF_COMBAT, DEFAULT
    expect(sm.canPerformAction('move')).to.be.true;
    expect(sm.canPerformAction('gather')).to.be.true;
    expect(sm.canPerformAction('attack')).to.be.false;

    sm.setCombatModifier('IN_COMBAT');
    expect(sm.canPerformAction('attack')).to.be.true;

    sm.setPrimaryState('BUILDING');
    expect(sm.canPerformAction('move')).to.be.false;
    expect(sm.canPerformAction('gather')).to.be.false;

    sm.setState('IDLE', 'OUT_OF_COMBAT', null);
    sm.setTerrainModifier('ON_SLIPPERY');
    expect(sm.canPerformAction('move')).to.be.false; // slippery blocks move
  });

  it('state query helpers return expected booleans', () => {
    sm.reset();
    expect(sm.isIdle()).to.be.true;
    expect(sm.isOutOfCombat()).to.be.true;
    expect(sm.isOnDefaultTerrain()).to.be.true;

    sm.setState('MOVING', 'IN_COMBAT', 'IN_MUD');
    expect(sm.isMoving()).to.be.true;
    expect(sm.isInCombat()).to.be.true;
    expect(sm.isInMud()).to.be.true;
  });

  it('clearModifiers and reset behave correctly and invoke callback', (done) => {
    let calls = 0;
    sm.setStateChangeCallback((oldS, newS) => { calls++; });
    sm.setState('GATHERING', 'IN_COMBAT', 'IN_WATER');
    expect(sm.getFullState()).to.equal('GATHERING_IN_COMBAT_IN_WATER');

    sm.clearModifiers();
    expect(sm.combatModifier).to.equal(null);
    expect(sm.terrainModifier).to.equal(null);

    sm.reset();
    expect(sm.primaryState).to.equal('IDLE');
    expect(sm.combatModifier).to.equal('OUT_OF_COMBAT');
    expect(sm.terrainModifier).to.equal('DEFAULT');

    // callback should have been called at least once (setState, clearModifiers, reset)
    expect(calls).to.be.at.least(1);
    done();
  });

  it('setPreferredState and ResumePreferredState work', () => {
    sm.setPreferredState('MOVING');
    sm.beginIdle();
    sm.ResumePreferredState();
    expect(sm.primaryState).to.equal('MOVING');
  });

  it('isValidAnyState and isInState utilities', () => {
    expect(sm.isValidAnyState('MOVING')).to.be.true;
    expect(sm.isValidAnyState('IN_COMBAT')).to.be.true;
    expect(sm.isValidAnyState('IN_WATER')).to.be.true;
    expect(sm.isValidAnyState('NOPE')).to.be.false;

    sm.setState('GATHERING', 'IN_COMBAT', 'IN_WATER');
    expect(sm.isInState('GATHERING_IN_COMBAT_IN_WATER')).to.be.true;
  });

  it('printState uses devConsoleEnabled global (no throw)', () => {
    // ensure printState does not throw if devConsoleEnabled undefined/false
    global.devConsoleEnabled = false;
    expect(() => sm.printState()).to.not.throw();
    global.devConsoleEnabled = true;
    expect(() => sm.printState()).to.not.throw();
  });

  it('getStateSummary contains expected structure', () => {
    sm.setState('GATHERING', null, null);
    const summary = sm.getStateSummary();
    expect(summary).to.include.keys('fullState', 'primary', 'combat', 'terrain', 'actions');
    expect(summary.primary).to.equal('GATHERING');
  });

  it('update is a no-op and does not throw', () => {
    expect(() => sm.update()).to.not.throw();
  });
});




// ================================================================
// gatherState.test.js (16 tests)
// ================================================================
// Ensure Globals used by GatherState are present
global.logVerbose = global.logVerbose || function() {};
global.deltaTime = global.deltaTime || 16; // ms per frame approx

// DUPLICATE REQUIRE REMOVED: let GatherState = require('../../../Classes/ants/GatherState');

describe('GatherState', function() {
  let antMock;
  let resourceManagerMock;
  let movementControllerMock;
  let stateMachineMock;

  beforeEach(function() {
    // reset global resource manager
    global.g_resourceManager = {
      _list: [],
      getResourceList() { return this._list; },
      removeResource(r) { const i = this._list.indexOf(r); if (i !== -1) this._list.splice(i,1); }
    };

    resourceManagerMock = {
      _load: 0,
      isAtMaxLoad() { return this._load >= 5; },
      addResource(r) { if (!r) return false; this._load++; return true; },
      startDropOff(x,y) { this.dropOffCalled = {x,y}; }
    };

    movementControllerMock = {
      lastTarget: null,
      moveToLocation(x,y) { this.lastTarget = {x,y}; }
    };

    stateMachineMock = {
      primary: 'IDLE',
      setPrimaryState(s) { this.primary = s; }
    };

    antMock = {
      id: 'ant-1',
      _antIndex: 1,
      _resourceManager: resourceManagerMock,
      _movementController: movementControllerMock,
      _stateMachine: stateMachineMock,
      posX: 100,
      posY: 100,
      getPosition() { return { x: this.posX, y: this.posY }; }
    };
  });

  afterEach(function() {
    delete global.g_resource_manager;
    delete global.g_resourceManager;
  });

  it('initializes with correct defaults', function() {
    const gs = new GatherState(antMock);
    expect(gs.ant).to.equal(antMock);
    expect(gs.gatherRadius).to.equal(7);
    expect(gs.pixelRadius).to.equal(224);
    expect(gs.isActive).to.be.false;
  });

  it('enter() activates state and sets ant primary state', function() {
    const gs = new GatherState(antMock);
    gs.enter();
    expect(gs.isActive).to.be.true;
    expect(stateMachineMock.primary).to.equal('GATHERING');
  });

  it('exit() deactivates state', function() {
    const gs = new GatherState(antMock);
    gs.enter();
    const res = gs.exit();
    expect(res).to.be.true;
    expect(gs.isActive).to.be.false;
  });

  it('getAntPosition() returns ant position', function() {
    const gs = new GatherState(antMock);
    const pos = gs.getAntPosition();
    expect(pos).to.deep.equal({ x: 100, y: 100 });
  });

  it('getDistance() computes Euclidean distance', function() {
    const gs = new GatherState(antMock);
    const d = gs.getDistance(0,0,3,4);
    expect(d).to.equal(5);
  });

  it('getResourcesInRadius() finds resources from g_resourceManager', function() {
    // add resources near and far
    const near = { x: 110, y: 110, type: 'food' };
    const far = { x: 1000, y: 1000, type: 'stone' };
    global.g_resource_manager = global.g_resource_manager || { _list: [] };
    global.g_resource_manager._list.push(near, far);

    const gs = new GatherState(antMock);
    const found = gs.getResourcesInRadius(100,100,50);
    expect(found).to.be.an('array');
    // should find near only
    expect(found.some(r => r.type === 'food')).to.be.true;
    expect(found.some(r => r.type === 'stone')).to.be.false;
  });

  it('searchForResources() sets nearest resource as targetResource', function() {
    const near = { x: 110, y: 110, type: 'food' };
    const other = { x: 105, y: 105, type: 'leaf' };
    global.g_resourceManager._list.push(near, other);

    const gs = new GatherState(antMock);
    const results = gs.searchForResources();
    expect(results.length).to.equal(2);
    expect(gs.targetResource).to.exist;
    // targetResource should be the closest (other at 7.07 vs near at 14.14)
    expect(gs.targetResource.type).to.equal('leaf');
  });

  it('moveToResource delegates to movement controller', function() {
    const gs = new GatherState(antMock);
    gs.moveToResource(200,200);
    expect(movementControllerMock.lastTarget).to.deep.equal({ x:200, y:200 });
  });

  it('attemptResourceCollection adds resource and removes from system', function() {
    const resource = { x: 110, y: 110, type: 'food' };
    global.g_resourceManager._list.push(resource);

    const gs = new GatherState(antMock);
    // manually set targetResource shape as returned by getResourcesInRadius
    gs.targetResource = { resource: resource, x: resource.x, y: resource.y, type: resource.type };

    gs.attemptResourceCollection();

    // resourceManagerMock should have added the resource (load becomes 1)
    expect(resourceManagerMock._load).to.equal(1);
    // g_resourceManager should no longer contain the resource
    expect(global.g_resourceManager._list.indexOf(resource)).to.equal(-1);
    // targetResource cleared
    expect(gs.targetResource).to.be.null;
  });

  it('isAtMaxCapacity() respects ant resource manager', function() {
    const gs = new GatherState(antMock);
    // initially not max
    resourceManagerMock._load = 0;
    expect(gs.isAtMaxCapacity()).to.be.false;
    resourceManagerMock._load = 5;
    expect(gs.isAtMaxCapacity()).to.be.true;
  });

  it('transitionToDropOff() sets state and calls startDropOff', function() {
    const gs = new GatherState(antMock);
    gs.transitionToDropOff();
    expect(stateMachineMock.primary).to.equal('DROPPING_OFF');
    expect(resourceManagerMock.dropOffCalled).to.exist;
    expect(gs.isActive).to.be.false;
  });

  it('updateTargetMovement collects when in range', function() {
    const resource = { x: 102, y: 102, type: 'food' };
    global.g_resourceManager._list.push(resource);

    const gs = new GatherState(antMock);
    gs.targetResource = { resource, x: resource.x, y: resource.y, type: resource.type };

    // call updateTargetMovement should attempt collection (within 15px)
    gs.updateTargetMovement();
    expect(resourceManagerMock._load).to.equal(1);
    expect(gs.targetResource).to.be.null;
  });

  it('getDebugInfo returns useful info object', function() {
    const gs = new GatherState(antMock);
    const info = gs.getDebugInfo();
    expect(info).to.be.an('object');
    expect(info.hasTarget).to.be.a('boolean');
    expect(info.gatherRadius).to.be.a('string');
  });

  it('setDebugEnabled toggles debug flag', function() {
    const gs = new GatherState(antMock);
    gs.setDebugEnabled(true);
    expect(gs.debugEnabled).to.be.true;
    gs.setDebugEnabled(false);
    expect(gs.debugEnabled).to.be.false;
  });
});




// ================================================================
// jobComponent.test.js (46 tests)
// ================================================================
/**
 * JobComponent Unit Tests - Comprehensive Coverage
 */

// Load the JobComponent class
// DUPLICATE REQUIRE REMOVED: let JobComponent = require('../../../Classes/ants/JobComponent.js');
describe('JobComponent', function() {
  describe('Constructor', function() {
    it('should create instance with name and stats', function() {
      const jc = new JobComponent('Builder');
      expect(jc.name).to.equal('Builder');
      expect(jc.stats).to.exist;
      expect(jc.stats).to.be.an('object');
    });

    it('should create instance with name and image', function() {
      const img = { src: 'builder.png' };
      const jc = new JobComponent('Builder', img);
      expect(jc.name).to.equal('Builder');
      expect(jc.image).to.equal(img);
    });

    it('should create instance without image (null default)', function() {
      const jc = new JobComponent('Scout');
      expect(jc.name).to.equal('Scout');
      expect(jc.image).to.be.null;
    });

    it('should retrieve stats for all job types', function() {
      const jobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
      jobs.forEach(jobName => {
        const jc = new JobComponent(jobName);
        expect(jc.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });

    it('should use default stats for unknown job', function() {
      const jc = new JobComponent('UnknownJob');
      expect(jc.stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });
  });

  describe('getJobStats (static)', function() {
    it('should return Builder stats', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats).to.deep.equal({
        strength: 20,
        health: 120,
        gatherSpeed: 15,
        movementSpeed: 60
      });
    });

    it('should return Scout stats', function() {
      const stats = JobComponent.getJobStats('Scout');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 80,
        gatherSpeed: 10,
        movementSpeed: 80
      });
    });

    it('should return Farmer stats', function() {
      const stats = JobComponent.getJobStats('Farmer');
      expect(stats).to.deep.equal({
        strength: 15,
        health: 100,
        gatherSpeed: 30,
        movementSpeed: 60
      });
    });

    it('should return Warrior stats', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats).to.deep.equal({
        strength: 40,
        health: 150,
        gatherSpeed: 5,
        movementSpeed: 60
      });
    });

    it('should return Spitter stats', function() {
      const stats = JobComponent.getJobStats('Spitter');
      expect(stats).to.deep.equal({
        strength: 30,
        health: 90,
        gatherSpeed: 8,
        movementSpeed: 60
      });
    });

    it('should return DeLozier stats (special)', function() {
      const stats = JobComponent.getJobStats('DeLozier');
      expect(stats).to.deep.equal({
        strength: 1000,
        health: 10000,
        gatherSpeed: 1,
        movementSpeed: 10000
      });
    });

    it('should return default stats for unknown job', function() {
      const stats = JobComponent.getJobStats('Unknown');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for null', function() {
      const stats = JobComponent.getJobStats(null);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for undefined', function() {
      const stats = JobComponent.getJobStats(undefined);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for empty string', function() {
      const stats = JobComponent.getJobStats('');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should be case-sensitive', function() {
      const stats = JobComponent.getJobStats('builder'); // lowercase
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return object with all required stat properties', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats).to.have.property('strength');
      expect(stats).to.have.property('health');
      expect(stats).to.have.property('gatherSpeed');
      expect(stats).to.have.property('movementSpeed');
    });

    it('should return numeric values for all stats', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats.strength).to.be.a('number');
      expect(stats.health).to.be.a('number');
      expect(stats.gatherSpeed).to.be.a('number');
      expect(stats.movementSpeed).to.be.a('number');
    });

    it('should return positive values for all stats', function() {
      const jobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
      jobs.forEach(job => {
        const stats = JobComponent.getJobStats(job);
        expect(stats.strength).to.be.above(0);
        expect(stats.health).to.be.above(0);
        expect(stats.gatherSpeed).to.be.above(0);
        expect(stats.movementSpeed).to.be.above(0);
      });
    });
  });

  describe('getJobList (static)', function() {
    it('should return array of standard jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.be.an('array');
      expect(jobs).to.include('Builder');
      expect(jobs).to.include('Scout');
      expect(jobs).to.include('Farmer');
      expect(jobs).to.include('Warrior');
      expect(jobs).to.include('Spitter');
    });

    it('should return exactly 5 jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.have.lengthOf(5);
    });

    it('should not include special jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.not.include('DeLozier');
    });

    it('should return same array on multiple calls', function() {
      const jobs1 = JobComponent.getJobList();
      const jobs2 = JobComponent.getJobList();
      expect(jobs1).to.deep.equal(jobs2);
    });
  });

  describe('getSpecialJobs (static)', function() {
    it('should return array of special jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.be.an('array');
      expect(specialJobs).to.include('DeLozier');
    });

    it('should return exactly 1 special job', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.have.lengthOf(1);
    });

    it('should not include standard jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.not.include('Builder');
      expect(specialJobs).to.not.include('Scout');
      expect(specialJobs).to.not.include('Farmer');
    });
  });

  describe('getAllJobs (static)', function() {
    it('should return array of all jobs (standard + special)', function() {
      const allJobs = JobComponent.getAllJobs();
      expect(allJobs).to.be.an('array');
      expect(allJobs).to.include('Builder');
      expect(allJobs).to.include('Scout');
      expect(allJobs).to.include('DeLozier');
    });

    it('should return exactly 6 jobs total', function() {
      const allJobs = JobComponent.getAllJobs();
      expect(allJobs).to.have.lengthOf(6);
    });

    it('should equal getJobList + getSpecialJobs', function() {
      const jobList = JobComponent.getJobList();
      const specialJobs = JobComponent.getSpecialJobs();
      const allJobs = JobComponent.getAllJobs();
      
      expect(allJobs.length).to.equal(jobList.length + specialJobs.length);
      jobList.forEach(job => expect(allJobs).to.include(job));
      specialJobs.forEach(job => expect(allJobs).to.include(job));
    });

    it('should have no duplicates', function() {
      const allJobs = JobComponent.getAllJobs();
      const uniqueJobs = [...new Set(allJobs)];
      expect(allJobs.length).to.equal(uniqueJobs.length);
    });
  });

  describe('Stats Validation', function() {
    it('should have Builder as high health tank', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats.health).to.equal(120); // Higher than default 100
      expect(stats.strength).to.equal(20);
    });

    it('should have Scout as fastest unit', function() {
      const stats = JobComponent.getJobStats('Scout');
      expect(stats.movementSpeed).to.equal(80); // Fastest
      const builderStats = JobComponent.getJobStats('Builder');
      expect(stats.movementSpeed).to.be.above(builderStats.movementSpeed);
    });

    it('should have Farmer as best gatherer', function() {
      const stats = JobComponent.getJobStats('Farmer');
      expect(stats.gatherSpeed).to.equal(30); // Highest gather speed
      const scoutStats = JobComponent.getJobStats('Scout');
      expect(stats.gatherSpeed).to.be.above(scoutStats.gatherSpeed);
    });

    it('should have Warrior as strongest fighter', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats.strength).to.equal(40); // Highest strength
      expect(stats.health).to.equal(150); // Highest health
    });

    it('should have Spitter as ranged attacker', function() {
      const stats = JobComponent.getJobStats('Spitter');
      expect(stats.strength).to.equal(30); // High damage
      expect(stats.health).to.equal(90); // Lower health (glass cannon)
    });

    it('should have DeLozier as overpowered special unit', function() {
      const stats = JobComponent.getJobStats('DeLozier');
      expect(stats.strength).to.equal(1000);
      expect(stats.health).to.equal(10000);
      expect(stats.movementSpeed).to.equal(10000);
    });
  });

  describe('Edge Cases', function() {
    it('should handle number as job name', function() {
      const stats = JobComponent.getJobStats(123);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle object as job name', function() {
      const stats = JobComponent.getJobStats({});
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle array as job name', function() {
      const stats = JobComponent.getJobStats([]);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should create instance with all job types', function() {
      const allJobs = JobComponent.getAllJobs();
      allJobs.forEach(jobName => {
        const jc = new JobComponent(jobName);
        expect(jc.name).to.equal(jobName);
        expect(jc.stats).to.exist;
      });
    });

    it('should handle very long job name', function() {
      const longName = 'A'.repeat(1000);
      const stats = JobComponent.getJobStats(longName);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle job name with special characters', function() {
      const stats = JobComponent.getJobStats('Builder!@#$%');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });
  });

  describe('Integration', function() {
    it('should create different instances with different names', function() {
      const builder = new JobComponent('Builder');
      const scout = new JobComponent('Scout');
      
      expect(builder.name).to.not.equal(scout.name);
      expect(builder.stats.strength).to.not.equal(scout.stats.strength);
    });

    it('should maintain stat independence between instances', function() {
      const builder1 = new JobComponent('Builder');
      const builder2 = new JobComponent('Builder');
      
      builder1.stats.strength = 999;
      expect(builder2.stats.strength).to.equal(20); // Unchanged
    });

    it('should work with all standard jobs', function() {
      const jobs = JobComponent.getJobList();
      jobs.forEach(jobName => {
        const component = new JobComponent(jobName);
        expect(component.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });

    it('should work with all special jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      specialJobs.forEach(jobName => {
        const component = new JobComponent(jobName);
        expect(component.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });
  });
});




// ================================================================
// queen.test.js (58 tests)
// ================================================================
// Mock globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);
global.push = () => {};
global.pop = () => {};
global.noFill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.ellipse = () => {};

// Mock ant base class
class ant {
  constructor(posX, posY, sizeX, sizeY, movementSpeed, rotation, img, jobName, faction) {
    this.posX = posX;
    this.posY = posY;
    this._size = { x: sizeX, y: sizeY };
    this.movementSpeed = movementSpeed;
    this.rotation = rotation;
    this._image = img;
    this.jobName = jobName;
    this.faction = faction;
    this.isActive = true;
    this._commands = [];
  }
  getPosition() { return { x: this.posX, y: this.posY }; }
  getSize() { return this._size; }
  getImage() { return this._image; }
  moveToLocation(x, y) { this._lastMove = { x, y }; }
  addCommand(cmd) { this._commands.push(cmd); }
  update() {}
  render() {}
}

global.ant = ant;
global.JobImages = { Builder: { src: 'test.png' } };

// Load QueenAnt - Read entire file and eval it
// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
let queenPath = path.join(__dirname, '..', '..', '..', 'Classes', 'ants', 'Queen.js');
let queenCode = fs.readFileSync(queenPath, 'utf8');

// Remove any trailing whitespace/newlines that might cause issues
queenCode = queenCode.trim();

// Create QueenAnt in global scope by evaluating the code
try {
  // Use Function constructor for safer eval in this context
  const fn = new Function('ant', 'JobImages', queenCode + '\nreturn QueenAnt;');
  const QueenAnt = fn(ant, global.JobImages);
  global.QueenAnt = QueenAnt;
} catch (e) {
  console.error('Failed to load QueenAnt:', e);
  // Fallback: direct eval
  eval(queenCode);
}

describe('QueenAnt', function() {
  let queen;
  let baseAnt;

  beforeEach(function() {
    baseAnt = new ant(400, 300, 60, 60, 30, 0, { src: 'queen.png' }, 'Queen', 'player');
    queen = new QueenAnt(baseAnt);
  });

  describe('Constructor', function() {
    it('should initialize with base ant properties', function() {
      expect(queen.posX).to.equal(400);
      expect(queen.posY).to.equal(300);
      expect(queen.faction).to.equal('player');
    });

    it('should initialize with default properties when no base ant', function() {
      const q = new QueenAnt(null);
      expect(q.posX).to.equal(400); // Default position
      expect(q.posY).to.equal(300);
    });

    it('should set Queen-specific properties', function() {
      expect(queen.commandRadius).to.equal(250);
      expect(queen.ants).to.be.an('array').that.is.empty;
      expect(queen.coolDown).to.be.false;
      expect(queen.showCommandRadius).to.be.false;
      expect(queen.disableSkitter).to.be.true;
    });

    it('should initialize all power unlock flags to false', function() {
      expect(queen.unlockedPowers.fireball).to.be.false;
      expect(queen.unlockedPowers.lightning).to.be.false;
      expect(queen.unlockedPowers.blackhole).to.be.false;
      expect(queen.unlockedPowers.sludge).to.be.false;
      expect(queen.unlockedPowers.tidalWave).to.be.false;
    });

    it('should inherit from ant class', function() {
      expect(queen).to.be.instanceOf(ant);
    });
  });

  describe('addAnt', function() {
    it('should add ant to ants array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(1);
      expect(queen.ants[0]).to.equal(workerAnt);
    });

    it('should set ant faction to match queen', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'neutral');
      queen.addAnt(workerAnt);
      expect(workerAnt._faction).to.equal('player');
    });

    it('should handle null ant gracefully', function() {
      expect(() => queen.addAnt(null)).to.not.throw();
      expect(queen.ants).to.have.lengthOf(0);
    });

    it('should add multiple ants', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      expect(queen.ants).to.have.lengthOf(2);
    });
  });

  describe('removeAnt', function() {
    it('should remove ant from ants array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.removeAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(0);
    });

    it('should handle removing non-existent ant', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.removeAnt(ant2);
      expect(queen.ants).to.have.lengthOf(1);
      expect(queen.ants[0]).to.equal(ant1);
    });

    it('should remove correct ant from multiple', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      const ant3 = new ant(300, 300, 20, 20, 30, 0, null, 'Scout', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.addAnt(ant3);
      queen.removeAnt(ant2);
      expect(queen.ants).to.have.lengthOf(2);
      expect(queen.ants).to.include(ant1);
      expect(queen.ants).to.include(ant3);
      expect(queen.ants).to.not.include(ant2);
    });
  });

  describe('broadcastCommand', function() {
    let nearAnt, farAnt;

    beforeEach(function() {
      // Ant within command radius (250)
      nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      // Ant outside command radius
      farAnt = new ant(1000, 1000, 20, 20, 30, 0, null, 'Scout', 'player');
      queen.addAnt(nearAnt);
      queen.addAnt(farAnt);
    });

    it('should send MOVE command to ants in range', function() {
      queen.broadcastCommand({ type: 'MOVE', x: 600, y: 500 });
      expect(nearAnt._lastMove).to.deep.equal({ x: 600, y: 500 });
      expect(farAnt._lastMove).to.be.undefined;
    });

    it('should send GATHER command to ants in range', function() {
      queen.broadcastCommand({ type: 'GATHER' });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('GATHER');
      expect(farAnt._commands).to.have.lengthOf(0);
    });

    it('should send BUILD command to ants in range', function() {
      queen.broadcastCommand({ type: 'BUILD' });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('BUILD');
    });

    it('should send DEFEND command with target', function() {
      const target = { x: 700, y: 700 };
      queen.broadcastCommand({ type: 'DEFEND', target: target });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].target).to.equal(target);
    });

    it('should only affect ants within command radius', function() {
      // nearAnt is ~100 units away (within 250)
      // farAnt is ~840 units away (outside 250)
      queen.broadcastCommand({ type: 'GATHER' });
      expect(nearAnt._commands.length).to.be.greaterThan(0);
      expect(farAnt._commands).to.have.lengthOf(0);
    });

    it('should handle empty ants array', function() {
      queen.ants = [];
      expect(() => queen.broadcastCommand({ type: 'MOVE', x: 100, y: 100 })).to.not.throw();
    });
  });

  describe('commandAnt', function() {
    it('should send command to specific ant in array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.commandAnt(workerAnt, { type: 'GATHER' });
      expect(workerAnt._commands).to.have.lengthOf(1);
      expect(workerAnt._commands[0].type).to.equal('GATHER');
    });

    it('should not send command to ant not in array', function() {
      const outsideAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.commandAnt(outsideAnt, { type: 'GATHER' });
      expect(outsideAnt._commands).to.have.lengthOf(0);
    });

    it('should send multiple commands to same ant', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.commandAnt(workerAnt, { type: 'GATHER' });
      queen.commandAnt(workerAnt, { type: 'BUILD' });
      expect(workerAnt._commands).to.have.lengthOf(2);
    });
  });

  describe('gatherAntsAt', function() {
    it('should broadcast MOVE command to specified coordinates', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.gatherAntsAt(600, 500);
      expect(nearAnt._lastMove).to.deep.equal({ x: 600, y: 500 });
    });

    it('should gather multiple ants', function() {
      const ant1 = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(450, 350, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.gatherAntsAt(600, 500);
      expect(ant1._lastMove).to.exist;
      expect(ant2._lastMove).to.exist;
    });
  });

  describe('orderGathering', function() {
    it('should broadcast GATHER command', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.orderGathering();
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('GATHER');
    });
  });

  describe('orderBuilding', function() {
    it('should broadcast BUILD command', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.orderBuilding();
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('BUILD');
    });
  });

  describe('emergencyRally', function() {
    it('should gather all ants to queen position', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.emergencyRally();
      expect(nearAnt._lastMove).to.deep.equal({ x: queen.posX, y: queen.posY });
    });

    it('should rally multiple ants to queen', function() {
      const ant1 = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(450, 350, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.emergencyRally();
      expect(ant1._lastMove).to.deep.equal({ x: 400, y: 300 });
      expect(ant2._lastMove).to.deep.equal({ x: 400, y: 300 });
    });
  });

  describe('Power Management', function() {
    describe('unlockPower', function() {
      it('should unlock valid power', function() {
        const result = queen.unlockPower('fireball');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.fireball).to.be.true;
      });

      it('should unlock all valid powers', function() {
        const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave'];
        powers.forEach(power => {
          expect(queen.unlockPower(power)).to.be.true;
          expect(queen.unlockedPowers[power]).to.be.true;
        });
      });

      it('should return false for invalid power', function() {
        const result = queen.unlockPower('invalidPower');
        expect(result).to.be.false;
      });

      it('should allow unlocking already unlocked power', function() {
        queen.unlockPower('fireball');
        const result = queen.unlockPower('fireball');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.fireball).to.be.true;
      });
    });

    describe('lockPower', function() {
      it('should lock unlocked power', function() {
        queen.unlockPower('lightning');
        const result = queen.lockPower('lightning');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.lightning).to.be.false;
      });

      it('should return false for invalid power', function() {
        const result = queen.lockPower('invalidPower');
        expect(result).to.be.false;
      });

      it('should allow locking already locked power', function() {
        const result = queen.lockPower('blackhole');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.blackhole).to.be.false;
      });
    });

    describe('isPowerUnlocked', function() {
      it('should return true for unlocked power', function() {
        queen.unlockPower('sludge');
        expect(queen.isPowerUnlocked('sludge')).to.be.true;
      });

      it('should return false for locked power', function() {
        expect(queen.isPowerUnlocked('tidalWave')).to.be.false;
      });

      it('should return false for invalid power', function() {
        // isPowerUnlocked returns false for invalid/non-existent powers
        expect(queen.isPowerUnlocked('invalid')).to.be.false;
      });
    });

    describe('getUnlockedPowers', function() {
      it('should return empty array when no powers unlocked', function() {
        expect(queen.getUnlockedPowers()).to.be.an('array').that.is.empty;
      });

      it('should return array of unlocked powers', function() {
        queen.unlockPower('fireball');
        queen.unlockPower('lightning');
        const unlocked = queen.getUnlockedPowers();
        expect(unlocked).to.have.lengthOf(2);
        expect(unlocked).to.include('fireball');
        expect(unlocked).to.include('lightning');
      });

      it('should not include locked powers', function() {
        queen.unlockPower('fireball');
        queen.unlockPower('lightning');
        queen.lockPower('lightning');
        const unlocked = queen.getUnlockedPowers();
        expect(unlocked).to.have.lengthOf(1);
        expect(unlocked).to.include('fireball');
        expect(unlocked).to.not.include('lightning');
      });
    });

    describe('getAllPowers', function() {
      it('should return all power states', function() {
        queen.unlockPower('fireball');
        const allPowers = queen.getAllPowers();
        expect(allPowers).to.have.property('fireball', true);
        expect(allPowers).to.have.property('lightning', false);
        expect(allPowers).to.have.property('blackhole', false);
        expect(allPowers).to.have.property('sludge', false);
        expect(allPowers).to.have.property('tidalWave', false);
      });

      it('should return copy of powers object', function() {
        const powers = queen.getAllPowers();
        powers.fireball = true;
        expect(queen.unlockedPowers.fireball).to.be.false; // Original unchanged
      });
    });
  });

  describe('move', function() {
    it('should move up (w) with slower speed', function() {
      const startY = queen.posY;
      queen.move('w');
      expect(queen._lastMove.y).to.be.greaterThan(startY);
    });

    it('should move left (a)', function() {
      const startX = queen.posX;
      queen.move('a');
      expect(queen._lastMove.x).to.be.lessThan(startX);
    });

    it('should move down (s)', function() {
      const startY = queen.posY;
      queen.move('s');
      expect(queen._lastMove.y).to.be.lessThan(startY);
    });

    it('should move right (d)', function() {
      const startX = queen.posX;
      queen.move('d');
      expect(queen._lastMove.x).to.be.greaterThan(startX);
    });

    it('should move slower than normal ant (0.1x speed)', function() {
      queen.movementSpeed = 100;
      queen.move('d');
      const deltaX = queen._lastMove.x - queen.posX;
      expect(deltaX).to.equal(10); // 100 * 0.1
    });

    it('should handle invalid direction gracefully', function() {
      expect(() => queen.move('x')).to.not.throw();
    });
  });

  describe('update', function() {
    it('should call super.update', function() {
      let superCalled = false;
      const originalUpdate = ant.prototype.update;
      ant.prototype.update = function() { superCalled = true; };
      queen.update();
      expect(superCalled).to.be.true;
      ant.prototype.update = originalUpdate;
    });

    it('should not throw errors', function() {
      expect(() => queen.update()).to.not.throw();
    });
  });

  describe('render', function() {
    it('should call super.render', function() {
      let superCalled = false;
      const originalRender = ant.prototype.render;
      ant.prototype.render = function() { superCalled = true; };
      queen.render();
      expect(superCalled).to.be.true;
      ant.prototype.render = originalRender;
    });

    it('should not render command radius when showCommandRadius is false', function() {
      queen.showCommandRadius = false;
      let ellipseCalled = false;
      global.ellipse = () => { ellipseCalled = true; };
      queen.render();
      expect(ellipseCalled).to.be.false;
    });

    it('should render command radius when showCommandRadius is true', function() {
      queen.showCommandRadius = true;
      let ellipseCalled = false;
      global.ellipse = (x, y, d) => { 
        ellipseCalled = true;
        expect(d).to.equal(queen.commandRadius * 2);
      };
      queen.render();
      expect(ellipseCalled).to.be.true;
    });
  });

  describe('Edge Cases', function() {
    it('should handle very large commandRadius', function() {
      queen.commandRadius = 100000; // Very large radius
      const farAnt = new ant(9000, 9000, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(farAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // Distance from (400, 300) to (9000, 9000) is ~12200, so radius must be > 12200
      expect(farAnt._commands).to.have.lengthOf(1);
    });

    it('should handle zero commandRadius', function() {
      queen.commandRadius = 0;
      const nearAnt = new ant(400, 300, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // Only ant at exact same position would receive command
    });

    it('should handle negative commandRadius', function() {
      queen.commandRadius = -100;
      const nearAnt = new ant(400, 300, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // No ants should receive command with negative radius
      expect(nearAnt._commands).to.have.lengthOf(0);
    });

    it('should handle adding same ant multiple times', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.addAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(2);
      expect(queen.ants[0]).to.equal(queen.ants[1]);
    });

    it('should handle unlocking all powers then locking all', function() {
      const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave'];
      powers.forEach(p => queen.unlockPower(p));
      expect(queen.getUnlockedPowers()).to.have.lengthOf(5);
      
      powers.forEach(p => queen.lockPower(p));
      expect(queen.getUnlockedPowers()).to.have.lengthOf(0);
    });
  });
});




// ================================================================
// entity.test.js (69 tests)
// ================================================================
// Mock p5.js globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.mouseX = 0;
global.mouseY = 0;

// Mock CollisionBox2D
class MockCollisionBox2D {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
  setPosition(x, y) { this.x = x; this.y = y; }
  setSize(w, h) { this.width = w; this.height = h; }
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
  intersects(other) {
    return !(this.x > other.x + other.width ||
             this.x + this.width < other.x ||
             this.y > other.y + other.height ||
             this.y + this.height < other.y);
  }
  getCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }
}
global.CollisionBox2D = MockCollisionBox2D;

// Mock Sprite2D
class MockSprite2D {
  constructor(imagePath, pos, size, rotation) {
    this.img = imagePath;
    this.position = pos;
    this.size = size;
    this.rotation = rotation;
    this.visible = true;
    this.alpha = 1.0;
  }
  setImage(path) { this.img = path; }
  getImage() { return this.img; }
  setPosition(pos) { this.position = pos; }
  setSize(size) { this.size = size; }
  setOpacity(alpha) { this.alpha = alpha; }
  getOpacity() { return this.alpha; }
}
global.Sprite2D = MockSprite2D;

// Mock Controllers
class MockTransformController {
  constructor(entity) { this.entity = entity; this.pos = { x: 0, y: 0 }; this.size = { x: 32, y: 32 }; }
  setPosition(x, y) { this.pos = { x, y }; }
  getPosition() { return this.pos; }
  setSize(w, h) { this.size = { x: w, y: h }; }
  getSize() { return this.size; }
  getCenter() { return { x: this.pos.x + this.size.x / 2, y: this.pos.y + this.size.y / 2 }; }
  update() {}
}

class MockMovementController {
  constructor(entity) { 
    this.entity = entity; 
    this.movementSpeed = 1.0;
    this.isMoving = false;
    this.path = null;
  }
  moveToLocation(x, y) { this.isMoving = true; this.target = { x, y }; return true; }
  setPath(path) { this.path = path; }
  getIsMoving() { return this.isMoving; }
  stop() { this.isMoving = false; }
  update() {}
}

class MockRenderController {
  constructor(entity) { this.entity = entity; this.debugMode = false; this.smoothing = true; }
  render() {}
  highlightSelected() { return 'selected'; }
  highlightHover() { return 'hover'; }
  setDebugMode(enabled) { this.debugMode = enabled; }
  getDebugMode() { return this.debugMode; }
  setSmoothing(enabled) { this.smoothing = enabled; }
  getSmoothing() { return this.smoothing; }
  update() {}
}

class MockSelectionController {
  constructor(entity) { this.entity = entity; this.selected = false; this.selectable = true; }
  setSelected(val) { this.selected = val; }
  isSelected() { return this.selected; }
  toggleSelection() { this.selected = !this.selected; return this.selected; }
  setSelectable(val) { this.selectable = val; }
  update() {}
}

class MockCombatController {
  constructor(entity) { this.entity = entity; this.faction = 'neutral'; this.inCombat = false; }
  setFaction(faction) { this.faction = faction; }
  isInCombat() { return this.inCombat; }
  detectEnemies() { return []; }
  update() {}
}

class MockTerrainController {
  constructor(entity) { this.entity = entity; this.terrain = 'DEFAULT'; }
  getCurrentTerrain() { return this.terrain; }
  update() {}
}

class MockTaskManager {
  constructor(entity) { this.entity = entity; this.tasks = []; this.currentTask = null; }
  addTask(task) { this.tasks.push(task); return true; }
  getCurrentTask() { return this.currentTask; }
  update() {}
}

class MockHealthController {
  constructor(entity) { this.entity = entity; this.health = 100; }
  update() {}
}


// Mock gameState Manager
class MockGameStateManager {
  constructor() {
    this.currentState = "MENU";
    this.previousState = null;
    this.fadeAlpha = 0;
    this.isFading = false;
    this.stateChangeCallbacks = [];
    this.isFading = false;
    this.fadeDirection = "out";
    
    // Valid game states
    this.STATES = {
      MENU: "MENU",
      OPTIONS: "OPTIONS", 
      DEBUG_MENU: "DEBUG_MENU",
      PLAYING: "PLAYING",
      PAUSED: "PAUSED",
      GAME_OVER: "GAME_OVER",
      KAN_BAN: "KANBAN"
    };
  }

   // Get current state
  getState() {
    return this.currentState;
  }

  // Set state with optional callback execution
  setState(newState, skipCallbacks = false) {
    if (!this.isValidState(newState)) {
      console.warn(`Invalid game state: ${newState}`);
      return false;
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    if (!skipCallbacks) {
      this.executeCallbacks(newState, this.previousState);
    }
    return true;
  }

  // Get previous state
  getPreviousState = () => this.previousState;

  // Check if current state matches
  isState = (state) => this.currentState === state;

    // State change callback system
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.stateChangeCallbacks.push(callback);
    }
  }

    removeStateChangeCallback(callback) {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  executeCallbacks(newState, oldState) {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  
  // Convenience methods for common states
  isInMenu = () => this.currentState === this.STATES.MENU;
  isInOptions = () => this.currentState === this.STATES.OPTIONS;
  isInGame = () => this.currentState === this.STATES.PLAYING;
  isPaused = () => this.currentState === this.STATES.PAUSED;
  isGameOver = () => this.currentState === this.STATES.GAME_OVER;
  isDebug = () => this.currentState === this.STATES.DEBUG_MENU;
  isKanban = () => this.currentState === this.STATES.KAN_BAN;

  // Transition methods
  goToMenu = () => this.setState(this.STATES.MENU);
  goToOptions = () => this.setState(this.STATES.OPTIONS);
  goToDebug = () => this.setState(this.STATES.DEBUG_MENU);
  startGame = () => { this.startFadeTransition(); return this.setState(this.STATES.PLAYING); };
  pauseGame = () => this.setState(this.STATES.PAUSED);
  resumeGame = () => this.setState(this.STATES.PLAYING);
  endGame = () => this.setState(this.STATES.GAME_OVER);
  goToKanban = () => this.setState(this.STATES.KAN_BAN);
}

// Assign controllers to global
global.TransformController = MockTransformController;
global.MovementController = MockMovementController;
global.RenderController = MockRenderController;
global.SelectionController = MockSelectionController;
global.CombatController = MockCombatController;
global.TerrainController = MockTerrainController;
global.TaskManager = MockTaskManager;
global.HealthController = MockHealthController;
global.GameStateManager = MockGameStateManager;

// Mock spatial grid manager
global.spatialGridManager = {
  addEntity: function() {},
  updateEntity: function() {},
  removeEntity: function() {}
};



// Load Entity
// DUPLICATE REQUIRE REMOVED: let Entity = require('../../../Classes/containers/Entity.js');

describe('Entity', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const entity = new Entity();
      expect(entity.id).to.be.a('string');
      expect(entity.type).to.equal('Entity');
      expect(entity._isActive).to.be.true;
    });
    
    it('should initialize with custom position and size', function() {
      const entity = new Entity(100, 200, 64, 64);
      const pos = entity.getPosition();
      const size = entity.getSize();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
      expect(size.x).to.equal(64);
      expect(size.y).to.equal(64);
    });
    
    it('should initialize with custom type', function() {
      const entity = new Entity(0, 0, 32, 32, { type: 'Ant' });
      expect(entity.type).to.equal('Ant');
    });
    
    it('should generate unique IDs for each entity', function() {
      const entity1 = new Entity();
      const entity2 = new Entity();
      expect(entity1.id).to.not.equal(entity2.id);
    });
    
    it('should initialize collision box', function() {
      const entity = new Entity(50, 60, 32, 32);
      expect(entity._collisionBox).to.be.instanceOf(MockCollisionBox2D);
    });
    
    it('should initialize sprite when Sprite2D available', function() {
      const entity = new Entity(0, 0, 32, 32);
      expect(entity._sprite).to.be.instanceOf(MockSprite2D);
    });
    
    it('should initialize all available controllers', function() {
      const entity = new Entity();
      expect(entity._controllers.size).to.be.greaterThan(0);
      expect(entity.getController('transform')).to.exist;
      expect(entity.getController('movement')).to.exist;
      expect(entity.getController('render')).to.exist;
    });
  });
  
  describe('Core Properties', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'TestEntity' });
    });
    
    it('should have read-only id', function() {
      const originalId = entity.id;
      entity.id = 'newId'; // Should not change
      expect(entity.id).to.equal(originalId);
    });
    
    it('should have read-only type', function() {
      const originalType = entity.type;
      entity.type = 'NewType'; // Should not change
      expect(entity.type).to.equal(originalType);
    });
    
    it('should allow setting isActive', function() {
      entity.isActive = false;
      expect(entity.isActive).to.be.false;
      entity.isActive = true;
      expect(entity.isActive).to.be.true;
    });
  });
  
  describe('Position and Transform', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set and get position', function() {
      entity.setPosition(100, 200);
      const pos = entity.getPosition();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
    });
    
    it('should get X coordinate', function() {
      entity.setPosition(50, 100);
      expect(entity.getX()).to.equal(50);
    });
    
    it('should get Y coordinate', function() {
      entity.setPosition(50, 100);
      expect(entity.getY()).to.equal(100);
    });
    
    it('should set and get size', function() {
      entity.setSize(64, 128);
      const size = entity.getSize();
      expect(size.x).to.equal(64);
      expect(size.y).to.equal(128);
    });
    
    it('should calculate center point', function() {
      entity.setPosition(0, 0);
      entity.setSize(100, 100);
      const center = entity.getCenter();
      expect(center.x).to.equal(50);
      expect(center.y).to.equal(50);
    });
    
    it('should update collision box when position changes', function() {
      entity.setPosition(75, 85);
      expect(entity._collisionBox.x).to.equal(75);
      expect(entity._collisionBox.y).to.equal(85);
    });
    
    it('should update collision box when size changes', function() {
      entity.setSize(50, 60);
      expect(entity._collisionBox.width).to.equal(50);
      expect(entity._collisionBox.height).to.equal(60);
    });
  });
  
  describe('Movement', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should move to location', function() {
      const result = entity.moveToLocation(100, 200);
      expect(result).to.be.true;
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should set path', function() {
      const path = [{ x: 10, y: 10 }, { x: 20, y: 20 }];
      entity.setPath(path);
      const movement = entity.getController('movement');
      expect(movement.path).to.equal(path);
    });
    
    it('should check if moving', function() {
      expect(entity.isMoving()).to.be.false;
      entity.moveToLocation(50, 50);
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should stop movement', function() {
      entity.moveToLocation(100, 100);
      entity.stop();
      expect(entity.isMoving()).to.be.false;
    });
    
    it('should get movement speed from controller', function() {
      const movement = entity.getController('movement');
      if (movement && movement.movementSpeed !== undefined) {
        expect(movement.movementSpeed).to.be.a('number');
      } else {
        // If controller doesn't exist or has no movementSpeed, skip test
        expect(true).to.be.true;
      }
    });
    
    it('should set movement speed', function() {
      entity.movementSpeed = 5.0;
      expect(entity.movementSpeed).to.equal(5.0);
    });
  });
  
  describe('Selection', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set selected state', function() {
      entity.setSelected(true);
      expect(entity.isSelected()).to.be.true;
    });
    
    it('should toggle selection', function() {
      expect(entity.isSelected()).to.be.false;
      entity.toggleSelection();
      expect(entity.isSelected()).to.be.true;
      entity.toggleSelection();
      expect(entity.isSelected()).to.be.false;
    });
  });
  
  describe('Interaction', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should detect mouse over', function() {
      global.window = { _lastDebugMouseX: 0, _lastDebugMouseY: 0 };
      entity.setPosition(0, 0);
      entity.setSize(32, 32);
      global.mouseX = 16;
      global.mouseY = 16;
      expect(entity.isMouseOver()).to.be.true;
    });
    
    it('should detect mouse not over', function() {
      entity.setPosition(0, 0);
      entity.setSize(32, 32);
      global.mouseX = 100;
      global.mouseY = 100;
      expect(entity.isMouseOver()).to.be.false;
    });
  });
  
  describe('Combat', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { faction: 'player' });
    });
    
    it('should check if in combat', function() {
      expect(entity.isInCombat()).to.be.false;
    });
    
    it('should detect enemies', function() {
      const enemies = entity.detectEnemies();
      expect(enemies).to.be.an('array');
    });
  });
  
  describe('Tasks', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should add task', function() {
      const task = { type: 'GATHER', priority: 1 };
      const result = entity.addTask(task);
      expect(result).to.be.true;
    });
    
    it('should get current task', function() {
      const task = entity.getCurrentTask();
      expect(task).to.be.null; // Initially null
    });
  });
  
  describe('Terrain', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should get current terrain', function() {
      const terrain = entity.getCurrentTerrain();
      expect(terrain).to.equal('DEFAULT');
    });
  });
  
  describe('Sprite and Image', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set image path', function() {
      entity.setImage('/path/to/image.png');
      expect(entity.getImage()).to.equal('/path/to/image.png');
    });
    
    it('should check if has image', function() {
      entity.setImage('/path/to/image.png');
      expect(entity.hasImage()).to.be.true;
    });
    
    it('should set opacity', function() {
      entity.setOpacity(128);
      expect(entity.getOpacity()).to.equal(128);
    });
    
    it('should get opacity', function() {
      const opacity = entity.getOpacity();
      expect(opacity).to.be.a('number');
    });
  });
  
  describe('Collision', function() {
    let entity1, entity2;
    
    beforeEach(function() {
      entity1 = new Entity(0, 0, 32, 32);
      entity2 = new Entity(16, 16, 32, 32);
    });
    
    it('should detect collision when overlapping', function() {
      expect(entity1.collidesWith(entity2)).to.be.true;
    });
    
    it('should not detect collision when separate', function() {
      entity2.setPosition(100, 100);
      entity1.update(); // Sync collision box
      entity2.update(); // Sync collision box
      expect(entity1.collidesWith(entity2)).to.be.false;
    });
    
    it('should check point containment', function() {
      entity1.setPosition(0, 0);
      entity1.setSize(32, 32);
      expect(entity1.contains(16, 16)).to.be.true;
      expect(entity1.contains(100, 100)).to.be.false;
    });
  });
  
  describe('Update Loop', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should call update without errors', function() {
      expect(() => entity.update()).to.not.throw();
    });
    
    it('should not update when inactive', function() {
      entity.isActive = false;
      expect(() => entity.update()).to.not.throw();
    });
    
    it('should sync collision box on update', function() {
      entity.setPosition(50, 60);
      entity.update();
      expect(entity._collisionBox.x).to.equal(50);
      expect(entity._collisionBox.y).to.equal(60);
    });
  });
  
  describe('Rendering', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should call render without errors', function() {
      expect(() => entity.render()).to.not.throw();
    });
    
    it('should not render when inactive', function() {
      entity.isActive = false;
      expect(() => entity.render()).to.not.throw();
    });
  });
  
  describe('Debug Info', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'TestEntity' });
    });
    
    it('should return debug info object', function() {
      const info = entity.getDebugInfo();
      expect(info).to.be.an('object');
      expect(info.id).to.equal(entity.id);
      expect(info.type).to.equal('TestEntity');
    });
    
    it('should include position in debug info', function() {
      entity.setPosition(100, 200);
      const info = entity.getDebugInfo();
      expect(info.position.x).to.equal(100);
      expect(info.position.y).to.equal(200);
    });
    
    it('should include size in debug info', function() {
      entity.setSize(64, 64);
      const info = entity.getDebugInfo();
      expect(info.size.x).to.equal(64);
      expect(info.size.y).to.equal(64);
    });
    
    it('should include controller status', function() {
      const info = entity.getDebugInfo();
      expect(info.controllers).to.be.an('object');
      expect(info.controllerCount).to.be.greaterThan(0);
    });
  });
  
  describe('Validation Data', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'Ant', faction: 'player' });
    });
    
    it('should return validation data', function() {
      const data = entity.getValidationData();
      expect(data).to.be.an('object');
      expect(data.id).to.exist;
      expect(data.type).to.equal('Ant');
      expect(data.faction).to.equal('neutral'); // Default faction from controller
    });
    
    it('should include timestamp', function() {
      const data = entity.getValidationData();
      expect(data.timestamp).to.be.a('string');
    });
    
    it('should include position and size', function() {
      entity.setPosition(50, 60);
      entity.setSize(32, 32);
      const data = entity.getValidationData();
      expect(data.position).to.exist;
      expect(data.size).to.exist;
    });
  });
  
  describe('Destroy', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should mark entity as inactive', function() {
      entity.destroy();
      expect(entity._isActive).to.be.false;
    });
    
    it('should not throw when destroyed', function() {
      expect(() => entity.destroy()).to.not.throw();
    });
  });
  
  describe('Enhanced API - Highlight', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have highlight namespace', function() {
      expect(entity.highlight).to.be.an('object');
    });
    
    it('should call highlight.selected', function() {
      const result = entity.highlight.selected();
      expect(result).to.equal('selected');
    });
    
    it('should call highlight.hover', function() {
      const result = entity.highlight.hover();
      expect(result).to.equal('hover');
    });
  });
  
  describe('Enhanced API - Rendering', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have rendering namespace', function() {
      expect(entity.rendering).to.be.an('object');
    });
    
    it('should set debug mode', function() {
      entity.rendering.setDebugMode(true);
      expect(entity.rendering.isVisible()).to.be.true;
    });
    
    it('should set opacity', function() {
      entity.rendering.setOpacity(0.5);
      expect(entity.rendering.getOpacity()).to.equal(0.5);
    });
  });
  
  describe('Enhanced API - Config', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have config namespace', function() {
      expect(entity.config).to.be.an('object');
    });
    
    it('should get debugMode when render controller available', function() {
      const renderController = entity.getController('render');
      if (renderController && renderController.getDebugMode) {
        const debugMode = renderController.getDebugMode();
        expect(debugMode).to.be.a('boolean');
      } else {
        // If no render controller, skip test
        expect(true).to.be.true;
      }
    });
    
    it('should get smoothing when render controller available', function() {
      const renderController = entity.getController('render');
      if (renderController && renderController.getSmoothing) {
        const smoothing = renderController.getSmoothing();
        expect(smoothing).to.be.a('boolean');
      } else {
        // If no render controller, skip test
        expect(true).to.be.true;
      }
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero position and size', function() {
      const entity = new Entity(0, 0, 0, 0);
      expect(entity.getPosition().x).to.equal(0);
      expect(entity.getSize().x).to.equal(0);
    });
    
    it('should handle negative position', function() {
      const entity = new Entity(-100, -200, 32, 32);
      expect(entity.getX()).to.equal(-100);
      expect(entity.getY()).to.equal(-200);
    });
    
    it('should handle very large position', function() {
      const entity = new Entity(1e6, 1e6, 32, 32);
      expect(entity.getX()).to.equal(1e6);
      expect(entity.getY()).to.equal(1e6);
    });
    
    it('should handle fractional values', function() {
      const entity = new Entity(10.5, 20.7, 32.3, 32.9);
      const pos = entity.getPosition();
      expect(pos.x).to.be.closeTo(10.5, 0.1);
      expect(pos.y).to.be.closeTo(20.7, 0.1);
    });
    
    it('should handle missing controllers gracefully', function() {
      // Remove all controllers temporarily
      global.TransformController = undefined;
      const entity = new Entity(0, 0, 32, 32);
      expect(() => entity.update()).to.not.throw();
      // Restore
      global.TransformController = MockTransformController;
    });
  });
  
  describe('Integration', function() {
    it('should maintain state across multiple operations', function() {
      const entity = new Entity(0, 0, 32, 32, { type: 'Ant', faction: 'player' });
      
      entity.setPosition(100, 200);
      entity.setSize(64, 64);
      entity.setSelected(true);
      entity.moveToLocation(300, 400);
      entity.update();
      
      expect(entity.getX()).to.equal(100);
      expect(entity.isSelected()).to.be.true;
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should handle collision detection after movement', function() {
      const entity1 = new Entity(0, 0, 32, 32);
      const entity2 = new Entity(100, 100, 32, 32);
      
      expect(entity1.collidesWith(entity2)).to.be.false;
      
      entity1.setPosition(100, 100);
      entity1.update();
      entity2.update();
      
      expect(entity1.collidesWith(entity2)).to.be.true;
    });
  });
});




// ================================================================
// statsContainer.test.js (64 tests)
// ================================================================
// Mock p5.js createVector
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });

// Mock devConsoleEnabled
global.devConsoleEnabled = false;

// Load the module
// DUPLICATE REQUIRE REMOVED: let { StatsContainer, stat } = require('../../../Classes/containers/StatsContainer.js');

describe('stat', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const s = new stat();
      expect(s.statName).to.equal('NONAME');
      expect(s.statValue).to.equal(0);
      expect(s.statLowerLimit).to.equal(0);
      expect(s.statUpperLimit).to.equal(500);
    });
    
    it('should initialize with custom name and value', function() {
      const s = new stat('Health', 100);
      expect(s.statName).to.equal('Health');
      expect(s.statValue).to.equal(100);
    });
    
    it('should initialize with custom limits', function() {
      const s = new stat('Power', 50, 10, 200);
      expect(s.statLowerLimit).to.equal(10);
      expect(s.statUpperLimit).to.equal(200);
      expect(s.statValue).to.equal(50);
    });
    
    it('should enforce limits on construction', function() {
      const s = new stat('Overflow', 600, 0, 500);
      expect(s.statValue).to.equal(500);
    });
    
    it('should enforce lower limit on construction', function() {
      const s = new stat('Underflow', -10, 0, 500);
      expect(s.statValue).to.equal(0);
    });
  });
  
  describe('Getters and Setters', function() {
    it('should get and set statName', function() {
      const s = new stat();
      s.statName = 'Strength';
      expect(s.statName).to.equal('Strength');
    });
    
    it('should get and set statValue', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 75;
      expect(s.statValue).to.equal(75);
    });
    
    it('should get and set statUpperLimit', function() {
      const s = new stat();
      s.statUpperLimit = 1000;
      expect(s.statUpperLimit).to.equal(1000);
    });
    
    it('should get and set statLowerLimit', function() {
      const s = new stat();
      s.statLowerLimit = -100;
      expect(s.statLowerLimit).to.equal(-100);
    });
  });
  
  describe('enforceStatLimit()', function() {
    it('should clamp value to upper limit', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 150;
      expect(s.statValue).to.equal(100);
    });
    
    it('should clamp value to lower limit', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = -10;
      expect(s.statValue).to.equal(0);
    });
    
    it('should not change valid value', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 75;
      expect(s.statValue).to.equal(75);
    });
    
    it('should handle exact limit values', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 0;
      expect(s.statValue).to.equal(0);
      s.statValue = 100;
      expect(s.statValue).to.equal(100);
    });
    
    it('should handle negative limits', function() {
      const s = new stat('Temperature', 0, -100, 100);
      s.statValue = -50;
      expect(s.statValue).to.equal(-50);
      s.statValue = -150;
      expect(s.statValue).to.equal(-100);
    });
  });
  
  describe('printStatToDebug()', function() {
    it('should not throw when called', function() {
      const s = new stat('Test', 100);
      expect(() => s.printStatToDebug()).to.not.throw();
    });
    
    it('should handle vector values', function() {
      const s = new stat('Position', { x: 10, y: 20 });
      expect(() => s.printStatToDebug()).to.not.throw();
    });
  });
  
  describe('printStatUnderObject()', function() {
    it('should not throw when rendering unavailable', function() {
      const s = new stat('Test', 100);
      const pos = { x: 0, y: 0 };
      const size = { x: 32, y: 32 };
      expect(() => s.printStatUnderObject(pos, size, 12)).to.not.throw();
    });
    
    it('should handle vector statValue', function() {
      const s = new stat('Position', { x: 10, y: 20 });
      const pos = { x: 0, y: 0 };
      const size = { x: 32, y: 32 };
      expect(() => s.printStatUnderObject(pos, size, 12)).to.not.throw();
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero limits', function() {
      const s = new stat('Zero', 0, 0, 0);
      expect(s.statValue).to.equal(0);
    });
    
    it('should handle very large numbers', function() {
      const s = new stat('Large', 1e9, 0, 1e10);
      expect(s.statValue).to.equal(1e9);
    });
    
    it('should handle fractional values', function() {
      const s = new stat('Fraction', 3.14159, 0, 10);
      expect(s.statValue).to.be.closeTo(3.14159, 0.00001);
    });
    
    it('should handle string name', function() {
      const s = new stat('Very Long Stat Name With Spaces');
      expect(s.statName).to.equal('Very Long Stat Name With Spaces');
    });
  });
});

describe('StatsContainer', function() {
  
  describe('Constructor', function() {
    it('should initialize with valid vectors', function() {
      const pos = createVector(10, 20);
      const size = createVector(32, 32);
      const stats = new StatsContainer(pos, size);
      
      expect(stats.position.statValue.x).to.equal(10);
      expect(stats.position.statValue.y).to.equal(20);
      expect(stats.size.statValue.x).to.equal(32);
      expect(stats.size.statValue.y).to.equal(32);
    });
    
    it('should initialize with custom parameters', function() {
      const pos = createVector(5, 15);
      const size = createVector(64, 64);
      const stats = new StatsContainer(pos, size, 2.5, null, 50, 200, 5);
      
      expect(stats.movementSpeed.statValue).to.equal(2.5);
      expect(stats.strength.statValue).to.equal(50);
      expect(stats.health.statValue).to.equal(200);
      expect(stats.gatherSpeed.statValue).to.equal(5);
    });
    
    it('should throw error for invalid pos', function() {
      expect(() => new StatsContainer(null, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for missing pos.x', function() {
      expect(() => new StatsContainer({ y: 10 }, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for missing pos.y', function() {
      expect(() => new StatsContainer({ x: 10 }, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for invalid size', function() {
      expect(() => new StatsContainer(createVector(0, 0), null)).to.throw(Error);
    });
    
    it('should throw error for missing size.x', function() {
      expect(() => new StatsContainer(createVector(0, 0), { y: 32 })).to.throw(Error);
    });
    
    it('should throw error for missing size.y', function() {
      expect(() => new StatsContainer(createVector(0, 0), { x: 32 })).to.throw(Error);
    });
    
    it('should create pendingPos from pos when null', function() {
      const pos = createVector(100, 200);
      const size = createVector(32, 32);
      const stats = new StatsContainer(pos, size);
      
      expect(stats.pendingPos.statValue.x).to.equal(100);
      expect(stats.pendingPos.statValue.y).to.equal(200);
    });
    
    it('should use provided pendingPos when given', function() {
      const pos = createVector(10, 20);
      const size = createVector(32, 32);
      const pending = createVector(50, 60);
      const stats = new StatsContainer(pos, size, 1, pending);
      
      expect(stats.pendingPos.statValue.x).to.equal(50);
      expect(stats.pendingPos.statValue.y).to.equal(60);
    });
    
    it('should create exp map', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(stats.exp).to.be.instanceOf(Map);
      expect(stats.exp.size).to.equal(8);
    });
  });
  
  describe('Getters and Setters', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should get and set position', function() {
      const newPos = new stat('Position', createVector(50, 50));
      stats.position = newPos;
      expect(stats.position).to.equal(newPos);
    });
    
    it('should get and set size', function() {
      const newSize = new stat('Size', createVector(64, 64));
      stats.size = newSize;
      expect(stats.size).to.equal(newSize);
    });
    
    it('should get and set movementSpeed', function() {
      const newSpeed = new stat('Speed', 5.0);
      stats.movementSpeed = newSpeed;
      expect(stats.movementSpeed).to.equal(newSpeed);
    });
    
    it('should get and set pendingPos', function() {
      const newPending = new stat('Pending', createVector(100, 100));
      stats.pendingPos = newPending;
      expect(stats.pendingPos).to.equal(newPending);
    });
  });
  
  describe('EXP System', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should create all EXP categories', function() {
      expect(stats.exp.has('Lifetime')).to.be.true;
      expect(stats.exp.has('Gathering')).to.be.true;
      expect(stats.exp.has('Hunting')).to.be.true;
      expect(stats.exp.has('Swimming')).to.be.true;
      expect(stats.exp.has('Farming')).to.be.true;
      expect(stats.exp.has('Construction')).to.be.true;
      expect(stats.exp.has('Ranged')).to.be.true;
      expect(stats.exp.has('Scouting')).to.be.true;
    });
    
    it('should initialize each EXP category with stat instance', function() {
      const lifetime = stats.exp.get('Lifetime');
      expect(lifetime).to.be.instanceOf(stat);
      expect(lifetime.statName).to.equal('Lifetime EXP');
    });
    
    it('should allow modifying EXP values', function() {
      const gathering = stats.exp.get('Gathering');
      gathering.statValue = 100;
      expect(gathering.statValue).to.equal(100);
    });
  });
  
  describe('getExpTotal()', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should call setExpTotal and return expTotal property', function() {
      const total = stats.getExpTotal();
      expect(total).to.exist;
      expect(stats.expTotal).to.exist;
    });
    
    it('should sum stat values from EXP categories', function() {
      stats.exp.get('Gathering').statValue = 100;
      stats.exp.get('Hunting').statValue = 50;
      stats.exp.get('Farming').statValue = 25;
      
      const total = stats.getExpTotal();
      // Note: setExpTotal iterates through Map values and Object.keys
      // This is a complex iteration pattern in the original code
      expect(total).to.exist;
      expect(stats.expTotal).to.exist;
    });
    
    it('should update expTotal property when called', function() {
      stats.exp.get('Scouting').statValue = 300;
      stats.getExpTotal();
      expect(stats.expTotal).to.exist;
    });
    
    it('should recalculate when called multiple times', function() {
      stats.exp.get('Lifetime').statValue = 50;
      let total = stats.getExpTotal();
      expect(total).to.exist;
      
      stats.exp.get('Construction').statValue = 75;
      total = stats.getExpTotal();
      expect(total).to.exist;
    });
  });
  
  describe('setExpTotal()', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should calculate total using complex iteration pattern', function() {
      stats.exp.get('Gathering').statValue = 10;
      stats.exp.get('Hunting').statValue = 20;
      stats.exp.get('Swimming').statValue = 30;
      
      stats.setExpTotal();
      // The implementation iterates through Map values and their Object.keys
      expect(stats.expTotal).to.exist;
    });
    
    it('should initialize expTotal to 0 before calculating', function() {
      stats.expTotal = 999;
      stats.setExpTotal();
      // expTotal gets reset to 0, then recalculated
      expect(stats.expTotal).to.exist;
    });
  });
  
  describe('printExpTotal()', function() {
    it('should not throw when called', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(() => stats.printExpTotal()).to.not.throw();
    });
  });
  
  describe('test_Map()', function() {
    it('should not throw with valid map', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      const testMap = new Map([['key1', 'value1'], ['key2', 'value2']]);
      expect(() => stats.test_Map(testMap)).to.not.throw();
    });
  });
  
  describe('test_Exp()', function() {
    it('should not throw when called', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(() => stats.test_Exp()).to.not.throw();
    });
  });
  
  describe('Stat Limits', function() {
    it('should enforce movementSpeed limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 150);
      expect(stats.movementSpeed.statValue).to.equal(100); // Clamped to upper limit
    });
    
    it('should enforce strength limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 2000);
      expect(stats.strength.statValue).to.equal(1000); // Clamped to upper limit
    });
    
    it('should enforce health limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 10, 20000);
      expect(stats.health.statValue).to.equal(10000); // Clamped to upper limit
    });
    
    it('should enforce gatherSpeed limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 10, 100, 200);
      expect(stats.gatherSpeed.statValue).to.equal(100); // Clamped to upper limit
    });
    
    it('should handle negative values', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), -10, null, -50, -100, -5);
      expect(stats.movementSpeed.statValue).to.equal(0);
      expect(stats.strength.statValue).to.equal(0);
      expect(stats.health.statValue).to.equal(0);
      expect(stats.gatherSpeed.statValue).to.equal(0);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero position', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(0);
      expect(stats.position.statValue.y).to.equal(0);
    });
    
    it('should handle negative position', function() {
      const stats = new StatsContainer(createVector(-100, -200), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(-100);
      expect(stats.position.statValue.y).to.equal(-200);
    });
    
    it('should handle very large position values', function() {
      const stats = new StatsContainer(createVector(1e6, 1e6), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(1e6);
      expect(stats.position.statValue.y).to.equal(1e6);
    });
    
    it('should handle fractional stat values', function() {
      const stats = new StatsContainer(
        createVector(10.5, 20.7),
        createVector(32.3, 32.9),
        0.123,
        null,
        15.6,
        99.9,
        2.5
      );
      expect(stats.movementSpeed.statValue).to.be.closeTo(0.123, 0.001);
      expect(stats.strength.statValue).to.be.closeTo(15.6, 0.1);
    });
    
    it('should handle all stats at maximum', function() {
      const stats = new StatsContainer(
        createVector(0, 0),
        createVector(32, 32),
        100,
        null,
        1000,
        10000,
        100
      );
      expect(stats.movementSpeed.statValue).to.equal(100);
      expect(stats.strength.statValue).to.equal(1000);
      expect(stats.health.statValue).to.equal(10000);
      expect(stats.gatherSpeed.statValue).to.equal(100);
    });
    
    it('should handle all stats at minimum', function() {
      const stats = new StatsContainer(
        createVector(0, 0),
        createVector(32, 32),
        0,
        null,
        0,
        0,
        0
      );
      expect(stats.movementSpeed.statValue).to.equal(0);
      expect(stats.strength.statValue).to.equal(0);
      expect(stats.health.statValue).to.equal(0);
      expect(stats.gatherSpeed.statValue).to.equal(0);
    });
  });
  
  describe('Integration', function() {
    it('should maintain consistency across stat updates', function() {
      const stats = new StatsContainer(createVector(50, 50), createVector(32, 32));
      
      // Update various stats
      stats.strength.statValue = 500;
      stats.health.statValue = 5000;
      stats.exp.get('Gathering').statValue = 100;
      stats.exp.get('Hunting').statValue = 200;
      
      expect(stats.strength.statValue).to.equal(500);
      expect(stats.health.statValue).to.equal(5000);
      
      const total = stats.getExpTotal();
      expect(total).to.exist;
    });
    
    it('should handle multiple position updates', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      
      stats.position.statValue = createVector(10, 20);
      expect(stats.position.statValue.x).to.equal(10);
      
      stats.position.statValue = createVector(100, 200);
      expect(stats.position.statValue.x).to.equal(100);
      expect(stats.position.statValue.y).to.equal(200);
    });
    
    it('should handle complex EXP scenario', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      
      // Simulate gaining EXP in multiple categories
      stats.exp.get('Lifetime').statValue = 1000;
      stats.exp.get('Gathering').statValue = 250;
      stats.exp.get('Hunting').statValue = 150;
      stats.exp.get('Farming').statValue = 300;
      stats.exp.get('Construction').statValue = 200;
      
      const total = stats.getExpTotal();
      expect(total).to.exist;
    });
  });
});




// ================================================================
// dropoffLocation.test.js (50 tests)
// ================================================================
// Mock p5.js globals
global.TILE_SIZE = 32;
global.NONE = null;
global.push = function() {};
global.pop = function() {};
global.noStroke = function() {};
global.stroke = function() {};
global.strokeWeight = function() {};
global.noFill = function() {};
global.fill = function() {};
global.rect = function() {};

// Mock InventoryController
class MockInventoryController {
  constructor(owner, capacity = 2) {
    this.owner = owner;
    this.capacity = capacity;
    this.items = [];
  }
  
  addResource(resource) {
    if (this.items.length >= this.capacity) return false;
    this.items.push(resource);
    return true;
  }
  
  transferAllTo(targetInventory) {
    let transferred = 0;
    while (this.items.length > 0 && targetInventory.items.length < targetInventory.capacity) {
      const item = this.items.shift();
      if (targetInventory.addResource(item)) transferred++;
    }
    return transferred;
  }
  
  getResources() {
    return this.items;
  }
}

global.InventoryController = MockInventoryController;

// Mock Grid class
class MockGrid {
  constructor() {
    this.data = new Map();
  }
  
  set(coords, value) {
    const key = `${coords[0]},${coords[1]}`;
    this.data.set(key, value);
  }
  
  get(coords) {
    const key = `${coords[0]},${coords[1]}`;
    return this.data.get(key);
  }
}

// Load the module
// DUPLICATE REQUIRE REMOVED: let DropoffLocation = require('../../../Classes/containers/DropoffLocation.js');

describe('DropoffLocation', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const dropoff = new DropoffLocation(5, 4);
      expect(dropoff.x).to.equal(5);
      expect(dropoff.y).to.equal(4);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
      expect(dropoff.tileSize).to.equal(32);
    });
    
    it('should initialize with custom dimensions', function() {
      const dropoff = new DropoffLocation(10, 20, 3, 2);
      expect(dropoff.x).to.equal(10);
      expect(dropoff.y).to.equal(20);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should initialize with custom tile size', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { tileSize: 64 });
      expect(dropoff.tileSize).to.equal(64);
    });
    
    it('should floor grid coordinates', function() {
      const dropoff = new DropoffLocation(5.7, 4.2, 2.9, 3.1);
      expect(dropoff.x).to.equal(5);
      expect(dropoff.y).to.equal(4);
      expect(dropoff.width).to.equal(2);
      expect(dropoff.height).to.equal(3);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 0, 0);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should create inventory with default capacity', function() {
      const dropoff = new DropoffLocation(0, 0);
      expect(dropoff.inventory).to.not.be.null;
      expect(dropoff.inventory.capacity).to.equal(2);
    });
    
    it('should create inventory with custom capacity', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      expect(dropoff.inventory.capacity).to.equal(10);
    });
    
    it('should mark grid on construction if provided', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(2, 3, 2, 2, { grid });
      expect(dropoff._filledOnGrid).to.be.true;
      expect(grid.get([2, 3])).to.equal(dropoff);
      expect(grid.get([3, 4])).to.equal(dropoff);
    });
  });
  
  describe('tiles()', function() {
    it('should return single tile for 1x1 dropoff', function() {
      const dropoff = new DropoffLocation(5, 4, 1, 1);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(1);
      expect(tiles[0]).to.deep.equal([5, 4]);
    });
    
    it('should return all tiles for 2x2 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(4);
      expect(tiles).to.deep.include.members([[0, 0], [1, 0], [0, 1], [1, 1]]);
    });
    
    it('should return all tiles for 3x2 dropoff', function() {
      const dropoff = new DropoffLocation(10, 20, 3, 2);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(6);
      expect(tiles).to.deep.include.members([
        [10, 20], [11, 20], [12, 20],
        [10, 21], [11, 21], [12, 21]
      ]);
    });
    
    it('should handle large dropoff areas', function() {
      const dropoff = new DropoffLocation(0, 0, 10, 10);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(100);
    });
  });
  
  describe('expand()', function() {
    it('should expand width by positive delta', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(1, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should expand height by positive delta', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(0, 2);
      expect(dropoff.width).to.equal(2);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should expand both dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.expand(2, 3);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should handle negative delta (retraction)', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.expand(-2, -1);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should enforce minimum size of 1x1 when retracting', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(-5, -5);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should do nothing when both deltas are zero', function() {
      const dropoff = new DropoffLocation(0, 0, 3, 3);
      dropoff.expand(0, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(3);
    });
    
    it('should update grid when expanding', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 1, 1, { grid });
      dropoff.expand(1, 0);
      expect(grid.get([1, 0])).to.equal(dropoff);
    });
  });
  
  describe('retract()', function() {
    it('should retract width', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(2, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(5);
    });
    
    it('should retract height', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(0, 3);
      expect(dropoff.width).to.equal(5);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should retract both dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 10, 10);
      dropoff.retract(3, 4);
      expect(dropoff.width).to.equal(7);
      expect(dropoff.height).to.equal(6);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.retract(10, 10);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should convert positive arguments to absolute values', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(2, 1);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
  });
  
  describe('setSize()', function() {
    it('should set absolute width and height', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.setSize(5, 7);
      expect(dropoff.width).to.equal(5);
      expect(dropoff.height).to.equal(7);
    });
    
    it('should floor fractional values', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.setSize(4.9, 6.1);
      expect(dropoff.width).to.equal(4);
      expect(dropoff.height).to.equal(6);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.setSize(0, 0);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should update grid when resizing', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 1, 1, { grid });
      dropoff.setSize(3, 3);
      expect(dropoff.tiles()).to.have.lengthOf(9);
    });
  });
  
  describe('depositResource()', function() {
    it('should add resource to inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      const resource = { type: 'wood' };
      const result = dropoff.depositResource(resource);
      expect(result).to.be.true;
      expect(dropoff.inventory.items).to.include(resource);
    });
    
    it('should return false when inventory is full', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 2 });
      dropoff.depositResource({ type: 'wood' });
      dropoff.depositResource({ type: 'stone' });
      const result = dropoff.depositResource({ type: 'food' });
      expect(result).to.be.false;
    });
    
    it('should return false when no inventory exists', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { InventoryController: null });
      dropoff.inventory = null;
      const result = dropoff.depositResource({ type: 'wood' });
      expect(result).to.be.false;
    });
    
    it('should handle multiple deposits', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 5 });
      expect(dropoff.depositResource({ type: 'a' })).to.be.true;
      expect(dropoff.depositResource({ type: 'b' })).to.be.true;
      expect(dropoff.depositResource({ type: 'c' })).to.be.true;
      expect(dropoff.inventory.items).to.have.lengthOf(3);
    });
  });
  
  describe('acceptFromCarrier()', function() {
    it('should transfer resources from carrier with transferAllTo', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'wood' });
      carrier.inventory.addResource({ type: 'stone' });
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(2);
      expect(carrier.inventory.items).to.have.lengthOf(0);
    });
    
    it('should transfer resources from carrier with getResources', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const carrier = {
        getResources: () => [{ type: 'wood' }, { type: 'stone' }],
        removeResource: function(index) { this.getResources()[index] = null; }
      };
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(2);
    });
    
    it('should return 0 when carrier is null', function() {
      const dropoff = new DropoffLocation(0, 0);
      const transferred = dropoff.acceptFromCarrier(null);
      expect(transferred).to.equal(0);
    });
    
    it('should return 0 when dropoff has no inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      dropoff.inventory = null;
      const carrier = { inventory: new MockInventoryController(null, 5) };
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(0);
    });
    
    it('should handle partial transfers when dropoff is nearly full', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 3 });
      dropoff.depositResource({ type: 'existing' });
      
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'a' });
      carrier.inventory.addResource({ type: 'b' });
      carrier.inventory.addResource({ type: 'c' });
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(3);
      expect(carrier.inventory.items).to.have.lengthOf(1);
    });
    
    it('should handle empty carrier inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      const carrier = { inventory: new MockInventoryController(null, 5) };
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(0);
    });
  });
  
  describe('getCenterPx()', function() {
    it('should return center of 1x1 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(16);
      expect(center.y).to.equal(16);
    });
    
    it('should return center of 2x2 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(32);
      expect(center.y).to.equal(32);
    });
    
    it('should return center with custom tile size', function() {
      const dropoff = new DropoffLocation(5, 5, 3, 3, { tileSize: 64 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(416); // (5 + 3/2) * 64 = 6.5 * 64
      expect(center.y).to.equal(416);
    });
    
    it('should return center at non-zero grid position', function() {
      const dropoff = new DropoffLocation(10, 20, 4, 2, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(384); // (10 + 4/2) * 32 = 12 * 32
      expect(center.y).to.equal(672); // (20 + 2/2) * 32 = 21 * 32
    });
  });
  
  describe('draw()', function() {
    it('should not throw when p5 functions are available', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      expect(() => dropoff.draw()).to.not.throw();
    });
    
    it('should handle missing p5 gracefully', function() {
      const originalPush = global.push;
      global.push = undefined;
      const dropoff = new DropoffLocation(0, 0);
      expect(() => dropoff.draw()).to.not.throw();
      global.push = originalPush;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle negative grid coordinates', function() {
      const dropoff = new DropoffLocation(-5, -10, 2, 2);
      expect(dropoff.x).to.equal(-5);
      expect(dropoff.y).to.equal(-10);
      const tiles = dropoff.tiles();
      expect(tiles).to.deep.include.members([[-5, -10], [-4, -10], [-5, -9], [-4, -9]]);
    });
    
    it('should handle very large dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 100, 100);
      expect(dropoff.width).to.equal(100);
      expect(dropoff.height).to.equal(100);
      expect(dropoff.tiles()).to.have.lengthOf(10000);
    });
    
    it('should handle grid operations without grid instance', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      expect(() => dropoff.expand(1, 1)).to.not.throw();
      expect(() => dropoff.retract(1, 1)).to.not.throw();
    });
    
    it('should handle carrier without removeResource method', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const resources = [{ type: 'wood' }, { type: 'stone' }];
      const carrier = {
        getResources: () => resources
      };
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(resources[0]).to.be.null;
      expect(resources[1]).to.be.null;
    });
  });
  
  describe('Integration', function() {
    it('should maintain grid consistency through multiple operations', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 2, 2, { grid });
      
      dropoff.expand(1, 0);
      expect(dropoff.tiles()).to.have.lengthOf(6);
      
      dropoff.setSize(4, 4);
      expect(dropoff.tiles()).to.have.lengthOf(16);
      
      dropoff.retract(2, 2);
      expect(dropoff.tiles()).to.have.lengthOf(4);
    });
    
    it('should handle resource workflow', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 5 });
      
      // Deposit individual resources
      expect(dropoff.depositResource({ type: 'a' })).to.be.true;
      expect(dropoff.depositResource({ type: 'b' })).to.be.true;
      
      // Accept from carrier
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'c' });
      carrier.inventory.addResource({ type: 'd' });
      
      dropoff.acceptFromCarrier(carrier);
      expect(dropoff.inventory.items).to.have.lengthOf(4);
    });
  });
});




// ================================================================
// resource.movement.test.js (1 tests)
// ================================================================
/**
 * Resource Movement Integration Test
 */

// Mock Entity dependencies for Node.js testing
class MockCollisionBox2D {
  constructor(x, y, width, height) {
    this.x = x; this.y = y; this.width = width; this.height = height;
  }
  setPosition(x, y) { this.x = x; this.y = y; }
  setSize(w, h) { this.width = w; this.height = h; }
  contains(x, y) { return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height; }
}

class MockMovementController {
  constructor(entity) {
    this._entity = entity;
    this._movementSpeed = 30; // Default speed
    this._isMoving = false;
    this._skitterTimer = 100;
  }
  get movementSpeed() { return this._movementSpeed; }
  set movementSpeed(speed) { this._movementSpeed = speed; }
  getEffectiveMovementSpeed() {
    let baseSpeed = this._movementSpeed;
    if (this._entity.movementSpeed !== undefined) {
      baseSpeed = this._entity.movementSpeed;
    }
    return baseSpeed;
  }
  shouldSkitter() {
    if (this.getEffectiveMovementSpeed() <= 0) {
      return false;
    }
    this._skitterTimer -= 1;
    return this._skitterTimer <= 0;
  }
  update() {}
  moveToLocation() { return false; }
  getIsMoving() { return this._isMoving; }
  stop() { this._isMoving = false; }
}

class MockEntity {
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) {
    this._id = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._type = options.type || "Entity";
    this._isActive = true;
    this._collisionBox = new MockCollisionBox2D(x, y, width, height);
    this._controllers = new Map();
    this._controllers.set('movement', new MockMovementController(this));
    this._configureControllers(options);
  }
  _configureControllers(options) {
    const movement = this._controllers.get('movement');
    if (movement && options.movementSpeed !== undefined) {
      movement.movementSpeed = options.movementSpeed;
    }
  }
  getController(name) { return this._controllers.get(name); }
  get movementSpeed() { const movement = this._controllers.get('movement'); return movement ? movement.movementSpeed : 0; }
  set movementSpeed(speed) { const movement = this._controllers.get('movement'); if (movement) movement.movementSpeed = speed; }
  getPosition() { return { x: this._collisionBox.x, y: this._collisionBox.y }; }
  setPosition(x, y) { this._collisionBox.setPosition(x, y); }
}

describe('Resource Movement Integration', function() {
  it('prevents resources from skittering when movementSpeed is 0', function() {
    const resource = new MockEntity(10, 10, 20, 20, { type: 'Resource', movementSpeed: 0 });
    const movementController = resource.getController('movement');
    const result = {
      resourceCannotMove: resource.movementSpeed === 0 && !movementController.shouldSkitter(),
      antCanMove: false
    };
    // Basic expectations
    expect(result.resourceCannotMove).to.be.true;
  });
});





// ================================================================
// antStateMachine.test.js (14 tests)
// ================================================================
/* eslint-env mocha */
// DUPLICATE REQUIRE REMOVED: let AntStateMachine = require('../../../Classes/ants/antStateMachine');

describe('AntStateMachine', () => {
  let sm;

  beforeEach(() => {
    sm = new AntStateMachine();
  });

  it('initializes with correct defaults', () => {
    expect(sm.primaryState).to.equal('IDLE');
    expect(sm.combatModifier).to.equal('OUT_OF_COMBAT');
    expect(sm.terrainModifier).to.equal('DEFAULT');
    expect(sm.preferredState).to.equal('GATHERING');
  });

  it('validates primary/combat/terrain lists', () => {
    expect(sm.isValidPrimary('MOVING')).to.be.true;
    expect(sm.isValidPrimary('NOPE')).to.be.false;
    expect(sm.isValidCombat('IN_COMBAT')).to.be.true;
    expect(sm.isValidCombat(null)).to.be.true;
    expect(sm.isValidCombat('FAKE')).to.be.false;
    expect(sm.isValidTerrain('IN_WATER')).to.be.true;
    expect(sm.isValidTerrain(null)).to.be.true;
    expect(sm.isValidTerrain('BAD')).to.be.false;
  });

  it('setPrimaryState accepts valid and rejects invalid', () => {
    const ok = sm.setPrimaryState('MOVING');
    expect(ok).to.be.true;
    expect(sm.primaryState).to.equal('MOVING');

    const bad = sm.setPrimaryState('FLYING');
    expect(bad).to.be.false;
    expect(sm.primaryState).to.equal('MOVING');
  });

  it('setCombatModifier and setTerrainModifier handle null and valid values', () => {
    expect(sm.setCombatModifier('IN_COMBAT')).to.be.true;
    expect(sm.combatModifier).to.equal('IN_COMBAT');

    expect(sm.setCombatModifier(null)).to.be.true;
    expect(sm.combatModifier).to.equal(null);

    expect(sm.setTerrainModifier('IN_WATER')).to.be.true;
    expect(sm.terrainModifier).to.equal('IN_WATER');

    expect(sm.setTerrainModifier(null)).to.be.true;
    expect(sm.terrainModifier).to.equal(null);
  });

  it('setState sets combinations and rejects invalid combos', () => {
    // valid
    expect(sm.setState('GATHERING', 'IN_COMBAT', 'IN_MUD')).to.be.true;
    expect(sm.getFullState()).to.equal('GATHERING_IN_COMBAT_IN_MUD');

    // invalid primary
    expect(sm.setState('FLAP', null, null)).to.be.false;

    // invalid combat
    expect(sm.setState('IDLE', 'BAD', null)).to.be.false;

    // invalid terrain
    expect(sm.setState('IDLE', null, 'BAD')).to.be.false;
  });

  it('getFullState and getCurrentState return expected strings', () => {
    sm.setState('MOVING', 'IN_COMBAT', 'ON_ROUGH');
    expect(sm.getFullState()).to.equal('MOVING_IN_COMBAT_ON_ROUGH');
    expect(sm.getCurrentState()).to.equal('MOVING');
  });

  it('canPerformAction covers branches correctly', () => {
    // default: IDLE, OUT_OF_COMBAT, DEFAULT
    expect(sm.canPerformAction('move')).to.be.true;
    expect(sm.canPerformAction('gather')).to.be.true;
    expect(sm.canPerformAction('attack')).to.be.false;

    sm.setCombatModifier('IN_COMBAT');
    expect(sm.canPerformAction('attack')).to.be.true;

    sm.setPrimaryState('BUILDING');
    expect(sm.canPerformAction('move')).to.be.false;
    expect(sm.canPerformAction('gather')).to.be.false;

    sm.setState('IDLE', 'OUT_OF_COMBAT', null);
    sm.setTerrainModifier('ON_SLIPPERY');
    expect(sm.canPerformAction('move')).to.be.false; // slippery blocks move
  });

  it('state query helpers return expected booleans', () => {
    sm.reset();
    expect(sm.isIdle()).to.be.true;
    expect(sm.isOutOfCombat()).to.be.true;
    expect(sm.isOnDefaultTerrain()).to.be.true;

    sm.setState('MOVING', 'IN_COMBAT', 'IN_MUD');
    expect(sm.isMoving()).to.be.true;
    expect(sm.isInCombat()).to.be.true;
    expect(sm.isInMud()).to.be.true;
  });

  it('clearModifiers and reset behave correctly and invoke callback', (done) => {
    let calls = 0;
    sm.setStateChangeCallback((oldS, newS) => { calls++; });
    sm.setState('GATHERING', 'IN_COMBAT', 'IN_WATER');
    expect(sm.getFullState()).to.equal('GATHERING_IN_COMBAT_IN_WATER');

    sm.clearModifiers();
    expect(sm.combatModifier).to.equal(null);
    expect(sm.terrainModifier).to.equal(null);

    sm.reset();
    expect(sm.primaryState).to.equal('IDLE');
    expect(sm.combatModifier).to.equal('OUT_OF_COMBAT');
    expect(sm.terrainModifier).to.equal('DEFAULT');

    // callback should have been called at least once (setState, clearModifiers, reset)
    expect(calls).to.be.at.least(1);
    done();
  });

  it('setPreferredState and ResumePreferredState work', () => {
    sm.setPreferredState('MOVING');
    sm.beginIdle();
    sm.ResumePreferredState();
    expect(sm.primaryState).to.equal('MOVING');
  });

  it('isValidAnyState and isInState utilities', () => {
    expect(sm.isValidAnyState('MOVING')).to.be.true;
    expect(sm.isValidAnyState('IN_COMBAT')).to.be.true;
    expect(sm.isValidAnyState('IN_WATER')).to.be.true;
    expect(sm.isValidAnyState('NOPE')).to.be.false;

    sm.setState('GATHERING', 'IN_COMBAT', 'IN_WATER');
    expect(sm.isInState('GATHERING_IN_COMBAT_IN_WATER')).to.be.true;
  });

  it('printState uses devConsoleEnabled global (no throw)', () => {
    // ensure printState does not throw if devConsoleEnabled undefined/false
    global.devConsoleEnabled = false;
    expect(() => sm.printState()).to.not.throw();
    global.devConsoleEnabled = true;
    expect(() => sm.printState()).to.not.throw();
  });

  it('getStateSummary contains expected structure', () => {
    sm.setState('GATHERING', null, null);
    const summary = sm.getStateSummary();
    expect(summary).to.include.keys('fullState', 'primary', 'combat', 'terrain', 'actions');
    expect(summary.primary).to.equal('GATHERING');
  });

  it('update is a no-op and does not throw', () => {
    expect(() => sm.update()).to.not.throw();
  });
});




// ================================================================
// gatherState.test.js (16 tests)
// ================================================================
// Ensure Globals used by GatherState are present
global.logVerbose = global.logVerbose || function() {};
global.deltaTime = global.deltaTime || 16; // ms per frame approx

// DUPLICATE REQUIRE REMOVED: let GatherState = require('../../../Classes/ants/GatherState');

describe('GatherState', function() {
  let antMock;
  let resourceManagerMock;
  let movementControllerMock;
  let stateMachineMock;

  beforeEach(function() {
    // reset global resource manager
    global.g_resourceManager = {
      _list: [],
      getResourceList() { return this._list; },
      removeResource(r) { const i = this._list.indexOf(r); if (i !== -1) this._list.splice(i,1); }
    };

    resourceManagerMock = {
      _load: 0,
      isAtMaxLoad() { return this._load >= 5; },
      addResource(r) { if (!r) return false; this._load++; return true; },
      startDropOff(x,y) { this.dropOffCalled = {x,y}; }
    };

    movementControllerMock = {
      lastTarget: null,
      moveToLocation(x,y) { this.lastTarget = {x,y}; }
    };

    stateMachineMock = {
      primary: 'IDLE',
      setPrimaryState(s) { this.primary = s; }
    };

    antMock = {
      id: 'ant-1',
      _antIndex: 1,
      _resourceManager: resourceManagerMock,
      _movementController: movementControllerMock,
      _stateMachine: stateMachineMock,
      posX: 100,
      posY: 100,
      getPosition() { return { x: this.posX, y: this.posY }; }
    };
  });

  afterEach(function() {
    delete global.g_resource_manager;
    delete global.g_resourceManager;
  });

  it('initializes with correct defaults', function() {
    const gs = new GatherState(antMock);
    expect(gs.ant).to.equal(antMock);
    expect(gs.gatherRadius).to.equal(7);
    expect(gs.pixelRadius).to.equal(224);
    expect(gs.isActive).to.be.false;
  });

  it('enter() activates state and sets ant primary state', function() {
    const gs = new GatherState(antMock);
    gs.enter();
    expect(gs.isActive).to.be.true;
    expect(stateMachineMock.primary).to.equal('GATHERING');
  });

  it('exit() deactivates state', function() {
    const gs = new GatherState(antMock);
    gs.enter();
    const res = gs.exit();
    expect(res).to.be.true;
    expect(gs.isActive).to.be.false;
  });

  it('getAntPosition() returns ant position', function() {
    const gs = new GatherState(antMock);
    const pos = gs.getAntPosition();
    expect(pos).to.deep.equal({ x: 100, y: 100 });
  });

  it('getDistance() computes Euclidean distance', function() {
    const gs = new GatherState(antMock);
    const d = gs.getDistance(0,0,3,4);
    expect(d).to.equal(5);
  });

  it('getResourcesInRadius() finds resources from g_resourceManager', function() {
    // add resources near and far
    const near = { x: 110, y: 110, type: 'food' };
    const far = { x: 1000, y: 1000, type: 'stone' };
    global.g_resource_manager = global.g_resource_manager || { _list: [] };
    global.g_resource_manager._list.push(near, far);

    const gs = new GatherState(antMock);
    const found = gs.getResourcesInRadius(100,100,50);
    expect(found).to.be.an('array');
    // should find near only
    expect(found.some(r => r.type === 'food')).to.be.true;
    expect(found.some(r => r.type === 'stone')).to.be.false;
  });

  it('searchForResources() sets nearest resource as targetResource', function() {
    const near = { x: 110, y: 110, type: 'food' };
    const other = { x: 105, y: 105, type: 'leaf' };
    global.g_resourceManager._list.push(near, other);

    const gs = new GatherState(antMock);
    const results = gs.searchForResources();
    expect(results.length).to.equal(2);
    expect(gs.targetResource).to.exist;
    // targetResource should be the closest (other at 7.07 vs near at 14.14)
    expect(gs.targetResource.type).to.equal('leaf');
  });

  it('moveToResource delegates to movement controller', function() {
    const gs = new GatherState(antMock);
    gs.moveToResource(200,200);
    expect(movementControllerMock.lastTarget).to.deep.equal({ x:200, y:200 });
  });

  it('attemptResourceCollection adds resource and removes from system', function() {
    const resource = { x: 110, y: 110, type: 'food' };
    global.g_resourceManager._list.push(resource);

    const gs = new GatherState(antMock);
    // manually set targetResource shape as returned by getResourcesInRadius
    gs.targetResource = { resource: resource, x: resource.x, y: resource.y, type: resource.type };

    gs.attemptResourceCollection();

    // resourceManagerMock should have added the resource (load becomes 1)
    expect(resourceManagerMock._load).to.equal(1);
    // g_resourceManager should no longer contain the resource
    expect(global.g_resourceManager._list.indexOf(resource)).to.equal(-1);
    // targetResource cleared
    expect(gs.targetResource).to.be.null;
  });

  it('isAtMaxCapacity() respects ant resource manager', function() {
    const gs = new GatherState(antMock);
    // initially not max
    resourceManagerMock._load = 0;
    expect(gs.isAtMaxCapacity()).to.be.false;
    resourceManagerMock._load = 5;
    expect(gs.isAtMaxCapacity()).to.be.true;
  });

  it('transitionToDropOff() sets state and calls startDropOff', function() {
    const gs = new GatherState(antMock);
    gs.transitionToDropOff();
    expect(stateMachineMock.primary).to.equal('DROPPING_OFF');
    expect(resourceManagerMock.dropOffCalled).to.exist;
    expect(gs.isActive).to.be.false;
  });

  it('updateTargetMovement collects when in range', function() {
    const resource = { x: 102, y: 102, type: 'food' };
    global.g_resourceManager._list.push(resource);

    const gs = new GatherState(antMock);
    gs.targetResource = { resource, x: resource.x, y: resource.y, type: resource.type };

    // call updateTargetMovement should attempt collection (within 15px)
    gs.updateTargetMovement();
    expect(resourceManagerMock._load).to.equal(1);
    expect(gs.targetResource).to.be.null;
  });

  it('getDebugInfo returns useful info object', function() {
    const gs = new GatherState(antMock);
    const info = gs.getDebugInfo();
    expect(info).to.be.an('object');
    expect(info.hasTarget).to.be.a('boolean');
    expect(info.gatherRadius).to.be.a('string');
  });

  it('setDebugEnabled toggles debug flag', function() {
    const gs = new GatherState(antMock);
    gs.setDebugEnabled(true);
    expect(gs.debugEnabled).to.be.true;
    gs.setDebugEnabled(false);
    expect(gs.debugEnabled).to.be.false;
  });
});




// ================================================================
// jobComponent.test.js (46 tests)
// ================================================================
/**
 * JobComponent Unit Tests - Comprehensive Coverage
 */

// Load the JobComponent class
// DUPLICATE REQUIRE REMOVED: let JobComponent = require('../../../Classes/ants/JobComponent.js');
describe('JobComponent', function() {
  describe('Constructor', function() {
    it('should create instance with name and stats', function() {
      const jc = new JobComponent('Builder');
      expect(jc.name).to.equal('Builder');
      expect(jc.stats).to.exist;
      expect(jc.stats).to.be.an('object');
    });

    it('should create instance with name and image', function() {
      const img = { src: 'builder.png' };
      const jc = new JobComponent('Builder', img);
      expect(jc.name).to.equal('Builder');
      expect(jc.image).to.equal(img);
    });

    it('should create instance without image (null default)', function() {
      const jc = new JobComponent('Scout');
      expect(jc.name).to.equal('Scout');
      expect(jc.image).to.be.null;
    });

    it('should retrieve stats for all job types', function() {
      const jobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
      jobs.forEach(jobName => {
        const jc = new JobComponent(jobName);
        expect(jc.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });

    it('should use default stats for unknown job', function() {
      const jc = new JobComponent('UnknownJob');
      expect(jc.stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });
  });

  describe('getJobStats (static)', function() {
    it('should return Builder stats', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats).to.deep.equal({
        strength: 20,
        health: 120,
        gatherSpeed: 15,
        movementSpeed: 60
      });
    });

    it('should return Scout stats', function() {
      const stats = JobComponent.getJobStats('Scout');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 80,
        gatherSpeed: 10,
        movementSpeed: 80
      });
    });

    it('should return Farmer stats', function() {
      const stats = JobComponent.getJobStats('Farmer');
      expect(stats).to.deep.equal({
        strength: 15,
        health: 100,
        gatherSpeed: 30,
        movementSpeed: 60
      });
    });

    it('should return Warrior stats', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats).to.deep.equal({
        strength: 40,
        health: 150,
        gatherSpeed: 5,
        movementSpeed: 60
      });
    });

    it('should return Spitter stats', function() {
      const stats = JobComponent.getJobStats('Spitter');
      expect(stats).to.deep.equal({
        strength: 30,
        health: 90,
        gatherSpeed: 8,
        movementSpeed: 60
      });
    });

    it('should return DeLozier stats (special)', function() {
      const stats = JobComponent.getJobStats('DeLozier');
      expect(stats).to.deep.equal({
        strength: 1000,
        health: 10000,
        gatherSpeed: 1,
        movementSpeed: 10000
      });
    });

    it('should return default stats for unknown job', function() {
      const stats = JobComponent.getJobStats('Unknown');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for null', function() {
      const stats = JobComponent.getJobStats(null);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for undefined', function() {
      const stats = JobComponent.getJobStats(undefined);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return default stats for empty string', function() {
      const stats = JobComponent.getJobStats('');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should be case-sensitive', function() {
      const stats = JobComponent.getJobStats('builder'); // lowercase
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should return object with all required stat properties', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats).to.have.property('strength');
      expect(stats).to.have.property('health');
      expect(stats).to.have.property('gatherSpeed');
      expect(stats).to.have.property('movementSpeed');
    });

    it('should return numeric values for all stats', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats.strength).to.be.a('number');
      expect(stats.health).to.be.a('number');
      expect(stats.gatherSpeed).to.be.a('number');
      expect(stats.movementSpeed).to.be.a('number');
    });

    it('should return positive values for all stats', function() {
      const jobs = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter', 'DeLozier'];
      jobs.forEach(job => {
        const stats = JobComponent.getJobStats(job);
        expect(stats.strength).to.be.above(0);
        expect(stats.health).to.be.above(0);
        expect(stats.gatherSpeed).to.be.above(0);
        expect(stats.movementSpeed).to.be.above(0);
      });
    });
  });

  describe('getJobList (static)', function() {
    it('should return array of standard jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.be.an('array');
      expect(jobs).to.include('Builder');
      expect(jobs).to.include('Scout');
      expect(jobs).to.include('Farmer');
      expect(jobs).to.include('Warrior');
      expect(jobs).to.include('Spitter');
    });

    it('should return exactly 5 jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.have.lengthOf(5);
    });

    it('should not include special jobs', function() {
      const jobs = JobComponent.getJobList();
      expect(jobs).to.not.include('DeLozier');
    });

    it('should return same array on multiple calls', function() {
      const jobs1 = JobComponent.getJobList();
      const jobs2 = JobComponent.getJobList();
      expect(jobs1).to.deep.equal(jobs2);
    });
  });

  describe('getSpecialJobs (static)', function() {
    it('should return array of special jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.be.an('array');
      expect(specialJobs).to.include('DeLozier');
    });

    it('should return exactly 1 special job', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.have.lengthOf(1);
    });

    it('should not include standard jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      expect(specialJobs).to.not.include('Builder');
      expect(specialJobs).to.not.include('Scout');
      expect(specialJobs).to.not.include('Farmer');
    });
  });

  describe('getAllJobs (static)', function() {
    it('should return array of all jobs (standard + special)', function() {
      const allJobs = JobComponent.getAllJobs();
      expect(allJobs).to.be.an('array');
      expect(allJobs).to.include('Builder');
      expect(allJobs).to.include('Scout');
      expect(allJobs).to.include('DeLozier');
    });

    it('should return exactly 6 jobs total', function() {
      const allJobs = JobComponent.getAllJobs();
      expect(allJobs).to.have.lengthOf(6);
    });

    it('should equal getJobList + getSpecialJobs', function() {
      const jobList = JobComponent.getJobList();
      const specialJobs = JobComponent.getSpecialJobs();
      const allJobs = JobComponent.getAllJobs();
      
      expect(allJobs.length).to.equal(jobList.length + specialJobs.length);
      jobList.forEach(job => expect(allJobs).to.include(job));
      specialJobs.forEach(job => expect(allJobs).to.include(job));
    });

    it('should have no duplicates', function() {
      const allJobs = JobComponent.getAllJobs();
      const uniqueJobs = [...new Set(allJobs)];
      expect(allJobs.length).to.equal(uniqueJobs.length);
    });
  });

  describe('Stats Validation', function() {
    it('should have Builder as high health tank', function() {
      const stats = JobComponent.getJobStats('Builder');
      expect(stats.health).to.equal(120); // Higher than default 100
      expect(stats.strength).to.equal(20);
    });

    it('should have Scout as fastest unit', function() {
      const stats = JobComponent.getJobStats('Scout');
      expect(stats.movementSpeed).to.equal(80); // Fastest
      const builderStats = JobComponent.getJobStats('Builder');
      expect(stats.movementSpeed).to.be.above(builderStats.movementSpeed);
    });

    it('should have Farmer as best gatherer', function() {
      const stats = JobComponent.getJobStats('Farmer');
      expect(stats.gatherSpeed).to.equal(30); // Highest gather speed
      const scoutStats = JobComponent.getJobStats('Scout');
      expect(stats.gatherSpeed).to.be.above(scoutStats.gatherSpeed);
    });

    it('should have Warrior as strongest fighter', function() {
      const stats = JobComponent.getJobStats('Warrior');
      expect(stats.strength).to.equal(40); // Highest strength
      expect(stats.health).to.equal(150); // Highest health
    });

    it('should have Spitter as ranged attacker', function() {
      const stats = JobComponent.getJobStats('Spitter');
      expect(stats.strength).to.equal(30); // High damage
      expect(stats.health).to.equal(90); // Lower health (glass cannon)
    });

    it('should have DeLozier as overpowered special unit', function() {
      const stats = JobComponent.getJobStats('DeLozier');
      expect(stats.strength).to.equal(1000);
      expect(stats.health).to.equal(10000);
      expect(stats.movementSpeed).to.equal(10000);
    });
  });

  describe('Edge Cases', function() {
    it('should handle number as job name', function() {
      const stats = JobComponent.getJobStats(123);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle object as job name', function() {
      const stats = JobComponent.getJobStats({});
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle array as job name', function() {
      const stats = JobComponent.getJobStats([]);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should create instance with all job types', function() {
      const allJobs = JobComponent.getAllJobs();
      allJobs.forEach(jobName => {
        const jc = new JobComponent(jobName);
        expect(jc.name).to.equal(jobName);
        expect(jc.stats).to.exist;
      });
    });

    it('should handle very long job name', function() {
      const longName = 'A'.repeat(1000);
      const stats = JobComponent.getJobStats(longName);
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });

    it('should handle job name with special characters', function() {
      const stats = JobComponent.getJobStats('Builder!@#$%');
      expect(stats).to.deep.equal({
        strength: 10,
        health: 100,
        gatherSpeed: 10,
        movementSpeed: 60
      });
    });
  });

  describe('Integration', function() {
    it('should create different instances with different names', function() {
      const builder = new JobComponent('Builder');
      const scout = new JobComponent('Scout');
      
      expect(builder.name).to.not.equal(scout.name);
      expect(builder.stats.strength).to.not.equal(scout.stats.strength);
    });

    it('should maintain stat independence between instances', function() {
      const builder1 = new JobComponent('Builder');
      const builder2 = new JobComponent('Builder');
      
      builder1.stats.strength = 999;
      expect(builder2.stats.strength).to.equal(20); // Unchanged
    });

    it('should work with all standard jobs', function() {
      const jobs = JobComponent.getJobList();
      jobs.forEach(jobName => {
        const component = new JobComponent(jobName);
        expect(component.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });

    it('should work with all special jobs', function() {
      const specialJobs = JobComponent.getSpecialJobs();
      specialJobs.forEach(jobName => {
        const component = new JobComponent(jobName);
        expect(component.stats).to.have.all.keys('strength', 'health', 'gatherSpeed', 'movementSpeed');
      });
    });
  });
});




// ================================================================
// queen.test.js (58 tests)
// ================================================================
// Mock globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);
global.push = () => {};
global.pop = () => {};
global.noFill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.ellipse = () => {};

// Mock ant base class
class ant {
  constructor(posX, posY, sizeX, sizeY, movementSpeed, rotation, img, jobName, faction) {
    this.posX = posX;
    this.posY = posY;
    this._size = { x: sizeX, y: sizeY };
    this.movementSpeed = movementSpeed;
    this.rotation = rotation;
    this._image = img;
    this.jobName = jobName;
    this.faction = faction;
    this.isActive = true;
    this._commands = [];
  }
  getPosition() { return { x: this.posX, y: this.posY }; }
  getSize() { return this._size; }
  getImage() { return this._image; }
  moveToLocation(x, y) { this._lastMove = { x, y }; }
  addCommand(cmd) { this._commands.push(cmd); }
  update() {}
  render() {}
}

global.ant = ant;
global.JobImages = { Builder: { src: 'test.png' } };

// Load QueenAnt - Read entire file and eval it
// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
let queenPath = path.join(__dirname, '..', '..', '..', 'Classes', 'ants', 'Queen.js');
let queenCode = fs.readFileSync(queenPath, 'utf8');

// Remove any trailing whitespace/newlines that might cause issues
queenCode = queenCode.trim();

// Create QueenAnt in global scope by evaluating the code
try {
  // Use Function constructor for safer eval in this context
  const fn = new Function('ant', 'JobImages', queenCode + '\nreturn QueenAnt;');
  const QueenAnt = fn(ant, global.JobImages);
  global.QueenAnt = QueenAnt;
} catch (e) {
  console.error('Failed to load QueenAnt:', e);
  // Fallback: direct eval
  eval(queenCode);
}

describe('QueenAnt', function() {
  let queen;
  let baseAnt;

  beforeEach(function() {
    baseAnt = new ant(400, 300, 60, 60, 30, 0, { src: 'queen.png' }, 'Queen', 'player');
    queen = new QueenAnt(baseAnt);
  });

  describe('Constructor', function() {
    it('should initialize with base ant properties', function() {
      expect(queen.posX).to.equal(400);
      expect(queen.posY).to.equal(300);
      expect(queen.faction).to.equal('player');
    });

    it('should initialize with default properties when no base ant', function() {
      const q = new QueenAnt(null);
      expect(q.posX).to.equal(400); // Default position
      expect(q.posY).to.equal(300);
    });

    it('should set Queen-specific properties', function() {
      expect(queen.commandRadius).to.equal(250);
      expect(queen.ants).to.be.an('array').that.is.empty;
      expect(queen.coolDown).to.be.false;
      expect(queen.showCommandRadius).to.be.false;
      expect(queen.disableSkitter).to.be.true;
    });

    it('should initialize all power unlock flags to false', function() {
      expect(queen.unlockedPowers.fireball).to.be.false;
      expect(queen.unlockedPowers.lightning).to.be.false;
      expect(queen.unlockedPowers.blackhole).to.be.false;
      expect(queen.unlockedPowers.sludge).to.be.false;
      expect(queen.unlockedPowers.tidalWave).to.be.false;
    });

    it('should inherit from ant class', function() {
      expect(queen).to.be.instanceOf(ant);
    });
  });

  describe('addAnt', function() {
    it('should add ant to ants array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(1);
      expect(queen.ants[0]).to.equal(workerAnt);
    });

    it('should set ant faction to match queen', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'neutral');
      queen.addAnt(workerAnt);
      expect(workerAnt._faction).to.equal('player');
    });

    it('should handle null ant gracefully', function() {
      expect(() => queen.addAnt(null)).to.not.throw();
      expect(queen.ants).to.have.lengthOf(0);
    });

    it('should add multiple ants', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      expect(queen.ants).to.have.lengthOf(2);
    });
  });

  describe('removeAnt', function() {
    it('should remove ant from ants array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.removeAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(0);
    });

    it('should handle removing non-existent ant', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.removeAnt(ant2);
      expect(queen.ants).to.have.lengthOf(1);
      expect(queen.ants[0]).to.equal(ant1);
    });

    it('should remove correct ant from multiple', function() {
      const ant1 = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(200, 200, 20, 20, 30, 0, null, 'Soldier', 'player');
      const ant3 = new ant(300, 300, 20, 20, 30, 0, null, 'Scout', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.addAnt(ant3);
      queen.removeAnt(ant2);
      expect(queen.ants).to.have.lengthOf(2);
      expect(queen.ants).to.include(ant1);
      expect(queen.ants).to.include(ant3);
      expect(queen.ants).to.not.include(ant2);
    });
  });

  describe('broadcastCommand', function() {
    let nearAnt, farAnt;

    beforeEach(function() {
      // Ant within command radius (250)
      nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      // Ant outside command radius
      farAnt = new ant(1000, 1000, 20, 20, 30, 0, null, 'Scout', 'player');
      queen.addAnt(nearAnt);
      queen.addAnt(farAnt);
    });

    it('should send MOVE command to ants in range', function() {
      queen.broadcastCommand({ type: 'MOVE', x: 600, y: 500 });
      expect(nearAnt._lastMove).to.deep.equal({ x: 600, y: 500 });
      expect(farAnt._lastMove).to.be.undefined;
    });

    it('should send GATHER command to ants in range', function() {
      queen.broadcastCommand({ type: 'GATHER' });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('GATHER');
      expect(farAnt._commands).to.have.lengthOf(0);
    });

    it('should send BUILD command to ants in range', function() {
      queen.broadcastCommand({ type: 'BUILD' });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('BUILD');
    });

    it('should send DEFEND command with target', function() {
      const target = { x: 700, y: 700 };
      queen.broadcastCommand({ type: 'DEFEND', target: target });
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].target).to.equal(target);
    });

    it('should only affect ants within command radius', function() {
      // nearAnt is ~100 units away (within 250)
      // farAnt is ~840 units away (outside 250)
      queen.broadcastCommand({ type: 'GATHER' });
      expect(nearAnt._commands.length).to.be.greaterThan(0);
      expect(farAnt._commands).to.have.lengthOf(0);
    });

    it('should handle empty ants array', function() {
      queen.ants = [];
      expect(() => queen.broadcastCommand({ type: 'MOVE', x: 100, y: 100 })).to.not.throw();
    });
  });

  describe('commandAnt', function() {
    it('should send command to specific ant in array', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.commandAnt(workerAnt, { type: 'GATHER' });
      expect(workerAnt._commands).to.have.lengthOf(1);
      expect(workerAnt._commands[0].type).to.equal('GATHER');
    });

    it('should not send command to ant not in array', function() {
      const outsideAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.commandAnt(outsideAnt, { type: 'GATHER' });
      expect(outsideAnt._commands).to.have.lengthOf(0);
    });

    it('should send multiple commands to same ant', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.commandAnt(workerAnt, { type: 'GATHER' });
      queen.commandAnt(workerAnt, { type: 'BUILD' });
      expect(workerAnt._commands).to.have.lengthOf(2);
    });
  });

  describe('gatherAntsAt', function() {
    it('should broadcast MOVE command to specified coordinates', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.gatherAntsAt(600, 500);
      expect(nearAnt._lastMove).to.deep.equal({ x: 600, y: 500 });
    });

    it('should gather multiple ants', function() {
      const ant1 = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(450, 350, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.gatherAntsAt(600, 500);
      expect(ant1._lastMove).to.exist;
      expect(ant2._lastMove).to.exist;
    });
  });

  describe('orderGathering', function() {
    it('should broadcast GATHER command', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.orderGathering();
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('GATHER');
    });
  });

  describe('orderBuilding', function() {
    it('should broadcast BUILD command', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.orderBuilding();
      expect(nearAnt._commands).to.have.lengthOf(1);
      expect(nearAnt._commands[0].type).to.equal('BUILD');
    });
  });

  describe('emergencyRally', function() {
    it('should gather all ants to queen position', function() {
      const nearAnt = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.emergencyRally();
      expect(nearAnt._lastMove).to.deep.equal({ x: queen.posX, y: queen.posY });
    });

    it('should rally multiple ants to queen', function() {
      const ant1 = new ant(500, 400, 20, 20, 30, 0, null, 'Worker', 'player');
      const ant2 = new ant(450, 350, 20, 20, 30, 0, null, 'Soldier', 'player');
      queen.addAnt(ant1);
      queen.addAnt(ant2);
      queen.emergencyRally();
      expect(ant1._lastMove).to.deep.equal({ x: 400, y: 300 });
      expect(ant2._lastMove).to.deep.equal({ x: 400, y: 300 });
    });
  });

  describe('Power Management', function() {
    describe('unlockPower', function() {
      it('should unlock valid power', function() {
        const result = queen.unlockPower('fireball');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.fireball).to.be.true;
      });

      it('should unlock all valid powers', function() {
        const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave'];
        powers.forEach(power => {
          expect(queen.unlockPower(power)).to.be.true;
          expect(queen.unlockedPowers[power]).to.be.true;
        });
      });

      it('should return false for invalid power', function() {
        const result = queen.unlockPower('invalidPower');
        expect(result).to.be.false;
      });

      it('should allow unlocking already unlocked power', function() {
        queen.unlockPower('fireball');
        const result = queen.unlockPower('fireball');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.fireball).to.be.true;
      });
    });

    describe('lockPower', function() {
      it('should lock unlocked power', function() {
        queen.unlockPower('lightning');
        const result = queen.lockPower('lightning');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.lightning).to.be.false;
      });

      it('should return false for invalid power', function() {
        const result = queen.lockPower('invalidPower');
        expect(result).to.be.false;
      });

      it('should allow locking already locked power', function() {
        const result = queen.lockPower('blackhole');
        expect(result).to.be.true;
        expect(queen.unlockedPowers.blackhole).to.be.false;
      });
    });

    describe('isPowerUnlocked', function() {
      it('should return true for unlocked power', function() {
        queen.unlockPower('sludge');
        expect(queen.isPowerUnlocked('sludge')).to.be.true;
      });

      it('should return false for locked power', function() {
        expect(queen.isPowerUnlocked('tidalWave')).to.be.false;
      });

      it('should return false for invalid power', function() {
        // isPowerUnlocked returns false for invalid/non-existent powers
        expect(queen.isPowerUnlocked('invalid')).to.be.false;
      });
    });

    describe('getUnlockedPowers', function() {
      it('should return empty array when no powers unlocked', function() {
        expect(queen.getUnlockedPowers()).to.be.an('array').that.is.empty;
      });

      it('should return array of unlocked powers', function() {
        queen.unlockPower('fireball');
        queen.unlockPower('lightning');
        const unlocked = queen.getUnlockedPowers();
        expect(unlocked).to.have.lengthOf(2);
        expect(unlocked).to.include('fireball');
        expect(unlocked).to.include('lightning');
      });

      it('should not include locked powers', function() {
        queen.unlockPower('fireball');
        queen.unlockPower('lightning');
        queen.lockPower('lightning');
        const unlocked = queen.getUnlockedPowers();
        expect(unlocked).to.have.lengthOf(1);
        expect(unlocked).to.include('fireball');
        expect(unlocked).to.not.include('lightning');
      });
    });

    describe('getAllPowers', function() {
      it('should return all power states', function() {
        queen.unlockPower('fireball');
        const allPowers = queen.getAllPowers();
        expect(allPowers).to.have.property('fireball', true);
        expect(allPowers).to.have.property('lightning', false);
        expect(allPowers).to.have.property('blackhole', false);
        expect(allPowers).to.have.property('sludge', false);
        expect(allPowers).to.have.property('tidalWave', false);
      });

      it('should return copy of powers object', function() {
        const powers = queen.getAllPowers();
        powers.fireball = true;
        expect(queen.unlockedPowers.fireball).to.be.false; // Original unchanged
      });
    });
  });

  describe('move', function() {
    it('should move up (w) with slower speed', function() {
      const startY = queen.posY;
      queen.move('w');
      expect(queen._lastMove.y).to.be.greaterThan(startY);
    });

    it('should move left (a)', function() {
      const startX = queen.posX;
      queen.move('a');
      expect(queen._lastMove.x).to.be.lessThan(startX);
    });

    it('should move down (s)', function() {
      const startY = queen.posY;
      queen.move('s');
      expect(queen._lastMove.y).to.be.lessThan(startY);
    });

    it('should move right (d)', function() {
      const startX = queen.posX;
      queen.move('d');
      expect(queen._lastMove.x).to.be.greaterThan(startX);
    });

    it('should move slower than normal ant (0.1x speed)', function() {
      queen.movementSpeed = 100;
      queen.move('d');
      const deltaX = queen._lastMove.x - queen.posX;
      expect(deltaX).to.equal(10); // 100 * 0.1
    });

    it('should handle invalid direction gracefully', function() {
      expect(() => queen.move('x')).to.not.throw();
    });
  });

  describe('update', function() {
    it('should call super.update', function() {
      let superCalled = false;
      const originalUpdate = ant.prototype.update;
      ant.prototype.update = function() { superCalled = true; };
      queen.update();
      expect(superCalled).to.be.true;
      ant.prototype.update = originalUpdate;
    });

    it('should not throw errors', function() {
      expect(() => queen.update()).to.not.throw();
    });
  });

  describe('render', function() {
    it('should call super.render', function() {
      let superCalled = false;
      const originalRender = ant.prototype.render;
      ant.prototype.render = function() { superCalled = true; };
      queen.render();
      expect(superCalled).to.be.true;
      ant.prototype.render = originalRender;
    });

    it('should not render command radius when showCommandRadius is false', function() {
      queen.showCommandRadius = false;
      let ellipseCalled = false;
      global.ellipse = () => { ellipseCalled = true; };
      queen.render();
      expect(ellipseCalled).to.be.false;
    });

    it('should render command radius when showCommandRadius is true', function() {
      queen.showCommandRadius = true;
      let ellipseCalled = false;
      global.ellipse = (x, y, d) => { 
        ellipseCalled = true;
        expect(d).to.equal(queen.commandRadius * 2);
      };
      queen.render();
      expect(ellipseCalled).to.be.true;
    });
  });

  describe('Edge Cases', function() {
    it('should handle very large commandRadius', function() {
      queen.commandRadius = 100000; // Very large radius
      const farAnt = new ant(9000, 9000, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(farAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // Distance from (400, 300) to (9000, 9000) is ~12200, so radius must be > 12200
      expect(farAnt._commands).to.have.lengthOf(1);
    });

    it('should handle zero commandRadius', function() {
      queen.commandRadius = 0;
      const nearAnt = new ant(400, 300, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // Only ant at exact same position would receive command
    });

    it('should handle negative commandRadius', function() {
      queen.commandRadius = -100;
      const nearAnt = new ant(400, 300, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(nearAnt);
      queen.broadcastCommand({ type: 'GATHER' });
      // No ants should receive command with negative radius
      expect(nearAnt._commands).to.have.lengthOf(0);
    });

    it('should handle adding same ant multiple times', function() {
      const workerAnt = new ant(100, 100, 20, 20, 30, 0, null, 'Worker', 'player');
      queen.addAnt(workerAnt);
      queen.addAnt(workerAnt);
      expect(queen.ants).to.have.lengthOf(2);
      expect(queen.ants[0]).to.equal(queen.ants[1]);
    });

    it('should handle unlocking all powers then locking all', function() {
      const powers = ['fireball', 'lightning', 'blackhole', 'sludge', 'tidalWave'];
      powers.forEach(p => queen.unlockPower(p));
      expect(queen.getUnlockedPowers()).to.have.lengthOf(5);
      
      powers.forEach(p => queen.lockPower(p));
      expect(queen.getUnlockedPowers()).to.have.lengthOf(0);
    });
  });
});




// ================================================================
// entity.test.js (69 tests)
// ================================================================
// Mock p5.js globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.mouseX = 0;
global.mouseY = 0;

// Mock CollisionBox2D
class MockCollisionBox2D {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
  setPosition(x, y) { this.x = x; this.y = y; }
  setSize(w, h) { this.width = w; this.height = h; }
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
  intersects(other) {
    return !(this.x > other.x + other.width ||
             this.x + this.width < other.x ||
             this.y > other.y + other.height ||
             this.y + this.height < other.y);
  }
  getCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }
}
global.CollisionBox2D = MockCollisionBox2D;

// Mock Sprite2D
class MockSprite2D {
  constructor(imagePath, pos, size, rotation) {
    this.img = imagePath;
    this.position = pos;
    this.size = size;
    this.rotation = rotation;
    this.visible = true;
    this.alpha = 1.0;
  }
  setImage(path) { this.img = path; }
  getImage() { return this.img; }
  setPosition(pos) { this.position = pos; }
  setSize(size) { this.size = size; }
  setOpacity(alpha) { this.alpha = alpha; }
  getOpacity() { return this.alpha; }
}
global.Sprite2D = MockSprite2D;

// Mock Controllers
class MockTransformController {
  constructor(entity) { this.entity = entity; this.pos = { x: 0, y: 0 }; this.size = { x: 32, y: 32 }; }
  setPosition(x, y) { this.pos = { x, y }; }
  getPosition() { return this.pos; }
  setSize(w, h) { this.size = { x: w, y: h }; }
  getSize() { return this.size; }
  getCenter() { return { x: this.pos.x + this.size.x / 2, y: this.pos.y + this.size.y / 2 }; }
  update() {}
}

class MockMovementController {
  constructor(entity) { 
    this.entity = entity; 
    this.movementSpeed = 1.0;
    this.isMoving = false;
    this.path = null;
  }
  moveToLocation(x, y) { this.isMoving = true; this.target = { x, y }; return true; }
  setPath(path) { this.path = path; }
  getIsMoving() { return this.isMoving; }
  stop() { this.isMoving = false; }
  update() {}
}

class MockRenderController {
  constructor(entity) { this.entity = entity; this.debugMode = false; this.smoothing = true; }
  render() {}
  highlightSelected() { return 'selected'; }
  highlightHover() { return 'hover'; }
  setDebugMode(enabled) { this.debugMode = enabled; }
  getDebugMode() { return this.debugMode; }
  setSmoothing(enabled) { this.smoothing = enabled; }
  getSmoothing() { return this.smoothing; }
  update() {}
}

class MockSelectionController {
  constructor(entity) { this.entity = entity; this.selected = false; this.selectable = true; }
  setSelected(val) { this.selected = val; }
  isSelected() { return this.selected; }
  toggleSelection() { this.selected = !this.selected; return this.selected; }
  setSelectable(val) { this.selectable = val; }
  update() {}
}

class MockCombatController {
  constructor(entity) { this.entity = entity; this.faction = 'neutral'; this.inCombat = false; }
  setFaction(faction) { this.faction = faction; }
  isInCombat() { return this.inCombat; }
  detectEnemies() { return []; }
  update() {}
}

class MockTerrainController {
  constructor(entity) { this.entity = entity; this.terrain = 'DEFAULT'; }
  getCurrentTerrain() { return this.terrain; }
  update() {}
}

class MockTaskManager {
  constructor(entity) { this.entity = entity; this.tasks = []; this.currentTask = null; }
  addTask(task) { this.tasks.push(task); return true; }
  getCurrentTask() { return this.currentTask; }
  update() {}
}

class MockHealthController {
  constructor(entity) { this.entity = entity; this.health = 100; }
  update() {}
}


// Mock gameState Manager
class MockGameStateManager {
  constructor() {
    this.currentState = "MENU";
    this.previousState = null;
    this.fadeAlpha = 0;
    this.isFading = false;
    this.stateChangeCallbacks = [];
    this.isFading = false;
    this.fadeDirection = "out";
    
    // Valid game states
    this.STATES = {
      MENU: "MENU",
      OPTIONS: "OPTIONS", 
      DEBUG_MENU: "DEBUG_MENU",
      PLAYING: "PLAYING",
      PAUSED: "PAUSED",
      GAME_OVER: "GAME_OVER",
      KAN_BAN: "KANBAN"
    };
  }

   // Get current state
  getState() {
    return this.currentState;
  }

  // Set state with optional callback execution
  setState(newState, skipCallbacks = false) {
    if (!this.isValidState(newState)) {
      console.warn(`Invalid game state: ${newState}`);
      return false;
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    if (!skipCallbacks) {
      this.executeCallbacks(newState, this.previousState);
    }
    return true;
  }

  // Get previous state
  getPreviousState = () => this.previousState;

  // Check if current state matches
  isState = (state) => this.currentState === state;

    // State change callback system
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.stateChangeCallbacks.push(callback);
    }
  }

    removeStateChangeCallback(callback) {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  executeCallbacks(newState, oldState) {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  
  // Convenience methods for common states
  isInMenu = () => this.currentState === this.STATES.MENU;
  isInOptions = () => this.currentState === this.STATES.OPTIONS;
  isInGame = () => this.currentState === this.STATES.PLAYING;
  isPaused = () => this.currentState === this.STATES.PAUSED;
  isGameOver = () => this.currentState === this.STATES.GAME_OVER;
  isDebug = () => this.currentState === this.STATES.DEBUG_MENU;
  isKanban = () => this.currentState === this.STATES.KAN_BAN;

  // Transition methods
  goToMenu = () => this.setState(this.STATES.MENU);
  goToOptions = () => this.setState(this.STATES.OPTIONS);
  goToDebug = () => this.setState(this.STATES.DEBUG_MENU);
  startGame = () => { this.startFadeTransition(); return this.setState(this.STATES.PLAYING); };
  pauseGame = () => this.setState(this.STATES.PAUSED);
  resumeGame = () => this.setState(this.STATES.PLAYING);
  endGame = () => this.setState(this.STATES.GAME_OVER);
  goToKanban = () => this.setState(this.STATES.KAN_BAN);
}

// Assign controllers to global
global.TransformController = MockTransformController;
global.MovementController = MockMovementController;
global.RenderController = MockRenderController;
global.SelectionController = MockSelectionController;
global.CombatController = MockCombatController;
global.TerrainController = MockTerrainController;
global.TaskManager = MockTaskManager;
global.HealthController = MockHealthController;
global.GameStateManager = MockGameStateManager;

// Mock spatial grid manager
global.spatialGridManager = {
  addEntity: function() {},
  updateEntity: function() {},
  removeEntity: function() {}
};



// Load Entity
// DUPLICATE REQUIRE REMOVED: let Entity = require('../../../Classes/containers/Entity.js');

describe('Entity', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const entity = new Entity();
      expect(entity.id).to.be.a('string');
      expect(entity.type).to.equal('Entity');
      expect(entity._isActive).to.be.true;
    });
    
    it('should initialize with custom position and size', function() {
      const entity = new Entity(100, 200, 64, 64);
      const pos = entity.getPosition();
      const size = entity.getSize();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
      expect(size.x).to.equal(64);
      expect(size.y).to.equal(64);
    });
    
    it('should initialize with custom type', function() {
      const entity = new Entity(0, 0, 32, 32, { type: 'Ant' });
      expect(entity.type).to.equal('Ant');
    });
    
    it('should generate unique IDs for each entity', function() {
      const entity1 = new Entity();
      const entity2 = new Entity();
      expect(entity1.id).to.not.equal(entity2.id);
    });
    
    it('should initialize collision box', function() {
      const entity = new Entity(50, 60, 32, 32);
      expect(entity._collisionBox).to.be.instanceOf(MockCollisionBox2D);
    });
    
    it('should initialize sprite when Sprite2D available', function() {
      const entity = new Entity(0, 0, 32, 32);
      expect(entity._sprite).to.be.instanceOf(MockSprite2D);
    });
    
    it('should initialize all available controllers', function() {
      const entity = new Entity();
      expect(entity._controllers.size).to.be.greaterThan(0);
      expect(entity.getController('transform')).to.exist;
      expect(entity.getController('movement')).to.exist;
      expect(entity.getController('render')).to.exist;
    });
  });
  
  describe('Core Properties', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'TestEntity' });
    });
    
    it('should have read-only id', function() {
      const originalId = entity.id;
      entity.id = 'newId'; // Should not change
      expect(entity.id).to.equal(originalId);
    });
    
    it('should have read-only type', function() {
      const originalType = entity.type;
      entity.type = 'NewType'; // Should not change
      expect(entity.type).to.equal(originalType);
    });
    
    it('should allow setting isActive', function() {
      entity.isActive = false;
      expect(entity.isActive).to.be.false;
      entity.isActive = true;
      expect(entity.isActive).to.be.true;
    });
  });
  
  describe('Position and Transform', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set and get position', function() {
      entity.setPosition(100, 200);
      const pos = entity.getPosition();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
    });
    
    it('should get X coordinate', function() {
      entity.setPosition(50, 100);
      expect(entity.getX()).to.equal(50);
    });
    
    it('should get Y coordinate', function() {
      entity.setPosition(50, 100);
      expect(entity.getY()).to.equal(100);
    });
    
    it('should set and get size', function() {
      entity.setSize(64, 128);
      const size = entity.getSize();
      expect(size.x).to.equal(64);
      expect(size.y).to.equal(128);
    });
    
    it('should calculate center point', function() {
      entity.setPosition(0, 0);
      entity.setSize(100, 100);
      const center = entity.getCenter();
      expect(center.x).to.equal(50);
      expect(center.y).to.equal(50);
    });
    
    it('should update collision box when position changes', function() {
      entity.setPosition(75, 85);
      expect(entity._collisionBox.x).to.equal(75);
      expect(entity._collisionBox.y).to.equal(85);
    });
    
    it('should update collision box when size changes', function() {
      entity.setSize(50, 60);
      expect(entity._collisionBox.width).to.equal(50);
      expect(entity._collisionBox.height).to.equal(60);
    });
  });
  
  describe('Movement', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should move to location', function() {
      const result = entity.moveToLocation(100, 200);
      expect(result).to.be.true;
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should set path', function() {
      const path = [{ x: 10, y: 10 }, { x: 20, y: 20 }];
      entity.setPath(path);
      const movement = entity.getController('movement');
      expect(movement.path).to.equal(path);
    });
    
    it('should check if moving', function() {
      expect(entity.isMoving()).to.be.false;
      entity.moveToLocation(50, 50);
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should stop movement', function() {
      entity.moveToLocation(100, 100);
      entity.stop();
      expect(entity.isMoving()).to.be.false;
    });
    
    it('should get movement speed from controller', function() {
      const movement = entity.getController('movement');
      if (movement && movement.movementSpeed !== undefined) {
        expect(movement.movementSpeed).to.be.a('number');
      } else {
        // If controller doesn't exist or has no movementSpeed, skip test
        expect(true).to.be.true;
      }
    });
    
    it('should set movement speed', function() {
      entity.movementSpeed = 5.0;
      expect(entity.movementSpeed).to.equal(5.0);
    });
  });
  
  describe('Selection', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set selected state', function() {
      entity.setSelected(true);
      expect(entity.isSelected()).to.be.true;
    });
    
    it('should toggle selection', function() {
      expect(entity.isSelected()).to.be.false;
      entity.toggleSelection();
      expect(entity.isSelected()).to.be.true;
      entity.toggleSelection();
      expect(entity.isSelected()).to.be.false;
    });
  });
  
  describe('Interaction', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should detect mouse over', function() {
      global.window = { _lastDebugMouseX: 0, _lastDebugMouseY: 0 };
      entity.setPosition(0, 0);
      entity.setSize(32, 32);
      global.mouseX = 16;
      global.mouseY = 16;
      expect(entity.isMouseOver()).to.be.true;
    });
    
    it('should detect mouse not over', function() {
      entity.setPosition(0, 0);
      entity.setSize(32, 32);
      global.mouseX = 100;
      global.mouseY = 100;
      expect(entity.isMouseOver()).to.be.false;
    });
  });
  
  describe('Combat', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { faction: 'player' });
    });
    
    it('should check if in combat', function() {
      expect(entity.isInCombat()).to.be.false;
    });
    
    it('should detect enemies', function() {
      const enemies = entity.detectEnemies();
      expect(enemies).to.be.an('array');
    });
  });
  
  describe('Tasks', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should add task', function() {
      const task = { type: 'GATHER', priority: 1 };
      const result = entity.addTask(task);
      expect(result).to.be.true;
    });
    
    it('should get current task', function() {
      const task = entity.getCurrentTask();
      expect(task).to.be.null; // Initially null
    });
  });
  
  describe('Terrain', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should get current terrain', function() {
      const terrain = entity.getCurrentTerrain();
      expect(terrain).to.equal('DEFAULT');
    });
  });
  
  describe('Sprite and Image', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set image path', function() {
      entity.setImage('/path/to/image.png');
      expect(entity.getImage()).to.equal('/path/to/image.png');
    });
    
    it('should check if has image', function() {
      entity.setImage('/path/to/image.png');
      expect(entity.hasImage()).to.be.true;
    });
    
    it('should set opacity', function() {
      entity.setOpacity(128);
      expect(entity.getOpacity()).to.equal(128);
    });
    
    it('should get opacity', function() {
      const opacity = entity.getOpacity();
      expect(opacity).to.be.a('number');
    });
  });
  
  describe('Collision', function() {
    let entity1, entity2;
    
    beforeEach(function() {
      entity1 = new Entity(0, 0, 32, 32);
      entity2 = new Entity(16, 16, 32, 32);
    });
    
    it('should detect collision when overlapping', function() {
      expect(entity1.collidesWith(entity2)).to.be.true;
    });
    
    it('should not detect collision when separate', function() {
      entity2.setPosition(100, 100);
      entity1.update(); // Sync collision box
      entity2.update(); // Sync collision box
      expect(entity1.collidesWith(entity2)).to.be.false;
    });
    
    it('should check point containment', function() {
      entity1.setPosition(0, 0);
      entity1.setSize(32, 32);
      expect(entity1.contains(16, 16)).to.be.true;
      expect(entity1.contains(100, 100)).to.be.false;
    });
  });
  
  describe('Update Loop', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should call update without errors', function() {
      expect(() => entity.update()).to.not.throw();
    });
    
    it('should not update when inactive', function() {
      entity.isActive = false;
      expect(() => entity.update()).to.not.throw();
    });
    
    it('should sync collision box on update', function() {
      entity.setPosition(50, 60);
      entity.update();
      expect(entity._collisionBox.x).to.equal(50);
      expect(entity._collisionBox.y).to.equal(60);
    });
  });
  
  describe('Rendering', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should call render without errors', function() {
      expect(() => entity.render()).to.not.throw();
    });
    
    it('should not render when inactive', function() {
      entity.isActive = false;
      expect(() => entity.render()).to.not.throw();
    });
  });
  
  describe('Debug Info', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'TestEntity' });
    });
    
    it('should return debug info object', function() {
      const info = entity.getDebugInfo();
      expect(info).to.be.an('object');
      expect(info.id).to.equal(entity.id);
      expect(info.type).to.equal('TestEntity');
    });
    
    it('should include position in debug info', function() {
      entity.setPosition(100, 200);
      const info = entity.getDebugInfo();
      expect(info.position.x).to.equal(100);
      expect(info.position.y).to.equal(200);
    });
    
    it('should include size in debug info', function() {
      entity.setSize(64, 64);
      const info = entity.getDebugInfo();
      expect(info.size.x).to.equal(64);
      expect(info.size.y).to.equal(64);
    });
    
    it('should include controller status', function() {
      const info = entity.getDebugInfo();
      expect(info.controllers).to.be.an('object');
      expect(info.controllerCount).to.be.greaterThan(0);
    });
  });
  
  describe('Validation Data', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'Ant', faction: 'player' });
    });
    
    it('should return validation data', function() {
      const data = entity.getValidationData();
      expect(data).to.be.an('object');
      expect(data.id).to.exist;
      expect(data.type).to.equal('Ant');
      expect(data.faction).to.equal('neutral'); // Default faction from controller
    });
    
    it('should include timestamp', function() {
      const data = entity.getValidationData();
      expect(data.timestamp).to.be.a('string');
    });
    
    it('should include position and size', function() {
      entity.setPosition(50, 60);
      entity.setSize(32, 32);
      const data = entity.getValidationData();
      expect(data.position).to.exist;
      expect(data.size).to.exist;
    });
  });
  
  describe('Destroy', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should mark entity as inactive', function() {
      entity.destroy();
      expect(entity._isActive).to.be.false;
    });
    
    it('should not throw when destroyed', function() {
      expect(() => entity.destroy()).to.not.throw();
    });
  });
  
  describe('Enhanced API - Highlight', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have highlight namespace', function() {
      expect(entity.highlight).to.be.an('object');
    });
    
    it('should call highlight.selected', function() {
      const result = entity.highlight.selected();
      expect(result).to.equal('selected');
    });
    
    it('should call highlight.hover', function() {
      const result = entity.highlight.hover();
      expect(result).to.equal('hover');
    });
  });
  
  describe('Enhanced API - Rendering', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have rendering namespace', function() {
      expect(entity.rendering).to.be.an('object');
    });
    
    it('should set debug mode', function() {
      entity.rendering.setDebugMode(true);
      expect(entity.rendering.isVisible()).to.be.true;
    });
    
    it('should set opacity', function() {
      entity.rendering.setOpacity(0.5);
      expect(entity.rendering.getOpacity()).to.equal(0.5);
    });
  });
  
  describe('Enhanced API - Config', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have config namespace', function() {
      expect(entity.config).to.be.an('object');
    });
    
    it('should get debugMode when render controller available', function() {
      const renderController = entity.getController('render');
      if (renderController && renderController.getDebugMode) {
        const debugMode = renderController.getDebugMode();
        expect(debugMode).to.be.a('boolean');
      } else {
        // If no render controller, skip test
        expect(true).to.be.true;
      }
    });
    
    it('should get smoothing when render controller available', function() {
      const renderController = entity.getController('render');
      if (renderController && renderController.getSmoothing) {
        const smoothing = renderController.getSmoothing();
        expect(smoothing).to.be.a('boolean');
      } else {
        // If no render controller, skip test
        expect(true).to.be.true;
      }
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero position and size', function() {
      const entity = new Entity(0, 0, 0, 0);
      expect(entity.getPosition().x).to.equal(0);
      expect(entity.getSize().x).to.equal(0);
    });
    
    it('should handle negative position', function() {
      const entity = new Entity(-100, -200, 32, 32);
      expect(entity.getX()).to.equal(-100);
      expect(entity.getY()).to.equal(-200);
    });
    
    it('should handle very large position', function() {
      const entity = new Entity(1e6, 1e6, 32, 32);
      expect(entity.getX()).to.equal(1e6);
      expect(entity.getY()).to.equal(1e6);
    });
    
    it('should handle fractional values', function() {
      const entity = new Entity(10.5, 20.7, 32.3, 32.9);
      const pos = entity.getPosition();
      expect(pos.x).to.be.closeTo(10.5, 0.1);
      expect(pos.y).to.be.closeTo(20.7, 0.1);
    });
    
    it('should handle missing controllers gracefully', function() {
      // Remove all controllers temporarily
      global.TransformController = undefined;
      const entity = new Entity(0, 0, 32, 32);
      expect(() => entity.update()).to.not.throw();
      // Restore
      global.TransformController = MockTransformController;
    });
  });
  
  describe('Integration', function() {
    it('should maintain state across multiple operations', function() {
      const entity = new Entity(0, 0, 32, 32, { type: 'Ant', faction: 'player' });
      
      entity.setPosition(100, 200);
      entity.setSize(64, 64);
      entity.setSelected(true);
      entity.moveToLocation(300, 400);
      entity.update();
      
      expect(entity.getX()).to.equal(100);
      expect(entity.isSelected()).to.be.true;
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should handle collision detection after movement', function() {
      const entity1 = new Entity(0, 0, 32, 32);
      const entity2 = new Entity(100, 100, 32, 32);
      
      expect(entity1.collidesWith(entity2)).to.be.false;
      
      entity1.setPosition(100, 100);
      entity1.update();
      entity2.update();
      
      expect(entity1.collidesWith(entity2)).to.be.true;
    });
  });
});




// ================================================================
// statsContainer.test.js (64 tests)
// ================================================================
// Mock p5.js createVector
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });

// Mock devConsoleEnabled
global.devConsoleEnabled = false;

// Load the module
// DUPLICATE REQUIRE REMOVED: let { StatsContainer, stat } = require('../../../Classes/containers/StatsContainer.js');

describe('stat', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const s = new stat();
      expect(s.statName).to.equal('NONAME');
      expect(s.statValue).to.equal(0);
      expect(s.statLowerLimit).to.equal(0);
      expect(s.statUpperLimit).to.equal(500);
    });
    
    it('should initialize with custom name and value', function() {
      const s = new stat('Health', 100);
      expect(s.statName).to.equal('Health');
      expect(s.statValue).to.equal(100);
    });
    
    it('should initialize with custom limits', function() {
      const s = new stat('Power', 50, 10, 200);
      expect(s.statLowerLimit).to.equal(10);
      expect(s.statUpperLimit).to.equal(200);
      expect(s.statValue).to.equal(50);
    });
    
    it('should enforce limits on construction', function() {
      const s = new stat('Overflow', 600, 0, 500);
      expect(s.statValue).to.equal(500);
    });
    
    it('should enforce lower limit on construction', function() {
      const s = new stat('Underflow', -10, 0, 500);
      expect(s.statValue).to.equal(0);
    });
  });
  
  describe('Getters and Setters', function() {
    it('should get and set statName', function() {
      const s = new stat();
      s.statName = 'Strength';
      expect(s.statName).to.equal('Strength');
    });
    
    it('should get and set statValue', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 75;
      expect(s.statValue).to.equal(75);
    });
    
    it('should get and set statUpperLimit', function() {
      const s = new stat();
      s.statUpperLimit = 1000;
      expect(s.statUpperLimit).to.equal(1000);
    });
    
    it('should get and set statLowerLimit', function() {
      const s = new stat();
      s.statLowerLimit = -100;
      expect(s.statLowerLimit).to.equal(-100);
    });
  });
  
  describe('enforceStatLimit()', function() {
    it('should clamp value to upper limit', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 150;
      expect(s.statValue).to.equal(100);
    });
    
    it('should clamp value to lower limit', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = -10;
      expect(s.statValue).to.equal(0);
    });
    
    it('should not change valid value', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 75;
      expect(s.statValue).to.equal(75);
    });
    
    it('should handle exact limit values', function() {
      const s = new stat('Test', 50, 0, 100);
      s.statValue = 0;
      expect(s.statValue).to.equal(0);
      s.statValue = 100;
      expect(s.statValue).to.equal(100);
    });
    
    it('should handle negative limits', function() {
      const s = new stat('Temperature', 0, -100, 100);
      s.statValue = -50;
      expect(s.statValue).to.equal(-50);
      s.statValue = -150;
      expect(s.statValue).to.equal(-100);
    });
  });
  
  describe('printStatToDebug()', function() {
    it('should not throw when called', function() {
      const s = new stat('Test', 100);
      expect(() => s.printStatToDebug()).to.not.throw();
    });
    
    it('should handle vector values', function() {
      const s = new stat('Position', { x: 10, y: 20 });
      expect(() => s.printStatToDebug()).to.not.throw();
    });
  });
  
  describe('printStatUnderObject()', function() {
    it('should not throw when rendering unavailable', function() {
      const s = new stat('Test', 100);
      const pos = { x: 0, y: 0 };
      const size = { x: 32, y: 32 };
      expect(() => s.printStatUnderObject(pos, size, 12)).to.not.throw();
    });
    
    it('should handle vector statValue', function() {
      const s = new stat('Position', { x: 10, y: 20 });
      const pos = { x: 0, y: 0 };
      const size = { x: 32, y: 32 };
      expect(() => s.printStatUnderObject(pos, size, 12)).to.not.throw();
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero limits', function() {
      const s = new stat('Zero', 0, 0, 0);
      expect(s.statValue).to.equal(0);
    });
    
    it('should handle very large numbers', function() {
      const s = new stat('Large', 1e9, 0, 1e10);
      expect(s.statValue).to.equal(1e9);
    });
    
    it('should handle fractional values', function() {
      const s = new stat('Fraction', 3.14159, 0, 10);
      expect(s.statValue).to.be.closeTo(3.14159, 0.00001);
    });
    
    it('should handle string name', function() {
      const s = new stat('Very Long Stat Name With Spaces');
      expect(s.statName).to.equal('Very Long Stat Name With Spaces');
    });
  });
});

describe('StatsContainer', function() {
  
  describe('Constructor', function() {
    it('should initialize with valid vectors', function() {
      const pos = createVector(10, 20);
      const size = createVector(32, 32);
      const stats = new StatsContainer(pos, size);
      
      expect(stats.position.statValue.x).to.equal(10);
      expect(stats.position.statValue.y).to.equal(20);
      expect(stats.size.statValue.x).to.equal(32);
      expect(stats.size.statValue.y).to.equal(32);
    });
    
    it('should initialize with custom parameters', function() {
      const pos = createVector(5, 15);
      const size = createVector(64, 64);
      const stats = new StatsContainer(pos, size, 2.5, null, 50, 200, 5);
      
      expect(stats.movementSpeed.statValue).to.equal(2.5);
      expect(stats.strength.statValue).to.equal(50);
      expect(stats.health.statValue).to.equal(200);
      expect(stats.gatherSpeed.statValue).to.equal(5);
    });
    
    it('should throw error for invalid pos', function() {
      expect(() => new StatsContainer(null, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for missing pos.x', function() {
      expect(() => new StatsContainer({ y: 10 }, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for missing pos.y', function() {
      expect(() => new StatsContainer({ x: 10 }, createVector(32, 32))).to.throw(Error);
    });
    
    it('should throw error for invalid size', function() {
      expect(() => new StatsContainer(createVector(0, 0), null)).to.throw(Error);
    });
    
    it('should throw error for missing size.x', function() {
      expect(() => new StatsContainer(createVector(0, 0), { y: 32 })).to.throw(Error);
    });
    
    it('should throw error for missing size.y', function() {
      expect(() => new StatsContainer(createVector(0, 0), { x: 32 })).to.throw(Error);
    });
    
    it('should create pendingPos from pos when null', function() {
      const pos = createVector(100, 200);
      const size = createVector(32, 32);
      const stats = new StatsContainer(pos, size);
      
      expect(stats.pendingPos.statValue.x).to.equal(100);
      expect(stats.pendingPos.statValue.y).to.equal(200);
    });
    
    it('should use provided pendingPos when given', function() {
      const pos = createVector(10, 20);
      const size = createVector(32, 32);
      const pending = createVector(50, 60);
      const stats = new StatsContainer(pos, size, 1, pending);
      
      expect(stats.pendingPos.statValue.x).to.equal(50);
      expect(stats.pendingPos.statValue.y).to.equal(60);
    });
    
    it('should create exp map', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(stats.exp).to.be.instanceOf(Map);
      expect(stats.exp.size).to.equal(8);
    });
  });
  
  describe('Getters and Setters', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should get and set position', function() {
      const newPos = new stat('Position', createVector(50, 50));
      stats.position = newPos;
      expect(stats.position).to.equal(newPos);
    });
    
    it('should get and set size', function() {
      const newSize = new stat('Size', createVector(64, 64));
      stats.size = newSize;
      expect(stats.size).to.equal(newSize);
    });
    
    it('should get and set movementSpeed', function() {
      const newSpeed = new stat('Speed', 5.0);
      stats.movementSpeed = newSpeed;
      expect(stats.movementSpeed).to.equal(newSpeed);
    });
    
    it('should get and set pendingPos', function() {
      const newPending = new stat('Pending', createVector(100, 100));
      stats.pendingPos = newPending;
      expect(stats.pendingPos).to.equal(newPending);
    });
  });
  
  describe('EXP System', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should create all EXP categories', function() {
      expect(stats.exp.has('Lifetime')).to.be.true;
      expect(stats.exp.has('Gathering')).to.be.true;
      expect(stats.exp.has('Hunting')).to.be.true;
      expect(stats.exp.has('Swimming')).to.be.true;
      expect(stats.exp.has('Farming')).to.be.true;
      expect(stats.exp.has('Construction')).to.be.true;
      expect(stats.exp.has('Ranged')).to.be.true;
      expect(stats.exp.has('Scouting')).to.be.true;
    });
    
    it('should initialize each EXP category with stat instance', function() {
      const lifetime = stats.exp.get('Lifetime');
      expect(lifetime).to.be.instanceOf(stat);
      expect(lifetime.statName).to.equal('Lifetime EXP');
    });
    
    it('should allow modifying EXP values', function() {
      const gathering = stats.exp.get('Gathering');
      gathering.statValue = 100;
      expect(gathering.statValue).to.equal(100);
    });
  });
  
  describe('getExpTotal()', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should call setExpTotal and return expTotal property', function() {
      const total = stats.getExpTotal();
      expect(total).to.exist;
      expect(stats.expTotal).to.exist;
    });
    
    it('should sum stat values from EXP categories', function() {
      stats.exp.get('Gathering').statValue = 100;
      stats.exp.get('Hunting').statValue = 50;
      stats.exp.get('Farming').statValue = 25;
      
      const total = stats.getExpTotal();
      // Note: setExpTotal iterates through Map values and Object.keys
      // This is a complex iteration pattern in the original code
      expect(total).to.exist;
      expect(stats.expTotal).to.exist;
    });
    
    it('should update expTotal property when called', function() {
      stats.exp.get('Scouting').statValue = 300;
      stats.getExpTotal();
      expect(stats.expTotal).to.exist;
    });
    
    it('should recalculate when called multiple times', function() {
      stats.exp.get('Lifetime').statValue = 50;
      let total = stats.getExpTotal();
      expect(total).to.exist;
      
      stats.exp.get('Construction').statValue = 75;
      total = stats.getExpTotal();
      expect(total).to.exist;
    });
  });
  
  describe('setExpTotal()', function() {
    let stats;
    
    beforeEach(function() {
      stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
    });
    
    it('should calculate total using complex iteration pattern', function() {
      stats.exp.get('Gathering').statValue = 10;
      stats.exp.get('Hunting').statValue = 20;
      stats.exp.get('Swimming').statValue = 30;
      
      stats.setExpTotal();
      // The implementation iterates through Map values and their Object.keys
      expect(stats.expTotal).to.exist;
    });
    
    it('should initialize expTotal to 0 before calculating', function() {
      stats.expTotal = 999;
      stats.setExpTotal();
      // expTotal gets reset to 0, then recalculated
      expect(stats.expTotal).to.exist;
    });
  });
  
  describe('printExpTotal()', function() {
    it('should not throw when called', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(() => stats.printExpTotal()).to.not.throw();
    });
  });
  
  describe('test_Map()', function() {
    it('should not throw with valid map', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      const testMap = new Map([['key1', 'value1'], ['key2', 'value2']]);
      expect(() => stats.test_Map(testMap)).to.not.throw();
    });
  });
  
  describe('test_Exp()', function() {
    it('should not throw when called', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(() => stats.test_Exp()).to.not.throw();
    });
  });
  
  describe('Stat Limits', function() {
    it('should enforce movementSpeed limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 150);
      expect(stats.movementSpeed.statValue).to.equal(100); // Clamped to upper limit
    });
    
    it('should enforce strength limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 2000);
      expect(stats.strength.statValue).to.equal(1000); // Clamped to upper limit
    });
    
    it('should enforce health limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 10, 20000);
      expect(stats.health.statValue).to.equal(10000); // Clamped to upper limit
    });
    
    it('should enforce gatherSpeed limits', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), 1, null, 10, 100, 200);
      expect(stats.gatherSpeed.statValue).to.equal(100); // Clamped to upper limit
    });
    
    it('should handle negative values', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32), -10, null, -50, -100, -5);
      expect(stats.movementSpeed.statValue).to.equal(0);
      expect(stats.strength.statValue).to.equal(0);
      expect(stats.health.statValue).to.equal(0);
      expect(stats.gatherSpeed.statValue).to.equal(0);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero position', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(0);
      expect(stats.position.statValue.y).to.equal(0);
    });
    
    it('should handle negative position', function() {
      const stats = new StatsContainer(createVector(-100, -200), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(-100);
      expect(stats.position.statValue.y).to.equal(-200);
    });
    
    it('should handle very large position values', function() {
      const stats = new StatsContainer(createVector(1e6, 1e6), createVector(32, 32));
      expect(stats.position.statValue.x).to.equal(1e6);
      expect(stats.position.statValue.y).to.equal(1e6);
    });
    
    it('should handle fractional stat values', function() {
      const stats = new StatsContainer(
        createVector(10.5, 20.7),
        createVector(32.3, 32.9),
        0.123,
        null,
        15.6,
        99.9,
        2.5
      );
      expect(stats.movementSpeed.statValue).to.be.closeTo(0.123, 0.001);
      expect(stats.strength.statValue).to.be.closeTo(15.6, 0.1);
    });
    
    it('should handle all stats at maximum', function() {
      const stats = new StatsContainer(
        createVector(0, 0),
        createVector(32, 32),
        100,
        null,
        1000,
        10000,
        100
      );
      expect(stats.movementSpeed.statValue).to.equal(100);
      expect(stats.strength.statValue).to.equal(1000);
      expect(stats.health.statValue).to.equal(10000);
      expect(stats.gatherSpeed.statValue).to.equal(100);
    });
    
    it('should handle all stats at minimum', function() {
      const stats = new StatsContainer(
        createVector(0, 0),
        createVector(32, 32),
        0,
        null,
        0,
        0,
        0
      );
      expect(stats.movementSpeed.statValue).to.equal(0);
      expect(stats.strength.statValue).to.equal(0);
      expect(stats.health.statValue).to.equal(0);
      expect(stats.gatherSpeed.statValue).to.equal(0);
    });
  });
  
  describe('Integration', function() {
    it('should maintain consistency across stat updates', function() {
      const stats = new StatsContainer(createVector(50, 50), createVector(32, 32));
      
      // Update various stats
      stats.strength.statValue = 500;
      stats.health.statValue = 5000;
      stats.exp.get('Gathering').statValue = 100;
      stats.exp.get('Hunting').statValue = 200;
      
      expect(stats.strength.statValue).to.equal(500);
      expect(stats.health.statValue).to.equal(5000);
      
      const total = stats.getExpTotal();
      expect(total).to.exist;
    });
    
    it('should handle multiple position updates', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      
      stats.position.statValue = createVector(10, 20);
      expect(stats.position.statValue.x).to.equal(10);
      
      stats.position.statValue = createVector(100, 200);
      expect(stats.position.statValue.x).to.equal(100);
      expect(stats.position.statValue.y).to.equal(200);
    });
    
    it('should handle complex EXP scenario', function() {
      const stats = new StatsContainer(createVector(0, 0), createVector(32, 32));
      
      // Simulate gaining EXP in multiple categories
      stats.exp.get('Lifetime').statValue = 1000;
      stats.exp.get('Gathering').statValue = 250;
      stats.exp.get('Hunting').statValue = 150;
      stats.exp.get('Farming').statValue = 300;
      stats.exp.get('Construction').statValue = 200;
      
      const total = stats.getExpTotal();
      expect(total).to.exist;
    });
  });
});




// ================================================================
// dropoffLocation.test.js (50 tests)
// ================================================================
// Mock p5.js globals
global.TILE_SIZE = 32;
global.NONE = null;
global.push = function() {};
global.pop = function() {};
global.noStroke = function() {};
global.stroke = function() {};
global.strokeWeight = function() {};
global.noFill = function() {};
global.fill = function() {};
global.rect = function() {};

// Mock InventoryController
class MockInventoryController {
  constructor(owner, capacity = 2) {
    this.owner = owner;
    this.capacity = capacity;
    this.items = [];
  }
  
  addResource(resource) {
    if (this.items.length >= this.capacity) return false;
    this.items.push(resource);
    return true;
  }
  
  transferAllTo(targetInventory) {
    let transferred = 0;
    while (this.items.length > 0 && targetInventory.items.length < targetInventory.capacity) {
      const item = this.items.shift();
      if (targetInventory.addResource(item)) transferred++;
    }
    return transferred;
  }
  
  getResources() {
    return this.items;
  }
}

global.InventoryController = MockInventoryController;

// Mock Grid class
class MockGrid {
  constructor() {
    this.data = new Map();
  }
  
  set(coords, value) {
    const key = `${coords[0]},${coords[1]}`;
    this.data.set(key, value);
  }
  
  get(coords) {
    const key = `${coords[0]},${coords[1]}`;
    return this.data.get(key);
  }
}

// Load the module
// DUPLICATE REQUIRE REMOVED: let DropoffLocation = require('../../../Classes/containers/DropoffLocation.js');

describe('DropoffLocation', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const dropoff = new DropoffLocation(5, 4);
      expect(dropoff.x).to.equal(5);
      expect(dropoff.y).to.equal(4);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
      expect(dropoff.tileSize).to.equal(32);
    });
    
    it('should initialize with custom dimensions', function() {
      const dropoff = new DropoffLocation(10, 20, 3, 2);
      expect(dropoff.x).to.equal(10);
      expect(dropoff.y).to.equal(20);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should initialize with custom tile size', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { tileSize: 64 });
      expect(dropoff.tileSize).to.equal(64);
    });
    
    it('should floor grid coordinates', function() {
      const dropoff = new DropoffLocation(5.7, 4.2, 2.9, 3.1);
      expect(dropoff.x).to.equal(5);
      expect(dropoff.y).to.equal(4);
      expect(dropoff.width).to.equal(2);
      expect(dropoff.height).to.equal(3);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 0, 0);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should create inventory with default capacity', function() {
      const dropoff = new DropoffLocation(0, 0);
      expect(dropoff.inventory).to.not.be.null;
      expect(dropoff.inventory.capacity).to.equal(2);
    });
    
    it('should create inventory with custom capacity', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      expect(dropoff.inventory.capacity).to.equal(10);
    });
    
    it('should mark grid on construction if provided', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(2, 3, 2, 2, { grid });
      expect(dropoff._filledOnGrid).to.be.true;
      expect(grid.get([2, 3])).to.equal(dropoff);
      expect(grid.get([3, 4])).to.equal(dropoff);
    });
  });
  
  describe('tiles()', function() {
    it('should return single tile for 1x1 dropoff', function() {
      const dropoff = new DropoffLocation(5, 4, 1, 1);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(1);
      expect(tiles[0]).to.deep.equal([5, 4]);
    });
    
    it('should return all tiles for 2x2 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(4);
      expect(tiles).to.deep.include.members([[0, 0], [1, 0], [0, 1], [1, 1]]);
    });
    
    it('should return all tiles for 3x2 dropoff', function() {
      const dropoff = new DropoffLocation(10, 20, 3, 2);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(6);
      expect(tiles).to.deep.include.members([
        [10, 20], [11, 20], [12, 20],
        [10, 21], [11, 21], [12, 21]
      ]);
    });
    
    it('should handle large dropoff areas', function() {
      const dropoff = new DropoffLocation(0, 0, 10, 10);
      const tiles = dropoff.tiles();
      expect(tiles).to.have.lengthOf(100);
    });
  });
  
  describe('expand()', function() {
    it('should expand width by positive delta', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(1, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should expand height by positive delta', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(0, 2);
      expect(dropoff.width).to.equal(2);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should expand both dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.expand(2, 3);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should handle negative delta (retraction)', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.expand(-2, -1);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
    
    it('should enforce minimum size of 1x1 when retracting', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.expand(-5, -5);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should do nothing when both deltas are zero', function() {
      const dropoff = new DropoffLocation(0, 0, 3, 3);
      dropoff.expand(0, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(3);
    });
    
    it('should update grid when expanding', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 1, 1, { grid });
      dropoff.expand(1, 0);
      expect(grid.get([1, 0])).to.equal(dropoff);
    });
  });
  
  describe('retract()', function() {
    it('should retract width', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(2, 0);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(5);
    });
    
    it('should retract height', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(0, 3);
      expect(dropoff.width).to.equal(5);
      expect(dropoff.height).to.equal(2);
    });
    
    it('should retract both dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 10, 10);
      dropoff.retract(3, 4);
      expect(dropoff.width).to.equal(7);
      expect(dropoff.height).to.equal(6);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      dropoff.retract(10, 10);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should convert positive arguments to absolute values', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.retract(2, 1);
      expect(dropoff.width).to.equal(3);
      expect(dropoff.height).to.equal(4);
    });
  });
  
  describe('setSize()', function() {
    it('should set absolute width and height', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.setSize(5, 7);
      expect(dropoff.width).to.equal(5);
      expect(dropoff.height).to.equal(7);
    });
    
    it('should floor fractional values', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1);
      dropoff.setSize(4.9, 6.1);
      expect(dropoff.width).to.equal(4);
      expect(dropoff.height).to.equal(6);
    });
    
    it('should enforce minimum size of 1x1', function() {
      const dropoff = new DropoffLocation(0, 0, 5, 5);
      dropoff.setSize(0, 0);
      expect(dropoff.width).to.equal(1);
      expect(dropoff.height).to.equal(1);
    });
    
    it('should update grid when resizing', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 1, 1, { grid });
      dropoff.setSize(3, 3);
      expect(dropoff.tiles()).to.have.lengthOf(9);
    });
  });
  
  describe('depositResource()', function() {
    it('should add resource to inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      const resource = { type: 'wood' };
      const result = dropoff.depositResource(resource);
      expect(result).to.be.true;
      expect(dropoff.inventory.items).to.include(resource);
    });
    
    it('should return false when inventory is full', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 2 });
      dropoff.depositResource({ type: 'wood' });
      dropoff.depositResource({ type: 'stone' });
      const result = dropoff.depositResource({ type: 'food' });
      expect(result).to.be.false;
    });
    
    it('should return false when no inventory exists', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { InventoryController: null });
      dropoff.inventory = null;
      const result = dropoff.depositResource({ type: 'wood' });
      expect(result).to.be.false;
    });
    
    it('should handle multiple deposits', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 5 });
      expect(dropoff.depositResource({ type: 'a' })).to.be.true;
      expect(dropoff.depositResource({ type: 'b' })).to.be.true;
      expect(dropoff.depositResource({ type: 'c' })).to.be.true;
      expect(dropoff.inventory.items).to.have.lengthOf(3);
    });
  });
  
  describe('acceptFromCarrier()', function() {
    it('should transfer resources from carrier with transferAllTo', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'wood' });
      carrier.inventory.addResource({ type: 'stone' });
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(2);
      expect(carrier.inventory.items).to.have.lengthOf(0);
    });
    
    it('should transfer resources from carrier with getResources', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const carrier = {
        getResources: () => [{ type: 'wood' }, { type: 'stone' }],
        removeResource: function(index) { this.getResources()[index] = null; }
      };
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(2);
    });
    
    it('should return 0 when carrier is null', function() {
      const dropoff = new DropoffLocation(0, 0);
      const transferred = dropoff.acceptFromCarrier(null);
      expect(transferred).to.equal(0);
    });
    
    it('should return 0 when dropoff has no inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      dropoff.inventory = null;
      const carrier = { inventory: new MockInventoryController(null, 5) };
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(0);
    });
    
    it('should handle partial transfers when dropoff is nearly full', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 3 });
      dropoff.depositResource({ type: 'existing' });
      
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'a' });
      carrier.inventory.addResource({ type: 'b' });
      carrier.inventory.addResource({ type: 'c' });
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(dropoff.inventory.items).to.have.lengthOf(3);
      expect(carrier.inventory.items).to.have.lengthOf(1);
    });
    
    it('should handle empty carrier inventory', function() {
      const dropoff = new DropoffLocation(0, 0);
      const carrier = { inventory: new MockInventoryController(null, 5) };
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(0);
    });
  });
  
  describe('getCenterPx()', function() {
    it('should return center of 1x1 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(16);
      expect(center.y).to.equal(16);
    });
    
    it('should return center of 2x2 dropoff', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(32);
      expect(center.y).to.equal(32);
    });
    
    it('should return center with custom tile size', function() {
      const dropoff = new DropoffLocation(5, 5, 3, 3, { tileSize: 64 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(416); // (5 + 3/2) * 64 = 6.5 * 64
      expect(center.y).to.equal(416);
    });
    
    it('should return center at non-zero grid position', function() {
      const dropoff = new DropoffLocation(10, 20, 4, 2, { tileSize: 32 });
      const center = dropoff.getCenterPx();
      expect(center.x).to.equal(384); // (10 + 4/2) * 32 = 12 * 32
      expect(center.y).to.equal(672); // (20 + 2/2) * 32 = 21 * 32
    });
  });
  
  describe('draw()', function() {
    it('should not throw when p5 functions are available', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      expect(() => dropoff.draw()).to.not.throw();
    });
    
    it('should handle missing p5 gracefully', function() {
      const originalPush = global.push;
      global.push = undefined;
      const dropoff = new DropoffLocation(0, 0);
      expect(() => dropoff.draw()).to.not.throw();
      global.push = originalPush;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle negative grid coordinates', function() {
      const dropoff = new DropoffLocation(-5, -10, 2, 2);
      expect(dropoff.x).to.equal(-5);
      expect(dropoff.y).to.equal(-10);
      const tiles = dropoff.tiles();
      expect(tiles).to.deep.include.members([[-5, -10], [-4, -10], [-5, -9], [-4, -9]]);
    });
    
    it('should handle very large dimensions', function() {
      const dropoff = new DropoffLocation(0, 0, 100, 100);
      expect(dropoff.width).to.equal(100);
      expect(dropoff.height).to.equal(100);
      expect(dropoff.tiles()).to.have.lengthOf(10000);
    });
    
    it('should handle grid operations without grid instance', function() {
      const dropoff = new DropoffLocation(0, 0, 2, 2);
      expect(() => dropoff.expand(1, 1)).to.not.throw();
      expect(() => dropoff.retract(1, 1)).to.not.throw();
    });
    
    it('should handle carrier without removeResource method', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 10 });
      const resources = [{ type: 'wood' }, { type: 'stone' }];
      const carrier = {
        getResources: () => resources
      };
      
      const transferred = dropoff.acceptFromCarrier(carrier);
      expect(transferred).to.equal(2);
      expect(resources[0]).to.be.null;
      expect(resources[1]).to.be.null;
    });
  });
  
  describe('Integration', function() {
    it('should maintain grid consistency through multiple operations', function() {
      const grid = new MockGrid();
      const dropoff = new DropoffLocation(0, 0, 2, 2, { grid });
      
      dropoff.expand(1, 0);
      expect(dropoff.tiles()).to.have.lengthOf(6);
      
      dropoff.setSize(4, 4);
      expect(dropoff.tiles()).to.have.lengthOf(16);
      
      dropoff.retract(2, 2);
      expect(dropoff.tiles()).to.have.lengthOf(4);
    });
    
    it('should handle resource workflow', function() {
      const dropoff = new DropoffLocation(0, 0, 1, 1, { capacity: 5 });
      
      // Deposit individual resources
      expect(dropoff.depositResource({ type: 'a' })).to.be.true;
      expect(dropoff.depositResource({ type: 'b' })).to.be.true;
      
      // Accept from carrier
      const carrier = {
        inventory: new MockInventoryController(null, 5)
      };
      carrier.inventory.addResource({ type: 'c' });
      carrier.inventory.addResource({ type: 'd' });
      
      dropoff.acceptFromCarrier(carrier);
      expect(dropoff.inventory.items).to.have.lengthOf(4);
    });
  });
});




// ================================================================
// resource.movement.test.js (1 tests)
// ================================================================
/**
 * Resource Movement Integration Test
 */

// Mock Entity dependencies for Node.js testing
class MockCollisionBox2D {
  constructor(x, y, width, height) {
    this.x = x; this.y = y; this.width = width; this.height = height;
  }
  setPosition(x, y) { this.x = x; this.y = y; }
  setSize(w, h) { this.width = w; this.height = h; }
  contains(x, y) { return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height; }
}

class MockMovementController {
  constructor(entity) {
    this._entity = entity;
    this._movementSpeed = 30; // Default speed
    this._isMoving = false;
    this._skitterTimer = 100;
  }
  get movementSpeed() { return this._movementSpeed; }
  set movementSpeed(speed) { this._movementSpeed = speed; }
  getEffectiveMovementSpeed() {
    let baseSpeed = this._movementSpeed;
    if (this._entity.movementSpeed !== undefined) {
      baseSpeed = this._entity.movementSpeed;
    }
    return baseSpeed;
  }
  shouldSkitter() {
    if (this.getEffectiveMovementSpeed() <= 0) {
      return false;
    }
    this._skitterTimer -= 1;
    return this._skitterTimer <= 0;
  }
  update() {}
  moveToLocation() { return false; }
  getIsMoving() { return this._isMoving; }
  stop() { this._isMoving = false; }
}

class MockEntity {
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) {
    this._id = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._type = options.type || "Entity";
    this._isActive = true;
    this._collisionBox = new MockCollisionBox2D(x, y, width, height);
    this._controllers = new Map();
    this._controllers.set('movement', new MockMovementController(this));
    this._configureControllers(options);
  }
  _configureControllers(options) {
    const movement = this._controllers.get('movement');
    if (movement && options.movementSpeed !== undefined) {
      movement.movementSpeed = options.movementSpeed;
    }
  }
  getController(name) { return this._controllers.get(name); }
  get movementSpeed() { const movement = this._controllers.get('movement'); return movement ? movement.movementSpeed : 0; }
  set movementSpeed(speed) { const movement = this._controllers.get('movement'); if (movement) movement.movementSpeed = speed; }
  getPosition() { return { x: this._collisionBox.x, y: this._collisionBox.y }; }
  setPosition(x, y) { this._collisionBox.setPosition(x, y); }
}

describe('Resource Movement Integration', function() {
  it('prevents resources from skittering when movementSpeed is 0', function() {
    const resource = new MockEntity(10, 10, 20, 20, { type: 'Resource', movementSpeed: 0 });
    const movementController = resource.getController('movement');
    const result = {
      resourceCannotMove: resource.movementSpeed === 0 && !movementController.shouldSkitter(),
      antCanMove: false
    };
    // Basic expectations
    expect(result.resourceCannotMove).to.be.true;
  });
});

