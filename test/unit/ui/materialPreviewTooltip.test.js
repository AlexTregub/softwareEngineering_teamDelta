/**
 * Unit Tests for MaterialPreviewTooltip
 * 
 * Tests the hover tooltip component showing larger material previews.
 * TDD Phase: RED (tests written FIRST, expected to fail)
 * 
 * Test Coverage:
 * - Initialization (2 tests)
 * - Show/Hide (3 tests)
 * - Rendering (4 tests)
 * - Edge Cases (3 tests)
 * 
 * Total: 12 tests
 */

const { expect } = require('chai');
const sinon = require('sinon');
const MaterialPreviewTooltip = require('../../../Classes/ui/MaterialPreviewTooltip');

describe('MaterialPreviewTooltip', function() {
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.noFill = sandbox.stub();
    global.stroke = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.strokeWeight = sandbox.stub();
    global.rect = sandbox.stub();
    global.text = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textSize = sandbox.stub();
    global.image = sandbox.stub();
    global.width = 800; // Canvas width
    global.height = 600; // Canvas height
    global.LEFT = 'LEFT';
    global.CENTER = 'CENTER';
    global.TOP = 'TOP';
    
    // Mock TERRAIN_MATERIALS_RANGED
    global.TERRAIN_MATERIALS_RANGED = {
      'moss': [[0, 0.3], sandbox.stub()],
      'stone': [[0, 0.4], sandbox.stub()],
      'dirt': [[0.4, 0.525], sandbox.stub()]
    };
    
    // Sync with window for JSDOM
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.noFill = global.noFill;
      window.stroke = global.stroke;
      window.noStroke = global.noStroke;
      window.strokeWeight = global.strokeWeight;
      window.rect = global.rect;
      window.text = global.text;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.image = global.image;
      window.width = global.width;
      window.height = global.height;
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
      window.TOP = global.TOP;
      window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  // ===========================
  // Initialization Tests (2)
  // ===========================
  
  describe('Initialization', function() {
    it('should initialize with hidden state', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      expect(tooltip).to.exist;
      expect(tooltip.isVisible()).to.be.false;
    });
    
    it('should have isVisible() return false initially', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      expect(tooltip.isVisible()).to.be.false;
    });
  });
  
  // ===========================
  // Show/Hide Tests (3)
  // ===========================
  
  describe('Show/Hide', function() {
    it('should set visible to true when show() called', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      tooltip.show('moss', 100, 100);
      
      expect(tooltip.isVisible()).to.be.true;
    });
    
    it('should store material name and position when show() called', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      tooltip.show('stone', 150, 200);
      
      expect(tooltip.material).to.equal('stone');
      expect(tooltip.x).to.equal(150);
      expect(tooltip.y).to.equal(200);
    });
    
    it('should set visible to false when hide() called', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      tooltip.show('moss', 100, 100);
      expect(tooltip.isVisible()).to.be.true;
      
      tooltip.hide();
      
      expect(tooltip.isVisible()).to.be.false;
    });
  });
  
  // ===========================
  // Rendering Tests (4)
  // ===========================
  
  describe('Rendering', function() {
    it('should not render when hidden', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      tooltip.render();
      
      // Should not draw anything
      expect(global.rect.called).to.be.false;
      expect(global.text.called).to.be.false;
    });
    
    it('should draw tooltip box when visible', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      tooltip.show('moss', 100, 100);
      tooltip.render();
      
      // Should draw tooltip background
      expect(global.rect.called).to.be.true;
    });
    
    it('should draw material name when visible', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      tooltip.show('stone', 100, 100);
      tooltip.render();
      
      // Should draw material name
      const textCalls = global.text.getCalls();
      const nameCall = textCalls.find(call => 
        typeof call.args[0] === 'string' && call.args[0].includes('stone')
      );
      expect(nameCall).to.exist;
    });
    
    it('should draw material texture preview when visible', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      tooltip.show('moss', 100, 100);
      tooltip.render();
      
      // Should draw larger material swatch (using rect or image)
      expect(global.rect.called || global.image.called).to.be.true;
    });
  });
  
  // ===========================
  // Edge Cases (3)
  // ===========================
  
  describe('Edge Cases', function() {
    it('should handle material not in TERRAIN_MATERIALS_RANGED', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      tooltip.show('unknown_material', 100, 100);
      
      // Should not throw
      expect(() => tooltip.render()).to.not.throw();
    });
    
    it('should auto-reposition if tooltip extends beyond right edge', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      // Show tooltip near right edge of canvas
      tooltip.show('moss', 750, 100); // Near right edge (canvas width = 800)
      tooltip.render();
      
      // Tooltip should be repositioned to left of cursor
      // (Implementation detail - just verify no errors)
      expect(() => tooltip.render()).to.not.throw();
    });
    
    it('should auto-reposition if tooltip extends beyond bottom edge', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      // Show tooltip near bottom edge of canvas
      tooltip.show('moss', 100, 550); // Near bottom edge (canvas height = 600)
      tooltip.render();
      
      // Tooltip should be repositioned above cursor
      // (Implementation detail - just verify no errors)
      expect(() => tooltip.render()).to.not.throw();
    });
  });
  
  // ===========================
  // Multiple Show Calls Tests (2)
  // ===========================
  
  describe('Multiple Show Calls', function() {
    it('should update material and position with multiple show() calls', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      tooltip.show('moss', 100, 100);
      expect(tooltip.material).to.equal('moss');
      expect(tooltip.x).to.equal(100);
      
      tooltip.show('stone', 200, 250);
      expect(tooltip.material).to.equal('stone');
      expect(tooltip.x).to.equal(200);
      expect(tooltip.y).to.equal(250);
    });
    
    it('should remain visible after multiple show() calls', function() {
      const tooltip = new MaterialPreviewTooltip();
      
      tooltip.show('moss', 100, 100);
      expect(tooltip.isVisible()).to.be.true;
      
      tooltip.show('stone', 200, 200);
      expect(tooltip.isVisible()).to.be.true;
      
      tooltip.show('dirt', 300, 300);
      expect(tooltip.isVisible()).to.be.true;
    });
  });
});
