/**
 * Consolidated File I/O Integration Tests
 * Generated: 2025-10-29T03:16:53.963Z
 * Source files: 7
 * Total tests: 118
 */

// Common requires
let { expect } = require('chai');
let sinon = require('sinon');
let { JSDOM } = require('jsdom');


// ================================================================
// brushSizeMenu.integration.test.js (16 tests)
// ================================================================
/**
 * Integration Tests: Brush Size Menu Module
 * Tests interaction between BrushSizeMenuModule, LevelEditor, and TerrainEditor
 */

let { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

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




// ================================================================
// brushSizeScroll.integration.test.js (16 tests)
// ================================================================
/**
 * Integration Tests: Shift + Mouse Wheel Brush Size
 * Tests interaction between mouse wheel events, LevelEditor, and BrushSizeMenuModule
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

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




// ================================================================
// fileMenuBar_saveLoad.integration.test.js (16 tests)
// ================================================================
/**
 * Integration Tests for FileMenuBar with Save/Load File I/O
 * Tests complete workflow from menu → levelEditor save/load methods
 * 
 * Following TDD: These tests verify FileMenuBar correctly triggers LevelEditor I/O
 * Note: Full terrain export/import testing is done in terrainExporter/terrainImporter tests
 */

let fs = require('fs');
let path = require('path');
let vm = require('vm');
// Setup JSDOM with localStorage
let dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost'
});
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

// Load FileMenuBar
let fileMenuBarCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/FileMenuBar.js'),
  'utf8'
);

// Execute in global context
vm.runInThisContext(fileMenuBarCode);

// Sync to window
global.FileMenuBar = FileMenuBar;
window.FileMenuBar = FileMenuBar;

