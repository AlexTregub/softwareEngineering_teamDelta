/**
 * Unit Tests for BrushBase
 * Tests base brush functionality for painting tools
 */

const { expect } = require('chai');

// Mock p5.js
global.mouseX = 100;
global.mouseY = 100;

// Load BrushBase
const { BrushBase } = require('../../../Classes/systems/tools/BrushBase');

describe('BrushBase', function() {
  
  let brush;
  
  beforeEach(function() {
    brush = new BrushBase();
  });
  
  describe('Constructor', function() {
    
    it('should create brush with default settings', function() {
      expect(brush.isActive).to.be.false;
      expect(brush.brushSize).to.equal(30);
      expect(brush.spawnCooldown).to.equal(100);
    });
    
    it('should initialize cursor position', function() {
      expect(brush.cursorPosition).to.deep.equal({ x: 0, y: 0 });
    });
    
    it('should initialize pulse animation', function() {
      expect(brush.pulseAnimation).to.equal(0);
      expect(brush.pulseSpeed).to.equal(0.05);
    });
    
    it('should initialize type cycling support', function() {
      expect(brush.availableTypes).to.be.an('array');
      expect(brush.currentIndex).to.equal(0);
    });
  });
  
  describe('toggle()', function() {
    
    it('should toggle active state', function() {
      expect(brush.isActive).to.be.false;
      
      brush.toggle();
      expect(brush.isActive).to.be.true;
      
      brush.toggle();
      expect(brush.isActive).to.be.false;
    });
    
    it('should return new active state', function() {
      const result = brush.toggle();
      expect(result).to.be.true;
    });
  });
  
  describe('cycleType()', function() {
    
    it('should cycle through available types', function() {
      brush.availableTypes = [
        { type: 'A', name: 'Type A' },
        { type: 'B', name: 'Type B' },
        { type: 'C', name: 'Type C' }
      ];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      brush.cycleType();
      expect(brush.currentIndex).to.equal(1);
      expect(brush.currentType.type).to.equal('B');
    });
    
    it('should wrap around to start', function() {
      brush.availableTypes = [
        { type: 'A' },
        { type: 'B' }
      ];
      brush.currentIndex = 1;
      brush.currentType = brush.availableTypes[1];
      
      brush.cycleType();
      expect(brush.currentIndex).to.equal(0);
      expect(brush.currentType.type).to.equal('A');
    });
    
    it('should handle empty types array', function() {
      brush.availableTypes = [];
      
      const result = brush.cycleType();
      expect(result).to.be.null;
    });
    
    it('should support backwards cycling with negative step', function() {
      brush.availableTypes = [
        { type: 'A' },
        { type: 'B' },
        { type: 'C' }
      ];
      brush.currentIndex = 2;
      brush.currentType = brush.availableTypes[2];
      
      brush.cycleType(-1);
      expect(brush.currentIndex).to.equal(1);
    });
  });
  
  describe('cycleTypeStep()', function() {
    
    it('should cycle by specified step', function() {
      brush.availableTypes = [
        { type: 'A' },
        { type: 'B' },
        { type: 'C' },
        { type: 'D' }
      ];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      brush.cycleTypeStep(2);
      expect(brush.currentIndex).to.equal(2);
    });
    
    it('should handle negative steps', function() {
      brush.availableTypes = [
        { type: 'A' },
        { type: 'B' },
        { type: 'C' }
      ];
      brush.currentIndex = 2;
      brush.currentType = brush.availableTypes[2];
      
      brush.cycleTypeStep(-1);
      expect(brush.currentIndex).to.equal(1);
    });
    
    it('should wrap correctly with large steps', function() {
      brush.availableTypes = [
        { type: 'A' },
        { type: 'B' },
        { type: 'C' }
      ];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      brush.cycleTypeStep(5);
      expect(brush.currentIndex).to.be.lessThan(3);
    });
    
    it('should return current type when step is 0', function() {
      brush.availableTypes = [{ type: 'A' }];
      brush.currentType = brush.availableTypes[0];
      
      const result = brush.cycleTypeStep(0);
      expect(result).to.equal(brush.currentType);
    });
  });
  
  describe('setType()', function() {
    
    it('should set type by key', function() {
      brush.availableTypes = [
        { type: 'greenLeaf', name: 'Green Leaf' },
        { type: 'stick', name: 'Stick' }
      ];
      
      brush.setType('stick');
      
      expect(brush.currentType.type).to.equal('stick');
      expect(brush.currentIndex).to.equal(1);
    });
    
    it('should find type by name property', function() {
      brush.availableTypes = [
        { name: 'Resource A' },
        { name: 'Resource B' }
      ];
      
      brush.setType('Resource B');
      
      expect(brush.currentType.name).to.equal('Resource B');
    });
    
    it('should return null for unknown type', function() {
      brush.availableTypes = [{ type: 'A' }];
      
      const result = brush.setType('UNKNOWN');
      
      expect(result).to.be.null;
    });
    
    it('should handle empty types array', function() {
      brush.availableTypes = [];
      
      const result = brush.setType('anything');
      
      expect(result).to.be.null;
    });
  });
  
  describe('update()', function() {
    
    it('should update cursor position', function() {
      brush.isActive = true;
      global.mouseX = 200;
      global.mouseY = 300;
      
      brush.update();
      
      expect(brush.cursorPosition.x).to.equal(200);
      expect(brush.cursorPosition.y).to.equal(300);
    });
    
    it('should not update when inactive', function() {
      brush.isActive = false;
      const oldX = brush.cursorPosition.x;
      
      brush.update();
      
      expect(brush.cursorPosition.x).to.equal(oldX);
    });
    
    it('should update pulse animation', function() {
      brush.isActive = true;
      const oldPulse = brush.pulseAnimation;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.be.greaterThan(oldPulse);
    });
    
    it('should wrap pulse animation at 2*PI', function() {
      brush.isActive = true;
      brush.pulseAnimation = Math.PI * 2 + 0.1;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.be.lessThan(Math.PI * 2);
    });
  });
  
  describe('onMousePressed()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should call performAction on LEFT click', function() {
      brush.isActive = true;
      let called = false;
      
      brush.performAction = () => { called = true; };
      
      brush.onMousePressed(100, 100, 'LEFT');
      
      expect(called).to.be.true;
    });
    
    it('should cycle type on RIGHT click', function() {
      brush.isActive = true;
      brush.availableTypes = [{ type: 'A' }, { type: 'B' }];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      brush.onMousePressed(100, 100, 'RIGHT');
      
      expect(brush.currentIndex).to.equal(1);
    });
    
    it('should return true when consuming LEFT event', function() {
      brush.isActive = true;
      brush.performAction = () => {};
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.true;
    });
    
    it('should return false when performAction not implemented', function() {
      brush.isActive = true;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
  });
  
  describe('onMouseReleased()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should return false by default', function() {
      brush.isActive = true;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
  });
  
  describe('getDebugInfo()', function() {
    
    it('should return debug information', function() {
      brush.availableTypes = [
        { name: 'Type A' },
        { type: 'typeB' }
      ];
      brush.currentType = brush.availableTypes[0];
      
      const info = brush.getDebugInfo();
      
      expect(info).to.have.property('isActive');
      expect(info).to.have.property('brushSize');
      expect(info).to.have.property('spawnCooldown');
      expect(info).to.have.property('availableTypes');
      expect(info).to.have.property('currentType');
    });
    
    it('should map available types to names', function() {
      brush.availableTypes = [
        { name: 'Resource A' },
        { name: 'Resource B' }
      ];
      
      const info = brush.getDebugInfo();
      
      expect(info.availableTypes).to.deep.equal(['Resource A', 'Resource B']);
    });
    
    it('should handle missing currentType', function() {
      brush.currentType = null;
      
      const info = brush.getDebugInfo();
      
      expect(info.currentType).to.be.null;
    });
  });
  
  describe('onTypeChanged callback', function() {
    
    it('should call onTypeChanged when type changes', function() {
      let callbackCalled = false;
      let callbackArg = null;
      
      brush.onTypeChanged = (type) => {
        callbackCalled = true;
        callbackArg = type;
      };
      
      brush.availableTypes = [{ type: 'A' }, { type: 'B' }];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      brush.cycleType();
      
      expect(callbackCalled).to.be.true;
      expect(callbackArg.type).to.equal('B');
    });
    
    it('should handle callback errors gracefully', function() {
      brush.onTypeChanged = () => {
        throw new Error('Callback error');
      };
      
      brush.availableTypes = [{ type: 'A' }, { type: 'B' }];
      brush.currentIndex = 0;
      brush.currentType = brush.availableTypes[0];
      
      expect(() => brush.cycleType()).to.not.throw();
    });
  });
});

describe('BrushBase Global Export', function() {
  
  it('should export BrushBase in browser environment', function() {
    const mockWindow = {};
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/tools/BrushBase')];
    require('../../../Classes/systems/tools/BrushBase');
    
    expect(mockWindow.BrushBase).to.exist;
    
    delete global.window;
  });
});
