/**
 * EntityController Unit Tests
 * 
 * Tests business logic coordination:
 * - Model and View lifecycle management
 * - Selection logic (click, box selection)
 * - Movement coordination (pathfinding integration)
 * - Update loop coordination
 * - Input handling (mouse, keyboard)
 * - Spatial queries integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const EntityModel = require('../../../Classes/baseMVC/models/EntityModel');
const EntityView = require('../../../Classes/baseMVC/views/EntityView');

// Load EntityController when implemented
let EntityController;
try {
  EntityController = require('../../../Classes/baseMVC/controllers/EntityController');
} catch (e) {
  // Will fail initially (TDD red phase)
}

describe('EntityController', function() {
  let model, view, controller;
  let mockCamera, mockSpatialGrid;

  beforeEach(function() {
    // Create model and view
    model = new EntityModel(100, 200, 32, 32, { type: 'TestEntity' });
    
    mockCamera = {
      worldToScreen: sinon.stub().callsFake((wx, wy) => ({ x: wx, y: wy })),
      screenToWorld: sinon.stub().callsFake((sx, sy) => ({ x: sx, y: sy })),
      getZoom: sinon.stub().returns(1.0)
    };
    
    view = new EntityView(model, { camera: mockCamera });
    
    // Mock spatial grid
    mockSpatialGrid = {
      register: sinon.stub(),
      unregister: sinon.stub(),
      update: sinon.stub(),
      getNearbyEntities: sinon.stub().returns([]),
      findNearestEntity: sinon.stub().returns(null)
    };

    // Mock p5.js for view
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.noFill = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.translate = sinon.stub();
    global.rotate = sinon.stub();
    global.imageMode = sinon.stub();
    global.image = sinon.stub();
    global.CENTER = 'center';

    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.noFill = global.noFill;
      window.noStroke = global.noStroke;
      window.rect = global.rect;
      window.translate = global.translate;
      window.rotate = global.rotate;
      window.imageMode = global.imageMode;
      window.image = global.image;
      window.CENTER = global.CENTER;
    }

    // Create controller
    if (EntityController) {
      controller = new EntityController(model, view, {
        spatialGrid: mockSpatialGrid
      });
    }
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Constructor', function() {
    it('should create controller with model and view', function() {
      expect(controller).to.exist;
      expect(controller.model).to.equal(model);
      expect(controller.view).to.equal(view);
    });

    it('should store spatial grid reference', function() {
      expect(controller.spatialGrid).to.equal(mockSpatialGrid);
    });

    it('should throw error if model is missing', function() {
      expect(() => new EntityController(null, view)).to.throw('EntityController requires a model');
    });

    it('should throw error if view is missing', function() {
      expect(() => new EntityController(model, null)).to.throw('EntityController requires a view');
    });

    it('should register with spatial grid on creation', function() {
      expect(mockSpatialGrid.register.called).to.be.true;
    });
  });

  describe('Lifecycle Management', function() {
    it('should deactivate entity', function() {
      controller.deactivate();
      expect(model.isActive()).to.be.false;
    });

    it('should unregister from spatial grid on deactivate', function() {
      controller.deactivate();
      expect(mockSpatialGrid.unregister.called).to.be.true;
    });

    it('should reactivate entity', function() {
      controller.deactivate();
      controller.activate();
      expect(model.isActive()).to.be.true;
    });

    it('should re-register with spatial grid on activate', function() {
      controller.deactivate();
      mockSpatialGrid.register.resetHistory();
      controller.activate();
      expect(mockSpatialGrid.register.called).to.be.true;
    });

    it('should clean up on destroy', function() {
      controller.destroy();
      expect(mockSpatialGrid.unregister.called).to.be.true;
      expect(model.isActive()).to.be.false;
    });
  });

  describe('Selection Logic', function() {
    it('should select entity', function() {
      controller.select();
      expect(model.isSelected()).to.be.true;
    });

    it('should deselect entity', function() {
      controller.select();
      controller.deselect();
      expect(model.isSelected()).to.be.false;
    });

    it('should toggle selection', function() {
      expect(model.isSelected()).to.be.false;
      controller.toggleSelection();
      expect(model.isSelected()).to.be.true;
      controller.toggleSelection();
      expect(model.isSelected()).to.be.false;
    });

    it('should check if point is inside entity', function() {
      const inside = controller.containsPoint(110, 210);
      expect(inside).to.be.true;
    });

    it('should check if point is outside entity', function() {
      const inside = controller.containsPoint(500, 500);
      expect(inside).to.be.false;
    });

    it('should handle mouse click for selection', function() {
      const selected = controller.handleClick(110, 210);
      expect(selected).to.be.true;
      expect(model.isSelected()).to.be.true;
    });

    it('should not select on click outside bounds', function() {
      const selected = controller.handleClick(500, 500);
      expect(selected).to.be.false;
      expect(model.isSelected()).to.be.false;
    });

    it('should set box hover state', function() {
      controller.setBoxHover(true);
      expect(model.isBoxHovered()).to.be.true;
    });

    it('should clear box hover state', function() {
      controller.setBoxHover(true);
      controller.setBoxHover(false);
      expect(model.isBoxHovered()).to.be.false;
    });
  });

  describe('Movement Coordination', function() {
    it('should set target position', function() {
      controller.setTargetPosition(300, 400);
      const target = model.getTargetPosition();
      expect(target).to.deep.equal({ x: 300, y: 400 });
    });

    it('should mark as moving when target set', function() {
      controller.setTargetPosition(300, 400);
      expect(model.isMoving()).to.be.true;
    });

    it('should clear target position', function() {
      controller.setTargetPosition(300, 400);
      controller.clearTarget();
      expect(model.getTargetPosition()).to.be.null;
      expect(model.isMoving()).to.be.false;
    });

    it('should set path', function() {
      const path = [{ x: 100, y: 200 }, { x: 150, y: 250 }];
      controller.setPath(path);
      expect(model.getPath()).to.deep.equal(path);
    });

    it('should clear path', function() {
      const path = [{ x: 100, y: 200 }];
      controller.setPath(path);
      controller.clearPath();
      expect(model.getPath()).to.be.null;
    });

    it('should stop movement', function() {
      controller.setTargetPosition(300, 400);
      controller.stopMovement();
      expect(model.isMoving()).to.be.false;
      expect(model.getTargetPosition()).to.be.null;
      expect(model.getPath()).to.be.null;
    });
  });

  describe('Update Loop', function() {
    it('should call update without errors', function() {
      expect(() => controller.update(16)).to.not.throw();
    });

    it('should not update if inactive', function() {
      controller.deactivate();
      const oldPos = model.getPosition();
      controller.update(16);
      expect(model.getPosition()).to.deep.equal(oldPos);
    });

    it('should update spatial grid position', function() {
      controller.update(16);
      expect(mockSpatialGrid.update.called).to.be.true;
    });

    // NOTE: sprite sync test removed - EntityView no longer manages sprites (Phase 2 refactor)
  });

  describe('Hover Logic', function() {
    it('should set hover state', function() {
      controller.setHover(true);
      expect(model.isHovered()).to.be.true;
    });

    it('should clear hover state', function() {
      controller.setHover(true);
      controller.setHover(false);
      expect(model.isHovered()).to.be.false;
    });

    it('should handle mouse hover', function() {
      const hovered = controller.handleMouseMove(110, 210);
      expect(hovered).to.be.true;
      expect(model.isHovered()).to.be.true;
    });

    it('should clear hover when mouse leaves', function() {
      controller.handleMouseMove(110, 210);
      expect(model.isHovered()).to.be.true;
      
      controller.handleMouseMove(500, 500);
      expect(model.isHovered()).to.be.false;
    });
  });

  describe('Position Management', function() {
    it('should move entity to new position', function() {
      controller.moveTo(300, 400);
      const pos = model.getPosition();
      expect(pos).to.deep.equal({ x: 300, y: 400 });
    });

    it('should update spatial grid after moving', function() {
      mockSpatialGrid.update.resetHistory();
      controller.moveTo(300, 400);
      expect(mockSpatialGrid.update.called).to.be.true;
    });

    it('should offset position', function() {
      controller.moveBy(50, 50);
      const pos = model.getPosition();
      expect(pos).to.deep.equal({ x: 150, y: 250 });
    });

    it('should get current position', function() {
      const pos = controller.getPosition();
      expect(pos).to.deep.equal({ x: 100, y: 200 });
    });
  });

  describe('Size Management', function() {
    it('should set size', function() {
      controller.setSize(64, 64);
      const size = model.getSize();
      expect(size).to.deep.equal({ x: 64, y: 64 });
    });

    it('should get size', function() {
      const size = controller.getSize();
      expect(size).to.deep.equal({ x: 32, y: 32 });
    });

    it('should get bounds', function() {
      const bounds = controller.getBounds();
      expect(bounds).to.deep.equal({
        x: 100,
        y: 200,
        width: 32,
        height: 32
      });
    });
  });

  describe('Rotation Management', function() {
    it('should set rotation', function() {
      controller.setRotation(45);
      expect(model.getRotation()).to.equal(45);
    });

    it('should rotate by offset', function() {
      controller.setRotation(30);
      controller.rotateBy(15);
      expect(model.getRotation()).to.equal(45);
    });

    it('should normalize rotation', function() {
      controller.setRotation(370);
      expect(model.getRotation()).to.equal(10);
    });

    it('should get rotation', function() {
      controller.setRotation(45);
      expect(controller.getRotation()).to.equal(45);
    });
  });

  describe('Rendering Coordination', function() {
    it('should call view render method', function() {
      // NOTE: EntityView.render() is now a stub in base class (Phase 2 refactor)
      // Actual rendering happens in subclasses like AntView
      const renderSpy = sinon.spy(view, 'render');
      controller.render();
      expect(renderSpy.called).to.be.true;
      renderSpy.restore();
    });

    it('should render highlights through view', function() {
      model.setSelected(true);
      controller.renderHighlights();
      expect(global.stroke.called).to.be.true;
    });

    it('should not render if inactive', function() {
      controller.deactivate();
      global.push.resetHistory();
      controller.render();
      expect(global.push.called).to.be.false;
    });
  });

  describe('Spatial Queries', function() {
    it('should get nearby entities', function() {
      const nearby = [{ id: 'test1' }, { id: 'test2' }];
      mockSpatialGrid.getNearbyEntities.returns(nearby);
      
      const result = controller.getNearbyEntities(50);
      expect(result).to.equal(nearby);
      expect(mockSpatialGrid.getNearbyEntities.called).to.be.true;
    });

    it('should find nearest entity', function() {
      const nearest = { id: 'test1' };
      mockSpatialGrid.findNearestEntity.returns(nearest);
      
      const result = controller.findNearestEntity();
      expect(result).to.equal(nearest);
      expect(mockSpatialGrid.findNearestEntity.called).to.be.true;
    });

    it('should handle missing spatial grid', function() {
      controller.spatialGrid = null;
      const result = controller.getNearbyEntities(50);
      expect(result).to.deep.equal([]);
    });
  });

  describe('State Queries', function() {
    it('should check if selected', function() {
      model.setSelected(true);
      expect(controller.isSelected()).to.be.true;
    });

    it('should check if hovered', function() {
      model.setHovered(true);
      expect(controller.isHovered()).to.be.true;
    });

    it('should check if moving', function() {
      model.setMoving(true);
      expect(controller.isMoving()).to.be.true;
    });

    it('should check if active', function() {
      expect(controller.isActive()).to.be.true;
      controller.deactivate();
      expect(controller.isActive()).to.be.false;
    });

    it('should get entity ID', function() {
      expect(controller.getId()).to.equal(model.getId());
    });

    it('should get entity type', function() {
      expect(controller.getType()).to.equal('TestEntity');
    });
  });

  describe('Faction Management', function() {
    it('should set faction', function() {
      controller.setFaction('player');
      expect(model.getFaction()).to.equal('player');
    });

    it('should get faction', function() {
      model.setFaction('enemy');
      expect(controller.getFaction()).to.equal('enemy');
    });

    it('should check if same faction', function() {
      controller.setFaction('player');
      expect(controller.isSameFaction('player')).to.be.true;
      expect(controller.isSameFaction('enemy')).to.be.false;
    });
  });

  describe('Event Handling', function() {
    it('should propagate model events', function() {
      const callback = sinon.stub();
      controller.on('positionChanged', callback);
      
      model.setPosition(300, 400);
      expect(callback.called).to.be.true;
    });

    it('should support event registration', function() {
      const callback = sinon.stub();
      controller.on('testEvent', callback);
      controller.emit('testEvent', { data: 'test' });
      expect(callback.calledWith({ data: 'test' })).to.be.true;
    });

    it('should support event deregistration', function() {
      const callback = sinon.stub();
      controller.on('testEvent', callback);
      controller.off('testEvent', callback);
      controller.emit('testEvent', { data: 'test' });
      expect(callback.called).to.be.false;
    });
  });

  describe('Opacity Management', function() {
    it('should set opacity', function() {
      controller.setOpacity(0.5);
      expect(model.getOpacity()).to.equal(0.5);
    });

    it('should get opacity', function() {
      model.setOpacity(0.7);
      expect(controller.getOpacity()).to.equal(0.7);
    });

    it('should fade out', function() {
      controller.fadeOut(0.1);
      expect(model.getOpacity()).to.be.lessThan(1.0);
    });

    it('should fade in', function() {
      controller.setOpacity(0.5);
      controller.fadeIn(0.1);
      expect(model.getOpacity()).to.be.greaterThan(0.5);
    });
  });

  describe('Debug Information', function() {
    it('should provide debug info', function() {
      const debugInfo = controller.getDebugInfo();
      expect(debugInfo).to.have.property('id');
      expect(debugInfo).to.have.property('type');
      expect(debugInfo).to.have.property('position');
      expect(debugInfo).to.have.property('size');
      expect(debugInfo).to.have.property('isActive');
      expect(debugInfo).to.have.property('isSelected');
    });

    it('should include all relevant state', function() {
      model.setSelected(true);
      model.setHovered(true);
      model.setMoving(true);
      
      const debugInfo = controller.getDebugInfo();
      expect(debugInfo.isSelected).to.be.true;
      expect(debugInfo.isHovered).to.be.true;
      expect(debugInfo.isMoving).to.be.true;
    });
  });
});
