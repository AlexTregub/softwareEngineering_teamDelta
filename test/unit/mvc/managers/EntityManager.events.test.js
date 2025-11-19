/**
 * EntityManager Event Integration Tests
 * 
 * Tests EventManager integration for automatic entity tracking
 * via ANT_CREATED, ANT_DESTROYED, ENTITY_CREATED, ENTITY_DESTROYED events
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('EntityManager - Event Integration', function() {
  let EntityManager;
  let EventManager;
  let EntityEvents;
  let manager;
  let eventManager;
  let dom;
  let window;

  before(function() {
    // Setup JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window;
    global.window = window;

    // Load dependencies
    EntityManager = require('../../../../Classes/mvc/managers/EntityManager.js');
    EventManager = require('../../../../Classes/managers/EventManager.js');
    EntityEvents = require('../../../../Classes/events/EntityEvents.js');

    // Sync globals
    global.EventManager = EventManager;
    global.EntityEvents = EntityEvents;
    window.EventManager = EventManager;
    window.EntityEvents = EntityEvents;
  });

  beforeEach(function() {
    // Clear singleton instances
    EntityManager._instance = null;
    EventManager._instance = null;

    // Create fresh instances
    eventManager = EventManager.getInstance();
    manager = EntityManager.getInstance();
  });

  afterEach(function() {
    // Cleanup
    manager.clear();
    eventManager.removeAllListeners();
    EntityManager._instance = null;
    EventManager._instance = null;
  });

  after(function() {
    // Cleanup JSDOM
    delete global.window;
    delete global.EventManager;
    delete global.EntityEvents;
  });

  describe('Event Listener Setup', function() {
    it('should setup event listeners on construction', function() {
      // Fresh instance should have listeners registered
      const antCreatedListeners = eventManager.listenerCount(EntityEvents.ANT_CREATED);
      const antDestroyedListeners = eventManager.listenerCount(EntityEvents.ANT_DESTROYED);
      const entityCreatedListeners = eventManager.listenerCount(EntityEvents.ENTITY_CREATED);
      const entityDestroyedListeners = eventManager.listenerCount(EntityEvents.ENTITY_DESTROYED);

      expect(antCreatedListeners).to.equal(1);
      expect(antDestroyedListeners).to.equal(1);
      expect(entityCreatedListeners).to.equal(1);
      expect(entityDestroyedListeners).to.equal(1);
    });

    it('should handle missing EventManager gracefully', function() {
      // Clear singleton and remove EventManager temporarily
      EntityManager._instance = null;
      const tempEventManager = global.EventManager;
      delete global.EventManager;

      // Should not throw
      expect(() => {
        const testManager = new EntityManager();
      }).to.not.throw();

      // Restore
      global.EventManager = tempEventManager;
    });

    it('should handle missing EntityEvents gracefully', function() {
      // Clear singleton and remove EntityEvents temporarily
      EntityManager._instance = null;
      const tempEntityEvents = global.EntityEvents;
      delete global.EntityEvents;

      // Should not throw
      expect(() => {
        const testManager = new EntityManager();
      }).to.not.throw();

      // Restore
      global.EntityEvents = tempEntityEvents;
    });
  });

  describe('ANT_CREATED Event Handling', function() {
    it('should auto-register ant when ANT_CREATED event is emitted', function() {
      const mockAnt = {
        id: 'ant_123',
        type: 'ant',
        position: { x: 100, y: 100 }
      };

      // Emit ANT_CREATED event
      eventManager.emit(EntityEvents.ANT_CREATED, {
        ant: mockAnt,
        jobName: 'Worker',
        position: { x: 100, y: 100 }
      });

      // Verify ant was registered
      expect(manager.getCount('ant')).to.equal(1);
      expect(manager.getById('ant_123')).to.equal(mockAnt);
    });

    it('should handle ANT_CREATED without ant data', function() {
      // Emit event without ant data (should not crash)
      expect(() => {
        eventManager.emit(EntityEvents.ANT_CREATED, {
          jobName: 'Worker',
          position: { x: 100, y: 100 }
        });
      }).to.not.throw();

      expect(manager.getCount('ant')).to.equal(0);
    });

    it('should handle ANT_CREATED with null data', function() {
      expect(() => {
        eventManager.emit(EntityEvents.ANT_CREATED, null);
      }).to.not.throw();

      expect(manager.getCount('ant')).to.equal(0);
    });

    it('should track multiple ants via ANT_CREATED events', function() {
      const ants = [
        { id: 'ant_1', type: 'ant' },
        { id: 'ant_2', type: 'ant' },
        { id: 'ant_3', type: 'ant' }
      ];

      ants.forEach(ant => {
        eventManager.emit(EntityEvents.ANT_CREATED, { ant });
      });

      expect(manager.getCount('ant')).to.equal(3);
      expect(manager.getByType('ant')).to.have.lengthOf(3);
    });
  });

  describe('ANT_DESTROYED Event Handling', function() {
    it('should auto-unregister ant when ANT_DESTROYED event is emitted', function() {
      const mockAnt = {
        id: 'ant_123',
        type: 'ant'
      };

      // Register ant first
      manager.register(mockAnt, 'ant');
      expect(manager.getCount('ant')).to.equal(1);

      // Emit ANT_DESTROYED event
      eventManager.emit(EntityEvents.ANT_DESTROYED, {
        antId: 'ant_123',
        antIndex: 0
      });

      // Verify ant was unregistered
      expect(manager.getCount('ant')).to.equal(0);
      expect(manager.getById('ant_123')).to.be.null;
    });

    it('should handle ANT_DESTROYED without antId', function() {
      expect(() => {
        eventManager.emit(EntityEvents.ANT_DESTROYED, {
          antIndex: 0
        });
      }).to.not.throw();
    });

    it('should handle ANT_DESTROYED with null data', function() {
      expect(() => {
        eventManager.emit(EntityEvents.ANT_DESTROYED, null);
      }).to.not.throw();
    });

    it('should handle ANT_DESTROYED for non-existent ant', function() {
      // Should not throw when unregistering non-existent ant
      expect(() => {
        eventManager.emit(EntityEvents.ANT_DESTROYED, {
          antId: 'nonexistent_ant'
        });
      }).to.not.throw();
    });
  });

  describe('ENTITY_CREATED Event Handling', function() {
    it('should auto-register entity when ENTITY_CREATED event is emitted', function() {
      const mockEntity = {
        id: 'building_1',
        type: 'building'
      };

      eventManager.emit(EntityEvents.ENTITY_CREATED, {
        entity: mockEntity,
        type: 'building'
      });

      expect(manager.getCount('building')).to.equal(1);
      expect(manager.getById('building_1')).to.equal(mockEntity);
    });

    it('should handle ENTITY_CREATED without entity data', function() {
      expect(() => {
        eventManager.emit(EntityEvents.ENTITY_CREATED, {
          type: 'building'
        });
      }).to.not.throw();

      expect(manager.getCount('building')).to.equal(0);
    });

    it('should handle ENTITY_CREATED without type', function() {
      const mockEntity = {
        id: 'entity_1'
      };

      expect(() => {
        eventManager.emit(EntityEvents.ENTITY_CREATED, {
          entity: mockEntity
        });
      }).to.not.throw();
    });
  });

  describe('ENTITY_DESTROYED Event Handling', function() {
    it('should auto-unregister entity when ENTITY_DESTROYED event is emitted', function() {
      const mockEntity = {
        id: 'building_1',
        type: 'building'
      };

      manager.register(mockEntity, 'building');
      expect(manager.getCount('building')).to.equal(1);

      eventManager.emit(EntityEvents.ENTITY_DESTROYED, {
        entityId: 'building_1',
        type: 'building'
      });

      expect(manager.getCount('building')).to.equal(0);
      expect(manager.getById('building_1')).to.be.null;
    });

    it('should handle ENTITY_DESTROYED without entityId', function() {
      expect(() => {
        eventManager.emit(EntityEvents.ENTITY_DESTROYED, {
          type: 'building'
        });
      }).to.not.throw();
    });
  });

  describe('Ant Count Tracking', function() {
    it('should track ant count via getAntCount()', function() {
      expect(manager.getAntCount()).to.equal(0);

      // Create ants via events
      eventManager.emit(EntityEvents.ANT_CREATED, {
        ant: { id: 'ant_1', type: 'ant' }
      });
      expect(manager.getAntCount()).to.equal(1);

      eventManager.emit(EntityEvents.ANT_CREATED, {
        ant: { id: 'ant_2', type: 'ant' }
      });
      expect(manager.getAntCount()).to.equal(2);

      // Destroy ant via event
      eventManager.emit(EntityEvents.ANT_DESTROYED, {
        antId: 'ant_1'
      });
      expect(manager.getAntCount()).to.equal(1);
    });

    it('should track ant count in real-time as events occur', function() {
      const counts = [];

      // Track count changes
      for (let i = 0; i < 5; i++) {
        eventManager.emit(EntityEvents.ANT_CREATED, {
          ant: { id: `ant_${i}`, type: 'ant' }
        });
        counts.push(manager.getAntCount());
      }

      expect(counts).to.deep.equal([1, 2, 3, 4, 5]);

      // Destroy some ants
      eventManager.emit(EntityEvents.ANT_DESTROYED, { antId: 'ant_0' });
      eventManager.emit(EntityEvents.ANT_DESTROYED, { antId: 'ant_2' });

      expect(manager.getAntCount()).to.equal(3);
    });
  });

  describe('Integration with Manual Registration', function() {
    it('should work alongside manual register() calls', function() {
      // Manual registration
      manager.register({ id: 'ant_manual', type: 'ant' }, 'ant');
      expect(manager.getAntCount()).to.equal(1);

      // Event-driven registration
      eventManager.emit(EntityEvents.ANT_CREATED, {
        ant: { id: 'ant_event', type: 'ant' }
      });
      expect(manager.getAntCount()).to.equal(2);

      // Both should be tracked
      expect(manager.getById('ant_manual')).to.not.be.null;
      expect(manager.getById('ant_event')).to.not.be.null;
    });

    it('should prevent duplicate registration via events', function() {
      const mockAnt = { id: 'ant_duplicate', type: 'ant' };

      // Manual registration
      manager.register(mockAnt, 'ant');

      // Emit event (should skip duplicate)
      eventManager.emit(EntityEvents.ANT_CREATED, { ant: mockAnt });

      // Should only be registered once
      expect(manager.getAntCount()).to.equal(1);
    });
  });

  describe('Stats with Event-Driven Tracking', function() {
    it('should reflect event-driven registrations in getStats()', function() {
      // Create mixed entities via events
      eventManager.emit(EntityEvents.ANT_CREATED, {
        ant: { id: 'ant_1', type: 'ant' }
      });
      eventManager.emit(EntityEvents.ANT_CREATED, {
        ant: { id: 'ant_2', type: 'ant' }
      });
      eventManager.emit(EntityEvents.ENTITY_CREATED, {
        entity: { id: 'building_1', type: 'building' },
        type: 'building'
      });

      const stats = manager.getStats();

      expect(stats.total).to.equal(3);
      expect(stats.types.ant).to.equal(2);
      expect(stats.types.building).to.equal(1);
      expect(stats.typeCount).to.equal(2);
    });
  });
});
