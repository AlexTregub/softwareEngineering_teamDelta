/**
 * Unit Tests: DraggablePanel Click Origin Tracking (No Drag While Painting)
 * 
 * Tests that panels only start dragging if the click originated on the title bar,
 * preventing panels from hijacking drag operations during terrain painting.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('DraggablePanel - Click Origin Tracking (No Drag While Painting)', function() {
  let DraggablePanel;
  let panel;
  
  before(function() {
    // Setup localStorage mock
    global.localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub(),
      removeItem: sinon.stub()
    };
    
    // Setup debug globals
    global.devConsoleEnabled = false;
    global.logVerbose = sinon.stub();
    global.logNormal = sinon.stub();
    
    // Setup p5.js mocks
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.noStroke = sinon.stub();
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    
    // Sync to window for JSDOM
    global.window = global.window || {};
    window.localStorage = global.localStorage;
    window.devConsoleEnabled = global.devConsoleEnabled;
    window.logVerbose = global.logVerbose;
    window.logNormal = global.logNormal;
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.strokeWeight = global.strokeWeight;
    window.rect = global.rect;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.noStroke = global.noStroke;
    window.createVector = global.createVector;
    
    // Load DraggablePanel class
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
  });
  
  beforeEach(function() {
    // Create a basic panel
    panel = new DraggablePanel({
      id: 'test-panel',
      title: 'Test Panel',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      behavior: { draggable: true }
    });
    
    // Make panel visible
    panel.state.visible = true;
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  after(function() {
    sinon.restore();
  });
  
  describe('Click Origin Tracking', function() {
    it('should track when click starts on title bar', function() {
      // Click on title bar (top area of panel)
      const titleBarX = 150; // Middle of panel
      const titleBarY = 110; // Near top (title bar area)
      
      // First update: mouse pressed on title bar
      panel.update(titleBarX, titleBarY, true);
      
      expect(panel.clickStartedOnTitleBar).to.be.true;
    });
    
    it('should track when click starts on terrain (outside panel)', function() {
      // Click on terrain (outside panel bounds)
      const terrainX = 50;
      const terrainY = 50;
      
      // First update: mouse pressed outside panel
      panel.update(terrainX, terrainY, true);
      
      expect(panel.clickStartedOnTitleBar).to.be.false;
    });
    
    it('should track when click starts on panel content (not title bar)', function() {
      // Click on panel content area (below title bar)
      const contentX = 150;
      const contentY = 150; // Middle of panel (content area)
      
      // First update: mouse pressed on content
      panel.update(contentX, contentY, true);
      
      expect(panel.clickStartedOnTitleBar).to.be.false;
    });
    
    it('should reset clickStartedOnTitleBar when mouse released', function() {
      // Start click on title bar
      panel.update(150, 110, true);
      expect(panel.clickStartedOnTitleBar).to.be.true;
      
      // Release mouse
      panel.update(150, 110, false);
      expect(panel.clickStartedOnTitleBar).to.be.false;
    });
    
    it('should allow new click tracking after release', function() {
      // First click on terrain
      panel.update(50, 50, true);
      expect(panel.clickStartedOnTitleBar).to.be.false;
      
      // Release
      panel.update(50, 50, false);
      expect(panel.clickStartedOnTitleBar).to.be.false;
      
      // Second click on title bar
      panel.update(150, 110, true);
      expect(panel.clickStartedOnTitleBar).to.be.true;
    });
  });
  
  describe('Drag Prevention During Painting', function() {
    it('should allow drag when click starts on title bar', function() {
      // Click starts on title bar
      panel.update(150, 110, true);
      
      // Panel should be dragging
      expect(panel.isDragging).to.be.true;
    });
    
    it('should NOT start drag when click starts on terrain and mouse moves to title bar', function() {
      // Click starts on terrain (outside panel)
      panel.update(50, 50, true);
      expect(panel.isDragging).to.be.false;
      expect(panel.clickStartedOnTitleBar).to.be.false;
      
      // Mouse moves to title bar while still pressed
      panel.update(150, 110, true);
      
      // Panel should NOT be dragging (click didn't start on title bar)
      expect(panel.isDragging).to.be.false;
    });
    
    it('should NOT start drag when click starts on panel content and mouse moves to title bar', function() {
      // Click starts on panel content
      panel.update(150, 150, true);
      expect(panel.isDragging).to.be.false;
      expect(panel.clickStartedOnTitleBar).to.be.false;
      
      // Mouse moves to title bar while still pressed
      panel.update(150, 110, true);
      
      // Panel should NOT be dragging
      expect(panel.isDragging).to.be.false;
    });
    
    it('should allow drag on new click after painting session ends', function() {
      // First session: paint on terrain
      panel.update(50, 50, true);
      expect(panel.isDragging).to.be.false;
      
      // Move over panel (still shouldn't drag)
      panel.update(150, 110, true);
      expect(panel.isDragging).to.be.false;
      
      // Release mouse (end painting session)
      panel.update(150, 110, false);
      
      // New click directly on title bar
      panel.update(150, 110, true);
      
      // Now should allow drag
      expect(panel.isDragging).to.be.true;
    });
  });
  
  describe('Normal Drag Behavior Preserved', function() {
    it('should continue dragging when mouse moves within title bar', function() {
      // Start drag on title bar
      panel.update(150, 110, true);
      expect(panel.isDragging).to.be.true;
      
      const initialX = panel.state.position.x;
      
      // Move mouse while dragging (still in title bar)
      panel.update(160, 110, true);
      
      // Should still be dragging and position should update
      expect(panel.isDragging).to.be.true;
      expect(panel.state.position.x).to.not.equal(initialX);
    });
    
    it('should stop dragging when mouse released', function() {
      // Start drag
      panel.update(150, 110, true);
      expect(panel.isDragging).to.be.true;
      
      // Release
      panel.update(150, 110, false);
      
      expect(panel.isDragging).to.be.false;
    });
  });
  
  describe('Minimize Button Protection', function() {
    it('should allow minimize when click starts on title bar', function() {
      const initialMinimized = panel.isMinimized();
      
      // Calculate minimize button position (right side of title bar)
      const minimizeX = panel.state.position.x + panel.config.size.width - 16;
      const minimizeY = panel.state.position.y + 12; // Near top of title bar
      
      // Click on minimize button (click starts on title bar)
      panel.update(minimizeX, minimizeY, true);
      
      // Should toggle minimized state
      expect(panel.isMinimized()).to.equal(!initialMinimized);
    });
    
    it('should NOT minimize when click starts on terrain and mouse moves to minimize button', function() {
      const initialMinimized = panel.isMinimized();
      
      // Click starts on terrain (outside panel)
      panel.update(50, 50, true);
      expect(panel.clickStartedOnTitleBar).to.be.false;
      
      // Calculate minimize button position
      const minimizeX = panel.state.position.x + panel.config.size.width - 16;
      const minimizeY = panel.state.position.y + 12;
      
      // Move to minimize button while still pressed
      panel.update(minimizeX, minimizeY, true);
      
      // Should NOT change minimized state (click didn't start on title bar)
      expect(panel.isMinimized()).to.equal(initialMinimized);
    });
  });
});
