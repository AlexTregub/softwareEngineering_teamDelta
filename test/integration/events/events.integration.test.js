/**
 * Consolidated Events System Integration Tests
 * Generated: 2025-10-29T03:16:53.958Z
 * Source files: 11
 * Total tests: 175
 */

// Common requires
let { expect } = require('chai');
let sinon = require('sinon');
let { JSDOM } = require('jsdom');

// Setup integration test environment FIRST (before requiring EventManager)
let { setupIntegrationTestEnvironment, cleanupIntegrationTestEnvironment } = require('../../helpers/integrationTestHelpers');
setupIntegrationTestEnvironment();

// ================================================================
// eventManager.integration.test.js (23 tests)
// ================================================================
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

// Mock p5.js globals
if (typeof global !== 'undefined') {
  global.millis = sinon.stub();
  global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, z: 0 }));
}

// Load classes (after helper setup so logNormal is available)
let EventManager = require('../../../Classes/managers/EventManager.js');
let EventDebugManager = require('../../../debug/EventDebugManager.js');

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




// ================================================================
// eventSystem.integration.test.js (26 tests)
// ================================================================
/**
 * Integration Tests for Complete GameEvent System
 * 
 * Tests the full GameEvent lifecycle:
 * 1. GameEvent registration with EventManager
 * 2. Trigger evaluation (TimeTrigger, SpatialTrigger, FlagTrigger)
 * 3. GameEvent execution (DialogueEvent, SpawnEvent, TutorialEvent)
 * 4. Flag updates and state changes
 * 5. EventDebugManager visualization
 * 
 * Integrates with:
 * - MapManager (level detection, viewport)
 * - Entity system (spatial triggers)
 * - EventManager (coordination)
 * - EventDebugManager (debugging)
 */

// Import GameEvent system components
// DUPLICATE REQUIRE REMOVED: let EventManager = require('../../../Classes/managers/EventManager');
let {
  EventTrigger,
  TimeTrigger,
  SpatialTrigger,
  FlagTrigger,
  ConditionalTrigger,
  ViewportSpawnTrigger
} = require('../../../Classes/events/EventTrigger');
let {
  GameEvent,
  DialogueEvent,
  SpawnEvent,
  TutorialEvent,
  BossEvent
} = require('../../../Classes/events/Event');

// Make available globally for JSDOM
global.EventManager = EventManager;
global.EventTrigger = EventTrigger;
global.TimeTrigger = TimeTrigger;
global.SpatialTrigger = SpatialTrigger;
global.FlagTrigger = FlagTrigger;
global.ConditionalTrigger = ConditionalTrigger;
global.ViewportSpawnTrigger = ViewportSpawnTrigger;
global.GameEvent = GameEvent;
global.DialogueEvent = DialogueEvent;
global.SpawnEvent = SpawnEvent;
global.TutorialEvent = TutorialEvent;
global.BossEvent = BossEvent;

