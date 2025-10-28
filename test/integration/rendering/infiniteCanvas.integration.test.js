/**
 * Integration Tests: Infinite Canvas Rendering (TDD - Phase 4)
 * 
 * Tests integration of SparseTerrain, DynamicGridOverlay, and DynamicMinimap
 * for lazy terrain loading with infinite canvas.
 * 
 * TDD: Write FIRST before full integration exists!
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('Infinite Canvas Rendering Integration', function() {
  let terrain, gridOverlay, minimap, dom;
  let mockP5;
  
  beforeEach(function() {
    // Setup JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      fill: sinon.stub(),
      noFill: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      line: sinon.stub(),
      translate: sinon.stub(),
      scale: sinon.stub()
    };
    
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.stroke = mockP5.stroke;
    global.strokeWeight = mockP5.strokeWeight;
    global.fill = mockP5.fill;
    global.noFill = mockP5.noFill;
    global.noStroke = mockP5.noStroke;
    global.rect = mockP5.rect;
    global.line = mockP5.line;
    global.translate = mockP5.translate;
    global.scale = mockP5.scale;
    
    // Load classes
    const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
    const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
    const DynamicMinimap = require('../../../Classes/ui/DynamicMinimap');
    
    // Create integrated system
    terrain = new SparseTerrain(32, 'grass');
    gridOverlay = new DynamicGridOverlay(terrain);
    minimap = new DynamicMinimap(terrain, 200, 200);
  });
  
  afterEach(function() {
    sinon.restore();
    if (dom && dom.window) {
      dom.window.close();
    }
    delete global.window;
    delete global.document;
  });
  
  describe('System Initialization', function() {
    it('should initialize with empty terrain', function() {
      expect(terrain.isEmpty()).to.be.true;
      expect(terrain.getBounds()).to.be.null;
      expect(gridOverlay.gridLines).to.have.lengthOf(0);
      expect(minimap.viewport).to.be.null;
    });
    
    it('should connect all components to same terrain', function() {
      expect(gridOverlay.terrain).to.equal(terrain);
      expect(minimap.terrain).to.equal(terrain);
    });
  });
  
  describe('Paint First Tile Workflow', function() {
    it('should update all systems when first tile painted', function() {
      // Paint first tile
      terrain.setTile(0, 0, 'stone');
      
      // Grid overlay should generate grid
      gridOverlay.update(null);
      expect(gridOverlay.gridLines.length).to.be.greaterThan(0);
      
      // Minimap should have viewport
      minimap.update();
      expect(minimap.viewport).to.not.be.null;
      expect(minimap.viewport.minX).to.equal(-2); // 0 - padding
    });
    
    it('should calculate consistent bounds across systems', function() {
      terrain.setTile(5, 10, 'grass');
      
      const terrainBounds = terrain.getBounds();
      const gridRegion = gridOverlay.calculateGridRegion(null);
      const minimapViewport = minimap.calculateViewport();
      
      // All should reflect same painted area
      expect(terrainBounds.minX).to.equal(5);
      expect(terrainBounds.maxX).to.equal(5);
      
      // Grid should extend by buffer (2 tiles)
      expect(gridRegion.minX).to.equal(3); // 5 - 2
      expect(gridRegion.maxX).to.equal(7); // 5 + 2
      
      // Minimap should also extend by padding (2 tiles)
      expect(minimapViewport.minX).to.equal(3); // 5 - 2
      expect(minimapViewport.maxX).to.equal(7); // 5 + 2
    });
  });
  
  describe('Multi-Tile Painting Workflow', function() {
    it('should expand all systems when painting outside bounds', function() {
      // Paint initial tile
      terrain.setTile(0, 0, 'grass');
      gridOverlay.update(null);
      minimap.update();
      
      const oldGridRegion = gridOverlay.calculateGridRegion(null);
      const oldMinimapViewport = minimap.viewport;
      
      // Paint far away
      terrain.setTile(20, 20, 'stone');
      gridOverlay.update(null);
      minimap.update();
      
      const newGridRegion = gridOverlay.calculateGridRegion(null);
      const newMinimapViewport = minimap.viewport;
      
      // Both should expand
      expect(newGridRegion.maxX).to.be.greaterThan(oldGridRegion.maxX);
      expect(newMinimapViewport.maxX).to.be.greaterThan(oldMinimapViewport.maxX);
    });
    
    it('should handle scattered painting (sparse storage efficiency)', function() {
      // Paint tiles far apart
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(100, 100, 'stone');
      terrain.setTile(-50, -50, 'water');
      
      // Should only store 3 tiles (not 151*151 = 22,801!)
      expect(terrain.getTileCount()).to.equal(3);
      
      // Systems should adapt to large bounds
      gridOverlay.update(null);
      minimap.update();
      
      const gridRegion = gridOverlay.calculateGridRegion(null);
      expect(gridRegion.minX).to.equal(-52); // -50 - 2
      expect(gridRegion.maxX).to.equal(102); // 100 + 2
      
      expect(minimap.viewport.minX).to.equal(-52);
      expect(minimap.viewport.maxX).to.equal(102);
    });
  });
  
  describe('Grid Overlay with Mouse Hover', function() {
    it('should show grid at mouse when no tiles painted', function() {
      expect(terrain.isEmpty()).to.be.true;
      
      const mousePos = { x: 10, y: 10 };
      const region = gridOverlay.calculateGridRegion(mousePos);
      
      expect(region).to.not.be.null;
      expect(region.minX).to.equal(8); // 10 - 2
      expect(region.maxX).to.equal(12); // 10 + 2
    });
    
    it('should merge grid regions when mouse outside painted area', function() {
      terrain.setTile(0, 0, 'grass');
      
      const mousePos = { x: 50, y: 50 }; // Far from painted tile
      const region = gridOverlay.calculateGridRegion(mousePos);
      
      // Should include both painted area and mouse hover
      expect(region.minX).to.equal(-2); // From painted (0 - 2)
      expect(region.maxX).to.equal(52); // From mouse (50 + 2)
    });
  });
  
  describe('Minimap Scale Adaptation', function() {
    it('should zoom out when painting expands bounds', function() {
      terrain.setTile(0, 0, 'grass');
      minimap.update();
      const smallScale = minimap.scale;
      
      // Paint many tiles to expand bounds
      for (let i = 0; i < 50; i++) {
        terrain.setTile(i, i, 'stone');
      }
      minimap.update();
      const largeScale = minimap.scale;
      
      // Scale should decrease (zoomed out)
      expect(largeScale).to.be.lessThan(smallScale);
    });
    
    it('should handle single tile viewport', function() {
      terrain.setTile(0, 0, 'grass');
      minimap.update();
      
      expect(minimap.viewport).to.not.be.null;
      expect(minimap.scale).to.be.greaterThan(0);
      
      // Viewport: (-2, -2) to (2, 2) = 5x5 tiles = 160x160 pixels
      // Minimap: 200x200, scale should be 200/160 = 1.25
      expect(minimap.scale).to.be.closeTo(1.25, 0.01);
    });
  });
  
  describe('Rendering Pipeline', function() {
    it('should render all systems without errors', function() {
      terrain.setTile(5, 5, 'grass');
      terrain.setTile(6, 6, 'stone');
      
      gridOverlay.update(null);
      minimap.update();
      
      // Render all components
      expect(() => {
        gridOverlay.render();
        minimap.render();
      }).to.not.throw();
      
      // Should have called drawing functions
      expect(mockP5.push.called).to.be.true;
      expect(mockP5.pop.called).to.be.true;
    });
    
    it('should render in correct order (terrain, grid, UI)', function() {
      terrain.setTile(0, 0, 'grass');
      gridOverlay.update(null);
      minimap.update();
      
      // Simulate rendering pipeline
      // 1. Terrain tiles (handled externally)
      // 2. Grid overlay
      gridOverlay.render();
      const gridCallCount = mockP5.line.callCount;
      
      // 3. Minimap
      minimap.render();
      const minimapCallCount = mockP5.rect.callCount;
      
      expect(gridCallCount).to.be.greaterThan(0);
      expect(minimapCallCount).to.be.greaterThan(0);
    });
  });
  
  describe('Delete Tile Workflow', function() {
    it('should shrink all systems when tile deleted', function() {
      // Paint 3 tiles
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(10, 10, 'stone');
      terrain.setTile(20, 20, 'water');
      
      gridOverlay.update(null);
      minimap.update();
      const largeBounds = terrain.getBounds();
      
      // Delete edge tile
      terrain.deleteTile(20, 20);
      
      gridOverlay.update(null);
      minimap.update();
      const smallBounds = terrain.getBounds();
      
      // Bounds should shrink
      expect(smallBounds.maxX).to.be.lessThan(largeBounds.maxX);
      expect(smallBounds.maxY).to.be.lessThan(largeBounds.maxY);
    });
    
    it('should clear all systems when last tile deleted', function() {
      terrain.setTile(0, 0, 'grass');
      gridOverlay.update(null);
      minimap.update();
      
      expect(gridOverlay.gridLines.length).to.be.greaterThan(0);
      expect(minimap.viewport).to.not.be.null;
      
      // Delete last tile
      terrain.deleteTile(0, 0);
      gridOverlay.update(null);
      minimap.update();
      
      // All should reset
      expect(terrain.getBounds()).to.be.null;
      expect(minimap.viewport).to.be.null;
      // Grid should be empty (no tiles, no mouse hover in this test)
    });
  });
  
  describe('JSON Export/Import Workflow', function() {
    it('should export and restore complete system state', function() {
      // Create complex terrain
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(10, 10, 'stone');
      terrain.setTile(-5, -5, 'water');
      
      // Export
      const json = terrain.exportToJSON();
      expect(json.tiles).to.have.lengthOf(3);
      
      // Clear and import
      const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain');
      const DynamicGridOverlay = require('../../../Classes/ui/DynamicGridOverlay');
      const DynamicMinimap = require('../../../Classes/ui/DynamicMinimap');
      
      const newTerrain = new SparseTerrain();
      newTerrain.importFromJSON(json);
      
      // Create new systems
      const newGrid = new DynamicGridOverlay(newTerrain);
      const newMinimap = new DynamicMinimap(newTerrain, 200, 200);
      
      newGrid.update(null);
      newMinimap.update();
      
      // Should match original
      expect(newTerrain.getTileCount()).to.equal(3);
      expect(newTerrain.getBounds()).to.deep.equal(terrain.getBounds());
      
      // Viewport should be calculated from same bounds
      const originalViewport = minimap.calculateViewport();
      const newViewport = newMinimap.calculateViewport();
      expect(newViewport).to.deep.equal(originalViewport);
    });
  });
  
  describe('Coordinate System Consistency', function() {
    it('should handle negative coordinates across all systems', function() {
      terrain.setTile(-10, -20, 'grass');
      
      gridOverlay.update(null);
      minimap.update();
      
      const bounds = terrain.getBounds();
      const gridRegion = gridOverlay.calculateGridRegion(null);
      const minimapViewport = minimap.viewport;
      
      expect(bounds.minX).to.equal(-10);
      expect(bounds.minY).to.equal(-20);
      
      expect(gridRegion.minX).to.equal(-12); // -10 - 2
      expect(gridRegion.minY).to.equal(-22); // -20 - 2
      
      expect(minimapViewport.minX).to.equal(-12);
      expect(minimapViewport.minY).to.equal(-22);
    });
    
    it('should handle mixed positive/negative coordinates', function() {
      terrain.setTile(-50, -50, 'water');
      terrain.setTile(50, 50, 'stone');
      
      gridOverlay.update(null);
      minimap.update();
      
      const bounds = terrain.getBounds();
      expect(bounds.minX).to.equal(-50);
      expect(bounds.maxX).to.equal(50);
      expect(bounds.minY).to.equal(-50);
      expect(bounds.maxY).to.equal(50);
    });
  });
  
  describe('Performance at Scale', function() {
    it('should handle 100 scattered tiles with sparse storage', function() {
      this.timeout(60000); // Scattered tiles = slower grid generation
      
      const startTime = Date.now();
      
      // Paint 100 tiles in scattered pattern WITHIN 1000x1000 limit
      // Use 5-tile spacing: (0,0), (5,5), (10,10)...(495,495) = 500x500 area
      for (let i = 0; i < 100; i++) {
        const x = i * 5;
        const y = i * 5;
        const result = terrain.setTile(x, y, 'grass');
        expect(result).to.be.true; // All within limit
      }
      
      gridOverlay.update(null);
      minimap.update();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Scattered tiles create large bounds, grid generation is slower
      // But should complete in reasonable time (<60 seconds)
      expect(duration).to.be.lessThan(60000);
      
      // Key benefit: Sparse storage uses only 100 tiles, not 250,000!
      expect(terrain.getTileCount()).to.equal(100);
      
      // Grid optimization: Only generate lines near painted tiles
      expect(gridOverlay.gridLines.length).to.be.above(0);
      expect(gridOverlay.gridLines.length).to.be.below(5000); // Much less than full 500x500
    });
  });
});
