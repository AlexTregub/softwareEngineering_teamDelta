/**
 * Integration tests for ResourceSystemManager with ResourceController
 * Tests the global resource system working with MVC ResourceController
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment with rendering and sprite support
setupTestEnvironment({ rendering: true, sprite: true });

describe('ResourceSystemManager with ResourceController', function() {
  let ResourceSystemManager, ResourceController;
  
  before(function() {
    ResourceSystemManager = require('../../../Classes/managers/ResourceSystemManager');
    ResourceController = require('../../../Classes/controllers/mvc/ResourceController');
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Resource Collection', function() {
    it('should add ResourceController to system', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      const resource = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      
      const added = system.addResource(resource);
      
      expect(added).to.be.true;
      expect(system.getResourceList().length).to.equal(1);
      expect(system.getResourceList()[0]).to.equal(resource);
    });
    
    it('should remove ResourceController from system', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      const resource = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      
      system.addResource(resource);
      const removed = system.removeResource(resource);
      
      expect(removed).to.be.true;
      expect(system.getResourceList().length).to.equal(0);
    });
    
    it('should clear all ResourceControllers', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      system.addResource(new ResourceController(100, 100, 32, 32, { type: 'Food' }));
      system.addResource(new ResourceController(200, 200, 32, 32, { type: 'Wood' }));
      
      const removed = system.clearAllResources();
      
      expect(removed.length).to.equal(2);
      expect(system.getResourceList().length).to.equal(0);
    });
  });
  
  describe('Resource Type Filtering', function() {
    it('should get resources by type using getType()', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      const food1 = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      const food2 = new ResourceController(150, 150, 32, 32, { type: 'Food' });
      const wood = new ResourceController(200, 200, 32, 32, { type: 'Wood' });
      
      system.addResource(food1);
      system.addResource(food2);
      system.addResource(wood);
      
      const foodResources = system.getResourcesByType('Food');
      
      expect(foodResources.length).to.equal(2);
      expect(foodResources[0].getType()).to.equal('Food');
      expect(foodResources[1].getType()).to.equal('Food');
    });
    
    it('should handle Stone type', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      const stone = new ResourceController(100, 100, 32, 32, { type: 'Stone' });
      
      system.addResource(stone);
      const stoneResources = system.getResourcesByType('Stone');
      
      expect(stoneResources.length).to.equal(1);
      expect(stoneResources[0].getType()).to.equal('Stone');
    });
    
    it('should return empty array for non-existent type', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      system.addResource(new ResourceController(100, 100, 32, 32, { type: 'Food' }));
      
      const results = system.getResourcesByType('Diamond');
      
      expect(results).to.be.an('array');
      expect(results.length).to.equal(0);
    });
  });
  
  describe('Resource Selection', function() {
    it('should select resource type', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      
      system.selectResource('Food');
      
      expect(system.getSelectedResourceType()).to.equal('Food');
    });
    
    it('should get selected type resources', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      const food = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      const wood = new ResourceController(200, 200, 32, 32, { type: 'Wood' });
      
      system.addResource(food);
      system.addResource(wood);
      system.selectResource('Food');
      
      const selected = system.getSelectedTypeResources();
      
      expect(selected.length).to.equal(1);
      expect(selected[0].getType()).to.equal('Food');
    });
    
    it('should clear resource selection', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      
      system.selectResource('Food');
      system.clearResourceSelection();
      
      expect(system.getSelectedResourceType()).to.be.null;
    });
    
    it('should check if type is selected', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      
      system.selectResource('Food');
      
      expect(system.isResourceTypeSelected('Food')).to.be.true;
      expect(system.isResourceTypeSelected('Wood')).to.be.false;
    });
  });
  
  describe('Resource Rendering', function() {
    it('should call render on all ResourceControllers', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      const resource1 = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      const resource2 = new ResourceController(200, 200, 32, 32, { type: 'Wood' });
      
      const spy1 = sinon.spy(resource1, 'render');
      const spy2 = sinon.spy(resource2, 'render');
      
      system.addResource(resource1);
      system.addResource(resource2);
      system.drawAll();
      
      expect(spy1.calledOnce).to.be.true;
      expect(spy2.calledOnce).to.be.true;
    });
    
    it('should handle resources without render gracefully', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      const brokenResource = { /* no render method */ };
      
      system.addResource(brokenResource);
      
      expect(() => system.drawAll()).to.not.throw();
    });
  });
  
  describe('Resource Updates', function() {
    it('should call update on all ResourceControllers', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      const resource1 = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      const resource2 = new ResourceController(200, 200, 32, 32, { type: 'Wood' });
      
      const spy1 = sinon.spy(resource1, 'update');
      const spy2 = sinon.spy(resource2, 'update');
      
      system.addResource(resource1);
      system.addResource(resource2);
      system.updateAll();
      
      expect(spy1.calledOnce).to.be.true;
      expect(spy2.calledOnce).to.be.true;
    });
  });
  
  describe('System Status', function() {
    it('should report correct resource counts by type', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      system.addResource(new ResourceController(100, 100, 32, 32, { type: 'Food' }));
      system.addResource(new ResourceController(150, 150, 32, 32, { type: 'Food' }));
      system.addResource(new ResourceController(200, 200, 32, 32, { type: 'Wood' }));
      
      const status = system.getSystemStatus();
      
      expect(status.totalResources).to.equal(3);
      expect(status.resourceCounts.Food).to.equal(2);
      expect(status.resourceCounts.Wood).to.equal(1);
    });
    
    it('should report capacity usage correctly', function() {
      const system = new ResourceSystemManager(1, 10, { autoStart: false });
      system.addResource(new ResourceController(100, 100, 32, 32, { type: 'Food' }));
      system.addResource(new ResourceController(150, 150, 32, 32, { type: 'Food' }));
      
      const status = system.getSystemStatus();
      
      expect(status.capacityUsed).to.equal('20.0%');
    });
  });
  
  describe('Debug Info', function() {
    it('should provide debug info with ResourceController data', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      const resource = new ResourceController(100, 100, 32, 32, { type: 'Food' });
      
      system.addResource(resource);
      const debugInfo = system.getDebugInfo();
      
      expect(debugInfo.resourceDetails).to.be.an('array');
      expect(debugInfo.resourceDetails.length).to.equal(1);
      expect(debugInfo.resourceDetails[0].type).to.equal('Food');
      expect(debugInfo.resourceDetails[0].position.x).to.equal(100);
      expect(debugInfo.resourceDetails[0].position.y).to.equal(100);
    });
  });
  
  describe('Capacity Limits', function() {
    it('should respect max capacity when adding', function() {
      const system = new ResourceSystemManager(1, 2, { autoStart: false });
      
      const added1 = system.addResource(new ResourceController(100, 100, 32, 32, { type: 'Food' }));
      const added2 = system.addResource(new ResourceController(150, 150, 32, 32, { type: 'Food' }));
      const added3 = system.addResource(new ResourceController(200, 200, 32, 32, { type: 'Food' }));
      
      expect(added1).to.be.true;
      expect(added2).to.be.true;
      expect(added3).to.be.false;
      expect(system.getResourceList().length).to.equal(2);
    });
  });
  
  describe('System Lifecycle', function() {
    it('should destroy cleanly', function() {
      const system = new ResourceSystemManager(1, 50, { autoStart: false });
      system.addResource(new ResourceController(100, 100, 32, 32, { type: 'Food' }));
      
      expect(() => system.destroy()).to.not.throw();
      expect(system.getResourceList().length).to.equal(0);
      expect(system.isActive).to.be.false;
    });
  });
});
