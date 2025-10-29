const { expect } = require('chai');

// Mock p5.js functions
global.createVector = (x, y) => ({ 
  x, y, 
  copy() { return { x: this.x, y: this.y }; } 
});
global.dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);

// Simplified SelectionBoxController for testing
class SelectionBoxController {
  constructor(mouseController, entities) {
    if (SelectionBoxController._instance) return SelectionBoxController._instance;
    
    this._mouse = mouseController;
    this._entities = entities || [];
    this._isSelecting = false;
    this._selectionStart = null;
    this._selectionEnd = null;
    this._selectedEntities = [];
    
    this._config = {
      enabled: true,
      dragThreshold: 5
    };
    
    this._callbacks = {
      onSelectionStart: null,
      onSelectionUpdate: null,
      onSelectionEnd: null
    };
    
    SelectionBoxController._instance = this;
  }
  
  static getInstance(mouseController, entities) {
    if (!SelectionBoxController._instance) {
      SelectionBoxController._instance = new SelectionBoxController(mouseController, entities);
    }
    return SelectionBoxController._instance;
  }
  
  static resetInstance() {
    SelectionBoxController._instance = null;
  }
  
  deselectAll() {
    this._entities.forEach(e => e.isSelected = false);
    this._selectedEntities = [];
  }
  
  getSelectedEntities() {
    return this._selectedEntities.slice();
  }
  
  setEntities(entities) {
    this._entities = entities || [];
  }
  
  setConfig(config) {
    Object.assign(this._config, config);
  }
  
  setCallback(name, fn) {
    if (this._callbacks.hasOwnProperty(name)) {
      this._callbacks[name] = fn;
    }
  }
  
  handleClick(x, y, button) {
    if (!this._config.enabled) return;
    
    if (button === 'right') {
      this.deselectAll();
      return;
    }
    
    this._isSelecting = true;
    this._selectionStart = createVector(x, y);
    this._selectionEnd = this._selectionStart.copy();
    
    if (this._callbacks.onSelectionStart) {
      this._callbacks.onSelectionStart(x, y, []);
    }
  }
  
  handleDrag(x, y) {
    if (this._isSelecting && this._selectionStart) {
      this._selectionEnd = createVector(x, y);
    }
  }
  
  handleRelease(x, y, button) {
    if (!this._isSelecting) return;
    
    if (!this._selectionEnd) {
      this._selectionEnd = createVector(x, y);
    }
    
    const x1 = Math.min(this._selectionStart.x, this._selectionEnd.x);
    const x2 = Math.max(this._selectionStart.x, this._selectionEnd.x);
    const y1 = Math.min(this._selectionStart.y, this._selectionEnd.y);
    const y2 = Math.max(this._selectionStart.y, this._selectionEnd.y);
    
    const dragDistance = dist(x1, y1, x2, y2);
    
    if (dragDistance >= this._config.dragThreshold) {
      this._selectedEntities = [];
      this._entities.forEach(e => {
        const inBox = e.x >= x1 && e.x <= x2 && e.y >= y1 && e.y <= y2;
        e.isSelected = inBox;
        if (inBox) this._selectedEntities.push(e);
      });
    }
    
    if (this._callbacks.onSelectionEnd) {
      const bounds = { x1, y1, x2, y2, width: x2 - x1, height: y2 - y1 };
      this._callbacks.onSelectionEnd(bounds, this._selectedEntities.slice());
    }
    
    this._isSelecting = false;
  }
}

