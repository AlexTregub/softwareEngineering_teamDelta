/**
 * Unit tests for Button.renderToBuffer() method
 * 
 * Tests buffer-based rendering for use in Dialog contexts (buffer rendering).
 * renderToBuffer() should render to a p5.Graphics buffer instead of the main canvas.
 * 
 * TDD: Tests written FIRST, then implementation.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('Button.renderToBuffer()', function() {
  let Button;
  let CollisionBox2D;
  let mockBuffer;
  let button;

  before(function() {
    // Set up JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;

    // Mock p5.js constants
    global.CENTER = 'center';
    global.CORNER = 'corner';
    global.WORD = 'word';

    window.CENTER = global.CENTER;
    window.CORNER = global.CORNER;
    window.WORD = global.WORD;

    // Mock p5.js functions (for buffer context)
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.translate = sinon.stub();
    global.scale = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.noTint = sinon.stub();
    global.tint = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.image = sinon.stub();
    global.imageMode = sinon.stub();
    global.rectMode = sinon.stub();
    global.textAlign = sinon.stub();
    global.textFont = sinon.stub();
    global.textSize = sinon.stub();
    global.textWrap = sinon.stub();
    global.sin = Math.sin;
    global.frameCount = 0;
    global.color = sinon.stub().callsFake((r, g, b) => ({ r, g, b }));

    // Sync to window
    window.push = global.push;
    window.pop = global.pop;
    window.translate = global.translate;
    window.scale = global.scale;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.strokeWeight = global.strokeWeight;
    window.noStroke = global.noStroke;
    window.noTint = global.noTint;
    window.tint = global.tint;
    window.rect = global.rect;
    window.text = global.text;
    window.image = global.image;
    window.imageMode = global.imageMode;
    window.rectMode = global.rectMode;
    window.textAlign = global.textAlign;
    window.textFont = global.textFont;
    window.textSize = global.textSize;
    window.textWrap = global.textWrap;
    window.sin = global.sin;
    window.color = global.color;

    // Load CollisionBox2D
    CollisionBox2D = require('../../../Classes/systems/CollisionBox2D.js');
    global.CollisionBox2D = CollisionBox2D;
    window.CollisionBox2D = CollisionBox2D;

    // Load Button
    Button = require('../../../Classes/systems/Button.js');
  });

  beforeEach(function() {
    // Reset all stubs
    sinon.restore();

    // Recreate mock buffer (p5.Graphics-like object)
    mockBuffer = {
      width: 400,
      height: 300,
      push: sinon.stub(),
      pop: sinon.stub(),
      translate: sinon.stub(),
      scale: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      noStroke: sinon.stub(),
      noTint: sinon.stub(),
      tint: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      image: sinon.stub(),
      imageMode: sinon.stub(),
      rectMode: sinon.stub(),
      textAlign: sinon.stub(),
      textFont: sinon.stub(),
      textSize: sinon.stub(),
      textWrap: sinon.stub()
    };

    // Recreate global mocks
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.translate = sinon.stub();
    global.scale = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.noTint = sinon.stub();
    global.tint = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.image = sinon.stub();
    global.imageMode = sinon.stub();
    global.rectMode = sinon.stub();
    global.textAlign = sinon.stub();
    global.textFont = sinon.stub();
    global.textSize = sinon.stub();
    global.textWrap = sinon.stub();
    global.frameCount = 0;

    // Create button instance
    button = new Button(100, 50, 120, 40, 'Test Button', {
      backgroundColor: '#4CAF50',
      hoverColor: '#45a049',
      textColor: 'white',
      borderColor: '#333',
      borderWidth: 2,
      cornerRadius: 5,
      fontSize: 16
    });
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Buffer context rendering', function() {
    it('should call buffer.fill() instead of global fill()', function() {
      button.renderToBuffer(mockBuffer);
      
      // Buffer methods should be called
      expect(mockBuffer.fill.called).to.be.true;
      
      // Global methods should NOT be called
      expect(global.fill.called).to.be.false;
    });

    it('should call buffer.rect() instead of global rect()', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.rect.called).to.be.true;
      expect(global.rect.called).to.be.false;
    });

    it('should call buffer.text() instead of global text()', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.text.called).to.be.true;
      expect(global.text.called).to.be.false;
    });

    it('should call buffer.stroke() instead of global stroke()', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.stroke.called).to.be.true;
      expect(global.stroke.called).to.be.false;
    });

    it('should call buffer.strokeWeight() instead of global strokeWeight()', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.strokeWeight.called).to.be.true;
      expect(global.strokeWeight.called).to.be.false;
    });

    it('should call buffer.noStroke() instead of global noStroke()', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.noStroke.called).to.be.true;
      expect(global.noStroke.called).to.be.false;
    });

    it('should use buffer.push() and buffer.pop() for transforms', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.push.called).to.be.true;
      expect(mockBuffer.pop.called).to.be.true;
    });

    it('should call buffer.translate() for positioning', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.translate.called).to.be.true;
      expect(global.translate.called).to.be.false;
    });

    it('should call buffer.scale() for hover effects', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.scale.called).to.be.true;
      expect(global.scale.called).to.be.false;
    });

    it('should call buffer.textAlign() instead of global textAlign()', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.textAlign.called).to.be.true;
      expect(global.textAlign.called).to.be.false;
    });

    it('should call buffer.textSize() instead of global textSize()', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.textSize.called).to.be.true;
      expect(global.textSize.called).to.be.false;
    });

    it('should call buffer.textFont() instead of global textFont()', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.textFont.called).to.be.true;
      expect(global.textFont.called).to.be.false;
    });
  });

  describe('Button styling in buffer', function() {
    it('should render with background color', function() {
      button.renderToBuffer(mockBuffer);
      
      // Should call buffer.fill with background color
      expect(mockBuffer.fill.called).to.be.true;
      
      // Check that fill was called with color (string or color object)
      const fillCalls = mockBuffer.fill.getCalls();
      const colorCalls = fillCalls.filter(call => call.args.length > 0);
      expect(colorCalls.length).to.be.greaterThan(0);
    });

    it('should render with hover color when hovered', function() {
      button.isHovered = true;
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.fill.called).to.be.true;
    });

    it('should render border with configured width', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.stroke.called).to.be.true;
      expect(mockBuffer.strokeWeight.called).to.be.true;
      
      // Should call strokeWeight with borderWidth (2)
      const strokeWeightCall = mockBuffer.strokeWeight.getCall(0);
      if (strokeWeightCall) {
        expect(strokeWeightCall.args[0]).to.equal(2);
      }
    });

    it('should render text with caption', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.text.called).to.be.true;
      
      // Should call text with caption
      const textCall = mockBuffer.text.getCall(0);
      if (textCall) {
        expect(textCall.args[0]).to.include('Test Button');
      }
    });

    it('should render with corner radius', function() {
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.rect.called).to.be.true;
      
      // rect() should be called with 5 args (x, y, width, height, radius)
      const rectCall = mockBuffer.rect.getCall(0);
      if (rectCall) {
        expect(rectCall.args.length).to.equal(5);
        expect(rectCall.args[4]).to.equal(5); // cornerRadius
      }
    });
  });

  describe('Button state in buffer', function() {
    it('should scale up when hovered', function() {
      button.isHovered = true;
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.scale.called).to.be.true;
      
      // Should scale up (>1.0)
      const scaleCall = mockBuffer.scale.getCall(0);
      if (scaleCall) {
        // Initial hover effect should target 1.1, but eases smoothly
        expect(scaleCall.args[0]).to.be.greaterThan(1.0);
      }
    });

    it('should not scale when not hovered', function() {
      button.isHovered = false;
      button.currentScale = 1.0;
      button.renderToBuffer(mockBuffer);
      
      expect(mockBuffer.scale.called).to.be.true;
      
      const scaleCall = mockBuffer.scale.getCall(0);
      if (scaleCall) {
        // Should be at or near 1.0
        expect(scaleCall.args[0]).to.be.closeTo(1.0, 0.1);
      }
    });
  });

  describe('Error handling', function() {
    it('should handle missing buffer gracefully', function() {
      expect(() => button.renderToBuffer(null)).to.not.throw();
    });

    it('should handle buffer without all methods', function() {
      const partialBuffer = {
        fill: sinon.stub(),
        rect: sinon.stub(),
        text: sinon.stub()
      };
      
      expect(() => button.renderToBuffer(partialBuffer)).to.not.throw();
    });
  });
});
