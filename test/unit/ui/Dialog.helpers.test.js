/**
 * Unit Tests for Dialog Base Class - Helper Methods
 * 
 * Tests new helper methods being added to Dialog base class:
 * - renderOverlay() - Modal background overlay
 * - renderButton() - Button rendering
 * - renderInputField() - Input field rendering
 * - isPointInBounds() - Bounds checking utility
 * - renderValidationError() - Validation error display
 * 
 * TDD APPROACH: These tests are written BEFORE implementation.
 * All tests will FAIL initially. Implementation in Phase 3 will make them pass.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Dialog Helper Methods (TDD)', function() {
  let Dialog;
  let UIObject;
  let mockBuffer;
  let dialog;
  
  beforeEach(function() {
    // Mock p5.js Graphics buffer
    mockBuffer = {
      fill: sinon.stub(),
      noFill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      background: sinon.stub(),
      CENTER: 3,
      LEFT: 37,
      TOP: 101,
      CORNER: 0
    };
    
    // Mock UIObject
    global.UIObject = class {
      constructor(config) {
        this.width = config.width || 500;
        this.height = config.height || 300;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.visible = config.visible !== undefined ? config.visible : false;
      }
      
      setVisible(visible) {
        this.visible = visible;
      }
      
      markDirty() {}
      
      getCenteredPosition(screenWidth, screenHeight) {
        return {
          x: (screenWidth - this.width) / 2,
          y: (screenHeight - this.height) / 2
        };
      }
    };
    
    // Sync to window (if available)
    if (typeof window !== 'undefined') {
      window.UIObject = global.UIObject;
    }
    
    // Load Dialog class
    Dialog = require('../../../Classes/ui/_baseObjects/modalWindow/Dialog');
    
    // Create dialog instance
    dialog = new Dialog({
      width: 400,
      height: 300,
      title: 'Test Dialog'
    });
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.UIObject;
    if (typeof window !== 'undefined') {
      delete window.UIObject;
    }
  });
  
  // ===== renderOverlay() Tests =====
  describe('renderOverlay(buffer, opacity)', function() {
    it('should render semi-transparent overlay at default opacity (180)', function() {
      // Expected: fill(0, 0, 0, 180), rect covering full screen
      dialog.renderOverlay(mockBuffer);
      
      expect(mockBuffer.fill.calledWith(0, 0, 0, 180)).to.be.true;
      expect(mockBuffer.noStroke.called).to.be.true;
      expect(mockBuffer.rect.called).to.be.true;
    });
    
    it('should render overlay with custom opacity', function() {
      dialog.renderOverlay(mockBuffer, 200);
      
      expect(mockBuffer.fill.calledWith(0, 0, 0, 200)).to.be.true;
    });
    
    it('should use screen dimensions for overlay size', function() {
      // Mock global canvas dimensions
      global.g_canvasX = 1920;
      global.g_canvasY = 1080;
      
      dialog.renderOverlay(mockBuffer);
      
      expect(mockBuffer.rect.calledWith(0, 0, 1920, 1080)).to.be.true;
      
      delete global.g_canvasX;
      delete global.g_canvasY;
    });
    
    it('should use fallback dimensions if globals not available', function() {
      dialog.renderOverlay(mockBuffer);
      
      // Should use fallback (1920x1080 is default)
      const rectArgs = mockBuffer.rect.getCall(0).args;
      expect(rectArgs[0]).to.equal(0); // x
      expect(rectArgs[1]).to.equal(0); // y
      expect(rectArgs[2]).to.be.a('number'); // width
      expect(rectArgs[3]).to.be.a('number'); // height
    });
    
    it('should handle null buffer gracefully', function() {
      expect(() => dialog.renderOverlay(null)).to.not.throw();
    });
  });
  
  // ===== renderButton() Tests =====
  describe('renderButton(buffer, config)', function() {
    it('should render enabled button with correct style', function() {
      const config = {
        label: 'Save',
        x: 100,
        y: 200,
        width: 100,
        height: 35,
        enabled: true
      };
      
      const bounds = dialog.renderButton(mockBuffer, config);
      
      // Should render blue background for enabled
      expect(mockBuffer.fill.calledWith(100, 150, 255)).to.be.true;
      // Should render button rect
      expect(mockBuffer.rect.calledWith(100, 200, 100, 35, 5)).to.be.true;
      // Should render label
      expect(mockBuffer.text.calledWith('Save')).to.be.true;
      
      // Should return bounds for click detection
      expect(bounds).to.deep.equal({ x: 100, y: 200, width: 100, height: 35 });
    });
    
    it('should render disabled button with gray style', function() {
      const config = {
        label: 'Create',
        x: 50,
        y: 150,
        width: 100,
        height: 35,
        enabled: false
      };
      
      dialog.renderButton(mockBuffer, config);
      
      // Should render gray background for disabled
      expect(mockBuffer.fill.calledWith(60)).to.be.true;
      // Should use gray text
      const textColor = mockBuffer.fill.getCalls().find(call => call.args[0] === 120);
      expect(textColor).to.exist;
    });
    
    it('should use default dimensions if not provided', function() {
      const config = {
        label: 'OK',
        x: 0,
        y: 0
      };
      
      const bounds = dialog.renderButton(mockBuffer, config);
      
      expect(bounds.width).to.be.a('number');
      expect(bounds.height).to.be.a('number');
    });
    
    it('should handle primary button style', function() {
      const config = {
        label: 'Confirm',
        x: 10,
        y: 10,
        enabled: true,
        primary: true
      };
      
      dialog.renderButton(mockBuffer, config);
      
      // Primary buttons should have distinctive styling
      expect(mockBuffer.fill.called).to.be.true;
    });
    
    it('should center button label text', function() {
      const config = {
        label: 'Test',
        x: 100,
        y: 100,
        width: 120,
        height: 40
      };
      
      dialog.renderButton(mockBuffer, config);
      
      expect(mockBuffer.textAlign.calledWith(mockBuffer.CENTER, mockBuffer.CENTER)).to.be.true;
      // Text should be centered in button
      expect(mockBuffer.text.calledWith('Test', 160, 120)).to.be.true; // x+width/2, y+height/2
    });
    
    it('should handle null buffer gracefully', function() {
      const config = { label: 'Test', x: 0, y: 0 };
      expect(() => dialog.renderButton(null, config)).to.not.throw();
    });
  });
  
  // ===== renderInputField() Tests =====
  describe('renderInputField(buffer, config)', function() {
    it('should render input field with label and value', function() {
      const config = {
        label: 'Width',
        value: '50',
        x: 100,
        y: 100,
        width: 160,
        height: 35,
        isActive: false
      };
      
      const bounds = dialog.renderInputField(mockBuffer, config);
      
      // Should render label above input
      expect(mockBuffer.text.calledWith('Width:', 100, 80)).to.be.true; // y - 20
      // Should render input box
      expect(mockBuffer.rect.calledWith(100, 100, 160, 35, 3)).to.be.true;
      // Should render value
      expect(mockBuffer.text.calledWith('50')).to.be.true;
      
      // Should return bounds
      expect(bounds).to.deep.equal({ x: 100, y: 100, width: 160, height: 35 });
    });
    
    it('should highlight active input field', function() {
      const config = {
        label: 'Height',
        value: '100',
        x: 50,
        y: 50,
        isActive: true
      };
      
      dialog.renderInputField(mockBuffer, config);
      
      // Active field should have yellow border
      expect(mockBuffer.stroke.calledWith(255, 200, 0)).to.be.true;
      expect(mockBuffer.strokeWeight.calledWith(2)).to.be.true;
    });
    
    it('should render inactive field with subtle border', function() {
      const config = {
        label: 'Name',
        value: 'test',
        x: 0,
        y: 0,
        isActive: false
      };
      
      dialog.renderInputField(mockBuffer, config);
      
      // Inactive field should have gray border
      expect(mockBuffer.stroke.calledWith(80)).to.be.true;
      expect(mockBuffer.strokeWeight.calledWith(1)).to.be.true;
    });
    
    it('should render placeholder text when value is empty', function() {
      const config = {
        label: 'Filename',
        value: '',
        placeholder: 'Enter filename...',
        x: 0,
        y: 0
      };
      
      dialog.renderInputField(mockBuffer, config);
      
      // Should render placeholder in gray
      const grayFill = mockBuffer.fill.getCalls().find(call => call.args[0] === 150);
      expect(grayFill).to.exist;
      expect(mockBuffer.text.calledWith('Enter filename...')).to.be.true;
    });
    
    it('should use default dimensions if not provided', function() {
      const config = {
        label: 'Field',
        value: 'value',
        x: 10,
        y: 10
      };
      
      const bounds = dialog.renderInputField(mockBuffer, config);
      
      expect(bounds.width).to.be.a('number');
      expect(bounds.height).to.be.a('number');
    });
    
    it('should render suffix text if provided', function() {
      const config = {
        label: 'Size',
        value: '32',
        suffix: 'px',
        x: 0,
        y: 0,
        width: 100
      };
      
      dialog.renderInputField(mockBuffer, config);
      
      // Should render suffix to right of input
      expect(mockBuffer.text.calledWith('px', 110)).to.be.true; // x + width + 10
    });
    
    it('should handle null buffer gracefully', function() {
      const config = { label: 'Test', value: '123', x: 0, y: 0 };
      expect(() => dialog.renderInputField(null, config)).to.not.throw();
    });
  });
  
  // ===== isPointInBounds() Tests =====
  describe('isPointInBounds(x, y, bounds)', function() {
    it('should return true when point is inside bounds', function() {
      const bounds = { x: 100, y: 100, width: 200, height: 100 };
      
      expect(dialog.isPointInBounds(150, 150, bounds)).to.be.true;
      expect(dialog.isPointInBounds(100, 100, bounds)).to.be.true; // Top-left corner
      expect(dialog.isPointInBounds(299, 199, bounds)).to.be.true; // Bottom-right (inside)
    });
    
    it('should return false when point is outside bounds', function() {
      const bounds = { x: 100, y: 100, width: 200, height: 100 };
      
      expect(dialog.isPointInBounds(50, 150, bounds)).to.be.false; // Left of bounds
      expect(dialog.isPointInBounds(150, 50, bounds)).to.be.false; // Above bounds
      expect(dialog.isPointInBounds(350, 150, bounds)).to.be.false; // Right of bounds
      expect(dialog.isPointInBounds(150, 250, bounds)).to.be.false; // Below bounds
    });
    
    it('should handle boundary edges correctly', function() {
      const bounds = { x: 0, y: 0, width: 100, height: 50 };
      
      expect(dialog.isPointInBounds(0, 0, bounds)).to.be.true; // Top-left
      expect(dialog.isPointInBounds(100, 0, bounds)).to.be.true; // Top-right
      expect(dialog.isPointInBounds(0, 50, bounds)).to.be.true; // Bottom-left
      expect(dialog.isPointInBounds(100, 50, bounds)).to.be.true; // Bottom-right
      
      expect(dialog.isPointInBounds(101, 25, bounds)).to.be.false; // Just outside right
      expect(dialog.isPointInBounds(50, 51, bounds)).to.be.false; // Just outside bottom
    });
    
    it('should handle negative coordinates', function() {
      const bounds = { x: -100, y: -50, width: 200, height: 100 };
      
      expect(dialog.isPointInBounds(-50, 0, bounds)).to.be.true;
      expect(dialog.isPointInBounds(-150, 0, bounds)).to.be.false;
    });
  });
  
  // ===== renderValidationError() Tests =====
  describe('renderValidationError(buffer, error, x, y)', function() {
    it('should render error message in red', function() {
      dialog.renderValidationError(mockBuffer, 'Invalid input', 100, 200);
      
      // Should use red color
      expect(mockBuffer.fill.calledWith(255, 100, 100)).to.be.true;
      // Should render error text
      expect(mockBuffer.text.calledWith('Invalid input', 100, 200)).to.be.true;
    });
    
    it('should center-align error text', function() {
      dialog.renderValidationError(mockBuffer, 'Error', 50, 50);
      
      expect(mockBuffer.textAlign.calledWith(mockBuffer.CENTER, mockBuffer.TOP)).to.be.true;
    });
    
    it('should use small font size for errors', function() {
      dialog.renderValidationError(mockBuffer, 'Error', 0, 0);
      
      expect(mockBuffer.textSize.calledWith(12)).to.be.true;
    });
    
    it('should handle empty error string', function() {
      dialog.renderValidationError(mockBuffer, '', 0, 0);
      
      // Should not render text if error is empty
      expect(mockBuffer.text.called).to.be.false;
    });
    
    it('should handle multi-line errors', function() {
      const multiLineError = 'Error line 1\\nError line 2';
      dialog.renderValidationError(mockBuffer, multiLineError, 100, 100);
      
      expect(mockBuffer.text.called).to.be.true;
    });
    
    it('should handle null buffer gracefully', function() {
      expect(() => dialog.renderValidationError(null, 'Error', 0, 0)).to.not.throw();
    });
  });
  
  // ===== Integration Tests =====
  describe('Integration: Using Multiple Helpers Together', function() {
    it('should render complete dialog with overlay, inputs, and buttons', function() {
      // Simulate rendering a dialog with all helper methods
      dialog.renderOverlay(mockBuffer);
      
      const widthBounds = dialog.renderInputField(mockBuffer, {
        label: 'Width',
        value: '50',
        x: 100,
        y: 100,
        isActive: true
      });
      
      const heightBounds = dialog.renderInputField(mockBuffer, {
        label: 'Height',
        value: '50',
        x: 100,
        y: 150,
        isActive: false
      });
      
      dialog.renderValidationError(mockBuffer, 'Invalid dimensions', 100, 220);
      
      const saveBounds = dialog.renderButton(mockBuffer, {
        label: 'Save',
        x: 80,
        y: 250,
        enabled: false
      });
      
      const cancelBounds = dialog.renderButton(mockBuffer, {
        label: 'Cancel',
        x: 200,
        y: 250,
        enabled: true
      });
      
      // Verify all components rendered
      expect(mockBuffer.fill.called).to.be.true;
      expect(mockBuffer.rect.called).to.be.true;
      expect(mockBuffer.text.called).to.be.true;
      
      // Verify bounds returned for click detection
      expect(widthBounds).to.exist;
      expect(heightBounds).to.exist;
      expect(saveBounds).to.exist;
      expect(cancelBounds).to.exist;
      
      // Test click detection on returned bounds
      expect(dialog.isPointInBounds(150, 120, widthBounds)).to.be.true;
      expect(dialog.isPointInBounds(250, 265, cancelBounds)).to.be.true;
    });
  });
  
  // ===== Backward Compatibility Tests =====
  describe('Backward Compatibility', function() {
    it('should not break existing Dialog methods', function() {
      expect(dialog.show).to.be.a('function');
      expect(dialog.hide).to.be.a('function');
      expect(dialog.confirm).to.be.a('function');
      expect(dialog.cancel).to.be.a('function');
      expect(dialog.handleKeyPress).to.be.a('function');
      expect(dialog.getCenteredPosition).to.be.a('function');
    });
    
    it('should preserve existing properties', function() {
      expect(dialog.title).to.equal('Test Dialog');
      expect(dialog.width).to.equal(400);
      expect(dialog.height).to.equal(300);
      expect(dialog.visible).to.be.false;
    });
  });
});
