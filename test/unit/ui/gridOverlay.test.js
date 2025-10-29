/**
 * Unit Tests: GridOverlay
 * 
 * Tests the GridOverlay UI component for:
 * - Initialization with correct parameters
 * - Visibility toggling
 * - Opacity control
 * - Grid line calculation
 * - Stroke offset alignment fix
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('GridOverlay', function() {
  let GridOverlay;
  let sandbox;
  let mockP5;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js functions
    mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      stroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      line: sandbox.stub(),
      noFill: sandbox.stub(),
      rect: sandbox.stub()
    };
    
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.stroke = mockP5.stroke;
    global.strokeWeight = mockP5.strokeWeight;
    global.line = mockP5.line;
    global.noFill = mockP5.noFill;
    global.rect = mockP5.rect;
    
    // Sync to window for JSDOM compatibility
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.line = global.line;
      window.noFill = global.noFill;
      window.rect = global.rect;
    }
    
    // Load GridOverlay class
    GridOverlay = require('../../../Classes/ui/GridOverlay');
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.push;
    delete global.pop;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.line;
    delete global.noFill;
    delete global.rect;
  });
  
  describe('Constructor', function() {
    it('should initialize with correct parameters', function() {
      const grid = new GridOverlay(32, 50, 50);
      
      expect(grid.tileSize).to.equal(32);
      expect(grid.width).to.equal(50);
      expect(grid.height).to.equal(50);
      expect(grid.visible).to.be.true;
      expect(grid.opacity).to.equal(0.3);
      expect(grid.alpha).to.equal(0.3);
      expect(grid.gridSpacing).to.equal(1);
      expect(grid.hoveredTile).to.be.null;
    });
  });
  
  describe('Visibility', function() {
    it('should toggle visibility', function() {
      const grid = new GridOverlay(32, 50, 50);
      
      expect(grid.visible).to.be.true;
      const result = grid.toggle();
      expect(result).to.be.false;
      expect(grid.visible).to.be.false;
    });
    
    it('should set visibility', function() {
      const grid = new GridOverlay(32, 50, 50);
      
      grid.setVisible(false);
      expect(grid.visible).to.be.false;
      
      grid.setVisible(true);
      expect(grid.visible).to.be.true;
    });
    
    it('should return visibility state', function() {
      const grid = new GridOverlay(32, 50, 50);
      
      expect(grid.isVisible()).to.be.true;
      grid.setVisible(false);
      expect(grid.isVisible()).to.be.false;
    });
  });
  
  describe('Opacity', function() {
    it('should set opacity and sync alpha', function() {
      const grid = new GridOverlay(32, 50, 50);
      
      grid.setOpacity(0.7);
      expect(grid.opacity).to.equal(0.7);
      expect(grid.alpha).to.equal(0.7);
    });
    
    it('should clamp opacity to valid range', function() {
      const grid = new GridOverlay(32, 50, 50);
      
      grid.setOpacity(-0.5);
      expect(grid.opacity).to.equal(0);
      expect(grid.alpha).to.equal(0);
      
      grid.setOpacity(1.5);
      expect(grid.opacity).to.equal(1);
      expect(grid.alpha).to.equal(1);
    });
    
    it('should return current opacity', function() {
      const grid = new GridOverlay(32, 50, 50);
      
      expect(grid.getOpacity()).to.equal(0.3);
      grid.setOpacity(0.5);
      expect(grid.getOpacity()).to.equal(0.5);
    });
  });
  
  describe('Grid Line Calculation', function() {
    it('should calculate vertical lines', function() {
      const grid = new GridOverlay(32, 10, 10);
      const lines = grid.getVerticalLines();
      
      expect(lines).to.be.an('array');
      expect(lines.length).to.equal(11); // 0 to 10 inclusive
      
      // Check first line (x=0)
      expect(lines[0]).to.deep.equal({
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 320 // 10 * 32
      });
      
      // Check last line (x=10)
      expect(lines[10]).to.deep.equal({
        x1: 320,
        y1: 0,
        x2: 320,
        y2: 320
      });
    });
    
    it('should calculate horizontal lines', function() {
      const grid = new GridOverlay(32, 10, 10);
      const lines = grid.getHorizontalLines();
      
      expect(lines).to.be.an('array');
      expect(lines.length).to.equal(11); // 0 to 10 inclusive
      
      // Check first line (y=0)
      expect(lines[0]).to.deep.equal({
        x1: 0,
        y1: 0,
        x2: 320, // 10 * 32
        y2: 0
      });
      
      // Check last line (y=10)
      expect(lines[10]).to.deep.equal({
        x1: 0,
        y1: 320,
        x2: 320,
        y2: 320
      });
    });
  });
  
  describe('Hovered Tile', function() {
    it('should set hovered tile from mouse coordinates', function() {
      const grid = new GridOverlay(32, 10, 10);
      
      const result = grid.setHovered(64, 96); // Tile (2, 3)
      
      expect(result).to.deep.equal({ x: 2, y: 3 });
      expect(grid.hoveredTile).to.deep.equal({ x: 2, y: 3 });
    });
    
    it('should return null for out-of-bounds coordinates', function() {
      const grid = new GridOverlay(32, 10, 10);
      
      const result = grid.setHovered(400, 400); // Outside 10x10 grid
      
      expect(result).to.be.null;
      expect(grid.hoveredTile).to.be.null;
    });
    
    it('should clear hovered tile', function() {
      const grid = new GridOverlay(32, 10, 10);
      
      grid.setHovered(64, 96);
      expect(grid.hoveredTile).to.not.be.null;
      
      grid.clearHovered();
      expect(grid.hoveredTile).to.be.null;
    });
    
    it('should get highlight rectangle for hovered tile', function() {
      const grid = new GridOverlay(32, 10, 10);
      
      grid.setHovered(64, 96); // Tile (2, 3)
      const rect = grid.getHighlightRect();
      
      expect(rect).to.deep.equal({
        x: 64,
        y: 96,
        width: 32,
        height: 32
      });
    });
    
    it('should return null highlight when no tile hovered', function() {
      const grid = new GridOverlay(32, 10, 10);
      
      const rect = grid.getHighlightRect();
      expect(rect).to.be.null;
    });
  });
  
  describe('Rendering', function() {
    it('should not render when p5.js unavailable', function() {
      delete global.push;
      
      const grid = new GridOverlay(32, 10, 10);
      grid.render();
      
      expect(mockP5.push.called).to.be.false;
    });
    
    it('should not render when not visible', function() {
      const grid = new GridOverlay(32, 10, 10);
      grid.setVisible(false);
      
      grid.render();
      
      expect(mockP5.push.called).to.be.false;
    });
    
    it('should render grid lines when visible', function() {
      const grid = new GridOverlay(32, 5, 5);
      
      grid.render();
      
      expect(mockP5.push.calledOnce).to.be.true;
      expect(mockP5.pop.calledOnce).to.be.true;
      expect(mockP5.stroke.calledOnce).to.be.true;
      expect(mockP5.strokeWeight.calledWith(1)).to.be.true;
      
      // Should draw 6 vertical + 6 horizontal lines (0-5 inclusive)
      expect(mockP5.line.callCount).to.equal(12);
    });
    
    it('should apply stroke offset for alignment', function() {
      const grid = new GridOverlay(32, 2, 2);
      
      grid.render(0, 0);
      
      // Stroke offset should be 0.5 pixels to align stroke edge with tile edge
      const strokeOffset = 0.5;
      
      // Check vertical line positions (x coordinates)
      // Line at tile x=0 should be at 0 + strokeOffset
      expect(mockP5.line.getCall(0).args[0]).to.equal(0 + strokeOffset);
      // Line at tile x=1 should be at 32 + strokeOffset
      expect(mockP5.line.getCall(1).args[0]).to.equal(32 + strokeOffset);
      // Line at tile x=2 should be at 64 + strokeOffset
      expect(mockP5.line.getCall(2).args[0]).to.equal(64 + strokeOffset);
      
      // Check horizontal line positions (y coordinates)
      // Line at tile y=0 should be at 0 + strokeOffset
      expect(mockP5.line.getCall(3).args[1]).to.equal(0 + strokeOffset);
      // Line at tile y=1 should be at 32 + strokeOffset
      expect(mockP5.line.getCall(4).args[1]).to.equal(32 + strokeOffset);
      // Line at tile y=2 should be at 64 + strokeOffset
      expect(mockP5.line.getCall(5).args[1]).to.equal(64 + strokeOffset);
    });
    
    it('should apply camera offsets to grid lines', function() {
      const grid = new GridOverlay(32, 2, 2);
      
      const offsetX = 100;
      const offsetY = 50;
      grid.render(offsetX, offsetY);
      
      const strokeOffset = 0.5;
      
      // Check that offsets are applied to line coordinates (including strokeOffset)
      // First vertical line should include offsetX and strokeOffset
      expect(mockP5.line.getCall(0).args[0]).to.equal(0 + strokeOffset + offsetX);
      
      // First horizontal line should include offsetY and strokeOffset
      expect(mockP5.line.getCall(3).args[1]).to.equal(0 + strokeOffset + offsetY);
    });
    
    it('should render hovered tile highlight', function() {
      const grid = new GridOverlay(32, 10, 10);
      
      grid.setHovered(64, 96); // Tile (2, 3)
      grid.render();
      
      // Should call stroke for grid lines and highlight
      expect(mockP5.stroke.callCount).to.equal(2);
      // Should set stroke weight for grid and highlight
      expect(mockP5.strokeWeight.callCount).to.equal(2);
      expect(mockP5.strokeWeight.getCall(1).args[0]).to.equal(2); // Highlight weight
      expect(mockP5.noFill.calledOnce).to.be.true;
      expect(mockP5.rect.calledOnce).to.be.true;
    });
  });
});
