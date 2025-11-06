const { expect } = require('chai');

// Import the BuildingModel class
const BuildingModel = require('../../../../Classes/mvc/models/BuildingModel');

describe('BuildingModel', function() {
  
  describe('Constructor', function() {
    it('should create a BuildingModel with default properties', function() {
      const building = new BuildingModel({ x: 100, y: 200 });
      
      expect(building.getPosition()).to.deep.equal({ x: 100, y: 200 });
      expect(building.getSize()).to.deep.equal({ width: 64, height: 64 }); // Buildings are larger
      expect(building.buildingType).to.equal('AntHill');
      expect(building.faction).to.equal('player');
      expect(building.level).to.equal(1);
      expect(building.canUpgrade).to.be.true;
      expect(building.upgradeCost).to.deep.equal({ greenLeaf: 50, stick: 25 });
    });
    
    it('should create a BuildingModel with custom properties', function() {
      const building = new BuildingModel({
        x: 150,
        y: 250,
        width: 96,
        height: 96,
        buildingType: 'Hive',
        faction: 'enemy',
        level: 3,
        canUpgrade: false,
        upgradeCost: { stone: 100 }
      });
      
      expect(building.buildingType).to.equal('Hive');
      expect(building.faction).to.equal('enemy');
      expect(building.level).to.equal(3);
      expect(building.canUpgrade).to.be.false;
      expect(building.upgradeCost).to.deep.equal({ stone: 100 });
    });
    
    it('should extend EntityModel correctly', function() {
      const building = new BuildingModel({ x: 100, y: 200 });
      
      expect(building.getPosition).to.be.a('function');
      expect(building.setPosition).to.be.a('function');
      expect(building.toJSON).to.be.a('function');
    });
  });
  
  describe('Building Types', function() {
    it('should support AntHill building type', function() {
      const building = new BuildingModel({ x: 100, y: 200, buildingType: 'AntHill' });
      expect(building.buildingType).to.equal('AntHill');
    });
    
    it('should support Cone building type', function() {
      const building = new BuildingModel({ x: 100, y: 200, buildingType: 'Cone' });
      expect(building.buildingType).to.equal('Cone');
    });
    
    it('should support Hive building type', function() {
      const building = new BuildingModel({ x: 100, y: 200, buildingType: 'Hive' });
      expect(building.buildingType).to.equal('Hive');
    });
    
    it('should support Tower building type', function() {
      const building = new BuildingModel({ x: 100, y: 200, buildingType: 'Tower' });
      expect(building.buildingType).to.equal('Tower');
    });
  });
  
  describe('Faction System', function() {
    it('should support player faction', function() {
      const building = new BuildingModel({ x: 100, y: 200, faction: 'player' });
      expect(building.faction).to.equal('player');
    });
    
    it('should support enemy faction', function() {
      const building = new BuildingModel({ x: 100, y: 200, faction: 'enemy' });
      expect(building.faction).to.equal('enemy');
    });
    
    it('should support neutral faction', function() {
      const building = new BuildingModel({ x: 100, y: 200, faction: 'neutral' });
      expect(building.faction).to.equal('neutral');
    });
  });
  
  describe('Level System', function() {
    it('should initialize with level 1 by default', function() {
      const building = new BuildingModel({ x: 100, y: 200 });
      expect(building.level).to.equal(1);
    });
    
    it('should allow custom level', function() {
      const building = new BuildingModel({ x: 100, y: 200, level: 5 });
      expect(building.level).to.equal(5);
    });
    
    it('should update level when upgraded', function() {
      const building = new BuildingModel({ x: 100, y: 200, level: 1 });
      building.level = 2;
      expect(building.level).to.equal(2);
    });
    
    it('should handle max level', function() {
      const building = new BuildingModel({ x: 100, y: 200, level: 10 });
      expect(building.level).to.equal(10);
    });
  });
  
  describe('Upgrade System', function() {
    it('should be upgradeable by default', function() {
      const building = new BuildingModel({ x: 100, y: 200 });
      expect(building.canUpgrade).to.be.true;
    });
    
    it('should allow buildings to be non-upgradeable', function() {
      const building = new BuildingModel({ x: 100, y: 200, canUpgrade: false });
      expect(building.canUpgrade).to.be.false;
    });
    
    it('should track upgrade cost with multiple resources', function() {
      const building = new BuildingModel({
        x: 100,
        y: 200,
        upgradeCost: { greenLeaf: 100, stick: 50, stone: 25 }
      });
      expect(building.upgradeCost).to.deep.equal({ greenLeaf: 100, stick: 50, stone: 25 });
    });
    
    it('should update upgrade cost after leveling up', function() {
      const building = new BuildingModel({ x: 100, y: 200, upgradeCost: { greenLeaf: 50 } });
      building.upgradeCost = { greenLeaf: 100, stone: 50 };
      expect(building.upgradeCost).to.deep.equal({ greenLeaf: 100, stone: 50 });
    });
  });
  
  describe('Health System', function() {
    it('should initialize with health and maxHealth', function() {
      const building = new BuildingModel({
        x: 100,
        y: 200,
        health: 500,
        maxHealth: 500
      });
      expect(building.health).to.equal(500);
      expect(building.maxHealth).to.equal(500);
    });
    
    it('should track damaged buildings', function() {
      const building = new BuildingModel({
        x: 100,
        y: 200,
        health: 250,
        maxHealth: 500
      });
      expect(building.health).to.equal(250);
      expect(building.maxHealth).to.equal(500);
    });
    
    it('should handle destroyed buildings (health = 0)', function() {
      const building = new BuildingModel({
        x: 100,
        y: 200,
        health: 0,
        maxHealth: 500
      });
      expect(building.health).to.equal(0);
    });
  });
  
  describe('JSON Serialization', function() {
    it('should serialize to JSON', function() {
      const building = new BuildingModel({
        x: 100,
        y: 200,
        buildingType: 'Cone',
        faction: 'player',
        level: 3,
        canUpgrade: true,
        upgradeCost: { greenLeaf: 150 },
        health: 300,
        maxHealth: 500
      });
      
      const json = building.toJSON();
      
      expect(json.x).to.equal(100);
      expect(json.y).to.equal(200);
      expect(json.buildingType).to.equal('Cone');
      expect(json.faction).to.equal('player');
      expect(json.level).to.equal(3);
      expect(json.canUpgrade).to.be.true;
      expect(json.upgradeCost).to.deep.equal({ greenLeaf: 150 });
      expect(json.health).to.equal(300);
      expect(json.maxHealth).to.equal(500);
    });
    
    it('should deserialize from JSON', function() {
      const json = {
        x: 150,
        y: 250,
        buildingType: 'Hive',
        faction: 'enemy',
        level: 2,
        canUpgrade: false,
        upgradeCost: { stone: 200 },
        health: 400,
        maxHealth: 600
      };
      
      const building = BuildingModel.fromJSON(json);
      
      expect(building.getPosition()).to.deep.equal({ x: 150, y: 250 });
      expect(building.buildingType).to.equal('Hive');
      expect(building.faction).to.equal('enemy');
      expect(building.level).to.equal(2);
      expect(building.canUpgrade).to.be.false;
      expect(building.upgradeCost).to.deep.equal({ stone: 200 });
      expect(building.health).to.equal(400);
      expect(building.maxHealth).to.equal(600);
    });
    
    it('should handle round-trip serialization', function() {
      const original = new BuildingModel({
        x: 200,
        y: 300,
        buildingType: 'Tower',
        faction: 'neutral',
        level: 4,
        upgradeCost: { stick: 75 },
        health: 350,
        maxHealth: 400
      });
      
      const json = original.toJSON();
      const restored = BuildingModel.fromJSON(json);
      
      expect(restored.getPosition()).to.deep.equal(original.getPosition());
      expect(restored.buildingType).to.equal(original.buildingType);
      expect(restored.faction).to.equal(original.faction);
      expect(restored.level).to.equal(original.level);
      expect(restored.upgradeCost).to.deep.equal(original.upgradeCost);
      expect(restored.health).to.equal(original.health);
      expect(restored.maxHealth).to.equal(original.maxHealth);
    });
  });
  
  describe('Inheritance from EntityModel', function() {
    it('should inherit position methods from EntityModel', function() {
      const building = new BuildingModel({ x: 100, y: 200 });
      
      building.setPosition(150, 250);
      expect(building.getPosition()).to.deep.equal({ x: 150, y: 250 });
    });
    
    it('should inherit size methods from EntityModel', function() {
      const building = new BuildingModel({ x: 100, y: 200 });
      
      building.setSize(128, 128);
      expect(building.getSize()).to.deep.equal({ width: 128, height: 128 });
    });
    
    it('should inherit enabled property from EntityModel', function() {
      const building = new BuildingModel({ x: 100, y: 200, enabled: false });
      expect(building.enabled).to.be.false;
    });
  });
  
});
