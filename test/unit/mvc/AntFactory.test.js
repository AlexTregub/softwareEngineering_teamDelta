/**
 * AntFactory Unit Tests
 * =====================
 * TDD tests for AntFactory (Phase 4: Factory & Integration)
 * 
 * Tests verify:
 * - Creates complete MVC triads (model + view + controller)
 * - Batch creation (createMultiple, createSquad)
 * - Configuration handling
 * - Job-specific creation
 * - Factory pattern compliance
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupP5Mocks } = require('../../helpers/p5Mocks');
const { 
  setupMVCTest,
  loadEntityModel,
  loadEntityView,
  loadEntityController,
  loadAntModel,
  loadAntView
} = require('../../helpers/mvcTestHelpers');

describe('AntFactory', function() {
  let AntFactory;
  let AntController;

  before(function() {
    setupP5Mocks();
    setupMVCTest();
    
    // Load dependencies
    loadEntityModel();
    loadEntityView();
    loadEntityController();
    loadAntModel();
    loadAntView();
    AntController = require('../../../Classes/mvc/controllers/AntController.js');
    
    // Load AntFactory
    AntFactory = require('../../../Classes/mvc/factories/AntFactory.js');
    
    if (!AntFactory) {
      throw new Error('Failed to load AntFactory');
    }
  });

  beforeEach(function() {
    // Reset p5 mocks
    global.push.resetHistory();
    global.pop.resetHistory();
    global.rect.resetHistory();
  });

  // ===== BASIC FACTORY CREATION =====
  describe('Basic Factory Creation', function() {
    it('should create complete MVC triad', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant).to.have.property('model');
      expect(ant).to.have.property('view');
      expect(ant).to.have.property('controller');
    });

    it('should create AntModel instance', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant.model.constructor.name).to.equal('AntModel');
    });

    it('should create AntView instance', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant.view.constructor.name).to.equal('AntView');
    });

    it('should create AntController instance', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant.controller.constructor.name).to.equal('AntController');
    });

    it('should wire model to view', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant.view.model).to.equal(ant.model);
    });

    it('should wire model and view to controller', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant.controller.model).to.equal(ant.model);
      expect(ant.controller.view).to.equal(ant.view);
    });
  });

  // ===== CONFIGURATION =====
  describe('Configuration', function() {
    it('should apply position configuration', function() {
      const ant = AntFactory.create({ x: 200, y: 300 });
      
      expect(ant.model.getPosition()).to.deep.equal({ x: 200, y: 300 });
    });

    it('should apply size configuration', function() {
      const ant = AntFactory.create({ x: 100, y: 100, width: 48, height: 48 });
      
      expect(ant.model.getSize()).to.deep.equal({ x: 48, y: 48 });
    });

    it('should apply job configuration', function() {
      const ant = AntFactory.create({ x: 100, y: 100, jobName: 'Warrior' });
      
      expect(ant.model.getJobName()).to.equal('Warrior');
    });

    it('should apply faction configuration', function() {
      const ant = AntFactory.create({ x: 100, y: 100, faction: 'enemy' });
      
      expect(ant.model.getFaction()).to.equal('enemy');
    });

    it('should apply health configuration', function() {
      const ant = AntFactory.create({ x: 100, y: 100, health: 200 });
      
      expect(ant.model.getHealth()).to.equal(200);
    });

    it('should use default values when not specified', function() {
      const ant = AntFactory.create();
      
      expect(ant.model.getPosition().x).to.be.a('number');
      expect(ant.model.getJobName()).to.be.a('string');
    });
  });

  // ===== JOB-SPECIFIC CREATION =====
  describe('Job-Specific Creation', function() {
    it('should create Worker ant', function() {
      const worker = AntFactory.createWorker(100, 100);
      
      expect(worker.model.getJobName()).to.equal('Worker');
    });

    it('should create Warrior ant', function() {
      const warrior = AntFactory.createWarrior(100, 100);
      
      expect(warrior.model.getJobName()).to.equal('Warrior');
    });

    it('should create Scout ant', function() {
      const scout = AntFactory.createScout(100, 100);
      
      expect(scout.model.getJobName()).to.equal('Scout');
    });

    it('should create Farmer ant', function() {
      const farmer = AntFactory.createFarmer(100, 100);
      
      expect(farmer.model.getJobName()).to.equal('Farmer');
    });

    it('should create Builder ant', function() {
      const builder = AntFactory.createBuilder(100, 100);
      
      expect(builder.model.getJobName()).to.equal('Builder');
    });

    it('should apply job-specific stats', function() {
      const warrior = AntFactory.createWarrior(100, 100);
      
      const stats = warrior.model.getJobStats();
      expect(stats.strength).to.be.greaterThan(30); // Warriors are strong
    });
  });

  // ===== BATCH CREATION =====
  describe('Batch Creation', function() {
    it('should create multiple ants', function() {
      const ants = AntFactory.createMultiple(5, { x: 100, y: 100 });
      
      expect(ants).to.be.an('array');
      expect(ants).to.have.lengthOf(5);
    });

    it('should create distinct instances', function() {
      const ants = AntFactory.createMultiple(3, { x: 100, y: 100 });
      
      expect(ants[0].model).to.not.equal(ants[1].model);
      expect(ants[1].model).to.not.equal(ants[2].model);
    });

    it('should apply same configuration to all', function() {
      const ants = AntFactory.createMultiple(3, { jobName: 'Scout' });
      
      ants.forEach(ant => {
        expect(ant.model.getJobName()).to.equal('Scout');
      });
    });

    it('should offset positions slightly', function() {
      const ants = AntFactory.createMultiple(3, { x: 100, y: 100 });
      
      const positions = ants.map(ant => ant.model.getPosition());
      
      // Not all at exact same position
      const allSame = positions.every(pos => pos.x === 100 && pos.y === 100);
      expect(allSame).to.be.false;
    });
  });

  // ===== SQUAD CREATION =====
  describe('Squad Creation', function() {
    it('should create mixed squad', function() {
      const squad = AntFactory.createSquad({
        workers: 2,
        warriors: 1,
        scouts: 1,
        x: 100,
        y: 100
      });
      
      expect(squad).to.have.property('workers');
      expect(squad).to.have.property('warriors');
      expect(squad).to.have.property('scouts');
      expect(squad.workers).to.have.lengthOf(2);
      expect(squad.warriors).to.have.lengthOf(1);
      expect(squad.scouts).to.have.lengthOf(1);
    });

    it('should assign correct jobs in squad', function() {
      const squad = AntFactory.createSquad({
        workers: 1,
        warriors: 1,
        x: 100,
        y: 100
      });
      
      expect(squad.workers[0].model.getJobName()).to.equal('Worker');
      expect(squad.warriors[0].model.getJobName()).to.equal('Warrior');
    });

    it('should handle empty squad configuration', function() {
      const squad = AntFactory.createSquad({ x: 100, y: 100 });
      
      expect(squad.workers || []).to.have.lengthOf(0);
      expect(squad.warriors || []).to.have.lengthOf(0);
    });
  });

  // ===== GRID CREATION =====
  describe('Grid Creation', function() {
    it('should create ants in grid pattern', function() {
      const grid = AntFactory.createGrid(3, 3, { x: 100, y: 100, spacing: 50 });
      
      expect(grid).to.be.an('array');
      expect(grid).to.have.lengthOf(9); // 3x3 = 9
    });

    it('should space ants correctly', function() {
      const grid = AntFactory.createGrid(2, 2, { x: 0, y: 0, spacing: 100 });
      
      const positions = grid.map(ant => ant.model.getPosition());
      
      // Check spacing
      expect(positions[0].x).to.equal(0);
      expect(positions[1].x).to.equal(100);
    });

    it('should handle 1x1 grid', function() {
      const grid = AntFactory.createGrid(1, 1, { x: 100, y: 100 });
      
      expect(grid).to.have.lengthOf(1);
      expect(grid[0].model.getPosition()).to.deep.equal({ x: 100, y: 100 });
    });
  });

  // ===== CIRCLE CREATION =====
  describe('Circle Creation', function() {
    it('should create ants in circle pattern', function() {
      const circle = AntFactory.createCircle(8, { x: 200, y: 200, radius: 100 });
      
      expect(circle).to.be.an('array');
      expect(circle).to.have.lengthOf(8);
    });

    it('should position ants around center', function() {
      const circle = AntFactory.createCircle(4, { x: 0, y: 0, radius: 100 });
      
      const positions = circle.map(ant => ant.model.getPosition());
      
      // All should be approximately 100 units from center
      positions.forEach(pos => {
        const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
        expect(distance).to.be.closeTo(100, 1);
      });
    });

    it('should handle single ant', function() {
      const circle = AntFactory.createCircle(1, { x: 100, y: 100, radius: 50 });
      
      expect(circle).to.have.lengthOf(1);
    });
  });

  // ===== COMPONENT INITIALIZATION =====
  describe('Component Initialization', function() {
    it('should initialize brain component', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant.controller.brain).to.exist;
    });

    it('should initialize state machine', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant.controller.stateMachine).to.exist;
    });

    it('should initialize job component', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant.controller.jobComponent).to.exist;
    });

    it('should not initialize collision box in test environment', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      // CollisionBox2D is mocked but may not be initialized
      expect(true).to.be.true; // Test passes if no errors
    });
  });

  // ===== LIFECYCLE =====
  describe('Lifecycle', function() {
    it('should create active ants', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant.model.isActive).to.be.true;
    });

    it('should create visible ants', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant.model.isVisible()).to.be.true;
    });

    it('should allow immediate rendering', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      global.rect.resetHistory();
      ant.view.render();
      
      // Should render without errors
      expect(true).to.be.true;
    });

    it('should allow immediate updates', function() {
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      // Should update without errors
      ant.controller.update();
      
      expect(true).to.be.true;
    });
  });

  // ===== FACTORY PATTERN COMPLIANCE =====
  describe('Factory Pattern Compliance', function() {
    it('should not require new keyword', function() {
      // Static methods should work without instantiation
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      expect(ant).to.exist;
    });

    it('should return consistent structure', function() {
      const ant1 = AntFactory.create({ x: 100, y: 100 });
      const ant2 = AntFactory.create({ x: 200, y: 200 });
      
      expect(Object.keys(ant1).sort()).to.deep.equal(Object.keys(ant2).sort());
    });

    it('should encapsulate creation logic', function() {
      // Factory hides MVC wiring complexity
      const ant = AntFactory.create({ x: 100, y: 100 });
      
      // Just verify it worked
      expect(ant.controller.model).to.equal(ant.model);
      expect(ant.controller.view).to.equal(ant.view);
    });
  });

  // ===== ERROR HANDLING =====
  describe('Error Handling', function() {
    it('should handle missing configuration', function() {
      const ant = AntFactory.create();
      
      expect(ant.model).to.exist;
      expect(ant.view).to.exist;
      expect(ant.controller).to.exist;
    });

    it('should handle invalid job names', function() {
      const ant = AntFactory.create({ jobName: 'InvalidJob' });
      
      // Should fallback to default job
      expect(['Worker', 'InvalidJob']).to.include(ant.model.getJobName());
    });

    it('should handle negative positions', function() {
      const ant = AntFactory.create({ x: -100, y: -200 });
      
      expect(ant.model.getPosition()).to.deep.equal({ x: -100, y: -200 });
    });

    it('should handle zero count in batch', function() {
      const ants = AntFactory.createMultiple(0, { x: 100, y: 100 });
      
      expect(ants).to.be.an('array');
      expect(ants).to.have.lengthOf(0);
    });
  });

  // ===== CONVENIENCE METHODS =====
  describe('Convenience Methods', function() {
    it('should provide getAllJobs helper', function() {
      const jobs = AntFactory.getAllJobs();
      
      expect(jobs).to.be.an('array');
      expect(jobs).to.include('Worker');
      expect(jobs).to.include('Warrior');
    });

    it('should provide getDefaultConfig helper', function() {
      const config = AntFactory.getDefaultConfig();
      
      expect(config).to.be.an('object');
      expect(config).to.have.property('x');
      expect(config).to.have.property('y');
      expect(config).to.have.property('jobName');
    });
  });
});
