/**
 * Unit Tests: Dialog Blocking (Bug Fix 6)
 * 
 * Tests that save/load dialogs block terrain painting when visible.
 * 
 * TDD: Write FIRST, then fix bug
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

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
      
      convertScreenToWorld: function(screenX, screenY) {
        return { worldX: screenX, worldY: screenY };
      }
    };
    
    // Load actual handleClick implementation
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    editor.handleClick = LevelEditor.prototype.handleClick;
    editor.handleDrag = LevelEditor.prototype.handleDrag;
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
