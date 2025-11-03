/**
 * Integration Tests: Brush Size Menu Module
 * Tests interaction between BrushSizeMenuModule, LevelEditor, and TerrainEditor
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Brush Size Menu - Integration Tests', function() {
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
    
    brushSizeMenu = new BrushSizeMenuModule({
      label: 'Brush',
      x: 100,
      y: 10,
      initialSize: 1,
      onSizeChange: (size) => {
        if (editor.terrainEditor) {
          editor.terrainEditor.setBrushSize(size);
        }
      }
    });
    
    editor.brushSizeMenu = brushSizeMenu;
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.TerrainEditor;
    delete window.TerrainEditor;
  });
  
  describe('Menu → TerrainEditor Synchronization', function() {
    it('should update TerrainEditor brush size when menu size changes', function() {
      brushSizeMenu.setSize(5);
      expect(terrainEditor.getBrushSize()).to.equal(5);
    });
    
    it('should handle rapid size changes', function() {
      brushSizeMenu.setSize(2);
      brushSizeMenu.setSize(5);
      brushSizeMenu.setSize(9);
      brushSizeMenu.setSize(1);
      expect(terrainEditor.getBrushSize()).to.equal(1);
    });
    
    it('should maintain sync across multiple changes', function() {
      for (let size = 1; size <= 9; size++) {
        brushSizeMenu.setSize(size);
        expect(terrainEditor.getBrushSize()).to.equal(size);
      }
    });
  });
  
  describe('Edge Cases - Size Boundaries', function() {
    it('should handle size 0 (clamp to 1)', function() {
      brushSizeMenu.setSize(0);
      expect(brushSizeMenu.getSize()).to.equal(1);
      expect(terrainEditor.getBrushSize()).to.equal(1);
    });
    
    it('should handle size 10 (clamp to 9)', function() {
      brushSizeMenu.setSize(10);
      expect(brushSizeMenu.getSize()).to.equal(9);
      expect(terrainEditor.getBrushSize()).to.equal(9);
    });
    
    it('should handle negative sizes', function() {
      brushSizeMenu.setSize(-5);
      expect(brushSizeMenu.getSize()).to.equal(1);
      expect(terrainEditor.getBrushSize()).to.equal(1);
    });
    
    it('should handle very large sizes', function() {
      brushSizeMenu.setSize(999);
      expect(brushSizeMenu.getSize()).to.equal(9);
      expect(terrainEditor.getBrushSize()).to.equal(9);
    });
    
    it('should handle NaN (keep current size)', function() {
      brushSizeMenu.setSize(5);
      brushSizeMenu.setSize(NaN);
      expect(brushSizeMenu.getSize()).to.equal(5);
    });
    
    it('should handle undefined (keep current size)', function() {
      brushSizeMenu.setSize(3);
      brushSizeMenu.setSize(undefined);
      expect(brushSizeMenu.getSize()).to.equal(3);
    });
  });
  
  describe('Painting with Different Brush Sizes', function() {
    it('should use size 1 for painting single tiles', function() {
      brushSizeMenu.setSize(1);
      expect(terrainEditor.getBrushSize()).to.equal(1);
    });
    
    it('should use size 9 for painting large areas', function() {
      brushSizeMenu.setSize(9);
      expect(terrainEditor.getBrushSize()).to.equal(9);
    });
    
    it('should change size mid-painting session', function() {
      brushSizeMenu.setSize(1);
      // Simulate painting
      brushSizeMenu.setSize(5);
      expect(terrainEditor.getBrushSize()).to.equal(5);
      brushSizeMenu.setSize(9);
      expect(terrainEditor.getBrushSize()).to.equal(9);
    });
  });
  
  describe('Menu State Persistence', function() {
    it('should maintain size when menu opens and closes', function() {
      brushSizeMenu.setSize(7);
      brushSizeMenu.open();
      brushSizeMenu.close();
      expect(brushSizeMenu.getSize()).to.equal(7);
      expect(terrainEditor.getBrushSize()).to.equal(7);
    });
    
    it('should persist size across multiple menu interactions', function() {
      brushSizeMenu.setSize(4);
      brushSizeMenu.open();
      brushSizeMenu.close();
      brushSizeMenu.open();
      brushSizeMenu.close();
      expect(brushSizeMenu.getSize()).to.equal(4);
    });
  });
  
  describe('Error Handling', function() {
    it('should handle missing terrainEditor gracefully', function() {
      editor.terrainEditor = null;
      expect(() => brushSizeMenu.setSize(5)).to.not.throw();
      expect(brushSizeMenu.getSize()).to.equal(5);
    });
    
    it('should handle terrainEditor without setBrushSize method', function() {
      editor.terrainEditor = {};
      expect(() => brushSizeMenu.setSize(3)).to.not.throw();
      expect(brushSizeMenu.getSize()).to.equal(3);
    });
  });
});
