/**
 * Integration Tests for LevelLoader with LevelValidator
 * Tests that LevelLoader properly integrates with LevelValidator
 * 
 * Test Strategy:
 * - Verify LevelValidator is called before loading
 * - Verify validation errors are returned to caller
 * - Verify invalid levels are rejected
 * - Verify valid levels pass through validator
 * - Verify validation can be disabled
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');


setupTestEnvironment({ rendering: true });

describe('LevelLoader + LevelValidator Integration', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let LevelLoader;
  let LevelValidator;
  let sandbox;

  before(function() {
    // Setup JSDOM for browser globals
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    

    // Load classes
    const loaderPath = path.join(__dirname, '../../..', 'Classes/loaders/LevelLoader.js');
    LevelLoader = require(loaderPath);

    const validatorPath = path.join(__dirname, '../../..', 'Classes/validators/LevelValidator.js');
    LevelValidator = require(validatorPath);
  });

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js global
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    window.createVector = global.createVector;
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Validation Integration', function() {
    it('should validate level data before loading', function() {
      const validLevel = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: []
      };

      const loader = new LevelLoader();
      const result = loader.loadLevel(validLevel);

      expect(result.success).to.be.true;
      expect(result.errors).to.be.undefined;
    });

    it('should reject invalid level data', function() {
      const invalidLevel = {
        id: 'test_level'
        // Missing terrain and entities
      };

      const loader = new LevelLoader();
      const result = loader.loadLevel(invalidLevel);

      expect(result.success).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      expect(result.errors.some(e => e.includes('terrain'))).to.be.true;
      expect(result.errors.some(e => e.includes('entities'))).to.be.true;
    });

    it('should reject level with invalid entity type', function() {
      const invalidLevel = {
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

      const loader = new LevelLoader();
      const result = loader.loadLevel(invalidLevel);

      expect(result.success).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      expect(result.errors.some(e => e.includes('type'))).to.be.true;
    });

    it('should reject level with missing terrain tiles', function() {
      const invalidLevel = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32
          // Missing tiles array
        },
        entities: []
      };

      const loader = new LevelLoader();
      const result = loader.loadLevel(invalidLevel);

      expect(result.success).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      expect(result.errors.some(e => e.includes('tiles'))).to.be.true;
    });

    it('should reject level with entity missing gridPosition', function() {
      const invalidLevel = {
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
            // Missing gridPosition
          }
        ]
      };

      const loader = new LevelLoader();
      const result = loader.loadLevel(invalidLevel);

      expect(result.success).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      expect(result.errors.some(e => e.includes('gridPosition'))).to.be.true;
    });
  });

  describe('Validation Options', function() {
    it('should pass custom validator options', function() {
      const validLevel = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: []
        },
        entities: []
      };

      // Add 100 entities
      for (let i = 0; i < 100; i++) {
        validLevel.entities.push({
          id: `entity_${i}`,
          type: 'Ant',
          gridPosition: { x: 0, y: 0 },
          properties: {}
        });
      }

      // Set max entities to 50 (should fail)
      const loader = new LevelLoader({
        validatorOptions: { maxEntities: 50 }
      });
      const result = loader.loadLevel(validLevel);

      expect(result.success).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      expect(result.errors.some(e => e.includes('max'))).to.be.true;
    });

    it('should allow disabling validation', function() {
      const invalidLevel = {
        id: 'test_level'
        // Missing terrain and entities (would normally fail validation)
      };

      const loader = new LevelLoader({ validate: false });
      const result = loader.loadLevel(invalidLevel);

      // Should proceed to loading (will fail for different reason)
      expect(result.success).to.be.false;
      // But errors should be from loading, not validation
    });

    it('should use custom allowed entity types', function() {
      const levelWithBuilding = {
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
      const loader = new LevelLoader({
        validatorOptions: {
          allowedEntityTypes: ['Ant', 'Queen', 'Resource']
        }
      });
      const result = loader.loadLevel(levelWithBuilding);

      expect(result.success).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      expect(result.errors.some(e => e.includes('Building'))).to.be.true;
    });
  });

  describe('Error Propagation', function() {
    it('should return detailed validation errors', function() {
      const invalidLevel = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: 0, gridY: 0 } // Missing material
          ]
        },
        entities: [
          {
            id: 'entity_001',
            type: 'Ant'
            // Missing gridPosition
          }
        ]
      };

      const loader = new LevelLoader();
      const result = loader.loadLevel(invalidLevel);

      expect(result.success).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      expect(result.errors.length).to.be.at.least(2);
      
      // Check for specific error types
      expect(result.errors.some(e => e.includes('material'))).to.be.true;
      expect(result.errors.some(e => e.includes('gridPosition'))).to.be.true;
    });

    it('should include entity/tile indices in errors', function() {
      const invalidLevel = {
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

      const loader = new LevelLoader();
      const result = loader.loadLevel(invalidLevel);

      expect(result.success).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
      
      // Error should mention index
      expect(result.errors.some(e => e.includes('1') || e.includes('index'))).to.be.true;
    });
  });

  describe('Valid Levels Pass Through', function() {
    it('should load valid level after validation passes', function() {
      const validLevel = {
        id: 'test_level',
        terrain: {
          type: 'sparse',
          tileSize: 32,
          tiles: [
            { gridX: 0, gridY: 0, material: 'grass' }
          ]
        },
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            gridPosition: { x: 0, y: 0 },
            properties: { faction: 'player' }
          }
        ]
      };

      const loader = new LevelLoader();
      const result = loader.loadLevel(validLevel);

      expect(result.success).to.be.true;
      expect(result.terrain).to.exist;
      expect(result.entities).to.be.an('array').that.is.not.empty;
    });

    it('should validate and load all entity types', function() {
      const validLevel = {
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

      const loader = new LevelLoader();
      const result = loader.loadLevel(validLevel);

      expect(result.success).to.be.true;
      expect(result.entities).to.have.lengthOf(4);
    });

    it('should handle negative coordinates in validation', function() {
      const validLevel = {
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

      const loader = new LevelLoader();
      const result = loader.loadLevel(validLevel);

      expect(result.success).to.be.true;
      expect(result.terrain).to.exist;
      expect(result.entities).to.have.lengthOf(1);
    });
  });
});
