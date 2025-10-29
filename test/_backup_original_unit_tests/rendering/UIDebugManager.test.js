const { expect } = require('chai');
const path = require('path');

describe('UIDebugManager', () => {
  let UIDebugManager;
  
  before(() => {
    // Mock localStorage for Node.js environment
    if (typeof global.localStorage === 'undefined') {
      global.localStorage = {
        _data: {},
        getItem(key) { return this._data[key] || null; },
        setItem(key, value) { this._data[key] = value; },
        removeItem(key) { delete this._data[key]; },
        clear() { this._data = {}; }
      };
    }
    
    // Mock document and canvas
    global.document = {
      querySelector: () => ({
        getBoundingClientRect: () => ({ left: 0, top: 0 })
      })
    };
    
    // Mock window with event listeners
    global.window = {
      addEventListener: () => {},
      removeEventListener: () => {},
      innerWidth: 800,
      innerHeight: 600
    };
    
    // Load the class
    UIDebugManager = require(path.resolve(__dirname, '../../../Classes/rendering/UIDebugManager.js'));
  });
  
  beforeEach(() => {
    // Clear localStorage before each test
    global.mockLocalStorage = {};
    if (global.localStorage && global.localStorage.clear) {
      global.localStorage.clear();
    }
  });
  
  describe('Constructor', () => {
    it('should initialize with isActive false', () => {
      const manager = new UIDebugManager();
      expect(manager.isActive).to.be.false;
    });
    
    it('should initialize registeredElements as empty object', () => {
      const manager = new UIDebugManager();
      expect(manager.registeredElements).to.be.an('object');
      expect(Object.keys(manager.registeredElements)).to.have.lengthOf(0);
    });
    
    it('should initialize drag state', () => {
      const manager = new UIDebugManager();
      expect(manager.dragState).to.be.an('object');
      expect(manager.dragState.isDragging).to.be.false;
      expect(manager.dragState.elementId).to.be.null;
    });
    
    it('should initialize config with default values', () => {
      const manager = new UIDebugManager();
      expect(manager.config).to.have.property('boundingBoxColor');
      expect(manager.config).to.have.property('dragHandleColor');
      expect(manager.config).to.have.property('handleSize', 8);
      expect(manager.config).to.have.property('snapToGrid', false);
      expect(manager.config).to.have.property('gridSize', 10);
    });
    
    it('should initialize event listeners object', () => {
      const manager = new UIDebugManager();
      expect(manager.listeners).to.be.an('object');
      expect(manager.listeners).to.have.property('pointerDown');
      expect(manager.listeners).to.have.property('pointerMove');
      expect(manager.listeners).to.have.property('pointerUp');
      expect(manager.listeners).to.have.property('keyDown');
    });
  });
  
  describe('registerElement()', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should register element with valid parameters', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      const callback = () => {};
      
      const result = manager.registerElement('test-element', bounds, callback);
      expect(result).to.be.true;
      expect(manager.registeredElements['test-element']).to.exist;
    });
    
    it('should reject registration with null elementId', () => {
      const result = manager.registerElement(null, {}, () => {});
      expect(result).to.be.false;
    });
    
    it('should reject registration with invalid elementId type', () => {
      const result = manager.registerElement(123, {}, () => {});
      expect(result).to.be.false;
    });
    
    it('should reject registration with null bounds', () => {
      const result = manager.registerElement('test', null, () => {});
      expect(result).to.be.false;
    });
    
    it('should reject registration with invalid bounds', () => {
      const result = manager.registerElement('test', {}, () => {});
      expect(result).to.be.false;
    });
    
    it('should reject registration with null callback', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = manager.registerElement('test', bounds, null);
      expect(result).to.be.false;
    });
    
    it('should reject registration with invalid callback type', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      const result = manager.registerElement('test', bounds, 'not a function');
      expect(result).to.be.false;
    });
    
    it('should store element bounds', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {});
      
      expect(manager.registeredElements['test'].bounds).to.deep.include(bounds);
    });
    
    it('should store original bounds separately', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {});
      
      expect(manager.registeredElements['test'].originalBounds).to.deep.include(bounds);
    });
    
    it('should store position callback', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      const callback = () => {};
      manager.registerElement('test', bounds, callback);
      
      expect(manager.registeredElements['test'].positionCallback).to.equal(callback);
    });
    
    it('should use elementId as default label', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test-elem', bounds, () => {});
      
      expect(manager.registeredElements['test-elem'].label).to.equal('test-elem');
    });
    
    it('should use custom label when provided', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {}, { label: 'Custom Label' });
      
      expect(manager.registeredElements['test'].label).to.equal('Custom Label');
    });
    
    it('should use elementId as default persistKey', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {});
      
      expect(manager.registeredElements['test'].persistKey).to.equal('test');
    });
    
    it('should use custom persistKey when provided', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {}, { persistKey: 'persist-key' });
      
      expect(manager.registeredElements['test'].persistKey).to.equal('persist-key');
    });
    
    it('should default isDraggable to true', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {});
      
      expect(manager.registeredElements['test'].isDraggable).to.be.true;
    });
    
    it('should respect isDraggable option', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      manager.registerElement('test', bounds, () => {}, { isDraggable: false });
      
      expect(manager.registeredElements['test'].isDraggable).to.be.false;
    });
    
    it('should store constraints when provided', () => {
      const bounds = { x: 10, y: 20, width: 100, height: 50 };
      const constraints = { minX: 0, minY: 0, maxX: 500, maxY: 400 };
      manager.registerElement('test', bounds, () => {}, { constraints });
      
      expect(manager.registeredElements['test'].constraints).to.deep.equal(constraints);
    });
  });
  
  describe('unregisterElement()', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
      manager.registerElement('test', { x: 0, y: 0, width: 10, height: 10 }, () => {});
    });
    
    it('should unregister existing element', () => {
      const result = manager.unregisterElement('test');
      expect(result).to.be.true;
      expect(manager.registeredElements['test']).to.be.undefined;
    });
    
    it('should return false for non-existent element', () => {
      const result = manager.unregisterElement('non-existent');
      expect(result).to.be.false;
    });
  });
  
  describe('updateElementBounds()', () => {
    let manager, callback;
    
    beforeEach(() => {
      manager = new UIDebugManager();
      callback = () => {};
      manager.registerElement('test', { x: 100, y: 100, width: 50, height: 50 }, callback);
    });
    
    it('should update element bounds', () => {
      const result = manager.updateElementBounds('test', { x: 200, y: 200 });
      expect(result).to.be.true;
      expect(manager.registeredElements['test'].bounds.x).to.equal(200);
      expect(manager.registeredElements['test'].bounds.y).to.equal(200);
    });
    
    it('should return false for non-existent element', () => {
      const result = manager.updateElementBounds('non-existent', { x: 100 });
      expect(result).to.be.false;
    });
    
    it('should preserve existing bounds properties', () => {
      manager.updateElementBounds('test', { x: 200 });
      expect(manager.registeredElements['test'].bounds.y).to.equal(100);
      expect(manager.registeredElements['test'].bounds.width).to.equal(50);
    });
    
    it('should constrain position to screen', () => {
      manager.updateElementBounds('test', { x: -50, y: -50 });
      expect(manager.registeredElements['test'].bounds.x).to.be.at.least(0);
      expect(manager.registeredElements['test'].bounds.y).to.be.at.least(0);
    });
  });
  
  describe('toggle() and enable/disable()', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should toggle from disabled to enabled', () => {
      expect(manager.isActive).to.be.false;
      manager.toggle();
      expect(manager.isActive).to.be.true;
    });
    
    it('should toggle from enabled to disabled', () => {
      manager.isActive = true;
      manager.toggle();
      expect(manager.isActive).to.be.false;
    });
    
    it('should enable debug mode', () => {
      manager.enable();
      expect(manager.isActive).to.be.true;
    });
    
    it('should disable debug mode', () => {
      manager.isActive = true;
      manager.disable();
      expect(manager.enabled).to.be.false;
    });
  });
  
  describe('render()', () => {
    let manager, mockP5;
    
    beforeEach(() => {
      manager = new UIDebugManager();
      manager.registerElement('test', { x: 10, y: 20, width: 100, height: 50 }, () => {});
      
      mockP5 = {
        push: () => {},
        pop: () => {},
        stroke: () => {},
        strokeWeight: () => {},
        noFill: () => {},
        fill: () => {},
        noStroke: () => {},
        rect: () => {},
        text: () => {},
        textAlign: () => {},
        textSize: () => {},
        LEFT: 'left',
        TOP: 'top',
        height: 600
      };
    });
    
    it('should not render when inactive', () => {
      let rendered = false;
      mockP5.push = () => { rendered = true; };
      
      manager.render(mockP5);
      expect(rendered).to.be.false;
    });
    
    it('should render when active', () => {
      let rendered = false;
      mockP5.push = () => { rendered = true; };
      
      manager.enable();
      manager.render(mockP5);
      expect(rendered).to.be.true;
    });
  });
  
  describe('Drag Handling', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
      manager.registerElement('test', { x: 100, y: 100, width: 50, height: 50 }, () => {});
      manager.enable();
    });
    
    describe('handlePointerDown()', () => {
      it('should return false when inactive', () => {
        manager.disable();
        const result = manager.handlePointerDown({ x: 110, y: 110 });
        expect(result).to.be.false;
      });
      
      it('should detect drag handle click', () => {
        const handleX = 100 + 50 - 8; // x + width - handleSize
        const handleY = 100 + 8 / 2;   // y + handleSize / 2
        
        const result = manager.handlePointerDown({ x: handleX + 4, y: handleY });
        expect(result).to.be.true;
        expect(manager.dragState.isDragging).to.be.true;
      });
      
      it('should not start drag when clicking outside handle', () => {
        const result = manager.handlePointerDown({ x: 50, y: 50 });
        expect(result).to.be.false;
        expect(manager.dragState.isDragging).to.be.false;
      });
    });
    
    describe('startDragging()', () => {
      it('should initialize drag state', () => {
        manager.startDragging('test', 110, 110);
        expect(manager.dragState.isDragging).to.be.true;
        expect(manager.dragState.elementId).to.equal('test');
        expect(manager.dragState.startX).to.equal(110);
        expect(manager.dragState.startY).to.equal(110);
      });
      
      it('should not start drag for non-draggable element', () => {
        manager.registeredElements['test'].isDraggable = false;
        manager.startDragging('test', 110, 110);
        expect(manager.dragState.isDragging).to.be.false;
      });
    });
    
    describe('updateDragPosition()', () => {
      it('should not update when not dragging', () => {
        const originalX = manager.registeredElements['test'].bounds.x;
        manager.updateDragPosition(200, 200);
        expect(manager.registeredElements['test'].bounds.x).to.equal(originalX);
      });
      
      it('should update position when dragging', () => {
        manager.startDragging('test', 110, 110);
        manager.updateDragPosition(150, 150);
        
        // Delta: 40, 40. Original: 100, 100. New: 140, 140
        expect(manager.registeredElements['test'].bounds.x).to.equal(140);
        expect(manager.registeredElements['test'].bounds.y).to.equal(140);
      });
      
      it('should apply grid snapping when enabled', () => {
        manager.config.snapToGrid = true;
        manager.config.gridSize = 20;
        manager.startDragging('test', 110, 110);
        manager.updateDragPosition(155, 155);
        
        // Should snap to nearest grid (20 pixel grid)
        expect(manager.registeredElements['test'].bounds.x % 20).to.equal(0);
      });
    });
  });
  
  describe('moveElement()', () => {
    let manager, callbackCalled;
    
    beforeEach(() => {
      manager = new UIDebugManager();
      callbackCalled = false;
      manager.registerElement('test', { x: 100, y: 100, width: 50, height: 50 }, () => { callbackCalled = true; });
    });
    
    it('should move element to new position', () => {
      const result = manager.moveElement('test', 200, 200);
      expect(result).to.be.true;
      expect(manager.registeredElements['test'].bounds.x).to.equal(200);
      expect(manager.registeredElements['test'].bounds.y).to.equal(200);
    });
    
    it('should return false for non-existent element', () => {
      const result = manager.moveElement('non-existent', 200, 200);
      expect(result).to.be.false;
    });
    
    it('should call position callback', () => {
      manager.moveElement('test', 200, 200);
      expect(callbackCalled).to.be.true;
    });
    
    it('should constrain to screen boundaries', () => {
      manager.moveElement('test', -50, -50);
      expect(manager.registeredElements['test'].bounds.x).to.be.at.least(0);
      expect(manager.registeredElements['test'].bounds.y).to.be.at.least(0);
    });
    
    it('should apply custom constraints', () => {
      manager.registeredElements['test'].constraints = { minX: 50, minY: 50, maxX: 300, maxY: 300 };
      manager.moveElement('test', 10, 10);
      expect(manager.registeredElements['test'].bounds.x).to.be.at.least(50);
      expect(manager.registeredElements['test'].bounds.y).to.be.at.least(50);
    });
  });
  
  describe('Position Persistence', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should save element position', () => {
      const elementId = 'test-persist';
      const positionData = { x: 150, y: 250, width: 100, height: 50 };
      
      manager.saveElementPosition(elementId, positionData);
      
      // Check mock localStorage
      const key = manager.storagePrefix + elementId;
      expect(global.mockLocalStorage[key]).to.exist;
    });
    
    it('should load element position', () => {
      const elementId = 'test-persist';
      const positionData = { x: 150, y: 250 };
      
      // Save to mock localStorage
      global.mockLocalStorage[manager.storagePrefix + elementId] = JSON.stringify(positionData);
      
      const loaded = manager.loadElementPosition(elementId);
      expect(loaded).to.not.be.null;
      expect(loaded.x).to.equal(150);
      expect(loaded.y).to.equal(250);
    });
    
    it('should return null when no saved position', () => {
      const loaded = manager.loadElementPosition('never-saved');
      expect(loaded).to.be.null;
    });
    
    it('should apply loaded position to element', () => {
      const positionData = { x: 150, y: 250 };
      global.mockLocalStorage[manager.storagePrefix + 'test'] = JSON.stringify(positionData);
      
      let callbackX, callbackY;
      const callback = (x, y) => { callbackX = x; callbackY = y; };
      
      // Register element - should load saved position
      manager.registerElement('test', { x: 0, y: 0, width: 50, height: 50 }, callback);
      
      expect(manager.registeredElements['test'].bounds.x).to.equal(150);
      expect(manager.registeredElements['test'].bounds.y).to.equal(250);
    });
  });
  
  describe('constrainToScreen()', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should constrain negative X to 0', () => {
      const bounds = { x: -50, y: 100, width: 50, height: 50 };
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.x).to.equal(0);
    });
    
    it('should constrain negative Y to 0', () => {
      const bounds = { x: 100, y: -50, width: 50, height: 50 };
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.y).to.equal(0);
    });
    
    it('should constrain X to keep element on screen', () => {
      const bounds = { x: 850, y: 100, width: 50, height: 50 };
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.x).to.be.at.most(750); // 800 - 50
    });
    
    it('should constrain Y to keep element on screen', () => {
      const bounds = { x: 100, y: 650, width: 50, height: 50 };
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.y).to.be.at.most(550); // 600 - 50
    });
    
    it('should not modify bounds already within screen', () => {
      const bounds = { x: 100, y: 100, width: 50, height: 50 };
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.x).to.equal(100);
      expect(constrained.y).to.equal(100);
    });
  });
  
  describe('Cleanup', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should dispose without errors', () => {
      expect(() => manager.dispose()).to.not.throw();
    });
    
    it('should stop dragging on disable', () => {
      manager.registerElement('test', { x: 100, y: 100, width: 50, height: 50 }, () => {});
      manager.enable();
      manager.startDragging('test', 110, 110);
      
      manager.disable();
      expect(manager.dragState.active).to.be.false;
    });
  });
  
  describe('Edge Cases', () => {
    let manager;
    
    beforeEach(() => {
      manager = new UIDebugManager();
    });
    
    it('should handle registration with minimal options', () => {
      const result = manager.registerElement('minimal', { x: 0, y: 0, width: 1, height: 1 }, () => {});
      expect(result).to.be.true;
    });
    
    it('should handle zero-size elements', () => {
      const result = manager.registerElement('zero', { x: 0, y: 0, width: 0, height: 0 }, () => {});
      expect(result).to.be.true;
    });
    
    it('should handle very large coordinates', () => {
      const bounds = { x: 99999, y: 99999, width: 100, height: 100 };
      manager.registerElement('large', bounds, () => {});
      
      // Should constrain to screen
      const constrained = manager.constrainToScreen(bounds);
      expect(constrained.x).to.be.at.most(700); // 800 - 100
    });
    
    it('should handle multiple elements', () => {
      manager.registerElement('elem1', { x: 10, y: 10, width: 50, height: 50 }, () => {});
      manager.registerElement('elem2', { x: 100, y: 100, width: 50, height: 50 }, () => {});
      manager.registerElement('elem3', { x: 200, y: 200, width: 50, height: 50 }, () => {});
      
      expect(Object.keys(manager.registeredElements)).to.have.lengthOf(3);
    });
    
    it('should handle updating non-draggable element', () => {
      manager.registerElement('fixed', { x: 100, y: 100, width: 50, height: 50 }, () => {}, { isDraggable: false });
      manager.enable();
      
      manager.startDragging('fixed', 110, 110);
      expect(manager.dragState.isDragging).to.be.false;
    });
    
    it('should handle render without p5 instance', () => {
      manager.enable();
      manager.registerElement('test', { x: 10, y: 10, width: 50, height: 50 }, () => {});
      
      expect(() => manager.render()).to.not.throw();
    });
  });
});
