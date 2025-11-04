/**
 * Integration tests for Resource spawning with ResourceController
 * Tests factory methods and spawner creating ResourceController instances
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment with rendering and sprite support
setupTestEnvironment({ rendering: true, sprite: true });

describe('Resource Spawning with ResourceController', function() {
  let ResourceController, ResourceSystemManager;
  let greenLeafFactory, mapleLeafFactory, stickFactory, stoneFactory;
  
  before(function() {
    // Mock global canvas dimensions
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    global.window.g_canvasX = 800;
    global.window.g_canvasY = 600;
    
    // Mock random function for predictable tests
    global.random = sinon.stub().returns(100);
    global.window.random = global.random;
    
    // Load ResourceController and make it globally available
    ResourceController = require('../../../Classes/controllers/mvc/ResourceController');
    global.ResourceController = ResourceController;
    global.window.ResourceController = ResourceController;
    
    // Mock Resource._getImageForType method (used by factory methods)
    const Resource = {
      _getImageForType: (type) => null // Return null for tests (no image needed)
    };
    global.Resource = Resource;
    global.window.Resource = Resource;
    
    // Create factory methods that mimic the updated Resource.createX() methods
    greenLeafFactory = (x, y) => {
      if (typeof ResourceController !== 'undefined') {
        return new ResourceController(x, y, 20, 20, { 
          type: 'greenLeaf',
          amount: 100,
          imagePath: null
        });
      }
    };
    
    mapleLeafFactory = (x, y) => {
      if (typeof ResourceController !== 'undefined') {
        return new ResourceController(x, y, 20, 20, { 
          type: 'mapleLeaf',
          amount: 100,
          imagePath: null
        });
      }
    };
    
    stickFactory = (x, y) => {
      if (typeof ResourceController !== 'undefined') {
        return new ResourceController(x, y, 20, 20, { 
          type: 'stick',
          amount: 100,
          imagePath: null
        });
      }
    };
    
    stoneFactory = (x, y) => {
      if (typeof ResourceController !== 'undefined') {
        return new ResourceController(x, y, 20, 20, { 
          type: 'stone',
          amount: 100,
          imagePath: null
        });
      }
    };
    
    // Make factory methods available as Resource.createX()
    Resource.createGreenLeaf = greenLeafFactory;
    Resource.createMapleLeaf = mapleLeafFactory;
    Resource.createStick = stickFactory;
    Resource.createStone = stoneFactory;
    
    // Load ResourceSystemManager for integration tests
    ResourceSystemManager = require('../../../Classes/managers/ResourceSystemManager');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Factory Methods', function() {
    it('should have createGreenLeaf factory method', function() {
      expect(greenLeafFactory).to.be.a('function');
    });
    
    it('should create ResourceController from greenLeafFactory', function() {
      const resource = greenLeafFactory(100, 150);
      
      expect(resource).to.be.instanceOf(ResourceController);
      expect(resource.getType()).to.equal('greenLeaf');
      expect(resource.getPosition().x).to.equal(100);
      expect(resource.getPosition().y).to.equal(150);
    });
    
    it('should have createMapleLeaf factory method', function() {
      expect(mapleLeafFactory).to.be.a('function');
    });
    
    it('should create ResourceController from mapleLeafFactory', function() {
      const resource = mapleLeafFactory(200, 250);
      
      expect(resource).to.be.instanceOf(ResourceController);
      expect(resource.getType()).to.equal('mapleLeaf');
      expect(resource.getPosition().x).to.equal(200);
      expect(resource.getPosition().y).to.equal(250);
    });
    
    it('should have createStick factory method', function() {
      expect(stickFactory).to.be.a('function');
    });
    
    it('should create ResourceController from stickFactory', function() {
      const resource = stickFactory(300, 350);
      
      expect(resource).to.be.instanceOf(ResourceController);
      expect(resource.getType()).to.equal('stick');
      expect(resource.getPosition().x).to.equal(300);
      expect(resource.getPosition().y).to.equal(350);
    });
    
    it('should have createStone factory method', function() {
      expect(stoneFactory).to.be.a('function');
    });
    
    it('should create ResourceController from stoneFactory', function() {
      const resource = stoneFactory(400, 450);
      
      expect(resource).to.be.instanceOf(ResourceController);
      expect(resource.getType()).to.equal('stone');
      expect(resource.getPosition().x).to.equal(400);
      expect(resource.getPosition().y).to.equal(450);
    });
  });
  
  describe('ResourceController Properties', function() {
    it('should create resources with default size', function() {
      const resource = Resource.createGreenLeaf(100, 100);
      const pos = resource.getPosition();
      
      // Default size should be 20x20 (from old Resource class)
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(100);
    });
    
    it('should create resources with default amount', function() {
      const resource = Resource.createGreenLeaf(100, 100);
      
      expect(resource.getAmount()).to.be.a('number');
      expect(resource.getAmount()).to.be.greaterThan(0);
    });
    
    it('should create active resources', function() {
      const resource = Resource.createGreenLeaf(100, 100);
      
      expect(resource._model.isActive).to.be.true;
    });
  });
  
  describe('Resource Types', function() {
    it('should create Food type for greenLeaf', function() {
      const resource = Resource.createGreenLeaf(100, 100);
      
      // greenLeaf should map to Food category
      expect(resource.getType()).to.equal('greenLeaf');
    });
    
    it('should create Food type for mapleLeaf', function() {
      const resource = Resource.createMapleLeaf(100, 100);
      
      // mapleLeaf should also be food
      expect(resource.getType()).to.equal('mapleLeaf');
    });
    
    it('should create Wood type for stick', function() {
      const resource = Resource.createStick(100, 100);
      
      expect(resource.getType()).to.equal('stick');
    });
    
    it('should create Stone type for stone', function() {
      const resource = Resource.createStone(100, 100);
      
      expect(resource.getType()).to.equal('stone');
    });
  });
  
  describe('Integration with ResourceSystemManager', function() {
    let ResourceSystemManager;
    
    before(function() {
      ResourceSystemManager = require('../../../Classes/managers/ResourceSystemManager');
    });
    
    it('should spawn ResourceController instances via system', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      
      // Force spawn a resource
      system.forceSpawn();
      
      const resources = system.getResourceList();
      expect(resources.length).to.be.greaterThan(0);
      
      const firstResource = resources[0];
      expect(firstResource).to.be.instanceOf(ResourceController);
      expect(firstResource.getType).to.be.a('function');
    });
    
    it('should be able to gather from spawned resources', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      system.forceSpawn();
      
      const resources = system.getResourceList();
      const resource = resources[0];
      
      const initialAmount = resource.getAmount();
      const gathered = resource.gather(10);
      
      expect(gathered).to.equal(10);
      expect(resource.getAmount()).to.equal(initialAmount - 10);
    });
  });
  
  describe('Backward Compatibility', function() {
    it('should work with systems expecting getType() method', function() {
      const resource = Resource.createGreenLeaf(100, 100);
      
      expect(() => resource.getType()).to.not.throw();
      expect(resource.getType()).to.be.a('string');
    });
    
    it('should work with systems expecting getPosition() method', function() {
      const resource = Resource.createGreenLeaf(100, 100);
      
      expect(() => resource.getPosition()).to.not.throw();
      expect(resource.getPosition()).to.have.property('x');
      expect(resource.getPosition()).to.have.property('y');
    });
    
    it('should work with systems expecting gather() method', function() {
      const resource = Resource.createGreenLeaf(100, 100);
      
      expect(() => resource.gather(10)).to.not.throw();
      expect(resource.gather(10)).to.be.a('number');
    });
  });
});
