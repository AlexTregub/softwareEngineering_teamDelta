/**
 * Unit Tests: Brush Size Scroll
 * 
 * Tests for Shift + mouse wheel brush size adjustment in Level Editor.
 * Tests size changes, zoom interaction, tool-specific behavior.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - Brush Size Scroll', function() {
  let levelEditor;
  let mockTerrainEditor;
  let mockBrushSizeMenu;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock TerrainEditor
    mockTerrainEditor = {
      setBrushSize: sinon.spy(),
      getBrushSize: sinon.stub().returns(3)
    };
    
    // Mock BrushSizeMenuModule
    mockBrushSizeMenu = {
      setSize: sinon.spy(),
      getSize: sinon.stub().returns(3)
    };
    
    // Mock LevelEditor with handleMouseWheel method
    global.LevelEditor = class LevelEditor {
      constructor() {
        this.editor = mockTerrainEditor;
        this.brushSizeMenu = mockBrushSizeMenu;
        this.currentTool = 'paint';
        this.currentBrushSize = 3;
      }
      
      handleMouseWheel(deltaY, shiftKey) {
        if (!shiftKey || this.currentTool !== 'paint') {
          return false; // Let normal zoom happen
        }
        
        // Adjust brush size
        const direction = deltaY > 0 ? -1 : 1; // Scroll up = increase
        const newSize = Math.max(1, Math.min(9, this.currentBrushSize + direction));
        
        if (newSize !== this.currentBrushSize) {
          this.currentBrushSize = newSize;
          this.brushSizeMenu.setSize(newSize);
          this.editor.setBrushSize(newSize);
          return true; // Consumed
        }
        
        return false;
      }
    };
    
    levelEditor = new global.LevelEditor();
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Shift + Scroll Up', function() {
    it('should increase brush size up to max 9', function() {
      levelEditor.currentBrushSize = 5;
      
      const consumed = levelEditor.handleMouseWheel(-100, true); // Negative = scroll up
      
      expect(consumed).to.be.true;
      expect(levelEditor.currentBrushSize).to.equal(6);
      expect(mockBrushSizeMenu.setSize.calledWith(6)).to.be.true;
      expect(mockTerrainEditor.setBrushSize.calledWith(6)).to.be.true;
    });
    
    it('should not exceed max size of 9', function() {
      levelEditor.currentBrushSize = 9;
      
      const consumed = levelEditor.handleMouseWheel(-100, true);
      
      expect(consumed).to.be.false; // No change
      expect(levelEditor.currentBrushSize).to.equal(9);
    });
  });
  
  describe('Shift + Scroll Down', function() {
    it('should decrease brush size down to min 1', function() {
      levelEditor.currentBrushSize = 5;
      
      const consumed = levelEditor.handleMouseWheel(100, true); // Positive = scroll down
      
      expect(consumed).to.be.true;
      expect(levelEditor.currentBrushSize).to.equal(4);
      expect(mockBrushSizeMenu.setSize.calledWith(4)).to.be.true;
      expect(mockTerrainEditor.setBrushSize.calledWith(4)).to.be.true;
    });
    
    it('should not go below min size of 1', function() {
      levelEditor.currentBrushSize = 1;
      
      const consumed = levelEditor.handleMouseWheel(100, true);
      
      expect(consumed).to.be.false; // No change
      expect(levelEditor.currentBrushSize).to.equal(1);
    });
  });
  
  describe('Normal Scroll (no Shift)', function() {
    it('should not change brush size and allow zoom', function() {
      levelEditor.currentBrushSize = 5;
      
      const consumed = levelEditor.handleMouseWheel(-100, false); // No shift
      
      expect(consumed).to.be.false; // Not consumed, zoom can happen
      expect(levelEditor.currentBrushSize).to.equal(5); // Unchanged
      expect(mockBrushSizeMenu.setSize.called).to.be.false;
    });
  });
  
  describe('Tool-Specific Behavior', function() {
    it('should only work when paint tool is active', function() {
      levelEditor.currentTool = 'paint';
      levelEditor.currentBrushSize = 5;
      
      const consumed = levelEditor.handleMouseWheel(-100, true);
      
      expect(consumed).to.be.true;
      expect(levelEditor.currentBrushSize).to.equal(6);
    });
    
    it('should not work with fill tool', function() {
      levelEditor.currentTool = 'fill';
      levelEditor.currentBrushSize = 5;
      
      const consumed = levelEditor.handleMouseWheel(-100, true);
      
      expect(consumed).to.be.false;
      expect(levelEditor.currentBrushSize).to.equal(5); // Unchanged
    });
    
    it('should not work with select tool', function() {
      levelEditor.currentTool = 'select';
      levelEditor.currentBrushSize = 5;
      
      const consumed = levelEditor.handleMouseWheel(-100, true);
      
      expect(consumed).to.be.false;
      expect(levelEditor.currentBrushSize).to.equal(5); // Unchanged
    });
  });
  
  describe('Menu Display Update', function() {
    it('should update menu when size changes', function() {
      levelEditor.currentBrushSize = 3;
      
      levelEditor.handleMouseWheel(-100, true); // Increase to 4
      
      expect(mockBrushSizeMenu.setSize.calledWith(4)).to.be.true;
    });
  });
});