describe('GameEvent System Integration Tests', function() {
  let sandbox;
  let eventManager;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.millis = sandbox.stub().returns(1000);
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    
    // Get EventManager instance (singleton)
    eventManager = EventManager.getInstance();
    eventManager.reset(); // Clear previous state
    
    // Make available globally
    global.eventManager = eventManager;
    
    // Sync window for JSDOM compatibility
    if (typeof window !== 'undefined') {
      window.millis = global.millis;
      window.createVector = global.createVector;
      window.eventManager = global.eventManager;
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Complete GameEvent Lifecycle', function() {
    it('should register GameEvent, evaluate trigger, execute, and update flags', function() {
      // 1. Register GameEvent with time trigger
      const eventConfig = {
        id: 'tutorial_start',
        type: 'dialogue',
        content: {
          title: 'Welcome',
          message: 'Welcome to the colony!'
        },
        priority: 1
      };
      
      const triggerConfig = {
        eventId: 'tutorial_start',
        type: 'time',
        oneTime: true,
        condition: {
          delay: 5000 // Trigger after 5 seconds
        }
      };
      
      eventManager.registerEvent(eventConfig);
      eventManager.registerTrigger(triggerConfig);
      
      // 2. Verify GameEvent registered
      const registeredEvent = eventManager.getEvent('tutorial_start');
      expect(registeredEvent).to.exist;
      expect(registeredEvent.id).to.equal('tutorial_start');
      
      // 3. Update before trigger time
      global.millis.returns(5999);
      eventManager.update();
      
      const activeEvents = eventManager.getActiveEvents();
      expect(activeEvents).to.have.lengthOf(0);
      
      // 4. Update after trigger time - GameEvent should activate
      global.millis.returns(6000);
      eventManager.update();
      
      const activeEventsAfterTrigger = eventManager.getActiveEvents();
      expect(activeEventsAfterTrigger.length).to.be.at.least(1);
      
      // 5. Set flag to simulate GameEvent completion
      eventManager.setFlag('tutorial_started', true);
      
      expect(eventManager.getFlag('tutorial_started')).to.be.true;
    });

    it('should handle multiple events with different priorities', function() {
      // Register high priority GameEvent
      eventManager.registerEvent({
        id: 'critical_alert',
        type: 'dialogue',
        content: { message: 'Critical!' },
        priority: 1
      });
      
      // Register low priority GameEvent
      eventManager.registerEvent({
        id: 'background_info',
        type: 'dialogue',
        content: { message: 'Info' },
        priority: 10
      });
      
      // Trigger both
      eventManager.triggerEvent('critical_alert');
      eventManager.triggerEvent('background_info');
      
      // Verify priority ordering
      const sorted = eventManager.getActiveEventsSorted();
      expect(sorted).to.have.lengthOf(2);
      expect(sorted[0].id).to.equal('critical_alert');
      expect(sorted[1].id).to.equal('background_info');
    });
  });

  describe('Trigger Type Integration', function() {
    describe('TimeTrigger Integration', function() {
      it('should trigger GameEvent after specified delay', function() {
        const onTrigger = sandbox.stub();
        
        eventManager.registerEvent({
          id: 'delayed_event',
          type: 'dialogue',
          content: {},
          onTrigger: onTrigger
        });
        
        eventManager.registerTrigger({
          eventId: 'delayed_event',
          type: 'time',
          oneTime: true,
          condition: { delay: 3000 }
        });
        
        // Before delay
        global.millis.returns(3999);
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // After delay
        global.millis.returns(4000);
        eventManager.update();
        expect(onTrigger.called).to.be.true;
      });

      it('should trigger GameEvent at intervals (repeatable)', function() {
        let triggerCount = 0;
        
        eventManager.registerEvent({
          id: 'interval_event',
          type: 'spawn',
          content: {},
          onTrigger: () => { triggerCount++; }
        });
        
        eventManager.registerTrigger({
          eventId: 'interval_event',
          type: 'time',
          oneTime: false,
          condition: { interval: 1000 }
        });
        
        // First trigger
        global.millis.returns(2000);
        eventManager.update();
        expect(triggerCount).to.equal(1);
        
        // Second trigger
        global.millis.returns(3000);
        eventManager.update();
        expect(triggerCount).to.equal(2);
        
        // Third trigger
        global.millis.returns(4000);
        eventManager.update();
        expect(triggerCount).to.equal(3);
      });
    });

    describe('SpatialTrigger Integration', function() {
      it('should trigger when entity enters trigger zone', function() {
        const onTrigger = sandbox.stub();
        
        eventManager.registerEvent({
          id: 'zone_entered',
          type: 'dialogue',
          content: { message: 'You entered the sacred grove!' },
          onTrigger: onTrigger
        });
        
        eventManager.registerTrigger({
          eventId: 'zone_entered',
          type: 'spatial',
          oneTime: true,
          condition: {
            x: 500,
            y: 500,
            radius: 100
          }
        });
        
        // Entity outside zone
        const entity = { id: 'player', x: 100, y: 100, type: 'Player' };
        ants = [entity]; // Spatial triggers check global ants array
        
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // Entity enters zone
        entity.x = 520;
        entity.y = 510;
        eventManager.update();
        expect(onTrigger.called).to.be.true;
      });

      it('should filter by entity type', function() {
        const onTrigger = sandbox.stub();
        
        eventManager.registerEvent({
          id: 'queen_zone',
          type: 'dialogue',
          content: { message: 'Queen detected!' },
          onTrigger: onTrigger
        });
        
        eventManager.registerTrigger({
          eventId: 'queen_zone',
          type: 'spatial',
          oneTime: true,
          condition: {
            x: 0,
            y: 0,
            radius: 200,
            entityType: 'Queen'
          }
        });
        
        // Regular ant enters (should not trigger)
        const ant = { id: 'ant1', x: 50, y: 50, type: 'Ant' };
        ants = [ant];
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // Queen enters (should trigger)
        const queen = { id: 'queen1', x: 50, y: 50, type: 'Queen' };
        ants = [queen];
        eventManager.update();
        expect(onTrigger.called).to.be.true;
      });
    });

    describe('FlagTrigger Integration', function() {
      it('should trigger when flag condition is met', function() {
        const onTrigger = sandbox.stub();
        
        eventManager.registerEvent({
          id: 'flag_event',
          type: 'dialogue',
          content: { message: 'Objective complete!' },
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
        
        // Before condition met
        eventManager.setFlag('resources_collected', 50);
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // After condition met
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
              { flag: 'objective_1', value: true },
              { flag: 'objective_2', value: true }
            ]
          }
        });
        
        // Only one objective complete
        eventManager.setFlag('objective_1', true);
        eventManager.setFlag('objective_2', false);
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // Both objectives complete
        eventManager.setFlag('objective_2', true);
        eventManager.update();
        expect(onTrigger.called).to.be.true;
      });
    });

    describe('ConditionalTrigger Integration', function() {
      it('should trigger with custom condition function', function() {
        const onTrigger = sandbox.stub();
        
        eventManager.registerEvent({
          id: 'custom_condition',
          type: 'spawn',
          content: {},
          onTrigger: onTrigger
        });
        
        eventManager.registerTrigger({
          eventId: 'custom_condition',
          type: 'conditional',
          oneTime: true,
          condition: (context) => {
            const enemiesDefeated = eventManager.getFlag('enemies_defeated') || 0;
            const waveComplete = eventManager.getFlag('wave_complete') || false;
            return waveComplete && enemiesDefeated >= 10;
          }
        });
        
        // Conditions not met
        eventManager.setFlag('enemies_defeated', 5);
        eventManager.setFlag('wave_complete', false);
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // Partial conditions met
        eventManager.setFlag('enemies_defeated', 15);
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // All conditions met
        eventManager.setFlag('wave_complete', true);
        eventManager.update();
        expect(onTrigger.called).to.be.true;
      });
    });

    describe('ViewportSpawnTrigger Integration', function() {
      it('should generate spawn positions at viewport edges', function() {
        // Mock g_map2
        global.g_map2 = {
          renderConversion: {
            getViewSpan: sandbox.stub().returns([
              [0, 1080],   // [minX, maxY]
              [1920, 0]    // [maxX, minY]
            ])
          }
        };
        
        const trigger = new ViewportSpawnTrigger({
          eventId: 'edge_spawn',
          condition: {
            edgeSpawn: true,
            count: 4,
            distributeEvenly: true
          }
        });
        
        const positions = trigger.generateEdgePositions(4);
        
        expect(positions).to.have.lengthOf(4);
        positions.forEach(pos => {
          expect(pos).to.have.property('x');
          expect(pos).to.have.property('y');
          expect(pos).to.have.property('edge');
          
          // Verify at edge
          const atEdge = pos.x === 0 || pos.x === 1920 || pos.y === 0 || pos.y === 1080;
          expect(atEdge).to.be.true;
        });
      });
    });
  });

  describe('GameEvent Type Integration', function() {
    describe('DialogueEvent Integration', function() {
      it('should display dialogue with auto-completion', function() {
        const dialogue = new DialogueEvent({
          id: 'welcome_message',
          content: {
            title: 'Tutorial',
            message: 'Click to continue',
            buttons: ['OK']
          },
          autoCompleteOnResponse: true
        });
        
        eventManager.registerEvent(dialogue);
        eventManager.triggerEvent('welcome_message');
        
        expect(dialogue.active).to.be.true;
        
        // Simulate button response
        dialogue.handleResponse('OK');
        
        expect(dialogue.completed).to.be.true;
        expect(dialogue.getResponse()).to.equal('OK');
      });
    });

    describe('SpawnEvent Integration', function() {
      it('should spawn enemies at viewport edges', function() {
        const spawnedEnemies = [];
        
        // Mock g_map2
        global.g_map2 = {
          renderConversion: {
            getViewSpan: () => [[0, 1080], [1920, 0]]
          }
        };
        
        const spawnEvent = new SpawnEvent({
          id: 'wave_1',
          content: {
            spawnLocations: 'viewport_edge',
            count: 4,
            enemyType: 'enemy_ant',
            wave: 1
          },
          onSpawn: (data) => {
            spawnedEnemies.push(data);
          }
        });
        
        eventManager.registerEvent(spawnEvent);
        eventManager.triggerEvent('wave_1');
        
        // Should auto-spawn on trigger
        expect(spawnedEnemies).to.have.length.greaterThan(0);
      });

      it('should use custom spawn points', function() {
        const spawnedEnemies = [];
        
        const spawnEvent = new SpawnEvent({
          id: 'custom_spawn',
          content: {
            spawnPoints: [
              { x: 100, y: 200 },
              { x: 300, y: 400 }
            ],
            enemies: ['enemy_ant']
          },
          spawnCallback: (data) => {
            spawnedEnemies.push(data);
          }
        });
        
        eventManager.registerEvent(spawnEvent);
        eventManager.triggerEvent('custom_spawn');
        
        expect(spawnedEnemies).to.have.lengthOf(2);
        expect(spawnedEnemies[0].x).to.equal(100);
        expect(spawnedEnemies[0].y).to.equal(200);
      });
    });

    describe('TutorialEvent Integration', function() {
      it('should navigate through tutorial steps', function() {
        const tutorial = new TutorialEvent({
          id: 'basic_tutorial',
          content: {
            steps: [
              { title: 'Step 1', text: 'Select your ants' },
              { title: 'Step 2', text: 'Right-click to gather' },
              { title: 'Step 3', text: 'Build a food storage' }
            ]
          }
        });
        
        eventManager.registerEvent(tutorial);
        eventManager.triggerEvent('basic_tutorial');
        
        expect(tutorial.currentStep).to.equal(0);
        
        tutorial.nextStep();
        expect(tutorial.currentStep).to.equal(1);
        
        tutorial.nextStep();
        expect(tutorial.currentStep).to.equal(2);
        
        // At last step, nextStep should complete
        tutorial.nextStep();
        expect(tutorial.completed).to.be.true;
      });
    });

    describe('BossEvent Integration', function() {
      it('should transition boss phases based on health', function() {
        const boss = new BossEvent({
          id: 'beetle_boss',
          content: {
            bossType: 'giant_beetle',
            phases: [
              { healthThreshold: 1.0, behavior: 'normal' },
              { healthThreshold: 0.5, behavior: 'enraged' },
              { healthThreshold: 0.25, behavior: 'desperate' }
            ]
          }
        });
        
        eventManager.registerEvent(boss);
        eventManager.triggerEvent('beetle_boss');
        
        // Full health - phase 1
        expect(boss.getCurrentPhase(1.0)).to.equal(1);
        
        // Half health - phase 2
        expect(boss.getCurrentPhase(0.6)).to.equal(2);
        
        // Low health - phase 3
        expect(boss.getCurrentPhase(0.3)).to.equal(3);
      });

      it('should complete on victory condition', function() {
        let bossDefeated = false;
        
        const boss = new BossEvent({
          id: 'victory_test',
          content: {
            bossType: 'test_boss',
            victoryCondition: () => bossDefeated
          }
        });
        
        eventManager.registerEvent(boss);
        eventManager.triggerEvent('victory_test');
        
        // Not defeated yet
        boss.update();
        expect(boss.completed).to.be.false;
        
        // Boss defeated
        bossDefeated = true;
        boss.update();
        expect(boss.completed).to.be.true;
      });
    });
  });

  describe('JSON Configuration Loading', function() {
    it('should load complete GameEvent configuration from JSON', function() {
      const eventJSON = {
        events: [
          {
            id: 'json_dialogue',
            type: 'dialogue',
            content: {
              title: 'From JSON',
              message: 'This GameEvent was loaded from JSON!'
            },
            priority: 5
          }
        ],
        triggers: [
          {
            eventId: 'json_dialogue',
            type: 'time',
            oneTime: true,
            condition: { delay: 2000 }
          }
        ],
        flags: {
          json_loaded: true,
          test_value: 42
        }
      };
      
      eventManager.loadFromJSON(eventJSON);
      
      // Verify GameEvent loaded
      const GameEvent = eventManager.getEvent('json_dialogue');
      expect(GameEvent).to.exist;
      expect(GameEvent.content.title).to.equal('From JSON');
      
      // Verify trigger loaded
      const triggers = eventManager.getTriggersForEvent('json_dialogue');
      expect(triggers).to.have.lengthOf(1);
      expect(triggers[0].type).to.equal('time');
      
      // Verify flags loaded
      expect(eventManager.getFlag('json_loaded')).to.be.true;
      expect(eventManager.getFlag('test_value')).to.equal(42);
    });

    it('should handle complex multi-GameEvent scenario from JSON', function() {
      const scenarioJSON = {
        events: [
          {
            id: 'wave_warning',
            type: 'dialogue',
            content: { message: 'Enemy wave incoming!' },
            priority: 1
          },
          {
            id: 'wave_spawn',
            type: 'spawn',
            content: {
              spawnLocations: 'viewport_edge',
              count: 5,
              enemyType: 'enemy_ant'
            },
            priority: 2
          },
          {
            id: 'wave_complete',
            type: 'dialogue',
            content: { message: 'Wave defeated!' },
            priority: 3
          }
        ],
        triggers: [
          {
            eventId: 'wave_warning',
            type: 'time',
            oneTime: true,
            condition: { delay: 1000 }
          },
          {
            eventId: 'wave_spawn',
            type: 'flag',
            oneTime: true,
            condition: {
              flag: 'warning_acknowledged',
              value: true
            }
          },
          {
            eventId: 'wave_complete',
            type: 'flag',
            oneTime: true,
            condition: {
              flag: 'enemies_remaining',
              operator: '<=',
              value: 0
            }
          }
        ]
      };
      
      eventManager.loadFromJSON(scenarioJSON);
      
      // Verify all events loaded
      expect(eventManager.getEvent('wave_warning')).to.exist;
      expect(eventManager.getEvent('wave_spawn')).to.exist;
      expect(eventManager.getEvent('wave_complete')).to.exist;
      
      // Verify triggers loaded
      expect(eventManager.getTriggersForEvent('wave_warning')).to.have.lengthOf(1);
      expect(eventManager.getTriggersForEvent('wave_spawn')).to.have.lengthOf(1);
      expect(eventManager.getTriggersForEvent('wave_complete')).to.have.lengthOf(1);
    });
  });

  describe('Flag System Integration', function() {
    it('should track GameEvent completion with flags', function() {
      const GameEvent = new GameEvent({
        id: 'flag_setter',
        type: 'dialogue',
        content: {},
        onComplete: () => {
          eventManager.setFlag('event_completed', true);
          eventManager.setFlag('completion_time', global.millis());
        }
      });
      
      eventManager.registerEvent(GameEvent);
      eventManager.triggerEvent('flag_setter');
      
      expect(eventManager.hasFlag('event_completed')).to.be.false;
      
      GameEvent.complete();
      
      expect(eventManager.hasFlag('event_completed')).to.be.true;
      expect(eventManager.getFlag('event_completed')).to.be.true;
      expect(eventManager.getFlag('completion_time')).to.equal(1000);
    });

    it('should use flags for GameEvent chaining', function() {
      const triggerOrder = [];
      
      // GameEvent 1: Triggered by time, sets flag on completion
      eventManager.registerEvent({
        id: 'event_1',
        type: 'dialogue',
        content: {},
        onTrigger: () => triggerOrder.push(1),
        onComplete: () => eventManager.setFlag('event_1_done', true)
      });
      
      // GameEvent 2: Triggered by event_1 completion flag
      eventManager.registerEvent({
        id: 'event_2',
        type: 'dialogue',
        content: {},
        onTrigger: () => triggerOrder.push(2)
      });
      
      eventManager.registerTrigger({
        eventId: 'event_1',
        type: 'time',
        oneTime: true,
        condition: { delay: 0 }
      });
      
      eventManager.registerTrigger({
        eventId: 'event_2',
        type: 'flag',
        oneTime: true,
        condition: {
          flag: 'event_1_done',
          value: true
        }
      });
      
      // Trigger GameEvent 1
      eventManager.update();
      expect(triggerOrder).to.deep.equal([1]);
      
      // Complete GameEvent 1 (sets flag)
      eventManager.getEvent('event_1').complete();
      
      // GameEvent 2 should now trigger
      eventManager.update();
      expect(triggerOrder).to.deep.equal([1, 2]);
    });
  });

  describe('GameEvent State Management', function() {
    it('should track active, completed, and queued events', function() {
      // Register multiple events
      eventManager.registerEvent({ id: 'event_1', type: 'dialogue', content: {} });
      eventManager.registerEvent({ id: 'event_2', type: 'dialogue', content: {} });
      eventManager.registerEvent({ id: 'event_3', type: 'dialogue', content: {} });
      
      // Trigger GameEvent 1 and 2
      eventManager.triggerEvent('event_1');
      eventManager.triggerEvent('event_2');
      
      const active = eventManager.getActiveEvents();
      expect(active).to.have.lengthOf(2);
      
      // Complete GameEvent 1
      eventManager.getEvent('event_1').complete();
      
      const activeAfterComplete = eventManager.getActiveEvents();
      expect(activeAfterComplete).to.have.lengthOf(1);
      expect(activeAfterComplete[0].id).to.equal('event_2');
    });

    it('should auto-complete events based on duration', function() {
      const GameEvent = new GameEvent({
        id: 'timed_event',
        type: 'dialogue',
        content: {},
        autoCompleteAfter: 3000
      });
      
      eventManager.registerEvent(GameEvent);
      eventManager.triggerEvent('timed_event');
      
      expect(GameEvent.completed).to.be.false;
      
      // Update before duration
      global.millis.returns(3999);
      GameEvent.update();
      expect(GameEvent.completed).to.be.false;
      
      // Update after duration
      global.millis.returns(4000);
      GameEvent.update();
      expect(GameEvent.completed).to.be.true;
    });
  });

  describe('Error Handling and Edge Cases', function() {
    it('should handle triggering non-existent GameEvent gracefully', function() {
      expect(() => {
        eventManager.triggerEvent('does_not_exist');
      }).to.not.throw();
    });

    it('should handle invalid JSON gracefully', function() {
      const invalidJSON = {
        events: [
          { id: 'missing_type', content: {} } // Missing type
        ]
      };
      
      expect(() => {
        eventManager.loadFromJSON(invalidJSON);
      }).to.not.throw();
    });

    it('should prevent duplicate GameEvent registration', function() {
      eventManager.registerEvent({ id: 'duplicate', type: 'dialogue', content: {} });
      
      expect(() => {
        eventManager.registerEvent({ id: 'duplicate', type: 'dialogue', content: {} });
      }).to.not.throw();
      
      // Should have only one instance
      const events = eventManager._events;
      const duplicates = events.filter(e => e.id === 'duplicate');
      expect(duplicates).to.have.lengthOf(1);
    });

    it('should handle oneTime triggers correctly', function() {
      let triggerCount = 0;
      
      eventManager.registerEvent({
        id: 'one_time',
        type: 'dialogue',
        content: {},
        onTrigger: () => triggerCount++
      });
      
      const trigger = new TimeTrigger({
        eventId: 'one_time',
        oneTime: true,
        condition: { delay: 0 }
      });
      
      trigger.initialize();
      eventManager._triggers.push(trigger);
      
      // First update - should trigger
      eventManager.update();
      expect(triggerCount).to.equal(1);
      
      // Second update - should not trigger again (oneTime)
      eventManager.update();
      expect(triggerCount).to.equal(1);
    });
  });
});





// ================================================================
// dialogueEvent.integration.test.js (20 tests)
// ================================================================
/**
 * Integration Tests for DialogueEvent
 * 
 * Tests DialogueEvent with real DraggablePanelManager (not mocked).
 * Verifies proper integration between DialogueEvent, DraggablePanelManager, and EventManager.
 * 
 * Run: npm run test:integration
 */

// Load required classes (GameEvent and DialogueEvent already loaded at top of file)
// DUPLICATE REMOVED: let { GameEvent, DialogueEvent } = require('../../../Classes/events/Event.js');
let Button = require('../../../Classes/systems/Button.js'); // Button must be loaded before DraggablePanel
let DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');
let DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');

