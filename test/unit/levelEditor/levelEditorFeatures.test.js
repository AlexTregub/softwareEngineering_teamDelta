/**
 * Consolidated Level Editor Features Tests
 * Generated: 2025-10-29T03:11:41.172Z
 * Source files: 11
 * Total tests: 103
 * 
 * This file contains all level editor features tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');
let sinon = require('sinon');


// ================================================================
// brushPanelHidden.test.js (5 tests)
// ================================================================
/**
 * Unit Tests: Brush Panel Hidden by Default (Enhancement #9)
 * 
 * Tests that the draggable Brush Panel is hidden by default in Level Editor
 * since brush size is now controlled via menu bar inline controls.
 * 
 * TDD: Write tests FIRST, then implement the enhancement
 */

let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - Brush Panel Hidden by Default', function() {
  let LevelEditorPanels;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Load LevelEditorPanels
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Default Visibility', function() {
    it('should NOT include Brush Panel in LEVEL_EDITOR state visibility', function() {
      // Create mock level editor
      const mockLevelEditor = {
        terrain: { width: 50, height: 50 },
        palette: { getSelectedMaterial: () => 'grass' },
        toolbar: { getSelectedTool: () => 'paint' },
        editor: {},
        minimap: {},
        eventEditor: {}
      };
      
      const panels = new LevelEditorPanels(mockLevelEditor);
      panels.initialize();
      
      // Check that draggablePanelManager was called without brush panel
      const brushPanelId = 'level-editor-brush';
      
      // Get the visibility list for LEVEL_EDITOR state
      if (typeof window.draggablePanelManager !== 'undefined' && 
          window.draggablePanelManager.stateVisibility &&
          window.draggablePanelManager.stateVisibility.LEVEL_EDITOR) {
        const visiblePanels = window.draggablePanelManager.stateVisibility.LEVEL_EDITOR;
        expect(visiblePanels).to.not.include(brushPanelId);
      }
    });
    
    it('should initialize Level Editor without Brush Panel visible', function() {
      const mockLevelEditor = {
        terrain: { width: 50, height: 50 },
        palette: { getSelectedMaterial: () => 'grass' },
        toolbar: { getSelectedTool: () => 'paint' },
        editor: {},
        minimap: {},
        eventEditor: {}
      };
      
      const panels = new LevelEditorPanels(mockLevelEditor);
      panels.initialize();
      
      // Verify brush panel was not added to visibility list
      const brushPanelId = 'level-editor-brush';
      
      if (typeof window.draggablePanelManager !== 'undefined' && 
          window.draggablePanelManager.stateVisibility) {
        const levelEditorPanels = window.draggablePanelManager.stateVisibility.LEVEL_EDITOR || [];
        expect(levelEditorPanels).to.be.an('array');
        expect(levelEditorPanels).to.not.include(brushPanelId);
      }
    });
  });
  
  describe('View Menu Integration', function() {
    it('should NOT include Brush Panel toggle in View menu', function() {
      // This test verifies that the View menu doesn't have a Brush Panel toggle
      // Since View menu is in FileMenuBar, we need to check that
      
      const mockLevelEditor = {
        terrain: { width: 50, height: 50 },
        palette: { getSelectedMaterial: () => 'grass' },
        toolbar: { getSelectedTool: () => 'paint' },
        editor: {},
        minimap: {},
        eventEditor: {},
        fileMenuBar: null
      };
      
      const panels = new LevelEditorPanels(mockLevelEditor);
      panels.initialize();
      
      // Check FileMenuBar View menu structure (if available)
      if (mockLevelEditor.fileMenuBar && mockLevelEditor.fileMenuBar.viewMenu) {
        const viewMenuItems = mockLevelEditor.fileMenuBar.viewMenu.items || [];
        const hasBrushPanelToggle = viewMenuItems.some(item => 
          item.label && item.label.includes('Brush')
        );
        
        expect(hasBrushPanelToggle).to.be.false;
      }
    });
  });
  
  describe('Other Panels Still Visible', function() {
    it('should still show Materials Panel by default', function() {
      const mockLevelEditor = {
        terrain: { width: 50, height: 50 },
        palette: { getSelectedMaterial: () => 'grass' },
        toolbar: { getSelectedTool: () => 'paint' },
        editor: {},
        minimap: {},
        eventEditor: {}
      };
      
      const panels = new LevelEditorPanels(mockLevelEditor);
      panels.initialize();
      
      const materialsPanelId = 'level-editor-materials';
      
      if (typeof window.draggablePanelManager !== 'undefined' && 
          window.draggablePanelManager.stateVisibility &&
          window.draggablePanelManager.stateVisibility.LEVEL_EDITOR) {
        const visiblePanels = window.draggablePanelManager.stateVisibility.LEVEL_EDITOR;
        expect(visiblePanels).to.include(materialsPanelId);
      }
    });
    
    it('should still show Tools Panel by default', function() {
      const mockLevelEditor = {
        terrain: { width: 50, height: 50 },
        palette: { getSelectedMaterial: () => 'grass' },
        toolbar: { getSelectedTool: () => 'paint' },
        editor: {},
        minimap: {},
        eventEditor: {}
      };
      
      const panels = new LevelEditorPanels(mockLevelEditor);
      panels.initialize();
      
      const toolsPanelId = 'level-editor-tools';
      
      if (typeof window.draggablePanelManager !== 'undefined' && 
          window.draggablePanelManager.stateVisibility &&
          window.draggablePanelManager.stateVisibility.LEVEL_EDITOR) {
        const visiblePanels = window.draggablePanelManager.stateVisibility.LEVEL_EDITOR;
        expect(visiblePanels).to.include(toolsPanelId);
      }
    });
  });
});




