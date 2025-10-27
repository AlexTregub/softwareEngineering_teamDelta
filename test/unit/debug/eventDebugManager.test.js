/**
 * Unit Tests for EventDebugManager
 * Tests the debug/developer toolset for the event system
 * 
 * Following TDD: These tests are written FIRST, implementation comes after review.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const EventDebugManager = require('../../../debug/EventDebugManager');

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
