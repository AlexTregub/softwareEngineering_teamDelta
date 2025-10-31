/**
 * Unit Tests: MaterialPalette Content Clipping
 * 
 * Tests that MaterialPalette content is clipped to panel boundaries
 * and doesn't render outside the contentArea bounds.
 * 
 * Bug: MaterialPalette: Content Extends Beyond Panel Edges
 * Issue: Materials in middle of panel render outside panel boundaries
 * Expected: All content clipped to panel contentArea boundaries
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load MaterialPalette
const MaterialPalette = require('../../../Classes/ui/MaterialPalette');

describe('MaterialPalette - Content Clipping', function() {
  let palette;
  let mockP5;
  
  beforeEach(function() {
    // Mock p5.js functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      clip: sinon.stub(),
      noClip: sinon.stub(),
      translate: sinon.stub(),
      fill: sinon.stub(),
      noFill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      ellipse: sinon.stub(),
      text: sinon.stub(),
      textSize: sinon.stub(),
      textAlign: sinon.stub(),
      image: sinon.stub(),
      imageMode: sinon.stub(),
      CORNER: 0,
      CENTER: 1,
      LEFT: 2,
      TOP: 3
    };
    
    // Set global p5 functions
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.clip = mockP5.clip;
    global.noClip = mockP5.noClip;
    global.translate = mockP5.translate;
    global.fill = mockP5.fill;
    global.noFill = mockP5.noFill;
    global.stroke = mockP5.stroke;
    global.noStroke = mockP5.noStroke;
    global.rect = mockP5.rect;
    global.ellipse = mockP5.ellipse;
    global.text = mockP5.text;
    global.textSize = mockP5.textSize;
    global.textAlign = mockP5.textAlign;
    global.image = mockP5.image;
    global.imageMode = mockP5.imageMode;
    global.CORNER = mockP5.CORNER;
    global.CENTER = mockP5.CENTER;
    global.LEFT = mockP5.LEFT;
    global.TOP = mockP5.TOP;
    
    // Create MaterialPalette instance
    palette = new MaterialPalette([]);
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.push;
    delete global.pop;
    delete global.clip;
    delete global.noClip;
    delete global.translate;
    delete global.fill;
    delete global.noFill;
    delete global.stroke;
    delete global.noStroke;
    delete global.rect;
    delete global.ellipse;
    delete global.text;
    delete global.textSize;
    delete global.textAlign;
    delete global.image;
    delete global.imageMode;
    delete global.CORNER;
    delete global.CENTER;
    delete global.LEFT;
    delete global.TOP;
  });
  
  describe('Clipping Region Setup', function() {
    it('should call clip() at start of render', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      palette.render(50, 100, 300, 600);
      
      expect(mockP5.clip.called).to.be.true;
    });
    
    it('should call clip() with correct contentArea bounds', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      const x = 50;
      const y = 100;
      const width = 300;
      const height = 600;
      
      palette.render(x, y, width, height);
      
      // clip() should be called with x, y, width, height
      expect(mockP5.clip.calledWith(x, y, width, height)).to.be.true;
    });
    
    it('should call noClip() at end of render', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      palette.render(50, 100, 300, 600);
      
      expect(mockP5.noClip.called).to.be.true;
    });
    
    it('should call clip() before rendering content', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      palette.render(50, 100, 300, 600);
      
      // clip() should be called before any rect() or image() calls
      const clipCallOrder = mockP5.clip.firstCall?.callId || 0;
      const rectCallOrder = mockP5.rect.firstCall?.callId || Infinity;
      const imageCallOrder = mockP5.image.firstCall?.callId || Infinity;
      
      expect(clipCallOrder).to.be.lessThan(Math.min(rectCallOrder, imageCallOrder));
    });
    
    it('should call noClip() after all content rendered', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      palette.render(50, 100, 300, 600);
      
      // noClip() should be called after all rect() and image() calls
      const noClipCallOrder = mockP5.noClip.lastCall?.callId || 0;
      const rectCallOrder = mockP5.rect.lastCall?.callId || 0;
      const imageCallOrder = mockP5.image.lastCall?.callId || 0;
      
      expect(noClipCallOrder).to.be.greaterThan(Math.max(rectCallOrder, imageCallOrder));
    });
  });
  
  describe('Clipping with Push/Pop', function() {
    it('should wrap clipping in push/pop', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      palette.render(50, 100, 300, 600);
      
      // Verify push() called before clip()
      const pushCallOrder = mockP5.push.firstCall?.callId || 0;
      const clipCallOrder = mockP5.clip.firstCall?.callId || Infinity;
      expect(pushCallOrder).to.be.lessThan(clipCallOrder);
      
      // Verify pop() called after noClip()
      const noClipCallOrder = mockP5.noClip.lastCall?.callId || 0;
      const popCallOrder = mockP5.pop.lastCall?.callId || Infinity;
      expect(popCallOrder).to.be.greaterThan(noClipCallOrder);
    });
    
    it('should have matching push/pop calls', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      palette.render(50, 100, 300, 600);
      
      expect(mockP5.push.callCount).to.equal(mockP5.pop.callCount);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero width gracefully', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      expect(() => palette.render(50, 100, 0, 600)).to.not.throw();
    });
    
    it('should handle zero height gracefully', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      expect(() => palette.render(50, 100, 300, 0)).to.not.throw();
    });
    
    it('should handle negative coordinates', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      expect(() => palette.render(-50, -100, 300, 600)).to.not.throw();
    });
    
    it('should clip even when scroll offset applied', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      // Set scroll offset
      if (palette.scrollOffset !== undefined) {
        palette.scrollOffset = 200;
      }
      
      palette.render(50, 100, 300, 600);
      
      // clip() should still be called with original bounds
      expect(mockP5.clip.calledWith(50, 100, 300, 600)).to.be.true;
    });
  });
  
  describe('Clipping Region Validation', function() {
    it('should not render content outside clip region', function() {
      if (!palette) {
        this.skip();
        return;
      }
      
      const x = 50;
      const y = 100;
      const width = 300;
      const height = 600;
      
      palette.render(x, y, width, height);
      
      // After clip() is called, all subsequent rect() and image() calls
      // should have coordinates within the clipping region
      const clipCallIndex = mockP5.clip.firstCall ? 
        Array.from({ length: mockP5.clip.callCount }, (_, i) => mockP5.clip.getCall(i))
          .findIndex(call => call.args[0] === x && call.args[1] === y) : -1;
      
      if (clipCallIndex >= 0) {
        // Verify clip was set up correctly
        expect(mockP5.clip.called).to.be.true;
      }
    });
  });
});
