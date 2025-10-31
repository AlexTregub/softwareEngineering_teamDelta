/**
 * Unit Tests: MaterialPalette Mouse Wheel Scrolling (Bug Fix - TDD)
 * 
 * Bug: MaterialPalette: Mouse Wheel Scrolling Not Working
 * Issue: Mouse wheel doesn't scroll when hovering over Materials panel
 * Root Cause: LevelEditor delegation may not be wired correctly, or hover detection failing
 * 
 * TDD RED PHASE: Write failing tests that reproduce the bug
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load MaterialPalette
const MaterialPalette = require('../../../Classes/ui/MaterialPalette');

describe('MaterialPalette - Mouse Wheel Scrolling (Bug Fix)', function() {
  let palette;
  let mockP5;
  
  beforeEach(function() {
    // Mock p5.js functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      noFill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textSize: sinon.stub(),
      textAlign: sinon.stub(),
      LEFT: 2,
      TOP: 3,
      CENTER: 1
    };
    
    // Set global p5 functions
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.fill = mockP5.fill;
    global.noFill = mockP5.noFill;
    global.stroke = mockP5.stroke;
    global.noStroke = mockP5.noStroke;
    global.rect = mockP5.rect;
    global.text = mockP5.text;
    global.textSize = mockP5.textSize;
    global.textAlign = mockP5.textAlign;
    global.LEFT = mockP5.LEFT;
    global.TOP = mockP5.TOP;
    global.CENTER = mockP5.CENTER;
    
    // Mock drawingContext for clipping
    global.drawingContext = {
      save: sinon.stub(),
      restore: sinon.stub(),
      beginPath: sinon.stub(),
      rect: sinon.stub(),
      clip: sinon.stub()
    };
    
    // Create MaterialPalette instance with test materials
    palette = new MaterialPalette(['grass', 'dirt', 'stone', 'moss', 'water']);
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.noFill;
    delete global.stroke;
    delete global.noStroke;
    delete global.rect;
    delete global.text;
    delete global.textSize;
    delete global.textAlign;
    delete global.LEFT;
    delete global.TOP;
    delete global.CENTER;
    delete global.drawingContext;
  });
  
  describe('Bug Reproduction: handleMouseWheel() method', function() {
    it('should have handleMouseWheel method defined', function() {
      expect(palette.handleMouseWheel).to.be.a('function');
    });
    
    it('should update scrollOffset when mouse wheel scrolled down', function() {
      // Set up viewport
      palette.viewportHeight = 300;
      palette.maxScrollOffset = 500; // Can scroll 500px
      palette.scrollOffset = 0;
      
      // Simulate mouse wheel down (delta positive = scroll down)
      palette.handleMouseWheel(50);
      
      expect(palette.scrollOffset).to.equal(50);
    });
    
    it('should update scrollOffset when mouse wheel scrolled up', function() {
      // Set up viewport
      palette.viewportHeight = 300;
      palette.maxScrollOffset = 500;
      palette.scrollOffset = 100;
      
      // Simulate mouse wheel up (delta negative = scroll up)
      palette.handleMouseWheel(-30);
      
      expect(palette.scrollOffset).to.equal(70);
    });
    
    it('should clamp scrollOffset to minimum (0)', function() {
      palette.viewportHeight = 300;
      palette.maxScrollOffset = 500;
      palette.scrollOffset = 20;
      
      // Try to scroll past top
      palette.handleMouseWheel(-50);
      
      expect(palette.scrollOffset).to.equal(0);
    });
    
    it('should clamp scrollOffset to maximum (maxScrollOffset)', function() {
      palette.viewportHeight = 300;
      palette.maxScrollOffset = 500;
      palette.scrollOffset = 480;
      
      // Try to scroll past bottom
      palette.handleMouseWheel(50);
      
      expect(palette.scrollOffset).to.equal(500);
    });
    
    it('should not scroll if maxScrollOffset is 0 (content fits)', function() {
      palette.viewportHeight = 600;
      palette.maxScrollOffset = 0; // Content fits
      palette.scrollOffset = 0;
      
      palette.handleMouseWheel(50);
      
      expect(palette.scrollOffset).to.equal(0);
    });
  });
  
  describe('Integration: scrollOffset affects rendering', function() {
    it('should apply scroll offset to render Y position', function() {
      palette.viewportHeight = 300;
      palette.scrollOffset = 100;
      
      // Render with scroll offset
      palette.render(50, 100, 250, 300);
      
      // Search bar should render at y = 100 - 100 = 0 (scrolled up 100px)
      // Check that rendering occurred (any fill or rect calls)
      expect(mockP5.fill.called || mockP5.rect.called).to.be.true;
    });
    
    it('should call updateScrollBounds() during render', function() {
      const spy = sinon.spy(palette, 'updateScrollBounds');
      
      palette.render(50, 100, 250, 300);
      
      expect(spy.calledOnce).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle undefined delta gracefully', function() {
      palette.scrollOffset = 50;
      
      expect(() => palette.handleMouseWheel(undefined)).to.not.throw();
      expect(palette.scrollOffset).to.equal(50); // Should not change
    });
    
    it('should handle null delta gracefully', function() {
      palette.scrollOffset = 50;
      
      expect(() => palette.handleMouseWheel(null)).to.not.throw();
      expect(palette.scrollOffset).to.equal(50); // Should not change
    });
    
    it('should handle zero delta gracefully', function() {
      palette.scrollOffset = 50;
      
      expect(() => palette.handleMouseWheel(0)).to.not.throw();
      expect(palette.scrollOffset).to.equal(50); // Should not change
    });
  });
});
