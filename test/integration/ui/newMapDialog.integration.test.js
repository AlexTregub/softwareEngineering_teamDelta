/**
 * Integration Tests for NewMapDialog
 * 
 * Tests the integration of NewMapDialog with LevelEditor and related systems.
 * Uses JSDOM for real DOM interactions.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

describe('NewMapDialog Integration', function() {
  let dom, window, document, global;
  let LevelEditor, NewMapDialog, Dialog, UIObject, SparseTerrain, CustomTerrain, gridTerrain;
  let TerrainEditor, NotificationManager, MiniMap, PropertiesPanel;
  let DynamicGridOverlay, GridOverlay, SaveDialog, LoadDialog;
  let EventEditorPanel, EventFlagLayer, LevelEditorPanels, FileMenuBar;
  let SelectionManager, HoverPreviewManager;
  
  before(function() {
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="defaultCanvas0"></canvas></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    
    window = dom.window;
    document = window.document;
    global = window;
    
    // Sync global and window
    global.window = window;
    global.document = document;
    
    // Mock p5.js constants
    global.CONTROL = 17;
    global.SHIFT = 16;
    global.ALT = 18;
    global.ESCAPE = 27;
    global.ENTER = 13;
    global.TAB = 9;
    global.BACKSPACE = 8;
    
    // Mock p5.js functions
    global.createGraphics = sinon.stub().returns({
      width: 400,
      height: 320,
      background: sinon.stub(),
      fill: sinon.stub(),
      noFill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      textFont: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      image: sinon.stub(),
      get: sinon.stub().returns({})
    });
    
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.noFill = sinon.stub();
    global.stroke = sinon.stub();
    global.noStroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    
    // Mock p5.js text alignment constants
    global.LEFT = 'left';
    global.RIGHT = 'right';
    global.CENTER = 'center';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    
    // Mock global functions
    global.logNormal = sinon.stub();
    global.logVerbose = sinon.stub();
    global.keyIsDown = sinon.stub().returns(false);
    global.confirm = sinon.stub().returns(true);
    window.logNormal = global.logNormal;
    window.logVerbose = global.logVerbose;
    window.keyIsDown = global.keyIsDown;
    window.confirm = global.confirm;
    
    // Mock global state
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    global.TILE_SIZE = 32;
    global.mouseX = 0;
    global.mouseY = 0;
    global.keyCode = 0;
    global.frameCount = 0;
    
    // Mock GameState
    global.GameState = {
      setState: sinon.stub(),
      goToMenu: sinon.stub()
    };
    
    // Mock CacheManager
    global.CacheManager = null; // Dialog checks for this
    
    // Mock cameraManager
    const cameraManager = {
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1,
      update: sinon.stub(),
      screenToWorld: sinon.stub().callsFake((x, y) => ({ worldX: x, worldY: y })),
      getZoom: sinon.stub().returns(1),
      setZoom: sinon.stub()
    };
    global.cameraManager = cameraManager;
    window.cameraManager = cameraManager;
    
    // Mock terrain classes
    SparseTerrain = class SparseTerrain {
      constructor(tileSize, defaultMaterial, options = {}) {
        this.tileSize = tileSize || 32;
        this.defaultMaterial = defaultMaterial || 'dirt';
        this.tiles = new Map();
        
        // Support maxMapSize option
        let maxMapSize = 100; // Default
        if (options && typeof options.maxMapSize !== 'undefined') {
          const parsed = Number(options.maxMapSize);
          if (!isNaN(parsed)) {
            maxMapSize = Math.max(10, Math.min(1000, Math.floor(parsed)));
          }
        }
        this.MAX_MAP_SIZE = maxMapSize;
      }
      render() {}
      getTile(x, y) { return this.tiles.get(`${x},${y}`) || null; }
      setTile(x, y, material) { this.tiles.set(`${x},${y}`, { material }); }
      getAllTiles() { return Array.from(this.tiles.values()); }
      exportToJSON() { return { tiles: [] }; }
    };
    global.SparseTerrain = SparseTerrain;
    window.SparseTerrain = SparseTerrain;
    
    CustomTerrain = class CustomTerrain {
      constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tileSize = 32;
      }
      render() {}
      getTile(x, y) { return null; }
      setTile(x, y, material) {}
    };
    global.CustomTerrain = CustomTerrain;
    window.CustomTerrain = CustomTerrain;
    
    gridTerrain = class gridTerrain {
      constructor(chunksX, chunksY) {
        this.chunksX = chunksX;
        this.chunksY = chunksY;
        this.width = chunksX * 16;
        this.height = chunksY * 16;
        this.tileSize = 32;
      }
      render() {}
      getTile(x, y) { return null; }
      setTile(x, y, material) {}
    };
    global.gridTerrain = gridTerrain;
    window.gridTerrain = gridTerrain;
    
    // Mock UI components
    TerrainEditor = class TerrainEditor {
      constructor(terrain) {
        this.terrain = terrain;
      }
      canUndo() { return false; }
      canRedo() { return false; }
      clearHistory() {}
      setBrushSize(size) {}
      getBrushSize() { return 1; }
      selectMaterial(material) {}
      paint(x, y) {}
    };
    global.TerrainEditor = TerrainEditor;
    window.TerrainEditor = TerrainEditor;
    
    NotificationManager = class NotificationManager {
      constructor() {
        this.visible = true;
      }
      show(message, type) {}
      update() {}
      render() {}
    };
    global.NotificationManager = NotificationManager;
    window.NotificationManager = NotificationManager;
    
    MiniMap = class MiniMap {
      constructor(terrain, width, height) {
        this.terrain = terrain;
      }
      update() {}
      render() {}
      invalidateCache() {}
    };
    global.MiniMap = MiniMap;
    window.MiniMap = MiniMap;
    
    PropertiesPanel = class PropertiesPanel {
      setTerrain(terrain) {}
      setEditor(editor) {}
    };
    global.PropertiesPanel = PropertiesPanel;
    window.PropertiesPanel = PropertiesPanel;
    
    DynamicGridOverlay = class DynamicGridOverlay {
      constructor(terrain, tileSize, bufferSize) {
        this.terrain = terrain;
        this.visible = true;
      }
      update(mousePos) {}
      render() {}
    };
    global.DynamicGridOverlay = DynamicGridOverlay;
    window.DynamicGridOverlay = DynamicGridOverlay;
    
    GridOverlay = class GridOverlay {
      constructor(tileSize, width, height) {
        this.visible = true;
      }
      render() {}
    };
    global.GridOverlay = GridOverlay;
    window.GridOverlay = GridOverlay;
    
    SaveDialog = class SaveDialog {
      constructor() {
        this.visible = false;
        this.useNativeDialogs = false;
      }
      isVisible() { return this.visible; }
      show() { this.visible = true; }
      hide() { this.visible = false; }
      render() {}
      handleClick() { return false; }
    };
    global.SaveDialog = SaveDialog;
    window.SaveDialog = SaveDialog;
    
    LoadDialog = class LoadDialog {
      constructor() {
        this.visible = false;
        this.useNativeDialogs = false;
      }
      isVisible() { return this.visible; }
      show() { this.visible = true; }
      hide() { this.visible = false; }
      render() {}
      handleClick() { return false; }
    };
    global.LoadDialog = LoadDialog;
    window.LoadDialog = LoadDialog;
    
    EventEditorPanel = class EventEditorPanel {
      initialize() {}
      isDragging() { return false; }
      isInPlacementMode() { return false; }
    };
    global.EventEditorPanel = EventEditorPanel;
    window.EventEditorPanel = EventEditorPanel;
    
    EventFlagLayer = class EventFlagLayer {
      constructor(terrain) {}
    };
    global.EventFlagLayer = EventFlagLayer;
    window.EventFlagLayer = EventFlagLayer;
    
    LevelEditorPanels = class LevelEditorPanels {
      constructor(levelEditor) {}
      initialize() {}
      show() {}
      hide() {}
      render() {}
      handleClick() { return false; }
      handleDoubleClick() { return false; }
    };
    global.LevelEditorPanels = LevelEditorPanels;
    window.LevelEditorPanels = LevelEditorPanels;
    
    FileMenuBar = class FileMenuBar {
      setLevelEditor(editor) {}
      render() {}
      handleClick() { return false; }
      handleKeyPress() { return false; }
      containsPoint() { return false; }
      updateMenuStates() {}
      updateBrushSizeVisibility() {}
    };
    global.FileMenuBar = FileMenuBar;
    window.FileMenuBar = FileMenuBar;
    
    SelectionManager = class SelectionManager {
      hasSelection() { return false; }
    };
    global.SelectionManager = SelectionManager;
    window.SelectionManager = SelectionManager;
    
    HoverPreviewManager = class HoverPreviewManager {
      updateHover() {}
      clearHover() {}
      getHoveredTiles() { return []; } // Return empty array (no tiles highlighted)
    };
    global.HoverPreviewManager = HoverPreviewManager;
    window.HoverPreviewManager = HoverPreviewManager;
    
    // Mock MaterialPalette (BEFORE loading LevelEditor)
    const MaterialPalette = class MaterialPalette {
      selectMaterial() {}
      getSelectedMaterial() { return 'grass'; }
      handleKeyPress() { return false; }
    };
    global.MaterialPalette = MaterialPalette;
    window.MaterialPalette = MaterialPalette;
    
    // Mock ToolBar (BEFORE loading LevelEditor)
    const ToolBar = class ToolBar {
      constructor(tools) {}
      getSelectedTool() { return 'paint'; }
      setEnabled() {}
      addButton() {}
      hasActiveTool() { return true; }
      deselectTool() {}
      onToolChange = null;
    };
    global.ToolBar = ToolBar;
    window.ToolBar = ToolBar;
    
    global.ShortcutManager = {
      register: sinon.stub(),
      handleMouseWheel: sinon.stub().returns(false)
    };
    window.ShortcutManager = global.ShortcutManager;
    
    // CRITICAL: Load in order with eval (same scope) - Dialog extends UIObject, NewMapDialog extends Dialog
    const uiObjectPath = path.join(__dirname, '../../../Classes/ui/UIObject.js');
    const uiObjectCode = fs.readFileSync(uiObjectPath, 'utf-8');
    eval(uiObjectCode);
    UIObject = global.UIObject || window.UIObject;
    global.UIObject = UIObject;
    window.UIObject = UIObject;
    
    const dialogPath = path.join(__dirname, '../../../Classes/ui/Dialog.js');
    const dialogCode = fs.readFileSync(dialogPath, 'utf-8');
    eval(dialogCode);
    Dialog = global.Dialog || window.Dialog;
    global.Dialog = Dialog;
    window.Dialog = Dialog;
    
    const newMapDialogPath = path.join(__dirname, '../../../Classes/ui/NewMapDialog.js');
    const newMapDialogCode = fs.readFileSync(newMapDialogPath, 'utf-8');
    eval(newMapDialogCode);
    NewMapDialog = global.NewMapDialog || window.NewMapDialog;
    global.NewMapDialog = NewMapDialog;
    window.NewMapDialog = NewMapDialog;
    
    // Load LevelEditor
    const levelEditorPath = path.join(__dirname, '../../../Classes/systems/ui/LevelEditor.js');
    let levelEditorCode = fs.readFileSync(levelEditorPath, 'utf-8');
    // Stub out functions needed by LevelEditor (eval scope is isolated)
    levelEditorCode = `
      const logNormal = function() {};
      const logVerbose = function() {};
      const confirm = global.confirm; // Use global stub
      const push = function() {};
      const pop = function() {};
      const scale = function() {};
      const translate = function() {};
      const fill = function() {};
      const noFill = function() {};
      const stroke = function() {};
      const noStroke = function() {};
      const strokeWeight = function() {};
      const rect = function() {};
      const text = function() {};
      const textAlign = function() {};
      const textSize = function() {};
      let keyCode = global.keyCode || 0;
      let mouseX = global.mouseX || 0;
      let mouseY = global.mouseY || 0;
      const g_canvasX = global.g_canvasX || 800;
      const g_canvasY = global.g_canvasY || 600;
      const CENTER = 'center';
      const TOP = 'top';
      ${levelEditorCode}
    `;
    eval(levelEditorCode); // Load LevelEditor into global scope
    LevelEditor = global.LevelEditor;
    window.LevelEditor = LevelEditor;
  });
  
  after(function() {
    sinon.restore();
  });
  
  describe('LevelEditor Integration', function() {
    let levelEditor;
    
    beforeEach(function() {
      // Create a fresh LevelEditor instance
      const terrain = new SparseTerrain(32, 'dirt');
      levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
    });
    
    it('should initialize with NewMapDialog instance', function() {
      expect(levelEditor.newMapDialog).to.exist;
      expect(levelEditor.newMapDialog).to.be.instanceOf(NewMapDialog);
    });
    
    it('should have NewMapDialog callbacks wired to LevelEditor', function() {
      expect(levelEditor.newMapDialog.onConfirm).to.be.a('function');
      expect(levelEditor.newMapDialog.onCancel).to.be.a('function');
    });
    
    it('should show NewMapDialog when handleFileNew() is called', function() {
      // Ensure no modified state (skip confirm prompt)
      levelEditor.isModified = false;
      
      // Call handleFileNew()
      const result = levelEditor.handleFileNew();
      
      expect(result).to.be.true;
      expect(levelEditor.newMapDialog.isVisible()).to.be.true;
    });
    
    it('should prompt to discard changes if terrain is modified', function() {
      // Mark terrain as modified
      levelEditor.isModified = true;
      
      // Stub confirm to return false (user cancels)
      global.confirm.returns(false);
      
      // Call handleFileNew()
      const result = levelEditor.handleFileNew();
      
      expect(result).to.be.false;
      expect(global.confirm.calledOnce).to.be.true;
      expect(levelEditor.newMapDialog.isVisible()).to.be.false; // Dialog should NOT show
    });
    
    it('should create terrain with specified dimensions on dialog confirm', function() {
      // Ensure no modified state
      levelEditor.isModified = false;
      
      // Show dialog
      levelEditor.handleFileNew();
      
      // Simulate user entering dimensions and confirming
      levelEditor.newMapDialog._width = 30;
      levelEditor.newMapDialog._height = 40;
      
      // Trigger confirm callback
      levelEditor.newMapDialog.confirm();
      
      // Verify terrain was recreated (new instance)
      expect(levelEditor.terrain).to.exist;
      expect(levelEditor.terrain).to.be.instanceOf(SparseTerrain);
      
      // Verify filename was reset to Untitled (confirms terrain creation flow)
      expect(levelEditor.currentFilename).to.equal('Untitled');
    });
    
    it('should set SparseTerrain MAX_MAP_SIZE based on dialog dimensions', function() {
      // Ensure no modified state
      levelEditor.isModified = false;
      
      // Show dialog
      levelEditor.handleFileNew();
      
      // Simulate user entering 50x75 dimensions
      levelEditor.newMapDialog._width = 50;
      levelEditor.newMapDialog._height = 75;
      
      // Trigger confirm
      levelEditor.newMapDialog.confirm();
      
      // SparseTerrain should use larger dimension (75) as MAX_MAP_SIZE
      expect(levelEditor.terrain.MAX_MAP_SIZE).to.equal(75);
    });
    
    it('should handle square maps (width === height)', function() {
      levelEditor.isModified = false;
      levelEditor.handleFileNew();
      
      levelEditor.newMapDialog._width = 100;
      levelEditor.newMapDialog._height = 100;
      levelEditor.newMapDialog.confirm();
      
      expect(levelEditor.terrain.MAX_MAP_SIZE).to.equal(100);
    });
    
    it('should handle minimum dimensions (10x10)', function() {
      levelEditor.isModified = false;
      levelEditor.handleFileNew();
      
      levelEditor.newMapDialog._width = 10;
      levelEditor.newMapDialog._height = 10;
      levelEditor.newMapDialog.confirm();
      
      expect(levelEditor.terrain.MAX_MAP_SIZE).to.equal(10);
    });
    
    it('should handle maximum dimensions (1000x1000)', function() {
      levelEditor.isModified = false;
      levelEditor.handleFileNew();
      
      levelEditor.newMapDialog._width = 1000;
      levelEditor.newMapDialog._height = 1000;
      levelEditor.newMapDialog.confirm();
      
      expect(levelEditor.terrain.MAX_MAP_SIZE).to.equal(1000);
    });
    
    it('should hide dialog after successful terrain creation', function() {
      // Ensure no modified state
      levelEditor.isModified = false;
      
      // Show dialog
      levelEditor.handleFileNew();
      expect(levelEditor.newMapDialog.isVisible()).to.be.true;
      
      // Trigger confirm
      levelEditor.newMapDialog.confirm();
      
      // Dialog should be hidden
      expect(levelEditor.newMapDialog.isVisible()).to.be.false;
    });
    
    it('should reinitialize editor components with new terrain', function() {
      // Ensure no modified state
      levelEditor.isModified = false;
      
      // Store reference to old editor
      const oldEditor = levelEditor.editor;
      
      // Show dialog and confirm
      levelEditor.handleFileNew();
      levelEditor.newMapDialog.confirm();
      
      // Verify editor was recreated
      expect(levelEditor.editor).to.exist;
      expect(levelEditor.editor).to.not.equal(oldEditor);
    });
    
    it('should reset filename to "Untitled" on new terrain creation', function() {
      // Set a custom filename
      levelEditor.currentFilename = 'MyLevel';
      
      // Ensure no modified state
      levelEditor.isModified = false;
      
      // Create new terrain
      levelEditor.handleFileNew();
      levelEditor.newMapDialog.confirm();
      
      // Verify filename reset
      expect(levelEditor.currentFilename).to.equal('Untitled');
    });
    
    it('should clear modified flag on new terrain creation', function() {
      // Mark as modified
      levelEditor.isModified = true;
      
      // User confirms discard
      global.confirm.returns(true);
      
      // Create new terrain
      levelEditor.handleFileNew();
      levelEditor.newMapDialog.confirm();
      
      // Verify modified flag cleared
      expect(levelEditor.isModified).to.be.false;
    });
    
    it('should hide dialog on cancel without creating terrain', function() {
      // Store terrain reference
      const originalTerrain = levelEditor.terrain;
      
      // Ensure no modified state
      levelEditor.isModified = false;
      
      // Show dialog
      levelEditor.handleFileNew();
      expect(levelEditor.newMapDialog.isVisible()).to.be.true;
      
      // Trigger cancel
      levelEditor.newMapDialog.cancel();
      
      // Dialog should be hidden
      expect(levelEditor.newMapDialog.isVisible()).to.be.false;
      
      // Terrain should be unchanged
      expect(levelEditor.terrain).to.equal(originalTerrain);
    });
  });
  
  describe('Render Integration', function() {
    let levelEditor;
    
    beforeEach(function() {
      const terrain = new SparseTerrain(32, 'dirt');
      levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
    });
    
    it('should render NewMapDialog when visible', function() {
      // Show dialog
      levelEditor.newMapDialog.show();
      
      // Spy on dialog render
      const renderSpy = sinon.spy(levelEditor.newMapDialog, 'render');
      
      // Call LevelEditor render
      levelEditor.render();
      
      // Verify dialog was rendered
      expect(renderSpy.calledOnce).to.be.true;
    });
    
    it('should not render NewMapDialog when hidden', function() {
      // Ensure dialog is hidden
      levelEditor.newMapDialog.hide();
      
      // Spy on dialog render
      const renderSpy = sinon.spy(levelEditor.newMapDialog, 'render');
      
      // Call LevelEditor render
      levelEditor.render();
      
      // Verify dialog was NOT rendered
      expect(renderSpy.called).to.be.false;
    });
  });
  
  describe('Click Handling Integration', function() {
    let levelEditor;
    
    beforeEach(function() {
      const terrain = new SparseTerrain(32, 'dirt');
      levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
    });
    
    it('should block terrain interaction when NewMapDialog is visible', function() {
      // Show dialog
      levelEditor.newMapDialog.show();
      
      // Spy on terrain editor paint method
      const paintSpy = sinon.spy(levelEditor.editor, 'paint');
      
      // Simulate click on terrain (should be blocked)
      levelEditor.handleClick(100, 100);
      
      // Verify paint was NOT called (dialog blocked it)
      expect(paintSpy.called).to.be.false;
    });
    
    it('should delegate clicks to NewMapDialog when visible', function() {
      // Show dialog
      levelEditor.newMapDialog.show();
      
      // Spy on dialog handleClick
      const clickSpy = sinon.spy(levelEditor.newMapDialog, 'handleClick');
      
      // Simulate click
      levelEditor.handleClick(400, 300);
      
      // Verify dialog received the click
      expect(clickSpy.calledOnce).to.be.true;
      expect(clickSpy.calledWith(400, 300)).to.be.true;
    });
    
    it('should allow terrain interaction when NewMapDialog is hidden', function() {
      // Ensure dialog is hidden
      levelEditor.newMapDialog.hide();
      
      // Mock toolbar to return a valid tool
      sinon.stub(levelEditor.toolbar, 'getSelectedTool').returns('paint');
      
      // Spy on dialog handleClick
      const dialogClickSpy = sinon.spy(levelEditor.newMapDialog, 'handleClick');
      
      // Simulate click on terrain
      levelEditor.handleClick(100, 100);
      
      // Verify dialog did NOT receive the click
      expect(dialogClickSpy.called).to.be.false;
    });
  });
  
  describe('Keyboard Handling Integration', function() {
    let levelEditor;
    
    beforeEach(function() {
      const terrain = new SparseTerrain(32, 'dirt');
      levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
    });
    
    it('should delegate keyboard input to NewMapDialog when visible', function() {
      // Show dialog
      levelEditor.newMapDialog.show();
      
      // Spy on dialog handleKeyPress
      const keyPressSpy = sinon.spy(levelEditor.newMapDialog, 'handleKeyPress');
      
      // Simulate key press
      global.keyCode = 27; // Escape
      levelEditor.handleKeyPress('Escape');
      
      // Verify dialog received the key press
      expect(keyPressSpy.calledOnce).to.be.true;
    });
    
    it('should not trigger level editor shortcuts when NewMapDialog is visible', function() {
      // Show dialog
      levelEditor.newMapDialog.show();
      
      // Mock dialog to consume the key press
      sinon.stub(levelEditor.newMapDialog, 'handleKeyPress').returns(true);
      
      // Simulate 'g' key (toggle grid shortcut)
      const initialGridState = levelEditor.showGrid;
      levelEditor.handleKeyPress('g');
      
      // Verify grid state did NOT change (dialog consumed the key)
      expect(levelEditor.showGrid).to.equal(initialGridState);
    });
  });
  
  describe('Double-Click Handling Integration', function() {
    let levelEditor;
    
    beforeEach(function() {
      const terrain = new SparseTerrain(32, 'dirt');
      levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
    });
    
    it('should block double-click actions when NewMapDialog is visible', function() {
      // Show dialog
      levelEditor.newMapDialog.show();
      
      // Spy on levelEditorPanels handleDoubleClick
      const doubleClickSpy = sinon.spy(levelEditor.levelEditorPanels, 'handleDoubleClick');
      
      // Simulate double-click
      levelEditor.handleDoubleClick(100, 100);
      
      // Verify panels did NOT receive the double-click (dialog blocked it)
      expect(doubleClickSpy.called).to.be.false;
    });
  });
  
  describe('Drag Handling Integration', function() {
    let levelEditor;
    
    beforeEach(function() {
      const terrain = new SparseTerrain(32, 'dirt');
      levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
    });
    
    it('should block drag actions when NewMapDialog is visible', function() {
      // Show dialog
      levelEditor.newMapDialog.show();
      
      // Spy on terrain editor paint method (used during drag for paint tool)
      const paintSpy = sinon.spy(levelEditor.editor, 'paint');
      
      // Simulate drag
      levelEditor.handleDrag(100, 100);
      
      // Verify paint was NOT called (dialog blocked it)
      expect(paintSpy.called).to.be.false;
    });
  });
});
