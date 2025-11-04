/**
 * Unit tests for ResourceFactory
 * Tests factory methods that create ResourceController instances
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment (JSDOM, p5.js, CollisionBox2D)
setupTestEnvironment({ rendering: true, sprite: true });

describe('ResourceFactory', function() {
  let ResourceFactory, ResourceController, ResourceModel, ResourceView;
  
  before(function() {
    // Load required classes
    ResourceModel = require('../../../Classes/models/ResourceModel');
    ResourceView = require('../../../Classes/views/ResourceView');
    ResourceController = require('../../../Classes/controllers/mvc/ResourceController');
    ResourceFactory = require('../../../Classes/factories/ResourceFactory');
    
    // Expose ResourceController to global scope (factory checks for this)
    global.ResourceController = ResourceController;
    window.ResourceController = ResourceController;
    globalThis.ResourceController = ResourceController;
    
    // Mock global image variables
    global.greenLeaf = { width: 32, height: 32, __isP5Image: true };
    global.mapleLeaf = { width: 32, height: 32, __isP5Image: true };
    global.stick = { width: 32, height: 32, __isP5Image: true };
    global.stone = { width: 32, height: 32, __isP5Image: true };
    
    // Expose to window for browser compatibility
    window.greenLeaf = global.greenLeaf;
    window.mapleLeaf = global.mapleLeaf;
    window.stick = global.stick;
    window.stone = global.stone;
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('createGreenLeaf()', function() {
    it('should create ResourceController with greenLeaf type', function() {
      const resource = ResourceFactory.createGreenLeaf(100, 150);
      
      expect(resource).to.be.instanceOf(ResourceController);
      expect(resource.getType()).to.equal('greenLeaf');
    });
    
    it('should set position correctly', function() {
      const resource = ResourceFactory.createGreenLeaf(100, 150);
      const position = resource.getPosition();
      
      expect(position.x).to.equal(100);
      expect(position.y).to.equal(150);
    });
    
    it('should use default amount of 100', function() {
      const resource = ResourceFactory.createGreenLeaf(100, 150);
      
      expect(resource.getAmount()).to.equal(100);
    });
    
    it('should accept custom amount via options', function() {
      const resource = ResourceFactory.createGreenLeaf(100, 150, { amount: 50 });
      
      expect(resource.getAmount()).to.equal(50);
    });
    
    it('should pass additional options to controller', function() {
      const resource = ResourceFactory.createGreenLeaf(100, 150, { 
        amount: 75
      });
      
      expect(resource.getAmount()).to.equal(75);
      // Factory passes options to ResourceController constructor
      expect(resource).to.be.instanceOf(ResourceController);
    });
    
    it('should return null if ResourceController not loaded', function() {
      const originalController = global.ResourceController;
      delete global.ResourceController;
      delete window.ResourceController;
      
      const resource = ResourceFactory.createGreenLeaf(100, 150);
      
      expect(resource).to.be.null;
      
      // Restore
      global.ResourceController = originalController;
      window.ResourceController = originalController;
    });
  });
  
  describe('createMapleLeaf()', function() {
    it('should create ResourceController with mapleLeaf type', function() {
      const resource = ResourceFactory.createMapleLeaf(200, 250);
      
      expect(resource).to.be.instanceOf(ResourceController);
      expect(resource.getType()).to.equal('mapleLeaf');
    });
    
    it('should set position correctly', function() {
      const resource = ResourceFactory.createMapleLeaf(200, 250);
      const position = resource.getPosition();
      
      expect(position.x).to.equal(200);
      expect(position.y).to.equal(250);
    });
    
    it('should accept custom amount', function() {
      const resource = ResourceFactory.createMapleLeaf(200, 250, { amount: 120 });
      
      expect(resource.getAmount()).to.equal(120);
    });
  });
  
  describe('createStick()', function() {
    it('should create ResourceController with stick type', function() {
      const resource = ResourceFactory.createStick(300, 350);
      
      expect(resource).to.be.instanceOf(ResourceController);
      expect(resource.getType()).to.equal('stick');
    });
    
    it('should set position correctly', function() {
      const resource = ResourceFactory.createStick(300, 350);
      const position = resource.getPosition();
      
      expect(position.x).to.equal(300);
      expect(position.y).to.equal(350);
    });
    
    it('should accept custom amount', function() {
      const resource = ResourceFactory.createStick(300, 350, { amount: 150 });
      
      expect(resource.getAmount()).to.equal(150);
    });
  });
  
  describe('createStone()', function() {
    it('should create ResourceController with stone type', function() {
      const resource = ResourceFactory.createStone(400, 450);
      
      expect(resource).to.be.instanceOf(ResourceController);
      expect(resource.getType()).to.equal('stone');
    });
    
    it('should set position correctly', function() {
      const resource = ResourceFactory.createStone(400, 450);
      const position = resource.getPosition();
      
      expect(position.x).to.equal(400);
      expect(position.y).to.equal(450);
    });
    
    it('should accept custom amount', function() {
      const resource = ResourceFactory.createStone(400, 450, { amount: 80 });
      
      expect(resource.getAmount()).to.equal(80);
    });
  });
  
  describe('createResource() - Generic Factory', function() {
    it('should create greenLeaf via generic factory', function() {
      const resource = ResourceFactory.createResource('greenLeaf', 100, 150);
      
      expect(resource).to.be.instanceOf(ResourceController);
      expect(resource.getType()).to.equal('greenLeaf');
    });
    
    it('should create mapleLeaf via generic factory', function() {
      const resource = ResourceFactory.createResource('mapleLeaf', 200, 250);
      
      expect(resource.getType()).to.equal('mapleLeaf');
    });
    
    it('should create stick via generic factory', function() {
      const resource = ResourceFactory.createResource('stick', 300, 350);
      
      expect(resource.getType()).to.equal('stick');
    });
    
    it('should create stone via generic factory', function() {
      const resource = ResourceFactory.createResource('stone', 400, 450);
      
      expect(resource.getType()).to.equal('stone');
    });
    
    it('should pass options to specific factory method', function() {
      const resource = ResourceFactory.createResource('greenLeaf', 100, 150, { amount: 75 });
      
      expect(resource.getAmount()).to.equal(75);
    });
    
    it('should return null for unknown resource type', function() {
      const resource = ResourceFactory.createResource('unknownType', 100, 150);
      
      expect(resource).to.be.null;
    });
    
    it('should log error for unknown resource type', function() {
      const consoleErrorSpy = sinon.spy(console, 'error');
      
      ResourceFactory.createResource('unknownType', 100, 150);
      
      expect(consoleErrorSpy.calledOnce).to.be.true;
      expect(consoleErrorSpy.firstCall.args[0]).to.include('Unknown resource type');
      
      consoleErrorSpy.restore();
    });
  });
  
  describe('Image Loading', function() {
    it('should load greenLeaf image', function() {
      const resource = ResourceFactory.createGreenLeaf(100, 150);
      
      // Image should be passed to view
      expect(resource.view._sprite).to.exist;
    });
    
    it('should handle missing image gracefully', function() {
      const originalImage = global.greenLeaf;
      delete global.greenLeaf;
      delete window.greenLeaf;
      
      const resource = ResourceFactory.createGreenLeaf(100, 150);
      
      // Should still create resource (view handles missing image)
      expect(resource).to.be.instanceOf(ResourceController);
      
      // Restore
      global.greenLeaf = originalImage;
      window.greenLeaf = originalImage;
    });
  });
  
  describe('Size and Dimensions', function() {
    it('should create resources with 20x20 dimensions', function() {
      const resource = ResourceFactory.createGreenLeaf(100, 150);
      const size = resource.model.size;
      
      expect(size.width).to.equal(20);
      expect(size.height).to.equal(20);
    });
    
    it('should use consistent size across all resource types', function() {
      const leaf = ResourceFactory.createGreenLeaf(0, 0);
      const maple = ResourceFactory.createMapleLeaf(0, 0);
      const stick = ResourceFactory.createStick(0, 0);
      const stone = ResourceFactory.createStone(0, 0);
      
      expect(leaf.model.size.width).to.equal(20);
      expect(maple.model.size.width).to.equal(20);
      expect(stick.model.size.width).to.equal(20);
      expect(stone.model.size.width).to.equal(20);
    });
  });
  
  describe('Integration with ResourceController', function() {
    it('should create fully functional ResourceController', function() {
      const resource = ResourceFactory.createGreenLeaf(100, 150);
      
      // Test controller methods
      expect(resource.getPosition()).to.deep.equal({ x: 100, y: 150 });
      expect(resource.getType()).to.equal('greenLeaf');
      expect(resource.getAmount()).to.equal(100);
      
      // Test gather functionality (gather returns amount gathered, not remaining)
      const gathered = resource.gather(30);
      expect(gathered).to.equal(30);
      expect(resource.getAmount()).to.equal(70);
    });
    
    it('should have working model', function() {
      const resource = ResourceFactory.createGreenLeaf(100, 150);
      
      expect(resource.model).to.be.instanceOf(ResourceModel);
      expect(resource.model.type).to.equal('greenLeaf');
    });
    
    it('should have working view', function() {
      const resource = ResourceFactory.createGreenLeaf(100, 150);
      
      expect(resource.view).to.be.instanceOf(ResourceView);
    });
  });
});
