/**
 * Unit Tests: LevelEditor Entity Spawn Data Storage
 * 
 * Tests entity spawn metadata storage (NOT actual entity creation)
 * Spawn data format: { id, templateId, gridX, gridY, properties }
 * 
 * Following TDD: Write tests FIRST, then implement
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('LevelEditor - Entity Spawn Data Storage', function() {
  let LevelEditor;
  let levelEditor;
  let mockEntityPalette;
  
  before(function() {
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock TILE_SIZE constant
    global.TILE_SIZE = 32;
    window.TILE_SIZE = 32;
    
    // Mock p5.js globals needed by LevelEditor
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, set: function(a, b) { this.x = a; this.y = b; } }));
    window.createVector = global.createVector;
    
    // Load actual LevelEditor class
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
    
    // Sync to window
    global.LevelEditor = LevelEditor;
    window.LevelEditor = LevelEditor;
  });
  
  beforeEach(function() {
    // Mock EntityPalette with _findTemplateById
    mockEntityPalette = {
      _findTemplateById: sinon.stub()
    };
    
    // Create LevelEditor instance
    levelEditor = new LevelEditor();
    levelEditor.entityPalette = mockEntityPalette;
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('_placeSingleEntity() - Store spawn metadata', function() {
    
    it('should store spawn data instead of creating entity instance', function() {
      // Setup: Mock template
      const mockTemplate = {
        id: 'ant_worker',
        type: 'Ant',
        job: 'Worker',
        properties: { faction: 'player', movementSpeed: 30 }
      };
      mockEntityPalette._findTemplateById.withArgs('ant_worker').returns(mockTemplate);
      
      // Execute: Place entity at grid coordinates
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', { health: 100 });
      
      // Verify: Spawn data stored (not entity created)
      const spawnData = levelEditor.getEntitySpawnData();
      expect(spawnData).to.have.lengthOf(1);
      
      const entry = spawnData[0];
      expect(entry).to.have.property('id').that.is.a('string');
      expect(entry).to.have.property('templateId', 'ant_worker');
      expect(entry).to.have.property('gridX', 10);
      expect(entry).to.have.property('gridY', 15);
      expect(entry).to.have.property('properties').that.is.an('object');
    });
    
    it('should generate unique ID for each spawn entry', function() {
      const mockTemplate = {
        id: 'ant_soldier',
        type: 'Ant',
        properties: {}
      };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      // Place multiple entities
      levelEditor._placeSingleEntity(0, 0, 'ant_soldier', {});
      levelEditor._placeSingleEntity(5, 5, 'ant_soldier', {});
      levelEditor._placeSingleEntity(10, 10, 'ant_soldier', {});
      
      const spawnData = levelEditor.getEntitySpawnData();
      expect(spawnData).to.have.lengthOf(3);
      
      // Verify all IDs are unique
      const ids = spawnData.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).to.equal(3);
    });
    
    it('should merge template properties with custom properties', function() {
      const mockTemplate = {
        id: 'ant_worker',
        properties: {
          faction: 'player',
          movementSpeed: 30,
          health: 50
        }
      };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      // Place with custom properties that override template
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {
        health: 100,  // Override template health
        damage: 20    // New property
      });
      
      const entry = levelEditor.getEntitySpawnData()[0];
      expect(entry.properties).to.deep.include({
        faction: 'player',      // From template
        movementSpeed: 30,      // From template
        health: 100,            // Overridden
        damage: 20              // New property
      });
    });
    
    it('should store grid coordinates (not world coordinates)', function() {
      const mockTemplate = { id: 'ant_scout', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      // Place at grid (10, 15) - NOT world coordinates (320, 480)
      levelEditor._placeSingleEntity(10, 15, 'ant_scout', {});
      
      const entry = levelEditor.getEntitySpawnData()[0];
      expect(entry.gridX).to.equal(10);
      expect(entry.gridY).to.equal(15);
      // Should NOT be world coordinates (gridX * 32, gridY * 32)
      expect(entry.gridX).to.not.equal(320);
      expect(entry.gridY).to.not.equal(480);
    });
    
    it('should handle template not found gracefully', function() {
      // Template doesn't exist
      mockEntityPalette._findTemplateById.withArgs('invalid_id').returns(null);
      
      // Attempt to place
      levelEditor._placeSingleEntity(10, 15, 'invalid_id', {});
      
      // Should not store spawn data for invalid template
      const spawnData = levelEditor.getEntitySpawnData();
      expect(spawnData).to.have.lengthOf(0);
    });
    
    it('should NOT create actual entity instances', function() {
      const mockTemplate = { id: 'ant_worker', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      // Mock global ants array if it exists
      const originalAnts = typeof global !== 'undefined' ? global.ants : undefined;
      if (typeof global !== 'undefined') global.ants = [];
      
      // Place entity
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      
      // Verify: NO entity instances created
      if (typeof global !== 'undefined' && global.ants) {
        expect(global.ants).to.have.lengthOf(0);
      }
      
      // Restore
      if (typeof global !== 'undefined') global.ants = originalAnts;
    });
    
    it('should allow multiple entities at same grid position', function() {
      const mockTemplate = { id: 'ant_worker', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      // Place two entities at same position
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', { name: 'Worker 1' });
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', { name: 'Worker 2' });
      
      const spawnData = levelEditor.getEntitySpawnData();
      expect(spawnData).to.have.lengthOf(2);
      expect(spawnData[0].gridX).to.equal(10);
      expect(spawnData[1].gridX).to.equal(10);
    });
  });
  
  describe('getEntitySpawnData() - Retrieve spawn data', function() {
    
    it('should return array of spawn data entries', function() {
      const result = levelEditor.getEntitySpawnData();
      expect(result).to.be.an('array');
    });
    
    it('should return empty array when no entities placed', function() {
      const result = levelEditor.getEntitySpawnData();
      expect(result).to.have.lengthOf(0);
    });
    
    it('should return all stored spawn data', function() {
      const mockTemplate = { id: 'ant_scout', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      // Place multiple entities
      levelEditor._placeSingleEntity(0, 0, 'ant_scout', {});
      levelEditor._placeSingleEntity(5, 5, 'ant_scout', {});
      levelEditor._placeSingleEntity(10, 10, 'ant_scout', {});
      
      const result = levelEditor.getEntitySpawnData();
      expect(result).to.have.lengthOf(3);
    });
  });
  
  describe('clearEntitySpawnData() - Clear all spawn data', function() {
    
    it('should remove all spawn data entries', function() {
      const mockTemplate = { id: 'ant_worker', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      // Place entities
      levelEditor._placeSingleEntity(0, 0, 'ant_worker', {});
      levelEditor._placeSingleEntity(5, 5, 'ant_worker', {});
      
      expect(levelEditor.getEntitySpawnData()).to.have.lengthOf(2);
      
      // Clear
      levelEditor.clearEntitySpawnData();
      
      expect(levelEditor.getEntitySpawnData()).to.have.lengthOf(0);
    });
    
    it('should allow placing entities after clearing', function() {
      const mockTemplate = { id: 'ant_scout', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      // Place, clear, place again
      levelEditor._placeSingleEntity(0, 0, 'ant_scout', {});
      levelEditor.clearEntitySpawnData();
      levelEditor._placeSingleEntity(10, 10, 'ant_scout', {});
      
      const result = levelEditor.getEntitySpawnData();
      expect(result).to.have.lengthOf(1);
      expect(result[0].gridX).to.equal(10);
    });
  });
  
  describe('removeEntitySpawnData(id) - Remove specific spawn entry', function() {
    
    it('should remove spawn data by ID', function() {
      const mockTemplate = { id: 'ant_worker', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      // Place multiple entities
      levelEditor._placeSingleEntity(0, 0, 'ant_worker', {});
      levelEditor._placeSingleEntity(5, 5, 'ant_worker', {});
      levelEditor._placeSingleEntity(10, 10, 'ant_worker', {});
      
      const spawnData = levelEditor.getEntitySpawnData();
      expect(spawnData).to.have.lengthOf(3);
      
      // Remove middle entry
      const idToRemove = spawnData[1].id;
      levelEditor.removeEntitySpawnData(idToRemove);
      
      const remaining = levelEditor.getEntitySpawnData();
      expect(remaining).to.have.lengthOf(2);
      expect(remaining.find(e => e.id === idToRemove)).to.be.undefined;
    });
    
    it('should do nothing if ID not found', function() {
      const mockTemplate = { id: 'ant_worker', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      levelEditor._placeSingleEntity(0, 0, 'ant_worker', {});
      
      const beforeCount = levelEditor.getEntitySpawnData().length;
      
      // Try to remove non-existent ID
      levelEditor.removeEntitySpawnData('invalid_id_12345');
      
      expect(levelEditor.getEntitySpawnData()).to.have.lengthOf(beforeCount);
    });
  });
  
  describe('Edge Cases', function() {
    
    it('should handle negative grid coordinates', function() {
      const mockTemplate = { id: 'ant_worker', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      levelEditor._placeSingleEntity(-5, -10, 'ant_worker', {});
      
      const entry = levelEditor.getEntitySpawnData()[0];
      expect(entry.gridX).to.equal(-5);
      expect(entry.gridY).to.equal(-10);
    });
    
    it('should handle large grid coordinates', function() {
      const mockTemplate = { id: 'ant_scout', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      levelEditor._placeSingleEntity(10000, 50000, 'ant_scout', {});
      
      const entry = levelEditor.getEntitySpawnData()[0];
      expect(entry.gridX).to.equal(10000);
      expect(entry.gridY).to.equal(50000);
    });
    
    it('should handle empty properties object', function() {
      const mockTemplate = { id: 'ant_worker', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      
      const entry = levelEditor.getEntitySpawnData()[0];
      expect(entry.properties).to.be.an('object');
    });
    
    it('should handle null properties', function() {
      const mockTemplate = { id: 'ant_worker', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', null);
      
      const entry = levelEditor.getEntitySpawnData()[0];
      expect(entry.properties).to.be.an('object');
    });
    
    it('should handle undefined properties', function() {
      const mockTemplate = { id: 'ant_worker', properties: {} };
      mockEntityPalette._findTemplateById.returns(mockTemplate);
      
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', undefined);
      
      const entry = levelEditor.getEntitySpawnData()[0];
      expect(entry.properties).to.be.an('object');
    });
  });
});
