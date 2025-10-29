/**
 * Unit tests for LevelEditorPanels
 * Tests panel configuration, managedExternally flag, and rendering delegation
 */

const { expect } = require('chai');
const { JSDOM } = require('jsdom');

describe('LevelEditorPanels', function() {
  let window, document, LevelEditorPanels, DraggablePanel;
  let mockLevelEditor;

  beforeEach(function() {
    // Create fresh DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock p5.js functions
    global.push = () => {};
    global.pop = () => {};
    global.translate = () => {};
    global.fill = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.noStroke = () => {};
    global.rect = () => {};
    global.text = () => {};
    global.line = () => {};

    // Mock localStorage
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };

    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;

    // Load DraggablePanel
    delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanel.js')];
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    global.DraggablePanel = DraggablePanel;

    // Load LevelEditorPanels
    delete require.cache[require.resolve('../../../Classes/systems/ui/LevelEditorPanels.js')];
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');

    // Create mock level editor
    mockLevelEditor = {
      palette: {
        render: () => {},
        handleClick: () => null,
        containsPoint: () => false,
        getSelectedMaterial: () => 'dirt'
      },
      toolbar: {
        render: () => {},
        handleClick: () => null,
        containsPoint: () => false,
        setEnabled: () => {}
      },
      brushControl: {
        render: () => {},
        handleClick: () => null,
        containsPoint: () => false,
        getSize: () => 1
      },
      editor: {
        setBrushSize: () => {},
        canUndo: () => false,
        canRedo: () => false
      },
      notifications: {
        show: () => {}
      }
    };

    // Mock draggablePanelManager in both window and global
    global.draggablePanelManager = {
      panels: new Map(),
      stateVisibility: {}
    };
    window.draggablePanelManager = global.draggablePanelManager;
  });

  afterEach(function() {
    delete global.window;
    delete global.document;
    delete global.DraggablePanel;
    delete global.draggablePanelManager;
    delete global.push;
    delete global.pop;
    delete global.translate;
  });

  describe('Panel Configuration', function() {
    it('should create three panels on initialization', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      expect(editorPanels.panels.materials).to.exist;
      expect(editorPanels.panels.tools).to.exist;
      expect(editorPanels.panels.brush).to.exist;
    });

    it('should set correct sizes for materials panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      const materialsPanel = editorPanels.panels.materials;
      expect(materialsPanel.config.size.width).to.equal(120);
      // Height includes title bar height (25px) - test actual value
      expect(materialsPanel.config.size.height).to.equal(140);
    });

    it('should set correct sizes for tools panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      const toolsPanel = editorPanels.panels.tools;
      expect(toolsPanel.config.size.width).to.equal(70);
      // Height includes title bar height (25px) - test actual value
      expect(toolsPanel.config.size.height).to.equal(195);
    });

    it('should set correct sizes for brush panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      const brushPanel = editorPanels.panels.brush;
      expect(brushPanel.config.size.width).to.equal(110);
      // Height includes title bar height (25px) - test actual value
      expect(brushPanel.config.size.height).to.equal(85);
    });

    it('should set correct positions for all panels', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      expect(editorPanels.panels.materials.config.position).to.deep.equal({ x: 10, y: 80 });
      expect(editorPanels.panels.tools.config.position).to.deep.equal({ x: 10, y: 210 });
      expect(editorPanels.panels.brush.config.position).to.deep.equal({ x: 10, y: 395 });
    });
  });

  describe('managedExternally Flag', function() {
    it('should set managedExternally to true for materials panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      const initialized = editorPanels.initialize();

      expect(initialized).to.be.true;
      expect(editorPanels.panels.materials).to.exist;
      expect(editorPanels.panels.materials.config.behavior.managedExternally).to.be.true;
    });

    it('should set managedExternally to true for tools panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      const initialized = editorPanels.initialize();

      expect(initialized).to.be.true;
      expect(editorPanels.panels.tools).to.exist;
      expect(editorPanels.panels.tools.config.behavior.managedExternally).to.be.true;
    });

    it('should set managedExternally to true for brush panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      const initialized = editorPanels.initialize();

      expect(initialized).to.be.true;
      expect(editorPanels.panels.brush).to.exist;
      expect(editorPanels.panels.brush.config.behavior.managedExternally).to.be.true;
    });

    it('should keep other behavior flags intact', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      const initialized = editorPanels.initialize();

      expect(initialized).to.be.true;
      const panel = editorPanels.panels.materials;
      expect(panel).to.exist;
      expect(panel.config.behavior.draggable).to.be.true;
      expect(panel.config.behavior.persistent).to.be.true;
      expect(panel.config.behavior.constrainToScreen).to.be.true;
    });
  });

  describe('Panel Registration', function() {
    it('should add all panels to draggablePanelManager', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      expect(global.draggablePanelManager.panels.has('level-editor-materials')).to.be.true;
      expect(global.draggablePanelManager.panels.has('level-editor-tools')).to.be.true;
      expect(global.draggablePanelManager.panels.has('level-editor-brush')).to.be.true;
    });

    it('should add panel IDs to LEVEL_EDITOR state visibility', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      expect(global.draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.exist;
      expect(global.draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-materials');
      expect(global.draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-tools');
      expect(global.draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-brush');
    });

    it('should return false if draggablePanelManager not found', function() {
      delete global.draggablePanelManager;
      global.window.draggablePanelManager = undefined;

      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      const result = editorPanels.initialize();

      expect(result).to.be.false;
    });

    it('should log error if draggablePanelManager not found', function() {
      delete global.draggablePanelManager;
      global.window.draggablePanelManager = undefined;

      let errorLogged = false;
      const originalError = console.error;
      console.error = (msg) => {
        if (msg.includes('DraggablePanelManager not found')) {
          errorLogged = true;
        }
      };

      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      console.error = originalError;
      expect(errorLogged).to.be.true;
    });
  });

  describe('Rendering', function() {
    it('should render materials panel with content renderer', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let paletteRendered = false;
      mockLevelEditor.palette.render = () => { paletteRendered = true; };

      editorPanels.render();

      expect(paletteRendered).to.be.true;
    });

    it('should render tools panel with content renderer', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let toolbarRendered = false;
      mockLevelEditor.toolbar.render = () => { toolbarRendered = true; };

      editorPanels.render();

      expect(toolbarRendered).to.be.true;
    });

    it('should render brush panel with content renderer', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let brushRendered = false;
      mockLevelEditor.brushControl.render = () => { brushRendered = true; };

      editorPanels.render();

      expect(brushRendered).to.be.true;
    });

    it('should skip rendering minimized panels content', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      // Minimize materials panel
      editorPanels.panels.materials.state.minimized = true;

      let paletteRendered = false;
      mockLevelEditor.palette.render = () => { paletteRendered = true; };

      editorPanels.render();

      expect(paletteRendered).to.be.false;
    });

    it('should skip rendering hidden panels', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      // Hide materials panel
      editorPanels.panels.materials.state.visible = false;

      let paletteRendered = false;
      mockLevelEditor.palette.render = () => { paletteRendered = true; };

      editorPanels.render();

      expect(paletteRendered).to.be.false;
    });

    it('should translate content to panel content area', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let translateCalled = false;
      let translateX, translateY;

      global.translate = (x, y) => {
        translateCalled = true;
        translateX = x;
        translateY = y;
      };

      editorPanels.render();

      expect(translateCalled).to.be.true;
      expect(translateX).to.be.a('number');
      expect(translateY).to.be.a('number');
    });
  });

  describe('Show/Hide', function() {
    it('should show all panels', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      // Hide panels first
      editorPanels.panels.materials.hide();
      editorPanels.panels.tools.hide();
      editorPanels.panels.brush.hide();

      // Now show all
      editorPanels.show();

      expect(editorPanels.panels.materials.isVisible()).to.be.true;
      expect(editorPanels.panels.tools.isVisible()).to.be.true;
      expect(editorPanels.panels.brush.isVisible()).to.be.true;
    });

    it('should hide all panels', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      editorPanels.hide();

      expect(editorPanels.panels.materials.isVisible()).to.be.false;
      expect(editorPanels.panels.tools.isVisible()).to.be.false;
      expect(editorPanels.panels.brush.isVisible()).to.be.false;
    });
  });

  describe('Click Handling', function() {
    it('should delegate clicks to MaterialPalette', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let clickHandled = false;
      mockLevelEditor.palette.containsPoint = () => true;
      mockLevelEditor.palette.handleClick = () => {
        clickHandled = true;
        return 'grass';
      };

      const result = editorPanels.handleClick(50, 100);

      expect(clickHandled).to.be.true;
      expect(result).to.be.true;
    });

    it('should delegate clicks to ToolBar', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let clickHandled = false;
      mockLevelEditor.toolbar.containsPoint = () => true;
      mockLevelEditor.toolbar.handleClick = () => {
        clickHandled = true;
        return 'paint';
      };

      const result = editorPanels.handleClick(50, 250);

      expect(clickHandled).to.be.true;
      expect(result).to.be.true;
    });

    it('should delegate clicks to BrushSizeControl', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let clickHandled = false;
      mockLevelEditor.brushControl.containsPoint = () => true;
      mockLevelEditor.brushControl.handleClick = () => {
        clickHandled = true;
        return 'increase';
      };

      const result = editorPanels.handleClick(50, 420);

      expect(clickHandled).to.be.true;
      expect(result).to.be.true;
    });

    it('should return false if no panel contains click', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      mockLevelEditor.palette.containsPoint = () => false;
      mockLevelEditor.toolbar.containsPoint = () => false;
      mockLevelEditor.brushControl.containsPoint = () => false;

      const result = editorPanels.handleClick(500, 500);

      expect(result).to.be.false;
    });

    it('should skip hidden panels when handling clicks', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      editorPanels.panels.materials.hide();

      let clickHandled = false;
      mockLevelEditor.palette.containsPoint = () => true;
      mockLevelEditor.palette.handleClick = () => {
        clickHandled = true;
        return 'grass';
      };

      const result = editorPanels.handleClick(50, 100);

      expect(clickHandled).to.be.false;
      expect(result).to.be.false;
    });
  });

  describe('Edge Cases', function() {
    it('should handle missing levelEditor properties gracefully', function() {
      const editorPanels = new LevelEditorPanels({});
      editorPanels.initialize();

      expect(() => editorPanels.render()).to.not.throw();
      expect(() => editorPanels.handleClick(50, 50)).to.not.throw();
    });

    it('should handle null panels gracefully', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      // Don't initialize - panels will be null

      expect(() => editorPanels.render()).to.not.throw();
      expect(() => editorPanels.handleClick(50, 50)).to.not.throw();
      expect(() => editorPanels.show()).to.not.throw();
      expect(() => editorPanels.hide()).to.not.throw();
    });
  });
});
