/**
 * Unit Tests: Slider Component
 * 
 * Tests the reusable Slider component for numeric settings
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Slider Component', function() {
  let Slider;
  let mockP5;
  
  before(function() {
    // Mock p5.js globals
    mockP5 = {
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      circle: sinon.stub(),
      line: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      constrain: sinon.stub().callsFake((val, min, max) => Math.max(min, Math.min(max, val))),
      CENTER: 'center',
      LEFT: 'left',
      RIGHT: 'right'
    };
    
    Object.assign(global, mockP5);
    
    // Mock window for browser environment
    if (typeof window === 'undefined') {
      global.window = global;
    }
    
    // Load Slider class
    try {
      Slider = require('../../../../Classes/ui/components/Slider.js');
    } catch (e) {
      // Skip tests if Slider not yet implemented
    }
  });
  
  beforeEach(function() {
    if (typeof Slider === 'undefined') {
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
    it('should create slider with position and range', function() {
      const slider = new Slider(100, 200, 150, 0.5, 3.0, 1.5);
      
      expect(slider.x).to.equal(100);
      expect(slider.y).to.equal(200);
      expect(slider.width).to.equal(150);
      expect(slider.min).to.equal(0.5);
      expect(slider.max).to.equal(3.0);
      expect(slider.value).to.equal(1.5);
    });
    
    it('should accept optional onChange callback', function() {
      const callback = sinon.spy();
      const slider = new Slider(100, 200, 150, 0, 100, 50, callback);
      
      expect(slider.onChange).to.equal(callback);
    });
    
    it('should initialize with default state', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      expect(slider.dragging).to.be.false;
      expect(slider.enabled).to.be.true;
    });
    
    it('should have default dimensions', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      expect(slider.trackHeight).to.equal(4);
      expect(slider.handleRadius).to.equal(8);
    });
    
    it('should constrain initial value to range', function() {
      const slider = new Slider(100, 200, 150, 0, 10, 15); // value > max
      
      expect(slider.value).to.equal(10);
    });
  });
  
  describe('render() method', function() {
    it('should render track line', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      slider.render();
      
      // Should call line() for track
      expect(mockP5.line.called).to.be.true;
      const lineCall = mockP5.line.firstCall;
      expect(lineCall.args[0]).to.equal(100);  // x1
      expect(lineCall.args[2]).to.equal(250);  // x2 (x + width)
    });
    
    it('should render handle circle at correct position', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      slider.render();
      
      // Should call circle() for handle
      expect(mockP5.circle.called).to.be.true;
      const circleCall = mockP5.circle.firstCall;
      
      // Handle should be at 50% along track (value=50, range=0-100)
      const expectedX = 100 + (150 * 0.5); // 175
      expect(circleCall.args[0]).to.equal(expectedX);
      expect(circleCall.args[1]).to.equal(200); // y position
    });
    
    it('should render value label', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      slider.render();
      
      // Should call text() for value display
      expect(mockP5.text.called).to.be.true;
    });
    
    it('should use different handle color when dragging', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      // Normal state
      slider.render();
      const normalFillCall = mockP5.fill.getCalls().find(call => call.calledBefore(mockP5.circle.firstCall));
      
      mockP5.fill.resetHistory();
      mockP5.circle.resetHistory();
      
      // Dragging state
      slider.dragging = true;
      slider.render();
      const draggingFillCall = mockP5.fill.getCalls().find(call => call.calledBefore(mockP5.circle.firstCall));
      
      // Colors should be different (brighter when dragging)
      expect(draggingFillCall.args[0]).to.be.greaterThan(normalFillCall.args[0]);
    });
  });
  
  describe('containsPoint() method', function() {
    it('should return true for point on slider track', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      expect(slider.containsPoint(175, 200)).to.be.true; // Center
      expect(slider.containsPoint(100, 200)).to.be.true; // Left edge
      expect(slider.containsPoint(250, 200)).to.be.true; // Right edge
    });
    
    it('should return false for point outside slider', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      expect(slider.containsPoint(99, 200)).to.be.false;  // Left of slider
      expect(slider.containsPoint(251, 200)).to.be.false; // Right of slider
      expect(slider.containsPoint(175, 190)).to.be.false; // Above slider
      expect(slider.containsPoint(175, 210)).to.be.false; // Below slider
    });
    
    it('should include handle radius in hit area', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      const handleRadius = slider.handleRadius;
      
      // Points near handle should be within hit area
      expect(slider.containsPoint(175, 200 - handleRadius)).to.be.true;
      expect(slider.containsPoint(175, 200 + handleRadius)).to.be.true;
    });
  });
  
  describe('handleDrag() method', function() {
    it('should update value when dragged', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      // Drag to 75% position (x=212.5)
      slider.handleDrag(212.5, 200);
      
      expect(slider.value).to.be.closeTo(75, 1);
    });
    
    it('should call onChange callback when value changes', function() {
      const callback = sinon.spy();
      const slider = new Slider(100, 200, 150, 0, 100, 50, callback);
      
      // Drag to 75% position (x=212.5) which should give value ~75
      slider.handleDrag(212.5, 200);
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.be.closeTo(75, 1);
    });
    
    it('should not call onChange if value unchanged', function() {
      const callback = sinon.spy();
      const slider = new Slider(100, 200, 150, 0, 100, 50, callback);
      
      // Drag to exact same position
      slider.handleDrag(175, 200);
      
      // Value is same, should not call callback
      expect(callback.called).to.be.false;
    });
    
    it('should constrain value to min', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      slider.handleDrag(50, 200); // Way left of min
      
      expect(slider.value).to.equal(0);
    });
    
    it('should constrain value to max', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      slider.handleDrag(300, 200); // Way right of max
      
      expect(slider.value).to.equal(100);
    });
  });
  
  describe('startDrag() method', function() {
    it('should set dragging to true', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      slider.startDrag();
      
      expect(slider.dragging).to.be.true;
    });
  });
  
  describe('endDrag() method', function() {
    it('should set dragging to false', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      slider.dragging = true;
      
      slider.endDrag();
      
      expect(slider.dragging).to.be.false;
    });
  });
  
  describe('getValue() method', function() {
    it('should return current value', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 75);
      
      expect(slider.getValue()).to.equal(75);
    });
  });
  
  describe('setValue() method', function() {
    it('should set value within range', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      slider.setValue(75);
      
      expect(slider.value).to.equal(75);
    });
    
    it('should constrain value to min', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      slider.setValue(-10);
      
      expect(slider.value).to.equal(0);
    });
    
    it('should constrain value to max', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      slider.setValue(150);
      
      expect(slider.value).to.equal(100);
    });
    
    it('should call onChange callback', function() {
      const callback = sinon.spy();
      const slider = new Slider(100, 200, 150, 0, 100, 50, callback);
      
      slider.setValue(75);
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.equal(75);
    });
  });
  
  describe('setEnabled() method', function() {
    it('should enable slider', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      slider.enabled = false;
      
      slider.setEnabled(true);
      
      expect(slider.enabled).to.be.true;
    });
    
    it('should disable slider', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      
      slider.setEnabled(false);
      
      expect(slider.enabled).to.be.false;
    });
    
    it('should stop dragging when disabled', function() {
      const slider = new Slider(100, 200, 150, 0, 100, 50);
      slider.dragging = true;
      
      slider.setEnabled(false);
      
      expect(slider.dragging).to.be.false;
    });
  });
  
  describe('Edge cases', function() {
    it('should handle zero-width slider', function() {
      const slider = new Slider(100, 200, 0, 0, 100, 50);
      
      expect(slider.width).to.equal(0);
      expect(() => slider.render()).to.not.throw();
    });
    
    it('should handle min equals max', function() {
      const slider = new Slider(100, 200, 150, 10, 10, 10);
      
      expect(slider.value).to.equal(10);
      slider.handleDrag(175, 200);
      expect(slider.value).to.equal(10); // Should stay at min/max
    });
    
    it('should handle negative ranges', function() {
      const slider = new Slider(100, 200, 150, -50, 50, 0);
      
      expect(slider.value).to.equal(0);
      expect(slider.min).to.equal(-50);
      expect(slider.max).to.equal(50);
    });
    
    it('should handle decimal values', function() {
      const slider = new Slider(100, 200, 150, 0.5, 3.0, 1.5);
      
      expect(slider.value).to.equal(1.5);
      slider.handleDrag(175, 200);
      expect(slider.value).to.be.within(0.5, 3.0);
    });
    
    it('should render without errors when p5.js functions unavailable', function() {
      const originalFill = global.fill;
      delete global.fill;
      
      try {
        const slider = new Slider(100, 200, 150, 0, 100, 50);
        expect(() => slider.render()).to.not.throw();
      } finally {
        global.fill = originalFill;
      }
    });
  });
});
