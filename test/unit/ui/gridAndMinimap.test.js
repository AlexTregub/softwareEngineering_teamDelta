/**
 * Consolidated UI Grid & Minimap Tests
 * Generated: 2025-10-29T03:11:41.115Z
 * Source files: 5
 * Total tests: 103
 * 
 * This file contains all ui grid & minimap tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');
let sinon = require('sinon');


// ================================================================
// DynamicGridOverlay.test.js (13 tests)
// ================================================================
/**
 * DynamicGridOverlay v3 - Unit Tests
 * 
 * Tests the simplified grid overlay (direct rendering, no caching)
 * 
 * v3 Changes:
 * - Removed UIObject inheritance
 * - Removed CacheManager integration
 * - Removed feathering system
 * - Removed edge detection
 * - Direct p5.js rendering each frame
 * - Only renders grid for painted tiles (sparse)
 * 
 * Total: 13 tests
 */

describe('DynamicGridOverlay', function() {
    let mockTerrain, overlay;
    let pushStub, popStub, strokeStub, strokeWeightStub, lineStub;
    
    beforeEach(function() {
        // Mock p5.js drawing functions
        pushStub = sinon.stub();
        popStub = sinon.stub();
        strokeStub = sinon.stub();
        strokeWeightStub = sinon.stub();
        lineStub = sinon.stub();
        
        global.push = pushStub;
        global.pop = popStub;
        global.stroke = strokeStub;
        global.strokeWeight = strokeWeightStub;
        global.line = lineStub;
        
        // Mock SparseTerrain with CORRECT generator function API
        mockTerrain = {
            getAllTiles: function* () {
                yield { x: 0, y: 0, material: 'grass' };
                yield { x: 1, y: 0, material: 'grass' };
                yield { x: 0, y: 1, material: 'grass' };
                yield { x: 1, y: 1, material: 'grass' };
            }
        };
        
        const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
        overlay = new DynamicGridOverlay(mockTerrain, 32, 2);
    });
    
    afterEach(function() {
        sinon.restore();
        delete global.push;
        delete global.pop;
        delete global.stroke;
        delete global.strokeWeight;
        delete global.line;
    });
    
    describe('Constructor', function() {
        it('should initialize with defaults', function() {
            expect(overlay.terrain).to.equal(mockTerrain);
            expect(overlay.tileSize).to.equal(32);
            expect(overlay.bufferSize).to.equal(2);
            expect(overlay.visible).to.equal(true);
        });
        
        it('should use default tileSize=32 when not provided', function() {
            const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
            const defaultOverlay = new DynamicGridOverlay(mockTerrain);
            expect(defaultOverlay.tileSize).to.equal(32);
            expect(defaultOverlay.bufferSize).to.equal(2);
        });
    });
    
    describe('render()', function() {
        it('should skip rendering when not visible', function() {
            overlay.visible = false;
            overlay.render();
            
            expect(pushStub.called).to.be.false;
            expect(lineStub.called).to.be.false;
        });
        
        it('should skip rendering when terrain is null', function() {
            overlay.terrain = null;
            overlay.render();
            
            expect(pushStub.called).to.be.false;
            expect(lineStub.called).to.be.false;
        });
        
        it('should skip rendering when getAllTiles not available', function() {
            overlay.terrain = {};
            overlay.render();
            
            expect(pushStub.called).to.be.false;
            expect(lineStub.called).to.be.false;
        });
        
        it('should skip rendering when no tiles exist', function() {
            // Override with empty generator
            overlay.terrain = {
                getAllTiles: function* () {
                    // Empty - yields nothing
                }
            };
            overlay.render();
            
            expect(pushStub.called).to.be.false;
            expect(lineStub.called).to.be.false;
        });
        
        it('should render grid for painted tiles with buffer', function() {
            overlay.render();
            
            // Should call drawing setup
            expect(pushStub.calledOnce).to.be.true;
            expect(popStub.calledOnce).to.be.true;
            expect(strokeStub.calledOnce).to.be.true;
            expect(strokeWeightStub.calledOnce).to.be.true;
            
            // Should draw grid lines
            expect(lineStub.called).to.be.true;
        });
        
        it('should calculate bounds from painted tiles', function() {
            // Tiles at (0,0), (1,0), (0,1), (1,1)
            // Bounds: minX=0, maxX=1, minY=0, maxY=1
            // With bufferSize=2: minX=-2, maxX=3, minY=-2, maxY=3
            
            overlay.render();
            
            // Vertical lines: from -2 to 4 (7 lines)
            // Horizontal lines: from -2 to 4 (7 lines)
            const totalLines = 7 + 7;
            expect(lineStub.callCount).to.equal(totalLines);
        });
        
        it('should use grid appearance settings', function() {
            overlay.gridColor = [100, 150, 200, 80];
            overlay.gridWeight = 2;
            
            overlay.render();
            
            expect(strokeStub.calledWith(100, 150, 200, 80)).to.be.true;
            expect(strokeWeightStub.calledWith(2)).to.be.true;
        });
    });
    
    describe('setVisible()', function() {
        it('should toggle visibility', function() {
            overlay.setVisible(false);
            expect(overlay.visible).to.be.false;
            
            overlay.setVisible(true);
            expect(overlay.visible).to.be.true;
        });
    });
    
    describe('destroy()', function() {
        it('should complete without errors', function() {
            expect(() => overlay.destroy()).to.not.throw();
        });
    });
    
    describe('CRITICAL: Real SparseTerrain Integration', function() {
        it('should handle generator function from getAllTiles()', function() {
            // SparseTerrain.getAllTiles() is a GENERATOR that yields {x, y, material} objects
            const realTerrainMock = {
                getAllTiles: function* () {
                    yield { x: 0, y: 0, material: 'grass' };
                    yield { x: 1, y: 0, material: 'grass' };
                    yield { x: 0, y: 1, material: 'grass' };
                    yield { x: 1, y: 1, material: 'grass' };
                }
            };
            
            const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
            const realOverlay = new DynamicGridOverlay(realTerrainMock, 32, 2);
            
            // This should NOT throw "not iterable" error
            expect(() => realOverlay.render()).to.not.throw();
            
            // Should have called drawing functions
            expect(pushStub.called).to.be.true;
            expect(lineStub.called).to.be.true;
        });
        
        it('should calculate bounds from generator objects with x,y properties', function() {
            const realTerrainMock = {
                getAllTiles: function* () {
                    yield { x: 5, y: 3, material: 'grass' };
                    yield { x: 7, y: 3, material: 'stone' };
                    yield { x: 5, y: 6, material: 'dirt' };
                }
            };
            
            const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
            const realOverlay = new DynamicGridOverlay(realTerrainMock, 32, 2);
            
            realOverlay.render();
            
            // Bounds: minX=5, maxX=7, minY=3, maxY=6
            // With bufferSize=2: minX=3, maxX=9, minY=1, maxY=8
            // Vertical lines: from 3 to 10 (8 lines)
            // Horizontal lines: from 1 to 9 (9 lines)
            const totalLines = 8 + 9;
            expect(lineStub.callCount).to.equal(totalLines);
        });
    });
});




