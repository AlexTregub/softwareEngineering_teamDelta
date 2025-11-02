/**
 * Unit Tests for NewMapDialog (REFACTORED with InputBox + ButtonGroup)
 * 
 * Tests the NEW implementation using:
 * - InputBox (numeric mode) for width/height inputs
 * - ButtonGroup for Cancel/Create buttons
 * - Dialog.showWithCentering() for positioning
 * - Dialog.handleClickWithConversion() for click handling
 * 
 * TDD: Write tests FIRST, then refactor NewMapDialog to pass them.
 * 
 * Run: npx mocha "test/unit/ui/NewMapDialog_refactored.test.js"
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('NewMapDialog (Refactored)', function() {
  let NewMapDialog;
  let dialog;
  let mockGraphics;
  
  before(function() {
    // Setup JSDOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js graphics functions (comprehensive)
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
        rectMode: sinon.stub(),
        ellipse: sinon.stub(),
        line: sinon.stub(),
        text: sinon.stub(),
        textAlign: sinon.stub(),
        textSize: sinon.stub(),
        textFont: sinon.stub(),
        textWidth: sinon.stub().returns(50),
        push: sinon.stub(),
        pop: sinon.stub(),
        CENTER: 'center',
        LEFT: 'left',
        TOP: 'top'
      };
    });
    
    window.createGraphics = global.createGraphics;
    
    // Mock p5.js constants
    global.CENTER = 'center';
    global.LEFT = 'left';
    global.TOP = 'top';
    global.CORNER = 'corner';
    
    window.CENTER = global.CENTER;
    window.LEFT = global.LEFT;
    window.TOP = global.TOP;
    window.CORNER = global.CORNER;
    
    // Mock canvas dimensions
    global.g_canvasX = 1920;
    global.g_canvasY = 1080;
    
    // Load CollisionBox2D
    const CollisionBox2D = require('../../../Classes/systems/CollisionBox2D.js');
    global.CollisionBox2D = CollisionBox2D;
    window.CollisionBox2D = CollisionBox2D;
    
    // Load Button
    const Button = require('../../../Classes/systems/Button.js');
    global.Button = Button;
    window.Button = Button;
    
    // Load ButtonGroup
    const ButtonGroup = require('../../../Classes/ui/UIComponents/ButtonGroup.js');
    global.ButtonGroup = ButtonGroup;
    window.ButtonGroup = ButtonGroup;
    
    // Load InputBox
    const InputBox = require('../../../Classes/ui/_baseObjects/boxes/inputbox.js');
    global.InputBox = InputBox;
    window.InputBox = InputBox;
    
    // Load UIObject base class
    const UIObject = require('../../../Classes/ui/_baseObjects/UIObject.js');
    global.UIObject = UIObject;
    window.UIObject = UIObject;
    
    // Load Dialog base class
    const Dialog = require('../../../Classes/ui/_baseObjects/modalWindow/Dialog.js');
    global.Dialog = Dialog;
    window.Dialog = Dialog;
    
    // Load NewMapDialog (will use REFACTORED version)
    try {
      NewMapDialog = require('../../../Classes/ui/_baseObjects/modalWindow/NewMapDialog.js');
    } catch (e) {
      console.log('⚠️  NewMapDialog.js not yet refactored (expected for TDD)');
    }
  });
  
  beforeEach(function() {
    // Skip if NewMapDialog not loaded yet
    if (!NewMapDialog) {
      this.skip();
      return;
    }
    
    // Reset graphics mock (comprehensive p5.js Graphics mock)
    mockGraphics = {
      width: 400,
      height: 320,
      background: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      noFill: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      rectMode: sinon.stub(),
      ellipse: sinon.stub(),
      line: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      textFont: sinon.stub(),
      textWidth: sinon.stub().returns(50),
      push: sinon.stub(),
      pop: sinon.stub(),
      translate: sinon.stub(),
      rotate: sinon.stub(),
      scale: sinon.stub(),
      CENTER: 'center',
      LEFT: 'left',
      TOP: 'top'
    };
    
    global.createGraphics.resetHistory();
    global.createGraphics.returns(mockGraphics);
    
    dialog = new NewMapDialog();
  });
  
  describe('Constructor', function() {
    it('should create InputBox for width input', function() {
      expect(dialog.widthInput).to.exist;
      expect(dialog.widthInput).to.be.instanceOf(InputBox);
    });
    
    it('should create InputBox for height input', function() {
      expect(dialog.heightInput).to.exist;
      expect(dialog.heightInput).to.be.instanceOf(InputBox);
    });
    
    it('should configure width InputBox with numeric mode', function() {
      expect(dialog.widthInput.inputType).to.equal('numeric');
    });
    
    it('should configure height InputBox with numeric mode', function() {
      expect(dialog.heightInput.inputType).to.equal('numeric');
    });
    
    it('should set width InputBox min/max validation', function() {
      expect(dialog.widthInput.minValue).to.equal(10);
      expect(dialog.widthInput.maxValue).to.equal(1000);
    });
    
    it('should set height InputBox min/max validation', function() {
      expect(dialog.heightInput.minValue).to.equal(10);
      expect(dialog.heightInput.maxValue).to.equal(1000);
    });
    
    it('should position height InputBox below width InputBox', function() {
      // Width should be at Y=90, height at Y=140 (90 + 50 offset)
      expect(dialog.widthInput.bounds.y).to.equal(90);
      expect(dialog.heightInput.bounds.y).to.equal(140);
    });
    
    it('should set correct placeholder for width InputBox', function() {
      expect(dialog.widthInput.placeholder).to.equal('Width (tiles)');
    });
    
    it('should set correct placeholder for height InputBox', function() {
      expect(dialog.heightInput.placeholder).to.equal('Height (tiles)');
    });
    
    it('should share common options between both InputBoxes', function() {
      // Both should have same parent reference
      expect(dialog.widthInput.parent).to.equal(dialog);
      expect(dialog.heightInput.parent).to.equal(dialog);
      
      // Both should have same numeric constraints
      expect(dialog.widthInput.maxDigits).to.equal(4);
      expect(dialog.heightInput.maxDigits).to.equal(4);
      expect(dialog.widthInput.integerOnly).to.be.true;
      expect(dialog.heightInput.integerOnly).to.be.true;
    });
    
    it('should create ButtonGroup for buttons', function() {
      expect(dialog.buttonGroup).to.exist;
      expect(dialog.buttonGroup).to.be.instanceOf(ButtonGroup);
    });
    
    it('should configure ButtonGroup with horizontal orientation', function() {
      expect(dialog.buttonGroup.orientation).to.equal('horizontal');
    });
    
    it('should add Cancel button to ButtonGroup', function() {
      const cancelButton = dialog.buttonGroup.getButton('Cancel');
      expect(cancelButton).to.exist;
    });
    
    it('should add Create button to ButtonGroup', function() {
      const createButton = dialog.buttonGroup.getButton('Create');
      expect(createButton).to.exist;
    });
    
    it('should set default dimensions to 50x50', function() {
      expect(dialog.widthInput.getValue()).to.equal(50);
      expect(dialog.heightInput.getValue()).to.equal(50);
    });
  });
  
  describe('getDimensions()', function() {
    it('should return InputBox values', function() {
      dialog.widthInput.setValue(100);
      dialog.heightInput.setValue(200);
      
      const dims = dialog.getDimensions();
      expect(dims.width).to.equal(100);
      expect(dims.height).to.equal(200);
    });
  });
  
  describe('handleKeyPress()', function() {
    it('should delegate to width InputBox when width is focused', function() {
      dialog.widthInput.setFocus(true);
      dialog.heightInput.setFocus(false);
      
      const widthSpy = sinon.spy(dialog.widthInput, 'handleKeyPress');
      
      dialog.handleKeyPress('5', 53);
      
      expect(widthSpy.calledOnce).to.be.true;
      expect(widthSpy.calledWith('5', 53)).to.be.true;
    });
    
    it('should delegate to height InputBox when height is focused', function() {
      dialog.widthInput.setFocus(false);
      dialog.heightInput.setFocus(true);
      
      const heightSpy = sinon.spy(dialog.heightInput, 'handleKeyPress');
      
      dialog.handleKeyPress('8', 56);
      
      expect(heightSpy.calledOnce).to.be.true;
      expect(heightSpy.calledWith('8', 56)).to.be.true;
    });
    
    it('should handle Tab event from InputBox (switch focus)', function() {
      dialog.widthInput.setFocus(true);
      dialog.heightInput.setFocus(false);
      
      // InputBox returns {type: 'focus-next'} on Tab
      sinon.stub(dialog.widthInput, 'handleKeyPress').returns({ type: 'focus-next' });
      
      dialog.handleKeyPress('Tab', 9);
      
      expect(dialog.widthInput.isFocused).to.be.false;
      expect(dialog.heightInput.isFocused).to.be.true;
    });
    
    it('should handle Enter event from InputBox (confirm if valid)', function() {
      dialog.widthInput.setValue(50);
      dialog.heightInput.setValue(50);
      dialog.widthInput.setFocus(true);
      
      // InputBox returns {type: 'confirm', valid: true} on Enter
      sinon.stub(dialog.widthInput, 'handleKeyPress').returns({ type: 'confirm', valid: true });
      
      const confirmSpy = sinon.spy(dialog, 'confirm');
      
      dialog.handleKeyPress('Enter', 13);
      
      expect(confirmSpy.calledOnce).to.be.true;
    });
    
    it('should NOT confirm on Enter if InputBox validation fails', function() {
      dialog.widthInput.setValue(5); // Below min (10)
      dialog.widthInput.setFocus(true);
      
      // InputBox returns {type: 'confirm', valid: false} on Enter
      sinon.stub(dialog.widthInput, 'handleKeyPress').returns({ type: 'confirm', valid: false });
      
      const confirmSpy = sinon.spy(dialog, 'confirm');
      
      dialog.handleKeyPress('Enter', 13);
      
      expect(confirmSpy.called).to.be.false;
    });
    
    it('should call cancel() on Escape key', function() {
      const cancelSpy = sinon.spy(dialog, 'cancel');
      
      dialog.handleKeyPress('Escape', 27);
      
      expect(cancelSpy.calledOnce).to.be.true;
    });
  });
  
  describe('handleDialogClick()', function() {
    it('should check widthInput bounds and set focus', function() {
      dialog.widthInput.bounds = new CollisionBox2D(50, 80, 160, 35);
      
      const focusSpy = sinon.spy(dialog.widthInput, 'setFocus');
      
      // Click inside width input (relative coords)
      const handled = dialog.handleDialogClick(100, 90);
      
      expect(focusSpy.calledWith(true)).to.be.true;
      expect(handled).to.be.true;
    });
    
    it('should check heightInput bounds and set focus', function() {
      dialog.heightInput.bounds = new CollisionBox2D(50, 130, 160, 35);
      
      const focusSpy = sinon.spy(dialog.heightInput, 'setFocus');
      
      // Click inside height input (relative coords)
      const handled = dialog.handleDialogClick(100, 140);
      
      expect(focusSpy.calledWith(true)).to.be.true;
      expect(handled).to.be.true;
    });
    
    it('should delegate button clicks to ButtonGroup', function() {
      const buttonGroupSpy = sinon.spy(dialog.buttonGroup, 'handleClick');
      
      // Click in button area (relative coords)
      dialog.handleDialogClick(150, 270);
      
      expect(buttonGroupSpy.calledOnce).to.be.true;
      expect(buttonGroupSpy.calledWith(150, 270)).to.be.true;
    });
  });
  
  describe('show()', function() {
    it('should use showWithCentering() from Dialog parent', function() {
      const centerSpy = sinon.spy(dialog, 'showWithCentering');
      
      dialog.show();
      
      expect(centerSpy.calledOnce).to.be.true;
    });
    
    it('should reset InputBox values to defaults in onShow hook', function() {
      dialog.widthInput.setValue(999);
      dialog.heightInput.setValue(888);
      
      dialog.show();
      
      expect(dialog.widthInput.getValue()).to.equal(50);
      expect(dialog.heightInput.getValue()).to.equal(50);
    });
    
    it('should focus width InputBox by default', function() {
      dialog.show();
      
      expect(dialog.widthInput.isFocused).to.be.true;
      expect(dialog.heightInput.isFocused).to.be.false;
    });
  });
  
  describe('renderContent()', function() {
    it('should call widthInput.renderToBuffer()', function() {
      const widthSpy = sinon.spy(dialog.widthInput, 'renderToBuffer');
      
      dialog.renderContent(mockGraphics);
      
      expect(widthSpy.calledOnce).to.be.true;
      expect(widthSpy.calledWith(mockGraphics)).to.be.true;
    });
    
    it('should call heightInput.renderToBuffer()', function() {
      const heightSpy = sinon.spy(dialog.heightInput, 'renderToBuffer');
      
      dialog.renderContent(mockGraphics);
      
      expect(heightSpy.calledOnce).to.be.true;
      expect(heightSpy.calledWith(mockGraphics)).to.be.true;
    });
    
    it('should call buttonGroup.renderToBuffer()', function() {
      const buttonSpy = sinon.spy(dialog.buttonGroup, 'renderToBuffer');
      
      dialog.renderContent(mockGraphics);
      
      expect(buttonSpy.calledOnce).to.be.true;
      expect(buttonSpy.calledWith(mockGraphics)).to.be.true;
    });
    
    it('should render title text', function() {
      dialog.renderContent(mockGraphics);
      
      // Should render instructions
      expect(mockGraphics.text.called).to.be.true;
    });
    
    it('should render validation error if InputBox invalid', function() {
      dialog.widthInput.setValue(5); // Below min
      dialog.widthInput.validate(); // Trigger validation error
      
      dialog.renderContent(mockGraphics);
      
      // Should render error text
      const textCalls = mockGraphics.text.getCalls();
      const hasErrorText = textCalls.some(call => 
        call.args[0] && call.args[0].includes('Min')
      );
      expect(hasErrorText).to.be.true;
    });
  });
  
  describe('confirm()', function() {
    it('should call onConfirm callback with InputBox values', function() {
      dialog.widthInput.setValue(100);
      dialog.heightInput.setValue(200);
      
      const callback = sinon.spy();
      dialog.onConfirm = callback;
      
      dialog.confirm();
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.calledWith(100, 200)).to.be.true;
    });
    
    it('should hide dialog after confirm', function() {
      const hideSpy = sinon.spy(dialog, 'hide');
      
      dialog.confirm();
      
      expect(hideSpy.calledOnce).to.be.true;
    });
  });
  
  describe('Integration: Complete workflow', function() {
    it('should handle complete user interaction flow', function() {
      // 1. Show dialog
      dialog.show();
      expect(dialog.visible).to.be.true;
      expect(dialog.widthInput.getValue()).to.equal(50);
      
      // 2. User clears width and types new value
      dialog.widthInput.setValue(''); // Clear first
      dialog.widthInput.handleKeyPress('1', 49); // '1'
      dialog.widthInput.handleKeyPress('0', 48); // '0'
      dialog.widthInput.handleKeyPress('0', 48); // '0'
      expect(dialog.widthInput.getValue()).to.equal(100);
      
      // 3. User tabs to height
      const tabEvent = dialog.widthInput.handleKeyPress('Tab', 9);
      expect(tabEvent.type).to.equal('focus-next');
      dialog.widthInput.setFocus(false);
      dialog.heightInput.setFocus(true);
      
      // 4. User clears height and types new value
      dialog.heightInput.setValue(''); // Clear first
      dialog.heightInput.handleKeyPress('2', 50); // '2'
      dialog.heightInput.handleKeyPress('0', 48); // '0'
      dialog.heightInput.handleKeyPress('0', 48); // '0'
      expect(dialog.heightInput.getValue()).to.equal(200);
      
      // 5. User presses Enter to confirm
      const confirmCallback = sinon.spy();
      dialog.onConfirm = confirmCallback;
      
      const enterEvent = dialog.heightInput.handleKeyPress('Enter', 13);
      expect(enterEvent.type).to.equal('confirm');
      expect(enterEvent.valid).to.be.true;
      
      dialog.confirm();
      
      expect(confirmCallback.calledWith(100, 200)).to.be.true;
      expect(dialog.visible).to.be.false;
    });
  });
});
