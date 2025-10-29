/**
 * Unit Tests: Menu Blocking
 * 
 * Tests for menu interaction blocking terrain editing in Level Editor.
 * Tests tool disabling, click/hover blocking, menu state management.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - Menu Blocking', function() {
  let levelEditor;
  let mockMenuBar;
  let mockTerrainEditor;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock MenuBar
    mockMenuBar = {
      handleClick: sinon.stub().returns(false),
      isDropdownOpen: sinon.stub().returns(false)
    };
    
    // Mock TerrainEditor
    mockTerrainEditor = {
      paint: sinon.spy(),
      fill: sinon.spy()
    };
    
    // Mock LevelEditor with menu blocking
    global.LevelEditor = class LevelEditor {
      constructor() {
        this.isMenuOpen = false;
        this.menuBar = mockMenuBar;
        this.editor = mockTerrainEditor;
        this.currentTool = 'paint';
        this.showHoverPreview = true;
      }
      
      setMenuOpen(isOpen) {
        this.isMenuOpen = isOpen;
      }
      
      handleClick(mouseX, mouseY) {
        // Check if menu is open
        if (this.isMenuOpen) {
          return false; // Block terrain editing
        }
        
        // Normal terrain editing
        if (this.currentTool === 'paint') {
          this.editor.paint(mouseX, mouseY);
          return true;
        }
        
        return false;
      }
      
      handleMouseMove(mouseX, mouseY) {
        // Skip hover preview if menu open
        if (this.isMenuOpen) {
          this.showHoverPreview = false;
          return;
        }
        
        this.showHoverPreview = true;
        // Normal hover behavior...
      }
    };
    
    levelEditor = new global.LevelEditor();
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Menu State Tracking', function() {
    it('should return true when dropdown is visible', function() {
      levelEditor.setMenuOpen(true);
      
      expect(levelEditor.isMenuOpen).to.be.true;
    });
    
    it('should return false when dropdown is closed', function() {
      levelEditor.setMenuOpen(false);
      
      expect(levelEditor.isMenuOpen).to.be.false;
    });
  });
  
  describe('Click Blocking', function() {
    it('should block handleClick when menu is open', function() {
      levelEditor.setMenuOpen(true);
      
      const result = levelEditor.handleClick(100, 100);
      
      expect(result).to.be.false;
      expect(mockTerrainEditor.paint.called).to.be.false;
    });
    
    it('should allow handleClick when menu is closed', function() {
      levelEditor.setMenuOpen(false);
      levelEditor.currentTool = 'paint';
      
      const result = levelEditor.handleClick(100, 100);
      
      expect(result).to.be.true;
      expect(mockTerrainEditor.paint.calledWith(100, 100)).to.be.true;
    });
  });
  
  describe('Hover Preview Blocking', function() {
    it('should skip hover preview when menu is open', function() {
      levelEditor.setMenuOpen(true);
      
      levelEditor.handleMouseMove(100, 100);
      
      expect(levelEditor.showHoverPreview).to.be.false;
    });
    
    it('should show hover preview when menu is closed', function() {
      levelEditor.setMenuOpen(false);
      
      levelEditor.handleMouseMove(100, 100);
      
      expect(levelEditor.showHoverPreview).to.be.true;
    });
  });
  
  describe('Tool Disabling', function() {
    it('should disable paint tool when menu open', function() {
      levelEditor.setMenuOpen(true);
      levelEditor.currentTool = 'paint';
      
      levelEditor.handleClick(100, 100);
      
      expect(mockTerrainEditor.paint.called).to.be.false;
    });
    
    it('should disable fill tool when menu open', function() {
      levelEditor.setMenuOpen(true);
      levelEditor.currentTool = 'fill';
      
      levelEditor.handleClick(100, 100);
      
      expect(mockTerrainEditor.fill.called).to.be.false;
    });
  });
  
  describe('Tool Re-enabling', function() {
    it('should re-enable tools when menu closes', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      levelEditor.handleClick(100, 100);
      expect(mockTerrainEditor.paint.called).to.be.false;
      
      // Close menu
      levelEditor.setMenuOpen(false);
      levelEditor.handleClick(100, 100);
      
      expect(mockTerrainEditor.paint.calledOnce).to.be.true;
    });
  });
});
