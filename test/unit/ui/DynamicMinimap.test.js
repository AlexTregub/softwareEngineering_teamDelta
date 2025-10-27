/**
 * Unit Tests: DynamicMinimap (TDD - Phase 3A)
 * 
 * Tests dynamic minimap that shows only painted terrain region.
 * Viewport calculated from terrain bounds, not fixed 50x50 grid.
 * 
 * TDD: Write FIRST before implementation exists!
 */

const { expect } = require('chai');
const sinon = require('sinon');

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
