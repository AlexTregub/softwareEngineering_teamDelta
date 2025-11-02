/**
 * gridTerrainAdapter.integration.test.js
 * Integration tests for GridTerrainAdapter + PathMap
 * 
 * PURPOSE: Verify GridTerrainAdapter works correctly with real PathMap system
 *          Test pathfinding, terrain weights, coordinate conversion
 * 
 * Part of: Custom Level Loading - Phase 1.2 Integration Tests
 */

const { expect } = require('chai');
const helper = require('../../helpers/terrainIntegrationHelper');

describe('GridTerrainAdapter + PathMap Integration', function() {
  let sandbox;
  let GridTerrainAdapter, gridTerrain, PathMap;
  
  beforeEach(function() {
    sandbox = helper.setupTestEnvironment();
    const classes = helper.loadClasses();
    GridTerrainAdapter = classes.GridTerrainAdapter;
    gridTerrain = classes.gridTerrain;
    PathMap = classes.PathMap;
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('PathMap Construction', function() {
    it('should create PathMap from GridTerrainAdapter', function() {
      const terrain = new gridTerrain(3, 3, 12345); // 3x3 chunks = 24x24 tiles
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap).to.exist;
      expect(pathMap.width).to.equal(24);
      expect(pathMap.height).to.equal(24);
    });
    
    it('should create grid with correct number of nodes', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap.grid).to.be.an('array');
      expect(pathMap.grid.length).to.equal(576); // 24 * 24
    });
    
    it('should initialize all nodes with valid coordinates', function() {
      const terrain = new gridTerrain(2, 2, 12345); // 2x2 chunks = 16x16 tiles
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      // Check first node
      expect(pathMap.grid[0].x).to.equal(0);
      expect(pathMap.grid[0].y).to.equal(0);
      
      // Check last node
      const lastIndex = pathMap.grid.length - 1;
      expect(pathMap.grid[lastIndex].x).to.equal(15);
      expect(pathMap.grid[lastIndex].y).to.equal(15);
    });
    
    it('should handle different grid sizes', function() {
      const sizes = [
        { chunks: 1, expectedTiles: 8 },
        { chunks: 3, expectedTiles: 24 },
        { chunks: 5, expectedTiles: 40 }
      ];
      
      sizes.forEach(({ chunks, expectedTiles }) => {
        const terrain = new gridTerrain(chunks, chunks, 12345);
        const adapter = new GridTerrainAdapter(terrain);
        const pathMap = new PathMap(adapter);
        
        expect(pathMap.width).to.equal(expectedTiles);
        expect(pathMap.height).to.equal(expectedTiles);
        expect(pathMap.grid.length).to.equal(expectedTiles * expectedTiles);
      });
    });
  });
  
  describe('Node Access', function() {
    it('should access nodes via coordinate conversion', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      // Access node at (5, 10)
      const node = helper.getNodeAt(pathMap, 5, 10);
      
      expect(node).to.exist;
      expect(node.x).to.equal(5);
      expect(node.y).to.equal(10);
    });
    
    it('should access corner nodes correctly', function() {
      const terrain = new gridTerrain(2, 2, 12345); // 16x16 tiles
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      // Top-left
      const topLeft = helper.getNodeAt(pathMap, 0, 0);
      expect(topLeft.x).to.equal(0);
      expect(topLeft.y).to.equal(0);
      
      // Top-right
      const topRight = helper.getNodeAt(pathMap, 15, 0);
      expect(topRight.x).to.equal(15);
      expect(topRight.y).to.equal(0);
      
      // Bottom-left
      const bottomLeft = helper.getNodeAt(pathMap, 0, 15);
      expect(bottomLeft.x).to.equal(0);
      expect(bottomLeft.y).to.equal(15);
      
      // Bottom-right
      const bottomRight = helper.getNodeAt(pathMap, 15, 15);
      expect(bottomRight.x).to.equal(15);
      expect(bottomRight.y).to.equal(15);
    });
    
    it('should return null for out-of-bounds coordinates', function() {
      const terrain = new gridTerrain(2, 2, 12345); // 16x16 tiles
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(helper.getNodeAt(pathMap, -1, 0)).to.be.null;
      expect(helper.getNodeAt(pathMap, 0, -1)).to.be.null;
      expect(helper.getNodeAt(pathMap, 16, 0)).to.be.null;
      expect(helper.getNodeAt(pathMap, 0, 16)).to.be.null;
    });
  });
  
  describe('PathMap Structure Validation', function() {
    it('should create valid PathMap structure', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      const validation = helper.verifyPathMapStructure(pathMap);
      
      expect(validation.valid).to.be.true;
      expect(validation.errors).to.be.empty;
    });
    
    it('should have consistent grid dimensions', function() {
      const terrain = new gridTerrain(4, 4, 12345); // 32x32 tiles
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap.width).to.equal(32);
      expect(pathMap.height).to.equal(32);
      expect(pathMap.grid.length).to.equal(1024); // 32 * 32
    });
  });
  
  describe('Terrain Weights', function() {
    it('should assign terrain weights to nodes', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      // All nodes should have weight property
      pathMap.grid.forEach(node => {
        expect(node).to.have.property('weight');
        expect(node.weight).to.be.a('number');
      });
    });
    
    it('should count walkable vs blocked nodes', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      const counts = helper.countNodeTypes(pathMap);
      
      expect(counts.total).to.equal(576); // 24 * 24
      expect(counts.walkable).to.be.at.least(0);
      expect(counts.blocked).to.be.at.least(0);
      expect(counts.walkable + counts.blocked).to.equal(counts.total);
    });
  });
  
  describe('Performance', function() {
    it('should create PathMap efficiently for small grids', function() {
      const terrain = new gridTerrain(3, 3, 12345); // 24x24 = 576 tiles
      const adapter = new GridTerrainAdapter(terrain);
      
      const start = Date.now();
      const pathMap = new PathMap(adapter);
      const elapsed = Date.now() - start;
      
      expect(elapsed).to.be.below(100); // Should be fast (<100ms)
      expect(pathMap.grid.length).to.equal(576);
    });
    
    it('should create PathMap efficiently for medium grids', function() {
      const terrain = new gridTerrain(5, 5, 12345); // 40x40 = 1600 tiles
      const adapter = new GridTerrainAdapter(terrain);
      
      const start = Date.now();
      const pathMap = new PathMap(adapter);
      const elapsed = Date.now() - start;
      
      expect(elapsed).to.be.below(200); // Should be fast (<200ms)
      expect(pathMap.grid.length).to.equal(1600);
    });
  });
  
  describe('Multiple Adapter Instances', function() {
    it('should support multiple adapters from same terrain', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      const adapter1 = new GridTerrainAdapter(terrain);
      const adapter2 = new GridTerrainAdapter(terrain);
      
      const pathMap1 = new PathMap(adapter1);
      const pathMap2 = new PathMap(adapter2);
      
      expect(pathMap1.width).to.equal(pathMap2.width);
      expect(pathMap1.height).to.equal(pathMap2.height);
      expect(pathMap1.grid.length).to.equal(pathMap2.grid.length);
    });
    
    it('should support multiple PathMaps from different terrains', function() {
      const terrain1 = new gridTerrain(2, 2, 12345);
      const terrain2 = new gridTerrain(3, 3, 54321);
      
      const adapter1 = new GridTerrainAdapter(terrain1);
      const adapter2 = new GridTerrainAdapter(terrain2);
      
      const pathMap1 = new PathMap(adapter1);
      const pathMap2 = new PathMap(adapter2);
      
      expect(pathMap1.width).to.equal(16); // 2*8
      expect(pathMap2.width).to.equal(24); // 3*8
      expect(pathMap1.grid.length).to.not.equal(pathMap2.grid.length);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle minimum grid size (1x1 chunk)', function() {
      const terrain = new gridTerrain(1, 1, 12345); // 8x8 tiles
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap.width).to.equal(8);
      expect(pathMap.height).to.equal(8);
      expect(pathMap.grid.length).to.equal(64);
      
      const validation = helper.verifyPathMapStructure(pathMap);
      expect(validation.valid).to.be.true;
    });
    
    it('should handle non-square grids', function() {
      const terrain = new gridTerrain(2, 4, 12345); // 16x32 tiles
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap.width).to.equal(16);
      expect(pathMap.height).to.equal(32);
      expect(pathMap.grid.length).to.equal(512); // 16 * 32
    });
    
    it('should handle large grids without memory issues', function() {
      const terrain = new gridTerrain(6, 6, 12345); // 48x48 = 2304 tiles
      const adapter = new GridTerrainAdapter(terrain);
      const pathMap = new PathMap(adapter);
      
      expect(pathMap.grid.length).to.equal(2304);
      expect(pathMap.grid[0]).to.exist;
      expect(pathMap.grid[2303]).to.exist;
    });
  });
});
