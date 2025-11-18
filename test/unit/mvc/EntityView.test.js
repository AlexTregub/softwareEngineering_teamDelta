/**
 * EntityView Unit Tests
 * =====================
 * Tests for presentation layer - handles rendering, no state mutations
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupP5Mocks, resetP5Mocks } = require('../../helpers/p5Mocks');

// Setup p5.js mocks
setupP5Mocks();

// Mock CoordinateConverter
global.CoordinateConverter = {
  worldToScreen: sinon.stub().callsFake((x, y) => ({ x, y })),
  screenToWorld: sinon.stub().callsFake((x, y) => ({ x, y }))
};
global.window.CoordinateConverter = global.CoordinateConverter;

describe('EntityView', function() {
  let view, model;

  beforeEach(function() {
    // Reset p5 mocks
    resetP5Mocks();
    
    // Load classes
    if (typeof EntityModel === 'undefined') {
      global.EntityModel = require('../../../Classes/mvc/models/EntityModel.js');
      window.EntityModel = global.EntityModel;
    }
    if (typeof EntityView === 'undefined') {
      global.EntityView = require('../../../Classes/mvc/views/EntityView.js');
      window.EntityView = global.EntityView;
    }

    // Create model
    model = new EntityModel({ x: 100, y: 200, width: 32, height: 32 });
    
    // Create view
    view = new EntityView(model);
  });

  describe('Construction', function() {
    it('should create with model reference', function() {
      expect(view.model).to.equal(model);
    });

    it('should initialize with null debug renderer', function() {
      expect(view.debugRenderer).to.be.null;
    });
  });

  describe('Rendering', function() {
    it('should not render if model is inactive', function() {
      model.isActive = false;
      const spriteMock = { render: sinon.spy() };
      model.sprite = spriteMock;

      view.render();

      expect(spriteMock.render.called).to.be.false;
    });

    it('should not render if model is invisible', function() {
      model.visible = false;
      const spriteMock = { render: sinon.spy() };
      model.sprite = spriteMock;

      view.render();

      expect(spriteMock.render.called).to.be.false;
    });

    it('should render sprite when active and visible', function() {
      model.isActive = true;
      model.visible = true;
      const spriteMock = { 
        render: sinon.spy(),
        pos: { x: 0, y: 0 },
        size: { x: 32, y: 32 }
      };
      model.sprite = spriteMock;

      view.render();

      expect(spriteMock.render.calledOnce).to.be.true;
    });

    it('should handle missing sprite gracefully', function() {
      model.sprite = null;

      expect(() => view.render()).to.not.throw();
    });
  });

  describe('Debug Rendering', function() {
    it('should not render debug if debugRenderer is null', function() {
      view.debugRenderer = null;

      expect(() => view.renderDebug()).to.not.throw();
    });

    it('should not render debug if debugRenderer is inactive', function() {
      const debugMock = { isActive: false, render: sinon.spy() };
      view.debugRenderer = debugMock;

      view.renderDebug();

      expect(debugMock.render.called).to.be.false;
    });

    it('should render debug if debugRenderer is active', function() {
      const debugMock = { isActive: true, render: sinon.spy() };
      view.debugRenderer = debugMock;

      view.renderDebug();

      expect(debugMock.render.calledOnce).to.be.true;
    });
  });

  describe('Highlight Effects', function() {
    beforeEach(function() {
      model.sprite = { render: sinon.stub() };
    });

    it('should have highlightSelected method', function() {
      expect(view.highlightSelected).to.be.a('function');
    });

    it('should have highlightHover method', function() {
      expect(view.highlightHover).to.be.a('function');
    });

    it('should have highlightCombat method', function() {
      expect(view.highlightCombat).to.be.a('function');
    });

    it('should call p5.js drawing functions for highlight', function() {
      view.highlightSelected();

      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });
  });

  describe('Screen Position Conversion', function() {
    it('should convert world position to screen coordinates', function() {
      const screenPos = view.getScreenPosition();

      expect(screenPos).to.exist;
      expect(screenPos.x).to.equal(100);
      expect(screenPos.y).to.equal(200);
    });

    it('should use CoordinateConverter when available', function() {
      global.CoordinateConverter.worldToScreen.resetHistory();

      view.getScreenPosition();

      expect(global.CoordinateConverter.worldToScreen.called).to.be.true;
    });

    it('should handle missing CoordinateConverter', function() {
      const originalConverter = global.CoordinateConverter;
      global.CoordinateConverter = undefined;

      const screenPos = view.getScreenPosition();

      expect(screenPos).to.exist;

      global.CoordinateConverter = originalConverter;
    });
  });

  describe('Opacity Management', function() {
    it('should apply opacity to sprite rendering', function() {
      model.opacity = 128;
      model.sprite = { render: sinon.stub(), alpha: 255 };

      view.applyOpacity();

      expect(model.sprite.alpha).to.equal(128);
    });

    it('should handle missing sprite when applying opacity', function() {
      model.sprite = null;

      expect(() => view.applyOpacity()).to.not.throw();
    });
  });

  describe('Sprite2D Rendering', function() {
    beforeEach(function() {
      model.setPosition(100, 100);
      model.setSize(64, 64);
    });

    it('should render sprite if model has sprite', function() {
      const mockSprite = {
        render: sinon.spy(),
        pos: { x: 100, y: 100 },
        size: { x: 64, y: 64 }
      };
      model.setSprite(mockSprite);

      view.render();

      expect(mockSprite.render.calledOnce).to.be.true;
    });

    it('should fallback to rect if no sprite', function() {
      model.setSprite(null);
      global.rect.resetHistory(); // Reset existing stub

      view.render();

      expect(global.rect.calledOnce).to.be.true;
    });

    it('should sync sprite position with model', function() {
      const mockSprite = {
        render: sinon.spy(),
        pos: { x: 0, y: 0 },
        size: { x: 64, y: 64 }
      };
      model.setSprite(mockSprite);
      model.setPosition(200, 300);

      view.render();

      // Sprite position should match model
      expect(mockSprite.pos.x).to.equal(200);
      expect(mockSprite.pos.y).to.equal(300);
    });

    it('should respect model visibility with sprite', function() {
      const mockSprite = {
        render: sinon.spy(),
        pos: { x: 100, y: 100 },
        size: { x: 64, y: 64 }
      };
      model.setSprite(mockSprite);
      model.setVisible(false);

      view.render();

      // Should not call sprite.render() if not visible
      expect(mockSprite.render.called).to.be.false;
    });

    it('should apply opacity to sprite', function() {
      const mockSprite = {
        render: sinon.spy(),
        pos: { x: 100, y: 100 },
        size: { x: 64, y: 64 },
        alpha: 255
      };
      model.setSprite(mockSprite);
      model.setOpacity(128);

      view.render();

      expect(mockSprite.alpha).to.equal(128);
    });
  });

  describe('Advanced Highlights', function() {
    beforeEach(function() {
      model.setPosition(100, 100);
      model.setSize(32, 32);
    });

    it('should render spinning highlight', function() {
      global.rotate.resetHistory();

      view.highlightSpinning();

      expect(global.rotate.called).to.be.true;
    });

    it('should render slow spin highlight', function() {
      global.rotate.resetHistory();

      view.highlightSlowSpin();

      expect(global.rotate.called).to.be.true;
    });

    it('should render fast spin highlight', function() {
      global.rotate.resetHistory();

      view.highlightFastSpin();

      expect(global.rotate.called).to.be.true;
    });

    it('should render resource hover highlight', function() {
      global.stroke.resetHistory();
      global.ellipse.resetHistory();

      view.highlightResourceHover();

      expect(global.stroke.called).to.be.true;
      expect(global.ellipse.called).to.be.true;
    });

    it('should not modify model state during highlight rendering', function() {
      const originalData = model.getValidationData();

      view.highlightSpinning();
      view.highlightSlowSpin();
      view.highlightFastSpin();
      view.highlightResourceHover();

      const newData = model.getValidationData();
      expect(newData.position).to.deep.equal(originalData.position);
      expect(newData.rotation).to.equal(originalData.rotation);
    });
  });

  describe('NO State Mutations (View Purity)', function() {
    it('should NOT modify model position', function() {
      const originalPos = model.getPosition();
      
      view.render();
      
      expect(model.getPosition()).to.deep.equal(originalPos);
    });

    it('should NOT modify model size', function() {
      const originalSize = model.getSize();
      
      view.render();
      
      expect(model.getSize()).to.deep.equal(originalSize);
    });

    it('should NOT have update methods', function() {
      expect(view.update).to.be.undefined;
    });

    it('should NOT have movement methods', function() {
      expect(view.moveToLocation).to.be.undefined;
    });

    it('should NOT have controller methods', function() {
      expect(view.getController).to.be.undefined;
      expect(view._initializeControllers).to.be.undefined;
    });
  });

  describe('Read-Only Model Access', function() {
    it('should read from model without modifying it', function() {
      const originalData = model.getValidationData();
      
      view.getScreenPosition();
      view.render();
      
      const newData = model.getValidationData();
      
      // Compare fields excluding timestamp (which changes)
      expect(newData.id).to.equal(originalData.id);
      expect(newData.position).to.deep.equal(originalData.position);
      expect(newData.size).to.deep.equal(originalData.size);
      expect(newData.isActive).to.equal(originalData.isActive);
    });
  });
});
