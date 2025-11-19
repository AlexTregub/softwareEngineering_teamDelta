/**
 * EventManager Pub/Sub Unit Tests
 * =================================
 * Tests for pub/sub event bus functionality (on/off/once/emit)
 * 
 * Tests verify:
 * - Event subscription (on)
 * - Event unsubscription (off)
 * - Single-fire subscription (once)
 * - Event emission (emit)
 * - Listener counting
 * - Bulk unsubscription (removeAllListeners)
 * - Error handling in listeners
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EventManager - Pub/Sub', function() {
  let EventManager;
  let eventManager;

  before(function() {
    // Setup minimal global mocks
    global.logNormal = sinon.stub();
    global.logWarn = sinon.stub();
    global.logError = sinon.stub();

    // Load EventManager
    EventManager = require('../../../Classes/managers/EventManager.js');
  });

  beforeEach(function() {
    // Get fresh singleton instance
    eventManager = EventManager.getInstance();
    
    // Clear all listeners before each test
    eventManager.removeAllListeners();
  });

  after(function() {
    // Cleanup
    delete global.logNormal;
    delete global.logWarn;
    delete global.logError;
  });

  // ===== SUBSCRIPTION (on) =====
  describe('on() - Event Subscription', function() {
    it('should register a listener for an event', function() {
      const callback = sinon.stub();

      eventManager.on('test:event', callback);

      expect(eventManager.listenerCount('test:event')).to.equal(1);
    });

    it('should allow multiple listeners for same event', function() {
      const callback1 = sinon.stub();
      const callback2 = sinon.stub();

      eventManager.on('test:event', callback1);
      eventManager.on('test:event', callback2);

      expect(eventManager.listenerCount('test:event')).to.equal(2);
    });

    it('should return an unsubscribe function', function() {
      const callback = sinon.stub();

      const unsubscribe = eventManager.on('test:event', callback);

      expect(unsubscribe).to.be.a('function');
    });

    it('should remove listener when unsubscribe function is called', function() {
      const callback = sinon.stub();
      const unsubscribe = eventManager.on('test:event', callback);

      unsubscribe();

      expect(eventManager.listenerCount('test:event')).to.equal(0);
    });

    it('should not throw when callback is not a function', function() {
      expect(() => {
        eventManager.on('test:event', null);
        eventManager.on('test:event', undefined);
        eventManager.on('test:event', 'not a function');
      }).to.not.throw();
    });
  });

  // ===== UNSUBSCRIPTION (off) =====
  describe('off() - Event Unsubscription', function() {
    it('should remove a specific listener', function() {
      const callback = sinon.stub();
      eventManager.on('test:event', callback);

      eventManager.off('test:event', callback);

      expect(eventManager.listenerCount('test:event')).to.equal(0);
    });

    it('should only remove the specified listener', function() {
      const callback1 = sinon.stub();
      const callback2 = sinon.stub();
      eventManager.on('test:event', callback1);
      eventManager.on('test:event', callback2);

      eventManager.off('test:event', callback1);

      expect(eventManager.listenerCount('test:event')).to.equal(1);
    });

    it('should not throw when removing non-existent listener', function() {
      const callback = sinon.stub();

      expect(() => {
        eventManager.off('test:event', callback);
      }).to.not.throw();
    });

    it('should not throw when event has no listeners', function() {
      expect(() => {
        eventManager.off('nonexistent:event', sinon.stub());
      }).to.not.throw();
    });
  });

  // ===== SINGLE-FIRE SUBSCRIPTION (once) =====
  describe('once() - Single-Fire Subscription', function() {
    it('should trigger listener only once', function() {
      const callback = sinon.stub();
      eventManager.once('test:event', callback);

      eventManager.emit('test:event', { data: 'first' });
      eventManager.emit('test:event', { data: 'second' });

      sinon.assert.calledOnce(callback);
      sinon.assert.calledWith(callback, { data: 'first' });
    });

    it('should auto-unsubscribe after first trigger', function() {
      const callback = sinon.stub();
      eventManager.once('test:event', callback);

      eventManager.emit('test:event', { data: 'test' });

      expect(eventManager.listenerCount('test:event')).to.equal(0);
    });

    it('should return an unsubscribe function', function() {
      const callback = sinon.stub();

      const unsubscribe = eventManager.once('test:event', callback);

      expect(unsubscribe).to.be.a('function');
    });

    it('should allow manual unsubscribe before trigger', function() {
      const callback = sinon.stub();
      const unsubscribe = eventManager.once('test:event', callback);

      unsubscribe();
      eventManager.emit('test:event', { data: 'test' });

      sinon.assert.notCalled(callback);
    });
  });

  // ===== EVENT EMISSION (emit) =====
  describe('emit() - Event Emission', function() {
    it('should call all registered listeners', function() {
      const callback1 = sinon.stub();
      const callback2 = sinon.stub();
      eventManager.on('test:event', callback1);
      eventManager.on('test:event', callback2);

      eventManager.emit('test:event', { data: 'test' });

      sinon.assert.calledOnce(callback1);
      sinon.assert.calledOnce(callback2);
    });

    it('should pass event data to listeners', function() {
      const callback = sinon.stub();
      const eventData = { message: 'hello', value: 42 };
      eventManager.on('test:event', callback);

      eventManager.emit('test:event', eventData);

      sinon.assert.calledWith(callback, eventData);
    });

    it('should not throw when no listeners exist', function() {
      expect(() => {
        eventManager.emit('nonexistent:event', { data: 'test' });
      }).to.not.throw();
    });

    it('should continue emitting if one listener throws', function() {
      const callback1 = sinon.stub().throws(new Error('Listener error'));
      const callback2 = sinon.stub();
      eventManager.on('test:event', callback1);
      eventManager.on('test:event', callback2);

      eventManager.emit('test:event', { data: 'test' });

      sinon.assert.calledOnce(callback2);
    });

    it('should emit to listeners in registration order', function() {
      const callOrder = [];
      const callback1 = sinon.stub().callsFake(() => callOrder.push('first'));
      const callback2 = sinon.stub().callsFake(() => callOrder.push('second'));
      const callback3 = sinon.stub().callsFake(() => callOrder.push('third'));
      
      eventManager.on('test:event', callback1);
      eventManager.on('test:event', callback2);
      eventManager.on('test:event', callback3);

      eventManager.emit('test:event', {});

      expect(callOrder).to.deep.equal(['first', 'second', 'third']);
    });
  });

  // ===== LISTENER COUNTING =====
  describe('listenerCount() - Listener Counting', function() {
    it('should return 0 for events with no listeners', function() {
      expect(eventManager.listenerCount('nonexistent:event')).to.equal(0);
    });

    it('should return correct count for single listener', function() {
      eventManager.on('test:event', sinon.stub());

      expect(eventManager.listenerCount('test:event')).to.equal(1);
    });

    it('should return correct count for multiple listeners', function() {
      eventManager.on('test:event', sinon.stub());
      eventManager.on('test:event', sinon.stub());
      eventManager.on('test:event', sinon.stub());

      expect(eventManager.listenerCount('test:event')).to.equal(3);
    });

    it('should update count after unsubscription', function() {
      const unsubscribe = eventManager.on('test:event', sinon.stub());
      expect(eventManager.listenerCount('test:event')).to.equal(1);

      unsubscribe();

      expect(eventManager.listenerCount('test:event')).to.equal(0);
    });
  });

  // ===== BULK UNSUBSCRIPTION =====
  describe('removeAllListeners() - Bulk Unsubscription', function() {
    it('should remove all listeners for a specific event', function() {
      eventManager.on('test:event', sinon.stub());
      eventManager.on('test:event', sinon.stub());
      eventManager.on('other:event', sinon.stub());

      eventManager.removeAllListeners('test:event');

      expect(eventManager.listenerCount('test:event')).to.equal(0);
      expect(eventManager.listenerCount('other:event')).to.equal(1);
    });

    it('should remove all listeners for all events when no event name provided', function() {
      eventManager.on('event1', sinon.stub());
      eventManager.on('event2', sinon.stub());
      eventManager.on('event3', sinon.stub());

      eventManager.removeAllListeners();

      expect(eventManager.listenerCount('event1')).to.equal(0);
      expect(eventManager.listenerCount('event2')).to.equal(0);
      expect(eventManager.listenerCount('event3')).to.equal(0);
    });

    it('should not throw when removing listeners from nonexistent event', function() {
      expect(() => {
        eventManager.removeAllListeners('nonexistent:event');
      }).to.not.throw();
    });
  });

  // ===== ISOLATION & MEMORY =====
  describe('Isolation & Memory Management', function() {
    it('should not affect other events when modifying one', function() {
      const callback1 = sinon.stub();
      const callback2 = sinon.stub();
      eventManager.on('event1', callback1);
      eventManager.on('event2', callback2);

      eventManager.off('event1', callback1);

      expect(eventManager.listenerCount('event1')).to.equal(0);
      expect(eventManager.listenerCount('event2')).to.equal(1);
    });

    it('should prevent memory leaks when unsubscribing', function() {
      const callbacks = [];
      for (let i = 0; i < 100; i++) {
        callbacks.push(sinon.stub());
        eventManager.on('test:event', callbacks[i]);
      }

      callbacks.forEach(cb => eventManager.off('test:event', cb));

      expect(eventManager.listenerCount('test:event')).to.equal(0);
    });

    it('should allow same callback for different events', function() {
      const callback = sinon.stub();
      eventManager.on('event1', callback);
      eventManager.on('event2', callback);

      eventManager.emit('event1', { source: '1' });
      eventManager.emit('event2', { source: '2' });

      sinon.assert.calledTwice(callback);
      expect(callback.firstCall.args[0]).to.deep.equal({ source: '1' });
      expect(callback.secondCall.args[0]).to.deep.equal({ source: '2' });
    });
  });

  // ===== ERROR HANDLING =====
  describe('Error Handling', function() {
    it('should not crash when listener throws', function() {
      const errorCallback = sinon.stub().throws(new Error('Test error'));
      const normalCallback = sinon.stub();
      
      eventManager.on('test:event', errorCallback);
      eventManager.on('test:event', normalCallback);

      expect(() => {
        eventManager.emit('test:event', {});
      }).to.not.throw();

      sinon.assert.calledOnce(normalCallback);
    });

    it('should handle invalid event names gracefully', function() {
      expect(() => {
        eventManager.on(null, sinon.stub());
        eventManager.on(undefined, sinon.stub());
        eventManager.emit(null, {});
        eventManager.emit(undefined, {});
      }).to.not.throw();
    });

    it('should handle missing event data', function() {
      const callback = sinon.stub();
      eventManager.on('test:event', callback);

      expect(() => {
        eventManager.emit('test:event');
      }).to.not.throw();

      // EventManager passes null when no data provided
      expect(callback.called).to.be.true;
    });
  });

  // ===== SINGLETON BEHAVIOR =====
  describe('Singleton Behavior', function() {
    it('should return same instance from getInstance()', function() {
      const instance1 = EventManager.getInstance();
      const instance2 = EventManager.getInstance();

      expect(instance1).to.equal(instance2);
    });

    it('should maintain listeners across getInstance() calls', function() {
      const instance1 = EventManager.getInstance();
      instance1.on('test:event', sinon.stub());

      const instance2 = EventManager.getInstance();

      expect(instance2.listenerCount('test:event')).to.equal(1);
    });
  });
});
