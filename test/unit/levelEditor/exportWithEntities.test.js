/**
 * Unit Tests: LevelEditor Export with Entity Spawn Data
 * 
 * Tests that entity spawn data is included in exported JSON
 * Following TDD: Write tests FIRST, then implement
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('LevelEditor - Export with Entity Spawn Data', function() {
  let LevelEditor;
  let levelEditor;
  let mockTerrain;
  let mockEntityPalette;
  
  before(function() {
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock TILE_SIZE constant
    global.TILE_SIZE = 32;
    window.TILE_SIZE = 32;
    
    // Mock p5.js globals
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, set: function(a, b) { this.x = a; this.y = b; } }));
    window.createVector = global.createVector;
    
    // Load actual LevelEditor class
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
    
    // Sync to window
    global.LevelEditor = LevelEditor;
    window.LevelEditor = LevelEditor;
  });
  
  beforeEach(function() {
    // Mock terrain with exportToJSON
    mockTerrain = {
      exportToJSON: sinon.stub().returns({
        version: '1.0',
        width: 100,
        height: 100,
        tiles: []
      })
    };
    
    // Mock EntityPalette
    mockEntityPalette = {
      _findTemplateById: sinon.stub().returns({
        id: 'ant_worker',
        type: 'Ant',
        properties: { faction: 'player' }
      })
    };
    
    // Create LevelEditor instance
    levelEditor = new LevelEditor();
    levelEditor.terrain = mockTerrain;
    levelEditor.entityPalette = mockEntityPalette;
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('_getExportData() - Build complete export data', function() {
    
    it('should include terrain data in export', function() {
      const exportData = levelEditor._getExportData();
      
      expect(exportData).to.have.property('version', '1.0');
      expect(exportData).to.have.property('width', 100);
      expect(exportData).to.have.property('height', 100);
      expect(exportData).to.have.property('tiles').that.is.an('array');
    });
    
    it('should include empty entities array when no entities placed', function() {
      const exportData = levelEditor._getExportData();
      
      expect(exportData).to.have.property('entities').that.is.an('array');
      expect(exportData.entities).to.have.lengthOf(0);
    });
    
    it('should include entity spawn data when entities placed', function() {
      // Place some entities
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', { health: 100 });
      levelEditor._placeSingleEntity(20, 25, 'ant_worker', { health: 150 });
      
      const exportData = levelEditor._getExportData();
      
      expect(exportData).to.have.property('entities').that.is.an('array');
      expect(exportData.entities).to.have.lengthOf(2);
      
      // Verify first entity
      const entity1 = exportData.entities[0];
      expect(entity1).to.have.property('id').that.is.a('string');
      expect(entity1).to.have.property('templateId', 'ant_worker');
      expect(entity1).to.have.property('gridX', 10);
      expect(entity1).to.have.property('gridY', 15);
      expect(entity1.properties).to.have.property('health', 100);
      
      // Verify second entity
      const entity2 = exportData.entities[1];
      expect(entity2).to.have.property('gridX', 20);
      expect(entity2).to.have.property('gridY', 25);
      expect(entity2.properties).to.have.property('health', 150);
    });
    
    it('should preserve entity spawn data order', function() {
      // Place entities in specific order
      levelEditor._placeSingleEntity(0, 0, 'ant_worker', { name: 'First' });
      levelEditor._placeSingleEntity(5, 5, 'ant_worker', { name: 'Second' });
      levelEditor._placeSingleEntity(10, 10, 'ant_worker', { name: 'Third' });
      
      const exportData = levelEditor._getExportData();
      
      expect(exportData.entities[0].properties.name).to.equal('First');
      expect(exportData.entities[1].properties.name).to.equal('Second');
      expect(exportData.entities[2].properties.name).to.equal('Third');
    });
    
    it('should include all entity properties in export', function() {
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {
        health: 100,
        movementSpeed: 50,
        damage: 20,
        faction: 'player',
        customProperty: 'customValue'
      });
      
      const exportData = levelEditor._getExportData();
      const entity = exportData.entities[0];
      
      expect(entity.properties).to.have.property('health', 100);
      expect(entity.properties).to.have.property('movementSpeed', 50);
      expect(entity.properties).to.have.property('damage', 20);
      expect(entity.properties).to.have.property('faction', 'player');
      expect(entity.properties).to.have.property('customProperty', 'customValue');
    });
    
    it('should handle terrain without exportToJSON method', function() {
      levelEditor.terrain = null;
      
      const exportData = levelEditor._getExportData();
      
      // Should return minimal structure
      expect(exportData).to.have.property('entities').that.is.an('array');
      expect(exportData.entities).to.have.lengthOf(0);
    });
  });
  
  describe('JSON structure validation', function() {
    
    it('should produce valid JSON serializable data', function() {
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', { health: 100 });
      
      const exportData = levelEditor._getExportData();
      
      // Should not throw when stringifying
      expect(() => JSON.stringify(exportData)).to.not.throw();
      
      const jsonString = JSON.stringify(exportData);
      expect(jsonString).to.be.a('string');
      
      // Should be parseable
      const parsed = JSON.parse(jsonString);
      expect(parsed).to.deep.equal(exportData);
    });
    
    it('should use grid coordinates (not world coordinates)', function() {
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      
      const exportData = levelEditor._getExportData();
      const entity = exportData.entities[0];
      
      // Grid coordinates (10, 15), NOT world pixels (320, 480)
      expect(entity.gridX).to.equal(10);
      expect(entity.gridY).to.equal(15);
      expect(entity).to.not.have.property('x');
      expect(entity).to.not.have.property('y');
      expect(entity).to.not.have.property('worldX');
      expect(entity).to.not.have.property('worldY');
    });
  });
  
  describe('Integration with existing terrain export', function() {
    
    it('should preserve terrain data when adding entities', function() {
      mockTerrain.exportToJSON.returns({
        version: '1.0',
        width: 200,
        height: 150,
        tiles: [
          { x: 0, y: 0, type: 'grass' },
          { x: 1, y: 0, type: 'water' }
        ]
      });
      
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      
      const exportData = levelEditor._getExportData();
      
      // Terrain data preserved
      expect(exportData.version).to.equal('1.0');
      expect(exportData.width).to.equal(200);
      expect(exportData.height).to.equal(150);
      expect(exportData.tiles).to.have.lengthOf(2);
      
      // Entities added
      expect(exportData.entities).to.have.lengthOf(1);
    });
    
    it('should not modify original terrain export data', function() {
      const originalTerrainData = {
        version: '1.0',
        tiles: []
      };
      mockTerrain.exportToJSON.returns(originalTerrainData);
      
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      const exportData = levelEditor._getExportData();
      
      // Original terrain data should not have entities property
      expect(originalTerrainData).to.not.have.property('entities');
      
      // Export data should have entities
      expect(exportData).to.have.property('entities');
    });
  });
  
  describe('Edge cases', function() {
    
    it('should handle empty spawn data gracefully', function() {
      const exportData = levelEditor._getExportData();
      
      expect(exportData.entities).to.be.an('array');
      expect(exportData.entities).to.have.lengthOf(0);
    });
    
    it('should handle large number of entities', function() {
      // Place 100 entities
      for (let i = 0; i < 100; i++) {
        levelEditor._placeSingleEntity(i, i, 'ant_worker', { index: i });
      }
      
      const exportData = levelEditor._getExportData();
      
      expect(exportData.entities).to.have.lengthOf(100);
      expect(exportData.entities[0].properties.index).to.equal(0);
      expect(exportData.entities[99].properties.index).to.equal(99);
    });
  });
});
