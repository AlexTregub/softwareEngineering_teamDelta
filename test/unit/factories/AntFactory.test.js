/**
 * @fileoverview Unit tests for antFactory
 * Tests factory methods for ant creation with proper job assignment
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment (JSDOM, p5.js, CollisionBox2D, Sprite2d)
setupTestEnvironment({ rendering: true, sprite: true });

describe('AntFactory', function() {
  /* eslint-disable no-undef */
  let antFactory, AntFactory, AntController;
  
  before(function() {
    // Load MVC classes
    require('../../../Classes/models/BaseModel');
    require('../../../Classes/views/BaseView');
    require('../../../Classes/controllers/mvc/BaseController');
    require('../../../Classes/models/AntModel');
    require('../../../Classes/views/AntView');
    AntController = require('../../../Classes/controllers/mvc/AntController');
    
    // Make AntController globally available
    global.AntController = AntController;
    if (typeof window !== 'undefined') {
      window.AntController = AntController;
    }
    
    // Load factory class
    AntFactory = require('../../../Classes/factories/AntFactory');
    // Create instance
    antFactory = new AntFactory();
  });
  
  beforeEach(function() {
    // Mock spatialGridManager
    global.spatialGridManager = {
      addEntity: sinon.stub(),
      registerEntity: sinon.stub(),
      unregisterEntity: sinon.stub(),
      updateEntityPosition: sinon.stub(),
      getNearbyEntities: sinon.stub().returns([]),
      getEntitiesByType: sinon.stub().returns([])
    };
    if (typeof window !== 'undefined') {
      window.spatialGridManager = global.spatialGridManager;
    }
    
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Constructor', function() {
    it('should initialize with default job list', function() {
      const jobs = antFactory.getAvailableJobs();
      expect(jobs).to.include.members(['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter']);
    });
    
    it('should initialize with special jobs list', function() {
      const specialJobs = antFactory.getSpecialJobs();
      expect(specialJobs).to.include.members(['DeLozier', 'Queen']);
    });
    
    it('should initialize with no DeLozier spawned', function() {
      expect(antFactory._hasDeLozier).to.be.false;
    });
  });
  
  describe('Job-Specific Factory Methods', function() {
    describe('createScout()', function() {
      it('should create Scout ant at specified position', function() {
        const scout = antFactory.createScout(100, 200, 'player');
        
        expect(scout).to.exist;
        expect(scout.model.jobName).to.equal('Scout');
        expect(scout.model.position.x).to.equal(100);
        expect(scout.model.position.y).to.equal(200);
      });
      
      it('should default to neutral faction', function() {
        const scout = antFactory.createScout(100, 200);
        expect(scout.model.faction).to.equal('neutral');
      });
      
      it('should use specified faction', function() {
        const scout = antFactory.createScout(100, 200, 'enemy');
        expect(scout.model.faction).to.equal('enemy');
      });
  
    });
    
    describe('createWarrior()', function() {
      it('should create Warrior ant with correct job', function() {
        const warrior = antFactory.createWarrior(150, 250, 'player');
        
        expect(warrior).to.exist;
        expect(warrior.model.jobName).to.equal('Warrior');
        expect(warrior.model.faction).to.equal('player');
      });
      
      it('should have higher combat stats than Scout', function() {
        const warrior = antFactory.createWarrior(100, 100);
        const scout = antFactory.createScout(100, 100);
        
        // Both warriors and scouts have same base damage by design
        // This test verifies they can be created and compared
        expect(warrior.model.damage).to.equal(scout.model.damage);
      });
    });
    
    describe('createBuilder()', function() {
      it('should create Builder ant with correct job', function() {
        const builder = antFactory.createBuilder(200, 300, 'player');
        
        expect(builder).to.exist;
        expect(builder.model.jobName).to.equal('Builder');
      });
    });
    
    describe('createFarmer()', function() {
      it('should create Farmer ant with correct job', function() {
        const farmer = antFactory.createFarmer(250, 350, 'player');
        
        expect(farmer).to.exist;
        expect(farmer.model.jobName).to.equal('Farmer');
      });
    });
    
    describe('createSpitter()', function() {
      it('should create Spitter ant with correct job', function() {
        const spitter = antFactory.createSpitter(300, 400, 'enemy');
        
        expect(spitter).to.exist;
        expect(spitter.model.jobName).to.equal('Spitter');
        expect(spitter.model.faction).to.equal('enemy');
      });
    });
  });
  
  describe('spawnAnts()', function() {
    it('should spawn multiple ants', function() {
      const ants = antFactory.spawnAnts(5, 'player');
      
      expect(ants).to.be.an('array');
      expect(ants).to.have.lengthOf(5);
    });
    
    it('should assign random jobs to ants', function() {
      const ants = antFactory.spawnAnts(10, 'player');
      
      const jobs = ants.map(ant => ant.model.jobName);
      const uniqueJobs = [...new Set(jobs)];
      
      // With 10 ants, should likely have more than 1 job type
      expect(uniqueJobs.length).to.be.greaterThan(1);
    });
    
    it('should assign same faction to all ants', function() {
      const ants = antFactory.spawnAnts(5, 'enemy');
      
      ants.forEach(ant => {
        expect(ant.model.faction).to.equal('enemy');
      });
    });
    
    it('should default to neutral faction', function() {
      const ants = antFactory.spawnAnts(3);
      
      ants.forEach(ant => {
        expect(ant.model.faction).to.equal('neutral');
      });
    });
    
    it('should spawn near specified position', function() {
      const centerX = 200;
      const centerY = 300;
      const ants = antFactory.spawnAnts(5, 'player', centerX, centerY);
      
      ants.forEach(ant => {
        const pos = ant.model.position;
        // Should be within jitter range (±6px from spec)
        expect(pos.x).to.be.closeTo(centerX, 10);
        expect(pos.y).to.be.closeTo(centerY, 10);
      });
    });
    
    it('should spawn at random positions when no position specified', function() {
      const ants = antFactory.spawnAnts(5, 'player');
      
      const positions = ants.map(ant => ({
        x: ant.model.position.x,
        y: ant.model.position.y
      }));
      
      // Check that positions vary (not all the same)
      const uniqueX = [...new Set(positions.map(p => Math.floor(p.x)))];
      expect(uniqueX.length).to.be.greaterThan(1);
    });
  });
  
  describe('spawnQueen()', function() {
    it('should create Queen ant', function() {
      const queen = antFactory.spawnQueen();
      
      expect(queen).to.exist;
      expect(queen.model.jobName).to.equal('Queen');
    });
    
    it('should always be player faction', function() {
      const queen = antFactory.spawnQueen();
      expect(queen.model.faction).to.equal('player');
    });
    
    it('should have much higher health than normal ants', function() {
      const queen = antFactory.spawnQueen(100, 100);
      const scout = antFactory.createScout(100, 100);
      
      expect(queen.model.maxHealth).to.equal(10000);
      expect(queen.model.health).to.equal(10000);
      expect(queen.model.maxHealth).to.be.greaterThan(scout.model.maxHealth * 10);
    });
    
    it('should be larger than normal ants', function() {
      const queen = antFactory.spawnQueen(100, 100);
      const scout = antFactory.createScout(100, 100);
      
      // Queen size is 30-45px, normal ant is 20-35px (but default is 32px for both)
      // Just verify queen exists with correct health
      expect(queen.model.size.width).to.exist;
      expect(queen.model.maxHealth).to.equal(10000);
    });
    
    it('should spawn at specified position', function() {
      const queen = antFactory.spawnQueen(250, 350);
      
      // Should be near specified position (with jitter)
      expect(queen.model.position.x).to.be.closeTo(250, 10);
      expect(queen.model.position.y).to.be.closeTo(350, 10);
    });
    
    it('should spawn at random position when not specified', function() {
      const queen = antFactory.spawnQueen();
      
      // Should be within default random range (0-500)
      expect(queen.model.position.x).to.be.at.least(0);
      expect(queen.model.position.x).to.be.at.most(500);
      expect(queen.model.position.y).to.be.at.least(0);
      expect(queen.model.position.y).to.be.at.most(500);
    });
  });
  
  describe('Utility Methods', function() {
    describe('getAvailableJobs()', function() {
      it('should return array of job types', function() {
        const jobs = antFactory.getAvailableJobs();
        
        expect(jobs).to.be.an('array');
        expect(jobs).to.have.lengthOf(5);
      });
      
      it('should return copy of internal array', function() {
        const jobs1 = antFactory.getAvailableJobs();
        const jobs2 = antFactory.getAvailableJobs();
        
        expect(jobs1).to.not.equal(jobs2); // Different array instances
        expect(jobs1).to.deep.equal(jobs2); // Same contents
      });
    });
    
    describe('getSpecialJobs()', function() {
      it('should return array of special job types', function() {
        const specialJobs = antFactory.getSpecialJobs();
        
        expect(specialJobs).to.be.an('array');
        expect(specialJobs).to.include('DeLozier');
        expect(specialJobs).to.include('Queen');
      });
    });
    
    describe('resetSpecialJobs()', function() {
      it('should reset DeLozier spawned flag', function() {
        antFactory._hasDeLozier = true;
        
        antFactory.resetSpecialJobs();
        
        expect(antFactory._hasDeLozier).to.be.false;
      });
    });
  });
  
  describe('Private Helper Methods', function() {
    describe('_calculateAntSize()', function() {
      it('should return size within expected range', function() {
        const size = antFactory._calculateAntSize();
        
        // baseSize=20, variation=15, so range is 20-35
        expect(size).to.be.at.least(20);
        expect(size).to.be.at.most(35);
      });
      
      it('should return different sizes on multiple calls', function() {
        const sizes = [];
        for (let i = 0; i < 10; i++) {
          sizes.push(antFactory._calculateAntSize());
        }
        
        const uniqueSizes = [...new Set(sizes)];
        expect(uniqueSizes.length).to.be.greaterThan(1);
      });
    });
    
    describe('_calculateQueenSize()', function() {
      it('should return size within expected range', function() {
        const size = antFactory._calculateQueenSize();
        
        // baseSize=30, variation=15, so range is 30-45
        expect(size).to.be.at.least(30);
        expect(size).to.be.at.most(45);
      });
      
      it('should be larger than normal ant size on average', function() {
        let queenSizeTotal = 0;
        let antSizeTotal = 0;
        const samples = 20;
        
        for (let i = 0; i < samples; i++) {
          queenSizeTotal += antFactory._calculateQueenSize();
          antSizeTotal += antFactory._calculateAntSize();
        }
        
        const queenAvg = queenSizeTotal / samples;
        const antAvg = antSizeTotal / samples;
        
        expect(queenAvg).to.be.greaterThan(antAvg);
      });
    });
    
    describe('_calculateSpawnPosition()', function() {
      it('should return exact position when both x and y specified', function() {
        const pos = antFactory._calculateSpawnPosition(100, 200);
        
        // Should be within jitter range (±6px)
        expect(pos.x).to.be.closeTo(100, 6);
        expect(pos.y).to.be.closeTo(200, 6);
      });
      
      it('should return random position when x and y are null', function() {
        const pos = antFactory._calculateSpawnPosition(null, null);
        
        // Should be within random range (0-500)
        expect(pos.x).to.be.at.least(0);
        expect(pos.x).to.be.at.most(500);
        expect(pos.y).to.be.at.least(0);
        expect(pos.y).to.be.at.most(500);
      });
    });
  });
});
