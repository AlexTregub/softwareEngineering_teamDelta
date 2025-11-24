/**
 * Unit Tests for PowerButtonView
 * TDD Phase 2: View (Presentation Layer)
 * 
 * Tests rendering methods - Read-only from model, NO state mutations
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const { JSDOM } = require('jsdom');

// Load dependencies
const PowerButtonModel = require(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonModel.js'));

describe('PowerButtonView', function() {
  let view, model, mockP5, sandbox, PowerButtonView;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // Create JSDOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;

    // Mock p5.js functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      noFill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      rect: sinon.stub(),
      ellipse: sinon.stub(),
      arc: sinon.stub(),
      image: sinon.stub(),
      tint: sinon.stub(),
      noTint: sinon.stub(),
      imageMode: sinon.stub(),
      angleMode: sinon.stub(),
      loadImage: sinon.stub().returns({ width: 64, height: 64 }),
      CORNER: 'corner',
      CENTER: 'center',
      RADIANS: 'radians',
      DEGREES: 'degrees',
      PI: Math.PI,
      HALF_PI: Math.PI / 2,
      TWO_PI: Math.PI * 2
    };

    // Make p5 functions global
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
    });

    // Load PowerButtonView AFTER globals are set
    delete require.cache[require.resolve(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonView.js'))];
    PowerButtonView = require(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonView.js'));

    // Create model
    model = new PowerButtonModel({
      powerName: 'lightning',
      isLocked: false,
      cooldownProgress: 0
    });
  });

  afterEach(function() {
    sandbox.restore();
    delete global.window;
    delete global.document;
    Object.keys(mockP5).forEach(key => {
      delete global[key];
    });
  });

  describe('Constructor', function() {
    it('should create view with model and position', function() {
      view = new PowerButtonView(model, mockP5, { x: 100, y: 200 });
      
      expect(view).to.exist;
      expect(view.model).to.equal(model);
    });

    it('should load sprite from model sprite path', function() {
      view = new PowerButtonView(model, mockP5, { x: 100, y: 200 });
      
      expect(mockP5.loadImage.called).to.be.true;
      expect(mockP5.loadImage.firstCall.args[0]).to.include('lightning');
    });

    it('should use default position if not provided', function() {
      view = new PowerButtonView(model, mockP5);
      
      expect(view).to.exist;
    });
  });

  describe('Sprite Rendering', function() {
    beforeEach(function() {
      view = new PowerButtonView(model, mockP5, { x: 100, y: 200 });
    });

    it('should render sprite at correct position', function() {
      view.render();
      
      expect(mockP5.image.called).to.be.true;
      expect(mockP5.push.called).to.be.true;
      expect(mockP5.pop.called).to.be.true;
    });

    it('should NOT modify model during rendering', function() {
      const lockStatus = model.getIsLocked();
      const cooldown = model.getCooldownProgress();
      
      view.render();
      
      expect(model.getIsLocked()).to.equal(lockStatus);
      expect(model.getCooldownProgress()).to.equal(cooldown);
    });

    it('should use image mode CENTER for sprite', function() {
      view.render();
      
      expect(mockP5.imageMode.called).to.be.true;
    });
  });

  describe('Lock Overlay Rendering', function() {
    beforeEach(function() {
      model.setIsLocked(true);
      view = new PowerButtonView(model, mockP5, { x: 100, y: 200 });
    });

    it('should render lock icon when locked', function() {
      view.render();
      
      // Should render lock overlay (rect or image)
      const callCount = mockP5.image.callCount + mockP5.rect.callCount;
      expect(callCount).to.be.greaterThan(1); // Sprite + lock icon
    });

    it('should NOT render lock icon when unlocked', function() {
      model.setIsLocked(false);
      
      const beforeImageCount = mockP5.image.callCount;
      view.render();
      const afterImageCount = mockP5.image.callCount;
      
      // Should only render sprite, not lock icon
      expect(afterImageCount - beforeImageCount).to.equal(1);
    });

    it('should apply grey tint when locked', function() {
      view.render();
      
      expect(mockP5.tint.called).to.be.true;
    });
  });

  describe('Cooldown Radial Rendering', function() {
    beforeEach(function() {
      model.setIsLocked(false);
      model.setCooldownProgress(0.5);
      view = new PowerButtonView(model, mockP5, { x: 100, y: 200 });
    });

    it('should render cooldown radial when on cooldown', function() {
      view.render();
      
      expect(mockP5.arc.called).to.be.true;
    });

    it('should NOT render radial when cooldown is 0', function() {
      model.setCooldownProgress(0);
      
      view.render();
      
      expect(mockP5.arc.called).to.be.false;
    });

    it('should render radial counterclockwise from 12 o\'clock', function() {
      view.render();
      
      expect(mockP5.arc.called).to.be.true;
      // Arc should start at -PI/2 (12 o'clock) and sweep counterclockwise
      const arcCall = mockP5.arc.firstCall;
      expect(arcCall).to.exist;
    });

    it('should scale radial arc by cooldown progress', function() {
      model.setCooldownProgress(0.25);
      view.render();
      const call1 = mockP5.arc.lastCall;
      
      mockP5.arc.resetHistory();
      
      model.setCooldownProgress(0.75);
      view.render();
      const call2 = mockP5.arc.lastCall;
      
      // Different progress values should render different arc angles
      expect(call1.args).to.not.deep.equal(call2.args);
    });

    it('should apply grey tint when on cooldown', function() {
      view.render();
      
      expect(mockP5.tint.called).to.be.true;
    });
  });

  describe('Combined States', function() {
    beforeEach(function() {
      view = new PowerButtonView(model, mockP5, { x: 100, y: 200 });
    });

    it('should render locked AND on cooldown simultaneously', function() {
      model.setIsLocked(true);
      model.setCooldownProgress(0.5);
      
      view.render();
      
      expect(mockP5.tint.called).to.be.true;
      expect(mockP5.arc.called).to.be.true;
    });

    it('should render unlocked with full cooldown (progress = 1)', function() {
      model.setIsLocked(false);
      model.setCooldownProgress(1.0);
      
      view.render();
      
      expect(mockP5.arc.called).to.be.true;
      expect(mockP5.tint.called).to.be.true;
    });

    it('should render unlocked and ready (no tint, no radial)', function() {
      model.setIsLocked(false);
      model.setCooldownProgress(0);
      
      view.render();
      
      expect(mockP5.tint.called).to.be.false;
      expect(mockP5.arc.called).to.be.false;
    });
  });

  describe('MVC Compliance - NO State Mutations', function() {
    beforeEach(function() {
      view = new PowerButtonView(model, mockP5, { x: 100, y: 200 });
    });

    it('should NOT have update methods', function() {
      expect(view.update).to.be.undefined;
    });

    it('should NOT mutate model lock status', function() {
      model.setIsLocked(true);
      
      view.render();
      
      expect(model.getIsLocked()).to.be.true;
    });

    it('should NOT mutate model cooldown progress', function() {
      model.setCooldownProgress(0.5);
      
      view.render();
      
      expect(model.getCooldownProgress()).to.equal(0.5);
    });

    it('should NOT have EventBus methods', function() {
      expect(view.emit).to.be.undefined;
      expect(view.on).to.be.undefined;
    });

    it('should NOT have Queen query methods', function() {
      expect(view.isPowerUnlocked).to.be.undefined;
      expect(view.queryQueen).to.be.undefined;
    });
  });

  describe('Rendering Performance', function() {
    beforeEach(function() {
      view = new PowerButtonView(model, mockP5, { x: 100, y: 200 });
    });

    it('should use push/pop for rendering isolation', function() {
      view.render();
      
      expect(mockP5.push.callCount).to.equal(mockP5.pop.callCount);
    });

    it('should only call render methods when visible', function() {
      const beforeCallCount = mockP5.image.callCount;
      
      view.render();
      
      expect(mockP5.image.callCount).to.be.greaterThan(beforeCallCount);
    });
  });
});
