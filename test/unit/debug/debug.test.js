/**
 * Consolidated Debug System Tests
 * Generated: 2025-10-29T03:11:41.167Z
 * Source files: 2
 * Total tests: 65
 * 
 * This file contains all debug system tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');
let sinon = require('sinon');


// ================================================================
// eventDebugManager.test.js (64 tests)
// ================================================================
/**
 * Unit Tests for EventDebugManager
 * Tests the debug/developer toolset for the event system
 * 
 * Following TDD: These tests are written FIRST, implementation comes after review.
 */

let EventDebugManager = require('../../../debug/EventDebugManager');

describe('EventDebugManager', function() {
  let debugManager;
  let mockEventManager;
  let mockMapManager;
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    global.fill = sandbox.stub();
    global.stroke = sandbox.stub();
    global.circle = sandbox.stub();
    global.text = sandbox.stub();
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.rect = sandbox.stub();
    global.strokeWeight = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textSize = sandbox.stub();
    global.CENTER = 'center';
    global.LEFT = 'left';
    global.RIGHT = 'right';
    global.window = { width: 1920, height: 1080 };
    
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.circle = global.circle;
      window.text = global.text;
      window.push = global.push;
      window.pop = global.pop;
      window.rect = global.rect;
      window.strokeWeight = global.strokeWeight;
      window.noStroke = global.noStroke;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.CENTER = 'center';
      window.LEFT = 'left';
      window.RIGHT = 'right';
      window.width = 1920;
      window.height = 1080;
    }

    // Mock EventManager
    mockEventManager = {
      events: new Map(),
      activeEvents: [],
      triggers: new Map(),
      flags: {},
      triggerEvent: sandbox.stub(),
      getEvent: sandbox.stub().callsFake(function(eventId) {
        return this.events.get(eventId) || null;
      }),
      getAllEvents: sandbox.stub().callsFake(function() {
        return Array.from(this.events.values());
      }),
      getActiveEvents: sandbox.stub().returns([]),
      getFlag: sandbox.stub(),
      setFlag: sandbox.stub()
    };
    
    // Mock MapManager
    mockMapManager = {
      getActiveMapId: sandbox.stub().returns('test_level'),
      getActiveMap: sandbox.stub().returns({
        metadata: { levelId: 'test_level' }
      }),
      getAllMapIds: sandbox.stub().returns(['test_level', 'level_2'])
    };
    
    global.eventManager = mockEventManager;
    global.mapManager = mockMapManager;
    
    if (typeof window !== 'undefined') {
      window.eventManager = mockEventManager;
      window.mapManager = mockMapManager;
    }

    // Always create EventDebugManager instance
    debugManager = new EventDebugManager();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Constructor and Initialization', function() {
    it('should initialize with disabled state', function() {
      expect(debugManager).to.exist;
      expect(debugManager.enabled).to.be.false;
    });

    it('should initialize event flag visibility as disabled', function() {
      expect(debugManager.showEventFlags).to.be.false;
    });

    it('should initialize event list visibility as disabled', function() {
      expect(debugManager.showEventList).to.be.false;
    });

    it('should initialize level event info visibility as disabled', function() {
      expect(debugManager.showLevelInfo).to.be.false;
    });

    it('should track triggered events per level', function() {
      expect(debugManager.triggeredEventsPerLevel).to.be.an('object');
    });
  });

  describe('Enable/Disable Control', function() {
    it('should enable debug manager', function() {
      debugManager.enable();
      expect(debugManager.enabled).to.be.true;
    });

    it('should disable debug manager', function() {
      debugManager.enable();
      debugManager.disable();
      expect(debugManager.enabled).to.be.false;
    });

    it('should toggle debug manager state', function() {
      const initialState = debugManager.enabled;
      debugManager.toggle();
      expect(debugManager.enabled).to.equal(!initialState);
    });
  });

  describe('Event Flag Visualization', function() {
    it('should toggle event flag visibility', function() {
      debugManager.toggleEventFlags();
      expect(debugManager.showEventFlags).to.be.true;
      
      debugManager.toggleEventFlags();
      expect(debugManager.showEventFlags).to.be.false;
    });

    it('should enable event flag visibility', function() {
      debugManager.showEventFlagsOverlay(true);
      expect(debugManager.showEventFlags).to.be.true;
    });

    it('should disable event flag visibility', function() {
      debugManager.showEventFlagsOverlay(false);
      expect(debugManager.showEventFlags).to.be.false;
    });

    it('should get color for event type', function() {
      const dialogueColor = debugManager.getEventTypeColor('dialogue');
      const spawnColor = debugManager.getEventTypeColor('spawn');
      const tutorialColor = debugManager.getEventTypeColor('tutorial');
      
      expect(dialogueColor).to.exist;
      expect(spawnColor).to.exist;
      expect(tutorialColor).to.exist;
      expect(dialogueColor).to.not.deep.equal(spawnColor);
    });

    it('should have default color for unknown event types', function() {
      const unknownColor = debugManager.getEventTypeColor('unknown_type');
      expect(unknownColor).to.exist;
    });
  });

  describe('Level Event Information', function() {
    beforeEach(function() {
      // Setup mock events linked to level
      mockEventManager.events.set('event_1', {
        id: 'event_1',
        type: 'dialogue',
        levelId: 'test_level'
      });
      mockEventManager.events.set('event_2', {
        id: 'event_2',
        type: 'spawn',
        levelId: 'test_level'
      });
      mockEventManager.events.set('event_3', {
        id: 'event_3',
        type: 'tutorial',
        levelId: 'level_2'
      });
      
      mockEventManager.getAllEvents.returns([
        mockEventManager.events.get('event_1'),
        mockEventManager.events.get('event_2'),
        mockEventManager.events.get('event_3')
      ]);
      
      // Setup triggers
      mockEventManager.triggers.set('trigger_1', {
        eventId: 'event_1',
        type: 'spatial',
        condition: { x: 100, y: 100, radius: 50 }
      });
      mockEventManager.triggers.set('trigger_2', {
        eventId: 'event_2',
        type: 'time',
        condition: { delay: 5000 }
      });
    });

    it('should get events linked to current level', function() {
      const levelEvents = debugManager.getEventsForLevel('test_level');
      
      expect(levelEvents).to.be.an('array');
      expect(levelEvents).to.have.lengthOf(2);
      expect(levelEvents.map(e => e.id)).to.include.members(['event_1', 'event_2']);
    });

    it('should get triggers for level events', function() {
      const triggers = debugManager.getTriggersForLevel('test_level');
      
      expect(triggers).to.be.an('array');
      expect(triggers).to.have.lengthOf(2);
    });

    it('should show level event info panel', function() {
      debugManager.showLevelEventInfo(true);
      expect(debugManager.showLevelInfo).to.be.true;
    });

    it('should hide level event info panel', function() {
      debugManager.showLevelEventInfo(false);
      expect(debugManager.showLevelInfo).to.be.false;
    });

    it('should toggle level event info panel', function() {
      debugManager.toggleLevelInfo();
      expect(debugManager.showLevelInfo).to.be.true;
      
      debugManager.toggleLevelInfo();
      expect(debugManager.showLevelInfo).to.be.false;
    });
  });

  describe('Triggered Events Tracking', function() {
    it('should track when event is triggered', function() {
      debugManager.onEventTriggered('event_1', 'test_level');
      
      const triggered = debugManager.getTriggeredEvents('test_level');
      expect(triggered).to.include('event_1');
    });

    it('should track multiple triggered events per level', function() {
      debugManager.onEventTriggered('event_1', 'test_level');
      debugManager.onEventTriggered('event_2', 'test_level');
      
      const triggered = debugManager.getTriggeredEvents('test_level');
      expect(triggered).to.have.lengthOf(2);
      expect(triggered).to.include.members(['event_1', 'event_2']);
    });

    it('should not duplicate triggered event tracking', function() {
      debugManager.onEventTriggered('event_1', 'test_level');
      debugManager.onEventTriggered('event_1', 'test_level');
      
      const triggered = debugManager.getTriggeredEvents('test_level');
      expect(triggered).to.have.lengthOf(1);
    });

    it('should check if event has been triggered', function() {
      debugManager.onEventTriggered('event_1', 'test_level');
      
      expect(debugManager.hasEventBeenTriggered('event_1', 'test_level')).to.be.true;
      expect(debugManager.hasEventBeenTriggered('event_2', 'test_level')).to.be.false;
    });

    it('should clear triggered events for level', function() {
      debugManager.onEventTriggered('event_1', 'test_level');
      debugManager.onEventTriggered('event_2', 'test_level');
      
      debugManager.clearTriggeredEvents('test_level');
      
      const triggered = debugManager.getTriggeredEvents('test_level');
      expect(triggered).to.have.lengthOf(0);
    });
  });

  describe('Event List Display', function() {
    beforeEach(function() {
      mockEventManager.getAllEvents.returns([
        { id: 'event_1', type: 'dialogue', priority: 1 },
        { id: 'event_2', type: 'spawn', priority: 5 },
        { id: 'event_3', type: 'tutorial', priority: 3 }
      ]);
    });

    it('should toggle event list visibility', function() {
      debugManager.toggleEventList();
      expect(debugManager.showEventList).to.be.true;
      
      debugManager.toggleEventList();
      expect(debugManager.showEventList).to.be.false;
    });

    it('should show event list', function() {
      debugManager.showEventListPanel(true);
      expect(debugManager.showEventList).to.be.true;
    });

    it('should get all events with trigger commands', function() {
      const eventCommands = debugManager.getAllEventCommands();
      
      expect(eventCommands).to.be.an('array');
      expect(eventCommands).to.have.lengthOf(3);
      expect(eventCommands[0]).to.have.property('id');
      expect(eventCommands[0]).to.have.property('command');
      expect(eventCommands[0].command).to.include('triggerEvent');
    });

    it('should format event command correctly', function() {
      const command = debugManager.getEventCommand('event_1');
      
      expect(command).to.be.a('string');
      expect(command).to.include('event_1');
      expect(command).to.match(/triggerEvent|trigger/);
    });
  });

  describe('Manual Event Triggering', function() {
    beforeEach(function() {
      mockEventManager.events.set('event_1', {
        id: 'event_1',
        type: 'dialogue',
        levelId: 'test_level'
      });
      mockEventManager.events.set('event_2', {
        id: 'event_2',
        type: 'spawn',
        levelId: 'level_2'
      });
    });

    it('should trigger any event regardless of level', function() {
      debugManager.manualTriggerEvent('event_2');
      
      expect(mockEventManager.triggerEvent.calledWith('event_2')).to.be.true;
    });

    it('should trigger event with custom data', function() {
      const customData = { testMode: true };
      debugManager.manualTriggerEvent('event_1', customData);
      
      // Should call with custom data PLUS debugTriggered flag
      const expectedData = { testMode: true, debugTriggered: true };
      expect(mockEventManager.triggerEvent.calledWith('event_1', expectedData)).to.be.true;
    });

    it('should track manually triggered events', function() {
      debugManager.manualTriggerEvent('event_1');
      
      // Should track even if event is for different level
      const triggered = debugManager.getTriggeredEvents(mockMapManager.getActiveMapId());
      expect(triggered).to.include('event_1');
    });

    it('should handle non-existent event gracefully', function() {
      const result = debugManager.manualTriggerEvent('non_existent');
      
      expect(result).to.be.false;
      expect(mockEventManager.triggerEvent.called).to.be.false;
    });

    it('should bypass level restrictions when manually triggering', function() {
      // Event belongs to level_2, but we're on test_level
      mockMapManager.getActiveMapId.returns('test_level');
      
      const result = debugManager.manualTriggerEvent('event_2');
      
      expect(result).to.be.true;
      expect(mockEventManager.triggerEvent.calledWith('event_2')).to.be.true;
    });
  });

  describe('Event Flag Greying (One-time Events)', function() {
    beforeEach(function() {
      mockEventManager.events.set('one_time', {
        id: 'one_time',
        type: 'dialogue',
        levelId: 'test_level'
      });
      mockEventManager.events.set('repeatable', {
        id: 'repeatable',
        type: 'spawn',
        levelId: 'test_level'
      });
      
      mockEventManager.triggers.set('trigger_1', {
        eventId: 'one_time',
        type: 'spatial',
        oneTime: true
      });
      mockEventManager.triggers.set('trigger_2', {
        eventId: 'repeatable',
        type: 'spatial',
        oneTime: false
      });
    });

    it('should identify one-time events', function() {
      const isOneTime = debugManager.isEventOneTime('one_time');
      expect(isOneTime).to.be.true;
    });

    it('should identify repeatable events', function() {
      const isOneTime = debugManager.isEventOneTime('repeatable');
      expect(isOneTime).to.be.false;
    });

    it('should grey out triggered one-time events', function() {
      debugManager.onEventTriggered('one_time', 'test_level');
      
      const shouldGrey = debugManager.shouldGreyOutEvent('one_time', 'test_level');
      expect(shouldGrey).to.be.true;
    });

    it('should not grey out triggered repeatable events', function() {
      debugManager.onEventTriggered('repeatable', 'test_level');
      
      const shouldGrey = debugManager.shouldGreyOutEvent('repeatable', 'test_level');
      expect(shouldGrey).to.be.false;
    });

    it('should not grey out untriggered one-time events', function() {
      const shouldGrey = debugManager.shouldGreyOutEvent('one_time', 'test_level');
      expect(shouldGrey).to.be.false;
    });
  });

  describe('Command Integration', function() {
    it('should register all debug commands', function() {
      const commands = debugManager.getDebugCommands();
      
      expect(commands).to.be.an('object');
      expect(commands).to.have.property('showEventFlags');
      expect(commands).to.have.property('showEventList');
      expect(commands).to.have.property('showLevelInfo');
      expect(commands).to.have.property('triggerEvent');
    });

    it('should execute show event flags command', function() {
      debugManager.executeCommand('showEventFlags');
      expect(debugManager.showEventFlags).to.be.true;
    });

    it('should execute show event list command', function() {
      debugManager.executeCommand('showEventList');
      expect(debugManager.showEventList).to.be.true;
    });

    it('should execute show level info command', function() {
      debugManager.executeCommand('showLevelInfo');
      expect(debugManager.showLevelInfo).to.be.true;
    });

    it('should execute trigger event command with argument', function() {
      // Setup event in mock
      mockEventManager.events.set('event_1', {
        id: 'event_1',
        type: 'dialogue'
      });
      
      debugManager.executeCommand('triggerEvent', ['event_1']);
      // Should call triggerEvent with eventId and debugTriggered flag
      expect(mockEventManager.triggerEvent.calledWith('event_1', { debugTriggered: true })).to.be.true;
    });

    it('should execute listEvents command', function() {
      const consoleSpy = sandbox.spy(console, 'log');
      debugManager.executeCommand('listEvents');
      
      expect(consoleSpy.called).to.be.true;
    });
  });

  describe('Render Event Flags', function() {
    beforeEach(function() {
      debugManager.enable();
      debugManager.showEventFlagsOverlay(true);
      
      // Mock EventFlagLayer with flags
      global.levelEditor = {
        eventLayer: {
          flags: [
            {
              id: 'flag_1',
              x: 100,
              y: 200,
              radius: 64,
              eventId: 'event_1'
            },
            {
              id: 'flag_2',
              x: 300,
              y: 400,
              radius: 32,
              eventId: 'event_2'
            }
          ]
        }
      };
      
      mockEventManager.events.set('event_1', {
        id: 'event_1',
        type: 'dialogue'
      });
      mockEventManager.events.set('event_2', {
        id: 'event_2',
        type: 'spawn'
      });
      
      if (typeof window !== 'undefined') {
        window.levelEditor = global.levelEditor;
      }
    });

    it('should render event flags when enabled', function() {
      debugManager.renderEventFlags();
      
      // Should draw circles for each flag
      expect(global.circle.callCount).to.be.at.least(2);
    });

    it('should not render when disabled', function() {
      debugManager.disable();
      debugManager.renderEventFlags();
      
      expect(global.circle.called).to.be.false;
    });

    it('should not render when flag overlay is off', function() {
      debugManager.showEventFlagsOverlay(false);
      debugManager.renderEventFlags();
      
      expect(global.circle.called).to.be.false;
    });

    it('should use correct color for event type', function() {
      debugManager.renderEventFlags();
      
      // Should call fill with different colors for different types
      expect(global.fill.callCount).to.be.at.least(2);
    });

    it('should grey out triggered one-time events', function() {
      mockEventManager.triggers.set('trigger_1', {
        eventId: 'event_1',
        oneTime: true
      });
      
      debugManager.onEventTriggered('event_1', 'test_level');
      debugManager.renderEventFlags();
      
      // Should use greyed color for triggered one-time event
      const fillCalls = global.fill.getCalls();
      const hasGreyedColor = fillCalls.some(call => {
        // Check for reduced alpha/grey color
        return call.args.length >= 4 && call.args[3] < 255;
      });
      
      expect(hasGreyedColor).to.be.true;
    });
  });

  describe('Render Level Event Info Panel', function() {
    beforeEach(function() {
      debugManager.enable();
      debugManager.showLevelEventInfo(true);
      
      mockEventManager.events.set('event_1', {
        id: 'event_1',
        type: 'dialogue',
        levelId: 'test_level',
        priority: 1
      });
      mockEventManager.events.set('event_2', {
        id: 'event_2',
        type: 'spawn',
        levelId: 'test_level',
        priority: 5
      });
      
      mockEventManager.getAllEvents.returns([
        mockEventManager.events.get('event_1'),
        mockEventManager.events.get('event_2')
      ]);
      
      mockEventManager.triggers.set('trigger_1', {
        eventId: 'event_1',
        type: 'spatial'
      });
    });

    it('should render level info panel when enabled', function() {
      debugManager.renderLevelInfo();
      
      // Should draw text for panel
      expect(global.text.called).to.be.true;
    });

    it('should show event IDs for current level', function() {
      debugManager.renderLevelInfo();
      
      const textCalls = global.text.getCalls();
      const hasEvent1 = textCalls.some(call => String(call.args[0]).includes('event_1'));
      const hasEvent2 = textCalls.some(call => String(call.args[0]).includes('event_2'));
      
      expect(hasEvent1).to.be.true;
      expect(hasEvent2).to.be.true;
    });

    it('should show trigger types for events', function() {
      debugManager.renderLevelInfo();
      
      const textCalls = global.text.getCalls();
      const hasTriggerType = textCalls.some(call => String(call.args[0]).includes('spatial'));
      
      expect(hasTriggerType).to.be.true;
    });

    it('should indicate triggered events', function() {
      debugManager.onEventTriggered('event_1', 'test_level');
      debugManager.renderLevelInfo();
      
      const textCalls = global.text.getCalls();
      const hasTriggeredIndicator = textCalls.some(call => 
        String(call.args[0]).includes('✓') || 
        String(call.args[0]).includes('triggered')
      );
      
      expect(hasTriggeredIndicator).to.be.true;
    });

    it('should not render when disabled', function() {
      debugManager.disable();
      debugManager.renderLevelInfo();
      
      expect(global.text.called).to.be.false;
    });
  });

  describe('Render Event List Panel', function() {
    beforeEach(function() {
      debugManager.enable();
      debugManager.showEventListPanel(true);
      
      mockEventManager.getAllEvents.returns([
        { id: 'event_1', type: 'dialogue', priority: 1 },
        { id: 'event_2', type: 'spawn', priority: 5 },
        { id: 'event_3', type: 'tutorial', priority: 3 }
      ]);
    });

    it('should render event list panel when enabled', function() {
      debugManager.renderEventList();
      
      expect(global.text.called).to.be.true;
    });

    it('should show all event IDs', function() {
      debugManager.renderEventList();
      
      const textCalls = global.text.getCalls();
      const text = textCalls.map(call => String(call.args[0])).join(' ');
      
      expect(text).to.include('event_1');
      expect(text).to.include('event_2');
      expect(text).to.include('event_3');
    });

    it('should show trigger commands for events', function() {
      debugManager.renderEventList();
      
      const textCalls = global.text.getCalls();
      const text = textCalls.map(call => String(call.args[0])).join(' ');
      
      expect(text).to.match(/triggerEvent|trigger/);
    });

    it('should not render when disabled', function() {
      debugManager.disable();
      debugManager.renderEventList();
      
      expect(global.text.called).to.be.false;
    });
  });

  describe('Integration with MapManager', function() {
    it('should get current level ID from MapManager', function() {
      const levelId = debugManager.getCurrentLevelId();
      
      expect(levelId).to.equal('test_level');
      expect(mockMapManager.getActiveMapId.called).to.be.true;
    });

    it('should handle missing MapManager gracefully', function() {
      global.mapManager = undefined;
      if (typeof window !== 'undefined') {
        window.mapManager = undefined;
      }
      
      const levelId = debugManager.getCurrentLevelId();
      
      expect(levelId).to.be.null;
    });

    it('should get all level IDs', function() {
      const levelIds = debugManager.getAllLevelIds();
      
      expect(levelIds).to.be.an('array');
      expect(levelIds).to.include.members(['test_level', 'level_2']);
    });
  });

  describe('Integration with Level Editor', function() {
    it('should detect if level editor is active', function() {
      global.GameState = {
        current: 'LEVEL_EDITOR'
      };
      
      const isActive = debugManager.isLevelEditorActive();
      
      expect(isActive).to.be.true;
    });

    it('should detect when level editor is not active', function() {
      global.GameState = {
        current: 'PLAYING'
      };
      
      const isActive = debugManager.isLevelEditorActive();
      
      expect(isActive).to.be.false;
    });

    it('should get event flags from level editor', function() {
      global.levelEditor = {
        eventLayer: {
          flags: [
            { id: 'flag_1', eventId: 'event_1' },
            { id: 'flag_2', eventId: 'event_2' }
          ]
        }
      };
      
      const flags = debugManager.getEventFlagsInEditor();
      
      expect(flags).to.be.an('array');
      expect(flags).to.have.lengthOf(2);
    });

    it('should handle missing level editor gracefully', function() {
      global.levelEditor = undefined;
      
      const flags = debugManager.getEventFlagsInEditor();
      
      expect(flags).to.be.an('array');
      expect(flags).to.have.lengthOf(0);
    });
  });
});




