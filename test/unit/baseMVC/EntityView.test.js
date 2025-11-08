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

    it('should initialize sprite to null', function() {
      expect(view.sprite).to.be.null;
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

  describe('Sprite Management', function() {
    it('should set sprite', function() {
      view.setSprite(mockSprite);
      expect(view.sprite).to.equal(mockSprite);
    });

    it('should get sprite', function() {
      view.setSprite(mockSprite);
      expect(view.getSprite()).to.equal(mockSprite);
    });

    it('should sync sprite with model position', function() {
      view.setSprite(mockSprite);
      view.syncSprite();

      expect(mockSprite.update.called).to.be.true;
      const updateCall = mockSprite.update.firstCall.args[0];
      expect(updateCall.x).to.equal(100);
      expect(updateCall.y).to.equal(200);
    });

    it('should sync sprite with model rotation', function() {
      model.setRotation(45);
      view.setSprite(mockSprite);
      view.syncSprite();

      const updateCall = mockSprite.update.firstCall.args[0];
      expect(updateCall.rotation).to.equal(45);
    });

    it('should handle missing sprite gracefully', function() {
      view.sprite = null;
      expect(() => view.syncSprite()).to.not.throw();
    });
  });

  describe('Main Rendering', function() {
    it('should render sprite if available', function() {
      view.setSprite(mockSprite);
      view.render();

      expect(mockP5.push.called).to.be.true;
      expect(mockP5.imageMode.calledWith(CENTER)).to.be.true;
      expect(mockP5.translate.called).to.be.true;
      // Rotation may not be called if rotation is 0
      expect(mockP5.image.calledWith(mockSprite.img)).to.be.true;
      expect(mockP5.pop.called).to.be.true;
    });

    it('should apply opacity when rendering', function() {
      model.setOpacity(0.5);
      view.setSprite(mockSprite);
      view.render();

      expect(mockP5.tint.calledWith(255, 127.5)).to.be.true; // 255 * 0.5
    });

    it('should render fallback rect if no sprite', function() {
      view.sprite = null;
      view.render();

      expect(mockP5.fill.called).to.be.true;
      expect(mockP5.rect.called).to.be.true;
    });

    it('should not render if inactive', function() {
      model.setActive(false);
      view.render();

      expect(mockP5.push.called).to.be.false;
    });

    it('should use world coordinates for rendering', function() {
      view.sprite = null;
      view.render();

      // Should use model position/size (centered due to translate)
      const rectCall = mockP5.rect.firstCall;
      expect(rectCall.args[0]).to.equal(-16); // -size.x/2 (center-based)
      expect(rectCall.args[1]).to.equal(-16); // -size.y/2 (center-based)
      expect(rectCall.args[2]).to.equal(32);  // width
      expect(rectCall.args[3]).to.equal(32);  // height
    });

    it('should apply rotation when rendering', function() {
      model.setRotation(45);
      view.sprite = null;
      view.render();

      expect(mockP5.translate.called).to.be.true;
      expect(mockP5.rotate.called).to.be.true;
    });
  });

  describe('p5.js Availability', function() {
    it('should check if p5.js is available', function() {
      const available = view.isP5Available();
      expect(available).to.be.true;
    });

    it('should return false if p5.js missing', function() {
      const oldPush = global.push;
      global.push = undefined;

      const available = view.isP5Available();
      expect(available).to.be.false;

      global.push = oldPush;
    });

    it('should not render if p5.js unavailable', function() {
      const oldPush = global.push;
      global.push = undefined;

      view.render();

      // Should not call any p5 functions
      expect(mockP5.fill.called).to.be.false;

      global.push = oldPush;
    });
  });

  describe('Render Layers', function() {
    it('should render entity layer', function() {
      view.renderEntityLayer();

      // Should call main render
      expect(mockP5.push.called || mockP5.fill.called).to.be.true;
    });

    it('should render highlight layer', function() {
      model.setSelected(true);
      view.renderHighlightLayer();

      expect(mockP5.stroke.called).to.be.true;
    });

    it('should separate entity and highlight rendering', function() {
      // Entity render should NOT include highlights
      view.sprite = null;
      view.renderEntityLayer();

      const entityRectCalls = mockP5.rect.callCount;

      // Highlight render should ONLY render highlights
      mockP5.rect.resetHistory();
      model.setSelected(true);
      view.renderHighlightLayer();

      const highlightRectCalls = mockP5.rect.callCount;

      // Should be separate calls
      expect(entityRectCalls).to.be.greaterThan(0);
      expect(highlightRectCalls).to.be.greaterThan(0);
    });
  });

  describe('Model Integration', function() {
    it('should read position from model', function() {
      model.setPosition(300, 400);
      view.sprite = null;
      view.render();

      // Check translate call (uses center of entity)
      const translateCall = mockP5.translate.firstCall;
      expect(translateCall.args[0]).to.equal(316); // 300 + 32/2
      expect(translateCall.args[1]).to.equal(416); // 400 + 32/2
    });

    it('should read size from model', function() {
      model.setSize(64, 64);
      view.sprite = null;
      view.render();

      const rectCall = mockP5.rect.firstCall;
      expect(rectCall.args[2]).to.equal(64);
      expect(rectCall.args[3]).to.equal(64);
    });

    it('should react to model changes', function() {
      model.setPosition(100, 100);
      view.sprite = null;
      view.render();

      let translateCall = mockP5.translate.firstCall;
      expect(translateCall.args[0]).to.equal(116); // 100 + 32/2

      // Change model
      mockP5.translate.resetHistory();
      model.setPosition(200, 200);
      view.render();

      translateCall = mockP5.translate.firstCall;
      expect(translateCall.args[0]).to.equal(216); // 200 + 32/2
    });

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
