/**
 * Integration Tests: UI/FileIO System + GridTerrain
 * 
 * Tests integration between new UI components, file I/O dialogs, and the existing gridTerrain system.
 * Ensures backward compatibility and proper data flow.
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load UI components
const materialPaletteCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/MaterialPalette.js'),
  'utf8'
);
const toolBarCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/ToolBar.js'),
  'utf8'
);
const saveDialogCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/SaveDialog.js'),
  'utf8'
);
const loadDialogCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/LoadDialog.js'),
  'utf8'
);
const localStorageManagerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/LocalStorageManager.js'),
  'utf8'
);
const formatConverterCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/FormatConverter.js'),
  'utf8'
);

// Load terrain system components
const terrainExporterCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainExporter.js'),
  'utf8'
);
const terrainImporterCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainImporter.js'),
  'utf8'
);
const terrainEditorCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainEditor.js'),
  'utf8'
);

// Load gridTerrain dependencies (needed for real gridTerrain class)
const terrianGenCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
const chunkCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/chunk.js'),
  'utf8'
);
const gridCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
const gridTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/gridTerrain.js'),
  'utf8'
);

// Mock global dependencies that gridTerrain expects (minimal mocks - only p5.js and runtime functions)
global.CHUNK_SIZE = 8;
global.TILE_SIZE = 32;
global.NONE = '\0'; // From sketch.js
global.floor = Math.floor;
global.ceil = Math.ceil;
global.random = Math.random;
global.noise = (x, y) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1; // Simple noise function
global.noiseSeed = () => {}; // Mock p5 noiseSeed
global.noiseDetail = () => {}; // Mock p5 noiseDetail
global.g_canvasX = 800;
global.g_canvasY = 600;
// Mock p5 rendering functions
global.createGraphics = () => null;
global.push = () => {};
global.pop = () => {};
global.imageMode = () => {};
global.image = () => {};
global.noSmooth = () => {};
global.smooth = () => {};
global.CENTER = 'center';
// Mock image objects (referenced by terrianGen.js)
global.GRASS_IMAGE = {};
global.DIRT_IMAGE = {};
global.STONE_IMAGE = {};
global.MOSS_IMAGE = {};

// Let terrianGen.js define TERRAIN_MATERIALS_RANGED and PERLIN_SCALE naturally

// Execute in global context (order matters - dependencies first)
vm.runInThisContext(materialPaletteCode);
vm.runInThisContext(toolBarCode);
vm.runInThisContext(saveDialogCode);
vm.runInThisContext(loadDialogCode);
vm.runInThisContext(localStorageManagerCode);
vm.runInThisContext(formatConverterCode);

// Execute all terrain code in single context to ensure classes are shared
const allTerrainCode = `
${terrianGenCode}
${gridCode}
${chunkCode}
${gridTerrainCode}
`;
vm.runInThisContext(allTerrainCode);

vm.runInThisContext(terrainExporterCode);
vm.runInThisContext(terrainImporterCode);
vm.runInThisContext(terrainEditorCode);

describe('GridTerrain Integration Tests', function() {
  
  /**
   * Helper function to create real gridTerrain instance
   * Note: gridTerrain uses chunk-based system, so actual grid is chunkCount * chunkSize
   */
  function createMockGridTerrain(chunksX = 2, chunksY = 2) {
    // gridTerrain constructor: (gridSizeX, gridSizeY, seed, chunkSize, tileSize, canvasSize, generationMode)
    // gridSizeX/Y = number of chunks, not tiles!
    const terrain = new gridTerrain(
      chunksX,           // gridSizeX (in chunks)
      chunksY,           // gridSizeY (in chunks)
      12345,             // seed
      8,                 // chunkSize (tiles per chunk)
      32,                // tileSize (pixels)
      [800, 600],        // canvasSize
      'perlin'           // generationMode
    );
    
    // Store actual tile dimensions for tests
    terrain._actualTilesX = chunksX * 8;  // chunkSize = 8
    terrain._actualTilesY = chunksY * 8;
    
    return terrain;
  }
  
  describe('MaterialPalette + GridTerrain Integration', function() {
    
    it('should select materials compatible with gridTerrain tiles', function() {
      const terrain = createMockGridTerrain(2, 2); // 2x2 chunks = 16x16 tiles
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      
      // Select material
      palette.selectMaterial('stone');
      const selectedMaterial = palette.getSelectedMaterial();
      
      // Apply to gridTerrain - getArrPos returns a Tile object
      const tile = terrain.getArrPos([5, 5]);
      tile.setMaterial(selectedMaterial);
      tile.assignWeight(); // Required after setMaterial
      
      // Verify it was set
      const result = terrain.getArrPos([5, 5]);
      expect(result.getMaterial()).to.equal('stone');
    });
    
    it('should support all gridTerrain material types', function() {
      const terrain = createMockGridTerrain(2, 2); // 16x16 tiles
      // Use only valid materials from TERRAIN_MATERIALS_RANGED
      const materials = ['moss', 'moss_1', 'stone', 'dirt', 'grass'];
      const palette = new MaterialPalette(materials);
      
      // Test each material
      materials.forEach((material, index) => {
        palette.selectMaterial(material);
        const tile = terrain.getArrPos([index % 5, Math.floor(index / 5)]);
        tile.setMaterial(palette.getSelectedMaterial());
        tile.assignWeight();
        
        const result = terrain.getArrPos([index % 5, Math.floor(index / 5)]);
        expect(result.getMaterial()).to.equal(material);
      });
    });
    
    it('should read existing gridTerrain materials into palette', function() {
      const terrain = createMockGridTerrain(2, 2);
      
      // Set some materials in terrain
      terrain.getArrPos([0, 0]).setMaterial('moss');
      terrain.getArrPos([1, 1]).setMaterial('stone');
      terrain.getArrPos([2, 2]).setMaterial('dirt');
      
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      
      // Simulate eyedropper picking from terrain
      const sampledMaterial = terrain.getArrPos([1, 1]).getMaterial();
      palette.selectMaterial(sampledMaterial);
      
      expect(palette.getSelectedMaterial()).to.equal('stone');
    });
  });
  
  describe('TerrainEditor + GridTerrain Integration', function() {
    
    it('should edit gridTerrain tiles through TerrainEditor', function() {
      const terrain = createMockGridTerrain(2, 2); // 16x16 tiles
      const editor = new TerrainEditor(terrain);
      
      editor.selectMaterial('stone');
      editor.paint(5, 5);
      
      const result = terrain.getArrPos([5, 5]);
      expect(result.getMaterial()).to.equal('stone');
    });
    
    it('should handle gridTerrain coordinate system', function() {
      const terrain = createMockGridTerrain(2, 2); // 16x16 tiles
      const editor = new TerrainEditor(terrain);
      
      editor.selectMaterial('dirt');
      
      // Paint at various coordinates (within 16x16 bounds)
      editor.paint(0, 0); // Top-left
      editor.paint(15, 0); // Top-right
      editor.paint(0, 15); // Bottom-left
      editor.paint(15, 15); // Bottom-right
      
      expect(terrain.getArrPos([0, 0]).getMaterial()).to.equal('dirt');
      expect(terrain.getArrPos([15, 0]).getMaterial()).to.equal('dirt');
      expect(terrain.getArrPos([0, 15]).getMaterial()).to.equal('dirt');
      expect(terrain.getArrPos([15, 15]).getMaterial()).to.equal('dirt');
    });
    
    it('should fill connected regions in gridTerrain', function() {
      const terrain = createMockGridTerrain(1, 1); // 8x8 tiles
      
      // Set all tiles to 'dirt' first to create a uniform region
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          terrain.getArrPos([x, y]).setMaterial('dirt');
        }
      }
      
      const editor = new TerrainEditor(terrain);
      editor.selectMaterial('stone');
      editor.fill(2, 2);
      
      // All tiles should now be stone (flood fill from center)
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const result = terrain.getArrPos([x, y]);
          expect(result.getMaterial()).to.equal('stone');
        }
      }
    });
    
    it('should support undo/redo on gridTerrain', function() {
      const terrain = createMockGridTerrain(2, 2);
      const editor = new TerrainEditor(terrain);
      
      const originalMaterial = terrain.getArrPos([5, 5]).getMaterial();
      
      editor.selectMaterial('stone');
      editor.paint(5, 5);
      expect(terrain.getArrPos([5, 5]).getMaterial()).to.equal('stone');
      
      editor.undo();
      expect(terrain.getArrPos([5, 5]).getMaterial()).to.equal(originalMaterial);
      
      editor.redo();
      expect(terrain.getArrPos([5, 5]).getMaterial()).to.equal('stone');
    });
  });
  
  describe('TerrainExporter + GridTerrain Integration', function() {
    
    it('should export gridTerrain to JSON format', function() {
      const terrain = createMockGridTerrain(1, 1); // 1x1 chunks = 8x8 tiles = 64 tiles
      
      // Set some specific materials
      terrain.getArrPos([0, 0]).setMaterial('moss');
      terrain.getArrPos([1, 1]).setMaterial('stone');
      terrain.getArrPos([2, 2]).setMaterial('dirt');
      
      const exporter = new TerrainExporter(terrain);
      const exported = exporter.exportToJSON();
      
      expect(exported).to.have.property('metadata');
      expect(exported).to.have.property('tiles');
      expect(exported.metadata).to.have.property('version');
      expect(exported.tiles).to.be.an('array');
      expect(exported.tiles).to.have.lengthOf(64); // 8x8 tiles
    });
    
    it('should preserve gridTerrain dimensions in export', function() {
      const terrain = createMockGridTerrain(1, 2); // 1x2 chunks = 8x16 tiles
      const exporter = new TerrainExporter(terrain);
      const exported = exporter.exportToJSON();
      
      expect(exported.metadata.gridSizeX).to.equal(1);
      expect(exported.metadata.gridSizeY).to.equal(2);
    });
    
    it('should export gridTerrain with metadata', function() {
      const terrain = createMockGridTerrain(10, 10);
      terrain.seed = 12345;
      terrain.generationMode = 'perlin';
      
      const exporter = new TerrainExporter(terrain);
      const exported = exporter.exportToJSON();
      
      expect(exported.metadata).to.have.property('version');
      expect(exported.metadata).to.have.property('gridSizeX', 10);
      expect(exported.metadata).to.have.property('gridSizeY', 10);
      expect(exported.metadata).to.have.property('exportDate');
    });
    
    it('should compress gridTerrain data efficiently', function() {
      const terrain = createMockGridTerrain(20, 20);
      // All tiles are 'moss' - perfect for compression
      
      const exporter = new TerrainExporter(terrain);
      const standard = exporter.exportToJSON();
      const compressed = exporter.exportCompressed();
      
      // Compressed tiles should be a string (RLE format)
      expect(compressed.tiles).to.be.a('string');
      expect(compressed.metadata).to.have.property('version');
      
      // Compressed should be much smaller than uncompressed
      const standardSize = JSON.stringify(standard.tiles).length;
      const compressedSize = compressed.tiles.length;
      expect(compressedSize).to.be.lessThan(standardSize);
    });
  });
  
  describe('TerrainImporter + GridTerrain Integration', function() {
    
    it('should import JSON data into gridTerrain', function() {
      const originalTerrain = createMockGridTerrain(1, 1); // 8x8 tiles
      
      // Set materials using Tile API
      originalTerrain.getArrPos([0, 0]).setMaterial('moss');
      originalTerrain.getArrPos([1, 1]).setMaterial('stone');
      originalTerrain.getArrPos([2, 2]).setMaterial('dirt');
      
      // Export
      const exporter = new TerrainExporter(originalTerrain);
      const exported = exporter.exportToJSON();
      
      // Create new terrain and import
      const newTerrain = createMockGridTerrain(1, 1);
      const importer = new TerrainImporter(newTerrain);
      importer.importFromJSON(exported);
      
      // Verify materials were imported
      expect(newTerrain.getArrPos([0, 0]).getMaterial()).to.equal('moss');
      expect(newTerrain.getArrPos([1, 1]).getMaterial()).to.equal('stone');
      expect(newTerrain.getArrPos([2, 2]).getMaterial()).to.equal('dirt');
    });
    
    it('should handle gridTerrain size mismatches during import', function() {
      const exportTerrain = createMockGridTerrain(5, 5);
      const exporter = new TerrainExporter(exportTerrain);
      const exported = exporter.exportToJSON();
      
      // Try to import into different size terrain
      const importTerrain = createMockGridTerrain(10, 10);
      const importer = new TerrainImporter(importTerrain);
      
      const result = importer.importFromJSON(exported);
      
      // Should either succeed with partial import or provide clear error
      expect(result).to.exist;
    });
    
    it('should import compressed gridTerrain data', function() {
      const originalTerrain = createMockGridTerrain(2, 2); // 16x16 tiles = 256 tiles
      
      // Set alternating pattern using Tile API
      const totalTilesX = originalTerrain._gridSizeX * originalTerrain._chunkSize;
      const totalTilesY = originalTerrain._gridSizeY * originalTerrain._chunkSize;
      
      let index = 0;
      for (let y = 0; y < totalTilesY; y++) {
        for (let x = 0; x < totalTilesX; x++) {
          const material = index % 2 === 0 ? 'moss' : 'stone';
          originalTerrain.getArrPos([x, y]).setMaterial(material);
          index++;
        }
      }
      
      const exporter = new TerrainExporter(originalTerrain);
      const compressed = exporter.exportCompressed();
      
      const newTerrain = createMockGridTerrain(2, 2);
      const importer = new TerrainImporter(newTerrain);
      importer.importFromJSON(compressed);
      
      // Verify pattern was preserved
      index = 0;
      for (let y = 0; y < totalTilesY; y++) {
        for (let x = 0; x < totalTilesX; x++) {
          const expectedMaterial = index % 2 === 0 ? 'moss' : 'stone';
          expect(newTerrain.getArrPos([x, y]).getMaterial()).to.equal(expectedMaterial);
          index++;
        }
      }
    });
  });
  
  describe('SaveDialog + GridTerrain Export Integration', function() {
    
    it('should prepare gridTerrain for save with dialog settings', function() {
      const terrain = createMockGridTerrain(10, 10);
      const dialog = new SaveDialog();
      const exporter = new TerrainExporter(terrain);
      
      // Configure save options
      dialog.setFilename('my_terrain');
      dialog.setFormat('json-compressed');
      
      // Export based on dialog format
      let exported;
      if (dialog.getFormat() === 'json-compressed') {
        exported = exporter.exportCompressed();
      } else {
        exported = exporter.exportToJSON();
      }
      
      expect(exported).to.have.property('metadata');
      expect(exported).to.have.property('tiles');
      expect(dialog.getFullFilename()).to.equal('my_terrain.json');
    });
    
    it('should estimate file size for gridTerrain export', function() {
      const terrain = createMockGridTerrain(20, 20);
      const exporter = new TerrainExporter(terrain);
      const dialog = new SaveDialog();
      
      const exported = exporter.exportToJSON();
      const estimatedSize = dialog.estimateSize(exported);
      
      expect(estimatedSize).to.be.greaterThan(0);
      
      // Formatted size should be readable
      const formatted = dialog.formatSize(estimatedSize);
      expect(formatted).to.match(/\d+(\.\d+)?\s*(B|KB|MB)/);
    });
    
    it('should validate filename for gridTerrain save', function() {
      const dialog = new SaveDialog();
      
      // Valid filenames
      expect(dialog.validateFilename('terrain_map').valid).to.be.true;
      expect(dialog.validateFilename('level_01').valid).to.be.true;
      
      // Invalid filenames
      expect(dialog.validateFilename('').valid).to.be.false;
      expect(dialog.validateFilename('map@home').valid).to.be.false;
    });
  });
  
  describe('LoadDialog + GridTerrain Import Integration', function() {
    
    it('should list available gridTerrain save files', function() {
      const dialog = new LoadDialog();
      
      dialog.setFiles([
        { name: 'terrain1.json', date: '2025-10-25', size: 1024 },
        { name: 'level_forest.json', date: '2025-10-24', size: 2048 },
        { name: 'dungeon_01.json', date: '2025-10-23', size: 512 }
      ]);
      
      const fileList = dialog.getFileList();
      expect(fileList).to.have.lengthOf(3);
      expect(fileList).to.include('terrain1.json');
    });
    
    it('should preview gridTerrain data before loading', function() {
      const originalTerrain = createMockGridTerrain(5, 5);
      const exporter = new TerrainExporter(originalTerrain);
      const exported = exporter.exportToJSON();
      
      const dialog = new LoadDialog();
      dialog.setFiles([
        {
          name: 'test_terrain.json',
          date: '2025-10-25',
          preview: {
            size: `${exported.metadata.gridSizeX}x${exported.metadata.gridSizeY}`,
            tiles: exported.tiles.length,
            version: exported.metadata.version
          }
        }
      ]);
      
      dialog.selectFile('test_terrain.json');
      const preview = dialog.getPreview();
      
      expect(preview).to.have.property('size');
      expect(preview.size).to.equal('5x5');
    });
    
    it('should validate gridTerrain data before import', function() {
      const dialog = new LoadDialog();
      
      // Valid terrain data
      const validData = {
        version: '2.0',
        terrain: {
          width: 10,
          height: 10,
          grid: Array(100).fill('moss')
        }
      };
      
      // Invalid terrain data
      const invalidData = {
        version: '2.0'
        // Missing terrain property
      };
      
      expect(dialog.validateFile(validData).valid).to.be.true;
      expect(dialog.validateFile(invalidData).valid).to.be.false;
    });
  });
  
  describe('FormatConverter + GridTerrain Integration', function() {
    
    it('should convert gridTerrain between JSON formats', function() {
      const terrain = createMockGridTerrain(2, 2);
      const exporter = new TerrainExporter(terrain);
      const converter = new FormatConverter();
      
      const standard = exporter.exportToJSON();
      const compressed = converter.convert(standard, 'json-compressed');
      
      expect(compressed).to.have.property('metadata');
      // Check compressed format has required structure
      expect(compressed.metadata.version).to.equal(standard.metadata.version);
    });
    
    it('should preserve gridTerrain data during format conversion', function() {
      const terrain = createMockGridTerrain(1, 1); // 8x8 tiles
      
      // Create pattern using Tile API
      terrain.getArrPos([0, 0]).setMaterial('moss');
      terrain.getArrPos([1, 1]).setMaterial('stone');
      terrain.getArrPos([2, 2]).setMaterial('dirt');
      
      const exporter = new TerrainExporter(terrain);
      const converter = new FormatConverter();
      
      const original = exporter.exportToJSON();
      const compressed = converter.convert(original, 'json', 'json-compressed');
      
      // Metadata should be preserved
      expect(compressed.metadata.version).to.equal(original.metadata.version);
      expect(compressed.metadata.gridSizeX).to.equal(original.metadata.gridSizeX);
      expect(compressed.metadata.gridSizeY).to.equal(original.metadata.gridSizeY);
    });
  });
  
  describe('Full Workflow: GridTerrain Export/Import Cycle', function() {
    
    it('should complete full save/load cycle with gridTerrain', function() {
      // 1. Create and modify terrain using Tile API
      const originalTerrain = createMockGridTerrain(2, 2);
      originalTerrain.getArrPos([5, 5]).setMaterial('stone');
      originalTerrain.getArrPos([3, 7]).setMaterial('dirt');
      
      // 2. Export with save dialog
      const saveDialog = new SaveDialog();
      saveDialog.setFilename('test_terrain');
      saveDialog.setFormat('json');
      
      const exporter = new TerrainExporter(originalTerrain);
      const exported = exporter.exportToJSON();
      
      // 3. Simulate file system (in real app, this would write to disk)
      const savedData = JSON.stringify(exported);
      
      // 4. Load with load dialog
      const loadDialog = new LoadDialog();
      loadDialog.setFiles([
        {
          name: saveDialog.getFullFilename(),
          date: new Date().toISOString(),
          preview: {
            size: `${exported.metadata.gridSizeX}x${exported.metadata.gridSizeY}`,
            version: exported.metadata.version
          }
        }
      ]);
      
      loadDialog.selectFile(saveDialog.getFullFilename());
      const validation = loadDialog.validateFile(exported);
      expect(validation.valid).to.be.true;
      
      // 5. Import into new terrain
      const newTerrain = createMockGridTerrain(2, 2);
      const importer = new TerrainImporter(newTerrain);
      importer.importFromJSON(JSON.parse(savedData));
      
      // 6. Verify data integrity using Tile API
      expect(newTerrain.getArrPos([5, 5]).getMaterial()).to.equal('stone');
      expect(newTerrain.getArrPos([3, 7]).getMaterial()).to.equal('dirt');
    });
    
    it('should handle edit → save → load → edit workflow', function() {
      // Initial terrain
      const terrain1 = createMockGridTerrain(2, 2);
      
      // Edit phase 1 - paint stone at [5,5]
      const editor1 = new TerrainEditor(terrain1);
      editor1.selectMaterial('stone');
      editor1.paint(5, 5);
      
      // Verify paint worked
      expect(terrain1.getArrPos([5, 5]).getMaterial()).to.equal('stone');
      
      // Save
      const exporter = new TerrainExporter(terrain1);
      const saved = exporter.exportToJSON();
      
      // Load into new terrain
      const terrain2 = createMockGridTerrain(2, 2);
      const importer = new TerrainImporter(terrain2);
      importer.importFromJSON(saved);
      
      // Verify loaded correctly using Tile API
      expect(terrain2.getArrPos([5, 5]).getMaterial()).to.equal('stone');
      
      // Continue editing
      const editor2 = new TerrainEditor(terrain2);
      editor2.selectMaterial('dirt');
      editor2.paint(7, 7);
      
      expect(terrain2.getArrPos([7, 7]).getMaterial()).to.equal('dirt');
      expect(terrain2.getArrPos([5, 5]).getMaterial()).to.equal('stone'); // Previous edit preserved
    });
  });
  
  describe('LocalStorage + GridTerrain Integration', function() {
    
    it('should save gridTerrain to browser storage', function() {
      const terrain = createMockGridTerrain(1, 1);
      terrain.getArrPos([2, 2]).setMaterial('stone');
      
      const exporter = new TerrainExporter(terrain);
      const exported = exporter.exportToJSON();
      
      const storage = new LocalStorageManager('terrain_');
      // Mock localStorage
      const mockStorage = {};
      storage.storage = {
        setItem: (key, value) => { mockStorage[key] = value; },
        getItem: (key) => mockStorage[key] || null,
        removeItem: (key) => { delete mockStorage[key]; },
        length: 0,
        key: () => null
      };
      
      const result = storage.save('test_map', exported);
      expect(result).to.be.true;
      expect(mockStorage['terrain_test_map']).to.exist;
    });
    
    it('should load gridTerrain from browser storage', function() {
      const originalTerrain = createMockGridTerrain(1, 1);
      originalTerrain.getArrPos([1, 1]).setMaterial('dirt');
      
      const exporter = new TerrainExporter(originalTerrain);
      const exported = exporter.exportToJSON();
      
      const storage = new LocalStorageManager('terrain_');
      const mockStorage = {};
      storage.storage = {
        setItem: (key, value) => { mockStorage[key] = value; },
        getItem: (key) => mockStorage[key] || null,
        removeItem: (key) => { delete mockStorage[key]; },
        length: 0,
        key: () => null
      };
      
      storage.save('test_map', exported);
      const loaded = storage.load('test_map');
      
      expect(loaded).to.deep.equal(exported);
      
      // Import into new terrain
      const newTerrain = createMockGridTerrain(1, 1);
      const importer = new TerrainImporter(newTerrain);
      importer.importFromJSON(loaded);
      
      expect(newTerrain.getArrPos([1, 1]).getMaterial()).to.equal('dirt');
    });
  });
});