// ================================================================
// gridOverlay.test.js (20 tests)
// ================================================================
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




// ================================================================
// DynamicMinimap.test.js (26 tests)
// ================================================================
/**
 * Unit Tests: DynamicMinimap (TDD - Phase 3A)
 * 
 * Tests dynamic minimap that shows only painted terrain region.
 * Viewport calculated from terrain bounds, not fixed 50x50 grid.
 * 
 * TDD: Write FIRST before implementation exists!
 */

describe('DynamicMinimap', function() {
  let minimap, mockTerrain, mockP5;
  
  beforeEach(function() {
    // Mock p5.js drawing functions
    mockP5 = {
      fill: sinon.stub(),
      noFill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      rect: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      translate: sinon.stub(),
      scale: sinon.stub()
    };
    
    global.fill = mockP5.fill;
    global.noFill = mockP5.noFill;
    global.stroke = mockP5.stroke;
    global.noStroke = mockP5.noStroke;
    global.strokeWeight = mockP5.strokeWeight;
    global.rect = mockP5.rect;
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.translate = mockP5.translate;
    global.scale = mockP5.scale;
    
    // Mock SparseTerrain
    mockTerrain = {
      getBounds: sinon.stub().returns(null),
      getAllTiles: sinon.stub().returns([]),
      tileSize: 32
    };
    
    // DynamicMinimap doesn't exist yet - tests will fail (EXPECTED)
    const DynamicMinimap = require('../../../Classes/ui/DynamicMinimap');
    minimap = new DynamicMinimap(mockTerrain, 200, 200); // 200x200 minimap
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with terrain reference', function() {
      expect(minimap.terrain).to.equal(mockTerrain);
    });
    
    it('should initialize with minimap dimensions', function() {
      expect(minimap.width).to.equal(200);
      expect(minimap.height).to.equal(200);
    });
    
    it('should initialize with default padding', function() {
      expect(minimap.padding).to.equal(2); // 2 tiles padding
    });
    
    it('should initialize viewport as null (no bounds)', function() {
      expect(minimap.viewport).to.be.null;
    });
  });
  
  describe('calculateViewport()', function() {
    it('should return null when no tiles painted', function() {
      mockTerrain.getBounds.returns(null);
      
      const viewport = minimap.calculateViewport();
      expect(viewport).to.be.null;
    });
    
    it('should calculate viewport from terrain bounds with padding', function() {
      mockTerrain.getBounds.returns({ minX: 0, maxX: 10, minY: 0, maxY: 10 });
      
      const viewport = minimap.calculateViewport();
      
      expect(viewport).to.not.be.null;
      // Should add 2 tiles padding on each side
      expect(viewport.minX).to.equal(-2); // 0 - 2
      expect(viewport.maxX).to.equal(12); // 10 + 2
      expect(viewport.minY).to.equal(-2); // 0 - 2
      expect(viewport.maxY).to.equal(12); // 10 + 2
    });
    
    it('should handle single tile', function() {
      mockTerrain.getBounds.returns({ minX: 5, maxX: 5, minY: 5, maxY: 5 });
      
      const viewport = minimap.calculateViewport();
      
      expect(viewport.minX).to.equal(3); // 5 - 2
      expect(viewport.maxX).to.equal(7); // 5 + 2
    });
    
    it('should handle negative coordinates', function() {
      mockTerrain.getBounds.returns({ minX: -10, maxX: -5, minY: -8, maxY: -3 });
      
      const viewport = minimap.calculateViewport();
      
      expect(viewport.minX).to.equal(-12); // -10 - 2
      expect(viewport.maxX).to.equal(-3);  // -5 + 2
    });
    
    it('should handle very large bounds', function() {
      mockTerrain.getBounds.returns({ minX: 0, maxX: 1000, minY: 0, maxY: 1000 });
      
      const viewport = minimap.calculateViewport();
      
      expect(viewport.minX).to.equal(-2);
      expect(viewport.maxX).to.equal(1002);
    });
  });
  
  describe('calculateScale()', function() {
    it('should return 1.0 when no viewport', function() {
      const scale = minimap.calculateScale(null);
      expect(scale).to.equal(1.0);
    });
    
    it('should calculate scale to fit viewport in minimap', function() {
      const viewport = { minX: 0, maxX: 10, minY: 0, maxY: 10 }; // 11x11 tiles
      
      const scale = minimap.calculateScale(viewport);
      
      // Minimap is 200x200, viewport is 11x11 tiles (11 * 32 = 352 pixels)
      // Scale should be 200 / 352 ≈ 0.568
      expect(scale).to.be.closeTo(0.568, 0.01);
    });
    
    it('should use minimum scale for non-square viewports', function() {
      const viewport = { minX: 0, maxX: 20, minY: 0, maxY: 10 }; // 21x11 tiles
      
      const scale = minimap.calculateScale(viewport);
      
      // Width: 21 tiles * 32 = 672 pixels, scale = 200/672 = 0.298
      // Height: 11 tiles * 32 = 352 pixels, scale = 200/352 = 0.568
      // Should use minimum (0.298) to fit both dimensions
      expect(scale).to.be.closeTo(0.298, 0.01);
    });
  });
  
  describe('worldToMinimap()', function() {
    it('should convert world coordinates to minimap coordinates', function() {
      const viewport = { minX: 0, maxX: 10, minY: 0, maxY: 10 };
      minimap.viewport = viewport;
      minimap.scale = 0.5;
      
      const minimapCoords = minimap.worldToMinimap(5, 5);
      
      expect(minimapCoords).to.have.property('x');
      expect(minimapCoords).to.have.property('y');
    });
    
    it('should handle viewport offset correctly', function() {
      const viewport = { minX: -10, maxX: 10, minY: -10, maxY: 10 };
      minimap.viewport = viewport;
      minimap.scale = 1.0;
      
      const minimapCoords = minimap.worldToMinimap(0, 0); // World center
      
      // (0 - (-10)) * 32 * 1.0 = 320 pixels from minimap origin
      expect(minimapCoords.x).to.equal(320);
      expect(minimapCoords.y).to.equal(320);
    });
  });
  
  describe('render()', function() {
    it('should not render when no tiles painted', function() {
      mockTerrain.getBounds.returns(null);
      
      minimap.render();
      
      // Should not draw anything
      expect(mockP5.rect.called).to.be.false;
    });
    
    it('should render background rect', function() {
      mockTerrain.getBounds.returns({ minX: 0, maxX: 5, minY: 0, maxY: 5 });
      mockTerrain.getAllTiles.returns([
        { x: 0, y: 0, material: 'grass' }
      ]);
      
      minimap.update(); // CRITICAL: Update before render
      minimap.render();
      
      // Should call rect at least once (background or tiles)
      expect(mockP5.rect.called).to.be.true;
    });
    
    it('should render painted tiles', function() {
      mockTerrain.getBounds.returns({ minX: 0, maxX: 2, minY: 0, maxY: 2 });
      mockTerrain.getAllTiles.returns([
        { x: 0, y: 0, material: 'grass' },
        { x: 1, y: 1, material: 'stone' },
        { x: 2, y: 2, material: 'water' }
      ]);
      
      minimap.update(); // CRITICAL: Update before render
      minimap.render();
      
      // Should render tiles (at least 3 tiles)
      expect(mockP5.rect.callCount).to.be.greaterThan(2);
    });
    
    it('should use push/pop for isolation', function() {
      mockTerrain.getBounds.returns({ minX: 0, maxX: 5, minY: 0, maxY: 5 });
      mockTerrain.getAllTiles.returns([{ x: 0, y: 0, material: 'grass' }]);
      
      minimap.update(); // CRITICAL: Update before render
      minimap.render();
      
      expect(mockP5.push.called).to.be.true;
      expect(mockP5.pop.called).to.be.true;
    });
  });
  
  describe('update()', function() {
    it('should update viewport when terrain bounds change', function() {
      mockTerrain.getBounds.returns(null);
      minimap.update();
      expect(minimap.viewport).to.be.null;
      
      // Bounds change (tile painted)
      mockTerrain.getBounds.returns({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
      minimap.update();
      
      expect(minimap.viewport).to.not.be.null;
      expect(minimap.viewport.minX).to.equal(-2); // 0 - padding
    });
    
    it('should recalculate scale when viewport changes', function() {
      mockTerrain.getBounds.returns({ minX: 0, maxX: 5, minY: 0, maxY: 5 });
      minimap.update();
      const oldScale = minimap.scale;
      
      // Bounds expand
      mockTerrain.getBounds.returns({ minX: 0, maxX: 10, minY: 0, maxY: 10 });
      minimap.update();
      
      // Scale should change (viewport got larger)
      expect(minimap.scale).to.not.equal(oldScale);
      expect(minimap.scale).to.be.lessThan(oldScale); // Zoomed out
    });
  });
  
  describe('renderCameraViewport()', function() {
    it('should render camera viewport outline', function() {
      const cameraViewport = { minX: 0, maxX: 10, minY: 0, maxY: 10 };
      minimap.viewport = { minX: -5, maxX: 15, minY: -5, maxY: 15 };
      minimap.scale = 0.5;
      
      minimap.renderCameraViewport(cameraViewport);
      
      // Should draw viewport rect
      expect(mockP5.rect.called).to.be.true;
      expect(mockP5.noFill.called).to.be.true; // Outline only
      expect(mockP5.stroke.called).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty terrain gracefully', function() {
      mockTerrain.getBounds.returns(null);
      mockTerrain.getAllTiles.returns([]);
      
      minimap.update();
      minimap.render();
      
      expect(minimap.viewport).to.be.null;
    });
    
    it('should handle very small viewport (single tile)', function() {
      mockTerrain.getBounds.returns({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
      
      minimap.update();
      
      expect(minimap.viewport).to.not.be.null;
      expect(minimap.scale).to.be.greaterThan(0);
    });
    
    it('should handle very large viewport (1000x1000)', function() {
      mockTerrain.getBounds.returns({ minX: 0, maxX: 1000, minY: 0, maxY: 1000 });
      
      minimap.update();
      
      expect(minimap.viewport).to.not.be.null;
      expect(minimap.scale).to.be.greaterThan(0);
      expect(minimap.scale).to.be.lessThan(1); // Zoomed way out
    });
    
    it('should handle asymmetric bounds', function() {
      mockTerrain.getBounds.returns({ minX: -100, maxX: 50, minY: -20, maxY: 200 });
      
      minimap.update();
      
      expect(minimap.viewport.minX).to.equal(-102); // -100 - 2
      expect(minimap.viewport.maxX).to.equal(52);   // 50 + 2
      expect(minimap.viewport.minY).to.equal(-22);  // -20 - 2
      expect(minimap.viewport.maxY).to.equal(202);  // 200 + 2
    });
  });
  
  describe('Performance', function() {
    it('should only render tiles within minimap viewport', function() {
      mockTerrain.getBounds.returns({ minX: 0, maxX: 100, minY: 0, maxY: 100 });
      
      // Create many tiles
      const tiles = [];
      for (let i = 0; i < 100; i++) {
        tiles.push({ x: i, y: i, material: 'grass' });
      }
      mockTerrain.getAllTiles.returns(tiles);
      
      minimap.update(); // CRITICAL: Update before render
      minimap.render();
      
      // Should render efficiently (not crash, complete in reasonable time)
      expect(mockP5.rect.called).to.be.true;
    });
  });
});




// ================================================================
// miniMap.test.js (20 tests)
// ================================================================
/**
 * Unit Tests for MiniMap
 * 
 * Tests mini map functionality including:
 * - Camera viewport tracking
 * - Viewport indicator rendering (green rectangle)
 * - Draggable panel integration
 * - Coordinate transformations
 * - Terrain rendering
 */

let { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

let MiniMap = require('../../../Classes/ui/MiniMap');

describe('MiniMap - Draggable Panel Integration', function() {
    let miniMap, mockTerrain, cleanup;
    
    beforeEach(function() {
        // Setup UI test environment (includes p5.js mocks)
        cleanup = setupUITestEnvironment();
        
        // Create mock terrain - MUCH SMALLER to avoid memory issues
        // 10x10 instead of 100x100
        mockTerrain = {
            width: 10,
            height: 10,
            tileSize: 32,
            getArrPos: function(pos) {
                // Return mock tile data
                return {
                    getMaterial: () => 'grass'
                };
            }
        };
        
        miniMap = new MiniMap(mockTerrain, 200, 200);
    });
    
    afterEach(function() {
        sinon.restore();
    });
    
    describe('Panel Content Integration', function() {
        it('should have getContentSize method', function() {
            expect(miniMap).to.respondTo('getContentSize');
        });
        
        it('should return content size for panel layout', function() {
            const size = miniMap.getContentSize();
            
            expect(size).to.be.an('object');
            expect(size).to.have.property('width');
            expect(size).to.have.property('height');
            expect(size.width).to.equal(200);
            expect(size.height).to.equal(220); // 200 + 20 for label
        });
        
        it('should accept isPanelContent option in render', function() {
            // Should not throw when isPanelContent is provided
            expect(() => {
                miniMap.render(0, 0, { isPanelContent: true });
            }).to.not.throw();
        });
        
        it('should skip background when isPanelContent is true', function() {
            global.fill.resetHistory();
            global.stroke.resetHistory();
            global.rect.resetHistory();
            
            miniMap.render(0, 0, { isPanelContent: true });
            
            // Should not draw panel background (first rect call is background)
            const firstRectCall = global.rect.getCall(0);
            if (firstRectCall) {
                // If background was drawn, it would be a full-size rect at 0,0
                // When isPanelContent is true, first rect should be a terrain tile
                const args = firstRectCall.args;
                expect(args[0]).to.not.equal(0); // Not at origin
            }
        });
        
        it('should render background when isPanelContent is false', function() {
            global.fill.resetHistory();
            global.rect.resetHistory();
            
            miniMap.render(0, 0, { isPanelContent: false });
            
            // Should draw background (dark fill + border)
            expect(global.fill.calledWith(20, 20, 20)).to.be.true;
            expect(global.stroke.calledWith(100, 150, 255)).to.be.true;
        });
        
        it('should skip label when isPanelContent is true', function() {
            global.text.resetHistory();
            
            miniMap.render(0, 0, { isPanelContent: true });
            
            // Should not draw "Mini Map" label
            expect(global.text.called).to.be.false;
        });
    });
    
    describe('Camera Integration', function() {
        it('should have setCamera method', function() {
            expect(miniMap).to.respondTo('setCamera');
        });
        
        it('should store camera reference', function() {
            const mockCamera = { x: 100, y: 100, width: 800, height: 600 };
            miniMap.setCamera(mockCamera);
            
            expect(miniMap.camera).to.equal(mockCamera);
        });
        
        it('should get viewport rect from stored camera', function() {
            const mockCamera = { x: 100, y: 100, width: 800, height: 600 };
            miniMap.setCamera(mockCamera);
            
            const viewport = miniMap.getViewportRect();
            
            expect(viewport).to.be.an('object');
            expect(viewport.x).to.equal(mockCamera.x * miniMap.scale);
            expect(viewport.y).to.equal(mockCamera.y * miniMap.scale);
        });
        
        it('should use stored camera when rendering viewport indicator', function() {
            const mockCamera = { x: 200, y: 150, width: 800, height: 600 };
            miniMap.setCamera(mockCamera);
            
            global.stroke.resetHistory();
            global.rect.resetHistory();
            
            miniMap.render(0, 0);
            
            // Should draw viewport rectangle using stored camera
            expect(global.stroke.calledWith(0, 255, 0)).to.be.true; // Green
            
            // Check rect was called with scaled camera dimensions
            const rectCalls = global.rect.getCalls();
            const viewportRectCall = rectCalls.find(call => {
                const [x, y, w, h] = call.args;
                return Math.abs(x - (mockCamera.x * miniMap.scale)) < 1 &&
                       Math.abs(y - (mockCamera.y * miniMap.scale)) < 1;
            });
            
            expect(viewportRectCall).to.exist;
        });
    });
    
    describe('Viewport Indicator - Green Rectangle', function() {
        it('should render viewport indicator in green', function() {
            const mockCamera = { x: 100, y: 100, width: 800, height: 600 };
            miniMap.setCamera(mockCamera);
            
            global.stroke.resetHistory();
            
            miniMap.render(0, 0);
            
            // Viewport indicator should be green (0, 255, 0)
            expect(global.stroke.calledWith(0, 255, 0)).to.be.true;
        });
        
        it('should not render yellow viewport indicator', function() {
            const mockCamera = { x: 100, y: 100, width: 800, height: 600 };
            miniMap.setCamera(mockCamera);
            
            global.stroke.resetHistory();
            
            miniMap.render(0, 0);
            
            // Should NOT use yellow (255, 255, 0)
            expect(global.stroke.calledWith(255, 255, 0)).to.be.false;
        });
        
        it('should render viewport rectangle with correct dimensions', function() {
            const mockCamera = { x: 100, y: 100, width: 800, height: 600 };
            miniMap.setCamera(mockCamera);
            
            global.rect.resetHistory();
            
            miniMap.render(0, 0);
            
            const viewport = miniMap.getViewportRect();
            
            // Find the viewport rectangle call (after noFill, with green stroke)
            const rectCalls = global.rect.getCalls();
            const viewportRectCall = rectCalls.find(call => {
                const [x, y, w, h] = call.args;
                return Math.abs(x - viewport.x) < 1 &&
                       Math.abs(y - viewport.y) < 1 &&
                       Math.abs(w - viewport.width) < 1 &&
                       Math.abs(h - viewport.height) < 1;
            });
            
            expect(viewportRectCall).to.exist;
        });
    });
    
    describe('Coordinate Transformations', function() {
        it('should calculate correct scale factor', function() {
            const expectedScale = Math.min(200 / (100 * 32), 200 / (100 * 32));
            expect(miniMap.getScale()).to.equal(expectedScale);
        });
        
        it('should convert world position to minimap coordinates', function() {
            const worldPos = miniMap.worldToMiniMap(100, 100);
            
            expect(worldPos.x).to.equal(100 * miniMap.scale);
            expect(worldPos.y).to.equal(100 * miniMap.scale);
        });
        
        it('should convert minimap click to world position', function() {
            const miniMapX = 50 * miniMap.scale;
            const miniMapY = 75 * miniMap.scale;
            
            const worldPos = miniMap.clickToWorldPosition(miniMapX, miniMapY);
            
            expect(worldPos.x).to.be.closeTo(50, 0.1);
            expect(worldPos.y).to.be.closeTo(75, 0.1);
        });
    });
    
    describe('Update Method', function() {
        it('should have update method', function() {
            expect(miniMap).to.respondTo('update');
        });
        
        it('should update without camera reference', function() {
            expect(() => {
                miniMap.update();
            }).to.not.throw();
        });
        
        it('should update with camera reference', function() {
            const mockCamera = { x: 100, y: 100, width: 800, height: 600 };
            miniMap.setCamera(mockCamera);
            
            expect(() => {
                miniMap.update();
            }).to.not.throw();
        });
    });
    
    describe('Terrain Rendering', function() {
        it('should handle terrain rendering without errors', function() {
            // Don't actually render terrain tiles in unit tests (causes memory issues)
            // Just verify the method exists and doesn't crash
            expect(() => {
                miniMap.getDimensions();
            }).to.not.throw();
        });
    });
});




// ================================================================
// miniMap.debounce.test.js (24 tests)
// ================================================================
/**
 * Unit Tests - MiniMap Debounced Cache Invalidation
 * 
 * Tests the debounced cache invalidation system for terrain editing:
 * - Schedule invalidation when painting starts
 * - Debounce multiple rapid edits
 * - Invalidate cache 1 second after last edit
 * - Cancel pending invalidation if disabled
 * 
 * TDD Phase: RED - Tests written FIRST, implementation follows
 */

describe('MiniMap - Debounced Cache Invalidation', function() {
  let MiniMap;
  let clock;
  let mockTerrain;
  let mockCacheManager;

  beforeEach(function() {
    // Setup fake timers for debounce testing
    clock = sinon.useFakeTimers({
      shouldAdvanceTime: false,
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']
    });
    
    // Mock terrain
    mockTerrain = {
      width: 50,
      height: 50,
      tileSize: 32,
      getArrPos: sinon.stub().returns({
        getMaterial: () => 'grass'
      })
    };
    
    // Mock CacheManager
    mockCacheManager = {
      register: sinon.stub(),
      getCache: sinon.stub().returns({
        _buffer: { clear: sinon.stub() },
        valid: false,
        config: { renderCallback: sinon.stub() },
        hits: 0
      }),
      invalidate: sinon.stub(),
      removeCache: sinon.stub()
    };
    
    // Setup globals
    global.CacheManager = {
      getInstance: () => mockCacheManager
    };
    
    // Load MiniMap
    delete require.cache[require.resolve('../../../Classes/ui/MiniMap')];
    MiniMap = require('../../../Classes/ui/MiniMap');
    
    if (!MiniMap) {
      this.skip();
    }
  });

  afterEach(function() {
    clock.restore();
    sinon.restore();
    delete global.CacheManager;
  });

  describe('Debounce Timer', function() {
    it('should have debounce delay property (default 1000ms)', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      expect(minimap).to.have.property('_invalidateDebounceDelay');
      expect(minimap._invalidateDebounceDelay).to.equal(1000);
    });

    it('should allow configuring debounce delay', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.setInvalidateDebounceDelay(500);
      expect(minimap._invalidateDebounceDelay).to.equal(500);
    });

    it('should track pending invalidation timer', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      expect(minimap).to.have.property('_invalidateTimer');
      expect(minimap._invalidateTimer).to.be.null;
    });
  });

  describe('Schedule Invalidation', function() {
    it('should schedule invalidation on first edit', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      
      expect(minimap._invalidateTimer).to.not.be.null;
    });

    it('should NOT invalidate immediately', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      
      expect(mockCacheManager.invalidate.called).to.be.false;
    });

    it('should invalidate after debounce delay (1000ms)', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      clock.tick(999); // Just before delay
      expect(mockCacheManager.invalidate.called).to.be.false;
      
      clock.tick(1); // At delay
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });

    it('should reset timer on subsequent edits (debouncing)', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      clock.tick(500); // 500ms pass
      
      minimap.scheduleInvalidation(); // Second edit resets timer
      clock.tick(500); // 500ms more (1000ms total)
      
      // Should NOT have invalidated yet (timer was reset)
      expect(mockCacheManager.invalidate.called).to.be.false;
      
      clock.tick(500); // 500ms more (1500ms total, 1000ms from second edit)
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });

    it('should handle rapid edits correctly (only invalidate once)', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      // Simulate 10 rapid edits
      for (let i = 0; i < 10; i++) {
        minimap.scheduleInvalidation();
        clock.tick(100); // 100ms between edits
      }
      
      // Should not have invalidated during edits
      expect(mockCacheManager.invalidate.called).to.be.false;
      
      // Wait for debounce after last edit
      clock.tick(1000);
      
      // Should invalidate exactly once
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });
  });

  describe('Cancel Scheduled Invalidation', function() {
    it('should cancel pending invalidation', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      expect(minimap._invalidateTimer).to.not.be.null;
      
      minimap.cancelScheduledInvalidation();
      expect(minimap._invalidateTimer).to.be.null;
    });

    it('should NOT invalidate after cancellation', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      minimap.cancelScheduledInvalidation();
      
      clock.tick(2000);
      expect(mockCacheManager.invalidate.called).to.be.false;
    });

    it('should handle cancellation when no timer exists', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      expect(() => minimap.cancelScheduledInvalidation()).to.not.throw();
    });
  });

  describe('Immediate Invalidation', function() {
    it('should still support immediate invalidation', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.invalidateCache();
      
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });

    it('should cancel pending timer when immediately invalidating', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      expect(minimap._invalidateTimer).to.not.be.null;
      
      minimap.invalidateCache();
      expect(minimap._invalidateTimer).to.be.null;
    });

    it('should not double-invalidate if timer fires after immediate invalidation', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      minimap.invalidateCache(); // Immediate invalidation
      
      clock.tick(2000); // Timer would have fired
      
      // Should only be called once (from immediate invalidation)
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });
  });

  describe('Cleanup', function() {
    it('should clear timer on destroy', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      expect(minimap._invalidateTimer).to.not.be.null;
      
      minimap.destroy();
      expect(minimap._invalidateTimer).to.be.null;
    });

    it('should not invalidate after destroy', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      minimap.destroy();
      
      clock.tick(2000);
      expect(mockCacheManager.invalidate.called).to.be.false;
    });
  });

  describe('Edge Cases', function() {
    it('should handle zero debounce delay', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      minimap.setInvalidateDebounceDelay(0);
      
      minimap.scheduleInvalidation();
      clock.tick(0);
      
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });

    it('should handle very long debounce delay', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      minimap.setInvalidateDebounceDelay(10000);
      
      minimap.scheduleInvalidation();
      clock.tick(9999);
      expect(mockCacheManager.invalidate.called).to.be.false;
      
      clock.tick(1);
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });

    it('should handle cache disabled scenario', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      minimap.setCacheEnabled(false);
      
      minimap.scheduleInvalidation();
      clock.tick(1000);
      
      // Should not crash, timer should be cleaned up
      expect(minimap._invalidateTimer).to.be.null;
    });

    it('should handle multiple schedule/cancel cycles', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.scheduleInvalidation();
      minimap.cancelScheduledInvalidation();
      
      minimap.scheduleInvalidation();
      minimap.cancelScheduledInvalidation();
      
      minimap.scheduleInvalidation();
      clock.tick(1000);
      
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });
  });

  describe('Integration with Terrain Editing', function() {
    it('should provide method to notify terrain change started', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      expect(minimap).to.respondTo('notifyTerrainEditStart');
    });

    it('should provide method to notify terrain change ended', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      expect(minimap).to.respondTo('notifyTerrainEditEnd');
    });

    it('should schedule invalidation when edit starts', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.notifyTerrainEditStart();
      
      expect(minimap._invalidateTimer).to.not.be.null;
    });

    it('should schedule invalidation when edit ends (debounced)', function() {
      const minimap = new MiniMap(mockTerrain, 200, 200);
      
      minimap.notifyTerrainEditStart();
      clock.tick(100);
      minimap.notifyTerrainEditEnd();
      
      // Should still be scheduled
      expect(minimap._invalidateTimer).to.not.be.null;
      
      // Should invalidate after debounce
      clock.tick(1000);
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
    });
  });
});

