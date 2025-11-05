const { expect } = require('chai');

// Import the ResourceModel class
const ResourceModel = require('../../../../Classes/mvc/models/ResourceModel');

describe('ResourceModel', function() {
  
  describe('Constructor', function() {
    it('should create a ResourceModel with default properties', function() {
      const resource = new ResourceModel({ x: 100, y: 200 });
      
      expect(resource.getPosition()).to.deep.equal({ x: 100, y: 200 });
      expect(resource.getSize()).to.deep.equal({ width: 16, height: 16 }); // Resources are smaller
      expect(resource.resourceType).to.equal('greenLeaf');
      expect(resource.amount).to.equal(1);
      expect(resource.carriedBy).to.be.null;
      expect(resource.weight).to.equal(1);
    });
    
    it('should create a ResourceModel with custom properties', function() {
      const resource = new ResourceModel({
        x: 150,
        y: 250,
        width: 20,
        height: 20,
        resourceType: 'stone',
        amount: 5,
        weight: 3
      });
      
      expect(resource.resourceType).to.equal('stone');
      expect(resource.amount).to.equal(5);
      expect(resource.weight).to.equal(3);
    });
    
    it('should extend EntityModel correctly', function() {
      const resource = new ResourceModel({ x: 100, y: 200 });
      
      expect(resource.getPosition).to.be.a('function');
      expect(resource.setPosition).to.be.a('function');
      expect(resource.toJSON).to.be.a('function');
    });
  });
  
  describe('Resource Types', function() {
    it('should support greenLeaf resource type', function() {
      const resource = new ResourceModel({ x: 100, y: 200, resourceType: 'greenLeaf' });
      expect(resource.resourceType).to.equal('greenLeaf');
    });
    
    it('should support stick resource type', function() {
      const resource = new ResourceModel({ x: 100, y: 200, resourceType: 'stick' });
      expect(resource.resourceType).to.equal('stick');
    });
    
    it('should support stone resource type', function() {
      const resource = new ResourceModel({ x: 100, y: 200, resourceType: 'stone' });
      expect(resource.resourceType).to.equal('stone');
    });
    
    it('should support sand resource type', function() {
      const resource = new ResourceModel({ x: 100, y: 200, resourceType: 'sand' });
      expect(resource.resourceType).to.equal('sand');
    });
    
    it('should support dirt resource type', function() {
      const resource = new ResourceModel({ x: 100, y: 200, resourceType: 'dirt' });
      expect(resource.resourceType).to.equal('dirt');
    });
  });
  
  describe('Amount System', function() {
    it('should initialize with amount 1 by default', function() {
      const resource = new ResourceModel({ x: 100, y: 200 });
      expect(resource.amount).to.equal(1);
    });
    
    it('should allow custom amount', function() {
      const resource = new ResourceModel({ x: 100, y: 200, amount: 10 });
      expect(resource.amount).to.equal(10);
    });
    
    it('should update amount', function() {
      const resource = new ResourceModel({ x: 100, y: 200, amount: 5 });
      resource.amount = 8;
      expect(resource.amount).to.equal(8);
    });
    
    it('should handle zero amount', function() {
      const resource = new ResourceModel({ x: 100, y: 200, amount: 0 });
      expect(resource.amount).to.equal(0);
    });
  });
  
  describe('Carried By System', function() {
    it('should initialize with carriedBy as null', function() {
      const resource = new ResourceModel({ x: 100, y: 200 });
      expect(resource.carriedBy).to.be.null;
    });
    
    it('should track which entity is carrying the resource', function() {
      const resource = new ResourceModel({ x: 100, y: 200, carriedBy: 'ant-123' });
      expect(resource.carriedBy).to.equal('ant-123');
    });
    
    it('should update carriedBy when picked up', function() {
      const resource = new ResourceModel({ x: 100, y: 200 });
      resource.carriedBy = 'ant-456';
      expect(resource.carriedBy).to.equal('ant-456');
    });
    
    it('should clear carriedBy when dropped', function() {
      const resource = new ResourceModel({ x: 100, y: 200, carriedBy: 'ant-789' });
      resource.carriedBy = null;
      expect(resource.carriedBy).to.be.null;
    });
  });
  
  describe('Weight System', function() {
    it('should initialize with weight 1 by default', function() {
      const resource = new ResourceModel({ x: 100, y: 200 });
      expect(resource.weight).to.equal(1);
    });
    
    it('should allow custom weight', function() {
      const resource = new ResourceModel({ x: 100, y: 200, weight: 5 });
      expect(resource.weight).to.equal(5);
    });
    
    it('should handle different weights for different resource types', function() {
      const leaf = new ResourceModel({ x: 100, y: 200, resourceType: 'greenLeaf', weight: 1 });
      const stone = new ResourceModel({ x: 150, y: 250, resourceType: 'stone', weight: 3 });
      
      expect(leaf.weight).to.equal(1);
      expect(stone.weight).to.equal(3);
    });
  });
  
  describe('JSON Serialization', function() {
    it('should serialize to JSON', function() {
      const resource = new ResourceModel({
        x: 100,
        y: 200,
        resourceType: 'stick',
        amount: 5,
        carriedBy: 'ant-123',
        weight: 2
      });
      
      const json = resource.toJSON();
      
      expect(json.x).to.equal(100);
      expect(json.y).to.equal(200);
      expect(json.resourceType).to.equal('stick');
      expect(json.amount).to.equal(5);
      expect(json.carriedBy).to.equal('ant-123');
      expect(json.weight).to.equal(2);
    });
    
    it('should deserialize from JSON', function() {
      const json = {
        x: 150,
        y: 250,
        resourceType: 'stone',
        amount: 3,
        carriedBy: 'ant-456',
        weight: 4
      };
      
      const resource = ResourceModel.fromJSON(json);
      
      expect(resource.getPosition()).to.deep.equal({ x: 150, y: 250 });
      expect(resource.resourceType).to.equal('stone');
      expect(resource.amount).to.equal(3);
      expect(resource.carriedBy).to.equal('ant-456');
      expect(resource.weight).to.equal(4);
    });
    
    it('should handle round-trip serialization', function() {
      const original = new ResourceModel({
        x: 200,
        y: 300,
        resourceType: 'sand',
        amount: 7,
        weight: 2
      });
      
      const json = original.toJSON();
      const restored = ResourceModel.fromJSON(json);
      
      expect(restored.getPosition()).to.deep.equal(original.getPosition());
      expect(restored.resourceType).to.equal(original.resourceType);
      expect(restored.amount).to.equal(original.amount);
      expect(restored.weight).to.equal(original.weight);
    });
  });
  
  describe('Inheritance from EntityModel', function() {
    it('should inherit position methods from EntityModel', function() {
      const resource = new ResourceModel({ x: 100, y: 200 });
      
      resource.setPosition(150, 250);
      expect(resource.getPosition()).to.deep.equal({ x: 150, y: 250 });
    });
    
    it('should inherit size methods from EntityModel', function() {
      const resource = new ResourceModel({ x: 100, y: 200 });
      
      resource.setSize(24, 24);
      expect(resource.getSize()).to.deep.equal({ width: 24, height: 24 });
    });
    
    it('should inherit enabled property from EntityModel', function() {
      const resource = new ResourceModel({ x: 100, y: 200, enabled: false });
      expect(resource.enabled).to.be.false;
    });
  });
  
});
