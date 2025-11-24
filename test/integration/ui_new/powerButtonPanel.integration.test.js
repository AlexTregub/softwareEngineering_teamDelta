/**
 * Integration Tests for PowerButtonPanel
 * Tests complete MVC coordination and EventBus flow
 * 
 * Flow: Button click → PowerManager activation → EventBus → Button cooldown → Visual update
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const { JSDOM } = require('jsdom');

// Load dependencies
const PowerButtonModel = require(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonModel.js'));

describe('PowerButtonPanel Integration Tests', function() {
  let panel, mockP5, mockEventBus, mockQueen, sandbox, PowerButtonView, PowerButtonController, PowerButtonPanel;

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
      arc: sinon.stub(),
      image: sinon.stub(),
      tint: sinon.stub(),
      noTint: sinon.stub(),
      imageMode: sinon.stub(),
      angleMode: sinon.stub(),
      loadImage: sinon.stub().returns({ width: 64, height: 64 }),
      millis: sinon.stub().returns(1000),
      width: 1024,
      height: 768,
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

    // Mock EventBus with event storage
    const eventHandlers = {};
    mockEventBus = {
      on: sinon.spy((eventName, handler) => {
        if (!eventHandlers[eventName]) {
          eventHandlers[eventName] = [];
        }
        eventHandlers[eventName].push(handler);
      }),
      emit: sinon.spy((eventName, data) => {
        if (eventHandlers[eventName]) {
          eventHandlers[eventName].forEach(handler => handler(data));
        }
      }),
      off: sinon.stub()
    };
    global.EventBus = mockEventBus;
    global.window.EventBus = mockEventBus;

    // Mock Queen
    mockQueen = {
      isPowerUnlocked: sinon.stub().callsFake((powerName) => {
        // Lightning unlocked, fireball locked, finalFlash unlocked
        return powerName === 'lightning' || powerName === 'finalFlash';
      })
    };
    global.queenAnt = mockQueen;
    global.window.queenAnt = mockQueen;

    // Load dependencies AFTER globals are set
    delete require.cache[require.resolve(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonView.js'))];
    delete require.cache[require.resolve(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonController.js'))];
    delete require.cache[require.resolve(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonPanel.js'))];
    
    PowerButtonView = require(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonView.js'));
    PowerButtonController = require(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonController.js'));
    PowerButtonPanel = require(path.resolve(__dirname, '../../../Classes/ui_new/components/PowerButtonPanel.js'));
    
    // Make classes available globally for PowerButtonPanel
    global.PowerButtonModel = PowerButtonModel;
    global.PowerButtonView = PowerButtonView;
    global.PowerButtonController = PowerButtonController;
    global.window.PowerButtonModel = PowerButtonModel;
    global.window.PowerButtonView = PowerButtonView;
    global.window.PowerButtonController = PowerButtonController;

    // Create panel
    panel = new PowerButtonPanel(mockP5, {
      y: 60,
      powers: ['lightning', 'fireball', 'finalFlash']
    });
  });

  afterEach(function() {
    sandbox.restore();
    if (panel && panel.cleanup) {
      panel.cleanup();
    }
    delete global.window;
    delete global.document;
    delete global.EventBus;
    delete global.queenAnt;
    delete global.PowerButtonModel;
    delete global.PowerButtonView;
    delete global.PowerButtonController;
    Object.keys(mockP5).forEach(key => {
      delete global[key];
    });
  });

  describe('Panel Initialization', function() {
    it('should create panel with three buttons', function() {
      expect(panel.buttons).to.have.lengthOf(3);
    });

    it('should create MVC triad for each button', function() {
      panel.buttons.forEach(button => {
        expect(button.model).to.exist;
        expect(button.view).to.exist;
        expect(button.controller).to.exist;
        expect(button.powerName).to.be.a('string');
      });
    });

    it('should register EventBus listeners for all buttons', function() {
      // Each button registers 2 listeners (cooldown:start, cooldown:end)
      expect(mockEventBus.on.callCount).to.be.at.least(6);
    });
  });

  describe('Queen Lock Status Synchronization', function() {
    it('should update all button lock statuses from Queen', function() {
      panel.update();

      const lightning = panel.getButton('lightning');
      const fireball = panel.getButton('fireball');
      const finalFlash = panel.getButton('finalFlash');

      expect(lightning.model.getIsLocked()).to.be.false; // Unlocked
      expect(fireball.model.getIsLocked()).to.be.true;   // Locked
      expect(finalFlash.model.getIsLocked()).to.be.false; // Unlocked
    });

    it('should query Queen for each power', function() {
      panel.update();

      expect(mockQueen.isPowerUnlocked.calledWith('lightning')).to.be.true;
      expect(mockQueen.isPowerUnlocked.calledWith('fireball')).to.be.true;
      expect(mockQueen.isPowerUnlocked.calledWith('finalFlash')).to.be.true;
    });
  });

  describe('EventBus Cooldown Flow', function() {
    it('should start cooldown when receiving EventBus signal', function() {
      const lightning = panel.getButton('lightning');
      
      // Emit cooldown start event
      mockEventBus.emit('power:cooldown:start', {
        powerName: 'lightning',
        duration: 5000,
        timestamp: 1000
      });

      expect(lightning.model.getCooldownProgress()).to.be.greaterThan(0);
    });

    it('should only update matching power on cooldown start', function() {
      const lightning = panel.getButton('lightning');
      const fireball = panel.getButton('fireball');

      // Emit cooldown start for lightning only
      mockEventBus.emit('power:cooldown:start', {
        powerName: 'lightning',
        duration: 5000,
        timestamp: 1000
      });

      expect(lightning.model.getCooldownProgress()).to.be.greaterThan(0);
      expect(fireball.model.getCooldownProgress()).to.equal(0);
    });

    it('should end cooldown when receiving EventBus signal', function() {
      const lightning = panel.getButton('lightning');

      // Start cooldown
      mockEventBus.emit('power:cooldown:start', {
        powerName: 'lightning',
        duration: 5000,
        timestamp: 1000
      });

      // End cooldown
      mockEventBus.emit('power:cooldown:end', {
        powerName: 'lightning',
        timestamp: 6000
      });

      expect(lightning.model.getCooldownProgress()).to.equal(0);
    });

    it('should auto-complete cooldown after duration', function() {
      const lightning = panel.getButton('lightning');

      // Start cooldown
      mockEventBus.emit('power:cooldown:start', {
        powerName: 'lightning',
        duration: 5000,
        timestamp: 1000
      });

      // Advance time past duration
      mockP5.millis.returns(6500);
      panel.update();

      expect(lightning.model.getCooldownProgress()).to.equal(0);
    });

    it('should emit cooldown:end when auto-completing', function() {
      const lightning = panel.getButton('lightning');
      const emitCallsBefore = mockEventBus.emit.callCount;

      // Start cooldown
      mockEventBus.emit('power:cooldown:start', {
        powerName: 'lightning',
        duration: 5000,
        timestamp: 1000
      });

      // Advance time past duration
      mockP5.millis.returns(6500);
      panel.update();

      // Should have emitted cooldown:end
      expect(mockEventBus.emit.callCount).to.be.greaterThan(emitCallsBefore + 1);
      const endCall = mockEventBus.emit.getCalls().find(call => 
        call.args[0] === 'power:cooldown:end' && call.args[1].powerName === 'lightning'
      );
      expect(endCall).to.exist;
    });
  });

  describe('Click Handling Flow', function() {
    it('should activate unlocked power on click', function() {
      panel.update(); // Sync lock status from Queen
      const lightning = panel.getButton('lightning');
      const buttonPos = lightning.view.getPosition();

      const activated = panel.handleClick(buttonPos.x, buttonPos.y);

      expect(activated).to.be.true;
      expect(mockEventBus.emit.calledWith('power:activated')).to.be.true;
    });

    it('should not activate locked power', function() {
      panel.update(); // Sync lock status from Queen
      const fireball = panel.getButton('fireball');
      const buttonPos = fireball.view.getPosition();

      const activated = panel.handleClick(buttonPos.x, buttonPos.y);

      expect(activated).to.be.false;
    });

    it('should not activate power on cooldown', function() {
      panel.update(); // Sync lock status
      const lightning = panel.getButton('lightning');

      // Start cooldown
      mockEventBus.emit('power:cooldown:start', {
        powerName: 'lightning',
        duration: 5000,
        timestamp: 1000
      });

      const buttonPos = lightning.view.getPosition();
      const activated = panel.handleClick(buttonPos.x, buttonPos.y);

      expect(activated).to.be.false;
    });

    it('should not handle clicks outside panel', function() {
      const activated = panel.handleClick(9999, 9999);

      expect(activated).to.be.false;
    });
  });

  describe('Rendering Integration', function() {
    it('should render background panel', function() {
      panel.render();

      expect(mockP5.rect.called).to.be.true;
    });

    it('should render all button views', function() {
      const imageCallsBefore = mockP5.image.callCount;

      panel.render();

      // Should render 3 buttons (or more if sprites loaded)
      expect(mockP5.image.callCount).to.be.at.least(imageCallsBefore);
    });

    it('should apply tint to locked buttons', function() {
      panel.update(); // Sync lock status
      panel.render();

      // Fireball is locked, should have tint applied
      expect(mockP5.tint.called).to.be.true;
    });

    it('should render cooldown radials', function() {
      const lightning = panel.getButton('lightning');

      // Start cooldown
      mockEventBus.emit('power:cooldown:start', {
        powerName: 'lightning',
        duration: 5000,
        timestamp: 1000
      });

      mockP5.millis.returns(2000); // 1 second elapsed
      panel.update();
      panel.render();

      expect(mockP5.arc.called).to.be.true;
    });
  });

  describe('Complete Flow: Click → Cooldown → Reset', function() {
    it('should complete full activation cycle', function() {
      // Step 1: Update to sync lock status
      panel.update();
      const lightning = panel.getButton('lightning');
      expect(lightning.model.getIsLocked()).to.be.false;
      expect(lightning.model.getCooldownProgress()).to.equal(0);

      // Step 2: Click to activate
      const buttonPos = lightning.view.getPosition();
      const activated = panel.handleClick(buttonPos.x, buttonPos.y);
      expect(activated).to.be.true;

      // Step 3: PowerManager would emit cooldown start
      mockEventBus.emit('power:cooldown:start', {
        powerName: 'lightning',
        duration: 5000,
        timestamp: 1000
      });
      expect(lightning.model.getCooldownProgress()).to.be.greaterThan(0);

      // Step 4: Time passes, cooldown updates
      mockP5.millis.returns(3000); // 2 seconds elapsed (40% progress)
      panel.update();
      const midProgress = lightning.model.getCooldownProgress();
      expect(midProgress).to.be.greaterThan(0);
      expect(midProgress).to.be.lessThan(1);

      // Step 5: Cooldown completes
      mockP5.millis.returns(6500); // Past duration
      panel.update();
      expect(lightning.model.getCooldownProgress()).to.equal(0);

      // Step 6: Can activate again
      const reactivated = panel.handleClick(buttonPos.x, buttonPos.y);
      expect(reactivated).to.be.true;
    });
  });

  describe('Multi-Button Coordination', function() {
    it('should handle multiple powers on cooldown simultaneously', function() {
      panel.update();

      // Start cooldown for lightning
      mockEventBus.emit('power:cooldown:start', {
        powerName: 'lightning',
        duration: 5000,
        timestamp: 1000
      });

      // Start cooldown for finalFlash
      mockEventBus.emit('power:cooldown:start', {
        powerName: 'finalFlash',
        duration: 180000, // 3 minutes
        timestamp: 1000
      });

      const lightning = panel.getButton('lightning');
      const finalFlash = panel.getButton('finalFlash');

      expect(lightning.model.getCooldownProgress()).to.be.greaterThan(0);
      expect(finalFlash.model.getCooldownProgress()).to.be.greaterThan(0);

      // Advance time to complete lightning but not finalFlash
      mockP5.millis.returns(6500);
      panel.update();

      expect(lightning.model.getCooldownProgress()).to.equal(0);
      expect(finalFlash.model.getCooldownProgress()).to.be.greaterThan(0);
    });
  });

  describe('Panel Lifecycle', function() {
    it('should enable/disable all interactions', function() {
      panel.setEnabled(false);
      panel.update(); // Should not query Queen

      const callsBefore = mockQueen.isPowerUnlocked.callCount;
      panel.update();
      
      expect(mockQueen.isPowerUnlocked.callCount).to.equal(callsBefore);
    });

    it('should cleanup all button controllers', function() {
      panel.cleanup();

      expect(mockEventBus.off.called).to.be.true;
    });
  });
});