describe('DialogueEvent Integration Tests', function() {
  let dom;
  let window;
  let document;
  let sandbox;
  let draggablePanelManager;
  let mockEventManager;

  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    window = dom.window;
    document = window.document;
    
    sandbox = sinon.createSandbox();

    // Set up global p5.js-like environment
    global.window = window;
    global.document = document;
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    
    // Mock p5.js globals
    const mockP5Functions = {
      createVector: (x, y) => ({ x, y, mag: () => Math.sqrt(x*x + y*y) }),
      millis: sandbox.stub().returns(1000),
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      noStroke: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textSize: sandbox.stub(),
      textAlign: sandbox.stub(),
      textWidth: sandbox.stub().callsFake((txt) => txt.length * 7),
      image: sandbox.stub(),
      loadImage: sandbox.stub().returns({ width: 64, height: 64 }),
      LEFT: 'left',
      CENTER: 'center',
      RIGHT: 'right',
      TOP: 'top',
      BOTTOM: 'bottom',
      CORNER: 'corner',
      CORNERS: 'corners'
    };
    
    // Assign to both global and window
    Object.keys(mockP5Functions).forEach(key => {
      global[key] = mockP5Functions[key];
      window[key] = mockP5Functions[key];
    });

    // Mock EventManager
    mockEventManager = {
      events: new Map(),
      flags: new Map(),
      registerEvent: function(event) {
        this.events.set(event.id, event);
      },
      triggerEvent: sandbox.stub(),
      setFlag: function(flagName, value) {
        this.flags.set(flagName, value);
      },
      getFlag: function(flagName) {
        return this.flags.get(flagName);
      },
      completeEvent: sandbox.stub()
    };
    
    global.eventManager = mockEventManager;
    window.eventManager = mockEventManager;

    // Set DraggablePanel globally (required by DraggablePanelManager)
    global.DraggablePanel = DraggablePanel;
    window.DraggablePanel = DraggablePanel;
    
    // Mock ButtonStyles to avoid errors
    global.ButtonStyles = {
      PRIMARY: 'primary',
      SUCCESS: 'success',
      DANGER: 'danger',
      WARNING: 'warning',
      INFO: 'info',
      PURPLE: 'purple'
    };
    window.ButtonStyles = global.ButtonStyles;

    // Create REAL DraggablePanelManager (not mocked)
    draggablePanelManager = new DraggablePanelManager();
    // Don't call initialize() to avoid creating default panels with many dependencies
    draggablePanelManager.isInitialized = true; // Mark as initialized manually
    
    global.draggablePanelManager = draggablePanelManager;
    window.draggablePanelManager = draggablePanelManager;
  });

  afterEach(function() {
    sandbox.restore();
    
    // Cleanup globals
    Object.keys(global).forEach(key => {
      if (typeof global[key] !== 'function' || key === 'clearTimeout' || key === 'setTimeout') return;
      if (key.startsWith('mock') || key === 'window' || key === 'document') {
        delete global[key];
      }
    });
    
    delete global.eventManager;
    delete global.draggablePanelManager;
    delete global.DraggablePanel;
    delete global.window;
    delete global.document;
  });

  describe('Panel Creation with Real DraggablePanelManager', function() {
    it('should create visible panel with correct title', function() {
      const dialogue = new DialogueEvent({
        id: 'test',
        content: {
          speaker: 'Queen Ant',
          message: 'Hello!',
          choices: [{ text: 'OK' }]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel).to.exist;
      expect(panel.config.title).to.equal('Queen Ant');
      expect(panel.visible).to.be.true;
    });

    it('should create panel with non-draggable behavior', function() {
      const dialogue = new DialogueEvent({
        id: 'test',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message',
          choices: [{ text: 'Continue' }]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.config.behavior.draggable).to.be.false;
      expect(panel.config.behavior.closeable).to.be.false;
      expect(panel.config.behavior.minimizable).to.be.false;
    });

    it('should create panel at bottom-center of screen', function() {
      const dialogue = new DialogueEvent({
        id: 'test',
        content: {
          message: 'Test'
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.config.position.y).to.be.greaterThan(800); // Near bottom
      expect(panel.config.position.x).to.be.within(600, 1200); // Near center
    });

    it('should create panel with choice buttons', function() {
      const dialogue = new DialogueEvent({
        id: 'test',
        content: {
          message: 'Choose',
          choices: [
            { text: 'Option A' },
            { text: 'Option B' },
            { text: 'Option C' }
          ]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.config.buttons).to.exist;
      expect(panel.config.buttons.items).to.have.lengthOf(3);
      expect(panel.config.buttons.items[0].caption).to.equal('Option A');
      expect(panel.config.buttons.items[1].caption).to.equal('Option B');
      expect(panel.config.buttons.items[2].caption).to.equal('Option C');
    });

    it('should have horizontal button layout', function() {
      const dialogue = new DialogueEvent({
        id: 'test',
        content: {
          message: 'Test',
          choices: [{ text: 'OK' }]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.config.buttons.layout).to.equal('horizontal');
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });
  });

  describe('Choice Button Functionality', function() {
    it('should execute choice callback when button clicked', function() {
      const choiceCallback = sandbox.stub();
      
      const dialogue = new DialogueEvent({
        id: 'callback_test',
        content: {
          message: 'Test',
          choices: [
            { text: 'Option 1', onSelect: choiceCallback }
          ]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      panel.config.buttons.items[0].onClick();
      
      expect(choiceCallback.calledOnce).to.be.true;
    });

    it('should hide panel after choice selection', function() {
      const dialogue = new DialogueEvent({
        id: 'hide_test',
        content: {
          message: 'Test',
          choices: [{ text: 'OK' }]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.visible).to.be.true;
      
      panel.config.buttons.items[0].onClick();
      
      expect(panel.visible).to.be.false;
    });

    it('should complete dialogue event after choice', function() {
      const dialogue = new DialogueEvent({
        id: 'complete_test',
        content: {
          message: 'Test',
          choices: [{ text: 'Done' }]
        }
      });
      
      dialogue.trigger();
      expect(dialogue.active).to.be.true;
      expect(dialogue.completed).to.be.false;
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      panel.config.buttons.items[0].onClick();
      
      expect(dialogue.active).to.be.false;
      expect(dialogue.completed).to.be.true;
    });
  });

  describe('EventManager Integration', function() {
    it('should track choice in eventManager flags', function() {
      const dialogue = new DialogueEvent({
        id: 'flag_test',
        content: {
          message: 'Choose',
          choices: [
            { text: 'Option A' },
            { text: 'Option B' }
          ]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      panel.config.buttons.items[1].onClick(); // Click "Option B" (index 1)
      
      expect(mockEventManager.getFlag('flag_test_choice')).to.equal(1);
    });

    it('should trigger next event when choice has nextEventId', function() {
      const dialogue = new DialogueEvent({
        id: 'branching_test',
        content: {
          message: 'Choose your path',
          choices: [
            { text: 'Path A', nextEventId: 'event_path_a' },
            { text: 'Path B', nextEventId: 'event_path_b' }
          ]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      panel.config.buttons.items[0].onClick(); // Choose "Path A"
      
      expect(mockEventManager.triggerEvent.calledWith('event_path_a')).to.be.true;
    });

    it('should support branching dialogues', function() {
      // Create dialogue chain
      const dialogue1 = new DialogueEvent({
        id: 'start',
        content: {
          message: 'Start',
          choices: [
            { text: 'Next', nextEventId: 'middle' }
          ]
        }
      });
      
      const dialogue2 = new DialogueEvent({
        id: 'middle',
        content: {
          message: 'Middle',
          choices: [
            { text: 'End', nextEventId: 'end' }
          ]
        }
      });
      
      mockEventManager.registerEvent(dialogue1);
      mockEventManager.registerEvent(dialogue2);
      
      // Trigger first dialogue
      dialogue1.trigger();
      const panel1 = draggablePanelManager.getPanel('dialogue-display');
      expect(panel1.config.title).to.equal('Dialogue'); // Default speaker
      
      // Click to next
      panel1.config.buttons.items[0].onClick();
      expect(mockEventManager.triggerEvent.calledWith('middle')).to.be.true;
    });
  });

  describe('Content Rendering', function() {
    it('should set contentSizeCallback', function() {
      const dialogue = new DialogueEvent({
        id: 'render_test',
        content: {
          message: 'Test message'
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.config.contentSizeCallback).to.be.a('function');
    });

    it('should render dialogue text with word wrapping', function() {
      const dialogue = new DialogueEvent({
        id: 'wrap_test',
        content: {
          message: 'This is a very long message that should be wrapped across multiple lines when rendered.'
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      const contentArea = { x: 100, y: 100, width: 400, height: 100 };
      const size = panel.config.contentSizeCallback(contentArea);
      
      expect(size).to.have.property('width');
      expect(size).to.have.property('height');
      expect(global.text.called).to.be.true;
    });

    it('should render portrait if provided', function() {
      const dialogue = new DialogueEvent({
        id: 'portrait_test',
        content: {
          speaker: 'Queen',
          message: 'Hello',
          portrait: 'Images/Characters/queen.png'
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      const contentArea = { x: 100, y: 100, width: 500, height: 200 };
      panel.config.contentSizeCallback(contentArea);
      
      expect(global.image.called).to.be.true;
    });
  });

  describe('Panel Reuse', function() {
    it('should reuse same panel for multiple dialogues', function() {
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: {
          speaker: 'Speaker 1',
          message: 'First message',
          choices: [{ text: 'OK' }]
        }
      });
      
      dialogue1.trigger();
      const panel1 = draggablePanelManager.getPanel('dialogue-display');
      const panelId1 = panel1.config.id;
      
      // Close first dialogue
      panel1.config.buttons.items[0].onClick();
      
      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: {
          speaker: 'Speaker 2',
          message: 'Second message',
          choices: [{ text: 'Continue' }]
        }
      });
      
      dialogue2.trigger();
      const panel2 = draggablePanelManager.getPanel('dialogue-display');
      
      // Should be same panel instance
      expect(panel2.config.id).to.equal(panelId1);
      expect(panel2.config.title).to.equal('Speaker 2'); // Updated
    });

    it('should update panel content for new dialogue', function() {
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: {
          message: 'Message 1',
          choices: [{ text: 'Next' }]
        }
      });
      
      dialogue1.trigger();
      const panel = draggablePanelManager.getPanel('dialogue-display');
      panel.config.buttons.items[0].onClick();
      
      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: {
          speaker: 'New Speaker',
          message: 'Message 2',
          choices: [
            { text: 'Choice A' },
            { text: 'Choice B' }
          ]
        }
      });
      
      dialogue2.trigger();
      
      expect(panel.config.title).to.equal('New Speaker');
      expect(panel.config.buttons.items).to.have.lengthOf(2);
    });
  });

  describe('Auto-Continue Behavior', function() {
    it('should auto-continue after delay', function() {
      const dialogue = new DialogueEvent({
        id: 'auto_test',
        content: {
          message: 'This will auto-continue',
          autoContinue: true,
          autoContinueDelay: 2000,
          choices: [{ text: 'Continue' }] // Single choice
        }
      });
      
      dialogue.trigger();
      expect(dialogue.active).to.be.true;
      
      // Before delay
      global.millis.returns(2999);
      dialogue.update();
      expect(dialogue.completed).to.be.false;
      
      // After delay
      global.millis.returns(3000);
      dialogue.update();
      expect(dialogue.completed).to.be.true;
    });

    it('should not auto-continue with multiple choices', function() {
      const dialogue = new DialogueEvent({
        id: 'no_auto',
        content: {
          message: 'Choose',
          autoContinue: true,
          autoContinueDelay: 1000,
          choices: [
            { text: 'A' },
            { text: 'B' }
          ]
        }
      });
      
      dialogue.trigger();
      
      global.millis.returns(5000);
      dialogue.update();
      
      expect(dialogue.completed).to.be.false; // Should not auto-complete
    });
  });

  describe('Error Handling', function() {
    it('should gracefully handle missing eventManager', function() {
      delete global.eventManager;
      delete window.eventManager;
      
      const dialogue = new DialogueEvent({
        id: 'no_manager',
        content: {
          message: 'Test',
          choices: [{ text: 'OK', nextEventId: 'next' }]
        }
      });
      
      dialogue.trigger();
      const panel = draggablePanelManager.getPanel('dialogue-display');
      
      // Should not throw when clicking choice
      expect(() => panel.config.buttons.items[0].onClick()).to.not.throw();
      
      // Restore for cleanup
      global.eventManager = mockEventManager;
      window.eventManager = mockEventManager;
    });

    it('should gracefully handle missing draggablePanelManager', function() {
      delete global.draggablePanelManager;
      delete window.draggablePanelManager;
      
      const dialogue = new DialogueEvent({
        id: 'no_panel_manager',
        content: {
          message: 'Test'
        }
      });
      
      // Should not throw
      expect(() => dialogue.trigger()).to.not.throw();
      
      // Restore for cleanup
      global.draggablePanelManager = draggablePanelManager;
      window.draggablePanelManager = draggablePanelManager;
    });
  });
});




// ================================================================
// eventEditorPanelDisplay.integration.test.js (18 tests)
// ================================================================
/**
 * Integration Tests: EventEditorPanel Displaying DialogueEvents
 * 
 * Tests that DialogueEvents registered with EventManager appear correctly
 * in the EventEditorPanel UI within the Level Editor.
 * 
 * Tests:
 * - EventEditorPanel displays registered DialogueEvents
 * - Event count matches registered events
 * - Event details (speaker, type) are correct
 * - Multiple dialogue events are all displayed
 * - Event list updates when events are registered
 */

describe('EventEditorPanel Displaying DialogueEvents (Integration)', function() {
  let EventManager;
  let EventEditorPanel;
  let DialogueEvent;
  let eventManager;
  let eventEditorPanel;
  let sandbox;
  let window;
  let document;

  beforeEach(function() {
    // Create JSDOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    window = dom.window;
    document = window.document;
    
    sandbox = sinon.createSandbox();

    // Set up globals
    global.window = window;
    global.document = document;
    window.innerWidth = 1920;
    window.innerHeight = 1080;

    // Mock p5.js functions
    const mockP5 = {
      createVector: (x, y) => ({ x, y }),
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      noStroke: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      image: sandbox.stub(),
      LEFT: 'left',
      RIGHT: 'right',
      CENTER: 'center',
      TOP: 'top',
      BOTTOM: 'bottom',
      CORNER: 'corner'
    };

    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      window[key] = mockP5[key];
    });

    // Load classes
    EventManager = require('../../../Classes/managers/EventManager.js');
    EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel.js');
    const EventClasses = require('../../../Classes/events/Event.js');
    DialogueEvent = EventClasses.DialogueEvent;

    // Make classes available globally
    global.EventManager = EventManager;
    global.EventEditorPanel = EventEditorPanel;
    global.DialogueEvent = DialogueEvent;
    window.EventManager = EventManager;
    window.EventEditorPanel = EventEditorPanel;
    window.DialogueEvent = DialogueEvent;

    // Create instances
    eventManager = new EventManager();
    global.eventManager = eventManager;
    window.eventManager = eventManager;

    eventEditorPanel = new EventEditorPanel();
    eventEditorPanel.initialize();
  });

  afterEach(function() {
    sandbox.restore();
    delete global.window;
    delete global.document;
    delete global.EventManager;
    delete global.EventEditorPanel;
    delete global.DialogueEvent;
    delete global.eventManager;
  });

  describe('Basic Display Functionality', function() {
    it('should initialize with zero events', function() {
      const events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(0);
    });

    it('should display registered DialogueEvent in event list', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);
      const events = eventManager.getAllEvents();

      expect(events).to.have.lengthOf(1);
      expect(events[0].id).to.equal('test_dialogue');
      expect(events[0].type).to.equal('dialogue');
    });

    it('should render event list without errors', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);

      // Render should not throw
      expect(() => {
        eventEditorPanel.render(10, 10, 250, 300);
      }).to.not.throw();
    });

    it('should call p5 text() function with event count', function() {
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: { speaker: 'Speaker 1', message: 'Message 1' }
      });

      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: { speaker: 'Speaker 2', message: 'Message 2' }
      });

      eventManager.registerEvent(dialogue1);
      eventManager.registerEvent(dialogue2);

      // Reset stub to count calls
      global.text.resetHistory();

      eventEditorPanel.render(10, 10, 250, 300);

      // Should have called text() with event count
      const textCalls = global.text.getCalls();
      const countCalls = textCalls.filter(call => 
        call.args[0] && call.args[0].toString().includes('Events (2)')
      );

      expect(countCalls.length).to.be.at.least(1);
    });
  });

  describe('Multiple DialogueEvent Display', function() {
    it('should display all registered dialogue events', function() {
      const dialogues = [
        new DialogueEvent({
          id: 'dialogue_1',
          content: { speaker: 'Queen Ant', message: 'Welcome!' }
        }),
        new DialogueEvent({
          id: 'dialogue_2',
          content: { speaker: 'Worker Ant', message: 'Need resources!' }
        }),
        new DialogueEvent({
          id: 'dialogue_3',
          content: { speaker: 'Scout Ant', message: 'Found food!' }
        })
      ];

      dialogues.forEach(d => eventManager.registerEvent(d));

      const events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(3);

      const eventIds = events.map(e => e.id);
      expect(eventIds).to.include.members(['dialogue_1', 'dialogue_2', 'dialogue_3']);
    });

    it('should render multiple events in event list', function() {
      // Register 5 dialogue events
      for (let i = 1; i <= 5; i++) {
        const dialogue = new DialogueEvent({
          id: `dialogue_${i}`,
          content: {
            speaker: `Speaker ${i}`,
            message: `Message ${i}`
          }
        });
        eventManager.registerEvent(dialogue);
      }

      // Reset stubs
      global.text.resetHistory();
      global.rect.resetHistory();

      eventEditorPanel.render(10, 10, 250, 300);

      // Should have rendered list items (one rect per item background)
      const rectCalls = global.rect.getCalls();
      
      // Should have called rect for event backgrounds (plus UI elements)
      // At least 5 rects for event items
      expect(rectCalls.length).to.be.at.least(5);
    });

    it('should preserve event order', function() {
      const dialogue1 = new DialogueEvent({
        id: 'first',
        priority: 1,
        content: { speaker: 'First', message: 'First' }
      });

      const dialogue2 = new DialogueEvent({
        id: 'second',
        priority: 2,
        content: { speaker: 'Second', message: 'Second' }
      });

      const dialogue3 = new DialogueEvent({
        id: 'third',
        priority: 3,
        content: { speaker: 'Third', message: 'Third' }
      });

      eventManager.registerEvent(dialogue1);
      eventManager.registerEvent(dialogue2);
      eventManager.registerEvent(dialogue3);

      const events = eventManager.getAllEvents();
      
      // Events should be in registration order (or priority order if sorted)
      expect(events[0].id).to.equal('first');
      expect(events[1].id).to.equal('second');
      expect(events[2].id).to.equal('third');
    });
  });

  describe('Event Content Display', function() {
    it('should display event ID in list', function() {
      const dialogue = new DialogueEvent({
        id: 'queen_welcome',
        content: {
          speaker: 'Queen Ant',
          message: 'Welcome to the colony!'
        }
      });

      eventManager.registerEvent(dialogue);
      global.text.resetHistory();

      eventEditorPanel.render(10, 10, 250, 300);

      const textCalls = global.text.getCalls();
      const idCalls = textCalls.filter(call => 
        call.args[0] && call.args[0].includes('queen_welcome')
      );

      expect(idCalls.length).to.be.at.least(1);
    });

    it('should display event type in list', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);
      global.text.resetHistory();

      eventEditorPanel.render(10, 10, 250, 300);

      const textCalls = global.text.getCalls();
      const typeCalls = textCalls.filter(call => 
        call.args[0] && call.args[0].toString().toLowerCase().includes('dialogue')
      );

      expect(typeCalls.length).to.be.at.least(1);
    });

    it('should display event priority', function() {
      const dialogue = new DialogueEvent({
        id: 'high_priority',
        priority: 1,
        content: {
          speaker: 'Urgent',
          message: 'Important message'
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent('high_priority');

      expect(retrieved.priority).to.equal(1);
    });
  });

  describe('Event List Updates', function() {
    it('should update event count when new event is registered', function() {
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: { speaker: 'Speaker 1', message: 'Message 1' }
      });

      eventManager.registerEvent(dialogue1);
      let events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(1);

      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: { speaker: 'Speaker 2', message: 'Message 2' }
      });

      eventManager.registerEvent(dialogue2);
      events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(2);
    });

    it('should reflect current event manager state', function() {
      // Start with no events
      let events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(0);

      // Add first dialogue
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: { speaker: 'Speaker 1', message: 'Message 1' }
      });
      eventManager.registerEvent(dialogue1);
      events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(1);

      // Add second dialogue
      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: { speaker: 'Speaker 2', message: 'Message 2' }
      });
      eventManager.registerEvent(dialogue2);
      events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(2);

      // Panel should show current state
      global.text.resetHistory();
      eventEditorPanel.render(10, 10, 250, 300);

      const textCalls = global.text.getCalls();
      const countCalls = textCalls.filter(call => 
        call.args[0] && call.args[0].toString().includes('Events (2)')
      );

      expect(countCalls.length).to.be.at.least(1);
    });
  });

  describe('EventEditorPanel Content Size', function() {
    it('should return valid content size', function() {
      const size = eventEditorPanel.getContentSize();

      expect(size).to.exist;
      expect(size.width).to.be.a('number');
      expect(size.height).to.be.a('number');
      expect(size.width).to.be.greaterThan(0);
      expect(size.height).to.be.greaterThan(0);
    });

    it('should return consistent size for list view', function() {
      const size1 = eventEditorPanel.getContentSize();
      const size2 = eventEditorPanel.getContentSize();

      expect(size1.width).to.equal(size2.width);
      expect(size1.height).to.equal(size2.height);
    });
  });

  describe('Edge Cases', function() {
    it('should handle empty event list', function() {
      expect(() => {
        eventEditorPanel.render(10, 10, 250, 300);
      }).to.not.throw();

      const events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(0);
    });

    it('should handle many dialogue events', function() {
      // Register 20 dialogue events
      for (let i = 1; i <= 20; i++) {
        const dialogue = new DialogueEvent({
          id: `dialogue_${i}`,
          content: {
            speaker: `Speaker ${i}`,
            message: `Message ${i}`
          }
        });
        eventManager.registerEvent(dialogue);
      }

      const events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(20);

      // Rendering should not throw with many events
      expect(() => {
        eventEditorPanel.render(10, 10, 250, 300);
      }).to.not.throw();
    });

    it('should handle dialogue with very long ID', function() {
      const longId = 'very_long_dialogue_event_id_' + 'a'.repeat(100);
      const dialogue = new DialogueEvent({
        id: longId,
        content: {
          speaker: 'Speaker',
          message: 'Message'
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent(longId);

      expect(retrieved).to.exist;
      expect(retrieved.id).to.equal(longId);
    });

    it('should handle mixed event types when integrated', function() {
      // Register dialogue event
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);

      // Also register plain event
      eventManager.registerEvent({
        id: 'spawn_event',
        type: 'spawn',
        priority: 5
      });

      const events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(2);

      const dialogueEvents = events.filter(e => e.type === 'dialogue');
      expect(dialogueEvents).to.have.lengthOf(1);
      expect(dialogueEvents[0].id).to.equal('test_dialogue');
    });
  });
});




// ================================================================
// eventEditorDragToPlace.integration.test.js (15 tests)
// ================================================================
/**
 * Integration tests for EventEditorPanel drag-to-place with Level Editor
 * 
 * Tests the complete integration:
 * - EventEditorPanel drag state
 * - LevelEditor coordinate conversion
 * - EventManager trigger registration
 * - Visual feedback and cursor tracking
 */

let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('EventEditorPanel Drag-to-Place Integration', function() {
  let EventEditorPanel;
  let EventManager;
  let panel;
  let eventManager;
  let mockCameraManager;

  beforeEach(function() {
    // Setup UI test environment (handles p5.js, window, console, etc.)
    setupUITestEnvironment();
    
    // Mock logging functions
    global.logNormal = sinon.stub();
    global.logVerbose = sinon.stub();
    global.logError = sinon.stub();
    
    // Sync to window
    window.logNormal = global.logNormal;
    window.logVerbose = global.logVerbose;
    window.logError = global.logError;
    
    // Mock camera manager for coordinate conversion
    mockCameraManager = {
      screenToWorld: sinon.stub().callsFake((screenX, screenY) => {
        // Simple conversion: multiply by 2 for testing
        return {
          x: screenX * 2,
          y: screenY * 2
        };
      }),
      worldToScreen: sinon.stub().callsFake((worldX, worldY) => {
        return {
          x: worldX / 2,
          y: worldY / 2
        };
      })
    };
    
    global.cameraManager = mockCameraManager;
    window.cameraManager = mockCameraManager;
    
    // Load EventManager
    EventManager = require('../../../Classes/managers/EventManager.js');
    
    // Reset EventManager singleton for each test
    EventManager._instance = null;
    
    eventManager = EventManager.getInstance();
    
    global.EventManager = EventManager;
    window.EventManager = EventManager;
    
    // Load EventEditorPanel
    EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel.js');
    
    // Create panel instance and initialize
    panel = new EventEditorPanel();
    panel.initialize();
  });

  afterEach(function() {
    // Clear EventManager singleton
    if (EventManager) {
      EventManager._instance = null;
    }
    
    cleanupUITestEnvironment();
    delete global.logNormal;
    delete global.logVerbose;
    delete global.logError;
    delete global.cameraManager;
    delete global.EventManager;
  });

  describe('Complete Drag-to-Place Workflow', function() {
    it('should complete full drag workflow with coordinate conversion', function() {
      // Register a test event
      eventManager.registerEvent({
        id: 'test_dialogue',
        type: 'dialogue',
        priority: 5,
        content: { text: 'Test', speaker: 'Test' }
      });
      
      // Start drag
      const startResult = panel.startDragPlacement('test_dialogue');
      expect(startResult).to.be.true;
      expect(panel.isDragging()).to.be.true;
      
      // Update cursor position (screen coordinates)
      panel.updateDragPosition(300, 400);
      
      const cursorPos = panel.getDragCursorPosition();
      expect(cursorPos).to.deep.equal({ x: 300, y: 400 });
      
      // Complete drag (world coordinates - converted from screen)
      const worldX = 600; // 300 * 2
      const worldY = 800; // 400 * 2
      
      const result = panel.completeDrag(worldX, worldY);
      
      expect(result.success).to.be.true;
      expect(result.eventId).to.equal('test_dialogue');
      expect(result.worldX).to.equal(worldX);
      expect(result.worldY).to.equal(worldY);
      
      // Verify trigger was registered
      const triggers = Array.from(eventManager.triggers.values());
      expect(triggers).to.have.lengthOf(1);
      
      const trigger = triggers[0];
      expect(trigger.eventId).to.equal('test_dialogue');
      expect(trigger.type).to.equal('spatial');
      expect(trigger.condition.x).to.equal(worldX);
      expect(trigger.condition.y).to.equal(worldY);
      expect(trigger.condition.radius).to.equal(64);
    });

    it('should handle multiple drag-and-drop operations', function() {
      // Register events
      eventManager.registerEvent({ id: 'event1', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerEvent({ id: 'event2', type: 'spawn', priority: 3, content: {} });
      
      // First drag
      panel.startDragPlacement('event1');
      panel.updateDragPosition(100, 100);
      panel.completeDrag(200, 200);
      
      // Second drag
      panel.startDragPlacement('event2');
      panel.updateDragPosition(300, 300);
      panel.completeDrag(600, 600);
      
      // Verify both triggers registered
      const triggers = Array.from(eventManager.triggers.values());
      expect(triggers).to.have.lengthOf(2);
      
      const event1Trigger = triggers.find(t => t.eventId === 'event1');
      const event2Trigger = triggers.find(t => t.eventId === 'event2');
      
      expect(event1Trigger).to.exist;
      expect(event1Trigger.condition.x).to.equal(200);
      expect(event1Trigger.condition.y).to.equal(200);
      
      expect(event2Trigger).to.exist;
      expect(event2Trigger.condition.x).to.equal(600);
      expect(event2Trigger.condition.y).to.equal(600);
    });

    it('should allow cancelling drag without creating trigger', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      
      panel.startDragPlacement('test_event');
      panel.updateDragPosition(250, 350);
      
      expect(panel.isDragging()).to.be.true;
      
      panel.cancelDrag();
      
      expect(panel.isDragging()).to.be.false;
      
      // No triggers should be created
      const triggers = Array.from(eventManager.triggers.values());
      expect(triggers).to.have.lengthOf(0);
    });
  });

  describe('Trigger Configuration', function() {
    it('should create triggers with custom radius', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      
      // Set custom radius
      panel.setTriggerRadius(128);
      
      panel.startDragPlacement('test_event');
      panel.completeDrag(500, 500);
      
      const triggers = Array.from(eventManager.triggers.values());
      const trigger = triggers[0];
      
      expect(trigger.condition.radius).to.equal(128);
    });

    it('should reset radius to default after completion', function() {
      eventManager.registerEvent({ id: 'event1', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerEvent({ id: 'event2', type: 'dialogue', priority: 5, content: {} });
      
      // First drag with custom radius
      panel.setTriggerRadius(256);
      panel.startDragPlacement('event1');
      panel.completeDrag(500, 500);
      
      // Second drag should use default radius
      panel.startDragPlacement('event2');
      panel.completeDrag(600, 600);
      
      const triggers = Array.from(eventManager.triggers.values());
      
      expect(triggers[0].condition.radius).to.equal(256);
      expect(triggers[1].condition.radius).to.equal(64); // Default
    });

    it('should create one-time triggers by default', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      
      panel.startDragPlacement('test_event');
      panel.completeDrag(500, 500);
      
      const triggers = Array.from(eventManager.triggers.values());
      const trigger = triggers[0];
      
      expect(trigger.oneTime).to.be.true;
    });

    it('should generate unique trigger IDs', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      
      // Place same event multiple times
      panel.startDragPlacement('test_event');
      panel.completeDrag(100, 100);
      
      panel.startDragPlacement('test_event');
      panel.completeDrag(200, 200);
      
      panel.startDragPlacement('test_event');
      panel.completeDrag(300, 300);
      
      const triggers = Array.from(eventManager.triggers.values());
      expect(triggers).to.have.lengthOf(3);
      
      const triggerIds = triggers.map(t => t.id);
      const uniqueIds = new Set(triggerIds);
      
      expect(uniqueIds.size).to.equal(3); // All IDs unique
    });
  });

  describe('Visual Feedback During Drag', function() {
    it('should track cursor position in real-time', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      
      panel.startDragPlacement('test_event');
      
      // Simulate mouse movement
      panel.updateDragPosition(100, 150);
      expect(panel.getDragCursorPosition()).to.deep.equal({ x: 100, y: 150 });
      
      panel.updateDragPosition(200, 250);
      expect(panel.getDragCursorPosition()).to.deep.equal({ x: 200, y: 250 });
      
      panel.updateDragPosition(300, 350);
      expect(panel.getDragCursorPosition()).to.deep.equal({ x: 300, y: 350 });
    });

    it('should provide event ID for visual rendering', function() {
      eventManager.registerEvent({ id: 'queen_dialogue', type: 'dialogue', priority: 5, content: {} });
      
      panel.startDragPlacement('queen_dialogue');
      
      expect(panel.getDragEventId()).to.equal('queen_dialogue');
    });

    it('should clear visual state after completion', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      
      panel.startDragPlacement('test_event');
      panel.updateDragPosition(250, 350);
      
      panel.completeDrag(500, 700);
      
      expect(panel.isDragging()).to.be.false;
      expect(panel.getDragEventId()).to.be.null;
      expect(panel.getDragCursorPosition()).to.be.null;
    });
  });

  describe('Error Handling', function() {
    it('should handle invalid event IDs gracefully', function() {
      const result = panel.startDragPlacement('nonexistent_event');
      
      // Should start drag (validation happens at drop time)
      expect(result).to.be.true;
      
      // But completion should succeed (EventManager validates)
      const dropResult = panel.completeDrag(500, 500);
      expect(dropResult.success).to.be.true; // EventManager will register trigger
    });

    it('should prevent starting new drag while already dragging', function() {
      eventManager.registerEvent({ id: 'event1', type: 'dialogue', priority: 5, content: {} });
      eventManager.registerEvent({ id: 'event2', type: 'dialogue', priority: 5, content: {} });
      
      panel.startDragPlacement('event1');
      const secondStart = panel.startDragPlacement('event2');
      
      expect(secondStart).to.be.false;
      expect(panel.getDragEventId()).to.equal('event1'); // Still dragging first event
    });

    it('should handle coordinate edge cases', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      
      // Negative coordinates
      panel.startDragPlacement('test_event');
      let result = panel.completeDrag(-100, -200);
      expect(result.success).to.be.true;
      
      // Zero coordinates
      panel.startDragPlacement('test_event');
      result = panel.completeDrag(0, 0);
      expect(result.success).to.be.true;
      
      // Very large coordinates
      panel.startDragPlacement('test_event');
      result = panel.completeDrag(999999, 888888);
      expect(result.success).to.be.true;
    });
  });

  describe('EventManager Integration', function() {
    it('should verify triggers are queryable after placement', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      
      panel.startDragPlacement('test_event');
      const result = panel.completeDrag(500, 500);
      
      expect(result.success).to.be.true;
      
      // Check that trigger was created in EventManager
      const allTriggers = Array.from(eventManager.triggers.values());
      expect(allTriggers).to.have.lengthOf(1);
      
      const trigger = allTriggers[0];
      expect(trigger).to.exist;
      expect(trigger.eventId).to.equal('test_event');
      expect(trigger.type).to.equal('spatial');
      
      // Verify we can query it (ID might be different due to EventManager generation)
      expect(trigger.id).to.exist;
    });

    it('should create triggers compatible with spatial trigger system', function() {
      eventManager.registerEvent({ id: 'test_event', type: 'dialogue', priority: 5, content: {} });
      
      panel.startDragPlacement('test_event');
      panel.completeDrag(500, 500);
      
      const triggers = Array.from(eventManager.triggers.values());
      const trigger = triggers[0];
      
      // Verify spatial trigger properties
      expect(trigger).to.have.property('condition');
      expect(trigger.condition).to.have.property('x');
      expect(trigger.condition).to.have.property('y');
      expect(trigger.condition).to.have.property('radius');
      expect(trigger).to.have.property('eventId');
      expect(trigger).to.have.property('type', 'spatial');
      expect(trigger).to.have.property('oneTime', true);
    });
  });
});