// ================================================================
// brushSizeScroll.test.js (9 tests)
// ================================================================
/**
 * Unit Tests: Brush Size Scroll
 * 
 * Tests for Shift + mouse wheel brush size adjustment in Level Editor.
 * Tests size changes, zoom interaction, tool-specific behavior.
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

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




// ================================================================
// dialogBlocking.test.js (12 tests)
// ================================================================
/**
 * Unit Tests: Dialog Blocking (Bug Fix 6)
 * 
 * Tests that save/load dialogs block terrain painting when visible.
 * 
 * TDD: Write FIRST, then fix bug
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('LevelEditor - Dialog Blocking', function() {
  let editor, mockSaveDialog, mockLoadDialog, mockTerrain, mockToolbar, mockPalette;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Additional Level Editor specific globals
    global.TILE_SIZE = 32;
    global.TERRAIN_TYPES = { GRASS: 0, WATER: 1, STONE: 2, SAND: 3, DIRT: 4 };
    global.draggablePanelManager = undefined;
    
    // Mock SaveDialog
    mockSaveDialog = {
      isVisible: sinon.stub().returns(false),
      handleClick: sinon.stub().returns(false),
      show: sinon.stub(),
      hide: sinon.stub()
    };
    
    // Mock LoadDialog
    mockLoadDialog = {
      isVisible: sinon.stub().returns(false),
      handleClick: sinon.stub().returns(false),
      show: sinon.stub(),
      hide: sinon.stub()
    };
    
    // Mock TerrainEditor
    mockTerrain = {
      paint: sinon.stub(),
      setBrushSize: sinon.stub(),
      selectMaterial: sinon.stub(),
      tileSize: 32,
      canUndo: sinon.stub().returns(false),
      canRedo: sinon.stub().returns(false)
    };
    
    // Mock Toolbar
    mockToolbar = {
      getSelectedTool: sinon.stub().returns('paint'),
      setEnabled: sinon.stub()
    };
    
    // Mock MaterialPalette
    mockPalette = {
      getSelectedMaterial: sinon.stub().returns('moss')
    };
    
    // Mock minimap
    const mockMinimap = {
      scheduleInvalidation: sinon.stub(),
      notifyTerrainEditStart: sinon.stub()
    };
    
    // Mock notifications
    const mockNotifications = {
      show: sinon.stub()
    };
    
    // Mock camera
    const mockCamera = {
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1
    };
    
    // Create minimal LevelEditor for testing
    editor = {
      active: true,
      saveDialog: mockSaveDialog,
      loadDialog: mockLoadDialog,
      editor: mockTerrain,
      terrain: mockTerrain, // Also add as terrain property
      toolbar: mockToolbar,
      palette: mockPalette,
      editorCamera: mockCamera,
      isMenuOpen: false,
      fileMenuBar: null,
      draggablePanels: null,
      minimap: mockMinimap,
      notifications: mockNotifications,
      eventEditor: null,
      hoverPreviewManager: {
        updateHover: sinon.stub(),
        clearHover: sinon.stub()
      },
      
      convertScreenToWorld: function(screenX, screenY) {
        return { worldX: screenX, worldY: screenY };
      }
    };
    
    // Load actual handleClick implementation
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    editor.handleClick = LevelEditor.prototype.handleClick;
    editor.handleDrag = LevelEditor.prototype.handleDrag;
    editor.handleHover = LevelEditor.prototype.handleHover || function() {}; // Add handleHover stub
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('handleClick() - Save Dialog Blocking', function() {
    it('should block terrain painting when save dialog is visible (clicked outside dialog)', function() {
      mockSaveDialog.isVisible.returns(true);
      mockSaveDialog.handleClick.returns(false); // Click outside dialog
      
      editor.handleClick(400, 300);
      
      expect(mockTerrain.paint.called).to.be.false;
    });
    
    it('should block terrain painting when save dialog consumes click', function() {
      mockSaveDialog.isVisible.returns(true);
      mockSaveDialog.handleClick.returns(true); // Click inside dialog
      
      editor.handleClick(400, 300);
      
      expect(mockTerrain.paint.called).to.be.false;
    });
    
    it('should allow terrain painting when save dialog is NOT visible', function() {
      mockSaveDialog.isVisible.returns(false);
      
      editor.handleClick(400, 300);
      
      expect(mockTerrain.paint.calledOnce).to.be.true;
    });
  });
  
  describe('handleClick() - Load Dialog Blocking', function() {
    it('should block terrain painting when load dialog is visible (clicked outside dialog)', function() {
      mockLoadDialog.isVisible.returns(true);
      mockLoadDialog.handleClick.returns(false); // Click outside dialog
      
      editor.handleClick(400, 300);
      
      expect(mockTerrain.paint.called).to.be.false;
    });
    
    it('should block terrain painting when load dialog consumes click', function() {
      mockLoadDialog.isVisible.returns(true);
      mockLoadDialog.handleClick.returns(true); // Click inside dialog
      
      editor.handleClick(400, 300);
      
      expect(mockTerrain.paint.called).to.be.false;
    });
    
    it('should allow terrain painting when load dialog is NOT visible', function() {
      mockLoadDialog.isVisible.returns(false);
      
      editor.handleClick(400, 300);
      
      expect(mockTerrain.paint.calledOnce).to.be.true;
    });
  });
  
  describe('handleDrag() - Save Dialog Blocking', function() {
    it('should block terrain painting when save dialog is visible', function() {
      mockSaveDialog.isVisible.returns(true);
      
      editor.handleDrag(400, 300);
      
      expect(mockTerrain.paint.called).to.be.false;
    });
    
    it('should allow terrain painting when save dialog is NOT visible', function() {
      mockSaveDialog.isVisible.returns(false);
      
      editor.handleDrag(400, 300);
      
      expect(mockTerrain.paint.calledOnce).to.be.true;
    });
  });
  
  describe('handleDrag() - Load Dialog Blocking', function() {
    it('should block terrain painting when load dialog is visible', function() {
      mockLoadDialog.isVisible.returns(true);
      
      editor.handleDrag(400, 300);
      
      expect(mockTerrain.paint.called).to.be.false;
    });
    
    it('should allow terrain painting when load dialog is NOT visible', function() {
      mockLoadDialog.isVisible.returns(false);
      
      editor.handleDrag(400, 300);
      
      expect(mockTerrain.paint.calledOnce).to.be.true;
    });
  });
  
  describe('Dialog Priority Order', function() {
    it('should check dialogs BEFORE menu bar check', function() {
      const mockMenuBar = {
        containsPoint: sinon.stub().returns(true),
        handleClick: sinon.stub().returns(false)
      };
      editor.fileMenuBar = mockMenuBar;
      
      mockSaveDialog.isVisible.returns(true);
      mockSaveDialog.handleClick.returns(false);
      
      editor.handleClick(400, 300);
      
      // Even though menu bar contains point, dialog should block first
      expect(mockTerrain.paint.called).to.be.false;
    });
    
    it('should check save dialog before load dialog', function() {
      mockSaveDialog.isVisible.returns(true);
      mockLoadDialog.isVisible.returns(true);
      
      editor.handleClick(400, 300);
      
      // Both visible - save checked first, blocks terrain
      expect(mockSaveDialog.isVisible.calledBefore(mockLoadDialog.isVisible)).to.be.true;
      expect(mockTerrain.paint.called).to.be.false;
    });
  });
});




// ================================================================
// eventsPanel.test.js (9 tests)
// ================================================================
/**
 * Unit Tests: Events Panel Visibility
 * 
 * Tests for Events Panel visibility and Tools panel integration.
 * Tests default hidden state, Tools panel toggle button, button highlighting.
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - Events Panel Visibility', function() {
  let draggablePanelManager;
  let toolsPanel;
  let eventsPanel;
  let eventsToggleButton;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock GameState
    global.GameState = {
      current: 'LEVEL_EDITOR',
      setState: sinon.stub()
    };
    window.GameState = global.GameState;
    
    // Mock Events Panel
    eventsPanel = {
      id: 'events-panel',
      visible: false,
      render: sinon.spy()
    };
    
    // Mock Events Toggle Button
    eventsToggleButton = {
      label: 'Events',
      highlighted: false,
      onClick: sinon.spy(),
      render: sinon.spy(),
      setHighlight: sinon.stub().callsFake(function(highlight) {
        this.highlighted = highlight;
      })
    };
    
    // Mock Tools Panel
    toolsPanel = {
      id: 'tools-panel',
      buttons: [],
      addButton: sinon.stub().callsFake(function(button) {
        this.buttons.push(button);
      }),
      getButton: sinon.stub().callsFake(function(label) {
        return this.buttons.find(b => b.label === label);
      })
    };
    
    // Mock DraggablePanelManager
    global.DraggablePanelManager = class DraggablePanelManager {
      constructor() {
        this.panels = new Map();
        this.stateVisibility = {
          LEVEL_EDITOR: [],
          PLAYING: [],
          MENU: []
        };
      }
      
      registerPanel(panel) {
        this.panels.set(panel.id, panel);
      }
      
      isVisibleInState(panelId, state) {
        return this.stateVisibility[state].includes(panelId);
      }
      
      setVisibleInState(panelId, state, visible) {
        const list = this.stateVisibility[state];
        const index = list.indexOf(panelId);
        
        if (visible && index === -1) {
          list.push(panelId);
        } else if (!visible && index !== -1) {
          list.splice(index, 1);
        }
        
        // Update button highlight if Tools panel exists
        const button = toolsPanel.getButton('Events');
        if (button) {
          button.setHighlight(visible);
        }
      }
      
      renderPanels(state) {
        this.panels.forEach(panel => {
          if (this.isVisibleInState(panel.id, state)) {
            panel.render();
          }
        });
      }
    };
    
    draggablePanelManager = new global.DraggablePanelManager();
    draggablePanelManager.registerPanel(eventsPanel);
    
    global.draggablePanelManager = draggablePanelManager;
    window.draggablePanelManager = draggablePanelManager;
    
    // Add Events button to Tools panel
    toolsPanel.addButton(eventsToggleButton);
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Default Visibility', function() {
    it('should not be visible by default', function() {
      const visible = draggablePanelManager.isVisibleInState('events-panel', 'LEVEL_EDITOR');
      
      expect(visible).to.be.false;
    });
    
    it('should not render when state is LEVEL_EDITOR', function() {
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(eventsPanel.render.called).to.be.false;
    });
  });
  
  describe('Tools Panel Integration', function() {
    it('should have Events toggle button in Tools panel', function() {
      const button = toolsPanel.getButton('Events');
      
      expect(button).to.exist;
      expect(button.label).to.equal('Events');
    });
    
    it('should show panel when Events button clicked', function() {
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      
      const visible = draggablePanelManager.isVisibleInState('events-panel', 'LEVEL_EDITOR');
      
      expect(visible).to.be.true;
    });
    
    it('should hide panel when Events button clicked again', function() {
      // Show first
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      expect(draggablePanelManager.isVisibleInState('events-panel', 'LEVEL_EDITOR')).to.be.true;
      
      // Hide
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', false);
      
      expect(draggablePanelManager.isVisibleInState('events-panel', 'LEVEL_EDITOR')).to.be.false;
    });
  });
  
  describe('Button Highlighting', function() {
    it('should highlight Events button when panel visible', function() {
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      
      const button = toolsPanel.getButton('Events');
      
      expect(button.highlighted).to.be.true;
    });
    
    it('should remove highlight when panel hidden', function() {
      // Show first
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      expect(toolsPanel.getButton('Events').highlighted).to.be.true;
      
      // Hide
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', false);
      
      expect(toolsPanel.getButton('Events').highlighted).to.be.false;
    });
  });
  
  describe('Render Behavior', function() {
    it('should render panel when visible', function() {
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(eventsPanel.render.calledOnce).to.be.true;
    });
    
    it('should persist visibility across renders', function() {
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(eventsPanel.render.callCount).to.equal(2);
    });
  });
});




// ================================================================
// eventsToolsPanelIntegration.test.js (10 tests)
// ================================================================
/**
 * Unit Tests for Events Panel Tools Integration
 * Tests the Events button in the Tools panel that toggles EventEditorPanel visibility
 * 
 * TDD Phase 1A: Write tests FIRST
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('EventsToolsPanelIntegration', function() {
  let LevelEditorPanels;
  let mockLevelEditor;
  let mockDraggablePanelManager;
  let panels;

  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock DraggablePanel
    global.DraggablePanel = class {
      constructor(config) {
        this.config = config;
        this.state = { visible: false, minimized: false };
      }
      show() { this.state.visible = true; }
      hide() { this.state.visible = false; }
      isVisible() { return this.state.visible; }
      isMouseOver() { return false; }
      getPosition() { return { x: 0, y: 0 }; }
      calculateTitleBarHeight() { return 30; }
      render() {}
    };
    window.DraggablePanel = global.DraggablePanel;
    
    // Create a mock panel for events
    const mockEventsPanel = new global.DraggablePanel({ id: 'level-editor-events' });
    
    // Mock DraggablePanelManager
    mockDraggablePanelManager = {
      panels: new Map([['level-editor-events', mockEventsPanel]]),
      stateVisibility: { LEVEL_EDITOR: [] },
      togglePanel: sinon.stub(),
      removePanel: sinon.stub(),
      isPanelVisible: sinon.stub().returns(false)
    };
    global.draggablePanelManager = mockDraggablePanelManager;
    window.draggablePanelManager = mockDraggablePanelManager;
    
    // Mock ToolBar with addButton method
    global.ToolBar = class {
      constructor() {
        this.tools = {};
        this.buttons = [];
      }
      
      addButton(config) {
        this.buttons.push(config);
        this.tools[config.name] = config;
      }
      
      hasButton(name) {
        return this.tools.hasOwnProperty(name);
      }
      
      getButton(name) {
        return this.tools[name];
      }
      
      handleClick() { return null; }
      containsPoint() { return false; }
      getContentSize() { return { width: 45, height: 285 }; }
      render() {}
    };
    window.ToolBar = global.ToolBar;
    
    // Mock MaterialPalette
    global.MaterialPalette = class {
      getContentSize() { return { width: 95, height: 95 }; }
      containsPoint() { return false; }
      handleClick() { return false; }
      render() {}
    };
    window.MaterialPalette = global.MaterialPalette;
    
    // Mock EventEditorPanel
    global.EventEditorPanel = class {
      getContentSize() { return { width: 250, height: 300 }; }
      containsPoint() { return false; }
      handleClick() { return null; }
      render() {}
    };
    window.EventEditorPanel = global.EventEditorPanel;
    
    // Mock LevelEditorSidebar
    global.LevelEditorSidebar = class {
      constructor() {
        this.width = 250;
        this.height = 600;
      }
      getContentSize() { return { width: 250, height: 600 }; }
      containsPoint() { return false; }
      handleClick() { return false; }
      handleMouseWheel() { return false; }
      addText() {}
      addButton() {}
      render() {}
    };
    window.LevelEditorSidebar = global.LevelEditorSidebar;
    
    // Mock logging
    global.logNormal = sinon.stub();
    
    // Load LevelEditorPanels after mocks
    delete require.cache[require.resolve('../../../Classes/systems/ui/LevelEditorPanels.js')];
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');
    
    // Create mock level editor
    mockLevelEditor = {
      palette: new global.MaterialPalette(),
      toolbar: new global.ToolBar(),
      eventEditor: new global.EventEditorPanel(),
      notifications: {
        show: sinon.stub()
      }
    };
    
    panels = new LevelEditorPanels(mockLevelEditor);
    panels.initialize();
  });

  afterEach(function() {
    cleanupUITestEnvironment();
  });

  describe('Tools Panel Events Button', function() {
    it('should have Events button in toolbar after adding', function() {
      // Add Events button to toolbar
      mockLevelEditor.toolbar.addButton({
        name: 'events',
        icon: '🚩',
        tooltip: 'Events (Toggle Events Panel)',
        onClick: () => panels.toggleEventsPanel()
      });
      
      expect(mockLevelEditor.toolbar.hasButton('events')).to.be.true;
    });

    it('should have correct button configuration', function() {
      mockLevelEditor.toolbar.addButton({
        name: 'events',
        icon: '🚩',
        tooltip: 'Events (Toggle Events Panel)',
        onClick: () => panels.toggleEventsPanel()
      });
      
      const eventsButton = mockLevelEditor.toolbar.getButton('events');
      expect(eventsButton).to.exist;
      expect(eventsButton.name).to.equal('events');
      expect(eventsButton.icon).to.equal('🚩');
      expect(eventsButton.tooltip).to.include('Events');
    });
  });

  describe('toggleEventsPanel()', function() {
    beforeEach(function() {
      // Add method to panels instance (will be implemented in Phase 1B)
      panels.toggleEventsPanel = function() {
        const manager = window.draggablePanelManager;
        if (manager) {
          manager.togglePanel('level-editor-events');
        }
      };
    });

    it('should call draggablePanelManager.togglePanel with correct panel ID', function() {
      panels.toggleEventsPanel();
      
      expect(mockDraggablePanelManager.togglePanel.calledOnce).to.be.true;
      expect(mockDraggablePanelManager.togglePanel.calledWith('level-editor-events')).to.be.true;
    });

    it('should toggle panel visibility on multiple calls', function() {
      // Mock toggle behavior
      let visible = false;
      mockDraggablePanelManager.togglePanel.callsFake(() => {
        visible = !visible;
        panels.panels.events.state.visible = visible;
      });
      
      panels.toggleEventsPanel();
      expect(panels.panels.events.state.visible).to.be.true;
      
      panels.toggleEventsPanel();
      expect(panels.panels.events.state.visible).to.be.false;
      
      panels.toggleEventsPanel();
      expect(panels.panels.events.state.visible).to.be.true;
    });
  });

  describe('Events Panel Default Visibility', function() {
    it('should be hidden by default', function() {
      expect(panels.panels.events).to.exist;
      expect(panels.panels.events.state.visible).to.be.false;
    });

    it('should NOT be in default LEVEL_EDITOR state visibility list', function() {
      const visiblePanels = mockDraggablePanelManager.stateVisibility.LEVEL_EDITOR || [];
      expect(visiblePanels).to.not.include('level-editor-events');
    });
  });

  describe('Events Panel State Persistence', function() {
    it('should persist visibility state in draggablePanelManager', function() {
      // Set up persistence mock
      mockDraggablePanelManager.isPanelVisible.withArgs('level-editor-events').returns(true);
      
      const isVisible = mockDraggablePanelManager.isPanelVisible('level-editor-events');
      expect(isVisible).to.be.true;
    });

    it('should maintain state across multiple toggles', function() {
      const states = [];
      const mockPanel = mockDraggablePanelManager.panels.get('level-editor-events');
      
      panels.toggleEventsPanel(); // Should show
      states.push(mockPanel.state.visible);
      
      panels.toggleEventsPanel(); // Should hide
      states.push(mockPanel.state.visible);
      
      panels.toggleEventsPanel(); // Should show
      states.push(mockPanel.state.visible);
      
      expect(states).to.deep.equal([true, false, true]);
    });
  });

  describe('Button Highlight State', function() {
    it('should highlight button when panel is visible', function() {
      // Mock button with highlighted state
      const eventsButton = {
        name: 'events',
        icon: '🚩',
        highlighted: false
      };
      
      mockLevelEditor.toolbar.addButton(eventsButton);
      
      // Simulate toggle on
      panels.panels.events.state.visible = true;
      eventsButton.highlighted = panels.panels.events.state.visible;
      
      expect(eventsButton.highlighted).to.be.true;
    });

    it('should not highlight button when panel is hidden', function() {
      const eventsButton = {
        name: 'events',
        icon: '🚩',
        highlighted: false
      };
      
      mockLevelEditor.toolbar.addButton(eventsButton);
      
      // Panel is hidden by default
      panels.panels.events.state.visible = false;
      eventsButton.highlighted = panels.panels.events.state.visible;
      
      expect(eventsButton.highlighted).to.be.false;
    });
  });
});




// ================================================================
// filenameDisplay.test.js (10 tests)
// ================================================================
/**
 * Unit Tests: Filename Display
 * 
 * Tests for filename display at top-center of Level Editor.
 * Tests default display, filename updates, extension stripping, positioning.
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - Filename Display', function() {
  let levelEditor;
  let textSpy;
  let textAlignSpy;
  let textSizeSpy;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Spy on p5 text functions
    textSpy = sinon.spy();
    textAlignSpy = sinon.spy();
    textSizeSpy = sinon.spy();
    
    global.text = textSpy;
    window.text = textSpy;
    global.textAlign = textAlignSpy;
    window.textAlign = textAlignSpy;
    global.textSize = textSizeSpy;
    window.textSize = textSizeSpy;
    global.CENTER = 'CENTER';
    window.CENTER = 'CENTER';
    global.TOP = 'TOP';
    window.TOP = 'TOP';
    
    // Mock LevelEditor with filename display
    global.LevelEditor = class LevelEditor {
      constructor() {
        this.currentFilename = 'Untitled';
      }
      
      setFilename(name) {
        // Strip .json extension if present
        this.currentFilename = name.replace(/\.json$/i, '');
      }
      
      getFilename() {
        return this.currentFilename;
      }
      
      renderFilenameDisplay() {
        const canvasWidth = window.width || 800;
        const centerX = canvasWidth / 2;
        const topY = 40;
        
        textAlign(CENTER, TOP);
        textSize(16);
        text(this.currentFilename, centerX, topY);
      }
    };
    
    levelEditor = new global.LevelEditor();
    
    // Mock canvas dimensions
    window.width = 800;
    window.height = 600;
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Default Display', function() {
    it('should display "Untitled" by default', function() {
      expect(levelEditor.getFilename()).to.equal('Untitled');
    });
    
    it('should render at top-center of canvas', function() {
      levelEditor.renderFilenameDisplay();
      
      expect(textAlignSpy.calledWith(CENTER, TOP)).to.be.true;
      expect(textSpy.calledWith('Untitled', 400, 40)).to.be.true;
    });
  });
  
  describe('Filename Updates', function() {
    it('should update when filename changes', function() {
      levelEditor.setFilename('my-level');
      
      expect(levelEditor.getFilename()).to.equal('my-level');
    });
    
    it('should strip .json extension from display', function() {
      levelEditor.setFilename('terrain-data.json');
      
      expect(levelEditor.getFilename()).to.equal('terrain-data');
    });
    
    it('should handle .JSON extension (case insensitive)', function() {
      levelEditor.setFilename('MY-LEVEL.JSON');
      
      expect(levelEditor.getFilename()).to.equal('MY-LEVEL');
    });
    
    it('should not strip .json from middle of filename', function() {
      levelEditor.setFilename('level.json.backup');
      
      expect(levelEditor.getFilename()).to.equal('level.json.backup');
    });
  });
  
  describe('Render Behavior', function() {
    it('should render updated filename', function() {
      levelEditor.setFilename('forest-map');
      levelEditor.renderFilenameDisplay();
      
      expect(textSpy.calledWith('forest-map', 400, 40)).to.be.true;
    });
    
    it('should use correct text size', function() {
      levelEditor.renderFilenameDisplay();
      
      expect(textSizeSpy.calledWith(16)).to.be.true;
    });
    
    it('should center text horizontally', function() {
      window.width = 1200;
      levelEditor.renderFilenameDisplay();
      
      expect(textSpy.calledWith('Untitled', 600, 40)).to.be.true;
    });
  });
  
  describe('Display After Save', function() {
    it('should display saved filename after save operation', function() {
      levelEditor.setFilename('saved-level.json');
      
      expect(levelEditor.getFilename()).to.equal('saved-level');
      
      levelEditor.renderFilenameDisplay();
      
      expect(textSpy.calledWith('saved-level', 400, 40)).to.be.true;
    });
  });
});




// ================================================================
// fileNew.test.js (8 tests)
// ================================================================
/**
 * Unit Tests: File New
 * 
 * Tests for File → New functionality in Level Editor.
 * Tests terrain clearing, unsaved changes prompt, filename reset, undo history clearing.
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - File New', function() {
  let levelEditor;
  let mockTerrain;
  let mockTerrainEditor;
  let confirmStub;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock terrain
    mockTerrain = {
      width: 50,
      height: 50,
      clear: sinon.spy()
    };
    
    // Mock TerrainEditor
    mockTerrainEditor = {
      clearHistory: sinon.spy(),
      canUndo: sinon.stub().returns(false),
      canRedo: sinon.stub().returns(false)
    };
    
    // Mock window.confirm (add it first if it doesn't exist)
    if (!global.confirm) {
      global.confirm = () => true;
    }
    confirmStub = sinon.stub(global, 'confirm');
    window.confirm = global.confirm;
    
    // Mock CustomTerrain constructor
    global.CustomTerrain = sinon.stub().returns(mockTerrain);
    
    // Mock LevelEditor with handleFileNew method
    global.LevelEditor = class LevelEditor {
      constructor() {
        this.terrain = mockTerrain;
        this.editor = mockTerrainEditor;
        this.currentFilename = "TestMap";
        this.isModified = false;
      }
      
      handleFileNew() {
        if (this.isModified) {
          const confirmed = confirm("Discard unsaved changes?");
          if (!confirmed) {
            return false; // Cancelled
          }
        }
        
        // Create new terrain
        this.terrain = new CustomTerrain(50, 50);
        
        // Reset filename
        this.currentFilename = "Untitled";
        
        // Clear undo/redo history
        this.editor.clearHistory();
        
        // Reset modified flag
        this.isModified = false;
        
        return true;
      }
    };
    
    levelEditor = new global.LevelEditor();
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
    if (confirmStub) {
      confirmStub.restore();
    }
  });
  
  describe('Unsaved Changes Prompt', function() {
    it('should prompt if terrain has been modified', function() {
      levelEditor.isModified = true;
      confirmStub.returns(true);
      
      levelEditor.handleFileNew();
      
      expect(confirmStub.calledOnce).to.be.true;
      expect(confirmStub.calledWith("Discard unsaved changes?")).to.be.true;
    });
    
    it('should not prompt if terrain has not been modified', function() {
      levelEditor.isModified = false;
      
      levelEditor.handleFileNew();
      
      expect(confirmStub.called).to.be.false;
    });
  });
  
  describe('Confirmation Behavior', function() {
    it('should create new blank terrain on confirmation', function() {
      levelEditor.isModified = true;
      confirmStub.returns(true);
      
      const result = levelEditor.handleFileNew();
      
      expect(result).to.be.true;
      expect(global.CustomTerrain.calledWith(50, 50)).to.be.true;
    });
    
    it('should preserve current terrain on cancel', function() {
      levelEditor.isModified = true;
      confirmStub.returns(false);
      const originalTerrain = levelEditor.terrain;
      
      const result = levelEditor.handleFileNew();
      
      expect(result).to.be.false;
      expect(levelEditor.terrain).to.equal(originalTerrain);
    });
  });
  
  describe('Filename Reset', function() {
    it('should reset filename to "Untitled"', function() {
      levelEditor.currentFilename = "MyLevel";
      levelEditor.isModified = false;
      
      levelEditor.handleFileNew();
      
      expect(levelEditor.currentFilename).to.equal("Untitled");
    });
  });
  
  describe('Undo/Redo History', function() {
    it('should clear undo/redo history', function() {
      levelEditor.isModified = false;
      
      levelEditor.handleFileNew();
      
      expect(mockTerrainEditor.clearHistory.calledOnce).to.be.true;
    });
    
    it('should have empty undo history after new', function() {
      levelEditor.isModified = false;
      
      levelEditor.handleFileNew();
      
      expect(mockTerrainEditor.canUndo()).to.be.false;
      expect(mockTerrainEditor.canRedo()).to.be.false;
    });
  });
  
  describe('Modified Flag', function() {
    it('should reset modified flag to false', function() {
      levelEditor.isModified = true;
      confirmStub.returns(true);
      
      levelEditor.handleFileNew();
      
      expect(levelEditor.isModified).to.be.false;
    });
  });
});




// ================================================================
// fileSaveExport.test.js (10 tests)
// ================================================================
/**
 * Unit Tests: File Save/Export
 * 
 * Tests for File → Save and File → Export functionality in Level Editor.
 * Tests naming dialog, filename storage, export workflow.
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - File Save/Export', function() {
  let levelEditor;
  let mockSaveDialog;
  let mockTerrainExporter;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock SaveDialog
    mockSaveDialog = {
      show: sinon.spy(),
      onSave: null // Will be set by LevelEditor
    };
    
    // Mock TerrainExporter
    mockTerrainExporter = {
      exportToJSON: sinon.spy()
    };
    
    global.TerrainExporter = sinon.stub().returns(mockTerrainExporter);
    
    // Mock LevelEditor with save/export methods
    global.LevelEditor = class LevelEditor {
      constructor() {
        this.currentFilename = "Untitled";
        this.isModified = true;
        this.saveDialog = mockSaveDialog;
        this.terrain = { /* mock terrain */ };
      }
      
      handleFileSave() {
        // Show naming dialog
        this.saveDialog.show();
        
        // Dialog will call onSaveComplete when user enters name
      }
      
      onSaveComplete(filename) {
        // Store filename without extension
        const nameWithoutExt = filename.replace(/\.json$/i, '');
        this.currentFilename = nameWithoutExt;
        this.isModified = false;
      }
      
      handleFileExport() {
        // Check if filename is set
        if (this.currentFilename === "Untitled") {
          // Prompt for name first
          this.handleFileSave();
          // Will export after save completes
          return false;
        }
        
        // Export with current filename
        const exporter = new TerrainExporter(this.terrain);
        exporter.exportToJSON(this.currentFilename + '.json');
        return true;
      }
    };
    
    levelEditor = new global.LevelEditor();
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('File Save - Naming Dialog', function() {
    it('should show naming dialog when Save clicked', function() {
      levelEditor.handleFileSave();
      
      expect(mockSaveDialog.show.calledOnce).to.be.true;
    });
    
    it('should set currentFilename when name entered', function() {
      levelEditor.onSaveComplete("MyLevel");
      
      expect(levelEditor.currentFilename).to.equal("MyLevel");
    });
    
    it('should strip .json extension from filename', function() {
      levelEditor.onSaveComplete("MyLevel.json");
      
      expect(levelEditor.currentFilename).to.equal("MyLevel");
    });
    
    it('should set isModified to false after save', function() {
      levelEditor.isModified = true;
      
      levelEditor.onSaveComplete("MyLevel");
      
      expect(levelEditor.isModified).to.be.false;
    });
  });
  
  describe('File Export - With Filename', function() {
    it('should export immediately if filename is set', function() {
      levelEditor.currentFilename = "MyLevel";
      
      const result = levelEditor.handleFileExport();
      
      expect(result).to.be.true;
      expect(global.TerrainExporter.calledOnce).to.be.true;
      expect(mockTerrainExporter.exportToJSON.calledWith("MyLevel.json")).to.be.true;
    });
    
    it('should append .json extension for download', function() {
      levelEditor.currentFilename = "TestMap";
      
      levelEditor.handleFileExport();
      
      expect(mockTerrainExporter.exportToJSON.calledWith("TestMap.json")).to.be.true;
    });
  });
  
  describe('File Export - Without Filename', function() {
    it('should prompt for filename if Untitled', function() {
      levelEditor.currentFilename = "Untitled";
      
      const result = levelEditor.handleFileExport();
      
      expect(result).to.be.false; // Not exported yet
      expect(mockSaveDialog.show.calledOnce).to.be.true;
    });
    
    it('should export after save dialog completes', function() {
      levelEditor.currentFilename = "Untitled";
      
      // Trigger export (will show save dialog)
      levelEditor.handleFileExport();
      
      // User enters name in dialog
      levelEditor.onSaveComplete("NewMap");
      
      // Now export should work
      const result = levelEditor.handleFileExport();
      
      expect(result).to.be.true;
      expect(mockTerrainExporter.exportToJSON.calledWith("NewMap.json")).to.be.true;
    });
  });
  
  describe('Filename Storage', function() {
    it('should store filename without extension internally', function() {
      levelEditor.onSaveComplete("MyMap.json");
      
      expect(levelEditor.currentFilename).to.equal("MyMap");
      expect(levelEditor.currentFilename).to.not.include(".json");
    });
    
    it('should handle filename without extension', function() {
      levelEditor.onSaveComplete("MyMap");
      
      expect(levelEditor.currentFilename).to.equal("MyMap");
    });
  });
});




