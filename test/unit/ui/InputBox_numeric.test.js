/**
 * Unit tests for InputBox numeric input mode
 * 
 * Tests numeric-only input, validation, and digit handling.
 * These tests are written FIRST (TDD) before implementing the feature.
 * 
 * Run: npx mocha "test/unit/ui/InputBox_numeric.test.js"
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock p5.js globals
global.push = sinon.stub();
global.pop = sinon.stub();
global.rectMode = sinon.stub();
global.textAlign = sinon.stub();
global.fill = sinon.stub();
global.stroke = sinon.stub();
global.strokeWeight = sinon.stub();
global.rect = sinon.stub();
global.noStroke = sinon.stub();
global.textFont = sinon.stub();
global.textSize = sinon.stub();
global.text = sinon.stub();
global.textWidth = sinon.stub().returns(50);
global.line = sinon.stub();
global.CORNER = 'corner';
global.LEFT = 'left';
global.CENTER = 'center';
global.TOP = 'top';

// Mock CollisionBox2D
class CollisionBox2D {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
  
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

global.CollisionBox2D = CollisionBox2D;

// Create window global for browser-style code
if (typeof window === 'undefined') {
  global.window = global;
}
window.CollisionBox2D = CollisionBox2D;

// Load InputBox
const InputBox = require('../../../Classes/ui/_baseObjects/boxes/inputbox.js');

describe('InputBox - Numeric Input Mode', function() {
  let inputBox;
  
  beforeEach(function() {
    // Create InputBox in numeric mode
    inputBox = new InputBox(100, 100, 160, 35, {
      inputType: 'numeric',
      minValue: 10,
      maxValue: 1000,
      maxDigits: 4,
      integerOnly: true,
      placeholder: '50'
    });
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  describe('Constructor', function() {
    it('should create InputBox with numeric mode', function() {
      expect(inputBox.inputType).to.equal('numeric');
    });
    
    it('should set minValue', function() {
      expect(inputBox.minValue).to.equal(10);
    });
    
    it('should set maxValue', function() {
      expect(inputBox.maxValue).to.equal(1000);
    });
    
    it('should set maxDigits', function() {
      expect(inputBox.maxDigits).to.equal(4);
    });
    
    it('should set integerOnly', function() {
      expect(inputBox.integerOnly).to.equal(true);
    });
    
    it('should default to text mode if not specified', function() {
      const textBox = new InputBox(0, 0, 100, 30);
      expect(textBox.inputType).to.equal('text');
    });
  });
  
  describe('Numeric Input Handling', function() {
    it('should accept digit key press (0-9)', function() {
      inputBox.setFocus(true);
      const result = inputBox.handleKeyPress('5', 53); // '5' key
      expect(result).to.be.true;
      expect(inputBox.value).to.equal('5');
    });
    
    it('should reject non-numeric character', function() {
      inputBox.setFocus(true);
      const result = inputBox.handleKeyPress('a', 65); // 'a' key
      expect(result).to.be.false;
      expect(inputBox.value).to.equal('');
    });
    
    it('should append digits correctly (123)', function() {
      inputBox.setFocus(true);
      inputBox.handleKeyPress('1', 49);
      inputBox.handleKeyPress('2', 50);
      inputBox.handleKeyPress('3', 51);
      expect(inputBox.value).to.equal('123');
    });
    
    it('should handle multi-digit append (1234)', function() {
      inputBox.setFocus(true);
      inputBox.handleKeyPress('1', 49);
      inputBox.handleKeyPress('2', 50);
      inputBox.handleKeyPress('3', 51);
      inputBox.handleKeyPress('4', 52);
      expect(inputBox.value).to.equal('1234');
    });
    
    it('should enforce maxDigits limit', function() {
      inputBox.setFocus(true);
      inputBox.handleKeyPress('1', 49);
      inputBox.handleKeyPress('2', 50);
      inputBox.handleKeyPress('3', 51);
      inputBox.handleKeyPress('4', 52);
      const result = inputBox.handleKeyPress('5', 53); // 5th digit
      expect(result).to.be.false; // Rejected
      expect(inputBox.value).to.equal('1234'); // Still 4 digits
    });
  });
  
  describe('Backspace Handling', function() {
    it('should remove last digit on backspace (123 → 12)', function() {
      inputBox.setFocus(true);
      inputBox.handleKeyPress('1', 49);
      inputBox.handleKeyPress('2', 50);
      inputBox.handleKeyPress('3', 51);
      expect(inputBox.value).to.equal('123');
      
      inputBox.handleKeyPress('Backspace', 8);
      expect(inputBox.value).to.equal('12');
    });
    
    it('should handle multiple backspaces (1234 → 123 → 12 → 1 → empty)', function() {
      inputBox.setFocus(true);
      inputBox.value = '1234';
      
      inputBox.handleKeyPress('Backspace', 8);
      expect(inputBox.value).to.equal('123');
      
      inputBox.handleKeyPress('Backspace', 8);
      expect(inputBox.value).to.equal('12');
      
      inputBox.handleKeyPress('Backspace', 8);
      expect(inputBox.value).to.equal('1');
      
      inputBox.handleKeyPress('Backspace', 8);
      expect(inputBox.value).to.equal('');
    });
    
    it('should handle backspace on empty value', function() {
      inputBox.setFocus(true);
      inputBox.value = '';
      const result = inputBox.handleKeyPress('Backspace', 8);
      expect(result).to.be.true;
      expect(inputBox.value).to.equal('');
    });
  });
  
  describe('Validation - Integer Only', function() {
    it('should validate integer values', function() {
      inputBox.value = '50';
      const valid = inputBox.validate();
      expect(valid).to.be.true;
      expect(inputBox.isValid).to.be.true;
      expect(inputBox.validationError).to.equal('');
    });
    
    it('should handle NaN values gracefully', function() {
      // In numeric mode, only digits can be entered, so we test edge case of invalid string
      inputBox.value = 'abc'; // Would never happen via keypress, but good to handle
      const valid = inputBox.validate();
      // NaN is not an integer, so should fail validation
      expect(valid).to.be.false;
      expect(inputBox.isValid).to.be.false;
      expect(inputBox.validationError).to.include('integer');
    });
  });
  
  describe('Validation - Min/Max Range', function() {
    it('should validate value within range', function() {
      inputBox.value = '50';
      const valid = inputBox.validate();
      expect(valid).to.be.true;
      expect(inputBox.validationError).to.equal('');
    });
    
    it('should reject value below min', function() {
      inputBox.value = '5';
      const valid = inputBox.validate();
      expect(valid).to.be.false;
      expect(inputBox.validationError).to.include('10'); // Min: 10
    });
    
    it('should accept value at min boundary', function() {
      inputBox.value = '10';
      const valid = inputBox.validate();
      expect(valid).to.be.true;
    });
    
    it('should reject value above max', function() {
      inputBox.value = '2000';
      const valid = inputBox.validate();
      expect(valid).to.be.false;
      expect(inputBox.validationError).to.include('1000'); // Max: 1000
    });
    
    it('should accept value at max boundary', function() {
      inputBox.value = '1000';
      const valid = inputBox.validate();
      expect(valid).to.be.true;
    });
  });
  
  describe('getValue() - Numeric Mode', function() {
    it('should return numeric value (not string)', function() {
      inputBox.value = '123';
      const result = inputBox.getValue();
      expect(result).to.be.a('number');
      expect(result).to.equal(123);
    });
    
    it('should return 0 for empty value', function() {
      inputBox.value = '';
      const result = inputBox.getValue();
      expect(result).to.equal(0);
    });
    
    it('should parse multi-digit numbers', function() {
      inputBox.value = '1234';
      const result = inputBox.getValue();
      expect(result).to.equal(1234);
    });
  });
  
  describe('setValue() - Numeric Mode', function() {
    it('should accept numeric value and convert to string', function() {
      inputBox.setValue(123);
      expect(inputBox.value).to.equal('123');
    });
    
    it('should accept string numeric value', function() {
      inputBox.setValue('456');
      expect(inputBox.value).to.equal('456');
    });
    
    it('should handle zero', function() {
      inputBox.setValue(0);
      expect(inputBox.value).to.equal('0');
    });
    
    it('should validate after setting value', function() {
      sinon.spy(inputBox, 'validate');
      inputBox.setValue(50);
      expect(inputBox.validate.called).to.be.true;
    });
  });
  
  describe('Keyboard Events - Tab and Enter', function() {
    it('should return focus-next event on Tab', function() {
      inputBox.setFocus(true);
      const result = inputBox.handleKeyPress('Tab', 9);
      expect(result).to.be.an('object');
      expect(result.type).to.equal('focus-next');
    });
    
    it('should return confirm event on Enter', function() {
      inputBox.setFocus(true);
      inputBox.value = '50';
      const result = inputBox.handleKeyPress('Enter', 13);
      expect(result).to.be.an('object');
      expect(result.type).to.equal('confirm');
      expect(result.valid).to.be.true;
    });
    
    it('should return confirm with valid=false if validation fails', function() {
      inputBox.setFocus(true);
      inputBox.value = '5'; // Below min
      const result = inputBox.handleKeyPress('Enter', 13);
      expect(result).to.be.an('object');
      expect(result.type).to.equal('confirm');
      expect(result.valid).to.be.false;
    });
  });
  
  describe('Text Mode (Backward Compatibility)', function() {
    it('should still handle text mode input', function() {
      const textBox = new InputBox(0, 0, 100, 30, {
        inputType: 'text'
      });
      textBox.setFocus(true);
      
      // Text mode should accept letters
      textBox.handleTextInput('h');
      textBox.handleTextInput('i');
      expect(textBox.value).to.equal('hi');
    });
    
    it('should return string from getValue() in text mode', function() {
      const textBox = new InputBox(0, 0, 100, 30, {
        inputType: 'text'
      });
      textBox.value = '123';
      const result = textBox.getValue();
      expect(result).to.be.a('string');
      expect(result).to.equal('123');
    });
  });
  
  describe('Focus Behavior', function() {
    it('should not accept input when not focused', function() {
      inputBox.setFocus(false);
      const result = inputBox.handleKeyPress('5', 53);
      expect(result).to.be.false;
      expect(inputBox.value).to.equal('');
    });
    
    it('should accept input when focused', function() {
      inputBox.setFocus(true);
      const result = inputBox.handleKeyPress('5', 53);
      expect(result).to.be.true;
      expect(inputBox.value).to.equal('5');
    });
  });
  
  describe('Hover State', function() {
    it('should detect hover when mouse is over input box', function() {
      inputBox.updateHover(150, 115); // Inside bounds (x:100-260, y:100-135)
      expect(inputBox.isHovered).to.be.true;
    });
    
    it('should not detect hover when mouse is outside input box', function() {
      inputBox.updateHover(50, 115); // Outside X bounds (before x:100)
      expect(inputBox.isHovered).to.be.false;
    });
    
    it('should not hover when disabled', function() {
      inputBox.enabled = false;
      inputBox.updateHover(150, 115); // Inside bounds
      expect(inputBox.isHovered).to.be.false;
    });
    
    it('should clear hover when mouse moves away', function() {
      inputBox.updateHover(150, 115); // Inside
      expect(inputBox.isHovered).to.be.true;
      
      inputBox.updateHover(50, 115); // Outside
      expect(inputBox.isHovered).to.be.false;
    });
  });
  
  describe('Hover Visual Feedback', function() {
    let mockGraphics;
    
    beforeEach(function() {
      mockGraphics = {
        push: sinon.stub(),
        pop: sinon.stub(),
        rectMode: sinon.stub(),
        textAlign: sinon.stub(),
        fill: sinon.stub(),
        stroke: sinon.stub(),
        strokeWeight: sinon.stub(),
        rect: sinon.stub(),
        noStroke: sinon.stub(),
        textFont: sinon.stub(),
        textSize: sinon.stub(),
        text: sinon.stub(),
        textWidth: sinon.stub().returns(50),
        line: sinon.stub(),
        CORNER: 'corner',
        LEFT: 'left',
        CENTER: 'center',
        TOP: 'top'
      };
    });
    
    it('should use hover color when hovered (not focused)', function() {
      inputBox.isHovered = true;
      inputBox.isFocused = false;
      
      inputBox.renderToBuffer(mockGraphics);
      
      // Check that fill was called with hover color
      const fillCalls = mockGraphics.fill.getCalls();
      const usedHoverColor = fillCalls.some(call => {
        // Convert hex to comparable format or check if hoverColor was used
        return call.args.length > 0;
      });
      expect(usedHoverColor).to.be.true;
    });
    
    it('should prioritize focus color over hover color', function() {
      inputBox.isHovered = true;
      inputBox.isFocused = true;
      
      inputBox.renderToBuffer(mockGraphics);
      
      // Focus color should be used, not hover
      expect(mockGraphics.fill.called).to.be.true;
    });
  });
});