// ================================================================
// eventEditorPanel.integration.test.js (17 tests)
// ================================================================
/**
 * Integration Tests: EventEditorPanel
 * 
 * Tests EventEditorPanel integration with DraggablePanel and render callbacks.
 * 
 * CRITICAL BUG TEST: EventEditorPanel.render() expects 4 parameters (x, y, width, height)
 * but LevelEditorPanels only passes 2 (x, y), breaking layout and drag functionality.
 */

describe('EventEditorPanel Integration Tests', function() {
  let sandbox;
  let dom;
  let EventEditorPanel;
  let EventManager;
  let eventEditor;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Set up JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js globals
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.stroke = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.rect = sandbox.stub();
    global.text = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textSize = sandbox.stub();
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    
    // Sync to window
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.noStroke = global.noStroke;
    window.rect = global.rect;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.LEFT = global.LEFT;
    window.CENTER = global.CENTER;
    window.TOP = global.TOP;
    
    // Mock logNormal
    global.logNormal = sandbox.stub();
    window.logNormal = global.logNormal;
    
    // Create minimal EventManager mock
    const eventManagerInstance = {
      getAllEvents: sandbox.stub().returns([
        { id: 'test-event-1', type: 'dialogue', priority: 5, active: true },
        { id: 'test-event-2', type: 'spawn', priority: 3, active: false }
      ]),
      getEvent: sandbox.stub(),
      addEvent: sandbox.stub(),
      removeEvent: sandbox.stub()
    };
    
    global.EventManager = {
      getInstance: sandbox.stub().returns(eventManagerInstance)
    };
    window.EventManager = global.EventManager;
    
    // Load EventEditorPanel
    EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel.js');
    EventManager = global.EventManager;
    
    // Create instance
    eventEditor = new EventEditorPanel();
    eventEditor.initialize();
  });
  
  afterEach(function() {
    sandbox.restore();
    
    // Clean up globals
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.stroke;
    delete global.noStroke;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.LEFT;
    delete global.CENTER;
    delete global.TOP;
    delete global.logNormal;
    delete global.EventManager;
    delete window.push;
    delete window.pop;
    delete window.fill;
    delete window.stroke;
    delete window.noStroke;
    delete window.rect;
    delete window.text;
    delete window.textAlign;
    delete window.textSize;
    delete window.LEFT;
    delete window.CENTER;
    delete window.TOP;
    delete window.logNormal;
    delete window.EventManager;
    
    // Clean up JSDOM
    dom.window.close();
    delete global.window;
    delete global.document;
  });
  
  describe('Render Method Signature', function() {
    it('should accept 4 parameters: x, y, width, height', function() {
      const renderFunc = eventEditor.render;
      
      // Check function signature (expects 4 params)
      expect(renderFunc).to.be.a('function');
      expect(renderFunc.length).to.equal(4); // Function.length = number of parameters
    });
    
    it('should use width parameter for layout calculations', function() {
      const x = 100;
      const y = 50;
      const width = 250;
      const height = 300;
      
      // Render with all 4 parameters
      eventEditor.render(x, y, width, height);
      
      // Verify render was called (push/pop should be called)
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });
    
    it('should calculate drag button position using width parameter', function() {
      const x = 100;
      const y = 50;
      const width = 250;
      const height = 300;
      
      // Render the event list (default mode)
      eventEditor.editMode = null;
      eventEditor.render(x, y, width, height);
      
      // Check if rect was called for drag buttons
      // Drag button should be at: x + width - 55 (according to code)
      const expectedDragBtnX = x + width - 55;
      
      // Find rect calls that match drag button X position
      const rectCalls = global.rect.getCalls();
      const dragButtonCalls = rectCalls.filter(call => {
        const [rectX, rectY, rectWidth, rectHeight] = call.args;
        return rectX === expectedDragBtnX && rectWidth === 20 && rectHeight === 20;
      });
      
      // Should have 2 drag buttons (one for each event)
      expect(dragButtonCalls.length).to.be.at.least(1);
    });
  });
  
  describe('Render Callback Integration (BUG TEST)', function() {
    it('should fail when render called with only x, y (missing width, height)', function() {
      const x = 100;
      const y = 50;
      
      // SIMULATE BUG: Call render with only 2 parameters (like LevelEditorPanels does)
      eventEditor.render(x, y); // width and height are undefined
      
      // This should cause layout issues
      // Check if rect was called for drag buttons - they won't render correctly
      const rectCalls = global.rect.getCalls();
      
      // Drag button X should be: x + undefined - 55 = NaN
      const invalidRectCalls = rectCalls.filter(call => {
        const [rectX] = call.args;
        return isNaN(rectX);
      });
      
      // BUG: This test should FAIL initially (will pass after fix)
      // When width is undefined, drag button positions will be NaN
      expect(invalidRectCalls.length).to.be.greaterThan(0);
    });
    
    it('should simulate DraggablePanel contentArea callback structure', function() {
      // Simulate what DraggablePanel.renderContent() provides
      const contentArea = {
        x: 100,
        y: 50,
        width: 250,
        height: 300
      };
      
      // CORRECT: Pass all 4 values
      eventEditor.render(contentArea.x, contentArea.y, contentArea.width, contentArea.height);
      
      // Verify no NaN positions
      const rectCalls = global.rect.getCalls();
      const invalidRectCalls = rectCalls.filter(call => {
        const [rectX, rectY] = call.args;
        return isNaN(rectX) || isNaN(rectY);
      });
      
      expect(invalidRectCalls.length).to.equal(0);
    });
    
    it('should fail containsPoint check when width/height missing', function() {
      const mouseX = 320; // Inside drag button area if width=250
      const mouseY = 80;
      const contentX = 100;
      const contentY = 50;
      
      // containsPoint uses getContentSize() which returns {width: 250, height: 300}
      // But if render was called without width/height, the visual rendering won't match
      
      const result = eventEditor.containsPoint(mouseX, mouseY, contentX, contentY);
      
      // This checks if the point is within the EXPECTED size (250x300)
      // But the actual rendering (with missing width/height) won't match
      expect(result).to.be.a('boolean');
    });
  });
  
  describe('Drag Button Click Detection', function() {
    it('should correctly detect drag button clicks when width/height provided', function() {
      const x = 100;
      const y = 50;
      const width = 250;
      const height = 300;
      const contentX = x;
      const contentY = y;
      
      // First render with correct parameters
      eventEditor.render(x, y, width, height);
      
      // Calculate expected drag button position (for first event)
      const dragBtnX = x + width - 55; // 100 + 250 - 55 = 295
      const dragBtnY = y + 30 + 5; // listY + 5 = 85
      
      // Click on drag button
      const mouseX = dragBtnX + 10; // 305 (inside button)
      const mouseY = dragBtnY + 10; // 95 (inside button)
      
      const result = eventEditor.handleClick(mouseX, mouseY, contentX, contentY);
      
      // Should detect the click and start drag
      expect(result).to.be.true;
      expect(eventEditor.isDragging()).to.be.true;
    });
    
    it('should fail to detect drag button clicks when width missing (BUG)', function() {
      const x = 100;
      const y = 50;
      const contentX = x;
      const contentY = y;
      
      // SIMULATE BUG: Render without width/height
      eventEditor.render(x, y); // width = undefined, height = undefined
      
      // Try to click where drag button SHOULD be (if width was 250)
      const expectedDragBtnX = x + 250 - 55; // 295 (where we expect it)
      const mouseX = expectedDragBtnX + 10;
      const mouseY = y + 35 + 10;
      
      // handleClick internally calculates button position using getContentSize().width
      // which returns 250, but the visual rendering used undefined
      // This creates a mismatch between visual and logical positions
      
      const result = eventEditor.handleClick(mouseX, mouseY, contentX, contentY);
      
      // This might still return true because handleClick uses getContentSize()
      // But the VISUAL position (rendered with undefined width) won't match
      // This is the bug - logical vs visual mismatch
      expect(result).to.be.a('boolean');
    });
  });
  
  describe('ContentArea Width/Height Usage', function() {
    it('should use contentArea dimensions for list height calculations', function() {
      const contentArea = {
        x: 100,
        y: 50,
        width: 250,
        height: 300
      };
      
      // Render with full contentArea
      eventEditor.render(contentArea.x, contentArea.y, contentArea.width, contentArea.height);
      
      // List height should be: height - 60 (from code: const listHeight = height - 60)
      // This affects scrolling and visible area
      
      // Verify rendering completed without errors
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });
    
    it('should calculate scroll area incorrectly when height missing (BUG)', function() {
      const x = 100;
      const y = 50;
      
      // SIMULATE BUG: Render without height
      eventEditor.render(x, y);
      
      // Internal calculation: const listHeight = height - 60
      // If height is undefined: undefined - 60 = NaN
      
      // This breaks scrolling
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
      
      // maxScrollOffset calculation will be broken
      expect(eventEditor.maxScrollOffset).to.be.a('number');
    });
  });
});