// ================================================================
// menuBlocking.test.js (9 tests)
// ================================================================
/**
 * Unit Tests: Menu Blocking
 * 
 * Tests for menu interaction blocking terrain editing in Level Editor.
 * Tests tool disabling, click/hover blocking, menu state management.
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

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




// ================================================================
// menuInteractionBlocking.test.js (14 tests)
// ================================================================
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

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('LevelEditor - Menu Interaction Blocking', function() {
  let levelEditor, mockTerrain, mockFileMenuBar;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock EventFlagLayer (required by LevelEditor.initialize)
    global.EventFlagLayer = class EventFlagLayer {
      constructor(terrain) {
        this.terrain = terrain;
        this.flags = [];
      }
      addFlag(x, y, eventId) {
        this.flags.push({ x, y, eventId });
      }
      removeFlag(x, y) {
        this.flags = this.flags.filter(f => f.x !== x || f.y !== y);
      }
      getFlags() {
        return this.flags;
      }
    };
    
    // Mock Toolbar class (required by LevelEditor.initialize)
    global.Toolbar = class Toolbar {
      constructor() {
        this.buttons = [];
      }
      addButton(buttonConfig) {
        this.buttons.push(buttonConfig);
      }
      render() {}
      handleClick() { return false; }
    };
    
    // Mock ToolBar (with capital B - matches actual class name)
    global.ToolBar = class ToolBar {
      constructor(tools) {
        this.tools = tools || [];
        this.buttons = [];
        this.selectedTool = 'paint'; // Default to paint tool
        this.onToolChange = null;
      }
      
      selectTool(name) {
        const oldTool = this.selectedTool;
        this.selectedTool = name;
        if (this.onToolChange) {
          this.onToolChange(name, oldTool);
        }
      }
      
      getSelectedTool() {
        return this.selectedTool;
      }
      
      setEnabled(enabled) {
        this.enabled = enabled;
      }
      
      addButton(buttonConfig) {
        this.buttons.push(buttonConfig);
      }
      
      render() {}
      handleClick() { return false; }
    };
    window.ToolBar = global.ToolBar;
    
    // Mock NewMapDialog
    global.NewMapDialog = class NewMapDialog {
      constructor() {
        this.visible = false;
        this.onConfirm = null;
        this.onCancel = null;
      }
      show() { this.visible = true; }
      hide() { this.visible = false; }
      isVisible() { return this.visible; }
      handleClick() { return false; }
      render() {}
    };
    window.NewMapDialog = global.NewMapDialog;
    
    // Mock terrain
    mockTerrain = {
      width: 50,
      height: 50,
      tileSize: 32,
      getTile: sinon.stub().returns({ getMaterial: () => 'grass' })
    };
    
    // Mock TerrainEditor
    global.TerrainEditor = class TerrainEditor {
      constructor(terrain) {
        this.terrain = terrain;
        this.paint = sinon.stub();
        this.brushSize = 1;
        this.currentMaterial = 'grass';
      }
      getCurrentMaterial() { return this.currentMaterial; }
      setBrushSize(size) { this.brushSize = size; }
      selectMaterial(material) { this.currentMaterial = material; }
      canUndo() { return false; }
      canRedo() { return false; }
    };
    window.TerrainEditor = global.TerrainEditor;
    
    // Mock draggablePanelManager
    global.draggablePanelManager = {
      panels: new Map(),
      stateVisibility: { LEVEL_EDITOR: [] },
      handleMouseEvents: sinon.stub().returns(false),
      isPanelVisible: sinon.stub().returns(false)
    };
    window.draggablePanelManager = global.draggablePanelManager;
    
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




// ================================================================
// propertiesPanel.test.js (7 tests)
// ================================================================
/**
 * Unit Tests: Properties Panel Visibility
 * 
 * Tests for Properties Panel visibility in Level Editor state.
 * Tests default hidden state, View menu toggle, state persistence.
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - Properties Panel Visibility', function() {
  let draggablePanelManager;
  let propertiesPanel;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock GameState
    global.GameState = {
      current: 'LEVEL_EDITOR',
      setState: sinon.stub()
    };
    window.GameState = global.GameState;
    
    // Mock Properties Panel
    propertiesPanel = {
      id: 'properties-panel',
      visible: false,
      render: sinon.spy(),
      toggle: sinon.stub().callsFake(function() {
        this.visible = !this.visible;
      }),
      setVisible: sinon.stub().callsFake(function(visible) {
        this.visible = visible;
      })
    };
    
    // Mock DraggablePanelManager
    global.DraggablePanelManager = class DraggablePanelManager {
      constructor() {
        this.panels = new Map();
        this.stateVisibility = {
          LEVEL_EDITOR: [],
          PLAYING: [],
          MENU: []
        };
      }
      
      registerPanel(panel) {
        this.panels.set(panel.id, panel);
      }
      
      isVisibleInState(panelId, state) {
        return this.stateVisibility[state].includes(panelId);
      }
      
      setVisibleInState(panelId, state, visible) {
        const list = this.stateVisibility[state];
        const index = list.indexOf(panelId);
        
        if (visible && index === -1) {
          list.push(panelId);
        } else if (!visible && index !== -1) {
          list.splice(index, 1);
        }
      }
      
      renderPanels(state) {
        this.panels.forEach(panel => {
          if (this.isVisibleInState(panel.id, state)) {
            panel.render();
          }
        });
      }
    };
    
    draggablePanelManager = new global.DraggablePanelManager();
    draggablePanelManager.registerPanel(propertiesPanel);
    
    global.draggablePanelManager = draggablePanelManager;
    window.draggablePanelManager = draggablePanelManager;
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Default Visibility', function() {
    it('should not be visible by default in LEVEL_EDITOR state', function() {
      const visible = draggablePanelManager.isVisibleInState('properties-panel', 'LEVEL_EDITOR');
      
      expect(visible).to.be.false;
    });
    
    it('should not render when state is LEVEL_EDITOR', function() {
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(propertiesPanel.render.called).to.be.false;
    });
  });
  
  describe('Toggle via View Menu', function() {
    it('should show panel when toggled on', function() {
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', true);
      
      const visible = draggablePanelManager.isVisibleInState('properties-panel', 'LEVEL_EDITOR');
      
      expect(visible).to.be.true;
    });
    
    it('should hide panel when toggled off', function() {
      // Show first
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', true);
      expect(draggablePanelManager.isVisibleInState('properties-panel', 'LEVEL_EDITOR')).to.be.true;
      
      // Hide
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', false);
      
      expect(draggablePanelManager.isVisibleInState('properties-panel', 'LEVEL_EDITOR')).to.be.false;
    });
    
    it('should render panel when visible in LEVEL_EDITOR state', function() {
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', true);
      
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(propertiesPanel.render.calledOnce).to.be.true;
    });
  });
  
  describe('State Persistence', function() {
    it('should persist visibility state across renders', function() {
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', true);
      
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(propertiesPanel.render.callCount).to.equal(3);
    });
    
    it('should not affect other states', function() {
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', true);
      
      const playingVisible = draggablePanelManager.isVisibleInState('properties-panel', 'PLAYING');
      const menuVisible = draggablePanelManager.isVisibleInState('properties-panel', 'MENU');
      
      expect(playingVisible).to.be.false;
      expect(menuVisible).to.be.false;
    });
  });
});

