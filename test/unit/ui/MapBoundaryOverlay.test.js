/**
 * Unit Tests for MapBoundaryOverlay
 * 
 * Tests the MapBoundaryOverlay class that visualizes map boundaries
 * in the Level Editor viewport.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('MapBoundaryOverlay', function() {
  let MapBoundaryOverlay;
  let overlay;
  let mockTerrain;
  
  before(function() {
    // Mock global functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noFill = sinon.stub();
    global.rect = sinon.stub();
    global.line = sinon.stub();
    global.fill = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.text = sinon.stub();
    global.CENTER = 'center';
    global.BOTTOM = 'bottom';
    
    // Load MapBoundaryOverlay
    try {
      MapBoundaryOverlay = require('../../../Classes/ui/MapBoundaryOverlay.js');
    } catch (e) {
      console.log('[MapBoundaryOverlay] Class not available - tests will be skipped');
      MapBoundaryOverlay = null;
    }
  });
  
  beforeEach(function() {
    if (!MapBoundaryOverlay) this.skip();
    
    // Create mock terrain with MAX_MAP_SIZE
    mockTerrain = {
      MAX_MAP_SIZE: 100,
      tileSize: 32,
      _gridSizeX: 100,
      _gridSizeY: 100
    };
    
    // Reset stubs
    sinon.reset();
  });
  
  afterEach(function() {
    sinon.reset();
  });
  
  after(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with terrain reference', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay = new MapBoundaryOverlay(mockTerrain);
      
      expect(overlay.terrain).to.equal(mockTerrain);
    });
    
    it('should start visible by default', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay = new MapBoundaryOverlay(mockTerrain);
      
      expect(overlay.visible).to.be.true;
    });
    
    it('should calculate world bounds from terrain', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay = new MapBoundaryOverlay(mockTerrain);
      
      // 100 tiles * 32px = 3200px world size
      expect(overlay.worldWidth).to.equal(3200);
      expect(overlay.worldHeight).to.equal(3200);
    });
    
    it('should handle non-square maps', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      mockTerrain.MAX_MAP_SIZE = 50; // Will use this for square
      mockTerrain._gridSizeX = 100;
      mockTerrain._gridSizeY = 50;
      
      overlay = new MapBoundaryOverlay(mockTerrain);
      
      expect(overlay.worldWidth).to.equal(3200); // 100 * 32
      expect(overlay.worldHeight).to.equal(1600); // 50 * 32
    });
  });
  
  describe('setVisible()', function() {
    beforeEach(function() {
      if (!MapBoundaryOverlay) this.skip();
      overlay = new MapBoundaryOverlay(mockTerrain);
    });
    
    it('should set visibility to true', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay.visible = false;
      overlay.setVisible(true);
      
      expect(overlay.visible).to.be.true;
    });
    
    it('should set visibility to false', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay.visible = true;
      overlay.setVisible(false);
      
      expect(overlay.visible).to.be.false;
    });
  });
  
  describe('toggle()', function() {
    beforeEach(function() {
      if (!MapBoundaryOverlay) this.skip();
      overlay = new MapBoundaryOverlay(mockTerrain);
    });
    
    it('should toggle visibility from true to false', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay.visible = true;
      overlay.toggle();
      
      expect(overlay.visible).to.be.false;
    });
    
    it('should toggle visibility from false to true', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay.visible = false;
      overlay.toggle();
      
      expect(overlay.visible).to.be.true;
    });
  });
  
  describe('render()', function() {
    beforeEach(function() {
      if (!MapBoundaryOverlay) this.skip();
      overlay = new MapBoundaryOverlay(mockTerrain);
    });
    
    it('should not render when visibility is false', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay.visible = false;
      overlay.render();
      
      expect(global.push.called).to.be.false;
    });
    
    it('should render boundary rectangle when visible', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay.visible = true;
      overlay.render();
      
      expect(global.push.calledOnce).to.be.true;
      expect(global.pop.calledOnce).to.be.true;
      expect(global.stroke.called).to.be.true;
      expect(global.noFill.called).to.be.true;
      expect(global.rect.calledOnce).to.be.true;
    });
    
    it('should draw rectangle with correct dimensions', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay.visible = true;
      overlay.render();
      
      // rect(x, y, width, height)
      const rectCall = global.rect.getCall(0);
      expect(rectCall.args[0]).to.equal(0); // x
      expect(rectCall.args[1]).to.equal(0); // y
      expect(rectCall.args[2]).to.equal(3200); // width (100 * 32)
      expect(rectCall.args[3]).to.equal(3200); // height (100 * 32)
    });
    
    it('should use semi-transparent stroke for boundary', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay.visible = true;
      overlay.render();
      
      // stroke(r, g, b, a)
      const strokeCall = global.stroke.getCall(0);
      expect(strokeCall.args[0]).to.equal(255); // red
      expect(strokeCall.args[1]).to.equal(255); // green
      expect(strokeCall.args[2]).to.equal(0);   // blue (yellow)
      expect(strokeCall.args[3]).to.be.within(100, 200); // semi-transparent
    });
    
    it('should render dimension label', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      overlay.visible = true;
      overlay.render();
      
      expect(global.text.called).to.be.true;
      const textCall = global.text.getCall(0);
      expect(textCall.args[0]).to.include('100x100'); // Dimension text
    });
  });
  
  describe('updateTerrain()', function() {
    beforeEach(function() {
      if (!MapBoundaryOverlay) this.skip();
      overlay = new MapBoundaryOverlay(mockTerrain);
    });
    
    it('should update terrain reference', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      const newTerrain = {
        MAX_MAP_SIZE: 200,
        tileSize: 32,
        _gridSizeX: 200,
        _gridSizeY: 200
      };
      
      overlay.updateTerrain(newTerrain);
      
      expect(overlay.terrain).to.equal(newTerrain);
    });
    
    it('should recalculate bounds when terrain updates', function() {
      if (!MapBoundaryOverlay) this.skip();
      
      const newTerrain = {
        MAX_MAP_SIZE: 50,
        tileSize: 32,
        _gridSizeX: 50,
        _gridSizeY: 50
      };
      
      overlay.updateTerrain(newTerrain);
      
      expect(overlay.worldWidth).to.equal(1600); // 50 * 32
      expect(overlay.worldHeight).to.equal(1600);
    });
  });
});
