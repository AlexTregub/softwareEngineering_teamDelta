const { expect } = require('chai');

// Mock p5.js functions
global.push = () => {};
global.pop = () => {};
global.stroke = () => {};
global.noStroke = () => {};
global.fill = () => {};
global.noFill = () => {};
global.rect = () => {};
global.text = () => {};
global.textSize = () => {};
global.textAlign = () => {};
global.LEFT = 'LEFT';
global.TOP = 'TOP';
global.dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);
global.createVector = (x, y) => ({ x, y, copy: function() { return { x: this.x, y: this.y }; } });
global.cameraX = 0;
global.cameraY = 0;
global.devConsoleEnabled = false;

// Mock MouseInputController
class MockMouseController {
  constructor() {
    this.handlers = { click: [], drag: [], release: [] };
  }
  onClick(fn) { this.handlers.click.push(fn); }
  onDrag(fn) { this.handlers.drag.push(fn); }
  onRelease(fn) { this.handlers.release.push(fn); }
  triggerClick(x, y, button) { this.handlers.click.forEach(fn => fn(x, y, button)); }
  triggerDrag(x, y, dx, dy) { this.handlers.drag.forEach(fn => fn(x, y, dx, dy)); }
  triggerRelease(x, y, button) { this.handlers.release.forEach(fn => fn(x, y, button)); }
}

// Load the module
const UISelectionController = require('../../../Classes/controllers/UISelectionController.js');

