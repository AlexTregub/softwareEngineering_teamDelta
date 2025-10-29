const { expect } = require('chai');

global.mouseX = 0;
global.mouseY = 0;
global.cameraManager = { cameraX: 0, cameraY: 0, screenToWorld: (x, y) => ({x, y}) };
global.antManager = { selectionChanged: () => {} };

const SelectionController = require('../../../Classes/controllers/SelectionController.js');

describe('SelectionController', function() {
  let mockEntity;
  let controller;
  
  beforeEach(function() {
    mockEntity = {
      posX: 100, posY: 100, width: 50, height: 50,
      getPosition: () => ({ x: 100, y: 100 }),
      getSize: () => ({ x: 50, y: 50, width: 50, height: 50 }),
      getCollisionBox: () => ({ containsPoint: (x, y) => x >= 100 && x <= 150 && y >= 100 && y <= 150 }),
      _renderController: { 
        setHighlightColor: () => {}, 
        clearHighlight: () => {},
        highlightSelected: () => {},
        highlightHover: () => {},
        highlightBoxHover: () => {}
      }
    };
    controller = new SelectionController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller._entity).to.equal(mockEntity);
    });
    
    it('should initialize as not selected', function() {
      expect(controller._isSelected).to.be.false;
    });
    
    it('should initialize as not selectable', function() {
      expect(controller._selectable).to.be.false;
    });
    
    it('should initialize as not hovered', function() {
      expect(controller._isHovered).to.be.false;
    });
    
    it('should initialize with no box hover', function() {
      expect(controller._isBoxHovered).to.be.false;
    });
    
    it('should initialize highlight type as none', function() {
      expect(controller._highlightType).to.equal('none');
    });
  });
  
  describe('Selection State', function() {
    describe('setSelected()', function() {
      it('should set selected state to true', function() {
        controller.setSelected(true);
        expect(controller._isSelected).to.be.true;
      });
      
      it('should set selected state to false', function() {
        controller.setSelected(true);
        controller.setSelected(false);
        expect(controller._isSelected).to.be.false;
      });
      
      it('should trigger callback on state change', function() {
        let callbackFired = false;
        controller.addSelectionCallback(() => { callbackFired = true; });
        controller.setSelected(true);
        expect(callbackFired).to.be.true;
      });
      
      it('should not trigger callback if state unchanged', function() {
        let callbackCount = 0;
        controller.addSelectionCallback(() => { callbackCount++; });
        controller.setSelected(false);
        expect(callbackCount).to.equal(0);
      });
    });
    
    describe('isSelected()', function() {
      it('should return false initially', function() {
        expect(controller.isSelected()).to.be.false;
      });
      
      it('should return true after selection', function() {
        controller.setSelected(true);
        expect(controller.isSelected()).to.be.true;
      });
      
      it('should return false after deselection', function() {
        controller.setSelected(true);
        controller.setSelected(false);
        expect(controller.isSelected()).to.be.false;
      });
    });
    
    describe('toggleSelection()', function() {
      it('should toggle from false to true', function() {
        const result = controller.toggleSelection();
        expect(result).to.be.true;
        expect(controller._isSelected).to.be.true;
      });
      
      it('should toggle from true to false', function() {
        controller.setSelected(true);
        const result = controller.toggleSelection();
        expect(result).to.be.false;
        expect(controller._isSelected).to.be.false;
      });
    });
  });
  
  describe('Selectable Property', function() {
    describe('setSelectable()', function() {
      it('should set selectable to true', function() {
        controller.setSelectable(true);
        expect(controller._selectable).to.be.true;
      });
      
      it('should set selectable to false', function() {
        controller.setSelectable(true);
        controller.setSelectable(false);
        expect(controller._selectable).to.be.false;
      });
    });
    
    describe('getSelectable()', function() {
      it('should return false initially', function() {
        expect(controller.getSelectable()).to.be.false;
      });
      
      it('should return true after setting', function() {
        controller.setSelectable(true);
        expect(controller.getSelectable()).to.be.true;
      });
    });
    
    describe('selectable getter/setter', function() {
      it('should get selectable value', function() {
        expect(controller.selectable).to.be.false;
      });
      
      it('should set selectable value', function() {
        controller.selectable = true;
        expect(controller.selectable).to.be.true;
      });
    });
  });
  
  describe('Hover State', function() {
    describe('setHovered()', function() {
      it('should set hover state to true', function() {
        controller.setHovered(true);
        expect(controller._isHovered).to.be.true;
      });
      
      it('should set hover state to false', function() {
        controller.setHovered(true);
        controller.setHovered(false);
        expect(controller._isHovered).to.be.false;
      });
    });
    
    describe('isHovered()', function() {
      it('should return false initially', function() {
        expect(controller.isHovered()).to.be.false;
      });
      
      it('should return true after setting', function() {
        controller.setHovered(true);
        expect(controller.isHovered()).to.be.true;
      });
    });
    
    describe('setBoxHovered()', function() {
      it('should set box hover state', function() {
        controller.setBoxHovered(true);
        expect(controller._isBoxHovered).to.be.true;
      });
      
      it('should clear box hover state', function() {
        controller.setBoxHovered(true);
        controller.setBoxHovered(false);
        expect(controller._isBoxHovered).to.be.false;
      });
    });
    
    describe('isBoxHovered()', function() {
      it('should return false initially', function() {
        expect(controller.isBoxHovered()).to.be.false;
      });
      
      it('should return true after setting', function() {
        controller.setBoxHovered(true);
        expect(controller.isBoxHovered()).to.be.true;
      });
    });
    
    describe('updateHoverState()', function() {
      it('should detect hover when mouse over entity', function() {
        mockEntity._collisionBox = { contains: (x, y) => x >= 100 && x <= 150 && y >= 100 && y <= 150 };
        controller.updateHoverState(125, 125);
        expect(controller._isHovered).to.be.true;
      });
      
      it('should clear hover when mouse outside entity', function() {
        controller.setHovered(true);
        mockEntity._collisionBox = { contains: (x, y) => x >= 100 && x <= 150 && y >= 100 && y <= 150 };
        controller.updateHoverState(200, 200);
        expect(controller._isHovered).to.be.false;
      });
      
      it('should handle missing collision box', function() {
        delete mockEntity._collisionBox;
        expect(() => controller.updateHoverState(125, 125)).to.not.throw();
      });
    });
  });
  
  describe('Highlight System', function() {
    describe('getHighlightType()', function() {
      it('should return none initially', function() {
        expect(controller.getHighlightType()).to.equal('none');
      });
      
      it('should return selected when selected', function() {
        controller.setSelected(true);
        controller.updateHighlightType();
        expect(controller.getHighlightType()).to.equal('selected');
      });
      
      it('should return hover when hovered', function() {
        controller.setHovered(true);
        controller.updateHighlightType();
        expect(controller.getHighlightType()).to.equal('hover');
      });
    });
    
    describe('updateHighlightType()', function() {
      it('should set selected highlight when selected', function() {
        controller.setSelected(true);
        controller.updateHighlightType();
        expect(controller._highlightType).to.equal('selected');
      });
      
      it('should set hover highlight when hovered', function() {
        controller.setHovered(true);
        controller.updateHighlightType();
        expect(controller._highlightType).to.equal('hover');
      });
      
      it('should set boxHover highlight when box hovered', function() {
        controller.setBoxHovered(true);
        controller.updateHighlightType();
        expect(controller._highlightType).to.equal('boxHover');
      });
      
      it('should prioritize selected over hover', function() {
        controller.setSelected(true);
        controller.setHovered(true);
        controller.updateHighlightType();
        expect(controller._highlightType).to.equal('selected');
      });
      
      it('should set none when no states active', function() {
        controller.updateHighlightType();
        expect(controller._highlightType).to.equal('none');
      });
    });
    
    describe('applyHighlighting()', function() {
      it('should execute without errors', function() {
        expect(() => controller.applyHighlighting()).to.not.throw();
      });
      
      it('should handle missing render controller', function() {
        delete mockEntity._renderController;
        expect(() => controller.applyHighlighting()).to.not.throw();
      });
    });
    
    describe('updateHighlight()', function() {
      it('should update highlight type and apply', function() {
        controller.setSelected(true);
        controller.updateHighlight();
        expect(controller._highlightType).to.equal('selected');
      });
    });
  });
  
  describe('Selection Groups', function() {
    describe('addToGroup()', function() {
      it('should add entity to group', function() {
        const mockGroup = [];
        expect(() => controller.addToGroup(mockGroup)).to.not.throw();
      });
      
      it('should throw on null group', function() {
        expect(() => controller.addToGroup(null)).to.throw();
      });
    });
    
    describe('removeFromGroup()', function() {
      it('should remove entity from group', function() {
        const mockGroup = [mockEntity];
        expect(() => controller.removeFromGroup(mockGroup)).to.not.throw();
      });
      
      it('should throw on null group', function() {
        expect(() => controller.removeFromGroup(null)).to.throw();
      });
    });
  });
  
  describe('Callbacks', function() {
    describe('addSelectionCallback()', function() {
      it('should add callback to array', function() {
        const callback = () => {};
        controller.addSelectionCallback(callback);
        expect(controller._selectionCallbacks).to.include(callback);
      });
      
      it('should allow multiple callbacks', function() {
        const cb1 = () => {};
        const cb2 = () => {};
        controller.addSelectionCallback(cb1);
        controller.addSelectionCallback(cb2);
        expect(controller._selectionCallbacks).to.have.lengthOf(2);
      });
    });
    
    it('should execute all callbacks on selection change', function() {
      let count = 0;
      controller.addSelectionCallback(() => count++);
      controller.addSelectionCallback(() => count++);
      controller.setSelected(true);
      expect(count).to.equal(2);
    });
  });
  
  describe('update()', function() {
    it('should execute without errors', function() {
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should update hover state when mouse moves', function() {
      mockEntity._collisionBox = { contains: (x, y) => x >= 100 && x <= 150 && y >= 100 && y <= 150 };
      global.mouseX = 125;
      global.mouseY = 125;
      controller.update();
      expect(controller._isHovered).to.be.true;
    });
    
    it('should update highlight type', function() {
      controller.setSelected(true);
      controller.update();
      expect(controller._highlightType).to.equal('selected');
    });
    
    it('should handle missing camera manager', function() {
      const oldCameraManager = global.cameraManager;
      delete global.cameraManager;
      expect(() => controller.update()).to.not.throw();
      global.cameraManager = oldCameraManager;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle entity without render controller', function() {
      delete mockEntity._renderController;
      controller.setSelected(true);
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle entity without collision box', function() {
      delete mockEntity.getCollisionBox;
      expect(() => controller.updateHoverState(125, 125)).to.not.throw();
    });
    
    it('should handle rapid selection toggle', function() {
      controller.toggleSelection();
      controller.toggleSelection();
      controller.toggleSelection();
      expect(controller._isSelected).to.be.true;
    });
    
    it('should handle multiple hover state changes', function() {
      controller.setHovered(true);
      controller.setHovered(false);
      controller.setHovered(true);
      expect(controller._isHovered).to.be.true;
    });
  });
});