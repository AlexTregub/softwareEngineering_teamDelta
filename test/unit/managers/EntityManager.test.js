/**
 * EntityManager Unit Tests
 * 
 * Tests for EntityManager that tracks entity counts and integrates with EventBus
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityManager', function() {
  let EntityManager;
  let entityManager;
  let mockEventBus;
  
  beforeEach(function() {
    // Mock EventBus
    mockEventBus = {
      on: sinon.stub(),
      off: sinon.stub(),
      emit: sinon.stub(),
      once: sinon.stub()
    };
    
    // Mock global eventBus
    global.eventBus = mockEventBus;
    
    // Load EntityManager (will be created)
    try {
      EntityManager = require('../../../Classes/managers/EntityManager');
      entityManager = new EntityManager({ eventBus: mockEventBus });
    } catch (e) {
      // EntityManager doesn't exist yet, skip tests
      this.skip();
    }
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.eventBus;
  });
  
  describe('Constructor', function() {
    it('should initialize with empty entity counts', function() {
      const counts = entityManager.getCounts();
      expect(counts).to.be.an('object');
      expect(Object.keys(counts).length).to.equal(0);
    });
    
    it('should accept eventBus via options', function() {
      expect(entityManager.eventBus).to.equal(mockEventBus);
    });
    
    it('should use global eventBus if not provided', function() {
      const manager = new EntityManager();
      expect(manager.eventBus).to.equal(mockEventBus);
    });
    
    it('should register event listeners on construction', function() {
      expect(mockEventBus.on.called).to.be.true;
    });
  });
  
  describe('Entity Registration', function() {
    it('should track entity when registered', function() {
      entityManager.registerEntity('ant', 'ant-001');
      
      const counts = entityManager.getCounts();
      expect(counts.ant).to.equal(1);
    });
    
    it('should increment count for multiple entities of same type', function() {
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-002');
      entityManager.registerEntity('ant', 'ant-003');
      
      const counts = entityManager.getCounts();
      expect(counts.ant).to.equal(3);
    });
    
    it('should track different entity types separately', function() {
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-002');
      entityManager.registerEntity('resource', 'resource-001');
      entityManager.registerEntity('building', 'building-001');
      
      const counts = entityManager.getCounts();
      expect(counts.ant).to.equal(2);
      expect(counts.resource).to.equal(1);
      expect(counts.building).to.equal(1);
    });
    
    it('should not double-count same entity ID', function() {
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-001'); // Same ID
      
      const counts = entityManager.getCounts();
      expect(counts.ant).to.equal(1);
    });
    
    it('should emit ENTITY_REGISTERED event', function() {
      entityManager.registerEntity('ant', 'ant-001');
      
      expect(mockEventBus.emit.calledOnce).to.be.true;
      expect(mockEventBus.emit.firstCall.args[0]).to.equal('ENTITY_REGISTERED');
      expect(mockEventBus.emit.firstCall.args[1]).to.deep.include({
        type: 'ant',
        id: 'ant-001'
      });
    });
  });
  
  describe('Entity Unregistration', function() {
    beforeEach(function() {
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-002');
      entityManager.registerEntity('resource', 'resource-001');
      mockEventBus.emit.resetHistory();
    });
    
    it('should decrement count when entity unregistered', function() {
      entityManager.unregisterEntity('ant', 'ant-001');
      
      const counts = entityManager.getCounts();
      expect(counts.ant).to.equal(1);
    });
    
    it('should remove type when count reaches zero', function() {
      entityManager.unregisterEntity('resource', 'resource-001');
      
      const counts = entityManager.getCounts();
      expect(counts.resource).to.be.undefined;
    });
    
    it('should handle unregistering non-existent entity gracefully', function() {
      expect(() => {
        entityManager.unregisterEntity('enemy', 'enemy-999');
      }).to.not.throw();
    });
    
    it('should handle unregistering non-existent ID gracefully', function() {
      expect(() => {
        entityManager.unregisterEntity('ant', 'ant-999');
      }).to.not.throw();
      
      const counts = entityManager.getCounts();
      expect(counts.ant).to.equal(2); // No change
    });
    
    it('should emit ENTITY_UNREGISTERED event', function() {
      entityManager.unregisterEntity('ant', 'ant-001');
      
      expect(mockEventBus.emit.calledOnce).to.be.true;
      expect(mockEventBus.emit.firstCall.args[0]).to.equal('ENTITY_UNREGISTERED');
      expect(mockEventBus.emit.firstCall.args[1]).to.deep.include({
        type: 'ant',
        id: 'ant-001'
      });
    });
  });
  
  describe('Count Queries', function() {
    beforeEach(function() {
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-002');
      entityManager.registerEntity('ant', 'ant-003');
      entityManager.registerEntity('resource', 'resource-001');
      entityManager.registerEntity('building', 'building-001');
      entityManager.registerEntity('building', 'building-002');
    });
    
    it('should return all counts', function() {
      const counts = entityManager.getCounts();
      
      expect(counts).to.deep.equal({
        ant: 3,
        resource: 1,
        building: 2
      });
    });
    
    it('should return count for specific type', function() {
      const antCount = entityManager.getCount('ant');
      expect(antCount).to.equal(3);
    });
    
    it('should return 0 for non-existent type', function() {
      const enemyCount = entityManager.getCount('enemy');
      expect(enemyCount).to.equal(0);
    });
    
    it('should return total count across all types', function() {
      const total = entityManager.getTotalCount();
      expect(total).to.equal(6); // 3 ants + 1 resource + 2 buildings
    });
    
    it('should return list of tracked types', function() {
      const types = entityManager.getTypes();
      expect(types).to.have.members(['ant', 'resource', 'building']);
    });
  });
  
  describe('EventBus Integration - Query Requests', function() {
    beforeEach(function() {
      // Setup some test data
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-002');
      entityManager.registerEntity('resource', 'resource-001');
      mockEventBus.emit.resetHistory();
    });
    
    it('should listen for QUERY_ENTITY_COUNTS event', function() {
      // Find the listener that was registered for QUERY_ENTITY_COUNTS
      const calls = mockEventBus.on.getCalls();
      const queryListener = calls.find(call => call.args[0] === 'QUERY_ENTITY_COUNTS');
      
      expect(queryListener).to.exist;
    });
    
    it('should respond to QUERY_ENTITY_COUNTS with all counts', function() {
      // Simulate EventBus calling the listener
      const calls = mockEventBus.on.getCalls();
      const queryCall = calls.find(call => call.args[0] === 'QUERY_ENTITY_COUNTS');
      const listener = queryCall.args[1];
      
      // Call the listener
      listener({});
      
      // Should emit response
      const emitCalls = mockEventBus.emit.getCalls();
      const responseCall = emitCalls.find(call => call.args[0] === 'ENTITY_COUNTS_RESPONSE');
      
      expect(responseCall).to.exist;
      expect(responseCall.args[1]).to.deep.include({
        counts: {
          ant: 2,
          resource: 1
        },
        total: 3
      });
    });
    
    it('should respond to QUERY_ENTITY_COUNTS with specific type', function() {
      const calls = mockEventBus.on.getCalls();
      const queryCall = calls.find(call => call.args[0] === 'QUERY_ENTITY_COUNTS');
      const listener = queryCall.args[1];
      
      // Request specific type
      listener({ type: 'ant' });
      
      const emitCalls = mockEventBus.emit.getCalls();
      const responseCall = emitCalls.find(call => call.args[0] === 'ENTITY_COUNTS_RESPONSE');
      
      expect(responseCall).to.exist;
      expect(responseCall.args[1]).to.deep.include({
        type: 'ant',
        count: 2
      });
    });
  });
  
  describe('Detailed Ant Counts', function() {
    beforeEach(function() {
      // Register ants with job types
      entityManager.registerEntity('ant', 'ant-001', { jobName: 'Worker' });
      entityManager.registerEntity('ant', 'ant-002', { jobName: 'Worker' });
      entityManager.registerEntity('ant', 'ant-003', { jobName: 'Scout' });
      entityManager.registerEntity('ant', 'ant-004', { jobName: 'Soldier' });
      entityManager.registerEntity('ant', 'ant-005', { jobName: 'Soldier' });
      entityManager.registerEntity('ant', 'ant-006', { jobName: 'Soldier' });
    });
    
    it('should track ants by job type', function() {
      const antDetails = entityManager.getAntDetails();
      
      expect(antDetails).to.deep.equal({
        Worker: 2,
        Scout: 1,
        Soldier: 3
      });
    });
    
    it('should return ant breakdown for QUERY_ANT_DETAILS', function() {
      const calls = mockEventBus.on.getCalls();
      const queryCall = calls.find(call => call.args[0] === 'QUERY_ANT_DETAILS');
      
      expect(queryCall).to.exist;
      
      const listener = queryCall.args[1];
      listener({});
      
      const emitCalls = mockEventBus.emit.getCalls();
      const responseCall = emitCalls.find(call => call.args[0] === 'ANT_DETAILS_RESPONSE');
      
      expect(responseCall).to.exist;
      expect(responseCall.args[1]).to.deep.include({
        total: 6,
        breakdown: {
          Worker: 2,
          Scout: 1,
          Soldier: 3
        }
      });
    });
    
    it('should update job counts when ant job changes', function() {
      // Change ant-001 from Worker to Scout
      entityManager.updateEntityMetadata('ant', 'ant-001', { jobName: 'Scout' });
      
      const antDetails = entityManager.getAntDetails();
      expect(antDetails.Worker).to.equal(1);
      expect(antDetails.Scout).to.equal(2);
    });
  });
  
  describe('Reset and Cleanup', function() {
    beforeEach(function() {
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('resource', 'resource-001');
    });
    
    it('should clear all counts on reset', function() {
      entityManager.reset();
      
      const counts = entityManager.getCounts();
      expect(Object.keys(counts).length).to.equal(0);
    });
    
    it('should emit ENTITY_MANAGER_RESET event', function() {
      mockEventBus.emit.resetHistory();
      
      entityManager.reset();
      
      expect(mockEventBus.emit.calledOnce).to.be.true;
      expect(mockEventBus.emit.firstCall.args[0]).to.equal('ENTITY_MANAGER_RESET');
    });
    
    it('should unregister event listeners on destroy', function() {
      entityManager.destroy();
      
      expect(mockEventBus.off.called).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle null or undefined type gracefully', function() {
      expect(() => {
        entityManager.registerEntity(null, 'id-001');
      }).to.not.throw();
      
      expect(() => {
        entityManager.registerEntity(undefined, 'id-002');
      }).to.not.throw();
    });
    
    it('should handle null or undefined ID gracefully', function() {
      expect(() => {
        entityManager.registerEntity('ant', null);
      }).to.not.throw();
      
      expect(() => {
        entityManager.registerEntity('ant', undefined);
      }).to.not.throw();
    });
    
    it('should handle empty string type and ID', function() {
      entityManager.registerEntity('', 'id-001');
      const counts = entityManager.getCounts();
      
      // Empty string is valid but unusual
      expect(counts['']).to.equal(1);
    });
    
    it('should handle rapid register/unregister cycles', function() {
      for (let i = 0; i < 100; i++) {
        entityManager.registerEntity('ant', `ant-${i}`);
      }
      
      expect(entityManager.getCount('ant')).to.equal(100);
      
      for (let i = 0; i < 50; i++) {
        entityManager.unregisterEntity('ant', `ant-${i}`);
      }
      
      expect(entityManager.getCount('ant')).to.equal(50);
    });
  });
});