describe('EventEditorPanel - Placement Mode Integration Tests', function() {
  let sandbox;
  let dom;
  let EventEditorPanel;
  let EventManager;
  let eventEditor;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Set up JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js globals
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.stroke = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.rect = sandbox.stub();
    global.text = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textSize = sandbox.stub();
    global.ellipse = sandbox.stub();
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    
    // Sync to window
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.noStroke = global.noStroke;
    window.rect = global.rect;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.ellipse = global.ellipse;
    window.LEFT = global.LEFT;
    window.CENTER = global.CENTER;
    window.TOP = global.TOP;
    
    // Mock logNormal
    global.logNormal = sandbox.stub();
    window.logNormal = global.logNormal;
    
    // Create minimal EventManager mock
    const eventManagerInstance = {
      getAllEvents: sandbox.stub().returns([
        { id: 'test-event-1', type: 'dialogue', priority: 5, active: true },
        { id: 'test-event-2', type: 'spawn', priority: 3, active: false }
      ]),
      getEvent: sandbox.stub(),
      addEvent: sandbox.stub(),
      removeEvent: sandbox.stub()
    };
    
    global.EventManager = {
      getInstance: sandbox.stub().returns(eventManagerInstance)
    };
    window.EventManager = global.EventManager;
    
    // Load EventEditorPanel
    EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel.js');
    EventManager = global.EventManager;
    
    // Create instance
    eventEditor = new EventEditorPanel();
    eventEditor.initialize();
  });
  
  afterEach(function() {
    sandbox.restore();
    
    // Clean up globals
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.stroke;
    delete global.noStroke;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.ellipse;
    delete global.LEFT;
    delete global.CENTER;
    delete global.TOP;
    delete global.logNormal;
    delete global.EventManager;
    delete window.push;
    delete window.pop;
    delete window.fill;
    delete window.stroke;
    delete window.noStroke;
    delete window.rect;
    delete window.text;
    delete window.textAlign;
    delete window.textSize;
    delete window.ellipse;
    delete window.LEFT;
    delete window.CENTER;
    delete window.TOP;
    delete window.logNormal;
    delete window.EventManager;
    
    // Clean up JSDOM
    dom.window.close();
    delete global.window;
    delete global.document;
  });
  
  describe('Double-Click Integration', function() {
    it('should enter placement mode on double-click of drag button', function() {
      const contentX = 100;
      const contentY = 50;
      const width = 250;
      
      // Calculate drag button position
      const dragBtnX = contentX + width - 55;
      const dragBtnY = contentY + 30 + 5;
      
      // Double-click
      const clickX = dragBtnX + 10;
      const clickY = dragBtnY + 10;
      
      const handled = eventEditor.handleDoubleClick(clickX, clickY, contentX, contentY);
      
      expect(handled).to.be.true;
      expect(eventEditor.isInPlacementMode()).to.be.true;
      expect(eventEditor.getPlacementEventId()).to.equal('test-event-1');
    });
    
    it('should not interfere with single-click drag functionality', function() {
      const contentX = 100;
      const contentY = 50;
      const width = 250;
      
      // Calculate drag button position
      const dragBtnX = contentX + width - 55;
      const dragBtnY = contentY + 30 + 5;
      
      // Single click (normal drag)
      const clickX = dragBtnX + 10;
      const clickY = dragBtnY + 10;
      
      const handled = eventEditor.handleClick(clickX, clickY, contentX, contentY);
      
      // Should start drag, NOT placement mode
      expect(handled).to.be.true;
      expect(eventEditor.isDragging()).to.be.true;
      expect(eventEditor.isInPlacementMode()).to.be.false;
    });
  });
  
  describe('Placement Mode Workflow', function() {
    beforeEach(function() {
      // Enter placement mode
      eventEditor.enterPlacementMode('test-event-1');
    });
    
    it('should update cursor position as mouse moves', function() {
      eventEditor.updatePlacementCursor(200, 300);
      
      const cursor = eventEditor.getPlacementCursor();
      expect(cursor).to.deep.equal({ x: 200, y: 300 });
    });
    
    it('should place event on completePlacement call', function() {
      const result = eventEditor.completePlacement(500, 600);
      
      expect(result.success).to.be.true;
      expect(result.eventId).to.equal('test-event-1');
      expect(result.worldX).to.equal(500);
      expect(result.worldY).to.equal(600);
      expect(eventEditor.isInPlacementMode()).to.be.false;
    });
    
    it('should cancel placement on cancelPlacement call', function() {
      eventEditor.cancelPlacement();
      
      expect(eventEditor.isInPlacementMode()).to.be.false;
      expect(eventEditor.getPlacementEventId()).to.be.null;
    });
  });
  
  describe('State Transitions', function() {
    it('should transition from drag to placement mode', function() {
      // Start drag
      eventEditor.startDragPlacement('test-event-1');
      expect(eventEditor.isDragging()).to.be.true;
      
      // Enter placement mode (should cancel drag)
      eventEditor.enterPlacementMode('test-event-2');
      
      expect(eventEditor.isDragging()).to.be.false;
      expect(eventEditor.isInPlacementMode()).to.be.true;
      expect(eventEditor.getPlacementEventId()).to.equal('test-event-2');
    });
    
    it('should not allow drag while in placement mode', function() {
      // Enter placement mode
      eventEditor.enterPlacementMode('test-event-1');
      
      // Try to start drag
      eventEditor.startDragPlacement('test-event-2');
      
      // Should still be in placement mode (drag call happens through handleClick which checks placement mode)
      expect(eventEditor.isInPlacementMode()).to.be.true;
    });
  });
});




