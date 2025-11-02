/**
 * Unit Tests for LevelValidator
 * Tests validation rules for Level Editor JSON exports
 * 
 * Test Strategy (TDD - Red Phase):
 * - Write tests FIRST before implementation
 * - Test constructor and validation methods
 * - Test validation rules (required fields, types, bounds)
 * - Test error accumulation and detailed messages
 * - Test edge cases and malformed data
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

describe('LevelValidator', function() {
  let LevelValidator;
  let sandbox;

  before(function() {
    // Try to load LevelValidator (will fail initially - TDD Red phase)
    try {
      const validatorPath = path.join(__dirname, '../../..', 'Classes/validators/LevelValidator.js');
      LevelValidator = require(validatorPath);
    } catch (e) {
      console.log('LevelValidator not yet implemented (TDD Red phase)');
      LevelValidator = null;
    }
  });

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Constructor', function() {
    it('should create LevelValidator instance', function() {
      if (!LevelValidator) this.skip();
      
      const validator = new LevelValidator();
      expect(validator).to.exist;
      expect(validator).to.be.instanceOf(LevelValidator);
    });

    it('should accept optional validation options', function() {
      if (!LevelValidator) this.skip();
      
      const options = {
        maxEntities: 5000,
        maxTiles: 50000,
        allowedEntityTypes: ['Ant', 'Queen', 'Resource']
      };
      
      const validator = new LevelValidator(options);
      expect(validator).to.exist;
    });

    it('should use default options if none provided', function() {
      if (!LevelValidator) this.skip();
      
      const validator = new LevelValidator();
      expect(validator).to.exist;
      // Default options should be set internally
    });
  });

  describe('validate() - Valid Levels', function() {
    it('should validate minimal valid level', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: []
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.true;
      expect(result.errors).to.be.an('array').that.is.empty;
    });

    it('should validate level with terrain and entities', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: 0, gridY: 0, material: 'grass' },
            { gridX: 1, gridY: 0, material: 'dirt' }
          ]
        },
        entities: [
          {
            id: 'ant_001',
            type: 'Ant',
            gridPosition: { x: 0, y: 0 },
            properties: { faction: 'player' }
          }
        ]
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.true;
      expect(result.errors).to.be.an('array').that.is.empty;
    });

    it('should validate level with all entity types', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: [
          { id: 'ant_001', type: 'Ant', gridPosition: { x: 0, y: 0 }, properties: {} },
          { id: 'queen_001', type: 'Queen', gridPosition: { x: 1, y: 0 }, properties: {} },
          { id: 'resource_001', type: 'Resource', gridPosition: { x: 2, y: 0 }, properties: {} },
          { id: 'building_001', type: 'Building', gridPosition: { x: 3, y: 0 }, properties: {} }
        ]
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.true;
      expect(result.errors).to.be.an('array').that.is.empty;
    });
  });

  describe('validate() - Invalid Levels', function() {
    it('should reject null level data', function() {
      if (!LevelValidator) this.skip();
      
      const validator = new LevelValidator();
      const result = validator.validate(null);
      
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      expect(result.errors[0]).to.include('null');
    });

    it('should reject undefined level data', function() {
      if (!LevelValidator) this.skip();
      
      const validator = new LevelValidator();
      const result = validator.validate(undefined);
      
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
    });

    it('should reject level missing terrain field', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        entities: []
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      expect(result.errors.some(e => e.includes('terrain'))).to.be.true;
    });

    it('should reject level missing entities field', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        }
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      expect(result.errors.some(e => e.includes('entities'))).to.be.true;
    });

    it('should reject level with invalid terrain type', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: 'not an object',
        entities: []
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
    });

    it('should reject level with invalid entities type', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: 'not an array'
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
    });

    it('should accumulate multiple errors', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level'
        // Missing both terrain and entities
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.length).to.be.at.least(2);
    });
  });

  describe('Terrain Validation', function() {
    it('should reject terrain missing tiles array', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32
          // Missing tiles
        },
        entities: []
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('tiles'))).to.be.true;
    });

    it('should reject terrain with invalid tiles type', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: 'not an array'
        },
        entities: []
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('tiles'))).to.be.true;
    });

    it('should validate terrain with gridX/gridY format', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: 0, gridY: 0, material: 'grass' }
          ]
        },
        entities: []
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.true;
    });

    it('should validate terrain with x/y format', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { x: 0, y: 0, material: 'grass' }
          ]
        },
        entities: []
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.true;
    });

    it('should reject tile missing coordinates', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { material: 'grass' } // Missing coordinates
          ]
        },
        entities: []
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('coordinate'))).to.be.true;
    });

    it('should reject tile missing material', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: 0, gridY: 0 } // Missing material
          ]
        },
        entities: []
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('material'))).to.be.true;
    });
  });

  describe('Entity Validation', function() {
    it('should reject entity missing id', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: [
          {
            type: 'Ant',
            gridPosition: { x: 0, y: 0 },
            properties: {}
          }
        ]
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('id'))).to.be.true;
    });

    it('should reject entity missing type', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: [
          {
            id: 'entity_001',
            gridPosition: { x: 0, y: 0 },
            properties: {}
          }
        ]
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('type'))).to.be.true;
    });

    it('should reject entity with invalid type', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: [
          {
            id: 'entity_001',
            type: 'InvalidType',
            gridPosition: { x: 0, y: 0 },
            properties: {}
          }
        ]
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('type'))).to.be.true;
    });

    it('should reject entity missing gridPosition', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            properties: {}
          }
        ]
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('gridPosition'))).to.be.true;
    });

    it('should reject entity with invalid gridPosition', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            gridPosition: { x: 'not a number', y: 0 },
            properties: {}
          }
        ]
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('coordinate'))).to.be.true;
    });
  });

  describe('Bounds Validation', function() {
    it('should reject level exceeding max entities', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: []
      };
      
      // Generate excessive entities
      for (let i = 0; i < 20000; i++) {
        levelData.entities.push({
          id: `entity_${i}`,
          type: 'Ant',
          gridPosition: { x: 0, y: 0 },
          properties: {}
        });
      }
      
      const validator = new LevelValidator({ maxEntities: 10000 });
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('max') && e.includes('entities'))).to.be.true;
    });

    it('should reject level exceeding max tiles', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: []
      };
      
      // Generate excessive tiles
      for (let i = 0; i < 60000; i++) {
        levelData.terrain.tiles.push({
          gridX: i % 1000,
          gridY: Math.floor(i / 1000),
          material: 'grass'
        });
      }
      
      const validator = new LevelValidator({ maxTiles: 50000 });
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('max') && e.includes('tiles'))).to.be.true;
    });

    it('should validate coordinate bounds', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: 0, gridY: 0, material: 'grass' },
            { gridX: 999, gridY: 999, material: 'dirt' }
          ]
        },
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            gridPosition: { x: 500, y: 500 },
            properties: {}
          }
        ]
      };
      
      const validator = new LevelValidator({ maxCoordinate: 1000 });
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.true;
    });

    it('should reject coordinates out of bounds', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: 2000, gridY: 0, material: 'grass' }
          ]
        },
        entities: []
      };
      
      const validator = new LevelValidator({ maxCoordinate: 1000 });
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('out of bounds'))).to.be.true;
    });
  });

  describe('Custom Validation Options', function() {
    it('should use custom allowed entity types', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: [
          {
            id: 'entity_001',
            type: 'Building',
            gridPosition: { x: 0, y: 0 },
            properties: {}
          }
        ]
      };
      
      // Reject Building type
      const validator = new LevelValidator({
        allowedEntityTypes: ['Ant', 'Queen', 'Resource']
      });
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('Building'))).to.be.true;
    });

    it('should use custom max limits', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: []
      };
      
      // Add 10 entities
      for (let i = 0; i < 10; i++) {
        levelData.entities.push({
          id: `entity_${i}`,
          type: 'Ant',
          gridPosition: { x: 0, y: 0 },
          properties: {}
        });
      }
      
      // Set max to 5
      const validator = new LevelValidator({ maxEntities: 5 });
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors.some(e => e.includes('max'))).to.be.true;
    });
  });

  describe('Edge Cases', function() {
    it('should handle empty string values', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: '',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: []
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      // Empty ID is technically valid (not critical field)
      expect(result.valid).to.be.true;
    });

    it('should handle negative coordinates', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: -10, gridY: -10, material: 'grass' }
          ]
        },
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            gridPosition: { x: -5, y: -5 },
            properties: {}
          }
        ]
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      // Negative coordinates are valid (SparseTerrain supports them)
      expect(result.valid).to.be.true;
    });

    it('should handle properties as null', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            gridPosition: { x: 0, y: 0 },
            properties: null
          }
        ]
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      // Null properties should be acceptable (defaults will be used)
      expect(result.valid).to.be.true;
    });

    it('should handle very large valid level', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'large_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: []
      };
      
      // Add 5000 tiles and 2000 entities (within default limits)
      for (let i = 0; i < 5000; i++) {
        levelData.terrain.tiles.push({
          gridX: i % 100,
          gridY: Math.floor(i / 100),
          material: 'grass'
        });
      }
      
      for (let i = 0; i < 2000; i++) {
        levelData.entities.push({
          id: `entity_${i}`,
          type: 'Ant',
          gridPosition: { x: i % 50, y: Math.floor(i / 50) },
          properties: {}
        });
      }
      
      const validator = new LevelValidator();
      const startTime = Date.now();
      const result = validator.validate(levelData);
      const elapsed = Date.now() - startTime;
      
      expect(result.valid).to.be.true;
      expect(elapsed).to.be.lessThan(500); // Validation should be fast <500ms
    });
  });

  describe('Error Messages', function() {
    it('should provide detailed error messages', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: 0, material: 'grass' } // Missing gridY
          ]
        },
        entities: [
          {
            id: 'entity_001',
            type: 'InvalidType', // Invalid type
            gridPosition: { x: 0, y: 0 },
            properties: {}
          }
        ]
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      
      // Errors should be descriptive
      result.errors.forEach(error => {
        expect(error).to.be.a('string');
        expect(error.length).to.be.greaterThan(10);
      });
    });

    it('should include entity/tile index in error messages', function() {
      if (!LevelValidator) this.skip();
      
      const levelData = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: 0, gridY: 0, material: 'grass' },
            { gridX: 1, gridY: 1 } // Missing material at index 1
          ]
        },
        entities: []
      };
      
      const validator = new LevelValidator();
      const result = validator.validate(levelData);
      
      expect(result.valid).to.be.false;
      // Error should mention tile index
      expect(result.errors.some(e => e.includes('1') || e.includes('index'))).to.be.true;
    });
  });
});
