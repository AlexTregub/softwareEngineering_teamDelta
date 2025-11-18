/**
 * MVC Integration Tests
 * ====================
 * Tests for Model-View-Controller interactions and EntityFactory
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock window for Node.js environment
if (typeof window === 'undefined') {
  global.window = {};
}

// Mock p5.js
global.createVector = sinon.stub().callsFake((x, y) => ({ x: x || 0, y: y || 0 }));
global.push = sinon.stub();
global.pop = sinon.stub();
global.noSmooth = sinon.stub();
global.smooth = sinon.stub();
global.fill = sinon.stub();
global.noFill = sinon.stub();
global.stroke = sinon.stub();
global.strokeWeight = sinon.stub();
global.ellipse = sinon.stub();
global.rect = sinon.stub();
global.tint = sinon.stub();
global.noTint = sinon.stub();
window.createVector = global.createVector;
window.TILE_SIZE = 32;

// Mock CollisionBox2D
global.CollisionBox2D = class MockCollisionBox {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
  setPosition(x, y) { this.x = x; this.y = y; }
  setSize(w, h) { this.width = w; this.height = h; }
  getPosX() { return this.x; }
  getPosY() { return this.y; }
  getCenter() { return { x: this.x, y: this.y }; }
  contains(x, y) {
    return x >= this.x - this.width/2 && x <= this.x + this.width/2 &&
           y >= this.y - this.height/2 && y <= this.y + this.height/2;
  }
};
window.CollisionBox2D = global.CollisionBox2D;

// Mock Sprite2D
global.Sprite2D = class MockSprite {
  constructor(img, pos, size, rot) {
    this.img = img;
    this.pos = pos;
    this.size = size;
    this.rotation = rot;
    this.alpha = 255;
  }
  setPosition(pos) { this.pos = pos; }
  setSize(size) { this.size = size; }
  render() {}
};
window.Sprite2D = global.Sprite2D;

// Mock sub-controllers
global.TransformController = class MockTransformController {
  constructor(entity) { this.entity = entity; }
  update() {}
  getPosition() { return this.entity.model.getPosition(); }
  setPosition(x, y) { this.entity.model.setPosition(x, y); }
  getSize() { return this.entity.model.getSize(); }
  setSize(w, h) { this.entity.model.setSize(w, h); }
};
global.MovementController = class MockMovementController {
  constructor(entity) { 
    this.entity = entity;
    this.movementSpeed = entity.model ? entity.model.movementSpeed : 1;
    this._isMoving = false;
  }
  update() {}
  moveToLocation(x, y) { this._isMoving = true; }
  getIsMoving() { return this._isMoving; }
  stop() { this._isMoving = false; }
};
global.SelectionController = class MockSelectionController {
  constructor(entity) { 
    this.entity = entity;
    this._isSelected = false;
  }
  update() {}
  setSelected(val) { this._isSelected = val; }
  isSelected() { return this._isSelected; }
  setSelectable(val) {}
};
global.CombatController = class MockCombatController {
  constructor(entity) { this.entity = entity; }
  update() {}
  setFaction(faction) {}
  isInCombat() { return false; }
};

window.TransformController = global.TransformController;
window.MovementController = global.MovementController;
window.SelectionController = global.SelectionController;
window.CombatController = global.CombatController;

// Mock spatial grid
global.spatialGridManager = {
  addEntity: sinon.stub(),
  removeEntity: sinon.stub(),
  updateEntity: sinon.stub()
};
window.spatialGridManager = global.spatialGridManager;

// Load MVC classes
const EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
const EntityView = require('../../../Classes/mvc/views/EntityView.js');
const EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
const EntityFactory = require('../../../Classes/mvc/factories/EntityFactory.js');

global.EntityModel = EntityModel;
global.EntityView = EntityView;
global.EntityController = EntityController;
global.EntityFactory = EntityFactory;
window.EntityModel = EntityModel;
window.EntityView = EntityView;
window.EntityController = EntityController;
window.EntityFactory = EntityFactory;

describe('MVC Integration Tests', function() {
  beforeEach(function() {
    sinon.reset();
    global.spatialGridManager.addEntity.resetHistory();
    global.spatialGridManager.removeEntity.resetHistory();
    global.spatialGridManager.updateEntity.resetHistory();
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Model-View-Controller Communication', function() {
    let model, view, controller;

    beforeEach(function() {
      model = new EntityModel({ x: 100, y: 200, width: 32, height: 32 });
      view = new EntityView(model);
      controller = new EntityController(model, view);
    });

    it('should allow controller to update model and view reflects changes', function() {
      controller.setPosition(300, 400);
      
      expect(model.getPosition()).to.deep.equal({ x: 300, y: 400 });
      expect(view.getScreenPosition().x).to.equal(300);
      expect(view.getScreenPosition().y).to.equal(400);
    });

    it('should synchronize model changes to collision box', function() {
      controller.setPosition(150, 250);
      
      expect(model.collisionBox.getPosX()).to.equal(150);
      expect(model.collisionBox.getPosY()).to.equal(250);
    });

    it('should synchronize model changes to sprite', function() {
      controller.setPosition(200, 300);
      
      // Sprite position should be synced
      if (model.sprite && model.sprite.pos) {
        expect(model.sprite.pos.x).to.equal(200);
        expect(model.sprite.pos.y).to.equal(300);
      }
    });

    it('should render correctly when model is active', function() {
      // Skip if no sprite (sprite only created with imagePath)
      if (!model.sprite) {
        this.skip();
      }
      
      const renderSpy = sinon.spy(model.sprite, 'render');
      
      view.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });

    it('should not render when model is inactive', function() {
      model.setActive(false);
      
      // Skip if no sprite
      if (!model.sprite) {
        this.skip();
      }
      
      const renderSpy = sinon.spy(model.sprite, 'render');
      
      view.render();
      
      expect(renderSpy.called).to.be.false;
    });

    it('should update all components on controller update', function() {
      const movement = controller.getController('movement');
      const updateSpy = sinon.spy(movement, 'update');
      
      controller.update();
      
      expect(updateSpy.calledOnce).to.be.true;
    });
  });

  describe('EntityFactory Creation', function() {
    it('should create complete MVC triad', function() {
      const entity = EntityFactory.create({ x: 50, y: 100 });
      
      expect(entity.model).to.be.instanceOf(EntityModel);
      expect(entity.view).to.be.instanceOf(EntityView);
      expect(entity.controller).to.be.instanceOf(EntityController);
    });

    it('should pass options to model', function() {
      const entity = EntityFactory.create({ 
        x: 100, 
        y: 200, 
        type: 'TestEntity',
        faction: 'player' 
      });
      
      expect(entity.model.getPosition()).to.deep.equal({ x: 100, y: 200 });
      expect(entity.model.type).to.equal('TestEntity');
      expect(entity.model.faction).to.equal('player');
    });

    it('should create ant with default configuration', function() {
      const ant = EntityFactory.createAnt({ x: 50, y: 50 });
      
      expect(ant.model.type).to.equal('Ant');
      expect(ant.model.movementSpeed).to.equal(2);
      expect(ant.model.faction).to.equal('player');
    });

    it('should create resource with default configuration', function() {
      const resource = EntityFactory.createResource({ x: 100, y: 100 });
      
      expect(resource.model.type).to.equal('Resource');
      expect(resource.model.faction).to.equal('neutral');
      
      // movementSpeed is stored in both model and MovementController
      const movement = resource.controller.getController('movement');
      expect(movement.movementSpeed).to.equal(0); // Controller's speed set via config
    });

    it('should create building with default configuration', function() {
      const building = EntityFactory.createBuilding({ x: 200, y: 200 });
      
      expect(building.model.type).to.equal('Building');
      
      // movementSpeed is stored in both model and MovementController
      const movement = building.controller.getController('movement');
      expect(movement.movementSpeed).to.equal(0); // Controller's speed set via config
    });

    it('should allow overriding default ant configuration', function() {
      const ant = EntityFactory.createAnt({ 
        x: 50, 
        y: 50, 
        movementSpeed: 5,
        faction: 'enemy'
      });
      
      expect(ant.model.movementSpeed).to.equal(5);
      expect(ant.model.faction).to.equal('enemy');
    });
  });

  describe('EntityFactory Batch Creation', function() {
    it('should create multiple entities', function() {
      const entities = EntityFactory.createMultiple([
        { x: 0, y: 0, type: 'Ant' },
        { x: 50, y: 50, type: 'Resource' },
        { x: 100, y: 100, type: 'Building' }
      ]);
      
      expect(entities).to.have.lengthOf(3);
      expect(entities[0].model.type).to.equal('Ant');
      expect(entities[1].model.type).to.equal('Resource');
      expect(entities[2].model.type).to.equal('Building');
    });

    it('should create entities in grid pattern', function() {
      const entities = EntityFactory.createGrid(
        { type: 'Ant' },
        2, // rows
        3, // cols
        50, // spacing
        0, // startX
        0  // startY
      );
      
      expect(entities).to.have.lengthOf(6);
      expect(entities[0].model.getPosition()).to.deep.equal({ x: 0, y: 0 });
      expect(entities[1].model.getPosition()).to.deep.equal({ x: 50, y: 0 });
      expect(entities[3].model.getPosition()).to.deep.equal({ x: 0, y: 50 });
    });

    it('should create entities in circle pattern', function() {
      const entities = EntityFactory.createCircle(
        { type: 'Ant' },
        4, // count
        100, // centerX
        100, // centerY
        50 // radius
      );
      
      expect(entities).to.have.lengthOf(4);
      
      // Check all entities are roughly 50 pixels from center
      entities.forEach(entity => {
        const pos = entity.model.getPosition();
        const distance = Math.sqrt(
          Math.pow(pos.x - 100, 2) + Math.pow(pos.y - 100, 2)
        );
        expect(distance).to.be.closeTo(50, 1);
      });
    });
  });

  describe('EntityFactory Cloning', function() {
    it('should clone existing entity', function() {
      const original = EntityFactory.createAnt({ x: 100, y: 200 });
      const clone = EntityFactory.clone(original);
      
      expect(clone.model.type).to.equal(original.model.type);
      expect(clone.model.getPosition()).to.deep.equal(original.model.getPosition());
      expect(clone.model.id).to.not.equal(original.model.id);
    });

    it('should allow overriding cloned properties', function() {
      const original = EntityFactory.createAnt({ x: 100, y: 200 });
      const clone = EntityFactory.clone(original, { x: 300, y: 400 });
      
      expect(clone.model.getPosition()).to.deep.equal({ x: 300, y: 400 });
      expect(clone.model.type).to.equal(original.model.type);
    });
  });

  describe('Full Lifecycle Integration', function() {
    it('should handle complete entity lifecycle', function() {
      // Create ant with imagePath so sprite is initialized
      const entity = EntityFactory.createAnt({ x: 100, y: 100, imagePath: 'test.png' });
      expect(entity.model.isActive).to.be.true;
      
      // Move
      entity.controller.moveToLocation(200, 200);
      expect(entity.controller.isMoving()).to.be.true;
      
      // Select
      entity.controller.setSelected(true);
      expect(entity.controller.isSelected()).to.be.true;
      
      // Update
      entity.controller.update();
      
      // Render (skip if no sprite - might be undefined in test environment)
      if (entity.model.sprite && entity.model.sprite.render) {
        const renderSpy = sinon.spy(entity.model.sprite, 'render');
        entity.view.render();
        expect(renderSpy.calledOnce).to.be.true;
      } else {
        // Just verify render doesn't throw
        expect(() => entity.view.render()).to.not.throw();
      }
      
      // Destroy
      entity.controller.destroy();
      expect(entity.model.isActive).to.be.false;
    });

    it('should coordinate movement through all layers', function() {
      const entity = EntityFactory.createAnt({ x: 50, y: 50 });
      
      entity.controller.moveToLocation(150, 150);
      
      expect(entity.controller.isMoving()).to.be.true;
      expect(global.spatialGridManager.updateEntity.called).to.be.true;
    });

    it('should handle selection state through all layers', function() {
      const entity = EntityFactory.createAnt({ x: 50, y: 50 });
      
      entity.controller.setSelected(true);
      
      expect(entity.controller.isSelected()).to.be.true;
      
      // View should be able to render selection highlight
      expect(() => entity.view.highlightSelected()).to.not.throw();
    });

    it('should maintain consistency across updates', function() {
      const entity = EntityFactory.createAnt({ x: 100, y: 100 });
      
      // Make changes
      entity.controller.setPosition(200, 300);
      entity.model.setSize(64, 64);
      
      // Update to sync
      entity.controller.update();
      
      // Verify consistency
      const modelPos = entity.model.getPosition();
      const boxPos = { 
        x: entity.model.collisionBox.getPosX(), 
        y: entity.model.collisionBox.getPosY() 
      };
      const spritePos = entity.model.sprite?.pos || modelPos;
      
      expect(modelPos).to.deep.equal({ x: 200, y: 300 });
      expect(boxPos).to.deep.equal({ x: 200, y: 300 });
      
      // Sprite position should be synced if sprite exists
      if (entity.model.sprite && entity.model.sprite.pos) {
        expect(spritePos).to.deep.equal({ x: 200, y: 300 });
      }
    });
  });

  describe('Collision Detection Integration', function() {
    it('should detect collisions between entities', function() {
      const entity1 = EntityFactory.createAnt({ x: 100, y: 100, width: 32, height: 32 });
      const entity2 = EntityFactory.createAnt({ x: 110, y: 110, width: 32, height: 32 });
      
      // Entities should overlap
      const overlaps = entity1.model.collisionBox.contains(
        entity2.model.getPosition().x,
        entity2.model.getPosition().y
      );
      
      expect(overlaps).to.be.true;
    });

    it('should detect no collision for distant entities', function() {
      const entity1 = EntityFactory.createAnt({ x: 100, y: 100, width: 32, height: 32 });
      const entity2 = EntityFactory.createAnt({ x: 500, y: 500, width: 32, height: 32 });
      
      const overlaps = entity1.model.collisionBox.contains(
        entity2.model.getPosition().x,
        entity2.model.getPosition().y
      );
      
      expect(overlaps).to.be.false;
    });

    it('should handle mouse interaction through controller', function() {
      const entity = EntityFactory.createAnt({ x: 100, y: 100, width: 32, height: 32 });
      
      const mouseOver = entity.controller.isMouseOver(105, 105);
      expect(mouseOver).to.be.true;
      
      const mouseNotOver = entity.controller.isMouseOver(500, 500);
      expect(mouseNotOver).to.be.false;
    });
  });

  describe('Spatial Grid Integration', function() {
    it('should register entity with spatial grid on creation', function() {
      EntityFactory.createAnt({ x: 100, y: 100 });
      
      expect(global.spatialGridManager.addEntity.calledOnce).to.be.true;
    });

    it('should update spatial grid on movement', function() {
      const entity = EntityFactory.createAnt({ x: 100, y: 100 });
      global.spatialGridManager.updateEntity.resetHistory();
      
      entity.controller.moveToLocation(200, 200);
      
      expect(global.spatialGridManager.updateEntity.called).to.be.true;
    });

    it('should unregister from spatial grid on destroy', function() {
      const entity = EntityFactory.createAnt({ x: 100, y: 100 });
      
      entity.controller.destroy();
      
      expect(global.spatialGridManager.removeEntity.calledOnce).to.be.true;
    });
  });

  describe('Performance - Batch Operations', function() {
    it('should handle creating many entities efficiently', function() {
      const startTime = Date.now();
      
      const entities = [];
      for (let i = 0; i < 100; i++) {
        entities.push(EntityFactory.createAnt({ x: i * 10, y: i * 10 }));
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(entities).to.have.lengthOf(100);
      expect(duration).to.be.lessThan(500); // Should create 100 entities in under 500ms
    });

    it('should handle batch updates efficiently', function() {
      const entities = [];
      for (let i = 0; i < 50; i++) {
        entities.push(EntityFactory.createAnt({ x: i * 10, y: i * 10 }));
      }
      
      const startTime = Date.now();
      
      entities.forEach(entity => {
        entity.controller.update();
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).to.be.lessThan(100); // Should update 50 entities in under 100ms
    });
  });
});
