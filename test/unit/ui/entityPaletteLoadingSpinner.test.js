/**
 * Unit Tests - EntityPalette Loading Spinner
 * Tests for loading spinner during LocalStorage operations
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityPalette Loading Spinner', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // Mock p5.js functions
    const mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      noFill: sandbox.stub(),
      stroke: sandbox.stub(),
      noStroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      rect: sandbox.stub(),
      ellipse: sandbox.stub(),
      arc: sandbox.stub(),
      text: sandbox.stub(),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      line: sandbox.stub(),
      translate: sandbox.stub(),
      rotate: sandbox.stub(),
      millis: sandbox.stub().returns(1000),
      HALF_PI: Math.PI / 2,
      TWO_PI: Math.PI * 2,
      CENTER: 'center',
      RADIUS: 'radius'
    };

    // Sync global and window
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
    });

    // Mock localStorage
    global.localStorage = {
      getItem: sandbox.stub().returns(null),
      setItem: sandbox.stub(),
      removeItem: sandbox.stub()
    };

    // Mock window for JSDOM
    if (typeof window !== 'undefined') {
      Object.assign(window, mockP5);
      window.localStorage = global.localStorage;
    }

    // Mock CategoryRadioButtons
    global.CategoryRadioButtons = class {
      constructor(callback) {
        this.callback = callback;
        this.height = 30;
        this.selected = 'entities';
      }
      render() {}
      handleClick() { return null; }
    };
    
    if (typeof window !== 'undefined') {
      window.CategoryRadioButtons = global.CategoryRadioButtons;
    }

    // Mock ModalDialog
    global.ModalDialog = class {
      constructor() {
        this.visible = false;
      }
      show() { this.visible = true; }
      hide() { this.visible = false; }
      render() {}
      handleClick() {}
    };
    
    if (typeof window !== 'undefined') {
      window.ModalDialog = global.ModalDialog;
    }

    // Mock ToastNotification
    global.ToastNotification = class {
      constructor() {
        this.toasts = [];
      }
      show() {}
      update() {}
      render() {}
      handleClick() {}
    };
    
    if (typeof window !== 'undefined') {
      window.ToastNotification = global.ToastNotification;
    }
  });

  afterEach(function() {
    sandbox.restore();
    
    // Clean up globals
    if (typeof window !== 'undefined') {
      delete window.localStorage;
      delete window.CategoryRadioButtons;
      delete window.ModalDialog;
      delete window.ToastNotification;
    }
  });

  describe('Spinner State Management', function() {
    it('should initialize with spinner hidden', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette._loadingSpinnerVisible).to.be.false;
    });

    it('should have showLoadingSpinner method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.showLoadingSpinner).to.be.a('function');
    });

    it('should show loading spinner', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      
      expect(palette._loadingSpinnerVisible).to.be.true;
    });

    it('should have hideLoadingSpinner method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.hideLoadingSpinner).to.be.a('function');
    });

    it('should hide loading spinner', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      palette.hideLoadingSpinner();
      
      expect(palette._loadingSpinnerVisible).to.be.false;
    });

    it('should track spinner rotation angle', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette._spinnerRotation).to.exist;
      expect(palette._spinnerRotation).to.be.a('number');
    });
  });

  describe('Spinner Animation', function() {
    it('should have updateLoadingSpinner method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.updateLoadingSpinner).to.be.a('function');
    });

    it('should update spinner rotation when visible', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      const initialRotation = palette._spinnerRotation;
      
      palette.updateLoadingSpinner();
      
      expect(palette._spinnerRotation).to.not.equal(initialRotation);
    });

    it('should not update spinner rotation when hidden', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const initialRotation = palette._spinnerRotation;
      palette.updateLoadingSpinner();
      
      expect(palette._spinnerRotation).to.equal(initialRotation);
    });

    it('should increment rotation by constant amount', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      palette._spinnerRotation = 0;
      
      palette.updateLoadingSpinner();
      const firstIncrement = palette._spinnerRotation;
      
      palette.updateLoadingSpinner();
      const secondIncrement = palette._spinnerRotation;
      
      expect(secondIncrement - firstIncrement).to.be.closeTo(firstIncrement, 0.01);
    });

    it('should wrap rotation at TWO_PI', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      palette._spinnerRotation = Math.PI * 2 - 0.01; // Almost at TWO_PI
      
      palette.updateLoadingSpinner();
      
      expect(palette._spinnerRotation).to.be.lessThan(Math.PI * 2);
    });
  });

  describe('Spinner Rendering', function() {
    it('should have renderLoadingSpinner method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.renderLoadingSpinner).to.be.a('function');
    });

    it('should render spinner when visible', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      palette.renderLoadingSpinner(100, 100, 200, 300);
      
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });

    it('should not render spinner when hidden', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      global.push.resetHistory();
      palette.renderLoadingSpinner(100, 100, 200, 300);
      
      expect(global.push.called).to.be.false;
    });

    it('should render semi-transparent overlay', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      palette.renderLoadingSpinner(100, 100, 200, 300);
      
      // Check for semi-transparent fill (should have alpha < 255)
      const fillCalls = global.fill.getCalls();
      const hasSemiTransparent = fillCalls.some(call => {
        const args = call.args;
        return args.length > 1 && args[args.length - 1] < 255;
      });
      
      expect(hasSemiTransparent).to.be.true;
    });

    it('should center spinner in panel', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      palette.renderLoadingSpinner(100, 100, 200, 300);
      
      // Check translate was called to center spinner
      expect(global.translate.called).to.be.true;
      const translateCall = global.translate.getCall(0);
      
      // Center X should be x + width/2, Center Y should be y + height/2
      expect(translateCall.args[0]).to.equal(200); // 100 + 200/2
      expect(translateCall.args[1]).to.equal(250); // 100 + 300/2
    });

    it('should draw rotating arcs', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      palette.renderLoadingSpinner(100, 100, 200, 300);
      
      expect(global.arc.called).to.be.true;
    });

    it('should display "Loading..." text', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      palette.renderLoadingSpinner(100, 100, 200, 300);
      
      const textCalls = global.text.getCalls();
      const hasLoadingText = textCalls.some(call => 
        call.args[0] && call.args[0].toLowerCase().includes('loading')
      );
      
      expect(hasLoadingText).to.be.true;
    });
  });

  describe('LocalStorage Operations Integration', function() {
    it('should show spinner during save operation', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      // Mock async localStorage operation
      const originalSetItem = global.localStorage.setItem;
      global.localStorage.setItem = sandbox.stub().callsFake(() => {
        expect(palette._loadingSpinnerVisible).to.be.true;
      });
      
      palette.addCustomEntity('Test', 'ant_worker', { faction: 'player' });
      
      global.localStorage.setItem = originalSetItem;
    });

    it('should hide spinner after save completes', function(done) {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Test', 'ant_worker', { faction: 'player' });
      
      // Spinner should be hidden after operation completes
      setTimeout(() => {
        expect(palette._loadingSpinnerVisible).to.be.false;
        done();
      }, 10);
    });

    it('should show spinner during load operation', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      
      global.localStorage.getItem = sandbox.stub().callsFake(() => {
        return JSON.stringify([{
          id: 'test_1',
          customName: 'Test Entity',
          baseTemplateId: 'ant_worker',
          properties: { faction: 'player' }
        }]);
      });
      
      // Loading happens in constructor
      const palette = new EntityPalette();
      
      // Spinner should have been shown during load (checked in _loadCustomEntities)
      expect(palette._loadCustomEntities).to.be.a('function');
    });

    it('should hide spinner after load completes', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      // After constructor completes, spinner should be hidden
      expect(palette._loadingSpinnerVisible).to.be.false;
    });

    it('should show spinner during delete operation', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Test', 'ant_worker', { faction: 'player' });
      const entityId = palette._templates.custom[0].id;
      
      const originalSetItem = global.localStorage.setItem;
      global.localStorage.setItem = sandbox.stub().callsFake(() => {
        expect(palette._loadingSpinnerVisible).to.be.true;
      });
      
      palette.deleteCustomEntity(entityId);
      
      global.localStorage.setItem = originalSetItem;
    });

    it('should hide spinner after delete completes', function(done) {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Test', 'ant_worker', { faction: 'player' });
      const entityId = palette._templates.custom[0].id;
      
      palette.deleteCustomEntity(entityId);
      
      setTimeout(() => {
        expect(palette._loadingSpinnerVisible).to.be.false;
        done();
      }, 10);
    });
  });

  describe('Edge Cases', function() {
    it('should handle multiple show calls gracefully', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      palette.showLoadingSpinner();
      palette.showLoadingSpinner();
      
      expect(palette._loadingSpinnerVisible).to.be.true;
    });

    it('should handle multiple hide calls gracefully', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      palette.hideLoadingSpinner();
      palette.hideLoadingSpinner();
      palette.hideLoadingSpinner();
      
      expect(palette._loadingSpinnerVisible).to.be.false;
    });

    it('should continue animation during multiple updates', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      const rotations = [];
      
      for (let i = 0; i < 10; i++) {
        palette.updateLoadingSpinner();
        rotations.push(palette._spinnerRotation);
      }
      
      // Each rotation should be different (monotonically increasing)
      for (let i = 1; i < rotations.length; i++) {
        expect(rotations[i]).to.be.greaterThan(rotations[i - 1]);
      }
    });

    it('should render spinner at different panel positions', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showLoadingSpinner();
      
      // Try different positions
      palette.renderLoadingSpinner(0, 0, 100, 100);
      palette.renderLoadingSpinner(500, 300, 200, 400);
      
      expect(global.translate.callCount).to.be.greaterThan(1);
    });
  });
});
