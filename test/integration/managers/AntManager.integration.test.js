/**
 * @file AntManager.integration.test.js
 * @description Integration tests for AntManager with real game systems (Phase 3.4.5)
 * 
 * Tests:
 * - AntManager + SpatialGridManager integration
 * - AntManager replacing legacy global ants[] array
 * - AntController feature parity with legacy ant class
 * - antsSpawn/antsUpdate/antsRender function integration
 * 
 * Goal: Verify AntController can fully replace legacy ant class
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment, loadAntMVCStack } = require('../../helpers/mvcTestHelpers');

setupTestEnvironment({ rendering: true, sprite: true });

describe('AntManager Integration (Phase 3.4.5)', function() {
  let AntManager, antManager;

  before(function() {
    // Load complete Ant MVC stack
    const loadedClasses = loadAntMVCStack();
    AntManager = loadedClasses.AntManager;
  });

  beforeEach(function() {
    antManager = AntManager.getInstance();
    antManager._ants.clear();
    antManager._pausedAnts.clear();
  });

  afterEach(function() {
    cleanupTestEnvironment();
  });

  // ========================================
  // Feature Parity Tests: AntController vs Legacy ant
  // ========================================
  
  describe('Feature Parity: AntController matches legacy ant class', function() {
    describe('Core Identity & Properties', function() {
      it('should have antIndex property', function() {
        const ant = antManager.createAnt(100, 100, { jobName: 'Worker' });
        
        expect(ant.antIndex).to.be.a('number');
        expect(ant.antIndex).to.be.greaterThanOrEqual(0);
      });

      it('should have jobName property', function() {
        const ant = antManager.createAnt(100, 100, { jobName: 'Warrior' });
        
        expect(ant.jobName).to.equal('Warrior');
      });

      it('should have faction property', function() {
        const ant = antManager.createAnt(100, 100, { faction: 'player' });
        
        expect(ant.faction).to.equal('player');
      });

      it('should have position property', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.position).to.be.an('object');
        expect(ant.position.x).to.equal(100);
        expect(ant.position.y).to.equal(100);
      });
    });

    describe('Movement API', function() {
      it('should support moveTo(x, y)', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.moveTo).to.be.a('function');
        expect(() => ant.moveTo(200, 200)).to.not.throw();
      });

      it('should support stopMovement()', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.stopMovement).to.be.a('function');
        expect(() => ant.stopMovement()).to.not.throw();
      });
    });

    describe('Combat API', function() {
      it('should support takeDamage(amount)', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.takeDamage).to.be.a('function');
        expect(() => ant.takeDamage(10)).to.not.throw();
      });

      it('should support heal(amount)', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.heal).to.be.a('function');
        expect(() => ant.heal(10)).to.not.throw();
      });

      it('should support attack(target)', function() {
        const ant = antManager.createAnt(100, 100);
        const target = antManager.createAnt(200, 200, { faction: 'enemy' });
        
        expect(ant.attack).to.be.a('function');
        expect(() => ant.attack(target)).to.not.throw();
      });

      it('should have health and maxHealth properties', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.health).to.be.a('number');
        expect(ant.maxHealth).to.be.a('number');
        expect(ant.health).to.be.at.most(ant.maxHealth);
      });
    });

    describe('Resource API', function() {
      it('should support addResource(resource)', function() {
        const ant = antManager.createAnt(100, 100);
        const resource = { type: 'food', amount: 1 };
        
        expect(ant.addResource).to.be.a('function');
        const result = ant.addResource(resource);
        expect(result).to.be.a('boolean');
      });

      it('should support removeResource(amount)', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.removeResource).to.be.a('function');
        const result = ant.removeResource(1);
        expect(result).to.be.an('array');
      });

      it('should support dropAllResources()', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.dropAllResources).to.be.a('function');
        const result = ant.dropAllResources();
        expect(result).to.be.an('array');
      });

      it('should have resourceCount property', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.resourceCount).to.be.a('number');
        expect(ant.resourceCount).to.be.greaterThanOrEqual(0);
      });
    });

    describe('Job API', function() {
      it('should support assignJob(jobName, image)', function() {
        const ant = antManager.createAnt(100, 100, { jobName: 'Scout' });
        
        expect(ant.assignJob).to.be.a('function');
        expect(() => ant.assignJob('Warrior', null)).to.not.throw();
        expect(ant.jobName).to.equal('Warrior');
      });
    });

    describe('State API', function() {
      it('should support setState(primary, combat, terrain)', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.setState).to.be.a('function');
        expect(() => ant.setState('MOVING', null, null)).to.not.throw();
      });

      it('should support getCurrentState()', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.getCurrentState).to.be.a('function');
        const state = ant.getCurrentState();
        expect(state).to.be.an('object');
        expect(state).to.have.property('primary');
      });
    });

    describe('Selection API', function() {
      it('should support setSelected(boolean)', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.setSelected).to.be.a('function');
        expect(() => ant.setSelected(true)).to.not.throw();
      });

      it('should have isSelected property', function() {
        const ant = antManager.createAnt(100, 100);
        
        ant.setSelected(true);
        expect(ant.isSelected()).to.be.true;
        
        ant.setSelected(false);
        expect(ant.isSelected()).to.be.false;
      });
    });

    describe('Lifecycle Methods', function() {
      it('should support update()', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.update).to.be.a('function');
        expect(() => ant.update()).to.not.throw();
      });

      it('should support render()', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.render).to.be.a('function');
        expect(() => ant.render()).to.not.throw();
      });

      it('should support destroy()', function() {
        const ant = antManager.createAnt(100, 100);
        
        expect(ant.destroy).to.be.a('function');
        expect(() => ant.destroy()).to.not.throw();
      });
    });
  });

  // ========================================
  // SpatialGridManager Integration
  // ========================================
  
  describe('SpatialGridManager Integration', function() {
    it('should auto-register ants with spatial grid on creation', function() {
      // Reset spy to clear previous calls
      global.spatialGridManager.addEntity.resetHistory();
      
      const ant = antManager.createAnt(100, 100);
      
      expect(global.spatialGridManager.addEntity.calledOnce).to.be.true;
      expect(global.spatialGridManager.addEntity.firstCall.args[0]).to.equal(ant);
    });

    it('should auto-remove ants from spatial grid on destruction', function() {
      const removeEntitySpy = global.spatialGridManager.removeEntity;
      
      const ant = antManager.createAnt(100, 100);
      const antId = ant.antIndex;
      antManager.destroyAnt(antId);
      
      expect(removeEntitySpy.calledOnce).to.be.true;
    });
  });

  // ========================================
  // Global ants[] Array Replacement
  // ========================================
  
  describe('Replacing global ants[] array', function() {
    it('should provide getAllAnts() as replacement for global ants[]', function() {
      antManager.createAnt(100, 100);
      antManager.createAnt(200, 200);
      antManager.createAnt(300, 300);
      
      const ants = antManager.getAllAnts();
      
      expect(ants).to.be.an('array');
      expect(ants).to.have.lengthOf(3);
    });

    it('should allow iteration like global ants[] array', function() {
      antManager.createAnt(100, 100, { jobName: 'Scout' });
      antManager.createAnt(200, 200, { jobName: 'Warrior' });
      
      const ants = antManager.getAllAnts();
      let count = 0;
      
      ants.forEach(ant => {
        expect(ant).to.have.property('jobName');
        count++;
      });
      
      expect(count).to.equal(2);
    });

    it('should support array access by index (for legacy code)', function() {
      antManager.createAnt(100, 100, { jobName: 'Scout' });
      antManager.createAnt(200, 200, { jobName: 'Warrior' });
      
      const ants = antManager.getAllAnts();
      
      expect(ants[0]).to.exist;
      expect(ants[0].jobName).to.equal('Scout');
      expect(ants[1]).to.exist;
      expect(ants[1].jobName).to.equal('Warrior');
    });
  });

  // ========================================
  // updateAll() Integration
  // ========================================
  
  describe('updateAll() batch operations', function() {
    it('should update all active ants', function() {
      const ant1 = antManager.createAnt(100, 100);
      const ant2 = antManager.createAnt(200, 200);
      const ant3 = antManager.createAnt(300, 300);
      
      const spy1 = sinon.spy(ant1, 'update');
      const spy2 = sinon.spy(ant2, 'update');
      const spy3 = sinon.spy(ant3, 'update');
      
      antManager.updateAll();
      
      expect(spy1.calledOnce).to.be.true;
      expect(spy2.calledOnce).to.be.true;
      expect(spy3.calledOnce).to.be.true;
    });

    it('should replace legacy antsUpdate() function', function() {
      // Create ants via manager
      antManager.createAnt(100, 100);
      antManager.createAnt(200, 200);
      
      // updateAll() should work like antsUpdate()
      expect(() => antManager.updateAll()).to.not.throw();
      
      // Verify ants were updated
      const ants = antManager.getAllAnts();
      expect(ants).to.have.lengthOf(2);
    });
  });

  // ========================================
  // Faction-based Queries (replacing legacy utility functions)
  // ========================================
  
  describe('Faction-based queries (replacing AntUtilities)', function() {
    it('should get ants by faction', function() {
      antManager.createAnt(100, 100, { faction: 'player' });
      antManager.createAnt(200, 200, { faction: 'player' });
      antManager.createAnt(300, 300, { faction: 'enemy' });
      
      const playerAnts = antManager.getAntsByFaction('player');
      const enemyAnts = antManager.getAntsByFaction('enemy');
      
      expect(playerAnts).to.have.lengthOf(2);
      expect(enemyAnts).to.have.lengthOf(1);
    });

    it('should get ants by job', function() {
      antManager.createAnt(100, 100, { jobName: 'Worker' });
      antManager.createAnt(200, 200, { jobName: 'Worker' });
      antManager.createAnt(300, 300, { jobName: 'Warrior' });
      
      const workers = antManager.getAntsByJob('Worker');
      const warriors = antManager.getAntsByJob('Warrior');
      
      expect(workers).to.have.lengthOf(2);
      expect(warriors).to.have.lengthOf(1);
    });
  });

  // ========================================
  // Selection Integration
  // ========================================
  
  describe('Selection system integration', function() {
    it('should get selected ant', function() {
      antManager.createAnt(100, 100);
      const ant2 = antManager.createAnt(200, 200);
      
      ant2.setSelected(true);
      
      const selected = antManager.getSelectedAnt();
      
      expect(selected).to.equal(ant2);
    });

    it('should get all selected ants', function() {
      const ant1 = antManager.createAnt(100, 100);
      antManager.createAnt(200, 200);
      const ant3 = antManager.createAnt(300, 300);
      
      ant1.setSelected(true);
      ant3.setSelected(true);
      
      const selected = antManager.getSelectedAnts();
      
      expect(selected).to.have.lengthOf(2);
      expect(selected).to.include(ant1);
      expect(selected).to.include(ant3);
    });

    it('should clear all selections', function() {
      const ant1 = antManager.createAnt(100, 100);
      const ant2 = antManager.createAnt(200, 200);
      
      ant1.setSelected(true);
      ant2.setSelected(true);
      
      antManager.clearSelection();
      
      expect(ant1.isSelected()).to.be.false;
      expect(ant2.isSelected()).to.be.false;
    });
  });
});
