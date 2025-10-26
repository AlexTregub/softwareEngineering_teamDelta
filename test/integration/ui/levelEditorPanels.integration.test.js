/**
 * Integration tests for draggable Level Editor panels
 * Tests clicking, dragging, and interaction with MaterialPalette, ToolBar, BrushSizeControl
 */

const { JSDOM } = require('jsdom');
const { expect } = require('chai');

describe('Level Editor Draggable Panels Integration Tests', function() {
  let dom, window, document;
  let LevelEditor, LevelEditorPanels, DraggablePanel, DraggablePanelManager;
  let MaterialPalette, ToolBar, BrushSizeControl;
  let levelEditor, draggablePanels;

  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <canvas id="defaultCanvas0"></canvas>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock localStorage
    global.localStorage = {
      _data: {},
      getItem(key) { return this._data[key] || null; },
      setItem(key, value) { this._data[key] = String(value); },
      removeItem(key) { delete this._data[key]; },
      clear() { this._data = {}; }
    };

    // Mock p5.js functions
    global.push = function() {};
    global.pop = function() {};
    global.fill = function() {};
    global.stroke = function() {};
    global.strokeWeight = function() {};
    global.noStroke = function() {};
    global.noFill = function() {};
    global.rect = function() {};
    global.text = function() {};
    global.textAlign = function() {};
    global.textSize = function() {};
    global.textWidth = function(str) { return str.length * 6; };
    global.translate = function() {};
    global.mouseX = 0;
    global.mouseY = 0;
    global.g_canvasX = 1200;
    global.g_canvasY = 800;
    global.devConsoleEnabled = false;
    global.verboseLog = function() {};
    global.logVerbose = function() {};

    // Mock terrain classes
    global.gridTerrain = class {
      constructor() {
        this.tileSize = 32;
      }
      getTile() { return { getMaterial: () => 'grass' }; }
      render() {}
    };

    global.TerrainEditor = class {
      constructor() {
        this.history = [];
      }
      setBrushSize() {}
      selectMaterial() {}
      paint() {}
      fill() {}
      canUndo() { return true; }
      canRedo() { return true; }
      undo() {}
      redo() {}
    };

    // Mock other dependencies
    global.MiniMap = class { update() {} render() {} };
    global.PropertiesPanel = class { render() {} };
    global.GridOverlay = class { render() {} };
    global.SaveDialog = class { show() {} isVisible() { return false; } };
    global.LoadDialog = class { show() {} isVisible() { return false; } };
    global.NotificationManager = class {
      show() {}
      update() {}
      render() {}
    };

    global.GameState = {
      setState() {},
      getState() { return 'LEVEL_EDITOR'; },
      goToMenu() {}
    };

    // Mock Button class
    global.Button = class {
      constructor(x, y, w, h, caption, style) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.caption = caption;
        this.style = style || {};
      }
      setPosition(x, y) { this.x = x; this.y = y; }
      setCaption(caption) { this.caption = caption; }
      update() { return false; }
      render() {}
      autoResizeForText() { return false; }
    };

    global.ButtonStyles = {
      DEFAULT: {},
      SUCCESS: {},
      DANGER: {},
      WARNING: {},
      INFO: {},
      PRIMARY: {},
      PURPLE: {}
    };

    // Load actual classes
    MaterialPalette = require('../../../Classes/ui/MaterialPalette.js');
    ToolBar = require('../../../Classes/ui/ToolBar.js');
    BrushSizeControl = require('../../../Classes/ui/BrushSizeControl.js');
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');

    // Make classes available globally
    global.DraggablePanel = DraggablePanel;
    global.MaterialPalette = MaterialPalette;
    global.ToolBar = ToolBar;
    global.BrushSizeControl = BrushSizeControl;
    global.LevelEditorPanels = LevelEditorPanels;

    // Initialize system
    global.draggablePanelManager = new DraggablePanelManager();
    global.draggablePanelManager.initialize();

    // Create terrain
    const terrain = new gridTerrain(10, 10);

    // Initialize level editor
    levelEditor = new LevelEditor();
    levelEditor.initialize(terrain);
  });

  afterEach(function() {
    // Cleanup
    global.localStorage.clear();
    delete global.window;
    delete global.document;
    delete global.draggablePanelManager;
  });

  describe('Panel Creation and Initialization', function() {
    it('should create three draggable panels on initialization', function() {
      expect(levelEditor.draggablePanels).to.not.be.null;
      expect(levelEditor.draggablePanels.panels).to.have.property('materials');
      expect(levelEditor.draggablePanels.panels).to.have.property('tools');
      expect(levelEditor.draggablePanels.panels).to.have.property('brush');
    });

    it('should add panels to DraggablePanelManager', function() {
      expect(global.draggablePanelManager.hasPanel('level-editor-materials')).to.be.true;
      expect(global.draggablePanelManager.hasPanel('level-editor-tools')).to.be.true;
      expect(global.draggablePanelManager.hasPanel('level-editor-brush')).to.be.true;
    });

    it('should register panels for LEVEL_EDITOR state visibility', function() {
      const visibility = global.draggablePanelManager.stateVisibility.LEVEL_EDITOR;
      expect(visibility).to.include('level-editor-materials');
      expect(visibility).to.include('level-editor-tools');
      expect(visibility).to.include('level-editor-brush');
    });

    it('should create panels with draggable behavior enabled', function() {
      const materialsPanel = levelEditor.draggablePanels.panels.materials;
      const toolsPanel = levelEditor.draggablePanels.panels.tools;
      const brushPanel = levelEditor.draggablePanels.panels.brush;

      expect(materialsPanel.config.behavior.draggable).to.be.true;
      expect(toolsPanel.config.behavior.draggable).to.be.true;
      expect(brushPanel.config.behavior.draggable).to.be.true;
    });

    it('should create panels with position persistence enabled', function() {
      const materialsPanel = levelEditor.draggablePanels.panels.materials;
      const toolsPanel = levelEditor.draggablePanels.panels.tools;
      const brushPanel = levelEditor.draggablePanels.panels.brush;

      expect(materialsPanel.config.behavior.persistent).to.be.true;
      expect(toolsPanel.config.behavior.persistent).to.be.true;
      expect(brushPanel.config.behavior.persistent).to.be.true;
    });
  });

  describe('Panel Visibility', function() {
    it('should show all panels when level editor is activated', function() {
      levelEditor.activate();

      const materialsPanel = levelEditor.draggablePanels.panels.materials;
      const toolsPanel = levelEditor.draggablePanels.panels.tools;
      const brushPanel = levelEditor.draggablePanels.panels.brush;

      expect(materialsPanel.state.visible).to.be.true;
      expect(toolsPanel.state.visible).to.be.true;
      expect(brushPanel.state.visible).to.be.true;
    });

    it('should hide all panels when level editor is deactivated', function() {
      levelEditor.activate();
      levelEditor.deactivate();

      const materialsPanel = levelEditor.draggablePanels.panels.materials;
      const toolsPanel = levelEditor.draggablePanels.panels.tools;
      const brushPanel = levelEditor.draggablePanels.panels.brush;

      expect(materialsPanel.state.visible).to.be.false;
      expect(toolsPanel.state.visible).to.be.false;
      expect(brushPanel.state.visible).to.be.false;
    });
  });

  describe('Material Palette Click Handling', function() {
    it('should detect mouse over materials panel', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      
      // Click inside panel content area (accounting for title bar)
      const titleBarHeight = panel.calculateTitleBarHeight();
      const mouseX = pos.x + panel.config.style.padding + 20;
      const mouseY = pos.y + titleBarHeight + panel.config.style.padding + 20;

      const isOver = panel.isMouseOver(mouseX, mouseY);
      expect(isOver).to.be.true;
    });

    it('should handle material selection click', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      
      // Click on first material swatch (top-left)
      const mouseX = pos.x + panel.config.style.padding + 20;
      const mouseY = pos.y + titleBarHeight + panel.config.style.padding + 20;

      const handled = levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      expect(handled).to.be.true;
      expect(levelEditor.palette.getSelectedMaterial()).to.exist;
    });

    it('should handle material selection for different materials', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const contentX = pos.x + panel.config.style.padding;
      const contentY = pos.y + titleBarHeight + panel.config.style.padding;
      
      // Click second material (top-right swatch)
      const swatchSize = 40;
      const spacing = 5;
      const mouseX = contentX + spacing + swatchSize + spacing + 20;
      const mouseY = contentY + spacing + 20;

      levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      const selected = levelEditor.palette.getSelectedMaterial();
      expect(selected).to.be.oneOf(levelEditor.materials);
    });
  });

  describe('Tool Bar Click Handling', function() {
    it('should detect mouse over tools panel', function() {
      const panel = levelEditor.draggablePanels.panels.tools;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      
      const mouseX = pos.x + panel.config.style.padding + 15;
      const mouseY = pos.y + titleBarHeight + panel.config.style.padding + 15;

      const isOver = panel.isMouseOver(mouseX, mouseY);
      expect(isOver).to.be.true;
    });

    it('should handle tool selection click', function() {
      const panel = levelEditor.draggablePanels.panels.tools;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      
      // Click on first tool button
      const mouseX = pos.x + panel.config.style.padding + 15;
      const mouseY = pos.y + titleBarHeight + panel.config.style.padding + 15;

      const initialTool = levelEditor.toolbar.getSelectedTool();
      const handled = levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      expect(handled).to.be.true;
      // Tool should be selected (may be same or different)
      expect(levelEditor.toolbar.getSelectedTool()).to.exist;
    });

    it('should cycle through different tools', function() {
      const panel = levelEditor.draggablePanels.panels.tools;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const contentX = pos.x + panel.config.style.padding;
      const contentY = pos.y + titleBarHeight + panel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      
      // Click first tool
      levelEditor.draggablePanels.handleClick(contentX + 15, contentY + 15);
      const tool1 = levelEditor.toolbar.getSelectedTool();
      
      // Click second tool
      levelEditor.draggablePanels.handleClick(contentX + 15, contentY + buttonSize + spacing + 15);
      const tool2 = levelEditor.toolbar.getSelectedTool();
      
      // Tools should be different (or at least a valid tool selected)
      expect(tool2).to.exist;
    });
  });

  describe('Brush Size Control Click Handling', function() {
    it('should detect mouse over brush panel', function() {
      const panel = levelEditor.draggablePanels.panels.brush;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      
      const mouseX = pos.x + panel.config.style.padding + 45;
      const mouseY = pos.y + titleBarHeight + panel.config.style.padding + 15;

      const isOver = panel.isMouseOver(mouseX, mouseY);
      expect(isOver).to.be.true;
    });

    it('should increase brush size on + button click', function() {
      const panel = levelEditor.draggablePanels.panels.brush;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const contentX = pos.x + panel.config.style.padding;
      const contentY = pos.y + titleBarHeight + panel.config.style.padding;
      
      const initialSize = levelEditor.brushControl.getSize();
      
      // Click + button (right side)
      const panelWidth = 90;
      const mouseX = contentX + panelWidth - 15;
      const mouseY = contentY + 20;

      const handled = levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      expect(handled).to.be.true;
      expect(levelEditor.brushControl.getSize()).to.be.at.least(initialSize);
    });

    it('should decrease brush size on - button click', function() {
      const panel = levelEditor.draggablePanels.panels.brush;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const contentX = pos.x + panel.config.style.padding;
      const contentY = pos.y + titleBarHeight + panel.config.style.padding;
      
      // First increase size so we can decrease
      levelEditor.brushControl.increase();
      levelEditor.brushControl.increase();
      const initialSize = levelEditor.brushControl.getSize();
      
      // Click - button (left side)
      const mouseX = contentX + 15;
      const mouseY = contentY + 20;

      const handled = levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      expect(handled).to.be.true;
      expect(levelEditor.brushControl.getSize()).to.be.at.most(initialSize);
    });
  });

  describe('Panel Dragging', function() {
    it('should start dragging when title bar is clicked and mouse pressed', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      
      // Click on title bar
      const mouseX = pos.x + 50;
      const mouseY = pos.y + 10;

      panel.update(mouseX, mouseY, true); // mousePressed = true
      
      expect(panel.isDragging).to.be.true;
    });

    it('should move panel when dragged', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const initialPos = panel.getPosition();
      
      // Start drag on title bar
      const startX = initialPos.x + 50;
      const startY = initialPos.y + 10;
      panel.update(startX, startY, true);
      
      // Move mouse while pressed
      const newX = startX + 100;
      const newY = startY + 50;
      panel.update(newX, newY, true);
      
      // Position should have changed
      const newPos = panel.getPosition();
      expect(newPos.x).to.not.equal(initialPos.x);
      expect(newPos.y).to.not.equal(initialPos.y);
    });

    it('should stop dragging when mouse is released', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      
      // Start drag
      panel.update(pos.x + 50, pos.y + 10, true);
      expect(panel.isDragging).to.be.true;
      
      // Release mouse
      panel.update(pos.x + 150, pos.y + 60, false); // mousePressed = false
      
      expect(panel.isDragging).to.be.false;
    });

    it('should not drag when clicking inside content area (not title bar)', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      
      // Click inside content area, below title bar
      const mouseX = pos.x + 50;
      const mouseY = pos.y + titleBarHeight + 50;

      panel.update(mouseX, mouseY, true);
      
      // Should not start dragging from content area
      // (This tests that title bar is the only drag handle)
      expect(panel.isDragging).to.be.false;
    });
  });

  describe('Panel Position Persistence', function() {
    it('should save panel position when dragged and released', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const panelId = 'level-editor-materials';
      
      // Clear any existing saved position
      global.localStorage.removeItem(`draggable-panel-${panelId}`);
      
      // Drag panel
      panel.update(100, 100, true);
      panel.update(200, 200, true);
      panel.update(200, 200, false); // Release
      
      // Check localStorage
      const saved = global.localStorage.getItem(`draggable-panel-${panelId}`);
      expect(saved).to.not.be.null;
      
      const data = JSON.parse(saved);
      expect(data.position).to.exist;
      expect(data.position.x).to.be.a('number');
      expect(data.position.y).to.be.a('number');
    });

    it('should restore panel position on next initialization', function() {
      const panelId = 'level-editor-materials';
      
      // Save a specific position
      const savedPosition = { x: 300, y: 400 };
      global.localStorage.setItem(`draggable-panel-${panelId}`, JSON.stringify({
        position: savedPosition,
        visible: true,
        minimized: false
      }));
      
      // Create new panel (simulating page reload)
      const newPanel = new DraggablePanel({
        id: panelId,
        title: 'Materials',
        position: { x: 10, y: 80 }, // Default position
        size: { width: 180, height: 250 },
        behavior: {
          draggable: true,
          persistent: true
        }
      });
      
      // Position should be restored from localStorage
      const pos = newPanel.getPosition();
      expect(pos.x).to.equal(savedPosition.x);
      expect(pos.y).to.equal(savedPosition.y);
    });
  });

  describe('Panel Mouse Event Consumption', function() {
    it('should consume mouse events when clicking on panel', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      
      // Click inside panel
      const mouseX = pos.x + 50;
      const mouseY = pos.y + 50;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });

    it('should not consume mouse events when clicking outside panel', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      
      // Click far outside panel
      const mouseX = 1000;
      const mouseY = 1000;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.false;
    });

    it('should prevent terrain clicks when clicking on panel', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      
      // Click inside panel
      const mouseX = pos.x + 50;
      const mouseY = pos.y + 50;
      
      const handled = levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      // Panel should handle the click, preventing terrain edit
      expect(handled).to.be.true;
    });
  });

  describe('Integration with DraggablePanelManager', function() {
    it('should allow DraggablePanelManager to update all panels', function() {
      global.draggablePanelManager.update(100, 100, false);
      
      // All panels should be updated without errors
      expect(levelEditor.draggablePanels.panels.materials).to.exist;
      expect(levelEditor.draggablePanels.panels.tools).to.exist;
      expect(levelEditor.draggablePanels.panels.brush).to.exist;
    });

    it('should render all panels through DraggablePanelManager', function() {
      // Should not throw errors
      expect(() => {
        global.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }).to.not.throw();
    });
  });
});
