/**
 * EventManager Integration Tests
 * 
 * Tests realistic event system integration focusing on EventManager's actual architecture:
 * - Plain object storage (not Event class instances)
 * - Built-in trigger evaluation (delay, flag-based)
 * - Manual event triggering
 * - JSON configuration loading
 * - Flag system integration
 * - Priority and state management
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock p5.js globals
if (typeof global !== 'undefined') {
  global.millis = sinon.stub();
  global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, z: 0 }));
}

// Load classes
const EventManager = require('../../../Classes/managers/EventManager.js');
const EventDebugManager = require('../../../debug/EventDebugManager.js');

describe('EventManager Integration Tests', function() {
  let eventManager;
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Reset singleton
    if (EventManager._instance) {
      EventManager._instance = null;
    }
    if (EventDebugManager._instance) {
      EventDebugManager._instance = null;
    }
    
    eventManager = EventManager.getInstance();
    
    // Mock time
    global.millis = sandbox.stub().returns(0);
    
    // Mock global arrays for spatial triggers
    global.ants = [];
    global.queen = null;
  });
  
  afterEach(function() {
    sandbox.restore();
    global.ants = [];
    global.queen = null;
  });
  
  describe('Core Event Registration and Triggering', function() {
    it('should register and manually trigger an event', function() {
      const onTrigger = sandbox.stub();
      
      eventManager.registerEvent({
        id: 'test_event',
        type: 'dialogue',
        content: { message: 'Hello!' },
        priority: 5,
        onTrigger: onTrigger
      });
      
      // Event exists but not active
      const event = eventManager.getEvent('test_event');
      expect(event).to.exist;
      expect(event.id).to.equal('test_event');
      expect(event.active).to.be.false;
      
      // Trigger manually
      const triggered = eventManager.triggerEvent('test_event');
      expect(triggered).to.be.true;
      expect(onTrigger.calledOnce).to.be.true;
      
      // Now active
      expect(event.active).to.be.true;
      expect(eventManager.isEventActive('test_event')).to.be.true;
    });
    
    it('should prevent duplicate active events', function() {
      eventManager.registerEvent({
        id: 'unique',
        type: 'dialogue',
        content: {}
      });
      
      // First trigger succeeds
      expect(eventManager.triggerEvent('unique')).to.be.true;
      
      // Second trigger fails (already active)
      expect(eventManager.triggerEvent('unique')).to.be.false;
    });
    
    it('should complete events manually', function() {
      eventManager.registerEvent({
        id: 'completable',
        type: 'dialogue',
        content: {}
      });
      
      eventManager.triggerEvent('completable');
      expect(eventManager.isEventActive('completable')).to.be.true;
      
      eventManager.completeEvent('completable');
      expect(eventManager.isEventActive('completable')).to.be.false;
    });
  });
  
  describe('Priority System', function() {
    it('should pause lower priority events when higher priority triggers', function() {
      const onPauseLow = sandbox.stub();
      const onTriggerHigh = sandbox.stub();
      
      // Register low priority event (high number = low priority)
      eventManager.registerEvent({
        id: 'low_priority',
        type: 'dialogue',
        content: {},
        priority: 10,
        onPause: onPauseLow
      });
      
      // Register high priority event (low number = high priority)
      eventManager.registerEvent({
        id: 'high_priority',
        type: 'boss',
        content: {},
        priority: 1,
        onTrigger: onTriggerHigh
      });
      
      // Trigger low priority first
      eventManager.triggerEvent('low_priority');
      const lowEvent = eventManager.getEvent('low_priority');
      expect(lowEvent.active).to.be.true;
      expect(lowEvent.paused).to.be.false;
      
      // Trigger high priority
      eventManager.triggerEvent('high_priority');
      
      // Low priority should be paused
      expect(lowEvent.paused).to.be.true;
      expect(onPauseLow.called).to.be.true;
      
      // Complete high priority
      eventManager.completeEvent('high_priority');
      
      // Low priority should resume
      expect(lowEvent.paused).to.be.false;
    });
  });
  
  describe('Time-Based Triggers', function() {
    it('should trigger event after delay', function() {
      const onTrigger = sandbox.stub();
      
      eventManager.registerEvent({
        id: 'delayed',
        type: 'spawn',
        content: {},
        onTrigger: onTrigger
      });
      
      eventManager.registerTrigger({
        eventId: 'delayed',
        type: 'time',
        oneTime: true,
        condition: { delay: 5000 } // 5 seconds
      });
      
      // Initialize (millis = 0)
      global.millis.returns(0);
      eventManager.update();
      expect(onTrigger.called).to.be.false;
      
      // Before delay (millis = 4999)
      global.millis.returns(4999);
      eventManager.update();
      expect(onTrigger.called).to.be.false;
      
      // After delay (millis = 5000)
      global.millis.returns(5000);
      eventManager.update();
      expect(onTrigger.called).to.be.true;
    });
    
    it('should remove one-time triggers after firing', function() {
      eventManager.registerEvent({
        id: 'once',
        type: 'dialogue',
        content: {}
      });
      
      eventManager.registerTrigger({
        eventId: 'once',
        type: 'time',
        oneTime: true,
        condition: { delay: 0 } // Immediate
      });
      
      // Initial state
      let triggers = eventManager.getTriggersForEvent('once');
      expect(triggers.length).to.equal(1);
      
      // Trigger fires and removes itself
      global.millis.returns(0);
      eventManager.update();
      
      // Trigger should be removed
      triggers = eventManager.getTriggersForEvent('once');
      expect(triggers.length).to.equal(0);
    });
  });
  
  describe('Flag-Based Triggers', function() {
    it('should trigger when flag condition is met', function() {
      const onTrigger = sandbox.stub();
      
      eventManager.registerEvent({
        id: 'flag_event',
        type: 'dialogue',
        content: {},
        onTrigger: onTrigger
      });
      
      eventManager.registerTrigger({
        eventId: 'flag_event',
        type: 'flag',
        oneTime: true,
        condition: {
          flag: 'resources_collected',
          operator: '>=',
          value: 100
        }
      });
      
      // Set flag below threshold
      eventManager.setFlag('resources_collected', 50);
      eventManager.update();
      expect(onTrigger.called).to.be.false;
      
      // Set flag at threshold
      eventManager.setFlag('resources_collected', 100);
      eventManager.update();
      expect(onTrigger.called).to.be.true;
    });
    
    it('should support multiple flag conditions (AND logic)', function() {
      const onTrigger = sandbox.stub();
      
      eventManager.registerEvent({
        id: 'multi_flag',
        type: 'dialogue',
        content: {},
        onTrigger: onTrigger
      });
      
      eventManager.registerTrigger({
        eventId: 'multi_flag',
        type: 'flag',
        oneTime: true,
        condition: {
          flags: [
            { flag: 'quest_1_done', value: true },
            { flag: 'quest_2_done', value: true },
            { flag: 'level', operator: '>=', value: 5 }
          ]
        }
      });
      
      // Only some conditions met
      eventManager.setFlag('quest_1_done', true);
      eventManager.setFlag('quest_2_done', false);
      eventManager.setFlag('level', 6);
      eventManager.update();
      expect(onTrigger.called).to.be.false;
      
      // All conditions met
      eventManager.setFlag('quest_2_done', true);
      eventManager.update();
      expect(onTrigger.called).to.be.true;
    });
  });
  
  describe('Custom Trigger Evaluation', function() {
    it('should use custom evaluate function', function() {
      const onTrigger = sandbox.stub();
      
      eventManager.registerEvent({
        id: 'custom',
        type: 'spawn',
        content: {},
        onTrigger: onTrigger
      });
      
      eventManager.registerTrigger({
        eventId: 'custom',
        oneTime: true,
        evaluate: (manager) => {
          const score = manager.getFlag('score') || 0;
          const combo = manager.getFlag('combo') || 1;
          return score * combo >= 1000;
        }
      });
      
      // Conditions not met
      eventManager.setFlag('score', 100);
      eventManager.setFlag('combo', 5);
      eventManager.update();
      expect(onTrigger.called).to.be.false;
      
      // Conditions met
      eventManager.setFlag('combo', 11); // 100 * 11 = 1100
      eventManager.update();
      expect(onTrigger.called).to.be.true;
    });
  });
  
  describe('JSON Configuration Loading', function() {
    it('should load events from JSON configuration', function() {
      const config = {
        events: [
          {
            id: 'intro',
            type: 'dialogue',
            content: { message: 'Welcome to the colony!' },
            priority: 1
          },
          {
            id: 'first_enemy',
            type: 'spawn',
            content: { enemyType: 'beetle', count: 3 },
            priority: 5
          }
        ]
      };
      
      eventManager.loadFromJSON(JSON.stringify(config));
      
      expect(eventManager.getEvent('intro')).to.exist;
      expect(eventManager.getEvent('first_enemy')).to.exist;
      expect(eventManager.getAllEvents()).to.have.length.at.least(2);
    });
    
    it('should load triggers from JSON configuration', function() {
      const onTrigger = sandbox.stub();
      
      eventManager.registerEvent({
        id: 'tutorial_step_2',
        type: 'tutorial',
        content: {},
        onTrigger: onTrigger
      });
      
      const config = {
        triggers: [
          {
            eventId: 'tutorial_step_2',
            type: 'flag',
            oneTime: true,
            condition: {
              flag: 'tutorial_step_1_complete',
              value: true
            }
          }
        ]
      };
      
      eventManager.loadFromJSON(JSON.stringify(config));
      
      // Trigger should be registered
      const triggers = eventManager.getTriggersForEvent('tutorial_step_2');
      expect(triggers).to.have.lengthOf(1);
      
      // Test it works
      eventManager.setFlag('tutorial_step_1_complete', true);
      eventManager.update();
      expect(onTrigger.called).to.be.true;
    });
    
    it('should handle invalid JSON gracefully', function() {
      const invalidJSON = '{ invalid json }';
      
      const result = eventManager.loadFromJSON(invalidJSON);
      expect(result).to.be.false;
    });
  });
  
  describe('Flag System Integration', function() {
    it('should set and get flags', function() {
      eventManager.setFlag('test_flag', 42);
      expect(eventManager.getFlag('test_flag')).to.equal(42);
      
      eventManager.setFlag('bool_flag', true);
      expect(eventManager.getFlag('bool_flag')).to.be.true;
    });
    
    it('should track event completion with flags', function() {
      const onComplete = sandbox.stub();
      
      eventManager.registerEvent({
        id: 'tracked_event',
        type: 'dialogue',
        content: {},
        onComplete: onComplete
      });
      
      eventManager.triggerEvent('tracked_event');
      eventManager.completeEvent('tracked_event');
      
      // EventManager should set completion flag
      expect(eventManager.getFlag('event_tracked_event_completed')).to.be.true;
    });
    
    it('should enable event chaining with flags', function() {
      const onSecond = sandbox.stub();
      
      // First event sets flag on completion
      eventManager.registerEvent({
        id: 'first',
        type: 'dialogue',
        content: {},
        onComplete: () => {
          eventManager.setFlag('first_complete', true);
        }
      });
      
      // Second event triggers when first completes
      eventManager.registerEvent({
        id: 'second',
        type: 'dialogue',
        content: {},
        onTrigger: onSecond
      });
      
      eventManager.registerTrigger({
        eventId: 'second',
        type: 'flag',
        oneTime: true,
        condition: {
          flag: 'first_complete',
          value: true
        }
      });
      
      // Start first event
      eventManager.triggerEvent('first');
      eventManager.update();
      expect(onSecond.called).to.be.false;
      
      // Complete first
      eventManager.completeEvent('first');
      expect(eventManager.getFlag('first_complete')).to.be.true;
      
      // Second should trigger
      eventManager.update();
      expect(onSecond.called).to.be.true;
    });
  });
  
  describe('Event State Management', function() {
    it('should track active events', function() {
      eventManager.registerEvent({ id: 'e1', type: 'dialogue', content: {} });
      eventManager.registerEvent({ id: 'e2', type: 'spawn', content: {} });
      eventManager.registerEvent({ id: 'e3', type: 'tutorial', content: {} });
      
      expect(eventManager.getActiveEvents()).to.have.lengthOf(0);
      
      eventManager.triggerEvent('e1');
      expect(eventManager.getActiveEvents()).to.have.lengthOf(1);
      
      eventManager.triggerEvent('e2');
      expect(eventManager.getActiveEvents()).to.have.lengthOf(2);
      
      eventManager.completeEvent('e1');
      expect(eventManager.getActiveEvents()).to.have.lengthOf(1);
    });
    
    it('should clear all active events', function() {
      eventManager.registerEvent({ id: 'e1', type: 'dialogue', content: {} });
      eventManager.registerEvent({ id: 'e2', type: 'spawn', content: {} });
      
      eventManager.triggerEvent('e1');
      eventManager.triggerEvent('e2');
      
      expect(eventManager.getActiveEvents()).to.have.lengthOf(2);
      
      eventManager.clearActiveEvents();
      
      expect(eventManager.getActiveEvents()).to.have.lengthOf(0);
    });
  });
  
  describe('Error Handling', function() {
    it('should handle non-existent events gracefully', function() {
      expect(eventManager.getEvent('does_not_exist')).to.be.undefined;
      expect(eventManager.triggerEvent('does_not_exist')).to.be.false;
      expect(eventManager.isEventActive('does_not_exist')).to.be.false;
    });
    
    it('should validate event registration', function() {
      // Missing ID
      const result1 = eventManager.registerEvent({
        type: 'dialogue',
        content: {}
      });
      expect(result1).to.be.false;
      
      // Missing type
      const result2 = eventManager.registerEvent({
        id: 'no_type',
        content: {}
      });
      expect(result2).to.be.false;
    });
    
    it('should prevent duplicate event IDs', function() {
      eventManager.registerEvent({
        id: 'unique_id',
        type: 'dialogue',
        content: {}
      });
      
      // Second registration should fail
      const result = eventManager.registerEvent({
        id: 'unique_id',
        type: 'spawn',
        content: {}
      });
      
      expect(result).to.be.false;
    });
    
    it('should validate trigger registration', function() {
      // Missing eventId
      const result = eventManager.registerTrigger({
        type: 'time',
        condition: { delay: 1000 }
      });
      
      expect(result).to.be.false;
    });
  });
  
  describe('EventDebugManager Integration', function() {
    it('should connect with EventDebugManager', function() {
      const debugManager = EventDebugManager.getInstance();
      eventManager.connectDebugManager(debugManager);
      
      expect(eventManager._eventDebugManager).to.equal(debugManager);
    });
    
    it('should notify debug manager on event trigger', function() {
      const debugManager = EventDebugManager.getInstance();
      const onTriggerSpy = sandbox.spy(debugManager, 'onEventTriggered');
      
      eventManager.connectDebugManager(debugManager);
      
      eventManager.registerEvent({
        id: 'debug_test',
        type: 'dialogue',
        content: {}
      });
      
      eventManager.triggerEvent('debug_test');
      
      expect(onTriggerSpy.calledWith('debug_test')).to.be.true;
    });
  });
});
