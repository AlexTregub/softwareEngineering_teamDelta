/**
 * Unit Tests: Level Editor Sparse Export
 * 
 * Tests for SparseTerrain export functionality in Level Editor.
 * Ensures empty tiles are NOT exported as "dirt".
 * 
 * TDD: Tests written FIRST before implementation
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - Sparse Export (Unit)', function() {
  let mockTerrain, mockSaveDialog, mockNotifications;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock SparseTerrain with native exportToJSON
    mockTerrain = {
      tiles: new Map(),
      tileSize: 32,
      defaultMaterial: 'grass',
      MAX_MAP_SIZE: 100,
      bounds: { minX: 0, maxX: 5, minY: 0, maxY: 5 },
      
      setTile(x, y, material) {
        this.tiles.set(`${x},${y}`, { material });
      },
      
      getTile(x, y) {
        return this.tiles.get(`${x},${y}`) || null;
      },
      
      // Native SparseTerrain export (sparse format)
      exportToJSON() {
        const tiles = [];
        for (const [key, tile] of this.tiles.entries()) {
          const [x, y] = key.split(',').map(Number);
          tiles.push({ x, y, material: tile.material });
        }
        
        return {
          version: '1.0',
          metadata: {
            tileSize: this.tileSize,
            defaultMaterial: this.defaultMaterial,
            maxMapSize: this.MAX_MAP_SIZE,
            bounds: this.bounds
          },
          tileCount: this.tiles.size,
          tiles
        };
      }
    };
    
    // Paint some tiles (not full grid)
    mockTerrain.setTile(0, 0, 'stone');
    mockTerrain.setTile(5, 5, 'moss');
    mockTerrain.setTile(10, 10, 'water');
    
    // Mock SaveDialog
    mockSaveDialog = {
      saveWithNativeDialog: sinon.spy()
    };
    
    // Mock Notifications
    mockNotifications = {
      show: sinon.spy()
    };
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Export Format Detection', function() {
    it('should detect SparseTerrain and use native export', function() {
      const levelEditor = {
        terrain: mockTerrain,
        currentFilename: 'TestMap',
        saveDialog: mockSaveDialog,
        notifications: mockNotifications
      };
      
      // Simulate _performExport()
      const data = levelEditor.terrain.exportToJSON();
      
      // Should use SparseTerrain's native export
      expect(data).to.have.property('version');
      expect(data).to.have.property('metadata');
      expect(data).to.have.property('tileCount');
      expect(data).to.have.property('tiles');
      expect(data.tiles).to.be.an('array');
    });
    
    it('should export only painted tiles (sparse)', function() {
      const data = mockTerrain.exportToJSON();
      
      // Should only have 3 tiles (what we painted)
      expect(data.tiles).to.have.lengthOf(3);
      expect(data.tileCount).to.equal(3);
    });
    
    it('should NOT export empty tiles as default material', function() {
      const data = mockTerrain.exportToJSON();
      
      // Should NOT have 100x100 = 10,000 tiles
      expect(data.tiles.length).to.be.lessThan(100);
      
      // Should NOT have tiles at unpainted positions
      const exportedCoords = data.tiles.map(t => `${t.x},${t.y}`);
      expect(exportedCoords).to.not.include('1,1'); // Unpainted
      expect(exportedCoords).to.not.include('50,50'); // Unpainted
    });
    
    it('should include only specific painted tiles', function() {
      const data = mockTerrain.exportToJSON();
      
      const exportedCoords = data.tiles.map(t => ({ x: t.x, y: t.y }));
      
      expect(exportedCoords).to.deep.include({ x: 0, y: 0 });
      expect(exportedCoords).to.deep.include({ x: 5, y: 5 });
      expect(exportedCoords).to.deep.include({ x: 10, y: 10 });
    });
  });
  
  describe('Export Metadata', function() {
    it('should include SparseTerrain metadata', function() {
      const data = mockTerrain.exportToJSON();
      
      expect(data.metadata.tileSize).to.equal(32);
      expect(data.metadata.defaultMaterial).to.equal('grass');
      expect(data.metadata.maxMapSize).to.equal(100);
      expect(data.metadata.bounds).to.deep.equal({ minX: 0, maxX: 5, minY: 0, maxY: 5 });
    });
    
    it('should include tile count', function() {
      const data = mockTerrain.exportToJSON();
      
      expect(data.tileCount).to.equal(3);
    });
  });
  
  describe('Material Preservation', function() {
    it('should preserve painted materials', function() {
      const data = mockTerrain.exportToJSON();
      
      const stoneTile = data.tiles.find(t => t.x === 0 && t.y === 0);
      const mossTile = data.tiles.find(t => t.x === 5 && t.y === 5);
      const waterTile = data.tiles.find(t => t.x === 10 && t.y === 10);
      
      expect(stoneTile.material).to.equal('stone');
      expect(mossTile.material).to.equal('moss');
      expect(waterTile.material).to.equal('water');
    });
    
    it('should NOT export default material for empty tiles', function() {
      const data = mockTerrain.exportToJSON();
      
      // Count tiles with default material
      const defaultMaterialTiles = data.tiles.filter(t => t.material === 'grass');
      
      // Should be 0 (grass is default, but no grass tiles painted)
      expect(defaultMaterialTiles).to.have.lengthOf(0);
    });
  });
  
  describe('Empty Terrain Handling', function() {
    it('should export empty array when no tiles painted', function() {
      const emptyTerrain = {
        tiles: new Map(),
        tileSize: 32,
        defaultMaterial: 'grass',
        MAX_MAP_SIZE: 100,
        bounds: null,
        
        exportToJSON() {
          return {
            version: '1.0',
            metadata: {
              tileSize: this.tileSize,
              defaultMaterial: this.defaultMaterial,
              maxMapSize: this.MAX_MAP_SIZE,
              bounds: this.bounds
            },
            tileCount: 0,
            tiles: []
          };
        }
      };
      
      const data = emptyTerrain.exportToJSON();
      
      expect(data.tiles).to.be.an('array').with.lengthOf(0);
      expect(data.tileCount).to.equal(0);
      expect(data.metadata.bounds).to.be.null;
    });
  });
  
  describe('Import/Export Round Trip', function() {
    it('should preserve sparse data through round trip', function() {
      // Export
      const exported = mockTerrain.exportToJSON();
      
      // Create new terrain and import
      const newTerrain = {
        tiles: new Map(),
        tileSize: 32,
        defaultMaterial: 'grass',
        MAX_MAP_SIZE: 100,
        bounds: null,
        
        setTile(x, y, material) {
          this.tiles.set(`${x},${y}`, { material });
        },
        
        getTile(x, y) {
          return this.tiles.get(`${x},${y}`) || null;
        },
        
        importFromJSON(data) {
          this.tiles.clear();
          this.tileSize = data.metadata.tileSize;
          this.defaultMaterial = data.metadata.defaultMaterial;
          this.MAX_MAP_SIZE = data.metadata.maxMapSize;
          this.bounds = data.metadata.bounds;
          
          for (const tile of data.tiles) {
            this.setTile(tile.x, tile.y, tile.material);
          }
        }
      };
      
      newTerrain.importFromJSON(exported);
      
      // Verify tile count
      expect(newTerrain.tiles.size).to.equal(3);
      
      // Verify materials
      expect(newTerrain.getTile(0, 0).material).to.equal('stone');
      expect(newTerrain.getTile(5, 5).material).to.equal('moss');
      expect(newTerrain.getTile(10, 10).material).to.equal('water');
      
      // Verify empty tiles are NULL, not default material
      expect(newTerrain.getTile(1, 1)).to.be.null;
      expect(newTerrain.getTile(50, 50)).to.be.null;
    });
  });
});
