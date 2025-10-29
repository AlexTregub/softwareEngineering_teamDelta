/**
 * Unit Tests for Tile Class (terrianGen.js)
 * Tests tile material management, weight system, and entity tracking
 */

const { expect } = require('chai');

// Mock p5.js global functions and constants
global.NONE = null;
global.PERLIN_SCALE = 0.08;
global.noise = (x, y) => (Math.sin(x * 0.1) + Math.sin(y * 0.1)) / 2 + 0.5; // Deterministic noise
global.random = () => Math.random();
global.randomSeed = () => {};
global.noiseSeed = () => {};
global.noSmooth = () => {};
global.smooth = () => {};
global.image = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.round = Math.round;
global.floor = Math.floor;
global.print = () => {};

// Mock terrain material globals
global.GRASS_IMAGE = { _mockImage: 'grass' };
global.DIRT_IMAGE = { _mockImage: 'dirt' };
global.STONE_IMAGE = { _mockImage: 'stone' };
global.MOSS_IMAGE = { _mockImage: 'moss' };

global.TERRAIN_MATERIALS = {
  'stone': [0.01, (x, y, squareSize) => {}],
  'dirt': [0.15, (x, y, squareSize) => {}],
  'grass': [1, (x, y, squareSize) => {}],
};

global.TERRAIN_MATERIALS_RANGED = {
  'moss_0': [[0, 0.3], (x, y, squareSize) => {}],
  'moss_1': [[0.375, 0.4], (x, y, squareSize) => {}],
  'stone': [[0, 0.4], (x, y, squareSize) => {}],
  'dirt': [[0.4, 0.525], (x, y, squareSize) => {}],
  'grass': [[0, 1], (x, y, squareSize) => {}],
};

// Load Tile class
const terrianGenCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/terrianGen.js'),
  'utf8'
);
eval(terrianGenCode);

