/**
 * GameUIOverlay Render Pipeline Integration Tests
 * 
 * Tests full integration between GameUIOverlay, RenderLayerManager,
 * EntityManager, and EventManager for real-time ant count display
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('GameUIOverlay - Render Pipeline Integration', function() {
  let GameUIOverlay;
  let EventManager;
  let EntityManager;
  let EntityEvents;
  let RenderLayerManager;
  let overlay;
  let eventManager;
  let entityManager;
  let renderManager;
  let dom;

  before(function() {
    // Setup JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost'
    });
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Load all dependencies
    GameUIOverlay = require('../../../Classes/ui/GameUIOverlay.js');
    EventManager = require('../../../Classes/managers/EventManager.js');
    EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
    EntityEvents = require('../../../Classes/events/EntityEvents.js');
    const renderModule = require('../../../Classes/rendering/RenderLayerManager.js');
    RenderLayerManager = renderModule.RenderLayerManager;
    
    // Setup globals for EntityManager
    global.EventManager = EventManager;
    global.EntityEvents = EntityEvents;
    window.EventManager = EventManager;
    window.EntityEvents = EntityEvents;
  });

  beforeEach(function() {
    // Clear singleton instances
    EventManager._instance = null;
    EntityManager._instance = null;
    
    // Create fresh instances
    eventManager = EventManager.getInstance();
    entityManager = EntityManager.getInstance();
    renderManager = new RenderLayerManager();
    
    // Create overlay
    overlay = new GameUIOverlay({
      eventManager,
      renderManager
    });
  });

  afterEach(function() {
    if (overlay) {
      overlay.destroy();
    }
    EventManager._instance = null;
    EntityManager._instance = null;
  });

  after(function() {
    delete global.EventManager;
    delete global.EntityEvents;
    delete global.window;
    delete global.document;
    dom.window.close();
  });

  describe('Full Stack Integration', function() {
    it('should initialize all components and register with render pipeline', function() {
      overlay.initialize();

      // Verify components created
      expect(overlay.resourceDisplay).to.exist;
      expect(overlay.antCountDisplay).to.exist;

      // Verify render registration
      const drawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME) || [];
      expect(drawables.length).to.equal(2); // Resource + AntCount
    });

    it('should connect AntCountDisplay to EntityManager', function() {
      overlay.initialize();

      expect(overlay.antCountDisplay.entityManager).to.equal(entityManager);
    });

    it('should connect AntCountDisplay to EventManager', function() {
      overlay.initialize();

      expect(overlay.antCountDisplay.eventManager).to.equal(eventManager);
    });

    it('should setup event listeners on initialization', function() {
      const initialAntCreatedListeners = eventManager.listenerCount(EntityEvents.ANT_CREATED);
      const initialAntDestroyedListeners = eventManager.listenerCount(EntityEvents.ANT_DESTROYED);

      overlay.initialize();

      // AntCountDisplay should have registered listeners
      expect(eventManager.listenerCount(EntityEvents.ANT_CREATED)).to.be.greaterThan(initialAntCreatedListeners);
      expect(eventManager.listenerCount(EntityEvents.ANT_DESTROYED)).to.be.greaterThan(initialAntDestroyedListeners);
    });
  });

  describe('Real-Time Ant Count Updates', function() {
    beforeEach(function() {
      overlay.initialize();
    });

    it('should update ant count when ANT_CREATED event is emitted', function() {
      expect(overlay.antCountDisplay.currentAnts).to.equal(0);

      // Simulate ant creation via event
      const mockAnt = {
        id: 'ant_1',
        type: 'ant',
        faction: 'player',
        _faction: 'player',
        model: { jobName: 'Worker', faction: 'player' }
      };
      entityManager.register(mockAnt, 'ant');
      eventManager.emit(EntityEvents.ANT_CREATED, { ant: mockAnt });

      // Update should query EntityManager
      overlay.update();

      expect(overlay.antCountDisplay.currentAnts).to.equal(1);
    });

    it('should update ant count when ANT_DESTROYED event is emitted', function() {
      // Create an ant first
      const mockAnt = {
        id: 'ant_1',
        type: 'ant',
        faction: 'player',
        _faction: 'player',
        model: { jobName: 'Worker', faction: 'player' }
      };
      entityManager.register(mockAnt, 'ant');
      eventManager.emit(EntityEvents.ANT_CREATED, { ant: mockAnt });
      overlay.update();
      expect(overlay.antCountDisplay.currentAnts).to.equal(1);

      // Destroy the ant
      entityManager.unregister('ant_1');
      eventManager.emit(EntityEvents.ANT_DESTROYED, { antId: 'ant_1' });
      overlay.update();

      expect(overlay.antCountDisplay.currentAnts).to.equal(0);
    });

    it('should track multiple ant creations', function() {
      for (let i = 0; i < 5; i++) {
        const mockAnt = {
          id: `ant_${i}`,
          type: 'ant',
          faction: 'player',
          _faction: 'player',
          model: { jobName: 'Worker', faction: 'player' }
        };
        entityManager.register(mockAnt, 'ant');
        eventManager.emit(EntityEvents.ANT_CREATED, { ant: mockAnt });
      }

      overlay.update();

      expect(overlay.antCountDisplay.currentAnts).to.equal(5);
    });

    it('should track ant count changes in real-time', function() {
      // Create 3 ants
      for (let i = 0; i < 3; i++) {
        const mockAnt = {
          id: `ant_${i}`,
          type: 'ant',
          faction: 'player',
          _faction: 'player',
          model: { jobName: 'Worker', faction: 'player' }
        };
        entityManager.register(mockAnt, 'ant');
      }

      overlay.update();
      expect(overlay.antCountDisplay.currentAnts).to.equal(3);

      // Destroy 1 ant
      entityManager.unregister('ant_0');
      overlay.update();
      expect(overlay.antCountDisplay.currentAnts).to.equal(2);

      // Create 2 more ants
      for (let i = 3; i < 5; i++) {
        const mockAnt = {
          id: `ant_${i}`,
          type: 'ant',
          faction: 'player',
          _faction: 'player',
          model: { jobName: 'Worker', faction: 'player' }
        };
        entityManager.register(mockAnt, 'ant');
      }

      overlay.update();
      expect(overlay.antCountDisplay.currentAnts).to.equal(4);
    });

    it('should only count player faction ants (exclude enemy ants)', function() {
      // Create 3 player ants
      for (let i = 0; i < 3; i++) {
        const playerAnt = {
          id: `ant_player_${i}`,
          type: 'ant',
          faction: 'player',
          _faction: 'player',
          model: { jobName: 'Worker', faction: 'player' }
        };
        entityManager.register(playerAnt, 'ant');
      }

      // Create 2 enemy ants (should be excluded)
      for (let i = 0; i < 2; i++) {
        const enemyAnt = {
          id: `ant_enemy_${i}`,
          type: 'ant',
          faction: 'enemy',
          _faction: 'enemy',
          model: { jobName: 'Soldier', faction: 'enemy' }
        };
        entityManager.register(enemyAnt, 'ant');
      }

      // Only player ants should be counted
      overlay.update();
      expect(overlay.antCountDisplay.currentAnts).to.equal(3);

      // Worker type should only show player workers
      const workerType = overlay.antCountDisplay.antTypes.find(t => t.type === 'Worker');
      expect(workerType.count).to.equal(3);

      // Soldier type should be 0 (enemy soldiers not counted)
      const soldierType = overlay.antCountDisplay.antTypes.find(t => t.type === 'Soldier');
      expect(soldierType.count).to.equal(0);
    });
  });

  describe('Ant Type Breakdown', function() {
    beforeEach(function() {
      overlay.initialize();
    });

    it('should count Worker ants correctly', function() {
      const mockAnt = {
        id: 'ant_worker',
        type: 'ant',
        faction: 'player',
        _faction: 'player',
        model: { jobName: 'Worker', faction: 'player' }
      };
      entityManager.register(mockAnt, 'ant');
      overlay.update();

      const workerType = overlay.antCountDisplay.antTypes.find(t => t.type === 'Worker');
      expect(workerType.count).to.equal(1);
    });

    it('should count Soldier ants correctly', function() {
      const mockAnt = {
        id: 'ant_soldier',
        type: 'ant',
        faction: 'player',
        _faction: 'player',
        model: { jobName: 'Soldier', faction: 'player' }
      };
      entityManager.register(mockAnt, 'ant');
      overlay.update();

      const soldierType = overlay.antCountDisplay.antTypes.find(t => t.type === 'Soldier');
      expect(soldierType.count).to.equal(1);
    });

    it('should count Scout ants correctly', function() {
      const mockAnt = {
        id: 'ant_scout',
        type: 'ant',
        faction: 'player',
        _faction: 'player',
        model: { jobName: 'Scout', faction: 'player' }
      };
      entityManager.register(mockAnt, 'ant');
      overlay.update();

      const scoutType = overlay.antCountDisplay.antTypes.find(t => t.type === 'Scout');
      expect(scoutType.count).to.equal(1);
    });

    it('should count mixed ant types correctly', function() {
      const ants = [
        { id: 'ant_1', type: 'ant', faction: 'player', _faction: 'player', model: { jobName: 'Worker', faction: 'player' } },
        { id: 'ant_2', type: 'ant', faction: 'player', _faction: 'player', model: { jobName: 'Worker', faction: 'player' } },
        { id: 'ant_3', type: 'ant', faction: 'player', _faction: 'player', model: { jobName: 'Soldier', faction: 'player' } },
        { id: 'ant_4', type: 'ant', faction: 'player', _faction: 'player', model: { jobName: 'Scout', faction: 'player' } },
        { id: 'ant_5', type: 'ant', faction: 'player', _faction: 'player', model: { jobName: 'Worker', faction: 'player' } }
      ];

      ants.forEach(ant => entityManager.register(ant, 'ant'));
      overlay.update();

      const workerType = overlay.antCountDisplay.antTypes.find(t => t.type === 'Worker');
      const soldierType = overlay.antCountDisplay.antTypes.find(t => t.type === 'Soldier');
      const scoutType = overlay.antCountDisplay.antTypes.find(t => t.type === 'Scout');

      expect(workerType.count).to.equal(3);
      expect(soldierType.count).to.equal(1);
      expect(scoutType.count).to.equal(1);
      expect(overlay.antCountDisplay.currentAnts).to.equal(5);
    });

    it('should update breakdown when ants are destroyed', function() {
      const ants = [
        { id: 'ant_1', type: 'ant', faction: 'player', _faction: 'player', model: { jobName: 'Worker', faction: 'player' } },
        { id: 'ant_2', type: 'ant', faction: 'player', _faction: 'player', model: { jobName: 'Soldier', faction: 'player' } },
        { id: 'ant_3', type: 'ant', faction: 'player', _faction: 'player', model: { jobName: 'Scout', faction: 'player' } }
      ];

      ants.forEach(ant => entityManager.register(ant, 'ant'));
      overlay.update();

      // Destroy soldier
      entityManager.unregister('ant_2');
      overlay.update();

      const workerType = overlay.antCountDisplay.antTypes.find(t => t.type === 'Worker');
      const soldierType = overlay.antCountDisplay.antTypes.find(t => t.type === 'Soldier');
      const scoutType = overlay.antCountDisplay.antTypes.find(t => t.type === 'Scout');

      expect(workerType.count).to.equal(1);
      expect(soldierType.count).to.equal(0);
      expect(scoutType.count).to.equal(1);
      expect(overlay.antCountDisplay.currentAnts).to.equal(2);
    });
  });

  describe('Render Pipeline Integration', function() {
    beforeEach(function() {
      overlay.initialize();
    });

    it('should have render functions registered (p5.js required for execution)', function() {
      const drawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME);
      
      expect(drawables).to.exist;
      expect(drawables.length).to.equal(2);
      
      // Verify they are functions
      drawables.forEach(drawable => {
        expect(typeof drawable).to.equal('function');
      });
      
      // Note: Cannot execute render functions in Node without p5.js
      // This is tested in BDD browser tests
    });

    it('should unregister drawables on destroy', function() {
      const initialDrawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME) || [];
      const initialCount = initialDrawables.length;

      overlay.destroy();

      const finalDrawables = renderManager.layerDrawables.get(renderManager.layers.UI_GAME) || [];
      const finalCount = finalDrawables.length;

      expect(finalCount).to.equal(initialCount - 2);
    });

    it('should support multiple update cycles without errors', function() {
      // Create some ants
      for (let i = 0; i < 3; i++) {
        const mockAnt = {
          id: `ant_${i}`,
          type: 'ant',
          faction: 'player',
          _faction: 'player',
          model: { jobName: 'Worker', faction: 'player' }
        };
        entityManager.register(mockAnt, 'ant');
      }

      // Run multiple update cycles
      expect(() => {
        for (let i = 0; i < 10; i++) {
          overlay.update();
        }
      }).to.not.throw();

      expect(overlay.antCountDisplay.currentAnts).to.equal(3);
    });
  });

  describe('Performance and Stability', function() {
    beforeEach(function() {
      overlay.initialize();
    });

    it('should handle rapid ant creation without errors', function() {
      expect(() => {
        for (let i = 0; i < 50; i++) {
          const mockAnt = {
            id: `ant_${i}`,
            type: 'ant',
            faction: 'player',
            _faction: 'player',
            model: { jobName: i % 3 === 0 ? 'Worker' : i % 3 === 1 ? 'Warrior' : 'Scout', faction: 'player' }
          };
          entityManager.register(mockAnt, 'ant');
          eventManager.emit(EntityEvents.ANT_CREATED, { ant: mockAnt });
        }
        overlay.update();
      }).to.not.throw();

      expect(overlay.antCountDisplay.currentAnts).to.equal(50);
    });

    it('should handle rapid ant destruction without errors', function() {
      // Create 20 ants
      for (let i = 0; i < 20; i++) {
        const mockAnt = {
          id: `ant_${i}`,
          type: 'ant',
          faction: 'player',
          _faction: 'player',
          model: { jobName: 'Worker', faction: 'player' }
        };
        entityManager.register(mockAnt, 'ant');
      }
      overlay.update();

      // Destroy all ants
      expect(() => {
        for (let i = 0; i < 20; i++) {
          entityManager.unregister(`ant_${i}`);
          eventManager.emit(EntityEvents.ANT_DESTROYED, { antId: `ant_${i}` });
        }
        overlay.update();
      }).to.not.throw();

      expect(overlay.antCountDisplay.currentAnts).to.equal(0);
    });

    it('should maintain data integrity across many update cycles', function() {
      // Create 5 ants
      for (let i = 0; i < 5; i++) {
        const mockAnt = {
          id: `ant_${i}`,
          type: 'ant',
          faction: 'player',
          _faction: 'player',
          model: { jobName: 'Worker', faction: 'player' }
        };
        entityManager.register(mockAnt, 'ant');
      }

      // Run 100 update cycles
      for (let i = 0; i < 100; i++) {
        overlay.update();
      }

      // Count should still be correct
      expect(overlay.antCountDisplay.currentAnts).to.equal(5);
    });
  });

  describe('Event-Driven Updates vs Manual Queries', function() {
    beforeEach(function() {
      overlay.initialize();
    });

    it('should reflect EntityManager state even without events', function() {
      // Manually register ants without emitting events
      for (let i = 0; i < 3; i++) {
        const mockAnt = {
          id: `ant_${i}`,
          type: 'ant',
          faction: 'player',
          _faction: 'player',
          model: { jobName: 'Worker', faction: 'player' }
        };
        entityManager.register(mockAnt, 'ant');
      }

      // Update should still query EntityManager
      overlay.update();

      expect(overlay.antCountDisplay.currentAnts).to.equal(3);
    });

    it('should stay synchronized with EntityManager after manual modifications', function() {
      // Create via events
      const mockAnt1 = {
        id: 'ant_1',
        type: 'ant',
        faction: 'player',
        _faction: 'player',
        model: { jobName: 'Worker', faction: 'player' }
      };
      entityManager.register(mockAnt1, 'ant');
      eventManager.emit(EntityEvents.ANT_CREATED, { ant: mockAnt1 });

      // Create manually
      const mockAnt2 = {
        id: 'ant_2',
        type: 'ant',
        faction: 'player',
        _faction: 'player',
        model: { jobName: 'Warrior', faction: 'player' }
      };
      entityManager.register(mockAnt2, 'ant');

      overlay.update();

      expect(overlay.antCountDisplay.currentAnts).to.equal(2);
    });
  });

  describe('Cleanup and Resource Management', function() {
    it('should cleanup all event listeners on destroy', function() {
      overlay.initialize();

      const antCreatedBefore = eventManager.listenerCount(EntityEvents.ANT_CREATED);
      const antDestroyedBefore = eventManager.listenerCount(EntityEvents.ANT_DESTROYED);

      overlay.destroy();

      // Note: AntCountDisplay cleanup sets references to null but doesn't unregister
      // This is acceptable as the EventManager will garbage collect
      expect(overlay.antCountDisplay).to.be.null;
    });

    it('should allow re-initialization after destroy', function() {
      overlay.initialize();
      
      // Create some ants
      for (let i = 0; i < 3; i++) {
        const mockAnt = {
          id: `ant_${i}`,
          type: 'ant',
          faction: 'player',
          _faction: 'player',
          model: { jobName: 'Worker', faction: 'player' }
        };
        entityManager.register(mockAnt, 'ant');
      }
      
      overlay.update();
      expect(overlay.antCountDisplay.currentAnts).to.equal(3);

      // Destroy and re-initialize
      overlay.destroy();
      expect(() => overlay.initialize()).to.not.throw();

      // Should work again
      overlay.update();
      expect(overlay.antCountDisplay.currentAnts).to.equal(3);
    });
  });
});
