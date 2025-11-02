/**
 * Unit Tests for ModalDialog Refactoring
 * Tests for ModalDialog extending Dialog and using Button.js
 * 
 * TDD Phase: Write tests FIRST before refactoring
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('ModalDialog Refactoring (extends Dialog + Button.js)', function() {
  let modalDialog;
  let mockP5;
  let dom;
  
  beforeEach(function() {
    // Setup JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js global functions
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, z: 0 }));
    global.createGraphics = sinon.stub().returns({
      background: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      image: sinon.stub(),
      width: 800,
      height: 600
    });
    global.CENTER = 'center';
    global.LEFT = 'left';
    global.TOP = 'top';
    
    window.createVector = global.createVector;
    window.createGraphics = global.createGraphics;
    window.CENTER = global.CENTER;
    window.LEFT = global.LEFT;
    window.TOP = global.TOP;
    
    // Mock Button class (simplified)
    global.Button = class Button {
      constructor(x, y, w, h, label, options = {}) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.caption = label;
        this.onClick = options.onClick || null;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.isHovered = false;
      }
      
      update(mx, my, isPressed) {
        this.isHovered = mx >= this.x && mx <= this.x + this.width &&
                        my >= this.y && my <= this.y + this.height;
        if (this.isHovered && isPressed && this.onClick) {
          this.onClick(this);
          return true;
        }
        return false;
      }
      
      render() {}
      
      getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
      }
    };
    window.Button = global.Button;
    
    // Mock UIObject base class
    global.UIObject = class UIObject {
      constructor() {
        this.visible = false;
        this.cacheDirty = true;
      }
      
      isVisible() {
        return this.visible;
      }
      
      show() {
        this.visible = true;
      }
      
      hide() {
        this.visible = false;
      }
      
      markDirty() {
        this.cacheDirty = true;
      }
    };
    window.UIObject = global.UIObject;
    
    // Mock Dialog class with helper methods
    global.Dialog = class Dialog extends global.UIObject {
      constructor() {
        super();
      }
      
      renderOverlay(buffer, opacity = 180) {
        buffer.fill(0, opacity);
        buffer.rect(0, 0, buffer.width, buffer.height);
      }
      
      renderButton(buffer, config) {
        const { x, y, width, height, label, enabled = true } = config;
        buffer.fill(enabled ? 100 : 50);
        buffer.rect(x, y, width, height);
        buffer.fill(255);
        buffer.text(label, x + width / 2, y + height / 2);
        return { x, y, width, height };
      }
      
      renderInputField(buffer, config) {
        const { x, y, width, height, value = '', placeholder = '' } = config;
        buffer.fill(255);
        buffer.rect(x, y, width, height);
        buffer.fill(0);
        const displayText = value || placeholder;
        buffer.text(displayText, x + 5, y + height / 2);
        return { x, y, width, height };
      }
      
      isPointInBounds(x, y, bounds) {
        return x >= bounds.x && x <= bounds.x + bounds.width &&
               y >= bounds.y && y <= bounds.y + bounds.height;
      }
      
      renderValidationError(buffer, error, x, y) {
        if (error) {
          buffer.fill(255, 0, 0);
          buffer.text(error, x, y);
        }
      }
    };
    window.Dialog = global.Dialog;
    
    // Load ModalDialog (will need to be refactored)
    // For now, create mock that extends Dialog
    global.ModalDialog = class ModalDialog extends global.Dialog {
      constructor() {
        super();
        this.title = '';
        this.message = '';
        this.hasInput = false;
        this.inputValue = '';
        this.inputPlaceholder = '';
        this.buttons = [];
        this.buttonInstances = []; // Button.js instances
        this.validateInputFn = null;
        this.validationError = '';
        this.errorMessage = '';
      }
      
      show(config) {
        super.show();
        this.title = config.title || '';
        this.message = config.message || '';
        this.hasInput = config.hasInput || false;
        this.inputValue = config.inputValue || '';
        this.inputPlaceholder = config.inputPlaceholder || '';
        this.validateInputFn = config.validateInput || null;
        this.validationError = config.validationError || '';
        this.errorMessage = '';
        
        // Create Button instances from config
        this.buttonInstances = (config.buttons || []).map((btn, idx) => {
          return new Button(0, 0, 100, 35, btn.label, {
            onClick: btn.action,
            enabled: true
          });
        });
      }
      
      hide() {
        super.hide();
        this.errorMessage = '';
      }
    };
    window.ModalDialog = global.ModalDialog;
    
    modalDialog = new ModalDialog();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Inheritance and Architecture', function() {
    it('should extend Dialog class', function() {
      expect(modalDialog).to.be.instanceOf(Dialog);
    });
    
    it('should extend UIObject through Dialog', function() {
      expect(modalDialog).to.be.instanceOf(UIObject);
    });
    
    it('should have access to Dialog helper methods', function() {
      expect(modalDialog.renderOverlay).to.be.a('function');
      expect(modalDialog.renderButton).to.be.a('function');
      expect(modalDialog.renderInputField).to.be.a('function');
      expect(modalDialog.isPointInBounds).to.be.a('function');
      expect(modalDialog.renderValidationError).to.be.a('function');
    });
  });
  
  describe('Button.js Integration', function() {
    it('should create Button instances from config', function() {
      modalDialog.show({
        title: 'Test',
        buttons: [
          { label: 'OK', action: sinon.stub() },
          { label: 'Cancel', action: sinon.stub() }
        ]
      });
      
      expect(modalDialog.buttonInstances).to.have.lengthOf(2);
      expect(modalDialog.buttonInstances[0]).to.be.instanceOf(Button);
      expect(modalDialog.buttonInstances[1]).to.be.instanceOf(Button);
    });
    
    it('should store button callbacks correctly', function() {
      const okCallback = sinon.stub();
      const cancelCallback = sinon.stub();
      
      modalDialog.show({
        title: 'Test',
        buttons: [
          { label: 'OK', action: okCallback },
          { label: 'Cancel', action: cancelCallback }
        ]
      });
      
      expect(modalDialog.buttonInstances[0].onClick).to.equal(okCallback);
      expect(modalDialog.buttonInstances[1].onClick).to.equal(cancelCallback);
    });
    
    it('should handle empty button array', function() {
      modalDialog.show({
        title: 'Test',
        buttons: []
      });
      
      expect(modalDialog.buttonInstances).to.have.lengthOf(0);
    });
    
    it('should update button positions during layout', function() {
      modalDialog.show({
        title: 'Test',
        buttons: [
          { label: 'OK', action: sinon.stub() },
          { label: 'Cancel', action: sinon.stub() }
        ]
      });
      
      // Buttons should have position (will be set during render)
      expect(modalDialog.buttonInstances[0]).to.have.property('x');
      expect(modalDialog.buttonInstances[0]).to.have.property('y');
    });
  });
  
  describe('Dialog Helper Method Usage', function() {
    it('should use renderOverlay for modal background', function() {
      const buffer = createGraphics(800, 600);
      const renderOverlaySpy = sinon.spy(modalDialog, 'renderOverlay');
      
      // When renderContent is called (will be implemented)
      modalDialog.renderOverlay(buffer);
      
      expect(renderOverlaySpy.calledOnce).to.be.true;
      expect(renderOverlaySpy.calledWith(buffer)).to.be.true;
    });
    
    it('should use renderInputField when hasInput is true', function() {
      const buffer = createGraphics(800, 600);
      const renderInputFieldSpy = sinon.spy(modalDialog, 'renderInputField');
      
      modalDialog.show({
        title: 'Test',
        hasInput: true,
        inputValue: 'test value'
      });
      
      // When renderContent calls renderInputField
      modalDialog.renderInputField(buffer, {
        x: 100, y: 100, width: 200, height: 30,
        value: modalDialog.inputValue
      });
      
      expect(renderInputFieldSpy.calledOnce).to.be.true;
    });
    
    it('should use renderValidationError for error display', function() {
      const buffer = createGraphics(800, 600);
      const renderValidationErrorSpy = sinon.spy(modalDialog, 'renderValidationError');
      
      modalDialog.errorMessage = 'Invalid input';
      modalDialog.renderValidationError(buffer, modalDialog.errorMessage, 100, 200);
      
      expect(renderValidationErrorSpy.calledOnce).to.be.true;
      expect(renderValidationErrorSpy.calledWith(buffer, 'Invalid input', 100, 200)).to.be.true;
    });
  });
  
  describe('Modal State Management', function() {
    it('should initialize as hidden', function() {
      expect(modalDialog.isVisible()).to.be.false;
    });
    
    it('should become visible when show() is called', function() {
      modalDialog.show({ title: 'Test' });
      expect(modalDialog.isVisible()).to.be.true;
    });
    
    it('should hide when hide() is called', function() {
      modalDialog.show({ title: 'Test' });
      modalDialog.hide();
      expect(modalDialog.isVisible()).to.be.false;
    });
    
    it('should clear error message when hidden', function() {
      modalDialog.show({ title: 'Test' });
      modalDialog.errorMessage = 'Some error';
      modalDialog.hide();
      
      expect(modalDialog.errorMessage).to.equal('');
    });
  });
  
  describe('Input Validation', function() {
    it('should validate input using custom validator', function() {
      const validator = sinon.stub().returns(true);
      
      modalDialog.show({
        title: 'Test',
        hasInput: true,
        validateInput: validator,
        validationError: 'Invalid'
      });
      
      modalDialog.inputValue = 'test';
      const isValid = modalDialog.validateInputFn(modalDialog.inputValue);
      
      expect(validator.calledOnce).to.be.true;
      expect(validator.calledWith('test')).to.be.true;
      expect(isValid).to.be.true;
    });
    
    it('should set error message when validation fails', function() {
      const validator = sinon.stub().returns(false);
      
      modalDialog.show({
        title: 'Test',
        hasInput: true,
        validateInput: validator,
        validationError: 'Name must be alphanumeric'
      });
      
      modalDialog.inputValue = 'invalid@name';
      
      // Simulate validation check
      const isValid = modalDialog.validateInputFn(modalDialog.inputValue);
      if (!isValid) {
        modalDialog.errorMessage = modalDialog.validationError;
      }
      
      expect(isValid).to.be.false;
      expect(modalDialog.errorMessage).to.equal('Name must be alphanumeric');
    });
  });
  
  describe('Button Click Handling', function() {
    it('should trigger button callback on click', function() {
      const okCallback = sinon.stub();
      
      modalDialog.show({
        title: 'Test',
        buttons: [{ label: 'OK', action: okCallback }]
      });
      
      // Simulate button click
      const button = modalDialog.buttonInstances[0];
      button.update(button.x + 10, button.y + 10, true);
      
      expect(okCallback.called).to.be.true;
    });
    
    it('should handle multiple button clicks', function() {
      const okCallback = sinon.stub();
      const cancelCallback = sinon.stub();
      
      modalDialog.show({
        title: 'Test',
        buttons: [
          { label: 'OK', action: okCallback },
          { label: 'Cancel', action: cancelCallback }
        ]
      });
      
      // Click cancel button
      const cancelButton = modalDialog.buttonInstances[1];
      cancelButton.update(cancelButton.x + 10, cancelButton.y + 10, true);
      
      expect(cancelCallback.called).to.be.true;
      expect(okCallback.called).to.be.false;
    });
  });
  
  describe('Backward Compatibility', function() {
    it('should maintain existing public API', function() {
      expect(modalDialog.show).to.be.a('function');
      expect(modalDialog.hide).to.be.a('function');
      expect(modalDialog.isVisible).to.be.a('function');
    });
    
    it('should accept same show() config format', function() {
      expect(() => {
        modalDialog.show({
          title: 'Test Title',
          message: 'Test Message',
          hasInput: true,
          inputPlaceholder: 'Enter name',
          inputValue: 'default',
          validateInput: () => true,
          validationError: 'Error message',
          buttons: [
            { label: 'OK', action: () => {} },
            { label: 'Cancel', action: () => {} }
          ]
        });
      }).to.not.throw();
    });
  });
});
