/**
 * EntityPainter Unit Tests
 * Tests for entity placement, removal, and JSON export/import
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityPainter', function() {
  let EntityPainter, EntityPalette, ant;
  let mockSpatialGridManager;
  
  before(function() {
    // Mock global dependencies
    global.loadImage = sinon.stub().returns({ width: 32, height: 32 });
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.TILE_SIZE = 32;
    
    // Mock ant class
    global.ant = class MockAnt {
      constructor(x, y, w, h, speed, rot, img, job, faction) {
        this.posX = x;
        this.posY = y;
        this.width = w;
        this.height = h;
        this.JobName = job;
        this.faction = faction;
        this.type = 'Ant';
        this._id = `ant_${Date.now()}`;
      }
      getPosition() { return { x: this.posX, y: this.posY }; }
    };
    
    // Mock spatial grid manager
    mockSpatialGridManager = {
      addEntity: sinon.stub(),
      removeEntity: sinon.stub()
    };
    global.spatialGridManager = mockSpatialGridManager;
    
    // Mock resource manager
    global.g_resourceManager = {
      createResource: sinon.stub().returns({
        type: 'greenLeaf',
        posX: 100,
        posY: 100,
        getPosition: function() { return { x: this.posX, y: this.posY }; }
      })
    };
    
    // Load EntityPalette first
    const EntityPaletteModule = require('../../../Classes/ui/EntityPalette');
    EntityPalette = EntityPaletteModule.EntityPalette || EntityPaletteModule;
    
    // Load EntityPainter
    const EntityPainterModule = require('../../../Classes/ui/EntityPainter');
    EntityPainter = EntityPainterModule.EntityPainter || EntityPainterModule;
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  after(function() {
    sinon.restore();
    delete global.spatialGridManager;
    delete global.g_resourceManager;
    delete global.ant;
  });
  
  describe('Constructor', function() {
    it('should initialize with EntityPalette', function() {
      const painter = new EntityPainter();
      expect(painter.palette).to.be.instanceOf(EntityPalette);
    });
    
    it('should track placed entities in array', function() {
      const painter = new EntityPainter();
      expect(painter.placedEntities).to.be.an('array');
      expect(painter.placedEntities.length).to.equal(0);
    });
    
    it('should initialize with no hover preview', function() {
      const painter = new EntityPainter();
      expect(painter.hoverPreview).to.be.null;
    });
  });
  
  describe('Entity Placement - Ants', function() {
    it('should create ant entity at grid position', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_worker');
      const entity = painter.placeEntity(100, 100);
      
      expect(entity).to.exist;
      expect(entity).to.be.instanceOf(global.ant);
      expect(entity.JobName).to.equal('Worker');
    });
    
    it('should convert grid coordinates to world coordinates for ant', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_soldier');
      const gridX = 5;
      const gridY = 10;
      const entity = painter.placeEntity(gridX, gridY);
      
      // Should be placed at grid position * TILE_SIZE
      expect(entity.posX).to.equal(gridX * 32);
      expect(entity.posY).to.equal(gridY * 32);
    });
    
    it('should add placed ant to tracking array', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_scout');
      
      expect(painter.placedEntities.length).to.equal(0);
      painter.placeEntity(100, 100);
      expect(painter.placedEntities.length).to.equal(1);
    });
    
    it('should register ant with spatial grid', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_queen');
      const entity = painter.placeEntity(100, 100);
      
      expect(mockSpatialGridManager.addEntity.calledOnce).to.be.true;
      expect(mockSpatialGridManager.addEntity.calledWith(entity)).to.be.true;
    });
  });
  
  describe('Entity Placement - Resources', function() {
    it('should create resource entity at grid position', function() {
      const painter = new EntityPainter();
      painter.palette.setCategory('resources');
      painter.palette.selectTemplate('resource_leaf');
      const entity = painter.placeEntity(200, 200);
      
      expect(entity).to.exist;
      expect(entity.type).to.equal('greenLeaf');
    });
    
    it('should delegate resource creation to ResourceSystemManager', function() {
      const painter = new EntityPainter();
      painter.palette.setCategory('resources');
      painter.palette.selectTemplate('resource_stick');
      
      global.g_resourceManager.createResource.resetHistory();
      painter.placeEntity(5, 10);
      
      expect(global.g_resourceManager.createResource.calledOnce).to.be.true;
    });
    
    it('should add placed resource to tracking array', function() {
      const painter = new EntityPainter();
      painter.palette.setCategory('resources');
      painter.palette.selectTemplate('resource_maple');
      
      expect(painter.placedEntities.length).to.equal(0);
      painter.placeEntity(150, 150);
      expect(painter.placedEntities.length).to.equal(1);
    });
  });
  
  describe('Entity Placement - Buildings', function() {
    it('should create building entity at grid position', function() {
      const painter = new EntityPainter();
      painter.palette.setCategory('buildings');
      painter.palette.selectTemplate('building_hill');
      const entity = painter.placeEntity(300, 300);
      
      expect(entity).to.exist;
      expect(entity.type).to.equal('Building');
    });
    
    it('should add placed building to tracking array', function() {
      const painter = new EntityPainter();
      painter.palette.setCategory('buildings');
      painter.palette.selectTemplate('building_hive');
      
      expect(painter.placedEntities.length).to.equal(0);
      painter.placeEntity(250, 250);
      expect(painter.placedEntities.length).to.equal(1);
    });
  });
  
  describe('Entity Placement - Validation', function() {
    it('should return null if no template selected', function() {
      const painter = new EntityPainter();
      const entity = painter.placeEntity(100, 100);
      expect(entity).to.be.null;
    });
    
    it('should not add to tracking array if placement fails', function() {
      const painter = new EntityPainter();
      const initialCount = painter.placedEntities.length;
      painter.placeEntity(100, 100); // No template selected
      expect(painter.placedEntities.length).to.equal(initialCount);
    });
  });
  
  describe('Entity Management', function() {
    it('should find entity at position', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_worker');
      const placed = painter.placeEntity(5, 5);
      
      const found = painter.getEntityAtPosition(5 * 32, 5 * 32, 50);
      expect(found).to.equal(placed);
    });
    
    it('should return null if no entity at position', function() {
      const painter = new EntityPainter();
      const found = painter.getEntityAtPosition(1000, 1000, 32);
      expect(found).to.be.null;
    });
    
    it('should remove entity from tracking array', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_soldier');
      const entity = painter.placeEntity(100, 100);
      
      expect(painter.placedEntities.length).to.equal(1);
      painter.removeEntity(entity);
      expect(painter.placedEntities.length).to.equal(0);
    });
    
    it('should unregister entity from spatial grid when removed', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_scout');
      const entity = painter.placeEntity(100, 100);
      
      mockSpatialGridManager.removeEntity.resetHistory();
      painter.removeEntity(entity);
      
      expect(mockSpatialGridManager.removeEntity.calledOnce).to.be.true;
      expect(mockSpatialGridManager.removeEntity.calledWith(entity)).to.be.true;
    });
    
    it('should handle removing non-existent entity gracefully', function() {
      const painter = new EntityPainter();
      const fakeEntity = { id: 'fake' };
      
      expect(() => painter.removeEntity(fakeEntity)).to.not.throw();
      expect(painter.placedEntities.length).to.equal(0);
    });
  });
  
  describe('Export to JSON', function() {
    it('should export entities to single JSON structure', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_worker');
      painter.placeEntity(5, 10);
      
      const json = painter.exportToJSON();
      
      expect(json).to.have.property('entities');
      expect(json.entities).to.be.an('array');
      expect(json.entities.length).to.equal(1);
    });
    
    it('should store entity position as grid coordinates', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_soldier');
      const gridX = 8;
      const gridY = 12;
      painter.placeEntity(gridX, gridY);
      
      const json = painter.exportToJSON();
      const entityData = json.entities[0];
      
      expect(entityData.gridPosition).to.exist;
      expect(entityData.gridPosition.x).to.equal(gridX);
      expect(entityData.gridPosition.y).to.equal(gridY);
    });
    
    it('should include entity type in export', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_queen');
      painter.placeEntity(5, 5);
      
      const json = painter.exportToJSON();
      expect(json.entities[0]).to.have.property('type');
      expect(json.entities[0].type).to.equal('Ant');
    });
    
    it('should include entity properties in export', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_worker');
      painter.placeEntity(5, 5);
      
      const json = painter.exportToJSON();
      const entityData = json.entities[0];
      
      expect(entityData).to.have.property('properties');
      expect(entityData.properties).to.have.property('JobName');
      expect(entityData.properties.JobName).to.equal('Worker');
    });
    
    it('should export multiple entities', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_worker');
      painter.placeEntity(5, 5);
      painter.palette.selectTemplate('ant_soldier');
      painter.placeEntity(10, 10);
      
      const json = painter.exportToJSON();
      expect(json.entities.length).to.equal(2);
    });
  });
  
  describe('Import from JSON', function() {
    it('should import entities from single JSON file', function() {
      const painter = new EntityPainter();
      const json = {
        entities: [
          {
            id: 'ent_001',
            type: 'Ant',
            gridPosition: { x: 5, y: 10 },
            properties: { JobName: 'Scout', faction: 'player' }
          }
        ]
      };
      
      painter.importFromJSON(json);
      expect(painter.placedEntities.length).to.equal(1);
    });
    
    it('should recreate entities at correct grid positions', function() {
      const painter = new EntityPainter();
      const gridX = 7;
      const gridY = 14;
      const json = {
        entities: [
          {
            id: 'ent_001',
            type: 'Ant',
            gridPosition: { x: gridX, y: gridY },
            properties: { JobName: 'Worker', faction: 'player' }
          }
        ]
      };
      
      painter.importFromJSON(json);
      const entity = painter.placedEntities[0];
      
      // Entity should be at world coordinates (grid * TILE_SIZE)
      expect(entity.posX).to.equal(gridX * 32);
      expect(entity.posY).to.equal(gridY * 32);
    });
    
    it('should preserve entity properties during import', function() {
      const painter = new EntityPainter();
      const json = {
        entities: [
          {
            id: 'ent_001',
            type: 'Ant',
            gridPosition: { x: 5, y: 5 },
            properties: { JobName: 'Soldier', faction: 'enemy' }
          }
        ]
      };
      
      painter.importFromJSON(json);
      const entity = painter.placedEntities[0];
      
      expect(entity.JobName).to.equal('Soldier');
      expect(entity.faction).to.equal('enemy');
    });
    
    it('should clear existing entities before import', function() {
      const painter = new EntityPainter();
      painter.palette.selectTemplate('ant_worker');
      painter.placeEntity(5, 5);
      
      expect(painter.placedEntities.length).to.equal(1);
      
      const json = {
        entities: [
          {
            id: 'ent_001',
            type: 'Ant',
            gridPosition: { x: 10, y: 10 },
            properties: { JobName: 'Scout', faction: 'player' }
          }
        ]
      };
      
      painter.importFromJSON(json);
      expect(painter.placedEntities.length).to.equal(1);
      expect(painter.placedEntities[0].JobName).to.equal('Scout');
    });
    
    it('should handle missing entity data gracefully', function() {
      const painter = new EntityPainter();
      const json = {
        entities: [
          {
            id: 'ent_001',
            type: 'Ant',
            gridPosition: { x: 5, y: 5 }
            // Missing properties
          }
        ]
      };
      
      expect(() => painter.importFromJSON(json)).to.not.throw();
    });
    
    it('should handle empty entities array', function() {
      const painter = new EntityPainter();
      const json = { entities: [] };
      
      expect(() => painter.importFromJSON(json)).to.not.throw();
      expect(painter.placedEntities.length).to.equal(0);
    });
  });
});
