/**
 * UI Test Helpers
 * 
 * Shared mock setup for UI component tests that need p5.js and window globals.
 * Import this file in your test's beforeEach() to avoid repetitive mock setup.
 * 
 * Usage:
 * ```javascript
 * const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');
 * 
 * beforeEach(function() {
 *   setupUITestEnvironment();
 * });
 * 
 * afterEach(function() {
 *   cleanupUITestEnvironment();
 * });
 * ```
 */

const sinon = require('sinon');

/**
 * Setup all required mocks for UI component testing
 * Call this in beforeEach() of UI tests
 */
function setupUITestEnvironment() {
  // Mock window object (needed for drag constraints and other browser APIs)
  global.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    mouseX: 0,
    mouseY: 0,
    width: 1920,
    height: 1080
  };
  
  // Mock p5.js drawing functions
  global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
  global.fill = sinon.stub();
  global.rect = sinon.stub();
  global.text = sinon.stub();
  global.textSize = sinon.stub();
  global.textAlign = sinon.stub();
  global.textWidth = sinon.stub().returns(50); // Return default width for text
  global.stroke = sinon.stub();
  global.strokeWeight = sinon.stub();
  global.noStroke = sinon.stub();
  global.push = sinon.stub();
  global.pop = sinon.stub();
  global.translate = sinon.stub();
  global.line = sinon.stub();
  global.noFill = sinon.stub();
  global.image = sinon.stub(); // For rendering terrain textures
  global.tint = sinon.stub(); // For image color tinting
  
  // Mock UI globals
  global.devConsoleEnabled = false;
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
  
  // Mock p5.js text alignment constants
  global.LEFT = 'left';
  global.CENTER = 'center';
  global.RIGHT = 'right';
  global.TOP = 'top';
  global.BOTTOM = 'bottom';
  global.BASELINE = 'baseline';
  
  // Mock ButtonStyles
  global.ButtonStyles = {
    SUCCESS: { bg: [0, 255, 0], fg: [255, 255, 255] },
    DANGER: { bg: [255, 0, 0], fg: [255, 255, 255] },
    WARNING: { bg: [255, 255, 0], fg: [0, 0, 0] }
  };
  
  // Mock Button class
  global.Button = class Button {
    constructor(config) {
      this.x = config.x || 0;
      this.y = config.y || 0;
      this.width = config.width || 50;
      this.height = config.height || 20;
      this.label = config.label || '';
      this.onClick = config.onClick || (() => {});
    }
    
    render() {}
    
    setPosition(x, y) {
      this.x = x;
      this.y = y;
    }
    
    update(mouseX, mouseY, mousePressed) {
      const mouseOver = mouseX >= this.x && mouseX <= this.x + this.width &&
                       mouseY >= this.y && mouseY <= this.y + this.height;
      if (mouseOver && mousePressed) {
        this.onClick();
        return true;
      }
      return false;
    }
    
    isMouseOver(mx, my) {
      return mx >= this.x && mx <= this.x + this.width &&
             my >= this.y && my <= this.y + this.height;
    }
  };
  
  // Mock Level Editor UI classes
  global.TerrainEditor = class TerrainEditor {
    constructor() {
      this.setBrushSize = sinon.stub();
      this.selectMaterial = sinon.stub();
      this.paint = sinon.stub();
      this.fill = sinon.stub();
      this.canUndo = sinon.stub().returns(false);
      this.canRedo = sinon.stub().returns(false);
      this.getBrushSize = sinon.stub().returns(1);
    }
  };
  
  global.MaterialPalette = class MaterialPalette {
    constructor() {
      this.selectedMaterial = 'grass';
    }
    selectMaterial(material) {
      this.selectedMaterial = material;
    }
    getSelectedMaterial() {
      return this.selectedMaterial;
    }
  };
  
  global.ToolBar = class ToolBar {
    constructor() {
      this.onToolChange = null;
      this.selectedTool = 'paint';
    }
    selectTool(tool) {
      this.selectedTool = tool;
      if (this.onToolChange) {
        this.onToolChange(tool);
      }
    }
    getSelectedTool() {
      return this.selectedTool;
    }
    setEnabled() {}
  };
  
  global.BrushSizeControl = class BrushSizeControl {
    constructor(initialSize = 1, minSize = 1, maxSize = 9) {
      this.size = initialSize;
      this.minSize = minSize;
      this.maxSize = maxSize;
    }
    getSize() {
      return this.size;
    }
    setSize(size) {
      this.size = Math.max(this.minSize, Math.min(this.maxSize, size));
    }
    increase() {
      this.setSize(this.size + 1);
    }
    decrease() {
      this.setSize(this.size - 1);
    }
  };
  
  global.EventEditorPanel = class EventEditorPanel {
    constructor() {}
    initialize() {}
  };
  
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
    }
    isVisible() {
      return false;
    }
    handleClick() {
      return false;
    }
  };
  
  global.LoadDialog = class LoadDialog {
    constructor() {
      this.useNativeDialogs = false;
    }
    isVisible() {
      return false;
    }
    handleClick() {
      return false;
    }
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
    startSelection() {
      this.isSelecting = true;
    }
    updateSelection() {}
    endSelection() {
      this.isSelecting = false;
    }
    getTilesInSelection() {
      return [];
    }
  };
  
  global.HoverPreviewManager = class HoverPreviewManager {
    constructor() {}
    updateHover() {}
    clearHover() {}
  };
  
  global.FileMenuBar = class FileMenuBar {
    constructor() {
      this.openMenuName = null;
    }
    openMenu(label) {
      this.openMenuName = label;
      // Notify LevelEditor if connected
      if (this.levelEditor && typeof this.levelEditor.setMenuOpen === 'function') {
        this.levelEditor.setMenuOpen(true);
      }
    }
    closeMenu() {
      this.openMenuName = null;
      // Notify LevelEditor if connected
      if (this.levelEditor && typeof this.levelEditor.setMenuOpen === 'function') {
        this.levelEditor.setMenuOpen(false);
      }
    }
    containsPoint() {
      return false;
    }
    handleClick() {
      return false;
    }
    handleMouseMove() {}
    updateMenuStates() {}
    updateBrushSizeVisibility() {}
    setLevelEditor(editor) {
      this.levelEditor = editor;
    }
  };
  
  global.LevelEditorPanels = class LevelEditorPanels {
    static initialize() {}
    initialize() {}
    handleClick() {
      return false; // Not consumed
    }
  };
  
  // Mock camera manager
  global.cameraManager = {
    getZoom: () => 1,
    getPosition: () => ({ x: 0, y: 0 }),
    screenToWorld: (x, y) => ({ x, y }),
    worldToScreen: (x, y) => ({ x, y }),
    setPosition: sinon.stub(),
    setZoom: sinon.stub(),
    update: sinon.stub()
  };
  
  // Mock constants
  global.TILE_SIZE = 32;
  
  // Sync to window object for JSDOM compatibility
  if (typeof window !== 'undefined') {
    Object.assign(window, {
      createVector: global.createVector,
      fill: global.fill,
      rect: global.rect,
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
      devConsoleEnabled: global.devConsoleEnabled,
      localStorage: global.localStorage,
      LEFT: global.LEFT,
      CENTER: global.CENTER,
      RIGHT: global.RIGHT,
      TOP: global.TOP,
      BOTTOM: global.BOTTOM,
      BASELINE: global.BASELINE,
      ButtonStyles: global.ButtonStyles,
      Button: global.Button,
      TerrainEditor: global.TerrainEditor,
      MaterialPalette: global.MaterialPalette,
      ToolBar: global.ToolBar,
      BrushSizeControl: global.BrushSizeControl,
      EventEditorPanel: global.EventEditorPanel,
      MiniMap: global.MiniMap,
      PropertiesPanel: global.PropertiesPanel,
      GridOverlay: global.GridOverlay,
      SaveDialog: global.SaveDialog,
      LoadDialog: global.LoadDialog,
      NotificationManager: global.NotificationManager,
      SelectionManager: global.SelectionManager,
      HoverPreviewManager: global.HoverPreviewManager,
      FileMenuBar: global.FileMenuBar,
      LevelEditorPanels: global.LevelEditorPanels,
      cameraManager: global.cameraManager,
      TILE_SIZE: global.TILE_SIZE,
      logNormal: global.logNormal,
      logDebug: global.logDebug,
      logWarning: global.logWarning,
      logError: global.logError,
      logVerbose: global.logVerbose
    });
  }
  
  // Make p5.js functions globally available (for bare function calls in source code)
  if (typeof globalThis !== 'undefined') {
    globalThis.push = global.push;
    globalThis.pop = global.pop;
    globalThis.fill = global.fill;
    globalThis.rect = global.rect;
    globalThis.text = global.text;
    globalThis.textSize = global.textSize;
    globalThis.textAlign = global.textAlign;
    globalThis.stroke = global.stroke;
    globalThis.strokeWeight = global.strokeWeight;
    globalThis.noStroke = global.noStroke;
    globalThis.translate = global.translate;
    globalThis.line = global.line;
    globalThis.noFill = global.noFill;
    globalThis.image = global.image;
    globalThis.tint = global.tint;
  }
}

/**
 * Cleanup all mocks after test
 * Call this in afterEach() of UI tests
 */
function cleanupUITestEnvironment() {
  sinon.restore();
  
  // Clean up global.window if it was created
  if (global.window) {
    delete global.window;
  }
}

module.exports = {
  setupUITestEnvironment,
  cleanupUITestEnvironment
};
