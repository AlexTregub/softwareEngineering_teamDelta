const { expect } = require('chai');

// Load the module
class MouseInputController {
  constructor() {
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.button = null;
    this.clickHandlers = [];
    this.dragHandlers = [];
    this.releaseHandlers = [];
  }
  onClick(fn) {
    if (typeof fn === 'function') this.clickHandlers.push(fn);
  }
  onDrag(fn) {
    if (typeof fn === 'function') this.dragHandlers.push(fn);
  }
  onRelease(fn) {
    if (typeof fn === 'function') this.releaseHandlers.push(fn);
  }
  handleMousePressed(x, y, button) {
    this.isDragging = false;
    this.lastX = x;
    this.lastY = y;
    this.button = button;
    this.clickHandlers.forEach(fn => fn(x, y, button));
  }
  handleMouseDragged(x, y) {
    if (!this.isDragging) this.isDragging = true;
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    this.dragHandlers.forEach(fn => fn(x, y, dx, dy));
    this.lastX = x;
    this.lastY = y;
  }
  handleMouseReleased(x, y, button) {
    this.releaseHandlers.forEach(fn => fn(x, y, button));
    this.isDragging = false;
    this.button = null;
  }
}

describe('MouseInputController', function() {
  let controller;
  
  beforeEach(function() {
    controller = new MouseInputController();
  });
  
  describe('Constructor', function() {
    it('should initialize drag state to false', function() {
      expect(controller.isDragging).to.be.false;
    });
    
    it('should initialize position to zero', function() {
      expect(controller.lastX).to.equal(0);
      expect(controller.lastY).to.equal(0);
    });
    
    it('should initialize button to null', function() {
      expect(controller.button).to.be.null;
    });
    
    it('should initialize empty handler arrays', function() {
      expect(controller.clickHandlers).to.be.an('array').that.is.empty;
      expect(controller.dragHandlers).to.be.an('array').that.is.empty;
      expect(controller.releaseHandlers).to.be.an('array').that.is.empty;
    });
  });
  
  describe('Handler Registration', function() {
    describe('onClick()', function() {
      it('should register click handler', function() {
        const handler = () => {};
        controller.onClick(handler);
        expect(controller.clickHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onClick(handler1);
        controller.onClick(handler2);
        expect(controller.clickHandlers).to.have.lengthOf(2);
      });
      
      it('should ignore non-function values', function() {
        controller.onClick('not a function');
        controller.onClick(null);
        controller.onClick(undefined);
        expect(controller.clickHandlers).to.be.empty;
      });
    });
    
    describe('onDrag()', function() {
      it('should register drag handler', function() {
        const handler = () => {};
        controller.onDrag(handler);
        expect(controller.dragHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onDrag(handler1);
        controller.onDrag(handler2);
        expect(controller.dragHandlers).to.have.lengthOf(2);
      });
    });
    
    describe('onRelease()', function() {
      it('should register release handler', function() {
        const handler = () => {};
        controller.onRelease(handler);
        expect(controller.releaseHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onRelease(handler1);
        controller.onRelease(handler2);
        expect(controller.releaseHandlers).to.have.lengthOf(2);
      });
    });
  });
  
  describe('Mouse Press Handling', function() {
    describe('handleMousePressed()', function() {
      it('should update last position', function() {
        controller.handleMousePressed(100, 200, 'LEFT');
        expect(controller.lastX).to.equal(100);
        expect(controller.lastY).to.equal(200);
      });
      
      it('should set button', function() {
        controller.handleMousePressed(100, 200, 'LEFT');
        expect(controller.button).to.equal('LEFT');
      });
      
      it('should reset dragging state', function() {
        controller.isDragging = true;
        controller.handleMousePressed(100, 200, 'LEFT');
        expect(controller.isDragging).to.be.false;
      });
      
      it('should invoke all click handlers', function() {
        let count = 0;
        controller.onClick(() => count++);
        controller.onClick(() => count++);
        controller.handleMousePressed(100, 200, 'LEFT');
        expect(count).to.equal(2);
      });
      
      it('should pass x, y, button to handlers', function() {
        let capturedX, capturedY, capturedButton;
        controller.onClick((x, y, button) => {
          capturedX = x;
          capturedY = y;
          capturedButton = button;
        });
        controller.handleMousePressed(100, 200, 'LEFT');
        expect(capturedX).to.equal(100);
        expect(capturedY).to.equal(200);
        expect(capturedButton).to.equal('LEFT');
      });
      
      it('should handle right button', function() {
        controller.handleMousePressed(50, 75, 'RIGHT');
        expect(controller.button).to.equal('RIGHT');
      });
      
      it('should handle middle button', function() {
        controller.handleMousePressed(50, 75, 'CENTER');
        expect(controller.button).to.equal('CENTER');
      });
    });
  });
  
  describe('Mouse Drag Handling', function() {
    describe('handleMouseDragged()', function() {
      it('should set dragging state to true', function() {
        controller.handleMouseDragged(100, 200);
        expect(controller.isDragging).to.be.true;
      });
      
      it('should calculate delta from last position', function() {
        let capturedDx, capturedDy;
        controller.onDrag((x, y, dx, dy) => {
          capturedDx = dx;
          capturedDy = dy;
        });
        controller.lastX = 50;
        controller.lastY = 75;
        controller.handleMouseDragged(100, 200);
        expect(capturedDx).to.equal(50);
        expect(capturedDy).to.equal(125);
      });
      
      it('should update last position', function() {
        controller.handleMouseDragged(100, 200);
        expect(controller.lastX).to.equal(100);
        expect(controller.lastY).to.equal(200);
      });
      
      it('should invoke all drag handlers', function() {
        let count = 0;
        controller.onDrag(() => count++);
        controller.onDrag(() => count++);
        controller.handleMouseDragged(100, 200);
        expect(count).to.equal(2);
      });
      
      it('should pass x, y, dx, dy to handlers', function() {
        let capturedX, capturedY, capturedDx, capturedDy;
        controller.onDrag((x, y, dx, dy) => {
          capturedX = x;
          capturedY = y;
          capturedDx = dx;
          capturedDy = dy;
        });
        controller.lastX = 10;
        controller.lastY = 20;
        controller.handleMouseDragged(15, 25);
        expect(capturedX).to.equal(15);
        expect(capturedY).to.equal(25);
        expect(capturedDx).to.equal(5);
        expect(capturedDy).to.equal(5);
      });
      
      it('should handle negative delta', function() {
        let capturedDx, capturedDy;
        controller.onDrag((x, y, dx, dy) => {
          capturedDx = dx;
          capturedDy = dy;
        });
        controller.lastX = 100;
        controller.lastY = 200;
        controller.handleMouseDragged(50, 100);
        expect(capturedDx).to.equal(-50);
        expect(capturedDy).to.equal(-100);
      });
      
      it('should handle zero delta', function() {
        let capturedDx, capturedDy;
        controller.onDrag((x, y, dx, dy) => {
          capturedDx = dx;
          capturedDy = dy;
        });
        controller.lastX = 100;
        controller.lastY = 200;
        controller.handleMouseDragged(100, 200);
        expect(capturedDx).to.equal(0);
        expect(capturedDy).to.equal(0);
      });
      
      it('should accumulate position over multiple drags', function() {
        controller.handleMouseDragged(10, 20);
        controller.handleMouseDragged(20, 40);
        controller.handleMouseDragged(30, 60);
        expect(controller.lastX).to.equal(30);
        expect(controller.lastY).to.equal(60);
      });
    });
  });
  
  describe('Mouse Release Handling', function() {
    describe('handleMouseReleased()', function() {
      it('should reset dragging state', function() {
        controller.isDragging = true;
        controller.handleMouseReleased(100, 200, 'LEFT');
        expect(controller.isDragging).to.be.false;
      });
      
      it('should reset button', function() {
        controller.button = 'LEFT';
        controller.handleMouseReleased(100, 200, 'LEFT');
        expect(controller.button).to.be.null;
      });
      
      it('should invoke all release handlers', function() {
        let count = 0;
        controller.onRelease(() => count++);
        controller.onRelease(() => count++);
        controller.handleMouseReleased(100, 200, 'LEFT');
        expect(count).to.equal(2);
      });
      
      it('should pass x, y, button to handlers', function() {
        let capturedX, capturedY, capturedButton;
        controller.onRelease((x, y, button) => {
          capturedX = x;
          capturedY = y;
          capturedButton = button;
        });
        controller.handleMouseReleased(100, 200, 'LEFT');
        expect(capturedX).to.equal(100);
        expect(capturedY).to.equal(200);
        expect(capturedButton).to.equal('LEFT');
      });
    });
  });
  
  describe('Complete Interaction Sequences', function() {
    it('should handle press -> drag -> release sequence', function() {
      const events = [];
      controller.onClick(() => events.push('click'));
      controller.onDrag(() => events.push('drag'));
      controller.onRelease(() => events.push('release'));
      
      controller.handleMousePressed(10, 20, 'LEFT');
      controller.handleMouseDragged(15, 25);
      controller.handleMouseDragged(20, 30);
      controller.handleMouseReleased(20, 30, 'LEFT');
      
      expect(events).to.deep.equal(['click', 'drag', 'drag', 'release']);
    });
    
    it('should maintain dragging state during drag sequence', function() {
      controller.handleMousePressed(10, 20, 'LEFT');
      expect(controller.isDragging).to.be.false;
      
      controller.handleMouseDragged(15, 25);
      expect(controller.isDragging).to.be.true;
      
      controller.handleMouseDragged(20, 30);
      expect(controller.isDragging).to.be.true;
      
      controller.handleMouseReleased(20, 30, 'LEFT');
      expect(controller.isDragging).to.be.false;
    });
    
    it('should track position throughout sequence', function() {
      controller.handleMousePressed(0, 0, 'LEFT');
      expect(controller.lastX).to.equal(0);
      expect(controller.lastY).to.equal(0);
      
      controller.handleMouseDragged(10, 20);
      expect(controller.lastX).to.equal(10);
      expect(controller.lastY).to.equal(20);
      
      controller.handleMouseDragged(30, 40);
      expect(controller.lastX).to.equal(30);
      expect(controller.lastY).to.equal(40);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty handlers gracefully', function() {
      expect(() => controller.handleMousePressed(10, 20, 'LEFT')).to.not.throw();
      expect(() => controller.handleMouseDragged(15, 25)).to.not.throw();
      expect(() => controller.handleMouseReleased(20, 30, 'LEFT')).to.not.throw();
    });
    
    it('should handle handler throwing exception', function() {
      controller.onClick(() => { throw new Error('Handler error'); });
      expect(() => controller.handleMousePressed(10, 20, 'LEFT')).to.throw();
    });
    
    it('should handle negative coordinates', function() {
      controller.handleMousePressed(-10, -20, 'LEFT');
      expect(controller.lastX).to.equal(-10);
      expect(controller.lastY).to.equal(-20);
    });
    
    it('should handle very large coordinates', function() {
      controller.handleMousePressed(10000, 20000, 'LEFT');
      expect(controller.lastX).to.equal(10000);
      expect(controller.lastY).to.equal(20000);
    });
    
    it('should handle fractional coordinates', function() {
      controller.handleMousePressed(10.5, 20.7, 'LEFT');
      expect(controller.lastX).to.equal(10.5);
      expect(controller.lastY).to.equal(20.7);
    });
    
    it('should handle drag without initial press', function() {
      expect(() => controller.handleMouseDragged(10, 20)).to.not.throw();
      expect(controller.isDragging).to.be.true;
    });
    
    it('should handle release without press', function() {
      expect(() => controller.handleMouseReleased(10, 20, 'LEFT')).to.not.throw();
      expect(controller.isDragging).to.be.false;
    });
  });
});
