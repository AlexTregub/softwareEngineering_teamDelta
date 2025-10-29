/**
 * Unit Tests: TerrainImporter - SparseTerrain Format Support
 * 
 * Tests for TerrainImporter's ability to detect and validate SparseTerrain format.
 * 
 * TDD Phase 1: Tests written FIRST (these should FAIL initially)
 * 
 * SparseTerrain format:
 * {
 *   version: '1.0',
 *   metadata: { tileSize, defaultMaterial, maxMapSize, bounds },
 *   tileCount: 10,
 *   tiles: [{ x, y, material }, ...]
 * }
 * 
 * gridTerrain format:
 * {
 *   metadata: { version: '1.0', gridSizeX, gridSizeY, ... },
 *   tiles: [...]
 * }
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load TerrainImporter directly
const TerrainImporter = require('../../../Classes/terrainUtils/TerrainImporter');

describe('TerrainImporter - SparseTerrain Format (Unit)', function() {
  
  describe('Format Detection', function() {
    it('should detect SparseTerrain format (version at top level)', function() {
      const sparseData = {
        version: '1.0',
        metadata: {
          tileSize: 32,
          defaultMaterial: 'grass',
          maxMapSize: 100
        },
        tileCount: 5,
        tiles: []
      };
      
      const mockTerrain = {};
      const importer = new TerrainImporter(mockTerrain);
      
      // TerrainImporter should have a method to detect format
      // This test will FAIL until we implement format detection
      const isSparse = importer._detectSparseFormat(sparseData);
      expect(isSparse).to.be.true;
    });
    
    it('should detect gridTerrain format (version in metadata)', function() {
      const gridData = {
        metadata: {
          version: '1.0',
          gridSizeX: 10,
          gridSizeY: 10,
          chunkSize: 8
        },
        tiles: []
      };
      
      const mockTerrain = {};
      const importer = new TerrainImporter(mockTerrain);
      
      const isSparse = importer._detectSparseFormat(gridData);
      expect(isSparse).to.be.false;
    });
    
    it('should distinguish between formats correctly', function() {
      const sparseData = {
        version: '1.0',
        metadata: { tileSize: 32 },
        tiles: []
      };
      
      const gridData = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5
        },
        tiles: []
      };
      
      const mockTerrain = {};
      const importer = new TerrainImporter(mockTerrain);
      
      expect(importer._detectSparseFormat(sparseData)).to.be.true;
      expect(importer._detectSparseFormat(gridData)).to.be.false;
    });
  });
  
  describe('Validation - SparseTerrain Format', function() {
    it('should validate correct SparseTerrain format', function() {
      const sparseData = {
        version: '1.0',
        metadata: {
          tileSize: 32,
          defaultMaterial: 'grass',
          maxMapSize: 100,
          bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 }
        },
        tileCount: 3,
        tiles: [
          { x: 0, y: 0, material: 'stone' },
          { x: 5, y: 5, material: 'moss' },
          { x: 10, y: 10, material: 'water' }
        ]
      };
      
      const mockTerrain = {};
      const importer = new TerrainImporter(mockTerrain);
      
      const validation = importer.validateImport(sparseData);
      
      expect(validation.valid).to.be.true;
      expect(validation.errors).to.be.an('array').with.lengthOf(0);
    });
    
    it('should NOT require gridSizeX for SparseTerrain format', function() {
      const sparseData = {
        version: '1.0',
        metadata: {
          tileSize: 32,
          defaultMaterial: 'grass'
          // NO gridSizeX or gridSizeY
        },
        tiles: []
      };
      
      const mockTerrain = {};
      const importer = new TerrainImporter(mockTerrain);
      
      const validation = importer.validateImport(sparseData);
      
      // Should NOT complain about missing gridSizeX/gridSizeY
      expect(validation.valid).to.be.true;
      expect(validation.errors).to.not.include('Invalid gridSizeX');
      expect(validation.errors).to.not.include('Invalid gridSizeY');
    });
    
    it('should reject SparseTerrain with missing version', function() {
      const invalidData = {
        // NO version
        metadata: {
          tileSize: 32
        },
        tiles: []
      };
      
      const mockTerrain = {};
      const importer = new TerrainImporter(mockTerrain);
      
      const validation = importer.validateImport(invalidData);
      
      expect(validation.valid).to.be.false;
      expect(validation.errors).to.include('Missing version');
    });
    
    it('should reject SparseTerrain with missing metadata', function() {
      const invalidData = {
        version: '1.0',
        // NO metadata
        tiles: []
      };
      
      const mockTerrain = {};
      const importer = new TerrainImporter(mockTerrain);
      
      const validation = importer.validateImport(invalidData);
      
      expect(validation.valid).to.be.false;
      expect(validation.errors).to.include('Missing metadata');
    });
    
    it('should reject SparseTerrain with missing tiles array', function() {
      const invalidData = {
        version: '1.0',
        metadata: {
          tileSize: 32
        }
        // NO tiles
      };
      
      const mockTerrain = {};
      const importer = new TerrainImporter(mockTerrain);
      
      const validation = importer.validateImport(invalidData);
      
      expect(validation.valid).to.be.false;
      expect(validation.errors).to.include('Missing tiles array');
    });
  });
  
  describe('Validation - gridTerrain Format (Existing)', function() {
    it('should still validate gridTerrain format correctly', function() {
      const gridData = {
        metadata: {
          version: '1.0',
          gridSizeX: 5,
          gridSizeY: 5,
          chunkSize: 8,
          tileSize: 32
        },
        tiles: []
      };
      
      const mockTerrain = {};
      const importer = new TerrainImporter(mockTerrain);
      
      const validation = importer.validateImport(gridData);
      
      expect(validation.valid).to.be.true;
      expect(validation.errors).to.be.an('array').with.lengthOf(0);
    });
    
    it('should require gridSizeX for gridTerrain format', function() {
      const invalidData = {
        metadata: {
          version: '1.0',
          gridSizeY: 5
          // NO gridSizeX
        },
        tiles: []
      };
      
      const mockTerrain = {};
      const importer = new TerrainImporter(mockTerrain);
      
      const validation = importer.validateImport(invalidData);
      
      expect(validation.valid).to.be.false;
      expect(validation.errors).to.include('Invalid gridSizeX');
    });
  });
  
  describe('Import Method - Format Delegation', function() {
    it('should delegate SparseTerrain import to terrain native method', function() {
      const sparseData = {
        version: '1.0',
        metadata: {
          tileSize: 32,
          defaultMaterial: 'grass'
        },
        tiles: [
          { x: 0, y: 0, material: 'stone' }
        ]
      };
      
      const mockTerrain = {
        importFromJSON: sinon.spy()
      };
      
      const importer = new TerrainImporter(mockTerrain);
      const success = importer.importFromJSON(sparseData);
      
      // Should call terrain's native import
      expect(mockTerrain.importFromJSON.calledOnce).to.be.true;
      expect(mockTerrain.importFromJSON.calledWith(sparseData)).to.be.true;
      expect(success).to.be.true;
    });
    
    it('should use grid import logic for gridTerrain format', function() {
      const gridData = {
        metadata: {
          version: '1.0',
          gridSizeX: 2,
          gridSizeY: 2,
          chunkSize: 8
        },
        tiles: ['moss', 'moss', 'moss', 'moss']
      };
      
      const mockTerrain = {
        _gridSizeX: 2,
        _gridSizeY: 2,
        _chunkSize: 8,
        getArrPos: sinon.stub().returns({
          setMaterial: sinon.spy(),
          assignWeight: sinon.spy()
        })
      };
      
      const importer = new TerrainImporter(mockTerrain);
      const success = importer.importFromJSON(gridData);
      
      // Should NOT call native import (doesn't exist for gridTerrain)
      // Should use internal grid logic
      expect(success).to.be.true;
      expect(mockTerrain.getArrPos.called).to.be.true;
    });
    
    it('should fail gracefully if terrain lacks native import for sparse format', function() {
      const sparseData = {
        version: '1.0',
        metadata: { tileSize: 32 },
        tiles: []
      };
      
      const mockTerrain = {
        // NO importFromJSON method
      };
      
      const importer = new TerrainImporter(mockTerrain);
      const success = importer.importFromJSON(sparseData);
      
      expect(success).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty SparseTerrain (no tiles)', function() {
      const emptyData = {
        version: '1.0',
        metadata: {
          tileSize: 32,
          defaultMaterial: 'grass',
          bounds: null
        },
        tileCount: 0,
        tiles: []
      };
      
      const mockTerrain = {
        importFromJSON: sinon.spy()
      };
      
      const importer = new TerrainImporter(mockTerrain);
      const validation = importer.validateImport(emptyData);
      
      expect(validation.valid).to.be.true;
      
      const success = importer.importFromJSON(emptyData);
      expect(success).to.be.true;
    });
    
    it('should handle unknown format gracefully', function() {
      const unknownData = {
        // Neither sparse nor grid format
        someRandomField: 'value'
      };
      
      const mockTerrain = {};
      const importer = new TerrainImporter(mockTerrain);
      
      const validation = importer.validateImport(unknownData);
      
      // Should fail validation (defaults to gridTerrain validation which will fail)
      expect(validation.valid).to.be.false;
      expect(validation.errors.length).to.be.greaterThan(0);
      // Should have errors about missing metadata/tiles
      expect(validation.errors).to.include.oneOf(['Missing metadata', 'Missing tiles data']);
    });
  });
});
