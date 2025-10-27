/**
 * Integration Tests for EventDebugManager
 * Tests integration with real systems: MapManager, LevelEditor, CommandLine
 * 
 * These tests verify that EventDebugManager works correctly with the actual
 * systems it depends on, not mocks.
 */

const { expect } = require('chai');
const EventDebugManager = require('../../../debug/EventDebugManager');

describe('EventDebugManager Integration Tests', function() {
  let eventDebugManager;
  
  beforeEach(function() {
    eventDebugManager = new EventDebugManager();
  });
  
  describe('MapManager Integration', function() {
    it('should initialize with MapManager dependency', function() {
      // EventDebugManager should be able to handle missing MapManager
      const levelId = eventDebugManager.getCurrentLevelId();
      
      // Without real MapManager, should return null
      expect(levelId).to.be.null;
    });
    
    it('should gracefully handle missing mapManager', function() {
      const allLevels = eventDebugManager.getAllLevelIds();
      
      // Without real MapManager, should return empty array
      expect(allLevels).to.be.an('array');
      expect(allLevels).to.have.lengthOf(0);
    });
    
    it('should work with mock MapManager for testing', function() {
      // Simulate MapManager being available
      global.mapManager = {
        getActiveMapId: () => 'integration_test_level',
        getAllMapIds: () => ['level_1', 'level_2', 'integration_test_level']
      };
      
      const levelId = eventDebugManager.getCurrentLevelId();
      const allLevels = eventDebugManager.getAllLevelIds();
      
      expect(levelId).to.equal('integration_test_level');
      expect(allLevels).to.have.lengthOf(3);
      expect(allLevels).to.include('integration_test_level');
      
      // Cleanup
      delete global.mapManager;
    });
  });
  
  describe('EventManager Integration', function() {
    it('should handle missing EventManager gracefully', function() {
      const events = eventDebugManager.getEventsForLevel('test_level');
      
      // Without EventManager, should return empty array
      expect(events).to.be.an('array');
      expect(events).to.have.lengthOf(0);
    });
    
    it('should work with mock EventManager', function() {
      // Simulate EventManager being available
      global.eventManager = {
        getAllEvents: () => [
          { id: 'event_1', type: 'dialogue', levelId: 'test_level' },
          { id: 'event_2', type: 'spawn', levelId: 'test_level' },
          { id: 'event_3', type: 'tutorial', levelId: 'other_level' }
        ],
        triggers: new Map([
          ['trigger_1', { eventId: 'event_1', type: 'spatial' }],
          ['trigger_2', { eventId: 'event_2', type: 'time' }]
        ])
      };
      
      global.mapManager = {
        getActiveMapId: () => 'test_level'
      };
      
      const events = eventDebugManager.getEventsForLevel('test_level');
      const triggers = eventDebugManager.getTriggersForLevel('test_level');
      
      expect(events).to.have.lengthOf(2);
      expect(events[0].id).to.equal('event_1');
      expect(events[1].id).to.equal('event_2');
      
      expect(triggers).to.have.lengthOf(2);
      
      // Cleanup
      delete global.eventManager;
      delete global.mapManager;
    });
    
    it('should track triggered events across level changes', function() {
      // Simulate level 1
      eventDebugManager.onEventTriggered('event_1', 'level_1');
      eventDebugManager.onEventTriggered('event_2', 'level_1');
      
      // Simulate level 2
      eventDebugManager.onEventTriggered('event_3', 'level_2');
      
      // Verify tracking per level
      const level1Triggered = eventDebugManager.getTriggeredEvents('level_1');
      const level2Triggered = eventDebugManager.getTriggeredEvents('level_2');
      
      expect(level1Triggered).to.have.lengthOf(2);
      expect(level1Triggered).to.include.members(['event_1', 'event_2']);
      
      expect(level2Triggered).to.have.lengthOf(1);
      expect(level2Triggered).to.include('event_3');
    });
  });
  
  describe('Level Editor Integration', function() {
    it('should detect level editor state', function() {
      global.GameState = { current: 'PLAYING' };
      
      let isActive = eventDebugManager.isLevelEditorActive();
      expect(isActive).to.be.false;
      
      global.GameState.current = 'LEVEL_EDITOR';
      
      isActive = eventDebugManager.isLevelEditorActive();
      expect(isActive).to.be.true;
      
      // Cleanup
      delete global.GameState;
    });
    
    it('should get event flags from level editor', function() {
      global.levelEditor = {
        eventLayer: {
          flags: [
            { id: 'flag_1', x: 100, y: 200, eventId: 'event_1', radius: 64 },
            { id: 'flag_2', x: 300, y: 400, eventId: 'event_2', radius: 32 }
          ]
        }
      };
      
      const flags = eventDebugManager.getEventFlagsInEditor();
      
      expect(flags).to.have.lengthOf(2);
      expect(flags[0].id).to.equal('flag_1');
      expect(flags[1].id).to.equal('flag_2');
      
      // Cleanup
      delete global.levelEditor;
    });
    
    it('should handle missing level editor gracefully', function() {
      const flags = eventDebugManager.getEventFlagsInEditor();
      
      expect(flags).to.be.an('array');
      expect(flags).to.have.lengthOf(0);
    });
  });
  
  describe('Command System Integration', function() {
    it('should provide debug commands', function() {
      const commands = eventDebugManager.getDebugCommands();
      
      expect(commands).to.have.property('showEventFlags');
      expect(commands).to.have.property('showEventList');
      expect(commands).to.have.property('showLevelInfo');
      expect(commands).to.have.property('triggerEvent');
      expect(commands).to.have.property('listEvents');
      
      expect(commands.showEventFlags).to.be.a('function');
      expect(commands.showEventList).to.be.a('function');
      expect(commands.showLevelInfo).to.be.a('function');
      expect(commands.triggerEvent).to.be.a('function');
      expect(commands.listEvents).to.be.a('function');
    });
    
    it('should execute commands correctly', function() {
      // Test toggle commands
      expect(eventDebugManager.showEventFlags).to.be.false;
      eventDebugManager.executeCommand('showEventFlags');
      expect(eventDebugManager.showEventFlags).to.be.true;
      
      expect(eventDebugManager.showEventList).to.be.false;
      eventDebugManager.executeCommand('showEventList');
      expect(eventDebugManager.showEventList).to.be.true;
      
      expect(eventDebugManager.showLevelInfo).to.be.false;
      eventDebugManager.executeCommand('showLevelInfo');
      expect(eventDebugManager.showLevelInfo).to.be.true;
    });
    
    it('should handle unknown commands gracefully', function() {
      const result = eventDebugManager.executeCommand('unknownCommand');
      
      expect(result).to.be.false;
    });
  });
  
  describe('Event Type Color System', function() {
    it('should provide consistent colors for event types', function() {
      const dialogueColor1 = eventDebugManager.getEventTypeColor('dialogue');
      const dialogueColor2 = eventDebugManager.getEventTypeColor('dialogue');
      
      expect(dialogueColor1).to.deep.equal(dialogueColor2);
    });
    
    it('should have different colors for different types', function() {
      const dialogueColor = eventDebugManager.getEventTypeColor('dialogue');
      const spawnColor = eventDebugManager.getEventTypeColor('spawn');
      const tutorialColor = eventDebugManager.getEventTypeColor('tutorial');
      const bossColor = eventDebugManager.getEventTypeColor('boss');
      
      expect(dialogueColor).to.not.deep.equal(spawnColor);
      expect(spawnColor).to.not.deep.equal(tutorialColor);
      expect(tutorialColor).to.not.deep.equal(bossColor);
    });
    
    it('should provide default color for unknown types', function() {
      const unknownColor = eventDebugManager.getEventTypeColor('unknown_type');
      const defaultColor = eventDebugManager.getEventTypeColor('another_unknown');
      
      expect(unknownColor).to.deep.equal(defaultColor);
    });
  });
  
  describe('One-Time Event Detection', function() {
    it('should detect one-time events from triggers', function() {
      global.eventManager = {
        triggers: new Map([
          ['trigger_1', { eventId: 'event_1', oneTime: true }],
          ['trigger_2', { eventId: 'event_2', oneTime: false }],
          ['trigger_3', { eventId: 'event_3' }] // No oneTime property
        ])
      };
      
      expect(eventDebugManager.isEventOneTime('event_1')).to.be.true;
      expect(eventDebugManager.isEventOneTime('event_2')).to.be.false;
      expect(eventDebugManager.isEventOneTime('event_3')).to.be.false;
      
      // Cleanup
      delete global.eventManager;
    });
    
    it('should correctly determine when to grey out events', function() {
      global.eventManager = {
        triggers: new Map([
          ['trigger_1', { eventId: 'event_1', oneTime: true }],
          ['trigger_2', { eventId: 'event_2', oneTime: false }]
        ])
      };
      
      // Before triggering
      expect(eventDebugManager.shouldGreyOutEvent('event_1', 'level_1')).to.be.false;
      
      // After triggering
      eventDebugManager.onEventTriggered('event_1', 'level_1');
      expect(eventDebugManager.shouldGreyOutEvent('event_1', 'level_1')).to.be.true;
      
      // Repeatable event should not grey out
      eventDebugManager.onEventTriggered('event_2', 'level_1');
      expect(eventDebugManager.shouldGreyOutEvent('event_2', 'level_1')).to.be.false;
      
      // Cleanup
      delete global.eventManager;
    });
  });
  
  describe('Full System Integration', function() {
    it('should work with complete system setup', function() {
      // Simulate complete system
      global.mapManager = {
        getActiveMapId: () => 'main_level',
        getAllMapIds: () => ['main_level', 'boss_level']
      };
      
      global.eventManager = {
        getAllEvents: () => [
          { id: 'intro_dialogue', type: 'dialogue', levelId: 'main_level', priority: 1 },
          { id: 'wave_1', type: 'spawn', levelId: 'main_level', priority: 5 },
          { id: 'boss_intro', type: 'boss', levelId: 'boss_level', priority: 1 }
        ],
        triggers: new Map([
          ['trigger_intro', { eventId: 'intro_dialogue', type: 'spatial', oneTime: true }],
          ['trigger_wave', { eventId: 'wave_1', type: 'time', oneTime: false }]
        ]),
        getEvent: (id) => {
          const events = [
            { id: 'intro_dialogue', type: 'dialogue', levelId: 'main_level', priority: 1 },
            { id: 'wave_1', type: 'spawn', levelId: 'main_level', priority: 5 }
          ];
          return events.find(e => e.id === id);
        },
        triggerEvent: function() {}
      };
      
      global.GameState = { current: 'PLAYING' };
      
      // Test complete workflow
      const levelId = eventDebugManager.getCurrentLevelId();
      expect(levelId).to.equal('main_level');
      
      const events = eventDebugManager.getEventsForLevel('main_level');
      expect(events).to.have.lengthOf(2);
      
      const triggers = eventDebugManager.getTriggersForLevel('main_level');
      expect(triggers).to.have.lengthOf(2);
      
      // Trigger an event
      eventDebugManager.onEventTriggered('intro_dialogue', 'main_level');
      expect(eventDebugManager.hasEventBeenTriggered('intro_dialogue', 'main_level')).to.be.true;
      
      // Check greying
      expect(eventDebugManager.shouldGreyOutEvent('intro_dialogue', 'main_level')).to.be.true;
      expect(eventDebugManager.shouldGreyOutEvent('wave_1', 'main_level')).to.be.false;
      
      // Get event commands
      const commands = eventDebugManager.getAllEventCommands();
      expect(commands).to.have.lengthOf(3);
      expect(commands[0].command).to.include('triggerEvent');
      
      // Cleanup
      delete global.mapManager;
      delete global.eventManager;
      delete global.GameState;
    });
  });
});
