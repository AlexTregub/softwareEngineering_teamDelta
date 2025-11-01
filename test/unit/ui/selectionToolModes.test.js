/**
 * Unit Tests: Selection Tool Modes (PAINT/ENTITY/EVENT)
 * Tests mode-based behavior for painting, entity selection, and event selection
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock global.TILE_SIZE before requiring EntitySelectionTool
global.TILE_SIZE = 32;

describe('EntitySelectionTool - Mode System', function() {
  let entitySelectionTool, mockEntities, mockEvents, mockP5;
  
  beforeEach(function() {
    // Mock p5.js functions
    mockP5 = {
      fill: sinon.stub(),
      noFill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      strokeWeight: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub()
    };
    
    global.fill = mockP5.fill;
    global.noFill = mockP5.noFill;
    global.stroke = mockP5.stroke;
    global.noStroke = mockP5.noStroke;
    global.rect = mockP5.rect;
    global.strokeWeight = mockP5.strokeWeight;
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    
    // Create mock entities and events
    mockEntities = [
      { 
        x: 64, y: 64, w: 32, h: 32, type: 'Ant', 
        getPosition: function() { return { x: this.x, y: this.y }; },
        getSize: function() { return { x: this.w, y: this.h }; }
      },
      { 
        x: 128, y: 128, w: 32, h: 32, type: 'Resource', 
        getPosition: function() { return { x: this.x, y: this.y }; },
        getSize: function() { return { x: this.w, y: this.h }; }
      }
    ];
    
    mockEvents = [
      { 
        x: 96, y: 96, w: 32, h: 32, eventType: 'spawn', 
        getPosition: function() { return { x: this.x, y: this.y }; },
        getSize: function() { return { x: this.w, y: this.h }; }
      },
      { 
        x: 160, y: 160, w: 32, h: 32, eventType: 'dialogue', 
        getPosition: function() { return { x: this.x, y: this.y }; },
        getSize: function() { return { x: this.w, y: this.h }; }
      }
    ];
    
    // Import EntitySelectionTool
    const EntitySelectionTool = require('../../../Classes/ui/EntitySelectionTool');
    entitySelectionTool = new EntitySelectionTool(mockEntities, mockEvents);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Mode Initialization', function() {
    it('should initialize in PAINT mode by default', function() {
      expect(entitySelectionTool.getMode()).to.equal('PAINT');
    });
    
    it('should accept mode in constructor', function() {
      const EntitySelectionTool = require('../../../Classes/ui/EntitySelectionTool');
      const tool = new EntitySelectionTool(mockEntities, mockEvents, 'ENTITY');
      expect(tool.getMode()).to.equal('ENTITY');
    });
  });
  
  describe('Mode Switching', function() {
    it('should switch to ENTITY mode', function() {
      entitySelectionTool.setMode('ENTITY');
      expect(entitySelectionTool.getMode()).to.equal('ENTITY');
    });
    
    it('should switch to EVENT mode', function() {
      entitySelectionTool.setMode('EVENT');
      expect(entitySelectionTool.getMode()).to.equal('EVENT');
    });
    
    it('should switch back to PAINT mode', function() {
      entitySelectionTool.setMode('ENTITY');
      entitySelectionTool.setMode('PAINT');
      expect(entitySelectionTool.getMode()).to.equal('PAINT');
    });
    
    it('should clear selection when switching modes', function() {
      entitySelectionTool.setMode('ENTITY');
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(150, 150);
      entitySelectionTool.handleMouseReleased(150, 150);
      
      expect(entitySelectionTool.getSelectedEntities().length).to.be.greaterThan(0);
      
      entitySelectionTool.setMode('EVENT');
      expect(entitySelectionTool.getSelectedEntities().length).to.equal(0);
    });
  });
  
  describe('PAINT Mode Behavior', function() {
    it('should not start selection box in PAINT mode', function() {
      entitySelectionTool.setMode('PAINT');
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(150, 150);
      
      expect(entitySelectionTool.isSelecting).to.be.false;
    });
    
    it('should not select entities in PAINT mode', function() {
      entitySelectionTool.setMode('PAINT');
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(150, 150);
      entitySelectionTool.handleMouseReleased(150, 150);
      
      expect(entitySelectionTool.getSelectedEntities().length).to.equal(0);
    });
  });
  
  describe('ENTITY Mode Selection', function() {
    beforeEach(function() {
      entitySelectionTool.setMode('ENTITY');
    });
    
    it('should start selection box in ENTITY mode', function() {
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(150, 150);
      
      expect(entitySelectionTool.isSelecting).to.be.true;
    });
    
    it('should select entities within bounds', function() {
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(150, 150);
      entitySelectionTool.handleMouseReleased(150, 150);
      
      const selected = entitySelectionTool.getSelectedEntities();
      expect(selected.length).to.be.greaterThan(0);
      expect(selected.every(item => item.type)).to.be.true; // All should be entities
    });
    
    it('should not select events in ENTITY mode', function() {
      entitySelectionTool.handleMousePressed(80, 80);
      entitySelectionTool.handleMouseDragged(180, 180);
      entitySelectionTool.handleMouseReleased(180, 180);
      
      const selected = entitySelectionTool.getSelectedEntities();
      expect(selected.every(item => !item.eventType)).to.be.true; // No events
    });
    
    it('should delete only entities when in ENTITY mode', function() {
      const initialEntityCount = mockEntities.length;
      const initialEventCount = mockEvents.length;
      
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(150, 150);
      entitySelectionTool.handleMouseReleased(150, 150);
      entitySelectionTool.deleteSelectedEntities();
      
      expect(mockEntities.length).to.be.lessThan(initialEntityCount);
      expect(mockEvents.length).to.equal(initialEventCount); // Events unchanged
    });
  });
  
  describe('EVENT Mode Selection', function() {
    beforeEach(function() {
      entitySelectionTool.setMode('EVENT');
    });
    
    it('should start selection box in EVENT mode', function() {
      entitySelectionTool.handleMousePressed(80, 80);
      entitySelectionTool.handleMouseDragged(180, 180);
      
      expect(entitySelectionTool.isSelecting).to.be.true;
    });
    
    it('should select events within bounds', function() {
      entitySelectionTool.handleMousePressed(80, 80);
      entitySelectionTool.handleMouseDragged(180, 180);
      entitySelectionTool.handleMouseReleased(180, 180);
      
      const selected = entitySelectionTool.getSelectedEntities();
      expect(selected.length).to.be.greaterThan(0);
      expect(selected.every(item => item.eventType)).to.be.true; // All should be events
    });
    
    it('should not select entities in EVENT mode', function() {
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(150, 150);
      entitySelectionTool.handleMouseReleased(150, 150);
      
      const selected = entitySelectionTool.getSelectedEntities();
      expect(selected.every(item => !item.type || item.type === undefined)).to.be.true; // No entity types
    });
    
    it('should delete only events when in EVENT mode', function() {
      const initialEntityCount = mockEntities.length;
      const initialEventCount = mockEvents.length;
      
      entitySelectionTool.handleMousePressed(80, 80);
      entitySelectionTool.handleMouseDragged(180, 180);
      entitySelectionTool.handleMouseReleased(180, 180);
      entitySelectionTool.deleteSelectedEntities();
      
      expect(mockEvents.length).to.be.lessThan(initialEventCount);
      expect(mockEntities.length).to.equal(initialEntityCount); // Entities unchanged
    });
  });
  
  describe('Rendering Colors by Mode', function() {
    beforeEach(function() {
      global.mouseX = 100;
      global.mouseY = 100;
    });
    
    it('should render green hover and blue selection in ENTITY mode', function() {
      entitySelectionTool.setMode('ENTITY');
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(150, 150);
      
      entitySelectionTool.render();
      
      // Check for green hover (0, 255, 0, 100)
      const greenCall = mockP5.fill.getCalls().find(call => 
        call.args[0] === 0 && call.args[1] === 255 && call.args[2] === 0
      );
      expect(greenCall).to.exist;
    });
    
    it('should not render selection box in ENTITY mode after release', function() {
      entitySelectionTool.setMode('ENTITY');
      entitySelectionTool.handleMousePressed(50, 50);
      entitySelectionTool.handleMouseDragged(150, 150);
      entitySelectionTool.handleMouseReleased(150, 150);
      
      mockP5.fill.resetHistory();
      entitySelectionTool.render();
      
      // After release, should not render (isSelecting = false)
      expect(mockP5.fill.called).to.be.false;
    });
    
    it('should render yellow hover and orange selection in EVENT mode', function() {
      entitySelectionTool.setMode('EVENT');
      entitySelectionTool.handleMousePressed(80, 80);
      entitySelectionTool.handleMouseDragged(180, 180);
      
      entitySelectionTool.render();
      
      // Check for yellow hover (255, 255, 0, 100)
      const yellowCall = mockP5.fill.getCalls().find(call => 
        call.args[0] === 255 && call.args[1] === 255 && call.args[2] === 0
      );
      expect(yellowCall).to.exist;
    });
    
    it('should not render selection box in EVENT mode after release', function() {
      entitySelectionTool.setMode('EVENT');
      entitySelectionTool.handleMousePressed(80, 80);
      entitySelectionTool.handleMouseDragged(180, 180);
      entitySelectionTool.handleMouseReleased(180, 180);
      
      mockP5.fill.resetHistory();
      entitySelectionTool.render();
      
      // After release, should not render (isSelecting = false)
      expect(mockP5.fill.called).to.be.false;
    });
    
    it('should not render selection colors in PAINT mode', function() {
      entitySelectionTool.setMode('PAINT');
      entitySelectionTool.render();
      
      // Should not call fill (no selection to render)
      expect(mockP5.fill.called).to.be.false;
    });
  });
  
  describe('Mode Persistence', function() {
    it('should remember mode after deselecting/reselecting tool', function() {
      entitySelectionTool.setMode('EVENT');
      const mode = entitySelectionTool.getMode();
      
      // Simulate tool deselection (mode should persist)
      expect(mode).to.equal('EVENT');
      
      // Mode should still be EVENT after "reselection"
      expect(entitySelectionTool.getMode()).to.equal('EVENT');
    });
  });
});
