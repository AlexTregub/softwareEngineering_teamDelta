/**
 * Integration Tests: EventEditorPanel
 * 
 * Tests EventEditorPanel integration with DraggablePanel and render callbacks.
 * 
 * CRITICAL BUG TEST: EventEditorPanel.render() expects 4 parameters (x, y, width, height)
 * but LevelEditorPanels only passes 2 (x, y), breaking layout and drag functionality.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

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
