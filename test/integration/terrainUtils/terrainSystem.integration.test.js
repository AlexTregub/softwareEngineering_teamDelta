/**
 * Integration Tests for Terrain Import/Export/Editor System
 * Tests complete workflows with gridTerrain and pathfinding
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock p5.js global functions and constants
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.PERLIN_SCALE = 0.08;
global.NONE = null;
global.floor = Math.floor;
global.round = Math.round;
global.ceil = Math.ceil;
global.abs = Math.abs;
global.sqrt = Math.sqrt;
global.max = Math.max;
global.min = Math.min;
global.print = () => {};
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5;
global.noiseSeed = () => {};
global.randomSeed = () => {};
global.random = (...args) => args.length > 0 ? args[0] + Math.random() * (args[1] - args[0]) : Math.random();
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.g_canvasX = 800;
global.g_canvasY = 600;
global.CORNER = 'corner';
global.imageMode = () => {};
global.createGraphics = (w, h) => ({
  _width: w,
  _height: h,
  image: () => {},
  clear: () => {},
  push: () => {},
  pop: () => {},
  translate: () => {},
  imageMode: () => {},
  noSmooth: () => {},
  smooth: () => {},
  remove: () => {}
});

global.TERRAIN_MATERIALS_RANGED = {
  'moss': [[0, 0.3], (x, y, s) => {}],
  'moss_0': [[0, 0.3], (x, y, s) => {}],
  'moss_1': [[0.375, 0.4], (x, y, s) => {}],
  'stone': [[0, 0.4], (x, y, s) => {}],
  'dirt': [[0.4, 0.525], (x, y, s) => {}],
  'grass': [[0, 1], (x, y, s) => {}],
};

global.renderMaterialToContext = () => {};
global.cameraManager = { cameraZoom: 1.0 };

// Mock console
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
console.log = () => {};
console.warn = () => {};
console.error = () => {};

// Load all required classes
const gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
vm.runInThisContext(gridCode);

const terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
vm.runInThisContext(terrianGenCode);

const chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
vm.runInThisContext(chunkCode);

const coordinateSystemCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/coordinateSystem.js'),
  'utf8'
);
vm.runInThisContext(coordinateSystemCode);

const gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);
vm.runInThisContext(gridTerrainCode);

const exporterCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainExporter.js'),
  'utf8'
);
vm.runInThisContext(exporterCode);

const importerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainImporter.js'),
  'utf8'
);
vm.runInThisContext(importerCode);

const editorCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainEditor.js'),
  'utf8'
);
vm.runInThisContext(editorCode);

const pathfindingCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/pathfinding.js'),
  'utf8'
);
vm.runInThisContext(pathfindingCode);

// Restore console
console.log = originalLog;
console.warn = originalWarn;
console.error = originalError;

describe('Terrain System Integration Tests', function() {
  
  describe('Export → Import Workflow', function() {
    
    it('should export and re-import terrain without data loss', function() {
      // Create original terrain
      const originalTerrain = new gridTerrain(3, 3, 12345);
      
      // Modify some tiles
      originalTerrain.getArrPos([0, 0]).setMaterial('stone');
      originalTerrain.getArrPos([1, 1]).setMaterial('moss');
      originalTerrain.getArrPos([2, 2]).setMaterial('dirt');
      
      // Export
      const exporter = new TerrainExporter(originalTerrain);
      const exported = exporter.exportToJSON();
      
      // Create new terrain and import
      const newTerrain = new gridTerrain(3, 3, 99999);
      const importer = new TerrainImporter();
      const success = importer.importFromJSON(newTerrain, exported);
      
      expect(success).to.be.true;
      
      // Verify materials match
      expect(newTerrain.getArrPos([0, 0]).getMaterial()).to.equal('stone');
      expect(newTerrain.getArrPos([1, 1]).getMaterial()).to.equal('moss');
      expect(newTerrain.getArrPos([2, 2]).getMaterial()).to.equal('dirt');
    });
    
    it('should preserve terrain weights after export/import', function() {
      const originalTerrain = new gridTerrain(2, 2, 12345);
      
      // Set different materials with different weights
      originalTerrain.getArrPos([0, 0]).setMaterial('stone'); // weight 100
      originalTerrain.getArrPos([0, 0]).assignWeight();
      originalTerrain.getArrPos([1, 1]).setMaterial('dirt'); // weight 3
      originalTerrain.getArrPos([1, 1]).assignWeight();
      
      // Export and re-import
      const exporter = new TerrainExporter(originalTerrain);
      const exported = exporter.exportToJSON();
      
      const newTerrain = new gridTerrain(2, 2, 0);
      const importer = new TerrainImporter();
      importer.importFromJSON(newTerrain, exported);
      
      // Verify weights are restored
      expect(newTerrain.getArrPos([0, 0]).getWeight()).to.equal(100);
      expect(newTerrain.getArrPos([1, 1]).getWeight()).to.equal(3);
    });
    
    it('should handle compressed export format', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Export compressed
      const exporter = new TerrainExporter(terrain);
      const uncompressed = exporter.exportToJSON();
      const compressed = exporter.exportToJSON({ compressed: true });
      
      // Import compressed data
      const newTerrain = new gridTerrain(2, 2, 0);
      const importer = new TerrainImporter();
      const success = importer.importFromJSON(newTerrain, compressed);
      
      expect(success).to.be.true;
      expect(typeof compressed.tiles).to.equal('string');
      expect(compressed.tiles).to.match(/^\d+:\w+/);
    });
    
    it('should handle chunked export format', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Export chunked
      const exporter = new TerrainExporter(terrain);
      const chunked = exporter.exportToJSON({ chunked: true });
      
      // Import chunked data
      const newTerrain = new gridTerrain(2, 2, 0);
      const importer = new TerrainImporter();
      const success = importer.importFromJSON(newTerrain, chunked);
      
      expect(success).to.be.true;
      expect(chunked.tiles).to.have.property('defaultMaterial');
      expect(chunked.tiles).to.have.property('exceptions');
    });
  });
  
  describe('Editor → Export Workflow', function() {
    
    it('should export terrain after editing', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const editor = new TerrainEditor(terrain);
      
      // Edit terrain
      editor.selectMaterial('stone');
      editor.paintTile(32, 32); // Paint at canvas position
      
      // Export edited terrain
      const exporter = new TerrainExporter(terrain);
      const exported = exporter.exportToJSON();
      
      expect(exported.tiles).to.be.an('array');
      expect(exported.tiles).to.include('stone');
    });
    
    it('should preserve undo/redo history across export', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const editor = new TerrainEditor(terrain);
      
      // Make edits
      editor.selectMaterial('stone');
      editor.paintTile(32, 32);
      editor.paintTile(64, 64);
      
      // Undo one
      editor.undo();
      
      // Export current state
      const exporter = new TerrainExporter(terrain);
      const exported = exporter.exportToJSON();
      
      // Re-import should reflect the undone state
      const newTerrain = new gridTerrain(2, 2, 0);
      const importer = new TerrainImporter();
      importer.importFromJSON(newTerrain, exported);
      
      // Second paint should be undone
      expect(newTerrain.getArrPos([2, 2]).getMaterial()).to.not.equal('stone');
    });
    
    it('should export flood-filled regions correctly', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const editor = new TerrainEditor(terrain);
      
      // Flood fill a region
      editor.selectMaterial('dirt');
      editor.fillRegion(0, 0, 'dirt');
      
      // Export
      const exporter = new TerrainExporter(terrain);
      const exported = exporter.exportToJSON();
      
      // Re-import and verify
      const newTerrain = new gridTerrain(2, 2, 0);
      const importer = new TerrainImporter();
      importer.importFromJSON(newTerrain, exported);
      
      // All connected tiles should be dirt
      const totalTiles = 2 * 2 * 8 * 8;
      let dirtCount = 0;
      for (let i = 0; i < totalTiles; i++) {
        const y = Math.floor(i / (2 * 8));
        const x = i % (2 * 8);
        if (newTerrain.getArrPos([x, y]).getMaterial() === 'dirt') {
          dirtCount++;
        }
      }
      
      expect(dirtCount).to.be.greaterThan(0);
    });
  });
  
  describe('Pathfinding Integration', function() {
    
    it('should update pathfinding after import', function() {
      // Create terrain with walls
      const terrain = new gridTerrain(3, 3, 12345);
      
      // Set all tiles to grass
      const totalTilesX = terrain._gridSizeX * terrain._chunkSize;
      const totalTilesY = terrain._gridSizeY * terrain._chunkSize;
      for (let y = 0; y < totalTilesY; y++) {
        for (let x = 0; x < totalTilesX; x++) {
          terrain.getArrPos([x, y]).setMaterial('moss');
          terrain.getArrPos([x, y]).assignWeight();
        }
      }
      
      // Add walls
      terrain.getArrPos([1, 1]).setMaterial('stone');
      terrain.getArrPos([1, 1]).assignWeight(); // weight = 100
      
      // Export
      const exporter = new TerrainExporter(terrain);
      const exported = exporter.exportToJSON();
      
      // Import into new terrain
      const newTerrain = new gridTerrain(3, 3, 0);
      const importer = new TerrainImporter();
      importer.importFromJSON(newTerrain, exported);
      
      // Create pathfinding map
      const pathMap = new PathMap(newTerrain);
      const node = pathMap._grid.getArrPos([1, 1]);
      
      // Verify wall is recognized
      expect(node.wall).to.be.true;
      expect(node.weight).to.equal(100);
    });
    
    it('should maintain pathfinding after editor changes', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Set all to moss using chunks
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.applyFlatTerrain('moss');
      });
      
      // Create initial pathfinding
      const pathMap = new PathMap(terrain);
      const nodeBefore = pathMap._grid.getArrPos([0, 0]);
      expect(nodeBefore.weight).to.equal(2); // moss weight
      
      // Edit terrain
      const editor = new TerrainEditor(terrain);
      editor.selectMaterial('stone');
      editor.paintTile(0, 0); // Paint first tile
      
      // Recreate pathfinding map
      const newPathMap = new PathMap(terrain);
      const nodeAfter = newPathMap._grid.getArrPos([0, 0]);
      
      // Verify pathfinding updated
      expect(nodeAfter.weight).to.equal(100); // stone weight
      expect(nodeAfter.wall).to.be.true;
    });
    
    it('should handle terrain type transitions for pathfinding', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Create varied terrain
      terrain.getArrPos([0, 0]).setMaterial('grass'); // weight 1
      terrain.getArrPos([0, 0]).assignWeight();
      terrain.getArrPos([1, 0]).setMaterial('dirt'); // weight 3
      terrain.getArrPos([1, 0]).assignWeight();
      terrain.getArrPos([0, 1]).setMaterial('stone'); // weight 100 (wall)
      terrain.getArrPos([0, 1]).assignWeight();
      
      // Create pathfinding
      const pathMap = new PathMap(terrain);
      
      // Verify different weights
      expect(pathMap._grid.getArrPos([0, 0]).weight).to.equal(1);
      expect(pathMap._grid.getArrPos([1, 0]).weight).to.equal(3);
      expect(pathMap._grid.getArrPos([0, 1]).weight).to.equal(100);
      expect(pathMap._grid.getArrPos([0, 1]).wall).to.be.true;
    });
  });
  
  describe('Editor → Pathfinding Workflow', function() {
    
    it('should create paths around editor-created walls', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      
      // Set all to moss using chunks
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.applyFlatTerrain('moss');
      });
      
      const editor = new TerrainEditor(terrain);
      
      // Draw a wall with line tool
      editor.selectMaterial('stone');
      editor.drawLine(0, 4, 8, 4); // Horizontal wall
      
      // Create pathfinding
      const pathMap = new PathMap(terrain);
      
      // Verify walls are created
      for (let x = 0; x <= 8; x++) {
        const node = pathMap._grid.getArrPos([x, 4]);
        if (node) {
          expect(node.weight).to.equal(100);
          expect(node.wall).to.be.true;
        }
      }
    });
    
    it('should update pathable areas after undo/redo', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      
      // Set all to moss
      terrain.chunkArray.rawArray.forEach(chunk => {
        chunk.applyFlatTerrain('moss');
      });
      
      const editor = new TerrainEditor(terrain);
      editor.selectMaterial('stone');
      
      // Add wall
      editor.paintTile(32, 32);
      
      let pathMap = new PathMap(terrain);
      let node = pathMap._grid.getArrPos([1, 1]);
      expect(node.wall).to.be.true;
      
      // Undo
      editor.undo();
      
      // Recreate pathfinding
      pathMap = new PathMap(terrain);
      node = pathMap._grid.getArrPos([1, 1]);
      expect(node.wall).to.be.false;
    });
  });
  
  describe('Full Round-Trip Integration', function() {
    
    it('should complete: Create → Edit → Export → Import → Pathfind', function() {
      // 1. Create terrain
      const originalTerrain = new gridTerrain(3, 3, 12345);
      
      // Set all to moss using chunks
      originalTerrain.chunkArray.rawArray.forEach(chunk => {
        chunk.applyFlatTerrain('moss');
      });
      
      // 2. Edit terrain
      const editor = new TerrainEditor(originalTerrain);
      editor.selectMaterial('stone');
      editor.fillRectangle(2, 2, 4, 4); // Create stone rectangle
      
      // 3. Export
      const exporter = new TerrainExporter(originalTerrain);
      const exported = exporter.exportToJSON();
      
      // 4. Import into new terrain
      const newTerrain = new gridTerrain(3, 3, 0);
      const importer = new TerrainImporter();
      const success = importer.importFromJSON(newTerrain, exported);
      
      expect(success).to.be.true;
      
      // 5. Create pathfinding
      const pathMap = new PathMap(newTerrain);
      
      // 6. Verify stone rectangle exists in pathfinding
      for (let y = 2; y <= 4; y++) {
        for (let x = 2; x <= 4; x++) {
          const node = pathMap._grid.getArrPos([x, y]);
          if (node) {
            expect(node._terrainTile.getMaterial()).to.equal('stone');
            expect(node.weight).to.equal(100);
          }
        }
      }
    });
    
    it('should maintain data integrity through multiple edit cycles', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const editor = new TerrainEditor(terrain);
      const exporter = new TerrainExporter(terrain);
      
      // First edit cycle
      editor.selectMaterial('stone');
      editor.paintTile(32, 32);
      const export1 = exporter.exportToJSON();
      
      // Second edit cycle
      editor.selectMaterial('dirt');
      editor.paintTile(64, 64);
      const export2 = exporter.exportToJSON();
      
      // Undo
      editor.undo();
      const export3 = exporter.exportToJSON();
      
      // export3 should match export1
      expect(export3.tiles).to.deep.equal(export1.tiles);
    });
  });
  
  describe('Performance and Edge Cases', function() {
    
    it('should handle large terrain export/import', function() {
      this.timeout(10000);
      
      const largeTerrain = new gridTerrain(5, 5, 12345);
      
      const exporter = new TerrainExporter(largeTerrain);
      const exported = exporter.exportToJSON();
      
      const newTerrain = new gridTerrain(5, 5, 0);
      const importer = new TerrainImporter();
      const success = importer.importFromJSON(newTerrain, exported);
      
      expect(success).to.be.true;
      expect(exported.tiles).to.have.lengthOf(5 * 5 * 8 * 8);
    });
    
    it('should compress large uniform terrains effectively', function() {
      const terrain = new gridTerrain(3, 3, 12345);
      terrain.applyFlatTerrain('grass'); // All same material
      
      const exporter = new TerrainExporter(terrain);
      const uncompressed = exporter.exportToJSON();
      const compressed = exporter.exportToJSON({ compressed: true });
      
      const ratio = exporter.getCompressionRatio(uncompressed, compressed);
      
      // Should have good compression for uniform terrain
      expect(ratio).to.be.lessThan(0.5);
    });
    
    it('should handle editor operations on boundaries', function() {
      const terrain = new gridTerrain(2, 2, 12345);
      const editor = new TerrainEditor(terrain);
      
      // Paint at edges (should not crash)
      editor.selectMaterial('stone');
      editor.paintTile(0, 0); // Top-left corner
      editor.paintTile(1000, 1000); // Out of bounds (should be ignored)
      
      // Export should work
      const exporter = new TerrainExporter(terrain);
      const exported = exporter.exportToJSON();
      
      expect(exported.tiles).to.be.an('array');
    });
  });
});
