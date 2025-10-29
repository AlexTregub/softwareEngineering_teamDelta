/**
 * Unit Tests for Shape Utilities (circle and rect)
 * Tests p5.js shape drawing helper functions
 */

const { expect } = require('chai');

// Mock p5.js functions
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.noFill = () => {};
global.circle = () => {};
global.rect = () => {};

describe('Circle Utilities', function() {
  
  beforeEach(function() {
    // Load circle utilities
    require('../../../Classes/systems/shapes/circle');
  });
  
  describe('circleNoFill()', function() {
    
    it('should draw circle with no fill', function() {
      const color = { x: 255, y: 0, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleNoFill(color, pos, 50, 2);
      }).to.not.throw();
    });
    
    it('should accept color as Vector3', function() {
      const color = { x: 0, y: 120, z: 255 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleNoFill(color, pos, 50, 1);
      }).to.not.throw();
    });
    
    it('should accept position as Vector2', function() {
      const color = { x: 255, y: 255, z: 0 };
      const pos = { x: 200, y: 300 };
      
      expect(() => {
        circleNoFill(color, pos, 100, 3);
      }).to.not.throw();
    });
    
    it('should handle various diameters', function() {
      const color = { x: 255, y: 0, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleNoFill(color, pos, 10, 1);
        circleNoFill(color, pos, 50, 1);
        circleNoFill(color, pos, 200, 1);
      }).to.not.throw();
    });
    
    it('should handle various stroke weights', function() {
      const color = { x: 255, y: 0, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleNoFill(color, pos, 50, 1);
        circleNoFill(color, pos, 50, 5);
        circleNoFill(color, pos, 50, 10);
      }).to.not.throw();
    });
  });
  
  describe('circleFill()', function() {
    
    it('should draw filled circle with no stroke', function() {
      const color = { x: 255, y: 0, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleFill(color, pos, 50);
      }).to.not.throw();
    });
    
    it('should accept RGB color values', function() {
      const color = { x: 128, y: 128, z: 255 };
      const pos = { x: 150, y: 200 };
      
      expect(() => {
        circleFill(color, pos, 75);
      }).to.not.throw();
    });
    
    it('should handle various diameters', function() {
      const color = { x: 0, y: 255, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleFill(color, pos, 20);
        circleFill(color, pos, 60);
        circleFill(color, pos, 150);
      }).to.not.throw();
    });
  });
  
  describe('circleCustom()', function() {
    
    it('should draw circle with custom stroke and fill', function() {
      const strokeColor = { x: 0, y: 120, z: 255 };
      const fillColor = { x: 255, y: 255, z: 0 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleCustom(strokeColor, fillColor, pos, 50, 3);
      }).to.not.throw();
    });
    
    it('should accept two different colors', function() {
      const strokeColor = { x: 255, y: 0, z: 0 };
      const fillColor = { x: 0, y: 255, z: 0 };
      const pos = { x: 200, y: 200 };
      
      expect(() => {
        circleCustom(strokeColor, fillColor, pos, 80, 2);
      }).to.not.throw();
    });
    
    it('should handle various stroke weights', function() {
      const strokeColor = { x: 100, y: 100, z: 100 };
      const fillColor = { x: 200, y: 200, z: 200 };
      const pos = { x: 100, y: 100 };
      
      expect(() => {
        circleCustom(strokeColor, fillColor, pos, 50, 1);
        circleCustom(strokeColor, fillColor, pos, 50, 4);
        circleCustom(strokeColor, fillColor, pos, 50, 8);
      }).to.not.throw();
    });
  });
});

describe('Rectangle Utilities', function() {
  
  beforeEach(function() {
    // Load rect utilities
    require('../../../Classes/systems/shapes/rect');
  });
  
  describe('rectCustom()', function() {
    
    it('should draw rectangle with stroke and fill', function() {
      const strokeColor = [255, 0, 0];
      const fillColor = [0, 255, 0];
      const pos = { x: 50, y: 50 };
      const size = { x: 100, y: 75 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 2, pos, size, true, true);
      }).to.not.throw();
    });
    
    it('should draw rectangle with stroke only', function() {
      const strokeColor = [0, 0, 255];
      const fillColor = [0, 0, 0];
      const pos = { x: 100, y: 100 };
      const size = { x: 80, y: 60 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 3, pos, size, false, true);
      }).to.not.throw();
    });
    
    it('should draw rectangle with fill only', function() {
      const strokeColor = [0, 0, 0];
      const fillColor = [255, 255, 0];
      const pos = { x: 200, y: 150 };
      const size = { x: 120, y: 90 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 1, pos, size, true, false);
      }).to.not.throw();
    });
    
    it('should draw rectangle with no stroke or fill', function() {
      const strokeColor = [0, 0, 0];
      const fillColor = [0, 0, 0];
      const pos = { x: 50, y: 50 };
      const size = { x: 100, y: 100 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 1, pos, size, false, false);
      }).to.not.throw();
    });
    
    it('should handle various stroke widths', function() {
      const strokeColor = [100, 100, 100];
      const fillColor = [200, 200, 200];
      const pos = { x: 100, y: 100 };
      const size = { x: 80, y: 60 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 1, pos, size, true, true);
        rectCustom(strokeColor, fillColor, 5, pos, size, true, true);
        rectCustom(strokeColor, fillColor, 10, pos, size, true, true);
      }).to.not.throw();
    });
    
    it('should accept color arrays', function() {
      const strokeColor = [255, 128, 0];
      const fillColor = [0, 128, 255];
      const pos = { x: 150, y: 200 };
      const size = { x: 60, y: 40 };
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 2, pos, size, true, true);
      }).to.not.throw();
    });
    
    it('should handle different rectangle sizes', function() {
      const strokeColor = [255, 0, 0];
      const fillColor = [0, 255, 0];
      
      expect(() => {
        rectCustom(strokeColor, fillColor, 1, { x: 0, y: 0 }, { x: 10, y: 10 }, true, true);
        rectCustom(strokeColor, fillColor, 1, { x: 0, y: 0 }, { x: 100, y: 50 }, true, true);
        rectCustom(strokeColor, fillColor, 1, { x: 0, y: 0 }, { x: 200, y: 200 }, true, true);
      }).to.not.throw();
    });
  });
});

describe('Shape Utility Integration', function() {
  
  it('should have circle utilities available globally', function() {
    expect(typeof circleNoFill).to.equal('function');
    expect(typeof circleFill).to.equal('function');
    expect(typeof circleCustom).to.equal('function');
  });
  
  it('should have rect utilities available globally', function() {
    expect(typeof rectCustom).to.equal('function');
  });
});
