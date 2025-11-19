/**
 * EntityManager Unit Tests
 * 
 * Tests the MVC EntityManager singleton that tracks all entities created through factories.
 * Follows TDD methodology - tests written FIRST.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityManager (MVC)', function() {
  let EntityManager;
  let mockController1, mockController2, mockController3;

  beforeEach(function() {
    // Clear any existing EntityManager instance
    if (typeof global.window === 'undefined') {
      global.window = {};
    }
    delete global.window.entityManager;
    
    // Mock controllers with required methods
    mockController1 = {
      id: 'entity_1',
      type: 'ant',
      render: sinon.stub(),
      update: sinon.stub(),
      destroy: sinon.stub()
    };
    
    mockController2 = {
      id: 'entity_2',
      type: 'ant',
      render: sinon.stub(),
      update: sinon.stub(),
      destroy: sinon.stub()
    };
    
    mockController3 = {
      id: 'entity_3',
      type: 'building',
      render: sinon.stub(),
      update: sinon.stub(),
      destroy: sinon.stub()
    };

    // Load EntityManager class
    try {
      delete require.cache[require.resolve('../../../Classes/mvc/managers/EntityManager.js')];
      EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
    } catch (e) {
      // Class doesn't exist yet (TDD - test first!)
      EntityManager = null;
    }
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Singleton Pattern', function() {
    it('should return the same instance on multiple getInstance() calls', function() {
      if (!EntityManager) this.skip();
      
      const instance1 = EntityManager.getInstance();
      const instance2 = EntityManager.getInstance();
      
      expect(instance1).to.equal(instance2);
    });

    it('should be available on window.entityManager', function() {
      if (!EntityManager) this.skip();
      
      const instance = EntityManager.getInstance();
      
      expect(window.entityManager).to.exist;
      expect(window.entityManager).to.equal(instance);
    });
  });

  describe('register()', function() {
    it('should register a controller with type', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      const all = manager.getAll();
      expect(all).to.have.lengthOf(1);
      expect(all[0]).to.equal(mockController1);
    });

    it('should auto-detect type from controller.type if not provided', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1); // No type arg
      
      const ants = manager.getByType('ant');
      expect(ants).to.have.lengthOf(1);
    });

    it('should throw error if controller is null/undefined', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      
      expect(() => manager.register(null, 'ant')).to.throw();
      expect(() => manager.register(undefined, 'ant')).to.throw();
    });

    it('should assign unique ID if controller lacks one', function() {
      if (!EntityManager) this.skip();
      
      const controllerNoId = {
        type: 'ant',
        render: sinon.stub(),
        update: sinon.stub()
      };
      
      const manager = EntityManager.getInstance();
      manager.register(controllerNoId);
      
      expect(controllerNoId.id).to.exist;
      expect(controllerNoId.id).to.be.a('string');
    });

    it('should not register duplicate IDs', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController1, 'ant'); // Same ID
      
      const all = manager.getAll();
      expect(all).to.have.lengthOf(1); // Only one registered
    });
  });

  describe('unregister()', function() {
    it('should remove controller by ID', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      
      manager.unregister('entity_1');
      
      const all = manager.getAll();
      expect(all).to.have.lengthOf(1);
      expect(all[0].id).to.equal('entity_2');
    });

    it('should return true if entity was removed', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      const result = manager.unregister('entity_1');
      expect(result).to.be.true;
    });

    it('should return false if entity ID not found', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      
      const result = manager.unregister('nonexistent_id');
      expect(result).to.be.false;
    });
  });

  describe('getAll()', function() {
    it('should return empty array when no entities registered', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      
      expect(manager.getAll()).to.be.an('array').that.is.empty;
    });

    it('should return all registered controllers', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      const all = manager.getAll();
      expect(all).to.have.lengthOf(3);
    });

    it('should return a copy (not modifiable)', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      const all = manager.getAll();
      all.push(mockController2); // Try to modify
      
      const allAgain = manager.getAll();
      expect(allAgain).to.have.lengthOf(1); // Should still be 1
    });
  });

  describe('getByType()', function() {
    it('should return only entities of specified type', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      const ants = manager.getByType('ant');
      expect(ants).to.have.lengthOf(2);
      expect(ants.every(e => e.type === 'ant')).to.be.true;
    });

    it('should return empty array if no entities of type', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      const buildings = manager.getByType('building');
      expect(buildings).to.be.an('array').that.is.empty;
    });

    it('should return copy (not modifiable)', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      const ants = manager.getByType('ant');
      ants.push(mockController2);
      
      const antsAgain = manager.getByType('ant');
      expect(antsAgain).to.have.lengthOf(1);
    });
  });

  describe('getById()', function() {
    it('should return controller with matching ID', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      
      const found = manager.getById('entity_1');
      expect(found).to.equal(mockController1);
    });

    it('should return null if ID not found', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      
      const found = manager.getById('nonexistent');
      expect(found).to.be.null;
    });
  });

  describe('clear()', function() {
    it('should remove all registered entities', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      manager.clear();
      
      expect(manager.getAll()).to.be.empty;
    });

    it('should reset type groupings', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.clear();
      
      expect(manager.getByType('ant')).to.be.empty;
    });
  });

  describe('getCount()', function() {
    it('should return 0 when empty', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      expect(manager.getCount()).to.equal(0);
    });

    it('should return total count of registered entities', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      expect(manager.getCount()).to.equal(3);
    });

    it('should return count by type when type provided', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      expect(manager.getCount('ant')).to.equal(2);
      expect(manager.getCount('building')).to.equal(1);
      expect(manager.getCount('resource')).to.equal(0);
    });
  });

  describe('Legacy Compatibility', function() {
    it('should provide getLegacyAnts() for backward compatibility', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      const ants = manager.getLegacyAnts();
      expect(ants).to.have.lengthOf(2);
      expect(ants.every(a => a.type === 'ant')).to.be.true;
    });

    it('should sync with global window.ants if it exists', function() {
      if (!EntityManager) this.skip();
      
      global.window.ants = [];
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      // Manager should NOT modify window.ants (that's the caller's responsibility)
      // But it should provide a method to get them
      expect(manager.getLegacyAnts()).to.have.lengthOf(1);
    });
  });

  describe('Integration with Factory Pattern', function() {
    it('should work with AntFactory registration', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      
      // Simulate factory creating MVC triad and registering controller
      const mockTriad = {
        model: { id: 'model_1' },
        view: { id: 'view_1' },
        controller: mockController1
      };
      
      manager.register(mockTriad.controller, 'ant');
      
      expect(manager.getByType('ant')).to.have.lengthOf(1);
    });
  });

  describe('Event Signal Handling', function() {
    let EventManager, EntityEvents, eventManager;
    
    beforeEach(function() {
      // Load EventManager and EntityEvents
      try {
        delete require.cache[require.resolve('../../../Classes/managers/EventManager.js')];
        delete require.cache[require.resolve('../../../Classes/events/EntityEvents.js')];
        EventManager = require('../../../Classes/managers/EventManager.js');
        EntityEvents = require('../../../Classes/events/EntityEvents.js');
        
        // Setup globals for EntityManager to detect
        global.EventManager = EventManager;
        global.EntityEvents = EntityEvents;
        global.window.EventManager = EventManager;
        global.window.EntityEvents = EntityEvents;
        
        // Create fresh EventManager instance
        EventManager._instance = null;
        eventManager = EventManager.getInstance();
      } catch (e) {
        console.log('EventManager or EntityEvents not available, skipping event tests');
      }
    });
    
    afterEach(function() {
      if (eventManager) {
        eventManager.removeAllListeners();
        EventManager._instance = null;
      }
      delete global.EventManager;
      delete global.EntityEvents;
      delete global.window.EventManager;
      delete global.window.EntityEvents;
    });
    
    it('should setup event listeners when EventManager is available', function() {
      if (!EventManager || !EntityEvents) this.skip();
      
      // Create fresh instance after EventManager is available
      EntityManager._instance = null;
      const manager = EntityManager.getInstance();
      
      // Verify listeners were registered
      expect(eventManager.listenerCount(EntityEvents.ANT_CREATED)).to.be.at.least(1);
      expect(eventManager.listenerCount(EntityEvents.ANT_DESTROYED)).to.be.at.least(1);
      expect(eventManager.listenerCount(EntityEvents.ENTITY_CREATED)).to.be.at.least(1);
      expect(eventManager.listenerCount(EntityEvents.ENTITY_DESTROYED)).to.be.at.least(1);
    });
    
    it('should auto-register ants via ANT_CREATED signal', function() {
      if (!EventManager || !EntityEvents) this.skip();
      
      EntityManager._instance = null;
      const manager = EntityManager.getInstance();
      
      const mockAnt = {
        id: 'ant_signal_1',
        type: 'ant',
        render: sinon.stub()
      };
      
      // Emit ANT_CREATED signal
      eventManager.emit(EntityEvents.ANT_CREATED, {
        ant: mockAnt,
        jobName: 'Worker',
        position: { x: 100, y: 100 }
      });
      
      // Verify ant was auto-registered
      expect(manager.getCount('ant')).to.equal(1);
      expect(manager.getById('ant_signal_1')).to.equal(mockAnt);
      expect(manager.getAntCount()).to.equal(1);
    });
    
    it('should auto-unregister ants via ANT_DESTROYED signal', function() {
      if (!EventManager || !EntityEvents) this.skip();
      
      EntityManager._instance = null;
      const manager = EntityManager.getInstance();
      
      // Register ant first
      const mockAnt = {
        id: 'ant_signal_2',
        type: 'ant',
        render: sinon.stub()
      };
      manager.register(mockAnt, 'ant');
      expect(manager.getAntCount()).to.equal(1);
      
      // Emit ANT_DESTROYED signal
      eventManager.emit(EntityEvents.ANT_DESTROYED, {
        antId: 'ant_signal_2',
        antIndex: 0
      });
      
      // Verify ant was auto-unregistered
      expect(manager.getAntCount()).to.equal(0);
      expect(manager.getById('ant_signal_2')).to.be.null;
    });
    
    it('should auto-register generic entities via ENTITY_CREATED signal', function() {
      if (!EventManager || !EntityEvents) this.skip();
      
      EntityManager._instance = null;
      const manager = EntityManager.getInstance();
      
      const mockEntity = {
        id: 'building_signal_1',
        type: 'building',
        render: sinon.stub()
      };
      
      // Emit ENTITY_CREATED signal
      eventManager.emit(EntityEvents.ENTITY_CREATED, {
        entity: mockEntity,
        type: 'building'
      });
      
      // Verify entity was auto-registered
      expect(manager.getCount('building')).to.equal(1);
      expect(manager.getById('building_signal_1')).to.equal(mockEntity);
    });
    
    it('should auto-unregister generic entities via ENTITY_DESTROYED signal', function() {
      if (!EventManager || !EntityEvents) this.skip();
      
      EntityManager._instance = null;
      const manager = EntityManager.getInstance();
      
      // Register entity first
      const mockEntity = {
        id: 'building_signal_2',
        type: 'building',
        render: sinon.stub()
      };
      manager.register(mockEntity, 'building');
      expect(manager.getCount('building')).to.equal(1);
      
      // Emit ENTITY_DESTROYED signal
      eventManager.emit(EntityEvents.ENTITY_DESTROYED, {
        entityId: 'building_signal_2',
        type: 'building'
      });
      
      // Verify entity was auto-unregistered
      expect(manager.getCount('building')).to.equal(0);
      expect(manager.getById('building_signal_2')).to.be.null;
    });
    
    it('should handle multiple ants created via signals', function() {
      if (!EventManager || !EntityEvents) this.skip();
      
      EntityManager._instance = null;
      const manager = EntityManager.getInstance();
      
      // Create 5 ants via signals
      for (let i = 0; i < 5; i++) {
        eventManager.emit(EntityEvents.ANT_CREATED, {
          ant: {
            id: `ant_batch_${i}`,
            type: 'ant',
            render: sinon.stub()
          },
          jobName: 'Worker',
          position: { x: i * 10, y: i * 10 }
        });
      }
      
      expect(manager.getAntCount()).to.equal(5);
      expect(manager.getByType('ant')).to.have.lengthOf(5);
    });
    
    it('should track ant count in real-time via signals', function() {
      if (!EventManager || !EntityEvents) this.skip();
      
      EntityManager._instance = null;
      const manager = EntityManager.getInstance();
      
      expect(manager.getAntCount()).to.equal(0);
      
      // Create 3 ants
      for (let i = 0; i < 3; i++) {
        eventManager.emit(EntityEvents.ANT_CREATED, {
          ant: { id: `ant_rt_${i}`, type: 'ant' }
        });
      }
      expect(manager.getAntCount()).to.equal(3);
      
      // Destroy 1 ant
      eventManager.emit(EntityEvents.ANT_DESTROYED, {
        antId: 'ant_rt_1'
      });
      expect(manager.getAntCount()).to.equal(2);
      
      // Destroy another ant
      eventManager.emit(EntityEvents.ANT_DESTROYED, {
        antId: 'ant_rt_0'
      });
      expect(manager.getAntCount()).to.equal(1);
    });
    
    it('should handle signals with missing data gracefully', function() {
      if (!EventManager || !EntityEvents) this.skip();
      
      EntityManager._instance = null;
      const manager = EntityManager.getInstance();
      
      // ANT_CREATED with null data
      expect(() => {
        eventManager.emit(EntityEvents.ANT_CREATED, null);
      }).to.not.throw();
      
      // ANT_CREATED without ant property
      expect(() => {
        eventManager.emit(EntityEvents.ANT_CREATED, { jobName: 'Worker' });
      }).to.not.throw();
      
      // ANT_DESTROYED with null data
      expect(() => {
        eventManager.emit(EntityEvents.ANT_DESTROYED, null);
      }).to.not.throw();
      
      // ANT_DESTROYED without antId
      expect(() => {
        eventManager.emit(EntityEvents.ANT_DESTROYED, { antIndex: 0 });
      }).to.not.throw();
      
      expect(manager.getCount()).to.equal(0);
    });
    
    it('should work alongside manual registration', function() {
      if (!EventManager || !EntityEvents) this.skip();
      
      EntityManager._instance = null;
      const manager = EntityManager.getInstance();
      
      // Manual registration
      manager.register({ id: 'ant_manual', type: 'ant' }, 'ant');
      expect(manager.getAntCount()).to.equal(1);
      
      // Signal registration
      eventManager.emit(EntityEvents.ANT_CREATED, {
        ant: { id: 'ant_signal', type: 'ant' }
      });
      expect(manager.getAntCount()).to.equal(2);
      
      // Both should be tracked
      expect(manager.getById('ant_manual')).to.not.be.null;
      expect(manager.getById('ant_signal')).to.not.be.null;
    });
    
    it('should provide getAntCount() convenience method', function() {
      if (!EventManager || !EntityEvents) this.skip();
      
      EntityManager._instance = null;
      const manager = EntityManager.getInstance();
      
      expect(manager.getAntCount()).to.equal(0);
      
      // Via signal
      eventManager.emit(EntityEvents.ANT_CREATED, {
        ant: { id: 'ant_count_1', type: 'ant' }
      });
      expect(manager.getAntCount()).to.equal(1);
      
      // Via manual
      manager.register({ id: 'ant_count_2', type: 'ant' }, 'ant');
      expect(manager.getAntCount()).to.equal(2);
      
      // Should equal getCount('ant')
      expect(manager.getAntCount()).to.equal(manager.getCount('ant'));
    });
  });

  describe('Performance', function() {
    it('should handle 1000+ entities efficiently', function() {
      if (!EntityManager) this.skip();
      this.timeout(1000); // 1 second max
      
      const manager = EntityManager.getInstance();
      
      const start = Date.now();
      
      // Register 1000 entities
      for (let i = 0; i < 1000; i++) {
        manager.register({
          id: `entity_${i}`,
          type: i % 2 === 0 ? 'ant' : 'building',
          render: sinon.stub(),
          update: sinon.stub()
        });
      }
      
      // Query operations
      manager.getAll();
      manager.getByType('ant');
      manager.getById('entity_500');
      
      const elapsed = Date.now() - start;
      expect(elapsed).to.be.lessThan(250); // Should complete in <250ms (event listener setup adds overhead)
    });
  });
});