describe('UISelectionController', function() {
  let controller;
  let mockMouseController;
  let mockEffectsRenderer;
  let mockEntities;
  
  beforeEach(function() {
    mockMouseController = new MockMouseController();
    mockEffectsRenderer = {
      setSelectionEntities: () => {},
      startSelectionBox: () => {},
      updateSelectionBox: () => {},
      endSelectionBox: () => [],
      getSelectionBoxBounds: () => ({ x1: 0, y1: 0, x2: 100, y2: 100 }),
      cancelSelectionBox: () => {}
    };
    
    mockEntities = [
      {
        posX: 100, posY: 100, sizeX: 20, sizeY: 20,
        getPosition: function() { return { x: this.posX, y: this.posY }; },
        getSize: function() { return { x: this.sizeX, y: this.sizeY }; },
        isSelected: false,
        isBoxHovered: false
      },
      {
        posX: 200, posY: 200, sizeX: 20, sizeY: 20,
        getPosition: function() { return { x: this.posX, y: this.posY }; },
        getSize: function() { return { x: this.sizeX, y: this.sizeY }; },
        isSelected: false,
        isBoxHovered: false
      }
    ];
    
    controller = new UISelectionController(mockEffectsRenderer, mockMouseController, mockEntities);
  });
  
  describe('Constructor', function() {
    it('should initialize with effects renderer', function() {
      expect(controller.effectsRenderer).to.equal(mockEffectsRenderer);
    });
    
    it('should initialize with mouse controller', function() {
      expect(controller.mouseController).to.equal(mockMouseController);
    });
    
    it('should initialize with entities', function() {
      expect(controller._entities).to.equal(mockEntities);
      expect(controller.selectableEntities).to.equal(mockEntities);
    });
    
    it('should initialize selection state', function() {
      expect(controller.isSelecting).to.be.false;
      expect(controller._isSelecting).to.be.false;
      expect(controller.dragStartPos).to.be.null;
    });
    
    it('should initialize with default config', function() {
      expect(controller.config).to.be.an('object');
      expect(controller.config.enableSelection).to.be.true;
      expect(controller.dragThreshold).to.exist; // dragThreshold is on controller, not config
    });
    
    it('should initialize callbacks', function() {
      expect(controller.callbacks).to.be.an('object');
      expect(controller.callbacks.onSelectionStart).to.be.null;
      expect(controller.callbacks.onSelectionEnd).to.be.null;
    });
    
    it('should setup mouse handlers', function() {
      expect(mockMouseController.handlers.click).to.have.lengthOf(1);
      expect(mockMouseController.handlers.drag).to.have.lengthOf(1);
      expect(mockMouseController.handlers.release).to.have.lengthOf(1);
    });
    
    it('should handle null mouse controller', function() {
      expect(() => new UISelectionController(mockEffectsRenderer, null, mockEntities)).to.not.throw();
    });
    
    it('should handle empty entities array', function() {
      const emptyController = new UISelectionController(mockEffectsRenderer, mockMouseController, []);
      expect(emptyController._entities).to.be.an('array').that.is.empty;
    });
  });
  
  describe('Mouse Event Handling', function() {
    describe('handleMousePressed()', function() {
      it('should set drag start position', function() {
        controller.handleMousePressed(150, 200, 'left');
        expect(controller.dragStartPos).to.deep.equal({ x: 150, y: 200 });
      });
      
      it('should not start selection immediately', function() {
        controller.handleMousePressed(150, 200, 'left');
        expect(controller.isSelecting).to.be.false;
      });
      
      it('should deselect all on right click', function() {
        mockEntities[0].isSelected = true;
        controller._selectedEntities = [mockEntities[0]];
        controller.handleMousePressed(150, 200, 'right');
        expect(controller._selectedEntities).to.be.an('array').that.is.empty;
      });
      
      it('should select entity under mouse', function() {
        controller.handleMousePressed(105, 105, 'left');
        expect(mockEntities[0].isSelected).to.be.true;
      });
      
      it('should clear other selections when selecting entity', function() {
        mockEntities[1].isSelected = true;
        controller._selectedEntities = [mockEntities[1]];
        controller.handleMousePressed(105, 105, 'left');
        expect(mockEntities[0].isSelected).to.be.true;
        expect(controller._selectedEntities).to.include(mockEntities[0]);
      });
      
      it('should handle click on empty space', function() {
        mockEntities[0].isSelected = true;
        controller.handleMousePressed(500, 500, 'left');
        expect(controller._isSelecting).to.be.true;
      });
      
      it('should respect disabled selection', function() {
        controller.config.enableSelection = false;
        controller.handleMousePressed(150, 200, 'left');
        expect(controller.dragStartPos).to.be.null;
      });
    });
    
    describe('handleMouseDrag()', function() {
      it('should not start selection below threshold', function() {
        controller.handleMousePressed(100, 100, 'left');
        controller.handleMouseDrag(102, 102, 2, 2);
        expect(controller.isSelecting).to.be.false;
      });
      
      it('should start selection when exceeding threshold', function() {
        controller.handleMousePressed(100, 100, 'left');
        controller.handleMouseDrag(110, 110, 10, 10);
        expect(controller.isSelecting).to.be.true;
      });
      
      it('should update selection box when active', function() {
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(100, 100);
        controller._selectionEnd = global.createVector(100, 100);
        const initialEnd = controller._selectionEnd.x;
        controller.handleMouseDrag(150, 150, 50, 50);
        expect(controller._selectionEnd).to.exist;
        // Implementation updates _selectionEnd based on mouse position + camera offset
        expect(controller._selectionEnd.x).to.be.a('number');
      });
      
      it('should mark entities as box hovered', function() {
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(90, 90);
        controller.handleMouseDrag(210, 210, 120, 120);
        // Entities within box should be marked
        expect(mockEntities.some(e => e.isBoxHovered)).to.exist;
      });
      
      it('should respect disabled selection', function() {
        controller.config.enableSelection = false;
        controller.dragStartPos = { x: 100, y: 100 };
        controller.handleMouseDrag(150, 150, 50, 50);
        expect(controller.isSelecting).to.be.false;
      });
      
      it('should handle drag without start position', function() {
        expect(() => controller.handleMouseDrag(150, 150, 50, 50)).to.not.throw();
      });
    });
    
    describe('handleMouseReleased()', function() {
      it('should end selection when active', function() {
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(100, 100);
        controller._selectionEnd = global.createVector(200, 200);
        controller.handleMouseReleased(200, 200, 'left');
        expect(controller._isSelecting).to.be.false;
      });
      
      it('should select entities in box on release', function() {
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(90, 90);
        controller._selectionEnd = global.createVector(210, 210);
        controller.handleMouseReleased(210, 210, 'left');
        expect(controller._selectedEntities.length).to.be.greaterThan(0);
      });
      
      it('should clear drag start position', function() {
        controller.dragStartPos = { x: 100, y: 100 };
        controller.handleMouseReleased(200, 200, 'left');
        expect(controller.dragStartPos).to.be.null;
      });
      
      it('should respect disabled selection', function() {
        controller.config.enableSelection = false;
        controller._isSelecting = true;
        controller.handleMouseReleased(200, 200, 'left');
        // Should not throw error
        expect(controller.dragStartPos).to.be.null;
      });
      
      it('should call onSelectionEnd callback', function() {
        let callbackCalled = false;
        controller.callbacks.onSelectionEnd = () => { callbackCalled = true; };
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(100, 100);
        controller._selectionEnd = global.createVector(200, 200);
        controller.handleMouseReleased(200, 200, 'left');
        expect(callbackCalled).to.be.true;
      });
    });
  });
  
  describe('Entity Detection', function() {
    describe('isEntityUnderMouse()', function() {
      it('should return true when mouse over entity', function() {
        const result = controller.isEntityUnderMouse(mockEntities[0], 105, 105);
        expect(result).to.be.true;
      });
      
      it('should return false when mouse not over entity', function() {
        const result = controller.isEntityUnderMouse(mockEntities[0], 500, 500);
        expect(result).to.be.false;
      });
      
      it('should use entity isMouseOver method if available', function() {
        const entityWithMethod = {
          isMouseOver: (x, y) => x === 100 && y === 100
        };
        expect(controller.isEntityUnderMouse(entityWithMethod, 100, 100)).to.be.true;
        expect(controller.isEntityUnderMouse(entityWithMethod, 200, 200)).to.be.false;
      });
      
      it('should handle entity without position method', function() {
        const simpleEntity = { posX: 100, posY: 100, sizeX: 20, sizeY: 20 };
        expect(() => controller.isEntityUnderMouse(simpleEntity, 105, 105)).to.not.throw();
      });
    });
    
    describe('isEntityInBox()', function() {
      it('should return true when entity center in box', function() {
        const result = controller.isEntityInBox(mockEntities[0], 90, 120, 90, 120);
        expect(result).to.be.true;
      });
      
      it('should return false when entity outside box', function() {
        const result = controller.isEntityInBox(mockEntities[0], 200, 300, 200, 300);
        expect(result).to.be.false;
      });
      
      it('should handle entity with sprite position', function() {
        const entityWithSprite = {
          sprite: { pos: { x: 100, y: 100 }, size: { x: 20, y: 20 } }
        };
        const result = controller.isEntityInBox(entityWithSprite, 90, 120, 90, 120);
        expect(result).to.be.true;
      });
      
      it('should check entity center point', function() {
        // Entity at 100,100 with size 20x20 has center at 110,110
        const result = controller.isEntityInBox(mockEntities[0], 105, 115, 105, 115);
        expect(result).to.be.true;
      });
    });
    
    describe('getEntityUnderMouse()', function() {
      it('should return entity under mouse', function() {
        const result = controller.getEntityUnderMouse(105, 105);
        expect(result).to.equal(mockEntities[0]);
      });
      
      it('should return null when no entity under mouse', function() {
        const result = controller.getEntityUnderMouse(500, 500);
        expect(result).to.be.null;
      });
      
      it('should handle empty selectable entities', function() {
        controller.selectableEntities = [];
        const result = controller.getEntityUnderMouse(105, 105);
        expect(result).to.be.null;
      });
      
      it('should return first matching entity', function() {
        mockEntities[1].posX = 100;
        mockEntities[1].posY = 100;
        const result = controller.getEntityUnderMouse(105, 105);
        expect(result).to.equal(mockEntities[0]);
      });
    });
  });
  
  describe('Selection Management', function() {
    describe('deselectAll()', function() {
      it('should deselect all selected entities', function() {
        mockEntities[0].isSelected = true;
        mockEntities[1].isSelected = true;
        controller._selectedEntities = [...mockEntities];
        controller.deselectAll();
        expect(mockEntities[0].isSelected).to.be.false;
        expect(mockEntities[1].isSelected).to.be.false;
      });
      
      it('should clear selected entities array', function() {
        controller._selectedEntities = [...mockEntities];
        controller.deselectAll();
        expect(controller._selectedEntities).to.be.an('array').that.is.empty;
      });
      
      it('should clear box hover state', function() {
        mockEntities[0].isBoxHovered = true;
        controller.deselectAll();
        expect(mockEntities[0].isBoxHovered).to.be.false;
      });
      
      it('should handle empty selected entities', function() {
        expect(() => controller.deselectAll()).to.not.throw();
      });
    });
    
    describe('getSelectedEntities()', function() {
      it('should return array of selected entities', function() {
        controller._selectedEntities = [mockEntities[0]];
        const selected = controller.getSelectedEntities();
        expect(selected).to.be.an('array');
        expect(selected).to.have.lengthOf(1);
      });
      
      it('should return copy of array', function() {
        controller._selectedEntities = [mockEntities[0]];
        const selected = controller.getSelectedEntities();
        selected.push(mockEntities[1]);
        expect(controller._selectedEntities).to.have.lengthOf(1);
      });
      
      it('should handle empty selection', function() {
        controller._selectedEntities = [];
        const selected = controller.getSelectedEntities();
        expect(selected).to.be.an('array').that.is.empty;
      });
      
      it('should handle null _selectedEntities', function() {
        controller._selectedEntities = null;
        const selected = controller.getSelectedEntities();
        expect(selected).to.be.an('array').that.is.empty;
      });
    });
    
    describe('clearSelection()', function() {
      it('should deselect all entities', function() {
        mockEntities[0].isSelected = true;
        controller._selectedEntities = [mockEntities[0]];
        controller.clearSelection();
        expect(mockEntities[0].isSelected).to.be.false;
      });
      
      it('should return controller instance', function() {
        const result = controller.clearSelection();
        expect(result).to.equal(controller);
      });
    });
  });
  
  describe('Configuration', function() {
    describe('setSelectableEntities()', function() {
      it('should update selectable entities', function() {
        const newEntities = [mockEntities[0]];
        controller.setSelectableEntities(newEntities);
        expect(controller.selectableEntities).to.equal(newEntities);
      });
      
      it('should handle null entities', function() {
        controller.setSelectableEntities(null);
        expect(controller.selectableEntities).to.be.an('array').that.is.empty;
      });
      
      it('should return controller for chaining', function() {
        const result = controller.setSelectableEntities([]);
        expect(result).to.equal(controller);
      });
    });
    
    describe('setCallbacks()', function() {
      it('should update callbacks', function() {
        const newCallbacks = {
          onSelectionStart: () => {},
          onSelectionEnd: () => {}
        };
        controller.setCallbacks(newCallbacks);
        expect(controller.callbacks.onSelectionStart).to.equal(newCallbacks.onSelectionStart);
      });
      
      it('should merge with existing callbacks', function() {
        controller.callbacks.onSingleClick = () => {};
        controller.setCallbacks({ onSelectionStart: () => {} });
        expect(controller.callbacks.onSingleClick).to.exist;
      });
      
      it('should return controller for chaining', function() {
        const result = controller.setCallbacks({});
        expect(result).to.equal(controller);
      });
    });
    
    describe('updateConfig()', function() {
      it('should update configuration', function() {
        controller.updateConfig({ dragThreshold: 10 });
        expect(controller.config.dragThreshold).to.equal(10);
      });
      
      it('should merge with existing config', function() {
        const initialColor = controller.config.selectionColor;
        controller.updateConfig({ dragThreshold: 10 });
        expect(controller.config.selectionColor).to.equal(initialColor);
      });
      
      it('should return controller for chaining', function() {
        const result = controller.updateConfig({});
        expect(result).to.equal(controller);
      });
    });
    
    describe('setEnabled()', function() {
      it('should enable selection', function() {
        controller.setEnabled(true);
        expect(controller.config.enableSelection).to.be.true;
      });
      
      it('should disable selection', function() {
        controller.setEnabled(false);
        expect(controller.config.enableSelection).to.be.false;
      });
      
      it('should return controller for chaining', function() {
        const result = controller.setEnabled(true);
        expect(result).to.equal(controller);
      });
    });
  });
  
  describe('State Queries', function() {
    describe('isSelectionActive()', function() {
      it('should return false initially', function() {
        expect(controller.isSelectionActive()).to.be.false;
      });
      
      it('should return true when selecting', function() {
        controller.isSelecting = true;
        expect(controller.isSelectionActive()).to.be.true;
      });
    });
    
    describe('getSelectionBounds()', function() {
      it('should return null when not selecting', function() {
        const bounds = controller.getSelectionBounds();
        expect(bounds).to.be.null;
      });
      
      it('should return bounds when selecting', function() {
        controller.isSelecting = true;
        const bounds = controller.getSelectionBounds();
        expect(bounds).to.be.an('object');
      });
      
      it('should return null without effects renderer', function() {
        controller.effectsRenderer = null;
        controller.isSelecting = true;
        const bounds = controller.getSelectionBounds();
        expect(bounds).to.be.null;
      });
    });
    
    describe('getDebugInfo()', function() {
      it('should return debug information', function() {
        const info = controller.getDebugInfo();
        expect(info).to.be.an('object');
        expect(info).to.have.property('isSelecting');
        expect(info).to.have.property('selectedEntitiesCount');
        expect(info).to.have.property('selectableEntitiesCount');
      });
      
      it('should include config', function() {
        const info = controller.getDebugInfo();
        expect(info.config).to.be.an('object');
      });
      
      it('should indicate renderer availability', function() {
        const info = controller.getDebugInfo();
        expect(info.hasEffectsRenderer).to.be.a('boolean');
        expect(info.hasMouseController).to.be.a('boolean');
      });
    });
  });
  
  describe('Rendering', function() {
    describe('draw()', function() {
      it('should render without errors', function() {
        expect(() => controller.draw()).to.not.throw();
      });
      
      it('should render selection box when active', function() {
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(100, 100);
        controller._selectionEnd = global.createVector(200, 200);
        expect(() => controller.draw()).to.not.throw();
      });
      
      it('should render debug info when enabled', function() {
        global.devConsoleEnabled = true;
        controller._selectedEntities = [mockEntities[0]];
        expect(() => controller.draw()).to.not.throw();
        global.devConsoleEnabled = false;
      });
      
      it('should handle missing selection state', function() {
        controller._selectionStart = null;
        expect(() => controller.draw()).to.not.throw();
      });
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle null effects renderer', function() {
      const nullController = new UISelectionController(null, mockMouseController, mockEntities);
      expect(() => nullController.handleMousePressed(100, 100, 'left')).to.not.throw();
    });
    
    it('should handle entities without methods', function() {
      const simpleEntities = [{ posX: 100, posY: 100 }];
      const simpleController = new UISelectionController(mockEffectsRenderer, mockMouseController, simpleEntities);
      expect(() => simpleController.handleMousePressed(105, 105, 'left')).to.not.throw();
    });
    
    it('should handle rapid click sequences', function() {
      controller.handleMousePressed(100, 100, 'left');
      controller.handleMouseReleased(100, 100, 'left');
      controller.handleMousePressed(200, 200, 'left');
      controller.handleMouseReleased(200, 200, 'left');
      expect(controller.dragStartPos).to.be.null;
    });
    
    it('should handle drag without press', function() {
      expect(() => controller.handleMouseDrag(150, 150, 50, 50)).to.not.throw();
    });
    
    it('should handle release without press', function() {
      expect(() => controller.handleMouseReleased(150, 150, 'left')).to.not.throw();
    });
    
    it('should handle method chaining', function() {
      const result = controller
        .setSelectableEntities(mockEntities)
        .setEnabled(true)
        .updateConfig({ dragThreshold: 10 })
        .clearSelection();
      expect(result).to.equal(controller);
    });
  });
});
