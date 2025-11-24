/**
 * Unit Tests for PowerButtonController
 * TDD Phase 3: Controller (Orchestration Layer)
 * 
 * Tests orchestration logic - EventBus, Queen queries, cooldown updates
 * NO rendering (View), NO data storage (Model)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const { JSDOM } = require('jsdom');

// Load dependencies
const PowerButtonModel = require(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonModel.js'));

describe('PowerButtonController', function() {
  let controller, model, view, mockP5, mockEventBus, mockQueen, sandbox, PowerButtonView, PowerButtonController;

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
      stroke: sinon.stub(),
      rect: sinon.stub(),
      arc: sinon.stub(),
      image: sinon.stub(),
      tint: sinon.stub(),
      noTint: sinon.stub(),
      imageMode: sinon.stub(),
      angleMode: sinon.stub(),
      loadImage: sinon.stub().returns({ width: 64, height: 64 }),
      millis: sinon.stub().returns(1000),
      CENTER: 'center',
      RADIANS: 'radians',
      PI: Math.PI,
      HALF_PI: Math.PI / 2,
      TWO_PI: Math.PI * 2
    };

    // Make p5 functions global
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      global.window[key] = mockP5[key];
    });

    // Mock EventBus
    mockEventBus = {
      on: sinon.stub(),
      emit: sinon.stub(),
      off: sinon.stub()
    };
    global.EventBus = mockEventBus;
    global.window.EventBus = mockEventBus;

    // Mock Queen
    mockQueen = {
      isPowerUnlocked: sinon.stub().returns(false)
    };
    global.queenAnt = mockQueen;
    global.window.queenAnt = mockQueen;

    // Load dependencies AFTER globals are set
    delete require.cache[require.resolve(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonView.js'))];
    delete require.cache[require.resolve(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonController.js'))];
    
    PowerButtonView = require(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonView.js'));
    PowerButtonController = require(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonController.js'));

    // Create MVC triad
    model = new PowerButtonModel({
      powerName: 'lightning',
      isLocked: false,
      cooldownProgress: 0
    });
    view = new PowerButtonView(model, mockP5, { x: 100, y: 200 });
    controller = new PowerButtonController(model, view);
  });

  afterEach(function() {
    sandbox.restore();
    delete global.window;
    delete global.document;
    delete global.EventBus;
    delete global.queenAnt;
    Object.keys(mockP5).forEach(key => {
      delete global[key];
    });
  });

  describe('Constructor', function() {
    it('should create controller with model and view', function() {
      expect(controller).to.exist;
      expect(controller.model).to.equal(model);
      expect(controller.view).to.equal(view);
    });

    it('should register EventBus listeners', function() {
      expect(mockEventBus.on.called).to.be.true;
      expect(mockEventBus.on.calledWith('power:cooldown:start')).to.be.true;
      expect(mockEventBus.on.calledWith('power:cooldown:end')).to.be.true;
    });

    it('should initialize cooldown timer properties', function() {
      expect(controller.cooldownStartTime).to.exist;
      expect(controller.cooldownDuration).to.exist;
    });
  });

  describe('EventBus Integration', function() {
    it('should listen for power:cooldown:start event', function() {
      const startCallback = mockEventBus.on.getCalls().find(call => 
        call.args[0] === 'power:cooldown:start'
      );
      
      expect(startCallback).to.exist;
      expect(startCallback.args[1]).to.be.a('function');
    });

    it('should listen for power:cooldown:end event', function() {
      const endCallback = mockEventBus.on.getCalls().find(call => 
        call.args[0] === 'power:cooldown:end'
      );
      
      expect(endCallback).to.exist;
      expect(endCallback.args[1]).to.be.a('function');
    });

    it('should start cooldown when receiving start event for matching power', function() {
      const startCallback = mockEventBus.on.getCalls().find(call => 
        call.args[0] === 'power:cooldown:start'
      ).args[1];

      startCallback({ powerName: 'lightning', duration: 5000, timestamp: 1000 });

      expect(model.getCooldownProgress()).to.be.greaterThan(0);
    });

    it('should ignore cooldown start for different power', function() {
      const startCallback = mockEventBus.on.getCalls().find(call => 
        call.args[0] === 'power:cooldown:start'
      ).args[1];

      startCallback({ powerName: 'fireball', duration: 5000, timestamp: 1000 });

      expect(model.getCooldownProgress()).to.equal(0);
    });

    it('should end cooldown when receiving end event for matching power', function() {
      // Start cooldown first
      const startCallback = mockEventBus.on.getCalls().find(call => 
        call.args[0] === 'power:cooldown:start'
      ).args[1];
      startCallback({ powerName: 'lightning', duration: 5000, timestamp: 1000 });

      // End cooldown
      const endCallback = mockEventBus.on.getCalls().find(call => 
        call.args[0] === 'power:cooldown:end'
      ).args[1];
      endCallback({ powerName: 'lightning', timestamp: 6000 });

      expect(model.getCooldownProgress()).to.equal(0);
    });

    it('should unregister EventBus listeners on cleanup', function() {
      controller.cleanup();

      expect(mockEventBus.off.called).to.be.true;
    });
  });

  describe('Queen Lock Status Integration', function() {
    it('should query Queen for power unlock status', function() {
      controller.updateLockStatus();

      expect(mockQueen.isPowerUnlocked.called).to.be.true;
      expect(mockQueen.isPowerUnlocked.calledWith('lightning')).to.be.true;
    });

    it('should update model lock status from Queen', function() {
      mockQueen.isPowerUnlocked.returns(true);

      controller.updateLockStatus();

      expect(model.getIsLocked()).to.be.false;
    });

    it('should lock model when Queen reports locked', function() {
      mockQueen.isPowerUnlocked.returns(false);

      controller.updateLockStatus();

      expect(model.getIsLocked()).to.be.true;
    });

    it('should handle missing Queen gracefully', function() {
      delete global.queenAnt;
      delete global.window.queenAnt;

      expect(() => controller.updateLockStatus()).to.not.throw();
      // Should keep existing lock status
      expect(model.getIsLocked()).to.be.false;
    });
  });

  describe('Cooldown Updates', function() {
    beforeEach(function() {
      mockP5.millis.returns(1000);
    });

    it('should start cooldown with duration', function() {
      controller.startCooldown(5000);

      expect(controller.cooldownStartTime).to.equal(1000);
      expect(controller.cooldownDuration).to.equal(5000);
    });

    it('should update cooldown progress based on elapsed time', function() {
      controller.startCooldown(5000);
      
      // Simulate 2.5 seconds elapsed (50% progress)
      mockP5.millis.returns(3500);
      controller.update();

      const progress = model.getCooldownProgress();
      expect(progress).to.be.closeTo(0.5, 0.1);
    });

    it('should auto-complete cooldown when time exceeds duration', function() {
      controller.startCooldown(5000);
      
      // Simulate 10 seconds elapsed (200% progress)
      mockP5.millis.returns(11000);
      controller.update();

      // Should auto-complete (reset to 0), not clamp at 1.0
      expect(model.getCooldownProgress()).to.equal(0);
    });

    it('should auto-complete cooldown when duration expires', function() {
      controller.startCooldown(5000);
      
      // Simulate 5 seconds elapsed
      mockP5.millis.returns(6000);
      controller.update();

      expect(model.getCooldownProgress()).to.equal(0);
      expect(controller.cooldownStartTime).to.equal(0);
    });

    it('should emit cooldown:end event when auto-completing', function() {
      controller.startCooldown(5000);
      
      mockP5.millis.returns(6000);
      controller.update();

      expect(mockEventBus.emit.calledWith('power:cooldown:end')).to.be.true;
    });

    it('should manually end cooldown', function() {
      controller.startCooldown(5000);
      
      controller.endCooldown();

      expect(model.getCooldownProgress()).to.equal(0);
      expect(controller.cooldownStartTime).to.equal(0);
    });

    it('should not update cooldown when not active', function() {
      mockP5.millis.returns(5000);
      controller.update();

      expect(model.getCooldownProgress()).to.equal(0);
    });
  });

  describe('Click Handling', function() {
    it('should detect click inside button bounds', function() {
      const clicked = controller.handleClick(100, 200);

      expect(clicked).to.be.true;
    });

    it('should not detect click outside button bounds', function() {
      const clicked = controller.handleClick(500, 500);

      expect(clicked).to.be.false;
    });

    it('should not trigger power when locked', function() {
      model.setIsLocked(true);
      
      const triggered = controller.handleClick(100, 200);

      expect(triggered).to.be.false;
    });

    it('should not trigger power when on cooldown', function() {
      controller.startCooldown(5000);
      
      const triggered = controller.handleClick(100, 200);

      expect(triggered).to.be.false;
    });

    it('should trigger power when unlocked and ready', function() {
      model.setIsLocked(false);
      model.setCooldownProgress(0);
      
      const triggered = controller.handleClick(100, 200);

      expect(triggered).to.be.true;
    });

    it('should emit power activation event on trigger', function() {
      model.setIsLocked(false);
      
      controller.handleClick(100, 200);

      expect(mockEventBus.emit.calledWith('power:activated')).to.be.true;
    });
  });

  describe('Update Loop', function() {
    it('should update lock status from Queen', function() {
      mockQueen.isPowerUnlocked.returns(true);
      
      controller.update();

      expect(model.getIsLocked()).to.be.false;
    });

    it('should update cooldown progress', function() {
      controller.startCooldown(5000);
      mockP5.millis.returns(2500);
      
      controller.update();

      expect(model.getCooldownProgress()).to.be.greaterThan(0);
    });

    it('should not update when disabled', function() {
      controller.enabled = false;
      mockQueen.isPowerUnlocked.returns(true);
      
      controller.update();

      // Should not query Queen
      expect(mockQueen.isPowerUnlocked.called).to.be.false;
    });
  });

  describe('MVC Compliance - NO Rendering/Data Storage', function() {
    it('should NOT have render methods', function() {
      expect(controller.render).to.be.undefined;
    });

    it('should NOT store position data', function() {
      expect(controller.x).to.be.undefined;
      expect(controller.y).to.be.undefined;
      expect(controller.position).to.be.undefined;
    });

    it('should NOT store size data', function() {
      expect(controller.size).to.be.undefined;
      expect(controller.width).to.be.undefined;
      expect(controller.height).to.be.undefined;
    });

    it('should NOT store sprite data', function() {
      expect(controller.sprite).to.be.undefined;
      expect(controller.spritePath).to.be.undefined;
    });

    it('should delegate rendering to view', function() {
      // Controller should NOT call p5 drawing functions
      controller.update();
      
      expect(mockP5.rect.called).to.be.false;
      expect(mockP5.arc.called).to.be.false;
      expect(mockP5.image.called).to.be.false;
    });
  });

  describe('Lifecycle Management', function() {
    it('should initialize properly', function() {
      expect(controller.model).to.exist;
      expect(controller.view).to.exist;
      expect(controller.enabled).to.be.true;
    });

    it('should cleanup resources', function() {
      controller.cleanup();

      expect(mockEventBus.off.called).to.be.true;
    });

    it('should enable/disable controller', function() {
      controller.setEnabled(false);
      expect(controller.enabled).to.be.false;

      controller.setEnabled(true);
      expect(controller.enabled).to.be.true;
    });
  });
});
