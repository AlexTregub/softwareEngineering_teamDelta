/**
 * Integration Tests: Menu-Canvas Interaction Flow (Bug Fix #3)
 * 
 * Tests the complete interaction flow between FileMenuBar and LevelEditor:
 * 1. Menu bar remains clickable when dropdown is open
 * 2. Canvas clicks close menu and are consumed
 * 3. Terrain interaction only works when menu is closed
 * 
 * TDD: Write tests FIRST, then fix the bug
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('MenuBar-LevelEditor Integration - Click Handling', function() {
  let levelEditor, fileMenuBar, mockTerrain;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock terrain
    mockTerrain = {
      width: 50,
      height: 50,
      tileSize: 32,
      getTile: sinon.stub().returns({ getMaterial: () => 'grass' })
    };
    
    // Load real FileMenuBar and LevelEditor
    const FileMenuBar = require('../../../Classes/ui/FileMenuBar.js');
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
    
    // Create instances
    levelEditor = new LevelEditor();
    levelEditor.initialize(mockTerrain);
    
    fileMenuBar = levelEditor.fileMenuBar;
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Menu Bar Click Priority', function() {
    it('should allow clicking File menu to open dropdown', function() {
      // Click on File menu (approximate position)
      const fileX = 20;
      const menuBarY = 20;
      
      const handled = fileMenuBar.handleClick(fileX, menuBarY);
      
      expect(handled).to.be.true;
      expect(fileMenuBar.openMenuName).to.equal('File');
    });
    
    it('should allow switching from File to Edit menu when dropdown is open', function() {
      // Open File menu first
      fileMenuBar.openMenu('File');
      expect(fileMenuBar.openMenuName).to.equal('File');
      
      // Click on Edit menu (approximate position)
      const editX = 60;
      const menuBarY = 20;
      
      const handled = fileMenuBar.handleClick(editX, menuBarY);
      
      expect(handled).to.be.true;
      expect(fileMenuBar.openMenuName).to.equal('Edit');
    });
    
    it('should allow clicking View menu when File dropdown is open', function() {
      // Open File menu
      fileMenuBar.openMenu('File');
      
      // Click on View menu (approximate position)
      const viewX = 120;
      const menuBarY = 20;
      
      const handled = fileMenuBar.handleClick(viewX, menuBarY);
      
      expect(handled).to.be.true;
      expect(fileMenuBar.openMenuName).to.equal('View');
    });
  });
  
  describe('Canvas Click Closes Menu', function() {
    it('should close menu when clicking on canvas area', function() {
      // Open File menu
      fileMenuBar.openMenu('File');
      expect(fileMenuBar.openMenuName).to.equal('File');
      
      // Click on canvas (not menu bar)
      const canvasX = 400;
      const canvasY = 300;
      
      const handled = fileMenuBar.handleClick(canvasX, canvasY);
      
      expect(handled).to.be.true; // Click consumed by closing menu
      expect(fileMenuBar.openMenuName).to.be.null; // Menu closed
    });
    
    it('should notify LevelEditor when menu opens', function() {
      const setMenuOpenSpy = sinon.spy(levelEditor, 'setMenuOpen');
      
      fileMenuBar.openMenu('File');
      
      expect(setMenuOpenSpy.calledWith(true)).to.be.true;
    });
    
    it('should notify LevelEditor when menu closes', function() {
      fileMenuBar.openMenu('File');
      
      const setMenuOpenSpy = sinon.spy(levelEditor, 'setMenuOpen');
      
      fileMenuBar.closeMenu();
      
      expect(setMenuOpenSpy.calledWith(false)).to.be.true;
    });
  });
  
  describe('LevelEditor Click Handling with Menu State', function() {
    it('should block terrain painting when menu is open', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      fileMenuBar.openMenu('File');
      
      // Try to paint on terrain (canvas click)
      const canvasX = 400;
      const canvasY = 300;
      
      // Mock editor paint to track calls
      const paintSpy = sinon.spy(levelEditor.editor, 'paint');
      
      levelEditor.handleClick(canvasX, canvasY);
      
      // Paint should NOT be called (menu blocks terrain)
      expect(paintSpy.called).to.be.false;
    });
    
    it('should allow menu bar clicks even when menu is open', function() {
      // Open File menu
      levelEditor.setMenuOpen(true);
      fileMenuBar.openMenu('File');
      
      // Click on Edit menu (should work)
      const editX = 60;
      const menuBarY = 20;
      
      levelEditor.handleClick(editX, menuBarY);
      
      // Menu should have switched to Edit
      expect(fileMenuBar.openMenuName).to.equal('Edit');
    });
    
    it('should close menu and consume click when clicking canvas while menu open', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      fileMenuBar.openMenu('File');
      
      // Mock terrain editor
      const paintSpy = sinon.spy(levelEditor.editor, 'paint');
      
      // Click on canvas
      const canvasX = 400;
      const canvasY = 300;
      
      levelEditor.handleClick(canvasX, canvasY);
      
      // Menu should close
      expect(fileMenuBar.openMenuName).to.be.null;
      expect(levelEditor.isMenuOpen).to.be.false;
      
      // Paint should NOT be called (click consumed by closing menu)
      expect(paintSpy.called).to.be.false;
    });
    
    it('should allow terrain painting when menu is closed', function() {
      // Menu is closed
      expect(levelEditor.isMenuOpen).to.be.false;
      expect(fileMenuBar.openMenuName).to.be.null;
      
      // Mock terrain editor
      const paintSpy = sinon.spy(levelEditor.editor, 'paint');
      
      // Click on canvas
      const canvasX = 400;
      const canvasY = 300;
      
      levelEditor.handleClick(canvasX, canvasY);
      
      // Paint SHOULD be called
      expect(paintSpy.called).to.be.true;
    });
  });
  
  describe('Complete Click Flow', function() {
    it('should handle complete workflow: open menu -> switch menu -> close via canvas click', function() {
      // Step 1: Open File menu
      fileMenuBar.handleClick(20, 20);
      expect(fileMenuBar.openMenuName).to.equal('File');
      expect(levelEditor.isMenuOpen).to.be.true;
      
      // Step 2: Switch to Edit menu
      fileMenuBar.handleClick(60, 20);
      expect(fileMenuBar.openMenuName).to.equal('Edit');
      expect(levelEditor.isMenuOpen).to.be.true; // Still open
      
      // Step 3: Click canvas to close
      levelEditor.handleClick(400, 300);
      expect(fileMenuBar.openMenuName).to.be.null;
      expect(levelEditor.isMenuOpen).to.be.false;
      
      // Step 4: Now terrain painting should work
      const paintSpy = sinon.spy(levelEditor.editor, 'paint');
      levelEditor.handleClick(400, 300);
      expect(paintSpy.called).to.be.true;
    });
  });
  
  describe('Hover Preview Interaction', function() {
    it('should disable hover preview when menu is open', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      fileMenuBar.openMenu('File');
      
      // Mock hover preview manager
      const clearHoverSpy = sinon.spy(levelEditor.hoverPreviewManager, 'clearHover');
      const updateHoverSpy = sinon.spy(levelEditor.hoverPreviewManager, 'updateHover');
      
      // Hover over canvas
      levelEditor.handleHover(400, 300);
      
      // Should clear, not update
      expect(clearHoverSpy.called).to.be.true;
      expect(updateHoverSpy.called).to.be.false;
    });
    
    it('should enable hover preview when menu is closed', function() {
      // Menu closed
      expect(levelEditor.isMenuOpen).to.be.false;
      
      // Mock hover preview manager
      const updateHoverSpy = sinon.spy(levelEditor.hoverPreviewManager, 'updateHover');
      
      // Hover over canvas
      levelEditor.handleHover(400, 300);
      
      // Should update normally
      expect(updateHoverSpy.called).to.be.true;
    });
  });
});
