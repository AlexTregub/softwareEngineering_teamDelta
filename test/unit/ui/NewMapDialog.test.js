/**
 * Unit Tests for NewMapDialog
 * 
 * Tests the modal dialog for entering map dimensions when creating a new level.
 * 
 * TDD Phase 1: Write FIRST (these tests should FAIL until implementation)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('NewMapDialog', function() {
  let NewMapDialog;
  let dialog;
  let mockGraphics;
  
  before(function() {
    // Setup JSDOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js graphics functions
    global.createGraphics = sinon.stub().callsFake((w, h) => {
      return {
        width: w,
        height: h,
        background: sinon.stub(),
        fill: sinon.stub(),
        stroke: sinon.stub(),
        strokeWeight: sinon.stub(),
        noFill: sinon.stub(),
        noStroke: sinon.stub(),
        rect: sinon.stub(),
        text: sinon.stub(),
        textAlign: sinon.stub(),
        textSize: sinon.stub(),
        textFont: sinon.stub(),
        textWrap: sinon.stub(),
        image: sinon.stub(),
        imageMode: sinon.stub(),
        rectMode: sinon.stub(),
        push: sinon.stub(),
        pop: sinon.stub(),
        translate: sinon.stub(),
        scale: sinon.stub(),
        tint: sinon.stub(),
        noTint: sinon.stub(),
        CENTER: 'center',
        LEFT: 'left',
        RIGHT: 'right',
        TOP: 'top',
        BOTTOM: 'bottom'
      };
    });
    
    window.createGraphics = global.createGraphics;
    
    // Mock p5.js constants
    global.CENTER = 'center';
    global.LEFT = 'left';
    global.RIGHT = 'right';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    global.WORD = 'word';
    
    window.CENTER = global.CENTER;
    window.LEFT = global.LEFT;
    window.RIGHT = global.RIGHT;
    window.TOP = global.TOP;
    window.BOTTOM = global.BOTTOM;
    window.WORD = global.WORD;
    
    // Mock p5.js functions for Button
    global.sin = Math.sin;
    global.frameCount = 0;
    global.color = sinon.stub().callsFake((r, g, b) => ({ r, g, b }));
    
    window.sin = global.sin;
    window.frameCount = global.frameCount;
    window.color = global.color;
    
    // Load CollisionBox2D (required by Button)
    const CollisionBox2D = require('../../../Classes/systems/CollisionBox2D.js');
    global.CollisionBox2D = CollisionBox2D;
    window.CollisionBox2D = CollisionBox2D;
    
    // Load Button (required by NewMapDialog)
    const Button = require('../../../Classes/systems/Button.js');
    global.Button = Button;
    window.Button = Button;
    
    // Load UIObject base class
    const UIObject = require('../../../Classes/ui/_baseObjects/UIObject.js');
    global.UIObject = UIObject;
    window.UIObject = UIObject;
    
    // Load Dialog base class
    const Dialog = require('../../../Classes/ui/_baseObjects/modalWindow/Dialog.js');
    global.Dialog = Dialog;
    window.Dialog = Dialog;
    
    // Load NewMapDialog
    try {
      NewMapDialog = require('../../../Classes/ui/_baseObjects/modalWindow/NewMapDialog.js');
    } catch (e) {
      // Expected to fail - we haven't created the file yet
      console.log('⚠️  NewMapDialog.js not found (expected for TDD)');
    }
  });
  
  beforeEach(function() {
    // Reset graphics mock (full mock with all Button.renderToBuffer() methods)
    mockGraphics = {
      width: 400,
      height: 300,
      background: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      noFill: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      textFont: sinon.stub(),
      textWrap: sinon.stub(),
      image: sinon.stub(),
      imageMode: sinon.stub(),
      rectMode: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      translate: sinon.stub(),
      scale: sinon.stub(),
      tint: sinon.stub(),
      noTint: sinon.stub(),
      CENTER: 'center',
      LEFT: 'left',
      RIGHT: 'right',
      TOP: 'top',
      BOTTOM: 'bottom'
    };
    
    global.createGraphics.resetHistory();
    global.createGraphics.returns(mockGraphics);
    
    // Create dialog instance (will fail until implemented)
    if (NewMapDialog) {
      dialog = new NewMapDialog();
    }
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with default width of 50 tiles', function() {
      if (!NewMapDialog) this.skip();
      
      expect(dialog).to.have.property('_width');
      expect(dialog._width).to.equal(50);
    });
    
    it('should initialize with default height of 50 tiles', function() {
      if (!NewMapDialog) this.skip();
      
      expect(dialog).to.have.property('_height');
      expect(dialog._height).to.equal(50);
    });
    
    it('should initialize with width as active field', function() {
      if (!NewMapDialog) this.skip();
      
      expect(dialog).to.have.property('_activeField');
      expect(dialog._activeField).to.equal('width');
    });
    
    it('should initialize with no validation error', function() {
      if (!NewMapDialog) this.skip();
      
      expect(dialog).to.have.property('_validationError');
      expect(dialog._validationError).to.equal('');
    });
    
    it('should define MIN_DIMENSION constant as 10', function() {
      if (!NewMapDialog) this.skip();
      
      expect(dialog).to.have.property('MIN_DIMENSION');
      expect(dialog.MIN_DIMENSION).to.equal(10);
    });
    
    it('should define MAX_DIMENSION constant as 200', function() {
      if (!NewMapDialog) this.skip();
      
      expect(dialog).to.have.property('MAX_DIMENSION');
      expect(dialog.MAX_DIMENSION).to.equal(1000);
    });
    
    it('should extend Dialog base class', function() {
      if (!NewMapDialog) this.skip();
      
      expect(dialog).to.be.an.instanceof(global.Dialog);
    });
    
    it('should set title to "New Map"', function() {
      if (!NewMapDialog) this.skip();
      
      expect(dialog.title).to.equal('New Map');
    });
  });
  
  describe('getDimensions()', function() {
    it('should return current width and height', function() {
      if (!NewMapDialog) this.skip();
      
      const dims = dialog.getDimensions();
      expect(dims).to.deep.equal({ width: 50, height: 50 });
    });
    
    it('should return updated dimensions after modification', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 30;
      dialog._height = 40;
      
      const dims = dialog.getDimensions();
      expect(dims).to.deep.equal({ width: 30, height: 40 });
    });
  });
  
  describe('setActiveField()', function() {
    it('should switch active field to width', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._activeField = 'height';
      dialog.setActiveField('width');
      
      expect(dialog._activeField).to.equal('width');
    });
    
    it('should switch active field to height', function() {
      if (!NewMapDialog) this.skip();
      
      dialog.setActiveField('height');
      
      expect(dialog._activeField).to.equal('height');
    });
    
    it('should mark dirty when switching fields', function() {
      if (!NewMapDialog) this.skip();
      
      const markDirtySpy = sinon.spy(dialog, 'markDirty');
      dialog.setActiveField('height');
      
      expect(markDirtySpy.calledOnce).to.be.true;
    });
  });
  
  describe('validateDimensions()', function() {
    it('should validate dimensions within bounds (10-200)', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 50;
      dialog._height = 50;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.true;
      expect(result.error).to.be.undefined;
    });
    
    it('should reject width below minimum (10)', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 5;
      dialog._height = 50;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.false;
      expect(result.error).to.include('10-1000');
    });
    
    it('should reject height below minimum (10)', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 50;
      dialog._height = 5;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.false;
      expect(result.error).to.include('10-1000');
    });
    
    it('should accept width at maximum (1000)', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 1000;
      dialog._height = 50;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.true;
    });
    
    it('should accept height at maximum (1000)', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 50;
      dialog._height = 1000;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.true;
    });
    
    it('should reject width above maximum (1000)', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 1001;
      dialog._height = 50;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.false;
      expect(result.error).to.include('10-1000');
    });
    
    it('should show performance warning for width > 200', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 250;
      dialog._height = 50;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.true;
      expect(result.warning).to.exist;
      expect(result.warning).to.include('run poorly');
    });
    
    it('should show performance warning for height > 200', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 50;
      dialog._height = 300;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.true;
      expect(result.warning).to.exist;
      expect(result.warning).to.include('run poorly');
    });
    
    it('should NOT show warning for 200x200 map', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 200;
      dialog._height = 200;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.true;
      expect(result.warning).to.be.undefined;
    });
    
    // Tests for old MAX_DIMENSION=200 removed
    // Now testing MAX_DIMENSION=1000 with warnings above 200
    
    it('should accept minimum boundary values (10, 10)', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 10;
      dialog._height = 10;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.true;
    });
    
    it('should accept maximum boundary values (200, 200)', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 200;
      dialog._height = 200;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.true;
    });
    
    it('should reject non-integer width', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 50.5;
      dialog._height = 50;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.false;
      expect(result.error).to.include('integer');
    });
    
    it('should reject non-integer height', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 50;
      dialog._height = 50.5;
      
      const result = dialog.validateDimensions();
      
      expect(result.valid).to.be.false;
      expect(result.error).to.include('integer');
    });
  });
  
  describe('handleKeyPress()', function() {
    it('should switch to height field on Tab key from width field', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._activeField = 'width';
      dialog.handleKeyPress('Tab', 9);
      
      expect(dialog._activeField).to.equal('height');
    });
    
    it('should switch to width field on Tab key from height field', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._activeField = 'height';
      dialog.handleKeyPress('Tab', 9);
      
      expect(dialog._activeField).to.equal('width');
    });
    
    it('should append numeric character to width field', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._activeField = 'width';
      dialog._width = 5;
      dialog.handleKeyPress('0', 48);
      
      expect(dialog._width).to.equal(50);
    });
    
    it('should append numeric character to height field', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._activeField = 'height';
      dialog._height = 3;
      dialog.handleKeyPress('0', 48);
      
      expect(dialog._height).to.equal(30);
    });
    
    it('should remove last digit on Backspace in width field', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._activeField = 'width';
      dialog._width = 50;
      dialog.handleKeyPress('Backspace', 8);
      
      expect(dialog._width).to.equal(5);
    });
    
    it('should remove last digit on Backspace in height field', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._activeField = 'height';
      dialog._height = 50;
      dialog.handleKeyPress('Backspace', 8);
      
      expect(dialog._height).to.equal(5);
    });
    
    it('should ignore non-numeric keys (letters)', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._activeField = 'width';
      dialog._width = 50;
      dialog.handleKeyPress('a', 65);
      
      expect(dialog._width).to.equal(50); // Unchanged
    });
    
    it('should call confirm() on Enter key if validation passes', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 50;
      dialog._height = 50;
      const confirmSpy = sinon.spy(dialog, 'confirm');
      
      dialog.handleKeyPress('Enter', 13);
      
      expect(confirmSpy.calledOnce).to.be.true;
    });
    
    it('should NOT call confirm() on Enter key if validation fails', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 5; // Invalid (below minimum)
      dialog._height = 50;
      const confirmSpy = sinon.spy(dialog, 'confirm');
      
      dialog.handleKeyPress('Enter', 13);
      
      expect(confirmSpy.called).to.be.false;
    });
    
    it('should call cancel() on Escape key', function() {
      if (!NewMapDialog) this.skip();
      
      const cancelSpy = sinon.spy(dialog, 'cancel');
      dialog.handleKeyPress('Escape', 27);
      
      expect(cancelSpy.calledOnce).to.be.true;
    });
    
    it('should return true when key is consumed', function() {
      if (!NewMapDialog) this.skip();
      
      const consumed = dialog.handleKeyPress('5', 53);
      
      expect(consumed).to.be.true;
    });
  });
  
  describe('handleClick()', function() {
    it('should set width field as active when width input clicked', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._activeField = 'height';
      dialog.setVisible(true);
      
      // Render content to initialize bounds
      dialog.renderContent(mockGraphics);
      
      // Click within width input bounds (based on renderContent layout)
      const widthInputX = 120; // centerX - 80 = 200 - 80 = 120 (relative to dialog)
      const widthInputY = 90;  // currentY at width input
      
      dialog.handleClick(widthInputX, widthInputY);
      
      expect(dialog._activeField).to.equal('width');
    });
    
    it('should set height field as active when height input clicked', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._activeField = 'width';
      dialog.setVisible(true);
      
      // Render content to initialize bounds
      dialog.renderContent(mockGraphics);
      
      // Click within height input bounds
      const heightInputX = 120;
      const heightInputY = 140; // currentY at height input (90 + 50)
      
      dialog.handleClick(heightInputX, heightInputY);
      
      expect(dialog._activeField).to.equal('height');
    });
    
    it('should call confirm() when Create button clicked with valid dimensions', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 50;
      dialog._height = 50;
      dialog.setVisible(true);
      
      // Render content to initialize bounds
      dialog.renderContent(mockGraphics);
      
      const confirmSpy = sinon.spy(dialog, 'confirm');
      
      // Click within Create button bounds
      // buttonY = height - 50 = 320 - 50 = 270
      // createX = 40 + 100 + 120 = 260
      const createButtonX = 260;
      const createButtonY = 270;
      
      dialog.handleClick(createButtonX, createButtonY);
      
      expect(confirmSpy.calledOnce).to.be.true;
    });
    
    it('should NOT call confirm() when Create button clicked with invalid dimensions', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 5; // Invalid
      dialog._height = 50;
      dialog.setVisible(true);
      
      // Render content to initialize bounds
      dialog.renderContent(mockGraphics);
      
      const confirmSpy = sinon.spy(dialog, 'confirm');
      
      // Click within Create button bounds
      const createButtonX = 260;
      const createButtonY = 270;
      
      dialog.handleClick(createButtonX, createButtonY);
      
      expect(confirmSpy.called).to.be.false;
    });
    
    it('should call cancel() when Cancel button clicked', function() {
      if (!NewMapDialog) this.skip();
      
      dialog.setVisible(true);
      
      // Render content to initialize bounds
      dialog.renderContent(mockGraphics);
      
      const cancelSpy = sinon.spy(dialog, 'cancel');
      
      // Click within Cancel button bounds
      // cancelX = 40
      const cancelButtonX = 40;
      const cancelButtonY = 270;
      
      dialog.handleClick(cancelButtonX, cancelButtonY);
      
      expect(cancelSpy.calledOnce).to.be.true;
    });
    
    it('should return true when click is within dialog bounds', function() {
      if (!NewMapDialog) this.skip();
      
      dialog.setVisible(true);
      
      // Render content to initialize bounds
      dialog.renderContent(mockGraphics);
      
      const consumed = dialog.handleClick(200, 150);
      
      expect(consumed).to.be.true;
    });
  });
  
  describe('confirm()', function() {
    it('should call onConfirm callback with width and height', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 30;
      dialog._height = 40;
      
      const onConfirmSpy = sinon.spy();
      dialog.onConfirm = onConfirmSpy;
      
      dialog.confirm();
      
      expect(onConfirmSpy.calledOnce).to.be.true;
      expect(onConfirmSpy.calledWith(30, 40)).to.be.true;
    });
    
    it('should hide dialog after confirm', function() {
      if (!NewMapDialog) this.skip();
      
      dialog.onConfirm = sinon.spy();
      dialog.setVisible(true);
      
      dialog.confirm();
      
      expect(dialog.visible).to.be.false;
    });
  });
  
  describe('show()', function() {
    it('should reset width to default (50) when shown', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 100;
      dialog.show();
      
      expect(dialog._width).to.equal(50);
    });
    
    it('should reset height to default (50) when shown', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._height = 100;
      dialog.show();
      
      expect(dialog._height).to.equal(50);
    });
    
    it('should reset active field to width when shown', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._activeField = 'height';
      dialog.show();
      
      expect(dialog._activeField).to.equal('width');
    });
    
    it('should clear validation error when shown', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._validationError = 'Previous error';
      dialog.show();
      
      expect(dialog._validationError).to.equal('');
    });
    
    it('should set dialog as visible', function() {
      if (!NewMapDialog) this.skip();
      
      dialog.show();
      
      expect(dialog.visible).to.be.true;
    });
  });
  
  describe('hide()', function() {
    it('should set dialog as not visible', function() {
      if (!NewMapDialog) this.skip();
      
      dialog.setVisible(true);
      dialog.hide();
      
      expect(dialog.visible).to.be.false;
    });
    
    it('should NOT clear callbacks when hidden (persist across uses)', function() {
      if (!NewMapDialog) this.skip();
      
      const confirmSpy = sinon.spy();
      const cancelSpy = sinon.spy();
      
      dialog.onConfirm = confirmSpy;
      dialog.onCancel = cancelSpy;
      
      dialog.hide();
      
      // Callbacks should persist so dialog can be reused
      expect(dialog.onConfirm).to.equal(confirmSpy);
      expect(dialog.onCancel).to.equal(cancelSpy);
    });
    
    it('should maintain callbacks across multiple show/hide cycles', function() {
      if (!NewMapDialog) this.skip();
      
      const confirmSpy = sinon.spy();
      
      // Set callback once (like LevelEditor does in constructor)
      dialog.onConfirm = confirmSpy;
      
      // First use
      dialog.show();
      dialog.hide();
      
      // Second use
      dialog.show();
      dialog._width = 100;
      dialog._height = 100;
      dialog.confirm();
      
      // Callback should have been called on second use
      expect(confirmSpy.calledOnce).to.be.true;
      expect(confirmSpy.calledWith(100, 100)).to.be.true;
    });
  });
  
  describe('renderContent()', function() {
    it('should render width label text', function() {
      if (!NewMapDialog) this.skip();
      
      dialog.renderContent(mockGraphics);
      
      expect(mockGraphics.text.called).to.be.true;
      const calls = mockGraphics.text.getCalls();
      const hasWidthLabel = calls.some(call => 
        call.args[0] && call.args[0].toString().toLowerCase().includes('width')
      );
      expect(hasWidthLabel).to.be.true;
    });
    
    it('should render height label text', function() {
      if (!NewMapDialog) this.skip();
      
      dialog.renderContent(mockGraphics);
      
      expect(mockGraphics.text.called).to.be.true;
      const calls = mockGraphics.text.getCalls();
      const hasHeightLabel = calls.some(call => 
        call.args[0] && call.args[0].toString().toLowerCase().includes('height')
      );
      expect(hasHeightLabel).to.be.true;
    });
    
    it('should render width value', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 75;
      dialog.renderContent(mockGraphics);
      
      expect(mockGraphics.text.called).to.be.true;
      const calls = mockGraphics.text.getCalls();
      const hasWidthValue = calls.some(call => 
        call.args[0] && call.args[0].toString().includes('75')
      );
      expect(hasWidthValue).to.be.true;
    });
    
    it('should render height value', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._height = 85;
      dialog.renderContent(mockGraphics);
      
      expect(mockGraphics.text.called).to.be.true;
      const calls = mockGraphics.text.getCalls();
      const hasHeightValue = calls.some(call => 
        call.args[0] && call.args[0].toString().includes('85')
      );
      expect(hasHeightValue).to.be.true;
    });
    
    it('should render validation hint text', function() {
      if (!NewMapDialog) this.skip();
      
      dialog.renderContent(mockGraphics);
      
      expect(mockGraphics.text.called).to.be.true;
      const calls = mockGraphics.text.getCalls();
      const hasHint = calls.some(call => 
        call.args[0] && call.args[0].toString().includes('10') && 
        call.args[0].toString().includes('1000')
      );
      expect(hasHint).to.be.true;
    });
    
    it('should render error message when validation fails', function() {
      if (!NewMapDialog) this.skip();
      
      dialog._width = 5; // Invalid
      dialog._validationError = 'Dimensions must be 10-200 tiles';
      dialog.renderContent(mockGraphics);
      
      expect(mockGraphics.text.called).to.be.true;
      const calls = mockGraphics.text.getCalls();
      const hasError = calls.some(call => 
        call.args[0] && call.args[0].toString().includes('must be')
      );
      expect(hasError).to.be.true;
    });
    
    it('should render Create button', function() {
      if (!NewMapDialog) this.skip();
      
      dialog.renderContent(mockGraphics);
      
      expect(mockGraphics.text.called).to.be.true;
      const calls = mockGraphics.text.getCalls();
      const hasCreateButton = calls.some(call => 
        call.args[0] && call.args[0].toString().toLowerCase().includes('create')
      );
      expect(hasCreateButton).to.be.true;
    });
    
    it('should render Cancel button', function() {
      if (!NewMapDialog) this.skip();
      
      dialog.renderContent(mockGraphics);
      
      expect(mockGraphics.text.called).to.be.true;
      const calls = mockGraphics.text.getCalls();
      const hasCancelButton = calls.some(call => 
        call.args[0] && call.args[0].toString().toLowerCase().includes('cancel')
      );
      expect(hasCancelButton).to.be.true;
    });
  });
});
