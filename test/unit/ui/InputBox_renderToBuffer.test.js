/**
 * Unit tests for InputBox.renderToBuffer() method
 * 
 * Tests buffer rendering support (for dialog buffer contexts).
 * These tests are written FIRST (TDD) before implementing the feature.
 * 
 * Run: npx mocha "test/unit/ui/InputBox_renderToBuffer.test.js"
 */

const { expect } = require('chai');
const sinon = require('sinon');

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

describe('InputBox - renderToBuffer() Method', function() {
  let inputBox;
  let mockBuffer;
  
  beforeEach(function() {
    // Create mock buffer object (p5.Graphics-like)
    mockBuffer = {
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
    
    // Create InputBox in text mode
    inputBox = new InputBox(100, 100, 160, 35, {
      inputType: 'text',
      placeholder: 'Enter text',
      value: ''
    });
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  describe('Basic Rendering', function() {
    it('should have renderToBuffer method', function() {
      expect(inputBox.renderToBuffer).to.be.a('function');
    });
    
    it('should call buffer.push() and buffer.pop()', function() {
      inputBox.renderToBuffer(mockBuffer);
      expect(mockBuffer.push.called).to.be.true;
      expect(mockBuffer.pop.called).to.be.true;
    });
    
    it('should call buffer.fill() not global fill()', function() {
      inputBox.renderToBuffer(mockBuffer);
      expect(mockBuffer.fill.called).to.be.true;
    });
    
    it('should call buffer.rect() not global rect()', function() {
      inputBox.renderToBuffer(mockBuffer);
      expect(mockBuffer.rect.called).to.be.true;
    });
    
    it('should call buffer.text() not global text()', function() {
      inputBox.value = 'test';
      inputBox.renderToBuffer(mockBuffer);
      expect(mockBuffer.text.called).to.be.true;
    });
    
    it('should handle null buffer gracefully', function() {
      expect(() => inputBox.renderToBuffer(null)).to.not.throw();
    });
  });
  
  describe('Focus State Rendering', function() {
    it('should render focused state correctly', function() {
      inputBox.setFocus(true);
      inputBox.renderToBuffer(mockBuffer);
      
      // Should call buffer methods for focus highlight
      expect(mockBuffer.fill.called).to.be.true;
      expect(mockBuffer.rect.called).to.be.true;
    });
    
    it('should render unfocused state correctly', function() {
      inputBox.setFocus(false);
      inputBox.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.fill.called).to.be.true;
      expect(mockBuffer.rect.called).to.be.true;
    });
    
    it('should render cursor when focused', function() {
      inputBox.setFocus(true);
      inputBox.cursorVisible = true;
      inputBox.renderToBuffer(mockBuffer);
      
      // Should call buffer.line() for cursor
      expect(mockBuffer.line.called).to.be.true;
    });
  });
  
  describe('Validation Error Rendering', function() {
    it('should render validation error when invalid', function() {
      inputBox.isValid = false;
      inputBox.validationError = 'Invalid input';
      inputBox.renderToBuffer(mockBuffer);
      
      // Should render error text
      expect(mockBuffer.text.called).to.be.true;
    });
    
    it('should not render error when valid', function() {
      inputBox.isValid = true;
      inputBox.validationError = '';
      inputBox.value = 'valid';
      inputBox.renderToBuffer(mockBuffer);
      
      // Text should be called only once (for value, not error)
      expect(mockBuffer.text.callCount).to.equal(1);
    });
  });
  
  describe('Numeric Mode Rendering', function() {
    it('should render numeric value correctly', function() {
      const numericBox = new InputBox(0, 0, 100, 30, {
        inputType: 'numeric',
        minValue: 10,
        maxValue: 100
      });
      numericBox.value = '50';
      
      numericBox.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.text.called).to.be.true;
    });
  });
});
