/**
 * AntModel Unit Tests
 * ====================
 * TDD tests for ant-specific entity model
 * 
 * Design principles tested:
 * - AntModel extends EntityModel (inherits all base functionality)
 * - Ant-specific properties: jobName, faction, health, combat
 * - Job-specific stats (Scout vs Warrior vs Queen)
 * - Movement state (target, path)
 * - Combat state (target entity)
 */

const { expect } = require('chai');
const EntityModel = require('../../../../Classes/mvc/models/EntityModel');
const AntModel = require('../../../../Classes/mvc/models/AntModel');

describe('AntModel', function() {
  describe('Constructor', function() {
    it('should extend EntityModel', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 }
      });
      
      expect(ant).to.be.instanceOf(EntityModel);
      expect(ant).to.be.instanceOf(AntModel);
    });
    
    it('should create ant with default properties', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 }
      });
      
      expect(ant.type).to.equal('Ant');
      expect(ant.jobName).to.equal('Scout');
      expect(ant.faction).to.equal('player');
      expect(ant.health).to.equal(100);
      expect(ant.maxHealth).to.equal(100);
      expect(ant.movementSpeed).to.equal(1.0);
      expect(ant.damage).to.equal(10);
      expect(ant.isSelected).to.be.false;
    });
    
    it('should create ant with custom properties', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        jobName: 'Warrior',
        faction: 'enemy',
        health: 150,
        maxHealth: 150,
        movementSpeed: 0.8,
        damage: 25,
        isSelected: true
      });
      
      expect(ant.jobName).to.equal('Warrior');
      expect(ant.faction).to.equal('enemy');
      expect(ant.health).to.equal(150);
      expect(ant.maxHealth).to.equal(150);
      expect(ant.movementSpeed).to.equal(0.8);
      expect(ant.damage).to.equal(25);
      expect(ant.isSelected).to.be.true;
    });
    
    it('should initialize movement state as null', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 }
      });
      
      expect(ant.targetPosition).to.be.null;
      expect(ant.path).to.be.null;
    });
    
    it('should initialize combat state as null', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 }
      });
      
      expect(ant.combatTarget).to.be.null;
    });
  });
  
  describe('Job Types', function() {
    it('should create Scout ant', function() {
      const scout = new AntModel({
        position: { x: 100, y: 200 },
        jobName: 'Scout'
      });
      
      expect(scout.jobName).to.equal('Scout');
    });
    
    it('should create Warrior ant', function() {
      const warrior = new AntModel({
        position: { x: 100, y: 200 },
        jobName: 'Warrior'
      });
      
      expect(warrior.jobName).to.equal('Warrior');
    });
    
    it('should create Builder ant', function() {
      const builder = new AntModel({
        position: { x: 100, y: 200 },
        jobName: 'Builder'
      });
      
      expect(builder.jobName).to.equal('Builder');
    });
    
    it('should create Farmer ant', function() {
      const farmer = new AntModel({
        position: { x: 100, y: 200 },
        jobName: 'Farmer'
      });
      
      expect(farmer.jobName).to.equal('Farmer');
    });
    
    it('should create Spitter ant', function() {
      const spitter = new AntModel({
        position: { x: 100, y: 200 },
        jobName: 'Spitter'
      });
      
      expect(spitter.jobName).to.equal('Spitter');
    });
    
    it('should create Queen ant', function() {
      const queen = new AntModel({
        position: { x: 100, y: 200 },
        jobName: 'Queen',
        type: 'Queen' // Queens have different type
      });
      
      expect(queen.jobName).to.equal('Queen');
      expect(queen.type).to.equal('Queen');
    });
  });
  
  describe('Faction', function() {
    it('should create player faction ant', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        faction: 'player'
      });
      
      expect(ant.faction).to.equal('player');
    });
    
    it('should create enemy faction ant', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        faction: 'enemy'
      });
      
      expect(ant.faction).to.equal('enemy');
    });
    
    it('should create neutral faction ant', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        faction: 'neutral'
      });
      
      expect(ant.faction).to.equal('neutral');
    });
  });
  
  describe('Health System', function() {
    it('should track current health', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        health: 75,
        maxHealth: 100
      });
      
      expect(ant.health).to.equal(75);
      expect(ant.maxHealth).to.equal(100);
    });
    
    it('should allow health to be set to zero (dead)', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        health: 0
      });
      
      expect(ant.health).to.equal(0);
    });
    
    it('should allow health to be full', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        health: 100,
        maxHealth: 100
      });
      
      expect(ant.health).to.equal(ant.maxHealth);
    });
  });
  
  describe('Movement State', function() {
    it('should set target position', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 }
      });
      
      ant.targetPosition = { x: 300, y: 400 };
      
      expect(ant.targetPosition).to.deep.equal({ x: 300, y: 400 });
    });
    
    it('should set path (array of waypoints)', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 }
      });
      
      ant.path = [
        { x: 150, y: 200 },
        { x: 200, y: 250 },
        { x: 300, y: 400 }
      ];
      
      expect(ant.path).to.have.lengthOf(3);
      expect(ant.path[0]).to.deep.equal({ x: 150, y: 200 });
    });
    
    it('should clear movement state', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        targetPosition: { x: 300, y: 400 },
        path: [{ x: 200, y: 300 }]
      });
      
      ant.targetPosition = null;
      ant.path = null;
      
      expect(ant.targetPosition).to.be.null;
      expect(ant.path).to.be.null;
    });
  });
  
  describe('Combat State', function() {
    it('should set combat target (entity ID)', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 }
      });
      
      ant.combatTarget = 'enemy_ant_123';
      
      expect(ant.combatTarget).to.equal('enemy_ant_123');
    });
    
    it('should clear combat target', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        combatTarget: 'enemy_ant_123'
      });
      
      ant.combatTarget = null;
      
      expect(ant.combatTarget).to.be.null;
    });
  });
  
  describe('Selection State', function() {
    it('should track selection state', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        isSelected: false
      });
      
      expect(ant.isSelected).to.be.false;
      
      ant.isSelected = true;
      expect(ant.isSelected).to.be.true;
    });
  });
  
  describe('JSON Serialization', function() {
    it('should serialize ant to JSON', function() {
      const ant = new AntModel({
        id: 'ant_1',
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 },
        jobName: 'Warrior',
        faction: 'player',
        health: 150,
        maxHealth: 150,
        movementSpeed: 0.8,
        damage: 25,
        isSelected: true,
        targetPosition: { x: 300, y: 400 },
        combatTarget: 'enemy_1'
      });
      
      const json = ant.toJSON();
      
      expect(json.id).to.equal('ant_1');
      expect(json.type).to.equal('Ant');
      expect(json.position).to.deep.equal({ x: 100, y: 200 });
      expect(json.jobName).to.equal('Warrior');
      expect(json.faction).to.equal('player');
      expect(json.health).to.equal(150);
      expect(json.maxHealth).to.equal(150);
      expect(json.movementSpeed).to.equal(0.8);
      expect(json.damage).to.equal(25);
      expect(json.isSelected).to.be.true;
      expect(json.targetPosition).to.deep.equal({ x: 300, y: 400 });
      expect(json.combatTarget).to.equal('enemy_1');
    });
    
    it('should deserialize ant from JSON', function() {
      const json = {
        id: 'ant_1',
        type: 'Ant',
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 },
        jobName: 'Warrior',
        faction: 'player',
        health: 150,
        maxHealth: 150,
        movementSpeed: 0.8,
        damage: 25,
        isSelected: true,
        targetPosition: { x: 300, y: 400 },
        combatTarget: 'enemy_1'
      };
      
      const ant = AntModel.fromJSON(json);
      
      expect(ant.id).to.equal('ant_1');
      expect(ant.jobName).to.equal('Warrior');
      expect(ant.faction).to.equal('player');
      expect(ant.health).to.equal(150);
      expect(ant.targetPosition).to.deep.equal({ x: 300, y: 400 });
    });
    
    it('should round-trip through JSON', function() {
      const original = new AntModel({
        id: 'ant_1',
        position: { x: 100, y: 200 },
        jobName: 'Scout',
        faction: 'player',
        health: 75,
        maxHealth: 100,
        targetPosition: { x: 300, y: 400 },
        path: [{ x: 200, y: 300 }],
        combatTarget: 'enemy_1'
      });
      
      const jsonString = JSON.stringify(original);
      const restored = AntModel.fromJSON(JSON.parse(jsonString));
      
      expect(restored.id).to.equal(original.id);
      expect(restored.jobName).to.equal(original.jobName);
      expect(restored.faction).to.equal(original.faction);
      expect(restored.health).to.equal(original.health);
      expect(restored.targetPosition).to.deep.equal(original.targetPosition);
      expect(restored.path).to.deep.equal(original.path);
      expect(restored.combatTarget).to.equal(original.combatTarget);
    });
  });
  
  describe('Inheritance from EntityModel', function() {
    it('should inherit position methods', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 }
      });
      
      ant.setPosition(150, 250);
      
      expect(ant.position).to.deep.equal({ x: 150, y: 250 });
      expect(ant.getPosition()).to.deep.equal({ x: 150, y: 250 });
    });
    
    it('should inherit size methods', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        size: { width: 32, height: 32 }
      });
      
      ant.setSize(64, 48);
      
      expect(ant.size).to.deep.equal({ width: 64, height: 48 });
      expect(ant.getSize()).to.deep.equal({ width: 64, height: 48 });
    });
    
    it('should inherit enabled property', function() {
      const ant = new AntModel({
        position: { x: 100, y: 200 },
        enabled: false
      });
      
      expect(ant.enabled).to.be.false;
      
      ant.enabled = true;
      expect(ant.enabled).to.be.true;
    });
    
    it('should inherit validation', function() {
      expect(() => new AntModel({ position: null }))
        .to.throw('position must have numeric x and y');
      
      expect(() => new AntModel({ position: { x: 100, y: 200 }, size: { width: -10, height: 32 } }))
        .to.throw('size must be positive');
    });
  });
});
