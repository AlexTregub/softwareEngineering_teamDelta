/**
 * sparseTerrainAdapter.integration.test.js
 * Integration tests for SparseTerrainAdapter + PathMap
 * 
 * PURPOSE: Verify SparseTerrainAdapter works correctly with real PathMap system
 *          Test Level Editor terrain, sparse storage, coordinate offsets
 * 
 * Part of: Custom Level Loading - Phase 1.2 Integration Tests
 */

const { expect } = require('chai');
const helper = require('../../helpers/terrainIntegrationHelper');

describe('SparseTerrainAdapter + PathMap Integration', function() {
  let sandbox;
  let SparseTerrainAdapter, SparseTerrain, PathMap;
  
  beforeEach(function() {
    sandbox = helper.setupTestEnvironment();
    const classes = helper.loadClasses();
    SparseTerrainAdapter = classes.SparseTerrainAdapter;
    SparseTerrain = classes.SparseTerrain;
    PathMap = classes.PathMap;
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('PathMap Construction', function() {
    it('should create PathMap from SparseTerrainAdapter', function() {
      const terrain = new SparseTerrain(32, 'grass');
      // Paint 10x10 grid
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          terrain.setTile(x, y, 'grass');
        }
      }
      
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap).to.exist;
      expect(pathMap.width).to.equal(10);
      expect(pathMap.height).to.equal(10);
    });
    
    it('should create grid with correct number of nodes', function() {
      const terrain = helper.createTestSparseTerrain(); // 10x10 default
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap.grid).to.be.an('array');
      expect(pathMap.grid.length).to.equal(100); // 10 * 10
    });
    
    it('should handle sparse terrain with gaps', function() {
      const terrain = new SparseTerrain(32, 'grass');
      // Paint only corners (creates 10x10 grid with mostly default tiles)
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(9, 0, 'stone');
      terrain.setTile(0, 9, 'stone');
      terrain.setTile(9, 9, 'stone');
      
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap.width).to.equal(10);
      expect(pathMap.height).to.equal(10);
      expect(pathMap.grid.length).to.equal(100);
    });
    
    it('should handle different sparse terrain sizes', function() {
      const sizes = [
        { bounds: { x: 5, y: 5 }, expected: 25 },
        { bounds: { x: 15, y: 15 }, expected: 225 },
        { bounds: { x: 20, y: 20 }, expected: 400 }
      ];
      
      sizes.forEach(({ bounds, expected }) => {
        const terrain = new SparseTerrain(32, 'grass');
        // Paint corners to establish bounds
        terrain.setTile(0, 0, 'grass');
        terrain.setTile(bounds.x - 1, bounds.y - 1, 'grass');
        
        const adapter = new SparseTerrainAdapter(terrain);
        const pathMap = new PathMap(adapter);
        
        expect(pathMap.grid.length).to.equal(expected);
      });
    });
  });
  
  describe('Coordinate Offset Handling', function() {
    it('should handle negative coordinate bounds', function() {
      const terrain = new SparseTerrain(32, 'grass');
      terrain.setTile(-5, -5, 'stone'); // minX=-5, minY=-5
      terrain.setTile(5, 5, 'water');   // maxX=5, maxY=5
      
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      // Grid should be 11x11 (from -5 to 5)
      expect(pathMap.width).to.equal(11);
      expect(pathMap.height).to.equal(11);
      expect(pathMap.grid.length).to.equal(121);
    });
    
    it('should access nodes with negative world coordinates', function() {
      const terrain = new SparseTerrain(32, 'grass');
      terrain.setTile(-5, -5, 'stone');
      terrain.setTile(5, 5, 'water');
      
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      // Node at world coords (-5, -5) should be at array index 0
      const topLeft = pathMap.grid[0];
      expect(topLeft).to.exist;
      
      // Node at world coords (5, 5) should be at last index
      const bottomRight = pathMap.grid[120]; // 11*11-1
      expect(bottomRight).to.exist;
    });
    
    it('should handle mixed positive/negative coordinates', function() {
      const terrain = new SparseTerrain(32, 'grass');
      terrain.setTile(-10, 0, 'stone');
      terrain.setTile(10, 20, 'water');
      
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      // Width: -10 to 10 = 21 tiles
      // Height: 0 to 20 = 21 tiles
      expect(pathMap.width).to.equal(21);
      expect(pathMap.height).to.equal(21);
      expect(pathMap.grid.length).to.equal(441); // 21 * 21
    });
  });
  
  describe('Node Access', function() {
    it('should access nodes via coordinate conversion', function() {
      const terrain = helper.createTestSparseTerrain();
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      const node = helper.getNodeAt(pathMap, 5, 5);
      
      expect(node).to.exist;
      expect(node.x).to.equal(5);
      expect(node.y).to.equal(5);
    });
    
    it('should access corner nodes in sparse terrain', function() {
      const terrain = new SparseTerrain(32, 'grass');
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(19, 19, 'grass'); // 20x20 grid
      
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      const topLeft = helper.getNodeAt(pathMap, 0, 0);
      expect(topLeft.x).to.equal(0);
      expect(topLeft.y).to.equal(0);
      
      const bottomRight = helper.getNodeAt(pathMap, 19, 19);
      expect(bottomRight.x).to.equal(19);
      expect(bottomRight.y).to.equal(19);
    });
    
    it('should return null for out-of-bounds coordinates', function() {
      const terrain = helper.createTestSparseTerrain(); // 10x10
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(helper.getNodeAt(pathMap, -1, 0)).to.be.null;
      expect(helper.getNodeAt(pathMap, 10, 0)).to.be.null;
      expect(helper.getNodeAt(pathMap, 0, 10)).to.be.null;
    });
  });
  
  describe('Default Material Handling', function() {
    it('should fill unpainted tiles with default material', function() {
      const terrain = new SparseTerrain(32, 'grass'); // Default = grass
      // Paint only corners
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(9, 9, 'water');
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      // Check unpainted tile has default material
      const middleTile = adapter._tileStore[adapter.conv2dpos(5, 5)];
      expect(middleTile.material).to.equal('grass');
    });
    
    it('should respect different default materials', function() {
      const defaultMaterials = ['grass', 'dirt', 'sand', 0];
      
      defaultMaterials.forEach(defaultMat => {
        const terrain = new SparseTerrain(32, defaultMat);
        terrain.setTile(0, 0, 'stone');
        terrain.setTile(5, 5, 'water');
        
        const adapter = new SparseTerrainAdapter(terrain);
        
        // Check unpainted tile
        const tile = adapter._tileStore[adapter.conv2dpos(2, 2)];
        expect(tile.material).to.equal(defaultMat);
      });
    });
  });
  
  describe('PathMap Structure Validation', function() {
    it('should create valid PathMap structure', function() {
      const terrain = helper.createTestSparseTerrain();
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      const validation = helper.verifyPathMapStructure(pathMap);
      
      expect(validation.valid).to.be.true;
      expect(validation.errors).to.be.empty;
    });
    
    it('should have consistent grid dimensions', function() {
      const terrain = new SparseTerrain(32, 'grass');
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(24, 24, 'grass'); // 25x25 grid
      
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap.width).to.equal(25);
      expect(pathMap.height).to.equal(25);
      expect(pathMap.grid.length).to.equal(625); // 25 * 25
    });
  });
  
  describe('Terrain Weights', function() {
    it('should assign terrain weights to nodes', function() {
      const terrain = helper.createTestSparseTerrain();
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      pathMap.grid.forEach(node => {
        expect(node).to.have.property('weight');
        expect(node.weight).to.be.a('number');
      });
    });
    
    it('should count walkable vs blocked nodes', function() {
      const terrain = helper.createTestSparseTerrain();
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      const counts = helper.countNodeTypes(pathMap);
      
      expect(counts.total).to.equal(100); // 10 * 10
      expect(counts.walkable).to.be.at.least(0);
      expect(counts.blocked).to.be.at.least(0);
      expect(counts.walkable + counts.blocked).to.equal(counts.total);
    });
  });
  
  describe('Performance', function() {
    it('should create PathMap efficiently for small sparse grids', function() {
      const terrain = helper.createTestSparseTerrain(); // 10x10
      const adapter = new SparseTerrainAdapter(terrain);
      
      const start = Date.now();
      const pathMap = new PathMap(adapter);
      const elapsed = Date.now() - start;
      
      expect(elapsed).to.be.below(50); // Should be fast (<50ms)
      expect(pathMap.grid.length).to.equal(100);
    });
    
    it('should create PathMap efficiently for medium sparse grids', function() {
      const terrain = new SparseTerrain(32, 'grass');
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(49, 49, 'grass'); // 50x50 grid
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      const start = Date.now();
      const pathMap = new PathMap(adapter);
      const elapsed = Date.now() - start;
      
      expect(elapsed).to.be.below(150); // Should be fast (<150ms)
      expect(pathMap.grid.length).to.equal(2500);
    });
    
    it('should handle sparse terrain more efficiently than dense', function() {
      // Sparse terrain with only 4 tiles painted, but 50x50 bounds
      const terrain = new SparseTerrain(32, 'grass');
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(49, 0, 'stone');
      terrain.setTile(0, 49, 'stone');
      terrain.setTile(49, 49, 'stone');
      
      const adapter = new SparseTerrainAdapter(terrain);
      
      const start = Date.now();
      const pathMap = new PathMap(adapter);
      const elapsed = Date.now() - start;
      
      // Should still generate 2500 nodes (50x50), but efficiently
      expect(pathMap.grid.length).to.equal(2500);
      expect(elapsed).to.be.below(150);
    });
  });
  
  describe('Multiple Adapter Instances', function() {
    it('should support multiple adapters from same terrain', function() {
      const terrain = helper.createTestSparseTerrain();
      
      const adapter1 = new SparseTerrainAdapter(terrain);
      const adapter2 = new SparseTerrainAdapter(terrain);
      
      const pathMap1 = new PathMap(adapter1);
      const pathMap2 = new PathMap(adapter2);
      
      expect(pathMap1.width).to.equal(pathMap2.width);
      expect(pathMap1.height).to.equal(pathMap2.height);
    });
    
    it('should support multiple PathMaps from different sparse terrains', function() {
      const terrain1 = new SparseTerrain(32, 'grass');
      terrain1.setTile(0, 0, 'grass');
      terrain1.setTile(9, 9, 'grass'); // 10x10
      
      const terrain2 = new SparseTerrain(32, 'dirt');
      terrain2.setTile(0, 0, 'dirt');
      terrain2.setTile(19, 19, 'dirt'); // 20x20
      
      const adapter1 = new SparseTerrainAdapter(terrain1);
      const adapter2 = new SparseTerrainAdapter(terrain2);
      
      const pathMap1 = new PathMap(adapter1);
      const pathMap2 = new PathMap(adapter2);
      
      expect(pathMap1.width).to.equal(10);
      expect(pathMap2.width).to.equal(20);
      expect(pathMap1.grid.length).to.not.equal(pathMap2.grid.length);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle single tile terrain', function() {
      const terrain = new SparseTerrain(32, 'grass');
      terrain.setTile(0, 0, 'stone');
      
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap.width).to.equal(1);
      expect(pathMap.height).to.equal(1);
      expect(pathMap.grid.length).to.equal(1);
    });
    
    it('should handle non-square sparse grids', function() {
      const terrain = new SparseTerrain(32, 'grass');
      terrain.setTile(0, 0, 'grass');
      terrain.setTile(9, 19, 'grass'); // 10 wide, 20 tall
      
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap.width).to.equal(10);
      expect(pathMap.height).to.equal(20);
      expect(pathMap.grid.length).to.equal(200); // 10 * 20
    });
    
    it('should handle L-shaped sparse terrain (non-rectangular)', function() {
      const terrain = new SparseTerrain(32, 'grass');
      // Paint L-shape (but PathMap will be rectangular)
      terrain.setTile(0, 0, 'stone');
      terrain.setTile(5, 0, 'stone');
      terrain.setTile(0, 10, 'stone');
      
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      // Bounds are rectangular (0-5, 0-10)
      expect(pathMap.width).to.equal(6);
      expect(pathMap.height).to.equal(11);
      expect(pathMap.grid.length).to.equal(66); // 6 * 11
    });
    
    it('should handle empty sparse terrain with default size', function() {
      const terrain = new SparseTerrain(32, 'grass');
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      // Empty terrain defaults to 1x1
      expect(pathMap.width).to.be.at.least(1);
      expect(pathMap.height).to.be.at.least(1);
      expect(pathMap.grid.length).to.be.at.least(1);
    });
  });
  
  describe('Level Editor Integration', function() {
    it('should work with Level Editor painted terrain', function() {
      // Simulate Level Editor workflow
      const terrain = new SparseTerrain(32, 'grass');
      
      // User paints a small level
      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          const material = (x + y) % 3 === 0 ? 'stone' : 'grass';
          terrain.setTile(x, y, material);
        }
      }
      
      const adapter = new SparseTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap.width).to.equal(15);
      expect(pathMap.height).to.equal(15);
      expect(pathMap.grid.length).to.equal(225);
      
      const validation = helper.verifyPathMapStructure(pathMap);
      expect(validation.valid).to.be.true;
    });
  });
});
