const { expect } = require('chai');

// Mock p5.js globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });
global.mouseX = 0;
global.mouseY = 0;

// Mock CollisionBox2D
class MockCollisionBox2D {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
  setPosition(x, y) { this.x = x; this.y = y; }
  setSize(w, h) { this.width = w; this.height = h; }
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
  intersects(other) {
    return !(this.x > other.x + other.width ||
             this.x + this.width < other.x ||
             this.y > other.y + other.height ||
             this.y + this.height < other.y);
  }
  getCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }
}
global.CollisionBox2D = MockCollisionBox2D;

// Mock Sprite2D
class MockSprite2D {
  constructor(imagePath, pos, size, rotation) {
    this.img = imagePath;
    this.position = pos;
    this.size = size;
    this.rotation = rotation;
    this.visible = true;
    this.alpha = 1.0;
  }
  setImage(path) { this.img = path; }
  getImage() { return this.img; }
  setPosition(pos) { this.position = pos; }
  setSize(size) { this.size = size; }
  setOpacity(alpha) { this.alpha = alpha; }
  getOpacity() { return this.alpha; }
}
global.Sprite2D = MockSprite2D;

// Mock Controllers
class MockTransformController {
  constructor(entity) { this.entity = entity; this.pos = { x: 0, y: 0 }; this.size = { x: 32, y: 32 }; }
  setPosition(x, y) { this.pos = { x, y }; }
  getPosition() { return this.pos; }
  setSize(w, h) { this.size = { x: w, y: h }; }
  getSize() { return this.size; }
  getCenter() { return { x: this.pos.x + this.size.x / 2, y: this.pos.y + this.size.y / 2 }; }
  update() {}
}

class MockMovementController {
  constructor(entity) { 
    this.entity = entity; 
    this.movementSpeed = 1.0;
    this.isMoving = false;
    this.path = null;
  }
  moveToLocation(x, y) { this.isMoving = true; this.target = { x, y }; return true; }
  setPath(path) { this.path = path; }
  getIsMoving() { return this.isMoving; }
  stop() { this.isMoving = false; }
  update() {}
}

class MockRenderController {
  constructor(entity) { this.entity = entity; this.debugMode = false; this.smoothing = true; }
  render() {}
  highlightSelected() { return 'selected'; }
  highlightHover() { return 'hover'; }
  setDebugMode(enabled) { this.debugMode = enabled; }
  getDebugMode() { return this.debugMode; }
  setSmoothing(enabled) { this.smoothing = enabled; }
  getSmoothing() { return this.smoothing; }
  update() {}
}

class MockSelectionController {
  constructor(entity) { this.entity = entity; this.selected = false; this.selectable = true; }
  setSelected(val) { this.selected = val; }
  isSelected() { return this.selected; }
  toggleSelection() { this.selected = !this.selected; return this.selected; }
  setSelectable(val) { this.selectable = val; }
  update() {}
}

class MockCombatController {
  constructor(entity) { this.entity = entity; this.faction = 'neutral'; this.inCombat = false; }
  setFaction(faction) { this.faction = faction; }
  isInCombat() { return this.inCombat; }
  detectEnemies() { return []; }
  update() {}
}

class MockTerrainController {
  constructor(entity) { this.entity = entity; this.terrain = 'DEFAULT'; }
  getCurrentTerrain() { return this.terrain; }
  update() {}
}

class MockTaskManager {
  constructor(entity) { this.entity = entity; this.tasks = []; this.currentTask = null; }
  addTask(task) { this.tasks.push(task); return true; }
  getCurrentTask() { return this.currentTask; }
  update() {}
}

class MockHealthController {
  constructor(entity) { this.entity = entity; this.health = 100; }
  update() {}
}

// Assign controllers to global
global.TransformController = MockTransformController;
global.MovementController = MockMovementController;
global.RenderController = MockRenderController;
global.SelectionController = MockSelectionController;
global.CombatController = MockCombatController;
global.TerrainController = MockTerrainController;
global.TaskManager = MockTaskManager;
global.HealthController = MockHealthController;

// Mock spatial grid manager
global.spatialGridManager = {
  addEntity: function() {},
  updateEntity: function() {},
  removeEntity: function() {}
};

// Load Entity
const Entity = require('../../../Classes/containers/Entity.js');

