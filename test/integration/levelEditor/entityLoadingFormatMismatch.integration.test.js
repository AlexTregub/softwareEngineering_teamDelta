/**
 * Integration tests for entity loading format mismatch bug
 * 
 * BUG: CaveTutorial.json uses gridX/gridY format, but EntityPainter.importFromJSON()
 * expects gridPosition.x/gridPosition.y format
 * 
 * This test verifies the fix handles BOTH formats correctly
 */

const { expect } = require('chai');
const sinon = require('sinon');

const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');


setupTestEnvironment({ rendering: true });

describe('EntityPainter - Format Mismatch Fix (Integration)', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let EntityPainter;
  let painter;
  let mockAnt;
  let dom;
  
  beforeEach(function() {
    // Setup JSDOM
    
    // Mock p5.js environment
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    window.createVector = global.createVector;
    
    // Mock ant class
    mockAnt = function(x, y, w, h, speed, dir, target, job, faction) {
      this.type = 'Ant';
      this.posX = x;
      this.posY = y;
      this.JobName = job;
      this.faction = faction;
      this._health = 100;
      this.movementSpeed = speed;
      this.getPosition = function() { return { x: this.posX, y: this.posY }; };
    };
    global.ant = mockAnt;
    window.ant = mockAnt;
    
    // Mock TILE_SIZE
    global.TILE_SIZE = 32;
    window.TILE_SIZE = 32;
    
    // Mock spatialGridManager (optional)
    global.spatialGridManager = {
      removeEntity: sinon.stub(),
      registerEntity: sinon.stub(),
      addEntity: sinon.stub()
    };
    window.spatialGridManager = global.spatialGridManager;
    
    // Load EntityPainter
    EntityPainter = require('../../../Classes/ui/painter/entity/EntityPainter.js');
    painter = new EntityPainter();
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
    delete global.createVector;
    delete window.createVector;
    delete global.ant;
    delete window.ant;
    delete global.TILE_SIZE;
    delete window.TILE_SIZE;
    delete global.spatialGridManager;
    delete window.spatialGridManager;
    delete global.window;
    delete global.document;
  });
  
  describe('Bug Reproduction - gridX/gridY format not loading', function() {
    it('should NOW WORK with gridX/gridY format (fix verified)', function() {
      // This is the format in CaveTutorial.json
      const caveTutorialFormat = {
        entities: [
          {
            id: 'entity_001',
            templateId: 'ant_worker',
            gridX: 10,
            gridY: 15,
            properties: {
              JobName: 'Worker',
              faction: 'player',
              health: 100,
              movementSpeed: 30
            }
          }
        ]
      };
      
      // After fix: importFromJSON supports both gridPosition AND gridX/gridY
      painter.importFromJSON(caveTutorialFormat);
      
      // FIX VERIFIED: Entity now loads correctly
      expect(painter.placedEntities.length).to.equal(1);
      expect(painter.placedEntities[0].JobName).to.equal('Worker');
    });
    
    it('should successfully load entities with gridPosition format (current working format)', function() {
      // This is the format EntityPainter exports
      const exportFormat = {
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            gridPosition: { x: 10, y: 15 },
            properties: {
              JobName: 'Worker',
              faction: 'player',
              health: 100,
              movementSpeed: 30
            }
          }
        ]
      };
      
      painter.importFromJSON(exportFormat);
      
      // This works correctly
      expect(painter.placedEntities.length).to.equal(1);
      expect(painter.placedEntities[0].JobName).to.equal('Worker');
    });
  });
  
  describe('After Fix - Support both formats', function() {
    it('should load entities with gridX/gridY format (CaveTutorial.json format)', function() {
      const caveTutorialFormat = {
        entities: [
          {
            id: 'entity_001',
            templateId: 'ant_worker',
            gridX: 10,
            gridY: 15,
            properties: {
              JobName: 'Worker',
              faction: 'player',
              health: 100,
              movementSpeed: 30
            }
          },
          {
            id: 'entity_002',
            templateId: 'resource_stone',
            gridX: 20,
            gridY: 25,
            properties: {
              canBePickedUp: false,
              weight: 5,
              nutritionValue: 0
            }
          }
        ]
      };
      
      painter.importFromJSON(caveTutorialFormat);
      
      // After fix: Should load both entities
      expect(painter.placedEntities.length).to.equal(2);
      
      // Verify first entity (Ant)
      const ant = painter.placedEntities[0];
      expect(ant.type).to.equal('Ant');
      expect(ant.JobName).to.equal('Worker');
      expect(ant.faction).to.equal('player');
      // Verify world coordinates: gridX=10 * 32 = 320
      expect(ant.posX).to.equal(320);
      expect(ant.posY).to.equal(480); // gridY=15 * 32
      
      // Verify second entity (Resource)
      const resource = painter.placedEntities[1];
      expect(resource.type).to.equal('Resource');
      expect(resource.canBePickedUp).to.equal(false);
      expect(resource.weight).to.equal(5);
    });
    
    it('should still load entities with gridPosition format (backward compatibility)', function() {
      const exportFormat = {
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            gridPosition: { x: 10, y: 15 },
            properties: {
              JobName: 'Worker',
              faction: 'player',
              health: 100,
              movementSpeed: 30
            }
          }
        ]
      };
      
      painter.importFromJSON(exportFormat);
      
      // Should still work (backward compatibility)
      expect(painter.placedEntities.length).to.equal(1);
      expect(painter.placedEntities[0].JobName).to.equal('Worker');
    });
    
    it('should handle mixed format (gridX/gridY and gridPosition in same file)', function() {
      const mixedFormat = {
        entities: [
          {
            id: 'entity_001',
            templateId: 'ant_worker',
            gridX: 10,
            gridY: 15,
            properties: {
              JobName: 'Worker',
              faction: 'player'
            }
          },
          {
            id: 'entity_002',
            type: 'Ant',
            gridPosition: { x: 20, y: 25 },
            properties: {
              JobName: 'Scout',
              faction: 'player'
            }
          }
        ]
      };
      
      painter.importFromJSON(mixedFormat);
      
      // Should load both formats
      expect(painter.placedEntities.length).to.equal(2);
      expect(painter.placedEntities[0].JobName).to.equal('Worker');
      expect(painter.placedEntities[1].JobName).to.equal('Scout');
    });
  });
  
  describe('Format Detection Logic', function() {
    it('should prefer gridPosition over gridX/gridY if both exist', function() {
      const ambiguousFormat = {
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            gridX: 10,
            gridY: 15,
            gridPosition: { x: 99, y: 99 }, // Should use this
            properties: {
              JobName: 'Worker',
              faction: 'player'
            }
          }
        ]
      };
      
      painter.importFromJSON(ambiguousFormat);
      
      expect(painter.placedEntities.length).to.equal(1);
      // Should use gridPosition values (99, 99) not gridX/gridY (10, 15)
      expect(painter.placedEntities[0].posX).to.equal(99 * 32);
      expect(painter.placedEntities[0].posY).to.equal(99 * 32);
    });
    
    it('should skip entities with no coordinate data', function() {
      const invalidFormat = {
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            properties: { JobName: 'Worker' }
            // No gridPosition, gridX, or gridY
          },
          {
            id: 'entity_002',
            type: 'Ant',
            gridX: 10,
            gridY: 15,
            properties: { JobName: 'Scout' }
          }
        ]
      };
      
      painter.importFromJSON(invalidFormat);
      
      // Should load only valid entity
      expect(painter.placedEntities.length).to.equal(1);
      expect(painter.placedEntities[0].JobName).to.equal('Scout');
    });
  });
  
  describe('Type Detection from templateId', function() {
    it('should detect Ant type from templateId prefix', function() {
      const data = {
        entities: [
          {
            id: 'entity_001',
            templateId: 'ant_worker',
            gridX: 10,
            gridY: 15,
            properties: { JobName: 'Worker', faction: 'player' }
          }
        ]
      };
      
      painter.importFromJSON(data);
      
      expect(painter.placedEntities.length).to.equal(1);
      expect(painter.placedEntities[0].type).to.equal('Ant');
    });
    
    it('should detect Building type from templateId prefix', function() {
      const data = {
        entities: [
          {
            id: 'entity_001',
            templateId: 'building_hive',
            gridX: 10,
            gridY: 15,
            properties: { buildingType: 'hive', size: 64 }
          }
        ]
      };
      
      painter.importFromJSON(data);
      
      expect(painter.placedEntities.length).to.equal(1);
      expect(painter.placedEntities[0].type).to.equal('Building');
    });
    
    it('should detect Resource type from templateId prefix', function() {
      const data = {
        entities: [
          {
            id: 'entity_001',
            templateId: 'resource_stone',
            gridX: 10,
            gridY: 15,
            properties: { canBePickedUp: false, weight: 5 }
          }
        ]
      };
      
      painter.importFromJSON(data);
      
      expect(painter.placedEntities.length).to.equal(1);
      expect(painter.placedEntities[0].type).to.equal('Resource');
    });
    
    it('should fallback to explicit type property if templateId missing', function() {
      const data = {
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            gridX: 10,
            gridY: 15,
            properties: { JobName: 'Worker', faction: 'player' }
          }
        ]
      };
      
      painter.importFromJSON(data);
      
      expect(painter.placedEntities.length).to.equal(1);
      expect(painter.placedEntities[0].type).to.equal('Ant');
    });
  });
  
  describe('Real CaveTutorial.json data', function() {
    it('should load entities from actual CaveTutorial.json format', function() {
      // Sample from actual file
      const caveTutorialSample = {
        entities: [
          {
            id: "entity_1762102857619_v5vc39u9",
            templateId: "ant_queen",
            gridX: 50,
            gridY: 50,
            properties: {
              JobName: "Queen",
              faction: "player",
              health: 100,
              movementSpeed: 20
            }
          },
          {
            id: "entity_1762102885968_6eqs3e2g",
            templateId: "ant_worker",
            gridX: 45,
            gridY: 50,
            properties: {
              JobName: "Worker",
              faction: "player",
              health: 100,
              movementSpeed: 30
            }
          },
          {
            id: "entity_1762102917951_ceg5cbfnr",
            templateId: "resource_mushroom",
            gridX: 85,
            gridY: 18,
            properties: {
              canBePickedUp: true,
              weight: 2,
              nutritionValue: 20
            }
          }
        ]
      };
      
      painter.importFromJSON(caveTutorialSample);
      
      // Should load all 3 entities
      expect(painter.placedEntities.length).to.equal(3);
      
      // Verify queen
      const queen = painter.placedEntities[0];
      expect(queen.type).to.equal('Ant');
      expect(queen.JobName).to.equal('Queen');
      expect(queen.posX).to.equal(50 * 32);
      expect(queen.posY).to.equal(50 * 32);
      
      // Verify worker
      const worker = painter.placedEntities[1];
      expect(worker.JobName).to.equal('Worker');
      expect(worker.posX).to.equal(45 * 32);
      
      // Verify mushroom
      const mushroom = painter.placedEntities[2];
      expect(mushroom.type).to.equal('Resource');
      expect(mushroom.canBePickedUp).to.equal(true);
      expect(mushroom.weight).to.equal(2);
    });
  });
});
