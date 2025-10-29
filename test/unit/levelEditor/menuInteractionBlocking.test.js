/**
 * Unit Tests: LevelEditor Menu Interaction (Bug Fix #3)
 * 
 * Tests for proper click consumption when menu is open:
 * 1. Menu bar should always be clickable
 * 2. Canvas clicks should close menu and be consumed
 * 3. Terrain interaction should only work when menu is closed
 * 
 * TDD: Write tests FIRST, then fix the bug
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('LevelEditor - Menu Interaction Blocking', function() {
  let levelEditor, mockTerrain, mockFileMenuBar;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock terrain
    mockTerrain = {
      width: 50,
      height: 50,
      tileSize: 32,
      getTile: sinon.stub().returns({ getMaterial: () => 'grass' })
    };
    
    // Create mock FileMenuBar with spies
    mockFileMenuBar = {
      containsPoint: sinon.stub().returns(false),
      handleClick: sinon.stub().returns(false),
      handleMouseMove: sinon.stub(),
      updateMenuStates: sinon.stub(),
      updateBrushSizeVisibility: sinon.stub(),
      openMenuName: null,
      setLevelEditor: sinon.stub()
    };
    
    // Load LevelEditor
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
    levelEditor = new LevelEditor();
    levelEditor.initialize(mockTerrain);
    
    // Mock camera conversion methods
    levelEditor.convertScreenToWorld = (x, y) => ({ worldX: x, worldY: y });
    levelEditor.editorCamera = {
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1
    };
    
    // Replace fileMenuBar with mock (override the one created by initialize)
    levelEditor.fileMenuBar = mockFileMenuBar;
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Click Handling Priority When Menu Open', function() {
    it('should NOT paint terrain when clicking menu bar (even with menu closed)', function() {
      // Menu is closed
      levelEditor.setMenuOpen(false);
      
      // Reset paint stub
      levelEditor.editor.paint.resetHistory();
      
      // Click on menu bar area
      mockFileMenuBar.containsPoint.returns(true);
      mockFileMenuBar.handleClick.returns(false); // Menu bar didn't consume (no menu item clicked)
      
      levelEditor.handleClick(50, 20); // Menu bar position
      
      // Paint should NOT have been called (mouse over menu bar)
      expect(levelEditor.editor.paint.called).to.be.false;
    });
    
    it('should check menu bar BEFORE blocking terrain interaction', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      expect(levelEditor.isMenuOpen).to.be.true;
      
      // Click on menu bar area
      mockFileMenuBar.containsPoint.returns(true);
      mockFileMenuBar.handleClick.returns(true);
      
      levelEditor.handleClick(50, 20); // Menu bar position
      
      // Menu bar should have been checked
      expect(mockFileMenuBar.handleClick.called).to.be.true;
    });
    
    it('should allow menu bar to handle clicks even when menu is open', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      
      // Menu bar should handle its own clicks
      mockFileMenuBar.containsPoint.returns(true);
      mockFileMenuBar.handleClick.returns(true);
      
      levelEditor.handleClick(50, 20);
      
      expect(mockFileMenuBar.handleClick.called).to.be.true;
    });
    
    it('should close menu when clicking canvas while menu is open', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      mockFileMenuBar.openMenuName = 'File';
      
      // Click on canvas (not menu bar)
      mockFileMenuBar.containsPoint.returns(false);
      mockFileMenuBar.handleClick.returns(true); // Menu closes, consuming click
      
      levelEditor.handleClick(400, 300); // Canvas position
      
      // Menu bar should have been notified of click (to close menu)
      expect(mockFileMenuBar.handleClick.called).to.be.true;
    });
    
    it('should consume canvas click that closes menu (no terrain interaction)', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      
      // Reset paint stub to track calls in this test
      levelEditor.editor.paint.resetHistory();
      
      // Click on canvas
      mockFileMenuBar.containsPoint.returns(false);
      mockFileMenuBar.handleClick.returns(true); // Menu closes
      
      levelEditor.handleClick(400, 300);
      
      // Paint should NOT have been called (click consumed by closing menu)
      expect(levelEditor.editor.paint.called).to.be.false;
    });
    
    it('should allow terrain interaction when menu is closed', function() {
      // Menu is closed
      levelEditor.setMenuOpen(false);
      
      // Reset paint stub to track calls in this test
      levelEditor.editor.paint.resetHistory();
      
      // Click on canvas
      mockFileMenuBar.containsPoint.returns(false);
      mockFileMenuBar.handleClick.returns(false); // Not on menu bar
      
      levelEditor.handleClick(400, 300);
      
      // Paint SHOULD have been called
      expect(levelEditor.editor.paint.called).to.be.true;
    });
  });
  
  describe('Menu State Management', function() {
    it('should set isMenuOpen to true when menu opens', function() {
      expect(levelEditor.isMenuOpen).to.be.false;
      
      levelEditor.setMenuOpen(true);
      
      expect(levelEditor.isMenuOpen).to.be.true;
    });
    
    it('should set isMenuOpen to false when menu closes', function() {
      levelEditor.setMenuOpen(true);
      expect(levelEditor.isMenuOpen).to.be.true;
      
      levelEditor.setMenuOpen(false);
      
      expect(levelEditor.isMenuOpen).to.be.false;
    });
  });
  
  describe('Hover Preview When Menu Open', function() {
    it('should disable hover preview when menu is open', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      
      // Mock hover preview manager
      const clearHoverSpy = sinon.spy(levelEditor.hoverPreviewManager, 'clearHover');
      
      // Hover over canvas
      mockFileMenuBar.containsPoint.returns(false);
      
      levelEditor.handleHover(400, 300);
      
      // Hover preview should be cleared (not shown)
      expect(clearHoverSpy.called).to.be.true;
    });
    
    it('should show hover preview when menu is closed', function() {
      // Menu is closed
      levelEditor.setMenuOpen(false);
      
      // Mock hover preview manager
      const updateHoverSpy = sinon.spy(levelEditor.hoverPreviewManager, 'updateHover');
      
      // Hover over canvas
      mockFileMenuBar.containsPoint.returns(false);
      
      levelEditor.handleHover(400, 300);
      
      // Hover preview should update normally
      expect(updateHoverSpy.called).to.be.true;
    });
  });
  
  describe('Drag Painting Over Menu Bar (Bug Fix #4)', function() {
    beforeEach(function() {
      // Set paint tool active
      if (!levelEditor.toolbar.setCurrentTool) {
        levelEditor.toolbar.setCurrentTool = sinon.stub();
      }
      levelEditor.toolbar.setCurrentTool('paint');
      levelEditor.toolbar.currentTool = 'paint';
      levelEditor.toolbar.getSelectedTool = sinon.stub().returns('paint');
      
      // Mock eventEditor
      levelEditor.eventEditor = {
        isDragging: sinon.stub().returns(false)
      };
      
      // Reset paint stub to track calls
      levelEditor.editor.paint.resetHistory();
    });
    
    it('should NOT paint when dragging mouse over menu bar', function() {
      // Mouse is over menu bar
      mockFileMenuBar.containsPoint.returns(true);
      
      levelEditor.handleDrag(50, 20); // Menu bar position
      
      // Paint should NOT have been called
      expect(levelEditor.editor.paint.called).to.be.false;
    });
    
    it('should NOT paint when menu is open', function() {
      // Open menu
      levelEditor.setMenuOpen(true);
      
      // Mouse is NOT over menu bar (on canvas)
      mockFileMenuBar.containsPoint.returns(false);
      
      levelEditor.handleDrag(400, 300); // Canvas position
      
      // Paint should NOT have been called (menu open blocks interaction)
      expect(levelEditor.editor.paint.called).to.be.false;
    });
    
    it('should paint when dragging over canvas with menu closed', function() {
      // Menu is closed
      levelEditor.setMenuOpen(false);
      
      // Mouse is NOT over menu bar
      mockFileMenuBar.containsPoint.returns(false);
      
      levelEditor.handleDrag(400, 300); // Canvas position
      
      // Paint SHOULD have been called
      expect(levelEditor.editor.paint.called).to.be.true;
    });
    
    it('should NOT paint when other tools active', function() {
      // Menu is closed
      levelEditor.setMenuOpen(false);
      
      // Switch to eyedropper tool
      levelEditor.toolbar.getSelectedTool.returns('eyedropper');
      
      // Mouse is NOT over menu bar
      mockFileMenuBar.containsPoint.returns(false);
      
      levelEditor.handleDrag(400, 300);
      
      // Paint should NOT have been called (wrong tool)
      expect(levelEditor.editor.paint.called).to.be.false;
    });
  });
});
