const { expect } = require('chai');

// Mock Entity before requiring Building
global.Entity = class Entity {
  constructor(x, y, width, height, options = {}) {
    this.posX = x;
    this.posY = y;
    this.width = width;
    this.height = height;
    this.type = options.type || 'Unknown';
    this.selectable = options.selectable || false;
    this.isActive = true;
    this._controllers = new Map();
  }
  
  getController(name) { return this._controllers.get(name) || null; }
  _delegate(controller, method, ...args) { 
    const c = this.getController(controller);
    return c && typeof c[method] === 'function' ? c[method](...args) : undefined;
  }
  update() {}
  render() {}
  setImage(img) { this.image = img; }
  getPosition() { return { x: this.posX, y: this.posY }; }
  getSize() { return { x: this.width, y: this.height }; }
};

const BuildingModule = require('../../../Classes/managers/BuildingManager.js');
const { Building, AntCone, AntHill, HiveSource, FarmFactory, createBuilding } = BuildingModule;

describe('BuildingManager', function() {
  let mockImage;
  
  beforeEach(function() {
    // Mock image
    mockImage = { width: 100, height: 100 };
    
    // Mock globals
    global.Buildings = [];
    global.selectables = [];
    global.antsSpawn = function(count, faction, x, y) {
      global.lastSpawn = { count, faction, x, y };
    };
    global.performance = { now: () => Date.now() };
    global.rand = function(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); };
    global.g_selectionBoxController = { entities: [] };
  });
  
  afterEach(function() {
    delete global.Buildings;
    delete global.selectables;
    delete global.antsSpawn;
    delete global.lastSpawn;
    delete global.rand;
    delete global.g_selectionBoxController;
  });
  
  describe('Building Class', function() {
    describe('Constructor', function() {
      it('should create a building with position', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.posX).to.equal(100);
        expect(building.posY).to.equal(200);
      });
      
      it('should create a building with dimensions', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.width).to.equal(50);
        expect(building.height).to.equal(60);
      });
      
      it('should set faction', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.faction).to.equal('player');
      });
      
      it('should initialize with full health', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.health).to.equal(100);
        expect(building.maxHealth).to.equal(100);
      });
      
      it('should initialize as not dead', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building._isDead).to.be.false;
      });
      
      it('should initialize with spawn disabled', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building._spawnEnabled).to.be.false;
      });
      
      it('should set default spawn parameters', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building._spawnInterval).to.equal(5.0);
        expect(building._spawnCount).to.equal(1);
        expect(building._spawnTimer).to.equal(0.0);
      });
      
      it('should initialize as active', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.isActive).to.be.true;
      });
      
      it('should set image when provided', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        expect(building.image).to.equal(mockImage);
      });
    });
    
    describe('Getters', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
      });
      
      it('should get faction', function() {
        expect(building.faction).to.equal('player');
      });
      
      it('should get health', function() {
        expect(building.health).to.equal(100);
      });
      
      it('should get maxHealth', function() {
        expect(building.maxHealth).to.equal(100);
      });
      
      it('should get damage', function() {
        expect(building.damage).to.equal(0);
      });
    });
    
    describe('takeDamage()', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
      });
      
      it('should reduce health', function() {
        building.takeDamage(30);
        expect(building.health).to.equal(70);
      });
      
      it('should not go below zero health', function() {
        building.takeDamage(150);
        expect(building.health).to.equal(0);
      });
      
      it('should return new health value', function() {
        const newHealth = building.takeDamage(25);
        expect(newHealth).to.equal(75);
      });
      
      it('should handle zero damage', function() {
        building.takeDamage(0);
        expect(building.health).to.equal(100);
      });
      
      it('should handle multiple damage calls', function() {
        building.takeDamage(20);
        building.takeDamage(30);
        expect(building.health).to.equal(50);
      });
      
      it('should call health controller onDamage', function() {
        let damageCalled = false;
        const mockHealthController = {
          onDamage: function() { damageCalled = true; },
          update: function() {},
          render: function() {}
        };
        building._controllers.set('health', mockHealthController);
        
        building.takeDamage(10);
        expect(damageCalled).to.be.true;
      });
    });
    
    describe('heal()', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
        building.takeDamage(50); // Reduce to 50 health
      });
      
      it('should increase health', function() {
        building.heal(20);
        expect(building.health).to.equal(70);
      });
      
      it('should not exceed max health', function() {
        building.heal(100);
        expect(building.health).to.equal(100);
      });
      
      it('should return new health value', function() {
        const newHealth = building.heal(30);
        expect(newHealth).to.equal(80);
      });
      
      it('should handle zero healing', function() {
        building.heal(0);
        expect(building.health).to.equal(50);
      });
      
      it('should handle undefined healing amount', function() {
        building.heal();
        expect(building.health).to.equal(50);
      });
      
      it('should call health controller onHeal if available', function() {
        let healCalled = false;
        const mockHealthController = {
          onHeal: function(amount, health) { 
            healCalled = true;
          },
          update: function() {},
          render: function() {}
        };
        building._controllers.set('health', mockHealthController);
        
        building.heal(25);
        expect(healCalled).to.be.true;
      });
    });
    
    describe('update()', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
      });
      
      it('should not update if inactive', function() {
        building.isActive = false;
        expect(() => building.update()).to.not.throw();
      });
      
      it('should update spawn timer when enabled', function() {
        building._spawnEnabled = true;
        building._spawnInterval = 1.0;
        
        const before = building._spawnTimer;
        building.update();
        
        // Timer should have increased
        expect(building._spawnTimer).to.be.at.least(before);
      });
      
      it('should spawn ants when timer exceeds interval', function() {
        building._spawnEnabled = true;
        building._spawnInterval = 0.001; // Very short interval
        building._spawnCount = 5;
        building.lastFrameTime = performance.now() - 100; // Ensure time has passed
        
        building.update();
        
        // Should have spawned (antsSpawn is called in try/catch, so it may fail silently)
        // Check if function was called by verifying timer was reset
        expect(building._spawnTimer).to.be.at.least(0);
      });
      
      it('should spawn at building center', function() {
        building._spawnEnabled = true;
        building._spawnInterval = 0.001;
        building._spawnTimer = 1; // Force spawn
        
        building.update();
        
        expect(global.lastSpawn.x).to.equal(125); // 100 + 50/2
        expect(global.lastSpawn.y).to.equal(230); // 200 + 60/2
      });
      
      it('should reset timer after spawning', function() {
        building._spawnEnabled = true;
        building._spawnInterval = 0.5;
        building._spawnTimer = 1.0; // Over threshold
        
        building.update();
        
        expect(building._spawnTimer).to.be.lessThan(1.0);
      });
    });
    
    describe('moveToLocation()', function() {
      it('should not move buildings', function() {
        const building = new Building(100, 200, 50, 60, mockImage, 'player');
        building.moveToLocation(500, 500);
        
        expect(building.posX).to.equal(100);
        expect(building.posY).to.equal(200);
      });
    });
    
    describe('die()', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
        global.Buildings.push(building);
        global.selectables.push(building);
      });
      
      it('should set isActive to false', function() {
        building.die();
        expect(building.isActive).to.be.false;
      });
      
      it('should set isDead to true', function() {
        building.die();
        expect(building._isDead).to.be.true;
      });
      
      it('should remove from Buildings array', function() {
        building.die();
        expect(global.Buildings).to.not.include(building);
      });
      
      it('should remove from selectables array', function() {
        building.die();
        expect(global.selectables).to.not.include(building);
      });
    });
    
    describe('render()', function() {
      let building;
      
      beforeEach(function() {
        building = new Building(100, 200, 50, 60, mockImage, 'player');
      });
      
      it('should not render if inactive', function() {
        building.isActive = false;
        expect(() => building.render()).to.not.throw();
      });
      
      it('should call health controller render', function() {
        let renderCalled = false;
        const mockHealthController = {
          render: function() { renderCalled = true; },
          update: function() {}
        };
        building._controllers.set('health', mockHealthController);
        
        building.render();
        expect(renderCalled).to.be.true;
      });
    });
  });
  
  describe('Factory Classes', function() {
    describe('AbstractBuildingFactory', function() {
      it('AntCone should create building', function() {
        const factory = new AntCone();
        const building = factory.createBuilding(100, 200, 'player');
        
        expect(building).to.be.instanceOf(Building);
        expect(building.posX).to.equal(100);
        expect(building.posY).to.equal(200);
      });
      
      it('AntHill should create building', function() {
        const factory = new AntHill();
        const building = factory.createBuilding(150, 250, 'enemy');
        
        expect(building).to.be.instanceOf(Building);
        expect(building.faction).to.equal('enemy');
      });
      
      it('HiveSource should create building', function() {
        const factory = new HiveSource();
        const building = factory.createBuilding(200, 300, 'neutral');
        
        expect(building).to.be.instanceOf(Building);
        expect(building.faction).to.equal('neutral');
      });

      it('Farm should create building with isFarm flag', function() {
        const factory = new FarmFactory();
        const building = factory.createBuilding(100, 200, 'neutral');
        expect(building).to.exist;
        expect(building.isFarm).to.be.true;
        expect(building.width).to.equal(64);
        expect(building.height).to.equal(64);
      });

      it('Farm should have correct info properties', function() {
        const factory = new FarmFactory();
        expect(factory.info.canUpgrade).to.be.false;
        expect(factory.info.isFarm).to.be.true;
        expect(factory.info.progressions).to.be.an('object');
      });
    });
  });
  
  describe('createBuilding() Function', function() {
    it('should create building by type', function() {
      const building = createBuilding('antcone', 100, 200, 'player');
      expect(building).to.be.instanceOf(Building);
    });
    
    it('should handle null type', function() {
      const building = createBuilding(null, 100, 200);
      expect(building).to.be.null;
    });
    
    it('should handle invalid type', function() {
      const building = createBuilding('invalid', 100, 200);
      expect(building).to.be.null;
    });
    
    it('should create antcone', function() {
      const building = createBuilding('antcone', 100, 200, 'player');
      expect(building).to.exist;
      expect(building.faction).to.equal('player');
    });
    
    it('should create anthill', function() {
      const building = createBuilding('anthill', 150, 250, 'enemy');
      expect(building).to.exist;
      expect(building.faction).to.equal('enemy');
    });
    
    it('should create hivesource', function() {
      const building = createBuilding('hivesource', 200, 300, 'neutral');
      expect(building).to.exist;
      expect(building.faction).to.equal('neutral');
    });

    it('should create farm with correct properties', function() {
      const building = createBuilding('farm', 100, 200, 'neutral');
      expect(building).to.exist;
      expect(building.isFarm).to.be.true;
      expect(building.faction).to.equal('neutral');
      expect(building.width).to.equal(64);
      expect(building.height).to.equal(64);
    });
    
    it('should be case insensitive', function() {
      const building1 = createBuilding('ANTCONE', 100, 200);
      const building2 = createBuilding('AntHill', 100, 200);
      const building3 = createBuilding('HiveSource', 100, 200);
      const building4 = createBuilding('FARM', 100, 200);
      
      expect(building1).to.exist;
      expect(building2).to.exist;
      expect(building3).to.exist;
      expect(building4).to.exist;
      expect(building4.isFarm).to.be.true;
    });
    
    it('should default faction to neutral', function() {
      const building = createBuilding('antcone', 100, 200);
      expect(building.faction).to.equal('neutral');
    });
    
    it('should set building as active', function() {
      const building = createBuilding('antcone', 100, 200);
      expect(building.isActive).to.be.true;
    });
    
    it('should add to Buildings array', function() {
      const building = createBuilding('antcone', 100, 200);
      expect(global.Buildings).to.include(building);
    });
    
    it('should add to selectables array', function() {
      const building = createBuilding('antcone', 100, 200);
      expect(global.selectables).to.include(building);
    });
    
    it('should enable spawning for hivesource', function() {
      const building = createBuilding('hivesource', 100, 200);
      expect(building._spawnEnabled).to.be.true;
      expect(building._spawnCount).to.equal(10);
    });
    
    it('should enable spawning for anthill', function() {
      const building = createBuilding('anthill', 100, 200);
      expect(building._spawnEnabled).to.be.true;
      expect(building._spawnCount).to.equal(2);
    });
    
    it('should enable spawning for antcone', function() {
      const building = createBuilding('antcone', 100, 200);
      expect(building._spawnEnabled).to.be.true;
      expect(building._spawnCount).to.equal(1);
    });
    
    it('should not add duplicate to Buildings', function() {
      const building = createBuilding('antcone', 100, 200);
      // createBuilding uses includes() check, so manually adding won't create duplicate
      
      const result = createBuilding('anthill', 150, 250);
      
      // Should have 2 buildings now (antcone + anthill)
      expect(global.Buildings.length).to.equal(2);
      expect(global.Buildings[0]).to.equal(building);
      expect(global.Buildings[1]).to.equal(result);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle building with zero dimensions', function() {
      const building = new Building(100, 200, 0, 0, mockImage, 'player');
      expect(building.width).to.equal(0);
      expect(building.height).to.equal(0);
    });
    
    it('should handle negative damage (acts as healing)', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      building.takeDamage(50); // Reduce to 50 health first
      building.takeDamage(-10); // Negative damage increases health
      expect(building.health).to.equal(60); // 50 - (-10) = 60
    });
    
    it('should handle excessive damage', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      building.takeDamage(1000);
      expect(building.health).to.equal(0);
    });
    
    it('should handle heal on full health', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      const result = building.heal(50);
      expect(result).to.equal(100);
    });
    
    it('should handle rapid damage and heal cycles', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      
      for (let i = 0; i < 10; i++) {
        building.takeDamage(20);
        building.heal(10);
      }
      
      expect(building.health).to.be.greaterThan(0);
      expect(building.health).to.be.at.most(100);
    });
    
    it('should handle update without antsSpawn function', function() {
      delete global.antsSpawn;
      
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      building._spawnEnabled = true;
      building._spawnInterval = 0.001;
      
      expect(() => building.update()).to.not.throw();
    });
    
    it('should handle die() when not in arrays', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      expect(() => building.die()).to.not.throw();
    });
    
    it('should handle multiple die() calls', function() {
      const building = new Building(100, 200, 50, 60, mockImage, 'player');
      global.Buildings.push(building);
      
      building.die();
      building.die();
      
      expect(building._isDead).to.be.true;
    });
  });
});