describe('FileMenuBar Save/Load I/O Integration Tests', function() {
  let menuBar;
  let mockLevelEditor;
  let mockP5;
  let saveStub;
  let loadStub;
  
  beforeEach(function() {
    // Clear localStorage
    localStorage.clear();
    
    // Mock p5.js functions
    mockP5 = {
      rect: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      noStroke: sinon.stub(),
      CENTER: 'center',
      LEFT: 'left',
      RIGHT: 'right'
    };
    
    // Assign to global
    Object.assign(global, mockP5);
    Object.assign(window, mockP5);
    
    // Create stubs for save/load
    saveStub = sinon.stub();
    loadStub = sinon.stub();
    
    // Mock LevelEditor with tracked save/load
    mockLevelEditor = {
      terrain: {
        tiles: [
          [{ material: 'grass', type: 0 }, { material: 'stone', type: 2 }],
          [{ material: 'dirt', type: 4 }, { material: 'sand', type: 3 }]
        ],
        width: 2,
        height: 2
      },
      editor: {
        canUndo: sinon.stub().returns(false),
        canRedo: sinon.stub().returns(false)
      },
      undo: sinon.stub(),
      redo: sinon.stub(),
      save: saveStub,
      load: loadStub,
      showGrid: true,
      showMinimap: true,
      notifications: {
        show: sinon.stub()
      }
    };
    
    menuBar = new FileMenuBar();
    menuBar.setLevelEditor(mockLevelEditor);
  });
  
  afterEach(function() {
    sinon.restore();
    localStorage.clear();
  });
  
  describe('Save Integration', function() {
    it('should call levelEditor.save() when triggered from File menu', function() {
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      
      saveOption.action();
      
      expect(saveStub.calledOnce).to.be.true;
    });
    
    it('should call levelEditor.save() via keyboard shortcut Ctrl+S', function() {
      menuBar.handleKeyPress('s', { ctrl: true });
      
      expect(saveStub.calledOnce).to.be.true;
    });
    
    it('should call levelEditor.save() via menu click', function() {
      menuBar.openMenu('File');
      
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15; // Save is second item
      
      menuBar.handleClick(clickX, clickY);
      
      expect(saveStub.calledOnce).to.be.true;
    });
    
    it('should close menu after save is triggered', function() {
      menuBar.openMenu('File');
      expect(menuBar.isMenuOpen('File')).to.be.true;
      
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(menuBar.isMenuOpen('File')).to.be.false;
    });
  });
  
  describe('Load Integration', function() {
    it('should call levelEditor.load() when triggered from File menu', function() {
      const fileMenu = menuBar.getMenuItem('File');
      const loadOption = fileMenu.items.find(item => item.label === 'Load');
      
      loadOption.action();
      
      expect(loadStub.calledOnce).to.be.true;
    });
    
    it('should call levelEditor.load() via keyboard shortcut Ctrl+O', function() {
      menuBar.handleKeyPress('o', { ctrl: true });
      
      expect(loadStub.calledOnce).to.be.true;
    });
    
    it('should call levelEditor.load() via menu click', function() {
      menuBar.openMenu('File');
      
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (2 * 30) + 15; // Load is third item
      
      menuBar.handleClick(clickX, clickY);
      
      expect(loadStub.calledOnce).to.be.true;
    });
    
    it('should close menu after load is triggered', function() {
      menuBar.openMenu('File');
      expect(menuBar.isMenuOpen('File')).to.be.true;
      
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (2 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(menuBar.isMenuOpen('File')).to.be.false;
    });
  });
  
  describe('Save-Load Workflow', function() {
    it('should allow save followed by load', function() {
      // Save
      menuBar.handleKeyPress('s', { ctrl: true });
      expect(saveStub.calledOnce).to.be.true;
      
      // Load
      menuBar.handleKeyPress('o', { ctrl: true });
      expect(loadStub.calledOnce).to.be.true;
    });
    
    it('should handle multiple save operations', function() {
      menuBar.handleKeyPress('s', { ctrl: true });
      menuBar.handleKeyPress('s', { ctrl: true });
      menuBar.handleKeyPress('s', { ctrl: true });
      
      expect(saveStub.callCount).to.equal(3);
    });
    
    it('should handle multiple load operations', function() {
      menuBar.handleKeyPress('o', { ctrl: true });
      menuBar.handleKeyPress('o', { ctrl: true });
      
      expect(loadStub.callCount).to.equal(2);
    });
  });
  
  describe('Error Handling', function() {
    it('should handle missing levelEditor gracefully', function() {
      menuBar.setLevelEditor(null);
      
      // Should not throw when save is called
      expect(() => menuBar.handleKeyPress('s', { ctrl: true })).to.not.throw();
    });
    
    it('should handle levelEditor without save method gracefully', function() {
      mockLevelEditor.save = undefined;
      menuBar.setLevelEditor(mockLevelEditor);
      
      // Should not throw
      expect(() => menuBar.handleKeyPress('s', { ctrl: true })).to.not.throw();
    });
    
    it('should handle levelEditor without load method gracefully', function() {
      mockLevelEditor.load = undefined;
      menuBar.setLevelEditor(mockLevelEditor);
      
      // Should not throw
      expect(() => menuBar.handleKeyPress('o', { ctrl: true })).to.not.throw();
    });
  });
  
  describe('Integration with LevelEditor State', function() {
    it('should access levelEditor terrain data before save', function() {
      let terrainSizeAccessed = 0;
      
      // Add custom save that uses terrain
      mockLevelEditor.save = function() {
        terrainSizeAccessed = this.terrain.width * this.terrain.height;
      };
      
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      
      saveOption.action();
      
      // Verify save accessed terrain
      expect(terrainSizeAccessed).to.equal(4); // 2x2 = 4
    });
    
    it('should allow levelEditor to update terrain after load', function() {
      let terrainUpdated = false;
      
      mockLevelEditor.load = function() {
        this.terrain.width = 10;
        this.terrain.height = 10;
        terrainUpdated = true;
      };
      
      menuBar.setLevelEditor(mockLevelEditor);
      menuBar.handleKeyPress('o', { ctrl: true });
      
      expect(terrainUpdated).to.be.true;
      expect(mockLevelEditor.terrain.width).to.equal(10);
    });
  });
});




// ================================================================
// fileMenuBar.integration.test.js (20 tests)
// ================================================================
/**
 * Integration Tests for FileMenuBar with LevelEditor
 * Tests menu bar integration with save/load functionality and file I/O
 * 
 * Following TDD: These tests verify real system interactions
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');
// Setup JSDOM
// DUPLICATE REQUIRE REMOVED: let dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load all required classes
// DUPLICATE REQUIRE REMOVED: let fileMenuBarCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/FileMenuBar.js'),
  'utf8'
);
let saveDialogCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/SaveDialog.js'),
  'utf8'
);
let loadDialogCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/LoadDialog.js'),
  'utf8'
);

// Execute in global context
vm.runInThisContext(fileMenuBarCode);
vm.runInThisContext(saveDialogCode);
vm.runInThisContext(loadDialogCode);

// Sync to window
global.FileMenuBar = FileMenuBar;
global.SaveDialog = SaveDialog;
global.LoadDialog = LoadDialog;
window.FileMenuBar = FileMenuBar;
window.SaveDialog = SaveDialog;
window.LoadDialog = LoadDialog;

describe('FileMenuBar Integration Tests', function() {
  let menuBar;
  let mockLevelEditor;
  let mockP5;
  
  beforeEach(function() {
    // Mock p5.js functions
    mockP5 = {
      rect: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      noStroke: sinon.stub()
    };
    
    // Assign to global
    Object.assign(global, mockP5);
    Object.assign(window, mockP5);
    
    // Mock LevelEditor with save/load functionality
    mockLevelEditor = {
      terrain: {
        tiles: [[{material: 'grass'}]],
        width: 10,
        height: 10
      },
      editor: {
        canUndo: sinon.stub().returns(false),
        canRedo: sinon.stub().returns(false)
      },
      // Methods called by FileMenuBar (at top level)
      undo: sinon.stub(),
      redo: sinon.stub(),
      save: sinon.stub(),
      load: sinon.stub(),
      showGrid: true,
      showMinimap: true,
      saveDialog: new SaveDialog(),
      loadDialog: new LoadDialog(),
      notifications: {
        show: sinon.stub()
      }
    };
    
    menuBar = new FileMenuBar();
    menuBar.setLevelEditor(mockLevelEditor);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Save Functionality Integration', function() {
    it('should call levelEditor.save() when Save menu item clicked', function() {
      // Open File menu
      menuBar.openMenu('File');
      
      // Get Save option position
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15; // Save is second item (index 1)
      
      // Click Save
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.save.called).to.be.true;
    });
    
    it('should trigger save via keyboard shortcut Ctrl+S', function() {
      menuBar.handleKeyPress('s', { ctrl: true });
      
      expect(mockLevelEditor.save.called).to.be.true;
    });
    
    it('should integrate with SaveDialog', function() {
      // Trigger save
      const fileMenu = menuBar.getMenuItem('File');
      const saveOption = fileMenu.items.find(item => item.label === 'Save');
      saveOption.action();
      
      // Verify save dialog interaction
      expect(mockLevelEditor.save.called).to.be.true;
    });
  });
  
  describe('Load Functionality Integration', function() {
    it('should call levelEditor.load() when Load menu item clicked', function() {
      // Open File menu
      menuBar.openMenu('File');
      
      // Get Load option position
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (2 * 30) + 15; // Load is third item (index 2)
      
      // Click Load
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.load.called).to.be.true;
    });
    
    it('should trigger load via keyboard shortcut Ctrl+O', function() {
      menuBar.handleKeyPress('o', { ctrl: true });
      
      expect(mockLevelEditor.load.called).to.be.true;
    });
    
    it('should integrate with LoadDialog', function() {
      // Trigger load
      const fileMenu = menuBar.getMenuItem('File');
      const loadOption = fileMenu.items.find(item => item.label === 'Load');
      loadOption.action();
      
      // Verify load dialog interaction
      expect(mockLevelEditor.load.called).to.be.true;
    });
  });
  
  describe('Edit Menu Integration', function() {
    it('should call levelEditor.undo() when Undo clicked', function() {
      // Enable undo BEFORE updating menu states
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(false);
      
      // Recreate menuBar to get fresh menu items with enabled state
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      // Open Edit menu
      menuBar.openMenu('Edit');
      
      // Click Undo (first item, index 0)
      const menuPos = menuBar.menuPositions.find(p => p.label === 'Edit');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (0 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.undo.called).to.be.true;
    });
    
    it('should call levelEditor.redo() when Redo clicked', function() {
      // Enable redo BEFORE updating menu states
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(true);
      
      // Recreate menuBar to get fresh menu items with enabled state
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      // Open Edit menu
      menuBar.openMenu('Edit');
      
      // Click Redo (second item, index 1)
      const menuPos = menuBar.menuPositions.find(p => p.label === 'Edit');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.redo.called).to.be.true;
    });
    
    it('should trigger undo via keyboard shortcut Ctrl+Z', function() {
      // Enable undo BEFORE creating menuBar
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(false);
      
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      menuBar.handleKeyPress('z', { ctrl: true });
      
      expect(mockLevelEditor.undo.called).to.be.true;
    });
    
    it('should trigger redo via keyboard shortcut Ctrl+Y', function() {
      // Enable redo BEFORE creating menuBar
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(true);
      
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      menuBar.handleKeyPress('y', { ctrl: true });
      
      expect(mockLevelEditor.redo.called).to.be.true;
    });
    
    it('should update Undo/Redo enabled states based on editor', function() {
      // Initially disabled
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(false);
      menuBar.updateMenuStates();
      
      let editMenu = menuBar.getMenuItem('Edit');
      let undoOption = editMenu.items.find(item => item.label === 'Undo');
      let redoOption = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoOption.enabled).to.be.false;
      expect(redoOption.enabled).to.be.false;
      
      // Enable undo
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(false);
      menuBar.updateMenuStates();
      
      editMenu = menuBar.getMenuItem('Edit');
      undoOption = editMenu.items.find(item => item.label === 'Undo');
      redoOption = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoOption.enabled).to.be.true;
      expect(redoOption.enabled).to.be.false;
    });
  });
  
  describe('View Menu Integration', function() {
    it('should toggle grid visibility when Grid clicked', function() {
      expect(mockLevelEditor.showGrid).to.be.true;
      
      // Open View menu
      menuBar.openMenu('View');
      
      // Click Grid (first item, index 0)
      const menuPos = menuBar.menuPositions.find(p => p.label === 'View');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (0 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.showGrid).to.be.false;
    });
    
    it('should toggle minimap visibility when Minimap clicked', function() {
      expect(mockLevelEditor.showMinimap).to.be.true;
      
      // Open View menu
      menuBar.openMenu('View');
      
      // Click Minimap (second item, index 1)
      const menuPos = menuBar.menuPositions.find(p => p.label === 'View');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15;
      
      menuBar.handleClick(clickX, clickY);
      
      expect(mockLevelEditor.showMinimap).to.be.false;
    });
    
    it('should trigger grid toggle via keyboard shortcut G', function() {
      expect(mockLevelEditor.showGrid).to.be.true;
      
      menuBar.handleKeyPress('g', {});
      
      expect(mockLevelEditor.showGrid).to.be.false;
    });
    
    it('should trigger minimap toggle via keyboard shortcut M', function() {
      expect(mockLevelEditor.showMinimap).to.be.true;
      
      menuBar.handleKeyPress('m', {});
      
      expect(mockLevelEditor.showMinimap).to.be.false;
    });
  });
  
  describe('Complete Save/Load Workflow', function() {
    it('should complete full save workflow', function() {
      // 1. User opens File menu
      menuBar.openMenu('File');
      expect(menuBar.isMenuOpen('File')).to.be.true;
      
      // 2. User clicks Save
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (1 * 30) + 15;
      menuBar.handleClick(clickX, clickY);
      
      // 3. Save method called
      expect(mockLevelEditor.save.called).to.be.true;
      
      // 4. Menu closes
      expect(menuBar.isMenuOpen('File')).to.be.false;
    });
    
    it('should complete full load workflow', function() {
      // 1. User opens File menu
      menuBar.openMenu('File');
      expect(menuBar.isMenuOpen('File')).to.be.true;
      
      // 2. User clicks Load
      const menuPos = menuBar.menuPositions.find(p => p.label === 'File');
      const clickX = menuPos.x + 10;
      const clickY = 40 + (2 * 30) + 15;
      menuBar.handleClick(clickX, clickY);
      
      // 3. Load method called
      expect(mockLevelEditor.load.called).to.be.true;
      
      // 4. Menu closes
      expect(menuBar.isMenuOpen('File')).to.be.false;
    });
    
    it('should handle Save → Undo → Redo workflow', function() {
      // Start with undo/redo disabled
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(false);
      
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      // 1. Save
      menuBar.handleKeyPress('s', { ctrl: true });
      expect(mockLevelEditor.save.called).to.be.true;
      
      // 2. Make edit (undo becomes available)
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(false);
      
      // Recreate menuBar with new state
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      // 3. Undo
      menuBar.handleKeyPress('z', { ctrl: true });
      expect(mockLevelEditor.undo.called).to.be.true;
      
      // 4. Redo becomes available
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(true);
      
      // Recreate menuBar with new state
      menuBar = new FileMenuBar();
      menuBar.setLevelEditor(mockLevelEditor);
      
      // 5. Redo
      menuBar.handleKeyPress('y', { ctrl: true });
      expect(mockLevelEditor.redo.called).to.be.true;
    });
  });
  
  describe('Menu State Synchronization', function() {
    it('should keep menu states synced with editor state', function() {
      // Initial state
      expect(mockLevelEditor.editor.canUndo()).to.be.false;
      expect(mockLevelEditor.editor.canRedo()).to.be.false;
      
      menuBar.updateMenuStates();
      
      const editMenu = menuBar.getMenuItem('Edit');
      const undoOption = editMenu.items.find(item => item.label === 'Undo');
      const redoOption = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoOption.enabled).to.be.false;
      expect(redoOption.enabled).to.be.false;
      
      // Change editor state
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(true);
      
      menuBar.updateMenuStates();
      
      expect(undoOption.enabled).to.be.true;
      expect(redoOption.enabled).to.be.true;
    });
    
    it('should update states after each edit operation', function() {
      // Start with undo available
      mockLevelEditor.editor.canUndo.returns(true);
      menuBar.updateMenuStates();
      
      let editMenu = menuBar.getMenuItem('Edit');
      let undoOption = editMenu.items.find(item => item.label === 'Undo');
      expect(undoOption.enabled).to.be.true;
      
      // Undo (undo becomes unavailable)
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(true);
      menuBar.handleKeyPress('z', { ctrl: true });
      menuBar.updateMenuStates();
      
      editMenu = menuBar.getMenuItem('Edit');
      undoOption = editMenu.items.find(item => item.label === 'Undo');
      const redoOption = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoOption.enabled).to.be.false;
      expect(redoOption.enabled).to.be.true;
    });
  });
});




// ================================================================
// filenameDisplay.integration.test.js (13 tests)
// ================================================================
/**
 * Integration Tests: Filename Display
 * Tests interaction between LevelEditor filename display and save/export operations
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Filename Display - Integration Tests', function() {
  let sandbox;
  let editor;
  let renderSpy;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    // Mock canvas text rendering
    global.textSize = sandbox.spy();
    global.textAlign = sandbox.spy();
    global.fill = sandbox.spy();
    global.rect = sandbox.spy();
    global.text = sandbox.spy();
    
    window.textSize = global.textSize;
    window.textAlign = global.textAlign;
    window.fill = global.fill;
    window.rect = global.rect;
    window.text = global.text;
    
    // Load LevelEditor
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    editor = new LevelEditor();
    renderSpy = sandbox.spy(editor, 'renderFilenameDisplay');
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Display After Save Operation', function() {
    it('should update display when filename changes via save', function() {
      editor.setFilename('NewMap');
      
      editor.renderFilenameDisplay();
      
      expect(global.text.called).to.be.true;
      const textCall = global.text.getCalls().find(call => 
        call.args[0] && call.args[0].includes('NewMap')
      );
      expect(textCall).to.exist;
    });
    
    it('should show "Untitled" for new terrain', function() {
      editor.setFilename('Untitled');
      
      editor.renderFilenameDisplay();
      
      const textCall = global.text.getCalls().find(call => 
        call.args[0] && call.args[0].includes('Untitled')
      );
      expect(textCall).to.exist;
    });
  });
  
  describe('Display Positioning', function() {
    it('should render at top-center of canvas', function() {
      global.width = 800;
      editor.renderFilenameDisplay();
      
      // Text should be rendered with CENTER alignment
      expect(global.textAlign.calledWith(global.CENTER)).to.be.true;
      
      // Text should be at canvas width / 2
      const textCall = global.text.lastCall;
      if (textCall) {
        expect(textCall.args[1]).to.equal(400); // width/2
      }
    });
  });
  
  describe('Filename Extension Handling', function() {
    it('should not display .json extension', function() {
      editor.setFilename('map.json');
      
      editor.renderFilenameDisplay();
      
      // Check that text doesn't include .json
      const textCall = global.text.getCalls().find(call => 
        call.args[0] && call.args[0].includes('map') && !call.args[0].includes('.json')
      );
      expect(textCall).to.exist;
    });
    
    it('should handle .JSON extension (case insensitive)', function() {
      editor.setFilename('MAP.JSON');
      
      expect(editor.getFilename()).to.equal('MAP');
      
      editor.renderFilenameDisplay();
      
      const textCall = global.text.getCalls().find(call => 
        call.args[0] && call.args[0].includes('MAP') && !call.args[0].includes('.JSON')
      );
      expect(textCall).to.exist;
    });
  });
  
  describe('Display Persistence', function() {
    it('should persist across multiple renders', function() {
      editor.setFilename('TestMap');
      
      editor.renderFilenameDisplay();
      editor.renderFilenameDisplay();
      editor.renderFilenameDisplay();
      
      expect(global.text.callCount).to.be.at.least(3);
    });
    
    it('should maintain filename during zoom/pan', function() {
      editor.setFilename('MyLevel');
      const filename = editor.getFilename();
      
      // Simulate camera changes
      global.translate = sandbox.spy();
      global.scale = sandbox.spy();
      
      editor.renderFilenameDisplay();
      
      expect(editor.getFilename()).to.equal(filename);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle very long filenames', function() {
      const longName = 'a'.repeat(100);
      editor.setFilename(longName);
      
      expect(() => editor.renderFilenameDisplay()).to.not.throw();
    });
    
    it('should handle special characters in filename', function() {
      editor.setFilename('map-v2_final');
      
      expect(() => editor.renderFilenameDisplay()).to.not.throw();
      expect(editor.getFilename()).to.equal('map-v2_final');
    });
    
    it('should handle empty filename', function() {
      editor.setFilename('');
      
      expect(() => editor.renderFilenameDisplay()).to.not.throw();
    });
    
    it('should handle filename with multiple .json extensions', function() {
      editor.setFilename('map.json.json');
      
      // Should only strip the last .json
      expect(editor.getFilename()).to.equal('map.json');
    });
  });
  
  describe('Styling Consistency', function() {
    it('should use consistent text size', function() {
      editor.renderFilenameDisplay();
      
      expect(global.textSize.called).to.be.true;
      expect(global.textSize.firstCall.args[0]).to.equal(16);
    });
    
    it('should use semi-transparent background', function() {
      editor.renderFilenameDisplay();
      
      // Should call fill for background with alpha
      expect(global.fill.called).to.be.true;
    });
  });
});




// ================================================================
// fileNew.integration.test.js (17 tests)
// ================================================================
/**
 * Integration Tests: File → New
 * Tests interaction between LevelEditor, TerrainEditor, and terrain creation
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('File New - Integration Tests', function() {
  let sandbox;
  let editor;
  let terrainEditor;
  let customTerrain;
  let confirmStub;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    // Ensure global.confirm exists before stubbing
    if (!global.confirm) {
      global.confirm = () => true;
    }
    confirmStub = sandbox.stub(global, 'confirm');
    
    // Mock CustomTerrain
    const CustomTerrain = function(width, height) {
      this.width = width || 50;
      this.height = height || 50;
      this.grid = [];
      for (let y = 0; y < this.height; y++) {
        this.grid[y] = [];
        for (let x = 0; x < this.width; x++) {
          this.grid[y][x] = { type: 0 }; // Grass
        }
      }
    };
    global.CustomTerrain = CustomTerrain;
    window.CustomTerrain = CustomTerrain;
    
    // Mock TerrainEditor
    const TerrainEditor = function() {
      this.undoHistory = ['edit1', 'edit2'];
      this.redoHistory = ['redo1'];
    };
    TerrainEditor.prototype.clearHistory = function() {
      this.undoHistory = [];
      this.redoHistory = [];
    };
    global.TerrainEditor = TerrainEditor;
    window.TerrainEditor = TerrainEditor;
    
    // Load LevelEditor
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    // Create instances
    customTerrain = new CustomTerrain(50, 50);
    terrainEditor = new TerrainEditor();
    
    editor = new LevelEditor();
    editor.terrainEditor = terrainEditor;
    editor.customTerrain = customTerrain;
    editor.isModified = false;
    editor.currentFilename = 'TestLevel';
  });
  
  afterEach(function() {
    if (confirmStub) confirmStub.restore();
    sandbox.restore();
    delete global.CustomTerrain;
    delete window.CustomTerrain;
    delete global.TerrainEditor;
    delete window.TerrainEditor;
  });
  
  describe('New Terrain Creation', function() {
    it('should create blank CustomTerrain with default size 50x50', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      
      editor.handleFileNew();
      
      expect(editor.customTerrain).to.exist;
      expect(editor.customTerrain.width).to.equal(50);
      expect(editor.customTerrain.height).to.equal(50);
    });
    
    it('should create terrain with all default grass tiles', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      
      editor.handleFileNew();
      
      const terrain = editor.customTerrain;
      for (let y = 0; y < terrain.height; y++) {
        for (let x = 0; x < terrain.width; x++) {
          expect(terrain.grid[y][x].type).to.equal(0); // Grass
        }
      }
    });
  });
  
  describe('Filename Reset', function() {
    it('should reset filename to "Untitled"', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      editor.currentFilename = 'MyLevel';
      
      editor.handleFileNew();
      
      expect(editor.currentFilename).to.equal('Untitled');
    });
    
    it('should reset filename even if already "Untitled"', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      editor.currentFilename = 'Untitled';
      
      editor.handleFileNew();
      
      expect(editor.currentFilename).to.equal('Untitled');
    });
  });
  
  describe('Undo/Redo History Clearing', function() {
    it('should clear undo history', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      
      expect(terrainEditor.undoHistory.length).to.equal(2);
      
      editor.handleFileNew();
      
      expect(terrainEditor.undoHistory.length).to.equal(0);
    });
    
    it('should clear redo history', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      
      expect(terrainEditor.redoHistory.length).to.equal(1);
      
      editor.handleFileNew();
      
      expect(terrainEditor.redoHistory.length).to.equal(0);
    });
    
    it('should clear history even if already empty', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      terrainEditor.undoHistory = [];
      terrainEditor.redoHistory = [];
      
      expect(() => editor.handleFileNew()).to.not.throw();
      
      expect(terrainEditor.undoHistory.length).to.equal(0);
      expect(terrainEditor.redoHistory.length).to.equal(0);
    });
  });
  
  describe('Modified Flag Behavior', function() {
    it('should reset isModified to false', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      
      editor.handleFileNew();
      
      expect(editor.isModified).to.be.false;
    });
    
    it('should keep isModified false if not modified', function() {
      confirmStub.returns(true);
      editor.isModified = false;
      
      editor.handleFileNew();
      
      expect(editor.isModified).to.be.false;
    });
  });
  
  describe('Unsaved Changes Workflow', function() {
    it('should prompt when terrain modified', function() {
      editor.isModified = true;
      confirmStub.returns(true);
      
      editor.handleFileNew();
      
      expect(confirmStub.calledOnce).to.be.true;
      expect(confirmStub.firstCall.args[0]).to.include('unsaved');
    });
    
    it('should not prompt when terrain clean', function() {
      editor.isModified = false;
      
      editor.handleFileNew();
      
      expect(confirmStub.called).to.be.false;
    });
    
    it('should create new terrain on confirmation', function() {
      editor.isModified = true;
      confirmStub.returns(true);
      const oldTerrain = editor.customTerrain;
      
      editor.handleFileNew();
      
      expect(editor.customTerrain).to.not.equal(oldTerrain);
    });
    
    it('should preserve current terrain on cancel', function() {
      editor.isModified = true;
      confirmStub.returns(false);
      const oldTerrain = editor.customTerrain;
      const oldFilename = editor.currentFilename;
      
      editor.handleFileNew();
      
      expect(editor.customTerrain).to.equal(oldTerrain);
      expect(editor.currentFilename).to.equal(oldFilename);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle missing terrainEditor', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      editor.terrainEditor = null;
      
      expect(() => editor.handleFileNew()).to.not.throw();
      expect(editor.currentFilename).to.equal('Untitled');
    });
    
    it('should handle missing customTerrain', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      editor.customTerrain = null;
      
      expect(() => editor.handleFileNew()).to.not.throw();
    });
    
    it('should work without CustomTerrain class (fallback)', function() {
      confirmStub.returns(true);
      editor.isModified = true;
      delete global.CustomTerrain;
      delete window.CustomTerrain;
      
      // Should fallback to gridTerrain or handle gracefully
      expect(() => editor.handleFileNew()).to.not.throw();
    });
  });
  
  describe('Multiple New Operations', function() {
    it('should handle multiple new operations in sequence', function() {
      confirmStub.returns(true);
      
      editor.isModified = true;
      editor.handleFileNew();
      expect(editor.currentFilename).to.equal('Untitled');
      
      editor.currentFilename = 'Level2';
      editor.isModified = true;
      editor.handleFileNew();
      expect(editor.currentFilename).to.equal('Untitled');
      
      editor.currentFilename = 'Level3';
      editor.isModified = true;
      editor.handleFileNew();
      expect(editor.currentFilename).to.equal('Untitled');
    });
  });
});




// ================================================================
// fileSaveExport.integration.test.js (20 tests)
// ================================================================
/**
 * Integration Tests: File Save/Export
 * Tests interaction between LevelEditor, SaveDialog, and TerrainExporter
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('File Save/Export - Integration Tests', function() {
  let sandbox;
  let editor;
  let saveDialog;
  let terrainExporter;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    // Mock SaveDialog
    const SaveDialog = function() {
      this.isOpen = false;
      this.callback = null;
    };
    SaveDialog.prototype.show = function(callback) {
      this.isOpen = true;
      this.callback = callback;
    };
    SaveDialog.prototype.simulateInput = function(filename) {
      if (this.callback) {
        this.callback(filename);
      }
      this.isOpen = false;
    };
    global.SaveDialog = SaveDialog;
    window.SaveDialog = SaveDialog;
    
    // Mock TerrainExporter
    const TerrainExporter = function() {};
    TerrainExporter.prototype.export = function(terrain, filename) {
      this.lastExport = {
        terrain: terrain,
        filename: filename
      };
      return true;
    };
    global.TerrainExporter = TerrainExporter;
    window.TerrainExporter = TerrainExporter;
    
    // Load LevelEditor
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    // Create instances
    saveDialog = new SaveDialog();
    terrainExporter = new TerrainExporter();
    
    editor = new LevelEditor();
    editor.saveDialog = saveDialog;
    editor.terrainExporter = terrainExporter;
    editor.customTerrain = { grid: [[{ type: 0 }]] };
    editor.isModified = true;
    editor.currentFilename = 'Untitled';
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.SaveDialog;
    delete window.SaveDialog;
    delete global.TerrainExporter;
    delete window.TerrainExporter;
  });
  
  describe('Save → Filename → Export Workflow', function() {
    it('should show dialog, store filename, then allow export', function() {
      // Step 1: Save - show dialog
      editor.handleFileSave();
      expect(saveDialog.isOpen).to.be.true;
      
      // Step 2: User enters filename
      saveDialog.simulateInput('MyLevel');
      expect(editor.currentFilename).to.equal('MyLevel');
      expect(editor.isModified).to.be.false;
      
      // Step 3: Export uses stored filename
      editor.handleFileExport();
      expect(terrainExporter.lastExport.filename).to.equal('MyLevel.json');
    });
    
    it('should handle Save → Export without reopening dialog', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('TestMap');
      
      // Export should use stored filename without prompting
      const dialogOpenCount = saveDialog.isOpen ? 1 : 0;
      editor.handleFileExport();
      
      expect(terrainExporter.lastExport.filename).to.equal('TestMap.json');
      expect(saveDialog.isOpen).to.be.false;
    });
  });
  
  describe('Export Without Filename Workflow', function() {
    it('should prompt for filename if Untitled', function() {
      editor.currentFilename = 'Untitled';
      
      editor.handleFileExport();
      
      expect(saveDialog.isOpen).to.be.true;
    });
    
    it('should complete export after filename entered', function() {
      editor.currentFilename = 'Untitled';
      
      editor.handleFileExport();
      saveDialog.simulateInput('NewMap');
      
      expect(editor.currentFilename).to.equal('NewMap');
      // Export should have been triggered
      expect(terrainExporter.lastExport).to.exist;
    });
  });
  
  describe('Filename Normalization', function() {
    it('should strip .json extension from internal storage', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('map.json');
      
      expect(editor.currentFilename).to.equal('map');
    });
    
    it('should strip .JSON extension (case insensitive)', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('MAP.JSON');
      
      expect(editor.currentFilename).to.equal('MAP');
    });
    
    it('should append .json for download', function() {
      editor.currentFilename = 'MyMap';
      
      editor.handleFileExport();
      
      expect(terrainExporter.lastExport.filename).to.equal('MyMap.json');
    });
    
    it('should not double-append .json extension', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('level.json');
      
      editor.handleFileExport();
      
      expect(terrainExporter.lastExport.filename).to.equal('level.json');
    });
  });
  
  describe('Export with Existing Filename', function() {
    it('should export immediately if filename already set', function() {
      editor.currentFilename = 'ExistingMap';
      
      editor.handleFileExport();
      
      expect(saveDialog.isOpen).to.be.false;
      expect(terrainExporter.lastExport.filename).to.equal('ExistingMap.json');
    });
    
    it('should include terrain data in export', function() {
      editor.currentFilename = 'TestMap';
      const terrain = editor.customTerrain;
      
      editor.handleFileExport();
      
      expect(terrainExporter.lastExport.terrain).to.equal(terrain);
    });
  });
  
  describe('Modified Flag Behavior', function() {
    it('should clear isModified after save', function() {
      editor.isModified = true;
      
      editor.handleFileSave();
      saveDialog.simulateInput('SavedMap');
      
      expect(editor.isModified).to.be.false;
    });
    
    it('should not affect isModified on export', function() {
      editor.currentFilename = 'Map';
      editor.isModified = true;
      
      editor.handleFileExport();
      
      // Export doesn't change modified state
      expect(editor.isModified).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty filename gracefully', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('');
      
      // Empty filename should not crash
      expect(() => editor.handleFileExport()).to.not.throw();
    });
    
    it('should handle filename with special characters', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('map-v2_final');
      
      expect(editor.currentFilename).to.equal('map-v2_final');
      
      editor.handleFileExport();
      expect(terrainExporter.lastExport.filename).to.equal('map-v2_final.json');
    });
    
    it('should handle very long filenames', function() {
      const longName = 'a'.repeat(200);
      editor.handleFileSave();
      saveDialog.simulateInput(longName);
      
      expect(editor.currentFilename).to.equal(longName);
    });
    
    it('should handle missing saveDialog', function() {
      editor.saveDialog = null;
      
      expect(() => editor.handleFileSave()).to.not.throw();
    });
    
    it('should handle missing terrainExporter', function() {
      editor.terrainExporter = null;
      editor.currentFilename = 'Map';
      
      expect(() => editor.handleFileExport()).to.not.throw();
    });
    
    it('should handle missing customTerrain', function() {
      editor.customTerrain = null;
      editor.currentFilename = 'Map';
      
      expect(() => editor.handleFileExport()).to.not.throw();
    });
  });
  
  describe('Multiple Save/Export Cycles', function() {
    it('should handle multiple save operations', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('Map1');
      expect(editor.currentFilename).to.equal('Map1');
      
      editor.handleFileSave();
      saveDialog.simulateInput('Map2');
      expect(editor.currentFilename).to.equal('Map2');
      
      editor.handleFileSave();
      saveDialog.simulateInput('Map3');
      expect(editor.currentFilename).to.equal('Map3');
    });
    
    it('should handle alternating save/export operations', function() {
      editor.handleFileSave();
      saveDialog.simulateInput('Map1');
      editor.handleFileExport();
      expect(terrainExporter.lastExport.filename).to.equal('Map1.json');
      
      editor.handleFileSave();
      saveDialog.simulateInput('Map2');
      editor.handleFileExport();
      expect(terrainExporter.lastExport.filename).to.equal('Map2.json');
    });
  });
});

