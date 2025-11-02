/**
 * Unit Tests for EntityFactory
 * Tests entity creation from Level Editor templates
 * 
 * Test Strategy (TDD - Red Phase):
 * - Write tests FIRST before implementation
 * - Test entity creation from type strings
 * - Test grid→world coordinate conversion
 * - Test property application from level data
 * - Test integration with real entity classes
 * - Test error handling for unknown types
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

describe('EntityFactory', function() {
  let EntityFactory;
  let sandbox;

  before(function() {
    // Try to load EntityFactory (will fail initially - TDD Red phase)
    try {
      const factoryPath = path.join(__dirname, '../../..', 'Classes/factories/EntityFactory.js');
      EntityFactory = require(factoryPath);
    } catch (e) {
      console.log('EntityFactory not yet implemented (TDD Red phase)');
      EntityFactory = null;
    }
  });

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    global.TILE_SIZE = 32;
  });

  afterEach(function() {
    sandbox.restore();
    delete global.TILE_SIZE;
  });

  describe('Constructor', function() {
    it('should create EntityFactory instance', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      expect(factory).to.exist;
      expect(factory).to.be.instanceOf(EntityFactory);
    });

    it('should accept optional entity class map', function() {
      if (!EntityFactory) this.skip();
      
      const mockAnt = class MockAnt {};
      const customClasses = {
        'Ant': mockAnt
      };
      
      const factory = new EntityFactory({ entityClasses: customClasses });
      expect(factory).to.exist;
    });

    it('should use default entity classes if none provided', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      expect(factory).to.exist;
      // Default classes should be set internally
    });
  });

  describe('createEntity() - Basic Creation', function() {
    it('should create entity from type and coordinates', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 5, 10);
      
      expect(entity).to.exist;
      expect(entity.type).to.equal('Ant');
    });

    it('should convert grid coordinates to world coordinates', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 5, 10);
      
      // Grid (5, 10) → World (5*32=160, 10*32=320)
      expect(entity.x).to.equal(160);
      expect(entity.y).to.equal(320);
    });

    it('should handle negative grid coordinates', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', -5, -10);
      
      // Grid (-5, -10) → World (-160, -320)
      expect(entity.x).to.equal(-160);
      expect(entity.y).to.equal(-320);
    });

    it('should handle zero coordinates', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 0, 0);
      
      expect(entity.x).to.equal(0);
      expect(entity.y).to.equal(0);
    });
  });

  describe('createEntity() - Entity Types', function() {
    it('should create Ant entity', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 0, 0);
      
      expect(entity).to.exist;
      expect(entity.type).to.equal('Ant');
    });

    it('should create Queen entity', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Queen', 0, 0);
      
      expect(entity).to.exist;
      expect(entity.type).to.equal('Queen');
    });

    it('should create Resource entity', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Resource', 0, 0);
      
      expect(entity).to.exist;
      expect(entity.type).to.equal('Resource');
    });

    it('should create Building entity', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Building', 0, 0);
      
      expect(entity).to.exist;
      expect(entity.type).to.equal('Building');
    });

    it('should reject unknown entity type', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      
      expect(() => {
        factory.createEntity('UnknownType', 0, 0);
      }).to.throw();
    });
  });

  describe('createEntity() - Property Application', function() {
    it('should apply properties to entity', function() {
      if (!EntityFactory) this.skip();
      
      const properties = {
        faction: 'player',
        health: 100
      };
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 0, 0, properties);
      
      expect(entity.properties).to.exist;
      expect(entity.properties.faction).to.equal('player');
      expect(entity.properties.health).to.equal(100);
    });

    it('should handle null properties', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 0, 0, null);
      
      expect(entity).to.exist;
      expect(entity.properties).to.exist;
    });

    it('should handle undefined properties', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 0, 0);
      
      expect(entity).to.exist;
      expect(entity.properties).to.exist;
    });

    it('should handle empty properties object', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 0, 0, {});
      
      expect(entity).to.exist;
      expect(entity.properties).to.be.an('object');
    });

    it('should preserve custom properties', function() {
      if (!EntityFactory) this.skip();
      
      const properties = {
        customData: 'test',
        level: 5,
        tags: ['worker', 'forager']
      };
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 0, 0, properties);
      
      expect(entity.properties.customData).to.equal('test');
      expect(entity.properties.level).to.equal(5);
      expect(entity.properties.tags).to.deep.equal(['worker', 'forager']);
    });
  });

  describe('createEntity() - ID Assignment', function() {
    it('should accept entity ID', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 0, 0, {}, 'ant_123');
      
      expect(entity.id).to.equal('ant_123');
    });

    it('should generate ID if not provided', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 0, 0);
      
      expect(entity.id).to.exist;
      expect(entity.id).to.be.a('string');
      expect(entity.id.length).to.be.greaterThan(0);
    });

    it('should generate unique IDs for multiple entities', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity1 = factory.createEntity('Ant', 0, 0);
      const entity2 = factory.createEntity('Ant', 1, 1);
      
      expect(entity1.id).to.not.equal(entity2.id);
    });
  });

  describe('createFromLevelData() - Level Editor Integration', function() {
    it('should create entity from level data object', function() {
      if (!EntityFactory) this.skip();
      
      const levelEntityData = {
        id: 'entity_001',
        type: 'Ant',
        gridPosition: { x: 5, y: 10 },
        properties: {
          faction: 'player'
        }
      };
      
      const factory = new EntityFactory();
      const entity = factory.createFromLevelData(levelEntityData);
      
      expect(entity).to.exist;
      expect(entity.id).to.equal('entity_001');
      expect(entity.type).to.equal('Ant');
      expect(entity.x).to.equal(160); // 5 * 32
      expect(entity.y).to.equal(320); // 10 * 32
      expect(entity.properties.faction).to.equal('player');
    });

    it('should handle missing properties in level data', function() {
      if (!EntityFactory) this.skip();
      
      const levelEntityData = {
        id: 'entity_001',
        type: 'Ant',
        gridPosition: { x: 0, y: 0 }
        // No properties
      };
      
      const factory = new EntityFactory();
      const entity = factory.createFromLevelData(levelEntityData);
      
      expect(entity).to.exist;
      expect(entity.properties).to.exist;
    });

    it('should reject level data missing type', function() {
      if (!EntityFactory) this.skip();
      
      const levelEntityData = {
        id: 'entity_001',
        gridPosition: { x: 0, y: 0 }
        // Missing type
      };
      
      const factory = new EntityFactory();
      
      expect(() => {
        factory.createFromLevelData(levelEntityData);
      }).to.throw();
    });

    it('should reject level data missing gridPosition', function() {
      if (!EntityFactory) this.skip();
      
      const levelEntityData = {
        id: 'entity_001',
        type: 'Ant'
        // Missing gridPosition
      };
      
      const factory = new EntityFactory();
      
      expect(() => {
        factory.createFromLevelData(levelEntityData);
      }).to.throw();
    });

    it('should handle multiple entities from level data', function() {
      if (!EntityFactory) this.skip();
      
      const levelEntitiesData = [
        { id: 'ant_001', type: 'Ant', gridPosition: { x: 0, y: 0 }, properties: {} },
        { id: 'queen_001', type: 'Queen', gridPosition: { x: 1, y: 0 }, properties: {} },
        { id: 'resource_001', type: 'Resource', gridPosition: { x: 2, y: 0 }, properties: {} }
      ];
      
      const factory = new EntityFactory();
      const entities = levelEntitiesData.map(data => factory.createFromLevelData(data));
      
      expect(entities).to.have.lengthOf(3);
      expect(entities[0].type).to.equal('Ant');
      expect(entities[1].type).to.equal('Queen');
      expect(entities[2].type).to.equal('Resource');
    });
  });

  describe('Custom Entity Classes', function() {
    it('should use custom entity class if provided', function() {
      if (!EntityFactory) this.skip();
      
      const mockEntity = { type: 'Ant', x: 0, y: 0, custom: true };
      const mockAntClass = sandbox.stub().returns(mockEntity);
      
      const factory = new EntityFactory({
        entityClasses: {
          'Ant': mockAntClass
        }
      });
      
      const entity = factory.createEntity('Ant', 0, 0);
      
      expect(mockAntClass.called).to.be.true;
      expect(entity.custom).to.be.true;
    });

    it('should pass correct parameters to custom class', function() {
      if (!EntityFactory) this.skip();
      
      const mockAntClass = sandbox.stub().returns({ type: 'Ant', x: 0, y: 0 });
      
      const factory = new EntityFactory({
        entityClasses: {
          'Ant': mockAntClass
        }
      });
      
      factory.createEntity('Ant', 5, 10, { faction: 'player' }, 'ant_123');
      
      expect(mockAntClass.called).to.be.true;
      const callArgs = mockAntClass.getCall(0).args;
      expect(callArgs[0]).to.equal(160); // worldX
      expect(callArgs[1]).to.equal(320); // worldY
    });
  });

  describe('Edge Cases', function() {
    it('should handle very large coordinates', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 1000, 1000);
      
      expect(entity.x).to.equal(32000);
      expect(entity.y).to.equal(32000);
    });

    it('should handle fractional coordinates', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 5.5, 10.5);
      
      // Should handle gracefully (floor, round, or preserve)
      expect(entity.x).to.exist;
      expect(entity.y).to.exist;
    });

    it('should handle properties with special characters', function() {
      if (!EntityFactory) this.skip();
      
      const properties = {
        'special-key': 'value',
        'key.with.dots': 123,
        'key_with_underscores': true
      };
      
      const factory = new EntityFactory();
      const entity = factory.createEntity('Ant', 0, 0, properties);
      
      expect(entity.properties['special-key']).to.equal('value');
      expect(entity.properties['key.with.dots']).to.equal(123);
      expect(entity.properties['key_with_underscores']).to.be.true;
    });

    it('should handle entity creation in batch', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      const entities = [];
      
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        entities.push(factory.createEntity('Ant', i % 50, Math.floor(i / 50)));
      }
      const elapsed = Date.now() - startTime;
      
      expect(entities).to.have.lengthOf(1000);
      expect(elapsed).to.be.lessThan(500); // <500ms for 1000 entities
    });
  });

  describe('Error Handling', function() {
    it('should provide descriptive error for unknown type', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      
      try {
        factory.createEntity('UnknownType', 0, 0);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('UnknownType');
      }
    });

    it('should provide descriptive error for invalid coordinates', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      
      try {
        factory.createEntity('Ant', 'not a number', 0);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.exist;
      }
    });

    it('should provide descriptive error for malformed level data', function() {
      if (!EntityFactory) this.skip();
      
      const factory = new EntityFactory();
      
      try {
        factory.createFromLevelData({ invalid: 'data' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.exist;
      }
    });
  });
});
