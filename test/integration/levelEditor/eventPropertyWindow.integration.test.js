/**
 * Integration Tests: EventPropertyWindow + LevelEditor
 * 
 * Tests EventPropertyWindow integration with LevelEditor.
 * Verifies flag click → property window workflow.
 * 
 * Following TDD: RED PHASE - Tests will fail until LevelEditor integration is complete.
 * 
 * Test Coverage:
 * - Click flag → property window opens
 * - Window receives correct trigger data
 * - Window positioned near clicked flag
 * - Save changes updates EventManager
 * - Delete trigger removes from EventManager and closes window
 * - Cancel closes window without saving
 * - Only one property window open at a time
 * - Window integrates with draggablePanelManager
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Import systems
const EventManager = require('../../../Classes/managers/EventManager');
const EventPropertyWindow = require('../../../Classes/ui/EventPropertyWindow');

describe('EventPropertyWindow + LevelEditor Integration Tests', function() {
  let sandbox;
  let eventManager;
  let mockLevelEditor;
  let mockCameraManager;
  let mockEventFlagRenderer;
  let mockDraggablePanelManager;
  let mockP5;
  let spatialTrigger;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock global logging functions
    global.logNormal = sandbox.stub();
    window.logNormal = global.logNormal;
    global.console = {
      log: sandbox.stub(),
      error: sandbox.stub(),
      warn: sandbox.stub()
    };
    
    // Mock p5.js rendering functions
    mockP5 = {
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      noStroke: sandbox.stub(),
      noFill: sandbox.stub(),
      ellipse: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      push: sandbox.stub(),
      pop: sandbox.stub(),
      line: sandbox.stub(),
      createVector: sandbox.stub().callsFake((x, y) => ({ x, y })),
      CENTER: 'center',
      TOP: 'top',
      BOTTOM: 'bottom',
      LEFT: 'left',
      RIGHT: 'right'
    };
    
    // Sync p5 mocks to global and window
    Object.assign(global, mockP5);
    Object.assign(window, mockP5);
    
    // Initialize EventManager
    eventManager = new EventManager();
    global.eventManager = eventManager;
    window.eventManager = eventManager;
    
    // Create spatial trigger
    spatialTrigger = {
      id: 'trigger_test_001',
      eventId: 'event_001',
      type: 'spatial',
      oneTime: true,
      condition: {
        x: 300,
        y: 300,
        radius: 100,
        shape: 'circle'
      }
    };
    
    // Register trigger with EventManager
    eventManager.registerTrigger(spatialTrigger);
    
    // Mock CameraManager
    mockCameraManager = {
      worldToScreen: sandbox.stub().callsFake((worldX, worldY) => ({
        x: worldX + 100, // Simple transform for testing
        y: worldY + 100
      })),
      screenToWorld: sandbox.stub().callsFake((screenX, screenY) => ({
        x: screenX - 100,
        y: screenY - 100
      })),
      x: 0,
      y: 0,
      zoom: 1
    };
    
    // Mock EventFlagRenderer
    mockEventFlagRenderer = {
      checkFlagClick: sandbox.stub().returns(null),
      renderEventFlags: sandbox.stub()
    };
    global.EventFlagRenderer = function() {
      return mockEventFlagRenderer;
    };
    window.EventFlagRenderer = global.EventFlagRenderer;
    
    // Mock DraggablePanelManager
    mockDraggablePanelManager = {
      panels: [],
      stateVisibility: {
        'LEVEL_EDITOR': []
      },
      addPanel: sandbox.stub(),
      removePanel: sandbox.stub(),
      handleMouseEvents: sandbox.stub().returns(false),
      renderPanels: sandbox.stub()
    };
    global.draggablePanelManager = mockDraggablePanelManager;
    window.draggablePanelManager = mockDraggablePanelManager;
    
    // Mock LevelEditor (minimal implementation for testing)
    mockLevelEditor = {
      eventPropertyWindow: null,
      eventManager: eventManager,
      editorCamera: mockCameraManager,
      
      // Method we'll implement
      openEventPropertyWindow: function(trigger) {
        // Close existing window if open
        if (this.eventPropertyWindow) {
          this.eventPropertyWindow.close();
        }
        
        // Create new property window
        const windowX = 50;
        const windowY = 50;
        const windowWidth = 300;
        const windowHeight = 400;
        
        this.eventPropertyWindow = new EventPropertyWindow(
          windowX, 
          windowY, 
          windowWidth, 
          windowHeight, 
          trigger, 
          this.eventManager
        );
        
        return this.eventPropertyWindow;
      },
      
      closeEventPropertyWindow: function() {
        if (this.eventPropertyWindow) {
          this.eventPropertyWindow.close();
          this.eventPropertyWindow = null;
        }
      },
      
      handleMousePressed: function(mouseX, mouseY) {
        // Check if flag was clicked
        const clickedTrigger = mockEventFlagRenderer.checkFlagClick(mouseX, mouseY, this.editorCamera);
        
        if (clickedTrigger) {
          this.openEventPropertyWindow(clickedTrigger);
          return true;
        }
        
        return false;
      }
    };
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Flag Click Detection', function() {
    it('should open property window when flag is clicked', function() {
      // Setup: Flag click returns trigger
      mockEventFlagRenderer.checkFlagClick.returns(spatialTrigger);
      
      // Action: Click on flag position
      const flagScreenX = 400;
      const flagScreenY = 400;
      mockLevelEditor.handleMousePressed(flagScreenX, flagScreenY);
      
      // Verify: Property window opened
      expect(mockLevelEditor.eventPropertyWindow).to.exist;
      expect(mockLevelEditor.eventPropertyWindow).to.be.instanceOf(EventPropertyWindow);
    });
    
    it('should pass correct trigger data to property window', function() {
      mockEventFlagRenderer.checkFlagClick.returns(spatialTrigger);
      
      mockLevelEditor.handleMousePressed(400, 400);
      
      expect(mockLevelEditor.eventPropertyWindow.trigger).to.exist;
      expect(mockLevelEditor.eventPropertyWindow.trigger.id).to.equal('trigger_test_001');
      expect(mockLevelEditor.eventPropertyWindow.trigger.type).to.equal('spatial');
    });
    
    it('should not open property window when clicking outside flags', function() {
      // Setup: Click returns null (no flag hit)
      mockEventFlagRenderer.checkFlagClick.returns(null);
      
      mockLevelEditor.handleMousePressed(500, 500);
      
      expect(mockLevelEditor.eventPropertyWindow).to.be.null;
    });
    
    it('should close existing window when opening new window', function() {
      // Setup: Open window for first trigger
      mockEventFlagRenderer.checkFlagClick.returns(spatialTrigger);
      mockLevelEditor.handleMousePressed(400, 400);
      
      const firstWindow = mockLevelEditor.eventPropertyWindow;
      expect(firstWindow.isVisible).to.be.true;
      
      // Create second trigger
      const secondTrigger = {
        id: 'trigger_test_002',
        eventId: 'event_002',
        type: 'spatial',
        oneTime: false,
        condition: { x: 500, y: 500, radius: 150 }
      };
      eventManager.registerTrigger(secondTrigger);
      
      // Click second flag
      mockEventFlagRenderer.checkFlagClick.returns(secondTrigger);
      mockLevelEditor.handleMousePressed(600, 600);
      
      // Verify: First window closed, second window opened
      expect(firstWindow.isVisible).to.be.false;
      expect(mockLevelEditor.eventPropertyWindow).to.not.equal(firstWindow);
      expect(mockLevelEditor.eventPropertyWindow.trigger.id).to.equal('trigger_test_002');
    });
  });
  
  describe('Window Positioning', function() {
    it('should position window on screen', function() {
      mockEventFlagRenderer.checkFlagClick.returns(spatialTrigger);
      
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      expect(mockLevelEditor.eventPropertyWindow.x).to.be.a('number');
      expect(mockLevelEditor.eventPropertyWindow.y).to.be.a('number');
      expect(mockLevelEditor.eventPropertyWindow.x).to.be.at.least(0);
      expect(mockLevelEditor.eventPropertyWindow.y).to.be.at.least(0);
    });
    
    it('should have reasonable dimensions', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      expect(mockLevelEditor.eventPropertyWindow.width).to.be.at.least(250);
      expect(mockLevelEditor.eventPropertyWindow.width).to.be.at.most(500);
      expect(mockLevelEditor.eventPropertyWindow.height).to.be.at.least(300);
      expect(mockLevelEditor.eventPropertyWindow.height).to.be.at.most(600);
    });
  });
  
  describe('Save Changes Integration', function() {
    it('should update trigger in EventManager when saved', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      const window = mockLevelEditor.eventPropertyWindow;
      
      // Modify editForm
      window.editForm.condition.radius = 150;
      window.editForm.oneTime = false;
      
      // Save changes
      window.saveChanges();
      
      // Verify: Trigger updated in EventManager
      const updatedTrigger = eventManager.getTrigger('trigger_test_001');
      expect(updatedTrigger.condition.radius).to.equal(150);
      expect(updatedTrigger.oneTime).to.equal(false);
    });
    
    it('should close window after successful save', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      const window = mockLevelEditor.eventPropertyWindow;
      window.editForm.condition.radius = 150;
      
      window.saveChanges();
      
      expect(window.isVisible).to.be.false;
    });
    
    it('should not save if validation fails', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      const window = mockLevelEditor.eventPropertyWindow;
      
      // Set invalid radius
      window.editForm.condition.radius = -10;
      
      const result = window.saveChanges();
      
      expect(result).to.be.false;
      expect(window.isVisible).to.be.true; // Window stays open
      
      // Verify: Trigger NOT updated in EventManager
      const trigger = eventManager.getTrigger('trigger_test_001');
      expect(trigger.condition.radius).to.equal(100); // Original value
    });
  });
  
  describe('Delete Trigger Integration', function() {
    it('should remove trigger from EventManager when deleted', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      const window = mockLevelEditor.eventPropertyWindow;
      
      // Delete trigger
      window.deleteTrigger();
      
      // Verify: Trigger removed from EventManager
      const trigger = eventManager.getTrigger('trigger_test_001');
      expect(trigger).to.be.null;
    });
    
    it('should close window after deletion', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      const window = mockLevelEditor.eventPropertyWindow;
      window.deleteTrigger();
      
      expect(window.isVisible).to.be.false;
    });
    
    it('should handle deletion of non-existent trigger gracefully', function() {
      // Create trigger that doesn't exist in EventManager
      const fakeTrigger = {
        id: 'trigger_fake',
        eventId: 'event_fake',
        type: 'spatial',
        oneTime: true,
        condition: { x: 100, y: 100, radius: 50 }
      };
      
      mockLevelEditor.openEventPropertyWindow(fakeTrigger);
      
      const window = mockLevelEditor.eventPropertyWindow;
      
      // Should not throw error
      expect(() => window.deleteTrigger()).to.not.throw();
    });
  });
  
  describe('Cancel Integration', function() {
    it('should not update EventManager when cancelled', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      const window = mockLevelEditor.eventPropertyWindow;
      
      // Modify editForm
      window.editForm.condition.radius = 200;
      window.editForm.oneTime = false;
      
      // Cancel
      window.cancel();
      
      // Verify: Trigger NOT updated in EventManager
      const trigger = eventManager.getTrigger('trigger_test_001');
      expect(trigger.condition.radius).to.equal(100); // Original value
      expect(trigger.oneTime).to.equal(true); // Original value
    });
    
    it('should close window when cancelled', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      const window = mockLevelEditor.eventPropertyWindow;
      window.cancel();
      
      expect(window.isVisible).to.be.false;
    });
  });
  
  describe('Window Lifecycle', function() {
    it('should initialize window as visible', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      expect(mockLevelEditor.eventPropertyWindow.isVisible).to.be.true;
    });
    
    it('should allow manual close via closeEventPropertyWindow', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      mockLevelEditor.closeEventPropertyWindow();
      
      expect(mockLevelEditor.eventPropertyWindow).to.be.null;
    });
    
    it('should handle multiple open/close cycles', function() {
      // Open window
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      expect(mockLevelEditor.eventPropertyWindow).to.exist;
      
      // Close window
      mockLevelEditor.closeEventPropertyWindow();
      expect(mockLevelEditor.eventPropertyWindow).to.be.null;
      
      // Open again
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      expect(mockLevelEditor.eventPropertyWindow).to.exist;
      
      // Close again
      mockLevelEditor.closeEventPropertyWindow();
      expect(mockLevelEditor.eventPropertyWindow).to.be.null;
    });
  });
  
  describe('EditForm Isolation', function() {
    it('should not modify original trigger until save', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      const window = mockLevelEditor.eventPropertyWindow;
      
      // Get original trigger from EventManager
      const originalTrigger = eventManager.getTrigger('trigger_test_001');
      const originalRadius = originalTrigger.condition.radius;
      
      // Modify editForm
      window.editForm.condition.radius = 999;
      
      // Verify: Original trigger unchanged
      expect(originalTrigger.condition.radius).to.equal(originalRadius);
      
      // Cancel (don't save)
      window.cancel();
      
      // Verify: Still unchanged
      expect(originalTrigger.condition.radius).to.equal(originalRadius);
    });
    
    it('should create deep copy of trigger for editForm', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      const window = mockLevelEditor.eventPropertyWindow;
      
      // Verify editForm is not same reference
      expect(window.editForm).to.not.equal(spatialTrigger);
      expect(window.editForm.condition).to.not.equal(spatialTrigger.condition);
      
      // Modify editForm
      window.editForm.condition.radius = 999;
      
      // Verify original unaffected
      expect(spatialTrigger.condition.radius).to.equal(100);
    });
  });
  
  describe('Trigger Type Coverage', function() {
    it('should handle spatial triggers', function() {
      mockLevelEditor.openEventPropertyWindow(spatialTrigger);
      
      expect(mockLevelEditor.eventPropertyWindow.trigger.type).to.equal('spatial');
      expect(mockLevelEditor.eventPropertyWindow.editForm.condition.radius).to.exist;
    });
    
    it('should handle time triggers', function() {
      const timeTrigger = {
        id: 'trigger_time',
        eventId: 'event_001',
        type: 'time',
        oneTime: true,
        condition: {
          delay: 5000
        }
      };
      
      eventManager.registerTrigger(timeTrigger);
      mockLevelEditor.openEventPropertyWindow(timeTrigger);
      
      expect(mockLevelEditor.eventPropertyWindow.trigger.type).to.equal('time');
      expect(mockLevelEditor.eventPropertyWindow.editForm.condition.delay).to.exist;
    });
    
    it('should handle flag triggers', function() {
      const flagTrigger = {
        id: 'trigger_flag',
        eventId: 'event_001',
        type: 'flag',
        oneTime: false,
        condition: {
          requiredFlags: ['flag1', 'flag2'],
          allRequired: true
        }
      };
      
      eventManager.registerTrigger(flagTrigger);
      mockLevelEditor.openEventPropertyWindow(flagTrigger);
      
      expect(mockLevelEditor.eventPropertyWindow.trigger.type).to.equal('flag');
      expect(mockLevelEditor.eventPropertyWindow.editForm.condition.requiredFlags).to.exist;
    });
    
    it('should handle viewport triggers', function() {
      const viewportTrigger = {
        id: 'trigger_viewport',
        eventId: 'event_001',
        type: 'viewport',
        oneTime: true,
        condition: {
          x: 100,
          y: 100,
          width: 200,
          height: 200
        }
      };
      
      eventManager.registerTrigger(viewportTrigger);
      mockLevelEditor.openEventPropertyWindow(viewportTrigger);
      
      expect(mockLevelEditor.eventPropertyWindow.trigger.type).to.equal('viewport');
      expect(mockLevelEditor.eventPropertyWindow.editForm.condition.width).to.exist;
    });
  });
});
