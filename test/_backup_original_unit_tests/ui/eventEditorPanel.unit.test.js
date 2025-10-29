/**
 * Unit Tests: EventEditorPanel - Double-Click Placement Mode
 * 
 * TDD Phase 1: Write tests FIRST, then implement
 * 
 * Feature: Double-click drag button to enter "placement mode"
 * - No need to hold mouse button
 * - Cursor shows flag icon
 * - Single click to place
 * - ESC to cancel
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('EventEditorPanel - Placement Mode (Unit Tests)', function() {
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
    global.text = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textSize = sandbox.stub();
    global.rect = sandbox.stub();
    global.ellipse = sandbox.stub();
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    
    // Sync to window
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.rect = global.rect;
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
        { id: 'test-event-1', type: 'dialogue', priority: 5, active: true }
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
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.rect;
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
    delete window.text;
    delete window.textAlign;
    delete window.textSize;
    delete window.rect;
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
  
  describe('Placement Mode State', function() {
    it('should start with placement mode disabled', function() {
      expect(eventEditor.isInPlacementMode()).to.be.false;
    });
    
    it('should have separate placement mode state from drag state', function() {
      // Placement mode should be independent of drag state
      expect(eventEditor.isInPlacementMode()).to.be.false;
      expect(eventEditor.isDragging()).to.be.false;
      
      // These should be different states
      expect(eventEditor.isInPlacementMode).to.not.equal(eventEditor.isDragging);
    });
    
    it('should track eventId in placement mode', function() {
      eventEditor.enterPlacementMode('test-event-1');
      
      expect(eventEditor.isInPlacementMode()).to.be.true;
      expect(eventEditor.getPlacementEventId()).to.equal('test-event-1');
    });
    
    it('should track cursor position in placement mode', function() {
      eventEditor.enterPlacementMode('test-event-1');
      eventEditor.updatePlacementCursor(100, 200);
      
      const cursor = eventEditor.getPlacementCursor();
      expect(cursor).to.deep.equal({ x: 100, y: 200 });
    });
  });
  
  describe('Enter Placement Mode', function() {
    it('should enter placement mode with valid event ID', function() {
      const result = eventEditor.enterPlacementMode('test-event-1');
      
      expect(result).to.be.true;
      expect(eventEditor.isInPlacementMode()).to.be.true;
      expect(eventEditor.getPlacementEventId()).to.equal('test-event-1');
    });
    
    it('should not enter placement mode with null event ID', function() {
      const result = eventEditor.enterPlacementMode(null);
      
      expect(result).to.be.false;
      expect(eventEditor.isInPlacementMode()).to.be.false;
    });
    
    it('should exit drag mode when entering placement mode', function() {
      // Start a drag
      eventEditor.startDragPlacement('test-event-1');
      expect(eventEditor.isDragging()).to.be.true;
      
      // Enter placement mode
      eventEditor.enterPlacementMode('test-event-1');
      
      // Drag should be cancelled
      expect(eventEditor.isDragging()).to.be.false;
      expect(eventEditor.isInPlacementMode()).to.be.true;
    });
  });
  
  describe('Exit Placement Mode', function() {
    beforeEach(function() {
      eventEditor.enterPlacementMode('test-event-1');
      eventEditor.updatePlacementCursor(100, 200);
    });
    
    it('should exit placement mode', function() {
      eventEditor.exitPlacementMode();
      
      expect(eventEditor.isInPlacementMode()).to.be.false;
      expect(eventEditor.getPlacementEventId()).to.be.null;
    });
    
    it('should clear cursor position on exit', function() {
      eventEditor.exitPlacementMode();
      
      const cursor = eventEditor.getPlacementCursor();
      expect(cursor).to.be.null;
    });
    
    it('should be safe to call exitPlacementMode when not in placement mode', function() {
      eventEditor.exitPlacementMode();
      eventEditor.exitPlacementMode(); // Call again
      
      expect(eventEditor.isInPlacementMode()).to.be.false;
    });
  });
  
  describe('Double-Click Detection', function() {
    it('should have handleDoubleClick method', function() {
      expect(eventEditor.handleDoubleClick).to.be.a('function');
    });
    
    it('should enter placement mode on double-click of drag button', function() {
      const contentX = 100;
      const contentY = 50;
      const width = 250;
      
      // Calculate drag button position (from EventEditorPanel code)
      const dragBtnX = contentX + width - 55;
      const dragBtnY = contentY + 30 + 5; // listY + 5
      
      // Double-click on drag button
      const clickX = dragBtnX + 10;
      const clickY = dragBtnY + 10;
      
      const result = eventEditor.handleDoubleClick(clickX, clickY, contentX, contentY);
      
      expect(result).to.be.true;
      expect(eventEditor.isInPlacementMode()).to.be.true;
      expect(eventEditor.getPlacementEventId()).to.equal('test-event-1');
    });
    
    it('should not enter placement mode on double-click outside drag button', function() {
      const result = eventEditor.handleDoubleClick(10, 10, 100, 50);
      
      expect(result).to.be.false;
      expect(eventEditor.isInPlacementMode()).to.be.false;
    });
  });
  
  describe('Cursor Updates', function() {
    beforeEach(function() {
      eventEditor.enterPlacementMode('test-event-1');
    });
    
    it('should update cursor position', function() {
      eventEditor.updatePlacementCursor(150, 250);
      
      const cursor = eventEditor.getPlacementCursor();
      expect(cursor.x).to.equal(150);
      expect(cursor.y).to.equal(250);
    });
    
    it('should update cursor multiple times', function() {
      eventEditor.updatePlacementCursor(100, 100);
      eventEditor.updatePlacementCursor(200, 200);
      eventEditor.updatePlacementCursor(300, 300);
      
      const cursor = eventEditor.getPlacementCursor();
      expect(cursor).to.deep.equal({ x: 300, y: 300 });
    });
    
    it('should not update cursor when not in placement mode', function() {
      eventEditor.exitPlacementMode();
      
      eventEditor.updatePlacementCursor(500, 500);
      
      const cursor = eventEditor.getPlacementCursor();
      expect(cursor).to.be.null;
    });
  });
  
  describe('Event Placement in Placement Mode', function() {
    beforeEach(function() {
      eventEditor.enterPlacementMode('test-event-1');
    });
    
    it('should place event and exit placement mode', function() {
      const result = eventEditor.completePlacement(400, 300);
      
      expect(result.success).to.be.true;
      expect(eventEditor.isInPlacementMode()).to.be.false;
    });
    
    it('should return event details on successful placement', function() {
      const result = eventEditor.completePlacement(400, 300);
      
      expect(result.success).to.be.true;
      expect(result.eventId).to.equal('test-event-1');
      expect(result.worldX).to.equal(400);
      expect(result.worldY).to.equal(300);
    });
    
    it('should not place when not in placement mode', function() {
      eventEditor.exitPlacementMode();
      
      const result = eventEditor.completePlacement(400, 300);
      
      expect(result.success).to.be.false;
    });
  });
  
  describe('ESC Key Cancellation', function() {
    beforeEach(function() {
      eventEditor.enterPlacementMode('test-event-1');
    });
    
    it('should cancel placement mode on ESC', function() {
      eventEditor.cancelPlacement();
      
      expect(eventEditor.isInPlacementMode()).to.be.false;
      expect(eventEditor.getPlacementEventId()).to.be.null;
    });
    
    it('should be safe to cancel when not in placement mode', function() {
      eventEditor.exitPlacementMode();
      eventEditor.cancelPlacement();
      
      expect(eventEditor.isInPlacementMode()).to.be.false;
    });
  });
  
  describe('Flag Cursor Rendering', function() {
    beforeEach(function() {
      // Add missing p5 drawing functions
      if (!global.circle) {
        global.circle = sinon.stub();
        window.circle = global.circle;
      }
      if (!global.noFill) {
        global.noFill = sinon.stub();
        window.noFill = global.noFill;
      }
      if (!global.strokeWeight) {
        global.strokeWeight = sinon.stub();
        window.strokeWeight = global.strokeWeight;
      }
      if (!global.textAlign) {
        global.textAlign = sinon.stub();
        window.textAlign = global.textAlign;
      }
      if (!global.noStroke) {
        global.noStroke = sinon.stub();
        window.noStroke = global.noStroke;
      }
    });
    
    it('should have renderPlacementCursor method', function() {
      expect(eventEditor.renderPlacementCursor).to.be.a('function');
    });
    
    it('should not render when placement mode is inactive', function() {
      expect(eventEditor.isInPlacementMode()).to.be.false;
      
      // Should not throw and should not call p5 functions
      const textCallsBefore = global.text.callCount;
      const circleCallsBefore = global.circle.callCount;
      
      eventEditor.renderPlacementCursor();
      
      expect(global.text.callCount).to.equal(textCallsBefore);
      expect(global.circle.callCount).to.equal(circleCallsBefore);
    });
    
    it('should render flag at cursor position when active', function() {
      eventEditor.enterPlacementMode('test-event-1');
      eventEditor.updatePlacementCursor(400, 300);
      
      const textCallsBefore = global.text.callCount;
      
      eventEditor.renderPlacementCursor();
      
      // Should call text() with flag emoji
      expect(global.text.callCount).to.be.greaterThan(textCallsBefore);
      
      // Find the call with flag emoji
      const flagCall = global.text.getCalls().find(call => call.args[0] === '🚩');
      expect(flagCall).to.exist;
    });
    
    it('should offset flag from cursor position', function() {
      eventEditor.enterPlacementMode('test-event-1');
      eventEditor.updatePlacementCursor(400, 300);
      
      eventEditor.renderPlacementCursor();
      
      // Find the flag call
      const flagCall = global.text.getCalls().find(call => call.args[0] === '🚩');
      expect(flagCall).to.exist;
      
      // Flag should be offset (not at exact cursor position)
      const flagX = flagCall.args[1];
      const flagY = flagCall.args[2];
      
      expect(flagX).to.not.equal(400);
      expect(flagY).to.not.equal(300);
    });
    
    it('should render trigger radius preview circle', function() {
      eventEditor.enterPlacementMode('test-event-1');
      eventEditor.updatePlacementCursor(400, 300);
      
      const circleCallsBefore = global.circle.callCount;
      
      eventEditor.renderPlacementCursor();
      
      // Should draw circle at cursor position
      expect(global.circle.callCount).to.be.greaterThan(circleCallsBefore);
      expect(global.circle.lastCall.args[0]).to.equal(400); // x
      expect(global.circle.lastCall.args[1]).to.equal(300); // y
    });
    
    it('should use semi-transparent stroke for radius circle', function() {
      eventEditor.enterPlacementMode('test-event-1');
      eventEditor.updatePlacementCursor(400, 300);
      
      const strokeCallsBefore = global.stroke.callCount;
      const noFillCallsBefore = global.noFill.callCount;
      
      eventEditor.renderPlacementCursor();
      
      // Should set stroke with alpha and noFill
      expect(global.stroke.callCount).to.be.greaterThan(strokeCallsBefore);
      expect(global.noFill.callCount).to.be.greaterThan(noFillCallsBefore);
    });
  });
});
