/**
 * EntityController Unit Tests
 * ===========================
 * Tests for orchestration layer - coordinates model/view, manages sub-controllers
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock window for Node.js environment
if (typeof window === 'undefined') {
  global.window = {};
}

// Mock p5.js
global.createVector = sinon.stub().callsFake((x, y) => ({ x: x || 0, y: y || 0 }));
window.createVector = global.createVector;

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
  contains(x, y) { return false; }
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
};
global.MovementController = class MockMovementController {
  constructor(entity) { 
    this.entity = entity;
    this.movementSpeed = 1;
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

describe('EntityController', function() {
  let controller, model, view;

  beforeEach(function() {
    // Reset stubs BEFORE creating controller
    global.spatialGridManager.addEntity.resetHistory();
    global.spatialGridManager.removeEntity.resetHistory();
    global.spatialGridManager.updateEntity.resetHistory();

    // Load classes
    if (typeof EntityModel === 'undefined') {
      global.EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      window.EntityModel = global.EntityModel;
    }
    if (typeof EntityView === 'undefined') {
      global.EntityView = require('../../../Classes/mvc/views/EntityView.js');
      window.EntityView = global.EntityView;
    }
    if (typeof EntityController === 'undefined') {
      global.EntityController = require('../../../Classes/mvc/controllers/EntityController.js');
      window.EntityController = global.EntityController;
    }

    // Create MVC components
    model = new EntityModel({ x: 100, y: 200, width: 32, height: 32 });
    view = new EntityView(model);
    controller = new EntityController(model, view);
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Construction', function() {
    it('should store model reference', function() {
      expect(controller.model).to.equal(model);
    });

    it('should store view reference', function() {
      expect(controller.view).to.equal(view);
    });

    it('should initialize sub-controllers map', function() {
      expect(controller.subControllers).to.be.instanceOf(Map);
    });

    it('should create collision box', function() {
      expect(model.collisionBox).to.exist;
      expect(model.collisionBox).to.be.instanceOf(CollisionBox2D);
    });

    it('should create sprite', function() {
      expect(model.sprite).to.exist;
      expect(model.sprite).to.be.instanceOf(Sprite2D);
    });

    it('should register with spatial grid', function() {
      expect(global.spatialGridManager.addEntity.calledOnce).to.be.true;
    });
  });

  describe('Sub-Controller Management', function() {
    it('should initialize transform controller', function() {
      const transform = controller.getController('transform');
      expect(transform).to.exist;
    });

    it('should initialize movement controller', function() {
      const movement = controller.getController('movement');
      expect(movement).to.exist;
    });

    it('should initialize selection controller', function() {
      const selection = controller.getController('selection');
      expect(selection).to.exist;
    });

    it('should initialize combat controller', function() {
      const combat = controller.getController('combat');
      expect(combat).to.exist;
    });

    it('should return undefined for non-existent controller', function() {
      const missing = controller.getController('nonexistent');
      expect(missing).to.be.undefined;
    });
  });

  describe('Game Loop - Update', function() {
    it('should not update if model is inactive', function() {
      model.setActive(false);
      const updateSpy = sinon.spy(controller, '_syncComponents');
      
      controller.update();
      
      expect(updateSpy.called).to.be.false;
    });

    it('should update all sub-controllers', function() {
      const transform = controller.getController('transform');
      const updateSpy = sinon.spy(transform, 'update');
      
      controller.update();
      
      expect(updateSpy.calledOnce).to.be.true;
    });

    it('should sync components after update', function() {
      const syncSpy = sinon.spy(controller, '_syncComponents');
      
      controller.update();
      
      expect(syncSpy.calledOnce).to.be.true;
    });
  });

  describe('Component Synchronization', function() {
    it('should sync model position to collision box', function() {
      model.setPosition(300, 400);
      
      controller._syncComponents();
      
      expect(model.collisionBox.getPosX()).to.equal(300);
      expect(model.collisionBox.getPosY()).to.equal(400);
    });

    it('should sync model size to collision box', function() {
      model.setSize(64, 48);
      
      controller._syncComponents();
      
      expect(model.collisionBox.width).to.equal(64);
      expect(model.collisionBox.height).to.equal(48);
    });

    it('should sync position to sprite', function() {
      model.setPosition(150, 250);
      
      controller._syncComponents();
      
      expect(model.sprite.pos.x).to.equal(150);
      expect(model.sprite.pos.y).to.equal(250);
    });
  });

  describe('Movement Coordination', function() {
    it('should delegate movement to movement controller', function() {
      const movement = controller.getController('movement');
      const moveSpy = sinon.spy(movement, 'moveToLocation');
      
      controller.moveToLocation(500, 600);
      
      expect(moveSpy.calledWith(500, 600)).to.be.true;
    });

    it('should update spatial grid when moving', function() {
      controller.moveToLocation(500, 600);
      
      expect(global.spatialGridManager.updateEntity.called).to.be.true;
    });

    it('should report isMoving status', function() {
      const movement = controller.getController('movement');
      movement._isMoving = true;
      
      expect(controller.isMoving()).to.be.true;
    });

    it('should stop movement', function() {
      const movement = controller.getController('movement');
      movement._isMoving = true;
      
      controller.stop();
      
      expect(movement._isMoving).to.be.false;
    });
  });

  describe('Selection Coordination', function() {
    it('should delegate selection to selection controller', function() {
      const selection = controller.getController('selection');
      const selectSpy = sinon.spy(selection, 'setSelected');
      
      controller.setSelected(true);
      
      expect(selectSpy.calledWith(true)).to.be.true;
    });

    it('should report isSelected status', function() {
      const selection = controller.getController('selection');
      selection._isSelected = true;
      
      expect(controller.isSelected()).to.be.true;
    });

    it('should toggle selection', function() {
      const selection = controller.getController('selection');
      selection._isSelected = false;
      
      controller.toggleSelection();
      
      expect(selection._isSelected).to.be.true;
    });
  });

  describe('Lifecycle Management', function() {
    it('should mark model inactive on destroy', function() {
      controller.destroy();
      
      expect(model.isActive).to.be.false;
    });

    it('should unregister from spatial grid on destroy', function() {
      controller.destroy();
      
      expect(global.spatialGridManager.removeEntity.calledOnce).to.be.true;
    });
  });

  describe('Interaction Handling', function() {
    it('should detect mouse over using collision box', function() {
      const containsSpy = sinon.spy(model.collisionBox, 'contains');
      
      controller.isMouseOver(110, 210);
      
      expect(containsSpy.called).to.be.true;
    });

    it('should handle click events', function() {
      expect(() => controller.handleClick()).to.not.throw();
    });
  });

  describe('NO Rendering Logic (Controller Purity)', function() {
    it('should NOT have render methods', function() {
      expect(controller.render).to.be.undefined;
    });

    it('should NOT have highlight methods', function() {
      expect(controller.highlightSelected).to.be.undefined;
    });

    it('should NOT have drawing methods', function() {
      expect(controller.ellipse).to.be.undefined;
      expect(controller.rect).to.be.undefined;
    });
  });

  describe('NO Direct Data Storage (Controller Purity)', function() {
    it('should NOT store position directly', function() {
      expect(controller.position).to.be.undefined;
      expect(controller.x).to.be.undefined;
      expect(controller.y).to.be.undefined;
    });

    it('should NOT store size directly', function() {
      expect(controller.size).to.be.undefined;
      expect(controller.width).to.be.undefined;
      expect(controller.height).to.be.undefined;
    });

    it('should delegate to model for data', function() {
      const pos = controller.getPosition();
      expect(pos).to.deep.equal(model.getPosition());
    });
  });
});