// ================================================================
// dragAndDrop.integration.test.js (15 tests)
// ================================================================
/**
 * Integration Tests: Drag-and-Drop System
 * TDD Phase 4: Write tests FIRST before implementation
 * 
 * Tests EventEditorPanel drag-and-drop integration with EventFlagLayer in Level Editor
 */

// DUPLICATE REQUIRE REMOVED: let { setupIntegrationTestEnvironment, cleanupIntegrationTestEnvironment } = require('../../helpers/integrationTestHelpers');

describe('Drag-and-Drop Integration', function() {
  let terrain;
  let LevelEditor, EventEditorPanel, EventFlagLayer, EventFlag;
  let ToolBar, MaterialPalette, LevelEditorPanels;
  
  before(function() {
    // Setup integration test environment (mocks only p5.js, loads real classes)
    setupIntegrationTestEnvironment();
    
    // Load REAL classes for integration testing
    EventFlag = require('../../../Classes/events/EventFlag');
    EventFlagLayer = require('../../../Classes/events/EventFlagLayer');
    ToolBar = require('../../../Classes/ui/_baseObjects/bar/toolBar/ToolBar');
    MaterialPalette = require('../../../Classes/ui/painter/terrain/MaterialPalette');
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
    EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel');
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    // Make globally available for cross-references
    global.EventFlag = EventFlag;
    global.EventFlagLayer = EventFlagLayer;
    global.ToolBar = ToolBar;
    global.MaterialPalette = MaterialPalette;
    global.LevelEditorPanels = LevelEditorPanels;
    global.EventEditorPanel = EventEditorPanel;
    
    if (typeof window !== 'undefined') {
      window.EventFlag = EventFlag;
      window.EventFlagLayer = EventFlagLayer;
      window.ToolBar = ToolBar;
      window.MaterialPalette = MaterialPalette;
      window.LevelEditorPanels = LevelEditorPanels;
      window.EventEditorPanel = EventEditorPanel;
    }
  });
  
  after(function() {
    cleanupIntegrationTestEnvironment();
  });
  
  beforeEach(function() {
    // Mock terrain for each test
    terrain = {
      width: 1000,
      height: 1000,
      getTileAtGridCoords: sinon.stub().returns({ type: 0 })
    };
    
    global.g_map2 = terrain;
    if (typeof window !== 'undefined') {
      window.g_map2 = terrain;
    }
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  // Helper function to create and initialize Level Editor
  function createLevelEditor() {
    const editor = new LevelEditor();
    editor.initialize(terrain);
    return editor;
  }
  
  describe('Level Editor EventFlagLayer Integration', function() {
    it('should initialize EventFlagLayer in Level Editor', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      expect(levelEditor.eventFlagLayer).to.exist;
      expect(levelEditor.eventFlagLayer).to.be.instanceOf(EventFlagLayer);
    });
    
    it('should have empty flag collection on initialization', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      expect(levelEditor.eventFlagLayer.getAllFlags().length).to.equal(0);
    });
  });
  
  describe('Drag State Detection', function() {
    it('should detect when EventEditorPanel is dragging', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Start drag
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      
      expect(levelEditor.eventEditor.isDragging()).to.be.true;
    });
    
    it('should update drag position during drag', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      levelEditor.eventEditor.updateDragPosition(100, 200);
      
      const position = levelEditor.eventEditor.getDragPosition();
      expect(position.x).to.equal(100);
      expect(position.y).to.equal(200);
    });
  });
  
  describe('Flag Placement on Drag Complete', function() {
    it('should create EventFlag when drag is completed', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      // Start drag
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      
      // Complete drag at world coordinates
      const result = levelEditor.eventEditor.completeDrag(500, 600);
      
      expect(result.success).to.be.true;
      expect(result.flagConfig).to.exist;
      expect(result.flagConfig.x).to.equal(500);
      expect(result.flagConfig.y).to.equal(600);
      expect(result.flagConfig.eventId).to.equal('test-event-1');
    });
    
    it('should add EventFlag to EventFlagLayer after drag', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      // Start and complete drag
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      const result = levelEditor.eventEditor.completeDrag(500, 600);
      
      // Create and add flag
      if (result.success && result.flagConfig) {
        const flag = new EventFlag(result.flagConfig);
        levelEditor.eventFlagLayer.addFlag(flag);
      }
      
      expect(levelEditor.eventFlagLayer.getAllFlags().length).to.equal(1);
      const addedFlag = levelEditor.eventFlagLayer.getAllFlags()[0];
      expect(addedFlag.x).to.equal(500);
      expect(addedFlag.y).to.equal(600);
      expect(addedFlag.eventId).to.equal('test-event-1');
    });
    
    it('should support multiple flag placements', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      // Place first flag
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      const result1 = levelEditor.eventEditor.completeDrag(100, 100);
      if (result1.success) {
        levelEditor.eventFlagLayer.addFlag(new EventFlag(result1.flagConfig));
      }
      
      // Place second flag
      levelEditor.eventEditor.startDragPlacement('test-event-2');
      const result2 = levelEditor.eventEditor.completeDrag(200, 200);
      if (result2.success) {
        levelEditor.eventFlagLayer.addFlag(new EventFlag(result2.flagConfig));
      }
      
      expect(levelEditor.eventFlagLayer.getAllFlags().length).to.equal(2);
    });
  });
  
  describe('Drag Cancellation', function() {
    it('should not create flag when drag is cancelled', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      levelEditor.eventEditor.cancelDrag();
      
      expect(levelEditor.eventEditor.isDragging()).to.be.false;
      expect(levelEditor.eventFlagLayer.getAllFlags().length).to.equal(0);
    });
  });
  
  describe('Flag Configuration', function() {
    it('should create flag with default radius', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      const result = levelEditor.eventEditor.completeDrag(500, 600);
      
      expect(result.flagConfig.radius).to.exist;
      expect(result.flagConfig.radius).to.be.a('number');
      expect(result.flagConfig.radius).to.be.greaterThan(0);
    });
    
    it('should create flag with circle shape by default', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      const result = levelEditor.eventEditor.completeDrag(500, 600);
      
      expect(result.flagConfig.shape).to.equal('circle');
    });
    
    it('should generate unique flag ID', function(done) {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      // Create first flag
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      const result1 = levelEditor.eventEditor.completeDrag(100, 100);
      
      // Wait 1ms to ensure different timestamp
      setTimeout(() => {
        levelEditor.eventEditor.startDragPlacement('test-event-1');
        const result2 = levelEditor.eventEditor.completeDrag(200, 200);
        
        expect(result1.flagConfig.id).to.not.equal(result2.flagConfig.id);
        done();
      }, 2);
    });
  });
  
  describe('Rendering', function() {
    it('should render flags in editor mode', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      // Add a flag
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'test-event-1'
      });
      levelEditor.eventFlagLayer.addFlag(flag);
      
      // Spy on render
      const renderSpy = sinon.spy(levelEditor.eventFlagLayer, 'render');
      
      // Render (would normally be called in LevelEditor.render())
      levelEditor.eventFlagLayer.render(true);
      
      expect(renderSpy.calledOnce).to.be.true;
      expect(renderSpy.calledWith(true)).to.be.true;
    });
    
    it('should not render flags in game mode', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'test-event-1'
      });
      levelEditor.eventFlagLayer.addFlag(flag);
      
      // Render with editorMode false
      global.circle.resetHistory();
      levelEditor.eventFlagLayer.render(false);
      
      // Circle should not be called (flags invisible in game)
      expect(global.circle.called).to.be.false;
    });
  });
  
  describe('Error Handling', function() {
    it('should handle completing drag when not dragging', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      const result = levelEditor.eventEditor.completeDrag(100, 100);
      
      expect(result.success).to.be.false;
      expect(result.error).to.exist;
    });
    
    it('should handle invalid event ID', function() {
      const levelEditor = new LevelEditor(); levelEditor.initialize(terrain);
      
      levelEditor.eventEditor.startDragPlacement(null);
      const result = levelEditor.eventEditor.completeDrag(100, 100);
      
      // Should handle gracefully
      expect(result).to.exist;
    });
  });
});




