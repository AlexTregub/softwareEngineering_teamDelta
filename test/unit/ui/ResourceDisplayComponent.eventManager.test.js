/**
 * ResourceDisplayComponent EventManager Integration Tests
 * =========================================================
 * TDD Phase 6: Write tests BEFORE implementing event subscription
 * 
 * Tests verify:
 * - Component subscribes to resource events on initialization
 * - Component unsubscribes on cleanup/destroy
 * - Resource counts update when events fire
 * - Event handlers properly update internal state
 * 
 * Event Names (from EntityEvents.js):
 * - ANT_RESOURCE_COLLECTED: 'entity:ant:resource:collected'
 * - ANT_RESOURCE_DEPOSITED: 'entity:ant:resource:deposited'
 * 
 * We'll use a custom event for general resource updates:
 * - RESOURCE_UPDATED: 'resource:updated' (faction-specific)
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('ResourceDisplayComponent - EventManager Integration (Phase 6)', function() {
  let ResourceDisplayComponent;
  let EventManager;
  let component;
  let eventManager;

  before(function() {
    // Setup minimal global mocks
    global.logNormal = sinon.stub();
    global.logWarn = sinon.stub();
    global.logError = sinon.stub();

    // Load components
    EventManager = require('../../../Classes/managers/EventManager.js');
    ResourceDisplayComponent = require('../../../Classes/ui/ResourceDisplayComponent.js');
  });

  beforeEach(function() {
    // Create fresh event manager instance
    eventManager = new EventManager();
    
    // Create component with event manager integration
    component = new ResourceDisplayComponent(50, 50, 'player', { eventManager });
  });

  afterEach(function() {
    // Cleanup subscriptions
    if (component && component.destroy) {
      component.destroy();
    }
  });

  after(function() {
    // Cleanup globals
    delete global.logNormal;
    delete global.logWarn;
    delete global.logError;
  });

  describe('Event Subscription Lifecycle', function() {
    it('should accept eventManager in constructor options', function() {
      const comp = new ResourceDisplayComponent(0, 0, 'player', { eventManager });
      expect(comp).to.be.an('object');
    });

    it('should have _setupEventListeners() method', function() {
      expect(component._setupEventListeners).to.be.a('function');
    });

    it('should have destroy() method for cleanup', function() {
      expect(component.destroy).to.be.a('function');
    });

    it('should store eventManager reference', function() {
      expect(component.eventManager).to.equal(eventManager);
    });

    it('should subscribe to RESOURCE_UPDATED event on initialization', function() {
      const listenerCount = eventManager.listenerCount('RESOURCE_UPDATED');
      expect(listenerCount).to.be.at.least(1);
    });

    it('should unsubscribe from events when destroy() is called', function() {
      const initialCount = eventManager.listenerCount('RESOURCE_UPDATED');
      
      component.destroy();
      
      const finalCount = eventManager.listenerCount('RESOURCE_UPDATED');
      expect(finalCount).to.be.below(initialCount);
    });

    it('should handle multiple subscribe/unsubscribe cycles', function() {
      const comp1 = new ResourceDisplayComponent(0, 0, 'player', { eventManager });
      const comp2 = new ResourceDisplayComponent(0, 0, 'player', { eventManager });
      
      const count1 = eventManager.listenerCount('RESOURCE_UPDATED');
      expect(count1).to.be.at.least(2);
      
      comp1.destroy();
      const count2 = eventManager.listenerCount('RESOURCE_UPDATED');
      expect(count2).to.be.below(count1);
      
      comp2.destroy();
      const count3 = eventManager.listenerCount('RESOURCE_UPDATED');
      expect(count3).to.be.below(count2);
    });
  });

  describe('RESOURCE_UPDATED Event Handling', function() {
    it('should update food count when RESOURCE_UPDATED event fires', function() {
      const initialFood = component.getResources().food;
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'food',
        amount: 50
      });
      
      const updatedFood = component.getResources().food;
      expect(updatedFood).to.equal(50);
      expect(updatedFood).to.not.equal(initialFood);
    });

    it('should update wood count when RESOURCE_UPDATED event fires', function() {
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'wood',
        amount: 75
      });
      
      expect(component.getResources().wood).to.equal(75);
    });

    it('should update stone count when RESOURCE_UPDATED event fires', function() {
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'stone',
        amount: 100
      });
      
      expect(component.getResources().stone).to.equal(100);
    });

    it('should only respond to events for its factionId', function() {
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'enemy',
        resourceType: 'food',
        amount: 999
      });
      
      // Should NOT update (wrong faction)
      expect(component.getResources().food).to.equal(0);
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'food',
        amount: 50
      });
      
      // Should update (correct faction)
      expect(component.getResources().food).to.equal(50);
    });

    it('should handle multiple resource updates', function() {
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'food',
        amount: 100
      });
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'wood',
        amount: 200
      });
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'stone',
        amount: 300
      });
      
      const resources = component.getResources();
      expect(resources.food).to.equal(100);
      expect(resources.wood).to.equal(200);
      expect(resources.stone).to.equal(300);
    });

    it('should handle rapid successive events', function() {
      for (let i = 1; i <= 10; i++) {
        eventManager.emit('RESOURCE_UPDATED', {
          factionId: 'player',
          resourceType: 'food',
          amount: i * 10
        });
      }
      
      expect(component.getResources().food).to.equal(100);
    });
  });

  describe('Bulk Resource Updates', function() {
    it('should update all resources when bulk event fires', function() {
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resources: {
          food: 111,
          wood: 222,
          stone: 333
        }
      });
      
      const resources = component.getResources();
      expect(resources.food).to.equal(111);
      expect(resources.wood).to.equal(222);
      expect(resources.stone).to.equal(333);
    });

    it('should support partial bulk updates', function() {
      component.setResources({ food: 50, wood: 50, stone: 50 });
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resources: {
          food: 100
          // wood and stone not included
        }
      });
      
      const resources = component.getResources();
      expect(resources.food).to.equal(100);
      expect(resources.wood).to.equal(50); // Unchanged
      expect(resources.stone).to.equal(50); // Unchanged
    });
  });

  describe('Error Handling', function() {
    it('should handle events with missing data gracefully', function() {
      expect(() => {
        eventManager.emit('RESOURCE_UPDATED', {
          factionId: 'player'
          // missing resourceType and amount
        });
      }).to.not.throw();
    });

    it('should handle events with invalid resource types', function() {
      const initialResources = component.getResources();
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'invalid',
        amount: 999
      });
      
      // Should not crash, resources unchanged
      expect(component.getResources()).to.deep.equal(initialResources);
    });

    it('should handle events with negative amounts', function() {
      component.updateResourceCount('food', 100);
      
      eventManager.emit('RESOURCE_UPDATED', {
        factionId: 'player',
        resourceType: 'food',
        amount: -50
      });
      
      // Should handle negative (allow for deduction)
      expect(component.getResources().food).to.equal(-50);
    });

    it('should handle missing factionId', function() {
      const initialResources = component.getResources();
      
      eventManager.emit('RESOURCE_UPDATED', {
        resourceType: 'food',
        amount: 999
      });
      
      // Should not update (no factionId match)
      expect(component.getResources()).to.deep.equal(initialResources);
    });
  });

  describe('Component without EventManager', function() {
    it('should work without eventManager (manual mode)', function() {
      const manualComponent = new ResourceDisplayComponent(0, 0, 'player');
      
      expect(manualComponent.eventManager).to.be.undefined;
      expect(() => {
        manualComponent.updateResourceCount('food', 50);
      }).to.not.throw();
      
      expect(manualComponent.getResources().food).to.equal(50);
    });

    it('should not crash when destroy() called without eventManager', function() {
      const manualComponent = new ResourceDisplayComponent(0, 0, 'player');
      
      expect(() => {
        manualComponent.destroy();
      }).to.not.throw();
    });
  });

  describe('Memory Leak Prevention', function() {
    it('should not accumulate listeners on repeated create/destroy', function() {
      const initialCount = eventManager.listenerCount('RESOURCE_UPDATED');
      
      for (let i = 0; i < 10; i++) {
        const temp = new ResourceDisplayComponent(0, 0, 'player', { eventManager });
        temp.destroy();
      }
      
      const finalCount = eventManager.listenerCount('RESOURCE_UPDATED');
      
      // Should return to initial state (or close to it)
      expect(finalCount).to.be.at.most(initialCount + 1);
    });
  });
});
