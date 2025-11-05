/**
 * EntityModel Unit Tests
 * ======================
 * TDD tests for base entity model (pure data container, no behavior)
 * 
 * Design principles tested:
 * - Models are pure data containers (no rendering, no business logic)
 * - Models use primitives only (no p5.Vector, no p5.Image)
 * - Models are JSON-serializable (save/load to files)
 * - Models are framework-agnostic (work without p5.js)
 */

const { expect } = require('chai');
const EntityModel = require('../../../../Classes/mvc/models/EntityModel');

describe('EntityModel', function() {
  describe('Constructor', function() {
    it('should create model with required properties', function() {
      const model = new EntityModel({
        id: 'test_1',
        type: 'Ant',
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 }
      });
      
      expect(model.id).to.equal('test_1');
      expect(model.type).to.equal('Ant');
      expect(model.position).to.deep.equal({ x: 100, y: 200 });
      expect(model.size).to.deep.equal({ width: 32, height: 32 });
      expect(model.enabled).to.be.true;
    });
    
    it('should generate unique ID if not provided', function() {
      const model1 = new EntityModel({
        position: { x: 100, y: 200 }
      });
      const model2 = new EntityModel({
        position: { x: 150, y: 250 }
      });
      
      expect(model1.id).to.be.a('string');
      expect(model2.id).to.be.a('string');
      expect(model1.id).to.not.equal(model2.id);
    });
    
    it('should default type to "Entity"', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      expect(model.type).to.equal('Entity');
    });
    
    it('should default size to 32x32', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      expect(model.size).to.deep.equal({ width: 32, height: 32 });
    });
    
    it('should default enabled to true', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      expect(model.enabled).to.be.true;
    });
  });
  
  describe('Validation', function() {
    it('should throw if position is missing', function() {
      expect(() => new EntityModel({})).to.throw('position must have numeric x and y');
    });
    
    it('should throw if position.x is missing', function() {
      expect(() => new EntityModel({ position: { y: 200 } })).to.throw('position must have numeric x and y');
    });
    
    it('should throw if position.y is missing', function() {
      expect(() => new EntityModel({ position: { x: 100 } })).to.throw('position must have numeric x and y');
    });
    
    it('should throw if position.x is not a number', function() {
      expect(() => new EntityModel({ position: { x: '100', y: 200 } })).to.throw('position must have numeric x and y');
    });
    
    it('should throw if position.y is not a number', function() {
      expect(() => new EntityModel({ position: { x: 100, y: '200' } })).to.throw('position must have numeric x and y');
    });
    
    it('should throw if size.width is not positive', function() {
      expect(() => new EntityModel({
        position: { x: 100, y: 200 },
        size: { width: -10, height: 32 }
      })).to.throw('size must be positive');
    });
    
    it('should throw if size.height is not positive', function() {
      expect(() => new EntityModel({
        position: { x: 100, y: 200 },
        size: { width: 32, height: 0 }
      })).to.throw('size must be positive');
    });
    
    it('should accept size.width = 0.1 (small entities)', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 },
        size: { width: 0.1, height: 0.1 }
      });
      
      expect(model.size.width).to.equal(0.1);
      expect(model.size.height).to.equal(0.1);
    });
  });
  
  describe('getPosition()', function() {
    it('should return position copy (prevent external mutation)', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      const pos = model.getPosition();
      pos.x = 999; // Try to mutate
      
      expect(model.position.x).to.equal(100); // Original unchanged
    });
  });
  
  describe('setPosition()', function() {
    it('should update position', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      model.setPosition(150, 250);
      
      expect(model.position).to.deep.equal({ x: 150, y: 250 });
    });
    
    it('should throw if x is not a number', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      expect(() => model.setPosition('150', 250)).to.throw('x and y must be numbers');
    });
    
    it('should throw if y is not a number', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      expect(() => model.setPosition(150, '250')).to.throw('x and y must be numbers');
    });
    
    it('should accept negative coordinates', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      model.setPosition(-50, -100);
      
      expect(model.position).to.deep.equal({ x: -50, y: -100 });
    });
  });
  
  describe('getSize()', function() {
    it('should return size copy (prevent external mutation)', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 }
      });
      
      const size = model.getSize();
      size.width = 999; // Try to mutate
      
      expect(model.size.width).to.equal(32); // Original unchanged
    });
  });
  
  describe('setSize()', function() {
    it('should update size', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 }
      });
      
      model.setSize(64, 48);
      
      expect(model.size).to.deep.equal({ width: 64, height: 48 });
    });
    
    it('should throw if width is not positive', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      expect(() => model.setSize(-10, 32)).to.throw('width and height must be positive');
    });
    
    it('should throw if height is not positive', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      expect(() => model.setSize(32, 0)).to.throw('width and height must be positive');
    });
  });
  
  describe('JSON Serialization', function() {
    it('should serialize to JSON', function() {
      const model = new EntityModel({
        id: 'test_1',
        type: 'Ant',
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 },
        enabled: false
      });
      
      const json = model.toJSON();
      
      expect(json).to.deep.equal({
        id: 'test_1',
        type: 'Ant',
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 },
        enabled: false
      });
    });
    
    it('should be stringifiable', function() {
      const model = new EntityModel({
        id: 'test_1',
        type: 'Ant',
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 }
      });
      
      const jsonString = JSON.stringify(model);
      
      expect(jsonString).to.be.a('string');
      expect(jsonString).to.include('"id":"test_1"');
      expect(jsonString).to.include('"type":"Ant"');
    });
    
    it('should deserialize from JSON', function() {
      const json = {
        id: 'test_1',
        type: 'Ant',
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 },
        enabled: false
      };
      
      const model = EntityModel.fromJSON(json);
      
      expect(model.id).to.equal('test_1');
      expect(model.type).to.equal('Ant');
      expect(model.position).to.deep.equal({ x: 100, y: 200 });
      expect(model.size).to.deep.equal({ width: 32, height: 32 });
      expect(model.enabled).to.be.false;
    });
    
    it('should round-trip through JSON', function() {
      const original = new EntityModel({
        id: 'test_1',
        type: 'Ant',
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 },
        enabled: false
      });
      
      const jsonString = JSON.stringify(original);
      const restored = EntityModel.fromJSON(JSON.parse(jsonString));
      
      expect(restored.id).to.equal(original.id);
      expect(restored.type).to.equal(original.type);
      expect(restored.position).to.deep.equal(original.position);
      expect(restored.size).to.deep.equal(original.size);
      expect(restored.enabled).to.equal(original.enabled);
    });
  });
  
  describe('Framework Independence', function() {
    it('should work without p5.js (no global dependencies)', function() {
      // This test runs in Node.js without p5.js loaded
      // If EntityModel has any p5.js dependencies, this will fail
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      expect(model).to.exist;
      expect(model.position).to.deep.equal({ x: 100, y: 200 });
    });
    
    it('should use plain objects, not p5.Vector', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      // Verify position is plain object, not p5.Vector
      expect(model.position.constructor.name).to.equal('Object');
      expect(model.position.x).to.be.a('number');
      expect(model.position.y).to.be.a('number');
    });
  });
  
  describe('Immutability Helpers', function() {
    it('should prevent direct mutation of returned position', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 }
      });
      
      const pos1 = model.getPosition();
      const pos2 = model.getPosition();
      
      // Each call returns a new object
      expect(pos1).to.not.equal(pos2);
      expect(pos1).to.deep.equal(pos2);
    });
    
    it('should prevent direct mutation of returned size', function() {
      const model = new EntityModel({
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 }
      });
      
      const size1 = model.getSize();
      const size2 = model.getSize();
      
      // Each call returns a new object
      expect(size1).to.not.equal(size2);
      expect(size1).to.deep.equal(size2);
    });
  });
});