// ================================================================
// tracing.test.js (1 tests)
// ================================================================
// Test suite for tracing.js functions
// Tests stack tracing, function name extraction, and error reporting utilities

// Mock console.error to capture error messages for testing
let mockConsoleError = [];
let originalConsoleError = console.error;

function mockConsoleErrorCapture() {
  mockConsoleError = [];
  console.error = (...args) => {
    mockConsoleError.push(args.join(' '));
  };
}

function restoreConsoleError() {
  console.error = originalConsoleError;
}

// Simple test framework
let suite = {
  tests: [],
  passed: 0,
  failed: 0,
  
  test(name, fn) {
    this.tests.push({ name, fn });
  },
  
  assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  },
  
  assertFalse(condition, message = '') {
    if (condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  },
  
  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Assertion failed: Expected "${expected}", got "${actual}". ${message}`);
    }
  },
  
  assertContains(haystack, needle, message = '') {
    if (!haystack.includes(needle)) {
      throw new Error(`Assertion failed: "${haystack}" should contain "${needle}". ${message}`);
    }
  },
  
  run() {
    console.log('🔍 Running Tracing Test Suite...\n');
    
    for (const test of this.tests) {
      try {
        test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('❌ Some tests failed!');
    }
    
    return this.failed === 0;
  }
};

// Import tracing functions (we'll need to fix the exports first)
let tracingModule;
try {
  tracingModule = require('../debug/tracing.js');
} catch (error) {
  console.error('Could not load tracing module:', error.message);
  
}

// Test 1: Stack Trace Generation
suite.test('getCurrentCallStack returns valid stack trace', () => {
  function testFunction() {
    return tracingModule.getCurrentCallStack();
  }
  
  const stack = testFunction();
  suite.assertTrue(typeof stack === 'string', 'Stack should be a string');
  suite.assertContains(stack, 'testFunction', 'Stack should contain test function name');
  suite.assertTrue(stack.length > 0, 'Stack should not be empty');
  suite.assertTrue(stack.split('\n').length >= 3, 'Stack should have multiple lines');
});

// Test 2: Function Level Extraction
suite.test('getFunction returns correct stack level', () => {
  function levelTwo() {
    return tracingModule.getFunction(2); // Should get levelOne
  }
  
  function levelOne() {
    return levelTwo();
  }
  
  const result = levelOne();
  suite.assertTrue(typeof result === 'string', 'Should return a string');
  suite.assertTrue(result.length > 0, 'Should not be empty');
});

// Test 3: Function Name Extraction
suite.test('getFunctionName extracts names correctly', () => {
  function namedTestFunction() {
    return tracingModule.getFunctionName(2); // Should get the caller of this function
  }
  
  function callerFunction() {
    return namedTestFunction();
  }
  
  const result = callerFunction();
  suite.assertTrue(typeof result === 'string', 'Should return a string');
  suite.assertTrue(result !== 'error', 'Should not return error');
});

// Test 4: Error Handling in getFunctionName
suite.test('getFunctionName handles invalid stack levels', () => {
  const result = tracingModule.getFunctionName(999); // Way beyond stack depth
  suite.assertTrue(result === 'error' || result === 'unknown', 'Should handle invalid levels gracefully');
});

// Test 5: Type Detection Function
suite.test('getType correctly identifies variable types', () => {
  suite.assertEqual(tracingModule.getType(42), 'Number', 'Should identify numbers');
  suite.assertEqual(tracingModule.getType('hello'), 'String', 'Should identify strings');
  suite.assertEqual(tracingModule.getType([1, 2, 3]), 'Array', 'Should identify arrays');
  suite.assertEqual(tracingModule.getType({}), 'Object', 'Should identify objects');
  suite.assertEqual(tracingModule.getType(null), 'Null', 'Should identify null');
  suite.assertEqual(tracingModule.getType(undefined), 'Undefined', 'Should identify undefined');
  suite.assertEqual(tracingModule.getType(true), 'Boolean', 'Should identify booleans');
  suite.assertEqual(tracingModule.getType(() => {}), 'Function', 'Should identify functions');
});

// Test 6: Parameter Error Reporting
suite.test('IncorrectParamPassed generates proper error messages', () => {
  mockConsoleErrorCapture();
  
  function badFunction() {
    tracingModule.IncorrectParamPassed("String", 123);
  }
  
  function callingFunction() {
    badFunction();
  }
  
  callingFunction();
  
  suite.assertTrue(mockConsoleError.length > 0, 'Should generate error message');
  const errorMsg = mockConsoleError[0];
  suite.assertContains(errorMsg, 'Incorrect Param passed', 'Should contain error description');
  suite.assertContains(errorMsg, 'String', 'Should contain expected type');
  suite.assertContains(errorMsg, 'Number', 'Should contain actual type');
  
  restoreConsoleError();
});

// Test 7: Regex Pattern Testing
suite.test('functionNameRegX pattern works correctly', () => {
  const testStrings = [
    'functionName@file.js:10:5',
    '  spacedFunction  @file.js:20:10',
    'simpleFunction',
    'Object.method@file.js:30:15'
  ];
  
  const regex = tracingModule.functionNameRegX; // Use the actual regex from tracing.js
  
  const result1 = testStrings[0].match(regex);
  suite.assertEqual(result1[1], 'functionName', 'Should extract simple function name');
  
  const result2 = testStrings[1].match(regex);
  suite.assertEqual(result2[1], '  spacedFunction  ', 'Should preserve spacing');
  
  const result3 = testStrings[2].match(regex);
  suite.assertEqual(result3[1], 'simpleFunction', 'Should handle strings without @');
  
  const result4 = testStrings[3].match(regex);
  suite.assertEqual(result4[1], 'Object.method', 'Should handle object methods');
});

// Test 8: Stack Depth Consistency
suite.test('Stack depth calculations are consistent', () => {
  function depth3() {
    return {
      current: tracingModule.getFunctionName(1),
      caller: tracingModule.getFunctionName(2),
      callersCaller: tracingModule.getFunctionName(3)
    };
  }
  
  function depth2() {
    return depth3();
  }
  
  function depth1() {
    return depth2();
  }
  
  const result = depth1();
  
  // These should all be strings and not errors
  suite.assertTrue(typeof result.current === 'string', 'Current function should be string');
  suite.assertTrue(typeof result.caller === 'string', 'Caller should be string');
  suite.assertTrue(typeof result.callersCaller === 'string', 'Caller\'s caller should be string');
  
  // None should be 'error'
  suite.assertTrue(result.current !== 'error', 'Current function should not error');
  suite.assertTrue(result.caller !== 'error', 'Caller should not error');
  suite.assertTrue(result.callersCaller !== 'error', 'Caller\'s caller should not error');
});

// Test 9: Edge Cases
suite.test('Functions handle edge cases gracefully', () => {
  // Test with empty/null inputs where applicable
  suite.assertEqual(tracingModule.getType(null), 'Null', 'Should handle null');
  suite.assertEqual(tracingModule.getType(undefined), 'Undefined', 'Should handle undefined');
  
  // Test stack level 0 (should be "Error")
  const level0 = tracingModule.getFunction(0);
  suite.assertContains(level0, 'Error', 'Level 0 should contain Error');
  
  // Test negative stack level (should handle gracefully)
  const negativeLevel = tracingModule.getFunctionName(-1);
  suite.assertTrue(negativeLevel === 'error' || negativeLevel === 'unknown', 'Should handle negative levels');
});

// Test 10: Integration Test
suite.test('Full error reporting workflow', () => {
  mockConsoleErrorCapture();
  
  function correctFunction(expectedString) {
    // This simulates a function that expects a string but gets something else
    if (typeof expectedString !== 'string') {
      tracingModule.IncorrectParamPassed("String", expectedString);
    }
    return expectedString;
  }
  
  function userFunction() {
    // User accidentally passes a number instead of string
    return correctFunction(42);
  }
  
  userFunction();
  
  suite.assertTrue(mockConsoleError.length > 0, 'Should capture error');
  const errorMsg = mockConsoleError[0];
  suite.assertContains(errorMsg, 'correctFunction', 'Should identify the function with the issue');
  suite.assertContains(errorMsg, 'Incorrect Param passed', 'Should contain error description');
  suite.assertContains(errorMsg, 'String', 'Should contain expected type');
  suite.assertContains(errorMsg, 'Number', 'Should contain actual type');
  
  restoreConsoleError();
});

// Test 11: deprecatedWarning with valid function
suite.test('deprecatedWarning executes replacement function correctly', () => {
  // Mock console.warn to capture warnings
  let mockConsoleWarn = [];
  let mockConsoleLog = [];
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  console.warn = (...args) => mockConsoleWarn.push(args.join(' '));
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  // Test replacement function
  function newAdd(a, b) {
    return a + b;
  }
  
  function oldAdd(a, b) {
    return tracingModule.deprecatedWarning(newAdd, a, b);
  }
  
  const result = oldAdd(5, 3);
  
  // Verify function executed correctly
  suite.assertEqual(result, 8, 'Should execute replacement function and return result');
  
  // Verify warning was logged
  suite.assertTrue(mockConsoleWarn.length > 0, 'Should generate deprecation warning');
  suite.assertContains(mockConsoleWarn[0], 'deprecated', 'Warning should mention deprecation');
  suite.assertContains(mockConsoleWarn[0], 'newAdd', 'Warning should mention replacement function');
  
  // Verify paramInfo was called (should generate debug output)
  suite.assertTrue(mockConsoleLog.length > 0, 'Should generate parameter debug info');
  
  // Restore console functions
  console.warn = originalWarn;
  console.log = originalLog;
});

// Test 12: deprecatedWarning with invalid parameter
suite.test('deprecatedWarning handles invalid replacement parameter', () => {
  mockConsoleErrorCapture();
  
  function badDeprecatedFunction() {
    return tracingModule.deprecatedWarning("not a function");
  }
  
  const result = badDeprecatedFunction();
  
  // Should return undefined for invalid input
  suite.assertEqual(result, undefined, 'Should return undefined for invalid replacement');
  
  // Should generate parameter error
  suite.assertTrue(mockConsoleError.length > 0, 'Should generate parameter error');
  suite.assertContains(mockConsoleError[0], 'Incorrect Param passed', 'Should contain error message');
  
  restoreConsoleError();
});

// Test 13: deprecatedWarning with no additional arguments
suite.test('deprecatedWarning works with no additional arguments', () => {
  let mockConsoleWarn = [];
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  console.warn = (...args) => mockConsoleWarn.push(args.join(' '));
  console.log = () => {}; // Suppress paramInfo output for this test
  
  function noArgsFunction() {
    return "no arguments needed";
  }
  
  function oldNoArgs() {
    return tracingModule.deprecatedWarning(noArgsFunction);
  }
  
  const result = oldNoArgs();
  
  suite.assertEqual(result, "no arguments needed", 'Should work with functions that take no arguments');
  suite.assertTrue(mockConsoleWarn.length > 0, 'Should still generate warning');
  
  console.warn = originalWarn;
  console.log = originalLog;
});

// Test 14: paramInfo with function parameter
suite.test('paramInfo provides detailed function analysis', () => {
  let mockConsoleLog = [];
  const originalLog = console.log;
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  function testFunction(x, y, z) {
    return x + y + z;
  }
  
  tracingModule.paramInfo(testFunction);
  
  // Verify comprehensive output
  const output = mockConsoleLog.join('\n');
  suite.assertContains(output, '=== Parameter Debug Info ===', 'Should have header');
  suite.assertContains(output, 'Type: function', 'Should identify as function');
  suite.assertContains(output, 'Is function: true', 'Should confirm function type');
  suite.assertContains(output, 'Function name: testFunction', 'Should extract function name');
  suite.assertContains(output, 'Function length (params): 3', 'Should count parameters');
  suite.assertContains(output, 'Function string preview:', 'Should show code preview');
  suite.assertContains(output, '=============================', 'Should have footer');
  
  console.log = originalLog;
});

// Test 15: paramInfo with object parameter
suite.test('paramInfo provides detailed object analysis', () => {
  let mockConsoleLog = [];
  const originalLog = console.log;
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  const testObject = { name: "test", value: 42, active: true };
  
  tracingModule.paramInfo(testObject);
  
  const output = mockConsoleLog.join('\n');
  suite.assertContains(output, 'Type: object', 'Should identify as object');
  suite.assertContains(output, 'Is function: false', 'Should confirm not function');
  suite.assertContains(output, 'Object keys:', 'Should list object keys');
  suite.assertContains(output, 'Constructor: Object', 'Should identify constructor');
  
  console.log = originalLog;
});

// Test 16: paramInfo with string parameter
suite.test('paramInfo provides detailed string analysis', () => {
  let mockConsoleLog = [];
  const originalLog = console.log;
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  const testString = "hello world";
  
  tracingModule.paramInfo(testString);
  
  const output = mockConsoleLog.join('\n');
  suite.assertContains(output, 'Type: string', 'Should identify as string');
  suite.assertContains(output, 'String value: "hello world"', 'Should show quoted value');
  suite.assertContains(output, 'String length: 11', 'Should show length');
  
  console.log = originalLog;
});

// Test 17: paramInfo with various data types
suite.test('paramInfo handles all data types correctly', () => {
  let mockConsoleLog = [];
  const originalLog = console.log;
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  // Test different types
  const testCases = [
    { value: null, expectedType: 'object' },
    { value: undefined, expectedType: 'undefined' },
    { value: 42, expectedType: 'number' },
    { value: true, expectedType: 'boolean' },
    { value: [], expectedType: 'object' }
  ];
  
  for (const testCase of testCases) {
    mockConsoleLog = []; // Clear for each test
    tracingModule.paramInfo(testCase.value);
    
    const output = mockConsoleLog.join(' ');
    suite.assertContains(output, `Type: ${testCase.expectedType}`, 
      `Should identify ${testCase.value} as ${testCase.expectedType}`);
    suite.assertContains(output, 'Is null:', 'Should check for null');
    suite.assertContains(output, 'Is undefined:', 'Should check for undefined');
  }
  
  console.log = originalLog;
});

// Test 18: Integration test - deprecatedWarning and paramInfo workflow
suite.test('deprecatedWarning and paramInfo integration workflow', () => {
  let mockConsoleWarn = [];
  let mockConsoleLog = [];
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  console.warn = (...args) => mockConsoleWarn.push(args.join(' '));
  console.log = (...args) => mockConsoleLog.push(args.join(' '));
  
  function newCalculate(operation, a, b) {
    if (operation === 'add') return a + b;
    if (operation === 'multiply') return a * b;
    return 0;
  }
  
  function oldCalculate(operation, a, b) {
    return tracingModule.deprecatedWarning(newCalculate, operation, a, b);
  }
  
  const result = oldCalculate('add', 10, 5);
  
  // Verify the complete workflow
  suite.assertEqual(result, 15, 'Should execute replacement function correctly');
  suite.assertTrue(mockConsoleWarn.length > 0, 'Should generate deprecation warning');
  suite.assertTrue(mockConsoleLog.length > 0, 'Should generate parameter debug info');
  
  // Check warning content
  const warningMsg = mockConsoleWarn.join(' ');
  suite.assertContains(warningMsg, 'deprecated', 'Should mention deprecation');
  suite.assertContains(warningMsg, 'newCalculate', 'Should mention replacement function');
  
  // Check debug info was comprehensive
  const debugOutput = mockConsoleLog.join(' ');
  suite.assertContains(debugOutput, 'Parameter Debug Info', 'Should provide debug header');
  suite.assertContains(debugOutput, 'Function name: newCalculate', 'Should identify function in debug');
  
  console.warn = originalWarn;
  console.log = originalLog;
});

// Register with global test runner and run conditionally
if (typeof globalThis !== 'undefined' && globalThis.registerTest) {
  globalThis.registerTest('Tracing Tests', () => {
    const success = suite.run();
    return success;
  });
}

// Auto-run if tests are enabled
if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests && globalThis.shouldRunTests()) {
  console.log('🧪 Running Tracing tests...');
  const success = suite.run();
} else if (typeof globalThis !== 'undefined' && globalThis.shouldRunTests) {
  console.log('🧪 Tracing tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
} else {
  // Fallback: Run the test suite if this file is executed directly
  if (require.main === module) {
    const success = suite.run();
    
  }
}

module.exports = suite;
