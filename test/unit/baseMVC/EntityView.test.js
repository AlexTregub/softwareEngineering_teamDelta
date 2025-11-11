/**
 * EntityView Unit Tests
 * 
 * Tests pure rendering functionality:
 * - Reading data from EntityModel
 * - Coordinate conversion (world ↔ screen)
 * - Highlight rendering (selection, hover, box)
 * - Sprite synchronization
 * - p5.js availability checks
 * - NO business logic testing
 */

const { expect } = require('chai');
const sinon = require('sinon');
const EntityModel = require('../../../Classes/baseMVC/models/EntityModel');
const path = require('path');

// Load EntityView when implemented
let EntityView;
try {
  EntityView = require('../../../Classes/baseMVC/views/EntityView');
} catch (e) {
  // Will fail initially (TDD red phase)
}

describe('EntityView', function() {
  let model, view;
  let mockP5, mockCamera, mockSprite;

  beforeEach(function() {
    // Create model
    model = new EntityModel(100, 200, 32, 32, { type: 'TestEntity' });

    // Mock p5.js functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      noFill: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      ellipse: sinon.stub(),
      translate: sinon.stub(),
      rotate: sinon.stub(),
      imageMode: sinon.stub(),
      image: sinon.stub(),
      tint: sinon.stub(),
      noTint: sinon.stub()
    };

    // Mock camera
    mockCamera = {
      worldToScreen: sinon.stub().callsFake((wx, wy) => ({ x: wx * 2, y: wy * 2 })),
      screenToWorld: sinon.stub().callsFake((sx, sy) => ({ x: sx / 2, y: sy / 2 })),
      getZoom: sinon.stub().returns(2.0)
    };

    // Mock sprite
    mockSprite = {
      img: { width: 64, height: 64 },
      update: sinon.stub()
    };

    // Set globals for JSDOM
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.fill = mockP5.fill;
    global.stroke = mockP5.stroke;
    global.noFill = mockP5.noFill;
    global.noStroke = mockP5.noStroke;
    global.rect = mockP5.rect;
    global.ellipse = mockP5.ellipse;
    global.translate = mockP5.translate;
    global.rotate = mockP5.rotate;
    global.imageMode = mockP5.imageMode;
    global.image = mockP5.image;
    global.tint = mockP5.tint;
    global.noTint = mockP5.noTint;
    global.CENTER = 'center';
    global.RADIANS = 'radians';

    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.noFill = global.noFill;
      window.noStroke = global.noStroke;
      window.rect = global.rect;
      window.ellipse = global.ellipse;
      window.translate = global.translate;
      window.rotate = global.rotate;
      window.imageMode = global.imageMode;
      window.image = global.image;
      window.tint = global.tint;
      window.noTint = global.noTint;
      window.CENTER = global.CENTER;
      window.RADIANS = global.RADIANS;
    }

    // Create view
    if (EntityView) {
      view = new EntityView(model, { camera: mockCamera });
    }
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Constructor', function() {
    it('should create view with model', function() {
      expect(view).to.exist;
      expect(view.model).to.equal(model);
    });

    it('should store camera reference', function() {
      expect(view.camera).to.equal(mockCamera);
    });

    it('should NOT have sprite property (refactored)', function() {
      // After refactor, View should not hold sprite state
      expect(view).to.not.have.property('sprite');
    });

    it('should NOT have setSprite method (refactored)', function() {
      // After refactor, sprites managed by Model
      expect(view.setSprite).to.be.undefined;
    });

    it('should NOT have getSprite method (refactored)', function() {
      expect(view.getSprite).to.be.undefined;
    });

    it('should NOT have syncSprite method (refactored)', function() {
      // No sync needed - View reads from Model directly
      expect(view.syncSprite).to.be.undefined;
    });

    it('should throw error if model is missing', function() {
      expect(() => new EntityView(null)).to.throw('EntityView requires a model');
    });
  });

  describe('Coordinate Conversion', function() {
    it('should convert world to screen coordinates', function() {
      const screen = view.worldToScreen(100, 200);
      expect(screen).to.deep.equal({ x: 200, y: 400 });
      expect(mockCamera.worldToScreen.calledWith(100, 200)).to.be.true;
    });

    it('should convert screen to world coordinates', function() {
      const world = view.screenToWorld(200, 400);
      expect(world).to.deep.equal({ x: 100, y: 200 });
      expect(mockCamera.screenToWorld.calledWith(200, 400)).to.be.true;
    });

    it('should use fallback if camera missing', function() {
      view.camera = null;
      const screen = view.worldToScreen(100, 200);
      expect(screen).to.deep.equal({ x: 100, y: 200 });
    });

    it('should get zoom from camera', function() {
      const zoom = view.getZoom();
      expect(zoom).to.equal(2.0);
      expect(mockCamera.getZoom.called).to.be.true;
    });

    it('should return 1.0 zoom if camera missing', function() {
      view.camera = null;
      const zoom = view.getZoom();
      expect(zoom).to.equal(1.0);
    });
  });

  describe('Highlight Rendering', function() {
    it('should render selection highlight', function() {
      model.setSelected(true);
      view.renderHighlight();

      expect(mockP5.push.called).to.be.true;
      expect(mockP5.stroke.called).to.be.true;
      expect(mockP5.noFill.called).to.be.true;
      expect(mockP5.rect.called).to.be.true;
      expect(mockP5.pop.called).to.be.true;
    });

    it('should render hover highlight', function() {
      model.setHovered(true);
      view.renderHighlight();

      expect(mockP5.stroke.called).to.be.true;
      expect(mockP5.rect.called).to.be.true;
    });

    it('should render box hover highlight', function() {
      model.setBoxHovered(true);
      view.renderHighlight();

      expect(mockP5.stroke.called).to.be.true;
      expect(mockP5.rect.called).to.be.true;
    });

    it('should not render if no highlight state', function() {
      model.setSelected(false);
      model.setHovered(false);
      model.setBoxHovered(false);
      view.renderHighlight();

      expect(mockP5.push.called).to.be.false;
    });

    it('should use correct colors for each state', function() {
      // Selection: green
      model.setSelected(true);
      view.renderHighlight();
      expect(mockP5.stroke.firstCall.args).to.deep.equal([0, 255, 0]);

      // Reset mocks
      mockP5.stroke.resetHistory();

      // Hover: yellow
      model.setSelected(false);
      model.setHovered(true);
      view.renderHighlight();
      expect(mockP5.stroke.firstCall.args).to.deep.equal([255, 255, 0]);

      // Reset mocks
      mockP5.stroke.resetHistory();

      // Box hover: cyan
      model.setHovered(false);
      model.setBoxHovered(true);
      view.renderHighlight();
      expect(mockP5.stroke.firstCall.args).to.deep.equal([0, 255, 255]);
    });

    it('should use world coordinates for highlight', function() {
      model.setSelected(true);
      view.renderHighlight();

      // Should use model position/size directly
      const rectCall = mockP5.rect.firstCall;
      expect(rectCall.args[0]).to.equal(100); // x
      expect(rectCall.args[1]).to.equal(200); // y
      expect(rectCall.args[2]).to.equal(32);  // width
      expect(rectCall.args[3]).to.equal(32);  // height
    });
  });

  // NOTE: Sprite Management, Main Rendering, and Render Layers removed in Phase 2 refactor
  // EntityView no longer manages sprites directly - that's handled by subclasses like AntView
  // See AntView.test.js for sprite rendering tests

  describe('Model Integration', function() {
    it('should read all states from model', function() {
      // Test each state is read correctly
      expect(view.model.isActive()).to.equal(model.isActive());
      expect(view.model.isSelected()).to.equal(model.isSelected());
      expect(view.model.isHovered()).to.equal(model.isHovered());
      expect(view.model.getPosition()).to.deep.equal(model.getPosition());
      expect(view.model.getSize()).to.deep.equal(model.getSize());
      expect(view.model.getRotation()).to.equal(model.getRotation());
      expect(view.model.getOpacity()).to.equal(model.getOpacity());
    });
  });
});
