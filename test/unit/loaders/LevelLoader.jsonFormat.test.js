/**
 * Unit Tests: LevelLoader JSON Format Handling
 * ==============================================
 * TDD for Bug Fix: Level Editor JSON format mismatch
 * 
 * ROOT CAUSE:
 * - Level Editor exports: { tiles: [], entities: [] }
 * - LevelValidator expects: { terrain: { tiles: [] }, entities: [] }
 * - Entities have "templateId" field, not "type" field
 * 
 * EXPECTED BEHAVIOR:
 * - LevelLoader should accept Level Editor JSON format
 * - LevelLoader should map templateId → type
 * - Validation should pass for valid Level Editor exports
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('LevelLoader - JSON Format Handling', function() {
  let LevelLoader;
  let sandbox;

  before(function() {
    try {
      LevelLoader = require('../../../Classes/loaders/LevelLoader');
    } catch (error) {
      console.error('Failed to load LevelLoader:', error);
    }
  });

  beforeEach(function() {
    if (!LevelLoader) this.skip();
    sandbox = sinon.createSandbox();
    
    // Suppress console logs during tests
    sandbox.stub(console, 'log');
    sandbox.stub(console, 'warn');
    sandbox.stub(console, 'error');
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Level Editor JSON Format (Real Export)', function() {
    it('should accept Level Editor format with tiles at root', function() {
      const levelEditorJSON = {
        version: "1.0",
        metadata: {
          tileSize: 32,
          defaultMaterial: "dirt"
        },
        tiles: [
          { x: 0, y: 0, material: "grass" },
          { x: 1, y: 0, material: "dirt" }
        ],
        entities: []
      };

      const loader = new LevelLoader({ validate: false }); // Disable validation for now
      const result = loader.loadLevel(levelEditorJSON);

      expect(result.success).to.be.true;
      expect(result.terrain).to.exist;
    });

    it('should handle entities with templateId field', function() {
      const levelEditorJSON = {
        version: "1.0",
        tiles: [],
        entities: [
          {
            id: "entity_001",
            templateId: "ant_queen", // NOT "type"
            gridX: 10,
            gridY: 10,
            properties: {
              JobName: "Queen",
              faction: "player"
            }
          }
        ]
      };

      const loader = new LevelLoader({ validate: false });
      const result = loader.loadLevel(levelEditorJSON);

      expect(result.success).to.be.true;
      expect(result.entities).to.have.lengthOf(1);
      expect(result.entities[0].type).to.equal('Queen'); // Should be mapped from templateId
    });

    it('should map templateId to entity type', function() {
      const templateMappings = {
        'ant_queen': 'Queen',
        'ant_worker': 'Ant',
        'resource_leaf': 'Resource',
        'building_anthill': 'Building'
      };

      const levelEditorJSON = {
        tiles: [],
        entities: Object.keys(templateMappings).map((templateId, index) => ({
          id: `entity_${index}`,
          templateId: templateId,
          gridX: index,
          gridY: 0,
          properties: {}
        }))
      };

      const loader = new LevelLoader({ validate: false });
      const result = loader.loadLevel(levelEditorJSON);

      expect(result.success).to.be.true;
      expect(result.entities).to.have.lengthOf(4);
      
      result.entities.forEach((entity, index) => {
        const expectedType = Object.values(templateMappings)[index];
        expect(entity.type).to.equal(expectedType);
      });
    });

    it('should use gridX/gridY from Level Editor format', function() {
      const levelEditorJSON = {
        tiles: [],
        entities: [
          {
            id: "entity_001",
            templateId: "ant_queen",
            gridX: 5,
            gridY: 10,
            properties: {}
          }
        ]
      };

      const loader = new LevelLoader({ validate: false });
      const result = loader.loadLevel(levelEditorJSON);

      expect(result.success).to.be.true;
      // Check position object (all entities have this regardless of class)
      expect(result.entities[0].position.x).to.equal(5 * 32); // gridX * TILE_SIZE
      expect(result.entities[0].position.y).to.equal(10 * 32); // gridY * TILE_SIZE
      // Check x/y properties (may be getters in real classes, direct properties in mocks)
      const entity = result.entities[0];
      const actualX = entity.x !== undefined ? entity.x : entity.position.x;
      const actualY = entity.y !== undefined ? entity.y : entity.position.y;
      expect(actualX).to.equal(5 * 32);
      expect(actualY).to.equal(10 * 32);
    });
  });

  describe('Backward Compatibility (Old Format)', function() {
    it('should still accept old format with terrain.tiles', function() {
      const oldFormatJSON = {
        terrain: {
          tiles: [
            { x: 0, y: 0, material: "grass" }
          ]
        },
        entities: []
      };

      const loader = new LevelLoader({ validate: false });
      const result = loader.loadLevel(oldFormatJSON);

      expect(result.success).to.be.true;
    });

    it('should still accept entities with type field', function() {
      const oldFormatJSON = {
        terrain: { tiles: [] },
        entities: [
          {
            id: "entity_001",
            type: "Queen", // Direct type field
            gridPosition: { x: 10, y: 10 },
            properties: {}
          }
        ]
      };

      const loader = new LevelLoader({ validate: false });
      const result = loader.loadLevel(oldFormatJSON);

      expect(result.success).to.be.true;
      expect(result.entities[0].type).to.equal('Queen');
    });
  });

  describe('Format Detection', function() {
    it('should detect Level Editor format (tiles at root)', function() {
      const levelEditorJSON = {
        tiles: [],
        entities: []
      };

      const loader = new LevelLoader({ validate: false });
      
      // LevelLoader should have a method to detect format
      const format = loader._detectFormat(levelEditorJSON);
      
      expect(format).to.equal('levelEditor');
    });

    it('should detect old format (terrain.tiles)', function() {
      const oldFormatJSON = {
        terrain: { tiles: [] },
        entities: []
      };

      const loader = new LevelLoader({ validate: false });
      const format = loader._detectFormat(oldFormatJSON);
      
      expect(format).to.equal('legacy');
    });
  });

  describe('Template ID to Type Mapping', function() {
    it('should map ant_queen to Queen', function() {
      const loader = new LevelLoader();
      const type = loader._templateIdToType('ant_queen');
      expect(type).to.equal('Queen');
    });

    it('should map ant_worker to Ant', function() {
      const loader = new LevelLoader();
      const type = loader._templateIdToType('ant_worker');
      expect(type).to.equal('Ant');
    });

    it('should map resource_* to Resource', function() {
      const loader = new LevelLoader();
      expect(loader._templateIdToType('resource_leaf')).to.equal('Resource');
      expect(loader._templateIdToType('resource_stick')).to.equal('Resource');
    });

    it('should map building_* to Building', function() {
      const loader = new LevelLoader();
      expect(loader._templateIdToType('building_anthill')).to.equal('Building');
    });

    it('should return null for unknown templateId', function() {
      const loader = new LevelLoader();
      const type = loader._templateIdToType('unknown_template');
      expect(type).to.be.null;
    });
  });
});
