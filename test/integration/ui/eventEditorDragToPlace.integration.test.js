/**
 * Integration tests for EventEditorPanel drag-to-place with Level Editor
 * 
 * Tests the complete integration:
 * - EventEditorPanel drag state
 * - LevelEditor coordinate conversion
 * - EventManager trigger registration
 * - Visual feedback and cursor tracking
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

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
    global.console.log = sinon.stub();
    global.logVerbose = sinon.stub();
    global.logError = sinon.stub();
    
    // Sync to window
    window.console.log = global.console.log;
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
    delete global.console.log;
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
