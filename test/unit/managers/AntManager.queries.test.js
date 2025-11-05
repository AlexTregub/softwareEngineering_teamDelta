/**
 * @file AntManager.queries.test.js
 * @description Unit tests for AntManager query methods (Phase 3.4.2)
 * 
 * Test Coverage:
 * - getAntsByJob() - filter by job name
 * - getAntsByFaction() - filter by faction
 * - getNearbyAnts() - spatial radius queries
 * - findAnt() - first matching predicate
 * - filterAnts() - all matching predicate
 * 
 * @author Software Engineering Team Delta
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment (JSDOM, p5.js, CollisionBox2D, Sprite2d)
setupTestEnvironment({ rendering: true, sprite: true });

describe('AntManager - Query Methods (Phase 3.4.2)', function() {
  let AntManager, AntController, BaseModel, BaseView, BaseController;
  let manager;
  
  before(function() {
    // Load MVC base classes first
    BaseModel = require('../../../Classes/models/BaseModel');
    BaseView = require('../../../Classes/views/BaseView');
    BaseController = require('../../../Classes/controllers/mvc/BaseController');
    
    // Set as globals for browser-like environment
    global.BaseModel = BaseModel;
    global.BaseView = BaseView;
    global.BaseController = BaseController;
    
    // Load ant dependencies (state machine, job system, resource manager)
    const AntStateMachine = require('../../../Classes/ants/antStateMachine');
    const JobComponent = require('../../../Classes/ants/JobComponent');
    const ResourceManager = require('../../../Classes/managers/ResourceManager');
    
    global.AntStateMachine = AntStateMachine;
    global.JobComponent = JobComponent;
    global.ResourceManager = ResourceManager;
    
    // Load entity classes (they use globals)
    const AntModel = require('../../../Classes/models/AntModel');
    const AntView = require('../../../Classes/views/AntView');
    AntController = require('../../../Classes/controllers/mvc/AntController');
    
    // Set entity classes as globals too
    global.AntModel = AntModel;
    global.AntView = AntView;
    global.AntController = AntController;
    
    // Mock spatialGridManager (required dependency)
    global.spatialGridManager = {
      addEntity: sinon.spy(),
      removeEntity: sinon.spy()
    };
    
    // Load AntManager
    AntManager = require('../../../Classes/managers/AntManager');
  });
  
  beforeEach(function() {
    manager = new AntManager();
    
    // Reset spatial grid spy calls
    global.spatialGridManager.addEntity.resetHistory();
    global.spatialGridManager.removeEntity.resetHistory();
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  // ========================================
  // getAntsByJob() Tests
  // ========================================
  
  describe('getAntsByJob()', function() {
    it('should return empty array when no ants match job', function() {
      manager.createAnt(100, 100, { jobName: 'Worker' });
      manager.createAnt(200, 200, { jobName: 'Soldier' });
      
      const result = manager.getAntsByJob('Scout');
      
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });
    
    it('should return all ants with matching job', function() {
      const worker1 = manager.createAnt(100, 100, { jobName: 'Worker' });
      manager.createAnt(200, 200, { jobName: 'Soldier' });
      const worker2 = manager.createAnt(300, 300, { jobName: 'Worker' });
      
      const result = manager.getAntsByJob('Worker');
      
      expect(result).to.have.lengthOf(2);
      expect(result).to.include(worker1);
      expect(result).to.include(worker2);
    });
    
    it('should be case-sensitive', function() {
      manager.createAnt(100, 100, { jobName: 'Worker' });
      
      const result = manager.getAntsByJob('worker');
      
      expect(result).to.have.lengthOf(0);
    });
    
    it('should return new array each call', function() {
      manager.createAnt(100, 100, { jobName: 'Worker' });
      
      const result1 = manager.getAntsByJob('Worker');
      const result2 = manager.getAntsByJob('Worker');
      
      expect(result1).to.not.equal(result2);
    });
    
    it('should handle empty registry', function() {
      const result = manager.getAntsByJob('Worker');
      
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });
    
    it('should handle undefined job name', function() {
      manager.createAnt(100, 100); // No job specified
      
      const result = manager.getAntsByJob(undefined);
      
      expect(result).to.be.an('array');
    });
  });
  
  // ========================================
  // getAntsByFaction() Tests
  // ========================================
  
  describe('getAntsByFaction()', function() {
    it('should return empty array when no ants match faction', function() {
      manager.createAnt(100, 100, { faction: 'player' });
      manager.createAnt(200, 200, { faction: 'player' });
      
      const result = manager.getAntsByFaction('enemy');
      
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });
    
    it('should return all ants with matching faction', function() {
      const player1 = manager.createAnt(100, 100, { faction: 'player' });
      manager.createAnt(200, 200, { faction: 'enemy' });
      const player2 = manager.createAnt(300, 300, { faction: 'player' });
      
      const result = manager.getAntsByFaction('player');
      
      expect(result).to.have.lengthOf(2);
      expect(result).to.include(player1);
      expect(result).to.include(player2);
    });
    
    it('should be case-sensitive', function() {
      manager.createAnt(100, 100, { faction: 'player' });
      
      const result = manager.getAntsByFaction('Player');
      
      expect(result).to.have.lengthOf(0);
    });
    
    it('should return new array each call', function() {
      manager.createAnt(100, 100, { faction: 'player' });
      
      const result1 = manager.getAntsByFaction('player');
      const result2 = manager.getAntsByFaction('player');
      
      expect(result1).to.not.equal(result2);
    });
    
    it('should handle empty registry', function() {
      const result = manager.getAntsByFaction('player');
      
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });
    
    it('should handle undefined faction', function() {
      manager.createAnt(100, 100); // No faction specified
      
      const result = manager.getAntsByFaction(undefined);
      
      expect(result).to.be.an('array');
    });
  });
  
  // ========================================
  // getNearbyAnts() Tests
  // ========================================
  
  describe('getNearbyAnts()', function() {
    it('should return ants within radius', function() {
      const center = manager.createAnt(100, 100);
      const nearby = manager.createAnt(110, 110); // ~14 units away
      manager.createAnt(200, 200); // Far away
      
      const result = manager.getNearbyAnts(100, 100, 20);
      
      expect(result).to.have.lengthOf(2);
      expect(result).to.include(center);
      expect(result).to.include(nearby);
    });
    
    it('should return empty array when no ants in radius', function() {
      manager.createAnt(100, 100);
      manager.createAnt(200, 200);
      
      const result = manager.getNearbyAnts(500, 500, 10);
      
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });
    
    it('should handle zero radius', function() {
      manager.createAnt(100, 100);
      
      const result = manager.getNearbyAnts(100, 100, 0);
      
      expect(result).to.be.an('array');
    });
    
    it('should handle negative coordinates', function() {
      const ant = manager.createAnt(-50, -50);
      
      const result = manager.getNearbyAnts(-50, -50, 10);
      
      expect(result).to.include(ant);
    });
  });
  
  // ========================================
  // findAnt() Tests
  // ========================================
  
  describe('findAnt()', function() {
    it('should return first matching ant', function() {
      const worker1 = manager.createAnt(100, 100, { jobName: 'Worker' });
      manager.createAnt(200, 200, { jobName: 'Worker' });
      
      const result = manager.findAnt(ant => ant.jobName === 'Worker');
      
      expect(result).to.equal(worker1);
    });
    
    it('should return undefined when no match', function() {
      manager.createAnt(100, 100, { jobName: 'Worker' });
      
      const result = manager.findAnt(ant => ant.jobName === 'Scout');
      
      expect(result).to.be.undefined;
    });
  });
  
  // ========================================
  // filterAnts() Tests
  // ========================================
  
  describe('filterAnts()', function() {
    it('should return all matching ants', function() {
      const worker1 = manager.createAnt(100, 100, { jobName: 'Worker' });
      manager.createAnt(200, 200, { jobName: 'Soldier' });
      const worker2 = manager.createAnt(300, 300, { jobName: 'Worker' });
      
      const result = manager.filterAnts(ant => ant.jobName === 'Worker');
      
      expect(result).to.have.lengthOf(2);
      expect(result).to.include(worker1);
      expect(result).to.include(worker2);
    });
    
    it('should return empty array when no matches', function() {
      manager.createAnt(100, 100, { jobName: 'Worker' });
      
      const result = manager.filterAnts(ant => ant.jobName === 'Scout');
      
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });
  });
});
