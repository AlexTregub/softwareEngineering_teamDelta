/**
 * Unit Tests for EventManager
 * Tests the core event coordination system for random events, dialogue, tutorials, waves, etc.
 * 
 * Following TDD: These tests are written FIRST, implementation comes after review.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const EventManager = require('../../../Classes/managers/EventManager');

describe('EventManager', function() {
  let eventManager;
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    global.millis = sandbox.stub().returns(1000);
    global.frameCount = 0;
    
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.millis = global.millis;
    }

    // Create EventManager instance for testing
    eventManager = new EventManager();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Constructor and Initialization', function() {
    it('should initialize with empty event registry', function() {
      expect(eventManager).to.exist;
      expect(eventManager.events).to.be.a('map');
      expect(eventManager.events.size).to.equal(0);
    });

    it('should initialize with empty active events array', function() {
      expect(eventManager.activeEvents).to.be.an('array');
      expect(eventManager.activeEvents).to.have.lengthOf(0);
    });

    it('should initialize with empty trigger registry', function() {
      expect(eventManager.triggers).to.be.a('map');
      expect(eventManager.triggers.size).to.equal(0);
    });

    it('should initialize EventFlag system', function() {
      expect(eventManager.flags).to.exist;
      expect(eventManager.flags).to.be.an('object');
    });

    it('should start with enabled state', function() {
      expect(eventManager.enabled).to.be.true;
    });
  });

  describe('Event Registration', function() {
    it('should register a new event with unique ID', function() {
      const eventConfig = {
        id: 'test_event_01',
        type: 'dialogue',
        content: { message: 'Test' }
      };

      const registered = eventManager.registerEvent(eventConfig);
      
      expect(registered).to.be.true;
      expect(eventManager.events.has('test_event_01')).to.be.true;
    });

    it('should reject event registration with duplicate ID', function() {
      const eventConfig = {
        id: 'duplicate_event',
        type: 'dialogue',
        content: { message: 'Test' }
      };

      eventManager.registerEvent(eventConfig);
      const secondRegistration = eventManager.registerEvent(eventConfig);
      
      expect(secondRegistration).to.be.false;
      expect(eventManager.events.size).to.equal(1);
    });

    it('should reject event registration without required ID', function() {
      const eventConfig = {
        type: 'dialogue',
        content: { message: 'Test' }
      };

      const registered = eventManager.registerEvent(eventConfig);
      
      expect(registered).to.be.false;
    });

    it('should reject event registration without required type', function() {
      const eventConfig = {
        id: 'no_type_event',
        content: { message: 'Test' }
      };

      const registered = eventManager.registerEvent(eventConfig);
      
      expect(registered).to.be.false;
    });

    it('should store event configuration correctly', function() {
      const eventConfig = {
        id: 'config_test',
        type: 'tutorial',
        content: { title: 'Welcome', message: 'Hello!' },
        metadata: { priority: 1 }
      };

      eventManager.registerEvent(eventConfig);
      const stored = eventManager.getEvent('config_test');
      
      expect(stored).to.exist;
      expect(stored.id).to.equal('config_test');
      expect(stored.type).to.equal('tutorial');
      expect(stored.content.title).to.equal('Welcome');
      expect(stored.metadata.priority).to.equal(1);
    });
  });

  describe('Event Retrieval', function() {
    beforeEach(function() {
      eventManager.registerEvent({
        id: 'retrieve_test',
        type: 'dialogue',
        content: { message: 'Test' }
      });
    });

    it('should retrieve registered event by ID', function() {
      const event = eventManager.getEvent('retrieve_test');
      
      expect(event).to.exist;
      expect(event.id).to.equal('retrieve_test');
    });

    it('should return null for non-existent event ID', function() {
      const event = eventManager.getEvent('does_not_exist');
      
      expect(event).to.be.null;
    });

    it('should get all registered events', function() {
      eventManager.registerEvent({
        id: 'second_event',
        type: 'spawn',
        content: {}
      });

      const allEvents = eventManager.getAllEvents();
      
      expect(allEvents).to.be.an('array');
      expect(allEvents).to.have.lengthOf(2);
    });

    it('should get events by type', function() {
      eventManager.registerEvent({
        id: 'dialogue_1',
        type: 'dialogue',
        content: {}
      });
      eventManager.registerEvent({
        id: 'spawn_1',
        type: 'spawn',
        content: {}
      });

      const dialogueEvents = eventManager.getEventsByType('dialogue');
      
      expect(dialogueEvents).to.be.an('array');
      expect(dialogueEvents).to.have.lengthOf(2); // retrieve_test + dialogue_1
      expect(dialogueEvents.every(e => e.type === 'dialogue')).to.be.true;
    });
  });

  describe('Event Triggering', function() {
    let mockEvent;

    beforeEach(function() {
      mockEvent = {
        id: 'trigger_test',
        type: 'dialogue',
        content: { message: 'Triggered!' },
        onTrigger: sandbox.stub()
      };
      eventManager.registerEvent(mockEvent);
    });

    it('should trigger event by ID', function() {
      const triggered = eventManager.triggerEvent('trigger_test');
      
      expect(triggered).to.be.true;
      expect(eventManager.activeEvents).to.have.lengthOf(1);
      expect(eventManager.activeEvents[0].id).to.equal('trigger_test');
    });

    it('should not trigger non-existent event', function() {
      const triggered = eventManager.triggerEvent('does_not_exist');
      
      expect(triggered).to.be.false;
      expect(eventManager.activeEvents).to.have.lengthOf(0);
    });

    it('should call event onTrigger callback if defined', function() {
      eventManager.triggerEvent('trigger_test');
      
      expect(mockEvent.onTrigger.calledOnce).to.be.true;
    });

    it('should not trigger same event twice if already active', function() {
      eventManager.triggerEvent('trigger_test');
      const secondTrigger = eventManager.triggerEvent('trigger_test');
      
      expect(secondTrigger).to.be.false;
      expect(eventManager.activeEvents).to.have.lengthOf(1);
    });

    it('should trigger event with custom data', function() {
      const customData = { spawnCount: 5, difficulty: 'hard' };
      eventManager.triggerEvent('trigger_test', customData);
      
      const activeEvent = eventManager.activeEvents[0];
      expect(activeEvent.triggerData).to.deep.equal(customData);
    });

    it('should respect enabled/disabled state', function() {
      eventManager.setEnabled(false);
      const triggered = eventManager.triggerEvent('trigger_test');
      
      expect(triggered).to.be.false;
      expect(eventManager.activeEvents).to.have.lengthOf(0);
    });
  });

  describe('Active Event Management', function() {
    beforeEach(function() {
      eventManager.registerEvent({
        id: 'active_test_1',
        type: 'dialogue',
        content: {}
      });
      eventManager.registerEvent({
        id: 'active_test_2',
        type: 'spawn',
        content: {}
      });
    });

    it('should get all active events', function() {
      eventManager.triggerEvent('active_test_1');
      eventManager.triggerEvent('active_test_2');
      
      const active = eventManager.getActiveEvents();
      
      expect(active).to.be.an('array');
      expect(active).to.have.lengthOf(2);
    });

    it('should check if specific event is active', function() {
      eventManager.triggerEvent('active_test_1');
      
      expect(eventManager.isEventActive('active_test_1')).to.be.true;
      expect(eventManager.isEventActive('active_test_2')).to.be.false;
    });

    it('should complete/dismiss an active event', function() {
      eventManager.triggerEvent('active_test_1');
      const completed = eventManager.completeEvent('active_test_1');
      
      expect(completed).to.be.true;
      expect(eventManager.activeEvents).to.have.lengthOf(0);
      expect(eventManager.isEventActive('active_test_1')).to.be.false;
    });

    it('should not complete non-active event', function() {
      const completed = eventManager.completeEvent('active_test_1');
      
      expect(completed).to.be.false;
    });

    it('should execute onComplete callback when event completes', function() {
      const onComplete = sandbox.stub();
      eventManager.registerEvent({
        id: 'complete_callback',
        type: 'dialogue',
        content: {},
        onComplete: onComplete
      });

      eventManager.triggerEvent('complete_callback');
      eventManager.completeEvent('complete_callback');
      
      expect(onComplete.calledOnce).to.be.true;
    });
  });

  describe('Trigger System', function() {
    it('should register a trigger for an event', function() {
      const triggerConfig = {
        eventId: 'test_event',
        type: 'time',
        condition: { delay: 5000 }
      };

      const registered = eventManager.registerTrigger(triggerConfig);
      
      expect(registered).to.be.true;
      expect(eventManager.triggers.size).to.equal(1);
    });

    it('should reject trigger without event ID', function() {
      const triggerConfig = {
        type: 'time',
        condition: { delay: 5000 }
      };

      const registered = eventManager.registerTrigger(triggerConfig);
      
      expect(registered).to.be.false;
    });

    it('should support multiple triggers for same event', function() {
      const trigger1 = {
        eventId: 'multi_trigger',
        type: 'time',
        condition: { delay: 1000 }
      };
      const trigger2 = {
        eventId: 'multi_trigger',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 50 }
      };

      eventManager.registerTrigger(trigger1);
      eventManager.registerTrigger(trigger2);
      
      const triggers = eventManager.getTriggersForEvent('multi_trigger');
      expect(triggers).to.have.lengthOf(2);
    });

    it('should evaluate time-based triggers on update', function() {
      eventManager.registerEvent({
        id: 'time_event',
        type: 'dialogue',
        content: {}
      });

      eventManager.registerTrigger({
        eventId: 'time_event',
        type: 'time',
        condition: { delay: 500 }
      });

      global.millis.returns(500); // Initial time
      eventManager.update();
      expect(eventManager.isEventActive('time_event')).to.be.false;

      global.millis.returns(1001); // After delay
      eventManager.update();
      expect(eventManager.isEventActive('time_event')).to.be.true;
    });

    it('should remove trigger after one-time activation', function() {
      eventManager.registerEvent({
        id: 'one_time',
        type: 'dialogue',
        content: {}
      });

      eventManager.registerTrigger({
        eventId: 'one_time',
        type: 'time',
        condition: { delay: 0 },
        oneTime: true
      });

      eventManager.update();
      const triggersAfter = eventManager.getTriggersForEvent('one_time');
      
      expect(triggersAfter).to.have.lengthOf(0);
    });

    it('should keep repeatable triggers active', function() {
      eventManager.registerEvent({
        id: 'repeatable',
        type: 'spawn',
        content: {}
      });

      eventManager.registerTrigger({
        eventId: 'repeatable',
        type: 'time',
        condition: { interval: 1000 },
        oneTime: false
      });

      global.millis.returns(0);
      eventManager.update();
      
      global.millis.returns(1000);
      eventManager.update();
      
      const triggersAfter = eventManager.getTriggersForEvent('repeatable');
      expect(triggersAfter).to.have.lengthOf(1);
    });
  });

  describe('Event Flags System', function() {
    it('should set an event flag', function() {
      eventManager.setFlag('tutorial_completed', true);
      
      expect(eventManager.getFlag('tutorial_completed')).to.be.true;
    });

    it('should get default value for unset flag', function() {
      const value = eventManager.getFlag('non_existent', false);
      
      expect(value).to.be.false;
    });

    it('should check if flag exists', function() {
      eventManager.setFlag('test_flag', 'value');
      
      expect(eventManager.hasFlag('test_flag')).to.be.true;
      expect(eventManager.hasFlag('missing_flag')).to.be.false;
    });

    it('should clear a specific flag', function() {
      eventManager.setFlag('clear_me', true);
      eventManager.clearFlag('clear_me');
      
      expect(eventManager.hasFlag('clear_me')).to.be.false;
    });

    it('should support numeric flag values', function() {
      eventManager.setFlag('kill_count', 10);
      
      expect(eventManager.getFlag('kill_count')).to.equal(10);
    });

    it('should support string flag values', function() {
      eventManager.setFlag('current_quest', 'defend_colony');
      
      expect(eventManager.getFlag('current_quest')).to.equal('defend_colony');
    });

    it('should support object flag values', function() {
      const flagData = { stage: 2, progress: 0.5 };
      eventManager.setFlag('quest_progress', flagData);
      
      expect(eventManager.getFlag('quest_progress')).to.deep.equal(flagData);
    });

    it('should increment numeric flags', function() {
      eventManager.setFlag('score', 0);
      eventManager.incrementFlag('score', 5);
      eventManager.incrementFlag('score', 3);
      
      expect(eventManager.getFlag('score')).to.equal(8);
    });

    it('should get all flags', function() {
      eventManager.setFlag('flag1', true);
      eventManager.setFlag('flag2', 100);
      
      const allFlags = eventManager.getAllFlags();
      
      expect(allFlags).to.be.an('object');
      expect(allFlags.flag1).to.be.true;
      expect(allFlags.flag2).to.equal(100);
    });
  });

  describe('Conditional Triggers', function() {
    beforeEach(function() {
      eventManager.registerEvent({
        id: 'conditional_event',
        type: 'dialogue',
        content: {}
      });
    });

    it('should trigger event when flag condition is met', function() {
      eventManager.setFlag('boss_defeated', false);
      
      eventManager.registerTrigger({
        eventId: 'conditional_event',
        type: 'flag',
        condition: { flag: 'boss_defeated', value: true }
      });

      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.false;

      eventManager.setFlag('boss_defeated', true);
      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.true;
    });

    it('should support multiple flag conditions (AND logic)', function() {
      eventManager.setFlag('has_key', true);
      eventManager.setFlag('door_unlocked', false);

      eventManager.registerTrigger({
        eventId: 'conditional_event',
        type: 'flag',
        condition: { 
          flags: [
            { flag: 'has_key', value: true },
            { flag: 'door_unlocked', value: true }
          ]
        }
      });

      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.false;

      eventManager.setFlag('door_unlocked', true);
      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.true;
    });

    it('should support comparison operators for numeric flags', function() {
      eventManager.setFlag('enemy_count', 5);

      eventManager.registerTrigger({
        eventId: 'conditional_event',
        type: 'flag',
        condition: { flag: 'enemy_count', operator: '>=', value: 10 }
      });

      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.false;

      eventManager.setFlag('enemy_count', 15);
      eventManager.update();
      expect(eventManager.isEventActive('conditional_event')).to.be.true;
    });
  });

  describe('Update Loop', function() {
    it('should update all active triggers', function() {
      const updateSpy = sandbox.spy();
      
      eventManager.registerEvent({
        id: 'update_test',
        type: 'dialogue',
        content: {},
        onUpdate: updateSpy
      });

      eventManager.triggerEvent('update_test');
      eventManager.update();
      
      expect(updateSpy.calledOnce).to.be.true;
    });

    it('should update all active events', function() {
      eventManager.registerEvent({
        id: 'active_1',
        type: 'dialogue',
        content: {}
      });
      eventManager.registerEvent({
        id: 'active_2',
        type: 'spawn',
        content: {}
      });

      eventManager.triggerEvent('active_1');
      eventManager.triggerEvent('active_2');

      const beforeUpdate = eventManager.activeEvents.length;
      eventManager.update();
      const afterUpdate = eventManager.activeEvents.length;
      
      expect(beforeUpdate).to.equal(2);
      expect(afterUpdate).to.equal(2); // Still active unless completed
    });

    it('should not update when disabled', function() {
      const updateSpy = sandbox.spy();
      
      eventManager.registerEvent({
        id: 'disabled_test',
        type: 'dialogue',
        content: {},
        onUpdate: updateSpy
      });

      eventManager.triggerEvent('disabled_test');
      eventManager.setEnabled(false);
      eventManager.update();
      
      expect(updateSpy.called).to.be.false;
    });
  });

  describe('JSON Event Loading', function() {
    it('should load events from JSON configuration', function() {
      const jsonConfig = {
        events: [
          {
            id: 'json_event_1',
            type: 'dialogue',
            content: { message: 'From JSON' }
          },
          {
            id: 'json_event_2',
            type: 'tutorial',
            content: { title: 'Tutorial' }
          }
        ]
      };

      const loaded = eventManager.loadFromJSON(jsonConfig);
      
      expect(loaded).to.be.true;
      expect(eventManager.events.size).to.equal(2);
      expect(eventManager.getEvent('json_event_1')).to.exist;
      expect(eventManager.getEvent('json_event_2')).to.exist;
    });

    it('should load triggers from JSON configuration', function() {
      const jsonConfig = {
        events: [
          {
            id: 'json_with_trigger',
            type: 'dialogue',
            content: {}
          }
        ],
        triggers: [
          {
            eventId: 'json_with_trigger',
            type: 'time',
            condition: { delay: 1000 }
          }
        ]
      };

      eventManager.loadFromJSON(jsonConfig);
      
      const triggers = eventManager.getTriggersForEvent('json_with_trigger');
      expect(triggers).to.have.lengthOf(1);
      expect(triggers[0].type).to.equal('time');
    });

    it('should validate JSON before loading', function() {
      const invalidJSON = {
        events: [
          {
            // Missing id
            type: 'dialogue',
            content: {}
          }
        ]
      };

      const loaded = eventManager.loadFromJSON(invalidJSON);
      
      expect(loaded).to.be.false;
      expect(eventManager.events.size).to.equal(0);
    });

    it('should handle malformed JSON gracefully', function() {
      const malformed = null;
      
      const loaded = eventManager.loadFromJSON(malformed);
      
      expect(loaded).to.be.false;
    });
  });

  describe('Event Priority System', function() {
    beforeEach(function() {
      eventManager.registerEvent({
        id: 'low_priority',
        type: 'dialogue',
        content: {},
        priority: 10
      });
      eventManager.registerEvent({
        id: 'high_priority',
        type: 'tutorial',
        content: {},
        priority: 1
      });
      eventManager.registerEvent({
        id: 'medium_priority',
        type: 'spawn',
        content: {},
        priority: 5
      });
    });

    it('should return active events sorted by priority', function() {
      eventManager.triggerEvent('low_priority');
      eventManager.triggerEvent('high_priority');
      eventManager.triggerEvent('medium_priority');

      const sorted = eventManager.getActiveEventsSorted();
      
      expect(sorted[0].id).to.equal('high_priority');
      expect(sorted[1].id).to.equal('medium_priority');
      expect(sorted[2].id).to.equal('low_priority');
    });

    it('should handle events without priority (default to lowest)', function() {
      eventManager.registerEvent({
        id: 'no_priority',
        type: 'dialogue',
        content: {}
      });

      eventManager.triggerEvent('no_priority');
      eventManager.triggerEvent('high_priority');

      const sorted = eventManager.getActiveEventsSorted();
      
      expect(sorted[0].id).to.equal('high_priority');
      expect(sorted[sorted.length - 1].id).to.equal('no_priority');
    });

    it('should pause lower-priority events when higher-priority event triggers', function() {
      // Trigger low priority first
      eventManager.triggerEvent('low_priority');
      expect(eventManager.isEventActive('low_priority')).to.be.true;
      
      // Trigger high priority - should pause low priority
      eventManager.triggerEvent('high_priority');
      
      const lowPriorityEvent = eventManager.getActiveEvents().find(e => e.id === 'low_priority');
      expect(lowPriorityEvent.paused).to.be.true;
      expect(eventManager.isEventActive('high_priority')).to.be.true;
    });

    it('should resume paused events when higher-priority event completes', function() {
      eventManager.triggerEvent('low_priority');
      eventManager.triggerEvent('high_priority');
      
      // High priority should pause low priority
      const lowEvent = eventManager.getActiveEvents().find(e => e.id === 'low_priority');
      expect(lowEvent.paused).to.be.true;
      
      // Complete high priority event
      eventManager.completeEvent('high_priority');
      
      // Low priority should resume
      expect(lowEvent.paused).to.be.false;
      expect(eventManager.isEventActive('low_priority')).to.be.true;
      expect(eventManager.isEventActive('high_priority')).to.be.false;
    });

    it('should only allow highest-priority event to update', function() {
      const lowUpdate = sandbox.stub();
      const highUpdate = sandbox.stub();
      
      eventManager.registerEvent({
        id: 'low_update',
        type: 'dialogue',
        content: {},
        priority: 10,
        onUpdate: lowUpdate
      });
      
      eventManager.registerEvent({
        id: 'high_update',
        type: 'dialogue',
        content: {},
        priority: 1,
        onUpdate: highUpdate
      });

      eventManager.triggerEvent('low_update');
      eventManager.triggerEvent('high_update');
      
      eventManager.update();
      
      // Only high priority should update
      expect(highUpdate.calledOnce).to.be.true;
      expect(lowUpdate.called).to.be.false; // Paused, so no update
    });

    it('should handle multiple events completing in priority order', function() {
      eventManager.registerEvent({
        id: 'first',
        type: 'dialogue',
        content: {},
        priority: 1
      });
      eventManager.registerEvent({
        id: 'second',
        type: 'dialogue',
        content: {},
        priority: 2
      });
      eventManager.registerEvent({
        id: 'third',
        type: 'dialogue',
        content: {},
        priority: 3
      });

      // Trigger all (out of order)
      eventManager.triggerEvent('third');
      eventManager.triggerEvent('first');
      eventManager.triggerEvent('second');

      // Complete first (highest priority)
      eventManager.completeEvent('first');
      
      // Second should now be active (and not paused)
      const secondEvent = eventManager.getActiveEvents().find(e => e.id === 'second');
      expect(secondEvent.paused).to.be.false;
      
      // Third should still be paused
      const thirdEvent = eventManager.getActiveEvents().find(e => e.id === 'third');
      expect(thirdEvent.paused).to.be.true;
    });
  });

  describe('Enable/Disable Control', function() {
    it('should start in enabled state', function() {
      expect(eventManager.isEnabled()).to.be.true;
    });

    it('should disable event manager', function() {
      eventManager.setEnabled(false);
      
      expect(eventManager.isEnabled()).to.be.false;
    });

    it('should enable event manager', function() {
      eventManager.setEnabled(false);
      eventManager.setEnabled(true);
      
      expect(eventManager.isEnabled()).to.be.true;
    });

    it('should pause all active events when disabled', function() {
      eventManager.registerEvent({
        id: 'pause_test',
        type: 'dialogue',
        content: {},
        onPause: sandbox.stub()
      });

      eventManager.triggerEvent('pause_test');
      const event = eventManager.activeEvents[0];
      
      eventManager.setEnabled(false);
      
      expect(event.onPause.calledOnce).to.be.true;
    });
  });

  describe('Clear and Reset', function() {
    beforeEach(function() {
      eventManager.registerEvent({
        id: 'clear_test',
        type: 'dialogue',
        content: {}
      });
      eventManager.triggerEvent('clear_test');
      eventManager.setFlag('test_flag', true);
    });

    it('should clear all active events', function() {
      eventManager.clearActiveEvents();
      
      expect(eventManager.activeEvents).to.have.lengthOf(0);
    });

    it('should reset event manager to initial state', function() {
      eventManager.reset();
      
      expect(eventManager.activeEvents).to.have.lengthOf(0);
      expect(eventManager.events.size).to.equal(0);
      expect(eventManager.triggers.size).to.equal(0);
    });

    it('should preserve flags during active event clear', function() {
      eventManager.clearActiveEvents();
      
      expect(eventManager.getFlag('test_flag')).to.be.true;
    });

    it('should clear flags during full reset if specified', function() {
      eventManager.reset(true); // clearFlags = true
      
      expect(eventManager.hasFlag('test_flag')).to.be.false;
    });
  });
});