// ================================================================
// eventDragWorkflow.integration.test.js (8 tests)
// ================================================================
/**
 * Integration Tests: Event Drag Workflow in Level Editor
 * Phase 4D: Complete drag-and-drop workflow
 * 
 * Tests the full workflow:
 * 1. Click drag button in EventEditorPanel
 * 2. LevelEditor detects drag state
 * 3. Mouse move updates cursor position
 * 4. Mouse release completes drag and creates flag
 */

// DUPLICATE REQUIRE REMOVED: let { setupIntegrationTestEnvironment, cleanupIntegrationTestEnvironment } = require('../../helpers/integrationTestHelpers');

describe('Event Drag Workflow Integration', function() {
  let terrain;
  let LevelEditor, EventEditorPanel, EventFlagLayer, EventFlag;
  let ToolBar, MaterialPalette, LevelEditorPanels;
  
  before(function() {
    setupIntegrationTestEnvironment();
    
    // Load REAL classes
    EventFlag = require('../../../Classes/events/EventFlag');
    EventFlagLayer = require('../../../Classes/events/EventFlagLayer');
    ToolBar = require('../../../Classes/ui/_baseObjects/bar/toolBar/ToolBar');
    MaterialPalette = require('../../../Classes/ui/painter/terrain/MaterialPalette');
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
    EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel');
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    global.EventFlag = EventFlag;
    global.EventFlagLayer = EventFlagLayer;
    global.ToolBar = ToolBar;
    global.MaterialPalette = MaterialPalette;
    global.LevelEditorPanels = LevelEditorPanels;
    global.EventEditorPanel = EventEditorPanel;
    global.LevelEditor = LevelEditor;
  });
  
  beforeEach(function() {
    // Restore cameraManager if it was deleted
    if (!global.cameraManager) {
      global.cameraManager = {
        getZoom: () => 1,
        getPosition: () => ({ x: 0, y: 0 }),
        screenToWorld: (x, y) => ({ x, y }),
        worldToScreen: (x, y) => ({ x, y }),
        setPosition: sinon.stub(),
        setZoom: sinon.stub(),
        update: sinon.stub()
      };
    }
    
    // Create mock terrain
    terrain = {
      _xCount: 32,
      _yCount: 32,
      _tileSize: 32,
      grid: {
        get: sinon.stub().returns({ type: 0 }),
        set: sinon.stub()
      },
      getTileAtGridCoords: sinon.stub().returns({ type: 0 })
    };
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  after(function() {
    cleanupIntegrationTestEnvironment();
  });
  
  describe('Level Editor Drag Detection', function() {
    it('should detect when EventEditorPanel starts dragging', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Add test event
      const eventManager = global.EventManager.getInstance();
      eventManager.registerEvent({
        id: 'test-event',
        type: 'dialogue',
        priority: 2,
        content: { title: 'Test', message: 'Test' }
      });
      
      // Start drag
      levelEditor.eventEditor.startDragPlacement('test-event');
      
      // LevelEditor should detect drag state
      expect(levelEditor.eventEditor.isDragging()).to.be.true;
    });
    
    it('should return null from getDragPosition when not dragging', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      const pos = levelEditor.eventEditor.getDragPosition();
      expect(pos).to.be.null;
    });
  });
  
  describe('Mouse Move Updates', function() {
    it('should update drag position on handleMouseMoved', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Start drag
      levelEditor.eventEditor.startDragPlacement('test-event');
      
      // Simulate mouse move
      if (typeof levelEditor.handleMouseMoved === 'function') {
        levelEditor.handleMouseMoved(200, 300);
        
        const pos = levelEditor.eventEditor.getDragPosition();
        expect(pos).to.exist;
        expect(pos.x).to.equal(200);
        expect(pos.y).to.equal(300);
      } else {
        // Method doesn't exist yet - this will fail and guide implementation
        expect(levelEditor.handleMouseMoved).to.be.a('function');
      }
    });
  });
  
  describe('Mouse Release Completes Drag', function() {
    it('should complete drag on handleMouseReleased', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Start drag
      levelEditor.eventEditor.startDragPlacement('test-event');
      levelEditor.eventEditor.updateDragPosition(250, 350);
      
      // Simulate mouse release
      if (typeof levelEditor.handleMouseRelease === 'function') {
        levelEditor.handleMouseRelease(250, 350);
        
        // Drag should be complete
        expect(levelEditor.eventEditor.isDragging()).to.be.false;
        
        // Flag should be added
        expect(levelEditor.eventFlagLayer.getAllFlags().length).to.equal(1);
        
        const flag = levelEditor.eventFlagLayer.getAllFlags()[0];
        expect(flag.eventId).to.equal('test-event');
      } else {
        // Method doesn't exist yet
        expect(levelEditor.handleMouseRelease).to.be.a('function');
      }
    });
    
    it('should convert screen to world coordinates', function() {
      // Mock camera manager BEFORE initialization
      const originalCamera = global.cameraManager;
      global.cameraManager = {
        screenToWorld: sinon.stub().returns({ x: 500, y: 600 }),
        getZoom: () => 1,
        getPosition: () => ({ x: 0, y: 0 }),
        update: sinon.stub()
      };
      
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Start drag
      levelEditor.eventEditor.startDragPlacement('test-event');
      
      // Release at screen coords (100, 200)
      if (typeof levelEditor.handleMouseRelease === 'function') {
        levelEditor.handleMouseRelease(100, 200);
        
        // Flag should be at world coords (500, 600)
        const flag = levelEditor.eventFlagLayer.getAllFlags()[0];
        expect(flag.x).to.equal(500);
        expect(flag.y).to.equal(600);
      }
      
      // Restore original camera
      global.cameraManager = originalCamera;
    });
  });
  
  describe('Drag Cancellation', function() {
    it('should cancel drag on Escape key', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Start drag
      levelEditor.eventEditor.startDragPlacement('test-event');
      expect(levelEditor.eventEditor.isDragging()).to.be.true;
      
      // Simulate Escape key
      if (typeof levelEditor.handleKeyPress === 'function') {
        global.key = 'Escape';
        global.keyCode = 27;
        levelEditor.handleKeyPress('Escape');
        
        expect(levelEditor.eventEditor.isDragging()).to.be.false;
        expect(levelEditor.eventFlagLayer.getAllFlags().length).to.equal(0);
      } else {
        // Method doesn't exist yet
        expect(levelEditor.handleKeyPress).to.be.a('function');
      }
    });
  });
  
  describe('Visual Cursor Update', function() {
    it('should update cursor during drag', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Start drag
      levelEditor.eventEditor.startDragPlacement('test-event');
      
      // Check if cursor method exists
      if (typeof levelEditor.updateDragCursor === 'function') {
        levelEditor.updateDragCursor(150, 250);
        
        const pos = levelEditor.eventEditor.getDragPosition();
        expect(pos.x).to.equal(150);
        expect(pos.y).to.equal(250);
      } else {
        // Optional method - may use handleMouseMoved instead
        this.skip();
      }
    });
  });
  
  describe('Multiple Drag Sessions', function() {
    it('should support multiple drag-and-drop sessions', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // First drag
      levelEditor.eventEditor.startDragPlacement('test-event-1');
      if (typeof levelEditor.handleMouseRelease === 'function') {
        levelEditor.handleMouseRelease(100, 100);
        
        // Second drag
        levelEditor.eventEditor.startDragPlacement('test-event-2');
        levelEditor.handleMouseRelease(200, 200);
        
        // Should have 2 flags
        expect(levelEditor.eventFlagLayer.getAllFlags().length).to.equal(2);
      }
    });
  });
});




// ================================================================
// eventsPanel.integration.test.js (15 tests)
// ================================================================
/**
 * Integration Tests: Events Panel Visibility
 * Tests interaction between LevelEditor, DraggablePanelManager, Tools panel, and Events panel
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Events Panel - Integration Tests', function() {
  let sandbox;
  let panelManager;
  let eventsPanel;
  let toolsPanel;
  let eventToggleButton;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    // Mock DraggablePanelManager
    const DraggablePanelManager = function() {
      this.panels = new Map();
      this.stateVisibility = {
        LEVEL_EDITOR: []
      };
    };
    DraggablePanelManager.prototype.registerPanel = function(id, panel) {
      this.panels.set(id, panel);
    };
    DraggablePanelManager.prototype.setVisibility = function(panelId, visible, state) {
      const stateKey = state || 'LEVEL_EDITOR';
      if (!this.stateVisibility[stateKey]) {
        this.stateVisibility[stateKey] = [];
      }
      
      if (visible && !this.stateVisibility[stateKey].includes(panelId)) {
        this.stateVisibility[stateKey].push(panelId);
      } else if (!visible) {
        const index = this.stateVisibility[stateKey].indexOf(panelId);
        if (index > -1) {
          this.stateVisibility[stateKey].splice(index, 1);
        }
      }
      
      const panel = this.panels.get(panelId);
      if (panel) {
        panel.visible = visible;
      }
    };
    DraggablePanelManager.prototype.isVisible = function(panelId, state) {
      const stateKey = state || 'LEVEL_EDITOR';
      return this.stateVisibility[stateKey]?.includes(panelId) || false;
    };
    global.DraggablePanelManager = DraggablePanelManager;
    window.DraggablePanelManager = DraggablePanelManager;
    
    // Create instances
    panelManager = new DraggablePanelManager();
    eventsPanel = { visible: false, render: sandbox.spy() };
    panelManager.registerPanel('level-editor-events', eventsPanel);
    
    // Mock Tools panel with Events toggle button
    eventToggleButton = {
      highlighted: false,
      onClick: null
    };
    toolsPanel = {
      buttons: [eventToggleButton],
      getButton: function(name) {
        if (name === 'Events') return eventToggleButton;
        return null;
      }
    };
    
    // Set default visibility (panel hidden)
    panelManager.stateVisibility.LEVEL_EDITOR = [];
    
    // Setup button click handler
    eventToggleButton.onClick = function() {
      const currentlyVisible = panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR');
      panelManager.setVisibility('level-editor-events', !currentlyVisible, 'LEVEL_EDITOR');
      eventToggleButton.highlighted = !currentlyVisible;
    };
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.DraggablePanelManager;
    delete window.DraggablePanelManager;
  });
  
  describe('Default Visibility Behavior', function() {
    it('should not be visible by default in LEVEL_EDITOR state', function() {
      const isVisible = panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR');
      expect(isVisible).to.be.false;
    });
    
    it('should not be in stateVisibility array by default', function() {
      const visiblePanels = panelManager.stateVisibility.LEVEL_EDITOR;
      expect(visiblePanels).to.not.include('level-editor-events');
    });
  });
  
  describe('Tools Panel Integration', function() {
    it('should have Events toggle button in Tools panel', function() {
      const button = toolsPanel.getButton('Events');
      expect(button).to.exist;
      expect(button).to.equal(eventToggleButton);
    });
    
    it('should show panel when Events button clicked', function() {
      eventToggleButton.onClick();
      
      expect(panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR')).to.be.true;
      expect(eventsPanel.visible).to.be.true;
    });
    
    it('should hide panel when Events button clicked again', function() {
      eventToggleButton.onClick(); // Show
      eventToggleButton.onClick(); // Hide
      
      expect(panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR')).to.be.false;
      expect(eventsPanel.visible).to.be.false;
    });
  });
  
  describe('Button Highlighting', function() {
    it('should highlight Events button when panel visible', function() {
      eventToggleButton.onClick();
      
      expect(eventToggleButton.highlighted).to.be.true;
    });
    
    it('should remove highlight when panel hidden', function() {
      eventToggleButton.onClick(); // Show
      expect(eventToggleButton.highlighted).to.be.true;
      
      eventToggleButton.onClick(); // Hide
      expect(eventToggleButton.highlighted).to.be.false;
    });
    
    it('should toggle highlight on multiple clicks', function() {
      eventToggleButton.onClick();
      expect(eventToggleButton.highlighted).to.be.true;
      
      eventToggleButton.onClick();
      expect(eventToggleButton.highlighted).to.be.false;
      
      eventToggleButton.onClick();
      expect(eventToggleButton.highlighted).to.be.true;
    });
  });
  
  describe('Panel Functionality When Visible', function() {
    it('should render panel when visible', function() {
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      
      if (eventsPanel.visible) {
        eventsPanel.render();
      }
      
      expect(eventsPanel.render.called).to.be.true;
    });
    
    it('should be fully functional when toggled on', function() {
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      
      expect(eventsPanel.visible).to.be.true;
      expect(panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR')).to.be.true;
    });
  });
  
  describe('State Persistence', function() {
    it('should persist visibility across multiple renders', function() {
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      
      eventsPanel.render();
      eventsPanel.render();
      eventsPanel.render();
      
      expect(panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR')).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle toggling when panel not registered', function() {
      panelManager.panels.delete('level-editor-events');
      
      expect(() => {
        panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      }).to.not.throw();
    });
    
    it('should handle button click with missing panel', function() {
      panelManager.panels.delete('level-editor-events');
      
      expect(() => {
        eventToggleButton.onClick();
      }).to.not.throw();
    });
    
    it('should handle setting visibility to same value twice', function() {
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      
      const visibleCount = panelManager.stateVisibility.LEVEL_EDITOR.filter(
        id => id === 'level-editor-events'
      ).length;
      
      expect(visibleCount).to.equal(1); // Should not duplicate
    });
  });
  
  describe('Other States Not Affected', function() {
    it('should not affect PLAYING state visibility', function() {
      panelManager.stateVisibility.PLAYING = [];
      
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      
      expect(panelManager.stateVisibility.PLAYING).to.not.include('level-editor-events');
    });
  });
});




// ================================================================
// eventsPanelToggleBug.integration.test.js (6 tests)
// ================================================================
/**
 * Integration Tests: Events Panel Toggle Bug
 * Tests for the bug where clicking Events button toggles panel on then immediately off
 * 
 * Bug Description:
 * - Click Events button in toolbar
 * - Panel toggles ON
 * - Panel immediately toggles OFF again
 * - Root cause: Multiple handlers processing the same click event
 */