describe('Tile Class', function() {
  
  describe('Constructor', function() {
    
    it('should create tile with specified position and size', function() {
      const tile = new Tile(10, 20, 32);
      
      expect(tile._x).to.equal(10);
      expect(tile._y).to.equal(20);
      expect(tile._squareSize).to.equal(32);
    });
    
    it('should initialize with default grass material', function() {
      const tile = new Tile(0, 0, 32);
      
      expect(tile._materialSet).to.equal('grass');
    });
    
    it('should initialize with weight of 1', function() {
      const tile = new Tile(0, 0, 32);
      
      expect(tile._weight).to.equal(1);
    });
    
    it('should initialize coordSys optimization fields', function() {
      const tile = new Tile(0, 0, 32);
      
      expect(tile._coordSysUpdateId).to.equal(-1);
      expect(tile._coordSysPos).to.equal(NONE);
    });
    
    it('should initialize entity tracking arrays', function() {
      const tile = new Tile(0, 0, 32);
      
      expect(tile.entities).to.be.an('array');
      expect(tile.entities).to.have.lengthOf(0);
    });
    
    it('should set tile position properties', function() {
      const tile = new Tile(5, 7, 32);
      
      expect(tile.tileX).to.equal(5);
      expect(tile.tileY).to.equal(7);
    });
    
    it('should calculate pixel bounds correctly', function() {
      const tile = new Tile(3, 4, 32);
      
      expect(tile.x).to.equal(96); // 3 * 32
      expect(tile.y).to.equal(128); // 4 * 32
      expect(tile.width).to.equal(32);
      expect(tile.height).to.equal(32);
    });
    
    it('should handle different tile sizes', function() {
      const tile16 = new Tile(0, 0, 16);
      const tile64 = new Tile(0, 0, 64);
      
      expect(tile16._squareSize).to.equal(16);
      expect(tile16.width).to.equal(16);
      
      expect(tile64._squareSize).to.equal(64);
      expect(tile64.width).to.equal(64);
    });
    
    it('should handle negative positions', function() {
      const tile = new Tile(-10, -20, 32);
      
      expect(tile._x).to.equal(-10);
      expect(tile._y).to.equal(-20);
      expect(tile.tileX).to.equal(-10);
      expect(tile.tileY).to.equal(-20);
    });
  });
  
  describe('Material Management', function() {
    
    describe('getMaterial()', function() {
      
      it('should return current material', function() {
        const tile = new Tile(0, 0, 32);
        
        expect(tile.getMaterial()).to.equal('grass');
      });
      
      it('should return updated material after change', function() {
        const tile = new Tile(0, 0, 32);
        tile._materialSet = 'stone';
        
        expect(tile.getMaterial()).to.equal('stone');
      });
    });
    
    describe('setMaterial()', function() {
      
      it('should set valid material and return true', function() {
        const tile = new Tile(0, 0, 32);
        
        const result = tile.setMaterial('stone');
        
        expect(result).to.be.true;
        expect(tile._materialSet).to.equal('stone');
      });
      
      it('should set dirt material', function() {
        const tile = new Tile(0, 0, 32);
        
        const result = tile.setMaterial('dirt');
        
        expect(result).to.be.true;
        expect(tile._materialSet).to.equal('dirt');
      });
      
      it('should return false for invalid material', function() {
        const tile = new Tile(0, 0, 32);
        
        const result = tile.setMaterial('invalid_material');
        
        expect(result).to.be.false;
        expect(tile._materialSet).to.equal('grass'); // Should remain unchanged
      });
      
      it('should not change material on invalid input', function() {
        const tile = new Tile(0, 0, 32);
        tile._materialSet = 'stone';
        
        tile.setMaterial('unknown');
        
        expect(tile._materialSet).to.equal('stone');
      });
    });
    
    describe('material getter/setter', function() {
      
      it('should get material via property', function() {
        const tile = new Tile(0, 0, 32);
        
        expect(tile.material).to.equal('grass');
      });
      
      it('should set material via property', function() {
        const tile = new Tile(0, 0, 32);
        
        tile.material = 'stone';
        
        expect(tile._materialSet).to.equal('stone');
        expect(tile.material).to.equal('stone');
      });
    });
  });
  
  describe('Weight Management', function() {
    
    describe('getWeight()', function() {
      
      it('should return current weight', function() {
        const tile = new Tile(0, 0, 32);
        
        expect(tile.getWeight()).to.equal(1);
      });
      
      it('should return updated weight', function() {
        const tile = new Tile(0, 0, 32);
        tile._weight = 100;
        
        expect(tile.getWeight()).to.equal(100);
      });
    });
    
    describe('assignWeight()', function() {
      
      it('should assign weight 1 for grass', function() {
        const tile = new Tile(0, 0, 32);
        tile._materialSet = 'grass';
        
        tile.assignWeight();
        
        expect(tile._weight).to.equal(1);
      });
      
      it('should assign weight 3 for dirt', function() {
        const tile = new Tile(0, 0, 32);
        tile._materialSet = 'dirt';
        
        tile.assignWeight();
        
        expect(tile._weight).to.equal(3);
      });
      
      it('should assign weight 100 for stone', function() {
        const tile = new Tile(0, 0, 32);
        tile._materialSet = 'stone';
        
        tile.assignWeight();
        
        expect(tile._weight).to.equal(100);
      });
      
      it('should not change weight for unknown materials', function() {
        const tile = new Tile(0, 0, 32);
        tile._materialSet = 'moss_0';
        tile._weight = 5;
        
        tile.assignWeight();
        
        expect(tile._weight).to.equal(5); // Should remain unchanged
      });
    });
    
    describe('weight getter/setter', function() {
      
      it('should get weight via property', function() {
        const tile = new Tile(0, 0, 32);
        
        expect(tile.weight).to.equal(1);
      });
      
      it('should set weight via property', function() {
        const tile = new Tile(0, 0, 32);
        
        tile.weight = 50;
        
        expect(tile._weight).to.equal(50);
        expect(tile.weight).to.equal(50);
      });
    });
  });
  
  describe('Randomization Methods', function() {
    
    describe('randomizeMaterial()', function() {
      
      it('should set a valid material from TERRAIN_MATERIALS', function() {
        const tile = new Tile(0, 0, 32);
        
        tile.randomizeMaterial();
        
        const validMaterials = Object.keys(TERRAIN_MATERIALS);
        expect(validMaterials).to.include(tile._materialSet);
      });
      
      it('should use perlin noise based on tile position', function() {
        const tile1 = new Tile(0, 0, 32);
        const tile2 = new Tile(100, 100, 32);
        
        tile1.randomizeMaterial();
        tile2.randomizeMaterial();
        
        // Different positions may produce different materials
        // Both should be valid
        expect(tile1._materialSet).to.be.oneOf(['grass', 'dirt', 'stone']);
        expect(tile2._materialSet).to.be.oneOf(['grass', 'dirt', 'stone']);
      });
      
      it('should assign weight after randomization', function() {
        const tile = new Tile(0, 0, 32);
        
        tile.randomizeMaterial();
        
        // Weight should be set according to material
        const validWeights = [1, 3, 100]; // grass, dirt, stone
        expect(validWeights).to.include(tile._weight);
      });
    });
    
    describe('randomizeLegacy()', function() {
      
      it('should set a valid material', function() {
        const tile = new Tile(0, 0, 32);
        
        tile.randomizeLegacy();
        
        expect(tile._materialSet).to.be.oneOf(['grass', 'dirt', 'stone']);
      });
      
      it('should use probability-based selection', function() {
        // Run multiple times to test distribution (stochastic test)
        const materials = [];
        
        for (let i = 0; i < 100; i++) {
          const tile = new Tile(0, 0, 32);
          tile.randomizeLegacy();
          materials.push(tile._materialSet);
        }
        
        // Should have at least grass (highest probability)
        expect(materials).to.include('grass');
      });
    });
    
    describe('randomizePerlin()', function() {
      
      it('should set material from TERRAIN_MATERIALS_RANGED', function() {
        const tile = new Tile(0, 0, 32);
        
        tile.randomizePerlin([0, 0]);
        
        const validMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);
        expect(validMaterials).to.include(tile._materialSet);
      });
      
      it('should use position parameter for noise', function() {
        const tile = new Tile(0, 0, 32);
        
        tile.randomizePerlin([10, 20]);
        
        expect(tile._materialSet).to.be.oneOf(['moss_0', 'moss_1', 'stone', 'dirt', 'grass']);
      });
      
      it('should scale position by PERLIN_SCALE', function() {
        const tile1 = new Tile(0, 0, 32);
        const tile2 = new Tile(0, 0, 32);
        
        // Same tile, different input positions should produce different results (usually)
        tile1.randomizePerlin([0, 0]);
        tile2.randomizePerlin([100, 100]);
        
        expect(tile1._materialSet).to.exist;
        expect(tile2._materialSet).to.exist;
      });
      
      it('should handle negative positions', function() {
        const tile = new Tile(0, 0, 32);
        
        tile.randomizePerlin([-50, -100]);
        
        expect(tile._materialSet).to.be.oneOf(['moss_0', 'moss_1', 'stone', 'dirt', 'grass']);
      });
    });
  });
  
  describe('Entity Tracking', function() {
    
    describe('addEntity()', function() {
      
      it('should add entity to tile', function() {
        const tile = new Tile(0, 0, 32);
        const mockEntity = { id: 1, type: 'Ant' };
        
        tile.addEntity(mockEntity);
        
        expect(tile.entities).to.include(mockEntity);
        expect(tile.entities).to.have.lengthOf(1);
      });
      
      it('should not add duplicate entities', function() {
        const tile = new Tile(0, 0, 32);
        const mockEntity = { id: 1, type: 'Ant' };
        
        tile.addEntity(mockEntity);
        tile.addEntity(mockEntity);
        
        expect(tile.entities).to.have.lengthOf(1);
      });
      
      it('should add multiple different entities', function() {
        const tile = new Tile(0, 0, 32);
        const entity1 = { id: 1 };
        const entity2 = { id: 2 };
        const entity3 = { id: 3 };
        
        tile.addEntity(entity1);
        tile.addEntity(entity2);
        tile.addEntity(entity3);
        
        expect(tile.entities).to.have.lengthOf(3);
        expect(tile.entities).to.include(entity1);
        expect(tile.entities).to.include(entity2);
        expect(tile.entities).to.include(entity3);
      });
    });
    
    describe('removeEntity()', function() {
      
      it('should remove entity from tile', function() {
        const tile = new Tile(0, 0, 32);
        const mockEntity = { id: 1 };
        
        tile.addEntity(mockEntity);
        tile.removeEntity(mockEntity);
        
        expect(tile.entities).to.have.lengthOf(0);
        expect(tile.entities).to.not.include(mockEntity);
      });
      
      it('should handle removing non-existent entity', function() {
        const tile = new Tile(0, 0, 32);
        const entity1 = { id: 1 };
        const entity2 = { id: 2 };
        
        tile.addEntity(entity1);
        tile.removeEntity(entity2);
        
        expect(tile.entities).to.have.lengthOf(1);
        expect(tile.entities).to.include(entity1);
      });
      
      it('should remove correct entity from multiple', function() {
        const tile = new Tile(0, 0, 32);
        const entity1 = { id: 1 };
        const entity2 = { id: 2 };
        const entity3 = { id: 3 };
        
        tile.addEntity(entity1);
        tile.addEntity(entity2);
        tile.addEntity(entity3);
        
        tile.removeEntity(entity2);
        
        expect(tile.entities).to.have.lengthOf(2);
        expect(tile.entities).to.include(entity1);
        expect(tile.entities).to.not.include(entity2);
        expect(tile.entities).to.include(entity3);
      });
    });
    
    describe('hasEntity()', function() {
      
      it('should return true for entity on tile', function() {
        const tile = new Tile(0, 0, 32);
        const mockEntity = { id: 1 };
        
        tile.addEntity(mockEntity);
        
        expect(tile.hasEntity(mockEntity)).to.be.true;
      });
      
      it('should return false for entity not on tile', function() {
        const tile = new Tile(0, 0, 32);
        const entity1 = { id: 1 };
        const entity2 = { id: 2 };
        
        tile.addEntity(entity1);
        
        expect(tile.hasEntity(entity2)).to.be.false;
      });
      
      it('should return false for empty tile', function() {
        const tile = new Tile(0, 0, 32);
        const mockEntity = { id: 1 };
        
        expect(tile.hasEntity(mockEntity)).to.be.false;
      });
    });
    
    describe('getEntities()', function() {
      
      it('should return copy of entities array', function() {
        const tile = new Tile(0, 0, 32);
        const entity1 = { id: 1 };
        const entity2 = { id: 2 };
        
        tile.addEntity(entity1);
        tile.addEntity(entity2);
        
        const entities = tile.getEntities();
        
        expect(entities).to.have.lengthOf(2);
        expect(entities).to.not.equal(tile.entities); // Different array instance
        expect(entities).to.deep.equal(tile.entities); // Same contents
      });
      
      it('should not modify original when modifying copy', function() {
        const tile = new Tile(0, 0, 32);
        const entity = { id: 1 };
        
        tile.addEntity(entity);
        
        const copy = tile.getEntities();
        copy.push({ id: 2 });
        
        expect(tile.entities).to.have.lengthOf(1);
        expect(copy).to.have.lengthOf(2);
      });
      
      it('should return empty array for tile with no entities', function() {
        const tile = new Tile(0, 0, 32);
        
        const entities = tile.getEntities();
        
        expect(entities).to.be.an('array');
        expect(entities).to.have.lengthOf(0);
      });
    });
    
    describe('getEntityCount()', function() {
      
      it('should return 0 for empty tile', function() {
        const tile = new Tile(0, 0, 32);
        
        expect(tile.getEntityCount()).to.equal(0);
      });
      
      it('should return correct count for single entity', function() {
        const tile = new Tile(0, 0, 32);
        tile.addEntity({ id: 1 });
        
        expect(tile.getEntityCount()).to.equal(1);
      });
      
      it('should return correct count for multiple entities', function() {
        const tile = new Tile(0, 0, 32);
        
        tile.addEntity({ id: 1 });
        tile.addEntity({ id: 2 });
        tile.addEntity({ id: 3 });
        
        expect(tile.getEntityCount()).to.equal(3);
      });
      
      it('should update count after removal', function() {
        const tile = new Tile(0, 0, 32);
        const entity = { id: 1 };
        
        tile.addEntity(entity);
        expect(tile.getEntityCount()).to.equal(1);
        
        tile.removeEntity(entity);
        expect(tile.getEntityCount()).to.equal(0);
      });
    });
  });
  
  describe('toString()', function() {
    
    it('should return string representation', function() {
      const tile = new Tile(10, 20, 32);
      tile._materialSet = 'stone';
      
      const str = tile.toString();
      
      expect(str).to.be.a('string');
      expect(str).to.include('stone');
      expect(str).to.include('10');
      expect(str).to.include('20');
    });
    
    it('should include material and position', function() {
      const tile = new Tile(5, 7, 32);
      
      const str = tile.toString();
      
      expect(str).to.equal('grass(5,7)');
    });
  });
  
  describe('Edge Cases', function() {
    
    it('should handle zero position and size', function() {
      const tile = new Tile(0, 0, 0);
      
      expect(tile._x).to.equal(0);
      expect(tile._y).to.equal(0);
      expect(tile._squareSize).to.equal(0);
    });
    
    it('should handle very large positions', function() {
      const tile = new Tile(10000, 20000, 32);
      
      expect(tile._x).to.equal(10000);
      expect(tile._y).to.equal(20000);
    });
    
    it('should handle fractional positions', function() {
      const tile = new Tile(10.5, 20.7, 32);
      
      expect(tile._x).to.equal(10.5);
      expect(tile._y).to.equal(20.7);
    });
    
    it('should maintain entity tracking across material changes', function() {
      const tile = new Tile(0, 0, 32);
      const entity = { id: 1 };
      
      tile.addEntity(entity);
      tile.setMaterial('stone');
      tile.assignWeight();
      
      expect(tile.entities).to.include(entity);
      expect(tile._materialSet).to.equal('stone');
    });
  });
  
  describe('Integration Tests', function() {
    
    it('should support full lifecycle: create, randomize, track entities', function() {
      const tile = new Tile(5, 10, 32);
      
      // Randomize
      tile.randomizePerlin([5, 10]);
      
      // Add entities
      tile.addEntity({ id: 1, type: 'Ant' });
      tile.addEntity({ id: 2, type: 'Resource' });
      
      // Verify state
      expect(tile._materialSet).to.exist;
      expect(tile.getEntityCount()).to.equal(2);
      expect(tile.x).to.equal(160); // 5 * 32
      expect(tile.y).to.equal(320); // 10 * 32
    });
    
    it('should maintain consistency between material and weight', function() {
      const tile = new Tile(0, 0, 32);
      
      const testCases = [
        { material: 'grass', expectedWeight: 1 },
        { material: 'dirt', expectedWeight: 3 },
        { material: 'stone', expectedWeight: 100 },
      ];
      
      testCases.forEach(({ material, expectedWeight }) => {
        tile._materialSet = material;
        tile.assignWeight();
        
        expect(tile._weight).to.equal(expectedWeight);
        expect(tile.getMaterial()).to.equal(material);
        expect(tile.getWeight()).to.equal(expectedWeight);
      });
    });
  });
});
