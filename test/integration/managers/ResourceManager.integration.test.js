/**
 * Integration tests for ResourceManager with ResourceController
 * Tests ant resource collection using ResourceController API
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment
setupTestEnvironment({ rendering: true, sprite: true });

describe('ResourceManager with ResourceController', function() {
  let ResourceManager, ResourceController, ResourceModel;
  let manager, mockAnt;
  
  before(function() {
    ResourceManager = require('../../../Classes/managers/ResourceManager');
    ResourceController = require('../../../Classes/controllers/mvc/ResourceController');
    ResourceModel = require('../../../Classes/models/ResourceModel');
    
    // Expose ResourceController globally (factory uses this)
    global.ResourceController = ResourceController;
    window.ResourceController = ResourceController;
    
    // Mock image
    global.greenLeaf = { width: 32, height: 32, __isP5Image: true };
    window.greenLeaf = global.greenLeaf;
  });
  
  beforeEach(function() {
    // Create mock ant entity
    mockAnt = {
      posX: 100,
      posY: 100,
      jobName: 'Worker',
      moveToLocation: sinon.spy()
    };
    
    // Create ResourceManager for the ant
    manager = new ResourceManager(mockAnt, 2, 25); // capacity=2, range=25
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
    
    // Clean up global mocks
    delete global.g_resourceManager;
    delete window.g_resourceManager;
  });
  
  describe('Constructor and Basic Properties', function() {
    it('should initialize with correct capacity', function() {
      expect(manager.maxCapacity).to.equal(2);
    });
    
    it('should initialize with correct collection range', function() {
      expect(manager.collectionRange).to.equal(25);
    });
    
    it('should start with empty inventory', function() {
      expect(manager.getCurrentLoad()).to.equal(0);
    });
  });
  
  describe('Adding ResourceController to Inventory', function() {
    it('should add ResourceController to inventory', function() {
      const resource = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      
      const added = manager.addResource(resource);
      
      expect(added).to.be.true;
      expect(manager.getCurrentLoad()).to.equal(1);
    });
    
    it('should not add resource when at max capacity', function() {
      const resource1 = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      const resource2 = new ResourceController(100, 100, 32, 32, { type: 'Wood' });
      const resource3 = new ResourceController(100, 100, 32, 32, { type: 'Stone' });
      
      manager.addResource(resource1);
      manager.addResource(resource2);
      const added = manager.addResource(resource3); // Should fail (capacity=2)
      
      expect(added).to.be.false;
      expect(manager.getCurrentLoad()).to.equal(2);
    });
    
    it('should track remaining capacity correctly', function() {
      expect(manager.getRemainingCapacity()).to.equal(2);
      
      const resource = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      manager.addResource(resource);
      
      expect(manager.getRemainingCapacity()).to.equal(1);
    });
  });
  
  describe('checkForNearbyResources() with ResourceController', function() {
    it('should detect nearby ResourceController using getPosition()', function() {
      const resource = new ResourceController(110, 110, 32, 32, { type: 'Food' });
      
      // Mock global resource system with ResourceController
      global.g_resourceManager = {
        getResourceList: () => [resource],
        removeResource: sinon.spy()
      };
      window.g_resourceManager = global.g_resourceManager;
      
      manager.checkForNearbyResources();
      
      expect(manager.getCurrentLoad()).to.equal(1);
      expect(global.g_resourceManager.removeResource.calledOnce).to.be.true;
    });
    
    it('should not detect resources outside collection range', function() {
      const resource = new ResourceController(200, 200, 32, 32, { type: 'Food' }); // Far away
      
      global.g_resourceManager = {
        getResourceList: () => [resource],
        removeResource: sinon.spy()
      };
      window.g_resourceManager = global.g_resourceManager;
      
      manager.checkForNearbyResources();
      
      expect(manager.getCurrentLoad()).to.equal(0);
      expect(global.g_resourceManager.removeResource.called).to.be.false;
    });
    
    it('should collect multiple resources up to capacity', function() {
      const resource1 = new ResourceController(105, 105, 32, 32, { type: 'Food' });
      const resource2 = new ResourceController(110, 110, 32, 32, { type: 'Wood' });
      const resource3 = new ResourceController(115, 115, 32, 32, { type: 'Stone' });
      
      global.g_resourceManager = {
        getResourceList: () => [resource1, resource2, resource3],
        removeResource: sinon.spy()
      };
      window.g_resourceManager = global.g_resourceManager;
      
      manager.checkForNearbyResources();
      
      expect(manager.getCurrentLoad()).to.equal(2); // Capacity limit
      expect(global.g_resourceManager.removeResource.callCount).to.equal(2);
    });
    
    it('should initiate drop-off when reaching max capacity', function() {
      const resource1 = new ResourceController(105, 105, 32, 32, { type: 'Food' });
      const resource2 = new ResourceController(110, 110, 32, 32, { type: 'Wood' });
      
      global.g_resourceManager = {
        getResourceList: () => [resource1, resource2],
        removeResource: sinon.spy()
      };
      window.g_resourceManager = global.g_resourceManager;
      
      manager.checkForNearbyResources();
      
      expect(manager.isDroppingOff).to.be.true;
      expect(mockAnt.moveToLocation.calledOnce).to.be.true;
    });
    
    it('should handle focused collection by resource type', function() {
      const foodResource = new ResourceController(105, 105, 32, 32, { type: 'Food' });
      const woodResource = new ResourceController(110, 110, 32, 32, { type: 'Wood' });
      
      global.g_resourceManager = {
        getResourceList: () => [foodResource, woodResource],
        removeResource: sinon.spy()
      };
      window.g_resourceManager = global.g_resourceManager;
      
      // Focus collection on Food only
      manager.selectResource('Food');
      manager.setFocusedCollection(true);
      
      manager.checkForNearbyResources();
      
      expect(manager.getCurrentLoad()).to.equal(1); // Only collected Food
      expect(manager.resources[0].getType()).to.equal('Food');
    });
  });
  
  describe('processDropOff() with ResourceController', function() {
    it('should drop off ResourceController instances', function() {
      const resource1 = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      const resource2 = new ResourceController(100, 100, 32, 32, { type: 'Wood' });
      
      manager.addResource(resource1);
      manager.addResource(resource2);
      
      const globalArray = [];
      const dropped = manager.processDropOff(globalArray);
      
      expect(dropped.length).to.equal(2);
      expect(globalArray.length).to.equal(2);
      expect(manager.getCurrentLoad()).to.equal(0);
    });
    
    it('should use getType() for resource type checking', function() {
      const resource = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      
      manager.addResource(resource);
      
      // Mock addGlobalResource to verify it's called with correct type
      const addGlobalResourceStub = sinon.stub();
      global.addGlobalResource = addGlobalResourceStub;
      window.addGlobalResource = addGlobalResourceStub;
      
      const globalArray = [];
      manager.processDropOff(globalArray);
      
      // Verify addGlobalResource was called with type from getType()
      expect(addGlobalResourceStub.calledOnce).to.be.true;
      expect(addGlobalResourceStub.firstCall.args[0]).to.equal('Food');
      
      // Cleanup
      delete global.addGlobalResource;
      delete window.addGlobalResource;
    });
  });
  
  describe('Resource Selection with ResourceController', function() {
    it('should select resource type', function() {
      manager.selectResource('Food');
      
      expect(manager.getSelectedResourceType()).to.equal('Food');
    });
    
    it('should clear resource selection', function() {
      manager.selectResource('Food');
      manager.clearResourceSelection();
      
      expect(manager.getSelectedResourceType()).to.be.null;
    });
    
    it('should check if resource type is selected', function() {
      manager.selectResource('Wood');
      
      expect(manager.isResourceTypeSelected('Wood')).to.be.true;
      expect(manager.isResourceTypeSelected('Food')).to.be.false;
    });
  });
  
  describe('Debug Information', function() {
    it('should provide debug info with ResourceController types', function() {
      const resource1 = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      const resource2 = new ResourceController(100, 100, 32, 32, { type: 'Wood' });
      
      manager.addResource(resource1);
      manager.addResource(resource2);
      
      const debugInfo = manager.getDebugInfo();
      
      expect(debugInfo.currentLoad).to.equal(2);
      expect(debugInfo.maxCapacity).to.equal(2);
      expect(debugInfo.resourceTypes).to.deep.equal(['Food', 'Wood']);
    });
  });
});
