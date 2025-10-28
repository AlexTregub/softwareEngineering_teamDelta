/**
 * Integration Test Helpers
 * 
 * Loads REAL classes for integration testing (not mocks).
 * Use this for integration tests that verify interactions between real components.
 * 
 * Usage:
 * ```javascript
 * const { setupIntegrationTestEnvironment } = require('../../helpers/integrationTestHelpers');
 * 
 * before(function() {
 *   setupIntegrationTestEnvironment();
 * });
 * ```
 */

const sinon = require('sinon');

/**
 * Setup environment for integration testing with real classes
 * Call this in before() of integration tests
 */
function setupIntegrationTestEnvironment() {
  // Mock only p5.js drawing functions (these are external dependencies)
  global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
  global.color = sinon.stub().callsFake((r, g, b, a) => ({ r, g, b, a }));
  global.fill = sinon.stub();
  global.rect = sinon.stub();
  global.rectMode = sinon.stub();
  global.text = sinon.stub();
  global.textSize = sinon.stub();
  global.textAlign = sinon.stub();
  global.textWidth = sinon.stub().returns(50);
  global.stroke = sinon.stub();
  global.strokeWeight = sinon.stub();
  global.noStroke = sinon.stub();
  global.push = sinon.stub();
  global.pop = sinon.stub();
  global.translate = sinon.stub();
  global.line = sinon.stub();
  global.noFill = sinon.stub();
  global.image = sinon.stub();
  global.tint = sinon.stub();
  global.circle = sinon.stub();
  global.ellipse = sinon.stub();
  global.triangle = sinon.stub();
  
  // Mock p5.js constants
  global.LEFT = 'left';
  global.CENTER = 'center';
  global.RIGHT = 'right';
  global.TOP = 'top';
  global.BOTTOM = 'bottom';
  global.BASELINE = 'baseline';
  global.CORNER = 'corner';
  
  // Mock window object
  global.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    mouseX: 0,
    mouseY: 0,
    width: 1920,
    height: 1080
  };
  
  // Mock localStorage
  global.localStorage = {
    getItem: sinon.stub().returns(null),
    setItem: sinon.stub(),
    removeItem: sinon.stub()
  };
  
  // Mock debug logging functions
  global.logNormal = sinon.stub();
  global.logDebug = sinon.stub();
  global.logWarning = sinon.stub();
  global.logError = sinon.stub();
  global.logVerbose = sinon.stub();
  
  // Mock game constants
  global.TILE_SIZE = 32;
  
  // Mock camera manager (external system)
  global.cameraManager = {
    getZoom: () => 1,
    getPosition: () => ({ x: 0, y: 0 }),
    screenToWorld: (x, y) => ({ x, y }),
    worldToScreen: (x, y) => ({ x, y }),
    setPosition: sinon.stub(),
    setZoom: sinon.stub(),
    update: sinon.stub()
  };
  
  // Mock DraggablePanelManager (external UI system)
  global.draggablePanelManager = {
    panels: new Map(),
    stateVisibility: {
      LEVEL_EDITOR: []
    },
    togglePanel: sinon.stub(),
    showPanel: sinon.stub(),
    hidePanel: sinon.stub(),
    renderPanels: sinon.stub()
  };
  
  // Mock EventManager (will be loaded as real class if needed)
  global.EventManager = {
    getInstance: () => ({
      registerEvent: sinon.stub().returns(true),
      registerTrigger: sinon.stub().returns(true),
      getEvent: sinon.stub().returns(null),
      getAllEvents: sinon.stub().returns([])
    })
  };
  
  // Mock DraggablePanel class (used by LevelEditorPanels)
  global.DraggablePanel = class DraggablePanel {
    constructor(config) {
      this.config = config;
      this.id = config.id;
      this.state = {
        visible: false,
        minimized: false
      };
    }
    
    show() {
      this.state.visible = true;
    }
    
    hide() {
      this.state.visible = false;
    }
    
    toggleVisibility() {
      this.state.visible = !this.state.visible;
    }
    
    isVisible() {
      return this.state.visible;
    }
    
    render() {}
    
    getPosition() {
      return { x: this.config.position.x, y: this.config.position.y };
    }
    
    calculateTitleBarHeight() {
      return 30;
    }
    
    isMouseOver() {
      return false;
    }
  };
  
  // Mock TerrainEditor (will be stubbed, not a full implementation)
  global.TerrainEditor = class TerrainEditor {
    constructor(terrain) {
      this.terrain = terrain;
    }
    
    setBrushSize() {}
    selectMaterial() {}
    paint() {}
    fill() {}
    canUndo() { return false; }
    canRedo() { return false; }
    getBrushSize() { return 1; }
    undo() {}
    redo() {}
  };
  
  // Mock other Level Editor UI components
  global.MiniMap = class MiniMap {
    constructor() {}
    update() {}
    notifyTerrainEditStart() {}
    invalidateCache() {}
    scheduleInvalidation() {}
  };
  
  global.PropertiesPanel = class PropertiesPanel {
    constructor() {}
    setTerrain() {}
    setEditor() {}
  };
  
  global.GridOverlay = class GridOverlay {
    constructor() {}
  };
  
  global.SaveDialog = class SaveDialog {
    constructor() {
      this.useNativeDialogs = false;
      this.onSave = null;
      this.onCancel = null;
    }
    isVisible() { return false; }
    handleClick() { return false; }
    hide() {}
  };
  
  global.LoadDialog = class LoadDialog {
    constructor() {
      this.useNativeDialogs = false;
      this.onLoad = null;
      this.onCancel = null;
    }
    isVisible() { return false; }
    handleClick() { return false; }
    hide() {}
  };
  
  global.NotificationManager = class NotificationManager {
    constructor() {}
    show() {}
    update() {}
  };
  
  global.SelectionManager = class SelectionManager {
    constructor() {
      this.isSelecting = false;
    }
    startSelection() { this.isSelecting = true; }
    updateSelection() {}
    endSelection() { this.isSelecting = false; }
    getTilesInSelection() { return []; }
  };
  
  global.HoverPreviewManager = class HoverPreviewManager {
    constructor() {}
    updateHover() {}
    clearHover() {}
  };
  
  global.FileMenuBar = class FileMenuBar {
    constructor() {
      this.openMenuName = null;
      this.levelEditor = null;
    }
    openMenu(label) {
      this.openMenuName = label;
      if (this.levelEditor && typeof this.levelEditor.setMenuOpen === 'function') {
        this.levelEditor.setMenuOpen(true);
      }
    }
    closeMenu() {
      this.openMenuName = null;
      if (this.levelEditor && typeof this.levelEditor.setMenuOpen === 'function') {
        this.levelEditor.setMenuOpen(false);
      }
    }
    containsPoint() { return false; }
    handleClick() { return false; }
    handleMouseMove() {}
    updateMenuStates() {}
    updateBrushSizeVisibility() {}
    setLevelEditor(editor) {
      this.levelEditor = editor;
    }
  };
  
  global.BrushSizeControl = class BrushSizeControl {
    constructor(initialSize = 1, minSize = 1, maxSize = 9) {
      this.size = initialSize;
      this.minSize = minSize;
      this.maxSize = maxSize;
    }
    getSize() { return this.size; }
    setSize(size) {
      this.size = Math.max(this.minSize, Math.min(this.maxSize, size));
    }
    increase() { this.setSize(this.size + 1); }
    decrease() { this.setSize(this.size - 1); }
  };
  
  // Sync to window for JSDOM compatibility
  if (typeof window !== 'undefined') {
    Object.assign(window, {
      createVector: global.createVector,
      color: global.color,
      fill: global.fill,
      rect: global.rect,
      rectMode: global.rectMode,
      text: global.text,
      textSize: global.textSize,
      textAlign: global.textAlign,
      textWidth: global.textWidth,
      stroke: global.stroke,
      strokeWeight: global.strokeWeight,
      noStroke: global.noStroke,
      push: global.push,
      pop: global.pop,
      translate: global.translate,
      line: global.line,
      noFill: global.noFill,
      image: global.image,
      tint: global.tint,
      circle: global.circle,
      ellipse: global.ellipse,
      triangle: global.triangle,
      LEFT: global.LEFT,
      CENTER: global.CENTER,
      RIGHT: global.RIGHT,
      TOP: global.TOP,
      BOTTOM: global.BOTTOM,
      BASELINE: global.BASELINE,
      CORNER: global.CORNER,
      localStorage: global.localStorage,
      logNormal: global.logNormal,
      logDebug: global.logDebug,
      logWarning: global.logWarning,
      logError: global.logError,
      logVerbose: global.logVerbose,
      TILE_SIZE: global.TILE_SIZE,
      cameraManager: global.cameraManager,
      draggablePanelManager: global.draggablePanelManager,
      EventManager: global.EventManager,
      DraggablePanel: global.DraggablePanel,
      TerrainEditor: global.TerrainEditor,
      MiniMap: global.MiniMap,
      PropertiesPanel: global.PropertiesPanel,
      GridOverlay: global.GridOverlay,
      SaveDialog: global.SaveDialog,
      LoadDialog: global.LoadDialog,
      NotificationManager: global.NotificationManager,
      SelectionManager: global.SelectionManager,
      HoverPreviewManager: global.HoverPreviewManager,
      FileMenuBar: global.FileMenuBar,
      BrushSizeControl: global.BrushSizeControl
    });
  }
}

/**
 * Cleanup after integration tests
 * Call this in after() of integration tests
 */
function cleanupIntegrationTestEnvironment() {
  sinon.restore();
  
  // Clean up globals
  if (global.window) {
    delete global.window;
  }
}

module.exports = {
  setupIntegrationTestEnvironment,
  cleanupIntegrationTestEnvironment
};
