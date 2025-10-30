/**
 * Unit Tests: Toggle Component
 * 
 * Tests the reusable Toggle switch component for boolean settings
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Toggle Component', function() {
  let Toggle;
  let mockP5;
  
  before(function() {
    // Mock p5.js globals
    mockP5 = {
      fill: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      circle: sinon.stub()
    };
    
    Object.assign(global, mockP5);
    
    // Mock window for browser environment
    if (typeof window === 'undefined') {
      global.window = global;
    }
    
    // Load Toggle class
    try {
      Toggle = require('../../../../Classes/ui/components/Toggle.js');
    } catch (e) {
      // Skip tests if Toggle not yet implemented
    }
  });
  
  beforeEach(function() {
    if (typeof Toggle === 'undefined') {
      this.skip();
    }
    
    // Reset spies
    Object.values(mockP5).forEach(stub => {
      if (stub.resetHistory) stub.resetHistory();
    });
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create toggle with default OFF state', function() {
      const toggle = new Toggle(100, 100);
      
      expect(toggle.x).to.equal(100);
      expect(toggle.y).to.equal(100);
      expect(toggle.isOn).to.be.false;
      expect(toggle.width).to.equal(50);
      expect(toggle.height).to.equal(25);
    });
    
    it('should create toggle with ON state', function() {
      const toggle = new Toggle(100, 100, true);
      
      expect(toggle.isOn).to.be.true;
    });
    
    it('should have proper dimensions for handle', function() {
      const toggle = new Toggle(100, 100);
      
      expect(toggle.handleRadius).to.equal(9);
      expect(toggle.padding).to.equal(3);
    });
  });
  
  describe('render() method', function() {
    it('should render track rectangle', function() {
      const toggle = new Toggle(100, 100, false);
      
      toggle.render();
      
      // Should call rect() for track
      expect(mockP5.rect.called).to.be.true;
      const rectCall = mockP5.rect.firstCall;
      expect(rectCall.args[0]).to.equal(100); // x
      expect(rectCall.args[1]).to.equal(100); // y
      expect(rectCall.args[2]).to.equal(50);  // width
      expect(rectCall.args[3]).to.equal(25);  // height
      expect(rectCall.args[4]).to.equal(12);  // border radius
    });
    
    it('should render handle circle at left position when OFF', function() {
      const toggle = new Toggle(100, 100, false);
      
      toggle.render();
      
      // Should call circle() for handle
      expect(mockP5.circle.called).to.be.true;
      const circleCall = mockP5.circle.firstCall;
      
      // Handle should be at left edge: x + handleRadius + padding
      const expectedX = 100 + 9 + 3; // 112
      expect(circleCall.args[0]).to.equal(expectedX);
      expect(circleCall.args[1]).to.equal(112.5); // y + height/2
      expect(circleCall.args[2]).to.equal(18);     // diameter (radius * 2)
    });
    
    it('should render handle circle at right position when ON', function() {
      const toggle = new Toggle(100, 100, true);
      
      toggle.render();
      
      // Should call circle() for handle
      expect(mockP5.circle.called).to.be.true;
      const circleCall = mockP5.circle.firstCall;
      
      // Handle should be at right edge: x + width - handleRadius - padding
      const expectedX = 100 + 50 - 9 - 3; // 138
      expect(circleCall.args[0]).to.equal(expectedX);
      expect(circleCall.args[1]).to.equal(112.5); // y + height/2
    });
    
    it('should use different colors for ON vs OFF state', function() {
      const toggleOff = new Toggle(100, 100, false);
      const toggleOn = new Toggle(100, 100, true);
      
      toggleOff.render();
      const offFillCall = mockP5.fill.firstCall;
      
      mockP5.fill.resetHistory();
      
      toggleOn.render();
      const onFillCall = mockP5.fill.firstCall;
      
      // ON state should have brighter colors
      expect(onFillCall.args[0]).to.be.greaterThan(offFillCall.args[0]); // Red
      expect(onFillCall.args[1]).to.be.greaterThan(offFillCall.args[1]); // Green
      expect(onFillCall.args[2]).to.be.greaterThan(offFillCall.args[2]); // Blue
    });
  });
  
  describe('containsPoint() method', function() {
    it('should return true for point inside toggle', function() {
      const toggle = new Toggle(100, 100);
      
      expect(toggle.containsPoint(125, 112)).to.be.true; // Center
      expect(toggle.containsPoint(101, 101)).to.be.true; // Top-left
      expect(toggle.containsPoint(149, 124)).to.be.true; // Bottom-right
    });
    
    it('should return false for point outside toggle', function() {
      const toggle = new Toggle(100, 100);
      
      expect(toggle.containsPoint(99, 112)).to.be.false;  // Left of toggle
      expect(toggle.containsPoint(151, 112)).to.be.false; // Right of toggle
      expect(toggle.containsPoint(125, 99)).to.be.false;  // Above toggle
      expect(toggle.containsPoint(125, 126)).to.be.false; // Below toggle
    });
    
    it('should handle exact edges correctly', function() {
      const toggle = new Toggle(100, 100);
      
      expect(toggle.containsPoint(100, 100)).to.be.true;  // Top-left corner
      expect(toggle.containsPoint(150, 125)).to.be.true;  // Bottom-right corner
    });
  });
  
  describe('toggle() method', function() {
    it('should toggle from OFF to ON', function() {
      const toggle = new Toggle(100, 100, false);
      
      toggle.toggle();
      
      expect(toggle.isOn).to.be.true;
    });
    
    it('should toggle from ON to OFF', function() {
      const toggle = new Toggle(100, 100, true);
      
      toggle.toggle();
      
      expect(toggle.isOn).to.be.false;
    });
    
    it('should toggle multiple times correctly', function() {
      const toggle = new Toggle(100, 100, false);
      
      toggle.toggle();
      expect(toggle.isOn).to.be.true;
      
      toggle.toggle();
      expect(toggle.isOn).to.be.false;
      
      toggle.toggle();
      expect(toggle.isOn).to.be.true;
    });
  });
  
  describe('setValue() method', function() {
    it('should set toggle to ON', function() {
      const toggle = new Toggle(100, 100, false);
      
      toggle.setValue(true);
      
      expect(toggle.isOn).to.be.true;
    });
    
    it('should set toggle to OFF', function() {
      const toggle = new Toggle(100, 100, true);
      
      toggle.setValue(false);
      
      expect(toggle.isOn).to.be.false;
    });
    
    it('should handle non-boolean values', function() {
      const toggle = new Toggle(100, 100, false);
      
      toggle.setValue(1); // Truthy
      expect(toggle.isOn).to.be.true;
      
      toggle.setValue(0); // Falsy
      expect(toggle.isOn).to.be.false;
      
      toggle.setValue('yes'); // Truthy
      expect(toggle.isOn).to.be.true;
      
      toggle.setValue(null); // Falsy
      expect(toggle.isOn).to.be.false;
    });
  });
  
  describe('Edge cases', function() {
    it('should handle negative coordinates', function() {
      const toggle = new Toggle(-100, -50);
      
      expect(toggle.x).to.equal(-100);
      expect(toggle.y).to.equal(-50);
      expect(toggle.containsPoint(-75, -37)).to.be.true;
    });
    
    it('should handle zero coordinates', function() {
      const toggle = new Toggle(0, 0);
      
      expect(toggle.x).to.equal(0);
      expect(toggle.y).to.equal(0);
      expect(toggle.containsPoint(25, 12)).to.be.true;
    });
    
    it('should render without errors when p5.js functions unavailable', function() {
      const originalFill = global.fill;
      delete global.fill;
      
      try {
        const toggle = new Toggle(100, 100);
        expect(() => toggle.render()).to.not.throw();
      } finally {
        global.fill = originalFill;
      }
    });
  });
});