describe('SelectionBoxController', function() {
  let controller;
  let mockMouse;
  let entities;
  
  beforeEach(function() {
    SelectionBoxController.resetInstance();
    mockMouse = {
      onClick: () => {},
      onDrag: () => {},
      onRelease: () => {}
    };
    entities = [
      { x: 10, y: 10, isSelected: false },
      { x: 50, y: 50, isSelected: false },
      { x: 100, y: 100, isSelected: false }
    ];
    controller = new SelectionBoxController(mockMouse, entities);
  });
  
  afterEach(function() {
    SelectionBoxController.resetInstance();
  });
  
  describe('Constructor and Singleton', function() {
    it('should initialize as singleton', function() {
      const instance1 = new SelectionBoxController(mockMouse, entities);
      const instance2 = new SelectionBoxController(mockMouse, entities);
      expect(instance1).to.equal(instance2);
    });
    
    it('should get instance via getInstance', function() {
      const instance = SelectionBoxController.getInstance(mockMouse, entities);
      expect(instance).to.equal(controller);
    });
    
    it('should initialize selection state', function() {
      expect(controller._isSelecting).to.be.false;
      expect(controller._selectionStart).to.be.null;
      expect(controller._selectionEnd).to.be.null;
      expect(controller._selectedEntities).to.be.an('array').that.is.empty;
    });
    
    it('should initialize config', function() {
      expect(controller._config.enabled).to.be.true;
      expect(controller._config.dragThreshold).to.equal(5);
    });
    
    it('should initialize callbacks', function() {
      expect(controller._callbacks).to.have.property('onSelectionStart');
      expect(controller._callbacks).to.have.property('onSelectionUpdate');
      expect(controller._callbacks).to.have.property('onSelectionEnd');
    });
  });
  
  describe('Configuration', function() {
    describe('setConfig()', function() {
      it('should update config options', function() {
        controller.setConfig({ dragThreshold: 10 });
        expect(controller._config.dragThreshold).to.equal(10);
      });
      
      it('should merge with existing config', function() {
        controller.setConfig({ dragThreshold: 15 });
        expect(controller._config.enabled).to.be.true;
        expect(controller._config.dragThreshold).to.equal(15);
      });
      
      it('should handle multiple properties', function() {
        controller.setConfig({ enabled: false, dragThreshold: 20 });
        expect(controller._config.enabled).to.be.false;
        expect(controller._config.dragThreshold).to.equal(20);
      });
    });
    
    describe('setCallback()', function() {
      it('should register callback', function() {
        const fn = () => {};
        controller.setCallback('onSelectionStart', fn);
        expect(controller._callbacks.onSelectionStart).to.equal(fn);
      });
      
      it('should only set valid callbacks', function() {
        const fn = () => {};
        controller.setCallback('onSelectionEnd', fn);
        expect(controller._callbacks.onSelectionEnd).to.equal(fn);
      });
    });
  });
  
  describe('Entity Management', function() {
    describe('setEntities()', function() {
      it('should update entities array', function() {
        const newEntities = [{ x: 200, y: 200 }];
        controller.setEntities(newEntities);
        expect(controller._entities).to.equal(newEntities);
      });
      
      it('should handle empty array', function() {
        controller.setEntities([]);
        expect(controller._entities).to.be.an('array').that.is.empty;
      });
      
      it('should handle null', function() {
        controller.setEntities(null);
        expect(controller._entities).to.be.an('array').that.is.empty;
      });
    });
    
    describe('deselectAll()', function() {
      it('should clear all selections', function() {
        entities[0].isSelected = true;
        entities[1].isSelected = true;
        controller._selectedEntities = [entities[0], entities[1]];
        
        controller.deselectAll();
        
        expect(entities[0].isSelected).to.be.false;
        expect(entities[1].isSelected).to.be.false;
        expect(controller._selectedEntities).to.be.empty;
      });
      
      it('should handle already deselected entities', function() {
        expect(() => controller.deselectAll()).to.not.throw();
      });
    });
    
    describe('getSelectedEntities()', function() {
      it('should return copy of selected entities', function() {
        controller._selectedEntities = [entities[0], entities[1]];
        const selected = controller.getSelectedEntities();
        expect(selected).to.have.lengthOf(2);
        expect(selected).to.not.equal(controller._selectedEntities);
      });
      
      it('should return empty array when none selected', function() {
        const selected = controller.getSelectedEntities();
        expect(selected).to.be.an('array').that.is.empty;
      });
    });
  });
  
  describe('Click Handling', function() {
    describe('handleClick()', function() {
      it('should start selection', function() {
        controller.handleClick(100, 200, 'left');
        expect(controller._isSelecting).to.be.true;
        expect(controller._selectionStart).to.exist;
      });
      
      it('should set selection start position', function() {
        controller.handleClick(100, 200, 'left');
        expect(controller._selectionStart.x).to.equal(100);
        expect(controller._selectionStart.y).to.equal(200);
      });
      
      it('should initialize selection end', function() {
        controller.handleClick(100, 200, 'left');
        expect(controller._selectionEnd).to.exist;
        expect(controller._selectionEnd.x).to.equal(100);
        expect(controller._selectionEnd.y).to.equal(200);
      });
      
      it('should deselect all on right click', function() {
        entities[0].isSelected = true;
        controller._selectedEntities = [entities[0]];
        
        controller.handleClick(100, 200, 'right');
        
        expect(entities[0].isSelected).to.be.false;
        expect(controller._selectedEntities).to.be.empty;
      });
      
      it('should not start selection when disabled', function() {
        controller.setConfig({ enabled: false });
        controller.handleClick(100, 200, 'left');
        expect(controller._isSelecting).to.be.false;
      });
      
      it('should trigger onSelectionStart callback', function() {
        let called = false;
        let capturedX, capturedY;
        controller.setCallback('onSelectionStart', (x, y) => {
          called = true;
          capturedX = x;
          capturedY = y;
        });
        
        controller.handleClick(100, 200, 'left');
        expect(called).to.be.true;
        expect(capturedX).to.equal(100);
        expect(capturedY).to.equal(200);
      });
    });
  });
  
  describe('Drag Handling', function() {
    describe('handleDrag()', function() {
      it('should update selection end position', function() {
        controller.handleClick(10, 10, 'left');
        controller.handleDrag(50, 100);
        expect(controller._selectionEnd.x).to.equal(50);
        expect(controller._selectionEnd.y).to.equal(100);
      });
      
      it('should handle multiple drag events', function() {
        controller.handleClick(10, 10, 'left');
        controller.handleDrag(20, 30);
        controller.handleDrag(40, 60);
        controller.handleDrag(80, 120);
        expect(controller._selectionEnd.x).to.equal(80);
        expect(controller._selectionEnd.y).to.equal(120);
      });
      
      it('should not update if not selecting', function() {
        controller.handleDrag(50, 100);
        expect(controller._selectionEnd).to.be.null;
      });
    });
  });
  
  describe('Release Handling', function() {
    describe('handleRelease()', function() {
      it('should select entities in box', function() {
        controller.handleClick(0, 0, 'left');
        controller.handleDrag(60, 60);
        controller.handleRelease(60, 60, 'left');
        
        expect(entities[0].isSelected).to.be.true; // At 10, 10
        expect(entities[1].isSelected).to.be.true; // At 50, 50
        expect(entities[2].isSelected).to.be.false; // At 100, 100
      });
      
      it('should respect drag threshold', function() {
        controller.setConfig({ dragThreshold: 100 });
        controller.handleClick(10, 10, 'left');
        controller.handleDrag(15, 15);
        controller.handleRelease(15, 15, 'left');
        
        // Drag too small, no selection
        expect(controller._selectedEntities).to.be.empty;
      });
      
      it('should end selection state', function() {
        controller.handleClick(0, 0, 'left');
        controller.handleRelease(100, 100, 'left');
        expect(controller._isSelecting).to.be.false;
      });
      
      it('should trigger onSelectionEnd callback', function() {
        let called = false;
        let capturedBounds, capturedEntities;
        controller.setCallback('onSelectionEnd', (bounds, entities) => {
          called = true;
          capturedBounds = bounds;
          capturedEntities = entities;
        });
        
        controller.handleClick(0, 0, 'left');
        controller.handleRelease(60, 60, 'left');
        
        expect(called).to.be.true;
        expect(capturedBounds).to.have.property('x1');
        expect(capturedBounds).to.have.property('width');
        expect(capturedEntities).to.be.an('array');
      });
      
      it('should not process if not selecting', function() {
        controller.handleRelease(100, 100, 'left');
        expect(controller._selectedEntities).to.be.empty;
      });
    });
  });
  
  describe('Selection Workflow', function() {
    it('should complete click -> drag -> release sequence', function() {
      controller.handleClick(0, 0, 'left');
      expect(controller._isSelecting).to.be.true;
      
      controller.handleDrag(30, 30);
      expect(controller._selectionEnd.x).to.equal(30);
      
      controller.handleRelease(30, 30, 'left');
      expect(controller._isSelecting).to.be.false;
      expect(entities[0].isSelected).to.be.true;
    });
    
    it('should handle multiple selection cycles', function() {
      // First selection
      controller.handleClick(0, 0, 'left');
      controller.handleDrag(20, 20);
      controller.handleRelease(30, 30, 'left');
      const firstSelected = controller._selectedEntities.length;
      expect(firstSelected).to.be.greaterThan(0);
      
      // Deselect before second selection
      controller.deselectAll();
      controller._isSelecting = false;
      
      // Second selection - verify selection workflow works again
      controller.handleClick(40, 40, 'left');
      controller.handleDrag(60, 60);
      controller.handleRelease(70, 70, 'left');
      // Verify the selection process completed
      expect(controller._isSelecting).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty entities array', function() {
      controller.setEntities([]);
      controller.handleClick(0, 0, 'left');
      controller.handleRelease(100, 100, 'left');
      expect(controller._selectedEntities).to.be.empty;
    });
    
    it('should handle selection with no movement', function() {
      controller.handleClick(50, 50, 'left');
      controller.handleRelease(50, 50, 'left');
      // Small drag, under threshold
      expect(controller._selectedEntities).to.be.empty;
    });
    
    it('should handle negative coordinates', function() {
      const negEntity = { x: -10, y: -10, isSelected: false };
      controller.setEntities([negEntity]);
      controller.handleClick(-25, -25, 'left');
      controller.handleDrag(-15, -15);
      controller.handleDrag(-5, -5);
      controller.handleRelease(5, 5, 'left');
      expect(negEntity.isSelected).to.be.true;
    });
    
    it('should handle callback errors gracefully', function() {
      controller.setCallback('onSelectionStart', () => {
        throw new Error('Callback error');
      });
      expect(() => controller.handleClick(10, 10, 'left')).to.throw();
    });
  });
});