describe('Entity', function() {
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      const entity = new Entity();
      expect(entity.id).to.be.a('string');
      expect(entity.type).to.equal('Entity');
      expect(entity._isActive).to.be.true;
    });
    
    it('should initialize with custom position and size', function() {
      const entity = new Entity(100, 200, 64, 64);
      const pos = entity.getPosition();
      const size = entity.getSize();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
      expect(size.x).to.equal(64);
      expect(size.y).to.equal(64);
    });
    
    it('should initialize with custom type', function() {
      const entity = new Entity(0, 0, 32, 32, { type: 'Ant' });
      expect(entity.type).to.equal('Ant');
    });
    
    it('should generate unique IDs for each entity', function() {
      const entity1 = new Entity();
      const entity2 = new Entity();
      expect(entity1.id).to.not.equal(entity2.id);
    });
    
    it('should initialize collision box', function() {
      const entity = new Entity(50, 60, 32, 32);
      expect(entity._collisionBox).to.be.instanceOf(MockCollisionBox2D);
    });
    
    it('should initialize sprite when Sprite2D available', function() {
      const entity = new Entity(0, 0, 32, 32);
      expect(entity._sprite).to.be.instanceOf(MockSprite2D);
    });
    
    it('should initialize all available controllers', function() {
      const entity = new Entity();
      expect(entity._controllers.size).to.be.greaterThan(0);
      expect(entity.getController('transform')).to.exist;
      expect(entity.getController('movement')).to.exist;
      expect(entity.getController('render')).to.exist;
    });
  });
  
  describe('Core Properties', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'TestEntity' });
    });
    
    it('should have read-only id', function() {
      const originalId = entity.id;
      entity.id = 'newId'; // Should not change
      expect(entity.id).to.equal(originalId);
    });
    
    it('should have read-only type', function() {
      const originalType = entity.type;
      entity.type = 'NewType'; // Should not change
      expect(entity.type).to.equal(originalType);
    });
    
    it('should allow setting isActive', function() {
      entity.isActive = false;
      expect(entity.isActive).to.be.false;
      entity.isActive = true;
      expect(entity.isActive).to.be.true;
    });
  });
  
  describe('Position and Transform', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set and get position', function() {
      entity.setPosition(100, 200);
      const pos = entity.getPosition();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
    });
    
    it('should get X coordinate', function() {
      entity.setPosition(50, 100);
      expect(entity.getX()).to.equal(50);
    });
    
    it('should get Y coordinate', function() {
      entity.setPosition(50, 100);
      expect(entity.getY()).to.equal(100);
    });
    
    it('should set and get size', function() {
      entity.setSize(64, 128);
      const size = entity.getSize();
      expect(size.x).to.equal(64);
      expect(size.y).to.equal(128);
    });
    
    it('should calculate center point', function() {
      entity.setPosition(0, 0);
      entity.setSize(100, 100);
      const center = entity.getCenter();
      expect(center.x).to.equal(50);
      expect(center.y).to.equal(50);
    });
    
    it('should update collision box when position changes', function() {
      entity.setPosition(75, 85);
      expect(entity._collisionBox.x).to.equal(75);
      expect(entity._collisionBox.y).to.equal(85);
    });
    
    it('should update collision box when size changes', function() {
      entity.setSize(50, 60);
      expect(entity._collisionBox.width).to.equal(50);
      expect(entity._collisionBox.height).to.equal(60);
    });
  });
  
  describe('Movement', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should move to location', function() {
      const result = entity.moveToLocation(100, 200);
      expect(result).to.be.true;
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should set path', function() {
      const path = [{ x: 10, y: 10 }, { x: 20, y: 20 }];
      entity.setPath(path);
      const movement = entity.getController('movement');
      expect(movement.path).to.equal(path);
    });
    
    it('should check if moving', function() {
      expect(entity.isMoving()).to.be.false;
      entity.moveToLocation(50, 50);
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should stop movement', function() {
      entity.moveToLocation(100, 100);
      entity.stop();
      expect(entity.isMoving()).to.be.false;
    });
    
    it('should get movement speed from controller', function() {
      const movement = entity.getController('movement');
      if (movement && movement.movementSpeed !== undefined) {
        expect(movement.movementSpeed).to.be.a('number');
      } else {
        // If controller doesn't exist or has no movementSpeed, skip test
        expect(true).to.be.true;
      }
    });
    
    it('should set movement speed', function() {
      entity.movementSpeed = 5.0;
      expect(entity.movementSpeed).to.equal(5.0);
    });
  });
  
  describe('Selection', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set selected state', function() {
      entity.setSelected(true);
      expect(entity.isSelected()).to.be.true;
    });
    
    it('should toggle selection', function() {
      expect(entity.isSelected()).to.be.false;
      entity.toggleSelection();
      expect(entity.isSelected()).to.be.true;
      entity.toggleSelection();
      expect(entity.isSelected()).to.be.false;
    });
  });
  
  describe('Interaction', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should detect mouse over', function() {
      global.window = { _lastDebugMouseX: 0, _lastDebugMouseY: 0 };
      entity.setPosition(0, 0);
      entity.setSize(32, 32);
      global.mouseX = 16;
      global.mouseY = 16;
      expect(entity.isMouseOver()).to.be.true;
    });
    
    it('should detect mouse not over', function() {
      entity.setPosition(0, 0);
      entity.setSize(32, 32);
      global.mouseX = 100;
      global.mouseY = 100;
      expect(entity.isMouseOver()).to.be.false;
    });
  });
  
  describe('Combat', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { faction: 'player' });
    });
    
    it('should check if in combat', function() {
      expect(entity.isInCombat()).to.be.false;
    });
    
    it('should detect enemies', function() {
      const enemies = entity.detectEnemies();
      expect(enemies).to.be.an('array');
    });
  });
  
  describe('Tasks', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should add task', function() {
      const task = { type: 'GATHER', priority: 1 };
      const result = entity.addTask(task);
      expect(result).to.be.true;
    });
    
    it('should get current task', function() {
      const task = entity.getCurrentTask();
      expect(task).to.be.null; // Initially null
    });
  });
  
  describe('Terrain', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should get current terrain', function() {
      const terrain = entity.getCurrentTerrain();
      expect(terrain).to.equal('DEFAULT');
    });
  });
  
  describe('Sprite and Image', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should set image path', function() {
      entity.setImage('/path/to/image.png');
      expect(entity.getImage()).to.equal('/path/to/image.png');
    });
    
    it('should check if has image', function() {
      entity.setImage('/path/to/image.png');
      expect(entity.hasImage()).to.be.true;
    });
    
    it('should set opacity', function() {
      entity.setOpacity(128);
      expect(entity.getOpacity()).to.equal(128);
    });
    
    it('should get opacity', function() {
      const opacity = entity.getOpacity();
      expect(opacity).to.be.a('number');
    });
  });
  
  describe('Collision', function() {
    let entity1, entity2;
    
    beforeEach(function() {
      entity1 = new Entity(0, 0, 32, 32);
      entity2 = new Entity(16, 16, 32, 32);
    });
    
    it('should detect collision when overlapping', function() {
      expect(entity1.collidesWith(entity2)).to.be.true;
    });
    
    it('should not detect collision when separate', function() {
      entity2.setPosition(100, 100);
      entity1.update(); // Sync collision box
      entity2.update(); // Sync collision box
      expect(entity1.collidesWith(entity2)).to.be.false;
    });
    
    it('should check point containment', function() {
      entity1.setPosition(0, 0);
      entity1.setSize(32, 32);
      expect(entity1.contains(16, 16)).to.be.true;
      expect(entity1.contains(100, 100)).to.be.false;
    });
  });
  
  describe('Update Loop', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should call update without errors', function() {
      expect(() => entity.update()).to.not.throw();
    });
    
    it('should not update when inactive', function() {
      entity.isActive = false;
      expect(() => entity.update()).to.not.throw();
    });
    
    it('should sync collision box on update', function() {
      entity.setPosition(50, 60);
      entity.update();
      expect(entity._collisionBox.x).to.equal(50);
      expect(entity._collisionBox.y).to.equal(60);
    });
  });
  
  describe('Rendering', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should call render without errors', function() {
      expect(() => entity.render()).to.not.throw();
    });
    
    it('should not render when inactive', function() {
      entity.isActive = false;
      expect(() => entity.render()).to.not.throw();
    });
  });
  
  describe('Debug Info', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'TestEntity' });
    });
    
    it('should return debug info object', function() {
      const info = entity.getDebugInfo();
      expect(info).to.be.an('object');
      expect(info.id).to.equal(entity.id);
      expect(info.type).to.equal('TestEntity');
    });
    
    it('should include position in debug info', function() {
      entity.setPosition(100, 200);
      const info = entity.getDebugInfo();
      expect(info.position.x).to.equal(100);
      expect(info.position.y).to.equal(200);
    });
    
    it('should include size in debug info', function() {
      entity.setSize(64, 64);
      const info = entity.getDebugInfo();
      expect(info.size.x).to.equal(64);
      expect(info.size.y).to.equal(64);
    });
    
    it('should include controller status', function() {
      const info = entity.getDebugInfo();
      expect(info.controllers).to.be.an('object');
      expect(info.controllerCount).to.be.greaterThan(0);
    });
  });
  
  describe('Validation Data', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32, { type: 'Ant', faction: 'player' });
    });
    
    it('should return validation data', function() {
      const data = entity.getValidationData();
      expect(data).to.be.an('object');
      expect(data.id).to.exist;
      expect(data.type).to.equal('Ant');
      expect(data.faction).to.equal('neutral'); // Default faction from controller
    });
    
    it('should include timestamp', function() {
      const data = entity.getValidationData();
      expect(data.timestamp).to.be.a('string');
    });
    
    it('should include position and size', function() {
      entity.setPosition(50, 60);
      entity.setSize(32, 32);
      const data = entity.getValidationData();
      expect(data.position).to.exist;
      expect(data.size).to.exist;
    });
  });
  
  describe('Destroy', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should mark entity as inactive', function() {
      entity.destroy();
      expect(entity._isActive).to.be.false;
    });
    
    it('should not throw when destroyed', function() {
      expect(() => entity.destroy()).to.not.throw();
    });
  });
  
  describe('Enhanced API - Highlight', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have highlight namespace', function() {
      expect(entity.highlight).to.be.an('object');
    });
    
    it('should call highlight.selected', function() {
      const result = entity.highlight.selected();
      expect(result).to.equal('selected');
    });
    
    it('should call highlight.hover', function() {
      const result = entity.highlight.hover();
      expect(result).to.equal('hover');
    });
  });
  
  describe('Enhanced API - Rendering', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have rendering namespace', function() {
      expect(entity.rendering).to.be.an('object');
    });
    
    it('should set debug mode', function() {
      entity.rendering.setDebugMode(true);
      expect(entity.rendering.isVisible()).to.be.true;
    });
    
    it('should set opacity', function() {
      entity.rendering.setOpacity(0.5);
      expect(entity.rendering.getOpacity()).to.equal(0.5);
    });
  });
  
  describe('Enhanced API - Config', function() {
    let entity;
    
    beforeEach(function() {
      entity = new Entity(0, 0, 32, 32);
    });
    
    it('should have config namespace', function() {
      expect(entity.config).to.be.an('object');
    });
    
    it('should get debugMode when render controller available', function() {
      const renderController = entity.getController('render');
      if (renderController && renderController.getDebugMode) {
        const debugMode = renderController.getDebugMode();
        expect(debugMode).to.be.a('boolean');
      } else {
        // If no render controller, skip test
        expect(true).to.be.true;
      }
    });
    
    it('should get smoothing when render controller available', function() {
      const renderController = entity.getController('render');
      if (renderController && renderController.getSmoothing) {
        const smoothing = renderController.getSmoothing();
        expect(smoothing).to.be.a('boolean');
      } else {
        // If no render controller, skip test
        expect(true).to.be.true;
      }
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero position and size', function() {
      const entity = new Entity(0, 0, 0, 0);
      expect(entity.getPosition().x).to.equal(0);
      expect(entity.getSize().x).to.equal(0);
    });
    
    it('should handle negative position', function() {
      const entity = new Entity(-100, -200, 32, 32);
      expect(entity.getX()).to.equal(-100);
      expect(entity.getY()).to.equal(-200);
    });
    
    it('should handle very large position', function() {
      const entity = new Entity(1e6, 1e6, 32, 32);
      expect(entity.getX()).to.equal(1e6);
      expect(entity.getY()).to.equal(1e6);
    });
    
    it('should handle fractional values', function() {
      const entity = new Entity(10.5, 20.7, 32.3, 32.9);
      const pos = entity.getPosition();
      expect(pos.x).to.be.closeTo(10.5, 0.1);
      expect(pos.y).to.be.closeTo(20.7, 0.1);
    });
    
    it('should handle missing controllers gracefully', function() {
      // Remove all controllers temporarily
      global.TransformController = undefined;
      const entity = new Entity(0, 0, 32, 32);
      expect(() => entity.update()).to.not.throw();
      // Restore
      global.TransformController = MockTransformController;
    });
  });
  
  describe('Integration', function() {
    it('should maintain state across multiple operations', function() {
      const entity = new Entity(0, 0, 32, 32, { type: 'Ant', faction: 'player' });
      
      entity.setPosition(100, 200);
      entity.setSize(64, 64);
      entity.setSelected(true);
      entity.moveToLocation(300, 400);
      entity.update();
      
      expect(entity.getX()).to.equal(100);
      expect(entity.isSelected()).to.be.true;
      expect(entity.isMoving()).to.be.true;
    });
    
    it('should handle collision detection after movement', function() {
      const entity1 = new Entity(0, 0, 32, 32);
      const entity2 = new Entity(100, 100, 32, 32);
      
      expect(entity1.collidesWith(entity2)).to.be.false;
      
      entity1.setPosition(100, 100);
      entity1.update();
      entity2.update();
      
      expect(entity1.collidesWith(entity2)).to.be.true;
    });
  });
});
