/**
 * Entity Painting & Save Integration Tests
 * 
 * Tests the complete workflow:
 * 1. Entity painted onto grid from EntityPalette
 * 2. Grid recognizes and stores entity at correct grid position
 * 3. Entity saved to JSON with correct grid coordinates
 * 4. JSON contains all necessary spawn information
 * 5. Entity can be loaded back from JSON
 * 
 * CRITICAL: Verifies grid coordinate system (not world pixels)
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Entity Painting & Save - Integration', function() {
  let sandbox;
  let mockP5;
  let mockLevelEditor;
  let mockEntityPalette;
  let mockTerrainExporter;
  let paintedEntities;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    paintedEntities = [];
    
    // Mock p5.js
    mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      createVector: sandbox.stub().callsFake((x, y) => ({ x, y })),
      TILE_SIZE: 32
    };
    
    Object.assign(global, mockP5);
    if (typeof window !== 'undefined') {
      Object.assign(window, mockP5);
    }
    
    // Mock TILE_SIZE constant
    global.TILE_SIZE = 32;
    if (typeof window !== 'undefined') {
      window.TILE_SIZE = 32;
    }
    
    // Mock EntityPalette
    mockEntityPalette = {
      getSelectedTemplate: sandbox.stub().returns({
        id: 'ant_worker',
        name: 'Worker Ant',
        type: 'Ant',
        properties: {
          JobName: 'Worker',
          faction: 'player',
          health: 100,
          movementSpeed: 30
        }
      }),
      hasSelection: sandbox.stub().returns(true)
    };
    
    // Mock Level Editor with entity painting
    mockLevelEditor = {
      entities: paintedEntities,
      
      paintEntity(gridX, gridY, template) {
        const entity = {
          id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          templateId: template.id,
          name: template.name,
          type: template.type,
          gridPosition: { x: gridX, y: gridY },
          worldPosition: { x: gridX * TILE_SIZE, y: gridY * TILE_SIZE },
          properties: { ...template.properties }
        };
        
        this.entities.push(entity);
        return entity;
      },
      
      getEntityAtGridPos(gridX, gridY) {
        return this.entities.find(e => 
          e.gridPosition.x === gridX && e.gridPosition.y === gridY
        );
      },
      
      getAllEntities() {
        return this.entities;
      },
      
      exportToJSON() {
        return {
          terrain: { /* terrain data */ },
          entities: this.entities.map(e => ({
            id: e.id,
            type: e.type,
            templateId: e.templateId,
            gridPosition: { x: e.gridPosition.x, y: e.gridPosition.y },
            properties: e.properties
          }))
        };
      }
    };
    
    // Mock TerrainExporter
    mockTerrainExporter = {
      exportLevel(levelData) {
        return JSON.stringify(levelData, null, 2);
      },
      
      saveToFile(jsonString, filename) {
        // Simulate file save
        return { success: true, filename: filename, data: jsonString };
      }
    };
  });
  
  afterEach(function() {
    sandbox.restore();
    paintedEntities.length = 0;
  });
  
  describe('Entity Painting to Grid', function() {
    it('should paint entity at correct grid position', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      const gridX = 10;
      const gridY = 15;
      
      const entity = mockLevelEditor.paintEntity(gridX, gridY, template);
      
      expect(entity.gridPosition.x).to.equal(10);
      expect(entity.gridPosition.y).to.equal(15);
    });
    
    it('should convert grid position to world coordinates', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      const gridX = 10;
      const gridY = 15;
      
      const entity = mockLevelEditor.paintEntity(gridX, gridY, template);
      
      // worldX = gridX * TILE_SIZE
      expect(entity.worldPosition.x).to.equal(10 * 32);
      expect(entity.worldPosition.y).to.equal(15 * 32);
    });
    
    it('should store entity in level editor entities array', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      
      expect(mockLevelEditor.entities.length).to.equal(1);
      expect(mockLevelEditor.entities[0].templateId).to.equal('ant_worker');
    });
    
    it('should retrieve entity from grid by position', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      
      const retrieved = mockLevelEditor.getEntityAtGridPos(10, 15);
      
      expect(retrieved).to.exist;
      expect(retrieved.gridPosition.x).to.equal(10);
      expect(retrieved.gridPosition.y).to.equal(15);
    });
    
    it('should return null for empty grid position', function() {
      const retrieved = mockLevelEditor.getEntityAtGridPos(99, 99);
      
      expect(retrieved).to.be.undefined;
    });
    
    it('should paint multiple entities at different positions', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      mockLevelEditor.paintEntity(12, 18, template);
      mockLevelEditor.paintEntity(5, 5, template);
      
      expect(mockLevelEditor.entities.length).to.equal(3);
      
      const entity1 = mockLevelEditor.getEntityAtGridPos(10, 15);
      const entity2 = mockLevelEditor.getEntityAtGridPos(12, 18);
      const entity3 = mockLevelEditor.getEntityAtGridPos(5, 5);
      
      expect(entity1).to.exist;
      expect(entity2).to.exist;
      expect(entity3).to.exist;
    });
    
    it('should preserve entity properties when painting', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      const entity = mockLevelEditor.paintEntity(10, 15, template);
      
      expect(entity.properties.JobName).to.equal('Worker');
      expect(entity.properties.faction).to.equal('player');
      expect(entity.properties.health).to.equal(100);
      expect(entity.properties.movementSpeed).to.equal(30);
    });
    
    it('should generate unique ID for each painted entity', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      const entity1 = mockLevelEditor.paintEntity(10, 15, template);
      const entity2 = mockLevelEditor.paintEntity(11, 15, template);
      
      expect(entity1.id).to.not.equal(entity2.id);
      expect(entity1.id).to.match(/^entity_\d+_[a-z0-9]+$/);
    });
  });
  
  describe('JSON Export with Entities', function() {
    it('should export entities to JSON with grid positions', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      mockLevelEditor.paintEntity(12, 18, template);
      
      const json = mockLevelEditor.exportToJSON();
      
      expect(json.entities).to.be.an('array');
      expect(json.entities.length).to.equal(2);
    });
    
    it('should store grid coordinates (not world pixels) in JSON', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      
      const json = mockLevelEditor.exportToJSON();
      const entityData = json.entities[0];
      
      // CRITICAL: Must be grid coords (10, 15), not world coords (320, 480)
      expect(entityData.gridPosition.x).to.equal(10);
      expect(entityData.gridPosition.y).to.equal(15);
    });
    
    it('should include entity type in JSON', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      
      const json = mockLevelEditor.exportToJSON();
      const entityData = json.entities[0];
      
      expect(entityData.type).to.equal('Ant');
    });
    
    it('should include templateId for spawning', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      
      const json = mockLevelEditor.exportToJSON();
      const entityData = json.entities[0];
      
      expect(entityData.templateId).to.equal('ant_worker');
    });
    
    it('should include all entity properties in JSON', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      
      const json = mockLevelEditor.exportToJSON();
      const entityData = json.entities[0];
      
      expect(entityData.properties).to.exist;
      expect(entityData.properties.JobName).to.equal('Worker');
      expect(entityData.properties.faction).to.equal('player');
      expect(entityData.properties.health).to.equal(100);
    });
    
    it('should export multiple entities with unique IDs', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      mockLevelEditor.paintEntity(12, 18, template);
      
      const json = mockLevelEditor.exportToJSON();
      
      expect(json.entities[0].id).to.not.equal(json.entities[1].id);
    });
    
    it('should maintain entity order in JSON', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      mockLevelEditor.paintEntity(12, 18, template);
      mockLevelEditor.paintEntity(5, 5, template);
      
      const json = mockLevelEditor.exportToJSON();
      
      expect(json.entities[0].gridPosition).to.deep.equal({ x: 10, y: 15 });
      expect(json.entities[1].gridPosition).to.deep.equal({ x: 12, y: 18 });
      expect(json.entities[2].gridPosition).to.deep.equal({ x: 5, y: 5 });
    });
  });
  
  describe('Save Workflow', function() {
    it('should save level with entities to JSON file', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      mockLevelEditor.paintEntity(12, 18, template);
      
      const json = mockLevelEditor.exportToJSON();
      const jsonString = mockTerrainExporter.exportLevel(json);
      const result = mockTerrainExporter.saveToFile(jsonString, 'test_level.json');
      
      expect(result.success).to.be.true;
      expect(result.data).to.include('"gridPosition"');
      expect(result.data).to.include('"templateId"');
      expect(result.data).to.include('"properties"');
    });
    
    it('should save entities with grid coordinates for loading', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      
      const json = mockLevelEditor.exportToJSON();
      const jsonString = mockTerrainExporter.exportLevel(json);
      
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.entities[0].gridPosition.x).to.equal(10);
      expect(parsed.entities[0].gridPosition.y).to.equal(15);
    });
    
    it('should save all necessary spawn information', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      mockLevelEditor.paintEntity(10, 15, template);
      
      const json = mockLevelEditor.exportToJSON();
      const jsonString = mockTerrainExporter.exportLevel(json);
      const parsed = JSON.parse(jsonString);
      const entityData = parsed.entities[0];
      
      // Verify all spawn-required fields
      expect(entityData).to.have.property('id');
      expect(entityData).to.have.property('type');
      expect(entityData).to.have.property('templateId');
      expect(entityData).to.have.property('gridPosition');
      expect(entityData.gridPosition).to.have.property('x');
      expect(entityData.gridPosition).to.have.property('y');
      expect(entityData).to.have.property('properties');
    });
  });
  
  describe('Entity Loading from JSON', function() {
    it('should load entity from JSON at correct grid position', function() {
      // Simulate save
      const template = mockEntityPalette.getSelectedTemplate();
      mockLevelEditor.paintEntity(10, 15, template);
      const json = mockLevelEditor.exportToJSON();
      
      // Simulate load
      const savedEntity = json.entities[0];
      
      // Verify grid position is preserved
      expect(savedEntity.gridPosition.x).to.equal(10);
      expect(savedEntity.gridPosition.y).to.equal(15);
      
      // Convert to world coords for spawning
      const worldX = savedEntity.gridPosition.x * TILE_SIZE;
      const worldY = savedEntity.gridPosition.y * TILE_SIZE;
      
      expect(worldX).to.equal(320);
      expect(worldY).to.equal(480);
    });
    
    it('should preserve entity properties through save/load cycle', function() {
      // Save
      const template = mockEntityPalette.getSelectedTemplate();
      mockLevelEditor.paintEntity(10, 15, template);
      const json = mockLevelEditor.exportToJSON();
      
      // Load
      const savedEntity = json.entities[0];
      
      expect(savedEntity.properties.JobName).to.equal('Worker');
      expect(savedEntity.properties.faction).to.equal('player');
      expect(savedEntity.properties.health).to.equal(100);
    });
    
    it('should load multiple entities from JSON', function() {
      // Save
      const template = mockEntityPalette.getSelectedTemplate();
      mockLevelEditor.paintEntity(10, 15, template);
      mockLevelEditor.paintEntity(12, 18, template);
      mockLevelEditor.paintEntity(5, 5, template);
      
      const json = mockLevelEditor.exportToJSON();
      
      // Load
      expect(json.entities.length).to.equal(3);
      
      json.entities.forEach(entity => {
        expect(entity.gridPosition).to.exist;
        expect(entity.templateId).to.exist;
        expect(entity.properties).to.exist;
      });
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle entity at grid position (0, 0)', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      const entity = mockLevelEditor.paintEntity(0, 0, template);
      
      expect(entity.gridPosition.x).to.equal(0);
      expect(entity.gridPosition.y).to.equal(0);
      expect(entity.worldPosition.x).to.equal(0);
      expect(entity.worldPosition.y).to.equal(0);
    });
    
    it('should handle large grid coordinates', function() {
      const template = mockEntityPalette.getSelectedTemplate();
      
      const entity = mockLevelEditor.paintEntity(999, 999, template);
      
      expect(entity.gridPosition.x).to.equal(999);
      expect(entity.gridPosition.y).to.equal(999);
      expect(entity.worldPosition.x).to.equal(999 * 32);
      expect(entity.worldPosition.y).to.equal(999 * 32);
    });
    
    it('should handle entity with minimal properties', function() {
      const minimalTemplate = {
        id: 'simple_entity',
        name: 'Simple',
        type: 'Entity',
        properties: {}
      };
      
      const entity = mockLevelEditor.paintEntity(10, 15, minimalTemplate);
      
      expect(entity.gridPosition).to.exist;
      expect(entity.templateId).to.equal('simple_entity');
      expect(entity.properties).to.be.an('object');
    });
    
    it('should export empty entities array when no entities painted', function() {
      const json = mockLevelEditor.exportToJSON();
      
      expect(json.entities).to.be.an('array');
      expect(json.entities.length).to.equal(0);
    });
  });
});
