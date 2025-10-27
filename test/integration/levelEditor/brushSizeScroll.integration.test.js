/**
 * Integration Tests: Shift + Mouse Wheel Brush Size
 * Tests interaction between mouse wheel events, LevelEditor, and BrushSizeMenuModule
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Brush Size Scroll - Integration Tests', function() {
  let sandbox;
  let editor;
  let brushSizeMenu;
  let terrainEditor;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    // Mock TerrainEditor
    const TerrainEditor = function() {
      this._brushSize = 1;
    };
    TerrainEditor.prototype.setBrushSize = function(size) {
      this._brushSize = size;
    };
    TerrainEditor.prototype.getBrushSize = function() {
      return this._brushSize;
    };
    global.TerrainEditor = TerrainEditor;
    window.TerrainEditor = TerrainEditor;
    
    // Load modules
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    const BrushSizeMenuModule = require('../../../Classes/ui/menuBar/BrushSizeMenuModule');
    
    // Create instances
    terrainEditor = new TerrainEditor();
    editor = new LevelEditor();
    editor.terrainEditor = terrainEditor;
    editor.currentTool = 'paint';
    
    brushSizeMenu = new BrushSizeMenuModule({
      label: 'Brush',
      x: 100,
      y: 10,
      initialSize: 5,
      onSizeChange: (size) => {
        if (editor.terrainEditor) {
          editor.terrainEditor.setBrushSize(size);
        }
      }
    });
    
    editor.brushSizeMenu = brushSizeMenu;
    editor.active = true;
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.TerrainEditor;
    delete window.TerrainEditor;
  });
  
  describe('Scroll → Menu → TerrainEditor Chain', function() {
    it('should update both menu and TerrainEditor on scroll up', function() {
      const result = editor.handleMouseWheel({ delta: 1 }, true);
      expect(result).to.be.true;
      expect(brushSizeMenu.getSize()).to.equal(6);
      expect(terrainEditor.getBrushSize()).to.equal(6);
    });
    
    it('should update both menu and TerrainEditor on scroll down', function() {
      const result = editor.handleMouseWheel({ delta: -1 }, true);
      expect(result).to.be.true;
      expect(brushSizeMenu.getSize()).to.equal(4);
      expect(terrainEditor.getBrushSize()).to.equal(4);
    });
    
    it('should handle multiple rapid scrolls', function() {
      editor.handleMouseWheel({ delta: 1 }, true); // 6
      editor.handleMouseWheel({ delta: 1 }, true); // 7
      editor.handleMouseWheel({ delta: 1 }, true); // 8
      expect(brushSizeMenu.getSize()).to.equal(8);
      expect(terrainEditor.getBrushSize()).to.equal(8);
    });
  });
  
  describe('Edge Cases - Boundary Scrolling', function() {
    it('should not exceed max size (9) on continuous scroll up', function() {
      brushSizeMenu.setSize(9);
      terrainEditor.setBrushSize(9);
      
      const result1 = editor.handleMouseWheel({ delta: 1 }, true);
      const result2 = editor.handleMouseWheel({ delta: 1 }, true);
      const result3 = editor.handleMouseWheel({ delta: 1 }, true);
      
      expect(result1).to.be.false; // No change
      expect(result2).to.be.false;
      expect(result3).to.be.false;
      expect(brushSizeMenu.getSize()).to.equal(9);
      expect(terrainEditor.getBrushSize()).to.equal(9);
    });
    
    it('should not go below min size (1) on continuous scroll down', function() {
      brushSizeMenu.setSize(1);
      terrainEditor.setBrushSize(1);
      
      const result1 = editor.handleMouseWheel({ delta: -1 }, true);
      const result2 = editor.handleMouseWheel({ delta: -1 }, true);
      const result3 = editor.handleMouseWheel({ delta: -1 }, true);
      
      expect(result1).to.be.false; // No change
      expect(result2).to.be.false;
      expect(result3).to.be.false;
      expect(brushSizeMenu.getSize()).to.equal(1);
      expect(terrainEditor.getBrushSize()).to.equal(1);
    });
    
    it('should handle alternating scroll directions', function() {
      brushSizeMenu.setSize(5);
      terrainEditor.setBrushSize(5);
      
      editor.handleMouseWheel({ delta: 1 }, true);  // 6
      editor.handleMouseWheel({ delta: -1 }, true); // 5
      editor.handleMouseWheel({ delta: 1 }, true);  // 6
      editor.handleMouseWheel({ delta: -1 }, true); // 5
      
      expect(brushSizeMenu.getSize()).to.equal(5);
      expect(terrainEditor.getBrushSize()).to.equal(5);
    });
  });
  
  describe('Tool-Specific Behavior', function() {
    it('should not change size when fill tool active', function() {
      editor.currentTool = 'fill';
      brushSizeMenu.setSize(5);
      
      const result = editor.handleMouseWheel({ delta: 1 }, true);
      expect(result).to.be.false;
      expect(brushSizeMenu.getSize()).to.equal(5);
    });
    
    it('should not change size when select tool active', function() {
      editor.currentTool = 'select';
      brushSizeMenu.setSize(5);
      
      const result = editor.handleMouseWheel({ delta: 1 }, true);
      expect(result).to.be.false;
      expect(brushSizeMenu.getSize()).to.equal(5);
    });
    
    it('should resume working when switching back to paint tool', function() {
      brushSizeMenu.setSize(5);
      editor.currentTool = 'fill';
      editor.handleMouseWheel({ delta: 1 }, true); // No change
      
      editor.currentTool = 'paint';
      editor.handleMouseWheel({ delta: 1 }, true); // Should work
      
      expect(brushSizeMenu.getSize()).to.equal(6);
    });
  });
  
  describe('Normal Scroll (No Shift) Behavior', function() {
    it('should not change brush size without shift key', function() {
      brushSizeMenu.setSize(5);
      
      const result = editor.handleMouseWheel({ delta: 1 }, false);
      expect(result).to.be.false;
      expect(brushSizeMenu.getSize()).to.equal(5);
    });
    
    it('should allow normal zoom behavior', function() {
      // Normal scroll should return false to allow zoom
      const result1 = editor.handleMouseWheel({ delta: 1 }, false);
      const result2 = editor.handleMouseWheel({ delta: -1 }, false);
      
      expect(result1).to.be.false;
      expect(result2).to.be.false;
    });
  });
  
  describe('Error Handling', function() {
    it('should handle missing brushSizeMenu', function() {
      editor.brushSizeMenu = null;
      terrainEditor.setBrushSize(3);
      
      const result = editor.handleMouseWheel({ delta: 1 }, true);
      // Should still work with terrainEditor
      expect(result).to.be.true;
      expect(terrainEditor.getBrushSize()).to.equal(4);
    });
    
    it('should handle missing terrainEditor', function() {
      editor.terrainEditor = null;
      brushSizeMenu.setSize(3);
      
      const result = editor.handleMouseWheel({ delta: 1 }, true);
      // Should still update menu
      expect(result).to.be.true;
      expect(brushSizeMenu.getSize()).to.equal(4);
    });
    
    it('should handle event with missing delta', function() {
      const result = editor.handleMouseWheel({}, true);
      expect(result).to.be.false; // No delta = no change
    });
    
    it('should handle null event', function() {
      const result = editor.handleMouseWheel(null, true);
      expect(result).to.be.false;
    });
  });
  
  describe('Inactive Editor Behavior', function() {
    it('should not respond to scroll when editor inactive', function() {
      editor.active = false;
      brushSizeMenu.setSize(5);
      
      const result = editor.handleMouseWheel({ delta: 1 }, true);
      expect(result).to.be.false;
      expect(brushSizeMenu.getSize()).to.equal(5);
    });
  });
});
