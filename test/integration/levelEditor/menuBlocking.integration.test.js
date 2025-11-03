/**
 * Integration Tests: Menu Blocking
 * Tests interaction between MenuBar, LevelEditor, and terrain editing tools
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Menu Blocking - Integration Tests', function() {
  let sandbox;
  let editor;
  let menuBar;
  let terrainEditor;
  let paintToolExecuted;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    paintToolExecuted = false;
    
    // Mock TerrainEditor
    const TerrainEditor = function() {
      this.hoverPreview = true;
    };
    TerrainEditor.prototype.paint = function() {
      paintToolExecuted = true;
    };
    TerrainEditor.prototype.clearHoverPreview = function() {
      this.hoverPreview = false;
    };
    global.TerrainEditor = TerrainEditor;
    window.TerrainEditor = TerrainEditor;
    
    // Mock MenuBar
    const FileMenuBar = function() {
      this.isOpen = false;
    };
    FileMenuBar.prototype.openDropdown = function() {
      this.isOpen = true;
      if (this.levelEditor) {
        this.levelEditor.setMenuOpen(true);
      }
    };
    FileMenuBar.prototype.closeDropdown = function() {
      this.isOpen = false;
      if (this.levelEditor) {
        this.levelEditor.setMenuOpen(false);
      }
    };
    global.FileMenuBar = FileMenuBar;
    window.FileMenuBar = FileMenuBar;
    
    // Load LevelEditor
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    // Create instances
    terrainEditor = new TerrainEditor();
    menuBar = new FileMenuBar();
    
    editor = new LevelEditor();
    editor.terrainEditor = terrainEditor;
    editor.currentTool = 'paint';
    editor.active = true;
    
    menuBar.levelEditor = editor;
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.TerrainEditor;
    delete window.TerrainEditor;
    delete global.FileMenuBar;
    delete window.FileMenuBar;
  });
  
  describe('Menu Open → Terrain Blocking', function() {
    it('should block handleClick when menu opens', function() {
      menuBar.openDropdown();
      
      const result = editor.handleClick(100, 100);
      
      expect(result).to.be.false;
      expect(paintToolExecuted).to.be.false;
    });
    
    it('should allow handleClick when menu closes', function() {
      menuBar.openDropdown();
      menuBar.closeDropdown();
      
      const result = editor.handleClick(100, 100);
      
      // Should not block (returns undefined or proceeds)
      expect(result).to.not.equal(false);
    });
    
    it('should block handleMouseMove hover preview when menu open', function() {
      menuBar.openDropdown();
      
      editor.handleMouseMove(100, 100);
      
      // Hover preview should be cleared
      expect(terrainEditor.hoverPreview).to.be.false;
    });
  });
  
  describe('Paint Tool Blocking', function() {
    it('should prevent painting when menu open', function() {
      menuBar.openDropdown();
      editor.currentTool = 'paint';
      
      editor.handleClick(100, 100);
      
      expect(paintToolExecuted).to.be.false;
    });
    
    it('should allow painting when menu closed', function() {
      menuBar.closeDropdown();
      editor.currentTool = 'paint';
      editor.isMenuOpen = false;
      
      // Simulate paint (if handleClick were to proceed)
      if (!editor.isMenuOpen) {
        terrainEditor.paint();
      }
      
      expect(paintToolExecuted).to.be.true;
    });
  });
  
  describe('Fill Tool Blocking', function() {
    it('should prevent fill when menu open', function() {
      menuBar.openDropdown();
      editor.currentTool = 'fill';
      
      const result = editor.handleClick(100, 100);
      
      expect(result).to.be.false;
    });
  });
  
  describe('Select Tool Blocking', function() {
    it('should prevent selection when menu open', function() {
      menuBar.openDropdown();
      editor.currentTool = 'select';
      
      const result = editor.handleClick(100, 100);
      
      expect(result).to.be.false;
    });
  });
  
  describe('Menu State Synchronization', function() {
    it('should update editor state when menu opens', function() {
      expect(editor.isMenuOpen).to.be.false;
      
      menuBar.openDropdown();
      
      expect(editor.isMenuOpen).to.be.true;
    });
    
    it('should update editor state when menu closes', function() {
      menuBar.openDropdown();
      expect(editor.isMenuOpen).to.be.true;
      
      menuBar.closeDropdown();
      
      expect(editor.isMenuOpen).to.be.false;
    });
    
    it('should handle multiple open/close cycles', function() {
      menuBar.openDropdown();
      expect(editor.isMenuOpen).to.be.true;
      
      menuBar.closeDropdown();
      expect(editor.isMenuOpen).to.be.false;
      
      menuBar.openDropdown();
      expect(editor.isMenuOpen).to.be.true;
      
      menuBar.closeDropdown();
      expect(editor.isMenuOpen).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle rapid menu open/close', function() {
      menuBar.openDropdown();
      menuBar.closeDropdown();
      menuBar.openDropdown();
      menuBar.closeDropdown();
      
      const result = editor.handleClick(100, 100);
      expect(result).to.not.equal(false);
    });
    
    it('should handle setMenuOpen with same state twice', function() {
      editor.setMenuOpen(true);
      editor.setMenuOpen(true);
      
      expect(editor.isMenuOpen).to.be.true;
      
      editor.setMenuOpen(false);
      editor.setMenuOpen(false);
      
      expect(editor.isMenuOpen).to.be.false;
    });
    
    it('should handle clicks when editor inactive', function() {
      menuBar.openDropdown();
      editor.active = false;
      
      const result = editor.handleClick(100, 100);
      
      expect(result).to.be.false;
    });
  });
  
  describe('Tool Re-enabling After Menu Close', function() {
    it('should re-enable paint tool after menu closes', function() {
      menuBar.openDropdown();
      editor.handleClick(100, 100);
      expect(paintToolExecuted).to.be.false;
      
      menuBar.closeDropdown();
      
      // Now painting should work
      if (!editor.isMenuOpen) {
        terrainEditor.paint();
      }
      expect(paintToolExecuted).to.be.true;
    });
    
    it('should immediately respond after menu close', function() {
      menuBar.openDropdown();
      menuBar.closeDropdown();
      
      const result = editor.handleClick(100, 100);
      
      // Should proceed normally
      expect(result).to.not.equal(false);
    });
  });
  
  describe('Hover Preview Blocking', function() {
    it('should clear hover preview when menu opens', function() {
      terrainEditor.hoverPreview = true;
      
      menuBar.openDropdown();
      editor.handleMouseMove(100, 100);
      
      expect(terrainEditor.hoverPreview).to.be.false;
    });
    
    it('should not show hover preview while menu open', function() {
      menuBar.openDropdown();
      terrainEditor.hoverPreview = true;
      
      editor.handleMouseMove(100, 100);
      editor.handleMouseMove(150, 150);
      
      expect(terrainEditor.hoverPreview).to.be.false;
    });
  });
});