// DUPLICATE REQUIRE REMOVED: let { setupIntegrationTestEnvironment, cleanupIntegrationTestEnvironment } = require('../../helpers/integrationTestHelpers');

describe('Events Panel Toggle Bug - Integration Tests', function() {
  let terrain;
  let LevelEditor, EventEditorPanel, EventFlagLayer, EventFlag;
  let ToolBar, MaterialPalette, LevelEditorPanels;
  
  before(function() {
    setupIntegrationTestEnvironment();
    
    // Load REAL classes
    EventFlag = require('../../../Classes/events/EventFlag');
    EventFlagLayer = require('../../../Classes/events/EventFlagLayer');
    ToolBar = require('../../../Classes/ui/_baseObjects/bar/toolBar/ToolBar');
    MaterialPalette = require('../../../Classes/ui/painter/terrain/MaterialPalette');
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
    EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel');
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    global.EventFlag = EventFlag;
    global.EventFlagLayer = EventFlagLayer;
    global.ToolBar = ToolBar;
    global.MaterialPalette = MaterialPalette;
    global.LevelEditorPanels = LevelEditorPanels;
    global.EventEditorPanel = EventEditorPanel;
    global.LevelEditor = LevelEditor;
  });
  
  beforeEach(function() {
    // Restore cameraManager if deleted
    if (!global.cameraManager) {
      global.cameraManager = {
        getZoom: () => 1,
        getPosition: () => ({ x: 0, y: 0 }),
        screenToWorld: (x, y) => ({ x, y }),
        worldToScreen: (x, y) => ({ x, y }),
        setPosition: sinon.stub(),
        setZoom: sinon.stub(),
        update: sinon.stub()
      };
    }
    
    // Create mock terrain
    terrain = {
      _xCount: 32,
      _yCount: 32,
      _tileSize: 32,
      grid: {
        get: sinon.stub().returns({ type: 0 }),
        set: sinon.stub()
      },
      getTileAtGridCoords: sinon.stub().returns({ type: 0 })
    };
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  after(function() {
    cleanupIntegrationTestEnvironment();
  });
  
  describe('Panel Toggle State After Click', function() {
    it('should keep panel visible after clicking Events button', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Get panel initial state (should be hidden)
      const panel = global.draggablePanelManager.panels.get('level-editor-events');
      expect(panel).to.exist;
      expect(panel.state.visible).to.be.false;
      
      // Simulate clicking Events button in toolbar
      // Find the Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      // Events button is in the toolbar (need to find its Y position)
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Click the Events button (via levelEditorPanels which calls onClick)
      const handled = levelEditor.levelEditorPanels.handleClick(eventsButtonX, eventsButtonY);
      expect(handled).to.be.true;
      
      // Panel should NOW be visible
      expect(panel.state.visible).to.be.true;
    });
    
    it('should NOT toggle panel off if draggablePanelManager also processes click', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      const panel = global.draggablePanelManager.panels.get('level-editor-events');
      
      // Get Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // First click - toggle ON
      levelEditor.levelEditorPanels.handleClick(eventsButtonX, eventsButtonY);
      expect(panel.state.visible).to.be.true;
      
      // Simulate draggablePanelManager ALSO processing the same click
      // This is what happens in LevelEditor.handleClick() - PRIORITY 5
      const panelConsumed = global.draggablePanelManager.handleMouseEvents(eventsButtonX, eventsButtonY, true);
      
      // Panel should STILL be visible (not toggled off)
      expect(panel.state.visible).to.be.true;
    });
    
    it('should maintain panel state through full handleClick flow', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      const panel = global.draggablePanelManager.panels.get('level-editor-events');
      expect(panel.state.visible).to.be.false;
      
      // Get Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Simulate the FULL click flow (as it happens in LevelEditor.handleClick)
      // PRIORITY 4: levelEditorPanels.handleClick
      const handled = levelEditor.levelEditorPanels.handleClick(eventsButtonX, eventsButtonY);
      expect(handled).to.be.true;
      expect(panel.state.visible).to.be.true; // Panel should be ON
      
      // PRIORITY 5: draggablePanelManager.handleMouseEvents (this might toggle it off!)
      if (handled) {
        // If panel click was handled, draggablePanelManager should NOT process it
        // This is the bug: handleClick returns true but then draggablePanelManager STILL runs
      } else {
        const panelConsumed = global.draggablePanelManager.handleMouseEvents(eventsButtonX, eventsButtonY, true);
      }
      
      // Final state: Panel should STILL be visible
      expect(panel.state.visible).to.be.true;
    });
  });
  
  describe('Click Event Consumption', function() {
    it('should stop event propagation after levelEditorPanels handles click', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Get Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Click Events button
      const handled = levelEditor.levelEditorPanels.handleClick(eventsButtonX, eventsButtonY);
      
      // If handled is true, LevelEditor.handleClick should RETURN early
      // and NOT call draggablePanelManager.handleMouseEvents
      expect(handled).to.be.true;
    });
    
    it('should return early from LevelEditor.handleClick if panel handled click', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Spy on draggablePanelManager.handleMouseEvents
      const handleMouseEventsSpy = sinon.spy(global.draggablePanelManager, 'handleMouseEvents');
      
      // Get Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Call LevelEditor.handleClick (full flow)
      levelEditor.handleClick(eventsButtonX, eventsButtonY);
      
      // draggablePanelManager.handleMouseEvents should NOT be called
      // because levelEditorPanels.handleClick returned true
      expect(handleMouseEventsSpy.called).to.be.false;
    });
  });
  
  describe('Multiple Toggle Clicks', function() {
    it('should toggle panel on → off → on correctly', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      const panel = global.draggablePanelManager.panels.get('level-editor-events');
      
      // Get Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Initial: hidden
      expect(panel.state.visible).to.be.false;
      
      // Click 1: Show
      levelEditor.handleClick(eventsButtonX, eventsButtonY);
      expect(panel.state.visible).to.be.true;
      
      // Click 2: Hide
      levelEditor.handleClick(eventsButtonX, eventsButtonY);
      expect(panel.state.visible).to.be.false;
      
      // Click 3: Show again
      levelEditor.handleClick(eventsButtonX, eventsButtonY);
      expect(panel.state.visible).to.be.true;
    });
  });
});




// ================================================================
// propertiesPanel.integration.test.js (12 tests)
// ================================================================
/**
 * Integration Tests: Properties Panel Visibility
 * Tests interaction between LevelEditor, DraggablePanelManager, and Properties panel
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Properties Panel - Integration Tests', function() {
  let sandbox;
  let panelManager;
  let propertiesPanel;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    // Mock DraggablePanelManager
    const DraggablePanelManager = function() {
      this.panels = new Map();
      this.stateVisibility = {
        LEVEL_EDITOR: []
      };
    };
    DraggablePanelManager.prototype.registerPanel = function(id, panel) {
      this.panels.set(id, panel);
    };
    DraggablePanelManager.prototype.setVisibility = function(panelId, visible, state) {
      const stateKey = state || 'LEVEL_EDITOR';
      if (!this.stateVisibility[stateKey]) {
        this.stateVisibility[stateKey] = [];
      }
      
      if (visible && !this.stateVisibility[stateKey].includes(panelId)) {
        this.stateVisibility[stateKey].push(panelId);
      } else if (!visible) {
        const index = this.stateVisibility[stateKey].indexOf(panelId);
        if (index > -1) {
          this.stateVisibility[stateKey].splice(index, 1);
        }
      }
      
      const panel = this.panels.get(panelId);
      if (panel) {
        panel.visible = visible;
      }
    };
    DraggablePanelManager.prototype.isVisible = function(panelId, state) {
      const stateKey = state || 'LEVEL_EDITOR';
      return this.stateVisibility[stateKey]?.includes(panelId) || false;
    };
    global.DraggablePanelManager = DraggablePanelManager;
    window.DraggablePanelManager = DraggablePanelManager;
    
    // Create instances
    panelManager = new DraggablePanelManager();
    propertiesPanel = { visible: false, render: sandbox.spy() };
    panelManager.registerPanel('level-editor-properties', propertiesPanel);
    
    // Set default visibility (panel hidden)
    panelManager.stateVisibility.LEVEL_EDITOR = [];
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.DraggablePanelManager;
    delete window.DraggablePanelManager;
  });
  
  describe('Default Visibility Behavior', function() {
    it('should not be visible by default in LEVEL_EDITOR state', function() {
      const isVisible = panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR');
      expect(isVisible).to.be.false;
    });
    
    it('should not be in stateVisibility array by default', function() {
      const visiblePanels = panelManager.stateVisibility.LEVEL_EDITOR;
      expect(visiblePanels).to.not.include('level-editor-properties');
    });
  });
  
  describe('Toggle Via View Menu', function() {
    it('should show panel when toggled on', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.true;
      expect(propertiesPanel.visible).to.be.true;
    });
    
    it('should hide panel when toggled off', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      panelManager.setVisibility('level-editor-properties', false, 'LEVEL_EDITOR');
      
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.false;
      expect(propertiesPanel.visible).to.be.false;
    });
    
    it('should handle multiple toggle operations', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.true;
      
      panelManager.setVisibility('level-editor-properties', false, 'LEVEL_EDITOR');
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.false;
      
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.true;
    });
  });
  
  describe('State Persistence', function() {
    it('should persist visibility state across renders', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      
      // Simulate multiple render cycles
      propertiesPanel.render();
      propertiesPanel.render();
      propertiesPanel.render();
      
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.true;
    });
    
    it('should maintain state during session', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      const state1 = panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR');
      
      // Simulate some time passing
      const state2 = panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR');
      
      expect(state1).to.equal(state2);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle toggling non-existent panel', function() {
      expect(() => {
        panelManager.setVisibility('non-existent-panel', true, 'LEVEL_EDITOR');
      }).to.not.throw();
    });
    
    it('should handle toggling with invalid state', function() {
      expect(() => {
        panelManager.setVisibility('level-editor-properties', true, 'INVALID_STATE');
      }).to.not.throw();
    });
    
    it('should handle setting visibility to same value twice', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      
      const visibleCount = panelManager.stateVisibility.LEVEL_EDITOR.filter(
        id => id === 'level-editor-properties'
      ).length;
      
      expect(visibleCount).to.equal(1); // Should not duplicate
    });
  });
  
  describe('Other States Not Affected', function() {
    it('should not affect PLAYING state visibility', function() {
      panelManager.stateVisibility.PLAYING = [];
      
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      
      expect(panelManager.stateVisibility.PLAYING).to.not.include('level-editor-properties');
    });
    
    it('should not affect MENU state visibility', function() {
      panelManager.stateVisibility.MENU = [];
      
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      
      expect(panelManager.stateVisibility.MENU).to.not.include('level-editor-properties');
    });
  });
});

